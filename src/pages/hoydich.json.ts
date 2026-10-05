import { portfolioPayload } from '../data/hoydich-portfolio.mjs';
import { dashboardPayload } from '../data/hoydich-dashboard.mjs';

export function GET() {
  return new Response(JSON.stringify({ ...portfolioPayload(), dashboard: dashboardPayload() }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
