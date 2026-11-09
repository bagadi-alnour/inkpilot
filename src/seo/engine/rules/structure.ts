import type { Issue, Rule } from '../types';
import { firstH1, textblocks } from '../blocks';
import { hashText } from '../text';

const GENERIC_TITLES = ['untitled', 'test', 'draft', 'new post', 'blog post', 'article'];

/** Title presence, duplicate H1s and skipped heading levels. */
export const structureRule: Rule = (doc, ctx) => {
  const issues: Issue[] = [];
  const headings = textblocks(doc, 'heading').filter((h) => h.text.trim());
  const h1s = headings.filter((h) => h.node.attrs.level === 1);
  const hasContent = doc.textContent.trim().length > 0;

  if (!h1s.length && !ctx.meta?.title?.trim() && hasContent) {
    issues.push({ id: 'missing-title', code: 'missing-title', severity: 'error', params: {}, fix: 'manual' });
  }

  for (const extra of h1s.slice(1)) {
    issues.push({
      id: `multiple-h1:${hashText(extra.text)}`,
      code: 'multiple-h1',
      severity: 'warning',
      params: { count: h1s.length },
      range: extra.content,
      fix: 'manual',
    });
  }

  for (let i = 1; i < headings.length; i++) {
    const previous = headings[i - 1].node.attrs.level as number;
    const level = headings[i].node.attrs.level as number;
    if (level > previous + 1) {
      issues.push({
        id: `heading-skip:${hashText(headings[i].text)}`,
        code: 'heading-skip',
        severity: 'warning',
        params: { level, previous, expected: previous + 1 },
        range: headings[i].content,
        fix: 'manual',
      });
    }
  }
  return issues;
};

/** Title length and generic titles, on the SEO title or else the H1. */
export const titleRule: Rule = (doc, ctx) => {
  const h1 = firstH1(doc);
  const metaTitle = ctx.meta?.title?.trim();
  const title = metaTitle || h1?.text.trim() || '';
  if (!title) return [];
  const range = metaTitle ? undefined : h1?.content;
  const issues: Issue[] = [];
  const { min, max } = ctx.rules.titleLength;

  if (title.length < min || title.length > max) {
    issues.push({
      id: `title-length:${hashText(title)}`,
      code: 'title-length',
      severity: 'info',
      params: { length: title.length, min, max },
      range,
      fix: 'ai-title',
    });
  }
  const lower = title.toLowerCase();
  if (GENERIC_TITLES.some((word) => lower === word || lower.startsWith(`${word} `))) {
    issues.push({ id: `generic-title:${hashText(title)}`, code: 'generic-title', severity: 'warning', params: {}, range, fix: 'ai-title' });
  }
  return issues;
};

/** Description presence and length; only runs when the host provides metadata. */
export const descriptionRule: Rule = (_doc, ctx) => {
  if (!ctx.meta) return [];
  const description = ctx.meta.description?.trim() ?? '';
  const { min, max } = ctx.rules.descriptionLength;
  if (!description) {
    return [{ id: 'description-missing', code: 'description-missing', severity: 'info', params: { min, max }, fix: 'ai-description' }];
  }
  if (description.length < min || description.length > max) {
    return [
      {
        id: `description-length:${hashText(description)}`,
        code: 'description-length',
        severity: 'info',
        params: { length: description.length, min, max },
        fix: 'ai-description',
      },
    ];
  }
  return [];
};

/** Images without alt text, or with alt text outside the length guidance. */
export const altTextRule: Rule = (doc, ctx) => {
  const issues: Issue[] = [];
  const { min, max } = ctx.rules.altLength;
  doc.descendants((node, pos) => {
    if (node.type.name !== 'image') return true;
    const alt = String(node.attrs.alt ?? '').trim();
    const src = String(node.attrs.src ?? '');
    const range = { from: pos, to: pos + node.nodeSize };
    if (src.startsWith('data:')) {
      issues.push({ id: `inline-image:${hashText(src.slice(0, 200))}`, code: 'inline-image', severity: 'info', params: { kb: Math.round((src.length * 3) / 4 / 1024) }, range, fix: 'manual' });
    }
    if (!alt) {
      issues.push({ id: `alt-missing:${hashText(src)}`, code: 'alt-missing', severity: 'warning', params: {}, range, fix: 'ai-alt' });
    } else if (alt.length < min || alt.length > max) {
      issues.push({
        id: `alt-length:${hashText(src + alt)}`,
        code: 'alt-length',
        severity: 'info',
        params: { length: alt.length, min, max },
        range,
        fix: 'ai-alt',
      });
    }
    return false;
  });
  return issues;
};
