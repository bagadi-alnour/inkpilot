import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/core';
import type { AIConfig, StorageConfig, SEOConfig, ThemeConfig, SEOSignal } from '@writeflow/types';

export interface WriteFlowContextValue {
  editor: Editor | null;
  aiConfig?: AIConfig;
  storageConfig?: StorageConfig;
  seoConfig?: SEOConfig;
  themeConfig?: ThemeConfig;
  signals: SEOSignal[];
}

export const WriteFlowContext = createContext<WriteFlowContextValue>({
  editor: null,
  signals: [],
});

export function useWriteFlowContext(): WriteFlowContextValue {
  return useContext(WriteFlowContext);
}
