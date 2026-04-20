import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Editor } from '../../src/react/editor';

const { mockEditor, captureUseEditorConfig } = vi.hoisted(() => {
  const run = vi.fn();
  const chainable = {
    focus: () => chainable,
    toggleBold: () => chainable,
    toggleItalic: () => chainable,
    toggleUnderline: () => chainable,
    toggleStrike: () => chainable,
    toggleHeading: () => chainable,
    toggleBulletList: () => chainable,
    toggleOrderedList: () => chainable,
    toggleBlockquote: () => chainable,
    toggleCodeBlock: () => chainable,
    undo: () => chainable,
    redo: () => chainable,
    deleteRange: () => ({
      insertContentAt: () => ({ run }),
    }),
    run,
  };

  const mockEditor = {
    getHTML: vi.fn(() => '<p>Hello</p>'),
    getJSON: vi.fn(() => ({ type: 'doc', content: [] })),
    isEmpty: false,
    isActive: vi.fn(() => false),
    chain: () => chainable,
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
    can: () => () => false,
  };

  let lastConfig: Record<string, unknown> | undefined;

  return {
    mockEditor,
    captureUseEditorConfig: {
      get last() {
        return lastConfig;
      },
      setLast(c: Record<string, unknown>) {
        lastConfig = c;
      },
    },
  };
});

vi.mock('@tiptap/react', () => ({
  EditorContent: ({ editor }: { editor: unknown }) =>
    editor ? <div data-testid="editor-content" /> : null,
  useEditor: (config: Record<string, unknown>) => {
    captureUseEditorConfig.setLast(config);
    React.useEffect(() => {
      const onUpdate = config.onUpdate as
        | ((args: { editor: typeof mockEditor }) => void)
        | undefined;
      onUpdate?.({ editor: mockEditor });
    }, []);
    return mockEditor;
  },
}));

function getPlaceholderFromUseEditorConfig(): string | undefined {
  const ext = captureUseEditorConfig.last?.extensions as
    | Array<{ name?: string; options?: { placeholder?: string } }>
    | undefined;
  const placeholderExt = ext?.find((e) => e?.name === 'placeholder');
  return placeholderExt?.options?.placeholder;
}

function getPublishHandlerFromUseEditorConfig(): (() => void) | undefined {
  const ext = captureUseEditorConfig.last?.extensions as
    | Array<{ name?: string; options?: { onPublish?: () => void } }>
    | undefined;
  const shortcutExt = ext?.find((e) => e?.name === 'inkpilotKeyboardShortcuts');
  return shortcutExt?.options?.onPublish;
}

describe('Editor', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<Editor />);
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('accepts className and style props', () => {
    const { container } = render(
      <Editor className="my-editor" style={{ maxWidth: 400 }} />,
    );
    const root = container.querySelector('.inkpilot-editor.my-editor');
    expect(root).toBeInTheDocument();
    expect(root).toHaveStyle({ maxWidth: '400px' });
  });

  it('fires onChange callback with EditorContent', () => {
    const onChange = vi.fn();
    render(<Editor onChange={onChange} />);

    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(onChange).toHaveBeenCalled();

    const payload = onChange.mock.calls[0][0];
    expect(payload).toMatchObject({
      html: '<p>Hello</p>',
      text: expect.any(String),
      wordCount: expect.any(Number),
      readingTime: expect.any(Number),
    });
  });

  it('renders toolbar when not readOnly', () => {
    render(<Editor />);
    expect(screen.getByRole('toolbar', { name: 'Formatting tools' })).toBeInTheDocument();
  });

  it('hides toolbar when readOnly=true', () => {
    render(<Editor readOnly />);
    expect(screen.queryByRole('toolbar', { name: 'Formatting tools' })).not.toBeInTheDocument();
  });

  it('shows placeholder text via Placeholder extension config', () => {
    render(<Editor placeholder="Write your story here" />);
    expect(getPlaceholderFromUseEditorConfig()).toBe('Write your story here');
  });

  it('publishes directly when SEO config is omitted', async () => {
    const onPublish = vi.fn();
    render(<Editor onPublish={onPublish} />);

    await act(async () => {
      getPublishHandlerFromUseEditorConfig()?.();
      await Promise.resolve();
    });

    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(onPublish.mock.calls[0][0]).toMatchObject({
      html: '<p>Hello</p>',
      text: expect.any(String),
    });
    expect(onPublish.mock.calls[0][1]).toEqual({
      score: 0,
      issues: [],
      suggestions: [],
    });
  });
});
