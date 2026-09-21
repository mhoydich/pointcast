/**
 * ListenBrainz as a source for the station's play log.
 *
 * Why: Spotify's API gives an unreviewed app the last 50 plays of at most five allow-listed
 * people, and can change that at will. ListenBrainz is an open scrobbling service (MetaBrainz):
 * a person links Spotify (or Apple Music, YouTube Music, a local player…) to it once, it records
 * every play, and public listens can be read with no key, no OAuth and no user cap. The station
 * needs one thing from the broadcaster: a username.
 *
 * Everything here is public data about a username the broadcaster chose to publish. No secrets.
 * The API allows about 30 requests per window per address; this module makes at most three per
 * sync (listens, now playing, and twice a day the counted top lists).
 */
import type { StationPlay } from './_station.ts';

const API = 'https://api.listenbrainz.org/1';
const UA = 'PointCastStation/1.0 (https://pointcast.xyz/station)';

export const LB_USER = /^[A-Za-z0-9_.-]{1,64}$/; // conservative: what the station will accept and put in a URL

export interface LbListen {
  listened_at?: number;
  track_metadata?: {
    track_name?: string; artist_name?: string; release_name?: string;
    additional_info?: { duration_ms?: number; duration?: number; spotify_id?: string; recording_mbid?: string; origin_url?: string; music_service?: string; music_service_name?: string };
    mbid_mapping?: { recording_mbid?: string; release_mbid?: string; caa_release_mbid?: string; caa_id?: number };
  };
}

const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const hex = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))), (x) => x.toString(16).padStart(2, '0')).join('');

/**
 * One listen → one log row. The identity prefers, in order: the Spotify track id (so requests on
 * the line still flip to "played"), the MusicBrainz recording id, a hash of artist + title.
 */
export async function playFromListen(l: LbListen, user: string): Promise<StationPlay | null> {
  const tm = l?.track_metadata, str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const t = str(tm?.track_name), a = str(tm?.artist_name);
  // 2005-01-01 … a day from now: anything else is a bad row, not a play (and would throw in toISOString).
  if (!t || !a || typeof l.listened_at !== 'number' || !Number.isFinite(l.listened_at) || l.listened_at < 1104537600 || l.listened_at > Date.now() / 1000 + 86400) return null;
  const ai = tm?.additional_info ?? {}, map = tm?.mbid_mapping ?? {};
  const sp = /^https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{10,40})/.exec(str(ai.spotify_id))?.[1];
  const rec = [map.recording_mbid, ai.recording_mbid].find((x) => typeof x === 'string' && MBID.test(x));
  const id = sp ?? (rec ? `mb-${rec}` : `lb-${(await hex(`${a.toLowerCase()}|${t.toLowerCase()}`)).slice(0, 22)}`);
  const url = sp ? `https://open.spotify.com/track/${sp}` : rec ? `https://musicbrainz.org/recording/${rec}` : `https://listenbrainz.org/user/${encodeURIComponent(user)}/`;
  const play: StationPlay = { id, t: t.slice(0, 160), a: a.slice(0, 160), url, at: new Date(l.listened_at * 1000).toISOString(), src: 'lb' };
  if (str(tm?.release_name)) play.al = str(tm?.release_name).slice(0, 160);
  const ms = typeof ai.duration_ms === 'number' ? ai.duration_ms : typeof ai.duration === 'number' ? ai.duration * 1000 : 0; if (ms > 0 && ms < 4 * 3600000) play.ms = Math.round(ms);
  if (typeof map.caa_release_mbid === 'string' && MBID.test(map.caa_release_mbid)) play.img = `https://coverartarchive.org/release/${map.caa_release_mbid}/front-250`; // open archive; redirects to archive.org
  return play;
}

