import { NextResponse } from 'next/server';
import { MAX_UPLOAD_BYTES } from '@/lib/upload-store';

/**
 * Stand-in for a presigning endpoint: returns where to PUT the file and its public URL.
 * In production, sign an S3/R2 URL here instead (see docs/images.md).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { filename?: string; contentType?: string; size?: number };
  if (!body.contentType?.startsWith('image/') || !body.size || body.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Only images up to 5 MB.' }, { status: 400 });
  }
  const key = `${crypto.randomUUID()}-${(body.filename ?? 'image').replace(/[^\w.-]/g, '_')}`;
  const url = `/api/upload/${encodeURIComponent(key)}`;
  return NextResponse.json({ uploadUrl: url, publicUrl: url });
}
