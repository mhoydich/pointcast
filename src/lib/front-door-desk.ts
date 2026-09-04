import type { AuthSession, PointCastUser } from './auth/types';
export { hasDirectorDeskAccess, isDirector } from './director-access';

export interface FrontDoorSession {
  session?: AuthSession;
  user?: PointCastUser;
}

export function claimedToday(claimedDays: unknown, day: number): boolean {
  return Array.isArray(claimedDays) && claimedDays.some((value) => Number(value) === day);
}
