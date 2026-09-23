/**
 * Card URLs. Unfurl caches key on the image URL, so the URL carries the
 * bucket that should force a refetch: the light period for page cards, a
 * five-minute slot for live rooms. BlockLayout writes bucket-less URLs at
 * build; functions/_middleware.ts stamps the bucket on each request.
 */
import { cardPath } from './rooms.mjs';

export const SITE = 'https://pointcast.xyz';
const BUCKET_RE = /^\d{4}-\d{2}-\d{2}([.T][A-Za-z0-9:]{2,12})?$/;

export function validBucket(b) {
  return typeof b === 'string' && BUCKET_RE.test(b) ? b : '';
}

export function pageCardUrl(pathname, bucket = '', origin = SITE) {
  const p = cardPath(pathname) ?? '/';
  const url = new URL('/og/page.png', origin);
  url.searchParams.set('p', p);
  if (validBucket(bucket)) url.searchParams.set('b', bucket);
  return url.href;
}

export function liveCardUrl(room, bucket = '', origin = SITE) {
  const url = new URL(`/og/live/${encodeURIComponent(room)}.png`, origin);
  if (validBucket(bucket)) url.searchParams.set('b', bucket);
  return url.href;
}

/** Is this og:image one of ours that takes a bucket? */
export function isGeneratedCard(href) {
  try {
    const { pathname } = new URL(href, SITE);
    return pathname === '/og/page.png' || pathname.startsWith('/og/live/');
  } catch {
    return false;
  }
}

export function withBucket(href, bucket) {
  const url = new URL(href, SITE);
  if (validBucket(bucket)) url.searchParams.set('b', bucket);
  return url.href;
}
