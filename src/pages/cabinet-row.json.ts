/**
 * /cabinet-row.json - the lobby for PointCast's 8-bit arcade, as data:
 * every cabinet, whether it is lit in this build, and the mood rules.
 */
import type { APIRoute } from 'astro';
import catalog from '../data/game-catalog.json';
import { ROW, WHY, SITE_TO_LABEL, litSlugs } from '../lib/breakwater/row.mjs';
import { LABELS } from '../lib/breakwater/mood.mjs';

const lit = new Set(litSlugs((catalog as { slug: string }[]).map((g) => g.slug)));

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Cabinet Row',
  human: 'https://pointcast.xyz/cabinet-row',
  image: 'https://pointcast.xyz/images/cabinet-row/og.png',
  intent: 'The lobby for the PointCast 8-bit arcade: one cabinet per game that shares the Breakwater cabinet (pixel font, Atari 800XL and Commodore 64 palettes, mood model), the mood the player left the last game in, and the next cabinet for that mood.',
  credits: { director: 'Michael Hoydich', build: 'Claude Code, 2026-10-22' },
  litCount: lit.size,
  cabinets: ROW.map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    after: c.after,
    year: c.year,
    wave: c.wave,
    lit: lit.has(c.slug),
    url: lit.has(c.slug) ? `https://pointcast.xyz${c.route}` : null,
    json: lit.has(c.slug) ? `https://pointcast.xyz${c.route}.json` : null,
    cover: lit.has(c.slug) ? `https://pointcast.xyz${c.cover}` : null,
    suitsMoods: c.moods,
    browserStorageKey: c.storeKey,
  })),
  rules: {
    lit: 'A cabinet is lit when its game is in the PointCast game catalog, so each game lights its own cabinet when it is published.',
    moods: LABELS,
    rowMood: 'The town mood pc:mood is written by the last game played (chill, flow, hype, quiet) and maps back to DAWN, FLOW, RUSH, DRIFT. Without it, the most common label in the last ten mood samples of every game wins. Without any play, DAWN.',
    townToLabel: SITE_TO_LABEL,
    nextCabinet: 'A lit cabinet whose suitsMoods includes the row mood, strongest affinity first, preferring one not yet played in this browser; otherwise any unplayed lit cabinet; otherwise any lit cabinet.',
    why: WHY,
    privacy: 'The lobby reads only what the games saved in this browser. Nothing is sent anywhere.',
  },
  links: {
    human: 'https://pointcast.xyz/cabinet-row',
    games: 'https://pointcast.xyz/games/',
    breakwater: 'https://pointcast.xyz/breakwater',
    play: 'https://pointcast.xyz/play',
  },
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
