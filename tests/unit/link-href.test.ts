import { describe, it, expect } from 'vitest';
import { toSafeHref } from '@inkpilot/react/components/toolbar';

describe('toSafeHref', () => {
  it('keeps http and https URLs', () => {
    expect(toSafeHref('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(toSafeHref('http://example.com')).toBe('http://example.com/');
  });

  it('keeps mailto and tel', () => {
    expect(toSafeHref('mailto:hi@example.com')).toBe('mailto:hi@example.com');
    expect(toSafeHref('tel:+33123456789')).toBe('tel:+33123456789');
  });

  it('promotes scheme-less input to https', () => {
    expect(toSafeHref('example.com')).toBe('https://example.com/');
  });

  it('rejects script-bearing schemes', () => {
    expect(toSafeHref('javascript:alert(1)')).toBeNull();
    expect(toSafeHref('JavaScript:alert(1)')).toBeNull();
    expect(toSafeHref('java\nscript:alert(1)')).toBeNull();
    expect(toSafeHref('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(toSafeHref('vbscript:msgbox(1)')).toBeNull();
  });

  it('rejects blank input', () => {
    expect(toSafeHref('   ')).toBeNull();
  });
});
