/**
 * Share-card plumbing for /loom?to=<address> (OFF-31). Pure logic lives in
 * src/lib/loom/share-card.mjs; this file reads the thread and rewrites tags.
 * Everything fails open: any error returns the static page untouched.
 */
import { handleLoom } from '../../src/lib/loom/service.mjs';
import { parseAddress } from '../../src/lib/loom/address.mjs';
import { metaFor, summarize } from '../../src/lib/loom/share-card.mjs';

export type LoomShareEnv = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace };

/** Read a thread through the service itself (same kv binding as /api/loom). Null when missing or unreadable. */
export async function readThread(origin: string, to: string, env: LoomShareEnv) {
  const kv = env.PC_LOOM_KV ?? env.VISITS ?? null;
  if (!kv) return null;
  const res = await handleLoom(new Request(`${origin}/api/loom?to=${encodeURIComponent(to)}`), { kv });
  if (!res.ok) return null;
  const data: any = await res.json();
  return data?.ok ? data : null;
}

const attr = (s: string) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Rewrite the static /loom page's head for one thread. `page` is untouched on any failure before streaming. */
export async function loomShareResponse(page: Response, request: Request, env: LoomShareEnv): Promise<Response> {
  try {
    const url = new URL(request.url);
    const to = url.searchParams.get('to');
    if (!to || !(page.headers.get('content-type') ?? '').startsWith('text/html')) return page;
    parseAddress(to); // invalid -> throws -> static page
    const data = await readThread(url.origin, to, env);
    if (!data) return page;
    const summary = summarize(data, to);
    const m = metaFor(summary, to, data.seq);
    const set = (value: string, name = 'content') => ({ element(e: Element) { e.setAttribute(name, value); } });
    const out = new HTMLRewriter()
      .on('title', { element(e) { e.setInnerContent(m.title); } })
      .on('meta[property="og:title"]', set(m.title))
      .on('meta[property="og:description"], meta[name="description"]', set(m.description))
      .on('meta[property="og:url"]', set(m.url))
      .on('meta[name="twitter:card"]', set(m.twitterCard))
      .on('link[rel="canonical"]', set(m.canonical, 'href'))
      // The build gives every page a fallback og:image (src/lib/seo-build.mjs); drop it and its size and
      // type tags so the thread card below is the only image, and the unfurl rewrite plans from it.
      .on('meta[property^="og:image"], meta[name^="twitter:image"]', { element(e) { if (m.image) e.remove(); } })
      .on('head', {
        element(e) {
          e.onEndTag((end) => {
            const tags = [
              `<meta name="twitter:title" content="${attr(m.title)}">`,
              `<meta name="twitter:description" content="${attr(m.description)}">`,
            ];
            if (m.image) {
              tags.push(
                `<meta property="og:image" content="${attr(m.image)}">`,
                '<meta property="og:image:type" content="image/png">',
                `<meta property="og:image:width" content="${m.imageWidth}">`,
                `<meta property="og:image:height" content="${m.imageHeight}">`,
                `<meta property="og:image:alt" content="${attr(m.imageAlt)}">`,
                `<meta name="twitter:image" content="${attr(m.image)}">`,
                `<meta name="twitter:image:alt" content="${attr(m.imageAlt)}">`,
              );
            }
            if (m.noindex) tags.push('<meta name="robots" content="noindex">');
            else tags.push(`<link rel="alternate" type="application/rss+xml" href="${attr(m.rss)}" title="${attr(m.rssTitle)}">`);
            end.before(tags.join(''), { html: true });
          });
        },
      })
      .transform(page);
    const headers = new Headers(out.headers);
    for (const h of ['ETag', 'Last-Modified', 'Content-Length']) headers.delete(h);
    headers.set('Cache-Control', 'public, max-age=60');
    headers.set('X-PointCast-Loom-Card', 'thread');
    return new Response(out.body, { status: out.status, statusText: out.statusText, headers });
  } catch {
    return page;
  }
}
