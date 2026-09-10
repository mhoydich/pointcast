export const X_IDENTITY_PERMISSION_COPY = 'X asks for permission to read posts and your profile for this identity lookup. PointCast discards the access token afterward without storing it. This sign-in does not authorize posts or direct messages.';

/** Session identity is the only source for an X handle. Never use profile links or browser storage. */
export function buildXConnectionView(user, available = null) {
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const identity = identities.find((item) => item.provider === 'x' && /^\d+$/.test(item.id) && item.verifiedAt);
  const username = typeof identity?.username === 'string' && /^[A-Za-z0-9_]{1,15}$/.test(identity.username)
    ? identity.username : null;
  const connected = Boolean(identity);
  const checking = user === undefined || available === null;
  const canDisconnect = connected && identities.some((item) => item.provider !== 'x');
  return {
    connected,
    id: identity?.id || null,
    username,
    href: username ? `https://x.com/${username}` : null,
    state: connected ? 'connected' : checking ? 'checking' : available ? 'available' : 'unavailable',
    badge: connected ? 'LINKED' : checking ? 'CHECKING' : available ? 'AVAILABLE' : 'UNAVAILABLE',
    status: connected
      ? username ? `@${username} is linked to this PointCast account.` : 'Your verified X account is linked.'
      : checking ? 'Checking X sign-in availability…'
        : available ? 'Use your X account to sign in to PointCast.' : 'X sign-in is not available on this site yet.',
    action: connected ? 'X linked' : checking ? 'Checking X…' : available ? user ? 'Link X →' : 'Sign in with X →' : 'X unavailable',
    disabled: connected || checking || !available,
    canDisconnect,
    disconnectHint: connected && !canDisconnect ? 'Add another sign-in method before disconnecting X.' : '',
  };
}

const X_MESSAGES = {
  'unauthorized': 'Sign in to PointCast before managing X.',
  'x-sign-in-required': 'Sign in to PointCast before linking X.',
  'fresh-sign-in-required': 'Sign in again, then return here to manage X.',
  'x-fresh-sign-in-required': 'Sign in again, then return here to link X.',
  'x-session-changed': 'Your PointCast session changed. Check the signed-in account, then try again.',
  'x-last-sign-in-method': 'Add another sign-in method before disconnecting X.',
  'x-not-linked': 'This X account is no longer linked. Refresh your profile.',
  'x-already-linked': 'That X account is linked to another PointCast account. Sign in to that account to manage it.',
  'x-account-already-linked': 'This PointCast account already has a different X account linked.',
  'x-denied': 'X sign-in was canceled. Your existing PointCast connections are unchanged.',
  'x-state-expired': 'The X sign-in request expired. Please try again.',
  'x-state-invalid': 'The X sign-in request could not be verified. Please try again.',
  'x-secure-origin-required': 'Open the HTTPS version of PointCast to sign in with X.',
  'x-start-failed': 'X sign-in could not start. Please try again.',
  'x-invalid-intent': 'Open your PointCast profile and choose Sign in with X or Link X again.',
  'x-missing-callback': 'X did not return a complete sign-in response. Please sign in again.',
  'x-token-failed': 'X could not complete the sign-in request. Please try again.',
  'x-profile-failed': 'Your X profile could not be read. Please try signing in again.',
  'x-verification-failed': 'X sign-in could not be verified. Please try again.',
  'x-not-configured': 'X sign-in is not available on this site yet.',
  'd1-not-bound': 'X connections are not available on this site yet.',
  'cross-origin-request': 'Open your PointCast profile directly and try again.',
};

export function xConnectionMessage(reason) {
  return X_MESSAGES[reason] || 'The X connection could not be updated. Please try again.';
}

export function xCallbackMessage(search) {
  const params = new URLSearchParams(search);
  const error = params.get('auth_error');
  if (error?.startsWith('x-')) return xConnectionMessage(error);
  if (params.get('auth') === 'x-linked') return 'X is linked to your PointCast account.';
  if (params.get('auth') === 'x') return 'Signed in with X.';
  return '';
}
