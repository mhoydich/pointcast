/**
 * Replay links for the launchpad board: a run's settings and its human
 * action log, packed into the URL hash (#/replay/<payload>). The same
 * scenario, seed, rules, approvals mode, configuration and log always
 * reproduce the same event log, so a link replays a viewer's run exactly.
 *
 * The payload is base64url JSON. Decoding checks everything before a sim
 * sees it: version, sizes, a known scenario and rule set, the configuration
 * hash (a link from another configuration cannot replay faithfully), and
 * every record's shape and the ids it names (scenario bots and intents,
 * plain wallet ids), in tick order.
 */
import { checkRecord } from './sim.mjs';
import { copyProblems } from './copy-rules.mjs';

export const REPLAY_VERSION = 1;
export const REPLAY_LIMITS = Object.freeze({ chars: 120_000, records: 2_000 });

function toBase64Url(text) {
  let bin = '';
  for (const byte of new TextEncoder().encode(text)) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

const fail = (code, message) => Object.assign(new Error(message), { code });

/**
 * Pack a run into a replay payload. `log` is the sim's human action log. A
 * viewer who acts during a replay appends records behind later ones, so the
 * log is sorted by tick; the sort is stable, and a tick runs its records in
 * log order, so the run is the same.
 */
export function encodeReplay({ scenario, seed, rules, approvals, configHash, log }) {
  const payload = { v: REPLAY_VERSION, scenario, seed, rules, approvals, configHash, log: log.map((r) => ({ ...r })).sort((a, b) => a.tick - b.tick) };
  return toBase64Url(JSON.stringify(payload));
}

/**
 * Ids a record names that the board shows as its own text must belong to the
 * scenario: a bot ('*' for all) on kill, unkill and policy records, and on
 * approve and decline an intent id as the sim makes it, `${bot}:${tick}:${n}`.
 * The wallet a launch, trade or split creates is shown like a coin name, so it
 * is a plain id that passes the copy rules.
 */
function namesBoardIds(rec, botIds) {
  if (rec.type === 'kill' || rec.type === 'unkill' || rec.type === 'policy') return rec.bot === '*' || botIds.has(rec.bot);
  if (rec.type === 'approve' || rec.type === 'decline') {
    const m = /^([^:]+):\d{1,9}:\d{1,4}$/.exec(rec.intent);
    return Boolean(m) && botIds.has(m[1]);
  }
  // A hyphen reads as a space too, so 'cash-out' is scanned as the phrase it shows.
  return /^[A-Za-z0-9_-]{1,32}$/.test(rec.wallet) && !copyProblems(rec.wallet.replaceAll('-', ' '), { viewer: true }).length;
}

/**
 * Unpack and check a replay payload. `scenarios` maps ids to scenario files,
 * `rules` lists the rule-set ids, `configHash` is this page's. Throws an
 * Error with a `code` (BAD_LINK, TOO_LONG, VERSION, SCENARIO, RULES,
 * APPROVALS, CONFIG, RECORD) on anything it cannot replay.
 */
export function decodeReplay(text, { scenarios, rules, configHash }) {
  if (typeof text !== 'string' || !text) throw fail('BAD_LINK', 'empty replay link');
  if (text.length > REPLAY_LIMITS.chars) throw fail('TOO_LONG', 'replay link is too long');
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw fail('BAD_LINK', 'replay link has characters outside base64url');
  let payload;
  try { payload = JSON.parse(fromBase64Url(text)); } catch { throw fail('BAD_LINK', 'replay link does not decode'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw fail('BAD_LINK', 'replay payload is not an object');
  if (payload.v !== REPLAY_VERSION) throw fail('VERSION', `replay version ${payload.v} is not ${REPLAY_VERSION}`);
  if (!Object.hasOwn(scenarios, payload.scenario)) throw fail('SCENARIO', 'unknown scenario');
  if (!rules.includes(payload.rules)) throw fail('RULES', 'unknown rule set');
  if (payload.approvals !== 'deny' && payload.approvals !== 'queue') throw fail('APPROVALS', 'unknown approvals mode');
  if (payload.configHash !== configHash) throw fail('CONFIG', 'replay was made under another configuration');
  if (typeof payload.seed !== 'string' || !payload.seed || payload.seed.length > 64) throw fail('BAD_LINK', 'bad seed');
  if (!Array.isArray(payload.log) || payload.log.length > REPLAY_LIMITS.records) throw fail('TOO_LONG', 'too many records');
  const botIds = new Set((scenarios[payload.scenario].bots ?? []).map((b) => b.id));
  let last = 0;
  const log = payload.log.map((rec) => {
    let ok;
    try { ok = checkRecord(rec); } catch (e) { throw fail('RECORD', e.message); }
    if (!namesBoardIds(ok, botIds)) throw fail('RECORD', `${ok.type} record names a bot, intent or wallet the board cannot show`);
    if (ok.tick < last) throw fail('RECORD', 'records are out of tick order');
    last = ok.tick;
    return ok;
  });
  return { scenario: payload.scenario, seed: payload.seed, rules: payload.rules, approvals: payload.approvals, configHash: payload.configHash, log };
}
