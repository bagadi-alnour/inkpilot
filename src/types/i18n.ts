export interface I18nConfig {
  locale?: string;
  translations?: Partial<TranslationStrings>;
}

export interface TranslationStrings {
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
  'ai.rewriting': string;
  'ai.accept': string;
  'ai.reject': string;
  'ai.options': string;
  'ai.tone': string;
  'ai.intent': string;
  'ai.tone.formal': string;
  'ai.tone.casual': string;
  'ai.tone.persuasive': string;
  'ai.intent.simplify': string;
  'ai.intent.expand': string;
  'ai.intent.clarify': string;
  'ai.preserveMeaning': string;
  'ai.restructure': string;
  'ai.restructuring': string;

  // SEO signals
  'seo.missingH1': string;
  'seo.weakTitle': string;
  'seo.headingHierarchy': string;
  'seo.emptyAlt': string;

  // SEO panel
  'seo.panel.title': string;
  'seo.panel.score': string;
  'seo.panel.issues': string;
  'seo.panel.suggestions': string;
  'seo.panel.publish': string;
  'seo.panel.publishAnyway': string;
  'seo.panel.close': string;
  'seo.panel.apply': string;
  'seo.panel.dismiss': string;

  // SERP
  'seo.serp.title': string;
  'seo.serp.preview': string;

  // Image
  'image.upload': string;
  'image.uploading': string;
  'image.dropHere': string;
  'image.altText': string;
  'image.suggestAlt': string;

  // General
  'general.loading': string;
  'general.error': string;
  'general.cancel': string;
  'general.save': string;
  'general.placeholder': string;
}

export type TranslationKey = keyof TranslationStrings;
