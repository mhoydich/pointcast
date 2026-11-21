// Rumor Central: the index math. One file, shared by the browser pages,
// the Cloudflare Worker and the build script. No dependencies.
//
// A rumor is a claim with a deadline. Each rumor carries one or more
// "reads": a price from Kalshi or Polymarket (0..1), or, for local items,
// a count-based signal with no price. Nothing here trades or signs.

export const VERSION = '0.1.0';

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round = (n, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

// Consensus: mean of the venue prices on the rumor's headline contract.
export function consensus(r) {
  const ps = (r.reads || []).filter((x) => typeof x.p === 'number').map((x) => x.p);
  if (!ps.length) return null;
  return ps.reduce((a, b) => a + b, 0) / ps.length;
}

// Fog: how unsettled the crowd is. 100 at a coin flip, 0 at certainty.
export function fog(p) {
  return p == null ? null : round(clamp((1 - Math.abs(2 * p - 1)) * 100));
}

// Drift: points moved since the rumor's baseline read.
export function drift(r) {
  const p = consensus(r);
  if (p == null || typeof r.baseline?.p !== 'number') return null;
  return round((p - r.baseline.p) * 100, 1);
}

// Split: points between Kalshi and Polymarket when both price it.
export function split(r) {
  const k = (r.reads || []).find((x) => x.venue === 'kalshi' && typeof x.p === 'number');
  const m = (r.reads || []).find((x) => x.venue === 'polymarket' && typeof x.p === 'number');
  return k && m ? round(Math.abs(k.p - m.p) * 100, 1) : null;
}

// Clock: days left before the rumor's deadline, from `now`.
export function daysLeft(r, now = new Date()) {
  if (!r.deadline) return null;
  return round((new Date(r.deadline) - now) / 86400000, 1);
}

// Heat 0..100: fog, movement, venue disagreement, a closing deadline and
// local reach. Weights are published on every page so anyone can redo it.
export const WEIGHTS = { fog: 0.4, drift: 0.25, split: 0.15, clock: 0.1, reach: 0.1 };

export function heat(r, now = new Date()) {
  const p = consensus(r);
  const f = p == null ? (r.local?.fog ?? 50) : fog(p);
  const d = Math.abs(drift(r) ?? 0);
  const s = split(r) ?? 0;
  const left = daysLeft(r, now);
  const clock = left == null ? 0 : left <= 0 ? 0 : clamp(100 - left * 3);
  const reach = r.reach?.clicks ? clamp(r.reach.clicks * 5) : 0;
  return round(
    WEIGHTS.fog * f +
      WEIGHTS.drift * clamp(d * 4) +
      WEIGHTS.split * clamp(s * 4) +
      WEIGHTS.clock * clock +
      WEIGHTS.reach * reach,
  );
}

export function enrich(r, now = new Date()) {
  const p = consensus(r);
  return {
    ...r,
    consensus: p == null ? null : round(p * 100, 1),
    fog: p == null ? (r.local?.fog ?? null) : fog(p),
    drift: drift(r),
    split: split(r),
    daysLeft: daysLeft(r, now),
    heat: r.status === 'live' ? heat(r, now) : 0,
  };
}

// The Rumor Central Index: mean heat of every live rumor. 0 is a quiet
// week, 100 is everything up in the air at once.
export function index(feed, now = new Date()) {
  const items = (feed.rumors || []).map((r) => enrich(r, now));
  const live = items.filter((r) => r.status === 'live');
  const value = live.length ? round(live.reduce((a, r) => a + r.heat, 0) / live.length) : 0;
  const byTopic = {};
  for (const r of live) {
    const t = (byTopic[r.topic] ||= { topic: r.topic, n: 0, heat: 0 });
    t.n += 1;
    t.heat += r.heat;
  }
  const topics = Object.values(byTopic)
    .map((t) => ({ ...t, heat: round(t.heat / t.n) }))
    .sort((a, b) => b.heat - a.heat);
  // Watch next: hottest live rumors with the nearest deadline first among ties.
  const watch = [...live]
    .sort((a, b) => b.heat - a.heat || (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
    .slice(0, 3)
    .map((r) => r.id);
  // Calibration: for resolved rumors, how far the last pre-deadline price was from what happened.
  const resolved = items.filter((r) => r.status === 'confirmed' || r.status === 'denied');
  const brier = resolved.length
    ? round(
        resolved.reduce((a, r) => {
          const p = (r.lastPrice ?? r.consensus ?? 50) / 100;
          const o = r.status === 'confirmed' ? 1 : 0;
          return a + (p - o) ** 2;
        }, 0) / resolved.length,
        3,
      )
    : null;
  return { value, live: live.length, resolved: resolved.length, brier, topics, watch, items };
}

// Brier score for one personal call (UES "Call it" game). Lower is better.
export function brier(p, outcome) {
  return round((p - (outcome ? 1 : 0)) ** 2, 3);
}
