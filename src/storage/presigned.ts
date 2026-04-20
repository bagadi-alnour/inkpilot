import type { PresignedUrlRequest, PresignedUrlResponse, UploadedFile } from '@inkpilot/types';
import { InkpilotError } from '@inkpilot/utils';

export async function fetchPresignedUrl(
  endpoint: string,
  request: PresignedUrlRequest,
): Promise<PresignedUrlResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new InkpilotError(
      `Failed to get presigned URL: ${response.status} ${response.statusText}`,
      'PRESIGNED_URL_FAILED',
    );
  }

  return (await response.json()) as PresignedUrlResponse;
}

export async function uploadViaPresignedUrl(
  file: File,
  presigned: PresignedUrlResponse,
): Promise<UploadedFile> {
  const response = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!response.ok) {
    throw new InkpilotError(
      `Upload failed: ${response.status} ${response.statusText}`,
      'UPLOAD_FAILED',
    );
  }

  return {
    key: presigned.key,
    url: presigned.publicUrl,
    size: file.size,
    mimeType: file.type,
  };
}
