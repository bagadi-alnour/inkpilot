import type { RuleOptions } from '../seo/engine/types';

export type { Issue as SEOIssue, Report as SEOReport, RuleOptions as SEORuleOptions } from '../seo/engine/types';
export type { IssueCode as SEOIssueCode, IssueSeverity as SEOIssueSeverity, FixKind as SEOFixKind } from '../seo/engine/types';

export interface SEOConfig {
  /** Underline issues and show the score while writing. Default true. */
  liveSignals?: boolean;
  /** Show the review panel before `onPublish`. Default true. */
  prePublishPanel?: boolean;
  /** Phrases the article should rank for. */
  keywords?: string[];
  /** Language of the content, for sentence splitting. Defaults to the editor `locale`. */
  locale?: string;
  /** Site URL the slug is appended to in the search preview, e.g. `https://example.com/blog/`. */
  baseUrl?: string;
  /** Override guidance thresholds (title length, sentence length, ...). */
  rules?: Partial<RuleOptions>;
}


