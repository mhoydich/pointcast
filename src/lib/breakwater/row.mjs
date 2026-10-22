/**
 * Cabinet Row: the list of games that share the Breakwater cabinet (pixel
 * font, machine palettes, mood model) and the pure rules /cabinet-row uses.
 *
 * A cabinet is "lit" when its game is in src/data/game-catalog.json, so each
 * game lights its own cabinet when its PR merges and nothing here changes.
 * Every game saves `${slug}:v1` in localStorage with `best` (Tideline:
 * `bestRally`) and `mood` from serializeMood(); the town mood `pc:mood` is
 * written by whichever game was played last.
 */
import { LABELS } from './mood.mjs';

export const ROW = Object.freeze([
  { slug: 'breakwater', name: 'Breakwater', after: 'Breakout', year: 1976, wave: 1, tagline: 'A breakout for the 8-bit heart', moods: ['FLOW', 'DAWN'] },
  { slug: 'tideline', name: 'Tideline', after: 'Pong', year: 1972, wave: 1, tagline: 'Pong stood on its end', moods: ['FLOW', 'DAWN'] },
  { slug: 'kelp', name: 'Kelp', after: 'Snake and Nibbler', year: 1982, wave: 1, tagline: 'A snake for the 8-bit heart', moods: ['DRIFT', 'FLOW'] },
  { slug: 'soft-landing', name: 'Soft Landing', after: 'Lunar Lander', year: 1979, wave: 1, tagline: 'Set it down gently', moods: ['DAWN', 'DRIFT'] },
  { slug: 'crosswalk', name: 'Crosswalk', after: 'Frogger', year: 1981, wave: 1, tagline: 'Five lanes to the sand', moods: ['RUSH', 'FLOW'] },
  { slug: 'driftwood', name: 'Driftwood', after: 'Asteroids', year: 1979, wave: 1, tagline: 'Asteroids on the water', moods: ['RUSH'] },
  { slug: 'lighthouse', name: 'Lighthouse', after: 'Simon', year: 1978, wave: 2, tagline: 'Follow the light', moods: ['DRIFT', 'DAWN'] },
  { slug: 'low-tide', name: 'Low Tide', after: 'Kaboom!', year: 1981, wave: 2, tagline: 'Catch what the gull drops', moods: ['RUSH', 'FLOW'] },
  { slug: 'morning-route', name: 'Morning Route', after: 'Paperboy', year: 1985, wave: 2, tagline: 'Deliver the Morning Edition', moods: ['DAWN', 'FLOW'] },
  { slug: 'sea-glass', name: 'Sea Glass', after: 'Q*bert', year: 1982, wave: 2, tagline: 'Turn every stone', moods: ['FLOW', 'DRIFT'] },
  { slug: 'sandcastle', name: 'Sandcastle', after: 'Missile Command', year: 1980, wave: 2, tagline: 'Hold back the tide', moods: ['RUSH'] },
].map((c) => Object.freeze({ ...c, route: `/${c.slug}`, storeKey: `${c.slug}:v1`, cover: `/images/${c.slug}/og.png` })));

export const SITE_TO_LABEL = Object.freeze({ chill: 'DAWN', flow: 'FLOW', hype: 'RUSH', quiet: 'DRIFT' });

export const WHY = Object.freeze({
  DAWN: 'something to warm up with',
  FLOW: 'something to keep a rally going',
  RUSH: 'something fast',
  DRIFT: 'something gentle',
});

/** Which cabinets are lit, given the catalog's slugs (an array or Set). */
export function litSlugs(catalogSlugs) {
  const have = new Set(catalogSlugs);
  return ROW.filter((c) => have.has(c.slug)).map((c) => c.slug);
}

/** Normalize one game's saved JSON (a string, an object or nothing) into what the lobby shows. */
export function readSave(raw) {
  let v = raw;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = null; } }
  if (!v || typeof v !== 'object' || Array.isArray(v)) v = {};
  const num = (x) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);
  const best = num(v.best) || num(v.bestRally);
  const m = v.mood && typeof v.mood === 'object' && !Array.isArray(v.mood) ? v.mood : {};
  const tape = Array.isArray(m.tape) ? m.tape.filter((t) => Number.isInteger(t) && t >= 0 && t < LABELS.length).slice(-120) : [];
  const label = LABELS.includes(m.label) ? m.label : null;
  const peak = LABELS.includes(m.peak) ? m.peak : null;
  const unit = (x) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : null);
  return {
    played: best > 0 || tape.length > 0,
    best,
    label,
    peak,
    energy: unit(m.energy),
    calm: unit(m.calm),
    tape,
    machine: v.machine === 'c64' ? 'c64' : v.machine === 'xl' ? 'xl' : null,
    dial: typeof v.dial === 'string' ? v.dial : null,
  };
}

/**
 * The row's mood right now. The town mood is the handoff from the last game
 * played, so it wins; without it, the most common label across the last ten
 * samples of every tape; without any play, DAWN.
 */
export function rowMood(siteMood, saves = {}) {
  if (SITE_TO_LABEL[siteMood]) return { label: SITE_TO_LABEL[siteMood], source: 'town' };
  const counts = [0, 0, 0, 0];
  for (const s of Object.values(saves)) for (const t of (s?.tape || []).slice(-10)) counts[t] += 1;
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return { label: 'DAWN', source: 'default' };
  let best = 0;
  for (let i = 1; i < counts.length; i += 1) if (counts[i] > counts[best]) best = i;
  return { label: LABELS[best], source: 'tapes' };
}

/**
 * The next cabinet to play: a lit cabinet whose moods include the row mood,
 * strongest affinity first, preferring one not yet played. Falls back to any
 * lit unplayed cabinet, then any lit cabinet. Null when nothing is lit.
 */
export function suggest(label, lit = [], saves = {}) {
  const litSet = new Set(lit);
  const cabinets = ROW.filter((c) => litSet.has(c.slug));
  if (!cabinets.length) return null;
  const played = (c) => Boolean(saves[c.slug]?.played);
  const matches = cabinets
    .filter((c) => c.moods.includes(label))
    .sort((a, b) => a.moods.indexOf(label) - b.moods.indexOf(label) || ROW.indexOf(a) - ROW.indexOf(b));
  return matches.find((c) => !played(c)) || matches[0] || cabinets.find((c) => !played(c)) || cabinets[0];
}

/** One mood ribbon across the row: the last `perCabinet` samples of each played, lit cabinet, in row order. */
export function ribbon(lit = [], saves = {}, perCabinet = 20) {
  const litSet = new Set(lit);
  return ROW.filter((c) => litSet.has(c.slug) && saves[c.slug]?.tape?.length)
    .map((c) => ({ slug: c.slug, name: c.name, values: saves[c.slug].tape.slice(-perCabinet) }));
}
