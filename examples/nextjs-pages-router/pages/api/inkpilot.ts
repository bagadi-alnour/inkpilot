import { createInkpilotHandler } from '@inkpilot/editor/server';
import { getModel } from '@/lib/model';

// Edge API routes take a Web Request and return a Response, which is what the handler is.
export const config = { runtime: 'edge' };

// Demo only: `'public'` lets anyone spend your tokens. In production, check the
// session here and rate-limit at your host.
export default createInkpilotHandler({
  model: getModel(),
  authorize: 'public',
  onError: (error) => console.error('[inkpilot]', error),
});
