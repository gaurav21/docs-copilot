import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
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

// Logging helper
function logRequest(requestId: string, method: string, path: string, body?: any) {
  console.log(JSON.stringify({
    requestId,
    timestamp: new Date().toISOString(),
    method,
    path,
    body,
  }));
}

function logResponse(requestId: string, status: number, responseTime: number) {
  console.log(JSON.stringify({
    requestId,
    timestamp: new Date().toISOString(),
    status,
    responseTime: `${responseTime}ms`,
  }));
}

app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  logRequest(requestId, 'GET', '/health');

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId,
  });

  logResponse(requestId, 200, Date.now() - startTime);
});

app.post('/ingest', async (req: Request<{}, {}, IngestRequest>, res: Response<IngestResponse | ErrorResponse>) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    logRequest(requestId, 'POST', '/ingest', req.body);

    const { reset = false } = req.body;

    // Validate docs folder exists
    if (!fs.existsSync(config.paths.docs)) {
      res.status(400).json({
        error: 'ValidationError',
        message: `Documentation folder not found: ${config.paths.docs}`,
        requestId,
      });
      logResponse(requestId, 400, Date.now() - startTime);
      return;
    }

    // Validate docs folder is not empty
    const files = fs.readdirSync(config.paths.docs);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
      res.status(400).json({
        error: 'ValidationError',
        message: `No markdown files found in ${config.paths.docs}`,
        requestId,
      });
      logResponse(requestId, 400, Date.now() - startTime);
      return;
    }

    const result = await ingestionService.ingestDocuments(reset);

    res.json({
      success: true,
      message: 'Documents ingested successfully',
      documentsProcessed: result.documentsProcessed,
      chunksCreated: result.chunksCreated,
      requestId,
    });

    logResponse(requestId, 200, Date.now() - startTime);
  } catch (error) {
    res.status(500).json({
      error: 'IngestError',
      message: error instanceof Error ? error.message : 'Failed to ingest documents',
      requestId,
    });
    logResponse(requestId, 500, Date.now() - startTime);
  }
});

app.post('/chat', async (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse | ErrorResponse>) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    logRequest(requestId, 'POST', '/chat', { question: req.body.question });

    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Question is required and must be a non-empty string',
        requestId,
      });
      logResponse(requestId, 400, Date.now() - startTime);
      return;
    }

    const result = await ragWorkflow.execute(question);

    res.json({
      answer: result.answer || 'Unable to generate an answer',
      citations: result.citations,
      abstained: result.shouldAbstain,
      requestId,
    });

    logResponse(requestId, 200, Date.now() - startTime);
  } catch (error) {
    res.status(500).json({
      error: 'ChatError',
      message: error instanceof Error ? error.message : 'Failed to process chat request',
      requestId,
    });
    logResponse(requestId, 500, Date.now() - startTime);
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  console.error('Unhandled error:', { requestId, error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    requestId,
  });
});

const server = app.listen(config.server.port, () => {
  console.log(`Docs Copilot server running on port ${config.server.port}`);
  console.log(`Health check: http://localhost:${config.server.port}/health`);
});

export { app, server };
