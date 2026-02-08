// Test setup file
// This runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENROUTER_API_KEY = 'test-api-key';
process.env.OPENROUTER_MODEL = 'mistralai/mistral-7b-instruct';
process.env.PORT = '3001';
process.env.MIN_RELEVANCE_SCORE = '0.5';
process.env.TOP_K = '5';
process.env.DOCS_PATH = './tests/fixtures/docs';
process.env.CHROMA_PATH = './tests/fixtures/chroma';

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test timeout
jest.setTimeout(30000);
