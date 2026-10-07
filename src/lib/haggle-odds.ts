/**
 * The Haggle Counter odds study. Gus is deterministic (src/lib/haggle.ts), so the
 * odds of a trade can be computed instead of guessed. Everything here runs the
 * real engine unchanged, at build time, so the study can't drift from Gus.
 *
 *   bestLine     exhaustive search over every offer sequence for the cheapest deal
 *   STRATEGIES   fixed scripts played once against every item
 *   typicalOdds  seeded Monte Carlo of an ordinary haggler (same numbers every build)
 */
import { HAGGLE_ITEMS, haggleScore, haggleTurn, newHaggle, type HaggleItem, type HaggleState } from './haggle';

/** One message that lands all four of Gus's bonuses. */
export const ALL_BONUSES = 'Please, I am an agent from El Segundo who plays pickleball.';

type Line = { price: number; path: (number | 'take')[] };

/** Cheapest reachable deal; ties go to the shortest line. `msg` is sent with the first offer only. */
export function bestLine(item: HaggleItem, msg = ''): Line | null {
  const memo = new Map<string, Line | null>();
  const go = (s: HaggleState, first: boolean): Line | null => {
    const key = [s.ask, s.patience, s.round, s.finalOffer, s.insults ?? 0, s.bonuses.length, first].join('|');
    if (memo.has(key)) return memo.get(key)!;
    const take = haggleTurn(item, s, { accept: true }).state.deal;
    let best: Line | null = take != null ? { price: take, path: ['take'] } : null;
    for (let o = 1; o < s.ask; o++) {
      const r = haggleTurn(item, s, { offer: o, message: first ? msg : '' });
      if (!r.ok) continue;
      let cand: Line | null = null;
      if (r.state.status === 'deal') cand = { price: r.state.deal!, path: [o] };
      else if (r.state.status === 'open') { const sub = go(r.state, false); if (sub) cand = { price: sub.price, path: [o, ...sub.path] }; }
      if (cand && (!best || cand.price < best.price || (cand.price === best.price && cand.path.length < best.path.length))) best = cand;
    }
    memo.set(key, best);
    return best;
  };
  return go(newHaggle(item), true);
}

type Move = (s: HaggleState, item: HaggleItem) => number | 'accept';
type Outcome = { deal: number | null; rounds: number };

function play(item: HaggleItem, next: Move, msg = ''): Outcome {
  let s = newHaggle(item);
  for (let i = 0; i < 30 && s.status === 'open'; i++) {
    const m = next(s, item);
    const r = m === 'accept' ? haggleTurn(item, s, { accept: true }) : haggleTurn(item, s, { offer: m, message: i === 0 ? msg : '' });
    if (!r.ok) break;
    s = r.state;
  }
  return { deal: s.deal, rounds: s.round };
}

/** The offer you made last round, read back from the transcript. */
const lastOffer = (s: HaggleState) => [...s.turns].reverse().find((t) => t.by === 'you')?.cents ?? 0;
const split: Move = (s, it) => s.finalOffer ? 'accept' : s.round === 0 ? Math.round(it.list * 0.5) : Math.max(1, Math.round((lastOffer(s) + s.ask) / 2));

export const STRATEGIES: { name: string; msg?: string; move: Move }[] = [
  { name: 'Pay list', move: () => 'accept' },
  { name: 'Open at 85% of his ask', move: (s) => s.finalOffer ? 'accept' : Math.round(s.ask * 0.85) },
  { name: 'Open 50%, split the difference', move: split },
  { name: 'Same, plus all four bonuses', msg: ALL_BONUSES, move: split },
  { name: 'Lowball 10%, then split', move: (s, it) => s.finalOffer ? 'accept' : s.round === 0 ? Math.max(1, Math.round(it.list * 0.1)) : Math.max(1, Math.round((lastOffer(s) + s.ask) / 2)) },
  { name: 'Open 50%, +1¢ a round', move: (s, it) => s.finalOffer ? 'accept' : Math.round(it.list * 0.5) + s.round },
  { name: 'Repeat 40% of list, never accept', move: (_s, it) => Math.round(it.list * 0.4) },
];

export const strategyScores = (st: (typeof STRATEGIES)[number]) =>
  HAGGLE_ITEMS.map((it) => { const r = play(it, st.move, st.msg); return r.deal != null ? haggleScore(it, r.deal) : null; });

export const TYPICAL_RUNS = 20_000;

/**
 * An ordinary haggler: opens at a random 20–90% of list, raises 10–60% of the
 * remaining gap each round, and takes a last price 60% of the time.
 */
export function typicalOdds(item: HaggleItem, runs = TYPICAL_RUNS) {
  let seed = 42;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  let deals = 0, scoreSum = 0, roundSum = 0;
  for (let t = 0; t < runs; t++) {
    let mine = 0;
    const r = play(item, (s, it) => {
      if (s.finalOffer) return rnd() < 0.6 ? 'accept' : Math.max(1, s.ask - 1);
      if (s.round === 0) return (mine = Math.max(1, Math.round(it.list * (0.2 + 0.7 * rnd()))));
      return (mine = Math.min(s.ask, Math.max(mine + 1, Math.round(mine + (s.ask - mine) * (0.1 + 0.5 * rnd())))));
    });
    if (r.deal != null) { deals++; scoreSum += haggleScore(item, r.deal); roundSum += r.rounds; }
  }
  return { dealRate: deals / runs, avgScore: deals ? scoreSum / deals : 0, avgRounds: deals ? roundSum / deals : 0 };
}

/** Lowest opening offer Gus takes on the spot. */
export function instantClose(item: HaggleItem) {
  for (let o = 1; o <= item.list; o++) if (haggleTurn(item, newHaggle(item), { offer: o }).state.status === 'deal') return o;
  return item.list;
}

export function haggleOddsStudy() {
  const items = HAGGLE_ITEMS.map((it) => {
    const plain = bestLine(it)!;
    const best = bestLine(it, ALL_BONUSES)!;
    const typical = typicalOdds(it);
    return {
      id: it.id, name: it.name, list: it.list, floor: it.floor, patience: it.patience, mood: it.mood,
      floorWithBonuses: Math.max(Math.ceil(it.floor * 0.8), it.floor - 4),
      bestPlain: plain.price, best: best.price, path: best.path, maxScore: haggleScore(it, best.price),
      instant: instantClose(it), typical, typicalPrice: Math.round(it.list * (1 - typical.avgScore / 100)),
    };
  });
  const strategies = STRATEGIES.map((st) => ({ name: st.name, scores: strategyScores(st) }));
  const overallDealRate = items.reduce((a, i) => a + i.typical.dealRate, 0) / items.length;
  return { items, strategies, overallDealRate };
}
