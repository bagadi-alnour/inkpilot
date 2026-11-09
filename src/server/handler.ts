import { generateText, Output, streamText } from 'ai';
import type { LanguageModel } from 'ai';
import { NDJSON_CONTENT_TYPE } from '../protocol';
import type {
  InkpilotRequest,
  JsonRequest,
  ProtocolErrorBody,
  ProtocolErrorCode,
  StreamEvent,
  StreamRequest,
  Task,
} from '../protocol';
import { altOutputSchema, descriptionsOutputSchema, requestSchema, titlesOutputSchema } from './schemas';
import { buildAltPrompt, buildDescriptionsPrompt, buildFixPrompt, buildRewritePrompt, buildTitlesPrompt } from './prompts';

export interface InkpilotHandlerLimits {
  /** Max characters across content and context. Default 20,000. */
  maxInputChars?: number;
  /** Max size of an image sent for alt text, in bytes. Default 5 MB. */
  maxImageBytes?: number;
  /** Max output tokens per task. */
  maxOutputTokens?: Partial<Record<Task, number>>;
}

export interface InkpilotHandlerOptions {
  /** Any AI SDK language model, e.g. `anthropic('claude-sonnet-5-5')`. */
  model: LanguageModel;
  /**
   * Model for alt text; must accept images. Defaults to `model`. Pass `false` when
   * `model` can't read images: alt requests then answer 501 and the editor says why.
   */
  visionModel?: LanguageModel | false;
  /**
   * Decide whether a request may use the model. Required: the endpoint spends your
   * tokens. Pass `'public'` only for demos, and rate-limit at your host either way.
   */
  authorize: ((request: Request) => boolean | Promise<boolean>) | 'public';
  limits?: InkpilotHandlerLimits;
  /** Called with model and handler errors, for your logging. Never sent to the client. */
  onError?: (error: unknown) => void;
}

const DEFAULT_MAX_INPUT_CHARS = 20_000;
const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_OUTPUT_TOKENS: Record<Task, number> = { fix: 2_000, rewrite: 2_000, titles: 400, descriptions: 600, alt: 200 };

const STATUS: Record<ProtocolErrorCode, number> = {
  'bad-request': 400,
  unauthorized: 401,
  'method-not-allowed': 405,
  'too-large': 413,
  internal: 500,
  unsupported: 501,
};

/** Like `AbortSignal.any`, which some runtimes (e.g. Next.js edge) lack. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

function errorResponse(code: ProtocolErrorCode, message: string): Response {
  const body: ProtocolErrorBody = { error: { code, message } };
  return Response.json(body, { status: STATUS[code] });
}

function inputLength(request: InkpilotRequest): number {
  switch (request.task) {
    case 'fix':
    case 'rewrite':
      return request.html.length + request.before.length + request.after.length;
    case 'titles':
    case 'descriptions':
      return request.title.length + request.excerpt.length + request.outline.join('').length;
    case 'alt':
      return request.context.length;
  }
}

function streamPrompt(request: StreamRequest): string {
  switch (request.task) {
    case 'fix':
      return buildFixPrompt(request);
    case 'rewrite':
      return buildRewritePrompt(request);
  }
}

interface Context {
  options: InkpilotHandlerOptions;
  signal: AbortSignal;
  cancel: AbortController;
  maxOutputTokens: number;
}

/** NDJSON stream of `StreamEvent`s. Success is only ever a `done` event. */
function streamResponse(request: StreamRequest, ctx: Context): Response {
  const report = (error: unknown) => ctx.options.onError?.(error);
  const result = streamText({
    model: ctx.options.model,
    prompt: streamPrompt(request),
    maxOutputTokens: ctx.maxOutputTokens,
    abortSignal: ctx.signal,
    onError: ({ error }) => report(error),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for await (const part of result.stream) {
          if (part.type === 'text-delta') {
            if (part.text) send({ type: 'delta', text: part.text });
          } else if (part.type === 'error') {
            send({ type: 'error', code: 'model-error', message: 'The model request failed.' });
            return;
          } else if (part.type === 'abort') {
            send({ type: 'error', code: 'aborted', message: 'The request was cancelled.' });
            return;
          } else if (part.type === 'finish') {
            if (part.finishReason === 'stop') {
              send({ type: 'done', finishReason: 'stop' });
            } else if (part.finishReason === 'length' || part.finishReason === 'interrupted') {
              send({ type: 'error', code: 'truncated', message: 'The response was cut off before it finished.' });
            } else {
              send({ type: 'error', code: 'model-error', message: `The model stopped early (${part.finishReason}).` });
            }
            return;
          }
        }
        // The model stream ended without a finish part: never report success.
        send({ type: 'error', code: 'model-error', message: 'The model stream ended unexpectedly.' });
      } catch (error) {
        if (!ctx.signal.aborted) {
          report(error);
          send({ type: 'error', code: 'model-error', message: 'The model request failed.' });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed because the client cancelled.
        }
      }
    },
    cancel() {
      ctx.cancel.abort();
    },
  });

  return new Response(stream, {
    headers: { 'content-type': `${NDJSON_CONTENT_TYPE}; charset=utf-8`, 'cache-control': 'no-store' },
  });
}

