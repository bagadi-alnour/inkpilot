import type { SEOConfig } from '@inkpilot/types';
import { DEFAULT_RULE_OPTIONS } from '../seo/engine';
import type { AnalyzeContext, ArticleMeta } from '../seo/engine';

/** Engine context from editor props. Shared by the live report and the publish snapshot. */
export function analyzeContextFrom(options: { locale?: string; seo?: SEOConfig; meta?: ArticleMeta }): AnalyzeContext {
  return {
    locale: options.seo?.locale ?? options.locale ?? 'en',
    keywords: options.seo?.keywords ?? [],
    rules: { ...DEFAULT_RULE_OPTIONS, ...options.seo?.rules },
    meta: options.meta,
  };
}
