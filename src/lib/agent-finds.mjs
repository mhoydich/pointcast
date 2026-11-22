/**
 * agent-finds.mjs — turn an X "find" posted on the Loom into a mint decision
 * for one agent wallet, inside the house rules and a budget.
 *
 * Flow (docs/setup/agent-x-finds.md):
 *   1. A desk that can see X (Grok bots, Codex, Office Noun desk...) posts a
 *      FIND card to Loom #x-finds.
 *   2. parseFindCard() reads it; checkHouseRules() refuses anything off-limits.
 *   3. The agent scores it (0-2 on five tests); scoreFind() totals it.
 *   4. checkBudget() checks the agent and fleet caps against the op ledger.
 *   5. decide() returns skip / wait / would-mint (shadow) / mint (live).
 *
 * Pure functions only: no network, no keys. Minting itself goes through the
 * signing server (/api/agent-wallets/:id/mint, PR #1906), which keeps its own
 * daily cap. Nothing here can spend.
 */

import policyJson from '../data/agent-mint-policy.json' with { type: 'json' };
import roster from '../data/agent-wallet-roster.json' with { type: 'json' };

export const DEFAULT_POLICY = policyJson;
export const AGENT_IDS = Object.freeze(roster.agents.map((agent) => agent.id));
export const FIND_KINDS = Object.freeze(['response', 'gift', 'their-work']);
export const SCORE_TESTS = Object.freeze(['onBeat', 'nounish', 'delight', 'fresh', 'giftWorthy']);

const DAY_MS = 86_400_000;
const X_STATUS = /^https:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:[/?#].*)?$/u;
const TZ_ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/u;
const TEZ_NAME = /^[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})*\.tez$/u;

function field(lines, name) {
  const prefix = `${name}:`;
  const line = lines.find((l) => l.toLowerCase().startsWith(prefix));
  return line ? line.slice(prefix.length).trim() : '';
}

export function parseXStatus(url) {
  const match = X_STATUS.exec(String(url ?? '').trim());
  if (!match) return null;
  return { handle: match[1].toLowerCase(), statusId: match[2], url: `https://x.com/${match[1]}/status/${match[2]}` };
}

/**
 * Parse a FIND card. Returns { ok: true, find } or { ok: false, errors }.
 * The card is plain text; field names are case-insensitive, one per line.
 */
export function parseFindCard(text, policy = DEFAULT_POLICY) {
  const lines = String(text ?? '').split(/\r?\n/u).map((l) => l.trim()).filter(Boolean);
  const errors = [];
  if (!lines.length || lines[0].toUpperCase() !== 'FIND') errors.push('not a FIND card (first line must be FIND)');

  const post = parseXStatus(field(lines, 'post'));
  if (!post) errors.push('post must be an x.com status link');

  const beat = field(lines, 'beat').toLowerCase();
  if (!AGENT_IDS.includes(beat)) errors.push(`beat must be one of: ${AGENT_IDS.join(', ')}`);

  const kind = field(lines, 'kind').toLowerCase();
  if (!FIND_KINDS.includes(kind)) errors.push(`kind must be one of: ${FIND_KINDS.join(', ')}`);

  const why = field(lines, 'why');
  if (!why) errors.push('why is required');

  const consentUrl = field(lines, 'consent');
  const consent = consentUrl ? parseXStatus(consentUrl) : null;
  if (kind === 'their-work') {
    if (!consent) errors.push('their-work needs a consent link to the author\'s own post');
    else if (post && consent.handle !== post.handle) errors.push('consent must be posted by the same account as the post');
  }

  const tz = field(lines, 'tz');
  if (kind === 'gift' && !(TZ_ADDRESS.test(tz) || TEZ_NAME.test(tz.toLowerCase()))) {
    errors.push('gift needs the author\'s publicly posted tz address or .tez name');
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    find: {
      post: post.url,
      handle: post.handle,
      statusId: post.statusId,
      beat,
      kind,
      why,
      consent: consent?.url ?? null,
      tz: kind === 'gift' ? tz : null,
    },
  };
}

/** House rules on the card's own words. Returns a list of reasons (empty = clean). */
export function checkHouseRules(text, policy = DEFAULT_POLICY) {
  const reasons = [];
  for (const rule of policy.blockedPatterns ?? []) {
    if (new RegExp(rule.pattern, 'iu').test(String(text ?? ''))) reasons.push(rule.reason);
  }
  return [...new Set(reasons)];
}

/** Five tests, 0-2 each. Returns { ok, total, errors }. */
export function scoreFind(scores) {
  const errors = [];
  let total = 0;
  for (const test of SCORE_TESTS) {
    const value = scores?.[test];
    if (!Number.isInteger(value) || value < 0 || value > 2) errors.push(`${test} must be 0, 1 or 2`);
    else total += value;
  }
  return { ok: errors.length === 0, total, errors };
}

function within(entry, now, days) {
  const at = Date.parse(entry.at);
  return Number.isFinite(at) && at <= now && now - at < days * DAY_MS;
}

function sameUtcDay(entry, now) {
  const at = Date.parse(entry.at);
  return Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === new Date(now).toISOString().slice(0, 10);
}

