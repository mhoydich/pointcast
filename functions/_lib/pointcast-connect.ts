/**
 * Sign in with PointCast — a login for the small web that does not track you.
 *
 * The promise, in the order the code keeps it:
 *   1. Nothing to register. A site's own origin (https://example.com) is its
 *      name. Codes are delivered only to that origin: by window.postMessage
 *      with that exact targetOrigin, or by redirect to a URL on that origin.
 *   2. You see exactly what the site gets before you say yes: your town card,
 *      and your Tezos wallet only if the site asked for it.
 *   3. The site gets a one-time code that dies in two minutes. Trading it in
 *      returns a snapshot of what you approved. There is no token, no refresh,
 *      no API the site can call later. To hear from you again, it asks again.
 *   4. Every site gets a different id for you (sub), derived from your account
 *      and the site's origin, so two sites cannot match their user lists.
 *
 * Codes live in the auth state store (D1 oauth_states, atomically consumed;
 * KV fallback) under a hash of the code, never the code itself.
 */
import { consumeAuthState, writeAuthState, type AuthEnv } from '../api/auth/session.ts';
import { publicCard, readCardByUser, tezosWallets, type CardEnv, type PublicCard } from './town-card.ts';
import type { PointCastUser } from '../../src/lib/auth/types';

export const ISSUER = 'https://pointcast.xyz';
export const CODE_TTL_SECONDS = 120;
export const SCOPES = ['card', 'wallet'] as const;
export type Scope = (typeof SCOPES)[number];
const GRANTS_PREFIX = 'connect:grants:v1:';
const GRANT_CAP = 50;

/**
 * Apps PointCast recognises by name. Being listed only puts a name and a
 * "known to PointCast" note on the consent screen. It grants nothing extra.
 */
export const KNOWN_APPS: Record<string, { name: string; note: string }> = {
  'https://pointcast.xyz': { name: 'PointCast', note: 'The town itself.' },
  'https://tonebloom.xyz': { name: 'Tone Bloom', note: 'Sound and art instrument, a PointCast neighbour.' },
  'https://industrynext.xyz': { name: 'Industry Next', note: 'Agent-address directory, a PointCast neighbour.' },
  'https://tez-rally.pages.dev': { name: 'Rally', note: 'Pickleball scorekeeping, a PointCast neighbour.' },
  'https://thasher.xyz': { name: 'THAS HER', note: 'Ladies pickleball zine, a PointCast neighbour.' },
};

export type ConnectEnv = AuthEnv & CardEnv & { VISITS?: CardEnv['VISITS'] & Pick<KVNamespace, 'get' | 'put'> };
export type Grant = { client: string; name: string; scope: Scope[]; firstAt: string; lastAt: string; count: number };
type CodePayload = { v: 1; userId: string; client: string; scope: Scope[]; sub: string; card: PublicCard | null; wallet: string | null; approvedAt: string };

export class ConnectError extends Error {
  status: number; reason: string;
  constructor(reason: string, message: string, status = 400) { super(message); this.reason = reason; this.status = status; }
}

/** An app is an origin: https://host[:port], or http on localhost for development. Nothing else. */
export function normalizeClient(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 200) return null;
  try {
    const u = new URL(value);
    if (u.origin !== value.replace(/\/$/, '')) return null;
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (u.protocol === 'https:' && (u.hostname.includes('.') || local)) return u.origin;
    if (u.protocol === 'http:' && local) return u.origin;
    return null;
  } catch { return null; }
}

/** card is always included; wallet only when asked. Unknown words are dropped. */
export function normalizeScope(value: unknown): Scope[] {
  const words = (Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : '').toLowerCase().split(/[\s,+]+/);
  return SCOPES.filter((s) => s === 'card' || words.includes(s));
}

/** A redirect target must live on the app's own origin. */
export function normalizeRedirect(value: unknown, client: string): string | null {
  if (typeof value !== 'string' || !value || value.length > 1000) return null;
  try { const u = new URL(value); return u.origin === client && !u.username && !u.password ? u.toString() : null; } catch { return null; }
}

export function appLabel(client: string): { name: string; host: string; known: boolean; note: string } {
  const known = KNOWN_APPS[client];
  const host = new URL(client).host;
  return { name: known?.name || host, host, known: Boolean(known), note: known?.note || 'Not known to PointCast. That is fine; check the address is the site you meant.' };
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function sha256(text: string): Promise<Uint8Array> { return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))); }
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/** Same person + same site → same id. Same person + another site → an unrelated id. */
export async function pairwiseSub(userId: string, client: string): Promise<string> {
  return `pc_${b64url(await sha256(`pointcast-connect/v1|${client}|${userId}`)).slice(0, 32)}`;
}

