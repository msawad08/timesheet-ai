import axios from 'axios';
import { ILlmModelClient, ModelChatParams, ModelEmbeddingParams } from './model.interface';

export class OllamaModelClient implements ILlmModelClient {
  private ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private modelName = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
  private embedModelName = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

  async *generateTextStream(params: ModelChatParams): AsyncIterable<string> {
    const response = await axios.post(
      `${this.ollamaUrl}/api/generate`,
      {
        model: this.modelName,
        system: params.systemInstruction,
        prompt: params.prompt,
        stream: true,
        options: { temperature: params.temperature ?? 0.2 },
      },
      { responseType: 'stream' }
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
  }

  async generateStructuredJson<T>(params: ModelChatParams): Promise<T> {
    const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
      model: this.modelName,
      system: params.systemInstruction,
      prompt: `${params.prompt}\nReturn ONLY valid JSON without markdown fences.`,
      format: 'json',
      stream: false,
      options: { temperature: 0.1 },
    });

    return JSON.parse(response.data.response) as T;
  }

  async getEmbeddings(params: ModelEmbeddingParams): Promise<number[]> {
    const response = await axios.post(`${this.ollamaUrl}/api/embeddings`, {
      model: this.embedModelName,
      prompt: params.text,
    });

    return response.data.embedding;
  }
}
