export interface UploadedImage {
  /** URL to put in the document: absolute `https:`, root-relative `/`, or `data:image/`. */
  src: string;
  width?: number;
  height?: number;
}

/**
 * Store an image wherever you like and return its public URL. Called with the
 * compressed file; reject (or throw) to fail the upload. Respect `signal`.
 */
export type ImageUploader = (
  file: File,
  context: { signal: AbortSignal; width: number; height: number },
) => Promise<UploadedImage>;

export interface ImageConfig {
  /** Without it, images are embedded as data URLs (fine for demos, heavy for pages). */
  upload?: ImageUploader;
  /** Compress images larger than this many bytes. Default 1 MB. */
  maxFileSize?: number;
  /** Scale images down to at most this width or height. Default 2400. */
  maxWidth?: number;
  /** Encoder quality for JPEG and WebP, 0–1. Default 0.82. */
  quality?: number;
  /** Default true. */
  autoCompress?: boolean;
  /** Ask the AI endpoint for alt text when an image is inserted. Default true when AI is configured. */
  autoAltText?: boolean;
  /** An upload failed; the image was removed from the document. */
  onUploadError?: (error: Error, file: File) => void;
}

export const DEFAULT_IMAGE_CONFIG = {
  maxFileSize: 1024 * 1024,
  maxWidth: 2400,
  quality: 0.82,
  autoCompress: true,
} as const satisfies Required<Pick<ImageConfig, 'maxFileSize' | 'maxWidth' | 'quality' | 'autoCompress'>>;
