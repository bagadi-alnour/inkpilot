import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import type { ImageConfig, UploadedImage } from '../../src/types/image';
import { createInkpilotKit } from '../../src/core/extensions/inkpilot-kit';
import { ImageUploadExtension } from '../../src/core/extensions/image-upload';
import type { InkpilotTransport } from '../../src/ai/transport';
import { flush } from '../helpers/editor';

let editor: Editor;
let blobCount = 0;
const revoked: string[] = [];

beforeEach(() => {
  blobCount = 0;
  revoked.length = 0;
  vi.stubGlobal('URL', Object.assign(URL, {
    createObjectURL: () => `blob:test/${++blobCount}`,
    revokeObjectURL: (url: string) => void revoked.push(url),
  }));
});
afterEach(() => {
  editor?.destroy();
  vi.unstubAllGlobals();
});

/** An uploader whose calls the test settles by hand. */
function manualUploader() {
  const calls: { file: File; resolve: (value: UploadedImage) => void; reject: (error: Error) => void }[] = [];
  const upload: ImageConfig['upload'] = (file) =>
    new Promise((resolve, reject) => {
      calls.push({ file, resolve, reject });
    });
  return { upload, calls };
}

function setup(config: ImageConfig, transport?: InkpilotTransport) {
  editor = new Editor({
    element: document.createElement('div'),
    extensions: [
      ...createInkpilotKit(),
      ImageUploadExtension.configure({ getConfig: () => config, getTransport: () => transport }),
    ],
    content: '<p>Before</p><p>After</p>',
  });
}

const png = (name = 'chart.png') => new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' });

function images() {
  const found: { src: string; alt: string; uploadId: string | null }[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image') found.push({ src: node.attrs.src, alt: node.attrs.alt, uploadId: node.attrs.uploadId });
  });
  return found;
}

describe('image uploads', () => {
  it('shows a preview, then swaps in the uploaded URL and revokes the preview', async () => {
    const { upload, calls } = manualUploader();
    setup({ upload, autoAltText: false });
    editor.commands.insertImageFiles([png()]);
    await flush();
    expect(images()).toEqual([{ src: 'blob:test/1', alt: '', uploadId: expect.any(String) }]);
    expect(editor.getHTML()).not.toContain('uploadId');

    calls[0].resolve({ src: 'https://cdn.example.com/chart.png' });
    await flush();
    expect(images()).toEqual([{ src: 'https://cdn.example.com/chart.png', alt: '', uploadId: null }]);
    expect(revoked).toEqual(['blob:test/1']);
  });

  it('inserts at the given position', async () => {
    setup({ upload: manualUploader().upload });
    const afterFirstParagraph = editor.state.doc.firstChild!.nodeSize;
    editor.commands.insertImageFiles([png()], afterFirstParagraph);
    const order: string[] = [];
    editor.state.doc.forEach((node) => order.push(node.type.name === 'image' ? 'image' : node.textContent));
    expect(order).toEqual(['Before', 'image', 'After']);
  });

  it('does not re-insert an image deleted while uploading', async () => {
    const { upload, calls } = manualUploader();
    setup({ upload });
    editor.commands.insertImageFiles([png()]);
    await flush();
    editor.commands.setContent('<p>Rewritten</p>');
    calls[0].resolve({ src: 'https://cdn.example.com/chart.png' });
    await flush();
    expect(images()).toEqual([]);
  });

  it('insert → undo → upload completes → redo gives the final URL', async () => {
    const { upload, calls } = manualUploader();
    setup({ upload, autoAltText: false });
    editor.commands.insertImageFiles([png()]);
    await flush();
    editor.commands.undo();
    expect(images()).toEqual([]);

    calls[0].resolve({ src: 'https://cdn.example.com/chart.png' });
    await flush();
    editor.commands.redo();
    expect(images()).toEqual([{ src: 'https://cdn.example.com/chart.png', alt: '', uploadId: null }]);
  });

  it('upload succeeds → undo → redo gives the final URL, never the revoked preview', async () => {
    const { upload, calls } = manualUploader();
    setup({ upload, autoAltText: false });
    editor.commands.insertImageFiles([png()]);
    await flush();
    calls[0].resolve({ src: 'https://cdn.example.com/chart.png' });
    await flush();

    editor.commands.undo();
    expect(images()).toEqual([]);
    editor.commands.redo();
    expect(images()).toEqual([{ src: 'https://cdn.example.com/chart.png', alt: '', uploadId: null }]);
  });

  it('a failed upload removes the image once and nothing comes back through history', async () => {
    const { upload, calls } = manualUploader();
    const onUploadError = vi.fn();
    setup({ upload, onUploadError });
    const before = editor.getJSON();
    editor.commands.insertImageFiles([png()]);
    await flush();
    calls[0].reject(new Error('Bucket is full'));
    await flush();

    expect(images()).toEqual([]);
    expect(onUploadError).toHaveBeenCalledTimes(1);
    expect(onUploadError.mock.calls[0][0].message).toBe('Bucket is full');

    editor.commands.undo();
    expect(images()).toEqual([]);
    expect(editor.getJSON()).toEqual(before);
    editor.commands.redo();
    expect(images()).toEqual([]);
  });

  it('rejects unusable URLs from the uploader', async () => {
    const { upload, calls } = manualUploader();
    const onUploadError = vi.fn();
    setup({ upload, onUploadError });
    editor.commands.insertImageFiles([png()]);
    await flush();
    calls[0].resolve({ src: 'javascript:alert(1)' });
    await flush();
    expect(images()).toEqual([]);
    expect(onUploadError).toHaveBeenCalledOnce();
  });

  it('embeds a data URL when no uploader is configured', async () => {
    setup({});
    editor.commands.insertImageFiles([png()]);
    await flush(10);
    expect(images()[0].src).toMatch(/^data:image\/png;base64,/);
  });

  it('applies AI alt text, unless the writer typed one first', async () => {
    let answer: ((alt: string) => void) | undefined;
    const transport: InkpilotTransport = {
      stream: async function* () {},
      json: () => new Promise((resolve) => (answer = (alt) => resolve({ ok: true, data: { alt } } as never))),
    };
    const { upload, calls } = manualUploader();
    setup({ upload }, transport);

    editor.commands.insertImageFiles([png()]);
    await flush();
    calls[0].resolve({ src: 'https://cdn.example.com/a.png' });
    await flush(10);
    answer!('Build time per week, before and after the fix');
    await flush();
    expect(images()[0].alt).toBe('Build time per week, before and after the fix');

    editor.commands.insertImageFiles([png('b.png')], 0);
    await flush();
    calls[1].resolve({ src: 'https://cdn.example.com/b.png' });
    await flush(10);
    const pos = editor.state.doc.firstChild!.type.name === 'image' ? 0 : -1;
    editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...editor.state.doc.firstChild!.attrs, alt: 'Typed by me' }));
    answer!('AI description');
    await flush();
    expect(images().find((i) => i.src.endsWith('b.png'))?.alt).toBe('Typed by me');
  });
});
