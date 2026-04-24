/**
 * functions/oembed.json.ts — oEmbed 1.0 provider (Cloudflare Pages Function).
 *
 * Runs at the edge per request so the `?url=` query param can drive the
 * response. Fetches the canonical block JSON at /b/{id}.json (static,
 * already built by Astro) and returns an oEmbed "rich" payload with an
 * iframe pointing at /embed/b/{id}.
 *
 * Wiring:
 *   - Each /b/{id} page carries <link rel="alternate" type="application/
 *     json+oembed" href="/oembed.json?url=..."> so editors like WordPress,
 *     Ghost, Discourse, Notion, Slack auto-discover this endpoint.
 *   - /federation.json points operators at this as the canonical embed
 *     path.
 *
 * Spec: https://oembed.com
 */

export interface Env {}

interface BlockJson {
  id: string;
  title: string;
  channel: string;
  type: string;
  dek?: string;
  body?: string;
  timestamp: string;
  readingTime?: string;
  meta?: Record<string, unknown>;
}

const CHANNEL_NAMES: Record<string, { code: string; name: string; slug: string; color: string }> = {
  FD:  { code: 'FD',  name: 'Front Door',  slug: 'front-door',  color: '#185FA5' },
  CRT: { code: 'CRT', name: 'Court',       slug: 'court',       color: '#3B6D11' },
  SPN: { code: 'SPN', name: 'Spinning',    slug: 'spinning',    color: '#993C1D' },
  GF:  { code: 'GF',  name: 'Good Feels',  slug: 'good-feels',  color: '#993556' },
  GDN: { code: 'GDN', name: 'Garden',      slug: 'garden',      color: '#0F6E56' },
  ESC: { code: 'ESC', name: 'El Segundo',  slug: 'el-segundo',  color: '#534AB7' },
  FCT: { code: 'FCT', name: 'Faucet',      slug: 'faucet',      color: '#BA7517' },
  VST: { code: 'VST', name: 'Visit',       slug: 'visit',       color: '#5F5E5A' },
  BTL: { code: 'BTL', name: 'Battler',     slug: 'battler',     color: '#8A2432' },
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function corsHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600',
    ...extra,
  };
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(extra),
    },
  });
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request } = ctx;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return json({ error: 'method-not-allowed' }, 405);
  }

  const url = new URL(request.url);
  const rawUrl = url.searchParams.get('url') ?? '';
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase();
  const maxwidth = clamp(Number(url.searchParams.get('maxwidth') ?? 800) || 800, 360, 1080);
  const maxheight = clamp(Number(url.searchParams.get('maxheight') ?? 420) || 420, 240, 720);

  if (format === 'xml') {
    return new Response('oEmbed XML not supported; use format=json', {
      status: 501,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() },
    });
  }
  if (format !== 'json') {
    return json({ error: 'unsupported format', format }, 400);
  }

  const match = rawUrl.match(/^https?:\/\/(www\.)?pointcast\.xyz\/b\/(\d{3,5})\/?$/);
  if (!match) {
    return json({
      error: 'unsupported url',
      hint: 'PointCast oEmbed supports https://pointcast.xyz/b/{id} URLs.',
      url: rawUrl,
    }, 404);
  }
  const blockId = match[2];

  // Fetch the static block JSON from our own origin. Cloudflare's fetch
  // inside Pages Functions follows the normal origin routing, so /b/{id}.json
  // hits the static asset served from dist/ — no auth, no rate limit.
  const origin = new URL(request.url).origin;
  const blockRes = await fetch(`${origin}/b/${blockId}.json`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!blockRes.ok) {
    return json({ error: 'block not found', id: blockId, status: blockRes.status }, 404);
  }

  let block: BlockJson;
  try {
    block = (await blockRes.json()) as BlockJson;
  } catch {
    return json({ error: 'block parse failed', id: blockId }, 500);
  }

  const ch = CHANNEL_NAMES[block.channel] ?? { code: block.channel, name: block.channel, slug: block.channel.toLowerCase(), color: '#185FA5' };
  const permalink = `https://pointcast.xyz/b/${blockId}`;
  const embedUrl = `https://pointcast.xyz/embed/b/${blockId}`;
  const thumbnail = `https://pointcast.xyz/images/og/b/${blockId}.png`;

  const titleEsc = block.title.replace(/"/g, '&quot;');
  const html = `<iframe src="${embedUrl}" width="${maxwidth}" height="${maxheight}" title="${titleEsc} — PointCast" frameborder="0" scrolling="no" loading="lazy" allow="clipboard-read; clipboard-write" style="border:1px solid #C4C2BC;border-radius:2px;max-width:100%;" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>`;

  const payload = {
    version: '1.0',
    type: 'rich',
    provider_name: 'PointCast',
    provider_url: 'https://pointcast.xyz',
    author_name: 'Mike Hoydich',
    author_url: 'https://pointcast.xyz/contributor/mike-hoydich',
    title: block.title,
    cache_age: 3600,
    thumbnail_url: thumbnail,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    width: maxwidth,
    height: maxheight,
    html,
    _pointcast: {
      id: blockId,
      permalink,
      json: `${permalink}.json`,
      channel: { code: ch.code, slug: ch.slug, name: ch.name, color: ch.color, url: `https://pointcast.xyz/c/${ch.slug}` },
      type: block.type,
      citation: `PointCast · CH.${ch.code} · № ${blockId} — "${block.title}" · ${block.timestamp.slice(0, 10)}`,
    },
  };

  return json(payload, 200);
};
