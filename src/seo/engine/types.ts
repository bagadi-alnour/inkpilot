import type { Node as PMNode } from '@tiptap/pm/model';
import type { IssueParams } from '../../protocol';

export type IssueSeverity = 'error' | 'warning' | 'info';

/** Every issue code the engine emits. Each has `seo.issue.<code>` and `.detail` strings. */
export type IssueCode =
  | 'missing-title'
  | 'multiple-h1'
  | 'heading-skip'
  | 'title-length'
  | 'generic-title'
  | 'description-missing'
  | 'description-length'
  | 'alt-missing'
  | 'alt-length'
  | 'inline-image'
  | 'long-sentence'
  | 'dense-paragraph'
  | 'hard-to-read'
  | 'keyword-missing'
  | 'keyword-not-in-intro'
  | 'keyword-not-in-title'
  | 'keyword-not-in-headings'
  | 'keyword-density';

/** How an issue can be resolved from the UI. */
export type FixKind = 'ai-rewrite' | 'ai-title' | 'ai-description' | 'ai-alt' | 'manual';

export interface Issue {
  /** Stable while the affected text is unchanged; used for "ignore". */
  id: string;
  code: IssueCode;
  severity: IssueSeverity;
  /** Values for the translated message, e.g. `{ words: 74, limit: 25 }`. */
  params: IssueParams;
  /** Document range the issue is about, when it has one. */
  range?: { from: number; to: number };
  fix?: FixKind;
}

export interface Report {
  issues: Issue[];
  /** 0–100: how well the content meets Inkpilot's checks. Not a ranking prediction. */
  score: number;
}

export interface LengthRange {
  min: number;
  max: number;
}

/**
 * Thresholds are guidance, not search-engine rules, and can be overridden through
 * `seo.rules`. Length checks are reported as `info` for that reason.
 */
export interface RuleOptions {
  titleLength: LengthRange;
  descriptionLength: LengthRange;
  altLength: LengthRange;
  maxSentenceWords: number;
  maxParagraphSentences: number;
  /** Flesch reading ease below this is flagged (English only). */
  minReadingEase: number;
  /** Share of words that are the keyword. */
  keywordDensity: LengthRange;
}

export const DEFAULT_RULE_OPTIONS: RuleOptions = {
  titleLength: { min: 30, max: 60 },
  descriptionLength: { min: 120, max: 160 },
  altLength: { min: 5, max: 125 },
  maxSentenceWords: 25,
  maxParagraphSentences: 5,
  minReadingEase: 50,
  keywordDensity: { min: 0.005, max: 0.03 },
};

export interface ArticleMeta {
  /** SEO title; when empty the H1 is the title. */
  title?: string;
  description?: string;
}

export interface AnalyzeContext {
  locale: string;
  rules: RuleOptions;
  keywords: string[];
  /** Absent until the host shows metadata fields; description checks need it. */
  meta?: ArticleMeta;
}

export type Rule = (doc: PMNode, ctx: AnalyzeContext) => Issue[];
