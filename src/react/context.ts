import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/core';
import type { AIConfig, StorageConfig, SEOConfig, ThemeConfig, SEOSignal } from '@inkpilot/types';

export interface InkpilotContextValue {
  editor: Editor | null;
  aiConfig?: AIConfig;
  storageConfig?: StorageConfig;
  seoConfig?: SEOConfig;
  themeConfig?: ThemeConfig;
  signals: SEOSignal[];
}

export const InkpilotContext = createContext<InkpilotContextValue>({
  editor: null,
  signals: [],
});

export function useInkpilotContext(): InkpilotContextValue {
  return useContext(InkpilotContext);
}
