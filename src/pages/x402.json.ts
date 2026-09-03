import type { APIRoute } from 'astro';
import {
  X402_CLIENT_EXAMPLE,
  X402_DISCOVERY,
  X402_PERMIT2,
  X402_PROXY,
  X402_TREASURY_AGENT_ID,
  X402_TREASURY_PUBLIC_KEY,
  X402_TREASURY_SPKI,
} from '../lib/x402';

export const prerender = true;

export const GET: APIRoute = async () => new Response(JSON.stringify({
  name: 'PointCast x402 signed receipt',
  description: 'Pay 0.01 USDC on Etherlink through x402 v2 Permit2 and receive a PointCast-countersigned receipt.',
  ...X402_DISCOVERY,
  permit2: X402_PERMIT2,
  permit2ProxySpender: X402_PROXY,
  flow: [
    'GET endpoint and decode the base64 JSON Payment-Required header.',
    'Sign PermitWitnessTransferFrom using the exact accepted terms.',
    'Retry with the base64 JSON Payment-Signature header.',
    'Receive the settled transaction plus canonical Ed25519-signed receipt.',
    'POST the receipt to verify or verify locally with the published raw key.',
  ],
  receiptSigner: {
    agentId: X402_TREASURY_AGENT_ID,
    algorithm: 'Ed25519',
    publicKeyRawBase64: X402_TREASURY_PUBLIC_KEY,
    publicKeySpkiBase64: X402_TREASURY_SPKI,
  },
  examples: {
    quote: `curl -si ${X402_DISCOVERY.endpoint}`,
    payerDryRun: 'node scripts/x402-client-example.mjs',
    payerLive: 'X402_PAYER_SK=0x... node scripts/x402-client-example.mjs',
    source: X402_CLIENT_EXAMPLE,
    verifyPost: `curl -sS -X POST ${X402_DISCOVERY.verify} -H 'content-type: application/json' --data '{"receipt":"<base64 receipt JSON>"}'`,
  },
  contacts: ['hello@pointcast.xyz', 'wallet@pointcast.xyz'],
  invitation: 'Agents welcome. Come make the first external-agent receipt with PointCast.',
}, null, 2), {
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  },
});
