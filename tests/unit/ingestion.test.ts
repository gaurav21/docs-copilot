import { IngestionService } from '../../src/services/ingestion';
import fs from 'fs/promises';

// Mock external dependencies
jest.mock('chromadb', () => ({
  ChromaClient: jest.fn(),
}));

jest.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: jest.fn(),
}));

jest.mock('fs/promises');

describe('IngestionService', () => {
  let ingestionService: IngestionService;
  let mockChromaClient: any;
  let mockCollection: any;
  const { ChromaClient } = require('chromadb');
  const { OpenAIEmbeddings } = require('@langchain/openai');

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock collection
    mockCollection = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mock ChromaClient
    mockChromaClient = {
      getOrCreateCollection: jest.fn().mockResolvedValue(mockCollection),
      createCollection: jest.fn().mockResolvedValue(mockCollection),
      deleteCollection: jest.fn().mockResolvedValue(undefined),
    };

    ChromaClient.mockImplementation(() => mockChromaClient);

    // Setup mock OpenAIEmbeddings
    const mockEmbedQuery = jest.fn().mockResolvedValue(Array(384).fill(0.1));
    OpenAIEmbeddings.mockImplementation(() => ({
      embedQuery: mockEmbedQuery,
    }));

    // Setup mock fs
    (fs.readdir as jest.Mock).mockResolvedValue(['test_doc.md']);
    (fs.readFile as jest.Mock).mockResolvedValue('# Test\n\nThis is a test document.');

    ingestionService = new IngestionService();
  });

  describe('ingestDocuments', () => {
    it('should successfully ingest documents', async () => {
      const result = await ingestionService.ingestDocuments(false);

      expect(result).toBeDefined();
      expect(result.documentsProcessed).toBeGreaterThan(0);
      expect(result.chunksCreated).toBeGreaterThan(0);
    });

    it('should process markdown files only', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        'test.md',
        'other.txt',
        'readme.md',
      ]);

      await ingestionService.ingestDocuments(false);

      // Should only read .md files
      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test.md'),
        'utf-8'
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('readme.md'),
        'utf-8'
      );
    });

    it('should delete existing collection when reset is true', async () => {
      await ingestionService.ingestDocuments(true);

      expect(mockChromaClient.deleteCollection).toHaveBeenCalledWith({
        name: 'docs_collection',
      });
    });

    it('should not delete collection when reset is false', async () => {
      await ingestionService.ingestDocuments(false);

      expect(mockChromaClient.deleteCollection).not.toHaveBeenCalled();
    });

    it('should add documents to collection', async () => {
      await ingestionService.ingestDocuments(false);

      expect(mockCollection.add).toHaveBeenCalled();
      const addCall = mockCollection.add.mock.calls[0][0];
      expect(addCall).toHaveProperty('ids');
      expect(addCall).toHaveProperty('embeddings');
      expect(addCall).toHaveProperty('documents');
      expect(addCall).toHaveProperty('metadatas');
    });

    it('should include source metadata', async () => {
      await ingestionService.ingestDocuments(false);

      const addCall = mockCollection.add.mock.calls[0][0];
      expect(addCall.metadatas[0]).toHaveProperty('source');
      expect(addCall.metadatas[0]).toHaveProperty('chunkId');
    });

    it('should handle errors gracefully', async () => {
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('File system error'));

      await expect(ingestionService.ingestDocuments(false)).rejects.toThrow(
        'Failed to ingest documents'
      );
    });

    it('should return correct document count', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        'doc1.md',
        'doc2.md',
        'doc3.md',
      ]);

      const result = await ingestionService.ingestDocuments(false);

      expect(result.documentsProcessed).toBe(3);
    });

    it('should chunk large documents', async () => {
      const largeDoc = 'Test paragraph.\n'.repeat(100);
      (fs.readFile as jest.Mock).mockResolvedValue(largeDoc);

      const result = await ingestionService.ingestDocuments(false);

      expect(result.chunksCreated).toBeGreaterThan(1);
    });
  });

  describe('error handling', () => {
    it('should handle ChromaDB errors', async () => {
      // Setup failing ChromaDB mock
      const failingChromaClient = {
        getOrCreateCollection: jest.fn().mockRejectedValue(new Error('ChromaDB error')),
        createCollection: jest.fn().mockRejectedValue(new Error('ChromaDB error')),
        deleteCollection: jest.fn().mockResolvedValue(undefined),
      };

      ChromaClient.mockImplementationOnce(() => failingChromaClient);

      const failingService = new IngestionService();

      await expect(failingService.ingestDocuments(false)).rejects.toThrow('Failed to ingest documents');
    });

    it('should handle embedding errors', async () => {
      const mockEmbedQuery = jest.fn().mockRejectedValue(new Error('Embedding error'));
      OpenAIEmbeddings.mockImplementationOnce(() => ({
        embedQuery: mockEmbedQuery,
      }));

      const failingService = new IngestionService();

      await expect(failingService.ingestDocuments(false)).rejects.toThrow('Failed to ingest documents');
    });
  });
});
