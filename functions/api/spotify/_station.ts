/**
 * The broadcaster's radio station: a play log and what can honestly be said from it.
 *
 * Two sources feed one log (KV `USERS`, one document per month):
 *   seen     what the town's now-playing signal observed (works with the original
 *            `user-read-currently-playing` scope; only sees a track if someone was
 *            in town to ask what was on).
 *   spotify  `me/player/recently-played` (needs `user-read-recently-played`; exact
 *            timestamps, last 50 plays per sync). A spotify row replaces the seen
 *            row for the same play.
 * `me/top/*` (needs `user-top-read`) adds Spotify's own long view, cached 12 h.
 * Spotify's recommendations and audio-features endpoints are closed to new apps,
 * so every figure here is counted from the log: nothing is inferred about how a
 * track sounds.
 *
 * KV writes are scarce in this town: the log is written only when a play is new,
 * and the sync throttle lives in the edge cache, not KV.
 */
import { spotifyBroadcastFetch, type SpotifyBroadcastEnv } from './_broadcast.ts';

export interface StationPlay {
  id: string;        // Spotify track id
  t: string;         // title
  a: string;         // artist line
  al?: string;       // album
  img?: string;      // cover (i.scdn.co)
  url: string;       // open.spotify.com link
  at: string;        // ISO time of the play
  ms?: number;       // duration
  yr?: number;       // release year
  pop?: number;      // Spotify popularity 0-100
  ex?: boolean;      // explicit
  src: 'seen' | 'spotify';
}

export interface SpotifyTrackLike {
  id?: string; name?: string; duration_ms?: number; popularity?: number; explicit?: boolean;
  external_urls?: { spotify?: string };
  artists?: Array<{ name?: string }>;
  album?: { name?: string; release_date?: string; images?: Array<{ url?: string; height?: number }> };
}

const STATION = 'broadcast';
const LOG_PREFIX = `station:v1:${STATION}:log:`;
const TOP_KEY = `station:v1:${STATION}:top:v2`;
const SCOPE_KEY = `station:v1:${STATION}:scopes`;
const ERASED_KEY = `station:erased:v1:${STATION}`; // outside the station:v1 prefix on purpose: it must survive the sweep
const SYNC_MARK = 'https://pointcast.xyz/__station/sync-mark';
const SYNC_EVERY_S = 600;
const TOP_EVERY_MS = 12 * 60 * 60 * 1000;
const MAX_PER_MONTH = 6000;
export const STATION_TZ = 'America/Los_Angeles';

const monthOf = (iso: string) => iso.slice(0, 7);
const logKey = (month: string) => `${LOG_PREFIX}${month}`;

export function playFromTrack(track: SpotifyTrackLike | null | undefined, at: string, src: StationPlay['src']): StationPlay | null {
  const id = track?.id?.trim() ?? '', t = track?.name?.trim() ?? '', url = track?.external_urls?.spotify ?? '';
  if (!id || !t || !url.startsWith('https://open.spotify.com/') || Number.isNaN(Date.parse(at))) return null;
  const a = (track?.artists ?? []).map((x) => x.name?.trim()).filter(Boolean).join(', ') || 'Spotify';
  const images = track?.album?.images ?? [];
  const img = (images.find((i) => (i.height ?? 0) >= 300 && (i.height ?? 0) <= 320) ?? images[0])?.url;
  const yr = Number((track?.album?.release_date ?? '').slice(0, 4));
  const play: StationPlay = { id, t: t.slice(0, 160), a: a.slice(0, 160), url, at: new Date(at).toISOString(), src };
  if (track?.album?.name) play.al = track.album.name.slice(0, 160);
  if (img?.startsWith('https://i.scdn.co/')) play.img = img;
  if (typeof track?.duration_ms === 'number') play.ms = track.duration_ms;
  if (yr >= 1900 && yr <= 2100) play.yr = yr;
  if (typeof track?.popularity === 'number') play.pop = track.popularity;
  if (track?.explicit) play.ex = true;
  return play;
}

/** Merge new plays into a log. A spotify row replaces a seen row of the same play; exact duplicates are dropped. */
export function mergePlays(existing: StationPlay[], incoming: StationPlay[]): { plays: StationPlay[]; added: number } {
  const plays = [...existing]; let added = 0;
  // Two Spotify rows carry exact timestamps: only the identical one is a duplicate, so a track on
  // repeat logs every play. A sighting is fuzzy (we saw it some time during the play), so it folds
  // into any row of the same track within the track's length.
  const near = (x: StationPlay, y: StationPlay) => x.id === y.id && (x.src === 'spotify' && y.src === 'spotify'
    ? x.at === y.at
    : Math.abs(Date.parse(x.at) - Date.parse(y.at)) < Math.max(10 * 60000, (y.ms ?? 0) + 3 * 60000));
  for (const p of incoming) {
    const i = plays.findIndex((q) => near(q, p));
    if (i === -1) { plays.push(p); added++; continue; }
    if (plays[i].src === 'seen' && p.src === 'spotify') { plays[i] = p; added++; }
  }
  plays.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
  return { plays: plays.slice(-MAX_PER_MONTH), added };
}

