/**
 * functions/api/studio-publish.ts — Studio composition publishing.
 *
 * POST { tpl, bg, filter, anim, layers, caption? }
 *   → stores the composition in PC_STUDIO_KV under a short ID
 *   → returns { id, viewUrl, remixUrl }
 *
 * GET / HEAD return service status.
 *
 * No image blob is stored — we keep just the composition state and let the
 * /studio/share/{id} page re-render it from the same client-side code that
 * the editor uses. Two big wins:
 *   1. State is tiny (a few KB) vs an image blob (MBs) — KV writes stay fast.
 *   2. Every published composition is automatically remixable (just hydrate
 *      Studio with the same state).
 *
 * If PC_STUDIO_KV isn't bound the endpoint returns 503 with a clear reason
 * so the Studio client can fall back to the old "save PNG locally" path.
 */

export interface Env {
  PC_STUDIO_KV?: KVNamespace;
}

interface Layer {
  id: number;
  kind: 'noun' | 'photo' | 'text';
  x: number;
  y: number;
  scale: number;
  rotate: number;
  seed?: number;
  dataUrl?: string;
  name?: string;
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
  caption?: string;
}

const VALID_TPLS = new Set(['postcard', 'card', 'poster', 'pixel', 'polaroid']);
const VALID_FILTERS = new Set(['none', 'crt', 'halftone', 'pixel', 'neon', 'sepia', 'warhol']);
const VALID_ANIMS = new Set(['static', 'bounce', 'ring', 'glitch', 'spin', 'drop']);

const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_LAYERS = 24;

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

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `s-${ts}-${rand}`;
}

function validateComposition(raw: unknown): { ok: true; comp: Composition } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'body-not-object' };
  const c = raw as Record<string, unknown>;

  if (typeof c.tpl !== 'string' || !VALID_TPLS.has(c.tpl)) return { ok: false, reason: 'tpl-invalid' };
  if (typeof c.bg !== 'string' || !/^#[0-9a-fA-F]{3,8}$/.test(c.bg)) return { ok: false, reason: 'bg-invalid' };
  if (typeof c.filter !== 'string' || !VALID_FILTERS.has(c.filter)) return { ok: false, reason: 'filter-invalid' };
  if (typeof c.anim !== 'string' || !VALID_ANIMS.has(c.anim)) return { ok: false, reason: 'anim-invalid' };
  if (!Array.isArray(c.layers)) return { ok: false, reason: 'layers-not-array' };
  if (c.layers.length === 0) return { ok: false, reason: 'layers-empty' };
  if (c.layers.length > MAX_LAYERS) return { ok: false, reason: `layers-too-many-${c.layers.length}` };

  for (const [i, layer] of c.layers.entries()) {
    if (!layer || typeof layer !== 'object') return { ok: false, reason: `layer-${i}-not-object` };
    const l = layer as Record<string, unknown>;
    if (typeof l.kind !== 'string' || !['noun', 'photo', 'text'].includes(l.kind)) {
      return { ok: false, reason: `layer-${i}-kind-invalid` };
    }
    if (typeof l.x !== 'number' || typeof l.y !== 'number' ||
        typeof l.scale !== 'number' || typeof l.rotate !== 'number') {
      return { ok: false, reason: `layer-${i}-position-invalid` };
    }
    if (l.kind === 'noun' && (typeof l.seed !== 'number' || l.seed < 0 || l.seed > 1199)) {
      return { ok: false, reason: `layer-${i}-noun-seed-invalid` };
    }
    if (l.kind === 'photo' && (typeof l.dataUrl !== 'string' || !l.dataUrl.startsWith('data:image/'))) {
      return { ok: false, reason: `layer-${i}-photo-dataurl-invalid` };
    }
    if (l.kind === 'text' && typeof l.value !== 'string') {
      return { ok: false, reason: `layer-${i}-text-value-invalid` };
    }
  }

  if (c.caption != null && (typeof c.caption !== 'string' || c.caption.length > 200)) {
    return { ok: false, reason: 'caption-too-long' };
  }

  return { ok: true, comp: c as unknown as Composition };
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'studio-publish',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_STUDIO_KV)),
      },
    });
  }

  if (request.method === 'GET') {
    return json({
      service: 'studio-publish',
      version: '1.0',
      kvBound: Boolean(env.PC_STUDIO_KV),
      docs: 'POST { tpl, bg, filter, anim, layers, caption? } to publish a composition.',
    });
  }

  if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);

  if (!env.PC_STUDIO_KV) {
    return json({ error: 'kv-not-bound', reason: 'Server is missing PC_STUDIO_KV binding.' }, 503);
  }

  const cl = parseInt(request.headers.get('content-length') || '0', 10);
  if (cl > MAX_BODY_BYTES) {
    return json({ error: 'body-too-large', limitBytes: MAX_BODY_BYTES, gotBytes: cl }, 413);
  }

  let body: unknown;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'body-not-json' }, 400); }

  const result = validateComposition(body);
  if (!result.ok) return json({ error: 'invalid', reason: result.reason }, 422);

  const id = generateId();
  const record = {
    id,
    createdAt: new Date().toISOString(),
    composition: result.comp,
  };

  try {
    await env.PC_STUDIO_KV.put(id, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365,
      metadata: { tpl: result.comp.tpl, layerCount: result.comp.layers.length },
    });
  } catch (e) {
    return json({ error: 'kv-write-failed', detail: String(e) }, 500);
  }

  const origin = `${url.protocol}//${url.host}`;
  return json({
    id,
    viewUrl:  `${origin}/studio/share/${id}`,
    remixUrl: `${origin}/studio?remix=${id}`,
  }, 201);
};
