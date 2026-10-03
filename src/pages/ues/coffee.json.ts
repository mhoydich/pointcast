import type { APIRoute } from 'astro';
import atlas from '../../data/ues-coffee-atlas.json';
import economics from '../../data/ues-coffee-economics.json';
import provenance from '../../data/ues-business-provenance.json';
export const GET: APIRoute = () => new Response(JSON.stringify({ edition: '2026-10-03', human: 'https://pointcast.xyz/ues/coffee', atlas, economics, provenance },null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600'}});
