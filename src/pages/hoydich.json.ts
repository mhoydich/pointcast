import { portfolioPayload } from '../data/hoydich-portfolio.mjs';

export function GET() {
  return new Response(JSON.stringify(portfolioPayload()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
