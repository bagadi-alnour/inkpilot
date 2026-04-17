import { describe, it, expect } from 'vitest';
import { computeDiff, hasMeaningfulDiff, getDiffStats } from '../../src/ai/diff';

describe('computeDiff', () => {
  it('returns equal segments for identical strings', () => {
    const result = computeDiff('hello', 'hello');
    expect(result).toEqual([{ type: 'equal', text: 'hello' }]);
  });

  it('detects insertions', () => {
    const result = computeDiff('hello', 'hello world');
    expect(result.some((s) => s.type === 'insert')).toBe(true);
  });

  it('detects deletions', () => {
    const result = computeDiff('hello world', 'hello');
    expect(result.some((s) => s.type === 'delete')).toBe(true);
  });

  it('detects replacements', () => {
    const result = computeDiff('The cat sat', 'The dog sat');
    expect(result.some((s) => s.type === 'insert')).toBe(true);
    expect(result.some((s) => s.type === 'delete')).toBe(true);
  });
});

describe('hasMeaningfulDiff', () => {
  it('returns false for identical strings', () => {
    const segments = computeDiff('hello', 'hello');
    expect(hasMeaningfulDiff(segments)).toBe(false);
  });

  it('returns true for different strings', () => {
    const segments = computeDiff('hello', 'world');
    expect(hasMeaningfulDiff(segments)).toBe(true);
  });
});

describe('getDiffStats', () => {
  it('counts insertions and deletions', () => {
    const segments = computeDiff('cat', 'dog');
    const stats = getDiffStats(segments);
    expect(stats.insertions).toBeGreaterThan(0);
    expect(stats.deletions).toBeGreaterThan(0);
  });
});
