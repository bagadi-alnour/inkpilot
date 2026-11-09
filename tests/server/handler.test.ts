// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { createInkpilotHandler } from '../../src/server';
import type { StreamEvent, StreamRequest } from '../../src/protocol';

const USAGE = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

type Part = Parameters<typeof simulateReadableStream>[0]['chunks'][number];

function modelStreaming(text: string[], finish: 'stop' | 'length' | 'error' = 'stop') {
  const chunks: Part[] = [
    { type: 'stream-start', warnings: [] },
    { type: 'text-start', id: 't' },
    ...text.map((delta) => ({ type: 'text-delta', id: 't', delta })),
    { type: 'text-end', id: 't' },
    { type: 'finish', finishReason: { unified: finish, raw: finish }, usage: USAGE },
  ];
  return new MockLanguageModelV4({ doStream: async () => ({ stream: simulateReadableStream({ chunks }) }) });
}

const VALID: StreamRequest = {
  v: 1,
  task: 'fix',
  issue: { code: 'long-sentence', params: { words: 40, limit: 25 } },
  html: '<p>A very long sentence.</p>',
  before: 'Intro.',
  after: 'Outro.',
  locale: 'en',
  seo: { keywords: ['next.js build time'] },
};

const post = (body: unknown, init: RequestInit = {}) =>
  new Request('http://localhost/api/inkpilot', { method: 'POST', body: JSON.stringify(body), ...init });

async function events(response: Response): Promise<StreamEvent[]> {
  const text = await response.text();
  return text.trim().split('\n').map((line) => JSON.parse(line) as StreamEvent);
}

