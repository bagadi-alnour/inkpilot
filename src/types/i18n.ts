import type { IssueCode } from '../seo/engine/types';

export interface I18nConfig {
  locale?: string;
  translations?: Partial<TranslationStrings>;
}

/** `seo.issue.<code>` (short label) and `seo.issue.<code>.detail` (with `{param}` placeholders) for every issue. */
type IssueStrings = { [K in IssueCode as `seo.issue.${K}`]: string } & { [K in IssueCode as `seo.issue.${K}.detail`]: string };

export interface TranslationStrings extends IssueStrings {
  // Toolbar
  'toolbar.bold': string;
  'toolbar.italic': string;
  'toolbar.underline': string;
  'toolbar.strikethrough': string;
  'toolbar.heading1': string;
  'toolbar.heading2': string;
  'toolbar.heading3': string;
  'toolbar.bulletList': string;
  'toolbar.orderedList': string;
  'toolbar.blockquote': string;
  'toolbar.codeBlock': string;
  'toolbar.link': string;
  'toolbar.image': string;
  'toolbar.alignLeft': string;
  'toolbar.alignCenter': string;
  'toolbar.alignRight': string;
  'toolbar.undo': string;
  'toolbar.redo': string;

  // AI
  'ai.rewrite': string;
  'ai.rephrase': string;
  'ai.tone': string;
  'ai.intent': string;
  'ai.tone.formal': string;
  'ai.tone.casual': string;
  'ai.tone.persuasive': string;
  'ai.intent.simplify': string;
  'ai.intent.expand': string;
  'ai.intent.clarify': string;

  // Rewrite preview
  'rewrite.streaming': string;
  'rewrite.ready': string;
  'rewrite.accept': string;
  'rewrite.reject': string;
  'rewrite.stop': string;
  'rewrite.retry': string;
  'rewrite.discard': string;

  // SEO issue actions
  'seo.issue.fix': string;
  'seo.issue.ignore': string;
  'seo.score.label': string;

  // Publish panel
  'publish.title': string;
  'publish.close': string;
  'publish.scoreOf': string;
  'publish.checks': string;
  'publish.noChecks': string;
  'publish.fix': string;
  'publish.show': string;
  'publish.suggest': string;
  'publish.searchAppearance': string;
  'publish.seoTitle': string;
  'publish.seoTitlePlaceholder': string;
  'publish.description': string;
  'publish.slug': string;
  'publish.suggestTitles': string;
  'publish.suggestDescriptions': string;
  'publish.suggesting': string;
  'publish.suggestFailed': string;
  'publish.useSuggestion': string;
  'publish.serpNote': string;
  'publish.publish': string;
  'publish.uploading': string;
  'publish.localImage': string;

  // General
  'general.loading': string;
  'general.error': string;
  'general.cancel': string;
  'general.save': string;
  'general.placeholder': string;
}

export type TranslationKey = keyof TranslationStrings;

/** Values substituted into `{name}` placeholders. */
export type TranslationParams = Record<string, string | number>;
