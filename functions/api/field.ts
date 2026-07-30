/**
 * /api/field — consented, privacy-minimal PointCast Field participation.
 *
 * POST {
 *   type: "pointcast-field-participation-v1",
 *   invitationId: "PC-FIELD-001",
 *   participantToken: "<browser-generated UUID>",
 *   consent: true
 * }
 *
 * GET → public aggregate counts only.
 *
 * The endpoint intentionally rejects observation content. It stores one
 * unique KV key per browser token + invitation, with a 180-day TTL. Notes,
 * photos, selected qualities, places, IP addresses, and user agents are never
 * read or written here. A token is SHA-256 hashed before it becomes a key.
 */

import {
  applyRateLimitHeaders,
  rateLimit,
  rateLimitResponse,
} from '../_rate-limit.ts';

interface FieldEnv {
  VISITS?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}

interface FieldReceiptMetadata {
  invitationId: string;
  recordedAt: string;
}

interface FieldAggregate {
  completedReceipts: number;
  returningParticipants: number;
  activeInvitations: number;
}

const PARTICIPATION_TYPE = 'pointcast-field-participation-v1';
const KEY_PREFIX = 'field:v1:receipt:';
const RETENTION_SECONDS = 180 * 24 * 60 * 60;
const ALLOWED_INVITATIONS = new Set(['PC-FIELD-001']);
const ALLOWED_FIELDS = new Set([
  'type',
  'invitationId',
  'participantToken',
  'consent',
]);
const PARTICIPANT_TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const responseInit: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...responseInit,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': 'https://pointcast.xyz',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...((responseInit.headers as Record<string, string>) ?? {}),
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function hashParticipantToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function listReceiptKeys(kv: KVNamespace): Promise<string[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  let page = 0;

  do {
    const result = await kv.list<FieldReceiptMetadata>({
      prefix: KEY_PREFIX,
      limit: 1000,
      ...(cursor ? { cursor } : {}),
    });
    names.push(...result.keys.map((key) => key.name));
    cursor = result.list_complete ? undefined : result.cursor;
    page += 1;
  } while (cursor && page < 10);

  return names;
}

export function buildAggregate(keyNames: Iterable<string>): FieldAggregate {
  const uniqueKeys = new Set(keyNames);
  const validKeys = new Set<string>();
  const invitationsByParticipant = new Map<string, Set<string>>();
  const activeInvitations = new Set<string>();

  for (const key of uniqueKeys) {
    if (!key.startsWith(KEY_PREFIX)) continue;
    const remainder = key.slice(KEY_PREFIX.length);
    const separator = remainder.lastIndexOf(':');
    if (separator <= 0 || separator === remainder.length - 1) continue;

    const invitationId = remainder.slice(0, separator);
    const participantHash = remainder.slice(separator + 1);
    validKeys.add(key);
    activeInvitations.add(invitationId);

    const invitations = invitationsByParticipant.get(participantHash) ?? new Set<string>();
    invitations.add(invitationId);
    invitationsByParticipant.set(participantHash, invitations);
  }

  let returningParticipants = 0;
  for (const invitations of invitationsByParticipant.values()) {
    if (invitations.size >= 2) returningParticipants += 1;
  }

  return {
    completedReceipts: validKeys.size,
    returningParticipants,
    activeInvitations: activeInvitations.size,
  };
}

async function readAggregate(kv: KVNamespace): Promise<FieldAggregate> {
  return buildAggregate(await listReceiptKeys(kv));
}

function publicPayload(aggregate: FieldAggregate, available = true) {
  return {
    ok: true,
    available,
    invitationId: 'PC-FIELD-001',
    aggregate,
    goal: {
      completedReceipts: 25,
      returningParticipants: 5,
    },
    privacy: {
      stores: ['invitation ID', 'SHA-256 hash of a random browser token', 'recorded time'],
      neverStores: ['observation choices', 'note', 'photo', 'location', 'IP address', 'user agent'],
      retentionDays: 180,
      publicData: 'aggregate counts only',
    },
  };
}

