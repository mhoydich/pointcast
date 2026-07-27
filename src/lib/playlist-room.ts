/**
 * playlist-room — pure helpers for the Spotify Playlist Room Companion.
 *
 * No DOM, no side effects. Parse Spotify playlist URLs, derive room keys,
 * build receipts, and label sequence positions. Testable in isolation.
 */

export const DEFAULT_PLAYLIST_ID = '35WC68tu9rrBoRrW3N2n0M';

const SPOTIFY_PLAYLIST_RE =
  /^https?:\/\/(?:open\.)?spotify\.com\/(playlist|intl-[a-z]{2}\/playlist)\/([A-Za-z0-9]{22})(?:[/?#]|$)/;
const SPOTIFY_PLAYLIST_URI_RE = /^spotify:playlist:([A-Za-z0-9]{22})$/;

const TRACKING_PARAMS = new Set(['si', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'nd']);

/**
 * Parse a Spotify playlist URL into its playlist ID.
 * Returns null for anything that isn't a Spotify playlist URL.
 * Strips tracking parameters (si, utm_*, nd) before validation.
 *
 * Accepts:
 *   https://open.spotify.com/playlist/35WC68tu9rrBoRrW3N2n0M
 *   https://open.spotify.com/playlist/35WC68tu9rrBoRrW3N2n0M?si=abc123
 *   https://open.spotify.com/intl-de/playlist/35WC68tu9rrBoRrW3N2n0M
 *   spotify:playlist:35WC68tu9rrBoRrW3N2n0M
 *
 * Rejects:
 *   Track, album, artist, episode, show URLs
 *   Non-Spotify URLs
 *   Malformed input
 */
export function parseSpotifyPlaylistUrl(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Handle spotify:playlist:ID URI format
  const uriMatch = trimmed.match(SPOTIFY_PLAYLIST_URI_RE);
  if (uriMatch) return uriMatch[1];

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  // Must be a Spotify domain
  if (!/(^|\.)spotify\.com$/i.test(url.hostname)) return null;

  // Must be a playlist path
  const match = trimmed.match(SPOTIFY_PLAYLIST_RE);
  if (!match) return null;

  return match[2];
}

/**
 * Strip Spotify tracking parameters from a URL string.
 * Returns the cleaned URL as a string, or the original input if parsing fails.
 */
export function stripTrackingParams(urlString: string): string {
  try {
    const url = new URL(urlString);
    for (const param of TRACKING_PARAMS) {
      url.searchParams.delete(param);
    }
    return url.toString();
  } catch {
    return urlString;
  }
}

/**
 * Build the canonical room key for a playlist.
 * Different playlist IDs produce different room keys.
 */
export function playlistRoomKey(playlistId: string): string {
  return `/listening-room/playlist/${playlistId}`;
}

/**
 * Build the canonical page URL for a playlist room.
 */
export function playlistRoomUrl(playlistId: string, base: string = 'https://pointcast.xyz'): string {
  const u = new URL('/listening-room', base);
  u.searchParams.set('pl', playlistId);
  return u.toString();
}

/**
 * Build the Spotify embed URL for a playlist.
 */
export function spotifyEmbedUrl(playlistId: string): string {
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
}

/**
 * Build the Spotify open URL (for "Open in Spotify" links).
 */
export function spotifyOpenUrl(playlistId: string): string {
  return `https://open.spotify.com/playlist/${playlistId}`;
}

/**
 * Sequence position labels for a playlist of `length` tracks.
 * Returns a function that maps a 1-based track position to a label.
 *
 * Labels: opener, early run, run, hinge, late turn, closer.
 * The hinge defaults to roughly the midpoint. For very short playlists
 * (≤3 tracks), labels simplify.
 */
export function sequenceLabel(position: number, length: number): string {
  if (length <= 0 || position <= 0 || position > length) return '';
  if (length === 1) return 'opener · closer';
  if (position === 1) return 'opener';
  if (position === length) return 'closer';
  if (length === 2) return 'run';
  if (length === 3) {
    if (position === 2) return 'hinge';
    return 'run';
  }

  const hingeAt = Math.ceil(length * 0.618);
  if (position === 2) return 'early run';
  if (position === hingeAt) return 'hinge';
  if (position > hingeAt && position < length) return 'late turn';
  return 'run';
}

/**
 * The five listening-note prompts for the annotation desk.
 */
export const NOTE_PROMPTS = [
  'What promise does the opener make?',
  'Where does the room change temperature?',
  'Which transition earns its surprise?',
  'What is the hidden hinge?',
  'Does the closer resolve, release, or reopen?',
] as const;

/**
 * Storage key for playlist notes in localStorage.
 */
export function notesStorageKey(playlistId: string): string {
  return `pc:playlist-notes:${playlistId}`;
}

export interface PlaylistReceipt {
  schema: 'pointcast-playlist-receipt/v1';
  playlistId: string;
  playlistUrl: string;
  roomUrl: string;
  createdAt: string;
  notes: Record<string, string>;
  markedMoments: { position: number; label: string; at: string }[];
  privateDataNotice: string;
}

/**
 * Build a portable room receipt from current state.
 * The receipt clearly labels itself as containing local/private data.
 */
export function buildReceipt(
  playlistId: string,
  notes: Record<string, string>,
  markedMoments: { position: number; label: string; at: string }[],
): PlaylistReceipt {
  return {
    schema: 'pointcast-playlist-receipt/v1',
    playlistId,
    playlistUrl: spotifyOpenUrl(playlistId),
    roomUrl: playlistRoomUrl(playlistId),
    createdAt: new Date().toISOString(),
    notes: { ...notes },
    markedMoments: [...markedMoments],
    privateDataNotice:
      'This receipt contains browser-local data. Notes were written by the listener and never sent to any server or AI system.',
  };
}

/**
 * Serialize a receipt as Markdown for copy/download.
 */
export function receiptToMarkdown(receipt: PlaylistReceipt): string {
  const lines: string[] = [
    `# PointCast Playlist Receipt`,
    ``,
    `- **Playlist:** ${receipt.playlistUrl}`,
    `- **Room:** ${receipt.roomUrl}`,
    `- **Created:** ${receipt.createdAt}`,
    `- **Schema:** ${receipt.schema}`,
    ``,
    `## Notes`,
    ``,
  ];

  for (const [prompt, response] of Object.entries(receipt.notes)) {
    if (response.trim()) {
      lines.push(`### ${prompt}`);
      lines.push(``);
      lines.push(response);
      lines.push(``);
    }
  }

  if (Object.keys(receipt.notes).length === 0 || Object.values(receipt.notes).every(n => !n.trim())) {
    lines.push('_No notes recorded._');
    lines.push(``);
  }

  if (receipt.markedMoments.length > 0) {
    lines.push(`## Marked Moments`);
    lines.push(``);
    for (const m of receipt.markedMoments) {
      lines.push(`- Track ${m.position} (${m.label}) — ${m.at}`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(`> ${receipt.privateDataNotice}`);
  lines.push(``);

  return lines.join('\n');
}
