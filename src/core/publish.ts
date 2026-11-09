import type { Editor } from '@tiptap/core';
import type { EditorContent } from '@inkpilot/types';
import { analyzeDocument } from '../seo/engine';
import type { AnalyzeContext, Report } from '../seo/engine';
import { getContent } from './document';
import { seoReportKey } from './extensions/seo-report';
import { pendingUploads } from './extensions/image-upload';

export type PublishSnapshot =
  | { ok: true; content: EditorContent; report: Report }
  | { ok: false; reason: 'uploading'; count: number }
  | { ok: false; reason: 'local-image'; count: number };

/**
 * Everything `onPublish` receives, taken from one document state: the content and a
 * synchronous analysis of that same content. Refused while images are still uploading
 * or any local `blob:` preview would leave the editor.
 */
export function takePublishSnapshot(editor: Editor, ctx: AnalyzeContext): PublishSnapshot {
  const { state } = editor;
  const pending = pendingUploads(state, editor.storage.imageUpload).length;
  if (pending) return { ok: false, reason: 'uploading', count: pending };

  const content = getContent(editor);
  let localImages = 0;
  state.doc.descendants((node) => {
    if (node.type.name === 'image' && (String(node.attrs.src).startsWith('blob:') || node.attrs.uploadId)) localImages++;
    return true;
  });
  if (localImages || content.html.includes('src="blob:')) return { ok: false, reason: 'local-image', count: Math.max(localImages, 1) };

  return { ok: true, content, report: analyzeDocument(state.doc, ctx, seoReportKey.getState(state)?.ignored) };
}
