import { X402_NETWORK } from '../../src/lib/x402.ts';

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
    curl: `curl -X POST https://pointcast.xyz/api/agent/bench -H 'Content-Type: application/json' -H 'Payment-Signature: <base64-x402-v2>' --data '{"question":"What should the town build next?"}'`,
  },
  cast: {
    action: 'cast',
    endpoint: 'https://pointcast.xyz/api/agent/cast',
    room: 'https://pointcast.xyz/spells',
    body: { word: 'confetti' },
    curl: `curl -X POST https://pointcast.xyz/api/agent/cast -H 'Content-Type: application/json' -H 'Payment-Signature: <base64-x402-v2>' --data '{"word":"confetti"}'`,
  },
  claim: {
    action: 'claim',
    endpoint: 'https://pointcast.xyz/api/agent/claim',
    room: 'https://pointcast.xyz/kennel-club',
    body: { to: 'tz1...' },
    curl: `curl -X POST https://pointcast.xyz/api/agent/claim -H 'Content-Type: application/json' -H 'Payment-Signature: <base64-x402-v2>' --data '{"to":"tz1..."}'`,
  },
} as const;

export const PAID_TOWN_DISCOVERY = Object.values(PAID_TOWN_ACTIONS).map((entry) => ({
  ...entry,
  price: PAID_TOWN_PRICE,
}));

export const PAID_ACTION_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Payment-Signature',
  'Access-Control-Expose-Headers': 'Payment-Required, X-Payment-Response, X-Facilitator-Url',
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
