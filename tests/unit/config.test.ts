import { config } from '../../src/config';

describe('Configuration', () => {
  describe('OpenRouter Configuration', () => {
    it('should have API key configured', () => {
      expect(config.openrouter.apiKey).toBeDefined();
      expect(typeof config.openrouter.apiKey).toBe('string');
      expect(config.openrouter.apiKey.length).toBeGreaterThan(0);
    });

    it('should have model configured', () => {
      expect(config.openrouter.model).toBeDefined();
      expect(config.openrouter.model).toBe('mistralai/mistral-7b-instruct');
    });
  });

  describe('Server Configuration', () => {
    it('should have port configured', () => {
      expect(config.server.port).toBeDefined();
      expect(typeof config.server.port).toBe('number');
      expect(config.server.port).toBeGreaterThan(0);
    });

    it('should use test port in test environment', () => {
      expect(config.server.port).toBe(3001);
    });
  });

  describe('RAG Configuration', () => {
    it('should have minRelevanceScore configured', () => {
      expect(config.rag.minRelevanceScore).toBeDefined();
      expect(typeof config.rag.minRelevanceScore).toBe('number');
      expect(config.rag.minRelevanceScore).toBeGreaterThanOrEqual(0);
      expect(config.rag.minRelevanceScore).toBeLessThanOrEqual(1);
    });

    it('should have topK configured', () => {
      expect(config.rag.topK).toBeDefined();
      expect(typeof config.rag.topK).toBe('number');
      expect(config.rag.topK).toBeGreaterThan(0);
    });

    it('should use default values from setup', () => {
      expect(config.rag.minRelevanceScore).toBe(0.5);
      expect(config.rag.topK).toBe(5);
    });
  });

  describe('Paths Configuration', () => {
    it('should have docs path configured', () => {
      expect(config.paths.docs).toBeDefined();
      expect(typeof config.paths.docs).toBe('string');
    });

    it('should have chroma path configured', () => {
      expect(config.paths.chroma).toBeDefined();
      expect(typeof config.paths.chroma).toBe('string');
    });

    it('should use test fixtures paths', () => {
      expect(config.paths.docs).toContain('fixtures');
      expect(config.paths.chroma).toContain('fixtures');
    });
  });

  describe('Configuration Validation', () => {
    it('should have all required configuration fields', () => {
      expect(config).toHaveProperty('openrouter');
      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('rag');
      expect(config).toHaveProperty('paths');
    });

    it('should have properly typed configuration', () => {
      expect(typeof config.openrouter.apiKey).toBe('string');
      expect(typeof config.openrouter.model).toBe('string');
      expect(typeof config.server.port).toBe('number');
      expect(typeof config.rag.minRelevanceScore).toBe('number');
      expect(typeof config.rag.topK).toBe('number');
      expect(typeof config.paths.docs).toBe('string');
      expect(typeof config.paths.chroma).toBe('string');
    });
  });
});
