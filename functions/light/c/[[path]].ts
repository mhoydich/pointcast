/**
 * /light/c/<id> — one Light Companion circle. The id in the path is the
 * circle link: anyone who has it is in the circle. This function serves the
 * same static shell (public/light/circle/index.html) for every circle and
 * never looks the circle up, so opening a link stores nothing.
 *
 *   /light/c/<id>                        the circle page
 *   /light/c/<id>/manifest.webmanifest   a manifest whose start_url is this
 *                                        circle, so "Add to Home Screen" opens it
 *
 * Responses are never cached, never indexed, and send no referrer, so the
 * link does not leak to search engines or to pages it links to.
 * functions/_middleware.ts passes /light/c/* straight through for the same
 * reason: no visit log, no unfurl-card URL built from the path.
 */
interface Env { ASSETS?: { fetch: (input: Request | string | URL) => Promise<Response> } }

const ID_RE = /^[a-z0-9]{32}$/;
const PRIVATE = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
};

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  const parts = ([] as string[]).concat((params as { path?: string | string[] }).path || []);
  const url = new URL(request.url);
  const id = parts[0] || '';
  if (!ID_RE.test(id) || parts.length > 2) return Response.redirect(new URL('/light/', url).toString(), 302);

  if (parts[1] === 'manifest.webmanifest') {
    const manifest = {
      name: 'Light Companion',
      short_name: 'Light',
      description: 'A small shared light between people.',
      id: '/light/c/',
      start_url: `/light/c/${id}`,
      scope: '/light/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#14110f',
      theme_color: '#14110f',
      icons: [
        { src: '/light/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/light/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/light/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    };
    return new Response(JSON.stringify(manifest), { headers: { ...PRIVATE, 'Content-Type': 'application/manifest+json; charset=utf-8' } });
  }
  if (parts[1]) return Response.redirect(new URL(`/light/c/${id}`, url).toString(), 302);

  if (!env.ASSETS) return new Response('Light Companion needs the static site to serve this page.', { status: 503, headers: PRIVATE });
  let page = await env.ASSETS.fetch(new URL('/light/circle/', url));
  if (page.status >= 300 && page.status < 400) page = await env.ASSETS.fetch(new URL('/light/circle/index.html', url));
  if (!page.ok) return new Response('The circle page is missing from this build.', { status: 502, headers: PRIVATE });
  return new Response(page.body, { status: 200, headers: { ...PRIVATE, 'Content-Type': 'text/html; charset=utf-8' } });
};
