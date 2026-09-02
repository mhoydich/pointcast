/**
 * Kennel Club · The September Sitting.
 *
 * One calendar source powers the room, its plate pages, and both JSON doors.
 * Date handling deliberately uses Los Angeles rather than the build machine's
 * timezone: a sitting changes at local midnight, not UTC midnight.
 */
import series from '../data/kennel-club-september-sitting.json';
import {
  KENNEL_CLUB_CONTRACT,
  KENNEL_CLUB_EDITION,
  KENNEL_CLUB_NETWORK,
  KENNEL_CLUB_PRICE_MUTEZ,
} from './kennel-club-mint';

export const KENNEL_CLUB = series;
export const KENNEL_CLUB_CANONICAL = 'https://pointcast.xyz/kennel-club';
export const KENNEL_CLUB_TIME_ZONE = 'America/Los_Angeles';

export type KennelSitting = (typeof series.sittings)[number];
export type SittingStatus = 'past' | 'today' | 'future';

export function losAngelesDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KENNEL_CLUB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function sittingStatus(sitting: KennelSitting, date = losAngelesDate()): SittingStatus {
  if (sitting.mintDate < date) return 'past';
  if (sitting.mintDate > date) return 'future';
  return 'today';
}

/** The live sitting while the series is open; nearest plate outside September. */
export function sittingOfTheDay(date = losAngelesDate()): KennelSitting {
  return series.sittings.find((sitting) => sitting.mintDate === date)
    ?? (date < series.sittings[0].mintDate ? series.sittings[0] : series.sittings[series.sittings.length - 1]);
}

export function sittingUrl(sitting: KennelSitting): string {
  return `${KENNEL_CLUB_CANONICAL}/${sitting.slug}`;
}

export function sittingJsonUrl(sitting: KennelSitting): string {
  return `${sittingUrl(sitting)}.json`;
}

export function imageUrl(sitting: KennelSitting, format: 'png' | 'webp' = 'webp'): string {
  return `https://pointcast.xyz${sitting.image[format]}`;
}

export function calendar(date = losAngelesDate()) {
  return series.sittings.map((sitting) => ({
    day: sitting.day,
    date: sitting.mintDate,
    slug: sitting.slug,
    name: sitting.name,
    title: sitting.title,
    breed: sitting.breed,
    status: sittingStatus(sitting, date),
    image: { png: imageUrl(sitting, 'png'), webp: imageUrl(sitting, 'webp'), alt: sitting.alt },
    html: sittingUrl(sitting),
    json: sittingJsonUrl(sitting),
  }));
}

export function sittingPayload(sitting: KennelSitting) {
  return {
    spec: 'pointcast.kennel-club-sitting/v1',
    series: KENNEL_CLUB.id,
    canonical: sittingUrl(sitting),
    json: sittingJsonUrl(sitting),
    collection: KENNEL_CLUB_CANONICAL,
    collectionJson: `${KENNEL_CLUB_CANONICAL}.json`,
    mint: {
      chain: KENNEL_CLUB.mint.chain,
      contract: KENNEL_CLUB_CONTRACT,
      network: KENNEL_CLUB_NETWORK,
      priceMutez: KENNEL_CLUB_PRICE_MUTEZ,
      edition: KENNEL_CLUB_EDITION,
      status: 'live, paused until unpause',
      note: 'The live state is read from TzKT.',
      tokenId: sitting.tokenId,
      mintDate: sitting.mintDate,
    },
    sitting: {
      ...sitting,
      image: {
        ...sitting.image,
        png: imageUrl(sitting, 'png'),
        webp: imageUrl(sitting, 'webp'),
      },
    },
    attributes: sitting.tokenMetadata.attributes,
  };
}
