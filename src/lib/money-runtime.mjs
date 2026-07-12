export const MONEY_LIVE_CAP_CENTS = 2000;
export const MONEY_RECEIPT_PREFIX = 'money:receipt:';
export const MONEY_EVENT_PREFIX = 'money:event:';
export const MONEY_EVENT_TTL_SECONDS = 60 * 60 * 24 * 30;

const SECRET_KEY_RE = /(card|cvc|cvv|token|secret|payment[_-]?method|authorization|credential)$/i;
const SECRET_VALUE_RE =
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b|\b(?:tok|pm|card)_[A-Za-z0-9_]+\b|\b\d{12,19}\b/g;

export function formatUsd(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);
}

export function moneyReceiptKey(id) {
  return `${MONEY_RECEIPT_PREFIX}${String(id || '').trim()}`;
}

export function moneyEventKey(id) {
  return `${MONEY_EVENT_PREFIX}${String(id || '').trim()}`;
}

export function centsFromAmount(value, fallbackUsd) {
  const cents = Number(value);
  if (Number.isFinite(cents) && cents >= 0) return Math.round(cents);
  const usd = Number(fallbackUsd);
  if (Number.isFinite(usd) && usd >= 0) return Math.round(usd * 100);
  return 0;
}

export function normalizeMoneyMode(value, isTest) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'test' || raw === 'testmode' || raw === 'sandbox' || isTest === true) return 'test';
  return 'live';
}

export function normalizeMoneyStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw.includes('settled') || raw.includes('succeeded') || raw.includes('completed')) return 'settled';
  if (raw.includes('approved') || raw.includes('authorized')) return 'approved';
  if (raw.includes('denied') || raw.includes('declined') || raw.includes('rejected') || raw.includes('canceled')) {
    return 'denied';
  }
  if (raw.includes('refunded')) return 'refunded';
  if (['settled', 'succeeded', 'success', 'paid', 'complete', 'completed'].includes(raw)) return 'settled';
  if (['approved', 'authorized', 'requires_capture'].includes(raw)) return 'approved';
  if (['denied', 'declined', 'rejected', 'failed', 'canceled', 'cancelled'].includes(raw)) return 'denied';
  if (['refunded', 'reversed'].includes(raw)) return 'refunded';
  if (raw === 'expired') return 'expired';
  return 'pending';
}

export function slug(value, fallback) {
  const cleaned = String(value ?? fallback ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return cleaned || fallback;
}

export function cleanString(value, max = 240) {
  if (value == null) return '';
  return redactSecretValue(String(value).replace(/\s+/g, ' ').trim()).slice(0, max);
}

export function redactSecretValue(value) {
  return String(value ?? '').replace(SECRET_VALUE_RE, '[redacted]');
}

export function sanitizeCredentialLabel(value) {
  const cleaned = cleanString(value, 160);
  if (!cleaned) return '';
  return cleaned
    .replace(/\b(?:card|visa|mastercard|amex)\s+(?:ending\s+in\s+)?\d{4}\b/gi, (match) =>
      match.replace(/\d{4}\b/, '****'),
    )
    .replace(/\b\d{4}\b/g, '****');
}

export function assertNoMoneySecrets(value, path = 'receipt') {
  const problems = [];
  walkForSecrets(value, path, problems);
  return problems;
}

function walkForSecrets(value, path, problems) {
  if (Array.isArray(value)) {
    value.forEach((item, idx) => walkForSecrets(item, `${path}[${idx}]`, problems));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (SECRET_KEY_RE.test(key) && !['credentialLabel', 'linkSessionId'].includes(key)) {
        problems.push(childPath);
      }
      walkForSecrets(child, childPath, problems);
    }
    return;
  }
  if (typeof value === 'string') {
    SECRET_VALUE_RE.lastIndex = 0;
  }
  if (typeof value === 'string' && SECRET_VALUE_RE.test(value)) {
    problems.push(path);
  }
}

