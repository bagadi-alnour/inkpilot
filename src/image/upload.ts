import type { ImageUploader } from '@inkpilot/types';

export interface PresignedUploadOptions {
  headers?: HeadersInit | (() => HeadersInit);
  fetch?: typeof fetch;
}

interface PresignedResponse {
  uploadUrl: string;
  publicUrl: string;
  /** Extra headers the storage provider requires on the PUT. */
  headers?: Record<string, string>;
}

function isPresignedResponse(value: unknown): value is PresignedResponse {
  const record = value as Record<string, unknown> | null;
  return typeof record?.uploadUrl === 'string' && typeof record.publicUrl === 'string';
}

/**
 * Uploader for presigned URLs (S3, R2, GCS, ...). POSTs `{ filename, contentType, size }`
 * to your `endpoint`, which returns `{ uploadUrl, publicUrl }`; the file is then PUT to
 * `uploadUrl`. No storage SDK runs in the browser.
 */
export function presignedUpload(endpoint: string, options: PresignedUploadOptions = {}): ImageUploader {
  return async (file, { signal }) => {
    const fetchImpl = options.fetch ?? globalThis.fetch;
    const headers = new Headers(typeof options.headers === 'function' ? options.headers() : options.headers);
    headers.set('content-type', 'application/json');

    const presign = await fetchImpl(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      signal,
    });
    if (!presign.ok) throw new Error(`Upload URL request failed (${presign.status}).`);
    const body: unknown = await presign.json();
    if (!isPresignedResponse(body)) throw new Error('Upload URL response is missing uploadUrl or publicUrl.');

    const put = await fetchImpl(body.uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': file.type, ...body.headers },
      body: file,
      signal,
    });
    if (!put.ok) throw new Error(`Upload failed (${put.status}).`);
    return { src: body.publicUrl };
  };
}
