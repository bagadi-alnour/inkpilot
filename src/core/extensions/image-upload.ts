import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { StorageConfig } from '@writeflow/types';
import type { ImageConfig } from '@writeflow/types';

export interface ImageUploadOptions {
  storage?: StorageConfig;
  image?: ImageConfig;
  onUploadStart?: (file: File) => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

const imageUploadPluginKey = new PluginKey('imageUpload');

export const ImageUploadExtension = Extension.create<ImageUploadOptions>({
  name: 'imageUpload',

  addOptions() {
    return {
      storage: undefined,
      image: undefined,
      onUploadStart: undefined,
      onUploadComplete: undefined,
      onUploadError: undefined,
    };
  },

  addStorage() {
    return {
      uploading: false,
      progress: 0,
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const opts = this.options;

    return [
      new Plugin({
        key: imageUploadPluginKey,
        props: {
          handleDrop(view, event) {
            const files = event.dataTransfer?.files;
            if (!files?.length) return false;

            const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
            if (!imageFiles.length) return false;

            event.preventDefault();

            for (const file of imageFiles) {
              opts.onUploadStart?.(file);
              const url = URL.createObjectURL(file);
              editor.chain().focus().setImage({ src: url, alt: '' }).run();
            }

            return true;
          },

          handlePaste(view, event) {
            const files = event.clipboardData?.files;
            if (!files?.length) return false;

            const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
            if (!imageFiles.length) return false;

            event.preventDefault();

            for (const file of imageFiles) {
              opts.onUploadStart?.(file);
              const url = URL.createObjectURL(file);
              editor.chain().focus().setImage({ src: url, alt: '' }).run();
            }

            return true;
          },
        },
      }),
    ];
  },
});
