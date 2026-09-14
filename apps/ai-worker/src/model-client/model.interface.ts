export interface ModelChatParams {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
}

export interface ModelEmbeddingParams {
  text: string;
}

export interface ILlmModelClient {
  generateTextStream(params: ModelChatParams): AsyncIterable<string>;
  generateStructuredJson<T>(params: ModelChatParams & { schemaJson?: object }): Promise<T>;
  getEmbeddings(params: ModelEmbeddingParams): Promise<number[]>;
}
