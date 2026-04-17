export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'svg';

export interface ImageConfig {
  maxFileSize?: number;
  maxWidth?: number;
  quality?: number;
  formats?: ImageFormat[];
  responsiveSizes?: number[];
  autoCompress?: boolean;
  autoAltText?: boolean;
}

export interface ImageProcessingResult {
  original: ProcessedImage;
  compressed?: ProcessedImage;
  responsive: ProcessedImage[];
  srcset: string;
}

export interface ProcessedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
  format: ImageFormat;
}

export interface ImageValidation {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  size: number;
  format: ImageFormat | 'unknown';
}

export const DEFAULT_IMAGE_CONFIG: Required<
  Pick<ImageConfig, 'maxFileSize' | 'maxWidth' | 'quality' | 'responsiveSizes' | 'autoCompress'>
> = {
  maxFileSize: 1024 * 1024,
  maxWidth: 2400,
  quality: 0.8,
  responsiveSizes: [480, 768, 1024, 1440],
  autoCompress: true,
};
