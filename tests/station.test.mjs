// /station — the broadcaster's radio station (2026-09-21): the log, what is counted from it, and who it applies to.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { computeStats, mergePlays, playFromTrack, recordSeen, readStation, clearStation } from '../functions/api/spotify/_station.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const track = (id, name, extra = {}) => ({ id, name, duration_ms: 200000, popularity: 60, external_urls: { spotify: `https://open.spotify.com/track/${id}` }, artists: [{ name: 'Neil Young' }, { name: 'Crazy Horse' }], album: { name: 'Harvest Moon', release_date: '1992-11-02', images: [{ url: 'https://i.scdn.co/image/big', height: 640 }, { url: 'https://i.scdn.co/image/mid', height: 300 }] }, ...extra });
const kv = () => { const m = new Map(); let puts = 0; return { m, get puts() { return puts; }, USERS: { async get(k, t) { const v = m.get(k) ?? null; return t === 'json' && v ? JSON.parse(v) : v; }, async put(k, v) { puts++; m.set(k, v); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; } } }; };

test('a play keeps only what the page shows, and refuses anything that is not a Spotify track link', () => {
  const p = playFromTrack(track('aaa1', 'Harvest Moon'), '2026-09-20T03:10:00Z', 'spotify');
  assert.deepEqual(p, { id: 'aaa1', t: 'Harvest Moon', a: 'Neil Young, Crazy Horse', url: 'https://open.spotify.com/track/aaa1', at: '2026-09-20T03:10:00.000Z', src: 'spotify', al: 'Harvest Moon', img: 'https://i.scdn.co/image/mid', ms: 200000, yr: 1992, pop: 60 });
  assert.equal(playFromTrack(track('x', 'Bad', { external_urls: { spotify: 'https://evil.example/t' } }), '2026-09-20T03:10:00Z', 'seen'), null);
  assert.equal(playFromTrack(track('x', 'Bad'), 'not a date', 'seen'), null);
});

test('the same play is logged once, and Spotify’s exact row replaces the town’s sighting', () => {
  const seen = playFromTrack(track('aaa1', 'Harvest Moon'), '2026-09-20T03:11:30Z', 'seen');
  const again = playFromTrack(track('aaa1', 'Harvest Moon'), '2026-09-20T03:12:40Z', 'seen');
  const exact = playFromTrack(track('aaa1', 'Harvest Moon'), '2026-09-20T03:13:20Z', 'spotify');
  const later = playFromTrack(track('aaa1', 'Harvest Moon'), '2026-09-20T09:00:00Z', 'spotify');
  let r = mergePlays([], [seen]); assert.equal(r.added, 1);
  r = mergePlays(r.plays, [again]); assert.equal(r.added, 0); assert.equal(r.plays.length, 1);
  r = mergePlays(r.plays, [exact]); assert.equal(r.plays.length, 1); assert.equal(r.plays[0].src, 'spotify');
  r = mergePlays(r.plays, [later]); assert.equal(r.plays.length, 2, 'a replay hours later is its own play');
});

test('the numbers are counted in station time (Pacific), not UTC', () => {
  const plays = [
    playFromTrack(track('aaa1', 'Harvest Moon'), '2026-09-20T03:10:00Z', 'spotify'),               // Sat 19 Sep, 8:10 pm PT
    playFromTrack(track('aaa1', 'Harvest Moon'), '2026-09-21T03:20:00Z', 'spotify'),               // Sun 20 Sep, 8:20 pm PT
    playFromTrack(track('bbb2', 'Obscure', { popularity: 12, album: { release_date: '1974' } }), '2026-09-21T16:00:00Z', 'spotify'), // Mon 21 Sep, 9 am PT
  ];
  const s = computeStats(plays, Date.parse('2026-09-21T18:00:00Z'));
  assert.equal(s.plays, 3); assert.equal(s.byHour[20], 2); assert.equal(s.byHour[9], 1); assert.equal(s.peakHour, 20);
  assert.deepEqual(s.byWeekday, [1, 1, 0, 0, 0, 0, 1]);
  assert.equal(s.signature, 'Evening'); assert.equal(s.daysOnAir, 3); assert.equal(s.streakDays, 3);
  assert.equal(s.distinctTracks, 2); assert.equal(s.repeatShare, 0.333); assert.equal(s.minutes, 10);
  assert.deepEqual(s.decades, [{ decade: 1970, plays: 1 }, { decade: 1990, plays: 2 }]);
  assert.equal(s.heavyRotation[0].t, 'Harvest Moon'); assert.equal(s.heavyRotation[0].plays, 2);
  assert.equal(s.deepCuts[0].t, 'Obscure'); assert.equal(s.topArtists[0].name, 'Neil Young');
  assert.equal(computeStats([]).peakHour, null);
});

