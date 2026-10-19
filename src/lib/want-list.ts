/**
 * The PointCast want list — Tezos work worth collecting next.
 *
 * Picks live in src/data/want-list.json (cc-curated research, not Mike's
 * words). At build time each pick is checked against Mike's wallet on
 * TzKT, so a piece flips to "collected" on the next deploy after it lands.
 */
import wantList from '../data/want-list.json';
import { fetchJsonWithTimeout } from './fetch-json';

export const COLLECTOR_WALLET = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';

export type WantTier = 'free' | 'under-10' | '10-100' | 'stretch';

export interface WantPick {
  title: string;
  artist: { alias: string; address: string | null };
  contract: string;
  tokenId: string | null;
  url: string;
  tier: WantTier;
  priceXtz: number | null;
  priceObservedAt: string | null;
  why: string;
  tags: string[];
}

export interface WantPickStatus extends WantPick {
  collected: boolean;
  heldCount: number;
}

export const TIER_LABELS: Record<WantTier, string> = {
  free: 'Free & open editions',
  'under-10': 'Under 10 tez',
  '10-100': '10–100 tez',
  stretch: 'Stretch',
};

export const TIER_ORDER: WantTier[] = ['free', 'under-10', '10-100', 'stretch'];

const data = wantList as { curatedAt: string; curator: string; picks: WantPick[] };

export const WANT_LIST_CURATED_AT = data.curatedAt;
export const WANT_LIST_CURATOR = data.curator;

/** Picks with a `collected` flag from Mike's live TzKT balances. `checked: false` means TzKT was unreachable. */
export async function wantListWithStatus(): Promise<{ picks: WantPickStatus[]; checked: boolean }> {
  const contracts = [...new Set(data.picks.map((p) => p.contract))];
  let held: Array<{ contract: string; tokenId: string }> = [];
  let checked = true;
  if (contracts.length > 0) {
    try {
      held = await fetchJsonWithTimeout(
        `https://api.tzkt.io/v1/tokens/balances?account=${COLLECTOR_WALLET}&balance.gt=0` +
          `&token.contract.in=${contracts.join(',')}&limit=1000&select=token.contract.address%20as%20contract,token.tokenId%20as%20tokenId`,
        { headers: { Accept: 'application/json' } },
        8000,
      );
    } catch {
      checked = false;
    }
  }
  const picks = data.picks.map((pick) => {
    const matches = held.filter(
      (h) => h.contract === pick.contract && (pick.tokenId === null || h.tokenId === pick.tokenId),
    );
    return { ...pick, collected: matches.length > 0, heldCount: matches.length };
  });
  return { picks, checked };
}
