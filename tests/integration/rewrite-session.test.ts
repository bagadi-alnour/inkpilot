import { describe, it, expect, afterEach } from 'vitest';
import type { Editor } from '@tiptap/core';
import { getRewriteSession } from '../../src/core/extensions/rewrite-session';
import { getSEOReport } from '../../src/core/extensions/seo-report';
import { controlledTransport, createTestEditor, flush, LONG_PARAGRAPH, paragraphRange, SHORT_PARAGRAPH } from '../helpers/editor';

const DOC = `<h1>Build times</h1><p>${LONG_PARAGRAPH}</p><p>${SHORT_PARAGRAPH}</p>`;
const FIXED = '<p>We started by measuring where the time went. Type checking took almost forty percent of it.</p>';

let editor: Editor;
afterEach(() => editor?.destroy());

function setup() {
  const { transport, calls } = controlledTransport();
  editor = createTestEditor(DOC, transport);
  return { calls };
}

async function startFix() {
  const issue = getSEOReport(editor.state).issues.find((i) => i.code === 'long-sentence');
  expect(issue).toBeDefined();
  expect(editor.commands.fixIssue(issue!.id)).toBe(true);
  await flush();
}

const textOf = (needle: string) => editor.state.doc.textBetween(paragraphRange(editor, needle).from, paragraphRange(editor, needle).to);

