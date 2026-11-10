// Open rating + ledger for the Communicator.
//
// Source: the rating arithmetic below is ported verbatim from
// hello-token-reserve/public/pickleball/players/rating.js (elsegundo.xyz "Court Rating").
// Constants, names and math are unchanged; this file adds a ladder config, an append-only
// ledger entry shape, a confirmation rule, and a Two Scores style game walk so the same code
// serves any league or event.
//
// Plain ES module: no dependencies, no network, no clock reads. Every function that needs
// the time takes `now`. Functions never mutate their inputs.

// ---- ported from rating.js -------------------------------------------------------------
export const MIN = 2.0;
export const MAX = 8.0;

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

// ---- ladder config ---------------------------------------------------------------------
export const DEFAULT_LADDER = {
  schema: 'coordination/ladder/1',
  id: 'pickleball:el-segundo:open',
  sport: 'pickleball',
  scale: { min: 2, max: 8, step: 0.5 },
  halfLifeDays: 365, maxAgeDays: 730,
  game: { toPoints: 11, pointsPerLevel: 12, k: 0.15, countAfter: 3 }, // Two Scores walk constants
  finish: { placeAdj: PLACE_ADJ, smallDrawTeams: SMALL_DRAW_TEAMS, smallDrawWeight: SMALL_DRAW_WEIGHT },
  confirm: 'both-sides', // 'both-sides' | 'organizer' | 'any'
  declaredWeight: DECLARED_WEIGHT,
};

