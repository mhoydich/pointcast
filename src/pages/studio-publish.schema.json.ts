/**
 * /studio-publish.schema.json — JSON Schema for the POST body of
 * /api/studio-publish. Codex review PR 1.
 *
 * Hand-maintained alongside `functions/api/studio-publish.ts`. Both
 * files reference the same enum + range tables; if you change one,
 * change the other (or extract to a shared module — left as a
 * follow-up since the function file lives in `functions/` and Astro
 * pages live in `src/`, with no shared import path today).
 *
 * Served as application/schema+json with a 1h cache.
 */
import type { APIRoute } from 'astro';

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://pointcast.xyz/studio-publish.schema.json',
  title: 'PointCast Studio — publish body',
  description:
    'Schema for POST https://pointcast.xyz/api/studio-publish. Validates a Studio composition before it is written to PC_STUDIO_KV. Mirrors the editor enums + ranges in src/pages/studio.astro and the validator in functions/api/studio-publish.ts.',
  type: 'object',
  required: ['tpl', 'bg', 'filter', 'anim', 'layers'],
  additionalProperties: false,
  properties: {
    tpl: {
      type: 'string',
      enum: ['postcard', 'card', 'poster', 'pixel', 'polaroid'],
      description: 'Frame template. Determines aspect ratio + chrome overlay.',
    },
    bg: {
      type: 'string',
      pattern: '^#[0-9a-fA-F]{3,8}$',
      description: 'Canvas background color as a hex string.',
    },
    filter: {
      type: 'string',
      enum: ['none', 'crt', 'halftone', 'pixel', 'neon', 'sepia', 'warhol'],
      description: 'CSS filter chain applied to the whole canvas.',
    },
    anim: {
      type: 'string',
      enum: ['static', 'bounce', 'ring', 'glitch', 'spin', 'drop'],
      description: 'Layer animation preset. `static` = no motion.',
    },
    layers: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: { $ref: '#/$defs/layer' },
      description: 'Composition layers, rendered bottom-up. Order matters.',
    },
  },
  $defs: {
    layer: {
      oneOf: [
        { $ref: '#/$defs/nounLayer' },
        { $ref: '#/$defs/photoLayer' },
        { $ref: '#/$defs/textLayer' },
      ],
    },
    base: {
      type: 'object',
      required: ['id', 'kind', 'x', 'y', 'scale', 'rotate'],
      properties: {
        id:     { type: 'integer', description: 'Stable layer id within the composition.' },
        kind:   { type: 'string', enum: ['noun', 'photo', 'text'] },
        x:      { type: 'number', minimum: 0,   maximum: 1,   description: 'Center X as a fraction of canvas width.' },
        y:      { type: 'number', minimum: 0,   maximum: 1,   description: 'Center Y as a fraction of canvas height.' },
        scale:  { type: 'number', minimum: 0.1, maximum: 10,  description: 'Multiplicative scale.' },
        rotate: { type: 'number', minimum: -360, maximum: 360, description: 'Rotation in degrees.' },
      },
    },
    nounLayer: {
      allOf: [
        { $ref: '#/$defs/base' },
        {
          type: 'object',
          required: ['kind', 'seed'],
          additionalProperties: false,
          properties: {
            id: true, x: true, y: true, scale: true, rotate: true,
            kind: { const: 'noun' },
            seed: {
              type: 'integer', minimum: 0, maximum: 1199,
              description: 'Visit Nouns FA2 seed (0..1199). Resolved via https://noun.pics/{seed}.svg.',
            },
          },
        },
      ],
    },
    photoLayer: {
      allOf: [
        { $ref: '#/$defs/base' },
        {
          type: 'object',
          required: ['kind', 'dataUrl'],
          additionalProperties: false,
          properties: {
            id: true, x: true, y: true, scale: true, rotate: true,
            kind: { const: 'photo' },
            dataUrl: {
              type: 'string',
              maxLength: 4194304,
              pattern: '^data:image/(png|jpe?g|webp|gif|svg\\+xml);(base64,|utf8,)',
              description: 'Inline data URL. PNG/JPEG/WebP/GIF/SVG. Up to 4 MB.',
            },
            name: { type: 'string', maxLength: 200, description: 'Original file name (cosmetic only).' },
          },
        },
      ],
    },
    textLayer: {
      allOf: [
        { $ref: '#/$defs/base' },
        {
          type: 'object',
          required: ['kind', 'value'],
          additionalProperties: false,
          properties: {
            id: true, x: true, y: true, scale: true, rotate: true,
            kind: { const: 'text' },
            value: {
              type: 'string',
              minLength: 1,
              maxLength: 80,
              description: 'Text content. UI caps at 80 chars; API enforces same limit.',
            },
            font: {
              type: 'string',
              enum: ['heading', 'body', 'serif', 'mono'],
              description: 'Design-system font slug. Maps to Syne / Outfit / Lora / JetBrains Mono.',
            },
            size: {
              type: 'number',
              minimum: 8, maximum: 240,
              description: 'Pixel font size.',
            },
            color: {
              type: 'string',
              pattern: '^#[0-9a-fA-F]{3,8}$',
              description: 'Hex color. Editor presets: #1f1b15 #fbf7ee #c4952e #1b3a5b #F7C325 #E84D6A #4A9EFF #2CC5A0.',
            },
          },
        },
      ],
    },
  },
  examples: [
    {
      tpl: 'postcard',
      bg: '#f4e7c8',
      filter: 'none',
      anim: 'static',
      layers: [
        { id: 1, kind: 'noun', seed: 137, x: 0.5, y: 0.5, scale: 1, rotate: 0 },
      ],
    },
    {
      tpl: 'postcard',
      bg: '#a8d8f0',
      filter: 'crt',
      anim: 'bounce',
      layers: [
        { id: 1, kind: 'text', value: 'ALOHA FROM EL SEGUNDO',
          x: 0.5, y: 0.18, scale: 1, rotate: 0,
          font: 'heading', size: 56, color: '#1f1b15' },
        { id: 2, kind: 'noun', seed: 137, x: 0.5, y: 0.6, scale: 1.4, rotate: 0 },
      ],
    },
  ],
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(schema, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/schema+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
