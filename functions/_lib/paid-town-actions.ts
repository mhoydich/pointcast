import { canonicalJson, X402_NETWORK } from '../../src/lib/x402.ts';

export const PAID_TOWN_PRICE_UNITS = '10000';
export const PAID_TOWN_PRICE = {
  amount: '0.01',
  amountUnits: PAID_TOWN_PRICE_UNITS,
  currency: 'USDC',
  decimals: 6,
  network: X402_NETWORK,
  split: { houseBps: 5000, networkBps: 5000 },
} as const;

export const PAID_TOWN_ACTIONS = {
  bench: {
    action: 'bench',
    endpoint: 'https://pointcast.xyz/api/agent/bench',
    room: 'https://pointcast.xyz/bench',
    body: { question: 'What should the town build next?' },
    curl: `curl -X POST https://pointcast.xyz/api/agent/bench -H 'Content-Type: application/json' -H 'Idempotency-Key: <stable-request-id>' -H 'Payment-Signature: <base64-x402-v2>' --data '{"question":"What should the town build next?"}'`,
  },
  cast: {
    action: 'cast',
    endpoint: 'https://pointcast.xyz/api/agent/cast',
    room: 'https://pointcast.xyz/spells',
    body: { word: 'confetti' },
    curl: `curl -X POST https://pointcast.xyz/api/agent/cast -H 'Content-Type: application/json' -H 'Idempotency-Key: <stable-request-id>' -H 'Payment-Signature: <base64-x402-v2>' --data '{"word":"confetti"}'`,
  },
  claim: {
    action: 'claim',
    endpoint: 'https://pointcast.xyz/api/agent/claim',
    room: 'https://pointcast.xyz/kennel-club',
    body: { to: 'tz1...' },
    curl: `curl -X POST https://pointcast.xyz/api/agent/claim -H 'Content-Type: application/json' -H 'Idempotency-Key: <stable-request-id>' -H 'Payment-Signature: <base64-x402-v2>' --data '{"to":"tz1..."}'`,
  },
} as const;

export const PAID_TOWN_DISCOVERY = Object.values(PAID_TOWN_ACTIONS).map((entry) => ({
  ...entry,
  price: PAID_TOWN_PRICE,
}));

export const PAID_ACTION_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Payment-Signature, Idempotency-Key',
  'Access-Control-Expose-Headers': 'Payment-Required, X-Payment-Response, X-Facilitator-Url, X-Action-Id, Location',
  'Cache-Control': 'no-store',
};

export function paidJson(body: unknown, status = 200, sourceHeaders?: Headers): Response {
  const headers = new Headers(PAID_ACTION_HEADERS);
  if (sourceHeaders) {
    for (const name of ['Payment-Required', 'X-Payment-Response', 'X-Facilitator-Url']) {
      const value = sourceHeaders.get(name);
      if (value) headers.set(name, value);
    }
  }
  return new Response(JSON.stringify(body, null, 2), { status, headers });
}

interface BodyRequest {
  headers: Headers;
  body: ReadableStream<Uint8Array> | null;
}

export async function readBoundedJson(request: BodyRequest, maximumBytes = 4096): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maximumBytes) throw new Error('request body is too large');
  if (!request.body) throw new Error('request body is required');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel();
      throw new Error('request body is too large');
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode()) as unknown;
}

export type PaidIntentStatus =
  | 'created'
  | 'settling'
  | 'settlement_ambiguous'
  | 'settlement_failed'
  | 'settled'
  | 'acting'
  | 'action_failed'
  | 'succeeded';

export interface PaidIntentRow {
  id: string;
  action: string;
  idempotency_key: string;
  request_hash: string;
  request_json: string;
  status: PaidIntentStatus;
  capacity_key: string | null;
  settlement_json: string | null;
  result_json: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaidIntentSettlement {
  receipt: Record<string, unknown>;
  receiptHash: string;
  payer: string;
  split: Record<string, unknown>;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function paidIntentHeaders(intentId: string, source?: Headers): Headers {
  const headers = new Headers(source ?? PAID_ACTION_HEADERS);
  headers.set('X-Action-Id', intentId);
  headers.set('Location', `/api/actions/${intentId}`);
  return headers;
}

export function paidIntentJson(
  intentId: string,
  body: unknown,
  status = 200,
  source?: Headers,
): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: paidIntentHeaders(intentId, source),
  });
}

export function attachPaidIntent(response: Response, intentId: string): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: paidIntentHeaders(intentId, response.headers),
  });
}

