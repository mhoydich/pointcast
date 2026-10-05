// Only the approved mortality feature omits account/session restoration.
const QUIET_UES_STUDIES = new Set(['/ues/death']);
export function isQuietUesStudyPath(pathname) {
  return QUIET_UES_STUDIES.has(pathname.replace(/(?:\/index\.html|\.html|\/)$/, ''));
}
