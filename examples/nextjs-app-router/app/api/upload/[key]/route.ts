import { MAX_UPLOAD_BYTES, uploads } from '@/lib/upload-store';

type Params = { params: Promise<{ key: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { key } = await params;
  const type = request.headers.get('content-type') ?? '';
  const body = await request.arrayBuffer();
  if (!type.startsWith('image/') || body.byteLength > MAX_UPLOAD_BYTES) return new Response('Bad upload', { status: 400 });
  uploads.set(key, { body, type });
  return new Response(null, { status: 200 });
}

export async function GET(_request: Request, { params }: Params) {
  const { key } = await params;
  const file = uploads.get(key);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(file.body, { headers: { 'content-type': file.type, 'cache-control': 'public, max-age=3600' } });
}
