import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('Google OAuth verifies state, nonce, and the provider ID token before issuing a session', async () => {
  const [start, callback, session, client, menu] = await Promise.all([
    readFile(new URL('functions/api/auth/google.ts', root), 'utf8'),
    readFile(new URL('functions/api/auth/google/callback.ts', root), 'utf8'),
    readFile(new URL('functions/api/auth/session.ts', root), 'utf8'),
    readFile(new URL('src/lib/auth/client.ts', root), 'utf8'),
    readFile(new URL('src/components/AuthMenu.astro', root), 'utf8'),
  ]);

  assert.match(start, /crypto|getRandomValues|randomUrlSafeString/);
  assert.match(start, /writeAuthState\(env,[\s\S]*OAUTH_STATE_TTL_SECONDS\)/);
  assert.match(start, /authUrl\.searchParams\.set\('nonce', nonce\)/);
  assert.match(callback, /createRemoteJWKSet/);
  assert.match(callback, /jwtVerify/);
  assert.match(callback, /audience: env\.GOOGLE_CLIENT_ID/);
  assert.match(callback, /secureEqual\(nonce, stateRecord\.nonce\)/);
  assert.match(callback, /consumeAuthState<OAuthStateRecord>/);
  assert.match(callback, /POINTCAST_BROADCAST_EMAIL/);
  assert.match(callback, /withSessionCookie/);
  assert.match(session, /roles: Array\.from\(new Set/);
  assert.match(client, /returnTo/);
  assert.match(menu, /Google[\s\S]*Verified PointCast account[\s\S]*live/);
  assert.doesNotMatch(callback, /console\.log|access_token|refresh_token/);
});

test('broadcaster connections stay private to the dashboard and expose only a sanitized live signal', async () => {
  const [auth, callback, broadcast, endpoint, homepage, footer, dashboard, shopifyAuth, shopifyCallback] = await Promise.all([
    readFile(new URL('functions/api/spotify/auth.ts', root), 'utf8'),
    readFile(new URL('functions/api/spotify/callback.ts', root), 'utf8'),
    readFile(new URL('functions/api/spotify/_broadcast.ts', root), 'utf8'),
    readFile(new URL('functions/now-playing.json.ts', root), 'utf8'),
    readFile(new URL('src/pages/index.astro', root), 'utf8'),
    readFile(new URL('src/components/FooterBar.astro', root), 'utf8'),
    readFile(new URL('src/pages/dashboard.astro', root), 'utf8'),
    readFile(new URL('functions/api/shopify/auth.ts', root), 'utf8'),
    readFile(new URL('functions/api/shopify/callback.ts', root), 'utf8'),
  ]);

  assert.match(auth, /user-read-currently-playing/);
  assert.match(auth, /roles\?\.includes\('broadcaster'\)/);
  assert.match(callback, /storeSpotifyCredentials/);
  assert.match(broadcast, /AES-GCM/);
  assert.match(broadcast, /SPOTIFY_TOKEN_ENCRYPTION_KEY/);
  assert.match(broadcast, /spotify:broadcast:credentials:v1/);
  assert.match(broadcast, /spotify:broadcast:signal:v1/);
  assert.match(broadcast, /Live Spotify signal authorized by the PointCast broadcaster/);
  assert.doesNotMatch(endpoint, /progress|device|context/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(homepage, /fetch\('\/now-playing\.json'/);
  assert.match(footer, /await fetch\('\/now-playing\.json'/);
  assert.match(dashboard, /\/api\/spotify\/broadcast/);
  assert.match(dashboard, /data-dashboard-spotify-disconnect/);
  assert.match(dashboard, /data-dashboard-broadcaster-panel hidden/);
  assert.match(dashboard, /This desk belongs to the broadcaster/);
  assert.match(dashboard, /roles\?\.includes\('broadcaster'\)/);
  assert.match(dashboard, /data-dashboard-shopify-form/);
  assert.match(dashboard, /destination\.searchParams\.set\('returnTo', '\/dashboard#broadcast'\)/);
  assert.match(dashboard, /method: 'DELETE'/);
  assert.match(dashboard, /immediately removes the stored Spotify credentials and cached now-playing item/);
  assert.match(auth, /safeReturnTo\(url\.searchParams\.get\('returnTo'\), '\/dashboard#broadcast'\)/);
  assert.match(callback, /returnTo = '\/dashboard#broadcast'/);
  assert.match(shopifyAuth, /safeReturnTo\(url\.searchParams\.get\('returnTo'\), '\/dashboard#broadcast'\)/);
  assert.match(shopifyCallback, /safeReturnTo\(returnTo, '\/dashboard#broadcast'\)/);
});

test('privacy policy states the narrow Google, Spotify, and Shopify data boundaries', async () => {
  const [privacy, footer] = await Promise.all([
    readFile(new URL('src/pages/privacy.astro', root), 'utf8'),
    readFile(new URL('src/components/Footer.astro', root), 'utf8'),
  ]);

  assert.match(privacy, /does not request access to Gmail, Google Drive, contacts, calendars/);
  assert.match(privacy, /user-read-currently-playing/);
  assert.match(privacy, /read_products/);
  assert.match(privacy, /does not request customer, order, checkout, payment, or write access/);
  assert.match(privacy, /expires within 24 hours/);
  assert.match(privacy, /Disconnecting immediately deletes that provider’s stored credentials/);
  assert.match(footer, /href="\/privacy"/);
});
