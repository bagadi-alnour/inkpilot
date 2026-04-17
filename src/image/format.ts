import type { ImageFormat, ImageValidation } from '@writeflow/types';

export function detectFormat(file: File): ImageFormat | 'unknown' {
  const mimeMap: Record<string, ImageFormat> = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  return mimeMap[file.type] ?? 'unknown';
}

export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

export function supportsAVIF(): Promise<boolean> {
  if (typeof Image === 'undefined') return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLanBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErZ';
  });
}

export async function validateImage(file: File, maxSize?: number): Promise<ImageValidation> {
  const format = detectFormat(file);

  if (format === 'unknown') {
    return { valid: false, error: `Unsupported image format: ${file.type}`, size: file.size, format };
  }

  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `Image size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum (${(maxSize / 1024 / 1024).toFixed(1)}MB)`,
      size: file.size,
      format,
    };
  }

  return new Promise((resolve) => {
    if (format === 'svg') {
      resolve({ valid: true, size: file.size, format });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: true, width: img.width, height: img.height, size: file.size, format });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: 'Failed to load image', size: file.size, format });
    };
    img.src = url;
  });
}
