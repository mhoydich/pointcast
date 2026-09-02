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
  assert.match(tezos, /const POINTCAST_SCOPES = \['operation_request', 'sign'\]/);
  assert.match(tezos, /if \(existing\) await wallet\.clearActiveAccount\(\)/);
  assert.match(tezos, /ensurePointCastTezosLogin/);
  assert.match(tezos, /fetch\('\/api\/auth\/session', \{ method: 'DELETE'/);
  assert.match(auth, /signTezosPayload/);
  assert.match(auth, /connectKukaiForSigning/);
  assert.match(auth, /tezosLoginInFlight/);
  assert.match(auth, /if \(!options\.force\)/);
  assert.match(auth, /getSession\(\)\.catch/);
  assert.match(auth, /expectedAddress/);
  assert.doesNotMatch(auth, /const address = await connectKukai\(\)/);
  assert.match(tezos, /signingType: 'micheline'/);
  assert.doesNotMatch(tezos, /signingType: 'raw'/);
  assert.doesNotMatch(auth, /new BeaconWallet/);
  assert.doesNotMatch(walletConnect, /new beacon\.DAppClient|walletbeacon\.min\.js/);
  assert.match(walletConnect, /loginWithKukai\(\{ force: true \}\)/);
  for (const source of mainnetSurfaces) {
    assert.doesNotMatch(source, /new BeaconWallet|new beacon\.BeaconWallet/);
  }
});

