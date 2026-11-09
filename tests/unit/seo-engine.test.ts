import { describe, it, expect, afterEach } from 'vitest';
import type { Editor } from '@tiptap/core';
import { analyzeDocument, computeScore, DEFAULT_RULE_OPTIONS, keywordPattern } from '../../src/seo/engine';
import type { AnalyzeContext, Issue, IssueCode } from '../../src/seo/engine';
import { createTestEditor, LONG_PARAGRAPH, SHORT_PARAGRAPH } from '../helpers/editor';

let editor: Editor;
afterEach(() => editor?.destroy());

const ctx = (overrides: Partial<AnalyzeContext> = {}): AnalyzeContext => ({
  locale: 'en',
  keywords: [],
  rules: DEFAULT_RULE_OPTIONS,
  ...overrides,
});

function analyze(html: string, overrides: Partial<AnalyzeContext> = {}) {
  editor = createTestEditor(html);
  return analyzeDocument(editor.state.doc, ctx(overrides));
}
const codes = (issues: Issue[]) => issues.map((i) => i.code).sort();
const find = (issues: Issue[], code: IssueCode) => issues.find((i) => i.code === code);
const textAt = (issue: Issue | undefined) => editor.state.doc.textBetween(issue!.range!.from, issue!.range!.to);

const TITLE = '<h1>How we cut our Next.js build time in half</h1>';

describe('structure and title rules', () => {
  it('reports a missing title as the only error', () => {
    const { issues } = analyze(`<p>${SHORT_PARAGRAPH}</p>`);
    expect(find(issues, 'missing-title')).toMatchObject({ severity: 'error' });
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(1);
  });

  it('accepts an SEO title from metadata instead of an H1', () => {
    const { issues } = analyze(`<p>${SHORT_PARAGRAPH}</p>`, { meta: { title: 'How we cut our Next.js build time in half' } });
    expect(find(issues, 'missing-title')).toBeUndefined();
  });

  it('points at the extra H1 and the skipped heading', () => {
    const { issues } = analyze(`${TITLE}<h1>Another title</h1><h3>Deep heading</h3>`);
    expect(textAt(find(issues, 'multiple-h1'))).toBe('Another title');
    expect(find(issues, 'heading-skip')).toMatchObject({ params: { level: 3, previous: 1, expected: 2 } });
    expect(textAt(find(issues, 'heading-skip'))).toBe('Deep heading');
  });

  it('treats title length as configurable guidance', () => {
    const short = analyze('<h1>Build times</h1>');
    expect(find(short.issues, 'title-length')).toMatchObject({ severity: 'info', fix: 'ai-title', params: { length: 11, min: 30, max: 60 } });
    const relaxed = analyze('<h1>Build times</h1>', { rules: { ...DEFAULT_RULE_OPTIONS, titleLength: { min: 5, max: 60 } } });
    expect(find(relaxed.issues, 'title-length')).toBeUndefined();
  });

  it('flags generic titles', () => {
    expect(find(analyze('<h1>Untitled</h1>').issues, 'generic-title')).toBeDefined();
  });
});

describe('metadata and images', () => {
  it('checks the description only when metadata is provided', () => {
    expect(find(analyze(TITLE).issues, 'description-missing')).toBeUndefined();
    expect(find(analyze(TITLE, { meta: {} }).issues, 'description-missing')).toMatchObject({ fix: 'ai-description' });
    expect(find(analyze(TITLE, { meta: { description: 'Too short.' } }).issues, 'description-length')).toMatchObject({ params: { length: 10 } });
  });

  it('flags images without alt text with the image as the range', () => {
    const { issues } = analyze(`${TITLE}<img src="https://cdn.example.com/chart.png"><img src="https://cdn.example.com/b.png" alt="Build time chart by week">`);
    const missing = issues.filter((i) => i.code === 'alt-missing');
    expect(missing).toHaveLength(1);
    expect(editor.state.doc.nodeAt(missing[0].range!.from)?.attrs.src).toBe('https://cdn.example.com/chart.png');
  });
});

