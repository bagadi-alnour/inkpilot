const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
};

export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

export function generateStoragePath(basePath: string | undefined, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const prefix = basePath ? `${basePath.replace(/\/$/, '')}/` : '';
  return `${prefix}${timestamp}-${random}-${sanitized}`;
}

export function validateFile(
  file: File,
  maxSize?: number,
): { valid: boolean; error?: string } {
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum (${(maxSize / 1024 / 1024).toFixed(1)}MB)`,
    };
  }
  return { valid: true };
}