test('the signal logs a sighting with one KV write, never two for the same play, and the broadcaster can erase it all', async () => {
  const env = kv();
  await recordSeen(env, track('aaa1', 'Harvest Moon')); await recordSeen(env, track('aaa1', 'Harvest Moon'));
  assert.equal(env.puts, 1, 'KV writes only when a play is new');
  await recordSeen(env, { id: '', name: '' }); await recordSeen({}, track('ccc3', 'No KV bound')); // never throws
  const station = await readStation(env);
  assert.equal(station.stats.plays, 1); assert.equal(station.sources.seen, 1); assert.equal(station.recent[0].t, 'Harvest Moon'); assert.deepEqual(station.covers, ['https://i.scdn.co/image/mid']);
  assert.ok(await clearStation(env) >= 1); assert.equal((await readStation(env)).stats.plays, 0);
});

test('only the broadcaster flow asks Spotify for history; a personal connection stays narrow; the policy says so', () => {
  const auth = read('functions/api/spotify/auth.ts'), privacy = read('src/pages/privacy.astro'), api = read('functions/api/station.ts'), bc = read('functions/api/spotify/_broadcast.ts');
  assert.match(auth, /personal\s+\? 'user-read-currently-playing'\s+: 'user-read-currently-playing user-read-recently-played user-top-read user-library-read'/);
  assert.match(privacy, /user-library-read/);
  assert.match(privacy, /user-read-recently-played/); assert.match(privacy, /A personal Spotify connection never has a\s+play log/);
  assert.match(api, /roles\?\.includes\('broadcaster'\)/); assert.match(api, /same-origin-required/);
  assert.match(bc, /clearStation\(env\)/, 'disconnecting Spotify erases the log');
  assert.match(bc, /startsWith\('https:\/\/api\.spotify\.com\/v1\/me\/'\)/);
});

test('the page draws only from /api/station, through textContent, with covers from i.scdn.co only', () => {
  const page = read('src/pages/station.astro');
  assert.match(page, /fetch\('\/api\/station'/); assert.doesNotMatch(page, /innerHTML|insertAdjacentHTML|set:html/);
  assert.match(page, /src\.startsWith\('https:\/\/i\.scdn\.co\/'\)/); assert.match(page, /href: '\/station\.json'/);
});

// ── the request line, the agent door, the companion (2026-09-21) ──
import { handleRequests, markPlayed, normalizeRequest, parseTrack } from '../functions/api/station/requests.ts';
import { STATION_TOOL_DEFINITIONS, STATION_WRITE_TOOL_NAMES, dispatchStationTool } from '../src/lib/station-mcp.ts';

const TRACK = 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC';
const lineEnv = () => { const m = new Map(); const ns = { async get(k, t) { const v = m.get(k) ?? null; return t === 'json' && v ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); }, async delete(k) { m.delete(k); } }; return { m, VISITS: ns, PC_RATES_KV: ns, USERS: ns }; };
const spotifySays = async (input) => { const u = String(input); if (u.includes('/oembed')) return new Response(JSON.stringify({ title: 'Never Gonna Give You Up', thumbnail_url: 'https://image-cdn-ak.spotifycdn.com/image/x' }), { headers: { 'content-type': 'application/json' } }); return new Response('<meta property="og:description" content="Rick Astley · Whenever You Need Somebody · Song · 1987">', { headers: { 'content-type': 'text/html' } }); };
const post = (body, headersIn = {}) => new Request('https://pointcast.xyz/api/station/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.9', ...headersIn }, body: JSON.stringify(body) });

