/**
 * Town cards — the public face of a PointCast account.
 *
 * A card is small on purpose: a @handle, a name, a Noun, a line of bio, what
 * you are doing now, where you are from, one song, three links, a color and,
 * only if you choose, one of your linked Tezos wallets. It is what Shortwave
 * shows next to a verified post and what "Sign in with PointCast" hands to
 * another site when you say yes.
 *
 * Handles follow the on-chain profile contract (3–24 of a–z, 0–9, -). If a
 * handle is already a profile object on Tezos, only the account that has the
 * holding wallet linked may use it, and that account can take it back from an
 * off-chain card. Everything else is first come, first served.
 *
 * Storage is the VISITS KV namespace:
 *   card:v1:user:{userId}   → the card (JSON)
 *   card:v1:handle:{handle} → userId
 */
import type { PointCastUser } from '../../src/lib/auth/types';

/** Mirrors src/data/contracts.json profile_objects.mainnet (a test keeps them equal). */
export const PROFILE_CONTRACT = 'KT1S3BkgEQsW62vqkuatueUhzcTqkTfb4EXs';
export const HANDLE_PATTERN = /^[a-z0-9-]{3,24}$/;
export const RESERVED_HANDLES = new Set([
  'admin', 'api', 'auth', 'connect', 'shortwave', 'pointcast', 'root', 'system', 'support', 'help', 'mod', 'moderator',
  'official', 'staff', 'team', 'null', 'undefined', 'everyone', 'here', 'visitor', 'agent', 'agents', 'me', 'you', 'login', 'signin',
]);
export const CARD_COLORS = ['#185fa5', '#0a6c9f', '#2f8f4e', '#e0a100', '#e5663b', '#c0262d', '#d6457a', '#7152a4', '#1f2a33'] as const;
const USER_PREFIX = 'card:v1:user:';
const HANDLE_PREFIX = 'card:v1:handle:';

export type CardLink = { label: string; url: string };
export type TownCard = {
  handle: string;
  name: string;
  noun: number;
  bio: string;
  now: string;
  place: string;
  song: string;
  links: CardLink[];
  color: string;
  /** '' unless the member chose to show one of their linked Tezos wallets. */
  wallet: string;
  /** Set when the handle is a profile object on Tezos held by one of this member's wallets. */
  onchain: { contract: string; tokenId: number; owner: string; checkedAt: string } | null;
  createdAt: string;
  updatedAt: string;
  /** True when a Tezos holder took this card's handle back. The member picks a new one. */
  released?: boolean;
};
export type PublicCard = Omit<TownCard, 'released'> & { url: string; avatar: string };
type CardKV = Pick<KVNamespace, 'get' | 'put' | 'delete'>;
export type CardEnv = { VISITS?: CardKV };
export type ProfileReader = (contract: string, handle: string) => Promise<{ owner: string; tokenId: number } | null>;

export class CardError extends Error {
  status: number; reason: string;
  constructor(reason: string, message: string, status = 400) { super(message); this.reason = reason; this.status = status; }
}

const CONTROL = /[\x00-\x1F\x7F]/g;
const plain = (v: unknown, max: number) => Array.from((typeof v === 'string' ? v : '').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim()).slice(0, max).join('');

export function normalizeHandle(value: unknown): string {
  return (typeof value === 'string' ? value : '').trim().replace(/^@/, '').toLowerCase();
}
export function checkHandle(value: unknown): string {
  const handle = normalizeHandle(value);
  if (!HANDLE_PATTERN.test(handle)) throw new CardError('invalid-handle', 'A handle is 3–24 lowercase letters, numbers or hyphens.');
  if (RESERVED_HANDLES.has(handle)) throw new CardError('reserved-handle', `@${handle} is reserved.`);
  return handle;
}

function httpsUrl(value: unknown): string {
  const raw = plain(value, 400);
  if (!raw) return '';
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if (u.protocol !== 'https:' || u.username || u.password || !u.hostname.includes('.')) return '';
    return u.toString();
  } catch { return ''; }
}

/** open.spotify.com track/album/playlist/episode, tracking params dropped. */
export function normalizeSong(value: unknown): string {
  const m = plain(value, 400).match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode)\/([A-Za-z0-9]{10,40})/);
  return m ? `https://open.spotify.com/${m[1]}/${m[2]}` : '';
}

export function tezosWallets(user: Pick<PointCastUser, 'identities'>): string[] {
  return (user.identities || []).filter((i) => i.provider === 'kukai' && /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(i.id)).map((i) => i.id);
}

