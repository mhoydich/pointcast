import {
  X402_JSON_HEADERS,
  getReceiptByTransaction,
  hashReceipt,
} from '../../../_lib/x402-gate.ts';

type ReceiptLookupEnv = Cloudflare.Env & { VISITS?: KVNamespace; AUTH_DB?: D1Database };
const TX_HASH = /^0x[0-9a-fA-F]{64}$/u;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: X402_JSON_HEADERS,
});

export async function handleReceiptByTransaction(env: ReceiptLookupEnv, rawHash: unknown): Promise<Response> {
  if (!env.VISITS && !env.AUTH_DB) return json({ ok: false, error: 'receipt-store-unavailable' }, 503);
  if (typeof rawHash !== 'string' || !TX_HASH.test(rawHash)) return json({ ok: false, error: 'receipt-not-found' }, 404);
  const receipt = await getReceiptByTransaction(env, rawHash);
  // Cabinet payments retain their signed receipt in D1 with the immutable
  // intent, so lookup does not depend on best-effort KV retention.
  if (!receipt && env.AUTH_DB) {
    try {
      const row = await env.AUTH_DB.prepare(`
        SELECT payment_receipt_json, payment_receipt_hash, payment_evidence_json
        FROM agent_cabinet_intents
        WHERE payment_tx_hash = ?
           OR json_extract(payment_evidence_json, '$.transactionHash') = ?
        LIMIT 1
      `).bind(rawHash.toLowerCase(), rawHash.toLowerCase()).first<{
        payment_receipt_json: string | null;
        payment_receipt_hash: string | null;
        payment_evidence_json: string | null;
      }>();
      const evidence = row?.payment_evidence_json ? JSON.parse(row.payment_evidence_json) : null;
      const stored: unknown = row?.payment_receipt_json
        ? JSON.parse(row.payment_receipt_json)
        : evidence?.receipt || null;
      const storedHash = row?.payment_receipt_hash || evidence?.receiptHash;
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        const candidate = stored as Record<string, unknown>;
        const settlement = candidate.settlement && typeof candidate.settlement === 'object' && !Array.isArray(candidate.settlement)
          ? candidate.settlement as Record<string, unknown>
          : null;
        if (candidate.action === 'cabinet_collect'
          && typeof settlement?.tx === 'string'
          && settlement.tx.toLowerCase() === rawHash.toLowerCase()
          && await hashReceipt(candidate) === storedHash) {
          return json({ ok: true, receipt: candidate });
        }
      }
    } catch {
      // A site revision without migration 0021 may still have KV or another
      // durable action fallback below. Missing/corrupt Cabinet data is not proof.
    }
  }
  // Nouns records retain the finalized proof atomically with the replay in D1.
  if ((!receipt || receipt.action === 'battler') && env.AUTH_DB) {
    const row = await env.AUTH_DB.prepare(`SELECT result_json FROM nouns_battler_records
      WHERE tx_hash = ? AND status = 'succeeded'`).bind(rawHash.toLowerCase()).first<{ result_json: string }>();
    const result = row?.result_json ? JSON.parse(row.result_json) : null;
    if (result?.receipt) return json({ ok: true, receipt: result.receipt });
  }
  return receipt ? json({ ok: true, receipt }) : json({ ok: false, error: 'receipt-not-found' }, 404);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: X402_JSON_HEADERS });
export const onRequestGet: PagesFunction<ReceiptLookupEnv> = async ({ env, params }) => (
  handleReceiptByTransaction(env, params.txHash)
);
