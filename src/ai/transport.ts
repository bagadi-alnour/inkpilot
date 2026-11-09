import { NDJSON_CONTENT_TYPE } from '../protocol';
import type { JsonRequest, JsonResponse, ProtocolErrorBody, StreamErrorCode, StreamEvent, StreamRequest } from '../protocol';

export type JsonResult<T extends JsonRequest> =
  | { ok: true; data: JsonResponse<T> }
  | { ok: false; code: StreamErrorCode; message: string };

/**
 * How the editor talks to the model. The default is `createFetchTransport`; pass your
 * own through `ai.transport` to use another backend, or in tests.
 *
 * `stream` must end with exactly one `done` or `error` event.
 */
export interface InkpilotTransport {
  stream(request: StreamRequest, signal: AbortSignal): AsyncIterable<StreamEvent>;
  /** Structured tasks (title and description suggestions). Never throws. */
  json<T extends JsonRequest>(request: T, signal: AbortSignal): Promise<JsonResult<T>>;
}

export interface FetchTransportOptions {
  endpoint: string;
  headers?: HeadersInit | (() => HeadersInit);
  fetch?: typeof fetch;
}

function isStreamEvent(value: unknown): value is StreamEvent {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  const event = value as Record<string, unknown>;
  switch (event.type) {
    case 'delta':
      return typeof event.text === 'string';
    case 'done':
      return event.finishReason === 'stop';
    case 'error':
      return typeof event.code === 'string' && typeof event.message === 'string';
    default:
      return false;
  }
}

async function readErrorBody(response: Response): Promise<StreamEvent> {
  try {
    const body = (await response.json()) as ProtocolErrorBody;
    if (body?.error?.code && body.error.message) {
      return { type: 'error', code: body.error.code, message: body.error.message };
    }
  } catch {
    // Not a protocol error body; fall through.
  }
  return { type: 'error', code: 'network', message: `The writing assistant responded with ${response.status}.` };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Check the response body has the shape its task promises. */
function isJsonResponse<T extends JsonRequest>(request: T, body: unknown): body is JsonResponse<T> {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  switch (request.task) {
    case 'titles':
      return isStringArray(record.titles);
    case 'descriptions':
      return isStringArray(record.descriptions);
    case 'alt':
      return typeof record.alt === 'string';
  }
}

/** Parse an NDJSON byte stream into events. Malformed lines are skipped. */
async function* readNdjson(body: ReadableStream<Uint8Array>, signal: AbortSignal): AsyncIterable<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const parseLine = (line: string): StreamEvent | null => {
    if (!line.trim()) return null;
    try {
      const value: unknown = JSON.parse(line);
      return isStreamEvent(value) ? value : null;
    } catch {
      return null;
    }
  };

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const event = parseLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (event) yield event;
        newline = buffer.indexOf('\n');
      }
    }
    const last = parseLine(buffer + decoder.decode());
    if (last) yield last;
  } finally {
    reader.releaseLock();
  }
}

/** Default transport: POST to `endpoint` (usually a `createInkpilotHandler` route). */
export function createFetchTransport(options: FetchTransportOptions): InkpilotTransport {
  const post = (body: unknown, accept: string, signal: AbortSignal) => {
    const fetchImpl = options.fetch ?? globalThis.fetch;
    const headers = new Headers(typeof options.headers === 'function' ? options.headers() : options.headers);
    headers.set('content-type', 'application/json');
    headers.set('accept', accept);
    return fetchImpl(options.endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal });
  };

  return {
    async json(request, signal) {
      let response: Response;
      try {
        response = await post(request, 'application/json', signal);
      } catch {
        return { ok: false, code: signal.aborted ? 'aborted' : 'network', message: 'Could not reach the writing assistant.' };
      }
      if (!response.ok) {
        const event = await readErrorBody(response);
        return event.type === 'error'
          ? { ok: false, code: event.code, message: event.message }
          : { ok: false, code: 'network', message: 'Unexpected response.' };
      }
      try {
        const body: unknown = await response.json();
        if (isJsonResponse(request, body)) return { ok: true, data: body };
      } catch {
        // Fall through to the shape error.
      }
      return { ok: false, code: 'invalid-output', message: 'The writing assistant sent an unexpected response.' };
    },

    async *stream(request, signal) {
      let response: Response;
      try {
        response = await post(request, NDJSON_CONTENT_TYPE, signal);
      } catch {
        if (signal.aborted) return;
        yield { type: 'error', code: 'network', message: 'Could not reach the writing assistant.' };
        return;
      }

      if (!response.ok) {
        yield await readErrorBody(response);
        return;
      }
      if (!response.body || !response.headers.get('content-type')?.includes(NDJSON_CONTENT_TYPE)) {
        yield { type: 'error', code: 'network', message: 'The writing assistant sent an unexpected response.' };
        return;
      }

      let finished = false;
      try {
        for await (const event of readNdjson(response.body, signal)) {
          yield event;
          if (event.type !== 'delta') {
            finished = true;
            return;
          }
        }
      } catch {
        if (signal.aborted) return;
        yield { type: 'error', code: 'network', message: 'The connection dropped while writing.' };
        return;
      }
      if (!finished && !signal.aborted) {
        yield { type: 'error', code: 'incomplete', message: 'The response ended before it finished.' };
      }
    },
  };
}
