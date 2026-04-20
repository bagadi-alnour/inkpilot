import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { StorageConfig, ImageConfig } from '@inkpilot/types';
import { blobToDataUrl, processImage, revokeImageProcessingResult } from '@inkpilot/image';
import { createStorageAdapter } from '@inkpilot/storage';

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

    const storageAdapter = opts.storage ? createStorageAdapter(opts.storage) : null;

    async function handleFile(file: File) {
      opts.onUploadStart?.(file);
      let imageResult: Awaited<ReturnType<typeof processImage>> | null = null;

      try {
        imageResult = await processImage(file, {
          config: opts.image,
          storage: storageAdapter ?? undefined,
        });

        const processed = imageResult.compressed ?? imageResult.original;
        let url: string;

        if (storageAdapter) {
          const blob = processed.blob;
          const uploadFile = blob instanceof File
            ? blob
            : new File([blob], file.name, { type: blob.type || file.type });
          const uploaded = await storageAdapter.put(uploadFile, file.name);
          url = uploaded.url;
        } else {
          url = await blobToDataUrl(processed.blob);
        }

        const alt = file.name.replace(/\.[^.]+$/, '');
        editor.chain().focus().setImage({ src: url, alt }).run();
        revokeImageProcessingResult(imageResult);
        opts.onUploadComplete?.(url);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Image processing failed');
        opts.onUploadError?.(error);

        if (imageResult) {
          revokeImageProcessingResult(imageResult);
        }
        const fallbackUrl = await blobToDataUrl(file);
        const alt = file.name.replace(/\.[^.]+$/, '');
        editor.chain().focus().setImage({ src: fallbackUrl, alt }).run();
      }
    }

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
              void handleFile(file);
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
              void handleFile(file);
            }

            return true;
          },
        },
      }),
    ];
  },
});
