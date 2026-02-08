import { RAGWorkflow } from '../../src/services/workflow';

// Mock dependencies
jest.mock('../../src/services/retrieval');
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn(),
}));

describe('RAGWorkflow', () => {
  let workflow: RAGWorkflow;
  let mockRetrievalService: any;
  let mockLLM: any;
  const { RetrievalService } = require('../../src/services/retrieval');
  const { ChatOpenAI } = require('@langchain/openai');

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock retrieval service
    mockRetrievalService = {
      retrieve: jest.fn().mockResolvedValue([
        {
          content: 'Test document content about database configuration',
          metadata: { source: 'test.md', chunkId: 'test_chunk_0' },
          score: 0.85,
        },
        {
          content: 'Another relevant document about troubleshooting',
          metadata: { source: 'test2.md', chunkId: 'test2_chunk_0' },
          score: 0.75,
        },
      ]),
    };

    RetrievalService.mockImplementation(() => mockRetrievalService);

    // Setup mock LLM
    mockLLM = {
      invoke: jest.fn().mockResolvedValue({
        content: 'Based on the context, here is the answer to your question.',
      }),
    };

    ChatOpenAI.mockImplementation(() => mockLLM);

    workflow = new RAGWorkflow();
  });

  describe('execute', () => {
    it('should execute workflow successfully', async () => {
      const result = await workflow.execute('How do I configure the database?');

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.citations).toBeDefined();
    });

    it('should retrieve documents', async () => {
      await workflow.execute('test question');

      expect(mockRetrievalService.retrieve).toHaveBeenCalledWith('test question');
    });

    it('should generate answer when relevance is high', async () => {
      const result = await workflow.execute('test question');

      expect(result.shouldAbstain).toBe(false);
      expect(result.answer).toBeDefined();
      expect(mockLLM.invoke).toHaveBeenCalled();
    });

    it('should include citations in response', async () => {
      const result = await workflow.execute('test question');

      expect(result.citations).toBeDefined();
      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.citations[0]).toHaveProperty('source');
      expect(result.citations[0]).toHaveProperty('chunkId');
      expect(result.citations[0]).toHaveProperty('excerpt');
      expect(result.citations[0]).toHaveProperty('score');
    });

    it('should truncate excerpts to 200 characters', async () => {
      const longContent = 'a'.repeat(500);
      mockRetrievalService.retrieve.mockResolvedValue([
        {
          content: longContent,
          metadata: { source: 'test.md', chunkId: 'test_chunk_0' },
          score: 0.85,
        },
      ]);

      const result = await workflow.execute('test question');

      expect(result.citations[0].excerpt.length).toBeLessThanOrEqual(203); // 200 + '...'
      expect(result.citations[0].excerpt).toContain('...');
    });

    it('should not truncate short excerpts', async () => {
      mockRetrievalService.retrieve.mockResolvedValue([
        {
          content: 'Short content',
          metadata: { source: 'test.md', chunkId: 'test_chunk_0' },
          score: 0.85,
        },
      ]);

      const result = await workflow.execute('test question');

      expect(result.citations[0].excerpt).toBe('Short content');
      expect(result.citations[0].excerpt).not.toContain('...');
    });
  });

  describe('abstention logic', () => {
    it('should abstain when no documents found', async () => {
      mockRetrievalService.retrieve.mockResolvedValue([]);

      const result = await workflow.execute('test question');

      expect(result.shouldAbstain).toBe(true);
      expect(result.abstainReason).toContain('No relevant documents found');
      expect(result.citations).toEqual([]);
      expect(mockLLM.invoke).not.toHaveBeenCalled();
    });

    it('should abstain when best score is below threshold', async () => {
      mockRetrievalService.retrieve.mockResolvedValue([
        {
          content: 'Low relevance content',
          metadata: { source: 'test.md', chunkId: 'test_chunk_0' },
          score: 0.3, // Below MIN_RELEVANCE_SCORE of 0.5
        },
      ]);

      const result = await workflow.execute('test question');

      expect(result.shouldAbstain).toBe(true);
      expect(result.abstainReason).toContain('below the minimum threshold');
      expect(result.citations).toEqual([]);
      expect(mockLLM.invoke).not.toHaveBeenCalled();
    });

    it('should not abstain when score meets threshold', async () => {
      mockRetrievalService.retrieve.mockResolvedValue([
        {
          content: 'Relevant content',
          metadata: { source: 'test.md', chunkId: 'test_chunk_0' },
          score: 0.5, // Exactly at MIN_RELEVANCE_SCORE
        },
      ]);

      const result = await workflow.execute('test question');

      expect(result.shouldAbstain).toBe(false);
      expect(mockLLM.invoke).toHaveBeenCalled();
    });

    it('should not abstain when score exceeds threshold', async () => {
      mockRetrievalService.retrieve.mockResolvedValue([
        {
          content: 'Highly relevant content',
          metadata: { source: 'test.md', chunkId: 'test_chunk_0' },
          score: 0.9,
        },
      ]);

      const result = await workflow.execute('test question');

      expect(result.shouldAbstain).toBe(false);
      expect(mockLLM.invoke).toHaveBeenCalled();
    });

    it('should include score in abstain reason', async () => {
      mockRetrievalService.retrieve.mockResolvedValue([
        {
          content: 'Low relevance content',
          metadata: { source: 'test.md', chunkId: 'test_chunk_0' },
          score: 0.234,
        },
      ]);

      const result = await workflow.execute('test question');

      expect(result.abstainReason).toContain('0.234');
      expect(result.abstainReason).toContain('0.5');
    });
  });

  describe('LLM prompting', () => {
    it('should include context in prompt', async () => {
      await workflow.execute('test question');

      const promptCall = mockLLM.invoke.mock.calls[0][0];
      expect(promptCall).toContain('Context:');
      expect(promptCall).toContain('Test document content');
    });

    it('should include question in prompt', async () => {
      const question = 'How do I configure the database?';
      await workflow.execute(question);

      const promptCall = mockLLM.invoke.mock.calls[0][0];
      expect(promptCall).toContain('Question:');
      expect(promptCall).toContain(question);
    });

    it('should include source references in context', async () => {
      await workflow.execute('test question');

      const promptCall = mockLLM.invoke.mock.calls[0][0];
      expect(promptCall).toContain('[1]');
      expect(promptCall).toContain('test.md');
      expect(promptCall).toContain('test_chunk_0');
    });

    it('should include multiple documents in context', async () => {
      await workflow.execute('test question');

      const promptCall = mockLLM.invoke.mock.calls[0][0];
      expect(promptCall).toContain('[1]');
      expect(promptCall).toContain('[2]');
    });
  });

  describe('error handling', () => {
    it('should handle retrieval errors', async () => {
      mockRetrievalService.retrieve.mockRejectedValue(new Error('Retrieval error'));

      await expect(workflow.execute('test question')).rejects.toThrow();
    });

    it('should handle LLM errors', async () => {
      mockLLM.invoke.mockRejectedValue(new Error('LLM error'));

      await expect(workflow.execute('test question')).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty question', async () => {
      const result = await workflow.execute('');

      expect(result).toBeDefined();
      expect(mockRetrievalService.retrieve).toHaveBeenCalledWith('');
    });

    it('should handle very long questions', async () => {
      const longQuestion = 'question '.repeat(100);
      const result = await workflow.execute(longQuestion);

      expect(result).toBeDefined();
    });

    it('should handle single retrieved document', async () => {
      mockRetrievalService.retrieve.mockResolvedValue([
        {
          content: 'Single document',
          metadata: { source: 'test.md', chunkId: 'test_chunk_0' },
          score: 0.9,
        },
      ]);

      const result = await workflow.execute('test question');

      expect(result.citations.length).toBe(1);
      expect(result.answer).toBeDefined();
    });

    it('should handle many retrieved documents', async () => {
      const manyDocs = Array(10)
        .fill(null)
        .map((_, i) => ({
          content: `Document ${i} content`,
          metadata: { source: `test${i}.md`, chunkId: `test${i}_chunk_0` },
          score: 0.9 - i * 0.05,
        }));

      mockRetrievalService.retrieve.mockResolvedValue(manyDocs);

      const result = await workflow.execute('test question');

      expect(result.citations.length).toBe(10);
      expect(result.answer).toBeDefined();
    });
  });
});
