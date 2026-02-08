export interface HealthResponse {
  status: string;
  timestamp: string;
  requestId: string;
}

export interface IngestRequest {
  reset?: boolean;
}

export interface IngestResponse {
  success: boolean;
  message: string;
  documentsProcessed: number;
  chunksCreated: number;
  requestId: string;
}

export interface ChatRequest {
  question: string;
}

export interface Citation {
  source: string;
  chunkId: string;
  excerpt: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  abstained?: boolean;
  requestId: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  requestId: string;
}

export interface RetrievalResult {
  content: string;
  metadata: {
    source: string;
    chunkId: string;
  };
  score: number;
}

export interface WorkflowState {
  question: string;
  retrievedDocs: RetrievalResult[];
  shouldAbstain: boolean;
  abstainReason?: string;
  answer?: string;
  citations: Citation[];
}
