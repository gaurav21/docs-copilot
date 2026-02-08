// Mock LangChain components for testing

export class MockOpenAIEmbeddings {
  async embedQuery(text: string): Promise<number[]> {
    // Return a mock embedding vector (384 dimensions)
    return Array(384).fill(0).map(() => Math.random());
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map(text => this.embedQuery(text));
  }
}

export class MockChatOpenAI {
  private responses: Map<string, string> = new Map();

  constructor(config?: any) {}

  setMockResponse(prompt: string, response: string) {
    this.responses.set(prompt, response);
  }

  async invoke(prompt: string): Promise<{ content: string }> {
    // Check for exact match
    if (this.responses.has(prompt)) {
      return { content: this.responses.get(prompt)! };
    }

    // Return a default mock response
    return {
      content: 'This is a mock response based on the provided context.',
    };
  }
}
