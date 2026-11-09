import { describe, it, expect, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import { createInkpilotKit } from '../../src/core/extensions/inkpilot-kit';
import { KeyboardShortcutsExtension } from '../../src/core/extensions/keyboard-shortcuts';

function press(editor: Editor, init: KeyboardEventInit & { keyCode: number }) {
  const event = new KeyboardEvent('keydown', init);
  // jsdom ignores `keyCode` in the init dictionary.
  Object.defineProperty(event, 'keyCode', { value: init.keyCode });
  editor.view.someProp('handleKeyDown', (handler) => handler(editor.view, event));
}

describe('keyboard shortcuts', () => {
  const onRewrite = vi.fn();
  const onPublish = vi.fn();
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [...createInkpilotKit(), KeyboardShortcutsExtension.configure({ onRewrite, onPublish })],
  });

  it('fire with Mod+Alt and the plain letter', () => {
    press(editor, { key: 'r', code: 'KeyR', keyCode: 82, ctrlKey: true, altKey: true });
    press(editor, { key: 'p', code: 'KeyP', keyCode: 80, ctrlKey: true, altKey: true });
    expect(onRewrite).toHaveBeenCalledTimes(1);
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  // macOS Option turns R into ® and P into π, so the event's `key` isn't the letter.
  it('fire when Alt changes the typed character', () => {
    press(editor, { key: '®', code: 'KeyR', keyCode: 82, ctrlKey: true, altKey: true });
    press(editor, { key: 'π', code: 'KeyP', keyCode: 80, ctrlKey: true, altKey: true });
    expect(onRewrite).toHaveBeenCalledTimes(2);
    expect(onPublish).toHaveBeenCalledTimes(2);
  });
});
