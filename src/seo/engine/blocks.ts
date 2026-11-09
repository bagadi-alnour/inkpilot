import type { Node as PMNode } from '@tiptap/pm/model';

export interface BlockInfo {
  node: PMNode;
  pos: number;
  text: string;
  /** Range of the block's inline content. */
  content: { from: number; to: number };
  /** Range of the whole block node. */
  block: { from: number; to: number };
}

/** Top-level-ish textblocks of a type, skipping code blocks, in document order. */
export function textblocks(doc: PMNode, type: 'paragraph' | 'heading'): BlockInfo[] {
  const found: BlockInfo[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'codeBlock') return false;
    if (node.type.name !== type) return true;
    found.push({
      node,
      pos,
      text: node.textContent,
      content: { from: pos + 1, to: pos + node.nodeSize - 1 },
      block: { from: pos, to: pos + node.nodeSize },
    });
    return false;
  });
  return found;
}

export function firstH1(doc: PMNode): BlockInfo | undefined {
  return textblocks(doc, 'heading').find((h) => h.node.attrs.level === 1 && h.text.trim());
}

/** First paragraph with text: the article's introduction. */
export function intro(doc: PMNode): BlockInfo | undefined {
  return textblocks(doc, 'paragraph').find((p) => p.text.trim());
}
