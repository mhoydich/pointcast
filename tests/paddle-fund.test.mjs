import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ledgerTotals, parseFundAction, tally } from '../functions/_lib/paddle-fund.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

test('The Court Fund ships its page, ledger, API, checkout, runbook and PRD', async () => {
  for (const path of [
    'src/pages/paddles/fund.astro', 'src/pages/paddles/fund.json.ts', 'src/data/court-fund-ledger.json',
    'functions/api/paddles/fund.ts', 'functions/api/paddles/fund/checkout.ts', 'functions/_lib/paddle-fund.mjs',
    'docs/runbooks/court-fund-ledger.md', 'docs/briefs/2026-09-21-paddle-register-v3-court-fund.md',
  ]) assert.ok(exists(path), path);
  const page = await read('src/pages/paddles/fund.astro');
  assert.match(page, /Nothing on the register is paywalled/);
  assert.match(page, /Passes are purchases, not donations/);
  assert.doesNotMatch(page, /tax[- ]deductible/i, 'no tax language');
  const checkout = await read('functions/api/paddles/fund/checkout.ts');
  assert.match(checkout, /ALLOWED_HOSTS = new Set\(\['buy\.stripe\.com'/, 'checkout only redirects to Stripe hosts');
  assert.match(checkout, /status: 503/);
});

test('ledger: totals are computed, the split holds, and a payout without a receipt does not count', async () => {
  const ledger = JSON.parse(await read('src/data/court-fund-ledger.json'));
  assert.equal(ledger.meta.split.house + ledger.meta.split.fund, 1);
  assert.equal(ledger.candidates.length, 3);
  for (const c of ledger.candidates) assert.match(c.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  const t0 = ledgerTotals(ledger);
  assert.deepEqual([t0.inUsd, t0.fundBalance, t0.passes], [0, 0, 0], 'opens at zero');
  const t = ledgerTotals({ meta: ledger.meta, entries: [
    { date: '2026-10-01', kind: 'in', usd: 25 }, { date: '2026-10-02', kind: 'in', usd: 100 },
    { date: '2026-10-09', kind: 'out', usd: 30, note: 'no receipt' },
    { date: '2026-10-10', kind: 'out', usd: 40, receipt: 'https://pointcast.xyz/images/court-fund/x.pdf' },
  ] });
  assert.equal(t.inUsd, 125); assert.equal(t.houseIn, 62.5); assert.equal(t.fundIn, 62.5);
  assert.equal(t.outUsd, 40, 'the receipt-less payout is not counted'); assert.equal(t.fundBalance, 22.5); assert.equal(t.payouts.length, 1);
});

test('pledges and votes: strict parse, one record per session, tally', () => {
  const C = ['a-court', 'b-court'];
  assert.deepEqual(parseFundAction({ kind: 'pledge', tier: 'patron' }, C), { kind: 'pledge', tier: 'patron' });
  assert.equal(parseFundAction({ kind: 'pledge', tier: 'gold' }, C).reason, 'bad-tier');
  assert.equal(parseFundAction({ kind: 'vote', court: 'nope' }, C).reason, 'bad-court');
  assert.equal(parseFundAction({ kind: 'donate' }, C).reason, 'bad-kind');
  const t = tally({ p1: { pledge: 'patron', vote: 'a-court', t: 1 }, p2: { vote: 'a-court', t: 2 }, p3: { pledge: 'club', t: 3 }, p4: { vote: 'zzz', t: 4 } }, C);
  assert.deepEqual(t, { pledges: { patron: 1, club: 1 }, votes: { 'a-court': 2, 'b-court': 0 } });
});
