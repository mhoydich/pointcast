import { catalog, rulesVersion, parseMatchInput, simulateMatch } from '../../public/games/nouns-nation-battler/agent-engine.mjs';
import { canonicalJson, X402_NETWORK } from '../../src/lib/x402.ts';
import { PAID_ACTION_HEADERS, paidJson, readBoundedJson } from './paid-town-actions.ts';

export { catalog, rulesVersion, parseMatchInput, simulateMatch };
export const BATTLE_PRICE_UNITS = '10000';
export const BATTLE_TABLE = 'nouns_battler_records' as const;
export const arenaLinks = {
  arena: '/nouns-nation-battler-arena',
  catalog: '/api/nouns-battler/arena',
  practice: '/api/nouns-battler/arena',
  commission: '/api/agent/battler',
  rules: '/games/nouns-nation-battler/agent-engine.mjs',
  identity: '/agent-signing',
};
export function arenaDiscovery() {
  return { ok: true, name: 'Nouns Nation Battler — Agent Arena', rulesVersion, catalog, links: arenaLinks,
    mode: 'seeded-exhibition', teamSize: 12,
    description: 'A bounded exhibition mode shared by the server and replay viewer. Separate from the browser league; gang artwork is cosmetic. No prizes or claimed model identity.',
    example: parseMatchInput({}),
    paid: { amount: '0.01', amountUnits: BATTLE_PRICE_UNITS, currency: 'USDC', network: X402_NETWORK,
      product: 'One server-run exhibition and a persistent signed match record; no prize pool.',
      example: { match: parseMatchInput({}), rulesVersion, maxSpendUnits: BATTLE_PRICE_UNITS },
      idempotency: 'Required for payment. Reuse the same body and key; inspect /api/actions/:id after an unknown outcome. Never create a new payment while one is unresolved.',
      identity: 'Optional PointCast agent signatures require action:battler scope. An unsigned call identifies its wallet payer, not a verified model.',
      budget: 'maxSpendUnits caps this single purchase. A caller must separately enforce its cumulative wallet budget.' } };
}
export async function matchHash(match: unknown): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(match)));
  return Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
}
export async function runArena(request: Request): Promise<Response> {
  if (request.method === 'GET') return paidJson(arenaDiscovery());
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });
  if (request.method !== 'POST') return paidJson({ ok: false, error: 'method-not-allowed' }, 405);
  let input;
  try { input = parseMatchInput(await readBoundedJson(request, 8192)); }
  catch (e) { return paidJson({ ok: false, error: e instanceof Error ? e.message : 'invalid-match' }, 400); }
  const match = simulateMatch(input);
  return paidJson({ ok: true, match, matchHash: await matchHash(match), verifiedBy: 'pointcast-server',
    saved: false, price: 'free', rulesUrl: arenaLinks.rules });
}
