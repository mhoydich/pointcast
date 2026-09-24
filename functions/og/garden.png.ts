/**
 * /og/garden.png?beat=<score>&b=<bucket> — the /keyboard-garden card.
 *
 * With ?beat it's a challenge card ("Can you beat 84?"). The query can only
 * carry digits, never words, so nobody can put their own text on the card.
 */
import { lightAt, lightBucket, lightForPeriod } from '../../src/lib/unfurl/light.mjs';
import { unfurlClient } from '../../src/lib/unfurl/client.mjs';
import { validBucket } from '../../src/lib/unfurl/urls.mjs';
import { gardenBeat, gardenCard } from '../../src/lib/unfurl/cards.mjs';
import { bumpUnfurlCounter, cached, fallback, pngResponse, renderPng } from '../_lib/og-render';

type Env = { AUTH_DB?: D1Database };

async function handle({ request, env, waitUntil }: { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
  const url = new URL(request.url);
  const beat = gardenBeat(url.searchParams.get('beat'));
  const bucket = validBucket(url.searchParams.get('b') ?? '') || lightBucket();
  const client = unfurlClient(request.headers.get('user-agent') ?? '');
  // ?light=<period> pins the palette (the Unfurl Wall's dial); otherwise it's El Segundo now.
  const forced = lightForPeriod(url.searchParams.get('light') ?? '') ? url.searchParams.get('light')! : '';
  const key = `https://pointcast.xyz/og/garden.png?beat=${beat}&b=${bucket}&c=${client || 'none'}&l=${forced || 'now'}`;
  try {
    return await cached(request, key, waitUntil, async () => {
      // Only real unfurlers are counted; browsers and the wall don't bump the stamp.
      const serial = client ? await bumpUnfurlCounter(env) : 0;
      const svg = gardenCard({ beat, light: lightForPeriod(forced) ?? lightAt(new Date(), ''), client, serial });
      return pngResponse(await renderPng(svg), 3600, { 'X-PointCast-Card': 'garden' });
    });
  } catch {
    return fallback(request, 'render');
  }
}

export const onRequestGet: PagesFunction<Env> = (ctx) => handle(ctx);
// Unfurl crawlers (iMessage, Slack, LinkedIn) probe with HEAD before they GET.
export const onRequestHead: PagesFunction<Env> = (ctx) => handle(ctx);
