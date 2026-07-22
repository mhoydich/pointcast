import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = new URL('../src/pages/network-el-segundo.astro', import.meta.url);
const jsonPage = new URL('../src/pages/network-el-segundo.json.ts', import.meta.url);

test('PointCast publishes Network El Segundo with a direct fallback and shared auth bridge', async () => {
  const source = await readFile(page, 'utf8');

  assert.match(source, /https:\/\/network-el-segundo\.mhoydich\.chatgpt\.site/);
  assert.match(source, /Checking shared Kukai session/);
  assert.match(source, /authenticate once for every project/);
  assert.match(source, /\/api\/auth\/project-ticket/);
  assert.match(source, /Open the release/);
  assert.match(source, /https:\/\/pointcast\.xyz\/network-el-segundo/);
});

test('Network El Segundo publishes a machine-readable roster and prototype boundary', async () => {
  const source = await readFile(jsonPage, 'utf8');

  assert.match(source, /targetVerifiedWallets: 100/);
  assert.match(source, /participantCounter/);
  assert.match(source, /transactionRequired: false/);
  assert.match(source, /livePayoutContract: false/);
  assert.match(source, /returnPromised: false/);
});
