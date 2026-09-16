/// <reference path="../../worker-configuration.d.ts" />
import { SHOPPING_ITEMS, SHOPPING_STUDY } from '../../src/lib/shopping';

type ShoppingEnv = Partial<Pick<Cloudflare.Env, 'PC_ANALYTICS_KV'>>;
const PREFIX = 'shopping:v1:';
const RETENTION_SECONDS = 90 * 86400;
const LIMIT = 10000;
const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

async function readSmallBody(request: Request): Promise<unknown> {
  if (!request.body) throw new Error('body');
  const reader = request.body.getReader();
  let body = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) { await reader.cancel(); throw new Error('size'); }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } finally { reader.releaseLock(); }
}

export const onRequestPost: PagesFunction<ShoppingEnv> = async ({ request, env }) => {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json({ error: 'origin' }, 403);
  if (request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return new Response(null, { status: 204 });
  if (!env.PC_ANALYTICS_KV) return json({ error: 'tracking-unavailable' }, 503);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'content-type' }, 415);
  let body: unknown;
  try { body = await readSmallBody(request); } catch { return json({ error: 'invalid-body' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'invalid-event' }, 400);
  const { study, product, eventId } = body as Record<string, unknown>;
  if (study !== SHOPPING_STUDY || typeof product !== 'string' || !SHOPPING_ITEMS.some(item => item.id === product)
    || typeof eventId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    return json({ error: 'invalid-event' }, 400);
  }
  // Immutable per-event keys avoid lost increments. A retry uses the same key.
  // No IP, cookie, profile, wallet, referrer or user agent is retained.
  const day = new Date().toISOString().slice(0, 10);
  try {
    await env.PC_ANALYTICS_KV.put(`${PREFIX}${day}:${product}:${eventId}`, '', { expirationTtl: RETENTION_SECONDS });
    return json({ recorded: 'outbound-click', purchaseConfirmed: false }, 201);
  } catch { return json({ error: 'tracking-unavailable' }, 503); }
};

export const onRequestGet: PagesFunction<ShoppingEnv> = async ({ env }) => {
  const base = {
    study: SHOPPING_STUDY, retentionDays: 90,
    confirmedSales: null, attributedRevenue: null, commission: null,
    salesStatus: 'Not connected: merchant or affiliate conversion reporting is required.',
    measurement: 'Anonymous outbound click events, not unique shoppers or purchases. Browser privacy signals and blockers reduce coverage; automated or forged events can inflate it. KV reports are eventually consistent.',
  };
  if (!env.PC_ANALYTICS_KV) return json({ ...base, trackingStatus: 'unavailable', outboundClicks: null }, 503);
  const products = Object.fromEntries(SHOPPING_ITEMS.map(item => [item.id, 0]));
  let cursor: string | undefined;
  let count = 0;
  let complete = false;
  try {
    do {
      const page = await env.PC_ANALYTICS_KV.list({ prefix: PREFIX, limit: Math.min(1000, LIMIT - count), ...(cursor ? { cursor } : {}) });
      for (const key of page.keys) {
        const product = key.name.split(':')[3];
        if (Object.hasOwn(products, product)) products[product]++;
        count++;
      }
      complete = page.list_complete;
      cursor = 'cursor' in page ? page.cursor : undefined;
    } while (!complete && count < LIMIT);
    return json({ ...base, trackingStatus: 'available', outboundClicks: Object.values(products).reduce((sum, n) => sum + n, 0), products,
      truncated: !complete, reportLimit: LIMIT, generatedAt: new Date().toISOString() });
  } catch { return json({ ...base, trackingStatus: 'unavailable', outboundClicks: null }, 503); }
};
