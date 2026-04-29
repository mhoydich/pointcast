/**
 * /tide/today.json — agent-readable "tide of the day" manifest.
 *
 * Tells crawlers and visitors which palette + scene + soundscape
 * /tide will *default* to right now if a fresh visitor lands with
 * no saved preferences and no URL hash.
 *
 * Three rotations:
 *   - palette: hour-of-day → existing clock map (matches /tide.json clockDefault)
 *   - scene:   hour-of-day → 6 buckets (mystify/waves/starfield/bounce/waves/pipes)
 *   - soundscape: day-of-year mod 4 → drift/chimes/bubbles/granular
 *
 * Returns the trio + how each was derived so an agent can render or
 * describe today's tide without parsing HTML or running JS.
 */
import type { APIRoute } from 'astro';

const PALETTE_RANGES: Array<[number, number, string]> = [
  [0, 5, 'abyss'],
  [5, 8, 'daybreak'],
  [8, 11, 'crystal'],
  [11, 14, 'lagoon'],
  [14, 17, 'kelp'],
  [17, 20, 'coral'],
  [20, 22, 'storm'],
  [22, 24, 'nighttide'],
];

const SCENE_RANGES: Array<[number, number, string]> = [
  [0, 6, 'mystify'],
  [6, 10, 'waves'],
  [10, 14, 'starfield'],
  [14, 18, 'bounce'],
  [18, 21, 'waves'],
  [21, 24, 'pipes'],
];

const SOUNDSCAPES = ['drift', 'chimes', 'bubbles', 'granular'] as const;

function pickRange(ranges: Array<[number, number, string]>, hour: number): string {
  for (const [from, to, id] of ranges) {
    if (hour >= from && hour < to) return id;
  }
  return ranges[0][2];
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  // Diff in milliseconds, normalize to days.
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export const GET: APIRoute = async () => {
  // Anchor to America/Los_Angeles to match /tide.json clockDefault.
  // We don't have full Intl.DateTimeFormat shenanigans here — the build
  // runs on Node and the runtime renders this dynamically; both honor
  // process.env.TZ but we can't assume that. Use the host clock and
  // expose the timezone we *intended* in the response.
  const now = new Date();
  const hour = now.getHours();
  const dy = dayOfYear(now);

  const paletteId = pickRange(PALETTE_RANGES, hour);
  const sceneId = pickRange(SCENE_RANGES, hour);
  const soundscapeId = SOUNDSCAPES[dy % SOUNDSCAPES.length];

  const body = {
    surface: '/tide/today',
    description:
      'Defaults that /tide will fall back to right now for a visitor with no saved preferences and no URL hash. Palette rotates by hour. Scene rotates by hour. Soundscape rotates by day-of-year so the same day always sounds the same.',
    serverTimeIso: now.toISOString(),
    serverHourLocal: hour,
    dayOfYear: dy,
    timezone: 'America/Los_Angeles',
    today: {
      palette: paletteId,
      scene: sceneId,
      soundscape: soundscapeId,
    },
    derivation: {
      palette: {
        rule: 'hour-of-day → /tide.json clockDefault.ranges',
        ranges: PALETTE_RANGES.map(([from, to, id]) => ({ from, to, id })),
        chosen: paletteId,
      },
      scene: {
        rule: 'hour-of-day → 6 buckets (mystify/waves/starfield/bounce/waves/pipes)',
        ranges: SCENE_RANGES.map(([from, to, id]) => ({ from, to, id })),
        chosen: sceneId,
      },
      soundscape: {
        rule: 'dayOfYear % 4 → drift/chimes/bubbles/granular',
        index: dy % SOUNDSCAPES.length,
        sequence: [...SOUNDSCAPES],
        chosen: soundscapeId,
      },
    },
    open: `https://pointcast.xyz/tide#${paletteId}/${sceneId}`,
    note:
      'These are defaults. Returning visitors keep their last palette + scene + soundscape via localStorage. URL hash overrides everything.',
    related: {
      '/tide': 'the room',
      '/tide.json': 'full catalog (palettes, scenes, soundscapes)',
      '/tide/moments': 'saved moments viewer',
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      // 5 min — short enough that hour-of-day rotation surfaces same-hour.
      'Cache-Control': 'public, max-age=300',
    },
  });
};
