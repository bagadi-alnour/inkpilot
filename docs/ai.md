# AI

The editor talks to one endpoint you own. `createInkpilotHandler` from `@inkpilot/editor/server` implements it on top of any AI SDK model.

## The handler

```ts
import { createInkpilotHandler } from '@inkpilot/editor/server';

export const POST = createInkpilotHandler({
  model,                          // any AI SDK LanguageModel
  visionModel,                    // optional, for alt text; defaults to `model`; `false` if none reads images
  authorize: (request) => ...,    // required; 'public' for demos only
  limits: {
    maxInputChars: 20_000,        // content + context per request
    maxImageBytes: 5 * 1024 * 1024,
    maxOutputTokens: { fix: 2000, rewrite: 2000, titles: 400, descriptions: 600, alt: 200 },
  },
  onError: (error) => log(error), // model and handler errors; never sent to the client
});
```

It takes a Web `Request` and returns a `Response`, so it runs in Next.js route handlers, Pages Router edge routes, Hono, Bun and Remix. For a plain Node server, convert the request (see `examples/react-basic/server/inkpilot-plugin.ts`).

## Tasks

| Task | Sends | Gets |
|---|---|---|
| `fix` | issue code + params, content, context | NDJSON stream |
| `rewrite` | tone, intent, content, context | NDJSON stream |
| `titles` | title, headings, excerpt, keywords | `{ titles: string[] }` |
| `descriptions` | same | `{ descriptions: string[] }` |
| `alt` | image bytes (base64), surrounding text | `{ alt: string }` |

The client never sends prompt text. Prompts are in `src/server/prompts.ts`. The model is told to treat the article as content to edit, not as instructions.

### Streaming

Streams are newline-delimited JSON:

```ts
type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; finishReason: 'stop' }
  | { type: 'error'; code: 'truncated' | 'model-error' | 'aborted' | ...; message: string };
```

A proposal can be accepted only after `done`. If the model hits its token limit, the stream ends with `error: truncated`. If the connection closes without a terminal event, the client marks the proposal `incomplete`. Errors before streaming starts (bad body, auth, size) are JSON `{ error: { code, message } }` with an HTTP status. With `visionModel: false`, the `alt` task answers 501 `unsupported`.

## Security

Narrow tasks don't make the endpoint safe on their own. Callers control the article text, and a script can call the route in a loop.

- Always pass a real `authorize`.
- Rate-limit the route at your host. Answer 429 with `{ error: { code: 'rate-limited', message } }` and the editor shows the message (see [Next.js](nextjs.md)).
- Keep the size limits. Lower them if your articles are short.
- When the client cancels (Stop, Esc, a new rewrite), the model call is aborted, so you don't pay for output nobody sees.

## How proposals are applied

1. The selection or issue range is serialized to a restricted HTML subset: paragraphs, headings, lists, bold, italic, underline, strike, code, highlight, color, links.
2. The model returns the same subset. While it streams, the preview renders through the editor schema, never as raw HTML.
3. On `done`, the output is parsed in an inert document and validated. The validator rejects any disallowed element, unsafe link, empty output, output much longer than the original, or block structure that doesn't fit the position.
4. Accept replaces the range in one transaction that is its own undo step. Text outside the range is untouched.

Selections the round trip can't represent losslessly, like code blocks or partial list structure, are refused with a reason instead of being rewritten.

## Custom transports

To use another backend, implement `InkpilotTransport`:

```ts
const transport: InkpilotTransport = {
  async *stream(request, signal) { /* yield StreamEvents, end with done or error */ },
  async json(request, signal) { /* return { ok: true, data } or { ok: false, code, message } */ },
};

<Editor ai={{ transport }} />
```

`createFetchTransport({ endpoint, headers, fetch })` is the default and a reference implementation.
