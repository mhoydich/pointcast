/**
 * functions/api/studio-publish.ts — Studio composition publishing.
 *
 * v3 (2026-05-07): hardened per codex review PR 1.
 *
 * POST { tpl, bg, filter, anim, layers }
 *   → validates against the full Studio enum + range table
 *   → rate-limits at 10 publishes/min/IP via PC_RATES_KV
 *   → stores in PC_STUDIO_KV under a crypto-random short ID
 *   → retries on collision (rare; 3 attempts before giving up)
 *   → returns 201 { id, viewUrl, remixUrl, expiresAt }
 *
 * GET /api/studio-publish
 *   → structured service descriptor with enums, ranges, limits, error
 *     codes, examples, schema URL. Cold agents can derive the full
 *     contract without reading source.
 *
 * GET /studio-publish.schema.json
 *   → full JSON Schema (draft 2020-12) for the POST body. Served as a
 *     sibling Astro endpoint (src/pages/studio-publish.schema.json.ts).
 *
 * If PC_STUDIO_KV is unbound the endpoint returns 503 with a clear
 * reason so the Studio client falls back to local PNG download.
 *
 * If PC_RATES_KV is unbound, rate limiting degrades gracefully — every
 * publish is allowed and the response includes
 * `X-RateLimit-Mode: degraded-no-kv`.
 */

import { rateLimit } from '../_rate-limit';

export interface Env {
  PC_STUDIO_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}

interface Layer {
  id: number;
  kind: 'noun' | 'photo' | 'text';
  x: number;
  y: number;
  scale: number;
  rotate: number;
  // noun
  seed?: number;
  // photo
  dataUrl?: string;
  name?: string;
  // text
  value?: string;
  font?: string;
  size?: number;
  color?: string;
}

interface Composition {
  tpl: string;
  bg: string;
  filter: string;
  anim: string;
  layers: Layer[];
}

// ───── Validation table (single source of truth for the descriptor + schema) ─

const VALID_TPLS    = ['postcard', 'card', 'poster', 'pixel', 'polaroid'] as const;
const VALID_FILTERS = ['none', 'crt', 'halftone', 'pixel', 'neon', 'sepia', 'warhol'] as const;
const VALID_ANIMS   = ['static', 'bounce', 'ring', 'glitch', 'spin', 'drop'] as const;
const VALID_FONTS   = ['heading', 'body', 'serif', 'mono'] as const;
const VALID_TEXT_COLORS = [
  '#1f1b15', '#fbf7ee', '#c4952e', '#1b3a5b',
  '#F7C325', '#E84D6A', '#4A9EFF', '#2CC5A0',
] as const;

// Per-layer numeric ranges. Must be Number.isFinite; rejects NaN/Infinity.
const RANGES = {
  x:        { min: 0,    max: 1 },
  y:        { min: 0,    max: 1 },
  scale:    { min: 0.1,  max: 10 },
  rotate:   { min: -360, max: 360 },
  textSize: { min: 8,    max: 240 },
  nounSeed: { min: 0,    max: 1199, integer: true },
} as const;

const LIMITS = {
  maxBodyBytes:      4 * 1024 * 1024,  // 4 MB. Down from 8 MB to match the UI cap.
  maxLayers:         24,
  maxTextLength:     80,                // matches src/pages/studio.astro text-input maxlength
  maxPhotoBytes:     4 * 1024 * 1024,   // matches the UI upload cap
  rateLimitPerMin:   10,                // publishes per minute per IP
};

const VALID_PHOTO_MIME_PREFIXES = [
  'data:image/png;base64,',
  'data:image/jpeg;base64,',
  'data:image/jpg;base64,',
  'data:image/webp;base64,',
  'data:image/gif;base64,',
  'data:image/svg+xml;base64,',
  'data:image/svg+xml;utf8,', // some browsers serialize SVG without base64
];

// ───── Helpers ───────────────────────────────────────────────────────────────

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
      ...((ri.headers as Record<string, string>) ?? {}),
    },
  });
}

/** crypto-random short id: `s-{base36-ts}-{6 base36 random chars}`. */
function generateId(): string {
  const ts = Date.now().toString(36);
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  let rand = '';
  for (let i = 0; i < buf.length; i++) {
    rand += (buf[i] % 36).toString(36);
  }
  rand = rand.padEnd(6, '0').slice(0, 6);
  return `s-${ts}-${rand}`;
}

