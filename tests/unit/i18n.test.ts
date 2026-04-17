import { describe, it, expect } from 'vitest';
import { createI18nValue } from '../../src/i18n/context';
import { formatReadingTime, formatWordCount } from '../../src/i18n/format';

describe('createI18nValue', () => {
  it('returns default strings', () => {
    const i18n = createI18nValue('en');
    expect(i18n.t('toolbar.bold')).toBe('Bold');
    expect(i18n.t('ai.rewrite')).toBe('Rewrite with AI');
  });

  it('merges overrides', () => {
    const i18n = createI18nValue('en', { 'toolbar.bold': 'Fett' });
    expect(i18n.t('toolbar.bold')).toBe('Fett');
    expect(i18n.t('toolbar.italic')).toBe('Italic');
  });

  it('returns key for unknown translations', () => {
    const i18n = createI18nValue('en');
    expect(i18n.locale).toBe('en');
  });
});

describe('formatReadingTime', () => {
  it('returns empty for 0 minutes', () => {
    expect(formatReadingTime(0, 'en')).toBe('');
  });

  it('returns singular for 1 minute', () => {
    expect(formatReadingTime(1, 'en')).toBe('1 min read');
  });

  it('returns plural for multiple minutes', () => {
    expect(formatReadingTime(5, 'en')).toBe('5 min read');
  });
});

describe('formatWordCount', () => {
  it('returns singular for 1 word', () => {
    expect(formatWordCount(1, 'en')).toBe('1 word');
  });

  it('returns plural for multiple words', () => {
    expect(formatWordCount(100, 'en')).toBe('100 words');
  });
});
