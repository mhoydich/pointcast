import { SOURCE_CATALOG } from '../../lib/nouns-money/catalog';
export const GET = () => new Response(JSON.stringify(SOURCE_CATALOG), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
