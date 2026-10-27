// These local simulations do not restore the sitewide wallet session.
const QUIET_MIST_PATHS = new Set(['/dao', '/chain/agreement']);
export function isQuietMistPath(pathname) {
  return QUIET_MIST_PATHS.has(pathname.replace(/(?:\/index\.html|\.html|\/)$/, ''));
}
