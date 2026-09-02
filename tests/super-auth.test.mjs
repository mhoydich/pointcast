import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildAccountDeskView } from '../src/lib/auth/account-desk.mjs';

const root = new URL('../', import.meta.url);

test('Super Auth is a visible human and machine-readable PointCast surface', async () => {
  const [page, endpoint, registry, ribbon, homepage, startHere, dashboard] = await Promise.all([
    readFile(new URL('src/pages/auth.astro', root), 'utf8'),
    readFile(new URL('src/pages/auth.json.ts', root), 'utf8'),
    readFile(new URL('src/data/super-auth.ts', root), 'utf8'),
    readFile(new URL('src/components/SuperAuthRibbon.astro', root), 'utf8'),
    readFile(new URL('src/pages/index.astro', root), 'utf8'),
    readFile(new URL('src/components/HomeStartHere.astro', root), 'utf8'),
    readFile(new URL('src/pages/dashboard.astro', root), 'utf8'),
  ]);

  assert.match(page, /Google names the broadcaster/);
  assert.match(page, /Spotify carries the song/);
  assert.match(page, /Shopify opens a read-only shop window/);
  assert.match(page, /Tezos signs the object/);
  assert.match(page, /Authorize Spotify/);
  assert.match(page, /\/api\/shopify\/auth/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /read_products only/);
  assert.match(registry, /noun: 'Identity'/);
  assert.match(registry, /noun: 'Sound'/);
  assert.match(registry, /noun: 'Shop'/);
  assert.match(registry, /noun: 'Object'/);
  assert.match(ribbon, /Identity becomes broadcast/);
  // front door rebuilt 2026-09-01: the SuperAuthRibbon module retired; the masthead carries the Super Auth door instead.
  assert.match(homepage, /href="\/auth#spotify"/);
  assert.match(homepage, /title="Spotify broadcast authorization and Super Auth controls"/);
  assert.match(startHere, /href: '\/auth', label: 'Sign in \/ your account'/);
  assert.match(dashboard, /data-dashboard-shopify/);
  assert.match(dashboard, /Super Auth switchboard/);
});

test('Super Auth signed-out hero and provider cards share the empty session state', async () => {
  const page = await readFile(new URL('src/pages/auth.astro', root), 'utf8');
  const view = buildAccountDeskView(null, {
    spotify: { configured: true, connected: true },
    shopify: { configured: true, connected: true },
  });

  assert.equal(view.signedIn, false);
  assert.equal(view.result, 'No account is required to look around.');
  assert.deepEqual(view.identityChips, []);
  assert.equal(view.providers.google.connected, false);
  assert.equal(view.providers.spotify.connected, false);
  assert.equal(view.providers.shopify.connected, false);
  assert.equal(view.providers.tezos.connected, false);
  assert.equal(view.providers.google.action, 'Sign in with Google →');
  assert.equal(view.providers.tezos.action, 'Open wallet auth →');
  assert.match(page, /Start with Google/);
  assert.match(page, /Open wallet auth/);
  assert.match(page, /window\.location\.assign\('\/api\/auth\/google\?returnTo=\/auth'\)/);
});

