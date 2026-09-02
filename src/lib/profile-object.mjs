const TZKT_MAINNET = 'https://api.tzkt.io/v1';
const HANDLE_PATTERN = /^[a-z0-9-]{3,24}$/;
const profilePageReads = new Map();

export function encodeProfileBytes(value) {
  return Array.from(new TextEncoder().encode(String(value ?? '')))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

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

function profileLinkValue(decoded) {
  try {
    const parsed = JSON.parse(decoded);
    const url = safeProfileLink(String(parsed?.url || ''));
    if (!url) return { label: String(parsed?.label || parsed?.url || ''), url: '' };
    return { label: String(parsed?.label || parsed.url).slice(0, 80), url };
  } catch {
    return { label: decoded, url: safeProfileLink(decoded) };
  }
}

export function decodeProfileLink(value) {
  return profileLinkValue(decodeProfileBytes(value));
}

export function encodeProfileLink(label, url) {
  return encodeProfileBytes(JSON.stringify({
    label: String(label || url || '').trim().slice(0, 80),
    url: safeProfileLink(String(url || '').trim()),
  }));
}

async function readBigMap(contract, name, fetchImpl) {
  const url = `${TZKT_MAINNET}/contracts/${encodeURIComponent(contract)}/bigmaps/${encodeURIComponent(name)}/keys?active=true&limit=10000`;
  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetchImpl(url, { headers: { accept: 'application/json' } });
    if (response.status !== 429) break;
    const retryAfter = Number(response.headers?.get?.('retry-after') || 0);
    await new Promise((resolve) => setTimeout(resolve, Math.max(300, retryAfter * 1000, 300 * (attempt + 1))));
  }
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

export async function readProfileHandle(contract, handle, fetchImpl = fetch) {
  const normalized = String(handle || '').replace(/^@/, '').toLowerCase();
  if (!isProfileContractConfigured(contract) || !isProfileHandle(normalized)) return null;
  const tokenUrl = `${TZKT_MAINNET}/contracts/${encodeURIComponent(contract)}/bigmaps/tokens_by_handle/keys/${encodeProfileBytes(normalized)}`;
  const tokenResponse = await fetchImpl(tokenUrl, { headers: { accept: 'application/json' } });
  if (tokenResponse.status === 204 || tokenResponse.status === 404) return null;
  if (!tokenResponse.ok) throw new Error(`TzKT handle read failed (${tokenResponse.status})`);
  const tokenEntry = await tokenResponse.json();
  const tokenId = Number(tokenEntry?.value);
  if (!Number.isSafeInteger(tokenId) || tokenId < 0) return null;
  const [pageResponse, ownerResponse] = await Promise.all([
    fetchImpl(`${TZKT_MAINNET}/contracts/${encodeURIComponent(contract)}/bigmaps/pages/keys/${tokenId}`, { headers: { accept: 'application/json' } }),
    fetchImpl(`${TZKT_MAINNET}/contracts/${encodeURIComponent(contract)}/bigmaps/ledger/keys/${tokenId}`, { headers: { accept: 'application/json' } }),
  ]);
  if (!pageResponse.ok || !ownerResponse.ok) throw new Error('TzKT profile record is incomplete.');
  const [pageEntry, ownerEntry] = await Promise.all([pageResponse.json(), ownerResponse.json()]);
  const page = pageValue(pageEntry?.value);
  const owner = String(ownerEntry?.value || '');
  if (!page || !owner) return null;
  return profileRecord(contract, tokenId, normalized, owner, page);
}

function profileRecord(contract, tokenId, handle, owner, page) {
  return {
    schema: 'pointcast-profile-object-v1',
    contract,
    tokenId,
    handle,
    owner,
    page,
    links: page.links.map(profileLinkValue),
    url: `https://pointcast.xyz/p/${handle}`,
    json: `https://pointcast.xyz/p/${handle}.json`,
    noun: `https://noun.pics/${page.nounSeed}.svg`,
    source: 'Tezos mainnet via TzKT',
  };
}

export async function listProfilePages(contract, fetchImpl = fetch, useCache = true) {
  const cacheable = useCache && fetchImpl === globalThis.fetch;
  if (cacheable) {
    const existing = profilePageReads.get(contract);
    if (existing) return existing;
    const loading = listProfilePages(contract, fetchImpl, false);
    profilePageReads.set(contract, loading);
    try {
      return await loading;
    } catch (error) {
      profilePageReads.delete(contract);
      throw error;
    }
  }
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
    return [profileRecord(contract, tokenId, handle, owner, page)];
  }).sort((a, b) => a.tokenId - b.tokenId);
}

export async function listOwnerKennelDogs(owner, contract, fetchImpl = fetch) {
  if (!owner || !isProfileContractConfigured(contract)) return [];
  const url = new URL(`${TZKT_MAINNET}/tokens/balances`);
  url.searchParams.set('account', owner);
  url.searchParams.set('token.contract', contract);
  url.searchParams.set('balance.gt', '0');
  url.searchParams.set('limit', '100');
  const response = await fetchImpl(url.toString(), { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`TzKT Kennel Club read failed (${response.status})`);
  const rows = await response.json();
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    tokenId: Number(row?.token?.tokenId),
    balance: String(row?.balance || '0'),
    name: String(row?.token?.metadata?.name || `Kennel Club #${row?.token?.tokenId}`),
    image: String(row?.token?.metadata?.thumbnailUri || row?.token?.metadata?.displayUri || ''),
    objktUrl: `https://objkt.com/tokens/${contract}/${row?.token?.tokenId}`,
  })).filter((dog) => Number.isSafeInteger(dog.tokenId));
}

export async function listOwnerSeals(owner, contract, fetchImpl = fetch) {
  if (!owner || !isProfileContractConfigured(contract)) return [];
  const url = new URL(`${TZKT_MAINNET}/contracts/${contract}/bigmaps/seals/keys`);
  url.searchParams.set('active', 'true');
  url.searchParams.set('value.holder', owner);
  url.searchParams.set('limit', '100');
  const response = await fetchImpl(url.toString(), { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`TzKT seals read failed (${response.status})`);
  const rows = await response.json();
  return (Array.isArray(rows) ? rows : []).flatMap((row) => {
    const value = row?.value;
    if (!value || String(value.holder || '') !== owner) return [];
    return [{
      tokenId: Number(row.key),
      kind: decodeProfileBytes(value.kind),
      evidence: decodeProfileBytes(value.evidence),
      issuer: String(value.issuer || ''),
      issuedAt: String(value.attested_at || ''),
      revoked: Boolean(value.revoked),
      tzktUrl: `https://tzkt.io/${contract}/tokens/${row.key}`,
    }];
  });
}
