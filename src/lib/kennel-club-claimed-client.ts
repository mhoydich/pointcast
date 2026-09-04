import type { PointCastUser } from './auth/types';
import { readKennelToday, type KennelToday } from './kennel-today-client';

export const KENNEL_COLLECTION_URL = '/api/collect/me';
export const KENNEL_CLAIMED_EVENT = 'pc:kennel-claimed-state';

export type KennelPersonalClaim = {
  tokenId: number;
  sitting: string;
  status: 'held' | 'delivered' | 'failed';
  opHash: string | null;
  deliveredTo: string | null;
  createdAt: string;
};

export type KennelCollectionState = {
  collector: { name: string; wallets: string[] };
  claimedDays: number[];
  streak: number;
  completion: { claimed: number; total: number };
  handle: { status: string; handle?: string };
  claims: KennelPersonalClaim[];
};

export type KennelClaimedState = {
  today: KennelToday;
  collection: KennelCollectionState;
  claim: KennelPersonalClaim;
  displayName: string;
  mark: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status?: number;
  json(): Promise<unknown>;
}>;

type SessionReader = () => Promise<PointCastUser | null>;

export type KennelClaimedRoot = Pick<ParentNode, 'querySelector' | 'querySelectorAll'>;

function shortAddress(address: string): string {
  return address.length > 14 ? `${address.slice(0, 7)}…${address.slice(-5)}` : address;
}

function safeInitial(value: string): string {
  const initial = Array.from(value.replace(/^@/, '').trim())[0] ?? '';
  return /[\p{L}\p{N}]/u.test(initial) ? initial.toUpperCase() : '•';
}

function localParts(now: Date, timeZone: string): Record<string, number> {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now).flatMap((part) => (
    part.type === 'literal' ? [] : [[part.type, Number(part.value)]]
  ))) as Record<string, number>;
}

/** UTC instant for a wall-clock time in an IANA zone, including DST changes. */
function zonedEpoch(parts: Record<string, number>, timeZone: string): number {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour ?? 0, parts.minute ?? 0, parts.second ?? 0);
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const seen = localParts(new Date(guess), timeZone);
    const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, seen.second);
    const correction = target - seenAsUtc;
    guess += correction;
    if (Math.abs(correction) < 1_000) break;
  }
  return guess;
}

export function nextLosAngelesMidnight(now = new Date()): Date {
  const timeZone = 'America/Los_Angeles';
  const here = localParts(now, timeZone);
  const nextDate = new Date(Date.UTC(here.year, here.month - 1, here.day + 1));
  return new Date(zonedEpoch({
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  }, timeZone));
}

export function nextSittingCountdown(now = new Date()): string {
  const remainingMinutes = Math.max(0, Math.floor((nextLosAngelesMidnight(now).getTime() - now.getTime()) / 60_000));
  return `${Math.floor(remainingMinutes / 60)}h ${String(remainingMinutes % 60).padStart(2, '0')}m`;
}

export function localClaimTime(value: string, timeZone?: string): string {
  const when = new Date(value);
  if (!Number.isFinite(when.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    ...(timeZone ? { timeZone } : {}),
    hour: 'numeric',
    minute: '2-digit',
  }).formatToParts(when);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '';
  const period = (parts.find((part) => part.type === 'dayPeriod')?.value ?? '').toLowerCase();
  return hour && minute ? `${hour}:${minute}${period}` : '';
}

function claimedDisplay(collection: KennelCollectionState, claim: KennelPersonalClaim, user: PointCastUser): string {
  if (collection.handle?.status === 'claimed' && collection.handle.handle) return `@${collection.handle.handle}`;
  const address = claim.deliveredTo || collection.collector?.wallets?.[0] || '';
  if (address) return shortAddress(address);
  const name = (collection.collector?.name || user.preferredName || 'you').trim().split(/\s+/)[0];
  return name && !name.includes('@') ? name : 'you';
}

export async function readKennelClaimedState(options: {
  fetcher: FetchLike;
  getSession: SessionReader;
}): Promise<KennelClaimedState | null> {
  const [today, user] = await Promise.all([
    readKennelToday(options.fetcher),
    options.getSession(),
  ]);
  if (!user) return null;

  const response = await options.fetcher(KENNEL_COLLECTION_URL, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const collection = await response.json() as KennelCollectionState;
  const claim = (collection.claims ?? []).find((candidate) => (
    candidate.tokenId === today.tokenId && (candidate.status === 'held' || candidate.status === 'delivered')
  ));
  if (!claim) return null;
  const displayName = claimedDisplay(collection, claim, user);
  return { today, collection, claim, displayName, mark: safeInitial(displayName) };
}

function setText(root: KennelClaimedRoot, selector: string, value: string): void {
  const node = root.querySelector<HTMLElement>(selector);
  if (node) node.textContent = value;
}

function setHidden(root: KennelClaimedRoot, selector: string, hidden: boolean): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((node) => { node.hidden = hidden; });
}