// ---- small deterministic helpers (shared with engine.mjs, which may only import this file) ----
export function hashSeed(str) {
  let h = 2166136261;
  for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry32(seed) {
  let a = typeof seed === 'number' ? seed | 0 : hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Same key always gives the same id, so ids are reproducible without a clock or Math.random.
export function stableId(prefix, key, len = 8) {
  const rng = mulberry32(hashSeed(key));
  let s = '';
  while (s.length < len) s += Math.floor(rng() * 36).toString(36);
  return prefix + s;
}

// ---- recency and confirmation ----------------------------------------------------------
export function recency(atISO, nowISO, ladder = DEFAULT_LADDER) {
  const ageDays = (Date.parse(nowISO) - Date.parse(atISO)) / 86400000;
  if (!Number.isFinite(ageDays) || ageDays > ladder.maxAgeDays) return 0;
  return Math.pow(0.5, Math.max(0, ageDays) / ladder.halfLifeDays); // future-dated counts as fresh
}

export function isConfirmed(entry, ladder = DEFAULT_LADDER) {
  const cs = entry.confirmations || [];
  if (ladder.confirm === 'organizer') return entry.source?.kind === 'organizer' || cs.some((c) => c.by === 'organizer');
  if (ladder.confirm === 'any') return cs.length >= 1;
  return entry.sides.every((_, i) => cs.some((c) => c.side === i));
}

// `ladder` rides inside the second argument (default ladder otherwise) so the signature stays small.
export function confirmEntry(entry, { by, side, at, ladder = DEFAULT_LADDER }) {
  if (entry.status === 'void') throw new Error('entry is void');
  if (ladder.confirm === 'both-sides' && !entry.sides[side]?.players.includes(by)) {
    throw new Error(`${by} is not a player on side ${side}`);
  }
  const next = structuredClone(entry);
  if (!next.confirmations.some((c) => c.by === by)) next.confirmations.push({ by, side, at });
  if (next.status === 'pending' && isConfirmed(next, ladder)) next.status = 'confirmed';
  return next;
}

export function disputeEntry(entry, { by, at, note = '' }) {
  const next = structuredClone(entry);
  next.status = 'disputed';
  next.dispute = { by, at, note };
  return next;
}

export function finishEvidence(entry, now, ladder = DEFAULT_LADDER) {
  return { level: entry.level, place: entry.place, teams: entry.draw, recency: recency(entry.at, now, ladder) };
}

// ---- Two Scores style game walk ---------------------------------------------------------
// A rating may be a number or an object with value (or declared); anything else falls back to 3.5.
const seedOf = (r) => (typeof r === 'number' ? r : r?.value ?? r?.declared ?? 3.5);

export function gameWalk(entries, ratings = {}, ladder = DEFAULT_LADDER) {
  const { toPoints, pointsPerLevel, k } = ladder.game;
  const { min, max } = ladder.scale;
  const out = {};
  const cur = (h) => out[h]?.value ?? seedOf(ratings[h]);
  const mean = (hs) => hs.reduce((s, h) => s + cur(h), 0) / hs.length;
  const games = entries
    .filter((e) => e.kind === 'game' && e.status === 'confirmed')
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  for (const g of games) {
    const [A, B] = g.sides;
    const margin = ((A.score - B.score) * toPoints) / Math.max(A.score, B.score, toPoints);
    const expected = Math.max(-toPoints, Math.min(toPoints, (mean(A.players) - mean(B.players)) * pointsPerLevel));
    const step = (k * (margin - expected)) / pointsPerLevel;
    const bump = (hs, d) => {
      for (const h of hs) {
        const prev = out[h] ?? { value: cur(h), games: 0 };
        out[h] = { value: Math.min(max, Math.max(min, prev.value + d)), games: prev.games + 1 };
      }
    };
    bump(A.players, step);
    bump(B.players, -step);
  }
  return out;
}

// Method: finish results -> fromResults -> blend with the declared level (rating.js). Once a
// player has `countAfter` confirmed games, the game walk (seeded from that blend) is mixed back in:
//   value = (base*(estWeight+declaredWeight) + walk*games*0.5) / (estWeight+declaredWeight+games*0.5)
// so each confirmed game counts half as much as a recent finish. `ratings` supplies the other
// players' current values for the walk (number or {value}); unknown players read as 3.5.
export function rate(handle, { entries = [], declared = null, now, ladder = DEFAULT_LADDER, ratings = {} } = {}) {
  const involves = (e) => e.sides?.some((s) => s.players.includes(handle));
  const mine = entries.filter((e) => involves(e) && e.status === 'confirmed');
  const results = mine.filter((e) => e.kind === 'finish').map((e) => finishEvidence(e, now, ladder));
  const games = mine.filter((e) => e.kind === 'game');
  const evidence = {
    finishes: results.filter((r) => r.recency > 0).length,
    games: entries.filter((e) => e.kind === 'game' && involves(e)).length,
    confirmedGames: games.length,
    pendingGames: entries.filter((e) => e.kind === 'game' && e.status === 'pending' && involves(e)).length,
  };
  const { est, weight } = fromResults(results);
  const base = blend({ est, weight, declared });
  const hasDec = isLevel(declared);
  let value = base?.value ?? null;
  let plusMinus = base?.plusMinus ?? null;
  if (games.length >= ladder.game.countAfter) {
    const seed = { ...ratings, [handle]: base ? base.value : ratings[handle] };
    const walk = gameWalk(games, seed, ladder)[handle];
    const baseW = base ? weight + (hasDec ? ladder.declaredWeight : 0) : 0;
    const gw = games.length * 0.5;
    value = round2(Math.min(ladder.scale.max, Math.max(ladder.scale.min, ((base ? base.value : 0) * baseW + walk.value * gw) / (baseW + gw))));
    plusMinus = round2(BAND_AT_ZERO / Math.sqrt(1 + weight + gw));
  }
  if (value === null) return { handle, value: null, plusMinus: null, level: null, tag: null, gap: null, evidence };
  // Tag counts finishes only in v0; games make the number firmer but do not earn "Settled" on their own.
  return { handle, value, plusMinus, level: levelName(value), tag: tagFor({ results: evidence.finishes, declared: hasDec }), gap: base?.gap ?? null, evidence };
}

// League table: wins, then point differential. Head-to-head is omitted in v0.
export function standings(entries, { ladder = DEFAULT_LADDER, now } = {}) {
  void ladder; void now; // accepted for a stable signature; v0 table needs neither
  const t = {};
  const row = (h) => (t[h] ??= { handle: h, played: 0, won: 0, lost: 0, pointDiff: 0 });
  for (const e of entries) {
    if (e.kind !== 'game' || e.status !== 'confirmed') continue;
    const [A, B] = e.sides;
    for (const [me, them] of [[A, B], [B, A]]) {
      for (const h of me.players) {
        const r = row(h);
        r.played++; r.pointDiff += me.score - them.score;
        if (me.score > them.score) r.won++; else r.lost++;
      }
    }
  }
  return Object.values(t).sort((a, b) => b.won - a.won || b.pointDiff - a.pointDiff || a.handle.localeCompare(b.handle));
}

export const inBand = (value, target, tolerance = 0.25) => Number.isFinite(value) && Math.abs(value - target) <= tolerance + 1e-9;

// Only these fields may leave the ledger as a public rating; nothing contact-shaped belongs here.
export const PUBLIC_RATING_FIELDS = ['handle', 'value', 'plusMinus', 'level', 'tag'];
export const publicRating = (r) => Object.fromEntries(PUBLIC_RATING_FIELDS.map((k) => [k, r?.[k] ?? null]));
