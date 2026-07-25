import { authJson, readSessionFromRequest } from '../auth/session';
import {
  clearShopifyConnection,
  readShopifyCredentials,
  shopifyConfigured,
  type ShopifyEnv,
} from './_shopify';

export const onRequestGet: PagesFunction<ShopifyEnv> = async ({ request, env }) => {
  const current = await readSessionFromRequest(request, env);
  const canManage = Boolean(current?.user.roles?.includes('broadcaster'));
  const credentials = await readShopifyCredentials(env);
  const now = Date.now();
  return authJson({
    ok: true,
    provider: 'Shopify',
    configured: shopifyConfigured(env),
    connected: Boolean(credentials),
    canManage,
    connection: credentials
      ? {
        label: canManage ? credentials.shop : 'Connected storefront',
        ...(canManage ? { shop: credentials.shop, scopes: credentials.scopes } : {}),
        connectedAt: credentials.connectedAt,
        access: credentials.refreshTokenExpiresAt > now
          ? 'authorized'
          : 'reauthorization-required',
      }
      : null,
    boundary: 'Read-only product catalog signal. No orders, customers, checkout, or payment access.',
  });
};

export const onRequestDelete: PagesFunction<ShopifyEnv> = async ({ request, env }) => {
  const current = await readSessionFromRequest(request, env);
  if (!current?.user.roles?.includes('broadcaster')) {
    return authJson({ ok: false, reason: 'broadcaster-only' }, { status: 403 });
  }
  await clearShopifyConnection(env);
  return authJson({ ok: true, connected: false });
};
