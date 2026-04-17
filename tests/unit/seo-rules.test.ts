import { describe, it, expect } from 'vitest';
import { analyzeHeadings } from '../../src/seo/rules/heading';
import { analyzeTitle } from '../../src/seo/rules/title';
import { analyzeAltTexts } from '../../src/seo/rules/alt-text';
import { analyzeReadability } from '../../src/seo/rules/readability';
import { analyzeKeyword } from '../../src/seo/rules/keyword';
import { analyzeMetaDescription } from '../../src/seo/rules/meta';

describe('analyzeHeadings', () => {
  it('flags missing H1', () => {
    const issues = analyzeHeadings([
      { level: 2, text: 'Section', from: 0, to: 10 },
    ]);
    expect(issues.some((i) => i.code === 'missing-h1')).toBe(true);
  });

  it('flags multiple H1s', () => {
    const issues = analyzeHeadings([
      { level: 1, text: 'First', from: 0, to: 10 },
      { level: 1, text: 'Second', from: 11, to: 20 },
    ]);
    expect(issues.some((i) => i.code === 'multiple-h1')).toBe(true);
  });

  it('flags heading hierarchy skip', () => {
    const issues = analyzeHeadings([
      { level: 1, text: 'Title', from: 0, to: 10 },
      { level: 3, text: 'Subsection', from: 11, to: 20 },
    ]);
    expect(issues.some((i) => i.code === 'heading-skip')).toBe(true);
  });

  it('passes valid structure', () => {
    const issues = analyzeHeadings([
      { level: 1, text: 'Title', from: 0, to: 10 },
      { level: 2, text: 'Section', from: 11, to: 20 },
      { level: 3, text: 'Sub', from: 21, to: 30 },
    ]);
    expect(issues).toHaveLength(0);
  });
});

describe('analyzeTitle', () => {
  it('flags missing title', () => {
    const issues = analyzeTitle('');
    expect(issues.some((i) => i.code === 'missing-title')).toBe(true);
  });

  it('flags short title', () => {
    const issues = analyzeTitle('Short');
    expect(issues.some((i) => i.code === 'short-title')).toBe(true);
  });

  it('flags long title', () => {
    const issues = analyzeTitle('A'.repeat(65));
    expect(issues.some((i) => i.code === 'long-title')).toBe(true);
  });

  it('flags generic title', () => {
    const issues = analyzeTitle('Untitled');
    expect(issues.some((i) => i.code === 'generic-title')).toBe(true);
  });
});

describe('analyzeAltTexts', () => {
  it('flags empty alt text', () => {
    const issues = analyzeAltTexts([{ alt: '', src: 'test.jpg', from: 0, to: 10 }]);
    expect(issues.some((i) => i.code === 'empty-alt')).toBe(true);
  });

  it('passes good alt text', () => {
    const issues = analyzeAltTexts([
      { alt: 'A golden retriever playing in the park', src: 'dog.jpg', from: 0, to: 10 },
    ]);
    expect(issues).toHaveLength(0);
  });
});

describe('analyzeReadability', () => {
  it('returns readability scores', () => {
    const text = 'This is a test. It has short sentences. The reading level should be easy.';
    const result = analyzeReadability(text);
    expect(result.averageSentenceLength).toBeGreaterThan(0);
    expect(result.fleschReadingEase).toBeGreaterThan(0);
  });
});

describe('analyzeKeyword', () => {
  it('detects keyword presence', () => {
    const result = analyzeKeyword(
      'This article about testing explains how to test software effectively.',
      'testing',
      'Testing Guide',
      ['Testing Best Practices'],
    );
    expect(result.count).toBeGreaterThan(0);
    expect(result.inTitle).toBe(true);
    expect(result.inHeadings).toBe(true);
  });

  it('flags missing keyword', () => {
    const result = analyzeKeyword('This article has no relevant words.', 'react', 'Title', ['Heading']);
    expect(result.count).toBe(0);
    expect(result.issues.some((i) => i.code === 'keyword-missing')).toBe(true);
  });
});

describe('analyzeMetaDescription', () => {
  it('flags missing meta', () => {
    const issues = analyzeMetaDescription(undefined);
    expect(issues.some((i) => i.code === 'missing-meta')).toBe(true);
  });

  it('flags short meta', () => {
    const issues = analyzeMetaDescription('Too short.');
    expect(issues.some((i) => i.code === 'short-meta')).toBe(true);
  });
});