export function publicPaidIntent(row: PaidIntentRow): Record<string, unknown> {
  return {
    id: row.id,
    action: row.action,
    status: row.status,
    actionCompleted: row.status === 'succeeded',
    charged: row.status === 'settling' || row.status === 'settlement_ambiguous'
      ? 'unknown'
      : ['settled', 'acting', 'action_failed', 'succeeded'].includes(row.status),
    ambiguous: row.status === 'settling' || row.status === 'settlement_ambiguous',
    resumable: row.status === 'settled' || row.status === 'action_failed',
    statusUrl: `/api/actions/${row.id}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.error ? { error: row.error } : {}),
    ...(row.result_json ? { result: JSON.parse(row.result_json) as unknown } : {}),
  };
}

export async function loadPaidIntent(db: D1Database, intentId: string): Promise<PaidIntentRow | null> {
  return db.prepare(`
    SELECT id, action, idempotency_key, request_hash, request_json, status,
           capacity_key, settlement_json, result_json, error, created_at, updated_at
    FROM paid_action_intents WHERE id = ?
  `).bind(intentId).first<PaidIntentRow>();
}

export type BeginPaidIntentResult =
  | { kind: 'quote' }
  | { kind: 'response'; response: Response }
  | { kind: 'settle'; intent: PaidIntentRow }
  | { kind: 'resume'; intent: PaidIntentRow; settlement: PaidIntentSettlement };

export async function beginPaidIntent(
  request: Request,
  db: D1Database,
  action: string,
  payload: Record<string, unknown>,
): Promise<BeginPaidIntentResult> {
  if (!request.headers.get('Payment-Signature')) return { kind: 'quote' };
  const idempotencyKey = request.headers.get('Idempotency-Key')?.trim() ?? '';
  if (!/^[A-Za-z0-9._:-]{8,128}$/u.test(idempotencyKey)) {
    return {
      kind: 'response',
      response: paidJson({ ok: false, error: 'A stable Idempotency-Key header (8-128 characters) is required.' }, 400),
    };
  }
  const requestJson = canonicalJson(payload);
  const requestHash = await sha256Hex(`${action}\n${requestJson}`);
  const id = `pai_${crypto.randomUUID().replaceAll('-', '')}`;
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO paid_action_intents
      (id, action, idempotency_key, request_hash, request_json, status, capacity_key,
       settlement_json, result_json, error, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'created', NULL, NULL, NULL, NULL, ?, ?)
    ON CONFLICT(action, idempotency_key) DO NOTHING
  `).bind(id, action, idempotencyKey, requestHash, requestJson, now, now).run();
  const intent = await db.prepare(`
    SELECT id, action, idempotency_key, request_hash, request_json, status,
           capacity_key, settlement_json, result_json, error, created_at, updated_at
    FROM paid_action_intents WHERE action = ? AND idempotency_key = ?
  `).bind(action, idempotencyKey).first<PaidIntentRow>();
  if (!intent) {
    return { kind: 'response', response: paidJson({ ok: false, error: 'The action intent could not be read.' }, 503) };
  }
  if (intent.request_hash !== requestHash) {
    return {
      kind: 'response',
      response: paidIntentJson(intent.id, {
        ok: false,
        error: 'idempotency-key-conflict',
        message: 'This Idempotency-Key is already attached to a different request.',
      }, 409),
    };
  }
  if (intent.status === 'succeeded') {
    return {
      kind: 'response',
      response: paidIntentJson(intent.id, JSON.parse(intent.result_json ?? '{}'), 200),
    };
  }
  const actingLeaseActive = intent.status === 'acting'
    && Date.now() - Date.parse(intent.updated_at) < 60_000;
  if (intent.status === 'settling' || intent.status === 'settlement_ambiguous' || actingLeaseActive) {
    return {
      kind: 'response',
      response: paidIntentJson(intent.id, { ok: false, ...publicPaidIntent(intent) }, 202),
    };
  }
  if (intent.status === 'settled' || intent.status === 'acting' || intent.status === 'action_failed') {
    if (!intent.settlement_json) {
      return {
        kind: 'response',
        response: paidIntentJson(intent.id, { ok: false, error: 'settlement-record-unavailable' }, 503),
      };
    }
    return { kind: 'resume', intent, settlement: JSON.parse(intent.settlement_json) as PaidIntentSettlement };
  }
  return { kind: 'settle', intent };
}

export async function updatePaidIntent(
  db: D1Database,
  intentId: string,
  status: PaidIntentStatus,
  values: {
    capacityKey?: string | null;
    settlement?: PaidIntentSettlement | null;
    result?: unknown;
    error?: string | null;
  } = {},
): Promise<void> {
  await db.prepare(`
    UPDATE paid_action_intents SET
      status = ?,
      capacity_key = COALESCE(?, capacity_key),
      settlement_json = COALESCE(?, settlement_json),
      result_json = COALESCE(?, result_json),
      error = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    status,
    values.capacityKey ?? null,
    values.settlement ? JSON.stringify(values.settlement) : null,
    values.result === undefined ? null : JSON.stringify(values.result),
    values.error ?? null,
    new Date().toISOString(),
    intentId,
  ).run();
}

export async function acquirePaidSettlement(db: D1Database, intentId: string): Promise<boolean> {
  const row = await db.prepare(`
    UPDATE paid_action_intents
    SET status = 'settling', error = NULL, updated_at = ?
    WHERE id = ? AND status IN ('created', 'settlement_failed')
    RETURNING id
  `).bind(new Date().toISOString(), intentId).first<{ id: string }>();
  return row?.id === intentId;
}

export async function clearPaidIntentCapacity(db: D1Database, intentId: string): Promise<void> {
  await db.prepare(`
    UPDATE paid_action_intents SET capacity_key = NULL, updated_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), intentId).run();
}

export function settlementWasAmbiguous(response: Response): boolean {
  return response.status >= 500 && response.status < 600;
}