function inRange(v: unknown, min: number, max: number, integer = false): boolean {
  if (typeof v !== 'number' || !Number.isFinite(v)) return false;
  if (integer && !Number.isInteger(v)) return false;
  return v >= min && v <= max;
}

function approxByteSize(s: string): number {
  // For data: URLs, the base64 payload is ~ 4/3 the binary size. We use the
  // string length as an upper bound — a 4 MB cap on string length corresponds
  // to ~3 MB of decoded image, which is fine for our purposes.
  return s.length;
}

function validateComposition(raw: unknown): { ok: true; comp: Composition } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'body-not-object' };
  const c = raw as Record<string, unknown>;

  if (typeof c.tpl !== 'string' || !(VALID_TPLS as readonly string[]).includes(c.tpl)) {
    return { ok: false, reason: 'tpl-invalid' };
  }
  if (typeof c.bg !== 'string' || !/^#[0-9a-fA-F]{3,8}$/.test(c.bg)) {
    return { ok: false, reason: 'bg-invalid' };
  }
  if (typeof c.filter !== 'string' || !(VALID_FILTERS as readonly string[]).includes(c.filter)) {
    return { ok: false, reason: 'filter-invalid' };
  }
  if (typeof c.anim !== 'string' || !(VALID_ANIMS as readonly string[]).includes(c.anim)) {
    return { ok: false, reason: 'anim-invalid' };
  }
  if (!Array.isArray(c.layers)) return { ok: false, reason: 'layers-not-array' };
  if (c.layers.length === 0) return { ok: false, reason: 'layers-empty' };
  if (c.layers.length > LIMITS.maxLayers) {
    return { ok: false, reason: `layers-too-many-${c.layers.length}-max-${LIMITS.maxLayers}` };
  }

  for (const [i, layer] of c.layers.entries()) {
    if (!layer || typeof layer !== 'object') return { ok: false, reason: `layer-${i}-not-object` };
    const l = layer as Record<string, unknown>;
    if (typeof l.kind !== 'string' || !['noun', 'photo', 'text'].includes(l.kind)) {
      return { ok: false, reason: `layer-${i}-kind-invalid` };
    }
    if (!inRange(l.x, RANGES.x.min, RANGES.x.max)) {
      return { ok: false, reason: `layer-${i}-x-out-of-range` };
    }
    if (!inRange(l.y, RANGES.y.min, RANGES.y.max)) {
      return { ok: false, reason: `layer-${i}-y-out-of-range` };
    }
    if (!inRange(l.scale, RANGES.scale.min, RANGES.scale.max)) {
      return { ok: false, reason: `layer-${i}-scale-out-of-range` };
    }
    if (!inRange(l.rotate, RANGES.rotate.min, RANGES.rotate.max)) {
      return { ok: false, reason: `layer-${i}-rotate-out-of-range` };
    }
    if (l.kind === 'noun') {
      if (!inRange(l.seed, RANGES.nounSeed.min, RANGES.nounSeed.max, true)) {
        return { ok: false, reason: `layer-${i}-noun-seed-invalid` };
      }
    } else if (l.kind === 'photo') {
      if (typeof l.dataUrl !== 'string') {
        return { ok: false, reason: `layer-${i}-photo-dataurl-missing` };
      }
      if (!VALID_PHOTO_MIME_PREFIXES.some(p => (l.dataUrl as string).startsWith(p))) {
        return { ok: false, reason: `layer-${i}-photo-mime-not-allowed` };
      }
      if (approxByteSize(l.dataUrl as string) > LIMITS.maxPhotoBytes) {
        return { ok: false, reason: `layer-${i}-photo-too-large` };
      }
    } else if (l.kind === 'text') {
      if (typeof l.value !== 'string' || l.value.length === 0) {
        return { ok: false, reason: `layer-${i}-text-value-empty-or-missing` };
      }
      if (l.value.length > LIMITS.maxTextLength) {
        return { ok: false, reason: `layer-${i}-text-too-long-${l.value.length}-max-${LIMITS.maxTextLength}` };
      }
      // font / size / color are presentation, optional in older clients.
      if (l.font !== undefined && (typeof l.font !== 'string' || !(VALID_FONTS as readonly string[]).includes(l.font))) {
        return { ok: false, reason: `layer-${i}-font-invalid` };
      }
      if (l.size !== undefined && !inRange(l.size, RANGES.textSize.min, RANGES.textSize.max)) {
        return { ok: false, reason: `layer-${i}-size-out-of-range` };
      }
      if (l.color !== undefined) {
        if (typeof l.color !== 'string') return { ok: false, reason: `layer-${i}-color-invalid-type` };
        const okHex = /^#[0-9a-fA-F]{3,8}$/.test(l.color);
        const okEnum = (VALID_TEXT_COLORS as readonly string[]).includes(l.color);
        if (!okHex && !okEnum) return { ok: false, reason: `layer-${i}-color-invalid` };
      }
    }
  }

  return { ok: true, comp: c as unknown as Composition };
}

