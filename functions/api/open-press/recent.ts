// Every mint creates a fresh token and credits all editions to the caller.
// TzKT indexes that ledger change as a transfer with a null source.
import contracts from '../../../src/data/contracts.json';

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method !== 'GET') {
    return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  }

  const headers = { 'Cache-Control': 'public, max-age=30' };
  const address = contracts.openPress.mainnet;
  if (!address) return Response.json([], { headers });

  const url = new URL('https://api.tzkt.io/v1/tokens/transfers');
  url.search = new URLSearchParams({
    'token.contract': address,
    'from.null': 'true',
    'sort.desc': 'id',
    limit: '20',
    select: 'token.tokenId as tokenId,to.address as creator,amount as editions,timestamp',
  }).toString();

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const mints = await response.json();
      if (Array.isArray(mints)) return Response.json(mints, { headers });
    }
  } catch {
    // A failed indexer read is distinguishable from a genuine empty feed.
  }
  return Response.json({ error: 'TzKT unavailable' }, {
    status: 502, headers: { 'Cache-Control': 'no-store' },
  });
};
