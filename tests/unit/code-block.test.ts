import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import { createInkpilotKit } from '../../src/core/extensions/inkpilot-kit';
import type { InkpilotKitOptions } from '../../src/core/extensions/inkpilot-kit';

const SNIPPET = '<pre><code class="language-javascript">const answer = 42;</code></pre>';

function editorWith(options: InkpilotKitOptions) {
  const element = document.createElement('div');
  const editor = new Editor({ element, extensions: createInkpilotKit(options), content: SNIPPET });
  const codeBlocks = editor.extensionManager.extensions.filter((extension) => extension.name === 'codeBlock');
  return { editor, element, codeBlocks };
}

describe('code block', () => {
  it('is a plain code block by default', () => {
    const { editor, element, codeBlocks } = editorWith({});
    expect(codeBlocks).toHaveLength(1);
    expect(editor.state.doc.firstChild?.type.name).toBe('codeBlock');
    expect(editor.state.doc.firstChild?.attrs.language).toBe('javascript');
    expect(element.querySelector('[class^="hljs-"]')).toBeNull();
  });

  it('uses the code block the app passes instead of the plain one', () => {
    const lowlight = createLowlight({ javascript });
    const { element, codeBlocks } = editorWith({ codeBlock: CodeBlockLowlight.configure({ lowlight }) });
    expect(codeBlocks).toHaveLength(1);
    expect(element.querySelector('.hljs-keyword')?.textContent).toBe('const');
  });
});
