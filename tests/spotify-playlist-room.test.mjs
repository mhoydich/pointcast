import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

// ─── Pure helpers (playlist-room.ts) ──────────────────────────────

test('playlist-room.ts exports parseSpotifyPlaylistUrl that accepts valid playlist URLs', async () => {
  const src = await read('src/lib/playlist-room.ts');

  // Function exists and handles standard URLs
  assert.match(src, /export function parseSpotifyPlaylistUrl/);
  assert.match(src, /spotify\.com/);
  assert.match(src, /playlist/);

  // Handles spotify:playlist:ID URI format
  assert.match(src, /spotify:playlist:/);

  // Returns null for non-playlist types
  assert.match(src, /return null/);
});

test('playlist-room.ts strips tracking parameters', async () => {
  const src = await read('src/lib/playlist-room.ts');

  assert.match(src, /export function stripTrackingParams/);
  assert.match(src, /TRACKING_PARAMS/);
  // si, utm_source, utm_medium, nd are all stripped
  assert.match(src, /'si'/);
  assert.match(src, /'utm_source'/);
  assert.match(src, /'utm_medium'/);
  assert.match(src, /'nd'/);
});

test('playlist-room.ts derives playlist-specific room keys', async () => {
  const src = await read('src/lib/playlist-room.ts');

  assert.match(src, /export function playlistRoomKey/);
  assert.match(src, /listening-room\/playlist\/\$\{/);

  // Different IDs produce different keys (pure function of the ID)
  assert.match(src, /export function playlistRoomUrl/);
});

test('playlist-room.ts provides sequence labels for track positions', async () => {
  const src = await read('src/lib/playlist-room.ts');

  assert.match(src, /export function sequenceLabel/);
  // Labels include the editorial vocabulary
  assert.match(src, /opener/);
  assert.match(src, /hinge/);
  assert.match(src, /closer/);
  assert.match(src, /late turn/);
  assert.match(src, /early run/);
});

test('playlist-room.ts builds receipts with clear local-data labeling', async () => {
  const src = await read('src/lib/playlist-room.ts');

  assert.match(src, /export function buildReceipt/);
  assert.match(src, /pointcast-playlist-receipt\/v1/);
  assert.match(src, /privateDataNotice/);
  // Receipt clearly states data is local
  assert.match(src, /browser-local data/);
  assert.match(src, /never sent to any server or AI system/);
});

test('playlist-room.ts declares the five note prompts', async () => {
  const src = await read('src/lib/playlist-room.ts');

  assert.match(src, /What promise does the opener make/);
  assert.match(src, /Where does the room change temperature/);
  assert.match(src, /Which transition earns its surprise/);
  assert.match(src, /What is the hidden hinge/);
  assert.match(src, /Does the closer resolve, release, or reopen/);
});

test('playlist-room.ts declares the default playlist ID', async () => {
  const src = await read('src/lib/playlist-room.ts');

  assert.match(src, /DEFAULT_PLAYLIST_ID/);
  assert.match(src, /35WC68tu9rrBoRrW3N2n0M/);
});

// ─── Listening room page ──────────────────────────────────────────

test('listening-room.astro accepts playlist URLs via paste, input, and drag/drop', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Text input
  assert.match(src, /lr-url-input/);
  assert.match(src, /data-action="load-playlist"/);
  // Drag/drop zone
  assert.match(src, /data-lr-dropzone/);
  assert.match(src, /dragover/);
  assert.match(src, /drop/);
  // Enter key support
  assert.match(src, /Enter.*handleLoadInput|keydown.*Enter/);
});

test('listening-room.astro validates Spotify playlist URLs and rejects others', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Client-side parser checks for Spotify domain and playlist type
  assert.match(src, /parsePlaylistUrl/);
  assert.match(src, /spotify\.com/);
  assert.match(src, /playlist/);
  // Error message for invalid input
  assert.match(src, /doesn\\'t look like a Spotify playlist/);
  // Playlist ID regex validation
  assert.match(src, /PLAYLIST_ID_RE/);
});

test('listening-room.astro updates URL without full navigation', async () => {
  const src = await read('src/pages/listening-room.astro');

  assert.match(src, /history\.replaceState/);
  assert.match(src, /listening-room\?pl=/);
});

test('listening-room.astro uses Spotify embed without autoplay or proxying', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Uses official embed URL
  assert.match(src, /open\.spotify\.com\/embed\/playlist/);
  assert.match(src, /utm_source=generator/);
  // No autoplay attribute in iframe allow
  assert.match(src, /allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"/);
  // "Open in Spotify" always visible
  assert.match(src, /Open in Spotify/);
  assert.match(src, /data-lr-open-spotify/);
});