export function normalizeMoneyReceiptDraft(input = {}, options = {}) {
  const event = input && typeof input === 'object' ? input : {};
  const object =
    event.data?.object ??
    event.spend_request ??
    event.spendRequest ??
    event.receipt ??
    event.object ??
    event;
  const metadata = object.metadata ?? event.metadata ?? {};
  const id =
    cleanString(object.id ?? object.link_session_id ?? object.linkSessionId ?? event.id ?? options.id, 160) ||
    `receipt-${Date.now()}`;
  const linkSessionId = cleanString(object.link_session_id ?? object.linkSessionId ?? object.id ?? id, 160);
  const amountCents = centsFromAmount(
    object.amount_cents ?? object.amountCents ?? object.amount ?? metadata.amount_cents,
    object.amount_usd ?? object.amountUsd ?? metadata.amount_usd,
  );
  const modeValue = object.mode ?? (object.livemode === false ? 'test' : undefined);
  const mode = normalizeMoneyMode(modeValue, object.test ?? event.test ?? metadata.test ?? object.livemode === false);
  const status = normalizeMoneyStatus(object.status ?? event.status ?? event.type);
  const now = new Date(options.now ?? Date.now()).toISOString();
  const merchant =
    cleanString(
      object.merchant ??
        object.merchantName ??
        object.merchant_name ??
        object.merchant?.name ??
        metadata.merchant ??
        metadata.merchant_name,
      120,
    ) || 'unknown merchant';
  const context = cleanString(object.context ?? object.description ?? metadata.context ?? event.context, 4000);
  const agent = slug(object.agent ?? metadata.agent ?? options.agent, 'codex');
  const loop = slug(object.loop ?? metadata.loop ?? options.loop, 'scout');
  const title =
    cleanString(object.title ?? metadata.title, 120) ||
    `${agent} ${loop} - ${merchant} - ${formatUsd(amountCents)}${mode === 'test' ? ' (testmode)' : ''}`;

  return {
    id,
    linkSessionId,
    agent,
    loop,
    amountCents,
    amountUsd: amountCents / 100,
    currency: cleanString(object.currency ?? metadata.currency ?? 'USD', 3).toUpperCase() || 'USD',
    merchant,
    merchantUrl: cleanString(object.merchantUrl ?? object.merchant_url ?? metadata.merchant_url, 240) || null,
    mode,
    status,
    receiptUrl: cleanString(object.receipt_url ?? object.receiptUrl ?? object.url ?? metadata.receipt_url, 240) || null,
    requestedAt: cleanString(object.requested_at ?? object.requestedAt ?? object.created_at ?? object.created, 64) || now,
    approvedAt: cleanString(object.approved_at ?? object.approvedAt ?? object.authorized_at, 64) || null,
    settledAt: cleanString(object.settled_at ?? object.settledAt ?? object.completed_at, 64) || (status === 'settled' ? now : null),
    credentialLabel:
      sanitizeCredentialLabel(object.credential_label ?? object.credentialLabel ?? metadata.credential_label) || null,
    context,
    title,
    sourceEventId: cleanString(event.id ?? options.sourceEventId ?? id, 160),
    receivedAt: now,
    updatedAt: now,
    promotedBlockId: cleanString(object.promotedBlockId, 16) || null,
  };
}

export function publicMoneyReceiptDraft(draft) {
  return {
    id: draft.id,
    linkSessionId: draft.linkSessionId,
    agent: draft.agent,
    loop: draft.loop,
    amountCents: draft.amountCents,
    amountUsd: draft.amountUsd,
    currency: draft.currency,
    merchant: draft.merchant,
    merchantUrl: draft.merchantUrl,
    mode: draft.mode,
    status: draft.status,
    receiptUrl: draft.receiptUrl,
    requestedAt: draft.requestedAt,
    approvedAt: draft.approvedAt,
    settledAt: draft.settledAt,
    credentialLabel: draft.credentialLabel,
    context: draft.context,
    title: draft.title,
    sourceEventId: draft.sourceEventId,
    receivedAt: draft.receivedAt,
    updatedAt: draft.updatedAt,
    promotedBlockId: draft.promotedBlockId,
  };
}

export function buildAllowanceSummary(ledger, drafts = [], capCents = MONEY_LIVE_CAP_CENTS) {
  const receipts = Array.isArray(ledger?.receipts) ? ledger.receipts : [];
  const liveSpentCents = Number(ledger?.liveCents ?? ledger?.summary?.liveCents ?? 0) || 0;
  const testCents = Number(ledger?.testCents ?? ledger?.summary?.testCents ?? 0) || 0;
  const publishedLinkIds = new Set(receipts.map((receipt) => receipt.linkSessionId).filter(Boolean));
  const reservingDrafts = drafts.filter((draft) => {
    if (!draft || draft.mode !== 'live') return false;
    if (draft.promotedBlockId || publishedLinkIds.has(draft.linkSessionId)) return false;
    return ['pending', 'approved', 'settled'].includes(draft.status);
  });
  const reservedDraftCents = reservingDrafts.reduce((sum, draft) => sum + (Number(draft.amountCents) || 0), 0);
  const liveReservedCents = liveSpentCents + reservedDraftCents;
  return {
    capCents,
    capUsd: capCents / 100,
    capLabel: formatUsd(capCents),
    liveSpentCents,
    liveSpentLabel: formatUsd(liveSpentCents),
    testCents,
    testLabel: formatUsd(testCents),
    reservedDraftCents,
    reservedDraftLabel: formatUsd(reservedDraftCents),
    liveReservedCents,
    liveReservedLabel: formatUsd(liveReservedCents),
    remainingCents: Math.max(0, capCents - liveReservedCents),
    remainingLabel: formatUsd(Math.max(0, capCents - liveReservedCents)),
    pendingReceiptCount: drafts.filter((draft) => ['pending', 'approved'].includes(draft.status)).length,
    settledDraftCount: drafts.filter((draft) => draft.status === 'settled' && !draft.promotedBlockId).length,
    overCap: liveReservedCents > capCents,
  };
}

export async function verifyStripeSignature(rawBody, header, secret, toleranceSeconds = 300, nowMs = Date.now()) {
  if (!secret || !header) return false;
  const parsed = parseStripeSignatureHeader(header);
  if (!parsed.timestamp || !parsed.signatures.length) return false;
  const age = Math.abs(Math.floor(nowMs / 1000) - parsed.timestamp);
  if (age > toleranceSeconds) return false;
  const expected = await hmacSha256Hex(secret, `${parsed.timestamp}.${rawBody}`);
  return parsed.signatures.some((signature) => timingSafeEqualHex(signature, expected));
}

function parseStripeSignatureHeader(header) {
  const parts = String(header)
    .split(',')
    .map((part) => part.trim().split('='));
  return {
    timestamp: Number(parts.find(([key]) => key === 't')?.[1]) || 0,
    signatures: parts.filter(([key]) => key === 'v1').map(([, value]) => value),
  };
}

async function hmacSha256Hex(secret, value) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a, b) {
  if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b)) return false;
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}
