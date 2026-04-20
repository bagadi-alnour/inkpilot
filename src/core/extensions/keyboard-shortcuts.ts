import { Extension } from '@tiptap/core';

export interface KeyboardShortcutsOptions {
  onRewrite?: () => void;
  onPublish?: () => void;
}

export const KeyboardShortcutsExtension = Extension.create<KeyboardShortcutsOptions>({
  name: 'inkpilotKeyboardShortcuts',

  addOptions() {
    return {
      onRewrite: undefined,
      onPublish: undefined,
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-r': () => {
        this.options.onRewrite?.();
        return true;
      },
      'Mod-Shift-p': () => {
        this.options.onPublish?.();
        return true;
      },
    };
  },
});
