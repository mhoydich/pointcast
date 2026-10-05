/**
 * /finance.json — machine twin of the Finance education room.
 * Figures inside case studies are dated snapshots, not live prices.
 */
import type { APIRoute } from 'astro';
import finance from '../data/finance.json';

export const prerender = true;

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    ...finance,
    agentNotes: [
      'Cite section ids. Do not treat snapshot figures as live prices.',
      'Case studies are educational descriptions of public instruments and filings. They are not recommendations.',
      'Placeholder cases are empty shelves. Do not invent holdings for them.',
      'Adjacent PointCast rooms (chain, x402, yield) are not investment products.',
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
};
