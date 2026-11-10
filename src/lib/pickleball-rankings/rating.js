// Copied verbatim from mhoydich/hello-token-reserve public/pickleball/players/rating.js (elsegundo.xyz).
// Do not edit the arithmetic here: change it upstream and re-copy, so every PointCast tier and the
// El Segundo ladder run the same numbers. tests/pickleball-rankings.test.mjs checks the constants.

// Court Rating: the shared arithmetic for the build, the join API and the player pages.
// Plain ES module with no dependencies, so the browser, Netlify functions and Node tests
// all run the same numbers. The method page explains every constant here.
//
// A player's Court Rating is a number from 2.00 to 8.00 on the familiar pickleball scale.
// It starts from what the player says (a self-declared level, the onboarding) and moves
// toward what published results show as results come in. Court Score, the ladder, is
// separate and never uses anything self-declared.

export const MIN = 2.0;
export const MAX = 8.0;

// One line per half step, written for a player picking their own level.
export const LEVELS = [
  [2.0, 'New to the game: learning the rules, the score call and where to stand.'],
  [2.5, 'Keeps short rallies going; serves and returns mostly land in.'],
  [3.0, 'Steady serve and return; starting to come up to the kitchen line and dink.'],
  [3.5, 'Plays at the line, dinks with patience, starting to drop the third shot.'],
  [4.0, 'Dinks with purpose, resets hard balls and wins points on placement more than power.'],
  [4.5, 'Controls pace, picks the right ball to attack, quick hands in fast exchanges.'],
  [5.0, 'Tournament-tested: wins tough points with shot selection and teamwork.'],
  [5.5, 'Top of the region; medals in open draws.'],
  [6.0, 'Semi-pro: beats strong 5.5 teams routinely.'],
  [6.5, 'Pro-level play on the regional circuit.'],
  [7.0, 'Touring pro.'],
  [7.5, 'Top-tier touring pro.'],
  [8.0, 'The very top of the pro game.'],
];
export const LEVEL_VALUES = LEVELS.map(([v]) => v);
export const isLevel = (v) => typeof v === 'number' && LEVEL_VALUES.includes(v);

// A finish says a little about level: gold reads a quarter step above the division, fourth a tenth below.
export const PLACE_ADJ = { 1: 0.25, 2: 0.10, 3: 0, 4: -0.10 };
// A medal from a draw of three teams or fewer says half as much.
export const SMALL_DRAW_TEAMS = 3;
export const SMALL_DRAW_WEIGHT = 0.5;
// A self-declared level counts like about three recent results.
export const DECLARED_WEIGHT = 3;
// The rating's range narrows as evidence adds up: plus or minus 0.5 with nothing, 0.25 at three full results.
export const BAND_AT_ZERO = 0.5;
// A gap this wide between what a player says and what results show is flagged, not hidden.
export const GAP_FLAG = 0.5;

const clamp = (r) => Math.min(MAX, Math.max(MIN, r));
export const round2 = (n) => Math.round(n * 100) / 100;

// results: [{ level, place, teams, recency }], recency already 0..1 (halves each year).
export function fromResults(results) {
  let w = 0, sum = 0;
  for (const r of results || []) {
    if (!(r.recency > 0) || !Number.isFinite(r.level)) continue;
    const dw = Number.isFinite(r.teams) && r.teams > 0 && r.teams <= SMALL_DRAW_TEAMS ? SMALL_DRAW_WEIGHT : 1;
    const rw = r.recency * dw;
    w += rw; sum += rw * (r.level + (PLACE_ADJ[r.place] ?? 0));
  }
  return w > 0 ? { est: round2(clamp(sum / w)), weight: round2(w) } : { est: null, weight: 0 };
}

// Blend the results estimate with a self-declared level. Either side may be missing.
export function blend({ est = null, weight = 0, declared = null } = {}) {
  const hasEst = Number.isFinite(est) && weight > 0;
  const hasDec = isLevel(declared);
  if (!hasEst && !hasDec) return null;
  const w = (hasEst ? weight : 0) + (hasDec ? DECLARED_WEIGHT : 0);
  const value = ((hasEst ? est * weight : 0) + (hasDec ? declared * DECLARED_WEIGHT : 0)) / w;
  return {
    value: round2(clamp(value)),
    plusMinus: round2(BAND_AT_ZERO / Math.sqrt(1 + (hasEst ? weight : 0))),
    level: levelName(value),
    gap: hasEst && hasDec && Math.abs(declared - est) >= GAP_FLAG ? round2(declared - est) : null,
  };
}

// The named level is the nearest half step.
export const levelName = (r) => (Math.round(clamp(r) * 2) / 2).toFixed(1);

// Self-declared: nothing but the player's word. Provisional: some results, fewer than three.
// Settled: three or more results. Vouches will count here once they exist.
export function tagFor({ results = 0, declared = false } = {}) {
  if (results >= 3) return 'Settled';
  if (results >= 1) return 'Provisional';
  return declared ? 'Self-declared' : null;
}
