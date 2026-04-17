import { describe, it, expect } from 'vitest';
import { computeSEOScore } from '../../src/seo/scoring';

describe('computeSEOScore', () => {
  it('returns 100 for no issues', () => {
    const score = computeSEOScore(
      [],
      { averageSentenceLength: 15, averageParagraphSentences: 3, fleschKincaidGrade: 8, fleschReadingEase: 70, issues: [] },
      [],
    );
    expect(score).toBe(100);
  });

  it('deducts for errors', () => {
    const score = computeSEOScore(
      [{ type: 'error', code: 'test', message: 'Error' }],
      { averageSentenceLength: 15, averageParagraphSentences: 3, fleschKincaidGrade: 8, fleschReadingEase: 70, issues: [] },
      [],
    );
    expect(score).toBeLessThan(100);
  });

  it('never goes below 0', () => {
    const manyErrors = Array.from({ length: 20 }, () => ({
      type: 'error' as const,
      code: 'test',
      message: 'Error',
    }));
    const score = computeSEOScore(
      manyErrors,
      { averageSentenceLength: 30, averageParagraphSentences: 8, fleschKincaidGrade: 15, fleschReadingEase: 20, issues: manyErrors },
      [],
    );
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('never exceeds 100', () => {
    const keywords = [
      { keyword: 'test', density: 0.02, count: 5, inTitle: true, inFirstParagraph: true, inHeadings: true, distribution: 0.8, issues: [] },
    ];
    const score = computeSEOScore(
      [],
      { averageSentenceLength: 15, averageParagraphSentences: 3, fleschKincaidGrade: 8, fleschReadingEase: 70, issues: [] },
      keywords,
    );
    expect(score).toBeLessThanOrEqual(100);
  });
});
