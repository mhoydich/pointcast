/**
 * Unfurl freshness — version the social-card URLs so crawlers refetch.
 *
 * X, iMessage, Slack, Discord and Facebook cache an og:image by URL, often
 * for weeks. Regenerating a card at the same path therefore keeps showing
 * the old one. A build-time `?v=<content hash>` on any card that lives in
 * `public/` makes the URL change whenever the pixels do, and a Los Angeles
 * date on the request-time Kennel Club card rolls it over each morning.
 */
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const hashes = new Map();

// The production bundle polyfills `process` for the browser (astro.config
// nodePolyfills), so `process.cwd()` lies there. Astro's Vite `define` hands
// us the absolute public dir instead; tests and plain Node fall back to cwd.
const DEFAULT_PUBLIC_DIR = typeof __PC_PUBLIC_DIR__ === 'string'
  ? __PC_PUBLIC_DIR__
  : path.resolve(globalThis.process?.cwd?.() ?? '.', 'public');

/** Short content hash of a file under `publicDir`, or '' when it is not a plain file there. */
export function publicAssetHash(pathname, publicDir = DEFAULT_PUBLIC_DIR) {
  const clean = String(pathname || '').split(/[?#]/, 1)[0];
  if (!clean.startsWith('/') || clean.includes('..')) return '';
  if (hashes.has(clean)) return hashes.get(clean);
  let hash = '';
  try {
    const file = path.join(publicDir, clean);
    if (statSync(file).isFile()) hash = createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 10);
  } catch { /* request-time routes and remote images have no file to hash */ }
  hashes.set(clean, hash);
  return hash;
}

/**
 * The same image URL with a `v` query when it is a versionable public file.
 * Absolute pointcast.xyz URLs are versioned too; other hosts and routes that
 * only exist at request time are returned untouched.
 */
export function versionedImageUrl(image, siteBase = 'https://pointcast.xyz', publicDir) {
  if (!image) return image;
  let url;
  try { url = new URL(image, siteBase); } catch { return image; }
  const site = new URL(siteBase);
  if (url.hostname !== site.hostname || url.searchParams.has('v')) return image;
  const hash = publicAssetHash(url.pathname, publicDir);
  if (!hash) return image;
  url.searchParams.set('v', hash);
  return url.toString();
}

/** Request-time card URL that changes once a day in Los Angeles. */
export function datedImageUrl(image, date) {
  const url = new URL(image);
  url.searchParams.set('date', date);
  return url.toString();
}
