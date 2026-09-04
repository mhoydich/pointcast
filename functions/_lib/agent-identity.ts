import {
  base64ToBytes,
  canonicalJson,
  verifyCanonicalPayload,
} from '../../src/lib/x402.ts';

export const AGENT_ID_PATTERN = /^pci_[0-9a-f]{32}$/u;
export const AGENT_REQUEST_SPEC = 'pointcast.agent-request/v1';
export const AGENT_CHALLENGE_SPEC = 'pointcast.agent-challenge/v1';
export const AGENT_IDENTITY_HEADERS = [
  'PointCast-Agent-Id',
  'PointCast-Agent-Timestamp',
  'PointCast-Agent-Signature',
] as const;

const MAX_BODY_BYTES = 8_192;
const CHALLENGE_TTL_MS = 5 * 60_000;
const MAX_INSTANCE_TTL_MS = 366 * 24 * 60 * 60_000;
const REQUEST_CLOCK_SKEW_MS = 5 * 60_000;
const SCOPE_PATTERN = /^[a-z][a-z0-9:._*-]{0,63}$/u;

export type AgentIdentityEnv = { AUTH_DB?: D1Database };
export type AgentPurpose = 'register' | 'rotate' | 'revoke';

interface AgentKeyRow {
  key_id: string;
  agent_id: string;
  public_key: string;
  operator: string;
  scopes_json: string;
  expires_at: string;
  status: 'active' | 'rotated' | 'revoked';
  replaces_key_id: string | null;
  created_at: string;
  rotated_at: string | null;
  revoked_at: string | null;
}

interface ChallengeRow {
  id: string;
  purpose: AgentPurpose;
  agent_id: string | null;
  proposal_json: string;
  payload: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': `Content-Type, ${AGENT_IDENTITY_HEADERS.join(', ')}`,
  'Cache-Control': 'no-store',
};

export function agentIdentityJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });
}

export async function readAgentIdentityJson(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY_BYTES) throw new Error('request body is too large');
  if (!request.body) throw new Error('request body is required');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('request body is too large');
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode()) as unknown;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('body must be a JSON object');
  return value as Record<string, unknown>;
}

function publicKey(value: unknown): string {
  if (typeof value !== 'string') throw new Error('public_key must be a base64 Ed25519 key');
  try {
    if (base64ToBytes(value).byteLength !== 32) throw new Error();
  } catch {
    throw new Error('public_key must be a base64 Ed25519 key');
  }
  return value;
}

function operator(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 160 || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error('operator must be 1-160 printable characters');
  }
  return value.trim();
}

function scopes(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 32) throw new Error('scopes must contain 1-32 entries');
  const normalized = [...new Set(value.map((entry) => {
    if (typeof entry !== 'string' || !SCOPE_PATTERN.test(entry)) throw new Error('scope entries are invalid');
    return entry;
  }))].sort();
  return normalized;
}

function futureExpiry(value: unknown, now: Date): string {
  if (typeof value !== 'string') throw new Error('expires_at must be an RFC 3339 timestamp');
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time <= now.getTime() + CHALLENGE_TTL_MS || time > now.getTime() + MAX_INSTANCE_TTL_MS) {
    throw new Error('expires_at must be more than five minutes and no more than 366 days ahead');
  }
  return new Date(time).toISOString();
}

function agentId(value: unknown): string {
  if (typeof value !== 'string' || !AGENT_ID_PATTERN.test(value)) throw new Error('agent_id is invalid');
  return value;
}

function parseProposal(value: unknown, now: Date) {
  const body = record(value);
  const purpose = body.purpose;
  if (purpose !== 'register' && purpose !== 'rotate' && purpose !== 'revoke') throw new Error('purpose must be register, rotate, or revoke');
  if (purpose === 'revoke') return { purpose, agent_id: agentId(body.agent_id) };
  return {
    purpose,
    ...(purpose === 'rotate' ? { agent_id: agentId(body.agent_id) } : {}),
    public_key: publicKey(body.public_key),
    operator: operator(body.operator),
    scopes: scopes(body.scopes),
    expires_at: futureExpiry(body.expires_at, now),
  };
}

function publicAgentKey(row: AgentKeyRow, now = new Date()) {
  return {
    agent_id: row.agent_id,
    key_id: row.key_id,
    public_key: row.public_key,
    public_key_alg: 'ed25519',
    operator: row.operator,
    scopes: JSON.parse(row.scopes_json) as unknown,
    expires_at: row.expires_at,
    status: row.status === 'active' && Date.parse(row.expires_at) <= now.getTime() ? 'expired' : row.status,
    created_at: row.created_at,
    ...(row.replaces_key_id ? { replaces_key_id: row.replaces_key_id } : {}),
    ...(row.rotated_at ? { rotated_at: row.rotated_at } : {}),
    ...(row.revoked_at ? { revoked_at: row.revoked_at } : {}),
  };
}

