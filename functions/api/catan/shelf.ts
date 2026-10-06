/**
 * /api/catan/shelf — the Hex & Harbor game shelf.
 *
 * GET  → the ten game specs, live claims, the agent brief, and the
 *        chain-reward stub (ATTN 0, no value until launch).
 * POST {action:"claim"|"submit"|"release", slug, handle, ...}
 *      → claim one slot, submit an https build URL, or give the slot back.
 *
 * KV: catan:games:claims → { claims: GameClaim[] }
 * Claims are public. This route does not mint, pay, or merge.
 */
import { applyShelfAction, attachClaims, gameShelfSpec, parseShelfAction, type GameClaim } from '../../../src/lib/catan-games.ts';
import { catanJson, catanOptions, overBudget, readBody, type CatanEnv } from '../../_lib/catan-store.ts';

export const onRequestOptions = catanOptions;

const KEY = 'catan:games:claims';

async function load(kv: KVNamespace | undefined): Promise<GameClaim[]> {
  if (!kv) return [];
  const raw = await kv.get(KEY, 'json').catch(() => null) as { claims?: GameClaim[] } | null;
  return Array.isArray(raw?.claims) ? raw.claims : [];
}

export const onRequestGet: PagesFunction<CatanEnv> = async ({ env }) => {
  const attached = attachClaims(await load(env.VISITS));
  return catanJson({
    ok: true,
    store: env.VISITS ? 'kv' : 'unbound',
    ...gameShelfSpec(),
    ...attached,
  });
};

export const onRequestPost: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: false, error: 'the shelf store is offline' }, 503);
  const body = await readBody(request);
  if (!body) return catanJson({ ok: false, error: 'send JSON: {action, slug, handle, ...}' }, 400);
  const parsed = parseShelfAction(body);
  if (!parsed.ok) return catanJson({ ok: false, error: parsed.error }, 400);
  const budget = parsed.action.action === 'claim' ? 3 : 6;
  if (await overBudget(env.VISITS, request, `game-${parsed.action.action}`, budget)) {
    return catanJson({ ok: false, error: 'slow down — a few claims at a time' }, 429);
  }
  const result = applyShelfAction(await load(env.VISITS), parsed.action);
  if (!result.ok) return catanJson({ ok: false, error: result.error }, result.status);
  await env.VISITS.put(KEY, JSON.stringify({ claims: result.claims }));
  const attached = attachClaims(result.claims);
  return catanJson({
    ok: true,
    duplicate: result.duplicate === true,
    claim: result.claim,
    open: attached.open,
    rewards: { status: 'stub', value: 'none', label: 'no value until launch', attn: 0 },
  }, result.status);
};
