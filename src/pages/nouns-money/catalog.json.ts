import { SOURCE_CATALOG } from '../../lib/nouns-money/catalog';
import { catalogForFlag } from '../../data/nouns-money-chain.ts';
export const GET = () => new Response(JSON.stringify(catalogForFlag(SOURCE_CATALOG)), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
