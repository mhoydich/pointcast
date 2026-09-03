/**
 * "Today" for Kennel Club, decided at request time.
 *
 * PointCast deploys by hand, so anything that resolves today's sitting while
 * Astro is building is wrong the moment Los Angeles crosses midnight. This
 * module is the one shape every surface agrees on: the Pages Function that
 * serves /api/kennel-club/today, the live JSON twins, and the browser code
 * that repaints a prerendered page with the real sitting.
 *
 * Nothing here touches the DOM or the network — see kennel-today-client.ts
 * for the browser half.
 */
import {
  KENNEL_CLUB_CANONICAL,
  losAngelesDate,
  sittingOfTheDay,
  type KennelSitting,
} from './kennel-club';

export const KENNEL_TODAY_URL = '/api/kennel-club/today';
export const KENNEL_TODAY_SPEC = 'pointcast.kennel-club-today/v1';

export interface KennelTodayPayload {
  spec: typeof KENNEL_TODAY_SPEC;
  /** Los Angeles calendar date the answer was computed for. */
  date: string;
  /** 1–30. The sitting's day in the September calendar. */
  day: number;
  tokenId: number;
  slug: string;
  name: string;
  breed: string;
  title: string;
  wardrobe: string;
  alt: string;
  image: { png: string; webp: string };
  href: string;
  json: string;
  /** True only while this plate's own mint window is the live one. */
  inSeason: boolean;
  windowOpen: boolean;
  minted: number | null;
  claimsRemaining: number | null;
  claimsClaimed: number | null;
  /** False when the chain read failed and the counts are placeholders. */
  live: boolean;
  updatedAt: string;
}

export interface KennelTodayInput {
  now?: Date;
  date?: string;
  windowOpen?: boolean;
  minted?: number | null;
  claimsRemaining?: number | null;
  claimsClaimed?: number | null;
  live?: boolean;
}

/** Today's sitting, plus whatever live counts the caller managed to read. */
export function kennelTodayPayload(input: KennelTodayInput = {}): KennelTodayPayload {
  const date = input.date ?? losAngelesDate(input.now ?? new Date());
  const sitting: KennelSitting = sittingOfTheDay(date);
  return {
    spec: KENNEL_TODAY_SPEC,
    date,
    day: sitting.day,
    tokenId: sitting.tokenId,
    slug: sitting.slug,
    name: sitting.name,
    breed: sitting.breed,
    title: sitting.title,
    wardrobe: sitting.wardrobe,
    alt: sitting.alt,
    image: { png: sitting.image.png, webp: sitting.image.webp },
    href: `/kennel-club/${sitting.slug}`,
    json: `${KENNEL_CLUB_CANONICAL}/${sitting.slug}.json`,
    inSeason: sitting.mintDate === date,
    windowOpen: Boolean(input.windowOpen),
    minted: input.minted ?? null,
    claimsRemaining: input.claimsRemaining ?? null,
    claimsClaimed: input.claimsClaimed ?? null,
    live: Boolean(input.live),
    updatedAt: new Date().toISOString(),
  };
}
