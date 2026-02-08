import { RetrievalService } from '../../src/services/retrieval';
import { IngestionService } from '../../src/services/ingestion';

// Mock the IngestionService to provide a mock vector store
jest.mock('../../src/services/ingestion');

describe('RetrievalService', () => {
  let retrievalService: RetrievalService;
  let mockVectorStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock vector store with search results
    mockVectorStore = {
      similaritySearchWithScore: jest.fn().mockResolvedValue([
        [
          { pageContent: 'Document 1 content', metadata: { source: 'doc1.md', chunkId: 'doc1_chunk_0' } },
          0.8,
        ],
        [
          { pageContent: 'Document 2 content', metadata: { source: 'doc2.md', chunkId: 'doc2_chunk_0' } },
          0.7,
        ],
        [
          { pageContent: 'Document 3 content', metadata: { source: 'doc3.md', chunkId: 'doc3_chunk_0' } },
          0.6,
        ],
      ]),
    };

    // Mock IngestionService.getVectorStore to return our mock
    (IngestionService.getVectorStore as jest.Mock) = jest.fn().mockReturnValue(mockVectorStore);

    retrievalService = new RetrievalService();
  });

  describe('retrieve', () => {
    it('should retrieve documents successfully', async () => {
      const results = await retrievalService.retrieve('test query');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return documents with correct structure', async () => {
      const results = await retrievalService.retrieve('test query');

      expect(results[0]).toHaveProperty('content');
      expect(results[0]).toHaveProperty('metadata');
      expect(results[0]).toHaveProperty('score');
      expect(results[0].metadata).toHaveProperty('source');
      expect(results[0].metadata).toHaveProperty('chunkId');
    });

    it('should return similarity scores', async () => {
      const results = await retrievalService.retrieve('test query');

      expect(results[0].score).toBe(0.8);
      expect(results[1].score).toBe(0.7);
      expect(results[2].score).toBe(0.6);
    });

    it('should respect topK parameter', async () => {
      await retrievalService.retrieve('test query', 3);

      expect(mockVectorStore.similaritySearchWithScore).toHaveBeenCalledWith('test query', 3);
    });

    it('should use default topK from config', async () => {
      await retrievalService.retrieve('test query');

      expect(mockVectorStore.similaritySearchWithScore).toHaveBeenCalledWith('test query', 5);
    });

    it('should handle empty results', async () => {
      mockVectorStore.similaritySearchWithScore.mockResolvedValue([]);

      const results = await retrievalService.retrieve('test query');

      expect(results).toEqual([]);
    });

    it('should return results sorted by relevance', async () => {
      const results = await retrievalService.retrieve('test query');

      // Scores should be in descending order (most relevant first)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should include full document content', async () => {
      const results = await retrievalService.retrieve('test query');

      expect(results[0].content).toBe('Document 1 content');
      expect(results[1].content).toBe('Document 2 content');
      expect(results[2].content).toBe('Document 3 content');
    });

    it('should include source metadata', async () => {
      const results = await retrievalService.retrieve('test query');

      expect(results[0].metadata.source).toBe('doc1.md');
      expect(results[0].metadata.chunkId).toBe('doc1_chunk_0');
    });
  });

  describe('error handling', () => {
    it('should handle vector store not initialized', async () => {
      (IngestionService.getVectorStore as jest.Mock).mockReturnValue(null);

      await expect(retrievalService.retrieve('test query')).rejects.toThrow(
        'Vector store not initialized'
      );
    });

    it('should handle search errors', async () => {
      mockVectorStore.similaritySearchWithScore.mockRejectedValue(new Error('Search error'));

      await expect(retrievalService.retrieve('test query')).rejects.toThrow(
        'Failed to retrieve documents'
      );
    });

    it('should handle malformed results', async () => {
      mockVectorStore.similaritySearchWithScore.mockResolvedValue([
        [null, 0.8],
        [{ pageContent: 'test' }, null],
      ]);

      // Should throw an error when results are malformed
      await expect(retrievalService.retrieve('test query')).rejects.toThrow(
        'Failed to retrieve documents'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty query string', async () => {
      const results = await retrievalService.retrieve('');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle very long queries', async () => {
      const longQuery = 'test '.repeat(1000);
      const results = await retrievalService.retrieve(longQuery);

      expect(results).toBeDefined();
    });

    it('should handle topK of 1', async () => {
      await retrievalService.retrieve('test query', 1);

      expect(mockVectorStore.similaritySearchWithScore).toHaveBeenCalledWith('test query', 1);
    });

    it('should handle large topK values', async () => {
      await retrievalService.retrieve('test query', 100);

      expect(mockVectorStore.similaritySearchWithScore).toHaveBeenCalledWith('test query', 100);
    });
  });
});
