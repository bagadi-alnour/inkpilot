/**
 * In-memory image store for the demo. Lost on restart; use S3, R2 or similar in production.
 * Kept on globalThis so it survives dev-server hot reloads.
 */
const store: Map<string, { body: ArrayBuffer; type: string }> =
  ((globalThis as { __inkpilotUploads?: Map<string, { body: ArrayBuffer; type: string }> }).__inkpilotUploads ??= new Map());

export const uploads = store;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
