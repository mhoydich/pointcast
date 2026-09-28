/** Paths that deliberately stay public but must never be indexed or listed. */
export const NOINDEX_PATHS = new Set([
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
]);

// Sources with permanent redirects in public/_redirects or Pages middleware.
// Keep the slash variants together so sitemap producers cannot re-list them.
export const REDIRECT_PATHS = new Set([
  '/dashboard/',
  '/login/',
  '/minted/',
  '/profile/',
  '/sitemap.xml',
]);

export function isNoindexPath(pathname) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return NOINDEX_PATHS.has(path);
}

export function isRedirectPath(pathname) {
  const path = pathname.endsWith('/') || pathname.includes('.') ? pathname : `${pathname}/`;
  return REDIRECT_PATHS.has(path);
}
