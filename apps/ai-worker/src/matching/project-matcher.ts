import { PrismaClient } from '@prisma/client';

export interface ProjectMatchSuggestion {
  id: string;
  name: string;
  matchConfidence: number;
}

export interface ProjectMatchResult {
  status: 'SUCCESS' | 'AMBIGUOUS' | 'NOT_FOUND';
  matchedId?: string;
  suggestions: ProjectMatchSuggestion[];
}

export async function matchProject(
  prisma: PrismaClient,
  userId: string,
  userProjectIds: string[],
  keywords: string[],
  embedding?: number[]
): Promise<ProjectMatchResult> {
  // 1. Fetch user's assigned active projects (or all active projects if none specified)
  const projects = await prisma.project.findMany({
    where: {
      ...(userProjectIds && userProjectIds.length > 0 ? { id: { in: userProjectIds } } : {}),
      isActive: true,
    },
  });

  if (projects.length === 0) {
    return { status: 'NOT_FOUND', suggestions: [] };
  }

  const suggestions: ProjectMatchSuggestion[] = [];

  // 2. Lexical Keyword Matching (Fuzzy string token matching)
  for (const proj of projects) {
    let score = 0;
    const nameLower = proj.name.toLowerCase();
    const descLower = (proj.description || '').toLowerCase();

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase().trim();
      if (!kwLower) continue;

      if (nameLower.includes(kwLower)) {
        score += 0.5; // Direct name match boost
      } else if (descLower.includes(kwLower)) {
        score += 0.25; // Description match boost
      }
    }

    if (score > 0) {
      suggestions.push({
        id: proj.id,
        name: proj.name,
        matchConfidence: Math.min(score, 0.95),
      });
    }
  }

  // 3. Query Vector Proximity Match if embeddings are provided
  if (embedding && embedding.length > 0) {
    try {
      const vectorHits: any[] = await prisma.$queryRaw`
        SELECT "projectId", (1 - (embedding <=> ${embedding}::vector)) as cosine_sim
        FROM "TimeEntry"
        WHERE "userId" = ${userId}
          AND embedding IS NOT NULL
        ORDER BY cosine_sim DESC
        LIMIT 5;
      `;

      for (const hit of vectorHits) {
        const existing = suggestions.find((s) => s.id === hit.projectId);
        if (existing) {
          existing.matchConfidence = Math.min(
            existing.matchConfidence + (hit.cosine_sim * 0.4),
            1.0
          );
        } else {
          const proj = projects.find((p) => p.id === hit.projectId);
          if (proj && hit.cosine_sim > 0.7) {
            suggestions.push({
              id: proj.id,
              name: proj.name,
              matchConfidence: Math.min(hit.cosine_sim * 0.6, 1.0),
            });
          }
        }
      }
    } catch (err) {
      console.warn('Vector search skipped or failed:', err);
    }
  }

  // Sort candidates descending by confidence score
  suggestions.sort((a, b) => b.matchConfidence - a.matchConfidence);

  // 4. Resolve Ambiguity
  if (suggestions.length === 1 && suggestions[0].matchConfidence >= 0.5) {
    return {
      status: 'SUCCESS',
      matchedId: suggestions[0].id,
      suggestions,
    };
  }

  if (
    suggestions.length > 1 &&
    suggestions[0].matchConfidence - suggestions[1].matchConfidence < 0.15
  ) {
    return {
      status: 'AMBIGUOUS',
      suggestions: suggestions.slice(0, 3),
    };
  }

  if (suggestions.length > 0 && suggestions[0].matchConfidence >= 0.5) {
    return {
      status: 'SUCCESS',
      matchedId: suggestions[0].id,
      suggestions,
    };
  }

  return { status: 'NOT_FOUND', suggestions: [] };
}
