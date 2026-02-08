import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { RetrievalService } from './retrieval';
import { config } from '../config';
import { WorkflowState, Citation } from '../types';

export class RAGWorkflow {
  private retrieval: RetrievalService;
  private llm: ChatOpenAI;

  constructor() {
    this.retrieval = new RetrievalService();

    this.llm = new ChatOpenAI({
      openAIApiKey: config.openrouter.apiKey,
      modelName: config.openrouter.model,
      temperature: 0.7,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });
  }

  private async retrieveNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    const retrievedDocs = await this.retrieval.retrieve(state.question);
    return { retrievedDocs };
  }

  private async decideAbstainNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    if (state.retrievedDocs.length === 0) {
      return {
        shouldAbstain: true,
        abstainReason: 'No relevant documents found in the knowledge base.',
      };
    }

    const bestScore = state.retrievedDocs[0].score;

    if (bestScore < config.rag.minRelevanceScore) {
      return {
        shouldAbstain: true,
        abstainReason: `The most relevant document has a similarity score of ${bestScore.toFixed(3)}, which is below the minimum threshold of ${config.rag.minRelevanceScore}. I don't have enough relevant information to answer this question confidently.`,
      };
    }

    return { shouldAbstain: false };
  }

  private async generateAnswerNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    if (state.shouldAbstain) {
      return {
        answer: state.abstainReason,
        citations: [],
      };
    }

    const context = state.retrievedDocs
      .map((doc, idx) => `[${idx + 1}] ${doc.content}\nSource: ${doc.metadata.source} (${doc.metadata.chunkId})`)
      .join('\n\n');

    const prompt = `You are a documentation assistant that answers questions STRICTLY based on the provided context.

RULES:
- Answer ONLY using information from the context below
- If the context does not contain the answer, respond with "I don't know"
- Reference sources using [1], [2], etc. when making claims
- Be concise and accurate
- Include a "Citations" section at the end mapping each claim to chunk IDs

Context:
${context}

Question: ${state.question}

Answer:`;

    const response = await this.llm.invoke(prompt);
    const answer = response.content.toString();

    const citations: Citation[] = state.retrievedDocs.map((doc) => ({
      source: doc.metadata.source,
      chunkId: doc.metadata.chunkId,
      excerpt: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : ''),
      score: doc.score,
    }));

    return {
      answer,
      citations,
    };
  }

  private shouldContinueToGenerate(state: WorkflowState): string {
    return state.shouldAbstain ? 'end' : 'generate';
  }

  async execute(question: string): Promise<WorkflowState> {
    const GraphAnnotation = Annotation.Root({
      question: Annotation<string>(),
      retrievedDocs: Annotation<any[]>(),
      shouldAbstain: Annotation<boolean>(),
      abstainReason: Annotation<string | undefined>(),
      answer: Annotation<string | undefined>(),
      citations: Annotation<any[]>(),
    });

    const workflow = new StateGraph(GraphAnnotation)
      .addNode('retrieve', this.retrieveNode.bind(this))
      .addNode('decide_abstain', this.decideAbstainNode.bind(this))
      .addNode('generate_answer', this.generateAnswerNode.bind(this))
      .addEdge('__start__', 'retrieve')
      .addEdge('retrieve', 'decide_abstain')
      .addConditionalEdges('decide_abstain', this.shouldContinueToGenerate.bind(this), {
        generate: 'generate_answer',
        end: END,
      })
      .addEdge('generate_answer', END);

    const app = workflow.compile();

    const initialState = {
      question,
      retrievedDocs: [],
      shouldAbstain: false,
      citations: [],
    };

    const result = await app.invoke(initialState);
    return result as WorkflowState;
  }
}
