import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import type { SEOConfig, SEOAnalysis, SEOSignal, AIConfig } from '@inkpilot/types';
import { analyzeContent } from '@inkpilot/seo';
import { createAIProvider } from '@inkpilot/ai';

export interface UseSEOAnalysisReturn {
  signals: SEOSignal[];
  analysis: SEOAnalysis | null;
  isAnalyzing: boolean;
  score: number | null;
  runAnalysis: () => Promise<SEOAnalysis | null>;
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
    if (!editor) return null;

    setIsAnalyzing(true);
    try {
      const provider = aiConfig ? createAIProvider(aiConfig) : undefined;
      const result = await analyzeContent(editor, seoConfig ?? {}, provider);
      setAnalysis(result);
      return result;
    } catch (error) {
      console.error('SEO analysis failed:', error);
      return null;
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
