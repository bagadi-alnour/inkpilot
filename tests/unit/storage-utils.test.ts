import { describe, it, expect } from 'vitest';
import { getMimeType, generateStoragePath, validateFile } from '../../src/storage/utils';

describe('getMimeType', () => {
  it('returns correct MIME for jpg', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
  });

  it('returns correct MIME for png', () => {
    expect(getMimeType('image.png')).toBe('image/png');
  });

  it('returns octet-stream for unknown', () => {
    expect(getMimeType('file.xyz')).toBe('application/octet-stream');
  });
});

describe('generateStoragePath', () => {
  it('generates unique paths', () => {
    const p1 = generateStoragePath(undefined, 'test.jpg');
    const p2 = generateStoragePath(undefined, 'test.jpg');
    expect(p1).not.toBe(p2);
  });

  it('includes basePath', () => {
    const path = generateStoragePath('uploads', 'test.jpg');
    expect(path.startsWith('uploads/')).toBe(true);
  });

  it('sanitizes filename', () => {
    const path = generateStoragePath(undefined, 'my file (1).jpg');
    expect(path).not.toContain(' ');
    expect(path).not.toContain('(');
  });
});

describe('validateFile', () => {
  it('passes valid file', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('fails oversized file', () => {
    const content = new Uint8Array(2 * 1024 * 1024);
    const file = new File([content], 'large.jpg', { type: 'image/jpeg' });
    const result = validateFile(file, 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });
});
