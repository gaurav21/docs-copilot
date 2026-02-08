import express, { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { IngestionService } from './services/ingestion';
import { RAGWorkflow } from './services/workflow';
import {
  HealthResponse,
  IngestRequest,
  IngestResponse,
  ChatRequest,
  ChatResponse,
  ErrorResponse,
} from './types';

const app = express();
app.use(express.json());

const ingestionService = new IngestionService();
const ragWorkflow = new RAGWorkflow();

app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.post('/ingest', async (req: Request<{}, {}, IngestRequest>, res: Response<IngestResponse | ErrorResponse>) => {
  try {
    const { reset = false } = req.body;

    const result = await ingestionService.ingestDocuments(reset);

    res.json({
      success: true,
      message: 'Documents ingested successfully',
      documentsProcessed: result.documentsProcessed,
      chunksCreated: result.chunksCreated,
    });
  } catch (error) {
    res.status(500).json({
      error: 'IngestError',
      message: error instanceof Error ? error.message : 'Failed to ingest documents',
    });
  }
});

app.post('/chat', async (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse | ErrorResponse>) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Question is required and must be a non-empty string',
      });
      return;
    }

    const result = await ragWorkflow.execute(question);

    res.json({
      answer: result.answer || 'Unable to generate an answer',
      citations: result.citations,
      abstained: result.shouldAbstain,
    });
  } catch (error) {
    res.status(500).json({
      error: 'ChatError',
      message: error instanceof Error ? error.message : 'Failed to process chat request',
    });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
  });
});

const server = app.listen(config.server.port, () => {
  console.log(`Docs Copilot server running on port ${config.server.port}`);
  console.log(`Health check: http://localhost:${config.server.port}/health`);
});

export { app, server };
