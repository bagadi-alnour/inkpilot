import type { SEOIssue } from '@inkpilot/types';

const MIN_META_LENGTH = 120;
const MAX_META_LENGTH = 160;

export function analyzeMetaDescription(description: string | undefined): SEOIssue[] {
  const issues: SEOIssue[] = [];

  if (!description || description.trim() === '') {
    issues.push({
      type: 'info',
      code: 'missing-meta',
      message: 'No meta description set. A good meta description improves click-through rates from search results.',
    });
    return issues;
  }

  if (description.length < MIN_META_LENGTH) {
    issues.push({
      type: 'info',
      code: 'short-meta',
      message: `Meta description is ${description.length} characters. Aim for ${MIN_META_LENGTH}-${MAX_META_LENGTH} for optimal display.`,
    });
  }

  if (description.length > MAX_META_LENGTH) {
    issues.push({
      type: 'warning',
      code: 'long-meta',
      message: `Meta description is ${description.length} characters. It may be truncated in search results (max ${MAX_META_LENGTH}).`,
    });
  }

  return issues;
}