test('a request is a Spotify track and a reason; nothing else gets on the line', () => {
  assert.deepEqual(parseTrack(`${TRACK}?si=abc`), { id: '4uLU6hMCjMI75M1A2tKUQC', url: TRACK });
  assert.deepEqual(parseTrack('spotify:track:4uLU6hMCjMI75M1A2tKUQC'), { id: '4uLU6hMCjMI75M1A2tKUQC', url: TRACK });
  for (const bad of ['https://open.spotify.com/playlist/35WC68tu9rrBoRrW3N2n0M', 'https://evil.example/open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', 'javascript:alert(1)', '']) assert.equal(parseTrack(bad), null, bad);
  assert.throws(() => normalizeRequest({ url: TRACK, why: 'good' }), /Say why/);
  const n = normalizeRequest({ url: TRACK, why: '  It answers\nthe Nick Drake.  ', who: 'x'.repeat(90), noun: 5000, via: 'agent' });
  assert.equal(n.why, 'It answers the Nick Drake.'); assert.equal(n.who.length, 40); assert.equal(n.noun, undefined); assert.equal(n.via, 'agent');
});

test('the line takes the title from Spotify, refuses a duplicate, and marks a request played from the log', async () => {
  const env = lineEnv();
  const made = await handleRequests(post({ url: TRACK, why: 'It belongs after the Genesis run.', who: 'cc', via: 'agent', title: 'My Own Title' }), env, spotifySays);
  assert.equal(made.status, 201); const row = (await made.json()).request;
  assert.equal(row.title, 'Never Gonna Give You Up'); assert.equal(row.via, 'agent'); assert.equal(row.attribution, 'self-reported');
  assert.equal((await handleRequests(post({ url: TRACK, why: 'Asking again, louder.' }), env, spotifySays)).status, 409);
  assert.equal((await handleRequests(post({ url: 'https://open.spotify.com/album/x', why: 'A whole album please.' }), env, spotifySays)).status, 400);
  const played = markPlayed([row], [{ id: row.trackId, t: 'x', a: 'y', url: TRACK, at: new Date(Date.now() + 60000).toISOString(), src: 'spotify' }]);
  assert.ok(played[0].playedAt); assert.equal(markPlayed([row], [{ id: row.trackId, t: 'x', a: 'y', url: TRACK, at: '2020-01-01T00:00:00Z', src: 'spotify' }])[0].playedAt, null, 'a play from before the request does not count');
  const list = await (await handleRequests(new Request('https://pointcast.xyz/api/station/requests'), env, spotifySays)).json();
  assert.equal(list.open, 1); assert.match(list.review, /untrusted/);
  const del = await handleRequests(new Request(`https://pointcast.xyz/api/station/requests?id=${row.id}`, { method: 'DELETE', headers: { Origin: 'https://pointcast.xyz' } }), env, spotifySays);
  assert.equal(del.status, 403, 'only the broadcaster removes a request');
});

test('the request line rate-limits per address', async () => {
  const env = lineEnv(); let last = 0;
  for (let i = 0; i < 8; i++) last = (await handleRequests(post({ url: `https://open.spotify.com/track/${'a'.repeat(21)}${i}`, why: `Reason number ${i} for the station.` }), env, spotifySays)).status;
  assert.equal(last, 429);
});

test('agents get the same line over MCP: one read tool, one write tool, wired into the server', async () => {
  assert.deepEqual(STATION_TOOL_DEFINITIONS.map((t) => t.name), ['station_on_air', 'station_request']); assert.deepEqual(STATION_WRITE_TOOL_NAMES, ['station_request']);
  const mcp = read('functions/api/mcp.ts');
  for (const bit of ['...STATION_TOOL_DEFINITIONS,', '...STATION_WRITE_TOOL_NAMES,', "case 'station_request':", 'dispatchStationTool(name, args, base)']) assert.ok(mcp.includes(bit), bit);
  const real = globalThis.fetch; let sent = null;
  globalThis.fetch = async (url, init) => { sent = { url: String(url), body: JSON.parse(init.body) }; return new Response(JSON.stringify({ ok: true, request: { title: 'Pink Moon', artist: 'Nick Drake' } }), { status: 201 }); };
  try { const out = await dispatchStationTool('station_request', { url: TRACK, why: 'Because of the heavy rotation.', name: 'claude-fable-5-1' }, 'https://pointcast.xyz'); assert.match(out.content[0].text, /On the line: Pink Moon — Nick Drake/); } finally { globalThis.fetch = real; }
  assert.equal(sent.url, 'https://pointcast.xyz/api/station/requests'); assert.equal(sent.body.via, 'agent'); assert.equal(sent.body.who, 'claude-fable-5-1');
});

