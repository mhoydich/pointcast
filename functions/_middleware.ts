/**
 * _middleware — runs on every Pages request.
 *
 * Purpose: auto-log AI crawler / bot / spider visits server-side. Most
 * non-human clients don't execute JS, so the human JS widget flow can't
 * catch them. This middleware classifies the incoming UA and, for anything
 * that's not a human browser, fires a fire-and-forget log write with a
 * random nounId for visual identity in the feed.
 *
 * Humans are intentionally skipped here — they get the interactive 10s
 * regenerate widget on the client side.
 *
 * Only HTML GETs are processed (asset requests, API calls, preflights are
 * ignored). The log is throttled per-IP at the recordVisit layer so a
 * crawler's repeat hits within an hour won't spam the feed.
 */

import { classifyUA, recordVisit, NOUN_ID_RANGE, type Env } from './api/visit';

const STATIC_ASSET_REGEX = /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|map|xml|json|txt|mp3|mp4|webm)(\?|$)/i;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next, waitUntil } = context;

  // Only process HTML GETs — skip API calls, static assets, preflights.
  const url = new URL(request.url);
  const isGet = request.method === 'GET';
  const looksLikeAsset = STATIC_ASSET_REGEX.test(url.pathname);
  const isApiRoute = url.pathname.startsWith('/api/');
  const accept = request.headers.get('accept') ?? '';
  const wantsHtml = accept.includes('text/html') || accept === '' || accept === '*/*';

  // Canonicalize www → apex. Pages' _redirects file only handles same-host
  // redirects; cross-host (www↔apex) has to run in a Function. This keeps
  // link-preview scrapers (iMessage, Slack, Twitter) caching against one
  // URL per page so unfurls are reliable and consistent.
  if (url.hostname === 'www.pointcast.xyz') {
    const target = new URL(url.pathname + url.search, 'https://pointcast.xyz');
    return Response.redirect(target.toString(), 301);
  }

  // /admin/* gate — requires a matching token. Accepts either:
  //   • query ?k=<ADMIN_TOKEN>  (one-time, sets a cookie on success)
  //   • cookie pc_admin=<ADMIN_TOKEN>  (sticky across subsequent requests)
  //
  // Unauthorized loads fall through to 404 rather than a visible "admin"
  // gate — less signal to a stranger that there's anything here at all.
  // If no ADMIN_TOKEN is configured, /admin/* stays reachable (so Mike
  // isn't locked out during initial setup).
  if (url.pathname.startsWith('/admin/') && isGet) {
    const adminToken = (env as any).ADMIN_TOKEN as string | undefined;
    if (adminToken && adminToken.length > 0) {
      const cookieHeader = request.headers.get('cookie') ?? '';
      const cookieMatch = cookieHeader.match(/(?:^|;\s*)pc_admin=([^;]+)/);
      const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
      const queryToken = url.searchParams.get('k') ?? '';
      const ok = cookieToken === adminToken || queryToken === adminToken;
      if (!ok) {
        return new Response('Not Found', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
      // If the user supplied the token as ?k=, set a cookie + redirect to
      // the cleaner URL so the token doesn't stay in browser history /
      // referrer headers.
      if (queryToken && queryToken === adminToken && cookieToken !== adminToken) {
        const cleanUrl = new URL(url.toString());
        cleanUrl.searchParams.delete('k');
        const resp = Response.redirect(cleanUrl.toString(), 302);
        // Response.redirect returns immutable — rebuild with our cookie header.
        return new Response(null, {
          status: 302,
          headers: {
            'Location': cleanUrl.toString(),
            // Session cookie (no Max-Age), httpOnly, secure, same-site strict
            'Set-Cookie': `pc_admin=${encodeURIComponent(adminToken)}; Path=/admin; HttpOnly; Secure; SameSite=Strict`,
          },
        });
      }
    }
  }

  if (isGet && !looksLikeAsset && !isApiRoute && wantsHtml && env.VISITS) {
    const ua = request.headers.get('user-agent') ?? '';
    const type = classifyUA(ua);

    // Humans: skip — let the JS widget on the page handle their log entry.
    // Non-humans: auto-log with a random noun so they show up in the feed.
    if (type !== 'human' && type !== 'unknown') {
      const nounId = Math.floor(Math.random() * NOUN_ID_RANGE);
      waitUntil(
        recordVisit({
          env,
          ip: request.headers.get('cf-connecting-ip') ?? 'unknown',
          ua,
          cf: (request as any).cf,
          nounId,
          forcedType: type,
        }).catch(() => { /* fire-and-forget */ }),
      );
    }
  }

  return next();
};
