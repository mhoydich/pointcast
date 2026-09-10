import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { handleAgentBench } from '../agent/bench.ts';
import { MAX_SITS_PER_DAY } from '../bench.ts';
import { benchDayKey } from '../../../src/lib/bench-questions.ts';
import { runtimeBody, RuntimeInputError, RUNTIME_ONLINE_MS, normalizeProviders, hashRuntimeSecret, runtimeSecret, type RuntimeRow } from '../../_lib/ai-runtimes.ts';
import { type PaidIntentRow } from '../../_lib/paid-town-actions.ts';
import { observePurchaseTransfer } from '../../_lib/x402-chain-proof.ts';
import { validateBuyerQuote, verifyBuyerReceipt, hashBuyerRequest } from '../../../src/lib/x402-buyer.ts';
import { canonicalJson, decodeBase64Json, isJsonRecord, X402_DEFAULT_ASSET, X402_DEFAULT_PAY_TO, X402_NETWORK } from '../../../src/lib/x402.ts';

const ENDPOINT = 'https://pointcast.xyz/api/agent/bench';
type Env = AuthEnv & Parameters<typeof handleAgentBench>[1] & { AI_PURCHASES_ENABLED?: string };
type Purchase = {
  id: string; user_id: string; runtime_id: string; request_id: string; question: string;
  quote_json: string; quote_hash: string; expires_at: number; action_key: string;
  status: 'quoted' | 'submitting' | 'unresolved' | 'failed' | 'delivered' | 'expired';
  payment_hash: string | null; payer: string | null; action_id: string | null; transaction_hash: string | null;
  receipt_json: string | null; result_json: string | null;
  receipt_verified: number; chain_verified: number; delivery_verified: number;
  proof_checked_at: number | null; error: string | null; created_at: number; updated_at: number;
};
type Options = { expectedPublicKey?: string; fetcher?: typeof fetch };
const failure = (reason: string, status = 400) => authJson({ ok: false, reason, error: reason }, { status });
const parse = (raw: string | null) => raw === null ? null : JSON.parse(raw);
function view(row: Purchase) {
  return { id: row.id, runtimeId: row.runtime_id, status: row.status, question: row.question,
    amount: '10000', symbol: 'USDC', displayAmount: '0.01', network: X402_NETWORK,
    asset: X402_DEFAULT_ASSET, payTo: X402_DEFAULT_PAY_TO, endpoint: ENDPOINT,
    quote: parse(row.quote_json), quoteHash: row.quote_hash, expiresAt: row.expires_at,
    payer: row.payer, actionId: row.action_id, transactionHash: row.transaction_hash,
    receipt: parse(row.receipt_json), result: parse(row.result_json),
    receiptVerified: row.receipt_verified === 1, chainVerified: row.chain_verified === 1,
    deliveryVerified: row.delivery_verified === 1, proofCheckedAt: row.proof_checked_at,
    error: row.error, createdAt: row.created_at, updatedAt: row.updated_at };
}
function available(env: Env) {
  return env.AI_PURCHASES_ENABLED === 'true' && !!env.AUTH_DB && !!env.VISITS && !!env.X402_RECEIPT_SK;
}
function cleanQuestion(value: unknown) {
  if (typeof value !== 'string' || value.length > 280) throw new RuntimeInputError('question-must-be-1-to-280-characters');
  const question = value.replace(/[<>]/g, '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!question) throw new RuntimeInputError('question-must-be-1-to-280-characters');
  return question;
}
async function runtimes(db: D1Database, owner: string, now: number) {
  const rows = await db.prepare(`SELECT * FROM ai_runtimes WHERE user_id = ? AND token_hash IS NOT NULL
    AND token_expires_at > ? AND last_seen_at > ? AND last_success_at IS NOT NULL ORDER BY created_at DESC`)
    .bind(owner, now, now - RUNTIME_ONLINE_MS).all<RuntimeRow>();
  const result = [];
  for (const row of rows.results) {
    const providers = normalizeProviders(parse(row.providers_json));
    const jobs = await db.prepare(`SELECT provider,result_json FROM ai_runtime_jobs WHERE runtime_id = ? AND user_id = ?
      AND kind = 'prompt' AND status = 'succeeded' ORDER BY finished_at DESC LIMIT 30`)
      .bind(row.id, owner).all<{ provider: string; result_json: string }>();
    const verified = jobs.results.find(job => providers.some(p => p.provider === job.provider && p.available
      && p.authenticated && p.authMode === 'subscription') && Array.isArray(parse(job.result_json)?.actualModels)
      && parse(job.result_json).actualModels.length > 0);
    if (verified) result.push({ id: row.id, label: row.label, provider: verified.provider,
      model: parse(verified.result_json).actualModels.join(', ') });
  }
  return result;
}
async function load(db: D1Database, id: string, owner: string) {
  return db.prepare('SELECT * FROM ai_purchases WHERE id = ? AND user_id = ?').bind(id, owner).first<Purchase>();
}
async function expire(db: D1Database, owner: string, now: number) {
  await db.prepare(`UPDATE ai_purchases SET status = 'expired', updated_at = ?
    WHERE user_id = ? AND status = 'quoted' AND expires_at <= ?`).bind(now, owner, now).run();
}
function benchRequest(question: string, signature?: string, key?: string) {
  return new Request(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json',
    ...(signature ? { 'Payment-Signature': signature, 'Idempotency-Key': key! } : {}) },
    body: JSON.stringify({ question }) });
}
async function quoteFor(env: Env, question: string, options: Options) {
  const index = await env.VISITS?.get(`bench:index:${benchDayKey(Date.now())}`, 'json');
  if (Array.isArray(index) && index.length >= MAX_SITS_PER_DAY) throw new RuntimeInputError('bench-full-before-payment', 409);
  const response = await handleAgentBench(benchRequest(question), env, options);
  const header = response.headers.get('Payment-Required');
  if (response.status !== 402 || !header) throw new RuntimeInputError('purchase-quote-unavailable', 503);
  const quote = decodeBase64Json(header);
  validateBuyerQuote(quote, { endpoint: ENDPOINT, amountUnits: '10000' });
  return quote;
}

