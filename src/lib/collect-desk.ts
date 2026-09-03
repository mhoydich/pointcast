import { KENNEL_CLUB, losAngelesDate, sittingOfTheDay, type KennelSitting } from './kennel-club';
export * from './collect-email';

export function collectDay(now = new Date()): string {
  return losAngelesDate(now);
}

export function collectSitting(now = new Date()): KennelSitting {
  return sittingOfTheDay(collectDay(now));
}

export function kennelGrid() {
  return KENNEL_CLUB.sittings.map((sitting) => ({
    day: sitting.day,
    tokenId: sitting.tokenId,
    name: sitting.name,
    breed: sitting.breed,
    title: sitting.title,
    mintDate: sitting.mintDate,
    image: sitting.image.webp,
    href: `/kennel-club/${sitting.slug}`,
  }));
}

export function claimedStreak(claimedDays: number[], todayDay: number): number {
  const claimed = new Set(claimedDays.filter((day) => day >= 1 && day <= 30));
  let cursor = Math.min(todayDay, 30);
  while (cursor > 0 && !claimed.has(cursor)) cursor -= 1;
  let streak = 0;
  while (cursor > 0 && claimed.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

export function longestClaimedStreak(claimedDays: number[]): number {
  const days = [...new Set(claimedDays)]
    .filter((day) => Number.isSafeInteger(day) && day >= 1 && day <= 30)
    .sort((a, b) => a - b);
  let longest = 0;
  let current = 0;
  let previous = 0;
  for (const day of days) {
    current = day === previous + 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = day;
  }
  return longest;
}

/** Next milestone threshold; null means the full 30-sitting run is complete. */
export function nextSealAt(claimedDays: number[]): 7 | 30 | null {
  if (longestClaimedStreak(claimedDays) < 7) return 7;
  return new Set(claimedDays.filter((day) => day >= 1 && day <= 30)).size < 30 ? 30 : null;
}