async function readMonth(env: SpotifyBroadcastEnv, month: string): Promise<StationPlay[]> {
  const rows = await env.USERS?.get<StationPlay[]>(logKey(month), 'json').catch(() => null);
  return Array.isArray(rows) ? rows : [];
}

async function appendPlays(env: SpotifyBroadcastEnv, all: StationPlay[]): Promise<number> {
  if (!env.USERS || !all.length) return 0;
  // Erasure holds: Spotify still remembers the last 50 plays, so without this a sync would
  // quietly put back what the broadcaster just erased.
  const erasedAt = Date.parse((await env.USERS.get(ERASED_KEY).catch(() => null)) || '') || 0;
  const incoming = erasedAt ? all.filter((p) => Date.parse(p.at) > erasedAt) : all;
  if (!incoming.length) return 0;
  const byMonth = new Map<string, StationPlay[]>();
  for (const p of incoming) byMonth.set(monthOf(p.at), [...(byMonth.get(monthOf(p.at)) ?? []), p]);
  let total = 0;
  for (const [month, rows] of byMonth) {
    const { plays, added } = mergePlays(await readMonth(env, month), rows);
    if (added) { await env.USERS.put(logKey(month), JSON.stringify(plays)); total += added; } // written only when something is new
  }
  return total;
}

/** Called by the now-playing resolver each time it fetches a fresh live signal. Never throws. */
export async function recordSeen(env: SpotifyBroadcastEnv, track: SpotifyTrackLike | null | undefined): Promise<void> {
  try { const play = playFromTrack(track, new Date().toISOString(), 'seen'); if (play) await appendPlays(env, [play]); } catch { /* the signal matters more than the log */ }
}

type Scopes = { history: boolean | null; top: boolean | null; checkedAt: string };
async function readScopes(env: SpotifyBroadcastEnv): Promise<Scopes> {
  return (await env.USERS?.get<Scopes>(SCOPE_KEY, 'json').catch(() => null)) ?? { history: null, top: null, checkedAt: '' };
}
async function noteScope(env: SpotifyBroadcastEnv, patch: Partial<Scopes>): Promise<void> {
  const cur = await readScopes(env); const next = { ...cur, ...patch };
  if (next.history === cur.history && next.top === cur.top && Date.now() - Date.parse(cur.checkedAt || '0') < 24 * 60 * 60 * 1000) return; // on change, or once a day
  await env.USERS?.put(SCOPE_KEY, JSON.stringify({ ...next, checkedAt: new Date().toISOString() }));
}

/** Pull `recently-played` into the log, at most once per SYNC_EVERY_S per colo. Never throws. */
export async function syncStation(env: SpotifyBroadcastEnv): Promise<{ ran: boolean; added: number }> {
  try {
    const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
    if (cache && await cache.match(SYNC_MARK)) return { ran: false, added: 0 };
    await cache?.put(SYNC_MARK, new Response('1', { headers: { 'Cache-Control': `public, max-age=${SYNC_EVERY_S}` } }));
    const res = await spotifyBroadcastFetch(env, 'https://api.spotify.com/v1/me/player/recently-played?limit=50');
    if (!res) return { ran: true, added: 0 };
    if (res.status === 401 || res.status === 403) { await noteScope(env, { history: false }); return { ran: true, added: 0 }; }
    if (!res.ok) return { ran: true, added: 0 };
    const body = await res.json() as { items?: Array<{ played_at?: string; track?: SpotifyTrackLike }> };
    const plays = (body.items ?? []).map((i) => playFromTrack(i.track, i.played_at ?? '', 'spotify')).filter((p): p is StationPlay => Boolean(p));
    await noteScope(env, { history: true });
    return { ran: true, added: await appendPlays(env, plays) };
  } catch { return { ran: false, added: 0 }; }
}

