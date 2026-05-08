import {
  MONEY_EVENT_TTL_SECONDS,
  MONEY_RECEIPT_PREFIX,
  assertNoMoneySecrets,
  buildAllowanceSummary,
  moneyEventKey,
  moneyReceiptKey,
  normalizeMoneyReceiptDraft,
  publicMoneyReceiptDraft,
  verifyStripeSignature,
} from './money-runtime.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Stripe-Signature, Link-Signature',
};

export function moneyJson(data, init = 200) {
  const responseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...responseInit,
    headers: {
      ...JSON_HEADERS,
      'Cache-Control': 'no-store',
      ...(responseInit.headers ?? {}),
    },
  });
}

export async function handleMoneyWebhook({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method === 'GET' || request.method === 'HEAD') {
    const body = {
      ok: true,
      endpoint: 'https://pointcast.xyz/api/link/webhook',
      method: 'POST',
      kvBound: Boolean(env.PC_MONEY_KV),
      signed: Boolean(env.LINK_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET),
      note: 'Signed Link/Stripe webhook endpoint. Stores sanitized receipt drafts in PC_MONEY_KV.',
    };
    return request.method === 'HEAD'
      ? new Response(null, { status: 200, headers: JSON_HEADERS })
      : moneyJson(body);
  }
  if (request.method !== 'POST') return moneyJson({ ok: false, error: 'method-not-allowed' }, 405);
  if (!env.PC_MONEY_KV) {
    return moneyJson({
      ok: false,
      error: 'money-kv-unbound',
      hint: 'Bind PC_MONEY_KV in Cloudflare Pages before enabling Link receipt intake.',
    }, 503);
  }

  const rawBody = await request.text();
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return moneyJson({ ok: false, error: 'invalid-json' }, 400);
  }

  const draft = normalizeMoneyReceiptDraft(event);
  const secret = env.LINK_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET || '';
  const signatureHeader = request.headers.get('stripe-signature') || request.headers.get('link-signature') || '';
  const signatureVerified = secret
    ? await verifyStripeSignature(rawBody, signatureHeader, secret)
    : false;

  if (secret && !signatureVerified) {
    return moneyJson({ ok: false, error: 'bad-signature' }, 401);
  }
  if (!secret && draft.mode === 'live') {
    return moneyJson({ ok: false, error: 'unsigned-live-receipt-rejected' }, 401);
  }

  const receipt = publicMoneyReceiptDraft(draft);
  const problems = assertNoMoneySecrets(receipt);
  if (problems.length > 0) {
    return moneyJson({ ok: false, error: 'receipt-contained-secret-like-fields', problems }, 400);
  }

  const eventId = receipt.sourceEventId || receipt.linkSessionId || receipt.id;
  const eventKey = moneyEventKey(eventId);
  const receiptKey = moneyReceiptKey(receipt.linkSessionId || receipt.id);
  const existingEvent = await env.PC_MONEY_KV.get(eventKey);
  if (existingEvent) {
    return moneyJson({
      ok: true,
      duplicate: true,
      receiptKey: existingEvent,
      receipt,
    });
  }

  const stored = {
    ...receipt,
    signatureVerified,
    unsignedTestReceipt: !secret && receipt.mode === 'test',
  };
  await env.PC_MONEY_KV.put(receiptKey, JSON.stringify(stored, null, 2), {
    metadata: {
      agent: receipt.agent,
      loop: receipt.loop,
      mode: receipt.mode,
      status: receipt.status,
      amountCents: receipt.amountCents,
    },
  });
  await env.PC_MONEY_KV.put(eventKey, receiptKey, { expirationTtl: MONEY_EVENT_TTL_SECONDS });

  return moneyJson({
    ok: true,
    receiptKey,
    receipt,
    signatureVerified,
  });
}

export async function handleMoneyReceipts({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return moneyJson({ ok: false, error: 'method-not-allowed' }, 405);
  }
  if (!env.PC_MONEY_KV) {
    return moneyJson({
      ok: false,
      error: 'money-kv-unbound',
      hint: 'Bind PC_MONEY_KV in Cloudflare Pages before reading Link receipt drafts.',
    }, 503);
  }
  if (!isAdminRequest(request, env.MONEY_ADMIN_TOKEN)) {
    return moneyJson({ ok: false, error: 'unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const mode = url.searchParams.get('mode');
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? 100) || 100));
  const receipts = await readMoneyDrafts(env.PC_MONEY_KV, { status, mode, limit });
  const payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    count: receipts.length,
    allowance: buildAllowanceSummary({ liveCents: 0, testCents: 0, receipts: [] }, receipts),
    receipts,
  };

  return request.method === 'HEAD'
    ? new Response(null, { status: 200, headers: JSON_HEADERS })
    : moneyJson(payload);
}

export async function readMoneyDrafts(kv, { status, mode, limit = 100 } = {}) {
  const listed = await kv.list({ prefix: MONEY_RECEIPT_PREFIX, limit });
  const receipts = [];
  for (const key of listed.keys ?? []) {
    const raw = await kv.get(key.name);
    if (!raw) continue;
    try {
      const receipt = JSON.parse(raw);
      if (status && receipt.status !== status) continue;
      if (mode && receipt.mode !== mode) continue;
      receipts.push(receipt);
    } catch {
      // Skip malformed KV entries. The promotion script will surface counts.
    }
  }
  return receipts.sort((a, b) => String(b.updatedAt ?? b.receivedAt).localeCompare(String(a.updatedAt ?? a.receivedAt)));
}

function isAdminRequest(request, token) {
  if (!token) return false;
  const url = new URL(request.url);
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const queryToken = url.searchParams.get('token');
  return bearer === token || queryToken === token;
}
