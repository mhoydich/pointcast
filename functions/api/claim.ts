/**
 * /api/claim — optional, read-only desk for a Nouns Money note.
 *
 * LOOM_CLAIM_ENABLED must be the string "true". Any other value, including
 * a missing variable, answers HTTP 404. The desk never stores secret
 * material, never signs, and never submits a transaction. Posting on the
 * Loom and replying on X do not pass through here.
 */
import {
  ClaimError,
  addressPrompt,
  claimEnabled,
  createSignChallenge,
  formatWalletBook,
  formatXReply,
  lookupTezName,
  parseWalletBook,
  readHolderNotes,
  rejectSecrets,
  verifySignChallenge,
} from '../../src/lib/loom-claim.mjs';

type FetchLike = (url: string, init?: { method?: string; headers?: Record<string, string> }) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export type ClaimEnv = { LOOM_CLAIM_ENABLED?: string };

export type ClaimDeps = {
  fetch?: FetchLike;
  now?: () => Date;
  bytes?: Uint8Array;
};

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-loom-claim': 'optional',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

function fail(error: unknown): Response {
  if (error instanceof ClaimError) {
    const row = error as ClaimError & { reason: string; status: number };
    return json({ ok: false, error: row.reason }, row.status);
  }
  return json({ ok: false, error: 'unavailable' }, 503);
}

export async function handleClaim(request: Request, env: ClaimEnv = {}, deps: ClaimDeps = {}): Promise<Response> {
  if (!claimEnabled(env)) return json({ ok: false, error: 'not-found' }, 404);
  if (request.method === 'GET') {
    return json({
      ok: true,
      enabled: true,
      optional: true,
      required: false,
      readOnly: true,
      storesKeys: false,
      writes: false,
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
    rejectSecrets(body);
    const now = deps.now?.() ?? new Date();
    const fetchImpl = deps.fetch;
    if (body.action === 'challenge') {
      const challenge = createSignChallenge({
        address: body.address,
        noteId: body.noteId,
        now,
        bytes: deps.bytes,
      });
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
        challenge,
        reply: formatXReply(challenge.code),
        walletBook,
      });
    }
    if (body.action === 'verify') {
      const result = await verifySignChallenge(body.challenge, {
        publicKey: body.publicKey,
        signature: body.signature,
      }, now);
      return json({ ok: true, writes: false, ...result });
    }
    if (body.action === 'lookup') {
      const found = typeof body.domain === 'string' && body.domain
        ? await lookupTezName(body.domain, fetchImpl ? { fetchImpl } : {})
        : addressPrompt(body.address);
      let notes: unknown[] = [];
      if (found.address) {
        try {
          notes = (await readHolderNotes(found.address, fetchImpl ? { fetchImpl } : {})).notes;
        } catch (error) {
          if (!(error instanceof ClaimError) || error.reason !== 'lookup-unavailable') throw error;
        }
      }
      return json({ ok: true, writes: false, ...found, notes });
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