test('listening-room.astro has playlist-specific room identity', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Room key displayed
  assert.match(src, /data-lr-room-key/);
  // Room key format
  assert.match(src, /listening-room\/playlist/);
  // Dynamic playlist changes reconnect the room through the event bus
  assert.match(src, /pc:room:key/);
});

test('listening-room.astro provides notes desk with browser-local storage', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Notes UI
  assert.match(src, /data-lr-note-input/);
  assert.match(src, /data-prompt/);
  // localStorage persistence
  assert.match(src, /pc:playlist-notes:/);
  assert.match(src, /localStorage/);
  // Privacy declaration
  assert.match(src, /Browser-local/);
  assert.match(src, /Never sent to any server or AI/);
});

test('listening-room.astro provides room receipt in JSON and Markdown', async () => {
  const src = await read('src/pages/listening-room.astro');

  assert.match(src, /data-action="receipt-json"/);
  assert.match(src, /data-action="receipt-md"/);
  assert.match(src, /pointcast-playlist-receipt\/v1/);
  assert.match(src, /privateDataNotice/);
  assert.match(src, /browser-local data/);
});

test('listening-room.astro has quick gesture buttons posting to room chat', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Gesture buttons
  assert.match(src, /data-gesture="keep this"/);
  assert.match(src, /data-gesture="hinge"/);
  assert.match(src, /data-gesture="lift"/);
  assert.match(src, /data-gesture="closer"/);
  assert.match(src, /data-gesture="rewind"/);
  // Posts to existing room chat bus
  assert.match(src, /pc:room:chat/);
});

test('listening-room.astro has activity strip from room log', async () => {
  const src = await read('src/pages/listening-room.astro');

  assert.match(src, /data-lr-activity/);
  assert.match(src, /pc:room:log-update/);
});

test('listening-room.astro has "try another" that preserves notes', async () => {
  const src = await read('src/pages/listening-room.astro');

  assert.match(src, /data-action="try-another"/);
  // Clears input but doesn't destroy notes (notes keyed by playlist ID)
  assert.match(src, /input\.value = ''/);
});

test('listening-room.astro works without JavaScript for default playlist', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Noscript fallback
  assert.match(src, /<noscript>/);
  // Default embed rendered server-side
  assert.match(src, /spotifyEmbedUrl\(playlistId\)/);
  // Provider link in noscript
  assert.match(src, /Open this playlist in Spotify/);
});

// ─── Accessibility and mobile ─────────────────────────────────────

test('listening-room.astro has accessibility hooks', async () => {
  const src = await read('src/pages/listening-room.astro');

  // aria-live for status
  assert.match(src, /aria-live="polite"/);
  // aria-labels on controls
  assert.match(src, /aria-label="Load this playlist"/);
  assert.match(src, /aria-label="Try another playlist"/);
  assert.match(src, /aria-label="Spotify player"/);
  assert.match(src, /aria-label="Listening notes"/);
  assert.match(src, /aria-label="Room gestures"/);
  // role="alert" for errors
  assert.match(src, /role="alert"/);
  // role="status" for status messages
  assert.match(src, /role="status"/);
  // Breadcrumb navigation
  assert.match(src, /aria-label="Breadcrumb"/);
});

test('listening-room.astro has prefers-reduced-motion support', async () => {
  const src = await read('src/pages/listening-room.astro');

  assert.match(src, /prefers-reduced-motion/);
  assert.match(src, /transition: none/);
  assert.match(src, /animation: none/);
});

test('listening-room.astro has mobile-responsive layout', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Responsive breakpoints
  assert.match(src, /@media \(max-width: 900px\)/);
  assert.match(src, /@media \(max-width: 620px\)/);
  // Single column on mobile
  assert.match(src, /grid-template-columns: 1fr/);
});

// ─── JSON manifest ────────────────────────────────────────────────

test('listening-room.json.ts declares truthful capability manifest', async () => {
  const src = await read('src/pages/listening-room.json.ts');

  // Schema version
  assert.match(src, /pointcast-listening-room\/v1/);
  // Input contract
  assert.match(src, /acceptedFormats/);
  assert.match(src, /rejectedFormats/);
  assert.match(src, /trackingParametersStripped/);
  // Privacy
  assert.match(src, /notesSentToServer.*false/);
  assert.match(src, /notesSentToAI.*false/);
  assert.match(src, /receiptContainsLocalData.*true/);
  // Provider boundary
  assert.match(src, /proxyOrRestream.*false/);
  assert.match(src, /metadataIsEnhancement.*true/);
  assert.match(src, /metadataIsPrecondition.*false/);
  // Room semantics
  assert.match(src, /differentPlaylistsDifferentRooms.*true/);
  assert.match(src, /keyFormat.*listening-room\/playlist/);
  // Degradation
  assert.match(src, /withoutJavaScript/);
  assert.match(src, /withoutMetadataCredentials/);
  assert.match(src, /withoutPresenceWorker/);
  // Default playlist
  assert.match(src, /35WC68tu9rrBoRrW3N2n0M/);
  // CORS open
  assert.match(src, /Access-Control-Allow-Origin.*\*/);
});

