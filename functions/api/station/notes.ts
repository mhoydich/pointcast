/**
 * /api/station/notes — liner notes for one track: the song, the record, the artist.
 *
 * Nothing here is written by a model. Each note is the opening of a Wikipedia
 * article (CC BY-SA 4.0), shown with its link, and only when the article can be
 * shown to be the right one:
 *   song    the article's short description says song/single AND names the artist,
 *           and the article title (minus its parenthetical) equals the track title
 *   record  same, for album/EP/soundtrack
 *   artist  the article title IS the artist's name and the description is a kind of
 *           musician or group
 * Anything that fails the check is left out: a missing note is fine, a wrong note
 * is not. Pictures are used for artists only, and only from Wikimedia Commons
 * (free licences); single and album sleeves on Wikipedia are fair-use there and
 * are not ours to hotlink.
 *
 * Results live in the edge cache for a week. No KV.
 */
import { rateLimit } from '../../_rate-limit.ts';

const UA = 'PointCastStation/1.0 (https://pointcast.xyz/station)';
const WEEK = 7 * 24 * 60 * 60;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };

export interface Note { kind: 'song' | 'record' | 'artist'; title: string; description: string; extract: string; url: string; image?: string }
type Summary = { type?: string; title?: string; description?: string; extract?: string; content_urls?: { desktop?: { page?: string } }; thumbnail?: { source?: string } };

export const norm = (s: string) => s.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const bare = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '');

/** "Mama - 2007 Remaster" → "Mama"; "Song (feat. X) [Live]" → "Song". */
export function cleanTitle(raw: string): string {
  return raw
    .replace(/\s+[-–—]\s+[^-–—]*\b(remaster(ed)?|mix|version|edit|live|mono|stereo|deluxe|bonus|demo|single|acoustic|instrumental|anniversary|from\b.*)\b.*$/i, '')
    .replace(/\s*[\[(][^\])]*\b(feat\.?|featuring|with|remaster(ed)?|live|version|mix|edit|mono|stereo|deluxe|bonus|demo|anniversary|edition)\b[^\])]*[\])]/gi, '')
    .trim() || raw.trim();
}
export const leadArtist = (line: string) => line.split(/,| feat\.? | featuring | & (?=[A-Z])/)[0].trim();

const KINDS = {
  song: /\b(song|single|composition|instrumental|tune|piece|hymn|carol|aria)\b/i,
  record: /\b(album|ep|soundtrack|mixtape|compilation|record|box set|live album)\b/i,
  artist: /\b(band|musician|singer|songwriter|rapper|duo|trio|quartet|group|composer|producer|dj|guitarist|pianist|drummer|bassist|trumpeter|saxophonist|vocalist|artist|ensemble|orchestra|collective|project|act|multi-instrumentalist|violinist|cellist|conductor|organist|keyboardist|emcee|mc)\b/i,
};

/** The whole correctness rule, in one place, so it can be tested without the network. */
export function accept(kind: Note['kind'], s: Summary, want: { title: string; artist: string }): boolean {
  if (!s || s.type !== 'standard' || !s.title || !s.extract || !s.description) return false;
  if (!KINDS[kind].test(s.description)) return false;
  const page = norm(bare(s.title)), artist = norm(want.artist);
  if (kind === 'artist') return page === artist || page === `the ${artist}` || `the ${page}` === artist;
  // The article's title (minus its parenthetical) must BE the title. A prefix is not enough:
  // "Money" is not "Money for Nothing", even though both are singles by bands with a "Money" song.
  const title = norm(want.title); if (!title || (page !== title && page !== `the ${title}` && `the ${page}` !== title)) return false;
  return ` ${norm(`${s.description} ${s.extract}`)} `.includes(` ${artist} `);
}

function trimExtract(text: string, max = 460): string {
  const t = text.replace(/\s+/g, ' ').trim(); if (t.length <= max) return t;
  const cut = t.slice(0, max), stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('." '));
  return stop > 160 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

async function wiki<T>(url: string, fetcher: typeof fetch): Promise<T | null> {
  try {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 4000);
    const r = await fetcher(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA, accept: 'application/json' }, signal: ctl.signal });
    clearTimeout(timer); return r.ok ? await r.json() as T : null;
  } catch { return null; }
}

