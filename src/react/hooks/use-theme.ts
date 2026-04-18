import { useState, useCallback, useEffect } from 'react';
import type { ThemeConfig, ThemePreset, ResolvedTheme } from '@writeflow/types';
import { applyTheme, resolveTheme } from '@writeflow/theme';

export interface UseThemeReturn {
  theme: ResolvedTheme;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark' | 'auto') => void;
  applyPreset: (preset: ThemePreset) => void;
}

export function useTheme(
  config?: ThemeConfig,
  containerRef?: React.RefObject<HTMLElement | null>,
): UseThemeReturn {
  const [currentConfig, setCurrentConfig] = useState<ThemeConfig>(config ?? {});
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(currentConfig));

  useEffect(() => {
    if (config) {
      setCurrentConfig(config);
    }
  }, [config]);

  useEffect(() => {
    const resolved = resolveTheme(currentConfig);
    setTheme(resolved);

    if (containerRef?.current) {
      applyTheme(currentConfig, containerRef.current);
    }
  }, [currentConfig, containerRef]);

  const setMode = useCallback((mode: 'light' | 'dark' | 'auto') => {
    setCurrentConfig((prev) => ({ ...prev, mode }));
  }, []);

  const applyPreset = useCallback((preset: ThemePreset) => {
    setCurrentConfig((prev) => ({ ...prev, preset }));
  }, []);

  return { theme, mode: theme.mode, setMode, applyPreset };
}