type TopArtist = { name: string; img?: string; url: string; genres: string[] };
type TopTrack = { t: string; a: string; img?: string; url: string; yr?: number };
export type TopRange = 'weeks' | 'months' | 'years'; // Spotify: short_term ≈ 4 weeks, medium_term ≈ 6 months, long_term ≈ a year or more
export interface StationTop {
  fetchedAt: number;
  artists: Record<TopRange, TopArtist[]>;
  tracks: Record<TopRange, TopTrack[]>;
  library: { total: number; first?: { t: string; a: string; url: string; savedAt: string }; latest: Array<{ t: string; a: string; img?: string; url: string; savedAt: string }> } | null;
}
const RANGES: Record<TopRange, string> = { weeks: 'short_term', months: 'medium_term', years: 'long_term' };

async function readTop(env: SpotifyBroadcastEnv): Promise<StationTop | null> {
  const cached = await env.USERS?.get<StationTop>(TOP_KEY, 'json').catch(() => null);
  if (cached && Date.now() - cached.fetchedAt < TOP_EVERY_MS) return cached;
  // Spotify already said no to top lists: do not ask again on every page view. A
  // broadcaster reconnect clears this (resetStationScopes), and it re-checks daily anyway.
  const scopes = await readScopes(env);
  if (scopes.top === false && Date.now() - Date.parse(scopes.checkedAt || '0') < 24 * 60 * 60 * 1000) return cached ?? null;
  try {
    let refused = false;
    const get = async <T>(url: string): Promise<T | null> => { const r = await spotifyBroadcastFetch(env, url); if (!r) return null; if (r.status === 401 || r.status === 403) { refused = true; return null; } return r.ok ? await r.json() as T : null; };
    const keys = Object.keys(RANGES) as TopRange[];
    const [artistLists, trackLists] = await Promise.all([
      Promise.all(keys.map((k) => get<{ items?: unknown[] }>(`https://api.spotify.com/v1/me/top/artists?time_range=${RANGES[k]}&limit=25`))),
      Promise.all(keys.map((k) => get<{ items?: unknown[] }>(`https://api.spotify.com/v1/me/top/tracks?time_range=${RANGES[k]}&limit=25`))),
    ]);
    if (refused) await noteScope(env, { top: false });
    if (artistLists.every((x) => !x) && trackLists.every((x) => !x)) return cached ?? null;
    const artist = (x: { name?: string; images?: Array<{ url?: string }>; external_urls?: { spotify?: string }; genres?: string[] }): TopArtist => ({ name: String(x.name ?? '').slice(0, 120), img: x.images?.[1]?.url ?? x.images?.[0]?.url, url: x.external_urls?.spotify ?? '', genres: (x.genres ?? []).slice(0, 4) });
    const okUrl = (x: { url: string; name?: string; t?: string }) => x.url.startsWith('https://open.spotify.com/');
    const track = (x: SpotifyTrackLike): TopTrack | null => { const p = playFromTrack(x, new Date().toISOString(), 'spotify'); return p ? { t: p.t, a: p.a, img: p.img, url: p.url, yr: p.yr } : null; };
    // The saved library needs its own permission (user-library-read). Two small calls: the newest
    // saves and the very first one. A refusal here is not a refusal of the top lists.
    let library: StationTop['library'] = null;
    try {
      type Saved = { total?: number; items?: Array<{ added_at?: string; track?: SpotifyTrackLike }> };
      const r = await spotifyBroadcastFetch(env, 'https://api.spotify.com/v1/me/tracks?limit=10&offset=0'); const newest = r?.ok ? await r.json() as Saved : null;
      if (newest && typeof newest.total === 'number') {
        const saved = (i: { added_at?: string; track?: SpotifyTrackLike }) => { const p = playFromTrack(i.track, i.added_at ?? '', 'spotify'); return p ? { t: p.t, a: p.a, img: p.img, url: p.url, savedAt: p.at } : null; };
        const r2 = newest.total > 1 ? await spotifyBroadcastFetch(env, `https://api.spotify.com/v1/me/tracks?limit=1&offset=${newest.total - 1}`) : null; const oldest = r2?.ok ? await r2.json() as Saved : null;
        const first = oldest?.items?.[0] ? saved(oldest.items[0]) : null;
        library = { total: newest.total, ...(first ? { first: { t: first.t, a: first.a, url: first.url, savedAt: first.savedAt } } : {}), latest: (newest.items ?? []).map(saved).filter((x): x is NonNullable<ReturnType<typeof saved>> => Boolean(x)) };
      }
    } catch { /* the library is a bonus */ }
    const top: StationTop = {
      fetchedAt: Date.now(),
      artists: Object.fromEntries(keys.map((k, i) => [k, ((artistLists[i]?.items ?? []) as Parameters<typeof artist>[0][]).map(artist).filter((x) => x.name && okUrl(x))])) as StationTop['artists'],
      tracks: Object.fromEntries(keys.map((k, i) => [k, ((trackLists[i]?.items ?? []) as SpotifyTrackLike[]).map(track).filter((x): x is TopTrack => Boolean(x))])) as StationTop['tracks'],
      library,
    };
    await noteScope(env, { top: true });
    await env.USERS?.put(TOP_KEY, JSON.stringify(top));
    return top;
  } catch { return cached ?? null; }
}

