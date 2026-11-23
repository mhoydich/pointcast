// GET /api/nouns-money/holders — the morning brief's headline number.
import config from '../../../src/data/nouns-money-collections.json' with { type: 'json' };
import { countNounsMoneyHolders, OFFICE_UNRESOLVED, PAGINATION_INCOMPLETE } from '../../../src/lib/nouns-money-holders.mjs';

const CACHE_SECONDS = 600;
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
};

export const onRequestGet: PagesFunction = async () => {
  try {
    const body = await countNounsMoneyHolders(fetch, config);
    return new Response(JSON.stringify(body, null, 2), { headers: HEADERS });
  } catch (error) {
    const reason = error instanceof Error ? error.message : null;
    return new Response(JSON.stringify({
      schema: 'pointcast.nouns-money-holders/v1',
      holders: null,
      error: reason === OFFICE_UNRESOLVED || reason === PAGINATION_INCOMPLETE ? reason : 'unavailable',
    }), { status: 503, headers: { ...HEADERS, 'Cache-Control': 'no-store' } });
  }
};
