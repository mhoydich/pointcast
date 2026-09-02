/**
 * Kennel Club's public, indexer-only mint state.
 *
 * Browser surfaces intentionally read only TzKT. The wallet/RPC stack is
 * loaded after an explicit mint click, never to render a room.
 */
import contracts from '../data/contracts.json';

export const KENNEL_CLUB_TZKT = 'https://api.tzkt.io';
export const KENNEL_CLUB_TZKT_PAGE = 'https://tzkt.io';

const config = (contracts as any).kennel_club ?? {};
export const KENNEL_CLUB_CONTRACT = String(config.mainnet ?? '');
export const KENNEL_CLUB_PRICE_MUTEZ = Number(config.mintPriceMutez ?? 1_000_000);
export const KENNEL_CLUB_NETWORK = 'mainnet' as const;
export const KENNEL_CLUB_EDITION = String(config.edition ?? 'open');

export type FetchLike = (input: string) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
}>;

export type KennelClubMintState = {
  contract: string;
  network: 'mainnet';
  priceMutez: number;
  edition: string;
  paused: boolean;
  today: {
    tokenId: number;
    windowOpen: boolean;
    minted: number;
    window: { openAt: string; closeAt: string } | null;
  };
};

function numberValue(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

async function json<T>(fetcher: FetchLike, url: string): Promise<T> {
  const response = await fetcher(url);
  // TzKT returns 204 for absent big-map keys. A just-originated FA2 can have
  // one of those before a token is first touched, so treat it as zero/null.
  if (response.status === 204) return null as T;
  if (!response.ok) throw new Error(`TzKT read failed (${response.status})`);
  return response.json() as Promise<T>;
}

function keyValue(payload: any): unknown {
  if (Array.isArray(payload)) return payload[0]?.value;
  return payload?.value;
}

export function kennelClubWindowOpen(window: { openAt: string; closeAt: string } | null, now = new Date()): boolean {
  if (!window) return false;
  const opens = Date.parse(window.openAt);
  const closes = Date.parse(window.closeAt);
  const current = now.getTime();
  return Number.isFinite(opens) && Number.isFinite(closes) && current >= opens && current < closes;
}

/** Read the one contract storage record and the selected token's two big-map keys. */
export async function getKennelClubMintState(
  tokenId: number,
  { fetcher = fetch as FetchLike, now = new Date() }: { fetcher?: FetchLike; now?: Date } = {},
): Promise<KennelClubMintState> {
  if (!KENNEL_CLUB_CONTRACT.startsWith('KT1')) throw new Error('Kennel Club contract is not configured.');
  const storage: any = await json(fetcher, `${KENNEL_CLUB_TZKT}/v1/contracts/${KENNEL_CLUB_CONTRACT}/storage`);
  const supplyBigMap = Number(storage?.supply);
  const windowsBigMap = Number(storage?.windows);
  if (!Number.isInteger(supplyBigMap) || !Number.isInteger(windowsBigMap)) {
    throw new Error('Kennel Club storage does not expose supply and windows big maps.');
  }
  const [supplyPayload, windowPayload] = await Promise.all([
    json<any>(fetcher, `${KENNEL_CLUB_TZKT}/v1/bigmaps/${supplyBigMap}/keys?key=${tokenId}`),
    json<any>(fetcher, `${KENNEL_CLUB_TZKT}/v1/bigmaps/${windowsBigMap}/keys?key=${tokenId}`),
  ]);
  const rawWindow = keyValue(windowPayload) as { open_at?: string; close_at?: string } | undefined;
  const window = rawWindow?.open_at && rawWindow?.close_at
    ? { openAt: rawWindow.open_at, closeAt: rawWindow.close_at }
    : null;
  return {
    contract: KENNEL_CLUB_CONTRACT,
    network: KENNEL_CLUB_NETWORK,
    priceMutez: numberValue(storage?.price_mutez) || KENNEL_CLUB_PRICE_MUTEZ,
    edition: String(storage?.edition_mode ?? KENNEL_CLUB_EDITION),
    paused: Boolean(storage?.paused),
    today: {
      tokenId,
      windowOpen: kennelClubWindowOpen(window, now),
      minted: numberValue(keyValue(supplyPayload)),
      window,
    },
  };
}

/** A truthful shape when TzKT cannot be reached while an SSG build runs. */
export function unavailableKennelClubMintState(tokenId: number): KennelClubMintState & { unavailable: true } {
  return {
    contract: KENNEL_CLUB_CONTRACT,
    network: KENNEL_CLUB_NETWORK,
    priceMutez: KENNEL_CLUB_PRICE_MUTEZ,
    edition: KENNEL_CLUB_EDITION,
    paused: true,
    today: { tokenId, windowOpen: false, minted: 0, window: null },
    unavailable: true,
  };
}