/**
 * Rewind: what Spotify's own long view says about this one account, compared across its three
 * windows. Spotify does not say how it ranks, and gives ranks, not play counts, so nothing here
 * is a number of plays. "New" and "faded" are set differences between the windows, nothing more.
 */
export function computeRewind(top: StationTop) {
  const names = (list: TopArtist[]) => new Set(list.map((x) => x.name));
  const years = names(top.artists.years), weeks = names(top.artists.weeks), months = names(top.artists.months);
  const genres = new Map<string, number>(); top.artists.years.forEach((x, i) => x.genres.forEach((g) => genres.set(g, (genres.get(g) ?? 0) + (25 - i))));
  const decades = new Map<number, number>(); top.tracks.years.forEach((x) => { if (x.yr) decades.set(Math.floor(x.yr / 10) * 10, (decades.get(Math.floor(x.yr / 10) * 10) ?? 0) + 1); });
  return {
    asOf: new Date(top.fetchedAt).toISOString(),
    windows: { weeks: 'about the last four weeks', months: 'about the last six months', years: 'a year or more' },
    artists: { weeks: top.artists.weeks.slice(0, 17), months: top.artists.months.slice(0, 17), years: top.artists.years.slice(0, 17) }, // one large tile + two rows of eight
    tracks: { weeks: top.tracks.weeks.slice(0, 10), months: top.tracks.months.slice(0, 10), years: top.tracks.years.slice(0, 10) },
    newObsessions: top.artists.weeks.filter((x) => !years.has(x.name) && !months.has(x.name)).slice(0, 8),
    alwaysThere: top.artists.years.filter((x) => weeks.has(x.name) && months.has(x.name)).slice(0, 8),
    faded: top.artists.years.slice(0, 15).filter((x) => !weeks.has(x.name) && !months.has(x.name)).slice(0, 8),
    genres: [...genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name),
    topTrackDecades: [...decades.entries()].sort((a, b) => a[0] - b[0]).map(([decade, tracks]) => ({ decade, tracks })),
    library: top.library,
  };
}

