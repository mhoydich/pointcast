/** Paths that deliberately stay public but must never be indexed or listed. */
export const NOINDEX_PATHS = new Set([
  '/25/thanks/',
  '/auth/project/',
  '/beach-commons/v6/thanks/',
  '/desk/',
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
