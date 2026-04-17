import type { ThemeColors, ThemePreset } from '@writeflow/types';

interface FullPreset {
  light: ThemeColors;
  dark: ThemeColors;
}

const defaultPreset: FullPreset = {
  light: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#0891b2',
    background: '#ffffff',
    foreground: '#0f172a',
    border: '#e2e8f0',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    error: '#dc2626',
    warning: '#d97706',
    success: '#16a34a',
  },
  dark: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#0f172a',
    foreground: '#f1f5f9',
    border: '#334155',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
  },
};

const minimalPreset: FullPreset = {
  light: {
    primary: '#171717',
    secondary: '#525252',
    accent: '#404040',
    background: '#fafafa',
    foreground: '#171717',
    border: '#e5e5e5',
    muted: '#f5f5f5',
    mutedForeground: '#737373',
    error: '#b91c1c',
    warning: '#a16207',
    success: '#15803d',
  },
  dark: {
    primary: '#fafafa',
    secondary: '#a3a3a3',
    accent: '#d4d4d4',
    background: '#0a0a0a',
    foreground: '#fafafa',
    border: '#262626',
    muted: '#171717',
    mutedForeground: '#a3a3a3',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
  },
};

const editorialPreset: FullPreset = {
  light: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#8b5e3c',
    background: '#fdf8f0',
    foreground: '#1a1a2e',
    border: '#d4c5a9',
    muted: '#f5efe3',
    mutedForeground: '#6b5e4f',
    error: '#9b2226',
    warning: '#bc6c25',
    success: '#386641',
  },
  dark: {
    primary: '#e8e0d0',
    secondary: '#b8a88a',
    accent: '#c4956a',
    background: '#1a1a2e',
    foreground: '#e8e0d0',
    border: '#3d3d5c',
    muted: '#252547',
    mutedForeground: '#9b93a8',
    error: '#e85d5d',
    warning: '#dda15e',
    success: '#6a994e',
  },
};

const presets: Record<ThemePreset, FullPreset> = {
  default: defaultPreset,
  minimal: minimalPreset,
  editorial: editorialPreset,
};

export function getPresetColors(preset: ThemePreset, mode: 'light' | 'dark'): ThemeColors {
  return presets[preset][mode];
}

export { presets };
