import type { Node } from '@tiptap/core';
import type { AIConfig } from './ai';
import type { ThemeConfig } from './theme';
import type { SEOConfig, SEOReport } from './seo';
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

/** Search metadata edited in the publish panel. */
export interface PublishMeta {
  /** SEO title; empty means the H1 is used. */
  title: string;
  description: string;
  slug: string;
}

/** What `onPublish` receives: content and the analysis of that exact content. */
export interface PublishPayload {
  content: EditorContent;
  meta: PublishMeta;
  report: SEOReport;
}

export interface EditorConfig {
  ai?: AIConfig;
  theme?: ThemeConfig;
  seo?: SEOConfig;
  image?: ImageConfig;
  i18n?: I18nConfig;
  locale?: string;
  content?: Partial<EditorContent>;
  onChange?: (content: EditorContent) => void;
  /** Initial search metadata; the publish panel edits it from there. */
  defaultMeta?: Partial<PublishMeta>;
  onMetaChange?: (meta: PublishMeta) => void;
  onPublish?: (payload: PublishPayload) => void;
  /**
   * A code block node to use instead of the plain one, e.g. for syntax highlighting:
   * `CodeBlockLowlight.configure({ lowlight: createLowlight(common) })`.
   * It must keep the name `codeBlock`. Read once, when the editor is created.
   */
  codeBlock?: Node;
}

export interface EditorInstance {
  getContent(): EditorContent;
  setContent(html: string): void;
  focus(): void;
  blur(): void;
  isEmpty(): boolean;
  destroy(): void;
}
