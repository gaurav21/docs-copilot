import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface Config {
  openrouter: {
    apiKey: string;
    model: string;
  };
  openai: {
    apiKey: string;
  };
  server: {
    port: number;
  };
  rag: {
    minRelevanceScore: number;
    topK: number;
  };
  paths: {
    docs: string;
    chroma: string;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

export const config: Config = {
  openrouter: {
    apiKey: getEnvVar('OPENROUTER_API_KEY'),
    model: getEnvVar('OPENROUTER_MODEL', 'mistralai/mistral-7b-instruct'),
  },
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY'),
  },
  server: {
    port: parseInt(getEnvVar('PORT', '3000'), 10),
  },
  rag: {
    minRelevanceScore: parseFloat(getEnvVar('MIN_RELEVANCE_SCORE', '0.5')),
    topK: parseInt(getEnvVar('TOP_K', '5'), 10),
  },
  paths: {
    docs: path.resolve(getEnvVar('DOCS_PATH', './data/docs')),
    chroma: path.resolve(getEnvVar('CHROMA_PATH', './data/chroma')),
  },
};
