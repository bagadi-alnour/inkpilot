import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  quality: number;
  useWebWorker: boolean;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2400,
  quality: 0.8,
  useWebWorker: true,
};

export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMB,
    maxWidthOrHeight: opts.maxWidthOrHeight,
    useWebWorker: opts.useWebWorker,
    initialQuality: opts.quality,
  });

  return compressed;
}
