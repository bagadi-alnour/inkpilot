import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import type { ImageConfig } from '@inkpilot/types';
import { blobToDataUrl, prepareImage } from '../../image/prepare';
import { ALT_IMAGE_TYPES, PROTOCOL_VERSION } from '../../protocol';
import type { AltImageType } from '../../protocol';
import type { InkpilotTransport } from '../../ai/transport';

/**
 * Image insertion with uploads that stay correct under undo and redo.
 *
 * An inserted image shows a blob preview and carries an `uploadId` (never rendered to
 * HTML). A registry records how each upload ended. After every transaction, including
 * undo and redo, `appendTransaction` resolves any image still carrying an id:
 * done → final `src`; failed or unknown → removed; pending → left alone. History can
 * therefore never restore a dead preview or a placeholder whose upload will never end.
 */

type UploadEntry =
  | { status: 'pending'; blobUrl: string; controller: AbortController }
  | { status: 'done'; src: string }
  | { status: 'failed' };

export interface ImageUploadOptions {
  getConfig: () => ImageConfig | undefined;
  getTransport: () => InkpilotTransport | undefined;
  getLocale: () => string;
}

export interface ImageUploadStorage {
  uploads: Map<string, UploadEntry>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      /** Insert images at `pos` (default: the selection) and upload them. */
      insertImageFiles: (files: File[], pos?: number) => ReturnType;
      /** Ask the AI endpoint for alt text for the image at `pos`; applied only if alt is still empty. */
      suggestAltText: (pos: number) => ReturnType;
    };
  }
  interface Storage {
    imageUpload: ImageUploadStorage;
  }
}

export const imageUploadKey = new PluginKey('inkpilotImageUpload');

let uploadCounter = 0;
const nextUploadId = () => `up-${Date.now().toString(36)}-${++uploadCounter}`;

/** Only put URLs in the document that a page can safely render as an image. */
function isSafeImageSrc(src: string): boolean {
  return /^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif|avif);base64,)/i.test(src.trim());
}

/** Images still waiting for their upload, by upload id. */
export function pendingUploads(state: EditorState, storage: ImageUploadStorage): string[] {
  const pending: string[] = [];
  state.doc.descendants((node) => {
    const id = node.type.name === 'image' ? (node.attrs.uploadId as string | null) : null;
    if (id && storage.uploads.get(id)?.status === 'pending') pending.push(id);
    return true;
  });
  return pending;
}

/** Swap finished uploads in, drop failed ones. Null when nothing needs resolving. */
function resolveUploads(state: EditorState, storage: ImageUploadStorage): Transaction | null {
  const changes: { pos: number; node: PMNode; entry: UploadEntry | undefined }[] = [];
  state.doc.descendants((node, pos) => {
    if (node.type.name !== 'image' || !node.attrs.uploadId) return true;
    const entry = storage.uploads.get(node.attrs.uploadId as string);
    if (entry?.status !== 'pending') changes.push({ pos, node, entry });
    return false;
  });
  if (!changes.length) return null;

  const tr = state.tr;
  // Back to front so earlier positions stay valid.
  for (const { pos, node, entry } of changes.reverse()) {
    if (entry?.status === 'done') tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: entry.src, uploadId: null });
    else tr.delete(pos, pos + node.nodeSize);
  }
  return tr.setMeta('addToHistory', false).setMeta(imageUploadKey, 'resolved');
}

function settle(editor: Editor, storage: ImageUploadStorage, id: string, entry: UploadEntry) {
  const previous = storage.uploads.get(id);
  // Revoke now: any restored reference is rewritten or removed before it renders.
  if (previous?.status === 'pending') URL.revokeObjectURL(previous.blobUrl);
  storage.uploads.set(id, entry);
  if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta(imageUploadKey, 'settled').setMeta('addToHistory', false));
}

function surroundingText(doc: PMNode, pos: number, size = 400): string {
  const from = Math.max(0, pos - size);
  const to = Math.min(doc.content.size, pos + size);
  return doc.textBetween(from, to, '\n', ' ').trim();
}

/** Request alt text and apply it to the image matching `find`, unless the writer set one meanwhile. */
async function requestAlt(
  editor: Editor,
  options: ImageUploadOptions,
  blob: Blob,
  find: (node: PMNode) => boolean,
  context: string,
): Promise<boolean> {
  const transport = options.getTransport();
  const mediaType = blob.type as AltImageType;
  if (!transport || !(ALT_IMAGE_TYPES as readonly string[]).includes(mediaType)) return false;

  const dataUrl = await blobToDataUrl(blob);
  const result = await transport.json(
    { v: PROTOCOL_VERSION, task: 'alt', locale: options.getLocale(), image: { data: dataUrl.slice(dataUrl.indexOf(',') + 1), mediaType }, context },
    new AbortController().signal,
  );
  if (!result.ok || editor.isDestroyed) return false;

  let target: { pos: number; node: PMNode } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (target) return false;
    if (node.type.name === 'image' && find(node)) target = { pos, node };
    return true;
  });
  if (!target) return false;
  const { pos, node } = target as { pos: number; node: PMNode };
  if (String(node.attrs.alt ?? '').trim()) return false;
  editor.view.dispatch(
    editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, alt: result.data.alt.trim() }).setMeta('addToHistory', false),
  );
  return true;
}

