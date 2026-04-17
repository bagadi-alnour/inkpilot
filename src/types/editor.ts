import type { AIConfig } from './ai';
import type { StorageConfig } from './storage';
import type { ThemeConfig } from './theme';
import type { SEOConfig, SEOAnalysis } from './seo';
import type { ImageConfig } from './image';
import type { I18nConfig } from './i18n';

export interface EditorContent {
  html: string;
  markdown: string;
  json: Record<string, unknown>;
  text: string;
  wordCount: number;
  readingTime: number;
}

export interface EditorConfig {
  ai?: AIConfig;
  storage?: StorageConfig;
  theme?: ThemeConfig;
  seo?: SEOConfig;
  image?: ImageConfig;
  i18n?: I18nConfig;
  locale?: string;
  content?: Partial<EditorContent>;
  onChange?: (content: EditorContent) => void;
  onPublish?: (content: EditorContent, analysis: SEOAnalysis) => void;
}

export interface EditorInstance {
  getContent(): EditorContent;
  setContent(html: string): void;
  focus(): void;
  blur(): void;
  isEmpty(): boolean;
  destroy(): void;
}
