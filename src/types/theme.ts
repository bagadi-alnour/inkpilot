export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemePreset = 'default' | 'minimal' | 'editorial';

export interface ThemeConfig {
  mode?: ThemeMode;
  preset?: ThemePreset;
  colors?: Partial<ThemeColors>;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  border: string;
  muted: string;
  mutedForeground: string;
  error: string;
  warning: string;
  success: string;
}

export interface ResolvedTheme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  preset: ThemePreset;
}
