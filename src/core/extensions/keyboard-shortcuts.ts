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
      // Mod-Shift-R / P are browser reload and private window; Alt avoids both.
      'Mod-Alt-r': () => {
        this.options.onRewrite?.();
        return true;
      },
      'Mod-Alt-p': () => {
        this.options.onPublish?.();
        return true;
      },
    };
  },
});