describe('createInkpilotHandler', () => {
  it('streams deltas and finishes with done', async () => {
    const model = modelStreaming(['<p>A short', ' sentence.</p>']);
    const handler = createInkpilotHandler({ model, authorize: 'public' });
    const response = await handler(post(VALID));

    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    expect(await events(response)).toEqual([
      { type: 'delta', text: '<p>A short' },
      { type: 'delta', text: ' sentence.</p>' },
      { type: 'done', finishReason: 'stop' },
    ]);
    const prompt = JSON.stringify(model.doStreamCalls[0].prompt);
    expect(prompt).toContain('A very long sentence.');
    expect(prompt).toContain('next.js build time');
  });

  it('reports a length finish as truncated, never done', async () => {
    const handler = createInkpilotHandler({ model: modelStreaming(['<p>Half'], 'length'), authorize: 'public' });
    const result = await events(await handler(post(VALID)));
    expect(result.at(-1)).toMatchObject({ type: 'error', code: 'truncated' });
    expect(result.some((e) => e.type === 'done')).toBe(false);
  });

  it('reports model errors as an error event', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new Error('provider down');
      },
    });
    const errors: unknown[] = [];
    const handler = createInkpilotHandler({ model, authorize: 'public', onError: (e) => errors.push(e) });
    const result = await events(await handler(post(VALID)));
    expect(result.at(-1)).toMatchObject({ type: 'error', code: 'model-error' });
    expect(JSON.stringify(result)).not.toContain('provider down');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('requires authorization unless explicitly public', async () => {
    const handler = createInkpilotHandler({ model: modelStreaming(['x']), authorize: (req) => req.headers.get('x-user') === 'me' });
    const denied = await handler(post(VALID));
    expect(denied.status).toBe(401);
    expect(await denied.json()).toMatchObject({ error: { code: 'unauthorized' } });

    const allowed = await handler(post(VALID, { headers: { 'x-user': 'me' } }));
    expect(allowed.status).toBe(200);
  });

  it('rejects bad bodies, unknown tasks and oversized input before calling the model', async () => {
    const model = modelStreaming(['x']);
    const handler = createInkpilotHandler({ model, authorize: 'public', limits: { maxInputChars: 100 } });

    expect((await handler(new Request('http://localhost', { method: 'POST', body: '{nope' }))).status).toBe(400);
    expect((await handler(post({ ...VALID, task: 'chat' }))).status).toBe(400);
    expect((await handler(post({ ...VALID, issue: { code: 'anything', params: {} } }))).status).toBe(400);
    expect((await handler(post({ ...VALID, html: `<p>${'a'.repeat(200)}</p>` }))).status).toBe(413);
    expect((await handler(new Request('http://localhost', { method: 'GET' }))).status).toBe(405);
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it('streams selection rewrites with tone and intent in the prompt', async () => {
    const model = modelStreaming(['<p>Done.</p>']);
    const handler = createInkpilotHandler({ model, authorize: 'public' });
    const result = await events(
      await handler(post({ ...VALID, task: 'rewrite', tone: 'formal', intent: 'simplify', preserveMeaning: true, issue: undefined })),
    );
    expect(result.at(-1)).toEqual({ type: 'done', finishReason: 'stop' });
    expect(JSON.stringify(model.doStreamCalls[0].prompt)).toContain('professional, authoritative');
  });

  it('returns schema-checked JSON for title suggestions', async () => {
    const article = { v: 1, locale: 'en', seo: { keywords: [] }, title: 'Draft', outline: ['Intro'], excerpt: 'Body text.' };
    const generating = (text: string) =>
      new MockLanguageModelV4({
        doGenerate: async () => ({
          content: [{ type: 'text', text }],
          finishReason: { unified: 'stop', raw: 'stop' },
          usage: USAGE,
          warnings: [],
        }),
      });

    const ok = await createInkpilotHandler({ model: generating('{"titles":["One","Two"]}'), authorize: 'public' })(
      post({ ...article, task: 'titles' }),
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ titles: ['One', 'Two'] });

    const bad = await createInkpilotHandler({ model: generating('{"nope":true}'), authorize: 'public' })(
      post({ ...article, task: 'titles' }),
    );
    expect(bad.status).toBe(500);
    expect(await bad.json()).toMatchObject({ error: { code: 'internal' } });
  });

  it('describes an image for alt text, sending the bytes to the vision model', async () => {
    const vision = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [{ type: 'text', text: '{"alt":"Bar chart of build minutes per week"}' }],
        finishReason: { unified: 'stop', raw: 'stop' },
        usage: USAGE,
        warnings: [],
      }),
    });
    const handler = createInkpilotHandler({ model: modelStreaming(['x']), visionModel: vision, authorize: 'public', limits: { maxImageBytes: 100 } });
    const alt = { v: 1, task: 'alt', locale: 'en', image: { data: 'iVBORw0KGgo=', mediaType: 'image/png' }, context: 'Build times' };

    const response = await handler(post(alt));
    expect(await response.json()).toEqual({ alt: 'Bar chart of build minutes per week' });
    expect(JSON.stringify(vision.doGenerateCalls[0].prompt)).toContain('"type":"file"');

    expect((await handler(post({ ...alt, image: { data: 'A'.repeat(400), mediaType: 'image/png' } }))).status).toBe(413);
    expect((await handler(post({ ...alt, image: { data: 'not base64!', mediaType: 'image/png' } }))).status).toBe(400);

    const textOnly = createInkpilotHandler({ model: modelStreaming(['x']), visionModel: false, authorize: 'public' });
    const unsupported = await textOnly(post(alt));
    expect(unsupported.status).toBe(501);
    expect(await unsupported.json()).toMatchObject({ error: { code: 'unsupported' } });
  });

  it('aborts the model call when the client cancels the stream', async () => {
    let modelSignal: AbortSignal | undefined;
    const model = new MockLanguageModelV4({
      doStream: async ({ abortSignal }) => {
        modelSignal = abortSignal;
        return {
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue({ type: 'stream-start', warnings: [] });
              controller.enqueue({ type: 'text-start', id: 't' });
              controller.enqueue({ type: 'text-delta', id: 't', delta: '<p>Still writing' });
              // Never finishes on its own.
            },
          }),
        };
      },
    });
    const handler = createInkpilotHandler({ model, authorize: 'public' });
    const response = await handler(post(VALID));
    const reader = response.body!.getReader();
    await reader.read();
    await reader.cancel();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(modelSignal?.aborted).toBe(true);
  });
});
