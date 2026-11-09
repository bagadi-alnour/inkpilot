import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { Image } from '@tiptap/extension-image';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import type { Extensions, Node } from '@tiptap/core';

export interface InkpilotKitOptions {
  placeholder?: string;
  /** Replaces StarterKit's plain code block; see `EditorConfig.codeBlock`. */
  codeBlock?: Node;
}

export function createInkpilotKit(options: InkpilotKitOptions = {}): Extensions {
  return [
    // StarterKit v3 bundles Link, Underline and a plain code block.
    StarterKit.configure({
      codeBlock: options.codeBlock ? false : undefined,
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      },
    }),
    Placeholder.configure({
      placeholder: options.placeholder ?? 'Start writing...',
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
    }),
    Highlight.configure({
      multicolor: true,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    TextStyle,
    Color,
    ...(options.codeBlock ? [options.codeBlock] : []),
  ];
}
