import type { ImageConfig } from '@inkpilot/types';
import { DEFAULT_IMAGE_CONFIG } from '@inkpilot/types';

export interface PreparedImage {
  file: File;
  width: number;
  height: number;
}

/** Formats a canvas can re-encode without losing what makes them that format. */
const REENCODABLE: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/webp': 'image/webp',
  // PNG photos shrink a lot as WebP, which keeps transparency.
  'image/png': 'image/webp',
};

async function decode(file: File): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap === 'undefined') return null;
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

function encode(bitmap: ImageBitmap, width: number, height: number, type: string, quality: number): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Read an image's size and, when it is too large, scale and re-encode it on a canvas.
 * GIF and SVG pass through untouched; so does anything the result would make bigger.
 */
export async function prepareImage(file: File, config: ImageConfig = {}): Promise<PreparedImage> {
  const { maxFileSize, maxWidth, quality, autoCompress } = { ...DEFAULT_IMAGE_CONFIG, ...config };
  const bitmap = await decode(file);
  if (!bitmap) return { file, width: 0, height: 0 };

  const { width, height } = bitmap;
  const type = REENCODABLE[file.type];
  const tooBig = file.size > maxFileSize || Math.max(width, height) > maxWidth;
  if (!autoCompress || !type || !tooBig) {
    bitmap.close();
    return { file, width, height };
  }

  const scale = Math.min(1, maxWidth / Math.max(width, height));
  const target = { width: Math.round(width * scale), height: Math.round(height * scale) };
  const blob = await encode(bitmap, target.width, target.height, type, quality);
  bitmap.close();
  if (!blob || blob.size >= file.size) return { file, width, height };

  const name = type === file.type ? file.name : file.name.replace(/\.[^.]+$/, '') + '.webp';
  return { file: new File([blob], name, { type }), ...target };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read the image.'));
    reader.readAsDataURL(blob);
  });
}
