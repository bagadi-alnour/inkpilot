# Next.js

`@inkpilot/editor` is a client module. It ships with `"use client"`, so you can import it from a Server Component file and render it there. `@inkpilot/editor/server` is for route handlers only.

## App Router

```ts
// app/api/inkpilot/route.ts
import { createInkpilotHandler } from '@inkpilot/editor/server';
import { anthropic } from '@ai-sdk/anthropic';
import { auth } from '@/auth';

export const POST = createInkpilotHandler({
  model: anthropic('claude-sonnet-5-5'),
  authorize: async () => Boolean(await auth()),
});
```

```tsx
// app/write/page.tsx
import { Editor } from '@inkpilot/editor';
import '@inkpilot/editor/styles.css';

export default function Page() {
  return <Editor ai={{ endpoint: '/api/inkpilot' }} />;
}
```

Rate-limit `/api/inkpilot` in front of the handler. Answer with the protocol's error shape so the editor shows your message:

```ts
export async function POST(request: Request) {
  if (!(await limiter.take(userOrIp(request)))) {
    return Response.json({ error: { code: 'rate-limited', message: 'Too many AI requests. Try again in a minute.' } }, { status: 429 });
  }
  return handler(request);
}
```

The App Router example does this with an in-memory limiter (`lib/rate-limit.ts`), which only works on a single server. On serverless or several instances, use your platform's limiter or a shared store such as Upstash.

## Pages Router

Use an edge API route. It receives a Web `Request`, which is what the handler takes:

```ts
// pages/api/inkpilot.ts
import { createInkpilotHandler } from '@inkpilot/editor/server';

export const config = { runtime: 'edge' };
export default createInkpilotHandler({ model, authorize });
```

Render the editor client-side only (`dynamic(() => import(...), { ssr: false })`), as in `examples/nextjs-pages-router`.

## Environment variables

Keep provider keys server-only, as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Never use a `NEXT_PUBLIC_` prefix for a key. Those values are inlined into the browser bundle.

## Developing against a local checkout

```js
// next.config.mjs
export default { transpilePackages: ['@inkpilot/editor'] };
```

with `"@inkpilot/editor": "file:../path/to/inkpilot"`, and `npm run build` in the package after each change.
