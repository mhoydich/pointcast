import {
  appendResult,
  safeReturnTo,
  secureEqual,
} from '../auth/_oauth';
import { authJson, readSessionFromRequest } from '../auth/session';
import {
  normalizeShopDomain,
  readCookie,
  shopifyConfigured,
  shopifyScopes,
  storeShopifyCredentials,
  verifyShopifyCallbackHmac,
  verifyShopifyState,
  type ShopifyEnv,
} from './_shopify';

interface ShopifyStateRecord {
  shop: string;
  returnTo: string;
  userId: string;
  createdAt: string;
}

interface ShopifyTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
  error?: string;
}

const STATE_PREFIX = 'oauth-state:shopify:';
const STATE_COOKIE = 'pc_shopify_oauth';

function redirectWithResult(
  request: Request,
  returnTo: string,
  key: string,
  value: string,
): Response {
  const target = appendResult(safeReturnTo(returnTo, '/me'), key, value);
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(target, request.url).toString(),
      'Cache-Control': 'private, no-store',
      'Set-Cookie': `${STATE_COOKIE}=; Path=/api/shopify; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
}

export const onRequestGet: PagesFunction<ShopifyEnv> = async ({ request, env }) => {
  if (!env.USERS) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }
  if (!shopifyConfigured(env) || !env.SHOPIFY_CLIENT_SECRET || !env.SHOPIFY_CLIENT_ID) {
    return authJson({ ok: false, reason: 'shopify-not-configured' }, { status: 503 });
  }

  const url = new URL(request.url);
  const state = url.searchParams.get('state') ?? '';
  const stateKey = `${STATE_PREFIX}${state}`;
  const stateRecord = state
    ? await env.USERS.get<ShopifyStateRecord>(stateKey, 'json')
    : null;
  if (!stateRecord) {
    return redirectWithResult(request, '/me', 'auth_error', 'shopify-state-expired');
  }
  await env.USERS.delete(stateKey);

  if (url.searchParams.get('error')) {
    return redirectWithResult(request, stateRecord.returnTo, 'auth_error', 'shopify-denied');
  }

  const code = url.searchParams.get('code') ?? '';
  const shop = normalizeShopDomain(url.searchParams.get('shop'));
  const signedState = readCookie(request, STATE_COOKIE);
  const current = await readSessionFromRequest(request, env);
  const stateValid = await verifyShopifyState(signedState, state, env.SHOPIFY_CLIENT_SECRET);
  const hmacValid = await verifyShopifyCallbackHmac(url, env.SHOPIFY_CLIENT_SECRET);
  const shopValid = Boolean(
    shop
    && await secureEqual(shop, stateRecord.shop),
  );
  const userValid = Boolean(
    current?.user.roles?.includes('broadcaster')
    && await secureEqual(current.user.userId, stateRecord.userId),
  );
  if (!code || !stateValid || !hmacValid || !shopValid || !userValid || !shop) {
    return redirectWithResult(request, stateRecord.returnTo, 'auth_error', 'shopify-callback-invalid');
  }

  let response: Response;
  try {
    response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.SHOPIFY_CLIENT_ID,
        client_secret: env.SHOPIFY_CLIENT_SECRET,
        code,
        expiring: '1',
      }),
    });
  } catch {
    return redirectWithResult(request, stateRecord.returnTo, 'auth_error', 'shopify-token-unreachable');
  }

  const token: ShopifyTokenResponse = await response
    .json<ShopifyTokenResponse>()
    .catch((): ShopifyTokenResponse => ({}));
  if (!response.ok || !token.access_token || !token.refresh_token) {
    return redirectWithResult(request, stateRecord.returnTo, 'auth_error', 'shopify-token-failed');
  }

  const grantedScopes = (token.scope ?? '')
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean);
  const requiredScopes = shopifyScopes();
  if (!requiredScopes.every((scope) => grantedScopes.includes(scope))) {
    return redirectWithResult(request, stateRecord.returnTo, 'auth_error', 'shopify-scope-missing');
  }

  const now = Date.now();
  await storeShopifyCredentials(env, {
    shop,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    accessTokenExpiresAt: now + (token.expires_in ?? 3600) * 1000,
    refreshTokenExpiresAt: now + (token.refresh_token_expires_in ?? 7_776_000) * 1000,
    scopes: grantedScopes,
    connectedAt: new Date().toISOString(),
    connectedByUserId: stateRecord.userId,
  });

  return redirectWithResult(request, stateRecord.returnTo, 'shopify', 'connected');
};
