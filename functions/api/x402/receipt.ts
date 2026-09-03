/**
 * /api/x402/receipt — PointCast's x402 quote, settlement, and signed receipt.
 *
 * Permit2 validation and receipt construction are shared with paid town
 * actions in functions/_lib/x402-gate.ts. This route remains the public,
 * standalone receipt product and public receipt-list surface.
 */
import {
  X402_JSON_HEADERS,
  handleReceiptRequest,
  type X402ReceiptProduct,
} from '../../_lib/x402-gate.ts';

export { handleReceiptRequest, type X402ReceiptProduct };

export const onRequestOptions = async () =>
  new Response(null, { status: 204, headers: X402_JSON_HEADERS });

export const onRequestGet = async ({ request, env }: { request: Request; env: Cloudflare.Env }) =>
  handleReceiptRequest(request, env);
