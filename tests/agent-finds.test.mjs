import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_POLICY, parseFindCard, checkHouseRules, scoreFind, checkBudget, decide, formatReply,
} from '../src/lib/agent-finds.mjs';

const NOW = Date.parse('2026-11-22T18:00:00Z');
const GOOD = { onBeat: 2, nounish: 2, delight: 2, fresh: 1, giftWorthy: 0 };
const TEZ = 1_000_000;

const card = (lines) => ['FIND', ...lines].join('\n');
const response = card([
  'post: https://x.com/SomeArtist/status/2124254377925861835',
  'beat: office-noun',
  'kind: response',
  'why: a desk plant that has outlived three reorgs',
]);

const base = { card: response, scores: GOOD, estimateMutez: 200_000, balanceMutez: 52 * TEZ, now: NOW };

test('parses a response card', () => {
  const parsed = parseFindCard(response);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.find.handle, 'someartist');
  assert.equal(parsed.find.post, 'https://x.com/SomeArtist/status/2124254377925861835');
  assert.equal(parsed.find.beat, 'office-noun');
});

test('accepts twitter.com links and normalizes them', () => {
  const parsed = parseFindCard(response.replace('https://x.com', 'https://twitter.com'));
  assert.equal(parsed.ok, true);
  assert.match(parsed.find.post, /^https:\/\/x\.com\//u);
});

test('rejects non-X links, unknown beats and missing why', () => {
  const parsed = parseFindCard(card(['post: https://example.com/a', 'beat: nobody', 'kind: response']));
  assert.equal(parsed.ok, false);
  assert.equal(parsed.errors.length, 3);
});

test('their-work needs consent from the same account', () => {
  const lines = ['post: https://x.com/alice/status/1111111111', 'beat: x-desk', 'kind: their-work', 'why: she asked'];
  assert.equal(parseFindCard(card(lines)).ok, false);
  assert.equal(parseFindCard(card([...lines, 'consent: https://x.com/bob/status/2222222222'])).ok, false);
  assert.equal(parseFindCard(card([...lines, 'consent: https://x.com/Alice/status/2222222222'])).ok, true);
});

test('gift needs a public tz address or .tez name', () => {
  const lines = ['post: https://x.com/alice/status/1111111111', 'beat: loom-desk', 'kind: gift', 'why: thanks'];
  assert.equal(parseFindCard(card(lines)).ok, false);
  assert.equal(parseFindCard(card([...lines, 'tz: opeculiar.tez'])).ok, true);
  assert.equal(parseFindCard(card([...lines, 'tz: tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY'])).ok, true);
});

test('house rules catch price talk, tickers, giveaways and key material', () => {
  assert.deepEqual(checkHouseRules('why: a lovely noun'), []);
  assert.ok(checkHouseRules('why: floor is going up').includes('price talk'));
  assert.ok(checkHouseRules('why: new coin $NOUN').includes('ticker'));
  assert.ok(checkHouseRules('why: RT to win').includes('engagement giveaway'));
  assert.ok(checkHouseRules('why: here is my seed phrase').includes('secret material'));
});

test('scores must be 0-2 on all five tests', () => {
  assert.deepEqual(scoreFind(GOOD), { ok: true, total: 7, errors: [] });
  assert.equal(scoreFind({ ...GOOD, delight: 3 }).ok, false);
  assert.equal(scoreFind({ onBeat: 2 }).ok, false);
});

test('a good find is would-mint while the agent is in shadow', () => {
  const d = decide(base);
  assert.equal(d.verdict, 'would-mint');
  assert.match(formatReply(d), /^WOULD MINT/u);
});

test('a live agent gets mint', () => {
  const policy = { ...DEFAULT_POLICY, liveAgents: ['office-noun'] };
  assert.equal(decide({ ...base, policy }).verdict, 'mint');
});

test('low scores and house-rule hits are skipped', () => {
  assert.equal(decide({ ...base, scores: { ...GOOD, delight: 0 } }).verdict, 'skip');
  const shill = response.replace('a desk plant', 'buy this desk plant');
  const d = decide({ ...base, card: shill });
  assert.equal(d.verdict, 'skip');
  assert.match(d.reasons[0], /house rule: buy talk/u);
});

test('same author within the cooldown is skipped', () => {
  const ledger = [{ agentId: 'drum', kind: 'mint', costMutez: 100_000, at: '2026-11-19T12:00:00Z', handle: 'someartist' }];
  assert.equal(decide({ ...base, ledger }).verdict, 'skip');
  const old = [{ ...ledger[0], at: '2026-11-10T12:00:00Z' }];
  assert.equal(decide({ ...base, ledger: old }).verdict, 'would-mint');
});

test('per-agent daily mint count turns into wait', () => {
  const ledger = Array.from({ length: 3 }, (_, i) => ({ agentId: 'office-noun', kind: 'mint', costMutez: 100_000, at: `2026-11-22T1${i}:00:00Z` }));
  const d = decide({ ...base, ledger });
  assert.equal(d.verdict, 'wait');
  assert.deepEqual(d.reasons, ['agent mint limit for today']);
});

test('yesterday does not count against today', () => {
  const ledger = Array.from({ length: 3 }, () => ({ agentId: 'office-noun', kind: 'mint', costMutez: 100_000, at: '2026-11-21T23:00:00Z' }));
  assert.equal(decide({ ...base, ledger }).verdict, 'would-mint');
});

test('per-op cap, floor and unknown cost are hard skips', () => {
  assert.equal(decide({ ...base, estimateMutez: 600_000 }).verdict, 'skip');
  assert.equal(decide({ ...base, balanceMutez: 15 * TEZ }).verdict, 'skip');
  assert.equal(decide({ ...base, estimateMutez: undefined }).verdict, 'skip');
  assert.equal(decide({ ...base, edition: 51 }).verdict, 'skip');
});

test('fleet caps apply across agents', () => {
  const ledger = Array.from({ length: 20 }, (_, i) => ({ agentId: `a${i}`, kind: 'mint', costMutez: 10_000, at: '2026-11-22T09:00:00Z' }));
  const r = checkBudget({ agentId: 'office-noun', estimateMutez: 100_000, balanceMutez: 52 * TEZ, ledger, now: NOW });
  assert.deepEqual(r.reasons, ['fleet mint limit for today']);
});

test('weekly tez cap', () => {
  const ledger = Array.from({ length: 5 }, (_, i) => ({ agentId: 'office-noun', kind: 'mint', costMutez: 1_400_000, at: `2026-11-${17 + i}T09:00:00Z` }));
  const r = checkBudget({ agentId: 'office-noun', estimateMutez: 200_000, balanceMutez: 52 * TEZ, ledger, now: NOW });
  assert.deepEqual(r.reasons, ['agent tez limit for the week']);
});

test('gifts count against the gift limit, not the mint limit', () => {
  const gift = card(['post: https://x.com/alice/status/1111111111', 'beat: office-noun', 'kind: gift', 'tz: alice.tez', 'why: thanks for the photo']);
  const ledger = Array.from({ length: 3 }, (_, i) => ({ agentId: 'office-noun', kind: 'mint', costMutez: 50_000, at: `2026-11-22T1${i}:00:00Z` }));
  assert.equal(decide({ ...base, card: gift, ledger }).verdict, 'would-mint');
});

test('policy keeps every agent in shadow and caps match the plan', () => {
  assert.deepEqual(DEFAULT_POLICY.liveAgents, []);
  assert.equal(DEFAULT_POLICY.caps.perAgent.mutezPerDay, 1_500_000);
  assert.equal(DEFAULT_POLICY.caps.fleet.mutezPerDay, 10_000_000);
});
