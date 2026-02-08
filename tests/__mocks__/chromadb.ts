// Mock ChromaDB client for testing

export class ChromaClient {
  private collections: Map<string, any> = new Map();

  constructor(config?: any) {}

  async getCollection(options: { name: string }) {
    const collection = this.collections.get(options.name);
    if (!collection) {
      throw new Error(`Collection ${options.name} not found`);
    }
    return collection;
  }

  async getOrCreateCollection(options: { name: string }) {
    if (!this.collections.has(options.name)) {
      const collection = new MockCollection(options.name);
      this.collections.set(options.name, collection);
    }
    return this.collections.get(options.name);
  }

  async createCollection(options: { name: string }) {
    const collection = new MockCollection(options.name);
    this.collections.set(options.name, collection);
    return collection;
  }

  async deleteCollection(options: { name: string }) {
    this.collections.delete(options.name);
  }

  reset() {
    this.collections.clear();
  }
}

class MockCollection {
  private data: any[] = [];
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async add(options: {
    ids: string[];
    embeddings: number[][];
    documents: string[];
    metadatas: any[];
  }) {
    for (let i = 0; i < options.ids.length; i++) {
      this.data.push({
        id: options.ids[i],
        embedding: options.embeddings[i],
        document: options.documents[i],
        metadata: options.metadatas[i],
      });
    }
  }

  async query(options: { queryEmbeddings: number[][]; nResults: number }) {
    const queryEmbedding = options.queryEmbeddings[0];

    // Simple mock: return stored documents with mock similarity scores
    const results = this.data.slice(0, options.nResults);

    return {
      ids: [results.map(r => r.id)],
      documents: [results.map(r => r.document)],
      metadatas: [results.map(r => r.metadata)],
      distances: [results.map((_, idx) => 0.2 + idx * 0.1)], // Mock distances
    };
  }

  async count() {
    return this.data.length;
  }

  getData() {
    return this.data;
  }
}
