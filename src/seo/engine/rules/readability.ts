import type { Issue, Rule } from '../types';
import { textblocks } from '../blocks';
import { countWords, fleschReadingEase, hashText, splitSentences } from '../text';

/** Per paragraph: the longest sentence and the number of sentences. */
export const readabilityRule: Rule = (doc, ctx) => {
  const issues: Issue[] = [];
  const { maxSentenceWords, maxParagraphSentences } = ctx.rules;

  for (const paragraph of textblocks(doc, 'paragraph')) {
    if (!paragraph.text.trim()) continue;
    const sentences = splitSentences(paragraph.text, ctx.locale);
    const longest = Math.max(0, ...sentences.map((s) => countWords(s, ctx.locale)));
    if (longest > maxSentenceWords) {
      issues.push({
        id: `long-sentence:${hashText(paragraph.text)}`,
        code: 'long-sentence',
        severity: 'warning',
        params: { words: longest, limit: maxSentenceWords },
        range: paragraph.content,
        fix: 'ai-rewrite',
      });
    }
    if (sentences.length > maxParagraphSentences) {
      issues.push({
        id: `dense-paragraph:${hashText(paragraph.text)}`,
        code: 'dense-paragraph',
        severity: 'info',
        params: { sentences: sentences.length, limit: maxParagraphSentences },
        // Whole block, so the fix may split it into several paragraphs.
        range: paragraph.block,
        fix: 'ai-rewrite',
      });
    }
  }
  return issues;
};

/** Document-level reading ease. Flesch is calibrated for English only. */
export const readingEaseRule: Rule = (doc, ctx) => {
  if (!ctx.locale.toLowerCase().startsWith('en')) return [];
  const text = textblocks(doc, 'paragraph').map((p) => p.text).join('\n');
  if (countWords(text, ctx.locale) < 100) return [];
  const ease = Math.round(fleschReadingEase(text, ctx.locale));
  return ease < ctx.rules.minReadingEase
    ? [{ id: 'hard-to-read', code: 'hard-to-read', severity: 'info', params: { score: ease, target: ctx.rules.minReadingEase } }]
    : [];
};
