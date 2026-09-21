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
