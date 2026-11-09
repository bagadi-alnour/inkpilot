import { describe, it, expect, vi } from 'vitest';
import { createFetchTransport } from '../../src/ai/transport';
import type { StreamEvent, StreamRequest } from '../../src/protocol';

const REQUEST: StreamRequest = {
  v: 1,
  task: 'fix',
  issue: { code: 'long-sentence', params: { words: 40, limit: 25 } },
  html: '<p>Long text</p>',
  before: '',
  after: '',
  locale: 'en',
  seo: { keywords: [] },
};

function ndjsonResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8' } });
}

async function collect(fetchImpl: typeof fetch, signal = new AbortController().signal): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of createFetchTransport({ endpoint: '/api/inkpilot', fetch: fetchImpl }).stream(REQUEST, signal)) {
    events.push(event);
  }
  return events;
}

describe('createFetchTransport', () => {
  it('parses events split across chunks and stops at done', async () => {
    const fetchImpl = vi.fn(async () =>
      ndjsonResponse(['{"type":"delta","te', 'xt":"<p>Sho"}\n{"type":"delta","text":"rt</p>"}\n', '{"type":"done","finishReason":"stop"}\n']),
    );
    expect(await collect(fetchImpl)).toEqual([
      { type: 'delta', text: '<p>Sho' },
      { type: 'delta', text: 'rt</p>' },
      { type: 'done', finishReason: 'stop' },
    ]);
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual(REQUEST);
  });

  it('reports a stream that ends without done as incomplete', async () => {
    const events = await collect(async () => ndjsonResponse(['{"type":"delta","text":"<p>Half"}\n']));
    expect(events.at(-1)).toMatchObject({ type: 'error', code: 'incomplete' });
  });

  it('skips malformed lines', async () => {
    const events = await collect(async () => ndjsonResponse(['not json\n{"type":"nope"}\n{"type":"done","finishReason":"stop"}\n']));
    expect(events).toEqual([{ type: 'done', finishReason: 'stop' }]);
  });

  it('turns a protocol error response into an error event', async () => {
    const events = await collect(async () =>
      Response.json({ error: { code: 'unauthorized', message: 'Not allowed.' } }, { status: 401 }),
    );
    expect(events).toEqual([{ type: 'error', code: 'unauthorized', message: 'Not allowed.' }]);
  });

  it('reports network failures and stays silent when aborted', async () => {
    const failing = async () => {
      throw new TypeError('fetch failed');
    };
    expect(await collect(failing)).toEqual([expect.objectContaining({ type: 'error', code: 'network' })]);

    const controller = new AbortController();
    controller.abort();
    expect(await collect(failing, controller.signal)).toEqual([]);
  });

  it('returns typed JSON results and flags malformed bodies', async () => {
    const article = { v: 1 as const, locale: 'en', seo: { keywords: [] }, title: '', outline: [], excerpt: 'Body' };
    const transport = (body: unknown) => createFetchTransport({ endpoint: '/x', fetch: async () => Response.json(body) });
    const signal = new AbortController().signal;

    expect(await transport({ titles: ['A'] }).json({ ...article, task: 'titles' }, signal)).toEqual({ ok: true, data: { titles: ['A'] } });
    expect(await transport({ titles: 'A' }).json({ ...article, task: 'titles' }, signal)).toMatchObject({ ok: false, code: 'invalid-output' });
  });
});
