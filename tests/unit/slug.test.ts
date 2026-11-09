import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/seo/slug';

describe('slugify', () => {
  it('lowercases, strips accents and joins words with hyphens', () => {
    expect(slugify('How we cut our Next.js build time — in half!')).toBe('how-we-cut-our-next-js-build-time-in-half');
    expect(slugify('Crème brûlée à Paris')).toBe('creme-brulee-a-paris');
  });

  it('keeps letters from other scripts', () => {
    expect(slugify('كيف خفّضنا وقت البناء')).toBe('كيف-خفضنا-وقت-البناء');
  });

  it('cuts long titles on a word boundary', () => {
    expect(slugify('one two three four', 12)).toBe('one-two');
  });
});