test('the companion is an opt-in switch: nothing about your music rides the town socket until you flip it', () => {
  const room = read('src/scripts/chrome/cursor-room.ts'), me = read('src/pages/me.astro'), page = read('src/pages/station.astro');
  assert.match(room, /m === 'station' \|\| m === 'personal' \? m : ''/); assert.match(room, /if \(autoMode\(\) && autoLabel\) return autoLabel;/);
  assert.match(me, /localStorage\.setItem\('pc:music:auto', 'personal'\)/); assert.match(me, /href="\/api\/spotify\/auth\?personal=1&returnTo=\/me"/);
  assert.match(me, /No history, no playlists\./); assert.doesNotMatch(me.slice(me.indexOf('data-me-music'), me.indexOf('data-me-kept')), /\sid="/, '/me forbids element ids');
  assert.match(page, /href="\/api\/spotify\/auth\?returnTo=\/station"/); assert.match(page, /id="requests"/);
});

// ── liner notes: sourced, matched strictly, never generated (2026-09-21) ──
import { accept, cleanTitle, handleNotes, leadArtist, norm } from '../functions/api/station/notes.ts';

test('titles are cleaned of remaster and feature clutter before anything is looked up', () => {
  assert.equal(cleanTitle('Mama - 2007 Remaster'), 'Mama'); assert.equal(cleanTitle('Watcher of the Skies - 2007 Stereo Mix'), 'Watcher of the Skies');
  assert.equal(cleanTitle('Bitch Better Have My Money'), 'Bitch Better Have My Money'); assert.equal(cleanTitle('Song (feat. Someone) [Live]'), 'Song');
  assert.equal(cleanTitle('Svefn-g-englar'), 'Svefn-g-englar', 'a hyphen inside a title is not a suffix');
  assert.equal(leadArtist('Floating Points, Pharoah Sanders'), 'Floating Points'); assert.equal(norm('Sigur Rós'), 'sigur ros');
});

test('a note is shown only when the article describes the right kind of thing by the right artist', () => {
  const page = (title, description, extract = 'x', type = 'standard') => ({ type, title, description, extract });
  const want = { title: 'Mama', artist: 'Genesis' };
  assert.ok(accept('song', page('Mama (Genesis song)', '1983 single by Genesis', '"Mama" is a song by the English rock band Genesis.'), want));
  assert.ok(!accept('song', page('Mama (Spice Girls song)', '1997 single by the Spice Girls'), want), 'same title, wrong artist');
  assert.ok(!accept('song', page('Mama', 'Topics referred to by the same term', 'x', 'disambiguation'), want));
  assert.ok(!accept('song', page('Genesis (Genesis album)', '1983 studio album by Genesis'), want), 'an album is not the song');
  assert.ok(accept('record', page('Pink Moon', '1972 studio album by Nick Drake'), { title: 'Pink Moon', artist: 'Nick Drake' }));
  assert.ok(accept('artist', page('Genesis (band)', 'English rock band'), { title: 'Genesis', artist: 'Genesis' }));
  assert.ok(!accept('artist', page('Book of Genesis', 'First book of the Bible'), { title: 'Genesis', artist: 'Genesis' }));
  assert.ok(!accept('artist', page('Genesis Rodriguez', 'American actress'), { title: 'Genesis', artist: 'Genesis' }));
  assert.ok(accept('artist', page('The Meters', 'American funk band'), { title: 'Meters', artist: 'Meters' }));
});

test('the notes endpoint returns attributed Wikipedia text, Commons pictures for artists only, and nothing when nothing matches', async () => {
  const pages = {
    'Mama_(Genesis_song)': { type: 'standard', title: 'Mama (Genesis song)', description: '1983 single by Genesis', extract: '"Mama" is a song by the English rock band Genesis. '.repeat(20), content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Mama_(Genesis_song)' } }, thumbnail: { source: 'https://upload.wikimedia.org/wikipedia/en/4/4c/cover.jpg' } },
    'Genesis_(band)': { type: 'standard', title: 'Genesis (band)', description: 'English rock band', extract: 'Genesis are an English rock band formed in 1967.', content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Genesis_(band)' } }, thumbnail: { source: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Genesis.jpg' } },
  };
  const fake = async (url) => { const u = String(url); if (u.includes('list=search')) return Response.json({ query: { search: u.includes('song') ? [{ title: 'Mama (Genesis song)' }] : u.includes('musician') ? [{ title: 'Genesis (band)' }] : [] } }); const key = decodeURIComponent(u.split('/summary/')[1]); return pages[key] ? Response.json(pages[key]) : new Response('{}', { status: 404 }); };
  const j = await (await handleNotes(new Request('https://pointcast.xyz/api/station/notes?title=Mama%20-%202007%20Remaster&artist=Genesis&album=Genesis'), fake)).json();
  assert.deepEqual(j.notes.map((n) => n.kind), ['song', 'artist']); assert.equal(j.source, 'Wikipedia'); assert.equal(j.license, 'CC BY-SA 4.0');
  assert.equal(j.notes[0].image, undefined, 'a fair-use single sleeve is never hotlinked'); assert.match(j.notes[1].image, /wikipedia\/commons\//);
  assert.ok(j.notes[0].extract.length <= 461); assert.match(j.notes[0].url, /^https:\/\/en\.wikipedia\.org\/wiki\//);
  const none = await (await handleNotes(new Request('https://pointcast.xyz/api/station/notes?title=Zzz&artist=Nobody'), async () => Response.json({ query: { search: [] } }))).json();
  assert.deepEqual(none.notes, []); assert.equal((await handleNotes(new Request('https://pointcast.xyz/api/station/notes?title=x'), fake)).status, 400);
  const page = read('src/pages/station.astro'); assert.match(page, /Nothing here is generated\./); assert.match(page, /Better blank than wrong\./);
});

// ── rewind: Spotify's three windows side by side (2026-09-21) ──
import { computeRewind } from '../functions/api/spotify/_station.ts';

test('rewind is set arithmetic on Spotify’s three lists: no play counts are invented', () => {
  const A = (name, genres = []) => ({ name, url: `https://open.spotify.com/artist/${name}`, genres });
  const top = { fetchedAt: Date.parse('2026-09-21T12:00:00Z'), library: { total: 4321, first: { t: 'Brick', a: 'Ben Folds Five', url: 'https://open.spotify.com/track/x', savedAt: '2012-03-03T00:00:00.000Z' }, latest: [] },
    artists: { weeks: [A('Ben Folds Five'), A('Genesis'), A('Khruangbin')], months: [A('Genesis'), A('Pink Floyd')], years: [A('Genesis', ['progressive rock', 'art rock']), A('Pink Floyd', ['progressive rock']), A('Jethro Tull', ['folk rock'])] },
    tracks: { weeks: [], months: [], years: [{ t: 'Firth of Fifth', a: 'Genesis', url: 'u', yr: 1973 }, { t: 'Fearless', a: 'Pink Floyd', url: 'u', yr: 1971 }, { t: 'Brick', a: 'Ben Folds Five', url: 'u', yr: 1997 }] } };
  const rw = computeRewind(top);
  assert.deepEqual(rw.newObsessions.map((x) => x.name), ['Ben Folds Five', 'Khruangbin']);
  assert.deepEqual(rw.alwaysThere.map((x) => x.name), ['Genesis']);
  assert.deepEqual(rw.faded.map((x) => x.name), ['Jethro Tull'], 'Pink Floyd is still in the six-month list, so it has not gone quiet');
  assert.equal(rw.genres[0], 'progressive rock'); assert.deepEqual(rw.topTrackDecades, [{ decade: 1970, tracks: 2 }, { decade: 1990, tracks: 1 }]);
  assert.equal(rw.library.total, 4321); assert.doesNotMatch(JSON.stringify(rw), /"plays"/);
  const page = read('src/pages/station.astro'); assert.match(page, /It gives ranks, not play counts/); assert.match(page, /data-rw hidden/);
});
