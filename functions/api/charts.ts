/**
 * /api/charts — the Chart Room's data: three public charts side by side, what they agree on,
 * what is new, and how each entry moved since the last snapshot.
 *
 * Sources, each used the way its owner publishes it, and each named on the page:
 *   listenbrainz  site-wide statistics (CC0 open data): what ListenBrainz's users played this
 *                 week. A real count, from a self-selected crowd; it is not "the world".
 *   apple         Apple Music's public most-played feed by country; if Apple's host refuses the
 *                 request, the iTunes Store's public top chart instead (purchases, not streams),
 *                 and the chart says which one it is.
 *   deezer        Deezer's public chart endpoint.
 * Billboard and Spotify's charts have no open feed and are not scraped.
 *
 * Nothing here is ranked by PointCast. "Consensus" is set arithmetic: the same song on two or
 * more of the song charts. Movement compares today's ranks with the most recent earlier
 * snapshot (one small KV document a day, written once).
 *
 * Responses are edge-cached an hour per country. Upstream text is untrusted: every field is
 * trimmed and length-capped here, every URL and image host is checked, and the page renders
 * with textContent.
 */
const UA = 'PointCastCharts/1.0 (https://pointcast.xyz/charts)';
const HOUR = 3600;
export const COUNTRIES: Record<string, string> = { us: 'United States', gb: 'United Kingdom', ca: 'Canada', mx: 'Mexico', br: 'Brazil', fr: 'France', de: 'Germany', es: 'Spain', it: 'Italy', se: 'Sweden', ng: 'Nigeria', za: 'South Africa', in: 'India', jp: 'Japan', kr: 'South Korea', au: 'Australia' };

type Env = { VISITS?: KVNamespace };
export interface ChartRow { rank: number; title: string; artist: string; url: string; img?: string; count?: number; key: string; move?: number | 'new' | null }
export interface Chart { id: string; name: string; source: string; sourceUrl: string; unit: string; note: string; rows: ChartRow[] }

const clean = (v: unknown, max = 140) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
/** Same song across services: lower-case, drop accents, "(feat. …)" / "- Remastered" tails, and punctuation. */
export const songKey = (title: string, artist: string) => {
  const n = (s: string) => s.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/\s*[\[(][^\])]*[\])]/g, ' ').replace(/\s+[-–—]\s+.*\b(remaster|version|edit|mix|live|mono|stereo)\b.*$/i, ' ').replace(/\b(feat\.?|featuring|with)\b.*$/i, ' ').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
  return `${n(title)}|${n(artist.split(/,| feat\.? | & | x /i)[0])}`;
};
const okUrl = (u: unknown, hosts: RegExp) => { try { const x = new URL(String(u)); return x.protocol === 'https:' && hosts.test(x.hostname) ? x.toString() : ''; } catch { return ''; } };
const IMG = /(^|\.)mzstatic\.com$|(^|\.)dzcdn\.net$|^coverartarchive\.org$/;