// ───── Service descriptor (returned by GET) + schema URL ─────────────────────

function serviceDescriptor(origin: string, kvBound: boolean) {
  return {
    service: 'studio-publish',
    version: '3.0',
    kvBound,
    docs: 'POST { tpl, bg, filter, anim, layers } to publish a Studio composition.',
    schema: `${origin}/studio-publish.schema.json`,
    rateLimit: {
      maxRequestsPerMinute: LIMITS.rateLimitPerMin,
      window: '60 seconds',
      bucket: 'studio:publish',
      keyedBy: 'CF-Connecting-IP',
    },
    enums: {
      tpl: VALID_TPLS,
      filter: VALID_FILTERS,
      anim: VALID_ANIMS,
      layerKind: ['noun', 'photo', 'text'],
      textFont: VALID_FONTS,
      textColor: VALID_TEXT_COLORS,
    },
    ranges: {
      x: RANGES.x,
      y: RANGES.y,
      scale: RANGES.scale,
      rotate: RANGES.rotate,
      textSize: RANGES.textSize,
      nounSeed: RANGES.nounSeed,
    },
    limits: LIMITS,
    photoMimePrefixes: VALID_PHOTO_MIME_PREFIXES,
    retentionDays: 365,
    response: {
      template: { id: 'string', viewUrl: 'string', remixUrl: 'string', expiresAt: 'ISO-8601 datetime' },
      idShape: '^s-[a-z0-9]{4,16}-[a-z0-9]{4,16}$',
      example: {
        id: 's-mow4twhd-svs23',
        viewUrl: `${origin}/studio/share/s-mow4twhd-svs23`,
        remixUrl: `${origin}/studio?remix=s-mow4twhd-svs23`,
        expiresAt: '2027-05-07T15:00:00.000Z',
      },
    },
    errorReasons: [
      'body-too-large',                        // 413
      'body-not-json',                         // 400
      'body-not-object',                       // 422
      'tpl-invalid',                           // 422
      'bg-invalid',                            // 422
      'filter-invalid',                        // 422
      'anim-invalid',                          // 422
      'layers-not-array',                      // 422
      'layers-empty',                          // 422
      'layers-too-many-{n}-max-{max}',         // 422
      'layer-{i}-kind-invalid',                // 422
      'layer-{i}-x-out-of-range',              // 422
      'layer-{i}-y-out-of-range',              // 422
      'layer-{i}-scale-out-of-range',          // 422
      'layer-{i}-rotate-out-of-range',         // 422
      'layer-{i}-noun-seed-invalid',           // 422
      'layer-{i}-photo-dataurl-missing',       // 422
      'layer-{i}-photo-mime-not-allowed',      // 422
      'layer-{i}-photo-too-large',             // 422
      'layer-{i}-text-value-empty-or-missing', // 422
      'layer-{i}-text-too-long-{n}-max-{max}', // 422
      'layer-{i}-font-invalid',                // 422
      'layer-{i}-size-out-of-range',           // 422
      'layer-{i}-color-invalid',               // 422
      'rate-limited',                          // 429
      'kv-not-bound',                          // 503
      'kv-write-failed',                       // 500
      'id-collision-after-retry',              // 500 (rare; cosmic-ray territory)
    ],
    examples: [
      {
        title: 'Minimal — one noun on a postcard',
        body: {
          tpl: 'postcard',
          bg: '#f4e7c8',
          filter: 'none',
          anim: 'static',
          layers: [
            { id: 1, kind: 'noun', seed: 137, x: 0.5, y: 0.5, scale: 1, rotate: 0 },
          ],
        },
      },
      {
        title: 'Headline + noun, animated',
        body: {
          tpl: 'postcard',
          bg: '#a8d8f0',
          filter: 'crt',
          anim: 'bounce',
          layers: [
            { id: 1, kind: 'text', value: 'ALOHA FROM EL SEGUNDO', x: 0.5, y: 0.18,
              scale: 1, rotate: 0, font: 'heading', size: 56, color: '#1f1b15' },
            { id: 2, kind: 'noun', seed: 137, x: 0.5, y: 0.6, scale: 1.4, rotate: 0 },
          ],
        },
      },
    ],
    seeAlso: {
      editor:    `${origin}/studio`,
      read:      `${origin}/api/studio-block/{id}`,
      share:     `${origin}/studio/share/{id}`,
      remix:     `${origin}/studio?remix={id}`,
      brief:     `${origin}/agents.json`,
      changelog: 'https://github.com/mhoydich/pointcast/blob/main/docs/reviews/2026-05-07-codex-review-tonight-stack.md',
    },
  };
}