test('all public layout families restore the signed Tezos session', async () => {
  const files = await Promise.all([
    'src/lib/auth/session-bridge-script.ts',
    'src/components/TezosSessionBridge.astro',
    'functions/_middleware.ts',
    'src/layouts/BaseLayout.astro',
    'src/layouts/BlockLayout.astro',
    'src/layouts/DrumLayout.astro',
    'src/layouts/SparrowLayout.astro',
    'src/pages/network-el-segundo.astro',
    'src/pages/auth/project.astro',
  ].map((path) => readFile(new URL(path, root), 'utf8')));
  const [bridgeScript, bridgeComponent, middleware, ...surfaces] = files;
  assert.match(bridgeScript, /fetch\('\/api\/auth\/session'/);
  assert.match(bridgeScript, /__pointCastTezosBridgeInstalled/);
  assert.match(bridgeScript, /pc:tezos-session/);
  assert.match(bridgeScript, /pc:auth-refresh/);
  assert.doesNotMatch(bridgeScript, /requestSignPayload|requestPermissions/);
  assert.match(bridgeComponent, /POINTCAST_TEZOS_SESSION_BRIDGE_SCRIPT/);
  assert.match(middleware, /data-pointcast-tezos-session-bridge/);
  assert.match(middleware, /POINTCAST_TEZOS_SESSION_BRIDGE_SCRIPT/);
  assert.match(middleware, /TEZOS_BRIDGE_HEADER/);
  assert.match(middleware, /response\.headers\.get\(TEZOS_BRIDGE_HEADER\) === '1'/);
  for (const surface of surfaces) assert.match(surface, /TezosSessionBridge/);
});

test('active PointCast sessions rotate inside a bounded renewal window', async () => {
  const route = await readFile(new URL('functions/api/auth/session.ts', root), 'utf8');
  assert.match(route, /SESSION_REFRESH_WINDOW_SECONDS/);
  assert.match(route, /issueSession\(env, current\.user\.userId\)/);
  assert.match(route, /deleteSession\(env, current\.session\.sessionToken\)/);
  assert.match(route, /renewed: true/);
});

test('Tezos login challenge is short-lived and single-use', async () => {
  const route = await readFile(new URL('functions/api/auth/tezos.ts', root), 'utf8');
  assert.match(route, /MESSAGE_TTL_MS/);
  assert.match(route, /auth-nonce:tezos:/);
  assert.match(route, /replayed-message/);
  assert.match(route, /writeAuthState\(env, nonceKey, address/);
  assert.match(route, /michelineStringPayload\(message\)/);
});

test('PointCast issues bounded one-use Tezos project tickets', async () => {
  const route = await readFile(new URL('functions/api/auth/project-ticket.ts', root), 'utf8');
  const page = await readFile(new URL('src/pages/auth/project.astro', root), 'utf8');
  const authMenu = await readFile(new URL('src/components/AuthMenu.astro', root), 'utf8');
  const popupFallback = await readFile(
    new URL('src/lib/auth/wallet-popup-fallback.ts', root),
    'utf8',
  );
  assert.match(route, /network-el-segundo/);
  assert.match(route, /paths: \['\/', '\/v2'\]/);
  assert.match(route, /url\.origin !== project\.origin/);
  assert.match(route, /project\.paths\.includes\(url\.pathname\)/);
  assert.match(route, /writeAuthState\(env,[\s\S]*TICKET_TTL_SECONDS\)/);
  assert.match(route, /consumeAuthState<Ticket>\(env, key\)/);
  assert.match(route, /tezos-identity-not-linked/);
  assert.match(route, /tezosIdentities\.at\(-1\)/);
  assert.match(page, /pc:auth-change/);
  assert.match(page, /pc:wallet-active/);
  assert.match(page, /JSON\.stringify\(\{ target, returnTo, address \}\)/);
  assert.match(page, /One wallet/);
  assert.match(page, /Choose Kukai, then <strong>Use Browser<\/strong>/);
  assert.match(page, /pc:wallet-popup-fallback/);
  assert.match(page, /<AuthMenu autoOpen=\{true\}/);
  assert.match(page, /pc:open-auth-menu/);
  assert.match(page, /Your PointCast Kukai session follows you into the project/);
  assert.match(page, /Zero tez; no transaction/);
  assert.match(page, /recordProjectArrival/);
  assert.match(page, /\/api\/network-el-segundo\/funnel/);
  assert.match(page, /event: 'join', source: campaignSource/);
  assert.match(page, /pc:project-join:\$\{target\}:\$\{campaignSource\}/);
  assert.match(page, /navigator\.doNotTrack/);
  assert.match(page, /funnelSources\.has\(requestedSource\) \? requestedSource : 'other'/);
  assert.doesNotMatch(page, /wallet.*event: 'join'|event: 'join'.*wallet/i);
  assert.doesNotMatch(page, /data-provider="kukai"[\s\S]*\.click\(/);
  assert.match(authMenu, /data-auth-auto-open/);
  assert.match(authMenu, /then choose Use Browser/);
  assert.match(authMenu, /root\.dataset\.authAutoOpen === 'true'/);
  assert.match(authMenu, /if \(!user[\s\S]*openMenu\(root\)/);
  assert.match(popupFallback, /target !== '_blank'/);
  assert.match(popupFallback, /window\.location\.assign\(next\)/);
  assert.match(popupFallback, /Object\.defineProperty\(fallbackLocation, 'href'/);
});

test('embedded Network El Segundo receives a fresh PointCast project ticket', async () => {
  const page = await readFile(new URL('src/pages/network-el-segundo.astro', root), 'utf8');
  assert.match(page, /fetch\('\/api\/auth\/project-ticket'/);
  assert.match(page, /credentials: 'include'/);
  assert.match(page, /target: 'network-el-segundo'/);
  assert.match(page, /pc:wallet-active/);
  assert.match(page, /frame\.src = result\.destination/);
  assert.doesNotMatch(page, /connectKukai|new BeaconWallet/);
});

test('wallet and auth menus rebind after Astro route transitions', async () => {
  const [walletChip, authMenu] = await Promise.all([
    readFile(new URL('src/components/WalletChip.astro', root), 'utf8'),
    readFile(new URL('src/components/AuthMenu.astro', root), 'utf8'),
  ]);
  assert.match(walletChip, /initWalletChip/);
  assert.match(walletChip, /astro:page-load/);
  assert.match(walletChip, /__pointCastWalletChipAbort/);
  assert.match(walletChip, /loginWithKukai\(\{ force: true \}\)/);
  assert.match(authMenu, /initializeAuthMenus/);
  assert.match(authMenu, /astro:page-load/);
  assert.match(authMenu, /__pointCastAuthMenuAbort/);
  assert.match(authMenu, /renderSession\(root as HTMLElement, detail\?\.user \?\? null, false\)/);
});
