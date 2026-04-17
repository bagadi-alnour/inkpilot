export type StorageProvider = 's3' | 'gcs' | 'azure';

export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
  endpoint?: string;
  basePath?: string;

  /**
   * RECOMMENDED (client-safe): Backend endpoint that returns presigned upload URLs.
   * The editor calls this endpoint before each upload. No credentials in the browser.
   */
  presignedUrlEndpoint?: string;

  /**
   * ADVANCED / SERVER-SIDE ONLY: Direct credentials.
   * WARNING: Never use in client-side code — these will be exposed in the browser bundle.
   * Only use in server-side contexts (API routes, server actions, SSR).
   */
  accessKeyId?: string;
  /** @see accessKeyId */
  secretAccessKey?: string;

  /** GCS-specific */
  projectId?: string;
  /** Azure-specific */
  accountName?: string;
  /** Azure-specific */
  accountKey?: string;

  onUpload?: (file: UploadedFile) => void;
}

export interface UploadedFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface PresignedUrlRequest {
  filename: string;
  contentType: string;
  size: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number;
  contentType?: string;
}

export interface StorageAdapter {
  put(file: File, path: string): Promise<UploadedFile>;
  get(key: string): Promise<string>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<UploadedFile[]>;
  getPresignedUrl(key: string, options?: PresignedUrlOptions): Promise<string>;
}
