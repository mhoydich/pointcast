/** Keep the review preview free of unrelated sessions, ads and visit writes. */
export function isSignalAtlasPreview(pathname) {
  return pathname === '/signal-atlas' || pathname.startsWith('/signal-atlas/');
}
/** Relative assets require the directory URL, even before Pages routing. */
export function signalAtlasDirectoryRedirect(requestUrl) {
  const target = new URL(requestUrl);
  if (!['/signal-atlas', '/signal-atlas/observatory'].includes(target.pathname)) return null;
  target.pathname += '/';
  return Response.redirect(target.toString(), 308);
}
export function withSignalAtlasPreviewHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