async function getJson<T>(url: string, fetcher: typeof fetch): Promise<T | null> {
  try { const r = await fetcher(url, { headers: { 'User-Agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(7000) }); return r.ok ? await r.json() as T : null; } catch { return null; }
}

const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const caa = (id: unknown) => (typeof id === 'string' && MBID.test(id) ? `https://coverartarchive.org/release/${id}/front-250` : undefined);

export async function listenbrainzChart(fetcher: typeof fetch): Promise<{ songs: Chart; artists: Chart; records: Chart } | null> {
  type P<T> = { payload?: T & { from_ts?: number; to_ts?: number } };
  const [rec, art, rg] = await Promise.all([
    getJson<P<{ recordings?: any[] }>>('https://api.listenbrainz.org/1/stats/sitewide/recordings?range=week&count=25', fetcher),
    getJson<P<{ artists?: any[] }>>('https://api.listenbrainz.org/1/stats/sitewide/artists?range=week&count=25', fetcher),
    getJson<P<{ release_groups?: any[] }>>('https://api.listenbrainz.org/1/stats/sitewide/release-groups?range=week&count=25', fetcher),
  ]);
  if (!rec && !art && !rg) return null;
  const base = { source: 'ListenBrainz', sourceUrl: 'https://listenbrainz.org/statistics/', unit: 'plays', note: 'Open data (CC0). Counted from what ListenBrainz’s users scrobbled last week: a real count from a self-selected crowd, not the world.' };
  const mk = (id: string, name: string, items: any[] | undefined, row: (x: any) => Omit<ChartRow, 'rank' | 'key'> | null): Chart => ({ id, name, ...base, rows: (Array.isArray(items) ? items : []).map(row).filter((x): x is Omit<ChartRow, 'rank' | 'key'> => Boolean(x && x.title)).slice(0, 25).map((x, i) => ({ rank: i + 1, key: songKey(x.title, x.artist), ...x })) });
  return {
    songs: mk('lb-songs', 'Songs', rec?.payload?.recordings, (x) => ({ title: clean(x?.track_name), artist: clean(x?.artist_name), url: typeof x?.recording_mbid === 'string' && MBID.test(x.recording_mbid) ? `https://musicbrainz.org/recording/${x.recording_mbid}` : 'https://listenbrainz.org/statistics/', img: caa(x?.caa_release_mbid), count: Number(x?.listen_count) || undefined })),
    artists: mk('lb-artists', 'Artists', art?.payload?.artists, (x) => ({ title: clean(x?.artist_name), artist: '', url: typeof x?.artist_mbid === 'string' && MBID.test(x.artist_mbid) ? `https://musicbrainz.org/artist/${x.artist_mbid}` : 'https://listenbrainz.org/statistics/', count: Number(x?.listen_count) || undefined })),
    records: mk('lb-records', 'Records', rg?.payload?.release_groups, (x) => ({ title: clean(x?.release_group_name), artist: clean(x?.artist_name), url: typeof x?.release_group_mbid === 'string' && MBID.test(x.release_group_mbid) ? `https://musicbrainz.org/release-group/${x.release_group_mbid}` : 'https://listenbrainz.org/statistics/', img: caa(x?.caa_release_mbid), count: Number(x?.listen_count) || undefined })),
  };
}

export async function appleChart(country: string, kind: 'songs' | 'albums', fetcher: typeof fetch): Promise<Chart | null> {
  const finish = (rows: { title: string; artist: string; url: string; img?: string }[]) => rows.filter((x) => x.title && x.url).slice(0, 25).map((x, i) => ({ rank: i + 1, key: songKey(x.title, x.artist), ...x }));
  // 1. Apple Music's most-played feed (streams). Apple's host refuses some server runtimes, so:
  const j = await getJson<{ feed?: { results?: any[] } }>(`https://rss.marketingtools.apple.com/api/v2/${country}/music/most-played/25/${kind}.json`, fetcher);
  const streamed = finish((Array.isArray(j?.feed?.results) ? j!.feed!.results! : []).map((x) => ({ title: clean(x?.name), artist: clean(x?.artistName), url: okUrl(x?.url, /^music\.apple\.com$/), img: okUrl(x?.artworkUrl100, IMG) || undefined })));
  if (streamed.length) return { id: `apple-${kind}-${country}`, name: kind === 'songs' ? 'Songs' : 'Albums', source: 'Apple Music', sourceUrl: 'https://music.apple.com/', unit: 'rank', note: `Apple’s public most-played feed for ${COUNTRIES[country]}: what people there are streaming. Ranks only.`, rows: streamed };
  // 2. …the iTunes Store's public top chart (purchases). A different crowd, and labelled as such.
  const k = await getJson<{ feed?: { entry?: any[] } }>(`https://itunes.apple.com/${country}/rss/top${kind}/limit=25/json`, fetcher);
  const bought = finish((Array.isArray(k?.feed?.entry) ? k!.feed!.entry! : []).map((x) => { const imgs = Array.isArray(x?.['im:image']) ? x['im:image'] : []; const link = Array.isArray(x?.link) ? x.link[0] : x?.link; return { title: clean(x?.['im:name']?.label), artist: clean(x?.['im:artist']?.label), url: okUrl(link?.attributes?.href, /^(music|itunes)\.apple\.com$/), img: okUrl(imgs[imgs.length - 1]?.label, IMG) || undefined }; }));
  return bought.length ? { id: `itunes-${kind}-${country}`, name: kind === 'songs' ? 'Songs' : 'Albums', source: 'iTunes Store', sourceUrl: 'https://www.apple.com/itunes/charts/', unit: 'rank', note: `The iTunes Store’s public top ${kind} for ${COUNTRIES[country]}: what people there are buying, which is not what they are streaming. Ranks only.`, rows: bought } : null;
}

export async function deezerChart(fetcher: typeof fetch): Promise<Chart | null> {
  const j = await getJson<{ data?: any[] }>('https://api.deezer.com/chart/0/tracks?limit=25', fetcher);
  const rows = (Array.isArray(j?.data) ? j!.data! : []).map((x) => ({ title: clean(x?.title), artist: clean(x?.artist?.name), url: okUrl(x?.link, /(^|\.)deezer\.com$/), img: okUrl(x?.album?.cover_medium, IMG) || undefined })).filter((x) => x.title && x.url).slice(0, 25).map((x, i) => ({ rank: i + 1, key: songKey(x.title, x.artist), ...x }));
  return rows.length ? { id: 'deezer-songs', name: 'Songs', source: 'Deezer', sourceUrl: 'https://www.deezer.com/channels/charts', unit: 'rank', note: 'Deezer’s public worldwide chart. Ranks only.', rows } : null;
}

export async function deezerAlbums(fetcher: typeof fetch): Promise<Chart | null> {
  const j = await getJson<{ data?: any[] }>('https://api.deezer.com/chart/0/albums?limit=25', fetcher);
  const rows = (Array.isArray(j?.data) ? j!.data! : []).map((x) => ({ title: clean(x?.title), artist: clean(x?.artist?.name), url: okUrl(x?.link, /(^|\.)deezer\.com$/), img: okUrl(x?.cover_medium, IMG) || undefined })).filter((x) => x.title && x.url).slice(0, 25).map((x, i) => ({ rank: i + 1, key: songKey(x.title, x.artist), ...x }));
  return rows.length ? { id: 'deezer-albums', name: 'Albums', source: 'Deezer', sourceUrl: 'https://www.deezer.com/channels/charts', unit: 'rank', note: 'Deezer’s public worldwide album chart. Ranks only.', rows } : null;
}

/** Debuts: entries that were not on their chart in the earlier snapshot. Billboard's word for it; still just a set difference. */
export function debuts(charts: Chart[]) {
  return charts.flatMap((c) => c.rows.filter((r) => r.move === 'new').map((r) => ({ title: r.title, artist: r.artist, url: r.url, img: r.img, rank: r.rank, chart: `${c.source} · ${c.name}` }))).sort((a, b) => a.rank - b.rank).slice(0, 18);
}

/** The same song on two or more of the song charts. Set arithmetic: no weighting, no score invented. */
export function consensus(charts: Chart[]) {
  const seen = new Map<string, { title: string; artist: string; on: { source: string; rank: number }[]; img?: string }>();
  for (const c of charts) for (const r of c.rows) { if (!r.key || r.key.startsWith('|')) continue; const e = seen.get(r.key) ?? { title: r.title, artist: r.artist, on: [], img: r.img }; if (!e.on.some((o) => o.source === c.source)) e.on.push({ source: c.source, rank: r.rank }); e.img ??= r.img; seen.set(r.key, e); }
  return [...seen.values()].filter((e) => e.on.length >= 2).sort((a, b) => b.on.length - a.on.length || a.on.reduce((s, o) => s + o.rank, 0) / a.on.length - b.on.reduce((s, o) => s + o.rank, 0) / b.on.length).slice(0, 15);
}

// ── movement: one small snapshot a day ──────────────────────────────
type Snap = Record<string, Record<string, number>>; // chart id → song key → rank
const snapKey = (day: string) => `charts:v1:snap:${day}`;
const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export function applyMovement(charts: Chart[], earlier: Snap | null) {
  for (const c of charts) { const was = earlier?.[c.id]; for (const r of c.rows) r.move = !was ? null : r.key in was ? was[r.key] - r.rank : 'new'; }
}
async function movement(env: Env, charts: Chart[], now: number): Promise<string | null> {
  if (!env.VISITS) { applyMovement(charts, null); return null; }
  const today = dayOf(now); let since: string | null = null, earlier: Snap | null = null;
  for (const back of [1, 2, 3, 7]) { const day = dayOf(now - back * 86400000); earlier = await env.VISITS.get<Snap>(snapKey(day), 'json').catch(() => null); if (earlier) { since = day; break; } }
  applyMovement(charts, earlier);
  if (!(await env.VISITS.get(snapKey(today)).catch(() => 'skip'))) { // once a day
    const snap: Snap = {}; for (const c of charts) snap[c.id] = Object.fromEntries(c.rows.map((r) => [r.key, r.rank]));
    await env.VISITS.put(snapKey(today), JSON.stringify(snap), { expirationTtl: 40 * 86400 }).catch(() => undefined);
  }
  return since;
}

export async function chartsPayload(env: Env, country: string, fetcher: typeof fetch = fetch, now = Date.now()) {
  const [lb, appleSongs, appleAlbums, deezer, dzAlbums] = await Promise.all([listenbrainzChart(fetcher), appleChart(country, 'songs', fetcher), appleChart(country, 'albums', fetcher), deezerChart(fetcher), deezerAlbums(fetcher)]);
  const songs = [lb?.songs, appleSongs, deezer].filter((c): c is Chart => Boolean(c && c.rows.length));
  const others = [lb?.records, appleAlbums, dzAlbums, lb?.artists].filter((c): c is Chart => Boolean(c && c.rows.length));
  const movedSince = await movement(env, [...songs, ...others], now);
  return {
    name: 'The Chart Room', canonical: 'https://pointcast.xyz/charts', generatedAt: new Date(now).toISOString(), country, countryName: COUNTRIES[country], countries: COUNTRIES, movedSince,
    method: 'Three public charts shown as their owners publish them. PointCast ranks nothing. Consensus is the same song appearing on two or more charts. Movement compares ranks with the most recent earlier daily snapshot. Billboard and Spotify publish no open chart feed and are not scraped.',
    songs, others, consensus: consensus(songs), debuts: debuts([...songs, ...others]),
  };
}

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };
export async function handleCharts(request: Request, env: Env, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'GET') return new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), { status: 405, headers });
  const asked = (new URL(request.url).searchParams.get('country') || 'us').toLowerCase(), country = asked in COUNTRIES ? asked : 'us';
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default, key = new Request(`https://pointcast.xyz/__charts/v1/${country}`);
  const hit = await cache?.match(key).catch(() => undefined); if (hit) return hit;
  const body = await chartsPayload(env, country, fetcher);
  const ok = body.songs.length > 0, whole = body.songs.length >= 3; // a source that was down should not stay missing for an hour
  const res = new Response(JSON.stringify({ ok, ...body }), { status: ok ? 200 : 503, headers: { ...headers, 'Cache-Control': ok ? `public, max-age=${whole ? 600 : 120}, s-maxage=${whole ? HOUR : 300}` : 'no-store' } });
  if (ok && cache) await cache.put(key, res.clone()).catch(() => undefined);
  return res;
}
export const onRequest: PagesFunction<Env> = ({ request, env }) => handleCharts(request, env);
