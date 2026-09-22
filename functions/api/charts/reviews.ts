/**
 * /api/charts/reviews — this week's album reviews, as headlines.
 *
 * A reading list, not a copy: for each review the town keeps the headline, the link, the
 * publication and the date, exactly what the publication's own public feed offers for that
 * purpose. No review text, no scores lifted from anyone's page. Click through and read them
 * where they were written.
 *
 * Feeds are fetched in parallel with a short timeout; a feed that fails is simply absent.
 * The list is edge-cached for thirty minutes. Headlines are untrusted text: entities are
 * decoded, tags stripped, lengths capped, and links must be https on the publication's own host.
 */
const UA = 'Mozilla/5.0 (compatible; PointCastCharts/1.0; +https://pointcast.xyz/charts)';

export const FEEDS: { id: string; name: string; url: string; host: RegExp; reviewsOnly: boolean }[] = [
  { id: 'pitchfork', name: 'Pitchfork', url: 'https://pitchfork.com/feed/feed-album-reviews/rss', host: /(^|\.)pitchfork\.com$/, reviewsOnly: true },
  { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/music/music+tone/albumreview/rss', host: /(^|\.)theguardian\.com$/, reviewsOnly: true },
  { id: 'nme', name: 'NME', url: 'https://www.nme.com/reviews/album/feed', host: /(^|\.)nme\.com$/, reviewsOnly: true },
  { id: 'stereogum', name: 'Stereogum · Album of the Week', url: 'https://www.stereogum.com/category/reviews/album-of-the-week/feed/', host: /(^|\.)stereogum\.com$/, reviewsOnly: true },
  { id: 'loudandquiet', name: 'Loud and Quiet', url: 'https://www.loudandquiet.com/reviews/feed/', host: /(^|\.)loudandquiet\.com$/, reviewsOnly: true },
  { id: 'quietus', name: 'The Quietus', url: 'https://thequietus.com/feed', host: /(^|\.)thequietus\.com$/, reviewsOnly: false },
  { id: 'bandcamp', name: 'Bandcamp Daily', url: 'https://daily.bandcamp.com/feed', host: /(^|\.)bandcamp\.com$/, reviewsOnly: false },
  { id: 'aquarium', name: 'Aquarium Drunkard', url: 'https://aquariumdrunkard.com/feed/', host: /(^|\.)aquariumdrunkard\.com$/, reviewsOnly: false },
  { id: 'npr', name: 'NPR Music', url: 'https://feeds.npr.org/1104/rss.xml', host: /(^|\.)npr\.org$/, reviewsOnly: false },
];

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…' };
export function plain(raw: string, max = 180): string {
  return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Math.min(0x10ffff, parseInt(h, 16) || 32))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Math.min(0x10ffff, Number(d) || 32)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m).replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export interface Headline { source: string; sourceId: string; title: string; url: string; at: string; reviewsOnly: boolean }

/** RSS 2.0 and Atom, by regular expression: the town only needs three fields, and a feed is not trusted to be well-formed. */
export function parseFeed(xml: string, feed: (typeof FEEDS)[number], now = Date.now()): Headline[] {
  const out: Headline[] = [];
  for (const m of xml.slice(0, 600_000).matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/g)) {
    const block = m[0], tag = (t: string) => new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`, 'i').exec(block)?.[1] ?? '';
    const title = plain(tag('title')); if (!title) continue;
    const href = plain(tag('link'), 600) || /<link[^>]*\shref="([^"]+)"/i.exec(block)?.[1] || '';
    let url = ''; try { const u = new URL(href.trim()); if (u.protocol === 'https:' && feed.host.test(u.hostname)) { u.hash = ''; for (const k of [...u.searchParams.keys()]) if (/^utm_|^ref$|^CMP$/i.test(k)) u.searchParams.delete(k); url = u.toString(); } } catch { /* skip */ }
    if (!url) continue;
    const when = Date.parse(plain(tag('pubDate') || tag('published') || tag('updated') || tag('dc:date'), 60));
    if (!Number.isFinite(when) || when > now + 86400000 || when < now - 21 * 86400000) continue; // three weeks is "new"
    out.push({ source: feed.name, sourceId: feed.id, title, url, at: new Date(when).toISOString(), reviewsOnly: feed.reviewsOnly });
    if (out.length >= 12) break;
  }
  return out;
}

export async function reviewHeadlines(fetcher: typeof fetch = fetch, now = Date.now()) {
  const lists = await Promise.all(FEEDS.map(async (f) => { try { const r = await fetcher(f.url, { headers: { 'User-Agent': UA, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(6000) }); return r.ok ? parseFeed(await r.text(), f, now) : []; } catch { return []; } }));
  const seen = new Set<string>();
  const all = lists.flat().filter((h) => (seen.has(h.url) ? false : (seen.add(h.url), true))).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return { headlines: all.slice(0, 60), sources: FEEDS.map((f, i) => ({ id: f.id, name: f.name, reviewsOnly: f.reviewsOnly, count: lists[i].length })) };
}

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };
export async function handleReviews(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'GET') return new Response(JSON.stringify({ ok: false }), { status: 405, headers });
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default, key = new Request('https://pointcast.xyz/__charts/reviews/v1');
  const hit = await cache?.match(key).catch(() => undefined); if (hit) return hit;
  const body = await reviewHeadlines(fetcher), ok = body.headlines.length > 0;
  const res = new Response(JSON.stringify({ ok, generatedAt: new Date().toISOString(), method: 'Headlines, links, publication names and dates from each publication’s own public feed. No review text is copied. Read them where they were written.', ...body }), { status: ok ? 200 : 503, headers: { ...headers, 'Cache-Control': ok ? 'public, max-age=600, s-maxage=1800' : 'no-store' } });
  if (ok && cache) await cache.put(key, res.clone()).catch(() => undefined);
  return res;
}
export const onRequest: PagesFunction = ({ request }) => handleReviews(request);