describe('rewrite session (G2 core loop)', () => {
  it('paragraph issue → fix → streamed preview → done → accept → undo → report updates', async () => {
    const { calls } = setup();
    const longSentences = () => getSEOReport(editor.state).issues.filter((i) => i.code === 'long-sentence');
    expect(longSentences()).toHaveLength(1);
    const scoreBefore = getSEOReport(editor.state).score;
    await startFix();

    expect(calls).toHaveLength(1);
    expect(calls[0].request).toMatchObject({ task: 'fix', issue: { code: 'long-sentence' } });
    expect(calls[0].request.html).toContain('<p>We started by measuring');

    calls[0].push({ type: 'delta', text: FIXED.slice(0, 40) });
    await flush();
    expect(getRewriteSession(editor.state)?.status).toBe('streaming');
    // The document is untouched while streaming.
    expect(textOf('We started')).toBe(LONG_PARAGRAPH);

    calls[0].push({ type: 'delta', text: FIXED.slice(40) });
    calls[0].push({ type: 'done', finishReason: 'stop' });
    await flush();
    expect(getRewriteSession(editor.state)?.status).toBe('ready');

    expect(editor.commands.acceptRewrite()).toBe(true);
    await flush();
    expect(getRewriteSession(editor.state)).toBeNull();
    expect(textOf('We started')).toBe('We started by measuring where the time went. Type checking took almost forty percent of it.');
    expect(longSentences()).toHaveLength(0);
    expect(getSEOReport(editor.state).score).toBeGreaterThan(scoreBefore);

    editor.commands.undo();
    await flush();
    expect(textOf('We started')).toBe(LONG_PARAGRAPH);
    expect(longSentences()).toHaveLength(1);
  });

  it('a stream that closes without done never becomes ready', async () => {
    const { calls } = setup();
    await startFix();
    calls[0].push({ type: 'delta', text: FIXED });
    calls[0].end();
    await flush();
    const session = getRewriteSession(editor.state);
    expect(session?.status).toBe('error');
    expect(session?.error?.code).toBe('incomplete');
    expect(editor.commands.acceptRewrite()).toBe(false);
  });

  it('an error event leaves the proposal failed and not acceptable', async () => {
    const { calls } = setup();
    await startFix();
    calls[0].push({ type: 'delta', text: '<p>Half a sen' });
    calls[0].push({ type: 'error', code: 'truncated', message: 'The response was cut off before it finished.' });
    await flush();
    expect(getRewriteSession(editor.state)?.error?.code).toBe('truncated');
    expect(editor.commands.acceptRewrite()).toBe(false);
  });

  it('invalid output fails validation after done', async () => {
    const { calls } = setup();
    await startFix();
    calls[0].push({ type: 'delta', text: '<p>Read <a href="javascript:alert(1)">this</a>.</p>' });
    calls[0].push({ type: 'done', finishReason: 'stop' });
    await flush();
    expect(getRewriteSession(editor.state)?.error?.code).toBe('invalid-output');
  });

  it('events from a replaced session are ignored and its request is aborted', async () => {
    const { calls } = setup();
    await startFix();
    editor.commands.rejectRewrite();
    await startFix();
    expect(calls[0].signal.aborted).toBe(true);

    calls[0].push({ type: 'delta', text: '<p>stale</p>' });
    calls[0].push({ type: 'done', finishReason: 'stop' });
    await flush();
    const session = getRewriteSession(editor.state);
    expect(session?.status).toBe('streaming');
    expect(session?.html).toBe('');
  });

  it('follows edits before the range and cancels on edits inside it', async () => {
    const { calls } = setup();
    await startFix();
    const before = getRewriteSession(editor.state)!.target;

    editor.commands.insertContentAt(1, 'New ');
    await flush();
    const mapped = getRewriteSession(editor.state)!.target;
    expect(mapped.from).toBe(before.from + 4);
    expect(mapped.to).toBe(before.to + 4);

    editor.commands.insertContentAt(mapped.from + 5, 'X');
    await flush();
    expect(getRewriteSession(editor.state)).toBeNull();
    expect(calls[0].signal.aborted).toBe(true);
  });

  it('accept is its own undo step, even with typing right next to it', async () => {
    // History merges adjacent edits made within 500ms; only closeHistory keeps these apart.
    const { calls } = setup();
    await startFix();
    const start = getRewriteSession(editor.state)!.target.from;
    editor.commands.insertContentAt(start, 'A ');
    calls[0].push({ type: 'delta', text: FIXED });
    calls[0].push({ type: 'done', finishReason: 'stop' });
    await flush();
    editor.commands.acceptRewrite();
    await flush();
    editor.commands.insertContentAt(paragraphRange(editor, 'We started').to, ' B');

    const fixed = 'We started by measuring where the time went. Type checking took almost forty percent of it.';
    expect(textOf('We started')).toBe(`A ${fixed} B`);
    editor.commands.undo();
    expect(textOf('We started')).toBe(`A ${fixed}`);
    editor.commands.undo();
    expect(textOf('We started')).toBe(`A ${LONG_PARAGRAPH}`);
    editor.commands.undo();
    expect(textOf('We started')).toBe(LONG_PARAGRAPH);
  });

  it('Escape rejects and Enter accepts only when ready', async () => {
    const { calls } = setup();
    await startFix();
    const keydown = (key: string) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      editor.view.someProp('handleKeyDown', (f) => f(editor.view, event));
    };

    keydown('Enter');
    expect(getRewriteSession(editor.state)?.status).toBe('streaming');

    calls[0].push({ type: 'delta', text: FIXED });
    calls[0].push({ type: 'done', finishReason: 'stop' });
    await flush();
    keydown('Enter');
    expect(getRewriteSession(editor.state)).toBeNull();
    expect(textOf('We started')).not.toBe(LONG_PARAGRAPH);
  });

  it('rewrites a selection with the chosen tone and intent and reports the outcome', async () => {
    const { transport, calls } = controlledTransport();
    const settled: unknown[] = [];
    editor = createTestEditor(DOC, transport, [], (result) => settled.push(result));
    const { from } = paragraphRange(editor, 'The fix');
    editor.commands.setTextSelection({ from, to: from + 7 });
    expect(editor.commands.rewriteSelection({ tone: 'formal', intent: 'simplify' })).toBe(true);
    await flush();

    expect(calls[0].request).toMatchObject({ task: 'rewrite', tone: 'formal', intent: 'simplify', preserveMeaning: true });
    expect(calls[0].request.html).toBe('<p>The fix</p>');
    calls[0].push({ type: 'delta', text: '<p>The remedy</p>' });
    calls[0].push({ type: 'done', finishReason: 'stop' });
    await flush();
    editor.commands.acceptRewrite();

    expect(textOf('remedy')).toBe('The remedy was two lines in the workflow file.');
    expect(settled).toEqual([{ original: 'The fix', rewritten: 'The remedy', accepted: true, tone: 'formal', intent: 'simplify' }]);
  });

  it('refuses selections it cannot rewrite without losing content', () => {
    const { transport } = controlledTransport();
    editor = createTestEditor('<p>Intro text</p><pre><code>const a = 1;</code></pre>', transport);
    editor.commands.setTextSelection({ from: 3, to: editor.state.doc.content.size - 3 });
    expect(editor.commands.rewriteSelection({ tone: 'casual', intent: 'clarify' })).toBe(false);
  });

  it('fixes a dense paragraph by splitting it into several paragraphs', async () => {
    const { transport, calls } = controlledTransport();
    const dense = Array.from({ length: 7 }, (_, i) => `Sentence ${i + 1} is short.`).join(' ');
    editor = createTestEditor(`<h1>Build times</h1><p>${dense}</p>`, transport);
    const issue = getSEOReport(editor.state).issues.find((i) => i.code === 'dense-paragraph')!;
    expect(editor.commands.fixIssue(issue.id)).toBe(true);
    await flush();

    expect(calls[0].request).toMatchObject({ task: 'fix', issue: { code: 'dense-paragraph' } });
    calls[0].push({ type: 'delta', text: '<p>Sentence 1 is short. Sentence 2 is short.</p><p>Sentence 3 is short.</p>' });
    calls[0].push({ type: 'done', finishReason: 'stop' });
    await flush();
    expect(editor.commands.acceptRewrite()).toBe(true);

    const paragraphs: string[] = [];
    editor.state.doc.forEach((node) => node.type.name === 'paragraph' && paragraphs.push(node.textContent));
    expect(paragraphs).toEqual(['Sentence 1 is short. Sentence 2 is short.', 'Sentence 3 is short.']);
  });

  it('does nothing without a transport', () => {
    editor = createTestEditor(DOC);
    const issue = getSEOReport(editor.state).issues.find((i) => i.code === 'long-sentence')!;
    expect(editor.commands.fixIssue(issue.id)).toBe(false);
  });
});
