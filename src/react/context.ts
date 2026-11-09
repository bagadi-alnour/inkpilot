import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/core';
import type { AIConfig, SEOConfig, ThemeConfig } from '@inkpilot/types';

export interface InkpilotContextValue {
  editor: Editor | null;
  aiConfig?: AIConfig;
  seoConfig?: SEOConfig;
  themeConfig?: ThemeConfig;
}

export const InkpilotContext = createContext<InkpilotContextValue>({
  editor: null,
});

export function useInkpilotContext(): InkpilotContextValue {
  return useContext(InkpilotContext);
}
