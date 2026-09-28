/**
 * /og/pickleball.png?b=<bucket> — the /pickleball board's best-bet card.
 *
 * Reads GET /api/air/board from this origin for the current best bet, and
 * hands it to src/lib/og-pickleball-card.mjs, the same page-card frame as
 * any route without art of its own. The query can only pick a light bucket,
 * never supply words: nobody can put a line on this card the board didn't
 * actually say. An empty board (no live reports, nothing scheduled right
 * now) still renders — it just says so.
 */
import { lightAt, lightBucket, lightForPeriod } from '../../src/lib/unfurl/light.mjs';
import { unfurlClient } from '../../src/lib/unfurl/client.mjs';
import { validBucket } from '../../src/lib/unfurl/urls.mjs';
import { pickleballCard } from '../../src/lib/og-pickleball-card.mjs';
import { bumpUnfurlCounter, cached, fallback, jsonSoft, pngResponse, renderPng } from '../_lib/og-render';

type Env = { AUTH_DB?: D1Database };

/** The one field this card reads off GET /api/air/board. */
interface BoardLike { best?: { line?: string | null } | null }

async function build(request: Request, env: Env, light: ReturnType<typeof lightAt>, client: string): Promise<Response> {
  const origin = new URL(request.url).origin;
  const [board, serial] = await Promise.all([
    jsonSoft<BoardLike>(`${origin}/api/air/board`, 2000),
    // Only real unfurlers are counted; browsers and the wall don't bump the stamp.
    client ? bumpUnfurlCounter(env) : Promise.resolve(0),
  ]);
  const svg = pickleballCard({ board, light, client, serial });
  return pngResponse(await renderPng(svg), 60, { 'X-PointCast-Card': 'pickleball' });
}

async function handle({ request, env, waitUntil }: { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
  const url = new URL(request.url);
  const bucket = validBucket(url.searchParams.get('b') ?? '') || lightBucket();
  const client = unfurlClient(request.headers.get('user-agent') ?? '');
  // ?light=<period> pins the palette (the Unfurl Wall's dial); otherwise it's El Segundo now.
  const forced = lightForPeriod(url.searchParams.get('light') ?? '') ? url.searchParams.get('light')! : '';
  const key = `https://pointcast.xyz/og/pickleball.png?b=${bucket}&c=${client || 'none'}&l=${forced || 'now'}`;
  try {
    return await cached(request, key, waitUntil, () => build(request, env, lightForPeriod(forced) ?? lightAt(new Date(), ''), client));
  } catch {
    return fallback(request, 'render');
  }
}

export const onRequestGet: PagesFunction<Env> = (ctx) => handle(ctx);
// Unfurl crawlers (iMessage, Slack, LinkedIn) probe with HEAD before they GET.
export const onRequestHead: PagesFunction<Env> = (ctx) => handle(ctx);
