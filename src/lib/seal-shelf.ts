const TZKT_MAINNET = 'https://api.tzkt.io/v1';

export const SEAL_SHELF_CONTRACTS = [
  { version: 'v1', contract: 'KT19DHCY5S9x48npRyAhUCM2SyLWZMNh3yQ1' },
  { version: 'v2', contract: 'KT1UVn9CDToAbyoxARLPfNtVkvKgzCwuroy3' },
] as const;

export type SealShelfState = 'available' | 'partial' | 'unavailable';

export type SealShelfItem = {
  key: string;
  contract: string;
  version: 'v1' | 'v2';
  tokenId: string;
  kind: string;
  evidence: string;
  issuedAt: string;
  issuer: string;
  revoked: boolean;
  tzktUrl: string;
};

export type SealShelfGroup = {
  kind: string;
  total: number;
  active: number;
  revoked: number;
  representative: SealShelfItem;
  seals: SealShelfItem[];
};

export type SealShelfResult = {
  state: SealShelfState;
  seals: SealShelfItem[];
  groups: SealShelfGroup[];
  contracts: Array<{
    contract: string;
    version: 'v1' | 'v2';
    state: 'available' | 'unavailable';
    count: number;
    error?: string;
  }>;
};

type Fetcher = typeof fetch;

function decodeBytes(value: unknown): string {
  if (typeof value !== 'string' || !/^(?:[0-9a-fA-F]{2})*$/.test(value)) return '';
  const bytes = new Uint8Array(value.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) || []);
  return new TextDecoder().decode(bytes);
}

function tokenIdOf(key: unknown): string {
  if (typeof key === 'string' || typeof key === 'number') return String(key);
  if (!key || typeof key !== 'object') return '';
  const record = key as Record<string, unknown>;
  return String(record.token_id ?? record.tokenId ?? record.nat ?? record.int ?? '');
}

function sortReceipts(a: SealShelfItem, b: SealShelfItem): number {
  if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
  if (a.revoked !== b.revoked) return a.revoked ? 1 : -1;
  if (a.version !== b.version) return a.version === 'v2' ? -1 : 1;
  return a.tokenId.localeCompare(b.tokenId, undefined, { numeric: true });
}

async function readContract(
  owner: string,
  source: (typeof SEAL_SHELF_CONTRACTS)[number],
  fetcher: Fetcher,
): Promise<SealShelfItem[]> {
  const url = new URL(`${TZKT_MAINNET}/contracts/${source.contract}/bigmaps/seals/keys`);
  url.searchParams.set('active', 'true');
  url.searchParams.set('value.holder', owner);
  url.searchParams.set('limit', '1000');
  const response = await fetcher(url.toString(), { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`tzkt-${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : [];
  return rows.flatMap((row: { key?: unknown; value?: Record<string, unknown> }) => {
    const value = row?.value;
    const tokenId = tokenIdOf(row?.key);
    if (!value || String(value.holder || '') !== owner || !tokenId) return [];
    return [{
      key: `${source.contract}:${tokenId}`,
      contract: source.contract,
      version: source.version,
      tokenId,
      kind: decodeBytes(value.kind) || 'unknown',
      evidence: decodeBytes(value.evidence),
      issuedAt: String(value.attested_at || ''),
      issuer: String(value.issuer || ''),
      revoked: Boolean(value.revoked),
      tzktUrl: `https://tzkt.io/${source.contract}/tokens/${encodeURIComponent(tokenId)}`,
    } satisfies SealShelfItem];
  });
}

function groupSeals(seals: SealShelfItem[]): SealShelfGroup[] {
  const byKind = new Map<string, SealShelfItem[]>();
  for (const seal of seals) byKind.set(seal.kind, [...(byKind.get(seal.kind) ?? []), seal]);
  return [...byKind.entries()].map(([kind, receipts]) => {
    const sorted = [...receipts].sort(sortReceipts);
    const active = sorted.filter((receipt) => !receipt.revoked).length;
    return {
      kind,
      total: sorted.length,
      active,
      revoked: sorted.length - active,
      representative: sorted[0],
      seals: sorted,
    };
  }).sort((a, b) => a.kind.localeCompare(b.kind));
}

export function unavailableSealShelf(error = 'seal-index-unavailable'): SealShelfResult {
  return {
    state: 'unavailable',
    seals: [],
    groups: [],
    contracts: SEAL_SHELF_CONTRACTS.map((source) => ({
      ...source,
      state: 'unavailable',
      count: 0,
      error,
    })),
  };
}

export async function readSealShelf(owner: string, fetcher: Fetcher = fetch): Promise<SealShelfResult> {
  if (!owner) return unavailableSealShelf('owner-required');
  const reads = await Promise.all(SEAL_SHELF_CONTRACTS.map(async (source) => {
    try {
      const seals = await readContract(owner, source, fetcher);
      return { ...source, state: 'available' as const, count: seals.length, seals };
    } catch (error) {
      return {
        ...source,
        state: 'unavailable' as const,
        count: 0,
        seals: [] as SealShelfItem[],
        error: error instanceof Error ? error.message : 'seal-index-unavailable',
      };
    }
  }));
  const receipts = new Map<string, SealShelfItem>();
  for (const read of reads) for (const seal of read.seals) receipts.set(seal.key, seal);
  const seals = [...receipts.values()].sort(sortReceipts);
  const available = reads.filter((read) => read.state === 'available').length;
  return {
    state: available === reads.length ? 'available' : available === 0 ? 'unavailable' : 'partial',
    seals,
    groups: groupSeals(seals),
    contracts: reads.map(({ seals: _seals, ...read }) => read),
  };
}
