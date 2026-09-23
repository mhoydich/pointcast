/**
 * Campus Cards chain state — the console-owned facts that change without a
 * redeploy: IPFS pins for every card file and the originated contract.
 *
 * GET  (public)   { contract, originatedAt, opHash, pins, pinnedCount, pinTotal, complete }
 * POST (director) { pins: { "images.12.svg": "bafy…", "tokens.12": "bafy…", "contract": "bafy…" } }
 *                 { contract: "KT1…", opHash: "o…" }  — verified on TzKT: the contract
 *                 must exist and its creator must be the PointCast admin wallet.
 *
 * Writes come only from /desk. The wallet signs every chain operation in the
 * browser; this endpoint only remembers what already happened.
 */
import series from '../../../src/data/campus-cards.json';
import { CID, pinPlan } from '../../../src/lib/campus-cards-mint.mjs';
import { DIRECTOR_ADMIN_ADDRESS, hasDirectorDeskAccess } from '../../../src/lib/director-access';
import { readSessionFromRequest, authJson, type AuthEnv } from '../auth/session';

interface Env extends AuthEnv {
  CHAIN_STATE?: KVNamespace;
}

interface Pins {
  images: Record<string, Record<string, { cid: string }>>;
  tokens: Record<string, { cid: string }>;
  contract: { cid: string } | null;
}

interface CampusCardsState {
  pins: Pins;
  contract: string | null;
  opHash: string | null;
  originatedAt: string | null;
  updatedAt: string | null;
}

const KEY = 'campus-cards:v1';
const KT1 = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;
const OP = /^o[1-9A-HJ-NP-Za-km-z]{50}$/;
const MAX_BODY = 64 * 1024;

function empty(): CampusCardsState {
  return { pins: { images: {}, tokens: {}, contract: null }, contract: null, opHash: null, originatedAt: null, updatedAt: null };
}

async function load(env: Env): Promise<CampusCardsState> {
  const raw = await env.CHAIN_STATE?.get(KEY);
  if (!raw) return empty();
  try { return { ...empty(), ...JSON.parse(raw) }; } catch { return empty(); }
}

function summary(state: CampusCardsState) {
  const plan = pinPlan(series, state.pins);
  const pinnedCount = plan.filter((step) => step.done).length;
  return {
    ok: true,
    spec: 'pointcast.campus-cards-state/v1',
    contract: state.contract,
    opHash: state.opHash,
    originatedAt: state.originatedAt,
    updatedAt: state.updatedAt,
    admin: DIRECTOR_ADMIN_ADDRESS,
    cards: plan.filter((step) => step.key.startsWith('tokens.')).length,
    pinnedCount,
    pinTotal: plan.length,
    complete: pinnedCount === plan.length,
    pins: state.pins,
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const state = await load(env);
  return authJson(summary(state), { headers: { 'Cache-Control': 'public, max-age=15', 'Access-Control-Allow-Origin': '*' } });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await readSessionFromRequest(request, env);
  if (!session || !hasDirectorDeskAccess(session)) return authJson({ ok: false, reason: 'forbidden' }, { status: 403 });
  if (!env.CHAIN_STATE) return authJson({ ok: false, reason: 'kv-unbound' }, { status: 503 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return authJson({ ok: false, reason: 'origin-mismatch' }, { status: 403 });

  let body: { pins?: Record<string, unknown>; contract?: unknown; opHash?: unknown };
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) throw new Error('too large');
    body = JSON.parse(text);
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const state = await load(env);
  const validKeys = new Set(pinPlan(series, state.pins).map((step) => step.key));

  if (body.pins && typeof body.pins === 'object') {
    if (state.contract) return authJson({ ok: false, reason: 'already-originated', detail: 'Pins are frozen once the contract exists; repair metadata with set_token_info.' }, { status: 409 });
    for (const [key, cid] of Object.entries(body.pins)) {
      if (!validKeys.has(key) || typeof cid !== 'string' || !CID.test(cid)) {
        return authJson({ ok: false, reason: 'invalid-pin', key }, { status: 400 });
      }
      const parts = key.split('.');
      if (parts[0] === 'images') {
        state.pins.images[parts[1]] ??= {};
        state.pins.images[parts[1]][parts[2]] = { cid };
      } else if (parts[0] === 'tokens') {
        state.pins.tokens[parts[1]] = { cid };
      } else {
        state.pins.contract = { cid };
      }
    }
  }

  if (body.contract !== undefined) {
    if (typeof body.contract !== 'string' || !KT1.test(body.contract)) return authJson({ ok: false, reason: 'invalid-contract' }, { status: 400 });
    if (body.opHash !== undefined && (typeof body.opHash !== 'string' || !OP.test(body.opHash))) return authJson({ ok: false, reason: 'invalid-op-hash' }, { status: 400 });
    if (state.contract && state.contract !== body.contract) return authJson({ ok: false, reason: 'contract-already-set', contract: state.contract }, { status: 409 });
    // Trust the chain, not the request: the contract must exist and be the admin's.
    const response = await fetch(`https://api.tzkt.io/v1/contracts/${body.contract}`);
    const onChain = response.ok ? await response.json() as { creator?: { address?: string }; firstActivityTime?: string } : null;
    if (onChain?.creator?.address !== DIRECTOR_ADMIN_ADDRESS) {
      return authJson({ ok: false, reason: 'not-yet-indexed-or-wrong-creator', detail: 'TzKT does not show this contract as originated by the admin wallet yet. Try again in a few seconds.' }, { status: 409 });
    }
    state.contract = body.contract;
    state.opHash = typeof body.opHash === 'string' ? body.opHash : state.opHash;
    state.originatedAt = onChain.firstActivityTime ?? new Date().toISOString();
  }

  state.updatedAt = new Date().toISOString();
  await env.CHAIN_STATE.put(KEY, JSON.stringify(state));
  return authJson(summary(state), { headers: { 'Cache-Control': 'no-store' } });
};
