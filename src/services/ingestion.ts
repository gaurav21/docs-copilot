import fs from 'fs/promises';
import path from 'path';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { config } from '../config';

// Global in-memory vector store
let globalVectorStore: MemoryVectorStore | null = null;

export class IngestionService {
  private embeddings: OpenAIEmbeddings;
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openai.apiKey,
      modelName: 'text-embedding-3-small',
    });

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async ingestDocuments(reset: boolean = false): Promise<{ documentsProcessed: number; chunksCreated: number }> {
    try {
      const docsPath = config.paths.docs;
      const files = await fs.readdir(docsPath);
      const markdownFiles = files.filter(file => file.endsWith('.md'));

      const allDocuments = [];
      let totalChunks = 0;

      for (const file of markdownFiles) {
        const filePath = path.join(docsPath, file);
        const content = await fs.readFile(filePath, 'utf-8');

        const chunks = await this.splitter.createDocuments(
          [content],
          [{ source: file }]
        );

        // Add chunkId to metadata
        chunks.forEach((chunk, i) => {
          chunk.metadata.chunkId = `${file}_chunk_${i}`;
        });

        allDocuments.push(...chunks);
        totalChunks += chunks.length;
      }

      // Create or update in-memory vector store
      globalVectorStore = await MemoryVectorStore.fromDocuments(
        allDocuments,
        this.embeddings
      );

      return {
        documentsProcessed: markdownFiles.length,
        chunksCreated: totalChunks,
      };
    } catch (error) {
      throw new Error(`Failed to ingest documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getVectorStore(): MemoryVectorStore | null {
    return globalVectorStore;
  }
}
