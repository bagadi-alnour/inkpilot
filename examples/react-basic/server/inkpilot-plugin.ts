import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { createInkpilotHandler } from '@inkpilot/editor/server';
import { getModel } from './model';

/** Read a Node request into a Web `Request` the handler understands. */
async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const controller = new AbortController();
  req.on('close', () => controller.abort());
  return new Request(`http://localhost${req.url ?? '/'}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
    signal: controller.signal,
  });
}

/** Stream a Web `Response` back through Node, stopping the model if the browser goes away. */
async function sendWebResponse(response: Response, res: ServerResponse): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) return void res.end();
  const reader = response.body.getReader();
  res.on('close', () => void reader.cancel());
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

/**
 * Serves `/api/inkpilot` from the Vite dev server so this example needs no separate
 * backend. In production, mount `createInkpilotHandler` on your own server instead.
 */
export function inkpilotDevServer(): Plugin {
  // Demo only: `'public'` lets anyone who reaches the dev server spend your tokens.
  const handler = createInkpilotHandler({ model: getModel(), authorize: 'public', onError: (error) => console.error('[inkpilot]', error) });
  return {
    name: 'inkpilot-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/inkpilot', (req, res) => {
        void toWebRequest(req)
          .then(handler)
          .then((response) => sendWebResponse(response, res))
          .catch((error) => {
            console.error('[inkpilot]', error);
            res.statusCode = 500;
            res.end();
          });
      });
    },
  };
}