function updateCountdown(root: KennelClaimedRoot, state: KennelClaimedState, now: Date): void {
  setText(
    root,
    '[data-kennel-holding-summary]',
    `You hold ${state.collection.completion.claimed} of ${state.collection.completion.total} · next sitting opens in ${nextSittingCountdown(now)}`,
  );
}

export function clearKennelClaimedState(root: KennelClaimedRoot): void {
  setHidden(root, '[data-kennel-holding]', true);
  setHidden(root, '[data-kennel-went-home-stamp]', true);
  root.querySelectorAll<HTMLElement>('[data-kennel-claimed-tile]').forEach((tile) => {
    tile.removeAttribute('data-kennel-yours');
    const mark = tile.querySelector<HTMLElement>('[data-kennel-owner-mark]');
    if (mark) mark.hidden = true;
  });
  root.querySelectorAll<HTMLElement>('[data-kennel-claimed-surface]').forEach((surface) => {
    surface.removeAttribute('data-kennel-claimed-state');
  });
}

export function applyKennelClaimedState(
  root: KennelClaimedRoot,
  state: KennelClaimedState,
  now = new Date(),
): void {
  clearKennelClaimedState(root);
  const time = localClaimTime(state.claim.createdAt);
  const statusLine = `${state.today.name} went home with ${state.displayName}${time ? ` · ${time}` : ''}`;
  setText(root, '[data-kennel-holding-line]', statusLine);
  updateCountdown(root, state, now);
  setText(root, '[data-kennel-holding-where]', state.claim.status === 'delivered'
    ? 'in your wallet'
    : 'held for you until you link a wallet');
  setText(root, '[data-kennel-went-home-stamp]', `WENT HOME · ${String(state.today.day).padStart(2, '0')} · ${state.displayName}`);

  const receipt = root.querySelector<HTMLAnchorElement>('[data-kennel-holding-receipt]');
  if (receipt) {
    receipt.hidden = !state.claim.opHash;
    if (state.claim.opHash) receipt.href = `https://tzkt.io/${state.claim.opHash}`;
  }
  setHidden(root, '[data-kennel-holding-move]', state.claim.status !== 'held');
  setHidden(root, '[data-kennel-holding]', false);
  setHidden(root, '[data-kennel-went-home-stamp]', false);
  root.querySelectorAll<HTMLElement>('[data-kennel-claimed-surface]').forEach((surface) => {
    surface.setAttribute('data-kennel-claimed-state', state.claim.status);
  });

  const claimedDays = new Set(state.collection.claimedDays);
  root.querySelectorAll<HTMLElement>('[data-kennel-claimed-tile]').forEach((tile) => {
    const day = Number(tile.dataset.kennelDay || tile.dataset.day);
    const yours = claimedDays.has(day);
    tile.toggleAttribute('data-kennel-yours', yours);
    const mark = tile.querySelector<HTMLElement>('[data-kennel-owner-mark]');
    if (mark) {
      mark.hidden = !yours;
      mark.textContent = yours ? state.mark : '';
    }
  });
}

export async function hydrateKennelClaimedState(options: {
  root: KennelClaimedRoot;
  fetcher: FetchLike;
  getSession: SessionReader;
  now?: Date;
}): Promise<KennelClaimedState | null> {
  let state: KennelClaimedState | null = null;
  try {
    state = await readKennelClaimedState(options);
  } catch {
    state = null;
  }
  if (!state) {
    clearKennelClaimedState(options.root);
    return null;
  }
  applyKennelClaimedState(options.root, state, options.now ?? new Date());
  return state;
}

type ClaimedWindow = Window & {
  __kennelClaimedMounted?: boolean;
  __kennelClaimedTimer?: number;
};

export function mountKennelClaimedState(getSession: SessionReader): void {
  if (typeof document === 'undefined') return;
  const claimedWindow = window as ClaimedWindow;
  const hydrate = async () => {
    if (!document.querySelector('[data-kennel-holding], [data-kennel-claimed-tile]')) return;
    const state = await hydrateKennelClaimedState({
      root: document,
      fetcher: fetch as unknown as FetchLike,
      getSession,
    });
    if (claimedWindow.__kennelClaimedTimer) window.clearInterval(claimedWindow.__kennelClaimedTimer);
    if (state) {
      claimedWindow.__kennelClaimedTimer = window.setInterval(() => updateCountdown(document, state, new Date()), 30_000);
      window.dispatchEvent(new CustomEvent(KENNEL_CLAIMED_EVENT, { detail: state }));
    }
  };
  void hydrate();
  if (claimedWindow.__kennelClaimedMounted) return;
  claimedWindow.__kennelClaimedMounted = true;
  document.addEventListener('astro:page-load', () => void hydrate());
  window.addEventListener('pc:kennel-claim', () => void hydrate());
  window.addEventListener('pc:auth-change', () => void hydrate());
}
