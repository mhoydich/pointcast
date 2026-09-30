import { id, MeError, publicCollection, publicProfile, type MeEnv } from './_library.ts';

export const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const style = `:root{color-scheme:light;font-family:system-ui,-apple-system,sans-serif;color:#203a35;background:#f4f3eb}*{box-sizing:border-box}body{margin:0}main{width:min(960px,100% - 36px);margin:32px auto 72px}nav,footer{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;font-size:13px}a{color:inherit;text-underline-offset:4px}header{padding:72px 0 40px;border-bottom:1px solid #ccd4c8}.eyebrow{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#577669}h1{font-size:clamp(38px,8vw,80px);letter-spacing:-.055em;line-height:1.04;margin:16px 0;overflow-wrap:anywhere}h2{font-size:22px;letter-spacing:-.02em}p{line-height:1.6;overflow-wrap:anywhere}.intro{max-width:620px;font-size:19px;color:#49635a}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px;margin:28px 0 40px}.card{background:#fffef9;border:1px solid #d3dbcd;border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:10px;overflow:hidden}.card h2,.card p{margin:0}.source{font-size:12px;color:#687c70;overflow-wrap:anywhere}.caption{color:#4b6357}.keep{font-size:12px;margin-top:auto;padding-top:20px}.links{display:flex;flex-wrap:wrap;gap:12px;padding:12px 0}.links a{border:1px solid #b7c5b3;border-radius:20px;padding:8px 16px}.noun{width:84px;height:84px;image-rendering:pixelated;border-radius:16px;background:#e3eadc}footer{border-top:1px solid #ccd4c8;padding-top:22px;color:#617564}button,input,select{font:inherit}button{padding:10px 16px;border:1px solid #849c85;border-radius:8px;background:#f4f3eb;color:#203a35;cursor:pointer}:focus-visible{outline:3px solid #527b60;outline-offset:4px}`;
export function publicDocument(
  kind: 'collection' | 'profile',
  value: Awaited<ReturnType<typeof publicCollection>> | Awaited<ReturnType<typeof publicProfile>>,
): string {
  const e = escapeHtml;
  const isCollection = 'items' in value;
  const title = isCollection ? value.title : value.name;
  const description = isCollection ? value.description : value.bio;
  const cards = isCollection
    ? value.items
        .map(
          (item) =>
            `<article class="card"><span class="source">${e(item.site)}</span><h2><a href="${e(item.url)}" rel="noopener noreferrer">${e(item.title)}</a></h2>${item.caption ? `<p class="caption">${e(item.caption)}</p>` : ''}<a class="keep" href="/me?keep=${encodeURIComponent(item.url)}#saved">Keep this →</a></article>`,
        )
        .join('')
    : value.featured
        .map(
          (collection) =>
            `<article class="card"><span class="source">${collection.count} saved ${collection.count === 1 ? 'thing' : 'things'}</span><h2><a href="${e(collection.url)}">${e(collection.title)}</a></h2><p>${e(collection.description)}</p></article>`,
        )
        .join('');
  const profile = !isCollection
    ? `<img class="noun" src="https://noun.pics/${value.noun}.svg" width="84" height="84" alt="Noun ${value.noun}"><div class="links">${value.links.map((link) => `<a href="${e(link.url)}" rel="noopener noreferrer">${e(link.label)}</a>`).join('')}</div>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)} · PointCast</title><meta name="description" content="${e(description)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><link rel="canonical" href="https://pointcast.xyz${e(value.url)}"><link rel="alternate" type="application/json" href="${e(value.url)}.json"><style>${style}</style></head><body><main><nav><a href="/">PointCast</a><a href="/me">Your Me →</a></nav><header><div class="eyebrow">${isCollection ? 'A PointCast collection' : 'A PointCast profile'}</div><h1>${e(title)}</h1><p class="intro">${e(description)}</p>${profile}</header><section class="grid" aria-label="${isCollection ? 'Published saved things' : 'Featured collections'}">${cards || '<p>Nothing on display just yet.</p>'}</section><footer><span>A few things worth coming back to.</span><a href="${e(value.url)}.json">JSON</a><a href="/me/report?type=${kind}&id=${encodeURIComponent(value.url.split('/').pop()!)}">Report this page</a></footer></main></body></html>`;
}
export async function handlePublic(
  request: Request,
  env: MeEnv,
  kind: 'collection' | 'profile',
  raw: string,
): Promise<Response> {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy':
      "default-src 'none'; style-src 'unsafe-inline'; img-src https://noun.pics; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  };
  if (!['GET', 'HEAD'].includes(request.method))
    return new Response(null, { status: 405, headers });
  const wantsJson = raw.endsWith('.json');
  try {
    const resourceId = id(raw.replace(/\.json$/, ''));
    if (!env.AUTH_DB) throw new MeError(503, 'unavailable');
    const value =
      kind === 'collection'
        ? await publicCollection(env.AUTH_DB, resourceId)
        : await publicProfile(env.AUTH_DB, resourceId);
    return new Response(
      request.method === 'HEAD'
        ? null
        : wantsJson
          ? JSON.stringify({ ok: true, ...value })
          : publicDocument(kind, value),
      {
        headers: {
          ...headers,
          'Content-Type': wantsJson
            ? 'application/json; charset=utf-8'
            : 'text/html; charset=utf-8',
        },
      },
    );
  } catch (error) {
    const status = error instanceof MeError ? error.status : 503;
    return new Response(
      request.method === 'HEAD'
        ? null
        : wantsJson
          ? JSON.stringify({ ok: false, reason: status === 404 ? 'not-found' : 'unavailable' })
          : `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>${status === 404 ? 'Not found' : 'Unavailable'} · PointCast</title><style>${style}</style><main><a href="/">PointCast</a><h1>${status === 404 ? 'Nothing on display here.' : 'Please try again shortly.'}</h1><p>${status === 404 ? 'This page may be private or no longer published.' : 'This public page is temporarily unavailable.'}</p></main></html>`,
      {
        status,
        headers: {
          ...headers,
          'Content-Type': wantsJson
            ? 'application/json; charset=utf-8'
            : 'text/html; charset=utf-8',
        },
      },
    );
  }
}