async function codeKey(code: string) { return `pcconnect:${hex(await sha256(code))}`; }

/** What the consent screen promises, built from the same data the code carries. */
export async function preview(env: ConnectEnv, user: PointCastUser, client: string, scope: Scope[]) {
  const card = await readCardByUser(env, user.userId);
  const live = card && !card.released ? publicCard(card) : null;
  const wallets = tezosWallets(user);
  const wallet = scope.includes('wallet') ? (live?.wallet || wallets[0] || null) : null;
  return { app: appLabel(client), client, scope, card: live, wallet, walletMissing: scope.includes('wallet') && !wallet };
}

/** The member said yes. Mint a one-time code bound to this app. */
export async function authorize(env: ConnectEnv, user: PointCastUser, clientRaw: unknown, scopeRaw: unknown, now = new Date()) {
  const client = normalizeClient(clientRaw);
  if (!client) throw new ConnectError('invalid-client', 'The app must be an https origin like https://example.com.');
  const scope = normalizeScope(scopeRaw);
  const shown = await preview(env, user, client, scope);
  const code = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const payload: CodePayload = { v: 1, userId: user.userId, client, scope, sub: await pairwiseSub(user.userId, client), card: shown.card, wallet: shown.wallet, approvedAt: now.toISOString() };
  await writeAuthState(env, await codeKey(code), payload, CODE_TTL_SECONDS);
  await recordGrant(env, user.userId, client, scope, now).catch(() => { /* the receipt is best effort */ });
  return { code, expiresIn: CODE_TTL_SECONDS, client, scope };
}

/** The app trades the code. Once, within two minutes, from its own origin. */
export async function exchange(env: ConnectEnv, codeRaw: unknown, clientRaw: unknown, requestOrigin: string | null, now = new Date()) {
  const client = normalizeClient(clientRaw);
  if (!client) throw new ConnectError('invalid-client', 'client must be your site origin, like https://example.com.');
  if (requestOrigin && requestOrigin !== client) throw new ConnectError('origin-mismatch', 'This code can only be redeemed by the site it was issued to.', 403);
  if (typeof codeRaw !== 'string' || !/^[A-Za-z0-9_-]{32,64}$/.test(codeRaw)) throw new ConnectError('invalid-code', 'That code is not valid.');
  const payload = await consumeAuthState<CodePayload>(env, await codeKey(codeRaw));
  if (!payload || payload.v !== 1) throw new ConnectError('invalid-code', 'That code is unknown, used or expired. Ask the person to sign in again.');
  if (payload.client !== client) throw new ConnectError('invalid-code', 'That code was issued to a different site.');
  return {
    ok: true as const,
    iss: ISSUER,
    aud: client,
    sub: payload.sub,
    scope: payload.scope,
    card: payload.card,
    wallet: payload.scope.includes('wallet') ? payload.wallet : undefined,
    approvedAt: payload.approvedAt,
    issuedAt: now.toISOString(),
    access: 'none-ongoing',
    note: 'This is a one-time snapshot of what the person approved. There is no token to refresh. Ask again to hear from them again.',
  };
}

export async function readGrants(env: ConnectEnv, userId: string): Promise<Grant[]> {
  if (!env.VISITS) return [];
  const stored = await env.VISITS.get<{ grants: Grant[] }>(GRANTS_PREFIX + userId, 'json');
  return Array.isArray(stored?.grants) ? stored!.grants : [];
}
async function recordGrant(env: ConnectEnv, userId: string, client: string, scope: Scope[], now: Date) {
  if (!env.VISITS) return;
  const grants = await readGrants(env, userId);
  const prior = grants.find((g) => g.client === client);
  const next: Grant = { client, name: appLabel(client).name, scope, firstAt: prior?.firstAt || now.toISOString(), lastAt: now.toISOString(), count: (prior?.count || 0) + 1 };
  const list = [next, ...grants.filter((g) => g.client !== client)].slice(0, GRANT_CAP);
  await env.VISITS.put(GRANTS_PREFIX + userId, JSON.stringify({ grants: list }));
}
export async function forgetGrant(env: ConnectEnv, userId: string, client: string) {
  if (!env.VISITS) return [];
  const list = (await readGrants(env, userId)).filter((g) => g.client !== client);
  await env.VISITS.put(GRANTS_PREFIX + userId, JSON.stringify({ grants: list }));
  return list;
}
