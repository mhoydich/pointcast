import {
  X402_JSON_HEADERS,
  getReceiptByTransaction,
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