/** Reconciliation is read-only with respect to payment and public publication.
 * A lost response can recover the existing result. Ambiguous settlement or a
 * failed delivery is held for investigation; it never authorizes a new charge.
 */
async function reconcile(env: Env, row: Purchase, options: Options): Promise<Purchase> {
  if (!row.payment_hash) return row;
  const db = env.AUTH_DB!;
  const intent = await db.prepare(`SELECT * FROM paid_action_intents WHERE action = 'bench' AND idempotency_key = ?`)
    .bind(row.action_key).first<PaidIntentRow>();
  let status: Purchase['status'] = 'unresolved', error: string | null = 'The purchase outcome is not yet known. Check this attempt again; do not pay again.';
  let receipt: unknown = null, result: unknown = null, receiptVerified = false, chainVerified = false, deliveryVerified = false;
  let transactionHash: string | null = null;
  if (intent && intent.request_hash === await hashBuyerRequest('bench', { question: row.question })) {
    if (intent.status === 'settlement_failed') {
      status = 'failed'; error = 'Payment was not completed. This attempt will not be resubmitted.';
    } else if (['settled', 'acting', 'action_failed'].includes(intent.status)) {
      error = 'Payment is recorded, but public delivery needs investigation. Do not pay again.';
    }
    const settlement = parse(intent.settlement_json);
    receipt = settlement?.receipt ?? null;
    transactionHash = intent.tx_hash;
    if (receipt && row.payer) {
      const quote = validateBuyerQuote(parse(row.quote_json), { endpoint: ENDPOINT, amountUnits: '10000', nowMs: row.created_at });
      const proof = await verifyBuyerReceipt(receipt, { quote, payer: row.payer, action: 'bench',
        requestBody: { question: row.question }, actionId: intent.id,
        ...(intent.tx_hash ? { transactionHash: intent.tx_hash } : {}), publicKey: options.expectedPublicKey });
      receiptVerified = proof.valid;
      if (proof.valid && 'transactionHash' in proof) {
        transactionHash = proof.transactionHash;
        chainVerified = await observePurchaseTransfer(transactionHash, row.payer, options.fetcher);
        const signed = (receipt as Record<string, any>).action_result;
        const sit = signed?.bench?.sit;
        // Proof comes from the signed receipt and an actual persisted record and
        // day index, not the HTTP success flag (index writes can fail separately).
        if (intent.status === 'succeeded' && sit && typeof sit.id === 'string' && /^\d{13}-[a-z0-9]{1,16}$/.test(sit.id)
          && typeof sit.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sit.day) && sit.answer === row.question) {
          const stored = await env.VISITS?.get(`bench:sit:${sit.id}`, 'json');
          const index = await env.VISITS?.get(`bench:index:${sit.day}`, 'json');
          deliveryVerified = isJsonRecord(stored) && canonicalJson(stored) === canonicalJson(sit)
            && Array.isArray(index) && index.includes(sit.id);
          if (deliveryVerified) result = { sit, url: `https://pointcast.xyz/api/bench?day=${encodeURIComponent(sit.day)}` };
        }
        if (deliveryVerified) { status = 'delivered'; error = chainVerified ? null : 'Public delivery and receipt verified. The independent chain transfer check is pending.'; }
        else error = 'The payment receipt is valid, but public delivery is not yet verified. Do not pay again.';
      } else if (intent.status === 'succeeded') error = 'The result is recorded, but its payment receipt could not be verified. Do not pay again.';
    }
  }
  const now = Date.now();
  // Avoid an older overlapping check replacing a later completed proof.
  await db.prepare(`UPDATE ai_purchases SET status=?, action_id=?, transaction_hash=?, receipt_json=?, result_json=?,
    receipt_verified=?, chain_verified=?, delivery_verified=?, proof_checked_at=?, error=?, updated_at=?
    WHERE id=? AND user_id=? AND (proof_checked_at IS NULL OR proof_checked_at <= ?)`)
    .bind(status, intent?.id ?? null, transactionHash, receipt ? JSON.stringify(receipt) : null, result ? JSON.stringify(result) : null,
      +receiptVerified, +chainVerified, +deliveryVerified, now, error, now, row.id, row.user_id, row.updated_at).run();
  return (await load(db, row.id, row.user_id))!;
}

