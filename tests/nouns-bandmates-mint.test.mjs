import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  NOUNS_BANDMATES_RELEASE,
  canonicalCodeSha256,
  getNounsBandmatesMintReadiness,
  getNounsBandmateWalletBalance,
} from '../src/lib/nouns-bandmates-mint.ts';

const scriptCode = [{ prim: 'parameter' }];
const liveRelease = {
  ...NOUNS_BANDMATES_RELEASE,
  status: 'live',
  contract: 'KT1' + 'A'.repeat(33),
  administrator: `tz1${'B'.repeat(33)}`,
  expectedCodeSha256: await canonicalCodeSha256(scriptCode),
};

function reply(payload, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => payload });
}

function verifiedFetch(url) {
  if (url.endsWith('/chain_id')) return reply('NetXdQprcVkpaWU');
  if (url.endsWith('/script')) return reply({ code: scriptCode });
  if (url.endsWith('/entrypoints')) return reply({ entrypoints: Object.fromEntries(liveRelease.expectedEntrypoints.map((name) => [name, { prim: 'unit' }])) });
  if (url.endsWith('/storage')) return reply({ paused: false, administrator: liveRelease.administrator, next_token_id: '12' });
  throw new Error(`unexpected ${url}`);
}

test('release remains a truthful disabled prepared registry', () => {
  assert.equal(NOUNS_BANDMATES_RELEASE.status, 'prepared');
  assert.equal(NOUNS_BANDMATES_RELEASE.contract, null);
  assert.equal(NOUNS_BANDMATES_RELEASE.network, 'mainnet');
  assert.equal(NOUNS_BANDMATES_RELEASE.priceMutez, 0);
  assert.equal(NOUNS_BANDMATES_RELEASE.edition, 'open');
  assert.equal(NOUNS_BANDMATES_RELEASE.quantityPerMint, 1);
  assert.equal(NOUNS_BANDMATES_RELEASE.tokens.length, 12);
  assert.deepEqual(NOUNS_BANDMATES_RELEASE.tokens.map((token) => token.tokenId), [...Array(12).keys()]);
});

test('prepared registry performs no network reads and cannot mint', async () => {
  let calls = 0;
  const state = await getNounsBandmatesMintReadiness({ fetcher: async () => { calls += 1; return reply({}); } });
  assert.equal(calls, 0);
  assert.equal(state.status, 'prepared');
  assert.equal(state.mintEnabled, false);
  assert.equal(state.verified, false);
});

test('enables only after mainnet code, entrypoint, and terms verify', async () => {
  const state = await getNounsBandmatesMintReadiness({ fetcher: verifiedFetch, release: liveRelease });
  assert.equal(state.status, 'ready');
  assert.equal(state.mintEnabled, true);
  assert.equal(state.verified, true);
});

test('fails closed on wrong chain, missing code, paused storage, or wrong token count', async () => {
  for (const [suffix, replacement, reason] of [
    ['/chain_id', 'NetWrong', 'wrong-network'],
    ['/script', { code: [] }, 'contract-code-missing'],
    ['/storage', { paused: true, administrator: liveRelease.administrator, next_token_id: 12 }, 'contract-paused'],
    ['/storage', { paused: false, administrator: liveRelease.administrator, next_token_id: 11 }, 'contract-token-count-mismatch'],
  ]) {
    const state = await getNounsBandmatesMintReadiness({
      release: liveRelease,
      fetcher: (url) => url.endsWith(suffix) ? reply(replacement) : verifiedFetch(url),
    });
    assert.equal(state.mintEnabled, false);
    assert.equal(state.reason, reason);
  }
});

test('wallet balance is token- and account-specific', async () => {
  let requested = '';
  const balance = await getNounsBandmateWalletBalance(4, `tz1${'A'.repeat(33)}`, {
    release: liveRelease,
    fetcher: (url) => { requested = url; return reply([{ balance: '2' }]); },
  });
  assert.equal(balance, 2);
  assert.match(requested, /token\.tokenId=4/);
  assert.match(requested, /balance\.gt=0/);
  await assert.rejects(() => getNounsBandmateWalletBalance(12, `tz1${'A'.repeat(33)}`, { release: liveRelease }), /Invalid/);
});

test('component distinguishes submission, confirmation, indexer pending, and collection', async () => {
  const source = await readFile(new URL('../src/components/NounsBandmateCollect.astro', import.meta.url), 'utf8');
  assert.match(source, /Submitted · waiting for confirmation/);
  assert.match(source, /Confirmed on-chain · indexer balance is still pending/);
  assert.match(source, /balance > before/);
  assert.match(source, /sharedReadiness/);
  assert.match(source, /verify\(root, true\)/);
  assert.match(source, /Preview only · no collectible contract is live/);
});
