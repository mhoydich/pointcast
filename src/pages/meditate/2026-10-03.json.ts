import type { APIRoute } from 'astro';
import edition from '../../data/saturday-meditation-2026-10-03.json';
import { movements } from '../../lib/saturday-session.mjs';
export const GET: APIRoute = () => new Response(JSON.stringify({ ...edition, route: '/meditate/2026-10-03', movements, sessionMinutes: [3, 5, 8], defaultMinutes: 5 }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
