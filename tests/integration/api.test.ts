// Mock services BEFORE importing app
jest.mock('../../src/services/ingestion');
jest.mock('../../src/services/workflow');
jest.mock('../../src/services/retrieval');

import request from 'supertest';
import { IngestionService } from '../../src/services/ingestion';
import { RAGWorkflow } from '../../src/services/workflow';

// Set up mocks
const mockIngestDocuments = jest.fn().mockResolvedValue({
  documentsProcessed: 5,
  chunksCreated: 47,
});

const mockExecute = jest.fn().mockResolvedValue({
  question: 'test question',
  retrievedDocs: [],
  shouldAbstain: false,
  answer: 'This is a test answer based on the documentation.',
  citations: [
    {
      source: 'test.md',
      chunkId: 'test_chunk_0',
      excerpt: 'Test excerpt from the document...',
      score: 0.85,
    },
  ],
});

(IngestionService as jest.Mock).mockImplementation(() => ({
  ingestDocuments: mockIngestDocuments,
}));

(RAGWorkflow as jest.Mock).mockImplementation(() => ({
  execute: mockExecute,
}));

// Now import the app after mocks are set up
import { app, server } from '../../src/index';

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should have correct content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('POST /ingest', () => {
    it('should ingest documents successfully', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({ reset: false });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('documentsProcessed');
      expect(response.body).toHaveProperty('chunksCreated');
    });

    it('should pass reset parameter to service', async () => {
      await request(app).post('/ingest').send({ reset: true });

      expect(mockIngestDocuments).toHaveBeenCalledWith(true);
    });

    it('should default reset to false', async () => {
      await request(app).post('/ingest').send({});

      expect(mockIngestDocuments).toHaveBeenCalledWith(false);
    });

    it('should return document and chunk counts', async () => {
      const response = await request(app).post('/ingest').send({});

      expect(response.body.documentsProcessed).toBe(5);
      expect(response.body.chunksCreated).toBe(47);
    });

    it('should handle ingestion errors', async () => {
      mockIngestDocuments.mockRejectedValueOnce(
        new Error('Ingestion failed')
      );

      const response = await request(app).post('/ingest').send({});

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'IngestError');
      expect(response.body).toHaveProperty('message');
    });

    it('should have correct content type', async () => {
      const response = await request(app).post('/ingest').send({});

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should accept JSON body', async () => {
      const response = await request(app)
        .post('/ingest')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ reset: true }));

      expect(response.status).toBe(200);
    });
  });

  describe('POST /chat', () => {
    it('should answer question successfully', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ question: 'How do I configure the database?' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('answer');
      expect(response.body).toHaveProperty('citations');
      expect(response.body).toHaveProperty('abstained');
    });

    it('should pass question to workflow', async () => {
      const question = 'How do I configure the database?';
      await request(app).post('/chat').send({ question });

      expect(mockExecute).toHaveBeenCalledWith(question);
    });

    it('should return citations array', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ question: 'test question' });

      expect(Array.isArray(response.body.citations)).toBe(true);
      expect(response.body.citations.length).toBeGreaterThan(0);
      expect(response.body.citations[0]).toHaveProperty('source');
      expect(response.body.citations[0]).toHaveProperty('chunkId');
      expect(response.body.citations[0]).toHaveProperty('excerpt');
      expect(response.body.citations[0]).toHaveProperty('score');
    });

    it('should indicate when abstained', async () => {
      mockExecute.mockResolvedValueOnce({
        question: 'test',
        retrievedDocs: [],
        shouldAbstain: true,
        abstainReason: 'No relevant documents found',
        answer: 'No relevant documents found',
        citations: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({ question: 'unrelated question' });

      expect(response.status).toBe(200);
      expect(response.body.abstained).toBe(true);
      expect(response.body.citations).toEqual([]);
    });

    it('should validate question is required', async () => {
      const response = await request(app).post('/chat').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'ValidationError');
      expect(response.body.message).toContain('required');
    });

    it('should validate question is not empty', async () => {
      const response = await request(app).post('/chat').send({ question: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'ValidationError');
    });

    it('should validate question is string', async () => {
      const response = await request(app).post('/chat').send({ question: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'ValidationError');
    });

    it('should trim whitespace from question', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ question: '   ' });

      expect(response.status).toBe(400);
    });

    it('should handle workflow errors', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Workflow failed'));

      const response = await request(app)
        .post('/chat')
        .send({ question: 'test question' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'ChatError');
      expect(response.body).toHaveProperty('message');
    });

    it('should have correct content type', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ question: 'test' });

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle long questions', async () => {
      const longQuestion = 'question '.repeat(100);
      const response = await request(app)
        .post('/chat')
        .send({ question: longQuestion });

      expect(response.status).toBe(200);
      expect(mockExecute).toHaveBeenCalledWith(longQuestion);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/chat')
        .set('Content-Type', 'application/json')
        .send('invalid json{');

      // Express returns 400 for invalid JSON by default
      expect([400, 500]).toContain(response.status);
    });

    it('should handle missing content-type', async () => {
      const response = await request(app).post('/chat').send('question=test');

      // Express should handle this, but might return 400 or process differently
      expect([200, 400, 415]).toContain(response.status);
    });
  });

  describe('CORS and Headers', () => {
    it('should accept JSON requests', async () => {
      const response = await request(app)
        .post('/chat')
        .set('Content-Type', 'application/json')
        .send({ question: 'test' });

      expect(response.status).toBe(200);
    });

    it('should return JSON responses', async () => {
      const response = await request(app).get('/health');

      expect(response.type).toBe('application/json');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post('/chat')
            .send({ question: 'test question' })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('answer');
      });
    });

    it('should handle concurrent ingestion and chat', async () => {
      const [ingestResponse, chatResponse] = await Promise.all([
        request(app).post('/ingest').send({}),
        request(app).post('/chat').send({ question: 'test' }),
      ]);

      expect(ingestResponse.status).toBe(200);
      expect(chatResponse.status).toBe(200);
    });
  });
});
