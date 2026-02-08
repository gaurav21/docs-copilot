# Docs Copilot

A local documentation assistant powered by RAG (Retrieval-Augmented Generation) using LangGraph and OpenRouter with Mistral models.

## Features

- **FastAPI-style REST API** built with Express
- **Document Ingestion**: Automatically chunk and embed markdown documentation
- **Persistent Vector Store**: Uses ChromaDB for local vector storage
- **RAG Workflow**: Implemented with LangGraph (retrieve → decide_abstain → generate_answer → end)
- **Smart Abstention**: Returns helpful message when documents aren't relevant enough
- **Citations**: Every answer includes source filename, chunk ID, excerpt, and similarity score
- **OpenRouter Integration**: Uses Mistral models via OpenRouter API

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  Express API │────▶│  LangGraph  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  ChromaDB    │     │ OpenRouter  │
                    │ (Vector DB)  │     │  (Mistral)  │
                    └──────────────┘     └─────────────┘
```

## Prerequisites

- Node.js 18+ and npm
- OpenRouter API key ([get one here](https://openrouter.ai/))

## Installation

1. Clone or create the repository:

```bash
cd docs-copilot
```

2. Install dependencies:

```bash
npm install
```

3. Create environment configuration:

```bash
cp .env.example .env
```

4. Edit `.env` and add your OpenRouter API key:

```bash
OPENROUTER_API_KEY=your_actual_api_key_here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct
PORT=3000
MIN_RELEVANCE_SCORE=0.5
TOP_K=5
DOCS_PATH=./data/docs
CHROMA_PATH=./data/chroma
```

## Usage

### Start the Server

Development mode with auto-reload:

```bash
npm run dev
```

Production mode (build first):

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the PORT you configured).

### API Endpoints

#### 1. Health Check

Check if the service is running:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. Ingest Documents

Ingest markdown files from `./data/docs` into the vector store:

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"reset": true}'
```

Parameters:
- `reset` (optional, default: false): If true, clears existing documents before ingesting

Response:
```json
{
  "success": true,
  "message": "Documents ingested successfully",
  "documentsProcessed": 5,
  "chunksCreated": 47
}
```

#### 3. Chat with Documents

Ask questions about your documentation:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I handle a database connection error during an on-call shift?"}'
```

Response:
```json
{
  "answer": "When handling database connection errors during on-call, you should: 1) Check database server health, 2) Verify connection pool configuration, 3) Look for long-running queries, 4) Check for database locks, and 5) Restart application servers if needed [1].",
  "citations": [
    {
      "source": "oncall_guide.md",
      "chunkId": "oncall_guide.md_chunk_3",
      "excerpt": "Database Connection Errors\n\nTrigger: Connection pool exhausted or timeout errors\n\nResponse:\n1. Check database server health\n2. Verify connection pool configuration\n3. Look for long-running queries...",
      "score": 0.8523
    }
  ],
  "abstained": false
}
```

If the question is not relevant to the documentation:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the weather today?"}'
```

Response:
```json
{
  "answer": "The most relevant document has a similarity score of 0.234, which is below the minimum threshold of 0.5. I don't have enough relevant information to answer this question confidently.",
  "citations": [],
  "abstained": true
}
```

## Sample Documentation

The repository includes 5 sample documentation files in `./data/docs`:

1. **oncall_guide.md** - On-call procedures and common alerts
2. **auth_runbook.md** - Authentication service troubleshooting
3. **payments_runbook.md** - Payment processing and Stripe integration
4. **incident_template.md** - Incident report template and procedures
5. **product_faq.md** - Product features and frequently asked questions

Feel free to replace these with your own documentation!

## Testing

This project includes comprehensive test coverage with Jest.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Test Structure

- **Unit Tests** (`tests/unit/`): Test individual services in isolation
  - Configuration tests (12 tests)
  - Ingestion service tests (11 tests)
  - Retrieval service tests (26 tests)
  - Workflow service tests (21 tests)

- **Integration Tests** (`tests/integration/`): Test API endpoints end-to-end
  - Health endpoint
  - Ingest endpoint
  - Chat endpoint
  - Error handling
  - Concurrent requests

### Test Coverage

Current coverage: **89 tests, all passing**

The test suite ensures:
- All API endpoints work correctly
- Services handle errors gracefully
- Edge cases are covered
- Mocked external dependencies (ChromaDB, OpenRouter)

See [TESTING.md](./TESTING.md) for detailed testing documentation.

