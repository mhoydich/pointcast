/**
 * /og/quartet.png?seat=0-3&b=<bucket> — the /keyboard-quartet card.
 *
 * With a seat it's an invite: the drawn keyboard lights the saved seat.
 * The query can only pick a seat (0–3), never supply words — the inviter's
 * name lives on the page, not on a PointCast-branded card.
 */
import { lightAt, lightBucket } from '../../src/lib/unfurl/light.mjs';
import { unfurlClient } from '../../src/lib/unfurl/client.mjs';
import { validBucket, quartetSeat } from '../../src/lib/unfurl/urls.mjs';
import { quartetCard } from '../../src/lib/unfurl/cards.mjs';
import { bumpUnfurlCounter, cached, fallback, pngResponse, renderPng } from '../_lib/og-render';

type Env = { AUTH_DB?: D1Database };

async function handle({ request, env, waitUntil }: { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
  const url = new URL(request.url);
  const seat = quartetSeat(url.search);
  const bucket = validBucket(url.searchParams.get('b') ?? '') || lightBucket();
  const client = unfurlClient(request.headers.get('user-agent') ?? '');
  const key = `https://pointcast.xyz/og/quartet.png?seat=${seat ?? 'none'}&b=${bucket}&c=${client || 'none'}`;
  try {
    return await cached(request, key, waitUntil, async () => {
      const serial = await bumpUnfurlCounter(env);
      const svg = quartetCard({ seat, light: lightAt(new Date(), ''), client, serial });
      return pngResponse(await renderPng(svg), 3600, { 'X-PointCast-Card': 'quartet' });
    });
  } catch {
    return fallback(request, 'render');
  }
}

export const onRequestGet: PagesFunction<Env> = (ctx) => handle(ctx);
// Unfurl crawlers (iMessage, Slack, LinkedIn) probe with HEAD before they GET.
export const onRequestHead: PagesFunction<Env> = (ctx) => handle(ctx);
