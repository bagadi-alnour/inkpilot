export type SEOSignalType = 'missing-h1' | 'weak-title' | 'heading-hierarchy' | 'empty-alt';

export interface SEOConfig {
  lightSignals?: boolean;
  prePublishPanel?: boolean;
  targetKeywords?: string[];
  locale?: string;
  onAnalysis?: (analysis: SEOAnalysis) => void;
}

export interface SEOSignal {
  type: SEOSignalType;
  severity: 'info' | 'warning';
  element?: { from: number; to: number };
  message: string;
}

export interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  element?: string;
}

export type SEOSuggestionType = 'title' | 'meta' | 'heading' | 'keyword' | 'readability' | 'link';

export interface SEOSuggestion {
  type: SEOSuggestionType;
  message: string;
  action?: string;
  apply?: () => void;
}

export interface ReadabilityResult {
  averageSentenceLength: number;
  averageParagraphSentences: number;
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  issues: SEOIssue[];
}

export interface KeywordResult {
  keyword: string;
  density: number;
  count: number;
  inTitle: boolean;
  inFirstParagraph: boolean;
  inHeadings: boolean;
  distribution: number;
  issues: SEOIssue[];
}

export interface SERPPreviewData {
  title: string;
  description: string;
  url: string;
  titleLength: number;
  descriptionLength: number;
}
