// music-links (2026-09-21): one track link, on any service the town accepts. See functions/_lib/music-links.ts
// for the parser itself and functions/api/station/requests.ts for how the request line uses it.
import assert from 'node:assert/strict';
import test from 'node:test';

import { musicLinkKey, parseMusicLink, SERVICE_LABEL } from '../functions/_lib/music-links.ts';

test('every accepted service parses a track link, drops tracking parameters, and rebuilds a canonical url', () => {
  const cases = [
    // [raw, expected]
    ['https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc123', { service: 'spotify', kind: 'track', id: '4uLU6hMCjMI75M1A2tKUQC', url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' }],
    ['https://open.spotify.com/intl-de/track/4uLU6hMCjMI75M1A2tKUQC', { service: 'spotify', kind: 'track', id: '4uLU6hMCjMI75M1A2tKUQC', url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' }],
    ['spotify:track:4uLU6hMCjMI75M1A2tKUQC', { service: 'spotify', kind: 'track', id: '4uLU6hMCjMI75M1A2tKUQC', url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' }],
    ['https://music.apple.com/us/album/blinding-lights/1499378108?i=1499378614&uo=4', { service: 'apple', kind: 'track', id: '1499378614', url: 'https://music.apple.com/us/album/blinding-lights/1499378108?i=1499378614' }],
    ['https://music.apple.com/gb/song/blinding-lights/1499378614', { service: 'apple', kind: 'track', id: '1499378614', url: 'https://music.apple.com/gb/song/blinding-lights/1499378614' }],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share', { service: 'youtube', kind: 'track', id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
    ['https://youtu.be/dQw4w9WgXcQ?si=xyz', { service: 'youtube', kind: 'track', id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ', { service: 'youtube', kind: 'track', id: 'dQw4w9WgXcQ', url: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ' }],
    ['https://soundcloud.com/officialrickastley/never-gonna-give-you-up-4?in=a-playlist&si=abc', { service: 'soundcloud', kind: 'track', id: 'officialrickastley/never-gonna-give-you-up-4', url: 'https://soundcloud.com/officialrickastley/never-gonna-give-you-up-4' }],
    ['https://the-lumineers.bandcamp.com/track/ho-hey?utm_source=x&utm_campaign=y', { service: 'bandcamp', kind: 'track', id: 'the-lumineers/ho-hey', url: 'https://the-lumineers.bandcamp.com/track/ho-hey' }],
    ['https://tidal.com/browse/track/251380837?u', { service: 'tidal', kind: 'track', id: '251380837', url: 'https://tidal.com/browse/track/251380837' }],
    ['https://listen.tidal.com/track/251380837', { service: 'tidal', kind: 'track', id: '251380837', url: 'https://tidal.com/browse/track/251380837' }],
    ['https://www.deezer.com/track/3135556?utm_source=x', { service: 'deezer', kind: 'track', id: '3135556', url: 'https://www.deezer.com/track/3135556' }],
    ['https://www.deezer.com/en/track/3135556', { service: 'deezer', kind: 'track', id: '3135556', url: 'https://www.deezer.com/track/3135556' }],
  ];
  for (const [raw, expected] of cases) assert.deepEqual(parseMusicLink(raw), expected, raw);
});

test('non-track kinds are refused on every service that has them: an album, a playlist, an artist, a channel, a set is not a request', () => {
  for (const bad of [
    'https://open.spotify.com/album/4uLU6hMCjMI75M1A2tKUQC',
    'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    'https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02',
    'https://music.apple.com/us/album/blinding-lights/1499378108', // no ?i= — this is the album, not a track
    'https://music.apple.com/us/artist/the-weeknd/479756766',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/playlist?list=PL9tY0BWXOZFuFEG_GtOBZ8-8u8gN8iEsB',
    'https://www.youtube.com/@RickAstleyYT',
    'https://soundcloud.com/officialrickastley', // a profile, not a track
    'https://soundcloud.com/officialrickastley/sets/whenever-you-need-somebody', // a set
    'https://the-lumineers.bandcamp.com/album/cleopatra',
    'https://tidal.com/browse/album/251380836',
    'https://www.deezer.com/album/302127',
  ]) assert.equal(parseMusicLink(bad), null, bad);
});

test('look-alike hosts never match: the check is always URL#hostname, never a substring of the raw text', () => {
  for (const bad of [
    'https://evil.example/open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    'https://spotify.com.evil.example/track/4uLU6hMCjMI75M1A2tKUQC',
    'https://open.spotify.com.evil.example/track/4uLU6hMCjMI75M1A2tKUQC',
    'https://music.apple.com.evil.example/us/song/x/1499378614',
    'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://not-soundcloud.com/user/track',
    'https://bandcamp.com.evil.example/track/x', // bandcamp needs the real domain, not just the word in a hostname
    'https://www.bandcamp.com/track/x', // www is the marketing site, not an artist subdomain
    'https://bandcamp.com/track/x', // no artist subdomain at all
    'https://tidal.com.evil.example/browse/track/1',
    'https://deezer.com.evil.example/track/1',
  ]) assert.equal(parseMusicLink(bad), null, bad);
});

test('http, javascript:, empty input, bogus scheme, userinfo and non-string input are all refused', () => {
  for (const bad of [
    'http://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    'javascript:alert(1)',
    '',
    '   ',
    'not a url at all',
    'https://user:pw@open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    undefined,
    null,
    42,
    { url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' },
  ]) assert.equal(parseMusicLink(bad), null, String(bad));
});

test('musicLinkKey is service:id, stable across whatever decoration the url carried', () => {
  const a = parseMusicLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share');
  const b = parseMusicLink('https://youtu.be/dQw4w9WgXcQ?si=xyz');
  assert.equal(musicLinkKey(a), 'youtube:dQw4w9WgXcQ');
  assert.equal(musicLinkKey(a), musicLinkKey(b), 'the same video, shared two different ways, is the same key');
  assert.deepEqual(Object.keys(SERVICE_LABEL).sort(), ['apple', 'bandcamp', 'deezer', 'soundcloud', 'spotify', 'tidal', 'youtube']);
});

// ── the request line accepts every service, keyed on the parsed link, titled from the unfurl ──
import { fileAgentRequest, handleRequests, markPlayed } from '../functions/api/station/requests.ts';

const lineEnv = () => {
  const m = new Map();
  const ns = { async get(k, t) { const v = m.get(k) ?? null; return t === 'json' && v ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); }, async delete(k) { m.delete(k); } };
  return { m, VISITS: ns, PC_RATES_KV: ns, USERS: ns };
};
const post = (body, headersIn = {}) => new Request('https://pointcast.xyz/api/station/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.50', ...headersIn }, body: JSON.stringify(body) });

// A minimal stand-in for unfurl()'s two paths: YouTube (and Spotify) go through oEmbed, anything
// else is read as HTML for its Open Graph title — matching what functions/api/unfurl.ts actually does.
const previewFetch = async (input) => {
  const u = String(input);
  if (u.includes('youtube.com/oembed')) return Response.json({ title: 'Never Gonna Give You Up', author_name: 'Rick Astley', thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' });
  if (u.includes('open.spotify.com/oembed')) return Response.json({ title: 'Pink Moon', thumbnail_url: 'https://i.scdn.co/image/x' });
  if (u.includes('music.apple.com')) return new Response('<meta property="og:title" content="Blinding Lights by The Weeknd on Apple Music"><meta property="og:description" content="Song · 2019"><meta property="og:image" content="https://is1-ssl.mzstatic.com/image/x.jpg">', { headers: { 'content-type': 'text/html' } });
  return new Response('<title>no</title>', { headers: { 'content-type': 'text/html' } });
};

test('an Apple Music request and a YouTube request are both accepted, titled from the unfurl (never from the requester)', async () => {
  const env = lineEnv();
  const apple = await handleRequests(post({ url: 'https://music.apple.com/us/song/blinding-lights/1499378614', why: 'It would sit well after the Genesis run.', who: 'cc', title: 'Not My Title' }), env, previewFetch);
  assert.equal(apple.status, 201);
  const appleRow = (await apple.json()).request;
  assert.equal(appleRow.service, 'apple'); assert.equal(appleRow.title, 'Blinding Lights by The Weeknd on Apple Music'); assert.equal(appleRow.trackId, undefined);
  const yt = await handleRequests(post({ url: 'https://youtu.be/dQw4w9WgXcQ', why: 'A different kind of station id, still on brand.' }), env, previewFetch);
  assert.equal(yt.status, 201);
  const ytRow = (await yt.json()).request;
  assert.equal(ytRow.service, 'youtube'); assert.equal(ytRow.title, 'Never Gonna Give You Up'); assert.equal(ytRow.trackId, undefined);
});

test('the duplicate check is keyed on service:id, so the same track shared two different ways on the same service is still a duplicate', async () => {
  const env = lineEnv();
  const first = await handleRequests(post({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share', why: 'It answers the last thing that played.' }), env, previewFetch);
  assert.equal(first.status, 201);
  const again = await handleRequests(post({ url: 'https://youtu.be/dQw4w9WgXcQ?si=someOtherShareId', why: 'Asking again, differently decorated.' }), env, previewFetch);
  assert.equal(again.status, 409, 'youtu.be and youtube.com/watch for the same id share one key');
  // A different service entirely, sharing nothing but a hyphen in its id, is never mistaken for it.
  const diffService = await handleRequests(post({ url: 'https://open.spotify.com/track/dQw4w9WgXcQdQw4w9W', why: 'A different service, not a duplicate.' }), env, previewFetch);
  assert.equal(diffService.status, 201);
});

test('a non-Spotify row never carries a trackId, and so never flips to played — the play log is Spotify-only, and that is honest, not a bug', async () => {
  const env = lineEnv();
  const made = await handleRequests(post({ url: 'https://music.apple.com/us/song/blinding-lights/1499378614', why: 'It fits the hour.' }), env, previewFetch);
  const row = (await made.json()).request;
  assert.equal(row.trackId, undefined); assert.ok(row.key.startsWith('apple:'));
  const played = markPlayed([row], [{ id: '1499378614', t: 'Blinding Lights', a: 'The Weeknd', url: row.url, at: new Date(Date.now() + 60000).toISOString(), src: 'spotify' }]);
  assert.equal(played[0].playedAt, null, 'the play log only ever holds Spotify ids; an Apple Music request has none to match against');
});

test('agents get the same multi-service line, carried through fileAgentRequest untouched', async () => {
  const env = lineEnv();
  const mcp = new Request('https://pointcast.xyz/api/mcp', { method: 'POST', headers: { 'CF-Connecting-IP': '203.0.113.60' } });
  const res = await fileAgentRequest(mcp, env, { url: 'https://tidal.com/browse/track/251380837', why: 'A track this station has not tried.', name: 'claude-fable-5-1' }, previewFetch);
  assert.equal(res.status, 201); assert.equal(res.body.request.service, 'tidal'); assert.equal(res.body.request.via, 'agent');
});
