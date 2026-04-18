/**
 * /dao.json — machine-readable DAO state.
 *
 * v1: static proposals with windows + options + eligibility.
 * v1.1: append tallies from the KV-backed vote endpoint.
 */
import type { APIRoute } from 'astro';

const PROPOSALS = [
  {
    id: 'PC-0001',
    kind: 'treasury',
    title: 'Seed the El Segundo Real Estate Fund — 0.5 ꜩ / month from treasury',
    summary: 'Per Block 0241, start the DAO-owned real estate fund with a recurring 0.5 ꜩ/month seed from PointCast\'s Visit Nouns secondary royalty pool.',
    opensAt: '2026-04-18T12:00:00-08:00',
    closesAt: '2026-04-25T18:00:00-08:00',
    minEligibility: 'Visit Nouns FA2 holder OR DRUM holder',
    options: ['FOR', 'AGAINST', 'ABSTAIN'],
    referencesBlock: '0241',
  },
  {
    id: 'PC-0002',
    kind: 'schema',
    title: 'Add CH.CST as PointCast\'s 10th channel',
    summary: 'Make Cast a real 10th channel per BLOCKS.md, harmonizing the schema with the /cast kicker.',
    opensAt: '2026-04-18T12:00:00-08:00',
    closesAt: '2026-04-25T18:00:00-08:00',
    minEligibility: 'any connected wallet',
    options: ['FOR', 'AGAINST', 'ABSTAIN'],
  },
  {
    id: 'PC-0003',
    kind: 'cotd',
    title: 'Extend the Card of the Day roster from 21 to 50 Nouns',
    summary: 'Reduce repeat density on /battle from 3-week to 7-week rotations.',
    opensAt: '2026-04-18T12:00:00-08:00',
    closesAt: '2026-04-25T18:00:00-08:00',
    minEligibility: 'any connected wallet',
    options: ['FOR', 'AGAINST', 'ABSTAIN'],
  },
];

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    site: 'https://pointcast.xyz',
    version: 'v1',
    designPrinciples: [
      'author-curated proposals — zero free-text submission surface',
      'Beacon-signed votes — no gas, one signature per proposal',
      'binary outcomes (FOR/AGAINST/ABSTAIN) — no threads, no debates',
      'on-chain eligibility checks at sign time',
      'no-moderation by construction',
    ],
    proposals: PROPOSALS,
    links: {
      human: 'https://pointcast.xyz/dao',
      forAgents: 'https://pointcast.xyz/for-agents',
      manifesto: 'https://pointcast.xyz/manifesto',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
