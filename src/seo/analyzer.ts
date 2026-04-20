import type { Editor } from '@tiptap/core';
import type { SEOConfig, SEOAnalysis, SEOIssue, SEOSuggestion, AIProviderAdapter } from '@inkpilot/types';
import { analyzeHeadings } from './rules/heading';
import { analyzeTitle } from './rules/title';
import { analyzeAltTexts } from './rules/alt-text';
import { analyzeReadability } from './rules/readability';
import { analyzeKeywords } from './rules/keyword';
import { computeSEOScore } from './scoring';
import type { HeadingInfo } from './rules/heading';
import type { ImageInfo } from './rules/alt-text';

function extractHeadings(editor: Editor): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        level: node.attrs.level as number,
        text: node.textContent,
        from: pos,
        to: pos + node.nodeSize,
      });
    }
  });
  return headings;
}

function extractImages(editor: Editor): ImageInfo[] {
  const images: ImageInfo[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') {
      images.push({
        alt: (node.attrs.alt as string) ?? '',
        src: (node.attrs.src as string) ?? '',
        from: pos,
        to: pos + node.nodeSize,
      });
    }
  });
  return images;
}

export async function analyzeContent(
  editor: Editor,
  config: SEOConfig,
  aiProvider?: AIProviderAdapter,
): Promise<SEOAnalysis> {
  const text = editor.getText();
  const headings = extractHeadings(editor);
  const images = extractImages(editor);
  const title = headings.find((h) => h.level === 1)?.text ?? '';
  const headingTexts = headings.map((h) => h.text);

  const allIssues: SEOIssue[] = [];
  const suggestions: SEOSuggestion[] = [];

  allIssues.push(...analyzeHeadings(headings));
  allIssues.push(...analyzeTitle(title));
  allIssues.push(...analyzeAltTexts(images));

  const readability = analyzeReadability(text);
  allIssues.push(...readability.issues);

  let keywordResults = undefined;
  if (config.targetKeywords?.length) {
    const kwResults = analyzeKeywords(text, config.targetKeywords, title, headingTexts);
    keywordResults = kwResults;
    for (const kw of kwResults) {
      allIssues.push(...kw.issues);
    }
  }

  if (aiProvider) {
    try {
      const titleSuggestions = await aiProvider.suggestTitle(text);
      for (const t of titleSuggestions) {
        suggestions.push({
          type: 'title',
          message: t,
          action: 'Use this title',
        });
      }
    } catch {
      // AI suggestions are optional
    }

    try {
      const metaSuggestion = await aiProvider.suggestMeta(text);
      if (metaSuggestion) {
        suggestions.push({
          type: 'meta',
          message: metaSuggestion,
          action: 'Use this description',
        });
      }
    } catch {
      // AI suggestions are optional
    }
  }

  const score = computeSEOScore(
    allIssues,
    readability,
    keywordResults ?? [],
  );

  const analysis: SEOAnalysis = { score, issues: allIssues, suggestions };
  config.onAnalysis?.(analysis);

  return analysis;
}
