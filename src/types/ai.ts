import type { InkpilotTransport } from '../ai/transport';
import type { Intent, Tone } from '../protocol';

export type AITone = Tone;
export type AIIntent = Intent;

/** Writing defaults shared by every way of connecting a model. */
export interface AIBehaviour {
  defaultTone?: AITone;
  defaultIntent?: AIIntent;
  preserveMeaning?: boolean;
  /** Called when the writer accepts or rejects a finished proposal. */
  onRewrite?: (result: RewriteResult) => void;
}

/** Recommended: POST to your `createInkpilotHandler` route. Keys stay on your server. */
export interface AIEndpointConfig extends AIBehaviour {
  endpoint: string;
  headers?: HeadersInit | (() => HeadersInit);
  transport?: never;
}

/** Bring your own transport (another backend, or tests). */
export interface AITransportConfig extends AIBehaviour {
  transport: InkpilotTransport;
  endpoint?: never;
}

export type AIConfig = AIEndpointConfig | AITransportConfig;

export interface RewriteResult {
  /** Plain text before the change. */
  original: string;
  /** Plain text of the proposal. */
  rewritten: string;
  accepted: boolean;
  /** Set for selection rewrites. */
  tone?: AITone;
  intent?: AIIntent;
  /** Set for SEO fixes. */
  issueCode?: string;
}

export interface RewriteOptions {
  tone?: AITone;
  intent?: AIIntent;
  preserveMeaning?: boolean;
}