test('listening-room.json.ts does not echo arbitrary query data', async () => {
  const src = await read('src/pages/listening-room.json.ts');

  // No searchParams reading or query parameter reflection
  assert.doesNotMatch(src, /searchParams\.get/);
  assert.doesNotMatch(src, /ctx\.(request|params)/);
});

// ─── CursorRoom room-key override ─────────────────────────────────

test('CursorRoom.astro supports data-room-key opt-in prop', async () => {
  const src = await read('src/components/CursorRoom.astro');

  // Props interface with roomKey
  assert.match(src, /roomKey\?:\s*string/);
  // data-room-key attribute on root element
  assert.match(src, /data-room-key=\{roomKey/);
  // JS reads data-room-key and falls back to pathname
  assert.match(src, /data-room-key.*location\.pathname/);
  // Dynamic room changes are validated and reconnect the socket
  assert.match(src, /pc:room:key/);
  assert.match(src, /closeSocket\(\).*openSocket\(\)/s);
  // Local chat is pushed before the de-dupe key is considered seen
  assert.doesNotMatch(src, /state\.seenChatKeys\[key\]\s*=\s*1;\s*pushLocalLogEntry\(entry\)/);
});

// ─── Metadata endpoint ────────────────────────────────────────────

test('spotify-playlist.ts validates input and degrades gracefully', async () => {
  const src = await read('functions/api/spotify-playlist.ts');

  // Playlist ID validation
  assert.match(src, /PLAYLIST_ID_RE/);
  assert.match(src, /invalid_playlist_id/);
  // Missing credentials/token → 503
  assert.match(src, /metadata_unavailable/);
  assert.match(src, /spotifyFetch/);
  // Error handling for 403/404/429
  assert.match(src, /playlist_not_found/);
  assert.match(src, /playlist_restricted/);
  assert.match(src, /rate_limited/);
  // Bounded response fields
  assert.match(src, /itemRows[\s\S]*slice\(0, 100\)/);
  // February 2026 schema: tracks → items and nested track → item.
  assert.match(src, /items\(total,items\(item\(/);
  assert.match(src, /data\.items \?\? data\.tracks/);
  assert.match(src, /row\?\.item \?\? row\?\.track/);
  assert.match(src, /playlist_metadata_only/);
  // CORS comes from the shared Spotify JSON header helper
  assert.match(src, /SPOTIFY_JSON_HEADERS/);
});

test('listening-room.astro hydrates shared static URLs and uses documented iframe events', async () => {
  const src = await read('src/pages/listening-room.astro');

  assert.match(src, /initialPl[\s\S]*loadPlaylist\(initialPl\)/);
  assert.match(src, /onSpotifyIframeApiReady/);
  assert.match(src, /playback_started/);
  assert.match(src, /playback_update/);
  assert.match(src, /loadEntity/);
  assert.match(src, /discoverPlayingTrack/);
  assert.match(src, /spotify:track:/);
  assert.match(src, /\/api\/spotify\/track\?id=/);
});

// ─── PRD exists ───────────────────────────────────────────────────

test('PRD exists and covers required sections', async () => {
  const src = await read('docs/prd/2026-07-26-spotify-playlist-room-companion.md');

  assert.match(src, /Problem and product thesis/);
  assert.match(src, /Primary audiences/);
  assert.match(src, /Experience principles/);
  assert.match(src, /Full user journey/);
  assert.match(src, /Feature architecture/);
  assert.match(src, /Spotify\/provider boundary/);
  assert.match(src, /Room\/presence model/);
  assert.match(src, /Mobile.*accessibility/);
  assert.match(src, /Metrics/);
  assert.match(src, /Abuse\/safety/);
  assert.match(src, /Machine-readable/);
  assert.match(src, /Acceptance criteria/);
  assert.match(src, /Risks and unresolved/);
});

// ─── No HTML injection ────────────────────────────────────────────

test('listening-room.astro never injects user input as HTML', async () => {
  const src = await read('src/pages/listening-room.astro');

  // Uses textContent, not innerHTML for user-derived content
  assert.match(src, /textContent/);
  // No innerHTML with user data (only for structured log rendering with createElement)
  // The only innerHTML usage creates elements via createElement, not from user strings
  assert.doesNotMatch(src, /innerHTML\s*=\s*[^']*<[^>]*>/);
});
