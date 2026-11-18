/**
 * Thin request handlers for the topic front doors. They call the Loom's own
 * handleLoom with an internal GET, so there is no second storage path.
 * Functions in functions/loom/ inject the atomic reader used by functions/api/loom.ts.
 */
import { handleLoom } from './service.mjs';
// Tests may supply legacy KV; production supplies the authoritative atomic reader.
const read = (request, source) => typeof source === 'function' ? source(request) : handleLoom(request, { kv: source });
import { buildSitemap, buildTopicIndex, buildTopicPage, canonicalTopicName, parseTopicName } from './topic-page.mjs';

const API = 'https://pointcast.xyz/api/loom';
const html = (body, status, cache, extra = {}) => new Response(body, { status, headers: {
  'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', ...extra } });
const internal = (query, kv) => read(new Request(`${API}${query}`), kv);

export async function serveTopic(request, kv, rawName) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const name = parseTopicName(rawName);
  const lower = name ? null : canonicalTopicName(rawName);
  if (lower) return new Response(null, { status: 301, headers: { Location: `/loom/topic/${lower}`, 'Cache-Control': 'public, max-age=3600' } });
  if (!name) return html('<!DOCTYPE html><title>Not a topic</title><p>Not a Loom topic. <a href="/loom/topic/">See public topics</a>.</p>', 404, 'public, max-age=300', { 'X-Robots-Tag': 'noindex' });
  const res = await internal(`?to=${encodeURIComponent(`#${name}`)}`, kv);
  let data = null;
  try { data = await res.json(); } catch { /* handled below */ }
  if (!data?.ok) return html('<!DOCTYPE html><title>The Loom is out of reach</title><p>The Loom is out of reach right now. Try again in a minute.</p>', 503, 'no-store', { 'X-Robots-Tag': 'noindex' });
  // Never written (no stored log, not a seed): nothing to index, so a real 404 for crawlers.
  if (!data.log?.createdAt) return html('<!DOCTYPE html><meta name="robots" content="noindex"><title>Nothing here yet</title><p>No one has posted to this topic yet. <a href="/loom?to=%23' + name + '&amp;compose=1#thread">Start it in the Loom</a> or see <a href="/loom/topic/">public topics</a>.</p>', 404, 'public, max-age=60', { 'X-Robots-Tag': 'noindex' });
  const empty = !(Number(data.count) >= 3);
  return html(buildTopicPage(data, { name }), 200, empty ? 'public, max-age=60' : 'public, max-age=300', empty ? { 'X-Robots-Tag': 'noindex, follow' } : {});
}

async function directory(kv) {
  const res = await internal('?kind=topic', kv);
  try { return await res.json(); } catch { return null; }
}

export async function serveTopicIndex(request, kv) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const data = await directory(kv);
  if (!data?.ok) return html('<p>The Loom is out of reach.</p>', 503, 'no-store');
  return html(buildTopicIndex(data), 200, 'public, max-age=300');
}

export async function serveSitemap(request, kv) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const data = await directory(kv);
  if (!data?.ok) return new Response('The Loom is out of reach.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return new Response(buildSitemap(data), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' } });
}
