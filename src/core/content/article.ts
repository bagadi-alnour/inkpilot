import type { Node as PMNode } from '@tiptap/pm/model';

export interface ArticleSummary {
  /** Text of the first H1, or empty. */
  title: string;
  /** Heading texts in document order. */
  outline: string[];
  /** Plain text of the body (not headings), trimmed to `maxExcerpt` characters. */
  excerpt: string;
}

/** What metadata suggestions need to know about a document, without sending all of it. */
export function summarizeArticle(doc: PMNode, maxExcerpt = 1_500): ArticleSummary {
  let title = '';
  const outline: string[] = [];
  const body: string[] = [];
  doc.descendants((node) => {
    if (node.type.name === 'heading') {
      const text = node.textContent.trim();
      if (!title && node.attrs.level === 1) title = text;
      if (text) outline.push(text);
      return false;
    }
    if (node.isTextblock) {
      const text = node.textContent.trim();
      if (text) body.push(text);
      return false;
    }
    return true;
  });
  return { title, outline, excerpt: body.join('\n').slice(0, maxExcerpt) };
}
