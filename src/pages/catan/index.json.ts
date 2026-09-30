import type { APIRoute } from 'astro';
import {
  CATAN_VERSION, CATAN_ORIGIN, CATAN_MIRROR, CATAN_SITE, CATAN_LAUNCHED_ON, CATAN_ENDPOINTS, HOUSE_NOTES,
  EDITIONS, PACES, RESOURCES, TWO_D6_WAYS, SEAL_ROLLS, forgeBoard,
} from '../../lib/catan';

export const GET: APIRoute = () => {
  const body = {
    version: CATAN_VERSION,
    name: 'Hex & Harbor',
    what: 'An unofficial fan club for Catan tables: local meetups, a balanced board forge, fair dice, and a sealed-dice table for agents over x402.',
    home: `${CATAN_ORIGIN}/`,
    mirror: `${CATAN_MIRROR}/`,
    opened: CATAN_LAUNCHED_ON,
    publisher: { name: 'PointCast', url: CATAN_SITE, place: 'El Segundo, CA' },
    endpoints: CATAN_ENDPOINTS.map((e) => ({ ...e, url: `${CATAN_SITE}${e.href}` })),
    hostTable: {
      method: 'POST',
      url: `${CATAN_SITE}/api/catan/tables`,
      example: { title: 'Tuesday hex night', city: 'El Segundo, CA', venue: 'library community room', when: '2026-10-13T18:30:00-07:00', seats: 4, edition: 'base', pace: 'casual', host: 'sheepforwheat', note: 'Teaching game at 6.' },
      editions: EDITIONS,
      paces: PACES,
      budget: '3 new tables per IP per 10 minutes; 12 seat changes per IP per 10 minutes',
    },
    paidAction: {
      action: 'catan-seal',
      protocol: 'x402 v2',
      network: 'eip155:42793 (Etherlink)',
      price: { amount: '0.01', currency: 'USDC', units: '10000', decimals: 6 },
      split: '50% house / 50% network',
      endpoint: `${CATAN_SITE}/api/agent/catan-seal`,
      body: { title: 'string ≤60, optional', players: '2-6, default 4', seed: 'board seed words, optional' },
      headers: ['Idempotency-Key (8-128 chars, required with payment)', 'Payment-Signature (base64 x402 v2); omit to receive a 402 quote'],
      returns: 'seal {id, commitment, board, url}, rollKey (keep private), receipt, split',
      rolls: SEAL_ROLLS,
      verify: 'commitment = sha256("pointcast.catan.seal:" + secret); roll i = sha256(secret + ":" + i), hex byte pairs, skip bytes >= 252, die = byte % 6 + 1',
      desk: `${CATAN_SITE}/x402`,
    },
    mcp: { server: `${CATAN_SITE}/api/mcp`, tools: ['catan_tables', 'catan_board'] },
    resources: Object.fromEntries(Object.entries(RESOURCES).map(([k, v]) => [k, { label: v.label, terrain: v.terrain, art: `${CATAN_SITE}${v.art}` }])),
    diceWaysOf36: TWO_D6_WAYS,
    sampleBoard: forgeBoard('harbor'),
    notes: HOUSE_NOTES,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
