// Explicitly approved quiet studies omit account/session restoration.
const QUIET_UES_STUDIES = new Set(['/ues/death', '/coastal-signal']);
export function isQuietUesStudyPath(pathname) {
  return QUIET_UES_STUDIES.has(pathname.replace(/(?:\/index\.html|\.html|\/)$/, ''));
}
