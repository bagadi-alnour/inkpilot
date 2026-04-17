import { describe, it, expect } from 'vitest';
import { buildRewritePrompt, buildTitleSuggestionPrompt, buildMetaSuggestionPrompt } from '../../src/ai/prompts';

describe('buildRewritePrompt', () => {
  it('includes selected text', () => {
    const prompt = buildRewritePrompt({
      selectedText: 'The quick brown fox',
      surroundingBefore: 'Before text.',
      surroundingAfter: 'After text.',
      tone: 'formal',
      intent: 'simplify',
      preserveMeaning: true,
    });

    expect(prompt).toContain('The quick brown fox');
    expect(prompt).toContain('Before text.');
    expect(prompt).toContain('After text.');
    expect(prompt).toContain('formal');
    expect(prompt).toContain('simplify');
    expect(prompt).toContain('Preserve the original meaning');
  });

  it('omits preserve meaning when false', () => {
    const prompt = buildRewritePrompt({
      selectedText: 'Test',
      surroundingBefore: '',
      surroundingAfter: '',
      tone: 'casual',
      intent: 'expand',
      preserveMeaning: false,
    });

    expect(prompt).not.toContain('Preserve the original meaning');
  });
});

describe('buildTitleSuggestionPrompt', () => {
  it('includes content excerpt', () => {
    const prompt = buildTitleSuggestionPrompt('This is article content about testing.');
    expect(prompt).toContain('This is article content about testing.');
  });

  it('truncates to 500 chars', () => {
    const longContent = 'a'.repeat(1000);
    const prompt = buildTitleSuggestionPrompt(longContent);
    expect(prompt).toContain('a'.repeat(500));
    expect(prompt).not.toContain('a'.repeat(501));
  });
});

describe('buildMetaSuggestionPrompt', () => {
  it('includes content', () => {
    const prompt = buildMetaSuggestionPrompt('Test content for meta description.');
    expect(prompt).toContain('Test content for meta description.');
  });
});
