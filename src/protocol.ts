/**
 * Wire protocol between the editor (client) and `createInkpilotHandler` (server).
 *
 * Shared by both package entries, so it holds types and constants only: no DOM,
 * no React, no AI SDK. Requests carry a task plus content; prompts live on the server.
 */

export const PROTOCOL_VERSION = 1;

/** Issue codes the server knows how to fix. Grows with the SEO rule set. */
export const FIXABLE_ISSUE_CODES = ['long-sentence', 'dense-paragraph', 'keyword-missing', 'keyword-not-in-intro'] as const;
export type FixableIssueCode = (typeof FIXABLE_ISSUE_CODES)[number];

export function isFixableIssueCode(code: string): code is FixableIssueCode {
  return (FIXABLE_ISSUE_CODES as readonly string[]).includes(code);
}

export type IssueParams = Record<string, string | number>;

export const TONES = ['formal', 'casual', 'persuasive'] as const;
export type Tone = (typeof TONES)[number];
export const INTENTS = ['simplify', 'expand', 'clarify'] as const;
export type Intent = (typeof INTENTS)[number];

/** Readability limits reach fix prompts through each issue's params, so only keywords travel here. */
export interface SEOContext {
  keywords: string[];
}

interface ContentPayload {
  v: typeof PROTOCOL_VERSION;
  /** Restricted HTML of the content being rewritten (see `core/content/restricted-html`). */
  html: string;
  /** Plain text before and after the content, for tone and coherence. */
  before: string;
  after: string;
  /** BCP 47 tag of the content language. */
  locale: string;
  seo: SEOContext;
}

/** Rewrite content so that a specific SEO issue goes away. */
export interface FixRequest extends ContentPayload {
  task: 'fix';
  issue: { code: FixableIssueCode; params: IssueParams };
}

/** Rewrite a selection in a tone and with an intent the writer picked. */
export interface RewriteRequest extends ContentPayload {
  task: 'rewrite';
  tone: Tone;
  intent: Intent;
  preserveMeaning: boolean;
}

export type StreamRequest = FixRequest | RewriteRequest;
export type StreamTask = StreamRequest['task'];

/** Article summary used by metadata suggestions. */
interface ArticlePayload {
  v: typeof PROTOCOL_VERSION;
  locale: string;
  seo: SEOContext;
  /** Current title (SEO title or H1), possibly empty. */
  title: string;
  /** Heading texts in document order. */
  outline: string[];
  /** Plain-text excerpt of the article body. */
  excerpt: string;
}

export interface TitlesRequest extends ArticlePayload {
  task: 'titles';
}

export interface DescriptionsRequest extends ArticlePayload {
  task: 'descriptions';
}

export const ALT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type AltImageType = (typeof ALT_IMAGE_TYPES)[number];

/** Describe an image for its alt attribute. The client always sends bytes, never a URL. */
export interface AltRequest {
  v: typeof PROTOCOL_VERSION;
  task: 'alt';
  locale: string;
  image: { data: string; mediaType: AltImageType };
  /** Text around the image, so the description fits the article. */
  context: string;
}

export type JsonRequest = TitlesRequest | DescriptionsRequest | AltRequest;
export type JsonTask = JsonRequest['task'];

export interface JsonResponses {
  titles: { titles: string[] };
  descriptions: { descriptions: string[] };
  alt: { alt: string };
}
export type JsonResponse<T extends JsonRequest> = JsonResponses[T['task']];

export type Task = StreamTask | JsonTask;
export type InkpilotRequest = StreamRequest | JsonRequest;

/**
 * Streaming responses are NDJSON, one event per line. A proposal is complete only
 * after `done`; a stream that closes without it is incomplete, never a success.
 */
export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; finishReason: 'stop' }
  | { type: 'error'; code: StreamErrorCode; message: string };

export type StreamErrorCode =
  /** The model stopped early (for example on its output token limit). */
  | 'truncated'
  | 'model-error'
  | 'aborted'
  /** Client-side: the stream ended without `done`. */
  | 'incomplete'
  /** Client-side: the request never produced a stream. */
  | 'network'
  /** Client-side: the finished proposal failed validation. */
  | 'invalid-output'
  /** Server rejected the request before streaming (see `ProtocolErrorCode`). */
  | ProtocolErrorCode;

export type ProtocolErrorCode =
  | 'bad-request'
  | 'unauthorized'
  | 'too-large'
  | 'method-not-allowed'
  | 'internal';

/** JSON body of every non-2xx response. */
export interface ProtocolErrorBody {
  error: { code: ProtocolErrorCode; message: string };
}

export const NDJSON_CONTENT_TYPE = 'application/x-ndjson';
