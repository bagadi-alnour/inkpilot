import { z } from 'zod';
import { ALT_IMAGE_TYPES, FIXABLE_ISSUE_CODES, INTENTS, PROTOCOL_VERSION, TONES } from '../protocol';
import type { AltRequest, DescriptionsRequest, FixRequest, RewriteRequest, TitlesRequest } from '../protocol';

const seoContextSchema = z.object({
  keywords: z.array(z.string().max(120)).max(10),
  readingGrade: z.number().min(1).max(20).optional(),
});

const contentPayloadShape = {
  v: z.literal(PROTOCOL_VERSION),
  html: z.string().min(1),
  before: z.string(),
  after: z.string(),
  locale: z.string().min(2).max(35),
  seo: seoContextSchema,
};

export const fixRequestSchema = z.object({
  ...contentPayloadShape,
  task: z.literal('fix'),
  issue: z.object({
    code: z.enum(FIXABLE_ISSUE_CODES),
    params: z.record(z.string(), z.union([z.string(), z.number()])),
  }),
}) satisfies z.ZodType<FixRequest>;

export const rewriteRequestSchema = z.object({
  ...contentPayloadShape,
  task: z.literal('rewrite'),
  tone: z.enum(TONES),
  intent: z.enum(INTENTS),
  preserveMeaning: z.boolean(),
}) satisfies z.ZodType<RewriteRequest>;

const articlePayloadShape = {
  v: z.literal(PROTOCOL_VERSION),
  locale: z.string().min(2).max(35),
  seo: seoContextSchema,
  title: z.string().max(300),
  outline: z.array(z.string().max(300)).max(60),
  excerpt: z.string(),
};

export const titlesRequestSchema = z.object({ ...articlePayloadShape, task: z.literal('titles') }) satisfies z.ZodType<TitlesRequest>;
export const descriptionsRequestSchema = z.object({
  ...articlePayloadShape,
  task: z.literal('descriptions'),
}) satisfies z.ZodType<DescriptionsRequest>;

export const altRequestSchema = z.object({
  v: z.literal(PROTOCOL_VERSION),
  task: z.literal('alt'),
  locale: z.string().min(2).max(35),
  image: z.object({ data: z.string().min(1).regex(/^[A-Za-z0-9+/=]+$/), mediaType: z.enum(ALT_IMAGE_TYPES) }),
  context: z.string(),
}) satisfies z.ZodType<AltRequest>;

/** Every request the endpoint accepts, discriminated on `task`. */
export const requestSchema = z.discriminatedUnion('task', [
  fixRequestSchema,
  rewriteRequestSchema,
  titlesRequestSchema,
  descriptionsRequestSchema,
  altRequestSchema,
]);

/** What the model must return for each JSON task. */
export const titlesOutputSchema = z.object({ titles: z.array(z.string().min(1).max(120)).min(1).max(5) });
export const altOutputSchema = z.object({ alt: z.string().min(1).max(250) });
export const descriptionsOutputSchema = z.object({ descriptions: z.array(z.string().min(1).max(320)).min(1).max(5) });
