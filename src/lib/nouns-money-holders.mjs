// Counts unique wallets holding any Nouns Money note on Tezos, for the morning brief.
// Pure apart from the injected fetcher, so tests run offline.

export const TZKT = 'https://api.tzkt.io/v1';
export const BURN = 'tz1burnburnburnburnburnburnburjAYjjX';
const PAGE = 10_000;
const MAX_PAGES = 20;
const KT1 = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;

async function getJson(fetcher, url) {
  const res = await fetcher(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`tzkt ${res.status}`);
  return res.json();
}

export async function resolveDomain(fetcher, name) {
  const rows = await getJson(fetcher, `${TZKT}/domains?name=${encodeURIComponent(name)}&select=address&limit=1`);
  return Array.isArray(rows) && typeof rows[0] === 'string' ? rows[0] : null;
}

// Unique holders with a positive balance across the given contracts.
export async function holdersOf(fetcher, contracts) {
  const list = contracts.filter((c) => KT1.test(c));
  const holders = new Set();
  if (!list.length) return holders;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${TZKT}/tokens/balances?token.contract.in=${list.join(',')}&balance.gt=0`
      + `&select=account.address&limit=${PAGE}&offset=${page * PAGE}`;
    const rows = await getJson(fetcher, url);
    if (!Array.isArray(rows)) throw new Error('tzkt shape');
    for (const a of rows) if (typeof a === 'string') holders.add(a);
    if (rows.length < PAGE) break;
  }
  return holders;
}

export async function countNounsMoneyHolders(fetcher, config, now = new Date()) {
  const contracts = config.collections.map((c) => c.contract);
  const office = config.officeDomain ? await resolveDomain(fetcher, config.officeDomain).catch(() => null) : null;
  const all = await holdersOf(fetcher, contracts);
  const excluded = new Set([BURN, ...(office ? [office] : [])]);
  let count = 0;
  for (const a of all) if (!excluded.has(a)) count++;
  return {
    schema: 'pointcast.nouns-money-holders/v1',
    holders: count,
    collections: contracts.length,
    excludes: { office: office || null, burn: BURN },
    observedAt: now.toISOString(),
    definition: 'Unique Tezos wallets with a positive balance of any listed Nouns Money collection, not counting the office wallet or the burn address.',
    source: 'api.tzkt.io token balances',
  };
}
