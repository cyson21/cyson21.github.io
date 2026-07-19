import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const httpsUrlSchema = z.url().refine((value) => new URL(value).protocol === 'https:', {
  message: 'Public content URLs must use HTTPS',
});

const visualSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('image'),
    src: z.string().refine(
      (value) => value.startsWith('/') && !value.startsWith('//') && !value.split('/').includes('..'),
      { message: 'Image sources must be root-relative public paths' },
    ),
    alt: z.string().min(1),
  }),
  z.object({
    kind: z.literal('diagram'),
    alt: z.string().min(1),
    src: z.never().optional(),
  }),
]);

const signalSchema = z.object({
  label: z.string(),
  expression: z.string(),
  result: z.string(),
  tone: z.enum(['success', 'warning', 'danger']).default('success'),
  source: z.string(),
  sourceUrl: httpsUrlSchema.optional(),
});

const codeEvidenceSchema = z.object({
  symbol: z.string(),
  displayPath: z.string(),
  sourceUrl: httpsUrlSchema.optional(),
  excerpt: z.string(),
  proves: z.string(),
  testName: z.string(),
  testPath: z.string(),
  testUrl: httpsUrlSchema.optional(),
});

const projectCollection = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    order: z.number().int().positive(),
    featured: z.boolean().default(false),
    publicationState: z.enum(['public', 'case-study-only']),
    name: z.string(),
    domain: z.enum(['Backend', 'Data', 'AI']),
    eyebrow: z.string(),
    summary: z.string(),
    cardEvidence: z.object({
      implementation: z.string(),
      result: z.string(),
    }).optional(),
    period: z.string(),
    role: z.string(),
    stack: z.array(z.string()).min(2),
    problem: z.string(),
    responsibilities: z.array(z.string()).min(2),
    flow: z.object({
      normal: z.array(z.string()).min(3),
      failure: z.array(z.string()).min(2),
      recovery: z.array(z.string()).min(2),
    }),
    signals: z.array(signalSchema).min(3),
    decisions: z.array(
      z.object({
        title: z.string(),
        choice: z.string(),
        alternative: z.string(),
        reason: z.string(),
      }),
    ).min(2),
    protectionRules: z.array(z.string()).min(2),
    codeEvidence: z.array(codeEvidenceSchema).min(3),
    verification: z.array(
      z.object({
        layer: z.enum(['unit', 'integration', 'container-smoke', 'static-demo', 'live-demo', 'cloud']),
        method: z.string(),
        result: z.string(),
      }),
    ).min(1),
    limitations: z.array(z.string()).min(1),
    next: z.array(z.string()).min(1),
    links: z.object({
      github: httpsUrlSchema.optional(),
      demo: httpsUrlSchema.optional(),
      adr: httpsUrlSchema.optional(),
      design: httpsUrlSchema.optional(),
      testReport: httpsUrlSchema.optional(),
    }),
    visual: visualSchema,
    seo: z.object({
      title: z.string(),
      description: z.string(),
    }),
    updatedAt: z.coerce.date(),
  }),
});

export const collections = {
  projects: projectCollection,
};