/** Wikimedia Commons only (free licences). `/wikipedia/en/` is where the fair-use sleeves live. */
export const COMMONS = /^https:\/\/(upload|thumb)\.wikimedia\.org\/wikipedia\/commons\//;
const summary = (title: string, fetcher: typeof fetch) => wiki<Summary>(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, fetcher);

async function find(kind: Note['kind'], query: string, want: { title: string; artist: string }, fetcher: typeof fetch, guesses: string[] = []): Promise<Note | null> {
  // Well-known names usually ARE the article title: try those first, then search.
  let hit = (await Promise.all(guesses.map((g) => summary(g, fetcher)))).find((p) => p && accept(kind, p, want)) ?? null;
  if (!hit) {
    const search = await wiki<{ query?: { search?: Array<{ title: string }> } }>(`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&srsearch=${encodeURIComponent(query)}`, fetcher);
    const titles = (search?.query?.search ?? []).map((r) => r.title).slice(0, 3);
    hit = (await Promise.all(titles.map((t) => summary(t, fetcher)))).find((p) => p && accept(kind, p, want)) ?? null;
  }
  if (!hit) return null;
  const url = hit.content_urls?.desktop?.page ?? ''; if (!url.startsWith('https://en.wikipedia.org/wiki/')) return null;
  const img = hit.thumbnail?.source ?? '';
  return { kind, title: hit.title!, description: hit.description!, extract: trimExtract(hit.extract!), url, ...(kind === 'artist' && COMMONS.test(img) ? { image: img } : {}) };
}

export async function linerNotes(input: { title: string; artist: string; album?: string }, fetcher: typeof fetch = fetch) {
  const title = cleanTitle(input.title), artist = leadArtist(input.artist), album = input.album ? cleanTitle(input.album) : '';
  const [song, record, who] = await Promise.all([
    find('song', `${title} ${artist} song`, { title, artist }, fetcher, [`${title} (${artist} song)`, `${title} (song)`]),
    album ? find('record', `${album} ${artist} album`, { title: album, artist }, fetcher, [`${album} (${artist} album)`, `${album} (album)`, album]) : Promise.resolve(null),
    find('artist', `${artist} musician band`, { title: artist, artist }, fetcher, [artist, `${artist} (band)`, `${artist} (musician)`]),
  ]);
  // A single whose record has the same name can resolve to one article twice: show it once.
  const notes = [song, record, who].filter((n): n is Note => Boolean(n)).filter((n, i, all) => all.findIndex((m) => m.url === n.url) === i);
  return { focus: { title, artist, album }, notes };
}

export async function handleNotes(request: Request, fetcher: typeof fetch = fetch, env?: { PC_RATES_KV?: KVNamespace }): Promise<Response> {
  if (request.method !== 'GET') return new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), { status: 405, headers });
  const u = new URL(request.url), cap = (k: string) => (u.searchParams.get(k) ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const title = cap('title'), artist = cap('artist'), album = cap('album');
  if (title.length < 1 || artist.length < 1) return new Response(JSON.stringify({ ok: false, error: 'title and artist are required.' }), { status: 400, headers });
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const key = new Request(`https://pointcast.xyz/__station/notes/v1?${new URLSearchParams({ t: norm(title), a: norm(artist), al: norm(album) })}`);
  const hit = await cache?.match(key).catch(() => undefined); if (hit) return hit;
  // A miss fans out to Wikipedia (up to ~20 requests). Meter misses per address; hits stay free.
  if (env) { const limit = await rateLimit(request, env, { bucket: 'station:notes', windowSec: 60, maxRequests: 12 }); if (!limit.allowed) return new Response(JSON.stringify({ ok: false, error: 'Too many lookups. Try again in a minute.' }), { status: 429, headers: { ...headers, 'Retry-After': String(limit.retryAfter) } }); }
  const found = await linerNotes({ title, artist, album }, fetcher);
  const res = new Response(JSON.stringify({ ok: true, ...found, source: 'Wikipedia', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', method: 'Opening text of the matching English Wikipedia articles. A note appears only when the article’s own description names the right artist and the right kind of thing. Nothing is generated.' }), { headers: { ...headers, 'Cache-Control': `public, max-age=3600, s-maxage=${found.notes.length ? WEEK : 3600}` } });
  if (cache) await cache.put(key, res.clone()).catch(() => undefined);
  return res;
}

export const onRequest: PagesFunction<{ PC_RATES_KV?: KVNamespace }> = ({ request, env }) => handleNotes(request, fetch, env);
