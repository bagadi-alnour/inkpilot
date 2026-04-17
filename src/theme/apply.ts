import type { ThemeConfig, ThemeColors, ResolvedTheme } from '@writeflow/types';
import { CSS_VARS } from './variables';
import { getPresetColors } from './presets';
import { detectColorScheme } from './auto-detect';

export function resolveTheme(config: ThemeConfig = {}): ResolvedTheme {
  const preset = config.preset ?? 'default';
  const mode = config.mode === 'auto' || !config.mode ? detectColorScheme() : config.mode;
  const baseColors = getPresetColors(preset, mode);
  const colors: ThemeColors = { ...baseColors, ...config.colors };

  return { mode, colors, preset };
}

export function applyTheme(config: ThemeConfig, container: HTMLElement): ResolvedTheme {
  const resolved = resolveTheme(config);
  const { colors } = resolved;

  container.style.setProperty(CSS_VARS.colorPrimary, colors.primary);
  container.style.setProperty(CSS_VARS.colorSecondary, colors.secondary);
  container.style.setProperty(CSS_VARS.colorAccent, colors.accent);
  container.style.setProperty(CSS_VARS.colorBg, colors.background);
  container.style.setProperty(CSS_VARS.colorFg, colors.foreground);
  container.style.setProperty(CSS_VARS.colorBorder, colors.border);
  container.style.setProperty(CSS_VARS.colorMuted, colors.muted);
  container.style.setProperty(CSS_VARS.colorMutedFg, colors.mutedForeground);
  container.style.setProperty(CSS_VARS.colorError, colors.error);
  container.style.setProperty(CSS_VARS.colorWarning, colors.warning);
  container.style.setProperty(CSS_VARS.colorSuccess, colors.success);

  container.style.setProperty(CSS_VARS.fontBody, '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
  container.style.setProperty(CSS_VARS.fontHeading, 'inherit');
  container.style.setProperty(CSS_VARS.fontMono, '"SF Mono", "Fira Code", "Fira Mono", monospace');

  container.style.setProperty(CSS_VARS.radiusSm, '4px');
  container.style.setProperty(CSS_VARS.radiusMd, '8px');
  container.style.setProperty(CSS_VARS.radiusLg, '12px');

  container.style.setProperty(CSS_VARS.space1, '4px');
  container.style.setProperty(CSS_VARS.space2, '8px');
  container.style.setProperty(CSS_VARS.space3, '12px');
  container.style.setProperty(CSS_VARS.space4, '16px');
  container.style.setProperty(CSS_VARS.space5, '24px');
  container.style.setProperty(CSS_VARS.space6, '32px');
  container.style.setProperty(CSS_VARS.space7, '48px');
  container.style.setProperty(CSS_VARS.space8, '64px');

  container.setAttribute('data-wf-theme', resolved.mode);

  return resolved;
}
