import { useState, useCallback, useRef, useMemo } from 'react';
import { EditorContent } from '@tiptap/react';
import type {
  EditorConfig,
  EditorContent as EditorContentType,
  SEOAnalysis,
} from '@writeflow/types';
import { I18nContext, createI18nValue } from '@writeflow/i18n';
import { applyTheme } from '@writeflow/theme';
import { generateSERPPreview } from '@writeflow/seo';
import { getContent } from '@writeflow/core';
import { WriteFlowContext } from './context';
import { useWriteFlowEditor } from './hooks/use-editor';
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
  const [showSEOPanel, setShowSEOPanel] = useState(false);

  const handlePublishTrigger = useCallback(() => {
    if (seo?.prePublishPanel !== false) {
      setShowSEOPanel(true);
      void seoAnalysis.runAnalysis();
    }
  }, [seo]);

  const { editor, content: currentContent, signals } = useWriteFlowEditor({
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
    onPublish: handlePublishTrigger,
  });

  const aiRewrite = useAIRewrite(editor, ai);
  const seoAnalysis = useSEOAnalysis(editor, seo, ai, signals);
  const { theme: resolvedTheme } = useTheme(theme, containerRef);

  const i18nValue = useMemo(
    () => createI18nValue(locale ?? i18nConfig?.locale ?? 'en', i18nConfig?.translations),
    [locale, i18nConfig],
  );

  const handlePublish = useCallback(() => {
    if (!editor || !currentContent) return;
    const analysis = seoAnalysis.analysis ?? { score: 0, issues: [], suggestions: [] };
    onPublish?.(currentContent, analysis);
    setShowSEOPanel(false);
  }, [editor, currentContent, seoAnalysis.analysis, onPublish]);

  const serpPreview = useMemo(() => {
    if (!currentContent) return undefined;
    const title = currentContent.text.split('\n')[0] ?? '';
    const description = currentContent.text.slice(0, 160);
    return generateSERPPreview(title, description);
  }, [currentContent]);

  const handleImageInsert = useCallback(
    (file: File) => {
      if (!editor) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
      };
      reader.readAsDataURL(file);
    },
    [editor],
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
      <WriteFlowContext.Provider value={ctxValue}>
        <div
          ref={containerRef}
          className={`writeflow-editor${className ? ` ${className}` : ''}`}
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

          {showSEOPanel && seoAnalysis.analysis && (
            <SEOPanel
              analysis={seoAnalysis.analysis}
              serpPreview={serpPreview}
              isAnalyzing={seoAnalysis.isAnalyzing}
              onClose={() => setShowSEOPanel(false)}
              onPublish={handlePublish}
            />
          )}
        </div>
      </WriteFlowContext.Provider>
    </I18nContext.Provider>
  );
}
