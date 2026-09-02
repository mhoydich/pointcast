import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('Super Auth is a visible human and machine-readable PointCast surface', async () => {
  const [page, endpoint, registry, ribbon, homepage, dashboard] = await Promise.all([
    readFile(new URL('src/pages/auth.astro', root), 'utf8'),
    readFile(new URL('src/pages/auth.json.ts', root), 'utf8'),
    readFile(new URL('src/data/super-auth.ts', root), 'utf8'),
    readFile(new URL('src/components/SuperAuthRibbon.astro', root), 'utf8'),
    readFile(new URL('src/pages/index.astro', root), 'utf8'),
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
  assert.match(dashboard, /data-dashboard-shopify/);
  assert.match(dashboard, /Super Auth switchboard/);
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
