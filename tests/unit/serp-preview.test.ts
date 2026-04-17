import { describe, it, expect } from 'vitest';
import { generateSERPPreview } from '../../src/seo/serp-preview';

describe('generateSERPPreview', () => {
  it('returns preview data', () => {
    const preview = generateSERPPreview(
      'How to Build a React App',
      'Learn how to build a React application from scratch with this step-by-step guide.',
      'https://example.com/react-guide',
    );

    expect(preview.title).toBe('How to Build a React App');
    expect(preview.url).toBe('https://example.com/react-guide');
    expect(preview.titleLength).toBe(24);
  });

  it('truncates long title', () => {
    const longTitle = 'A'.repeat(70);
    const preview = generateSERPPreview(longTitle, 'Description');
    expect(preview.title.length).toBeLessThanOrEqual(60);
    expect(preview.title.endsWith('...')).toBe(true);
  });

  it('truncates long description', () => {
    const longDesc = 'B'.repeat(200);
    const preview = generateSERPPreview('Title', longDesc);
    expect(preview.description.length).toBeLessThanOrEqual(160);
    expect(preview.description.endsWith('...')).toBe(true);
  });

  it('handles empty inputs', () => {
    const preview = generateSERPPreview('', '');
    expect(preview.title).toBe('Untitled');
    expect(preview.description).toBe('No description available.');
  });
});
