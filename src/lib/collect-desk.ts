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