// ───── Request handler ───────────────────────────────────────────────────────

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'studio-publish',
        'X-Pc-Version': '3.0',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_STUDIO_KV)),
      },
    });
  }

  if (request.method === 'GET') {
    return json(serviceDescriptor(origin, Boolean(env.PC_STUDIO_KV)));
  }

  if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);

  if (!env.PC_STUDIO_KV) {
    return json({ error: 'kv-not-bound', reason: 'Server is missing PC_STUDIO_KV binding.' }, 503);
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const limit = await rateLimit(request, env, {
    bucket: 'studio:publish',
    windowSec: 60,
    maxRequests: LIMITS.rateLimitPerMin,
  });
  const rateHeaders: Record<string, string> = {
    'X-RateLimit-Limit':     String(limit.limit),
    'X-RateLimit-Remaining': String(Math.max(0, limit.remaining)),
    'X-RateLimit-Reset':     String(limit.retryAfter),
    'X-RateLimit-Bucket':    limit.bucket,
  };
  if (limit.degraded) rateHeaders['X-RateLimit-Mode'] = 'degraded-no-kv';

  if (!limit.allowed) {
    return new Response(JSON.stringify({
      error: 'rate-limited',
      reason: `Too many publishes. Window resets in ${limit.retryAfter}s.`,
      retryAfterSeconds: limit.retryAfter,
    }, null, 2), {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Retry-After': String(limit.retryAfter),
        ...rateHeaders,
      },
    });
  }

  // ── Body cap (defense in depth — header AND post-read length) ─────────────
  const cl = parseInt(request.headers.get('content-length') || '0', 10);
  if (cl > LIMITS.maxBodyBytes) {
    return json({
      error: 'body-too-large',
      limitBytes: LIMITS.maxBodyBytes,
      gotBytes: cl,
    }, { status: 413, headers: rateHeaders });
  }

  // Read raw text first so we can re-cap if content-length lied.
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch (e) {
    return json({ error: 'body-read-failed', detail: String(e) }, { status: 400, headers: rateHeaders });
  }
  if (bodyText.length > LIMITS.maxBodyBytes) {
    return json({
      error: 'body-too-large',
      limitBytes: LIMITS.maxBodyBytes,
      gotBytes: bodyText.length,
      via: 'post-read',
    }, { status: 413, headers: rateHeaders });
  }

  let body: unknown;
  try { body = JSON.parse(bodyText); }
  catch (e) { return json({ error: 'body-not-json' }, { status: 400, headers: rateHeaders }); }

  const result = validateComposition(body);
  if (!result.ok) return json({ error: 'invalid', reason: result.reason }, { status: 422, headers: rateHeaders });

  // ── Generate ID with collision retry ───────────────────────────────────────
  let id: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = generateId();
    const existing = await env.PC_STUDIO_KV.get(candidate);
    if (!existing) { id = candidate; break; }
  }
  if (!id) {
    return json({ error: 'id-collision-after-retry' }, { status: 500, headers: rateHeaders });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const record = {
    id,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    composition: result.comp,
  };

  try {
    await env.PC_STUDIO_KV.put(id, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365,
      metadata: { tpl: result.comp.tpl, layerCount: result.comp.layers.length },
    });
  } catch (e) {
    return json({ error: 'kv-write-failed', detail: String(e) }, { status: 500, headers: rateHeaders });
  }

  return json({
    id,
    viewUrl:  `${origin}/studio/share/${id}`,
    remixUrl: `${origin}/studio?remix=${id}`,
    expiresAt: expiresAt.toISOString(),
  }, { status: 201, headers: rateHeaders });
};