### Continuous Integration

Tests run automatically on push/PR via GitHub Actions. See `.github/workflows/test.yml`.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key (required) | - |
| `OPENROUTER_MODEL` | Model to use for generation | `mistralai/mistral-7b-instruct` |
| `PORT` | Server port | `3000` |
| `MIN_RELEVANCE_SCORE` | Minimum similarity score to answer (0-1) | `0.5` |
| `TOP_K` | Number of chunks to retrieve | `5` |
| `DOCS_PATH` | Path to documentation folder | `./data/docs` |
| `CHROMA_PATH` | Path to ChromaDB storage | `./data/chroma` |

### Adjusting Relevance Threshold

The `MIN_RELEVANCE_SCORE` determines when the system should abstain from answering:

- **0.7-1.0**: Very strict - only answers highly relevant questions
- **0.5-0.7**: Moderate - good balance (recommended)
- **0.0-0.5**: Permissive - may answer less relevant questions

## LangGraph Workflow

The RAG workflow is implemented using LangGraph with the following nodes:

```
          ┌─────────┐
   START──▶│Retrieve │
          └────┬────┘
               │
               ▼
        ┌──────────────┐
        │DecideAbstain │
        └──────┬───────┘
               │
         ┌─────┴─────┐
         ▼           ▼
    Abstain     ┌──────────────┐
      │         │GenerateAnswer│
      │         └──────┬───────┘
      │                │
      └────────┬───────┘
               ▼
             END
```

1. **Retrieve**: Fetches top K relevant document chunks using vector similarity
2. **Decide Abstain**: Checks if best similarity score meets minimum threshold
3. **Generate Answer**: Uses Mistral model to generate answer with context (if not abstaining)
4. **End**: Returns answer with citations

## Project Structure

```
docs-copilot/
├── src/
│   ├── index.ts              # Express app and API endpoints
│   ├── config.ts             # Configuration management
│   ├── types.ts              # TypeScript interfaces
│   └── services/
│       ├── ingestion.ts      # Document chunking and embedding
│       ├── retrieval.ts      # Vector search
│       └── workflow.ts       # LangGraph RAG workflow
├── data/
│   ├── docs/                 # Source documentation (markdown files)
│   └── chroma/               # ChromaDB vector store (generated)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Adding Your Own Documentation

1. Place your markdown files in `./data/docs/`
2. Run the ingestion endpoint:

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"reset": true}'
```

3. Start asking questions!

### Document Format Tips

- Use clear, descriptive headings
- Keep paragraphs focused on single topics
- Include code examples and commands
- Use consistent formatting

## Troubleshooting

### "Missing required environment variable: OPENROUTER_API_KEY"

Make sure you've created a `.env` file with your OpenRouter API key.

### "Failed to ingest documents"

- Check that `./data/docs` exists and contains `.md` files
- Verify your OpenRouter API key is valid
- Check network connectivity to OpenRouter API

### "Failed to retrieve documents"

- Make sure you've run the `/ingest` endpoint first
- Check that `./data/chroma` directory has been created with data

### Low Quality Answers

- Try lowering `MIN_RELEVANCE_SCORE` to allow more results
- Increase `TOP_K` to provide more context
- Try a different Mistral model (e.g., `mistralai/mistral-medium`)
- Improve your source documentation with more detail

## Development

### Type Checking

```bash
npm run type-check
```

### Building

```bash
npm run build
```

Output will be in `./dist` directory.

## Available Models

Popular Mistral models on OpenRouter:

- `mistralai/mistral-7b-instruct` - Fast, cost-effective (recommended)
- `mistralai/mistral-medium` - Better quality, slower
- `mistralai/mistral-large-latest` - Best quality, most expensive

See [OpenRouter Models](https://openrouter.ai/models) for full list and pricing.

## Cost Estimation

Based on OpenRouter pricing (as of 2024):

- **Embeddings**: ~$0.10 per 1M tokens (using text-embedding-3-small)
- **Generation**: ~$0.25 per 1M tokens (mistral-7b-instruct)

For typical usage:
- Ingesting 50 documentation pages: ~$0.01
- 100 questions: ~$0.05

Very affordable for personal and small team use!

## License

MIT

## Contributing

Issues and pull requests welcome!

## Support

For questions or issues:
- Open an issue on GitHub
- Check OpenRouter documentation: https://openrouter.ai/docs
- Check LangChain documentation: https://js.langchain.com