/**
 * Budget check against the ledger of past operations.
 * ledger: [{ agentId, kind: 'mint' | 'gift', costMutez, at, handle? }]
 * Returns { ok, reasons }. Every limit that fails is listed.
 */
export function checkBudget({ agentId, kind = 'mint', estimateMutez, balanceMutez, edition = 1, ledger = [], now = Date.now(), policy = DEFAULT_POLICY }) {
  const caps = policy.caps;
  const reasons = [];
  const op = kind === 'gift' ? 'gift' : 'mint';
  if (!Number.isSafeInteger(estimateMutez) || estimateMutez < 0) reasons.push('no cost estimate');
  else if (estimateMutez > caps.perAgent.mutezPerOp) reasons.push('over the per-operation cap');
  if (!Number.isSafeInteger(edition) || edition < 1 || edition > caps.perAgent.maxEdition) reasons.push('edition size out of range');
  if (!Number.isSafeInteger(balanceMutez)) reasons.push('balance unknown');
  else if (balanceMutez - (estimateMutez || 0) < caps.perAgent.floorMutez) reasons.push('would go under the balance floor');

  const today = ledger.filter((e) => sameUtcDay(e, now));
  const week = ledger.filter((e) => within(e, now, 7));
  const mine = (list) => list.filter((e) => e.agentId === agentId);
  const spend = (list) => list.reduce((sum, e) => sum + (Number(e.costMutez) || 0), 0);
  const count = (list, k) => list.filter((e) => e.kind === k).length;
  const cost = estimateMutez || 0;

  const perOpCount = op === 'gift' ? 'giftsPerDay' : 'mintsPerDay';
  if (count(mine(today), op) + 1 > caps.perAgent[perOpCount]) reasons.push(`agent ${op} limit for today`);
  if (count(today, op) + 1 > caps.fleet[perOpCount]) reasons.push(`fleet ${op} limit for today`);
  if (spend(mine(today)) + cost > caps.perAgent.mutezPerDay) reasons.push('agent tez limit for today');
  if (spend(mine(week)) + cost > caps.perAgent.mutezPerWeek) reasons.push('agent tez limit for the week');
  if (spend(today) + cost > caps.fleet.mutezPerDay) reasons.push('fleet tez limit for today');
  if (spend(week) + cost > caps.fleet.mutezPerWeek) reasons.push('fleet tez limit for the week');
  return { ok: reasons.length === 0, reasons };
}

const BUDGET_WAIT = /limit for today|limit for the week/u;

/**
 * Decide one find for one agent.
 * Returns { verdict: 'skip' | 'wait' | 'would-mint' | 'mint', reasons, total }.
 * 'wait' means only a time-based limit failed; the find can be retried later.
 */
export function decide({ card, scores, agentId, estimateMutez, balanceMutez, edition = 1, ledger = [], now = Date.now(), policy = DEFAULT_POLICY }) {
  const parsed = parseFindCard(card, policy);
  if (!parsed.ok) return { verdict: 'skip', reasons: parsed.errors, total: 0 };
  const { find } = parsed;
  const actor = agentId ?? find.beat;

  const rules = checkHouseRules(card, policy);
  if (rules.length) return { verdict: 'skip', reasons: rules.map((r) => `house rule: ${r}`), total: 0, find };

  const score = scoreFind(scores);
  if (!score.ok) return { verdict: 'skip', reasons: score.errors, total: score.total, find };
  if (score.total < policy.minScore) return { verdict: 'skip', reasons: [`score ${score.total} is under ${policy.minScore}`], total: score.total, find };

  const recent = ledger.some((e) => e.handle && e.handle.toLowerCase() === find.handle && within(e, now, policy.authorCooldownDays));
  if (recent) return { verdict: 'skip', reasons: [`already minted about @${find.handle} in the last ${policy.authorCooldownDays} days`], total: score.total, find };

  const budget = checkBudget({ agentId: actor, kind: find.kind === 'gift' ? 'gift' : 'mint', estimateMutez, balanceMutez, edition, ledger, now, policy });
  if (!budget.ok) {
    const onlyTime = budget.reasons.every((r) => BUDGET_WAIT.test(r));
    return { verdict: onlyTime ? 'wait' : 'skip', reasons: budget.reasons, total: score.total, find };
  }

  const live = (policy.liveAgents ?? []).includes(actor);
  return { verdict: live ? 'mint' : 'would-mint', reasons: [], total: score.total, find };
}

/** The reply an agent posts under the FIND card on the Loom. No prices, no keys. */
export function formatReply(decision) {
  const head = {
    'mint': 'MINTING',
    'would-mint': 'WOULD MINT (shadow week, nothing spent)',
    'wait': 'WAIT (budget for now is used up; will retry)',
    'skip': 'SKIP',
  }[decision.verdict] ?? 'SKIP';
  const score = decision.total ? ` · score ${decision.total}/10` : '';
  const kind = decision.find ? ` · ${decision.find.kind}` : '';
  const why = decision.reasons?.length ? `\n${decision.reasons.join('; ')}` : '';
  return `${head}${kind}${score}${why}`;
}
