import {
  X402_TREASURY_AGENT_ID,
  X402_TREASURY_PUBLIC_KEY,
  buildReceiptPayload,
  decodeBase64Json,
  isJsonRecord,
  type JsonRecord,
  verifyX402Receipt,
} from '../../../src/lib/x402.ts';

const MAX_RECEIPT_B64 = 131_072;
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

const json = (body: unknown, status = 200) => new Response(
  JSON.stringify(body, null, 2),
  { status, headers: HEADERS },
);

async function readBoundedJson(request: Request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_RECEIPT_B64) throw new Error('request body is too large');
  if (!request.body) throw new Error('request body is required');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RECEIPT_B64) {
      await reader.cancel();
      throw new Error('request body is too large');
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return JSON.parse(text) as unknown;
}

function decodeReceipt(value: unknown): JsonRecord {
  if (isJsonRecord(value)) return value;
  if (typeof value !== 'string' || !value) throw new Error('receipt must be a base64 JSON string or object');
  if (value.length > MAX_RECEIPT_B64) throw new Error('receipt is too large');
  // URLSearchParams translates a raw + to a space. Proper callers should URL
  // encode the value, but accepting spaces makes the documented GET forgiving.
  const decoded = decodeBase64Json(value.replace(/ /g, '+'));
  if (!isJsonRecord(decoded)) throw new Error('decoded receipt must be a JSON object');
  return decoded;
}

export async function verifyReceiptRequest(
  request: Request,
  publicKeyBase64 = X402_TREASURY_PUBLIC_KEY,
) {
  let receipt: JsonRecord;
  try {
    if (request.method === 'GET') {
      receipt = decodeReceipt(new URL(request.url).searchParams.get('receipt'));
    } else if (request.method === 'POST') {
      const decodedBody = await readBoundedJson(request);
      if (!isJsonRecord(decodedBody)) throw new Error('request body must be a JSON object');
      const body = decodedBody;
      receipt = decodeReceipt(body.receipt ?? body);
    } else {
      return json({ error: 'Method not allowed' }, 405);
    }
  } catch (error: any) {
    return json({ valid: false, error: String(error?.message || error) }, 400);
  }

  const result = await verifyX402Receipt(receipt, publicKeyBase64);
  const signed = buildReceiptPayload(receipt);
  const receiptSignature = isJsonRecord(receipt.receipt_signature) ? receipt.receipt_signature : {};
  return json({
    valid: result.valid,
    reason: result.reason,
    receipt_id: receipt.id ?? null,
    signer: {
      agent_id: receiptSignature.kid ?? null,
      algorithm: receiptSignature.alg ?? null,
      recognized: receiptSignature.kid === X402_TREASURY_AGENT_ID,
    },
    settled: signed.settlement,
  }, result.valid ? 200 : 422);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: HEADERS });
export const onRequestGet = async ({ request }: { request: Request }) => verifyReceiptRequest(request);
export const onRequestPost = async ({ request }: { request: Request }) => verifyReceiptRequest(request);