describe('readability rules', () => {
  it('flags the long sentence with the paragraph content as the range', () => {
    const { issues } = analyze(`${TITLE}<p>${SHORT_PARAGRAPH}</p><p>${LONG_PARAGRAPH}</p>`);
    const issue = find(issues, 'long-sentence');
    expect(issue).toMatchObject({ severity: 'warning', fix: 'ai-rewrite', params: { limit: 25 } });
    expect(Number(issue!.params.words)).toBeGreaterThan(25);
    expect(textAt(issue)).toBe(LONG_PARAGRAPH);
  });

  it('flags dense paragraphs on the whole block so the fix can split it', () => {
    const dense = Array.from({ length: 7 }, (_, i) => `Sentence number ${i + 1} is short.`).join(' ');
    const { issues } = analyze(`${TITLE}<p>${dense}</p>`);
    const issue = find(issues, 'dense-paragraph');
    expect(issue).toMatchObject({ params: { sentences: 7, limit: 5 } });
    expect(editor.state.doc.nodeAt(issue!.range!.from)?.type.name).toBe('paragraph');
  });

  it('segments non-English text', () => {
    const german = 'Wir haben zuerst gemessen, wohin die Zeit ging. Danach war alles klar.';
    const rules = (max: number) => ({ ...DEFAULT_RULE_OPTIONS, maxSentenceWords: max });
    expect(find(analyze(`<p>${german}</p>`, { locale: 'de', rules: rules(8) }).issues, 'long-sentence')).toBeUndefined();
    expect(find(analyze(`<p>${german}</p>`, { locale: 'de', rules: rules(5) }).issues, 'long-sentence')).toBeDefined();
  });

  it('only scores reading ease for English', () => {
    const hard = Array.from({ length: 12 }, () => 'Organizational infrastructural considerations notwithstanding, interdepartmental communication necessitates comprehensive documentation.').join(' ');
    expect(find(analyze(`<p>${hard}</p>`).issues, 'hard-to-read')).toBeDefined();
    expect(find(analyze(`<p>${hard}</p>`, { locale: 'fr' }).issues, 'hard-to-read')).toBeUndefined();
  });

  it('ignores code blocks and headings', () => {
    const { issues } = analyze(`<h2>${LONG_PARAGRAPH}</h2><pre><code>${LONG_PARAGRAPH}</code></pre>`);
    expect(find(issues, 'long-sentence')).toBeUndefined();
  });
});

describe('keyword rules', () => {
  it('matches whole words only, in any script', () => {
    expect('Use React today'.match(keywordPattern('react'))).toHaveLength(1);
    expect('A reactive system'.match(keywordPattern('react'))).toBeNull();
    expect('Next.js build time matters'.match(keywordPattern('next.js  build time'))).toHaveLength(1);
    expect('جرّب المحرر الجديد'.match(keywordPattern('المحرر'))).toHaveLength(1);
  });

  it('points a missing keyword at the introduction for an AI fix', () => {
    const { issues } = analyze(`${TITLE}<p>${SHORT_PARAGRAPH}</p>`, { keywords: ['ci pipeline'] });
    const issue = find(issues, 'keyword-missing');
    expect(issue).toMatchObject({ fix: 'ai-rewrite', params: { keyword: 'ci pipeline' } });
    expect(textAt(issue)).toBe(SHORT_PARAGRAPH);
  });

  it('reports where a used keyword is missing', () => {
    const { issues } = analyze(`${TITLE}<p>${SHORT_PARAGRAPH}</p><h2>Results</h2><p>Our workflow file now runs in four minutes.</p>`, {
      keywords: ['workflow file'],
    });
    expect(codes(issues)).toEqual(expect.arrayContaining(['keyword-not-in-title', 'keyword-not-in-headings']));
    expect(find(issues, 'keyword-not-in-intro')).toBeUndefined();
    expect(find(issues, 'keyword-not-in-title')).toMatchObject({ fix: 'ai-title' });
  });

  it('warns about overuse', () => {
    const stuffed = Array.from({ length: 10 }, () => 'Build time matters for build time.').join(' ');
    expect(find(analyze(`${TITLE}<p>${stuffed}</p>`, { keywords: ['build time'] }).issues, 'keyword-density')).toMatchObject({ severity: 'warning' });
  });
});

describe('ids and score', () => {
  it('reports nothing for an empty document', () => {
    expect(analyze('<p></p>', { keywords: ['build time'], meta: {} })).toEqual({ issues: [], score: 100 });
  });

  it('keeps the same id while the text is unchanged, so ignoring sticks', () => {
    editor = createTestEditor(`${TITLE}<p>${LONG_PARAGRAPH}</p>`);
    const first = find(analyzeDocument(editor.state.doc, ctx()).issues, 'long-sentence')!;
    editor.commands.insertContentAt(editor.state.doc.content.size, '<p>Outro.</p>');
    expect(find(analyzeDocument(editor.state.doc, ctx()).issues, 'long-sentence')!.id).toBe(first.id);
    expect(find(analyzeDocument(editor.state.doc, ctx(), new Set([first.id])).issues, 'long-sentence')).toBeUndefined();
  });

  it('starts at 100 and caps the penalty one repeated code can cause', () => {
    const issue = (severity: Issue['severity']): Issue => ({ id: Math.random().toString(), code: 'long-sentence', severity, params: {} });
    expect(computeScore([])).toBe(100);
    expect(computeScore([issue('warning')])).toBe(92);
    expect(computeScore(Array.from({ length: 10 }, () => issue('warning')))).toBe(76);
  });
});