/** Structured tasks: the model's output is validated against a schema before it is returned. */
async function jsonResponse(request: JsonRequest, ctx: Context): Promise<Response> {
  const common = { model: ctx.options.model, maxOutputTokens: ctx.maxOutputTokens, abortSignal: ctx.signal } as const;
  try {
    switch (request.task) {
      case 'titles': {
        const { output } = await generateText({
          ...common,
          prompt: buildTitlesPrompt(request),
          output: Output.object({ schema: titlesOutputSchema }),
        });
        return Response.json(output, { headers: { 'cache-control': 'no-store' } });
      }
      case 'descriptions': {
        const { output } = await generateText({
          ...common,
          prompt: buildDescriptionsPrompt(request),
          output: Output.object({ schema: descriptionsOutputSchema }),
        });
        return Response.json(output, { headers: { 'cache-control': 'no-store' } });
      }
      case 'alt': {
        if (ctx.options.visionModel === false) {
          return errorResponse('unsupported', 'This endpoint has no model that reads images.');
        }
        const { output } = await generateText({
          ...common,
          model: ctx.options.visionModel ?? ctx.options.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: buildAltPrompt(request) },
                { type: 'image', image: request.image.data, mediaType: request.image.mediaType },
              ],
            },
          ],
          output: Output.object({ schema: altOutputSchema }),
        });
        return Response.json(output, { headers: { 'cache-control': 'no-store' } });
      }
    }
  } catch (error) {
    ctx.options.onError?.(error);
    return errorResponse('internal', 'The model could not produce suggestions.');
  }
}

/**
 * Create the Web `Request -> Response` handler behind the editor's `ai.endpoint`.
 *
 * ```ts
 * // app/api/inkpilot/route.ts
 * export const POST = createInkpilotHandler({ model, authorize: (req) => isSignedIn(req) });
 * ```
 */
export function createInkpilotHandler(options: InkpilotHandlerOptions) {
  const maxInputChars = options.limits?.maxInputChars ?? DEFAULT_MAX_INPUT_CHARS;
  const maxImageBytes = options.limits?.maxImageBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  // Base64 is 4/3 the size of the bytes it encodes.
  const maxImageChars = Math.ceil((maxImageBytes * 4) / 3);

  return async function handle(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return errorResponse('method-not-allowed', 'Use POST.');
    }

    if (options.authorize !== 'public') {
      let allowed = false;
      try {
        allowed = await options.authorize(request);
      } catch (error) {
        options.onError?.(error);
      }
      if (!allowed) return errorResponse('unauthorized', 'Not allowed to use the writing assistant.');
    }

    const raw = await request.text();
    // Generous bound on the envelope before parsing; the precise check is on content below.
    if (raw.length > maxInputChars * 2 + maxImageChars + 10_000) {
      return errorResponse('too-large', 'The request is too large.');
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return errorResponse('bad-request', 'The request body is not valid JSON.');
    }

    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse('bad-request', 'The request does not match the Inkpilot protocol.');
    }
    const body = parsed.data;
    if (inputLength(body) > maxInputChars) {
      return errorResponse('too-large', 'The content is too long to send in one go.');
    }
    if (body.task === 'alt' && body.image.data.length > maxImageChars) {
      return errorResponse('too-large', 'The image is too large to describe.');
    }

    // Abort the model call when the client disconnects or cancels the stream.
    const cancel = new AbortController();
    const ctx: Context = {
      options,
      cancel,
      signal: anySignal([request.signal, cancel.signal]),
      maxOutputTokens: options.limits?.maxOutputTokens?.[body.task] ?? DEFAULT_MAX_OUTPUT_TOKENS[body.task],
    };

    switch (body.task) {
      case 'fix':
      case 'rewrite':
        return streamResponse(body, ctx);
      case 'titles':
      case 'descriptions':
      case 'alt':
        return jsonResponse(body, ctx);
    }
  };
}
