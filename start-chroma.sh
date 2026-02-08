#!/bin/bash
# Start ChromaDB server

echo "Starting ChromaDB server on port 8000..."
echo "Data will be stored in: $PWD/data/chroma"
echo ""

# Create data directory if it doesn't exist
mkdir -p data/chroma

# Start ChromaDB server
npx chromadb run --path data/chroma --port 8000
