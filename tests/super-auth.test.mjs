import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildAccountDeskView } from '../src/lib/auth/account-desk.mjs';

const root = new URL('../', import.meta.url);

test('Account is a focused human and machine-readable PointCast surface', async () => {
  const [page, endpoint, registry] = await Promise.all([
    readFile(new URL('src/pages/auth.astro', root), 'utf8'),
    readFile(new URL('src/pages/auth.json.ts', root), 'utf8'),
    readFile(new URL('src/data/super-auth.ts', root), 'utf8'),
  ]);

  assert.match(page, /title="Account"/);
  assert.match(page, /Sign in to <em>PointCast/);
  assert.match(page, /Sign in or link a wallet/);
  assert.match(page, /Google/);
  assert.match(page, /Kukai/);
  assert.match(page, /MetaMask/);
  assert.match(page, /Apple/);
  assert.match(page, /Phantom/);
  assert.doesNotMatch(page, /signal|Spotify|Shopify|broadcaster/i);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /Sign in, review linked identities, link a wallet, or sign out/);
  assert.match(registry, /provider: 'Google'/);
  assert.match(registry, /provider: 'Kukai'/);
  assert.match(registry, /provider: 'MetaMask'/);
  assert.match(registry, /provider: 'Apple'/);
  assert.match(registry, /provider: 'Phantom'/);
});

test('Account signed-out hero and provider cards share the empty session state', async () => {
  const page = await readFile(new URL('src/pages/auth.astro', root), 'utf8');
  const view = buildAccountDeskView(null);

  assert.equal(view.signedIn, false);
  assert.equal(view.result, 'No account is required to look around.');
  assert.deepEqual(view.identityChips, []);
  assert.equal(view.providers.google.connected, false);
  assert.equal(view.providers.apple.connected, false);
  assert.equal(view.providers.kukai.connected, false);
  assert.equal(view.providers.metamask.connected, false);
  assert.equal(view.providers.phantom.connected, false);
  assert.equal(view.providers.google.action, 'Sign in with Google →');
  assert.equal(view.providers.kukai.action, 'Sign in with Kukai →');
  assert.match(page, /Sign in with Google/);
  assert.match(page, /Sign in with Kukai/);
  assert.match(page, /window\.location\.assign\('\/api\/auth\/google\?returnTo=\/auth'\)/);
});

test('Account signed-in hero and provider cards share one fake JSON session', async () => {
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
  const view = buildAccountDeskView(fakeSession);

  assert.equal(view.signedIn, true);
  assert.equal(view.preferredName, 'Mike');
  assert.equal(view.signedInWith, 'Google');
  assert.deepEqual(view.identityChips, ['Google', 'Kukai', 'MetaMask']);
  assert.equal(view.result, 'Your PointCast account is active.');
  assert.equal(view.providers.google.connected, true);
  assert.equal(view.providers.kukai.connected, true);
  assert.equal(view.providers.metamask.connected, true);
  assert.equal(view.providers.apple.connected, false);
  assert.equal(view.providers.phantom.connected, false);
  assert.equal(view.providers.kukai.status, 'Tezos linked with Kukai.');
  assert.match(page, /Link a wallet \(Kukai\)/);
  assert.match(page, /Link MetaMask/);
  assert.match(page, /Link Phantom/);
  assert.match(page, /data-account-action="logout">Sign out/);
  assert.match(page, /window\.addEventListener\('pc:auth-change'/);
  assert.match(page, /getSession\(\)/);
  assert.match(page, /document\.addEventListener\('click'/);
  assert.match(page, /capture: true/);
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
