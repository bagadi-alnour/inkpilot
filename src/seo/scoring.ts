import type { SEOIssue, ReadabilityResult, KeywordResult } from '@inkpilot/types';

export function computeSEOScore(
  structuralIssues: SEOIssue[],
  readability: ReadabilityResult,
  keywords: KeywordResult[],
): number {
  let score = 100;

  for (const issue of structuralIssues) {
    switch (issue.type) {
      case 'error':
        score -= 15;
        break;
      case 'warning':
        score -= 8;
        break;
      case 'info':
        score -= 3;
        break;
    }
  }

  for (const issue of readability.issues) {
    switch (issue.type) {
      case 'error':
        score -= 12;
        break;
      case 'warning':
        score -= 6;
        break;
      case 'info':
        score -= 2;
        break;
    }
  }

  for (const kw of keywords) {
    for (const issue of kw.issues) {
      switch (issue.type) {
        case 'error':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 2;
          break;
      }
    }

    if (kw.count > 0 && kw.inTitle && kw.inFirstParagraph && kw.inHeadings) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
