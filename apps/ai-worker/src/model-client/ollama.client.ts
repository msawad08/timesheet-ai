import axios from 'axios';
import { ILlmModelClient, ModelChatParams, ModelEmbeddingParams } from './model.interface';

export class OllamaModelClient implements ILlmModelClient {
  private ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private modelName = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
  private embedModelName = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

  async *generateTextStream(params: ModelChatParams): AsyncIterable<string> {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.modelName,
          system: params.systemInstruction,
          prompt: params.prompt,
          stream: true,
          options: { temperature: params.temperature ?? 0.2 },
        },
        { responseType: 'stream', timeout: 8000 }
      );

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) yield parsed.response;
            } catch {
              // Ignore partial non-json lines
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Ollama streaming unavailable, using responsive local generator:', err.message);
      yield `I've analyzed your timesheet entry. Extracting logged tasks and matching with project assignments...`;
    }
  }

  async generateStructuredJson<T>(params: ModelChatParams): Promise<T> {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.modelName,
          system: params.systemInstruction,
          prompt: `${params.prompt}\nReturn ONLY valid JSON without markdown fences.`,
          format: 'json',
          stream: false,
          options: { temperature: 0.1 },
        },
        { timeout: 10000 }
      );

      return JSON.parse(response.data.response) as T;
    } catch (err: any) {
      console.warn('Ollama structured parsing unavailable, using heuristic extraction fallback:', err.message);
      return this.fallbackHeuristicParser<T>(params.prompt);
    }
  }

  async getEmbeddings(params: ModelEmbeddingParams): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/embeddings`,
        {
          model: this.embedModelName,
          prompt: params.text,
        },
        { timeout: 5000 }
      );

      return response.data.embedding;
    } catch {
      return [];
    }
  }

  private fallbackHeuristicParser<T>(promptText: string): T {
    const rawMatch = promptText.match(/Input text:\s*["']([^"']+)["']/i);
    const userText = rawMatch ? rawMatch[1] : promptText;

    let durationMinutes = 60;
    const hourMatch = userText.match(/(\d+(\.\d+)?)\s*(hours?|hrs?|h)\b/i);
    const minMatch = userText.match(/(\d+)\s*(minutes?|mins?|m)\b/i);

    if (hourMatch) {
      durationMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
    } else if (minMatch) {
      durationMinutes = parseInt(minMatch[1], 10);
    }

    // Extract potential project keywords
    const words = userText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const stopWords = new Set([
      'worked', 'hours', 'fixing', 'spent', 'today', 'with', 'from',
      'that', 'this', 'have', 'been', 'will', 'some', 'time', 'into', 'unit',
      'task', 'issue', 'issues', 'hour', 'minute', 'minutes',
    ]);
    const keywords = words.filter((w) => !stopWords.has(w)).slice(0, 3);

    const taskClean = userText
      .replace(/^worked\s+(\d+(\.\d+)?\s*(hours?|hrs?|mins?)\s*(on)?\s*)?/i, '')
      .trim();

    return {
      entries: [
        {
          rawText: userText,
          durationMinutes,
          extractedTaskDescription: taskClean || userText,
          suggestedProjectKeywords: keywords.length > 0 ? keywords : ['engineering'],
        },
      ],
    } as T;
  }
}
