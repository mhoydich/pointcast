export const GITHUB_IDENTITY_PERMISSION_COPY = 'GitHub verifies your public account identity. PointCast keeps your account ID, username, name, and avatar; it discards the access token. This sign-in requests no repository or email permissions.';

export function buildGitHubConnectionView(user, available = null) {
  const identity = Array.isArray(user?.identities) ? user.identities.find((item) => item.provider === 'github' && /^[1-9]\d*$/.test(item.id) && item.verifiedAt) : null;
  const connected = Boolean(identity);
  const checking = user === undefined || available === null;
  return {
    connected,
    state: connected ? 'connected' : checking ? 'checking' : available ? 'available' : 'unavailable',
    badge: connected ? 'LINKED' : checking ? 'CHECKING' : available ? 'AVAILABLE' : 'UNAVAILABLE',
    status: connected ? 'GitHub is linked to this PointCast account.'
      : checking ? 'Checking GitHub sign-in availability…'
        : available ? 'Use your public GitHub identity to sign in.' : 'GitHub sign-in is not available on this site yet.',
    action: connected ? 'GitHub linked' : checking ? 'Checking GitHub…'
      : available ? user ? 'Link GitHub →' : 'Sign in with GitHub →' : 'GitHub unavailable',
    disabled: connected || checking || !available,
  };
}

const MESSAGES = {
  'github-sign-in-required': 'Sign in to PointCast before linking GitHub.',
  'github-fresh-sign-in-required': 'Sign in again, then return here to link GitHub.',
  'github-session-changed': 'Your PointCast session changed. Check the signed-in account, then try again.',
  'github-already-linked': 'That GitHub account belongs to another PointCast account. Sign in to that account to use it.',
  'github-denied': 'GitHub sign-in was canceled.',
  'github-state-expired': 'The GitHub sign-in request expired. Please try again.',
  'github-state-invalid': 'The GitHub sign-in request could not be verified. Please try again.',
  'github-secure-origin-required': 'Open the HTTPS version of PointCast to sign in with GitHub.',
  'github-start-failed': 'GitHub sign-in could not start. Please try again.',
  'github-invalid-intent': 'Choose Sign in with GitHub or Link GitHub again.',
  'github-missing-callback': 'GitHub did not return a complete sign-in response. Please try again.',
  'github-token-failed': 'GitHub could not complete the sign-in request. Please try again.',
  'github-profile-failed': 'Your GitHub identity could not be verified. Please try again.',
  'github-verification-failed': 'GitHub sign-in could not be verified. Please try again.',
  'github-not-configured': 'GitHub sign-in is not available on this site yet.',
  'github-scope-mismatch': 'This GitHub authorization has extra permissions. Remove PointCast from GitHub’s authorized OAuth apps, then try sign-in again.',
};

export function githubConnectionMessage(reason) {
  return MESSAGES[reason] || 'GitHub sign-in could not be completed. Please try again.';
}

export function githubCallbackMessage(search) {
  const params = new URLSearchParams(search);
  const error = params.get('auth_error');
  if (error?.startsWith('github-')) return githubConnectionMessage(error);
  if (params.get('auth') === 'github-linked') return 'GitHub is linked to your PointCast account.';
  return params.get('auth') === 'github' ? 'Signed in with GitHub.' : '';
}
