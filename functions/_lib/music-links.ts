/**
 * music-links — one track link, on any service the town accepts.
 *
 * Spotify's API is closed to almost everyone (a five-user cap on new apps), so the
 * station's request line and the front door's "tell the town" box cannot assume it.
 * This module is the one place that knows what a track-level link looks like on
 * Spotify, Apple Music, YouTube, SoundCloud, Bandcamp, Tidal and Deezer, and turns
 * one into a canonical https URL — tracking parameters (si, utm_*, feature, a
 * share id) are never carried through, because the canonical url is always
 * rebuilt from the parsed id, never copied from the input.
 *
 * Every host check is an exact hostname match except Bandcamp, whose tracks live
 * on a per-artist subdomain (`{artist}.bandcamp.com`) — that is the one place a
 * subdomain wildcard is allowed, and `www` is excluded from it (that host is
 * Bandcamp's own marketing site, not an artist). A look-alike host — a real
 * hostname with "open.spotify.com" folded into its path, or "spotify.com" as a
 * prefix of a longer hostname — never matches, because matching is always done
 * on `URL#hostname`, never on the raw string.
 *
 * Only track-level links are accepted. Albums, playlists, artists, channels and
 * shorts are refused (return null): a request line takes a song, not a set to sit
 * through.
 */

export type MusicService = 'spotify' | 'apple' | 'youtube' | 'soundcloud' | 'bandcamp' | 'tidal' | 'deezer';
export interface MusicLink { service: MusicService; kind: 'track'; id: string; url: string }

export const SERVICE_LABEL: Record<MusicService, string> = {
  spotify: 'Spotify', apple: 'Apple Music', youtube: 'YouTube', soundcloud: 'SoundCloud', bandcamp: 'Bandcamp', tidal: 'Tidal', deezer: 'Deezer',
};

/** A parsed https URL with no userinfo, no odd port and no scheme trick — anything else is not a link, it is an attack surface. */
function httpsUrl(raw: string): URL | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') ? u : null;
}

function spotifyLink(raw: string): MusicLink | null {
  const uri = /^spotify:track:([A-Za-z0-9]{10,40})$/.exec(raw);
  if (uri) return { service: 'spotify', kind: 'track', id: uri[1], url: `https://open.spotify.com/track/${uri[1]}` };
  const u = httpsUrl(raw); if (!u || u.hostname !== 'open.spotify.com') return null;
  const m = /^\/(?:intl-[a-z]{2,5}\/)?track\/([A-Za-z0-9]{10,40})\/?$/.exec(u.pathname);
  return m ? { service: 'spotify', kind: 'track', id: m[1], url: `https://open.spotify.com/track/${m[1]}` } : null;
}

// Apple Music names a track two ways: a direct /song/ link, or an /album/ link carrying the
// track's id in ?i= — without ?i= that second form is the album itself, so it is refused.
function appleLink(raw: string): MusicLink | null {
  const u = httpsUrl(raw); if (!u || u.hostname !== 'music.apple.com') return null;
  const song = /^\/([a-z]{2})\/song\/([^/]{1,200})\/(\d{1,20})\/?$/.exec(u.pathname);
  if (song) return { service: 'apple', kind: 'track', id: song[3], url: `https://music.apple.com/${song[1]}/song/${song[2]}/${song[3]}` };
  const album = /^\/([a-z]{2})\/album\/([^/]{1,200})\/(\d{1,20})\/?$/.exec(u.pathname);
  const trackId = album ? u.searchParams.get('i') : null;
  return album && trackId && /^\d{1,20}$/.test(trackId) ? { service: 'apple', kind: 'track', id: trackId, url: `https://music.apple.com/${album[1]}/album/${album[2]}/${album[3]}?i=${trackId}` } : null;
}

// youtu.be is only ever a shortener, so it is folded into the full youtube.com form; a Music
// link keeps its own host, since that is the product the visitor meant to point at.
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
function youtubeLink(raw: string): MusicLink | null {
  const u = httpsUrl(raw); if (!u) return null;
  if (u.hostname === 'youtu.be') { const id = u.pathname.slice(1).split('/')[0]; return YT_ID.test(id) ? { service: 'youtube', kind: 'track', id, url: `https://www.youtube.com/watch?v=${id}` } : null; }
  const host = u.hostname === 'youtube.com' || u.hostname === 'www.youtube.com' ? 'www.youtube.com' : u.hostname === 'music.youtube.com' ? 'music.youtube.com' : null;
  if (!host || u.pathname !== '/watch') return null; // no /shorts, /playlist, /channel, /@handle — a watch link only
  const id = u.searchParams.get('v');
  return id && YT_ID.test(id) ? { service: 'youtube', kind: 'track', id, url: `https://${host}/watch?v=${id}` } : null;
}

