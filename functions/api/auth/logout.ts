/**
 * GET/POST /api/auth/logout — clears the pc_session cookie and redirects.
 *
 * Symmetric with /api/auth/google/callback: same Path=/, HttpOnly, Secure,
 * SameSite=Lax attributes so the browser actually honors the delete (some
 * browsers refuse to clear a cookie if the attributes don't match).
 *
 * Called from: /auth page's "sign out" button, HUD drawer's sign-out chip.
 *
 * Supports GET (so a plain `<a href>` can trigger it) and POST (form
 * posts). Query param `?next=/somewhere` controls the redirect target;
 * defaults to `/`. Rejects off-origin redirects.
 *
 * Sprint #91 A-3 — Mike: "logins... top priority on the go forward".
 * The sign-in flow is wired but there was no way out. Now there is.
 */

function clearCookie(name: string, extra: string[] = []): string {
  // Max-Age=0 + matching attributes = browser deletes the cookie.
  return [`${name}=`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=0', ...extra].join('; ');
}

function resolveNext(rawNext: string | null, origin: string): string {
  if (!rawNext) return '/';
  // Only accept same-origin paths. Reject `//evil.com` or `http://...`.
  if (rawNext.startsWith('//') || rawNext.includes(':')) return '/';
  if (!rawNext.startsWith('/')) return '/';
  return rawNext;
}

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const next = resolveNext(url.searchParams.get('next'), url.origin);

  const headers = new Headers();
  headers.set('Location', next);
  headers.append('Set-Cookie', clearCookie('pc_session'));
  // Also clear any lingering oauth state just in case.
  headers.append('Set-Cookie', clearCookie('pc_oauth_state'));
  headers.set('Cache-Control', 'no-store');

  return new Response(null, { status: 302, headers });
}

export const onRequestGet: PagesFunction = ({ request }) => handler(request);
export const onRequestPost: PagesFunction = ({ request }) => handler(request);
