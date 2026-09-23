import releaseData from '../data/nouns-bandmates-release.json' with { type: 'json' };

export const NOUNS_BANDMATES_TZKT = 'https://api.tzkt.io';
export const NOUNS_BANDMATES_RPC = 'https://rpc.tzkt.io/mainnet';
export const NOUNS_BANDMATES_TZKT_PAGE = 'https://tzkt.io';

export type NounsBandmatesRelease = Omit<typeof releaseData, 'status' | 'contract' | 'administrator' | 'expectedCodeSha256'> & {
  status: 'prepared' | 'live';
  contract: string | null;
  administrator: string | null;
  expectedCodeSha256: string | null;
};
export const NOUNS_BANDMATES_RELEASE = releaseData as NounsBandmatesRelease;
export const NOUNS_BANDMATES_RELEASE_DECLARED_LIVE = NOUNS_BANDMATES_RELEASE.status === 'live'
  && /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(NOUNS_BANDMATES_RELEASE.contract ?? '')
  && /^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/.test(NOUNS_BANDMATES_RELEASE.administrator ?? '')
  && /^[a-f0-9]{64}$/.test(NOUNS_BANDMATES_RELEASE.expectedCodeSha256 ?? '');

export type FetchLike = (input: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
}>;

export type NounsBandmatesMintReadiness = {
  status: 'prepared' | 'ready' | 'unavailable' | 'misconfigured';
  mintEnabled: boolean;
  verified: boolean;
  reason: string;
  contract: string | null;
  network: 'mainnet';
  chainId: string;
  entrypoint: string;
  priceMutez: 0;
  edition: 'open';
  quantityPerMint: 1;
};

type Options = { fetcher?: FetchLike; release?: NounsBandmatesRelease };

function base(release: NounsBandmatesRelease): Omit<NounsBandmatesMintReadiness, 'status' | 'mintEnabled' | 'verified' | 'reason'> {
  return {
    contract: release.contract,
    network: 'mainnet',
    chainId: release.chainId,
    entrypoint: release.entrypoint,
    priceMutez: 0,
    edition: 'open',
    quantityPerMint: 1,
  };
}

function result(release: NounsBandmatesRelease, status: NounsBandmatesMintReadiness['status'], reason: string, verified = false): NounsBandmatesMintReadiness {
  return { ...base(release), status, mintEnabled: status === 'ready' && verified, verified, reason };
}

async function readJson(fetcher: FetchLike, url: string): Promise<any> {
  const response = await fetcher(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`chain read failed (${response.status})`);
  return response.json();
}

function storageValue(storage: any, snake: string, camel: string): unknown {
  return storage?.[snake] ?? storage?.[camel];
}

function validToken(tokenId: number, release: NounsBandmatesRelease): boolean {
  return Number.isInteger(tokenId) && release.tokens.some((token) => token.tokenId === tokenId);
}

function canonical(value: any): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export async function canonicalCodeSha256(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Verify the configured contract against mainnet RPC and TzKT. Registry values alone never enable minting. */
export async function getNounsBandmatesMintReadiness(
  { fetcher = fetch as FetchLike, release = NOUNS_BANDMATES_RELEASE }: Options = {},
): Promise<NounsBandmatesMintReadiness> {
  if (release.status !== 'live' || !/^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(release.contract ?? '')) {
    return result(release, 'prepared', 'contract-not-configured');
  }
  if (release.network !== 'mainnet' || release.chainId !== 'NetXdQprcVkpaWU' || release.priceMutez !== 0 || release.edition !== 'open' || release.quantityPerMint !== 1 || !/^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/.test(release.administrator ?? '') || !/^[a-f0-9]{64}$/.test(release.expectedCodeSha256 ?? '')) {
    return result(release, 'misconfigured', 'registry-terms-mismatch');
  }
  try {
    const contract = release.contract;
    const [chainId, script, entrypointPayload, storage] = await Promise.all([
      readJson(fetcher, `${NOUNS_BANDMATES_RPC}/chains/main/chain_id`),
      readJson(fetcher, `${NOUNS_BANDMATES_RPC}/chains/main/blocks/head/context/contracts/${contract}/script`),
      readJson(fetcher, `${NOUNS_BANDMATES_RPC}/chains/main/blocks/head/context/contracts/${contract}/entrypoints`),
      readJson(fetcher, `${NOUNS_BANDMATES_TZKT}/v1/contracts/${contract}/storage`),
    ]);
    if (chainId !== release.chainId) return result(release, 'misconfigured', 'wrong-network');
    if (!Array.isArray(script?.code) || script.code.length === 0) return result(release, 'misconfigured', 'contract-code-missing');
    if (await canonicalCodeSha256(script.code) !== release.expectedCodeSha256) return result(release, 'misconfigured', 'contract-code-mismatch');
    const entrypoints = entrypointPayload?.entrypoints ?? entrypointPayload;
    if (!entrypoints || release.expectedEntrypoints.some((name) => typeof entrypoints[name] !== 'object')) return result(release, 'misconfigured', 'contract-entrypoints-mismatch');
    if (storageValue(storage, 'paused', 'paused') !== false) return result(release, 'misconfigured', 'contract-paused');
    if (String(storageValue(storage, 'administrator', 'administrator')) !== release.administrator) return result(release, 'misconfigured', 'contract-administrator-mismatch');
    if (Number(storageValue(storage, 'next_token_id', 'nextTokenId')) !== release.tokenCount) return result(release, 'misconfigured', 'contract-token-count-mismatch');
    return result(release, 'ready', 'verified-mainnet-contract', true);
  } catch {
    return result(release, 'unavailable', 'chain-verification-unavailable');
  }
}

export async function assertNounsBandmateMintReady(tokenId: number, options: Options = {}): Promise<NounsBandmatesMintReadiness & { contract: string }> {
  const release = options.release ?? NOUNS_BANDMATES_RELEASE;
  if (!validToken(tokenId, release)) throw new Error('Invalid Nouns Bandmate token id.');
  const readiness = await getNounsBandmatesMintReadiness(options);
  if (!readiness.mintEnabled || !readiness.verified || !readiness.contract) {
    throw new Error(`Nouns Bandmates mint is not ready (${readiness.reason}).`);
  }
  return readiness as NounsBandmatesMintReadiness & { contract: string };
}

/** Read this wallet's balance only; it makes no collection-wide ownership claim. */
export async function getNounsBandmateWalletBalance(tokenId: number, address: string, options: Options = {}): Promise<number> {
  const { fetcher = fetch as FetchLike, release = NOUNS_BANDMATES_RELEASE } = options;
  if (!validToken(tokenId, release)) throw new Error('Invalid Nouns Bandmate token id.');
  if (!/^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{30,36}$/.test(address)) throw new Error('Invalid Tezos address.');
  if (!/^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(release.contract ?? '')) throw new Error('Nouns Bandmates contract is not configured.');
  const rows = await readJson(fetcher, `${NOUNS_BANDMATES_TZKT}/v1/tokens/balances?account=${encodeURIComponent(address)}&token.contract=${release.contract}&token.tokenId=${tokenId}&balance.gt=0&limit=1`);
  const balance = Number(Array.isArray(rows) ? rows[0]?.balance ?? 0 : 0);
  return Number.isSafeInteger(balance) && balance >= 0 ? balance : 0;
}
