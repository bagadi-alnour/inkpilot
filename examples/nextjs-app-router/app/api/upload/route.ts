import { NextResponse } from 'next/server';

type PresignedBody = {
  filename?: string;
  contentType?: string;
  size?: number;
};

/**
 * Mock presigned-URL response for local demos. Replace with a real signer in production.
 */
export async function POST(request: Request) {
  let body: PresignedBody = {};
  try {
    body = (await request.json()) as PresignedBody;
  } catch {
    body = {};
  }

  const filename = typeof body.filename === 'string' && body.filename.length > 0 ? body.filename : 'upload.bin';

  return NextResponse.json({
    uploadUrl: 'https://httpbin.org/put',
    publicUrl: `https://example.com/demo/${encodeURIComponent(filename)}`,
    key: filename,
  });
}