export async function handleAiPurchases(request: Request, env: Env, options: Options = {}): Promise<Response> {
  if (request.method !== 'GET' && request.headers.get('origin') !== new URL(request.url).origin) return failure('origin-not-allowed', 403);
  if (!env.AUTH_DB) return failure('ai-purchases-unavailable', 503);
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return failure('unauthorized', 401);
    const db = env.AUTH_DB, owner = current.user.userId, now = Date.now();
    await expire(db, owner, now);
    if (request.method === 'GET') {
      const rows = await db.prepare('SELECT * FROM ai_purchases WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
        .bind(owner).all<Purchase>();
      return authJson({ ok: true, available: available(env),
        ...(!available(env) ? { unavailableReason: 'Paid visits are not enabled yet. Your AI can still help you prepare a question.' } : {}),
        runtimes: await runtimes(db, owner, now), purchases: rows.results.map(view) });
    }
    const body = await runtimeBody(request, 24_576);
    if (body.operation === 'quote') {
      if (!available(env)) return failure('ai-purchases-not-enabled', 503);
      if (typeof body.requestId !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(body.requestId)) return failure('invalid-request-id');
      const question = cleanQuestion(body.question);
      const previous = await db.prepare('SELECT * FROM ai_purchases WHERE user_id = ? AND request_id = ?')
        .bind(owner, body.requestId).first<Purchase>();
      if (previous) return previous.runtime_id === body.runtimeId && previous.question === question
        ? authJson({ ok: true, purchase: view(previous) }) : failure('request-conflict', 409);
      if (!(await runtimes(db, owner, now)).some(row => row.id === body.runtimeId)) return failure('verified-ai-must-be-online', 409);
      const rawQuote = await quoteFor(env, question, options);
      const id = 'pcp_' + crypto.randomUUID().replaceAll('-', '');
      const expires = now + 60_000;
      const quoteHash = await hashRuntimeSecret(canonicalJson({ id, runtimeId: body.runtimeId, question, quote: rawQuote, expiresAt: expires }));
      const inserted = await db.prepare(`INSERT OR IGNORE INTO ai_purchases
        (id,user_id,runtime_id,request_id,question,quote_json,quote_hash,expires_at,action_key,status,created_at,updated_at)
        SELECT ?,?,?,?,?,?,?,?,?,'quoted',?,? WHERE
        (SELECT COUNT(*) FROM ai_purchases WHERE user_id=? AND created_at>?) < 30 RETURNING id`)
        .bind(id, owner, body.runtimeId, body.requestId, question, JSON.stringify(rawQuote), quoteHash, expires,
          'pcp_' + runtimeSecret(), now, now, owner, now - 3_600_000).first<{ id: string }>();
      if (!inserted) {
        const raced = await db.prepare('SELECT * FROM ai_purchases WHERE user_id=? AND request_id=?').bind(owner, body.requestId).first<Purchase>();
        if (raced && raced.runtime_id === body.runtimeId && raced.question === question) return authJson({ ok: true, purchase: view(raced) });
        return failure('resolve-or-cancel-your-existing-purchase-before-starting-another', 409);
      }
      return authJson({ ok: true, purchase: view((await load(db, id, owner))!) }, { status: 201 });
    }
    if (typeof body.purchaseId !== 'string' || !/^pcp_[0-9a-f]{32}$/.test(body.purchaseId)) return failure('invalid-purchase');
    let row = await load(db, body.purchaseId, owner);
    if (!row) return failure('purchase-not-found', 404);
    if (body.operation === 'reconcile') return authJson({ ok: true, purchase: view(await reconcile(env, row, options)) });
    if (body.operation === 'cancel') {
      await db.prepare(`UPDATE ai_purchases SET status='expired',updated_at=? WHERE id=? AND user_id=? AND status='quoted'`).bind(now, row.id, owner).run();
      return authJson({ ok: true, purchase: view((await load(db, row.id, owner))!) });
    }
    if (body.operation !== 'submit') return failure('invalid-operation');
    // Repeat submissions are reads, including after disconnect or pilot disable.
    if (row.payment_hash) return authJson({ ok: true, purchase: view(await reconcile(env, row, options)) });
    if (!available(env)) return failure('ai-purchases-not-enabled', 503);
    if (body.confirmPublic !== true) return failure('public-publication-approval-required');
    if (body.quoteHash !== row.quote_hash) return failure('quote-does-not-match-review', 409);
    if (row.status !== 'quoted' || row.expires_at <= now) return failure('payment-quote-expired', 409);
    if (!(await runtimes(db, owner, now)).some(runtime => runtime.id === row!.runtime_id)) return failure('verified-ai-must-be-online', 409);
    if (canonicalJson(await quoteFor(env, row.question, options)) !== canonicalJson(parse(row.quote_json))) return failure('payment-terms-changed', 409);
    if (typeof body.paymentSignature !== 'string' || !body.paymentSignature || body.paymentSignature.length > 16_384) return failure('invalid-payment-signature');
    let payload;
    try { payload = decodeBase64Json(body.paymentSignature); } catch { return failure('invalid-payment-signature'); }
    const permit = payload?.payload?.permit2Authorization;
    if (!isJsonRecord(payload) || canonicalJson(payload.accepted) !== canonicalJson(parse(row.quote_json).accepts[0])
      || canonicalJson(payload.resource) !== canonicalJson(parse(row.quote_json).resource)
      || !isJsonRecord(permit) || typeof permit.from !== 'string' || !/^0x[0-9a-f]{40}$/i.test(permit.from)
      || typeof permit.deadline !== 'string' || !/^\d{1,10}$/.test(permit.deadline)
      || Number(permit.deadline) > Math.floor(row.expires_at / 1000)) return failure('payment-does-not-match-review');
    const paymentHash = await hashRuntimeSecret(canonicalJson(payload));
    if (Number(permit.deadline) <= Math.floor(Date.now() / 1000) + 15) return failure('payment-window-too-short', 409);
    const reserved = await db.prepare(`UPDATE OR IGNORE ai_purchases SET status='submitting', payment_hash=?, payer=?,updated_at=?
      WHERE id=? AND user_id=? AND status='quoted' AND expires_at>?
      AND EXISTS (SELECT 1 FROM ai_runtimes WHERE id=ai_purchases.runtime_id AND user_id=?
        AND token_hash IS NOT NULL AND token_expires_at>? AND last_seen_at>?) RETURNING id`)
      .bind(paymentHash, permit.from.toLowerCase(), Date.now(), row.id, owner, Date.now(), owner, Date.now(), Date.now() - RUNTIME_ONLINE_MS).first();
    if (!reserved) return failure('purchase-already-submitted-or-no-longer-available', 409);
    // No stored authorizations, outbound cookies, or provider credentials.
    try { await handleAgentBench(benchRequest(row.question, body.paymentSignature, row.action_key), env, options); }
    catch { /* The durable reservation survives a timeout or lost response. */ }
    row = (await load(db, row.id, owner))!;
    return authJson({ ok: true, purchase: view(await reconcile(env, row, options)) });
  } catch (error) {
    if (error instanceof RuntimeInputError) return failure(error.message, error.status);
    // Never echo wallet payloads or provider errors into a response or log.
    return failure('purchase-status-unavailable-check-existing-attempt', 503);
  }
}

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => handleAiPurchases(request, env);
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleAiPurchases(request, env);
