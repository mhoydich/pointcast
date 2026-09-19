/**
 * /api/unfurl?url= — a small, careful link preview for Shortwave.
 *
 * Spotify and YouTube answer through their oEmbed endpoints; anything else is
 * read as HTML for Open Graph / Twitter / <title>. https only, public
 * hostnames only, redirects re-checked hop by hop, 256 KB read cap, 4 s
 * budget. Results are shared through the edge cache for a day (failures for
 * ten minutes), so a popular link costs one fetch, not one per reader.
 * Output is plain text fields; callers must render with textContent.
 */
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status: number, cache: string) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Cache-Control': cache } });
const OK_CACHE = 'public, max-age=3600, s-maxage=86400';
const MISS_CACHE = 'public, max-age=120, s-maxage=600';
const UA = 'PointCastBot/1.0 (+https://pointcast.xyz/shortwave; link preview)';
type UnfurlEnv = Pick<Cloudflare.Env, 'PC_RATES_KV'>;
export type Unfurl = { ok: true; url: string; kind: 'spotify' | 'youtube' | 'page'; site: string; title: string; description: string; image: string };

/** A public https URL with a real hostname, or null. */
export function safeUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw.length > 600) return null;
  let u: URL; try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null;
  const host = u.hostname.toLowerCase();
  if (!host.includes('.') || host.endsWith('.') || /^[\d.]+$/.test(host) || host.includes(':') || host.startsWith('[')) return null;
  if (/(^|\.)(localhost|local|internal|lan|home|corp|test|invalid|example|onion)$/.test(host)) return null;
  u.hash = '';
  return u;
}

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'").replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Math.min(0x10ffff, Number(n)))).replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(Math.min(0x10ffff, parseInt(n, 16))));
const clean = (s: string | undefined, max: number) => decode(String(s || '')).replace(/[\x00-\x1F\x7F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** Pull preview fields out of an HTML head. Exported for tests. */
export function parseHead(html: string, page: URL): Pick<Unfurl, 'site' | 'title' | 'description' | 'image'> {
  const head = html.slice(0, 200000);
  const meta = (names: string[]) => {
    for (const name of names) {
      const n = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tag = head.match(new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${n}["'][^>]*>`, 'i'))?.[0];
      const content = tag?.match(/content\s*=\s*"([^"]*)"/i)?.[1] ?? tag?.match(/content\s*=\s*'([^']*)'/i)?.[1];
      if (content) return content;
    }
    return '';
  };
  const title = clean(meta(['og:title', 'twitter:title']) || head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1], 160);
  let image = '';
  const rawImage = clean(meta(['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']), 600);
  if (rawImage) { try { const i = new URL(rawImage, page); if (i.protocol === 'https:') image = i.toString(); } catch { /* no image */ } }
  return { site: clean(meta(['og:site_name']), 60) || page.hostname.replace(/^www\./, ''), title, description: clean(meta(['og:description', 'twitter:description', 'description']), 240), image };
}

async function timed(url: string, init: RequestInit, fetcher: typeof fetch): Promise<Response> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 4000);
  try { return await fetcher(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
}

async function oembed(endpoint: string, page: URL, kind: 'spotify' | 'youtube', site: string, fetcher: typeof fetch): Promise<Unfurl | null> {
  const res = await timed(`${endpoint}${encodeURIComponent(page.toString())}`, { headers: { Accept: 'application/json', 'User-Agent': UA } }, fetcher);
  if (!res.ok) return null;
  const data = await res.json() as Record<string, unknown>;
  const title = clean(data.title as string, 160); if (!title) return null;
  let image = ''; try { const i = new URL(String(data.thumbnail_url || '')); if (i.protocol === 'https:') image = i.toString(); } catch { /* none */ }
  return { ok: true, url: page.toString(), kind, site, title, description: clean(data.author_name as string, 120), image };
}

export async function unfurl(page: URL, fetcher: typeof fetch = fetch): Promise<Unfurl | null> {
  const host = page.hostname.replace(/^www\./, '');
  if (host === 'open.spotify.com') {
    const card = await oembed('https://open.spotify.com/oembed?url=', page, 'spotify', 'Spotify', fetcher);
    // oEmbed has the title and art but not the artist; the page's own description leads with it.
    if (card && !card.description) {
      try {
        const res = await timed(page.toString(), { headers: { Accept: 'text/html', 'User-Agent': UA } }, fetcher);
        if (res.ok) { const about = parseHead((await res.text()).slice(0, 200000), page).description; const lead = about.split(' · ')[0]; if (lead && lead !== card.title) card.description = lead.slice(0, 120); }
      } catch { /* the title and art are enough */ }
    }
    return card;
  }
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com' || host === 'music.youtube.com') return oembed('https://www.youtube.com/oembed?format=json&url=', page, 'youtube', 'YouTube', fetcher);
  let current = page;
  for (let hop = 0; hop < 4; hop++) {
    const res = await timed(current.toString(), { redirect: 'manual', headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': UA } }, fetcher);
    if (res.status >= 300 && res.status < 400) {
      const next = safeUrl(new URL(res.headers.get('Location') || '', current).toString());
      if (!next) return null;
      current = next; continue;
    }
    if (!res.ok || !/text\/html|application\/xhtml/i.test(res.headers.get('Content-Type') || '')) return null;
    const reader = res.body?.getReader(); if (!reader) return null;
    const chunks: Uint8Array[] = []; let total = 0;
    while (total < 262144) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); total += value.byteLength; }
    try { await reader.cancel(); } catch { /* already closed */ }
    const bytes = new Uint8Array(total); let offset = 0; for (const c of chunks) { bytes.set(c.subarray(0, Math.min(c.byteLength, total - offset)), offset); offset += c.byteLength; }
    const fields = parseHead(new TextDecoder().decode(bytes), current);
    if (!fields.title) return null;
    return { ok: true, url: page.toString(), kind: 'page', ...fields };
  }
  return null;
}

export async function handleUnfurl(request: Request, env: UnfurlEnv, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') return json({ ok: false, error: 'Method not allowed.' }, 405, 'no-store');
  const page = safeUrl(new URL(request.url).searchParams.get('url'));
  if (!page) return json({ ok: false, error: 'Send a public https URL.' }, 400, MISS_CACHE);
  const edge = typeof caches !== 'undefined' ? (caches as unknown as { default?: Cache }).default : undefined;
  const key = new Request(`https://pointcast.xyz/api/unfurl?url=${encodeURIComponent(page.toString())}`);
  if (edge) { const hit = await edge.match(key); if (hit) return hit; }
  // Only cache misses spend quota, so a busy link never locks anyone out.
  if (env.PC_RATES_KV) {
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const hash = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
    const rateKey = `unfurl:rate:v1:${hash}:${Math.floor(Date.now() / 3600000)}`;
    try {
      const count = Number((await env.PC_RATES_KV.get(rateKey)) || 0);
      if (count >= 40) return json({ ok: false, error: 'Preview limit reached for this hour.' }, 429, 'no-store');
      if (count % 5 === 0) await env.PC_RATES_KV.put(rateKey, String(count + 5), { expirationTtl: 3700 });
    } catch { /* previews are a nicety; a quota blip should not break them */ }
  }
  let result: Unfurl | null = null;
  try { result = await unfurl(page, fetcher); } catch { result = null; }
  const response = result ? json(result, 200, OK_CACHE) : json({ ok: false, url: page.toString(), error: 'No preview for this link.' }, 404, MISS_CACHE);
  if (edge) { try { await edge.put(key, response.clone()); } catch { /* cache is best effort */ } }
  return response;
}
export const onRequest: PagesFunction<UnfurlEnv> = ({ request, env }) => handleUnfurl(request, env);
