/**
 * /morning-picks.json — the daily block (the /today pick) for every Morning
 * Edition date the functions might compose before the next deploy: from No. 1
 * (or a week back, while previews run) through 60 days past this build.
 *
 * Slot 6 of the Morning Edition ("One pick") reads this through ASSETS
 * (dailyPick in functions/_lib/morning-sources.ts). /today.json only carries
 * the build day ±1 week, so an edition first read two days after the last
 * deploy, or an old one first opened through ?d=, would otherwise freeze the
 * template for good. pickDailyBlock is deterministic, so precomputing is safe.
 *
 * Static, so it is a file, not a Pages Function; it never collides with
 * functions/morning.json.ts.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { pickDailyBlock } from '../lib/daily';
// @ts-ignore — plain module shared with the functions and tests
import { FIRST_EDITION, addDays } from '../../functions/_lib/morning.mjs';

/** Days past the build covered; a deploy lands far more often than this. */
export const PICKS_AHEAD_DAYS = 60;

export const GET: APIRoute = async () => {
  const blocks = await getCollection('blocks', ({ data }) => !data.draft);
  const now = new Date();
  const buildDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now);
  const weekBack = addDays(buildDay, -7);
  const from = weekBack < FIRST_EDITION ? weekBack : FIRST_EDITION;
  const to = addDays(buildDay, PICKS_AHEAD_DAYS);

  const picks: Record<string, { blockId: string; title: string }> = {};
  for (let date = from; date <= to; date = addDays(date, 1)) {
    // 20:00Z is midday in El Segundo under PDT and PST, so it is always `date` there.
    const pick = pickDailyBlock(blocks, new Date(`${date}T20:00:00Z`));
    if (pick) picks[date] = { blockId: pick.data.id, title: pick.data.title };
  }

  return new Response(JSON.stringify({ v: 1, generatedAt: now.toISOString(), from, to, picks }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
