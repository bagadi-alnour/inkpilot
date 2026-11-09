import { createInkpilotHandler } from '@inkpilot/editor/server';
import type { ProtocolErrorBody } from '@inkpilot/editor/server';
import { getModel } from '@/lib/model';
import { clientKey, createRateLimit } from '@/lib/rate-limit';

// Demo only: `'public'` lets anyone spend your tokens. In production, check the
// session here (e.g. `authorize: async (req) => Boolean(await getSession(req))`).
const handler = createInkpilotHandler({
  model: getModel(),
  authorize: 'public',
  onError: (error) => console.error('[inkpilot]', error),
});

// 20 AI requests a minute per caller. See lib/rate-limit.ts for production.
const take = createRateLimit({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request): Promise<Response> {
  const allowed = take(clientKey(request));
  if (!allowed.ok) {
    // Same error shape as the handler, so the editor shows the message.
    const body: ProtocolErrorBody = { error: { code: 'rate-limited', message: 'Too many AI requests. Try again in a minute.' } };
    return Response.json(body, { status: 429, headers: { 'retry-after': String(allowed.retryAfterSeconds) } });
  }
  return handler(request);
}
