import { describe, it, expect, afterEach } from 'vitest';
import type { Editor } from '@tiptap/core';
import { Slice } from '@tiptap/pm/model';
import { restrictedHtmlToFragment } from '../../src/core/content/restricted-html';
import { resolveTarget, targetContent, targetToRestrictedHtml, validateProposal } from '../../src/core/content/proposal';
import type { RewriteTarget } from '../../src/core/content/proposal';
import { createTestEditor } from '../helpers/editor';

// G1: content preservation. Serialization must be lossless for every supported
// selection; model output is validated; formatting inside rewritten words is the
// user's call in review, so it is not asserted here.

const DOC = `
  <h1>Title here</h1>
  <p>Plain <strong>bold words</strong> and <em>italic</em> and <u>under</u> and <s>strike</s> and <code>code()</code> end.</p>
  <p>A <a href="https://example.com">link text here</a> then <mark>highlighted</mark> then <span style="color: #ff0000">red text</span>.</p>
  <p><strong><em>bold italic</em></strong> nested and <strong>bold bold <a href="https://x.dev">bold link</a> more</strong>.</p>
  <h2>Second heading</h2>
  <p style="text-align: center">Centered paragraph text.</p>
  <p>Second para one. Second para two.</p>
`;

let editor: Editor;
afterEach(() => editor?.destroy());

function pos(needle: string, after = 0): number {
  let found = -1;
  editor.state.doc.descendants((node, p) => {
    if (found >= 0 || !node.isText) return;
    let i = node.text!.indexOf(needle);
    while (i >= 0 && p + i < after) i = node.text!.indexOf(needle, i + 1);
    if (i >= 0) found = p + i;
  });
  if (found < 0) throw new Error(`not found: ${needle}`);
  return found;
}
const inline = (a: string, b: string): [number, number] => {
  const from = pos(a);
  return [from, pos(b, from) + b.length];
};
const blocks = (a: string, b: string): [number, number] => {
  const $a = editor.state.doc.resolve(pos(a));
  const $b = editor.state.doc.resolve(pos(b, $a.pos));
  return [$a.before(1), $b.after(1)];
};

const CASES: Record<string, () => [number, number]> = {
  'partial plain': () => inline('Plain', 'and'),
  'starts inside bold': () => inline('words', 'italic'),
  'ends inside bold': () => inline('Plain', 'bold'),
  'inside bold only': () => inline('bold', 'bold'),
  underline: () => inline('under', 'under'),
  strike: () => inline('strike', 'strike'),
  'inline code': () => inline('code()', 'end.'),
  'link fully inside': () => inline('A ', 'then'),
  'link cut at start': () => inline('text here', 'then'),
  highlight: () => inline('highlighted', 'then'),
  'text color': () => inline('red', 'text'),
  'nested bold italic': () => inline('bold italic', 'nested'),
  'link inside bold': () => inline('bold bold', 'more'),
  'whole paragraph content': () => inline('Second para one', 'two.'),
  'two whole paragraphs': () => blocks('Plain', 'A '),
  'heading + centered paragraph': () => blocks('Second heading', 'Centered'),
  'centered paragraph': () => blocks('Centered', 'Centered'),
};

describe('restricted HTML round trip (G1: lossless serialization)', () => {
  for (const [name, range] of Object.entries(CASES)) {
    it(name, () => {
      editor = createTestEditor(DOC);
      const [from, to] = range();
      const resolved = resolveTarget(editor.state.doc, from, to);
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) return;

      const html = targetToRestrictedHtml(editor.state.doc, resolved.target);
      const back = restrictedHtmlToFragment(editor.schema, html);
      expect(back.rejection).toBeNull();
      expect(back.fragment.toJSON()).toEqual(targetContent(editor.state.doc, resolved.target).toJSON());
    });
  }

  it('leaves everything outside the target identical after replacing it', () => {
    editor = createTestEditor(DOC);
    const [from, to] = inline('Second para one', 'two.');
    const target: RewriteTarget = { from, to, kind: 'inline' };
    const result = validateProposal(editor.state.doc, target, restrictedHtmlToFragment(editor.schema, '<p>Rewritten <em>text</em>.</p>'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const before = editor.state.doc;
    const after = before.replace(from, to, new Slice(result.content, 0, 0));
    const delta = after.content.size - before.content.size;
    expect(after.slice(0, from).content.toJSON()).toEqual(before.slice(0, from).content.toJSON());
    expect(after.slice(to + delta).content.toJSON()).toEqual(before.slice(to).content.toJSON());
  });
});

describe('resolveTarget', () => {
  it('refuses code blocks and ranges that cut across block structure', () => {
    editor = createTestEditor('<p>One two</p><pre><code>const a = 1;</code></pre><ul><li><p>item</p></li></ul>');
    const code = pos('const');
    expect(resolveTarget(editor.state.doc, code, code + 5).ok).toBe(false);
    expect(resolveTarget(editor.state.doc, pos('two'), pos('item') + 2).ok).toBe(false);
  });
});

describe('validateProposal', () => {
  const html = (h: string) => restrictedHtmlToFragment(editor.schema, h);
  const target = (): RewriteTarget => {
    const [from, to] = inline('Second para one', 'two.');
    return { from, to, kind: 'inline' };
  };

  it('accepts a clean single paragraph for an inline target', () => {
    editor = createTestEditor(DOC);
    expect(validateProposal(editor.state.doc, target(), html('<p>Shorter one. Shorter two.</p>')).ok).toBe(true);
  });

  it('rejects javascript: links', () => {
    editor = createTestEditor(DOC);
    const result = validateProposal(editor.state.doc, target(), html('<p>Click <a href="javascript:alert(1)">here</a>.</p>'));
    expect(result).toMatchObject({ ok: false });
  });

  it('rejects disallowed elements such as images and scripts', () => {
    editor = createTestEditor(DOC);
    expect(validateProposal(editor.state.doc, target(), html('<p>Text <img src="x" onerror="alert(1)"></p>')).ok).toBe(false);
    expect(validateProposal(editor.state.doc, target(), html('<p>Text</p><script>alert(1)</script>')).ok).toBe(false);
  });

  it('rejects empty output and block output into an inline position', () => {
    editor = createTestEditor(DOC);
    expect(validateProposal(editor.state.doc, target(), html('<p>   </p>')).ok).toBe(false);
    expect(validateProposal(editor.state.doc, target(), html('<p>One.</p><p>Two.</p>')).ok).toBe(false);
  });

  it('never turns script contents into document text', () => {
    editor = createTestEditor(DOC);
    const parsed = html('<p>Safe</p><script>alert(1)</script>');
    expect(parsed.fragment.textBetween(0, parsed.fragment.size)).toBe('Safe');
  });
});
