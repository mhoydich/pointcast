/** Product policy for the OFFLINE prototype. Resolve before challenge issuance.
 * Never rewrite the site_id of an already signed attempt.
 */
import { scoreTasks } from './protocol/protocol.mjs';
export const LEAGUE_ORIGINS = Object.freeze({
  pointcast: 'https://pointcast.xyz',
  'el-segundo': 'https://elsegundo.xyz',
  'industry-next': 'https://www.industrynext.xyz',
});
export const LEAGUE_SITE_IDS = Object.freeze(Object.keys(LEAGUE_ORIGINS));
const DISPLAY_TO_LEAGUE = Object.freeze({
  pointcast: 'pointcast',
  ues: 'pointcast',
  'el-segundo': 'el-segundo',
  'el-segundo-university': 'el-segundo',
  industrynext: 'industry-next',
  'industry-next': 'industry-next',
});
export function toLeagueSiteId(displayId) {
  if (typeof displayId !== 'string' || !Object.hasOwn(DISPLAY_TO_LEAGUE, displayId)) {
    throw new TypeError('Unknown site or edition');
  }
  return DISPLAY_TO_LEAGUE[displayId];
}
export function assertCanonicalLeagueSite(siteId) {
  if (typeof siteId !== 'string' || !Object.hasOwn(LEAGUE_ORIGINS, siteId)) {
    throw new TypeError('A signed Circuit scope must use a canonical parent site');
  }
  return siteId;
}
export function editionForPath(siteId, pathname) {
  assertCanonicalLeagueSite(siteId);
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//') || /[?#\\\x00-\x20]|%(?:2f|5c)/i.test(pathname)
      || new URL(pathname, LEAGUE_ORIGINS[siteId]).pathname !== pathname) {
    throw new TypeError('Expected a normalized absolute pathname without query or fragment');
  }
  if (siteId === 'pointcast' && (pathname === '/ues' || pathname.startsWith('/ues/'))) return 'ues';
  if (siteId === 'el-segundo' && (pathname === '/university' || pathname.startsWith('/university/'))) return 'el-segundo-university';
  return null;
}

/** Offline policy wrapper for trusted adjudication fixtures, not an input verifier.
 * Reject edition scopes instead of silently rewriting a signed record.
 */
export function scoreCanonicalTasks(events, context) {
  if (!Array.isArray(events) || !context || !Array.isArray(context.allowedTasks)) {
    throw new TypeError('Expected events and an explicit authoritative task manifest');
  }
  for (const event of events) assertCanonicalLeagueSite(event?.site_id);
  for (const task of context.allowedTasks) assertCanonicalLeagueSite(task?.site_id);
  return scoreTasks(events, context);
}
