/**
 * auction — client helpers for /auction (Tezos Nouns Builder v0).
 *
 * Talks to the DailyAuction SmartPy contract at the address pinned in
 * src/data/contracts.json → daily_auction.{mainnet|shadownet}. Reads via
 * TzKT (faster + richer than RPC for display queries); writes via Beacon
 * + Taquito.
 *
 * Storage schema (mirrors contracts/v2/daily_auction.py):
 *   {
 *     administrator: address,
 *     visit_nouns_fa2: address,
 *     treasury: address,
 *     paused: bool,
 *     duration_sec: nat,
 *     reserve_price: mutez,
 *     min_increment_bps: nat,
 *     extend_window_sec: nat,
 *     extend_by_sec: nat,
 *     keeper_tip_bps: nat,
 *     current_noun_id: nat,
 *     starts_at: timestamp,
 *     ends_at: timestamp,
 *     settled: bool,
 *     has_bid: bool,
 *     highest_bidder: address,
 *     highest_bid: mutez,
 *     settled_count: nat,
 *     last_paused_at: option<timestamp>,
 *   }
 *
 * Build-time only for the type definitions; runtime code loads Taquito
 * + Beacon dynamically so the page ships without a wallet bundle on
 * first paint.
 */

export interface AuctionStorage {
  administrator: string;
  visit_nouns_fa2: string;
  treasury: string;
  paused: boolean;
  duration_sec: number;
  reserve_price: string; // mutez as string
  min_increment_bps: number;
  extend_window_sec: number;
  extend_by_sec: number;
  keeper_tip_bps: number;
  current_noun_id: number;
  starts_at: string; // ISO timestamp
  ends_at: string; // ISO timestamp
  settled: boolean;
  has_bid: boolean;
  highest_bidder: string;
  highest_bid: string; // mutez as string
  settled_count: number;
  last_paused_at: string | null;
}

export interface AuctionView extends AuctionStorage {
  /** Seconds remaining until ends_at. Negative if past. */
  time_left_sec: number;
  /** Minimum acceptable bid in mutez, given current state. */
  min_next_bid_mutez: string;
  /** Health: 'active' | 'ending-soon' | 'ended' | 'paused'. */
  phase: 'active' | 'ending-soon' | 'ended' | 'paused' | 'not-started';
  /** ISO now. */
  fetched_at: string;
}

export interface AuctionSettled {
  noun_id: number;
  winner: string;
  bid_mutez: string;
  settled_at: string;
  settled_by: string; // keeper
  op_hash: string;
  level: number;
}

export const TZKT_BASE = 'https://api.tzkt.io/v1';

export function mutezToTezDisplay(mutez: string | number): string {
  const n = typeof mutez === 'string' ? Number(mutez) : mutez;
  if (!Number.isFinite(n) || n === 0) return '0';
  const tez = n / 1_000_000;
  if (tez >= 100) return tez.toFixed(2);
  if (tez >= 1) return tez.toFixed(3);
  return tez.toFixed(4);
}

export function shortAddr(addr: string, pre = 6, post = 4): string {
  if (!addr || addr.length < pre + post + 3) return addr;
  return `${addr.slice(0, pre)}…${addr.slice(-post)}`;
}

export function deriveMinNextBid(s: AuctionStorage): string {
  if (!s.has_bid) return s.reserve_price;
  const prev = BigInt(s.highest_bid);
  const increment = (prev * BigInt(s.min_increment_bps)) / 10000n;
  const required = prev + increment;
  const reserve = BigInt(s.reserve_price);
  return (required > reserve ? required : reserve).toString();
}

export function derivePhase(s: AuctionStorage, now: Date): AuctionView['phase'] {
  if (s.paused) return 'paused';
  const endsAt = new Date(s.ends_at).getTime();
  const startsAt = new Date(s.starts_at).getTime();
  const t = now.getTime();
  if (t < startsAt) return 'not-started';
  if (t >= endsAt) return 'ended';
  if (endsAt - t <= s.extend_window_sec * 1000) return 'ending-soon';
  return 'active';
}

export async function fetchAuctionStorage(
  contractAddr: string,
  network: 'mainnet' | 'ghostnet' | 'shadownet' = 'mainnet',
): Promise<AuctionStorage | null> {
  const host =
    network === 'mainnet'
      ? 'https://api.tzkt.io/v1'
      : network === 'ghostnet'
        ? 'https://api.ghostnet.tzkt.io/v1'
        : 'https://api.ghostnet.tzkt.io/v1'; // shadownet uses ghostnet tzkt
  try {
    const r = await fetch(`${host}/contracts/${contractAddr}/storage`);
    if (!r.ok) return null;
    return (await r.json()) as AuctionStorage;
  } catch {
    return null;
  }
}

export function toView(s: AuctionStorage, now: Date = new Date()): AuctionView {
  const endsAt = new Date(s.ends_at).getTime();
  const time_left_sec = Math.floor((endsAt - now.getTime()) / 1000);
  return {
    ...s,
    time_left_sec,
    min_next_bid_mutez: deriveMinNextBid(s),
    phase: derivePhase(s, now),
    fetched_at: now.toISOString(),
  };
}

export async function fetchSettlementHistory(
  contractAddr: string,
  network: 'mainnet' | 'ghostnet' | 'shadownet' = 'mainnet',
  limit = 20,
): Promise<AuctionSettled[]> {
  const host =
    network === 'mainnet'
      ? 'https://api.tzkt.io/v1'
      : 'https://api.ghostnet.tzkt.io/v1';
  try {
    const r = await fetch(
      `${host}/operations/transactions?target=${contractAddr}&entrypoint=settle_and_create_next&status=applied&limit=${limit}&sort.desc=level&select=hash,timestamp,sender,level,diffs`,
    );
    if (!r.ok) return [];
    const rows = (await r.json()) as Array<{
      hash: string;
      timestamp: string;
      sender: { address: string };
      level: number;
      diffs?: unknown;
    }>;
    // Best-effort parse — settle diffs the storage; full parse is out of
    // scope for v0. Return caller-friendly metadata and let the UI fetch
    // storage-at-level if it wants the exact winning bid.
    return rows.map((row) => ({
      noun_id: -1, // unresolved — UI can fetch via storage-at-level if needed
      winner: 'unknown',
      bid_mutez: '0',
      settled_at: row.timestamp,
      settled_by: row.sender?.address ?? 'unknown',
      op_hash: row.hash,
      level: row.level,
    }));
  } catch {
    return [];
  }
}

export function countdown(totalSec: number): string {
  if (totalSec <= 0) return 'ended';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}
