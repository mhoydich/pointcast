import { isFutureAlmanacCard } from './almanac-seo.mjs';

/** Paths that deliberately stay public but must never be indexed or listed. */
export const NOINDEX_PATHS = new Set([
  '/catan/flyer/',
  '/25/thanks/',
  '/auth/project/',
  '/beach-commons/v6/thanks/',
  '/desk/',
  '/cartography/pilot/',
  '/cartography/sprint/',
  // Field Reports: /court is the courts spot under a short name (/r/courts is
  // the page to index), /r/me is one phone's own card, and /r/assign is the
  // house's assignment desk.
  '/court/',
  '/r/me/',
  '/r/assign/',
  // The reserved /r/board id only redirects to /pickleball (the page to index).
  '/r/board/',
  // The launchpad case study stays unlisted until its case-06 entry ships.
  '/case-studies/launchpad/',
  // /battle-log reads one browser's localStorage; the indexable archive is /battle.
  '/battle-log/',
  // These pages already send <meta name="robots" content="noindex">; listing
  // them here keeps the auto sitemap from submitting a URL that says noindex.
  '/art/v2/commerce/',
  '/nouns/drum-club/bandmates/launch/',
  '/rewards/start/',
  '/station/party/',
  // Also noindex by their own meta; listed so no sitemap submits them.
  '/art/v2/',
  '/brick-choir/home-join/',
  '/brick-choir/join/',
  '/brick-choir/lanes-join/',
  '/brick-choir/park-join/',
  '/brick-choir/rally-join/',
  '/ues/plugin-field-guide/',
]);

/** Whole trees that are never indexed: admin desks (robots.txt already
 *  disallows them) and the shared-beat permalinks, which only redirect. */
export const NOINDEX_PREFIXES = ['/admin/', '/nouns/drum-club/bandmates/play/'];

// Sources with permanent redirects in public/_redirects or Pages middleware.
// Keep the slash variants together so sitemap producers cannot re-list them.
export const REDIRECT_PATHS = new Set([
  '/noggle-reserve/',
  '/noggle-reserve/index.html',
  '/noggle-reserve.json',
  '/dashboard/',
  '/login/',
  '/minted/',
  '/profile/',
  '/sitemap.xml',
]);

export function isNoindexPath(pathname, now = new Date()) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return NOINDEX_PATHS.has(path) || NOINDEX_PREFIXES.some((prefix) => path.startsWith(prefix)) || isFutureAlmanacCard(pathname, now);
}

export function isRedirectPath(pathname) {
  const path = pathname.endsWith('/') || pathname.includes('.') ? pathname : `${pathname}/`;
  return REDIRECT_PATHS.has(path);
}
