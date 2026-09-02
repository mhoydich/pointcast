import {
  OAUTH_STATE_TTL_SECONDS,
  randomUrlSafeString,
  safeReturnTo,
} from '../auth/_oauth';
import { authJson, readSessionFromRequest } from '../auth/session';
import {
  normalizeShopDomain,
  shopifyConfigured,
  shopifyScopes,
  signShopifyState,
  type ShopifyEnv,
} from './_shopify';

interface ShopifyStateRecord {
  shop: string;
  returnTo: string;
  userId: string;
  createdAt: string;
}

const STATE_PREFIX = 'oauth-state:shopify:';
const STATE_COOKIE = 'pc_shopify_oauth';

export const onRequestGet: PagesFunction<ShopifyEnv> = async ({ request, env }) => {
  if (!env.USERS) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }
  if (!shopifyConfigured(env) || !env.SHOPIFY_CLIENT_SECRET || !env.SHOPIFY_CLIENT_ID) {
    return authJson({
      ok: false,
      provider: 'shopify',
      reason: 'not-configured',
      missingEnv: [
        'SHOPIFY_CLIENT_ID',
        'SHOPIFY_CLIENT_SECRET',
        'POINTCAST_INTEGRATION_ENCRYPTION_KEY',
      ],
    }, { status: 503 });
  }

  const current = await readSessionFromRequest(request, env);
  if (!current?.user.roles?.includes('broadcaster')) {
    return authJson({ ok: false, reason: 'broadcaster-only' }, { status: 403 });
  }

  const url = new URL(request.url);
  const shop = normalizeShopDomain(url.searchParams.get('shop'));
  if (!shop) {
    return authJson({
      ok: false,
      reason: 'invalid-shop',
      hint: 'Use a store name or a valid store.myshopify.com domain.',
    }, { status: 400 });
  }

  const state = randomUrlSafeString();
  const returnTo = safeReturnTo(url.searchParams.get('returnTo'), '/me');
  const stateRecord: ShopifyStateRecord = {
    shop,
    returnTo,
    userId: current.user.userId,
    createdAt: new Date().toISOString(),
  };
  await env.USERS.put(`${STATE_PREFIX}${state}`, JSON.stringify(stateRecord), {
    expirationTtl: OAUTH_STATE_TTL_SECONDS,
  });

  const redirectUri = `${url.origin}/api/shopify/callback`;
  const authorize = new URL(`https://${shop}/admin/oauth/authorize`);
  authorize.searchParams.set('client_id', env.SHOPIFY_CLIENT_ID);
  authorize.searchParams.set('scope', shopifyScopes().join(','));
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('state', state);

  const signedState = await signShopifyState(state, env.SHOPIFY_CLIENT_SECRET);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Cache-Control': 'private, no-store',
      'Set-Cookie': `${STATE_COOKIE}=${encodeURIComponent(signedState)}; Path=/api/shopify; HttpOnly; Secure; SameSite=Lax; Max-Age=${OAUTH_STATE_TTL_SECONDS}`,
    },
  });
};
