/**
 * /og/live/<room>.png?b=2026-09-23T14:35 — cards drawn from a room's live
 * state: the last Shortwave posts, what the station is playing, where the
 * tug rope sits, the drum's running total, El Segundo's weather, and the
 * phrases on the Bell Post. The middleware points each room's og:image here
 * with a five-minute bucket, so a link shared twice an hour apart unfurls
 * with two different cards.
 */
import { lightAt, lightForPeriod, liveBucket } from '../../../src/lib/unfurl/light.mjs';
import { unfurlClient } from '../../../src/lib/unfurl/client.mjs';
import { validBucket } from '../../../src/lib/unfurl/urls.mjs';
import { LIVE_ROOM_IDS, liveCard } from '../../../src/lib/unfurl/cards.mjs';
import {
  bumpUnfurlCounter, cached, fallback, imageDataUri, jsonSoft, pngResponse, renderPng,
} from '../../_lib/og-render';

type Env = { AUTH_DB?: D1Database };

/** Static card per room when live data or rendering fails. */
const ROOM_FALLBACK: Record<string, string> = {
  drum: '/images/og-drum.png',
  window: '/images/og/window.png',
  'bell-post': '/images/og-bell-post.png',
};

const WEATHER = '/api/weather?lat=33.9192&lng=-118.4165&label=El%20Segundo';

async function roomData(room: string, origin: string): Promise<{ data: any; images: string[] } | null> {
  switch (room) {
    case 'shortwave': {
      const data = await jsonSoft<{ posts?: { noun?: number }[] }>(`${origin}/api/shortwave`);
      if (!data) return null;
      const images = await Promise.all((data.posts ?? []).slice(0, 3).map((p) =>
        imageDataUri(`https://noun.pics/${Math.abs(Number(p.noun) || 0) % 1200}.svg`, 2000)));
      return { data, images };
    }
    case 'station': {
      const data = await jsonSoft<{ onAir?: { image?: string } }>(`${origin}/api/station`);
      if (!data) return null;
      const cover = data.onAir?.image && /^https:\/\/i\.scdn\.co\//.test(data.onAir.image) ? await imageDataUri(data.onAir.image, 2500) : '';
      return { data, images: [cover] };
    }
    case 'tug': return wrap(await jsonSoft(`${origin}/api/tug`));
    case 'drum': return wrap(await jsonSoft(`${origin}/api/drum`));
    case 'window': return wrap(await jsonSoft(`${origin}${WEATHER}`));
    case 'bell-post': return wrap(await jsonSoft(`${origin}/api/bell-post`));
    default: return null;
  }
}

function wrap(data: unknown) {
  return data ? { data, images: [] } : null;
}

async function build(request: Request, env: Env, room: string, client: string, forced: string): Promise<Response> {
  const origin = new URL(request.url).origin;
  const [live, presence, weather, serial] = await Promise.all([
    roomData(room, origin),
    jsonSoft<{ humans?: number; agents?: number }>(`${origin}/api/presence/snapshot`, 1500),
    room === 'window' ? Promise.resolve(null) : jsonSoft<{ condition?: string }>(`${origin}${WEATHER}`, 1500),
    // Only real unfurlers count; a browser scrolling /unfurl-wall is not an unfurl.
    client ? bumpUnfurlCounter(env) : Promise.resolve(0),
  ]);
  if (!live) return fallback(request, 'data', ROOM_FALLBACK[room]);
  const condition = room === 'window' ? live.data?.condition : weather?.condition;
  const svg = liveCard({
    room,
    data: live.data,
    images: live.images,
    light: lightForPeriod(forced) ?? lightAt(new Date(), condition ?? ''),
    now: Date.now(),
    client,
    serial,
    presence,
  });
  return pngResponse(await renderPng(svg), 300, { 'X-PointCast-Card': `live:${room}` });
}

async function handle({ request, env, params, waitUntil }: {
  request: Request; env: Env; params: Record<string, string | string[]>; waitUntil: (p: Promise<unknown>) => void;
}): Promise<Response> {
  const raw = String(params.room ?? '');
  const room = raw.replace(/\.png$/, '');
  if (!raw.endsWith('.png') || !LIVE_ROOM_IDS.includes(room)) return new Response('Not found', { status: 404 });
  const url = new URL(request.url);
  const bucket = validBucket(url.searchParams.get('b') ?? '') || liveBucket();
  const client = unfurlClient(request.headers.get('user-agent') ?? '');
  const forced = lightForPeriod(url.searchParams.get('light') ?? '') ? url.searchParams.get('light')! : '';
  const key = `https://pointcast.xyz/og/live/${room}.png?b=${bucket}&c=${client || 'none'}&l=${forced || 'now'}`;
  try {
    return await cached(request, key, waitUntil, () => build(request, env, room, client, forced));
  } catch {
    return fallback(request, 'render', ROOM_FALLBACK[room]);
  }
}

export const onRequestGet: PagesFunction<Env> = (ctx) => handle(ctx as any);
export const onRequestHead: PagesFunction<Env> = (ctx) => handle(ctx as any);
