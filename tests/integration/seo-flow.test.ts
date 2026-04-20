import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { computeSignals } from '@inkpilot/core';
import { analyzeContent } from '@inkpilot/seo';

/** Light SEO signals are produced by `computeSignals` (document-level heading/alt checks). */
describe('SEO light signals (computeSignals)', () => {
  it('returns missing-h1 when no H1 is present but the document has text', () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: '<p>Some body content without a top-level heading.</p>',
    });

    const signals = computeSignals(editor.state.doc);
    expect(signals.some((s) => s.type === 'missing-h1')).toBe(true);

    editor.destroy();
  });

  it('returns heading-hierarchy when heading levels skip a step', () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: '<h1>Title</h1><h3>Skipped H2</h3><p>Paragraph.</p>',
    });

    const signals = computeSignals(editor.state.doc);
    expect(signals.some((s) => s.type === 'heading-hierarchy')).toBe(true);

    editor.destroy();
  });
});

describe('analyzeContent integration', () => {
  it('combines structural issues, readability, and keyword analysis', async () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content:
        '<h1>Keyword Title Here</h1><p>This is the first paragraph with Keyword Title Here repeated for testing.</p>',
    });

    const analysis = await analyzeContent(editor, {
      targetKeywords: ['Keyword Title Here'],
    });

    expect(analysis.issues.length).toBeGreaterThan(0);
    expect(analysis.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score).toBeLessThanOrEqual(100);

    editor.destroy();
  });

  it('produces SEO score in the 0–100 range', async () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: '<p>Short.</p>',
    });

    const analysis = await analyzeContent(editor, {});

    expect(Number.isFinite(analysis.score)).toBe(true);
    expect(analysis.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score).toBeLessThanOrEqual(100);

    editor.destroy();
  });
});
