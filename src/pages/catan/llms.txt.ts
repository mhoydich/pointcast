import type { APIRoute } from 'astro';
import { CATAN_ORIGIN, CATAN_SITE, CATAN_LAUNCHED_ON, CATAN_ENDPOINTS, HOUSE_NOTES, EDITIONS, PACES, SEAL_ROLLS } from '../../lib/catan';

export const GET: APIRoute = () => {
  const lines = [
    '# Hex & Harbor',
    '',
    `> An unofficial fan club for Catan tables, from PointCast in El Segundo, California. Find or host local game nights, forge a balanced board, roll fair dice, and open a sealed-dice table for agents over x402. Opened ${CATAN_LAUNCHED_ON}. Home: ${CATAN_ORIGIN}/ (mirror: ${CATAN_SITE}/catan/).`,
    '',
    '## Endpoints (JSON, CORS open)',
    ...CATAN_ENDPOINTS.map((e) => `- ${e.method} ${CATAN_SITE}${e.href}: ${e.label}`),
    '',
    '## Hosting a table',
    `- Fields: title, city, venue (a public place), when (ISO 8601 with offset), seats 2-6, edition (${EDITIONS.join(' | ')}), pace (${PACES.join(' | ')}), host handle, optional note and https link.`,
    '- The response includes hostKey once. Keep it; it is the only way to cancel.',
    '',
    '## The Sealed Table (x402)',
    `- POST ${CATAN_SITE}/api/agent/catan-seal with {title?, players?, seed?}. Without Payment-Signature you receive an HTTP 402 quote (0.01 USDC on Etherlink, eip155:42793). Retry with Payment-Signature and an Idempotency-Key.`,
    `- You receive a seal id, a sha256 commitment, a forged board, and a private rollKey. POST ${CATAN_SITE}/api/catan/seal {id, rollKey, action:"roll"} turns over the next of ${SEAL_ROLLS} rolls; action "reveal" ends the table and publishes the secret.`,
    '- Verify: sha256("pointcast.catan.seal:" + secret) equals the commitment; roll i is sha256(secret + ":" + i) read as hex byte pairs, skipping bytes >= 252, die = byte % 6 + 1.',
    '',
    '## The Daily Island',
    `- GET ${CATAN_SITE}/api/catan/daily returns today's forged board, 54 corner vertices (id, hexes, harbour, neighbour ids), par and the leaderboard. Page: ${CATAN_ORIGIN}/daily`,
    `- POST ${CATAN_SITE}/api/catan/daily {handle, a, b, kind:"agent"} places two settlements. Score = pips touched + 2 per distinct resource + harbour bonus (+3 for a 2:1 harbour you produce for, +1 for a 3:1). One entry per handle per Pacific day. Past days (?date=) reveal the best pair.`,
    '',
    '## Calendar and flyers',
    `- ${CATAN_SITE}/api/catan/ics is a subscribable feed of all tables (?city= filters, ?id= one invite). ${CATAN_SITE}/catan/flyer/?id= prints a table flyer with a QR code.`,
    '',
    '## MCP',
    `- ${CATAN_SITE}/api/mcp exposes catan_tables({city?}), catan_board({seed?}) and catan_daily({date?}).`,
    '',
    '## House notes',
    ...HOUSE_NOTES.map((n) => `- ${n}`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
};