// A set (playlist) lives at /user/sets/name — three segments where a track is always two,
// so length alone tells them apart without knowing SoundCloud's slug rules.
const SC_RESERVED = new Set(['you', 'stream', 'discover', 'charts', 'upload', 'search', 'tags', 'people', 'pages', 'settings', 'notifications', 'messages', 'backstage', 'go']);
function soundcloudLink(raw: string): MusicLink | null {
  const u = httpsUrl(raw); if (!u || (u.hostname !== 'soundcloud.com' && u.hostname !== 'www.soundcloud.com')) return null;
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length !== 2 || parts[1] === 'sets' || SC_RESERVED.has(parts[0].toLowerCase())) return null;
  const [user, trackSlug] = parts;
  if (!/^[A-Za-z0-9_-]{1,50}$/.test(user) || !/^[A-Za-z0-9_-]{1,120}$/.test(trackSlug)) return null;
  return { service: 'soundcloud', kind: 'track', id: `${user.toLowerCase()}/${trackSlug.toLowerCase()}`, url: `https://soundcloud.com/${user}/${trackSlug}` };
}

// The one subdomain-wildcard host in this file: every Bandcamp artist has their own subdomain,
// and there is no numeric id to key on, so the artist/slug pair (lowercased) stands in for one.
const BANDCAMP_HOST = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.bandcamp\.com$/;
function bandcampLink(raw: string): MusicLink | null {
  const u = httpsUrl(raw); if (!u) return null;
  const host = BANDCAMP_HOST.exec(u.hostname); if (!host || host[1] === 'www') return null;
  const m = /^\/track\/([A-Za-z0-9-]{1,200})\/?$/.exec(u.pathname); if (!m) return null;
  return { service: 'bandcamp', kind: 'track', id: `${host[1]}/${m[1].toLowerCase()}`, url: `https://${host[1]}.bandcamp.com/track/${m[1]}` };
}

// tidal.com/browse/... is the marketing/web-player host; listen.tidal.com is the player app's
// own share host. Both name the same track by the same numeric id, so both fold to one canonical form.
function tidalLink(raw: string): MusicLink | null {
  const u = httpsUrl(raw); if (!u) return null;
  if (u.hostname === 'tidal.com') { const m = /^\/browse\/track\/(\d{1,20})\/?$/.exec(u.pathname); return m ? { service: 'tidal', kind: 'track', id: m[1], url: `https://tidal.com/browse/track/${m[1]}` } : null; }
  if (u.hostname === 'listen.tidal.com') { const m = /^\/track\/(\d{1,20})\/?$/.exec(u.pathname); return m ? { service: 'tidal', kind: 'track', id: m[1], url: `https://tidal.com/browse/track/${m[1]}` } : null; }
  return null;
}

// Deezer's own links carry an optional two-letter locale ahead of /track/ (…/en/track/123);
// the locale is not part of the track's identity, so it is dropped from the canonical url.
function deezerLink(raw: string): MusicLink | null {
  const u = httpsUrl(raw); if (!u || (u.hostname !== 'deezer.com' && u.hostname !== 'www.deezer.com')) return null;
  const m = /^\/(?:[a-z]{2}\/)?track\/(\d{1,20})\/?$/.exec(u.pathname);
  return m ? { service: 'deezer', kind: 'track', id: m[1], url: `https://www.deezer.com/track/${m[1]}` } : null;
}

/** A track-level link on Spotify, Apple Music, YouTube, SoundCloud, Bandcamp, Tidal or Deezer, reduced to its id — or null. */
export function parseMusicLink(raw: unknown): MusicLink | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s || s.length > 600) return null;
  return spotifyLink(s) || appleLink(s) || youtubeLink(s) || soundcloudLink(s) || bandcampLink(s) || tidalLink(s) || deezerLink(s);
}

/** The stable identity used for duplicate checks: the same track, however it was pasted, is the same key. */
export function musicLinkKey(link: MusicLink): string {
  return `${link.service}:${link.id}`;
}
