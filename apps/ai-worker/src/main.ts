import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { OllamaModelClient } from './model-client/ollama.client';
import { matchProject } from './matching/project-matcher';

dotenv.config();

const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production',
});

const prisma = new PrismaClient();
const modelClient = new OllamaModelClient();

const PORT = parseInt(process.env.PORT || '3002', 10);
const GATEWAY_SESSION_URL =
  process.env.GATEWAY_SESSION_URL || 'http://localhost:3001/api/auth/validate-session';

// Register CORS
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Helper: Validate user session with API Gateway or fallback to database user
async function validateSession(token?: string) {
  if (token) {
    try {
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      const response = await axios.get(GATEWAY_SESSION_URL, {
        headers: { Authorization: `Bearer ${cleanToken}` },
        timeout: 3000,
      });
      if (response.data && response.data.valid) {
        return response.data.user;
      }
    } catch {
      // Gateway unreachable or session call failed
    }
  }

  // Development & standalone fallback: query default dev user from database
  try {
    const defaultDevUser = await prisma.user.findFirst({
      where: { email: 'dev@default.com' },
      include: {
        projectAssignments: {
          select: { projectId: true },
        },
      },
    });

    if (defaultDevUser) {
      return {
        id: defaultDevUser.id,
        email: defaultDevUser.email,
        tenantId: defaultDevUser.tenantId,
        assignedProjectIds: defaultDevUser.projectAssignments.map((pa) => pa.projectId),
      };
    }
  } catch (err: any) {
    fastify.log.warn(`Fallback user lookup: ${err.message}`);
  }

  // Standalone fallback
  if (process.env.DEV_BYPASS_AUTH === 'true' || process.env.NODE_ENV !== 'production') {
    return {
      id: 'dev-mock-user-1',
      tenantId: 'default-tenant-id',
      assignedProjectIds: [],
    };
  }

  return null;
}

// Health Check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'ai-worker', timestamp: new Date().toISOString() };
});

// Stream AI Chat via SSE
fastify.post('/api/ai/chat/stream', async (request, reply) => {
  const authHeader = request.headers.authorization;
  const user = await validateSession(authHeader);

  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid or missing session token' });
  }

  const { message } = (request.body as { message?: string }) || {};
  if (!message || typeof message !== 'string') {
    return reply.status(400).send({ error: 'Field "message" is required and must be a string' });
  }

  // Setup Server-Sent Events headers
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.flushHeaders();

  const systemInstruction = `You are an intelligent timesheet assistant.
Acknowledge the work performed in an encouraging, concise tone (1-2 sentences), explaining what entries will be logged.`;

  try {
    // 1. Stream narrative conversational text
    const textStream = await modelClient.generateTextStream({
      systemInstruction,
      prompt: message,
      temperature: 0.3,
    });

    for await (const chunk of textStream) {
      reply.raw.write(`data: ${chunk}\n\n`);
    }

    // 2. Structured parsing of tasks & durations
    const parsingPrompt = `You are a timesheet audit parser. Extract and transform the user's description into structured time logs.
For each distinct activity listed in the input message:
1. Isolate the description of what was worked on.
2. Determine duration in minutes (e.g., "4 hrs" -> 240, "30 mins" -> 30).
3. Write a professional corporate summary.
4. Extract 1-3 search keywords for the project name.

Input text: "${message}"

Format strictly as JSON with this schema:
{
  "entries": [
    {
      "rawText": "original task substring",
      "durationMinutes": 60,
      "extractedTaskDescription": "summary",
      "suggestedProjectKeywords": ["keyword1"]
    }
  ]
}`;

    const structuredResult = await modelClient.generateStructuredJson<{
      entries: Array<{
        rawText: string;
        durationMinutes: number;
        extractedTaskDescription: string;
        suggestedProjectKeywords?: string[];
      }>;
    }>({
      systemInstruction: 'You extract JSON timesheet records.',
      prompt: parsingPrompt,
    });

    const enrichedEntries: any[] = [];
    let overallStatus: 'SUCCESS' | 'AMBIGUOUS_PROJECT' | 'NO_PROJECT_FOUND' = 'SUCCESS';
    const allSuggestions: any[] = [];

    if (structuredResult && Array.isArray(structuredResult.entries)) {
      for (const entry of structuredResult.entries) {
        let embedding: number[] | undefined = undefined;
        try {
          embedding = await modelClient.getEmbeddings({
            text: entry.extractedTaskDescription,
          });
        } catch {
          // Embedding generation optional/fallback
        }

        const matchResult = await matchProject(
          prisma,
          user?.id || 'dev-mock-user-1',
          user?.assignedProjectIds || [],
          entry.suggestedProjectKeywords || [],
          embedding
        );

        if (matchResult.status === 'AMBIGUOUS') {
          overallStatus = 'AMBIGUOUS_PROJECT';
        }

        enrichedEntries.push({
          ...entry,
          matchedProjectId: matchResult.matchedId,
          suggestedProjects: matchResult.suggestions,
        });

        allSuggestions.push(...matchResult.suggestions);
      }
    }

    // Emit final parse_state event
    const parsePayload = {
      status: overallStatus,
      message: `Processed ${enrichedEntries.length} time entries.`,
      data: {
        entries: enrichedEntries,
        suggestedProjects: allSuggestions,
      },
    };

    reply.raw.write(`event: parse_state\n`);
    reply.raw.write(`data: ${JSON.stringify(parsePayload)}\n\n`);
  } catch (err: any) {
    fastify.log.error(err);
    reply.raw.write(`event: error\n`);
    reply.raw.write(`data: ${JSON.stringify({ error: err.message || 'Stream processing failed' })}\n\n`);
  } finally {
    reply.raw.end();
  }
});

// Non-streaming JSON text parsing endpoint
fastify.post('/api/ai/parse-text', async (request, reply) => {
  const authHeader = request.headers.authorization;
  const user = await validateSession(authHeader);

  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid or missing session token' });
  }

  const { text } = (request.body as { text?: string }) || {};
  if (!text) {
    return reply.status(400).send({ error: 'Field "text" is required' });
  }

  try {
    const parsingPrompt = `Extract timesheet entries from: "${text}".
Return JSON matching:
{
  "entries": [
    {
      "rawText": "original text",
      "durationMinutes": 60,
      "extractedTaskDescription": "professional description",
      "suggestedProjectKeywords": ["keyword"]
    }
  ]
}`;

    const structured = await modelClient.generateStructuredJson<{
      entries: Array<{
        rawText: string;
        durationMinutes: number;
        extractedTaskDescription: string;
        suggestedProjectKeywords?: string[];
      }>;
    }>({
      systemInstruction: 'You extract JSON timesheet records.',
      prompt: parsingPrompt,
    });

    const entries = structured.entries || [];
    const suggestions: any[] = [];

    for (const entry of entries) {
      const match = await matchProject(
        prisma,
        user?.id || 'dev-mock-user-1',
        user?.assignedProjectIds || [],
        entry.suggestedProjectKeywords || []
      );
      suggestions.push(...match.suggestions);
    }

    return reply.send({
      status: 'SUCCESS',
      message: `Parsed ${entries.length} entries.`,
      data: {
        entries,
        suggestedProjects: suggestions,
      },
    });
  } catch (err: any) {
    fastify.log.error(err);
    return reply.status(500).send({ error: err.message || 'Parsing failed' });
  }
});

// Start Server
async function start() {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`AI Ingestion Worker listening at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
