import { describe, it, expect } from 'vitest';
import { countWords, estimateReadingTime, htmlToText } from '../../src/core/serializers';

describe('countWords', () => {
  it('counts words in a sentence', () => {
    expect(countWords('Hello world foo bar')).toBe(4);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for whitespace only', () => {
    expect(countWords('   ')).toBe(0);
  });

  it('handles multiple spaces between words', () => {
    expect(countWords('hello   world')).toBe(2);
  });

  it('handles newlines', () => {
    expect(countWords('hello\nworld')).toBe(2);
  });
});

describe('estimateReadingTime', () => {
  it('returns 0 for 0 words', () => {
    expect(estimateReadingTime(0)).toBe(0);
  });

  it('returns 1 minute for short text', () => {
    expect(estimateReadingTime(100)).toBe(1);
  });

  it('correctly estimates reading time', () => {
    expect(estimateReadingTime(476)).toBe(2);
  });

  it('rounds up', () => {
    expect(estimateReadingTime(239)).toBe(2);
  });
});

describe('htmlToText', () => {
  it('strips HTML tags', () => {
    expect(htmlToText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('returns empty string for empty input', () => {
    expect(htmlToText('')).toBe('');
  });

  it('falls back to string sanitization when document is unavailable', () => {
    const originalDocument = globalThis.document;

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: undefined,
    });

    try {
      expect(htmlToText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    } finally {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: originalDocument,
      });
    }
  });
});
