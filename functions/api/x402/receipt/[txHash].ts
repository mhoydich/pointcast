import {
  X402_JSON_HEADERS,
  getReceiptByTransaction,
} from '../../../_lib/x402-gate.ts';

type ReceiptLookupEnv = Cloudflare.Env & { VISITS?: KVNamespace };
const TX_HASH = /^0x[0-9a-fA-F]{64}$/u;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: X402_JSON_HEADERS,
});

export async function handleReceiptByTransaction(env: ReceiptLookupEnv, rawHash: unknown): Promise<Response> {
  if (!env.VISITS) return json({ ok: false, error: 'receipt-store-unavailable' }, 503);
  if (typeof rawHash !== 'string' || !TX_HASH.test(rawHash)) return json({ ok: false, error: 'receipt-not-found' }, 404);
  const receipt = await getReceiptByTransaction(env, rawHash);
  return receipt ? json({ ok: true, receipt }) : json({ ok: false, error: 'receipt-not-found' }, 404);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: X402_JSON_HEADERS });
export const onRequestGet: PagesFunction<ReceiptLookupEnv> = async ({ env, params }) => (
  handleReceiptByTransaction(env, params.txHash)
);
