import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import type { EditorConfig, SEOAnalysis } from '@inkpilot/types';
import { I18nContext, createI18nValue } from '@inkpilot/i18n';
import { generateSERPPreview } from '@inkpilot/seo';
import { blobToDataUrl, processImage, revokeImageProcessingResult } from '@inkpilot/image';
import { getContent } from '@inkpilot/core';
import { useStorage } from './hooks/use-storage';
import { InkpilotContext } from './context';
import { useInkpilotEditor } from './hooks/use-editor';
import { useAIRewrite } from './hooks/use-ai-rewrite';
import { useSEOAnalysis } from './hooks/use-seo-analysis';
import { useTheme } from './hooks/use-theme';
import { Toolbar } from './components/toolbar';
import { FloatingToolbar } from './components/floating-toolbar';
import { AIRewritePanel } from './components/ai-rewrite-panel';
import { SEOSignalIndicators } from './components/seo-signals';
import { SEOPanel } from './components/seo-panel';
import '../theme/styles.css';

export interface EditorProps extends EditorConfig {
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

const EMPTY_ANALYSIS: SEOAnalysis = {
  score: 0,
  issues: [],
  suggestions: [],
};

export function Editor(props: EditorProps) {
  const {
    ai,
    storage,
    seo,
    theme,
    i18n: i18nConfig,
    locale,
    content,
    onChange,
    onPublish,
    className,
    style,
    readOnly,
    autoFocus,
    placeholder,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const publishRef = useRef<() => void>(() => undefined);
  const [showSEOPanel, setShowSEOPanel] = useState(false);

  const { editor, content: currentContent, signals } = useInkpilotEditor({
    ai,
    storage,
    seo,
    image: props.image,
    content,
    onChange,
    placeholder,
    autoFocus,
    readOnly,
    onRewrite: undefined,
    onPublish: () => publishRef.current(),
  });

  const aiRewrite = useAIRewrite(editor, ai);
  const {
    analysis,
    isAnalyzing,
    runAnalysis,
  } = useSEOAnalysis(editor, seo, ai, signals);
  const { theme: resolvedTheme } = useTheme(theme, containerRef);
  const { upload: storageUpload } = useStorage(storage);

  useEffect(() => {
    if (showSEOPanel) {
      void runAnalysis();
    }
  }, [runAnalysis, showSEOPanel]);

  const i18nValue = useMemo(
    () => createI18nValue(locale ?? i18nConfig?.locale ?? 'en', i18nConfig?.translations),
    [locale, i18nConfig],
  );

  const handlePublish = useCallback(() => {
    if (!editor) return;
    const contentToPublish = currentContent ?? getContent(editor);
    const finalAnalysis = analysis ?? EMPTY_ANALYSIS;
    onPublish?.(contentToPublish, finalAnalysis);
    setShowSEOPanel(false);
  }, [analysis, currentContent, editor, onPublish]);

  const startPublish = useCallback(async () => {
    if (!editor) return;

    if (!seo || seo.prePublishPanel === false) {
      const contentToPublish = currentContent ?? getContent(editor);
      const finalAnalysis = seo
        ? (await runAnalysis()) ?? EMPTY_ANALYSIS
        : EMPTY_ANALYSIS;
      onPublish?.(contentToPublish, finalAnalysis);
      return;
    }

    setShowSEOPanel(true);
  }, [currentContent, editor, onPublish, runAnalysis, seo]);

  publishRef.current = () => {
    void startPublish();
  };

  const serpPreview = useMemo(() => {
    if (!currentContent || !editor) return undefined;
    let title = '';
    const doc = editor.state?.doc;
    if (doc?.descendants) {
      doc.descendants((node) => {
        if (!title && node.type.name === 'heading' && node.attrs.level === 1) {
          title = node.textContent;
        }
        return !title;
      });
    }
    const description = currentContent.text.slice(0, 160);
    return generateSERPPreview(title, description);
  }, [currentContent, editor]);

  const handleImageInsert = useCallback(
    async (file: File) => {
      if (!editor) return;
      const alt = file.name.replace(/\.[^.]+$/, '');
      let imageResult: Awaited<ReturnType<typeof processImage>> | null = null;

      try {
        imageResult = await processImage(file, { config: props.image });
        const processed = imageResult.compressed ?? imageResult.original;
        let src: string;

        if (storage) {
          const blob = processed.blob;
          const uploadFile = blob instanceof File
            ? blob
            : new File([blob], file.name, { type: blob.type || file.type });
          const uploaded = await storageUpload(uploadFile, file.name);
          src = uploaded?.url ?? processed.url;
        } else {
          src = await blobToDataUrl(processed.blob);
        }

        editor.chain().focus().setImage({ src, alt }).run();
        revokeImageProcessingResult(imageResult);
      } catch {
        if (imageResult) {
          revokeImageProcessingResult(imageResult);
        }
        const fallbackUrl = await blobToDataUrl(file);
        editor.chain().focus().setImage({ src: fallbackUrl, alt }).run();
      }
    },
    [editor, props.image, storage, storageUpload],
  );

  const ctxValue = useMemo(
    () => ({
      editor,
      aiConfig: ai,
      storageConfig: storage,
      seoConfig: seo,
      themeConfig: theme,
      signals,
    }),
    [editor, ai, storage, seo, theme, signals],
  );

  return (
    <I18nContext.Provider value={i18nValue}>
      <InkpilotContext.Provider value={ctxValue}>
        <div
          ref={containerRef}
          className={`inkpilot-editor${className ? ` ${className}` : ''}`}
          style={style}
          data-wf-theme={resolvedTheme.mode}
        >
          {!readOnly && <Toolbar editor={editor} onImageInsert={handleImageInsert} />}
          <SEOSignalIndicators signals={signals} />

          <div style={{ position: 'relative' }}>
            {editor && <EditorContent editor={editor} />}

            {!readOnly && (
              <FloatingToolbar
                editor={editor}
                hasAI={!!ai}
                onLiveRewrite={aiRewrite.liveRewrite}
                onRevert={aiRewrite.revert}
                isRewriting={aiRewrite.isRewriting}
                isLive={aiRewrite.isLive}
                defaultTone={ai?.defaultTone}
                defaultIntent={ai?.defaultIntent}
              />
            )}

            {!readOnly && !aiRewrite.isLive && (aiRewrite.isRewriting || aiRewrite.result) && (
              <AIRewritePanel
                isRewriting={aiRewrite.isRewriting}
                diff={aiRewrite.diff}
                result={aiRewrite.result}
                onAccept={aiRewrite.accept}
                onReject={aiRewrite.reject}
              />
            )}
          </div>

          {showSEOPanel && (
            <SEOPanel
              analysis={analysis ?? EMPTY_ANALYSIS}
              serpPreview={serpPreview}
              isAnalyzing={isAnalyzing}
              onClose={() => setShowSEOPanel(false)}
              onPublish={handlePublish}
            />
          )}
        </div>
      </InkpilotContext.Provider>
    </I18nContext.Provider>
  );
}
