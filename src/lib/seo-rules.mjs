/** Paths that deliberately stay public but must never be indexed or listed. */
export const NOINDEX_PATHS = new Set([
  '/25/thanks/',
  '/auth/project/',
  '/beach-commons/v6/thanks/',
]);

export function isNoindexPath(pathname) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return NOINDEX_PATHS.has(path);
}
