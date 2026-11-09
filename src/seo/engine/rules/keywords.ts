import type { Issue, Rule } from '../types';
import { firstH1, intro, textblocks } from '../blocks';
import { countWords } from '../text';

/** Case-insensitive whole-word match ("react" does not match "reactive"), any script. */
export function keywordPattern(keyword: string): RegExp {
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu');
}

const countMatches = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;

/** Where each target keyword appears, and whether it is overused. */
export const keywordRule: Rule = (doc, ctx) => {
  const issues: Issue[] = [];
  const paragraphs = textblocks(doc, 'paragraph');
  const body = paragraphs.map((p) => p.text).join('\n');
  const totalWords = countWords(body, ctx.locale);
  const firstParagraph = intro(doc);
  const h1 = firstH1(doc);
  const title = ctx.meta?.title?.trim() || h1?.text || '';
  const subheadings = textblocks(doc, 'heading').filter((h) => h.node.attrs.level !== 1);

  for (const keyword of ctx.keywords.map((k) => k.trim()).filter(Boolean)) {
    const pattern = keywordPattern(keyword);
    const count = countMatches(body, pattern);
    const id = (code: string) => `${code}:${keyword.toLowerCase()}`;

    if (count === 0) {
      issues.push({
        id: id('keyword-missing'),
        code: 'keyword-missing',
        severity: 'warning',
        params: { keyword },
        range: firstParagraph?.content,
        fix: firstParagraph ? 'ai-rewrite' : 'manual',
      });
      continue;
    }

    if (firstParagraph && !countMatches(firstParagraph.text, pattern)) {
      issues.push({
        id: id('keyword-not-in-intro'),
        code: 'keyword-not-in-intro',
        severity: 'info',
        params: { keyword },
        range: firstParagraph.content,
        fix: 'ai-rewrite',
      });
    }
    if (title && !countMatches(title, pattern)) {
      issues.push({
        id: id('keyword-not-in-title'),
        code: 'keyword-not-in-title',
        severity: 'info',
        params: { keyword },
        range: ctx.meta?.title?.trim() ? undefined : h1?.content,
        fix: 'ai-title',
      });
    }
    if (subheadings.length && !subheadings.some((h) => countMatches(h.text, pattern))) {
      issues.push({ id: id('keyword-not-in-headings'), code: 'keyword-not-in-headings', severity: 'info', params: { keyword }, fix: 'manual' });
    }

    const density = totalWords ? count / totalWords : 0;
    const { min, max } = ctx.rules.keywordDensity;
    if (density > max || density < min) {
      issues.push({
        id: id('keyword-density'),
        code: 'keyword-density',
        severity: density > max ? 'warning' : 'info',
        params: { keyword, percent: Number((density * 100).toFixed(1)), min: min * 100, max: max * 100 },
        fix: 'manual',
      });
    }
  }
  return issues;
};
