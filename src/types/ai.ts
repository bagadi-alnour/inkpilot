export type AIProvider = 'openai' | 'anthropic';
export type AITone = 'formal' | 'casual' | 'persuasive';
export type AIIntent = 'simplify' | 'expand' | 'clarify';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseURL?: string;
  defaultTone?: AITone;
  defaultIntent?: AIIntent;
  preserveMeaning?: boolean;
  onRewrite?: (result: RewriteResult) => void;
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  tone: AITone;
  intent: AIIntent;
  accepted: boolean;
}

export interface RewriteOptions {
  tone?: AITone;
  intent?: AIIntent;
  preserveMeaning?: boolean;
}

export interface RewriteParams {
  selectedText: string;
  surroundingBefore: string;
  surroundingAfter: string;
  tone: AITone;
  intent: AIIntent;
  preserveMeaning: boolean;
  signal?: AbortSignal;
}

export interface RestructureParams {
  fullContent: string;
  headingStructure: HeadingNode[];
  instructions?: string;
  signal?: AbortSignal;
}

export interface HeadingNode {
  level: number;
  text: string;
  from: number;
  to: number;
  children: HeadingNode[];
}

export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

export interface AIProviderAdapter {
  rewrite(params: RewriteParams): AsyncIterable<string>;
  restructure(params: RestructureParams): AsyncIterable<string>;
  suggestTitle(content: string): Promise<string[]>;
  suggestMeta(content: string): Promise<string>;
}
