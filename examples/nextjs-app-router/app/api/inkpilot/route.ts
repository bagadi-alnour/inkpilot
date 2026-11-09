import { createInkpilotHandler } from '@inkpilot/editor/server';
import { getModel } from '@/lib/model';

// Demo only: `'public'` lets anyone spend your tokens. In production, check the
// session here and rate-limit at your host.
export const POST = createInkpilotHandler({
  model: getModel(),
  authorize: 'public',
  onError: (error) => console.error('[inkpilot]', error),
});
