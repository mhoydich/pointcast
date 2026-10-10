// Explicitly approved quiet studies omit account/session restoration.
const QUIET_UES_STUDIES = new Set(['/ues/death', '/coastal-signal', '/coastal-signal-wallet', '/moon', '/sun', '/pacific', '/waves', '/air', '/reading/animation', '/reading/animation/avatar-the-last-airbender', '/reading/animation/hanna-barbera', '/reading/animation/saturday-morning-1980s']);
export function isQuietUesStudyPath(pathname) {
  return QUIET_UES_STUDIES.has(pathname.replace(/(?:\/index\.html|\.html|\/)$/, ''));
}
