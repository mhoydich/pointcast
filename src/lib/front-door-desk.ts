import type { AuthSession, PointCastUser } from './auth/types';

export interface FrontDoorSession {
  session?: AuthSession;
  user?: PointCastUser;
}

export function isDirector(session: FrontDoorSession | null | undefined): boolean {
  return Boolean(session?.user?.roles?.includes('broadcaster'));
}

export function claimedToday(claimedDays: unknown, day: number): boolean {
  return Array.isArray(claimedDays) && claimedDays.some((value) => Number(value) === day);
}