// ── what can be said from the log ─────────────────────────────────
const clock = new Intl.DateTimeFormat('en-US', { timeZone: STATION_TZ, hour: 'numeric', hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
function local(iso: string): { hour: number; weekday: number; day: string } {
  const parts = Object.fromEntries(clock.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return { hour: Number(parts.hour) % 24, weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), day: `${parts.year}-${parts.month}-${parts.day}` };
}
const DAYPARTS = [
  { name: 'Late night', from: 0, to: 5 }, { name: 'Morning', from: 5, to: 11 }, { name: 'Midday', from: 11, to: 15 },
  { name: 'Afternoon', from: 15, to: 19 }, { name: 'Evening', from: 19, to: 24 },
];

export function computeStats(plays: StationPlay[], now = Date.now()) {
  const byHour = new Array(24).fill(0) as number[], byWeekday = new Array(7).fill(0) as number[];
  const artists = new Map<string, { plays: number; img?: string }>(), tracks = new Map<string, { plays: number; p: StationPlay; first: number }>();
  const decades = new Map<number, number>(), days = new Set<string>();
  let ms = 0, popSum = 0, popN = 0, explicit = 0;
  for (const p of plays) {
    const l = local(p.at); byHour[l.hour]++; if (l.weekday >= 0) byWeekday[l.weekday]++; days.add(l.day);
    const lead = p.a.split(', ')[0]; const ar = artists.get(lead) ?? { plays: 0 }; ar.plays++; ar.img ??= p.img; artists.set(lead, ar);
    const tr = tracks.get(p.id) ?? { plays: 0, p, first: Date.parse(p.at) }; tr.plays++; tr.p = p; tracks.set(p.id, tr);
    if (p.yr) decades.set(Math.floor(p.yr / 10) * 10, (decades.get(Math.floor(p.yr / 10) * 10) ?? 0) + 1);
    ms += p.ms ?? 0; if (typeof p.pop === 'number') { popSum += p.pop; popN++; } if (p.ex) explicit++;
  }
  // Consecutive station-local days with at least one play, ending today or yesterday. Pure calendar
  // arithmetic from today's LOCAL date, so a 24 h step can never skip a day across a DST change.
  let streak = 0; { const d = new Date(`${local(new Date(now).toISOString()).day}T12:00:00Z`); for (let i = 0; i < 400; i++) { if (days.has(d.toISOString().slice(0, 10))) streak++; else if (i > 0) break; d.setUTCDate(d.getUTCDate() - 1); } }
  const dayparts = DAYPARTS.map((d) => ({ name: d.name, plays: byHour.slice(d.from, d.to).reduce((a, b) => a + b, 0) }));
  const weekAgo = now - 7 * 86400000;
  const card = (p: StationPlay, n: number) => ({ t: p.t, a: p.a, img: p.img, url: p.url, plays: n });
  const ranked = [...tracks.values()].sort((x, y) => y.plays - x.plays || Date.parse(y.p.at) - Date.parse(x.p.at));
  return {
    plays: plays.length,
    minutes: Math.round(ms / 60000),
    daysOnAir: days.size,
    streakDays: streak,
    distinctTracks: tracks.size,
    distinctArtists: artists.size,
    repeatShare: plays.length ? +(1 - tracks.size / plays.length).toFixed(3) : 0,
    byHour, byWeekday, dayparts,
    peakHour: plays.length ? byHour.indexOf(Math.max(...byHour)) : null,
    signature: plays.length ? [...dayparts].sort((x, y) => y.plays - x.plays)[0].name : null,
    topArtists: [...artists.entries()].sort((x, y) => y[1].plays - x[1].plays).slice(0, 10).map(([name, v]) => ({ name, plays: v.plays, img: v.img })),
    heavyRotation: ranked.filter((x) => x.plays > 1).slice(0, 10).map((x) => card(x.p, x.plays)),
    newThisWeek: [...tracks.values()].filter((x) => x.first >= weekAgo).sort((x, y) => y.first - x.first).slice(0, 10).map((x) => card(x.p, x.plays)),
    deepCuts: [...tracks.values()].filter((x) => typeof x.p.pop === 'number' && x.p.pop < 35).sort((x, y) => (x.p.pop ?? 0) - (y.p.pop ?? 0)).slice(0, 8).map((x) => ({ ...card(x.p, x.plays), pop: x.p.pop })),
    decades: [...decades.entries()].sort((x, y) => x[0] - y[0]).map(([decade, n]) => ({ decade, plays: n })),
    averagePopularity: popN ? Math.round(popSum / popN) : null,
    explicitShare: plays.length ? +(explicit / plays.length).toFixed(3) : 0,
    firstPlayAt: plays[0]?.at ?? null,
    lastPlayAt: plays[plays.length - 1]?.at ?? null,
  };
}

export async function readStation(env: SpotifyBroadcastEnv, now = Date.now()) {
  const thisMonth = new Date(now).toISOString().slice(0, 7), prev = new Date(Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  const [a, b, top, scopes] = await Promise.all([readMonth(env, prev), readMonth(env, thisMonth), readTop(env), readScopes(env)]);
  const plays = [...a, ...b];
  const covers: string[] = []; for (let i = plays.length - 1; i >= 0 && covers.length < 48; i--) { const c = plays[i].img; if (c && !covers.includes(c)) covers.push(c); }
  return {
    window: { from: plays[0]?.at ?? null, months: [prev, thisMonth], timezone: STATION_TZ },
    sources: { seen: plays.filter((p) => p.src === 'seen').length, spotify: plays.filter((p) => p.src === 'spotify').length, history: scopes.history, top: scopes.top },
    stats: computeStats(plays, now),
    recent: plays.slice(-60).reverse(),
    covers,
    rewind: top ? computeRewind(top) : null,
  };
}

/** After the broadcaster reconnects Spotify, forget which scopes were missing so the station looks again. */
export async function resetStationScopes(env: SpotifyBroadcastEnv): Promise<void> {
  try { await env.USERS?.delete(SCOPE_KEY); const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default; await cache?.delete(SYNC_MARK); } catch { /* best effort */ }
}

export async function clearStation(env: SpotifyBroadcastEnv): Promise<number> {
  if (!env.USERS) return 0; let n = 0, cursor: string | undefined;
  do { const page = await env.USERS.list({ prefix: `station:v1:${STATION}:`, cursor }); for (const k of page.keys) { await env.USERS.delete(k.name); n++; } cursor = page.list_complete ? undefined : page.cursor; } while (cursor);
  await env.USERS.put(ERASED_KEY, new Date().toISOString()); // nothing played before this moment may come back
  return n;
}