async function handleGet(env: FieldEnv): Promise<Response> {
  if (!env.VISITS) {
    return json(
      publicPayload({
        completedReceipts: 0,
        returningParticipants: 0,
        activeInvitations: 0,
      }, false),
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
      },
    );
  }

  try {
    const aggregate = await readAggregate(env.VISITS);
    return json(publicPayload(aggregate), {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error(JSON.stringify({
      message: 'field aggregate read failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return json({ ok: false, error: 'aggregate-unavailable' }, 503);
  }
}

async function handlePost(request: Request, env: FieldEnv): Promise<Response> {
  if (!env.VISITS) {
    return json({
      ok: false,
      error: 'counting-unavailable',
      note: 'Your on-device field receipt still works without the optional public count.',
    }, 503);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ ok: false, error: 'content-type-must-be-json' }, 415);
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > 2048) {
    return json({ ok: false, error: 'payload-too-large' }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  if (!isRecord(body)) return json({ ok: false, error: 'invalid-payload' }, 400);

  const unexpectedFields = Object.keys(body).filter((key) => !ALLOWED_FIELDS.has(key));
  if (unexpectedFields.length > 0) {
    return json({
      ok: false,
      error: 'unexpected-fields',
      note: 'Observation content is intentionally rejected by this endpoint.',
    }, 400);
  }

  const type = typeof body.type === 'string' ? body.type : '';
  const invitationId = typeof body.invitationId === 'string' ? body.invitationId : '';
  const participantToken = typeof body.participantToken === 'string' ? body.participantToken : '';

  if (type !== PARTICIPATION_TYPE) {
    return json({ ok: false, error: 'unsupported-type' }, 400);
  }
  if (!ALLOWED_INVITATIONS.has(invitationId)) {
    return json({ ok: false, error: 'unknown-invitation' }, 400);
  }
  if (body.consent !== true) {
    return json({ ok: false, error: 'explicit-consent-required' }, 400);
  }
  if (!PARTICIPANT_TOKEN.test(participantToken)) {
    return json({ ok: false, error: 'invalid-participant-token' }, 400);
  }

  const participantHash = await hashParticipantToken(participantToken);
  const limit = await rateLimit(request, env, {
    bucket: 'field:participate',
    clientId: `participant:${participantHash}`,
    windowSec: 60 * 60,
    maxRequests: 6,
  });
  if (!limit.allowed) return rateLimitResponse(limit, 'field participation rate exceeded');

  const key = `${KEY_PREFIX}${invitationId}:${participantHash}`;
  const recordedAt = new Date().toISOString();

  try {
    const prior = await env.VISITS.get(key);
    if (!prior) {
      await env.VISITS.put(key, '1', {
        expirationTtl: RETENTION_SECONDS,
        metadata: { invitationId, recordedAt } satisfies FieldReceiptMetadata,
      });
    }

    const keyNames = new Set(await listReceiptKeys(env.VISITS));
    keyNames.add(key);
    const aggregate = buildAggregate(keyNames);

    return applyRateLimitHeaders(json({
      ...publicPayload(aggregate),
      created: !prior,
      counted: true,
      note: prior
        ? 'This browser was already counted for this invitation.'
        : 'Receipt counted. The observation itself stayed on your device.',
    }), limit);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'field participation write failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return applyRateLimitHeaders(json({
      ok: false,
      error: 'counting-unavailable',
      note: 'Your on-device field receipt is safe; the optional count did not complete.',
    }, 503), limit);
  }
}

export const onRequest: PagesFunction<FieldEnv> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://pointcast.xyz',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store',
      },
    });
  }
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-PointCast-Service': 'field-participation',
        'X-PointCast-KV-Bound': String(Boolean(env.VISITS)),
      },
    });
  }
  if (request.method === 'GET') return handleGet(env);
  if (request.method === 'POST') return handlePost(request, env);
  return json({ ok: false, error: 'method-not-allowed' }, {
    status: 405,
    headers: { Allow: 'GET, POST, OPTIONS, HEAD' },
  });
};
