import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

/**
 * blocks — v2 primary collection.
 *
 * Every piece of content on PointCast is a Block. Schema follows BLOCKS.md
 * at the repo root. Each block is a JSON file in `src/content/blocks/`
 * named by its zero-padded 4-digit ID (e.g. `0205.json`).
 *
 * IDs are immutable and monotonically increasing across the archive. Never
 * reuse, never renumber. A retired block 404s — its ID is never handed to
 * something else.
 */
const blocks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/blocks' }),
  schema: z.object({
    id: z.string().regex(/^\d{4}$/, 'id must be 4-digit zero-padded string'),
    channel: z.enum(['FD', 'CRT', 'SPN', 'GF', 'GDN', 'ESC', 'FCT', 'VST', 'BTL']),
    type: z.enum(['READ', 'LISTEN', 'WATCH', 'MINT', 'FAUCET', 'NOTE', 'VISIT', 'LINK']),
    title: z.string(),
    body: z.string().optional(),
    timestamp: z.coerce.date(),
    size: z.enum(['1x1', '2x1', '1x2', '2x2', '3x2']).default('1x1'),
    // Nouns are minted daily forever — no hard upper cap. A lower bound of 0
    // catches negative seeds. If noun.pics starts 404ing for a specific seed
    // BlockCard's img onerror handler degrades to the dotted frame.
    noun: z.number().int().min(0).optional(),

    // Edition / mint metadata (Tezos-only in v2)
    edition: z
      .object({
        supply: z.union([z.number().int().positive(), z.literal('open')]),
        minted: z.number().int().min(0).default(0),
        price: z.union([
          z.object({ tez: z.number().nonnegative().optional(), usd: z.number().nonnegative().optional() }),
          z.literal('free'),
        ]),
        chain: z.literal('tezos').default('tezos'),
        contract: z.string().regex(/^KT1[A-Za-z0-9]{33}$/, 'contract must be a KT1 address'),
        tokenId: z.number().int().min(0),
        marketplace: z.enum(['objkt', 'fxhash', 'teia']).optional(),
      })
      .optional(),

    media: z
      .object({
        kind: z.enum(['image', 'audio', 'video', 'embed']),
        src: z.string(),
        /** Optional preview thumbnail. Used on the home grid for WATCH
         *  blocks so the card shows a video poster instead of just a
         *  facade chip. YouTube: img.youtube.com/vi/{id}/hqdefault.jpg. */
        thumbnail: z.string().optional(),
        /** Optional IPFS fallback URL if the primary CDN fails. */
        ipfsFallback: z.string().optional(),
      })
      .optional(),

    external: z
      .object({
        label: z.string(),
        url: z.string().url(),
      })
      .optional(),

    // Agent-readable tags. Free-form, but keys used consistently become a
    // de-facto tag taxonomy over time.
    meta: z.record(z.string(), z.string()).optional(),

    // READ-type specifics
    readingTime: z.string().optional(),   // e.g. "4 min"
    dek: z.string().optional(),           // one-line editorial subtitle

    // VISIT-type specifics (carried from v1's visit-drop concept)
    visitor: z
      .object({
        kind: z.enum(['human', 'agent']),
        name: z.string().optional(),       // handle or display name
        vendor: z.string().optional(),     // "Claude", "Perplexity", etc.
        geo: z.string().optional(),        // city or region
        nounId: z.number().int().optional(),
      })
      .optional(),

    draft: z.boolean().default(false),
  }),
});

/* ----- v1 legacy collections — retained while content migrates ----- */

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    type: z.enum(['article', 'essay', 'art', 'newsletter']).default('article'),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    link: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const drops = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/drops' }),
  schema: z.object({
    date: z.coerce.date(),
    type: z.enum([
      'spotify', 'link', 'note', 'quote', 'image', 'visit',
      'video', 'twitch', 'tumblr', 'twitter', 'instagram',
      'arena', 'objkt', 'fxhash', 'mirror', 'generic',
    ]),
    title: z.string().optional(),
    url: z.string().optional(),
    caption: z.string().optional(),
    attribution: z.string().optional(),
    nounId: z.number().optional(),
    readSlug: z.string().optional(),
    readTitle: z.string().optional(),
    becameDispatch: z.string().optional(),
    model: z.string().optional(),
    variant: z.enum(['compact', 'full', 'auto']).optional(),
    image: z.string().optional(),
    artist: z.string().optional(),
    supply: z.number().optional(),
    priceXtz: z.number().optional(),
    contract: z.string().optional(),
    tokenId: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blocks, posts, projects, drops };
