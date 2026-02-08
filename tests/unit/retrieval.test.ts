import { RetrievalService } from '../../src/services/retrieval';

// Mock external dependencies
jest.mock('chromadb', () => ({
  ChromaClient: jest.fn(),
}));

jest.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: jest.fn(),
}));

describe('RetrievalService', () => {
  let retrievalService: RetrievalService;
  let mockChromaClient: any;
  let mockCollection: any;
  const { ChromaClient } = require('chromadb');
  const { OpenAIEmbeddings } = require('@langchain/openai');

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock collection with query results
    mockCollection = {
      query: jest.fn().mockResolvedValue({
        ids: [['id1', 'id2', 'id3']],
        documents: [['Document 1 content', 'Document 2 content', 'Document 3 content']],
        metadatas: [
          [
            { source: 'doc1.md', chunkId: 'doc1_chunk_0' },
            { source: 'doc2.md', chunkId: 'doc2_chunk_0' },
            { source: 'doc3.md', chunkId: 'doc3_chunk_0' },
          ],
        ],
        distances: [[0.2, 0.3, 0.4]],
      }),
    };

    // Setup mock ChromaClient
    mockChromaClient = {
      getOrCreateCollection: jest.fn().mockResolvedValue(mockCollection),
    };

    ChromaClient.mockImplementation(() => mockChromaClient);

    // Setup mock OpenAIEmbeddings
    const mockEmbedQuery = jest.fn().mockResolvedValue(Array(384).fill(0.1));
    OpenAIEmbeddings.mockImplementation(() => ({
      embedQuery: mockEmbedQuery,
    }));

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

    it('should convert distances to similarity scores', async () => {
      const results = await retrievalService.retrieve('test query');

      // Distance 0.2 should convert to similarity 0.8 (1 - 0.2)
      expect(results[0].score).toBe(0.8);
      expect(results[1].score).toBe(0.7);
      expect(results[2].score).toBe(0.6);
    });

    it('should respect topK parameter', async () => {
      await retrievalService.retrieve('test query', 3);

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: expect.any(Array),
        nResults: 3,
      });
    });

    it('should use default topK from config', async () => {
      await retrievalService.retrieve('test query');

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: expect.any(Array),
        nResults: 5,
      });
    });

    it('should handle empty results', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        documents: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      const results = await retrievalService.retrieve('test query');

      expect(results).toEqual([]);
    });

    it('should handle queries with embeddings', async () => {
      const mockEmbedQuery = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      (OpenAIEmbeddings as jest.Mock).mockImplementation(() => ({
        embedQuery: mockEmbedQuery,
      }));

      retrievalService = new RetrievalService();
      await retrievalService.retrieve('test query');

      expect(mockEmbedQuery).toHaveBeenCalledWith('test query');
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
    it('should handle collection not found error', async () => {
      mockChromaClient.getOrCreateCollection.mockRejectedValue(
        new Error('Collection not found')
      );

      await expect(retrievalService.retrieve('test query')).rejects.toThrow(
        'Failed to retrieve documents'
      );
    });

    it('should handle embedding errors', async () => {
      const mockEmbedQuery = jest
        .fn()
        .mockRejectedValue(new Error('Embedding error'));
      (OpenAIEmbeddings as jest.Mock).mockImplementation(() => ({
        embedQuery: mockEmbedQuery,
      }));

      retrievalService = new RetrievalService();

      await expect(retrievalService.retrieve('test query')).rejects.toThrow();
    });

    it('should handle malformed query results', async () => {
      mockCollection.query.mockResolvedValue({
        ids: null,
        documents: null,
        metadatas: null,
        distances: null,
      });

      const results = await retrievalService.retrieve('test query');

      expect(results).toEqual([]);
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

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: expect.any(Array),
        nResults: 1,
      });
    });

    it('should handle large topK values', async () => {
      await retrievalService.retrieve('test query', 100);

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: expect.any(Array),
        nResults: 100,
      });
    });
  });
});
