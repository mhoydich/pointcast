// Public, read-only TzKT data. Kept browser-safe and independent of the count API.
export const TZKT = 'https://api.tzkt.io/v1';
export const BURN = 'tz1burnburnburnburnburnburnburjAYjjX';
const ACCOUNT = /^(?:tz[1-5]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/;
const CONTRACT = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;
const PAGE = 100;
const MAX_PAGES = 20;

const addressOf = value => typeof value === 'string' ? value : value?.address;
const tezName = value => typeof value === 'string' && /^[^\s<>/]+\.tez$/i.test(value);

export function safeImageUrl(value) {
  if (typeof value !== 'string') return null;
  if (value.startsWith('ipfs://')) value = `https://ipfs.io/ipfs/${value.slice(7).replace(/^ipfs\//, '')}`;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function shapeNewestHolders(transfers, { office, collections, domains = [], now = Date.now() }) {
  if (!ACCOUNT.test(office) || !Array.isArray(transfers)) return [];
  const allowed = new Set(collections.map(c => c.contract).filter(c => CONTRACT.test(c)));
  const names = new Map();
  for (const domain of domains) {
    const address = addressOf(domain?.address);
    if (ACCOUNT.test(address) && domain.reverse === true && tezName(domain.name)
      && Date.parse(domain.expiration) > Number(now)) names.set(address, domain.name);
  }
  const newest = [...transfers].filter(row => {
    const to = addressOf(row?.to);
    return ACCOUNT.test(to) && to !== office && to !== BURN && to !== addressOf(row?.from)
      && allowed.has(addressOf(row?.token?.contract)) && /^\d+$/.test(String(row?.token?.tokenId ?? ''))
      && /^\d+$/.test(String(row?.amount ?? '')) && BigInt(row.amount) > 0n
      && Number.isFinite(Date.parse(row?.timestamp));
  }).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp) || b.id - a.id);
  const seen = new Set();
  const holders = [];
  for (const row of newest) {
    const address = addressOf(row.to);
    if (seen.has(address)) continue;
    seen.add(address);
    const contract = addressOf(row.token.contract);
    const tokenId = String(row.token.tokenId);
    const metadata = row.token.metadata || {};
    holders.push({
      address,
      label: names.get(address) || (tezName(row.to.alias) ? row.to.alias : `${address.slice(0, 6)}…${address.slice(-4)}`),
      contract, tokenId,
      name: typeof metadata.name === 'string' && metadata.name.trim() ? metadata.name : `Nouns Money note #${tokenId}`,
      thumbnail: [metadata.thumbnailUri, metadata.displayUri, metadata.image].map(safeImageUrl).find(Boolean) || null,
      objktUrl: `https://objkt.com/tokens/tezos/${contract}/${tokenId}`,
      timestamp: new Date(row.timestamp).toISOString(),
    });
    if (holders.length === 12) break;
  }
  return holders;
}

export function relativeTime(timestamp, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((Number(now) - Date.parse(timestamp)) / 1000));
  if (!Number.isFinite(seconds) || seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export async function fetchNewestHolders(fetcher, config, { now = new Date(), signal } = {}) {
  const contracts = config.collections.map(c => c.contract);
  if (!contracts.length || !contracts.every(c => CONTRACT.test(c)) || !tezName(config.officeDomain)) throw new Error('Invalid collection config');
  const get = async (path, params) => {
    const timeout = AbortSignal.timeout(12_000);
    const response = await fetcher(`${TZKT}/${path}?${new URLSearchParams(params)}`, {
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) throw new Error('TzKT unavailable');
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Invalid TzKT response');
    return rows;
  };
  // Full domain rows avoid the count endpoint's address-projection issue (#1929).
  const officeRows = await get('domains', { name: config.officeDomain, 'expiration.gt': now.toISOString(), limit: '1' });
  const office = addressOf(officeRows[0]?.address);
  if (officeRows.length !== 1 || !ACCOUNT.test(office) || officeRows[0].name !== config.officeDomain
    || !(Date.parse(officeRows[0].expiration) > now.getTime())) throw new Error('Office address unavailable');
  const options = { office, collections: config.collections, now: now.getTime() };
  const transfers = [];
  let cursor;
  let holders = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = {
      'token.contract.in': contracts.join(','), 'to.ni': `${office},${BURN}`,
      'to.null': 'false', 'amount.gt': '0', 'sort.desc': 'id', limit: String(PAGE),
      ...(cursor === undefined ? {} : { 'id.lt': String(cursor) }),
    };
    const rows = await get('tokens/transfers', params);
    if (rows.length > PAGE) throw new Error('Invalid transfer page');
    transfers.push(...rows);
    holders = shapeNewestHolders(transfers, options);
    if (holders.length === 12 || rows.length < PAGE) break;
    const next = rows.at(-1)?.id;
    if (!Number.isSafeInteger(next) || next < 0 || (cursor !== undefined && next >= cursor) || page === MAX_PAGES - 1) {
      throw new Error('Incomplete transfer history');
    }
    cursor = next;
  }
  if (!holders.length) return [];
  // Optional names: an enrichment outage can still show shortened addresses.
  try {
    const domains = await get('domains', {
      'address.in': holders.map(h => h.address).join(','), reverse: 'true',
      'expiration.gt': now.toISOString(), limit: '100', select: 'name,address,expiration,reverse',
    });
    holders = shapeNewestHolders(transfers, { ...options, domains });
  } catch { /* The recipient read succeeded; names are optional. */ }
  return holders;
}
