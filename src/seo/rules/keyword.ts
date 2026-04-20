import type { KeywordResult, SEOIssue } from '@inkpilot/types';

export function analyzeKeyword(
  text: string,
  keyword: string,
  title: string,
  headings: string[],
): KeywordResult {
  const lowerKeyword = keyword.toLowerCase();
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length || 1;

  const regex = new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = text.match(regex) ?? [];
  const count = matches.length;
  const density = count / totalWords;

  const inTitle = title.toLowerCase().includes(lowerKeyword);
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const inFirstParagraph = paragraphs.length > 0 && paragraphs[0].toLowerCase().includes(lowerKeyword);
  const inHeadings = headings.some((h) => h.toLowerCase().includes(lowerKeyword));

  const sections = paragraphs.length || 1;
  const sectionsWithKeyword = paragraphs.filter((p) => p.toLowerCase().includes(lowerKeyword)).length;
  const distribution = sectionsWithKeyword / sections;

  const issues: SEOIssue[] = [];

  if (count === 0) {
    issues.push({
      type: 'warning',
      code: 'keyword-missing',
      message: `Target keyword "${keyword}" not found in content.`,
    });
  }

  if (density > 0.03) {
    issues.push({
      type: 'warning',
      code: 'keyword-stuffing',
      message: `Keyword "${keyword}" density is ${(density * 100).toFixed(1)}%. Aim below 3% to avoid over-optimization.`,
    });
  } else if (density < 0.005 && count > 0) {
    issues.push({
      type: 'info',
      code: 'keyword-low-density',
      message: `Keyword "${keyword}" density is ${(density * 100).toFixed(1)}%. Consider using it a few more times naturally.`,
    });
  }

  if (!inTitle && count > 0) {
    issues.push({
      type: 'info',
      code: 'keyword-not-in-title',
      message: `Target keyword "${keyword}" not found in the title.`,
    });
  }

  if (!inFirstParagraph && count > 0) {
    issues.push({
      type: 'info',
      code: 'keyword-not-in-intro',
      message: `Target keyword "${keyword}" not found in the first paragraph.`,
    });
  }

  if (!inHeadings && count > 0) {
    issues.push({
      type: 'info',
      code: 'keyword-not-in-headings',
      message: `Target keyword "${keyword}" not found in any heading.`,
    });
  }

  return { keyword, density, count, inTitle, inFirstParagraph, inHeadings, distribution, issues };
}

export function analyzeKeywords(
  text: string,
  keywords: string[],
  title: string,
  headings: string[],
): KeywordResult[] {
  return keywords.map((kw) => analyzeKeyword(text, kw, title, headings));
}
