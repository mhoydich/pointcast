const TZKT_MAINNET = 'https://api.tzkt.io/v1';
const HANDLE_PATTERN = /^[a-z0-9-]{3,24}$/;

export function isProfileContractConfigured(contract) {
  return /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(contract || '');
}

export function isProfileHandle(handle) {
  return HANDLE_PATTERN.test(handle || '');
}

export function decodeProfileBytes(value) {
  if (typeof value !== 'string') return '';
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) return '';
  const bytes = new Uint8Array(hex.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) || []);
  return new TextDecoder().decode(bytes);
}

export function safeProfileLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

async function readBigMap(contract, name, fetchImpl) {
  const url = `${TZKT_MAINNET}/contracts/${encodeURIComponent(contract)}/bigmaps/${encodeURIComponent(name)}/keys?active=true&limit=10000`;
  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`TzKT ${name} read failed (${response.status})`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error(`TzKT ${name} response was not an array.`);
  return payload;
}

function tokenIdOf(entry) {
  const value = typeof entry?.key === 'object'
    ? entry.key?.token_id ?? entry.key?.nat ?? entry.key?.int
    : entry?.key;
  const tokenId = Number(value);
  return Number.isSafeInteger(tokenId) && tokenId >= 0 ? tokenId : null;
}

function pageValue(value) {
  if (!value || typeof value !== 'object') return null;
  const links = Array.isArray(value.links) ? value.links.map(decodeProfileBytes) : [];
  const nounSeed = Number(value.noun_seed);
  return {
    name: decodeProfileBytes(value.name),
    bio: decodeProfileBytes(value.bio),
    links,
    nounSeed: Number.isSafeInteger(nounSeed) && nounSeed >= 0 && nounSeed < 1200 ? nounSeed : 0,
  };
}

export async function listProfilePages(contract, fetchImpl = fetch) {
  if (!isProfileContractConfigured(contract)) return [];
  const [handles, pages, ledger] = await Promise.all([
    readBigMap(contract, 'handles', fetchImpl),
    readBigMap(contract, 'pages', fetchImpl),
    readBigMap(contract, 'ledger', fetchImpl),
  ]);
  const pageByToken = new Map(pages.map((entry) => [tokenIdOf(entry), pageValue(entry.value)]));
  const ownerByToken = new Map(ledger.map((entry) => [tokenIdOf(entry), String(entry.value || '')]));

  return handles.flatMap((entry) => {
    const tokenId = tokenIdOf(entry);
    const handle = decodeProfileBytes(entry.value);
    const page = pageByToken.get(tokenId);
    const owner = ownerByToken.get(tokenId) || '';
    if (tokenId === null || !isProfileHandle(handle) || !page || !owner) return [];
    return [{
      schema: 'pointcast-profile-object-v1',
      contract,
      tokenId,
      handle,
      owner,
      page,
      url: `https://pointcast.xyz/p/${handle}`,
      json: `https://pointcast.xyz/p/${handle}.json`,
      noun: `https://noun.pics/${page.nounSeed}.svg`,
      source: 'Tezos mainnet via TzKT',
    }];
  }).sort((a, b) => a.tokenId - b.tokenId);
}