async function loadChallenge(db: D1Database, id: unknown): Promise<ChallengeRow> {
  if (typeof id !== 'string' || !/^pch_[0-9a-f]{32}$/u.test(id)) throw new Error('challenge_id is invalid');
  const row = await db.prepare(`
    SELECT id, purpose, agent_id, proposal_json, payload, created_at, expires_at, used_at
    FROM agent_challenges WHERE id = ?
  `).bind(id).first<ChallengeRow>();
  if (!row) throw new Error('challenge not found');
  return row;
}

async function latestAgentKey(db: D1Database, id: string, activeOnly = false): Promise<AgentKeyRow | null> {
  return db.prepare(`
    SELECT key_id, agent_id, public_key, operator, scopes_json, expires_at, status,
           replaces_key_id, created_at, rotated_at, revoked_at
    FROM agent_keys
    WHERE agent_id = ? ${activeOnly ? "AND status = 'active'" : ''}
    ORDER BY created_at DESC LIMIT 1
  `).bind(id).first<AgentKeyRow>();
}

function signature(value: unknown, name = 'signature'): string {
  if (typeof value !== 'string' || value.length > 256) throw new Error(`${name} is invalid`);
  try {
    if (base64ToBytes(value).byteLength !== 64) throw new Error();
  } catch {
    throw new Error(`${name} is invalid`);
  }
  return value;
}

export async function handleAgentChallenge(request: Request, env: AgentIdentityEnv, now = new Date()): Promise<Response> {
  if (!env.AUTH_DB) return agentIdentityJson({ ok: false, error: 'agent-registry-unavailable' }, 503);
  if (request.method === 'GET') {
    try {
      await env.AUTH_DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
      return agentIdentityJson({ ok: true, schema: AGENT_CHALLENGE_SPEC });
    } catch {
      return agentIdentityJson({ ok: false, error: 'agent-registry-unavailable' }, 503);
    }
  }
  let proposal;
  try {
    proposal = parseProposal(await readAgentIdentityJson(request), now);
  } catch (error) {
    return agentIdentityJson({ ok: false, error: error instanceof Error ? error.message : 'invalid challenge request' }, 400);
  }
  const id = `pch_${crypto.randomUUID().replaceAll('-', '')}`;
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS).toISOString();
  const payload = `${AGENT_CHALLENGE_SPEC}\n${canonicalJson({ id, proposal, created_at: createdAt, expires_at: expiresAt })}\n`;
  await env.AUTH_DB.prepare(`
    INSERT INTO agent_challenges
      (id, purpose, agent_id, proposal_json, payload, created_at, expires_at, used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `).bind(id, proposal.purpose, 'agent_id' in proposal ? proposal.agent_id : null, canonicalJson(proposal), payload, createdAt, expiresAt).run();
  return agentIdentityJson({ challenge_id: id, payload, expires_at: expiresAt });
}

function usableChallenge(row: ChallengeRow, purpose: AgentPurpose, now: Date) {
  if (row.purpose !== purpose) throw new Error('challenge purpose mismatch');
  if (row.used_at) throw new Error('challenge already used');
  if (Date.parse(row.expires_at) <= now.getTime()) throw new Error('challenge expired');
}