async function lb<T>(path: string, fetcher: typeof fetch): Promise<T | null> {
  try { const r = await fetcher(`${API}${path}`, { headers: { 'User-Agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(6000) }); return r.ok ? await r.json() as T : null; } catch { return null; }
}

/** Listens newer than `sinceMs` (exclusive), oldest first. One request, at most 100 rows. */
export async function fetchListens(user: string, sinceMs: number, fetcher: typeof fetch = fetch): Promise<StationPlay[]> {
  if (!LB_USER.test(user)) return [];
  const q = sinceMs > 0 ? `min_ts=${Math.floor(sinceMs / 1000)}&count=100` : 'count=100';
  const j = await lb<{ payload?: { listens?: LbListen[] } }>(`/user/${encodeURIComponent(user)}/listens?${q}`, fetcher);
  const list = Array.isArray(j?.payload?.listens) ? j!.payload!.listens! : [];
  const rows = await Promise.all(list.map((l) => playFromListen(l, user).catch(() => null))); // one malformed row is dropped, not the batch
  return rows.filter((p): p is StationPlay => Boolean(p)).sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
}

export async function fetchPlayingNow(user: string, fetcher: typeof fetch = fetch): Promise<{ title: string; artist: string; album?: string } | null> {
  if (!LB_USER.test(user)) return null;
  const j = await lb<{ payload?: { listens?: LbListen[] } }>(`/user/${encodeURIComponent(user)}/playing-now`, fetcher);
  const tm = j?.payload?.listens?.[0]?.track_metadata; if (typeof tm?.track_name !== 'string' || typeof tm?.artist_name !== 'string' || !tm.track_name || !tm.artist_name) return null;
  return { title: tm.track_name.slice(0, 160), artist: tm.artist_name.slice(0, 160), ...(typeof tm.release_name === 'string' && tm.release_name ? { album: tm.release_name.slice(0, 160) } : {}) };
}

export interface LbCounted {
  fetchedAt: number; user: string; totalListens: number | null;
  artists: Record<'week' | 'year' | 'all_time', Array<{ name: string; plays: number }>>;
  recordings: Record<'week' | 'year' | 'all_time', Array<{ t: string; a: string; plays: number }>>;
}
/** The counted long view: ListenBrainz knows real play counts, which Spotify's API never gives. Eight requests; call twice a day at most. */
export async function fetchCounted(user: string, fetcher: typeof fetch = fetch): Promise<LbCounted | null> {
  if (!LB_USER.test(user)) return null; const u = encodeURIComponent(user), ranges = ['week', 'year', 'all_time'] as const;
  const [count, ...lists] = await Promise.all([
    lb<{ payload?: { count?: number } }>(`/user/${u}/listen-count`, fetcher),
    ...ranges.map((r) => lb<{ payload?: { artists?: Array<{ artist_name?: string; listen_count?: number }> } }>(`/stats/user/${u}/artists?range=${r}&count=25`, fetcher)),
    ...ranges.map((r) => lb<{ payload?: { recordings?: Array<{ track_name?: string; artist_name?: string; listen_count?: number }> } }>(`/stats/user/${u}/recordings?range=${r}&count=25`, fetcher)),
  ]);
  const arts = lists.slice(0, 3) as Array<{ payload?: { artists?: Array<{ artist_name?: string; listen_count?: number }> } } | null>, recs = lists.slice(3) as Array<{ payload?: { recordings?: Array<{ track_name?: string; artist_name?: string; listen_count?: number }> } } | null>;
  if (!count && arts.every((x) => !x) && recs.every((x) => !x)) return null;
  return {
    fetchedAt: Date.now(), user, totalListens: typeof count?.payload?.count === 'number' ? count.payload.count : null,
    artists: Object.fromEntries(ranges.map((r, i) => [r, (arts[i]?.payload?.artists ?? []).filter((x) => x.artist_name && x.listen_count).map((x) => ({ name: String(x.artist_name).slice(0, 120), plays: Number(x.listen_count) }))])) as LbCounted['artists'],
    recordings: Object.fromEntries(ranges.map((r, i) => [r, (recs[i]?.payload?.recordings ?? []).filter((x) => x.track_name && x.artist_name && x.listen_count).map((x) => ({ t: String(x.track_name).slice(0, 160), a: String(x.artist_name).slice(0, 160), plays: Number(x.listen_count) }))])) as LbCounted['recordings'],
  };
}
