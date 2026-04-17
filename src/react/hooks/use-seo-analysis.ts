import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import type { SEOConfig, SEOAnalysis, SEOSignal, AIConfig } from '@writeflow/types';
import { analyzeContent } from '@writeflow/seo';
import { createAIProvider } from '@writeflow/ai';

export interface UseSEOAnalysisReturn {
  signals: SEOSignal[];
  analysis: SEOAnalysis | null;
  isAnalyzing: boolean;
  score: number | null;
  runAnalysis: () => Promise<void>;
}

export function useSEOAnalysis(
  editor: Editor | null,
  seoConfig?: SEOConfig,
  aiConfig?: AIConfig,
  signals: SEOSignal[] = [],
): UseSEOAnalysisReturn {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = useCallback(async () => {
    if (!editor || !seoConfig) return;

    setIsAnalyzing(true);
    try {
      const provider = aiConfig ? createAIProvider(aiConfig) : undefined;
      const result = await analyzeContent(editor, seoConfig, provider);
      setAnalysis(result);
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [editor, seoConfig, aiConfig]);

  return {
    signals,
    analysis,
    isAnalyzing,
    score: analysis?.score ?? null,
    runAnalysis,
  };
}
