import { IngestionService } from '../../src/services/ingestion';
import fs from 'fs/promises';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

// Mock external dependencies
jest.mock('langchain/vectorstores/memory');

jest.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  })),
}));

jest.mock('fs/promises');

describe('IngestionService', () => {
  let ingestionService: IngestionService;
  let mockVectorStore: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock MemoryVectorStore
    mockVectorStore = {
      similaritySearchWithScore: jest.fn().mockResolvedValue([]),
    };

    (MemoryVectorStore.fromDocuments as jest.Mock) = jest.fn().mockResolvedValue(mockVectorStore);

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

    it('should create vector store', async () => {
      await ingestionService.ingestDocuments(false);

      expect(MemoryVectorStore.fromDocuments).toHaveBeenCalled();
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
    it('should handle vector store creation errors', async () => {
      (MemoryVectorStore.fromDocuments as jest.Mock).mockRejectedValue(new Error('Vector store error'));

      await expect(ingestionService.ingestDocuments(false)).rejects.toThrow('Failed to ingest documents');
    });
  });
});
