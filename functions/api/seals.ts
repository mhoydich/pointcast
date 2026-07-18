/**
 * /api/seals — the town seal registry behind /townsfolk.
 *
 * PRD: docs/plans/2026-07-18-prd-seal-registry.md (Phase A).
 * The /passport Seal Desk produces wallet-signed journey seals that live
 * in localStorage. This endpoint lets a visitor PUBLISH one, making them
 * townsfolk on /townsfolk.
 *
 *   GET  /api/seals               → { ok, count, roster: [summary] }
 *   GET  /api/seals?address=tz…   → { ok, proof } (full published proof)
 *   POST /api/seals               → body = the Seal Desk proof object
 *
 * Trust model (deliberate, documented in the PRD): the server validates
 * SHAPE, not signatures. Verification happens in the reader's browser
 * on /townsfolk via @taquito/utils. One entry per address — a later
 * publish from the same address overwrites, so the true wallet always
 * wins over a squatter eventually.
 *
 * Storage: PC_RACE_KV (shared small-counter namespace):
 *   seals:addr:{address} → full proof JSON (latest)
 *   seals:index          → [{address, passportId, port, issuedAt,
 *                            publishedAt, stampCount, visaCount}] capped
 * Rate limit 6/min/IP. Graceful no-op when KV is unbound.
 */
import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../_rate-limit';

interface Env {
  PC_RATES_KV?: KVNamespace;
  PC_RACE_KV?: KVNamespace;
}

const INDEX_KEY = 'seals:index';
const INDEX_CAP = 200;
const ADDRESS_RE = /^tz[1-3][1-9A-HJ-NP-Za-km-z]{33}$/;
const SEAL_SCHEMA = 'https://pointcast.xyz/schemas/tezos-passport-seal-v1';

interface RosterEntry {
  address: string;
  passportId: string;
  port: string;
  issuedAt: string;
  publishedAt: string;
  stampCount: number;
  visaCount: number;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const kv = env.PC_RACE_KV;
  if (!kv) return json({ ok: true, reason: 'kv-unbound', count: 0, roster: [] });

  const address = new URL(request.url).searchParams.get('address');
  if (address) {
    if (!ADDRESS_RE.test(address)) return json({ ok: false, error: 'invalid-address' }, 400);
    const raw = await kv.get(`seals:addr:${address}`);
    if (!raw) return json({ ok: false, error: 'not-found' }, 404);
    return json({ ok: true, proof: JSON.parse(raw) });
  }

  const indexRaw = await kv.get(INDEX_KEY);
  let roster: RosterEntry[] = [];
  try {
    roster = indexRaw ? (JSON.parse(indexRaw) as RosterEntry[]) : [];
  } catch {
    roster = [];
  }
  return json({ ok: true, count: roster.length, roster });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rl = await rateLimit(request, env, { bucket: 'seals:publish', windowSec: 60, maxRequests: 6 });
  if (!rl.allowed) return rateLimitResponse(rl);

  const kv = env.PC_RACE_KV;
  if (!kv) return json({ ok: true, reason: 'kv-unbound' });

  let proof: any;
  try {
    proof = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  // Structural validation only — see the PRD's trust model. Field caps
  // keep a hostile blob from bloating KV; the reader's browser does the
  // cryptographic verification.
  const bad = (why: string) => json({ ok: false, error: why }, 400);
  if (!proof || typeof proof !== 'object') return bad('invalid-proof');
  if (proof.schema !== SEAL_SCHEMA) return bad('wrong-schema');
  if (typeof proof.address !== 'string' || !ADDRESS_RE.test(proof.address)) return bad('invalid-address');
  if (typeof proof.message !== 'string' || proof.message.length > 6000) return bad('invalid-message');
  if (!proof.message.startsWith('PointCast Tezos Passport')) return bad('invalid-message');
  if (typeof proof.payload !== 'string' || proof.payload.length > 16000) return bad('invalid-payload');
  if (typeof proof.signature !== 'string' || proof.signature.length < 20 || proof.signature.length > 200) return bad('invalid-signature');
  if (proof.publicKey != null && (typeof proof.publicKey !== 'string' || proof.publicKey.length > 120)) return bad('invalid-public-key');
  if (typeof proof.issuedAt !== 'string' || isNaN(Date.parse(proof.issuedAt))) return bad('invalid-issued-at');

  const stampCount = Array.isArray(proof?.local?.ids)
    ? proof.local.ids.length
    : Number(proof?.local?.count) || 0;
  const visaCount = Array.isArray(proof?.tezos?.visaIds) ? proof.tezos.visaIds.length : 0;

  const entry: RosterEntry = {
    address: proof.address,
    passportId: String(proof.passportId || '').slice(0, 24),
    port: String(proof.port || '').slice(0, 40),
    issuedAt: proof.issuedAt,
    publishedAt: new Date().toISOString(),
    stampCount,
    visaCount,
  };

  const indexRaw = await kv.get(INDEX_KEY);
  let roster: RosterEntry[] = [];
  try {
    roster = indexRaw ? (JSON.parse(indexRaw) as RosterEntry[]) : [];
  } catch {
    roster = [];
  }
  roster = roster.filter((r) => r.address !== entry.address);
  roster.unshift(entry);
  if (roster.length > INDEX_CAP) roster.length = INDEX_CAP;

  await Promise.all([
    kv.put(`seals:addr:${proof.address}`, JSON.stringify(proof)),
    kv.put(INDEX_KEY, JSON.stringify(roster)),
  ]);

  return applyRateLimitHeaders(json({ ok: true, count: roster.length }), rl);
};