export async function handleAgentRegister(request: Request, env: AgentIdentityEnv, now = new Date()): Promise<Response> {
  if (!env.AUTH_DB) return agentIdentityJson({ ok: false, error: 'agent-registry-unavailable' }, 503);
  try {
    const body = record(await readAgentIdentityJson(request));
    const challenge = await loadChallenge(env.AUTH_DB, body.challenge_id);
    usableChallenge(challenge, 'register', now);
    const proposal = parseProposal(JSON.parse(challenge.proposal_json), new Date(Date.parse(challenge.created_at) - 1));
    if (proposal.purpose !== 'register') throw new Error('challenge purpose mismatch');
    if (!await verifyCanonicalPayload(challenge.payload, signature(body.signature), proposal.public_key)) {
      return agentIdentityJson({ ok: false, error: 'signature-invalid' }, 401);
    }
    const id = `pci_${crypto.randomUUID().replaceAll('-', '')}`;
    const keyId = `pck_${crypto.randomUUID().replaceAll('-', '')}`;
    const timestamp = now.toISOString();
    const results = await env.AUTH_DB.batch([
      env.AUTH_DB.prepare(`UPDATE agent_challenges SET used_at = ? WHERE id = ? AND used_at IS NULL AND expires_at > ?`).bind(timestamp, challenge.id, timestamp),
      env.AUTH_DB.prepare(`
        INSERT INTO agent_keys
          (key_id, agent_id, public_key, public_key_alg, operator, scopes_json, expires_at,
           status, replaces_key_id, registered_challenge_id, created_at, rotated_at, revoked_at)
        VALUES (?, ?, ?, 'ed25519', ?, ?, ?, 'active', NULL, ?, ?, NULL, NULL)
      `).bind(keyId, id, proposal.public_key, proposal.operator, canonicalJson(proposal.scopes), proposal.expires_at, challenge.id, timestamp),
    ]);
    if ((results[0]?.meta.changes ?? 0) !== 1 || (results[1]?.meta.changes ?? 0) !== 1) throw new Error('challenge could not be consumed');
    const stored = await latestAgentKey(env.AUTH_DB, id, true);
    return agentIdentityJson({ ok: true, agent: publicAgentKey(stored!, now) }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'registration failed';
    const status = /UNIQUE|already|consumed/u.test(message) ? 409 : 400;
    return agentIdentityJson({ ok: false, error: message }, status);
  }
}

export async function handleAgentGet(env: AgentIdentityEnv, rawId: unknown, now = new Date()): Promise<Response> {
  if (!env.AUTH_DB) return agentIdentityJson({ ok: false, error: 'agent-registry-unavailable' }, 503);
  let id: string;
  try { id = agentId(rawId); } catch { return agentIdentityJson({ ok: false, error: 'agent-not-found' }, 404); }
  const row = await latestAgentKey(env.AUTH_DB, id);
  if (!row) return agentIdentityJson({ ok: false, error: 'agent-not-found' }, 404);
  return agentIdentityJson({ ok: true, agent: publicAgentKey(row, now) });
}

export async function handleAgentRotate(request: Request, env: AgentIdentityEnv, rawId: unknown, now = new Date()): Promise<Response> {
  if (!env.AUTH_DB) return agentIdentityJson({ ok: false, error: 'agent-registry-unavailable' }, 503);
  try {
    const id = agentId(rawId);
    const body = record(await readAgentIdentityJson(request));
    const challenge = await loadChallenge(env.AUTH_DB, body.challenge_id);
    usableChallenge(challenge, 'rotate', now);
    const proposal = parseProposal(JSON.parse(challenge.proposal_json), new Date(Date.parse(challenge.created_at) - 1));
    if (proposal.purpose !== 'rotate' || proposal.agent_id !== id) throw new Error('challenge agent mismatch');
    const current = await latestAgentKey(env.AUTH_DB, id, true);
    if (!current || Date.parse(current.expires_at) <= now.getTime()) return agentIdentityJson({ ok: false, error: 'active-agent-key-not-found' }, 404);
    const oldValid = await verifyCanonicalPayload(challenge.payload, signature(body.signature), current.public_key);
    const newValid = await verifyCanonicalPayload(challenge.payload, signature(body.new_key_signature, 'new_key_signature'), proposal.public_key);
    if (!oldValid || !newValid) return agentIdentityJson({ ok: false, error: 'signature-invalid' }, 401);
    const timestamp = now.toISOString();
    const keyId = `pck_${crypto.randomUUID().replaceAll('-', '')}`;
    const results = await env.AUTH_DB.batch([
      env.AUTH_DB.prepare(`UPDATE agent_challenges SET used_at = ? WHERE id = ? AND used_at IS NULL AND expires_at > ?`).bind(timestamp, challenge.id, timestamp),
      env.AUTH_DB.prepare(`UPDATE agent_keys SET status = 'rotated', rotated_at = ? WHERE key_id = ? AND status = 'active'`).bind(timestamp, current.key_id),
      env.AUTH_DB.prepare(`
        INSERT INTO agent_keys
          (key_id, agent_id, public_key, public_key_alg, operator, scopes_json, expires_at,
           status, replaces_key_id, registered_challenge_id, created_at, rotated_at, revoked_at)
        VALUES (?, ?, ?, 'ed25519', ?, ?, ?, 'active', ?, ?, ?, NULL, NULL)
      `).bind(keyId, id, proposal.public_key, proposal.operator, canonicalJson(proposal.scopes), proposal.expires_at, current.key_id, challenge.id, timestamp),
    ]);
    if (results.some((result) => (result?.meta.changes ?? 0) !== 1)) throw new Error('rotation conflict');
    const stored = await latestAgentKey(env.AUTH_DB, id, true);
    return agentIdentityJson({ ok: true, agent: publicAgentKey(stored!, now) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'rotation failed';
    return agentIdentityJson({ ok: false, error: message }, /conflict|UNIQUE|already/u.test(message) ? 409 : 400);
  }
}

export async function handleAgentRevoke(request: Request, env: AgentIdentityEnv, rawId: unknown, now = new Date()): Promise<Response> {
  if (!env.AUTH_DB) return agentIdentityJson({ ok: false, error: 'agent-registry-unavailable' }, 503);
  try {
    const id = agentId(rawId);
    const body = record(await readAgentIdentityJson(request));
    const challenge = await loadChallenge(env.AUTH_DB, body.challenge_id);
    usableChallenge(challenge, 'revoke', now);
    const proposal = parseProposal(JSON.parse(challenge.proposal_json), now);
    if (proposal.purpose !== 'revoke' || proposal.agent_id !== id) throw new Error('challenge agent mismatch');
    const current = await latestAgentKey(env.AUTH_DB, id, true);
    if (!current || Date.parse(current.expires_at) <= now.getTime()) return agentIdentityJson({ ok: false, error: 'active-agent-key-not-found' }, 404);
    if (!await verifyCanonicalPayload(challenge.payload, signature(body.signature), current.public_key)) {
      return agentIdentityJson({ ok: false, error: 'signature-invalid' }, 401);
    }
    const timestamp = now.toISOString();
    const results = await env.AUTH_DB.batch([
      env.AUTH_DB.prepare(`UPDATE agent_challenges SET used_at = ? WHERE id = ? AND used_at IS NULL AND expires_at > ?`).bind(timestamp, challenge.id, timestamp),
      env.AUTH_DB.prepare(`UPDATE agent_keys SET status = 'revoked', revoked_at = ? WHERE key_id = ? AND status = 'active'`).bind(timestamp, current.key_id),
    ]);
    if (results.some((result) => (result?.meta.changes ?? 0) !== 1)) throw new Error('revocation conflict');
    return agentIdentityJson({ ok: true, agent_id: id, status: 'revoked', revoked_at: timestamp });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'revocation failed';
    return agentIdentityJson({ ok: false, error: message }, /conflict|already/u.test(message) ? 409 : 400);
  }
}

export async function hashAgentActionRequest(action: string, payload: Record<string, unknown>): Promise<string> {
  const data = new TextEncoder().encode(`${action}\n${canonicalJson(payload)}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function buildAgentRequestPayload(agentIdValue: string, timestamp: string, requestHash: string): string {
  return `${AGENT_REQUEST_SPEC}\n${canonicalJson({ agent_id: agentIdValue, request_hash: requestHash, timestamp })}\n`;
}

export async function verifyAgentRequest(
  db: D1Database,
  request: Request,
  requestHash: string,
  requiredScope: string,
  now = new Date(),
): Promise<{ agentId: string | null; response?: Response }> {
  const idHeader = request.headers.get('PointCast-Agent-Id');
  const timestampHeader = request.headers.get('PointCast-Agent-Timestamp');
  const signatureHeader = request.headers.get('PointCast-Agent-Signature');
  if (!idHeader && !timestampHeader && !signatureHeader) return { agentId: null };
  if (!idHeader || !timestampHeader || !signatureHeader) {
    return { agentId: null, response: agentIdentityJson({ ok: false, error: 'incomplete-agent-proof' }, 401) };
  }
  let id: string;
  try { id = agentId(idHeader); } catch { return { agentId: null, response: agentIdentityJson({ ok: false, error: 'agent-proof-invalid' }, 401) }; }
  const signedAt = Date.parse(timestampHeader);
  if (!Number.isFinite(signedAt) || Math.abs(now.getTime() - signedAt) > REQUEST_CLOCK_SKEW_MS) {
    return { agentId: null, response: agentIdentityJson({ ok: false, error: 'agent-proof-expired' }, 401) };
  }
  const key = await latestAgentKey(db, id, true);
  if (!key || Date.parse(key.expires_at) <= now.getTime()) {
    return { agentId: null, response: agentIdentityJson({ ok: false, error: 'active-agent-key-not-found' }, 401) };
  }
  const granted = JSON.parse(key.scopes_json) as unknown;
  if (!Array.isArray(granted) || (!granted.includes('*') && !granted.includes(requiredScope))) {
    return { agentId: null, response: agentIdentityJson({ ok: false, error: 'agent-scope-denied', required_scope: requiredScope }, 403) };
  }
  const payload = buildAgentRequestPayload(id, new Date(signedAt).toISOString(), requestHash);
  if (!await verifyCanonicalPayload(payload, signatureHeader, key.public_key)) {
    return { agentId: null, response: agentIdentityJson({ ok: false, error: 'agent-proof-invalid' }, 401) };
  }
  return { agentId: id };
}

export const AGENT_IDENTITY_OPTIONS = () => new Response(null, { status: 204, headers: HEADERS });
