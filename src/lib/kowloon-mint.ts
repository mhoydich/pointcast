/**
 * kowloon-mint — Taquito helpers for claiming $BUN, Pastry NFTs, and
 * Achievement receipt NFTs from the Kowloon universe.
 *
 * Reuses src/lib/tezos.ts so Beacon pair state persists across
 * collect / mint / kowloon on the same Kukai session.
 */

import contracts from '../data/contracts.json';
import { connectKukai, tezosClient } from './tezos';

export type Network = 'mainnet' | 'ghostnet' | 'shadownet';

export function bunTokenAddress(n: Network = 'mainnet'): string {
  return (contracts as any)?.bun_token?.[n] ?? '';
}
export function hasBunToken(n: Network = 'mainnet'): boolean {
  return bunTokenAddress(n).startsWith('KT1');
}
export function pastryContractAddress(n: Network = 'mainnet'): string {
  return (contracts as any)?.kowloon_pastry?.[n] ?? '';
}
export function hasPastryContract(n: Network = 'mainnet'): boolean {
  return pastryContractAddress(n).startsWith('KT1');
}
export function achievementsContractAddress(n: Network = 'mainnet'): string {
  return (contracts as any)?.kowloon_achievements?.[n] ?? '';
}
export function hasAchievementsContract(n: Network = 'mainnet'): boolean {
  return achievementsContractAddress(n).startsWith('KT1');
}

export const ACHIEVEMENT_SLUGS: Record<number, string> = {
  0:'first_bake',1:'first_bullseye',2:'vip_done',3:'boss_done',4:'combo_10',
  5:'combo_20',6:'cash_stash',7:'bribe_lord',8:'shop_goer',9:'four_ovens',
  10:'daily_shifter',11:'wallet_connect',12:'bun_collector',13:'theme_chameleon',
  14:'developed_gluten',15:'auntie_hands',16:'regular',17:'five_stars',
  18:'all_hands',19:'outran_chan',20:'vendetta_done',21:'right_hand',
  22:'no_mans_land',23:'sidejob_done',24:'everyone_knows',25:'local_hero',
  26:'typhoon_hero',27:'storm_drop',28:'ch7_started',29:'truth_kept',
  30:'truth_uncovered',31:'sepia_runner',32:'typhoon_survivor',33:'triad_paid',
  34:'night_5',35:'night_10',
};
export const SLUG_TO_TOKEN_ID: Record<string, number> = Object.fromEntries(
  Object.entries(ACHIEVEMENT_SLUGS).map(([id, slug]) => [slug, Number(id)]),
);

export interface ClaimResult {
  ok: boolean;
  reason?: 'not-deployed' | 'not-connected' | 'server-rejected' | 'user-cancelled' | 'unknown';
  opHash?: string;
  tzktUrl?: string;
}

const BUN_KEY = 'kowloon-bun-v5';
const ACHV_KEY = 'kowloon-ach-v4';

export function readEarnedBun(): number {
  if (typeof localStorage === 'undefined') return 0;
  const v = parseFloat(localStorage.getItem(BUN_KEY) || '0');
  return isNaN(v) ? 0 : v;
}
export function readUnlockedAchievements(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(ACHV_KEY) || '[]'); } catch { return []; }
}

async function callClaim(kt1: string, method: string, args: any): Promise<ClaimResult> {
  try {
    const tezos = await tezosClient();
    const contract = await tezos.wallet.at(kt1);
    const op = await contract.methodsObject[method](args).send();
    return { ok: true, opHash: op.opHash, tzktUrl: `https://tzkt.io/${op.opHash}` };
  } catch (e: any) {
    if (e?.name === 'UserRejectedError') return { ok: false, reason: 'user-cancelled' };
    return { ok: false, reason: 'unknown' };
  }
}

async function getVoucher(payload: unknown): Promise<any | null> {
  const resp = await fetch('/api/kowloon-voucher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) return null;
  return resp.json();
}

export async function claimBun(network: Network = 'mainnet'): Promise<ClaimResult> {
  const kt1 = bunTokenAddress(network);
  if (!kt1.startsWith('KT1')) return { ok: false, reason: 'not-deployed' };
  const wallet = await connectKukai().catch(() => null);
  if (!wallet) return { ok: false, reason: 'not-connected' };
  const earned = readEarnedBun();
  const v = await getVoucher({ kind: 'bun', wallet, earned });
  if (!v?.signature) return { ok: false, reason: 'server-rejected' };
  return callClaim(kt1, 'claim', {
    recipient: wallet, amount: v.amount, nonce: v.nonce,
    expiry: Math.floor(new Date(v.expiry).getTime() / 1000).toString(),
    signature: v.signature,
  });
}

export async function claimPastry(tokenId: number, network: Network = 'mainnet'): Promise<ClaimResult> {
  const kt1 = pastryContractAddress(network);
  if (!kt1.startsWith('KT1')) return { ok: false, reason: 'not-deployed' };
  const wallet = await connectKukai().catch(() => null);
  if (!wallet) return { ok: false, reason: 'not-connected' };
  const v = await getVoucher({ kind: 'pastry', wallet, tokenId });
  if (!v?.signature) return { ok: false, reason: 'server-rejected' };
  return callClaim(kt1, 'claim_pastry', {
    recipient: wallet, token_id: v.tokenId, nonce: v.nonce,
    expiry: Math.floor(new Date(v.expiry).getTime() / 1000).toString(),
    signature: v.signature,
  });
}

export async function claimAchievement(slug: string, network: Network = 'mainnet'): Promise<ClaimResult> {
  const kt1 = achievementsContractAddress(network);
  if (!kt1.startsWith('KT1')) return { ok: false, reason: 'not-deployed' };
  const tokenId = SLUG_TO_TOKEN_ID[slug];
  if (tokenId == null) return { ok: false, reason: 'unknown' };
  const wallet = await connectKukai().catch(() => null);
  if (!wallet) return { ok: false, reason: 'not-connected' };
  const v = await getVoucher({ kind: 'achievement', wallet, tokenId, achievementSlug: slug });
  if (!v?.signature) return { ok: false, reason: 'server-rejected' };
  return callClaim(kt1, 'claim_achievement', {
    recipient: wallet, token_id: v.tokenId, nonce: v.nonce,
    expiry: Math.floor(new Date(v.expiry).getTime() / 1000).toString(),
    signature: v.signature,
  });
}