async function upload(editor: Editor, options: ImageUploadOptions, storage: ImageUploadStorage, id: string, file: File) {
  const entry = storage.uploads.get(id);
  if (entry?.status !== 'pending') return;
  const config = options.getConfig() ?? {};
  try {
    const prepared = await prepareImage(file, config);
    const uploaded = config.upload
      ? await config.upload(prepared.file, { signal: entry.controller.signal, width: prepared.width, height: prepared.height })
      : { src: await blobToDataUrl(prepared.file) };
    if (entry.controller.signal.aborted) return;
    if (!isSafeImageSrc(uploaded.src)) throw new Error(`The uploader returned an unusable URL: ${uploaded.src}`);
    settle(editor, storage, id, { status: 'done', src: uploaded.src });

    if (config.autoAltText !== false) {
      const pos = findImage(editor.state.doc, (node) => node.attrs.src === uploaded.src);
      const context = pos === null ? '' : surroundingText(editor.state.doc, pos);
      void requestAlt(editor, options, prepared.file, (node) => node.attrs.src === uploaded.src, context).catch(() => undefined);
    }
  } catch (error) {
    if (entry.controller.signal.aborted) return;
    settle(editor, storage, id, { status: 'failed' });
    config.onUploadError?.(error instanceof Error ? error : new Error(String(error)), file);
  }
}

function findImage(doc: PMNode, match: (node: PMNode) => boolean): number | null {
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (found !== null) return false;
    if (node.type.name === 'image' && match(node)) found = pos;
    return true;
  });
  return found;
}

export const ImageUploadExtension = Extension.create<ImageUploadOptions, ImageUploadStorage>({
  name: 'imageUpload',

  addOptions() {
    return { getConfig: () => undefined, getTransport: () => undefined, getLocale: () => 'en' };
  },

  addStorage() {
    return { uploads: new Map<string, UploadEntry>() };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['image'],
        attributes: {
          uploadId: { default: null, parseHTML: () => null, renderHTML: () => ({}) },
        },
      },
    ];
  },

  onDestroy() {
    for (const entry of this.storage.uploads.values()) {
      if (entry.status === 'pending') {
        entry.controller.abort();
        URL.revokeObjectURL(entry.blobUrl);
      }
    }
    this.storage.uploads.clear();
  },

  addCommands() {
    const options = this.options;
    const storage = this.storage;
    return {
      insertImageFiles:
        (files, pos) =>
        ({ editor, commands, dispatch }) => {
          const images = files.filter((file) => file.type.startsWith('image/'));
          if (!images.length) return false;
          if (!dispatch) return true;

          const started: { id: string; file: File }[] = [];
          const nodes = images.map((file) => {
            const id = nextUploadId();
            const blobUrl = URL.createObjectURL(file);
            storage.uploads.set(id, { status: 'pending', blobUrl, controller: new AbortController() });
            started.push({ id, file });
            return { type: 'image', attrs: { src: blobUrl, alt: '', uploadId: id } };
          });
          const inserted = pos === undefined ? commands.insertContent(nodes) : commands.insertContentAt(pos, nodes);
          if (inserted) queueMicrotask(() => started.forEach(({ id, file }) => void upload(editor, options, storage, id, file)));
          return inserted;
        },

      suggestAltText:
        (pos) =>
        ({ editor, state, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          if (node?.type.name !== 'image' || !options.getTransport() || String(node.attrs.alt ?? '').trim()) return false;
          if (!dispatch) return true;
          const src = String(node.attrs.src ?? '');
          const context = surroundingText(state.doc, pos);
          void fetch(src)
            .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(`HTTP ${response.status}`))))
            .then((blob) => requestAlt(editor, options, blob, (candidate) => candidate.attrs.src === src, context))
            .catch(() => undefined);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const storage = this.storage;
    const files = (list: FileList | null | undefined) => Array.from(list ?? []).filter((file) => file.type.startsWith('image/'));

    return [
      new Plugin({
        key: imageUploadKey,
        appendTransaction(transactions, _oldState, newState) {
          if (!storage.uploads.size) return null;
          const relevant = transactions.some((tr) => tr.docChanged || tr.getMeta(imageUploadKey) === 'settled');
          return relevant ? resolveUploads(newState, storage) : null;
        },
        props: {
          handleDrop(view, event, _slice, moved) {
            const images = files(event.dataTransfer?.files);
            if (moved || !images.length) return false;
            event.preventDefault();
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
            return editor.commands.insertImageFiles(images, pos);
          },
          handlePaste(_view, event) {
            const images = files(event.clipboardData?.files);
            if (!images.length) return false;
            event.preventDefault();
            return editor.commands.insertImageFiles(images);
          },
        },
      }),
    ];
  },
});
