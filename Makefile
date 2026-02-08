.PHONY: help install run ingest chat eval test clean

# Default target
help:
	@echo "Docs Copilot - Available Commands:"
	@echo ""
	@echo "  make install    Install dependencies"
	@echo "  make run        Start the development server"
	@echo "  make ingest     Ingest documentation (reset=true)"
	@echo "  make chat       Send a chat message (use: make chat q=\"your question\")"
	@echo "  make eval       Run evaluation harness"
	@echo "  make test       Run test suite"
	@echo "  make clean      Clean build artifacts"
	@echo ""

# Install dependencies
install:
	npm install

# Start development server
run:
	npm run dev

# Ingest documents
ingest:
	@echo "Ingesting documents..."
	@curl -X POST http://localhost:3000/ingest \
		-H "Content-Type: application/json" \
		-d '{"reset": true}' \
		-w "\n" \
		-s | jq .

# Send chat message (usage: make chat q="your question")
chat:
ifndef q
	@echo "Error: Please provide a question using q=\"your question\""
	@echo "Example: make chat q=\"How do I handle database errors?\""
	@exit 1
endif
	@echo "Asking: $(q)"
	@curl -X POST http://localhost:3000/chat \
		-H "Content-Type: application/json" \
		-d "{\"question\": \"$(q)\"}" \
		-w "\n" \
		-s | jq .

# Run evaluation harness
eval:
	@echo "Running evaluation harness..."
	@ts-node scripts/eval.ts

# Run tests
test:
	npm test

# Run tests with coverage
test-coverage:
	npm run test:coverage

# Clean build artifacts
clean:
	rm -rf node_modules dist coverage
	rm -f package-lock.json

# Health check
health:
	@curl -s http://localhost:3000/health | jq .
