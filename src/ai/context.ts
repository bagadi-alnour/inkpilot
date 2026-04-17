import type { Editor } from '@tiptap/core';
import type { HeadingNode } from '@writeflow/types';

export function getSurroundingContext(
  editor: Editor,
  from: number,
  to: number,
  windowSize = 500,
): { before: string; after: string } {
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n', '\n');
  const textBefore = editor.state.doc.textBetween(0, from, '\n', '\n');
  const textAfter = editor.state.doc.textBetween(to, editor.state.doc.content.size, '\n', '\n');

  return {
    before: textBefore.slice(-windowSize),
    after: textAfter.slice(0, windowSize),
  };
}

export function getSelectedText(editor: Editor): string {
  const { from, to } = editor.state.selection;
  if (from === to) return '';
  return editor.state.doc.textBetween(from, to, '\n', '\n');
}

export function getHeadingStructure(editor: Editor): HeadingNode[] {
  const headings: HeadingNode[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        level: node.attrs.level as number,
        text: node.textContent,
        from: pos,
        to: pos + node.nodeSize,
        children: [],
      });
    }
  });

  return buildHeadingTree(headings);
}

function buildHeadingTree(flatHeadings: HeadingNode[]): HeadingNode[] {
  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  for (const heading of flatHeadings) {
    const node: HeadingNode = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}
