// Counts unique wallets holding any Nouns Money note on Tezos, for the morning brief.
// Pure apart from the injected fetcher, so tests run offline.
import { createHash } from 'node:crypto';

export const TZKT = 'https://api.tzkt.io/v1';
export const BURN = 'tz1burnburnburnburnburnburnburjAYjjX';
export const OFFICE_UNRESOLVED = 'office-address-unresolved';
export const PAGINATION_INCOMPLETE = 'holders-pagination-incomplete';
const PAGE = 10_000;
const MAX_PAGES = 20;
const KT1 = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;
const ACCOUNT = /^(?:tz[1-5]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/;
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function isTezosAccount(value) {
  if (typeof value !== 'string' || value.length !== 36 || !ACCOUNT.test(value)) return false;
  const decoded = [...value].reduce((n, char) => n * 58n + BigInt(BASE58.indexOf(char)), 0n);
  const hex = decoded.toString(16).padStart(54, '0');
  // Tezos account Base58Check values contain 3 prefix, 20 hash and 4 checksum bytes.
  if (hex.length !== 54) return false;
  const bytes = Buffer.from(hex, 'hex');
  const hash = createHash('sha256').update(bytes.subarray(0, 23)).digest();
  const checksum = createHash('sha256').update(hash).digest().subarray(0, 4);
  return checksum.equals(bytes.subarray(23));
}

async function getJson(fetcher, url) {
  const res = await fetcher(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`tzkt ${res.status}`);
  return res.json();
}

export async function resolveDomain(fetcher, name) {
  const rows = await getJson(fetcher, `${TZKT}/domains?name=${encodeURIComponent(name)}&select=address&limit=1`);
  return Array.isArray(rows) && rows.length === 1 && isTezosAccount(rows[0]) ? rows[0] : null;
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
    if (!Array.isArray(rows) || rows.length > PAGE) throw new Error('tzkt shape');
    for (const a of rows) if (typeof a === 'string') holders.add(a);
    if (rows.length < PAGE) return holders;
  }
  // At the safety cap, a full final page is not proof the scan is complete.
  throw new Error(PAGINATION_INCOMPLETE);
}

export async function countNounsMoneyHolders(fetcher, config, now = new Date()) {
  const contracts = config.collections.map((c) => c.contract);
  let office = null;
  if (config.officeDomain !== undefined) {
    if (typeof config.officeDomain !== 'string' || !config.officeDomain.trim()) throw new Error(OFFICE_UNRESOLVED);
    office = await resolveDomain(fetcher, config.officeDomain).catch(() => null);
    if (!office) throw new Error(OFFICE_UNRESOLVED);
  }
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
    definition: `Unique Tezos wallets with a positive balance of any listed Nouns Money collection, not counting ${office ? 'the office wallet or ' : ''}the burn address.`,
    source: 'api.tzkt.io token balances',
  };
}
