/**
 * GET /loom/noun?b=&body=&a=&h=&g= — the picture for the Loom's "noun" magic word (OFF-49).
 * Every trait must be a name from the official lists (noun-traits.mjs), so nothing a caller types
 * reaches the SVG; the pixels come from renderPortrait(). No ".svg" in the path: public/_routes.json
 * serves every "*.svg" as a static file, so a Pages Function there would never run.
 */
import { renderPortrait } from '../nouns-parts.mjs';
import { NOUN_ACCESSORIES, NOUN_BACKGROUNDS, NOUN_BODIES, NOUN_GLASSES, NOUN_HEADS } from './noun-traits.mjs';

const PARAMS = [['b', 'background', NOUN_BACKGROUNDS], ['body', 'body', NOUN_BODIES], ['a', 'accessory', NOUN_ACCESSORIES], ['h', 'head', NOUN_HEADS], ['g', 'glasses', NOUN_GLASSES]];
const SAFE = { 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" };
const refuse = (status, error) => new Response(error, { status, headers: { ...SAFE, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

/** The path and query for a noun value, or null when any trait is not a known name. */
export function nounPath(value) {
  const q = [];
  for (const [param, key, list] of PARAMS) {
    if (!list.includes(value?.[key])) return null;
    q.push(`${param}=${encodeURIComponent(value[key])}`);
  }
  return `/loom/noun?${q.join('&')}`;
}

export function serveNoun(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return refuse(405, 'method_not_allowed');
  const query = new URL(request.url).searchParams;
  const parts = {};
  for (const [param, key, list] of PARAMS) {
    const name = query.get(param) ?? '';
    if (!list.includes(name)) return refuse(400, `unknown_${key}`);
    parts[key] = name;
  }
  let svg;
  try { svg = renderPortrait(parts).svg; } catch { return refuse(500, 'render_failed'); }
  return new Response(request.method === 'HEAD' ? null : svg, {
    headers: { ...SAFE, 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
