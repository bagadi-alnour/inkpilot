import type { SEOIssue } from '@writeflow/types';

const MIN_TITLE_LENGTH = 30;
const MAX_TITLE_LENGTH = 60;
const GENERIC_WORDS = ['untitled', 'test', 'draft', 'new post', 'blog post', 'article'];

export function analyzeTitle(title: string): SEOIssue[] {
  const issues: SEOIssue[] = [];

  if (!title.trim()) {
    issues.push({
      type: 'error',
      code: 'missing-title',
      message: 'No title found. Add an H1 heading as your article title.',
    });
    return issues;
  }

  if (title.length < MIN_TITLE_LENGTH) {
    issues.push({
      type: 'info',
      code: 'short-title',
      message: `Title is ${title.length} characters. Aim for ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} for optimal search visibility.`,
    });
  }

  if (title.length > MAX_TITLE_LENGTH) {
    issues.push({
      type: 'warning',
      code: 'long-title',
      message: `Title is ${title.length} characters. Search engines may truncate titles over ${MAX_TITLE_LENGTH} characters.`,
    });
  }

  const lowerTitle = title.toLowerCase();
  if (GENERIC_WORDS.some((w) => lowerTitle === w || lowerTitle.startsWith(w))) {
    issues.push({
      type: 'warning',
      code: 'generic-title',
      message: 'Title appears generic. Use a specific, descriptive title for better SEO.',
    });
  }

  return issues;
}
