import { describe, it, expect, vi } from 'vitest';
import { presignedUpload } from '../../src/image/upload';

const file = new File(['png'], 'chart.png', { type: 'image/png' });
const context = { signal: new AbortController().signal, width: 40, height: 30 };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('presignedUpload', () => {
  it('asks the endpoint for a URL, PUTs the file there and returns the public URL', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ uploadUrl: 'https://bucket.example.com/put?sig=1', publicUrl: 'https://cdn.example.com/chart.png', headers: { 'x-amz-acl': 'public-read' } }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const upload = presignedUpload('/api/upload', { fetch, headers: () => ({ authorization: 'Bearer t' }) });

    await expect(upload(file, context)).resolves.toEqual({ src: 'https://cdn.example.com/chart.png' });

    const [presignUrl, presignInit] = fetch.mock.calls[0];
    expect(presignUrl).toBe('/api/upload');
    expect(new Headers(presignInit?.headers).get('authorization')).toBe('Bearer t');
    expect(JSON.parse(String(presignInit?.body))).toEqual({ filename: 'chart.png', contentType: 'image/png', size: 3 });

    const [putUrl, putInit] = fetch.mock.calls[1];
    expect(putUrl).toBe('https://bucket.example.com/put?sig=1');
    expect(putInit).toMatchObject({ method: 'PUT', body: file, signal: context.signal, headers: { 'content-type': 'image/png', 'x-amz-acl': 'public-read' } });
  });

  it.each([
    ['the URL request fails', [json({ error: 'nope' }, 500)], 'Upload URL request failed (500).'],
    ['the endpoint answers without URLs', [json({ url: 'x' })], 'Upload URL response is missing uploadUrl or publicUrl.'],
    ['storage refuses the file', [json({ uploadUrl: 'https://b/put', publicUrl: 'https://c/x.png' }), new Response(null, { status: 403 })], 'Upload failed (403).'],
  ])('rejects when %s', async (_case, responses, message) => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    for (const response of responses) fetch.mockResolvedValueOnce(response);
    await expect(presignedUpload('/api/upload', { fetch })(file, context)).rejects.toThrow(message);
  });
});
