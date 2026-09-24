/**
 * /brick-choir/watch/<CODE> — Rally watch mode. Serves the Rally page itself (src/pages/brick-choir/rally.astro),
 * which sees the /watch/<code> path and boots as a spectator: it follows that room's TV over the party relay and
 * renders the match locally (see the WATCH block in rally.astro). This function only rewrites the head so a shared
 * link unfurls as an invitation to that room. A bad code goes to the code-entry page at /brick-choir/watch.
 */
interface Env { ASSETS: { fetch: (input: Request | string | URL) => Promise<Response> } }

const esc = (value: string) => value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  const raw = String((params as { code?: string }).code || '');
  const code = raw.toUpperCase();
  const url = new URL(request.url);
  if (!/^[A-Z]{4}$/.test(code)) return Response.redirect(new URL('/brick-choir/watch', url).toString(), 302);
  if (raw !== code) return Response.redirect(new URL(`/brick-choir/watch/${code}${url.search}`, url).toString(), 301);

  let page = await env.ASSETS.fetch(new URL('/brick-choir/rally/', url));
  if (page.status >= 300 && page.status < 400) page = await env.ASSETS.fetch(new URL('/brick-choir/rally', url));
  if (!page.ok) return page;

  const title = `Watch Rally live · room ${code}`;
  const description = 'Pickleball on a living-room TV where every hit is a note. Pull up a seat in the stands, hear the match, and cheer.';
  const pageUrl = `https://pointcast.xyz/brick-choir/watch/${code}`;
  const setContent = (value: string) => ({ element(el: Element) { el.setAttribute('content', value); } });

  const rewritten = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(`${title} · PointCast`); } })
    .on('meta[name="description"]', setContent(description))
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(description))
    .on('meta[property="og:url"]', setContent(pageUrl))
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', 'https://pointcast.xyz/brick-choir/watch'); } })
    .on('head', { element(el) { el.append(`<meta name="robots" content="noindex"><meta name="twitter:title" content="${esc(title)}">`, { html: true }); } })
    .transform(page);

  const headers = new Headers(rewritten.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  return new Response(rewritten.body, { status: 200, headers });
};
