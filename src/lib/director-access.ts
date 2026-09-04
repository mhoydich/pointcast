import type { PointCastUser } from './auth/types';

export const DIRECTOR_ADMIN_ADDRESS = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';

const TEZOS_PROVIDERS = new Set(['kukai', 'temple', 'umami', 'metamask-tezos']);

export interface DirectorSession {
  user?: PointCastUser;
}

export function isDirector(session: DirectorSession | null | undefined): boolean {
  return Boolean(session?.user?.roles?.includes('broadcaster'));
}

export function hasLinkedDirectorWallet(user: PointCastUser | null | undefined): boolean {
  return Boolean(user?.identities?.some((identity) => {
    const provider = String(identity.provider);
    const isTezosIdentity = TEZOS_PROVIDERS.has(provider)
      || (provider === 'metamask' && identity.id.startsWith('tz'));
    return isTezosIdentity && identity.id === DIRECTOR_ADMIN_ADDRESS;
  }));
}

export function hasDirectorDeskAccess(session: DirectorSession | null | undefined): boolean {
  return isDirector(session) || hasLinkedDirectorWallet(session?.user);
}
