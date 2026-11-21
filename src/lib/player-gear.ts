/**
 * Player Gear: an open (CC0) record of what pickleball players use, keyed to
 * the Paddle Register by paddle id. Pros come from a brand, press release or
 * dated article; everyone else only from their own word ("self-declared").
 * No rankings, ratings, ages, homes, photos or socials are kept here: rankings
 * and ratings are linked out to the official pages instead.
 */
import data from '../data/player-gear.json';
import { paddleById, paddleUrl, type Paddle } from './paddle-register';

export const GEAR_URL = 'https://pointcast.xyz/pickleball/gear';
export const PROS_URL = 'https://pointcast.xyz/pickleball/pros';

export type GearKind = 'paddle' | 'shoes' | 'ball' | 'bag' | 'apparel' | 'eyewear' | 'grip' | 'other';
export type Basis = 'brand' | 'news' | 'self-declared';

export interface GearItem {
  kind: GearKind; brand: string; model?: string | null; paddleId?: string | null; variant?: string | null;
  signature?: boolean; basis: Basis; source?: string | null; sourceDate?: string | null; note?: string | null;
}
export interface Fact { text: string; source: string; sourceDate?: string | null }
export interface Link { label: string; url: string }
export interface Person {
  slug: string; name: string; kind: 'pro' | 'player';
  gear: GearItem[]; career: Fact[]; links: Link[]; local?: Link | null;
}
export interface ResolvedGear extends GearItem { paddle?: Paddle }

const raw = data as { meta: Record<string, any>; people: Person[] };
export const GEAR_META = raw.meta;

const https = (u?: string | null) => (u && /^https:\/\//.test(u) ? u : null);

export const PEOPLE: (Person & { gear: ResolvedGear[] })[] = raw.people
  .map((p) => ({
    ...p,
    links: (p.links ?? []).filter((l) => https(l.url)),
    career: (p.career ?? []).filter((c) => c.text && https(c.source)),
    gear: (p.gear ?? [])
      // a pro's gear needs a source; a player's own word is its own source
      .filter((g) => g.brand && (g.basis === 'self-declared' || https(g.source)))
      .map((g) => ({ ...g, paddle: g.paddleId ? paddleById(g.paddleId) : undefined })),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const PROS = PEOPLE.filter((p) => p.kind === 'pro');
export const proUrl = (p: { slug: string }) => `/pickleball/pros/${p.slug}`;
export const personUrl = (p: Person) => (p.kind === 'pro' ? proUrl(p) : p.local?.url ?? `/pickleball/gear#${p.slug}`);
export const paddleOf = (p: { gear: ResolvedGear[] }) => p.gear.find((g) => g.kind === 'paddle');
export const gearHref = (g: ResolvedGear) => (g.paddle ? paddleUrl(g.paddle) : null);

/** Everyone who plays a given paddle line in the register. */
export const playersOf = (paddleId: string) =>
  PEOPLE.flatMap((person) => person.gear.filter((g) => g.kind === 'paddle' && g.paddleId === paddleId).map((g) => ({ person, gear: g })));

export const BASIS_WORDS: Record<Basis, string> = {
  brand: 'stated by the brand',
  news: 'reported in the news',
  'self-declared': 'in the player\'s own words',
};

export const KIND_WORDS: Record<GearKind, string> = {
  paddle: 'Paddle', shoes: 'Shoes', ball: 'Ball', bag: 'Bag', apparel: 'Apparel', eyewear: 'Eyewear', grip: 'Grip', other: 'Other',
};

/** One flat row per gear item, for the CSV and anyone who wants a table. */
export const gearRows = () =>
  PEOPLE.flatMap((p) =>
    p.gear.map((g) => ({
      person: p.name, person_slug: p.slug, person_kind: p.kind, kind: g.kind, brand: g.brand, model: g.model ?? '',
      variant: g.variant ?? '', paddle_id: g.paddleId ?? '', signature: g.signature ? 'yes' : 'no', basis: g.basis,
      source: g.source ?? '', source_date: g.sourceDate ?? '',
    })),
  );

export const publicPerson = (p: (typeof PEOPLE)[number]) => ({
  slug: p.slug, name: p.name, kind: p.kind,
  url: p.kind === 'pro' ? `${PROS_URL}/${p.slug}` : p.local?.url ?? `${GEAR_URL}#${p.slug}`,
  gear: p.gear.map(({ paddle, ...g }) => ({ ...g, paddleUrl: paddle ? `https://pointcast.xyz${paddleUrl(paddle)}` : null })),
  career: p.career, links: p.links, local: p.local ?? null,
});
