import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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

/**
 * drops — short-form stream-of-moment feed items.
 *
 * Each drop is a markdown file; frontmatter `type` picks the renderer in
 * src/components/FeedItem.astro. Markdown body is used by note/quote/visit
 * types for voice; other types (spotify/link/image/video/etc.) use the `url`
 * + `caption` fields and ignore the body.
 *
 * Implemented types: spotify, link, note, quote, image, visit.
 * Pending types (render as generic link card until their embed lands):
 *   video, twitch, tumblr, twitter, instagram, arena, objkt, fxhash, mirror.
 */
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
    // quote-specific
    attribution: z.string().optional(),
    // visit-specific (Claude's log entries)
    nounId: z.number().optional(),
    readSlug: z.string().optional(),
    readTitle: z.string().optional(),
    becameDispatch: z.string().optional(),
    model: z.string().optional(),
    // spotify-specific: override default compact embed
    variant: z.enum(['compact', 'full', 'auto']).optional(),
    // image drops + objkt/fxhash unfurls
    image: z.string().optional(),
    // objkt/fxhash unfurl fields
    artist: z.string().optional(),
    supply: z.number().optional(),          // total editions
    priceXtz: z.number().optional(),        // ask price in tez, if listed
    contract: z.string().optional(),        // KT1… FA2 contract
    tokenId: z.string().optional(),         // token id on contract
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, projects, drops };
