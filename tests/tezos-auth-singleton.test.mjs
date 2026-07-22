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
  assert.match(tezos, /const OPERATION_SCOPES = \['operation_request'\]/);
  assert.match(tezos, /const SIGNING_SCOPES = \['sign'\]/);
  assert.match(auth, /signTezosPayload/);
  assert.match(auth, /connectKukaiForSigning/);
  assert.doesNotMatch(auth, /const address = await connectKukai\(\)/);
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

test('PointCast issues bounded one-use Tezos project tickets', async () => {
  const route = await readFile(new URL('functions/api/auth/project-ticket.ts', root), 'utf8');
  const page = await readFile(new URL('src/pages/auth/project.astro', root), 'utf8');
  assert.match(route, /network-el-segundo/);
  assert.match(route, /expirationTtl: TICKET_TTL_SECONDS/);
  assert.match(route, /USERS\.delete\(key\)/);
  assert.match(page, /pc:auth-change/);
  assert.match(page, /One wallet/);
});

test('embedded Network El Segundo receives a fresh PointCast project ticket', async () => {
  const page = await readFile(new URL('src/pages/network-el-segundo.astro', root), 'utf8');
  assert.match(page, /fetch\('\/api\/auth\/project-ticket'/);
  assert.match(page, /credentials: 'include'/);
  assert.match(page, /target: 'network-el-segundo'/);
  assert.match(page, /frame\.src = result\.destination/);
  assert.doesNotMatch(page, /connectKukai|new BeaconWallet/);
});
