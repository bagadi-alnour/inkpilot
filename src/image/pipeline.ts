import type { ImageConfig, ImageProcessingResult, StorageAdapter } from '@writeflow/types';
import { DEFAULT_IMAGE_CONFIG } from '@writeflow/types';
import { compressImage } from './compress';
import { validateImage } from './format';
import { generateResponsiveSizes } from './resize';

export interface ImagePipelineOptions {
  config?: ImageConfig;
  storage?: StorageAdapter;
}

export async function processImage(
  file: File,
  options: ImagePipelineOptions = {},
): Promise<ImageProcessingResult> {
  const config = {
    maxFileSize: options.config?.maxFileSize ?? DEFAULT_IMAGE_CONFIG.maxFileSize,
    maxWidth: options.config?.maxWidth ?? DEFAULT_IMAGE_CONFIG.maxWidth,
    quality: options.config?.quality ?? DEFAULT_IMAGE_CONFIG.quality,
    responsiveSizes: options.config?.responsiveSizes ?? DEFAULT_IMAGE_CONFIG.responsiveSizes,
    autoCompress: options.config?.autoCompress ?? DEFAULT_IMAGE_CONFIG.autoCompress,
  };

  const validation = await validateImage(file, config.maxFileSize * 5);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid image');
  }

  const originalUrl = URL.createObjectURL(file);
  const original = {
    blob: file,
    url: originalUrl,
    width: validation.width ?? 0,
    height: validation.height ?? 0,
    size: file.size,
    format: validation.format === 'unknown' ? ('jpeg' as const) : validation.format,
  };

  let compressed = undefined;
  let workingFile = file;

  if (config.autoCompress) {
    const compressedFile = await compressImage(file, {
      maxSizeMB: config.maxFileSize / (1024 * 1024),
      maxWidthOrHeight: config.maxWidth,
      quality: config.quality,
    });

    if (compressedFile.size < file.size) {
      const compressedUrl = URL.createObjectURL(compressedFile);
      compressed = {
        blob: compressedFile,
        url: compressedUrl,
        width: original.width,
        height: original.height,
        size: compressedFile.size,
        format: original.format,
      };
      workingFile = compressedFile;
    }
  }

  const resized = await generateResponsiveSizes(workingFile, config.responsiveSizes);

  const responsive = resized.map((r) => ({
    blob: r.blob,
    url: URL.createObjectURL(r.blob),
    width: r.width,
    height: r.height,
    size: r.blob.size,
    format: original.format,
  }));

  const srcsetParts = responsive.map((r) => `${r.url} ${r.width}w`);
  const srcset = srcsetParts.join(', ');

  return { original, compressed, responsive, srcset };
}
