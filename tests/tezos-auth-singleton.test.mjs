import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('PointCast routes mainnet wallet work through one subscribed Beacon client', async () => {
  const files = await Promise.all([
    'src/lib/tezos.ts',
    'src/lib/auth/client.ts',
    'src/components/WalletConnect.astro',
    'src/pages/coffee.astro',
    'src/pages/drum.astro',
    'src/pages/market.astro',
    'src/pages/postcards.astro',
    'src/pages/snapshots.astro',
  ].map((path) => readFile(new URL(path, root), 'utf8')));

  const [tezos, auth, walletConnect, ...mainnetSurfaces] = files;
  assert.match(tezos, /subscribeToEvent\([\s\S]*ACTIVE_ACCOUNT_SET/);
  assert.match(tezos, /export async function pointCastWallet/);
  assert.match(auth, /signTezosPayload/);
  assert.match(tezos, /signingType: 'micheline'/);
  assert.doesNotMatch(tezos, /signingType: 'raw'/);
  assert.doesNotMatch(auth, /new BeaconWallet/);
  assert.doesNotMatch(walletConnect, /new beacon\.DAppClient|walletbeacon\.min\.js/);
  for (const source of mainnetSurfaces) {
    assert.doesNotMatch(source, /new BeaconWallet|new beacon\.BeaconWallet/);
  }
});

test('Tezos login challenge is short-lived and single-use', async () => {
  const route = await readFile(new URL('functions/api/auth/tezos.ts', root), 'utf8');
  assert.match(route, /MESSAGE_TTL_MS/);
  assert.match(route, /auth-nonce:tezos:/);
  assert.match(route, /replayed-message/);
  assert.match(route, /expirationTtl/);
  assert.match(route, /michelineStringPayload\(message\)/);
});
