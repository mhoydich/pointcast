// ListenBrainz as a station source (2026-09-21): open, keyless, no user cap. Spotify's API seats five.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { LB_USER, fetchCounted, fetchListens, fetchPlayingNow, playFromListen } from '../functions/api/spotify/_listenbrainz.ts';
import { mergePlays, playFromTrack, readStationConfig, writeStationConfig } from '../functions/api/spotify/_station.ts';
import { handleSource } from '../functions/api/station/source.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const MB = '30d08f4c-d825-4ae1-b79c-44242cddd7c0', REL = 'f1418001-7f1e-46af-bfdb-95faeded8841';
const listen = (over = {}, info = {}, map = { recording_mbid: MB, caa_release_mbid: REL }) => ({ listened_at: 1771414109, track_metadata: { track_name: 'Some Resolve', artist_name: 'Röyksopp', release_name: 'Profound Mysteries II', additional_info: { duration_ms: 402390, ...info }, mbid_mapping: map }, ...over });

test('a listen becomes a log row whose identity prefers Spotify, then MusicBrainz, then a hash', async () => {
  const mb = await playFromListen(listen(), 'rob');
  assert.deepEqual(mb, { id: `mb-${MB}`, t: 'Some Resolve', a: 'Röyksopp', url: `https://musicbrainz.org/recording/${MB}`, at: '2026-02-18T11:28:29.000Z', src: 'lb', al: 'Profound Mysteries II', ms: 402390, img: `https://coverartarchive.org/release/${REL}/front-250` });
  const sp = await playFromListen(listen({}, { spotify_id: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' }), 'rob');
  assert.equal(sp.id, '4uLU6hMCjMI75M1A2tKUQC', 'so a request on the line can still flip to played'); assert.equal(sp.url, 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC');
  const bare = await playFromListen(listen({}, {}, {}), 'rob'); assert.match(bare.id, /^lb-[0-9a-f]{22}$/); assert.equal(bare.url, 'https://listenbrainz.org/user/rob/'); assert.equal(bare.img, undefined);
  assert.equal((await playFromListen(listen({}, {}, { caa_release_mbid: '../../evil' }), 'rob')).img, undefined, 'only a real MBID becomes a cover URL');
  assert.equal(await playFromListen({ listened_at: 5, track_metadata: { track_name: '', artist_name: 'x' } }, 'rob'), null);
  assert.ok(LB_USER.test('mhoydich')); assert.ok(!LB_USER.test('a/b')); assert.ok(!LB_USER.test('')); assert.ok(!LB_USER.test('x'.repeat(65)));
});

test('the fetchers ask only ListenBrainz, identify themselves, and refuse a bad username without a request', async () => {
  const calls = []; const fake = async (url, init) => { calls.push({ url: String(url), ua: init.headers['User-Agent'] }); const u = String(url);
    if (u.includes('/listens')) return Response.json({ payload: { listens: [listen({ listened_at: 1771414109 }), listen({ listened_at: 1771413706 })] } });
    if (u.includes('/playing-now')) return Response.json({ payload: { listens: [listen()] } });
    if (u.includes('/listen-count')) return Response.json({ payload: { count: 220287 } });
    if (u.includes('/artists')) return Response.json({ payload: { artists: [{ artist_name: 'Wax Tailor', listen_count: 4298 }, { artist_name: '', listen_count: 3 }] } });
    return Response.json({ payload: { recordings: [{ track_name: 'Que Sera', artist_name: 'Wax Tailor', listen_count: 212 }] } }); };
  const rows = await fetchListens('rob', Date.parse('2026-02-18T00:00:00Z'), fake);
  assert.equal(rows.length, 2); assert.ok(Date.parse(rows[0].at) < Date.parse(rows[1].at), 'oldest first'); assert.match(calls[0].url, /min_ts=1771372800&count=100$/);
  assert.deepEqual(await fetchPlayingNow('rob', fake), { title: 'Some Resolve', artist: 'Röyksopp', album: 'Profound Mysteries II' });
  const counted = await fetchCounted('rob', fake); assert.equal(counted.totalListens, 220287); assert.deepEqual(counted.artists.all_time, [{ name: 'Wax Tailor', plays: 4298 }]); assert.equal(counted.recordings.week[0].plays, 212);
  assert.ok(calls.every((c) => c.url.startsWith('https://api.listenbrainz.org/1/') && /PointCastStation/.test(c.ua)));
  const before = calls.length; assert.deepEqual(await fetchListens('../etc', 0, fake), []); assert.equal(await fetchPlayingNow('a b', fake), null); assert.equal(calls.length, before);
});

test('rows from different sources for one play fold together; exact rows of one source never swallow a repeat', async () => {
  const lbRow = await playFromListen(listen({ listened_at: Date.parse('2026-09-21T03:00:30Z') / 1000 }, { spotify_id: 'https://open.spotify.com/track/aaa1bbb2ccc3', duration_ms: 200000 }), 'mike');
  const spRow = playFromTrack({ id: 'aaa1bbb2ccc3', name: 'Some Resolve', duration_ms: 200000, external_urls: { spotify: 'https://open.spotify.com/track/aaa1bbb2ccc3' }, artists: [{ name: 'Röyksopp' }] }, '2026-09-21T03:03:40Z', 'spotify');
  const seen = { ...spRow, at: '2026-09-21T03:01:00.000Z', src: 'seen' };
  let r = mergePlays([seen], [lbRow]); assert.equal(r.plays.length, 1); assert.equal(r.plays[0].src, 'lb', 'an exact row replaces a sighting');
  r = mergePlays(r.plays, [spRow]); assert.equal(r.plays.length, 1, 'Spotify reporting the same play adds nothing');
  const again = { ...lbRow, at: '2026-09-21T03:04:00.000Z' }; assert.equal(mergePlays(r.plays, [again]).plays.length, 2, 'the same track again, by the same source, is a new play');
});

test('only the broadcaster sets the source, the username is verified, and erasing the log keeps the setting', async () => {
  const m = new Map(); m.set('user:station', JSON.stringify({ userId: 'station', preferredName: 's', identities: [], createdAt: new Date().toISOString(), roles: ['broadcaster'] })); m.set('user:alice', JSON.stringify({ userId: 'alice', preferredName: 'a', identities: [], createdAt: new Date().toISOString(), roles: [] }));
  for (const id of ['station', 'alice']) m.set(`session:pcs_${id}`, JSON.stringify({ userId: id, sessionToken: `pcs_${id}`, expiresAt: new Date(Date.now() + 3600_000).toISOString() }));
  const env = { USERS: { async get(k, t) { const v = m.get(k) ?? null; return t === 'json' && v ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; } } };
  const post = (who, body, origin = 'https://pointcast.xyz') => new Request('https://pointcast.xyz/api/station/source', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: `pc_session=pcs_${who}` }, body: JSON.stringify(body) });
  const exists = async () => Response.json({ payload: { count: 1 } }), missing = async () => new Response('{}', { status: 404 });
  assert.equal((await handleSource(post('alice', { listenbrainz: 'mhoydich' }), env, exists)).status, 403);
  assert.equal((await handleSource(post('station', { listenbrainz: 'mhoydich' }, 'https://evil.example'), env, exists)).status, 403);
  assert.equal((await handleSource(post('station', { listenbrainz: 'no such user' }), env, exists)).status, 400);
  assert.equal((await handleSource(post('station', { listenbrainz: 'typo123' }), env, missing)).status, 422); assert.deepEqual(await readStationConfig(env), {});
  assert.equal((await handleSource(post('station', { listenbrainz: 'mhoydich' }), env, exists)).status, 200); assert.deepEqual(await readStationConfig(env), { listenbrainz: 'mhoydich' });
  const { clearStation } = await import('../functions/api/spotify/_station.ts'); await clearStation(env); assert.deepEqual(await readStationConfig(env), { listenbrainz: 'mhoydich' }, 'erasing the log is not forgetting the settings');
  await writeStationConfig(env, {}); assert.deepEqual(await readStationConfig(env), {});
});

test('a visitor’s ListenBrainz name never reaches PointCast, and a Spotify 403 is explained, not looped', () => {
  const me = read('src/pages/me.astro'), room = read('src/scripts/chrome/cursor-room.ts'), personal = read('functions/api/spotify/_personal.ts'), privacy = read('src/pages/privacy.astro');
  assert.match(room, /'https:\/\/api\.listenbrainz\.org\/1\/user\/' \+ encodeURIComponent\(lbUser\) \+ '\/playing-now'/); assert.match(room, /credentials: mode === 'listenbrainz' \? 'omit' : 'same-origin'/);
  const card = me.slice(me.indexOf('data-me-music-lb'), me.indexOf('paintLb();\n    disconnect'));
  assert.doesNotMatch(me.slice(me.indexOf('const lbForm'), me.indexOf('paintLb();', me.indexOf('lbAuto.addEventListener'))), /fetch\(['"`]\/api\//, 'the username is never posted to PointCast'); assert.ok(card.length > 0);
  assert.match(personal, /response\.status === 403 \? 'not_seated'/); assert.match(me, /may only seat five Spotify accounts/); assert.match(me, /Signing in again will not change it\./);
  assert.match(privacy, /PointCast’s servers never receive it/); assert.match(privacy, /holds no\s+ListenBrainz credentials/);
});

// ── fixes from Astra's review (2026-09-21) ──
import { computeStats, readStation, resolveOnAir, syncStation } from '../functions/api/spotify/_station.ts';
import { accept } from '../functions/api/station/notes.ts';

test('a track on repeat survives two sources: Spotify knew one play, ListenBrainz knew all three', () => {
  const sp = playFromTrack({ id: 'rep9', name: 'Loop', duration_ms: 200000, external_urls: { spotify: 'https://open.spotify.com/track/rep9' }, artists: [{ name: 'Band' }] }, '2026-09-21T03:00:00Z', 'spotify');
  const lbAt = (m) => ({ ...sp, src: 'lb', at: `2026-09-21T03:0${m}:00.000Z` });
  let r = mergePlays([sp], [lbAt(0), lbAt(4), lbAt(8)]);
  assert.equal(r.plays.length, 3, 'one absorbed, two added'); assert.deepEqual(r.plays[0].also, ['lb:live']); assert.equal(r.added, 2);
  r = mergePlays(r.plays, [lbAt(4)]); assert.equal(r.plays.length, 3, 'the identical row again is a duplicate'); assert.equal(r.changed, false);
  // across separate calls too: the pairing is remembered on the row, not in memory
  r = mergePlays(mergePlays([sp], [lbAt(0)]).plays, [lbAt(4)]); assert.equal(r.plays.length, 2);
  // and Spotify catching up later pairs off one-to-one instead of multiplying
  r = mergePlays(mergePlays([], [lbAt(0), lbAt(4), lbAt(8)]).plays, [{ ...sp, at: '2026-09-21T03:00:10.000Z' }, { ...sp, at: '2026-09-21T03:04:10.000Z' }, { ...sp, at: '2026-09-21T03:08:10.000Z' }]);
  assert.equal(r.plays.length, 3); assert.ok(r.plays.every((p) => p.also?.[0] === 'spotify:live'));
});

test('the ListenBrainz cursor is its own record: it survives a month boundary and drains a backlog in order', async () => {
  const m = new Map(); const env = { USERS: { async get(k, t) { const v = m.get(k) ?? null; return t === 'json' && v ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; } } };
  await writeStationConfig(env, { listenbrainz: 'mike' });
  const base = Date.parse('2026-08-31T17:00:00Z') / 1000, all = Array.from({ length: 230 }, (_, i) => listen({ listened_at: base + i * 240 }, {}, { recording_mbid: MB })); // 230 listens, 4 min apart, straddling the Sep 1 UTC month boundary
  const asked = []; const real = globalThis.fetch;
  globalThis.fetch = async (url) => { const u = new URL(String(url)); if (u.hostname !== 'api.listenbrainz.org') return new Response('{}', { status: 404 }); const min = Number(u.searchParams.get('min_ts') || 0); asked.push(min); const next = all.filter((l) => l.listened_at > min).slice(0, 100); return Response.json({ payload: { listens: [...next].reverse() } }); };
  try { await syncStation(env); } finally { globalThis.fetch = real; }
  assert.equal(asked.length, 3, 'three pages per sync, no more'); assert.ok(asked[1] > asked[0] && asked[2] > asked[1], 'each page starts where the last one ended');
  assert.equal(Number(m.get('station:cursor:v1:broadcast:lb:mike')), (base + 229 * 240) * 1000, 'the cursor is the newest persisted listen, stored outside the log');
  const aug = JSON.parse(m.get('station:v1:broadcast:log:2026-08') || '[]').length, sep = JSON.parse(m.get('station:v1:broadcast:log:2026-09') || '[]').length;
  assert.equal(aug + sep, 230); assert.ok(aug > 0 && sep > 0, 'rows land in their own months');
});

test('one malformed ListenBrainz row is dropped; the rest of the batch still lands', async () => {
  const bad = [{ listened_at: 1771414109, track_metadata: { track_name: 12345, artist_name: 'x' } }, listen({ listened_at: 9e15 }), listen({ listened_at: 'yesterday' }), null, listen({ listened_at: 1771414109 })];
  const rows = await fetchListens('rob', 0, async () => Response.json({ payload: { listens: bad } }));
  assert.equal(rows.length, 1); assert.equal(rows[0].t, 'Some Resolve');
  assert.deepEqual(await fetchListens('rob', 0, async () => Response.json({ payload: { listens: 'nope' } })), []);
});

test('a liner note needs attribution, not a mention', () => {
  const page = (title, description, extract) => ({ type: 'standard', title, description, extract });
  const want = { title: 'Hurt', artist: 'Nine Inch Nails' };
  assert.ok(accept('song', page('Hurt (Nine Inch Nails song)', '1995 single by Nine Inch Nails', '"Hurt" is a song by Nine Inch Nails.'), want));
  assert.ok(!accept('song', page('Hurt (Johnny Cash song)', '2002 single by Johnny Cash', 'A cover of the song by Nine Inch Nails, recorded by Johnny Cash.'), want), 'named after "by" as someone else: a conflict, however often our artist is mentioned');
  assert.ok(accept('song', page('So What (Miles Davis composition)', '1959 composition', '"So What" is the first track on the 1959 album Kind of Blue by American trumpeter Miles Davis. It is one of the best known examples of modal jazz.'), { title: 'So What', artist: 'Miles Davis' }), 'no "by" in the description: the first sentence may vouch');
  assert.ok(!accept('song', page('So What', '2008 single', '"So What" is a song by Pink. It was later compared to work by Miles Davis.'), { title: 'So What', artist: 'Miles Davis' }), 'a later sentence may not');
});

test('on air is resolved once: Spotify live wins, otherwise ListenBrainz, and every surface reads that', async () => {
  const m = new Map(); const env = { USERS: { async get(k, t) { const v = m.get(k) ?? null; return t === 'json' && v ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); }, async delete(k) { m.delete(k); }, async list() { return { keys: [], list_complete: true }; } } };
  await writeStationConfig(env, { listenbrainz: 'mike' }); const real = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ payload: { listens: [listen()] } });
  try {
    assert.equal((await resolveOnAir(env, { live: true, title: 'A', artist: 'B' })).via, 'spotify');
    const lb = await resolveOnAir(env, { live: false, title: 'Old', artist: 'Track', status: 'off-air' }); assert.equal(lb.live, true); assert.equal(lb.title, 'Some Resolve'); assert.equal(lb.via, 'listenbrainz'); assert.equal(lb.url, 'https://listenbrainz.org/user/mike/');
  } finally { globalThis.fetch = real; }
  assert.match(read('functions/now-playing.json.ts'), /resolveOnAir\(env, await resolveNowPlaying\(env\)\)/); assert.match(read('functions/api/station.ts'), /resolveOnAir\(env, n\)/);
  assert.doesNotMatch(read('src/pages/station.astro'), /j\.listenbrainz\?\.playingNow, airNow/);
});
