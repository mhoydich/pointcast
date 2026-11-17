// The Desk — config loading. The config is a file in the repo, bundled at
// build time and deep-frozen here. No route writes it; changing a limit is a
// reviewed PR. Every order records the config hash it was judged under.
import { canonical, deepFreeze, sha256hex } from './util.mjs';

const VENUE_KINDS = new Set(['event', 'equity']);
const MODES = new Set(['paper', 'live']);

/** Throws on a config the gate must not run under. Returns a frozen copy. */
export function loadConfig(raw) {
  const c = structuredClone(raw);
  const fail = (msg) => { throw new Error(`the-desk config: ${msg}`); };
  if (!MODES.has(c.mode)) fail('mode must be paper or live');
  const l = c.limits || fail('limits missing');
  if (!(l.maxPositionPctOfBankroll > 0 && l.maxPositionPctOfBankroll <= 0.02)) fail('maxPositionPctOfBankroll must be in (0, 0.02]');
  if (!(l.dailyLossLimitUsd > 0)) fail('dailyLossLimitUsd must be > 0');
  if (!(l.approvalAboveUsd >= 0)) fail('approvalAboveUsd must be >= 0');
  if (!(l.approvalTtlMinutes > 0)) fail('approvalTtlMinutes must be > 0');
  if (!(Number.isInteger(l.maxOrdersPerTick) && l.maxOrdersPerTick > 0)) fail('maxOrdersPerTick must be a positive integer');
  for (const [id, v] of Object.entries(c.venues || fail('venues missing'))) {
    if (!VENUE_KINDS.has(v.kind)) fail(`venue ${id}: kind`);
    if (!MODES.has(v.mode)) fail(`venue ${id}: mode`);
    if (!(v.bankrollUsd > 0)) fail(`venue ${id}: bankrollUsd must be > 0`);
    if (c.mode === 'paper' && v.mode === 'live') fail(`venue ${id} is live while the desk is in paper mode`);
  }
  const ids = new Set();
  for (const a of c.agents || fail('agents missing')) {
    if (!/^[a-z][a-z0-9-]{1,31}$/.test(a.id)) fail(`agent id ${a.id}`);
    if (ids.has(a.id)) fail(`duplicate agent ${a.id}`);
    ids.add(a.id);
  }
  c.excluded = { keywords: (c.excluded?.keywords || []).map((k) => String(k).toLowerCase()) };
  return deepFreeze(c);
}

export async function configHash(config) {
  return (await sha256hex(canonical(config))).slice(0, 16);
}

/** Largest single position on a venue, in dollars: 2% of that venue's bankroll. */
export function maxPositionUsd(config, venue) {
  return config.venues[venue].bankrollUsd * config.limits.maxPositionPctOfBankroll;
}
