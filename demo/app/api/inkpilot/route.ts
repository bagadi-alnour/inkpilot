import { createInkpilotHandler } from '@inkpilot/editor/server';
import type { ProtocolErrorBody } from '@inkpilot/editor/server';
import { getModel } from '@/lib/model';
import { clientKey, createRateLimit } from '@/lib/rate-limit';

// A public demo: anyone may use it, so every caller is rate-limited.
const handler = createInkpilotHandler({
  model: getModel(),
  authorize: 'public',
  onError: (error) => console.error('[inkpilot]', error),
});

const take = createRateLimit({ limit: 30, windowMs: 60_000 });

export async function POST(request: Request): Promise<Response> {
  const allowed = take(clientKey(request));
  if (!allowed.ok) {
    const body: ProtocolErrorBody = { error: { code: 'rate-limited', message: 'Too many AI requests. Try again in a minute.' } };
    return Response.json(body, { status: 429, headers: { 'retry-after': String(allowed.retryAfterSeconds) } });
  }
  return handler(request);
}
