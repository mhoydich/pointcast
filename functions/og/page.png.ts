/**
 * /og/page.png?p=/some-page&b=2026-09-23.golden — a card for any page
 * without art of its own.
 *
 * The route reads the page's own title and description (fetching it from
 * this origin), so the query can only name a path, never supply the words:
 * nobody can mint a PointCast-branded card that says something we didn't.
 * The card wears El Segundo's current light, a Noun picked from the path,
 * a quip that rotates with the light, and a hello to whichever app asked.
 */
import { lightAt, lightBucket } from '../../src/lib/unfurl/light.mjs';
import { cardPath, nounForPath, channelForPath } from '../../src/lib/unfurl/rooms.mjs';
import { unfurlClient } from '../../src/lib/unfurl/client.mjs';
import { validBucket } from '../../src/lib/unfurl/urls.mjs';
import { pageCard } from '../../src/lib/unfurl/cards.mjs';
import {
  bumpUnfurlCounter, cached, fallback, fetchSoft, imageDataUri, jsonSoft, pngResponse, renderPng,
} from '../_lib/og-render';

type Env = { AUTH_DB?: D1Database };

interface PageMeta { title: string; ogTitle: string; description: string; ogDescription: string }

/** Pull title + description out of a page's head without buffering the body. */
export async function readPageMeta(res: Response): Promise<PageMeta> {
  const meta: PageMeta = { title: '', ogTitle: '', description: '', ogDescription: '' };
  const rewritten = new HTMLRewriter()
    .on('title', { text(t) { meta.title += t.text; } })
    .on('meta[property="og:title"]', { element(e) { meta.ogTitle ||= e.getAttribute('content') ?? ''; } })
    .on('meta[name="description"]', { element(e) { meta.description ||= e.getAttribute('content') ?? ''; } })
    .on('meta[property="og:description"]', { element(e) { meta.ogDescription ||= e.getAttribute('content') ?? ''; } })
    .transform(res);
  await rewritten.text();
  return meta;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function build(request: Request, env: Env, path: string, bucket: string, client: string): Promise<Response> {
  const origin = new URL(request.url).origin;
  const page = await fetchSoft(new URL(path, origin), { headers: { accept: 'text/html', 'x-pointcast-card-probe': '1' } }, 3000);
  if (!page || !(page.headers.get('content-type') ?? '').startsWith('text/html')) return fallback(request, 'page');
  const meta = await readPageMeta(page);
  const title = decodeEntities(meta.ogTitle || meta.title).replace(/\s+[—|–·:-]\s+PointCast$/i, '');
  const description = decodeEntities(meta.ogDescription || meta.description);

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', hourCycle: 'h23' }).format(now));
  // The marine layer only matters in the morning; skip the weather call otherwise.
  const [weather, nounHref, serial] = await Promise.all([
    hour >= 5 && hour < 13
      ? jsonSoft<{ condition?: string }>(`${origin}/api/weather?lat=33.9192&lng=-118.4165&label=El%20Segundo`, 1500)
      : Promise.resolve(null),
    imageDataUri(`https://noun.pics/${nounForPath(path)}.svg`, 2000),
    bumpUnfurlCounter(env),
  ]);

  const svg = pageCard({
    path,
    title,
    description,
    light: lightAt(now, weather?.condition ?? ''),
    nounHref,
    bucket,
    client,
    serial,
    channel: channelForPath(path),
  });
  return pngResponse(await renderPng(svg), 3600, { 'X-PointCast-Card': 'page' });
}

async function handle({ request, env, waitUntil }: { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
  const url = new URL(request.url);
  const path = cardPath(url.searchParams.get('p') ?? '');
  if (!path || path.startsWith('/og/') || path.startsWith('/api/')) return fallback(request, 'path');
  const bucket = validBucket(url.searchParams.get('b') ?? '') || lightBucket();
  const client = unfurlClient(request.headers.get('user-agent') ?? '');
  const key = `https://pointcast.xyz/og/page.png?p=${encodeURIComponent(path)}&b=${bucket}&c=${client || 'none'}`;
  try {
    return await cached(request, key, waitUntil, () => build(request, env, path, bucket, client));
  } catch {
    return fallback(request, 'render');
  }
}

export const onRequestGet: PagesFunction<Env> = (ctx) => handle(ctx);
// Unfurl crawlers (iMessage, Slack, LinkedIn) probe with HEAD before they GET.
export const onRequestHead: PagesFunction<Env> = (ctx) => handle(ctx);