test('Super Auth signed-in hero and provider cards share one fake JSON session', async () => {
  const page = await readFile(new URL('src/pages/auth.astro', root), 'utf8');
  const fakeSession = {
    userId: 'pcu_mike',
    createdAt: '2026-09-02T15:35:00.000Z',
    preferredName: 'Mike',
    roles: ['broadcaster'],
    identities: [
      { provider: 'google', id: 'google-mike', name: 'Mike', verifiedAt: '2026-09-02T15:35:00.000Z' },
      { provider: 'kukai', id: 'tz1mike', name: 'tz1mike', verifiedAt: '2026-09-02T15:36:00.000Z' },
      { provider: 'metamask', id: '0xmike', name: '0xmike', verifiedAt: '2026-09-02T15:37:00.000Z' },
    ],
  };
  const view = buildAccountDeskView(fakeSession, {
    spotify: {
      configured: true,
      connected: true,
      nowPlaying: { title: 'Ripple', artist: 'Grateful Dead', live: true },
    },
    shopify: {
      configured: true,
      connected: true,
      connection: { label: 'Good Feels' },
    },
  });

  assert.equal(view.signedIn, true);
  assert.equal(view.preferredName, 'Mike');
  assert.equal(view.signedInWith, 'Google');
  assert.deepEqual(view.identityChips, ['Google', 'Kukai', 'MetaMask']);
  assert.equal(view.result, 'Google verified. The broadcaster lane is open.');
  assert.equal(view.providers.google.connected, true);
  assert.equal(view.providers.spotify.connected, true);
  assert.equal(view.providers.shopify.connected, true);
  assert.equal(view.providers.tezos.connected, true);
  assert.match(view.providers.spotify.status, /Live · Ripple · Grateful Dead/);
  assert.match(view.providers.shopify.status, /Good Feels · read-only catalog authorized/);
  assert.equal(view.providers.tezos.status, 'Linked · Kukai');
  assert.match(page, /Link a wallet \(Kukai\)/);
  assert.match(page, /Link MetaMask/);
  assert.match(page, /data-super-hero-spotify>Authorize Spotify/);
  assert.match(page, /data-super-action="logout">Sign out/);
  assert.match(page, /window\.addEventListener\('pc:auth-change'/);
  assert.match(page, /getSession\(\)/);
  assert.match(page, /document\.addEventListener\('click'/);
  assert.match(page, /capture: true/);
  assert.doesNotMatch(page, /URLSearchParams/);
  assert.doesNotMatch(page, /\sid=/);
});

test('Shopify OAuth is broadcaster-only, signed, fixed-scope, encrypted, and revocable', async () => {
  const [shared, auth, callback, connection, env] = await Promise.all([
    readFile(new URL('functions/api/shopify/_shopify.ts', root), 'utf8'),
    readFile(new URL('functions/api/shopify/auth.ts', root), 'utf8'),
    readFile(new URL('functions/api/shopify/callback.ts', root), 'utf8'),
    readFile(new URL('functions/api/shopify/connection.ts', root), 'utf8'),
    readFile(new URL('functions/cloudflare-env.d.ts', root), 'utf8'),
  ]);

  assert.match(shared, /DEFAULT_SCOPES = \['read_products'\]/);
  assert.match(shared, /return \[\.\.\.DEFAULT_SCOPES\]/);
  assert.doesNotMatch(shared, /SHOPIFY_SCOPES/);
  assert.match(shared, /AES-GCM/);
  assert.match(shared, /shopify:catalog:credentials:v1/);
  assert.match(shared, /\.myshopify\\\.com/);
  assert.match(auth, /roles\?\.includes\('broadcaster'\)/);
  assert.match(auth, /signShopifyState/);
  assert.match(auth, /HttpOnly; Secure; SameSite=Lax/);
  assert.match(callback, /verifyShopifyCallbackHmac/);
  assert.match(callback, /verifyShopifyState/);
  assert.match(callback, /expiring: '1'/);
  assert.match(callback, /storeShopifyCredentials/);
  assert.match(connection, /readShopifyCredentials/);
  assert.match(connection, /clearShopifyConnection/);
  assert.match(connection, /roles\?\.includes\('broadcaster'\)/);
  assert.match(env, /POINTCAST_INTEGRATION_ENCRYPTION_KEY/);

  const requestedSurface = `${shared}\n${auth}\n${callback}`;
  assert.doesNotMatch(requestedSurface, /read_orders|read_customers|write_[a-z_]+/);
});

test('Shopify public status never returns tokens or a non-broadcaster shop domain', async () => {
  const connection = await readFile(
    new URL('functions/api/shopify/connection.ts', root),
    'utf8',
  );

  assert.match(connection, /canManage \? credentials\.shop : 'Connected storefront'/);
  assert.match(connection, /\.\.\.\(canManage \? \{ shop: credentials\.shop, scopes: credentials\.scopes \} : \{\}\)/);
  assert.doesNotMatch(connection, /accessToken:|refreshToken:/);
});
