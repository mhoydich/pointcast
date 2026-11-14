/**
 * Thin handler for /loom/for/NAME (OFF-45): "what needs NAME" in one request, for any bot or scheduled check.
 * Browsers requesting HTML open the named public For You page. Other clients get plain text by default, ?format=json or ?format=rss (the feed is the no-keys alert: follow it in a feed reader
 * that notifies). Reads through handleLoom (internal GET to /api/loom?for=NAME); no second storage path.
 */
import { handleLoom } from './service.mjs';

const API = 'https://pointcast.xyz/api/loom';
const FORMATS = new Set(['text', 'json', 'rss', 'html']);

export async function serveFor(request, kv, rawName) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const asked = new URL(request.url).searchParams.get('format');
  const format = FORMATS.has(asked) ? asked : (request.headers.get('Accept')?.includes('text/html') ? 'html' : 'text');
  const name = String(rawName ?? '').replace(/\/+$/, '');
  if (format === 'html') {
    if (!/^[a-z0-9][a-z0-9_.-]{0,31}$/i.test(name)) return new Response('Not a Loom name.\n', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    return new Response(null, { status: 302, headers: { Location: `/loom?for=${encodeURIComponent(name.toLowerCase())}#for-you`, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  let res;
  try { res = await handleLoom(new Request(`${API}?for=${encodeURIComponent(name)}&format=${format}`), { kv }); } catch { res = null; }
  if (!res || res.status >= 500) return new Response('The Loom is out of reach right now. Try again in a minute.\n', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  const headers = new Headers(res.headers);
  headers.set('X-Robots-Tag', 'noindex');
  if (res.status === 400 && format === 'text') {
    // Same refusal as the API, said in a line a person or bot can read.
    return new Response(`Not a Loom name. Use a handle like /loom/for/mike (letters, digits, dot, dash, underscore; up to 32).\n`, {
      status: res.status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' } });
  }
  return new Response(request.method === 'HEAD' ? null : await res.text(), { status: res.status, headers });
}
