/** /points/schema.json — JSON Schema for one Network Points ledger line. */
import type { APIRoute } from 'astro';
import { POINT_KINDS, POINTS_SCHEMA, NOUNS_MONEY_EDITIONS } from '../../lib/network-points.mjs';

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://pointcast.xyz/points/schema.json',
  title: 'Network Points ledger line',
  description: 'One append-only line of the open Network Points ledger. id is the SHA-256 of canonicalLine(line); prev is the id of the same profile\'s previous line, or "genesis". Collectible marks with no cash value.',
  type: 'object',
  required: ['schema', 'id', 'prev', 'profile', 'kind', 'points', 'note', 'edition', 'site', 'ref', 'day', 'place', 'at'],
  additionalProperties: false,
  properties: {
    schema: { const: POINTS_SCHEMA },
    id: { type: 'string', pattern: '^[0-9a-f]{64}$' },
    prev: { type: 'string', pattern: '^(genesis|[0-9a-f]{64})$' },
    profile: { type: 'string', pattern: '^[0-9a-f]{24}$', description: 'Opaque profile id. Never an email, name or wallet.' },
    kind: { enum: Object.keys(POINT_KINDS) },
    points: { type: 'integer', minimum: 0, maximum: 100 },
    note: { enum: [null, ...new Set(NOUNS_MONEY_EDITIONS.flatMap((e) => e.notes.map((n) => n.id)))] },
    edition: { enum: NOUNS_MONEY_EDITIONS.map((e) => e.id) },
    site: { type: 'string', maxLength: 64 },
    ref: { type: 'string', maxLength: 160, description: 'The source event id (a check-in id, drum:<day>). Makes awards idempotent.' },
    day: { type: 'string', format: 'date' },
    place: { type: 'string', maxLength: 80, description: 'Coarse town name, or empty. Never coordinates.' },
    at: { type: 'string', format: 'date-time' },
  },
};

export const GET: APIRoute = () => new Response(JSON.stringify(schema, null, 2), {
  headers: { 'Content-Type': 'application/schema+json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
});
