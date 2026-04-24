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

  // Pretty-URL rewrite — kill the 308 trailing-slash flash for top-level
  // release + game + companion routes. CF Pages otherwise 308-redirects
  // /gamgee → /gamgee/ before _redirects rules are parsed. We fetch the
  // trailing-slash version server-side and stream the body back so the
  // URL bar stays clean. Only routes that exist on main are listed.
  const PRETTY_ROUTES = new Set([
    '/gamgee',
    '/gandalf',
    '/farm',
    '/agent-derby',
    '/sitting-with-gandalf',
    '/talk',  // Voice Dispatch Phase 2 — merged via PR #30
    '/room',  // Spotify playlist companion — merged via PR #32
    '/profile',
    '/wire',  // PointCast Wire ticker — Sprint 17 (closes #31)
    '/scoreboard',  // cross-agent competition reporting — Sprint 24
    '/race/front-door',  // today's Front Door race — Sprint 25 (PR #18 scaffolds the /race hub)
    '/taproom',  // curated SoCal brewery carry list — Sprint 26
    // /listen still on PR #17 scaffold branch
  ]);
  if (isGet && wantsHtml && PRETTY_ROUTES.has(url.pathname)) {
    const internalUrl = new URL(url);
    internalUrl.pathname = url.pathname + '/';
    const upstream = await fetch(internalUrl.toString(), {
      headers: request.headers,
      redirect: 'follow',
    });
    // Re-emit the response at the original URL with the original pathname
    // preserved. Strip set-cookie-style or redirect-y headers from upstream.
    const headers = new Headers(upstream.headers);
    headers.delete('location');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
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

  const ua = request.headers.get('user-agent') ?? '';
  const type = isGet && !looksLikeAsset && !isApiRoute && wantsHtml
    ? classifyUA(ua)
    : 'unknown';

  if (isGet && !looksLikeAsset && !isApiRoute && wantsHtml && env.VISITS) {
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

  const response = await next();

  // ── Stripped-HTML agent mode ────────────────────────────────────────────
  //
  // BLOCKS.md Phase 2: "When User-Agent matches known agent patterns
  // (GPTBot, Claude-Web, Perplexity, Atlas, etc.), serve a stripped
  // HTML version: no CSS, no JS, pure semantic markup with rich JSON-LD
  // blobs."
  //
  // We transform the already-rendered Astro HTML on the way out via
  // HTMLRewriter. Agents get smaller, cheaper-to-parse HTML with all
  // the structural + JSON-LD signals intact.
  //
  // Triggers on any type starting with 'ai:' (GPTBot, ClaudeBot,
  // PerplexityBot, CCBot, Bytespider, Google-Extended, etc.). Humans,
  // unknown UAs, and non-AI bots (seo, social, search) get the full
  // experience unchanged.
  if (type.startsWith('ai:') && response.status === 200) {
    const ct = response.headers.get('content-type') ?? '';
    if (ct.startsWith('text/html')) {
      const rewriter = new HTMLRewriter()
        // Drop all runtime CSS: inline <style>, <link rel="stylesheet">,
        // font preloads. Agents don't execute CSS.
        .on('style', { element(el) { el.remove(); } })
        .on('link[rel="stylesheet"]', { element(el) { el.remove(); } })
        .on('link[rel="preconnect"]', { element(el) { el.remove(); } })
        .on('link[rel="preload"]', { element(el) { el.remove(); } })
        .on('link[rel~="icon"]', { element(el) { el.remove(); } })
        .on('link[rel="manifest"]', { element(el) { el.remove(); } })
        // Drop JS: all <script> EXCEPT JSON-LD. JSON-LD is structured
        // data the agent wants; anything else is client-side runtime
        // it doesn't execute.
        .on('script', {
          element(el) {
            const t = el.getAttribute('type');
            if (t === 'application/ld+json' || t === 'application/json+ld') return;
            el.remove();
          },
        })
        // Drop theme / browser chrome meta tags that aren't useful to
        // agents. Keep description, og:*, twitter:* (agents scrape these).
        .on('meta[name="theme-color"]', { element(el) { el.remove(); } })
        .on('meta[name="generator"]', { element(el) { el.remove(); } })
        // Drop Astro-injected style attributes on elements — these
        // reference CSS variables the stripped agent won't see anyway.
        .on('[style]', {
          element(el) { el.removeAttribute('style'); },
        });

      const transformed = rewriter.transform(response);
      // Clone headers so we can add the X-Agent-Mode signal.
      const headers = new Headers(transformed.headers);
      headers.set('X-Agent-Mode', `stripped · ${type}`);
      headers.set('X-Robots-Tag', 'index, follow');
      // Cache: same body per UA-class, safe to cache briefly at CDN.
      headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
      return new Response(transformed.body, {
        status: transformed.status,
        statusText: transformed.statusText,
        headers,
      });
    }
  }

  return response;
};
