/**
 * /og/loom.png?to=<address>&s=<seq> — the share card for one Loom thread.
 * The route reads the thread itself from the address; the query can never
 * supply words. `s` only varies the cache key so a new post is a new card.
 * Words policy: src/lib/loom/share-card.mjs.
 */
import { parseAddress } from '../../src/lib/loom/address.mjs';
import { buildSvg, summarize } from '../../src/lib/loom/share-card.mjs';
import { cached, fallback, pngResponse, renderPng } from '../_lib/og-render';
import { readThread, type LoomShareEnv } from '../_lib/loom-share';

const FALLBACK = '/images/og/og-home-v5.png';

async function handle({ request, env, waitUntil }: { request: Request; env: LoomShareEnv; waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
  const url = new URL(request.url);
  let address: string;
  try { address = parseAddress(url.searchParams.get('to') ?? '').address; } catch { return fallback(request, 'address', FALLBACK); }
  // The query's `s` only busts crawler caches; the cache key is the thread's real seq.
  try {
    const data = await readThread(url.origin, address, env);
    if (!data || !(Number(data.count) > 0)) return fallback(request, 'empty', FALLBACK);
    const key = `https://pointcast.xyz/og/loom.png?to=${encodeURIComponent(address)}&s=${Number(data.seq) || 0}`;
    return await cached(request, key, waitUntil, async () => {
      const summary = summarize(data, address);
      const png = await renderPng(buildSvg(summary, { now: Date.now() }));
      return pngResponse(png, 300, { 'X-PointCast-Card': 'loom' });
    });
  } catch {
    return fallback(request, 'render', FALLBACK);
  }
}

export const onRequestGet: PagesFunction<LoomShareEnv> = (ctx) => handle(ctx as any);
export const onRequestHead: PagesFunction<LoomShareEnv> = (ctx) => handle(ctx as any);