/** Validate what the editor sent. Throws CardError with a sentence a person can act on. */
export function normalizeCardInput(input: unknown, user: Pick<PointCastUser, 'identities' | 'preferredName'>) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CardError('invalid-card', 'Send the card as a JSON object.');
  const b = input as Record<string, unknown>;
  const handle = checkHandle(b.handle);
  const name = plain(b.name, 40).replace(/[✓✔☑]/g, '').trim() || `@${handle}`;
  const noun = b.noun === undefined || b.noun === '' ? 0 : Number(b.noun);
  if (!Number.isInteger(noun) || noun < 0 || noun > 1199) throw new CardError('invalid-noun', 'Pick a Noun from 0 to 1199.');
  const color = typeof b.color === 'string' && (CARD_COLORS as readonly string[]).includes(b.color.toLowerCase()) ? b.color.toLowerCase() : CARD_COLORS[0];
  const songRaw = plain(b.song, 400);
  const song = normalizeSong(songRaw);
  if (songRaw && !song) throw new CardError('invalid-song', 'The song must be an open.spotify.com track, album, playlist or episode link.');
  const linksIn = Array.isArray(b.links) ? b.links : [];
  if (linksIn.length > 3) throw new CardError('too-many-links', 'A card holds up to three links.');
  const links: CardLink[] = [];
  for (const raw of linksIn) {
    const row = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    if (!plain(row.url, 400) && !plain(row.label, 40)) continue;
    const url = httpsUrl(row.url);
    if (!url) throw new CardError('invalid-link', 'Links must be public https addresses.');
    links.push({ url, label: plain(row.label, 40) || new URL(url).hostname.replace(/^www\./, '') });
  }
  const wallet = plain(b.wallet, 40);
  if (wallet && !tezosWallets(user as PointCastUser).includes(wallet)) throw new CardError('invalid-wallet', 'You can only show a Tezos wallet that is linked to your account.');
  return { handle, name, noun, bio: plain(b.bio, 160), now: plain(b.now, 80), place: plain(b.place, 40), song, links, color, wallet };
}

export function publicCard(card: TownCard): PublicCard {
  const { released: _released, ...rest } = card;
  return { ...rest, url: `https://pointcast.xyz/shortwave#@${card.handle}`, avatar: `https://noun.pics/${card.noun}.svg` };
}

export async function readCardByUser(env: CardEnv, userId: string): Promise<TownCard | null> {
  if (!env.VISITS) return null;
  const card = await env.VISITS.get<TownCard>(USER_PREFIX + userId, 'json');
  return card && typeof card === 'object' ? card : null;
}
export async function userIdForHandle(env: CardEnv, handle: string): Promise<string | null> {
  if (!env.VISITS || !HANDLE_PATTERN.test(handle)) return null;
  return (await env.VISITS.get(HANDLE_PREFIX + handle)) || null;
}
export async function readCardByHandle(env: CardEnv, handle: string): Promise<TownCard | null> {
  const userId = await userIdForHandle(env, normalizeHandle(handle));
  if (!userId) return null;
  const card = await readCardByUser(env, userId);
  return card && !card.released && card.handle === normalizeHandle(handle) ? card : null;
}

/**
 * Save a member's card. Order of checks: shape → Tezos (fail closed: if the
 * index cannot be read, nothing is saved) → first come first served → write
 * → read back the handle so a simultaneous claim cannot leave two owners.
 */
export async function saveCard(env: CardEnv, user: Pick<PointCastUser, 'userId' | 'identities' | 'preferredName'>, input: unknown, readProfile: ProfileReader, now = new Date()): Promise<TownCard> {
  if (!env.VISITS) throw new CardError('unavailable', 'Cards are unavailable right now. Nothing was saved.', 503);
  const next = normalizeCardInput(input, user);
  const existing = await readCardByUser(env, user.userId);
  let chain: { owner: string; tokenId: number } | null;
  try { chain = await readProfile(PROFILE_CONTRACT, next.handle); } catch { throw new CardError('chain-check-failed', 'Could not check Tezos for that handle. Nothing was saved. Try again in a minute.', 503); }
  const wallets = tezosWallets(user as PointCastUser);
  if (chain && !wallets.includes(chain.owner)) {
    throw new CardError('held-on-chain', `@${next.handle} is a profile object on Tezos held by ${chain.owner.slice(0, 6)}…${chain.owner.slice(-4)}. Link that wallet to your account to use it.`, 409);
  }
  const holder = await userIdForHandle(env, next.handle);
  if (holder && holder !== user.userId) {
    const theirs = await readCardByUser(env, holder);
    const stillTheirs = theirs && !theirs.released && theirs.handle === next.handle;
    if (stillTheirs && !chain) throw new CardError('handle-taken', `@${next.handle} is already someone's card.`, 409);
    if (stillTheirs && theirs.onchain) throw new CardError('handle-taken', `@${next.handle} is already someone's card.`, 409);
    // The Tezos holder takes the handle back from an off-chain card.
    if (stillTheirs) await env.VISITS.put(USER_PREFIX + holder, JSON.stringify({ ...theirs, released: true, updatedAt: now.toISOString() }));
  }
  const card: TownCard = {
    ...next,
    onchain: chain ? { contract: PROFILE_CONTRACT, tokenId: chain.tokenId, owner: chain.owner, checkedAt: now.toISOString() } : null,
    createdAt: existing?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await env.VISITS.put(HANDLE_PREFIX + card.handle, user.userId);
  await env.VISITS.put(USER_PREFIX + user.userId, JSON.stringify(card));
  if (existing?.handle && existing.handle !== card.handle && (await userIdForHandle(env, existing.handle)) === user.userId) {
    await env.VISITS.delete(HANDLE_PREFIX + existing.handle);
  }
  if ((await userIdForHandle(env, card.handle)) !== user.userId) {
    await env.VISITS.put(USER_PREFIX + user.userId, JSON.stringify({ ...card, released: true }));
    throw new CardError('handle-taken', `Someone claimed @${card.handle} a moment ago. Pick another.`, 409);
  }
  return card;
}

export async function deleteCard(env: CardEnv, userId: string): Promise<void> {
  if (!env.VISITS) throw new CardError('unavailable', 'Cards are unavailable right now.', 503);
  const card = await readCardByUser(env, userId);
  if (card?.handle && (await userIdForHandle(env, card.handle)) === userId) await env.VISITS.delete(HANDLE_PREFIX + card.handle);
  await env.VISITS.delete(USER_PREFIX + userId);
}
