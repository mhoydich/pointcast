/**
 * /api/claim — optional, read-only desk for a Nouns Money note.
 *
 * LOOM_CLAIM_ENABLED must be the string "true". Any other value, including
 * a missing variable, answers HTTP 404. The desk never stores secret
 * material, never signs, and never submits a transaction. Posting on the
 * Loom and replying on X do not pass through here.
 */
import {
  CLAIM_BOUND,
  CLAIM_TTL_MS,
  ClaimError,
  addressPrompt,
  claimEnabled,
  claimLimiter,
  clientIp,
  createSignChallenge,
  formatWalletBook,
  formatXReply,
  issueBinding,
  lookupTezName,
  matchBinding,
  memoryClaimStore,
  parseWalletBook,
  readHolderNotes,
  readWalletBooks,
  rejectSecrets,
  verifySignChallenge,
} from '../../src/lib/loom-claim.mjs';

type FetchLike = (url: string, init?: { method?: string; headers?: Record<string, string> }) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
type ClaimStore = { get(code: string): Promise<Record<string, unknown> | null>; set(code: string, record: Record<string, unknown>): Promise<void> };
type LimitFn = (input: { ip: string; handle: string | null }) => { allowed: boolean; retryAfter?: number };
type LoomRead = (request: Request, opts: { kv: unknown }) => Promise<Response>;

export type ClaimEnv = { LOOM_CLAIM_ENABLED?: string; PC_LOOM_KV?: unknown; VISITS?: unknown; CLAIM_STORE?: ClaimStore };

export type ClaimDeps = {
  fetch?: FetchLike;
  now?: () => Date;
  bytes?: Uint8Array;
  store?: ClaimStore;
  limit?: LimitFn;
  readLoom?: LoomRead;
};

const localStore = memoryClaimStore();

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-loom-claim': 'optional',
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
}

function limitHandle(body: Record<string, unknown> | null): string | null {
  const raw = body?.handle ?? body?.domain ?? body?.address ?? '';
  const text = String(raw).trim().toLowerCase().slice(0, 80);
  return text || null;
}

function tooMany(retryAfter = 1): Response {
  return json({ ok: false, error: 'slow-down' }, 429, { 'retry-after': String(Math.max(1, retryAfter)) });
}

function fail(error: unknown): Response {
  if (error instanceof ClaimError) {
    const row = error as ClaimError & { reason: string; status: number };
    return json({ ok: false, error: row.reason }, row.status);
  }
  return json({ ok: false, error: 'unavailable' }, 503);
}

function claimStore(env: ClaimEnv, deps: ClaimDeps): ClaimStore {
  return deps.store || env.CLAIM_STORE || localStore;
}

export async function handleClaim(request: Request, env: ClaimEnv = {}, deps: ClaimDeps = {}): Promise<Response> {
  if (!claimEnabled(env)) return json({ ok: false, error: 'not-found' }, 404);
  const limit = deps.limit || claimLimiter;
  if (request.method === 'GET') {
    const gate = limit({ ip: clientIp(request), handle: null });
    if (!gate.allowed) return tooMany(gate.retryAfter);
    return json({
      ok: true,
      enabled: true,
      optional: true,
      required: false,
      readOnly: true,
      storesKeys: false,
      writes: false,
      bindsXAccount: false,
      codeTtlSec: CLAIM_TTL_MS / 1000,
      bound: CLAIM_BOUND,
      page: '/claim',
      loom: '/loom',
    });
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'method-not-allowed' }, 405);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return json({ ok: false, error: 'too-large' }, 400);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ ok: false, error: 'invalid-json' }, 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  try {
    const gate = limit({ ip: clientIp(request), handle: limitHandle(body) });
    if (!gate.allowed) return tooMany(gate.retryAfter);
    rejectSecrets(body);
    const now = deps.now?.() ?? new Date();
    const fetchImpl = deps.fetch;
    const store = claimStore(env, deps);
    const loomKv = env.PC_LOOM_KV ?? env.VISITS ?? null;
    if (body.action === 'challenge') {
      const challenge = createSignChallenge({
        address: body.address,
        noteId: body.noteId,
        now,
        ttlMs: CLAIM_TTL_MS,
        bytes: deps.bytes,
      });
      const binding = issueBinding(challenge, { handle: typeof body.handle === 'string' ? body.handle : null });
      await store.set(challenge.code, binding);
      const walletBook = formatWalletBook({
        address: challenge.address,
        code: challenge.code,
        noteId: challenge.noteId,
        issuedAt: challenge.issuedAt,
      });
      return json({
        ok: true,
        readOnly: true,
        writes: false,
        storesKeys: false,
        bindsXAccount: false,
        bound: CLAIM_BOUND,
        challenge,
        reply: formatXReply(challenge.code),
        walletBook,
      });
    }
    if (body.action === 'verify') {
      const challenge = body.challenge as { code?: string } | null;
      const binding = challenge?.code ? await store.get(String(challenge.code)) : null;
      matchBinding(binding, challenge, now);
      const result = await verifySignChallenge(body.challenge, {
        publicKey: body.publicKey,
        signature: body.signature,
      }, now);
      return json({ ok: true, writes: false, storesKeys: false, bindsXAccount: false, bound: CLAIM_BOUND, ...result });
    }
    if (body.action === 'lookup' || body.action === 'books') {
      const found = body.action === 'books'
        ? { readOnly: true, prompt: null, domain: null, address: typeof body.address === 'string' ? body.address : null, found: false }
        : typeof body.domain === 'string' && body.domain
          ? await lookupTezName(body.domain, fetchImpl ? { fetchImpl } : {})
          : addressPrompt(body.address);
      let notes: unknown[] = [];
      if (body.action === 'lookup' && found.address) {
        try {
          notes = (await readHolderNotes(found.address, fetchImpl ? { fetchImpl } : {})).notes;
        } catch (error) {
          if (!(error instanceof ClaimError) || error.reason !== 'lookup-unavailable') throw error;
        }
      }
      const books = await readWalletBooks({ kv: loomKv, readLoom: deps.readLoom });
      const code = typeof body.code === 'string' ? body.code : null;
      const records = books.records.filter((row) => {
        if (code && row.code !== code) return false;
        if (found.address && row.address !== found.address) return false;
        return true;
      });
      return json({ ok: true, writes: false, storesKeys: false, ...found, notes, books: { via: books.via, records } });
    }
    if (body.action === 'format') {
      const source = body.record && typeof body.record === 'object' ? body.record : body;
      const walletBook = formatWalletBook(source);
      const record = parseWalletBook(walletBook);
      return json({ ok: true, readOnly: true, writes: false, reply: formatXReply(record.code), walletBook });
    }
    return json({ ok: false, error: 'unknown-action' }, 400);
  } catch (error) {
    return fail(error);
  }
}

export const onRequest: PagesFunction<ClaimEnv> = ({ request, env }) => handleClaim(request, env);
