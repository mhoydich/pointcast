/**
 * /api/card — town cards.
 *
 *   GET  ?handle=mike   public card (CORS open, cached briefly)
 *   GET                 your card, your linked Tezos wallets, and whether
 *                       you have a card yet (session cookie)
 *   GET  ?prefill=1     on-chain profile objects held by your linked wallets,
 *                       so the editor can fill the card from Tezos
 *   POST { card }       save your card (session cookie, same-site only)
 *   DELETE              remove your card and free the handle
 */
import { readSessionFromRequest, type AuthEnv } from './auth/session.ts';
import { listProfilePages, readProfileHandle } from '../../src/lib/profile-object.mjs';
import {
  CARD_COLORS, CardError, PROFILE_CONTRACT, deleteCard, normalizeHandle, publicCard, readCardByHandle, readCardByUser, saveCard, tezosWallets,
  type CardEnv, type ProfileReader,
} from '../_lib/town-card.ts';
import type { PointCastUser } from '../../src/lib/auth/types';

type Env = AuthEnv & CardEnv;
type SessionReader = (request: Request, env: Env) => Promise<{ user: PointCastUser } | null>;
export type CardDeps = { readSession?: SessionReader; readProfile?: ProfileReader; listProfiles?: (contract: string) => Promise<Array<{ handle: string; owner: string; tokenId: number; page: { name: string; bio: string; nounSeed: number }; links: Array<{ label: string; url: string }> }>> };

const base = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { ...base, 'Cache-Control': 'private, no-store', ...extra } });

export function sameSite(request: Request): boolean {
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite) return fetchSite === 'same-origin';
  const origin = request.headers.get('Origin');
  if (origin) { try { return origin === new URL(request.url).origin; } catch { return false; } }
  return false;
}

const defaultReadProfile: ProfileReader = async (contract, handle) => {
  const rec = await readProfileHandle(contract, handle);
  return rec ? { owner: rec.owner, tokenId: rec.tokenId } : null;
};

export async function handleCard(request: Request, env: Env, deps: CardDeps = {}): Promise<Response> {
  const readSession = deps.readSession || (readSessionFromRequest as unknown as SessionReader);
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return json({ ok: false, reason: 'method-not-allowed' }, 405, { Allow: 'GET, POST, DELETE, OPTIONS' });
  if (!env.VISITS) return json({ ok: false, reason: 'unavailable', error: 'Cards are unavailable right now.' }, 503);

  try {
    if (request.method === 'GET' && url.searchParams.has('handle')) {
      const handle = normalizeHandle(url.searchParams.get('handle'));
      const card = await readCardByHandle(env, handle);
      const cors = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=15, s-maxage=30' };
      if (!card) return json({ ok: false, reason: 'not-found', handle }, 404, cors);
      return json({ ok: true, card: publicCard(card) }, 200, cors);
    }

    if (request.method !== 'GET' && !sameSite(request)) return json({ ok: false, reason: 'cross-site' }, 403);
    let current: Awaited<ReturnType<SessionReader>> = null;
    try { current = await readSession(request, env); } catch { return json({ ok: false, reason: 'session-unavailable' }, 503); }
    if (!current) return json({ ok: false, reason: 'unauthorized', error: 'Sign in to PointCast to make a card.' }, 401);
    const user = current.user;

    if (request.method === 'GET' && url.searchParams.get('prefill') === '1') {
      const wallets = tezosWallets(user);
      if (!wallets.length) return json({ ok: true, profiles: [], wallets });
      const list = deps.listProfiles || ((c: string) => listProfilePages(c));
      let rows: Awaited<ReturnType<NonNullable<CardDeps['listProfiles']>>> = [];
      try { rows = await list(PROFILE_CONTRACT); } catch { return json({ ok: false, reason: 'chain-unavailable', error: 'Could not read Tezos just now.' }, 503); }
      const profiles = rows.filter((r) => wallets.includes(r.owner)).map((r) => ({
        handle: r.handle, tokenId: r.tokenId, owner: r.owner, name: r.page.name, bio: r.page.bio, noun: r.page.nounSeed, links: (r.links || []).filter((l) => l.url).slice(0, 3),
      }));
      return json({ ok: true, profiles, wallets });
    }

    if (request.method === 'GET') {
      const card = await readCardByUser(env, user.userId);
      return json({ ok: true, card: card ? { ...publicCard(card), released: Boolean(card.released) } : null, wallets: tezosWallets(user), name: user.preferredName, colors: CARD_COLORS });
    }

    if (request.method === 'DELETE') {
      await deleteCard(env, user.userId);
      return json({ ok: true, card: null });
    }

    let body: unknown;
    try { const raw = await request.text(); if (raw.length > 8000) throw new Error('large'); body = JSON.parse(raw); } catch { return json({ ok: false, reason: 'invalid-json', error: 'Send the card as JSON.' }, 400); }
    const input = body && typeof body === 'object' && 'card' in (body as object) ? (body as { card: unknown }).card : body;
    const card = await saveCard(env, user, input, deps.readProfile || defaultReadProfile);
    return json({ ok: true, card: publicCard(card) });
  } catch (e) {
    if (e instanceof CardError) return json({ ok: false, reason: e.reason, error: e.message }, e.status);
    return json({ ok: false, reason: 'storage-unavailable', error: 'Could not reach card storage. Nothing was changed.' }, 503);
  }
}

export const onRequest: PagesFunction<Env> = ({ request, env }) => handleCard(request, env);
