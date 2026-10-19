import type { APIRoute } from 'astro';
import { ENJOY_URL, ENJOY_PUBLISHED, ENJOY_VERSION, ENJOY_STATUS, ENJOY_RULES, ENJOY_TOKENS, ENJOY_AGENTS, ENJOY_PHASES, ENJOY_DELIVERABLES } from '../../data/enjoy-money';

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'Enjoy. Money — Hoydich Enterprises paper notes + bot money',
  canonical: ENJOY_URL,
  publishedAt: ENJOY_PUBLISHED,
  version: ENJOY_VERSION,
  issuer: 'Hoydich Enterprises',
  author: 'Michael Hoydich',
  parent: 'https://pointcast.xyz/nouns-money/',
  chain: 'Tezos',
  status: ENJOY_STATUS,
  closedLoop: 'Nothing turns back into money, USDC or goods. Value can come in; it never goes out.',
  rules: ENJOY_RULES,
  tokens: ENJOY_TOKENS,
  agents: ENJOY_AGENTS,
  phases: ENJOY_PHASES,
  deliverables: ENJOY_DELIVERABLES,
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
