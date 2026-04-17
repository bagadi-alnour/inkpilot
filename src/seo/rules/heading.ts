import type { SEOIssue } from '@writeflow/types';

export interface HeadingInfo {
  level: number;
  text: string;
  from: number;
  to: number;
}

export function analyzeHeadings(headings: HeadingInfo[]): SEOIssue[] {
  const issues: SEOIssue[] = [];

  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) {
    issues.push({
      type: 'warning',
      code: 'missing-h1',
      message: 'Document is missing an H1 heading. Add a primary heading for better SEO.',
    });
  } else if (h1s.length > 1) {
    issues.push({
      type: 'warning',
      code: 'multiple-h1',
      message: `Document has ${h1s.length} H1 headings. Use only one H1 per page.`,
    });
  }

  for (let i = 1; i < headings.length; i++) {
    const current = headings[i];
    const previous = headings[i - 1];
    if (current.level > previous.level + 1) {
      issues.push({
        type: 'warning',
        code: 'heading-skip',
        message: `H${current.level} follows H${previous.level}, skipping H${previous.level + 1}. Fix heading hierarchy.`,
        element: current.text,
      });
    }
  }

  return issues;
}
