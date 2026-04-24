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
  // ── Markdown for Agents ──────────────────────────────────────────────────
  //
  // RFC / Cloudflare convention: if an agent sends Accept: text/markdown,
  // we return a markdown version of the page. HTML remains the default for
  // browsers. Per isitagentready.com 2026-04-20 audit goal: "Enable Markdown
  // for Agents so requests with Accept: text/markdown return a markdown
  // version of your HTML response while HTML stays the default."
  //
  // Implementation: cheap HTML → Markdown converter over the rendered body.
  // Handles the common tag set (h1-h6, p, a, strong/em, ul/ol/li, code/pre).
  // Good enough for blocks, about pages, /compute, /cadence, /contribute.
  // Lossy — some structural HTML (flex layouts, custom components) doesn't
  // roundtrip. We're optimizing for "agent gets the content" not "agent
  // gets a pixel-perfect rerender."
  if (wantsMarkdown(accept) && isGet && response.status === 200) {
    const ct = response.headers.get('content-type') ?? '';
    if (ct.startsWith('text/html')) {
      const html = await response.text();
      const md = htmlToMarkdown(html, url.pathname);
      const headers = new Headers();
      headers.set('Content-Type', 'text/markdown; charset=utf-8');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
      headers.set('X-Markdown-For-Agents', '1');
      headers.set('X-Markdown-Source', url.pathname);
      // Rough token estimate (~4 chars/token); capped at a reasonable value.
      headers.set('X-Markdown-Tokens', String(Math.min(Math.ceil(md.length / 4), 999999)));
      headers.set('Vary', 'Accept');
      return new Response(md, { status: 200, headers });
    }
  }

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

/** Detect Accept: text/markdown preference. Accept header may carry
 *  q-values; we do a loose contains check because the RFC and Cloudflare
 *  docs both spell it "text/markdown" verbatim. */
function wantsMarkdown(accept: string): boolean {
  if (!accept) return false;
  // Require text/markdown explicitly; don't transform for wildcard */*.
  return /\btext\/markdown\b/i.test(accept);
}

/** Minimal HTML → Markdown converter. Optimized for PointCast pages:
 *  block articles, about pages, /compute, /cadence, /contribute. Lossy
 *  for complex layouts; good enough for agent consumption.
 *
 *  Key moves:
 *   - Pull <title>, skip head/footer/nav/aside-that-isn't-main.
 *   - Collapse <main> content (falling back to <body> if no main).
 *   - Convert common block tags + inline tags to markdown.
 *   - Collapse whitespace, unescape entities.
 */
function htmlToMarkdown(html: string, pathname: string): string {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  // Extract <main> content (fall back to body if no main).
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = mainMatch ? mainMatch[1] : (bodyMatch ? bodyMatch[1] : html);

  // Drop script / style / head remnants.
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Drop site chrome tags that aren't editorial.
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    // Drop CoNavigator + strips (they're navigation aids, not content).
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  // Block-level conversions.
  body = body
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n\n##### $1\n\n')
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n\n###### $1\n\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
      return '\n\n' + String(inner).trim().split('\n').map((l) => '> ' + l).join('\n') + '\n\n';
    })
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n\n```\n$1\n```\n\n')
    .replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
    .replace(/<br\s*\/?>/gi, '  \n')
    // Lists: handle <li> first, then wrapping containers.
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');

  // Inline conversions. <a> first so href is captured before tag-strip.
  body = body
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<img\s+[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)')
    .replace(/<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img\s+[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Strip remaining tags.
  body = body.replace(/<[^>]+>/g, '');

  // Unescape entities.
  body = body
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…');

  // Collapse whitespace.
  body = body
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const header = [
    title ? `# ${title}` : '',
    `<!-- source: https://pointcast.xyz${pathname} · rendered as markdown for Accept: text/markdown -->`,
  ].filter(Boolean).join('\n') + '\n\n';
  return header + body + '\n';
}
