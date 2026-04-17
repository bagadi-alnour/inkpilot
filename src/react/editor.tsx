import { useState, useCallback, useRef, useMemo } from 'react';
import { EditorContent } from '@tiptap/react';
import type {
  EditorConfig,
  EditorContent as EditorContentType,
  SEOAnalysis,
} from '@writeflow/types';
import { I18nContext, createI18nValue } from '@writeflow/i18n';
import { generateSERPPreview } from '@writeflow/seo';
import { processImage } from '@writeflow/image';
import { useStorage } from './hooks/use-storage';
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
  const { upload: storageUpload } = useStorage(storage);

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
    if (!currentContent || !editor) return undefined;
    let title = '';
    editor.state.doc.descendants((node) => {
      if (!title && node.type.name === 'heading' && node.attrs.level === 1) {
        title = node.textContent;
      }
      return !title;
    });
    const description = currentContent.text.slice(0, 160);
    return generateSERPPreview(title, description);
  }, [currentContent, editor]);

  const handleImageInsert = useCallback(
    async (file: File) => {
      if (!editor) return;
      const alt = file.name.replace(/\.[^.]+$/, '');

      try {
        const result = await processImage(file, { config: props.image });
        const processed = result.compressed ?? result.original;

        if (storage) {
          const blob = processed.blob;
          const uploadFile = blob instanceof File
            ? blob
            : new File([blob], file.name, { type: blob.type || file.type });
          const uploaded = await storageUpload(uploadFile, file.name);
          const url = uploaded?.url ?? processed.url;
          editor.chain().focus().setImage({ src: url, alt }).run();
        } else {
          editor.chain().focus().setImage({ src: processed.url, alt }).run();
        }
      } catch {
        const fallbackUrl = URL.createObjectURL(file);
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
