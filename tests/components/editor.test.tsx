import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Editor as TiptapEditor } from '@tiptap/core';
import { Editor } from '../../src/react/editor';
import type { EditorProps } from '../../src/react/editor';
import type { PublishMeta, PublishPayload } from '../../src/types/editor';
import { flush, LONG_PARAGRAPH } from '../helpers/editor';

afterEach(cleanup);

async function renderEditor(props: Partial<EditorProps> = {}) {
  const view = render(<Editor content={{ html: '<h1>How we cut our Next.js build time in half</h1><p>Short intro.</p>' }} {...props} />);
  const element = await waitFor(() => {
    const found = view.container.querySelector('.ProseMirror') as (HTMLElement & { editor?: TiptapEditor }) | null;
    if (!found?.editor) throw new Error('editor not ready');
    return found;
  });
  return { ...view, editor: element.editor! };
}

const keyPublish = (editor: TiptapEditor) =>
  act(() => {
    editor.view.someProp('handleKeyDown', (handler) =>
      handler(editor.view, new KeyboardEvent('keydown', { key: 'p', code: 'KeyP', altKey: true, ctrlKey: true })),
    );
  });

describe('Editor', () => {
  it('renders the toolbar and content, and hides the toolbar when read-only', async () => {
    const { container, unmount } = await renderEditor();
    expect(container.querySelector('[role="toolbar"]')).not.toBeNull();
    expect(screen.getByText('Short intro.')).toBeDefined();
    unmount();

    const readOnly = await renderEditor({ readOnly: true });
    expect(readOnly.container.querySelector('[role="toolbar"]')).toBeNull();
  });

  it('reports content changes with html, markdown and counts', async () => {
    const onChange = vi.fn();
    const { editor } = await renderEditor({ onChange });
    act(() => {
      editor.commands.insertContentAt(editor.state.doc.content.size, '<p>More words here.</p>');
    });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.lastCall![0]).toMatchObject({ markdown: expect.stringContaining('More words here.'), wordCount: 14 });
  });

  it('publishes the exact current content with the analysis of that content', async () => {
    const onPublish = vi.fn<(payload: PublishPayload) => void>();
    const { editor } = await renderEditor({ onPublish, seo: { prePublishPanel: false } });
    act(() => {
      editor.commands.insertContentAt(editor.state.doc.content.size, `<p>${LONG_PARAGRAPH}</p>`);
    });
    // Publish immediately, before the debounced live report has caught up.
    keyPublish(editor);

    expect(onPublish).toHaveBeenCalledTimes(1);
    const { content, report, meta } = onPublish.mock.calls[0][0];
    expect(content.text).toContain('We started by measuring');
    expect(report.issues.some((issue) => issue.code === 'long-sentence')).toBe(true);
    expect(meta).toEqual({ title: '', description: '', slug: 'how-we-cut-our-next-js-build-time-in-half' });
  });

  it('refuses to publish while an image is uploading', async () => {
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:test/1', revokeObjectURL: () => undefined }));
    const onPublish = vi.fn();
    const upload = () => new Promise<never>(() => undefined);
    const { editor } = await renderEditor({ onPublish, image: { upload }, seo: { prePublishPanel: false } });
    act(() => {
      editor.commands.insertImageFiles([new File(['x'], 'a.png', { type: 'image/png' })]);
    });
    await act(() => flush());
    keyPublish(editor);
    expect(onPublish).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('keeps the issue popover open while the pointer moves onto it', async () => {
    const { container, editor } = await renderEditor({
      content: { html: `<h1>How we cut our Next.js build time in half</h1><p>${LONG_PARAGRAPH}</p>` },
      ai: { endpoint: '/api/inkpilot' },
    });
    const underline = await waitFor(() => container.querySelector('[data-ip-issue]')!, { timeout: 2000 });
    fireEvent.mouseOver(underline);
    const popover = screen.getByRole('dialog');

    // The browser's order when the pointer crosses from the text onto the popover: React's
    // onMouseEnter (dispatched from `mouseout`) runs before the editor's `mouseleave`.
    fireEvent.mouseOver(editor.view.dom.querySelector('p')!);
    fireEvent.mouseEnter(popover);
    editor.view.dom.dispatchEvent(new MouseEvent('mouseleave'));
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));

    expect(screen.getByRole('button', { name: 'Fix with AI' })).toBeDefined();
  });

  it('hands the editor to onReady, whose requestPublish opens the publish panel', async () => {
    const onReady = vi.fn<(editor: TiptapEditor) => void>();
    const { editor } = await renderEditor({ onReady });
    expect(onReady).toHaveBeenCalledWith(editor);
    act(() => {
      editor.commands.requestPublish();
    });
    expect(screen.getByRole('complementary', { name: 'Review and publish' })).toBeDefined();
  });

  it('opens the publish panel from the score; the slug follows the title until edited', async () => {
    const onMetaChange = vi.fn<(meta: PublishMeta) => void>();
    await renderEditor({ onMetaChange });
    fireEvent.click(screen.getByRole('button', { name: /Inkpilot checks/ }));
    expect(screen.getByRole('complementary', { name: 'Review and publish' })).toBeDefined();

    const slug = screen.getByLabelText('Slug') as HTMLInputElement;
    expect(slug.value).toBe('how-we-cut-our-next-js-build-time-in-half');

    fireEvent.change(screen.getByLabelText(/SEO title/), { target: { value: 'Faster CI builds' } });
    expect(slug.value).toBe('faster-ci-builds');

    fireEvent.change(slug, { target: { value: 'my-slug' } });
    fireEvent.change(screen.getByLabelText(/SEO title/), { target: { value: 'Another title' } });
    expect(slug.value).toBe('my-slug');
    expect(onMetaChange.mock.lastCall![0]).toEqual({ title: 'Another title', description: '', slug: 'my-slug' });
  });
});
