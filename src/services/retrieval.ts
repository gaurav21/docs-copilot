import { config } from '../config';
import { RetrievalResult } from '../types';
import { IngestionService } from './ingestion';

export class RetrievalService {
  constructor() {}

  async retrieve(query: string, topK: number = config.rag.topK): Promise<RetrievalResult[]> {
    try {
      const vectorStore = IngestionService.getVectorStore();

      if (!vectorStore) {
        throw new Error('Vector store not initialized. Please run /ingest first.');
      }

      const results = await vectorStore.similaritySearchWithScore(query, topK);

      const retrievalResults: RetrievalResult[] = results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: {
          source: doc.metadata.source as string,
          chunkId: doc.metadata.chunkId as string,
        },
        score: score, // LangChain returns similarity score directly
      }));

      return retrievalResults;
    } catch (error) {
      throw new Error(`Failed to retrieve documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
