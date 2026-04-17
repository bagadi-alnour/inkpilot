import { describe, it, expect } from 'vitest';
import { resolveTheme } from '../../src/theme/apply';
import { getPresetColors } from '../../src/theme/presets';

describe('resolveTheme', () => {
  it('returns default preset in light mode by default', () => {
    const theme = resolveTheme({});
    expect(theme.preset).toBe('default');
    expect(theme.mode).toBe('light');
    expect(theme.colors.primary).toBeDefined();
  });

  it('respects preset selection', () => {
    const theme = resolveTheme({ preset: 'editorial' });
    expect(theme.preset).toBe('editorial');
  });

  it('respects explicit mode', () => {
    const theme = resolveTheme({ mode: 'dark' });
    expect(theme.mode).toBe('dark');
  });

  it('merges custom colors', () => {
    const theme = resolveTheme({ colors: { primary: '#ff0000' } });
    expect(theme.colors.primary).toBe('#ff0000');
  });
});

describe('getPresetColors', () => {
  it('returns colors for all presets', () => {
    for (const preset of ['default', 'minimal', 'editorial'] as const) {
      for (const mode of ['light', 'dark'] as const) {
        const colors = getPresetColors(preset, mode);
        expect(colors.primary).toBeDefined();
        expect(colors.background).toBeDefined();
        expect(colors.foreground).toBeDefined();
      }
    }
  });
});
