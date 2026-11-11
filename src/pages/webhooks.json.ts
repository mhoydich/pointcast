import type { APIRoute } from 'astro';
import catalog from '../data/webhook-catalog.json';
import { getFixtureInput } from '../lib/webhook-envelope.mjs';
export const GET: APIRoute = () => new Response(JSON.stringify({ ...catalog, contracts: catalog.contracts.map(contract => ({ ...contract, syntheticFixtureInput: getFixtureInput(contract.id) })) }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
