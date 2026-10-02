import type { APIRoute } from 'astro';
import { chapters, sources, authorship, copyright, verifiedDate } from '../data/bukowski';
export const GET: APIRoute = () => new Response(JSON.stringify({ title: 'Charles Bukowski / The ordinary stays', url: 'https://pointcast.xyz/bukowski/', authorship, copyright, verifiedDate, chapters, sources }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
