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
  assert.match(auth, /personal\s+\? 'user-read-currently-playing'\s+: 'user-read-currently-playing user-read-recently-played user-top-read'/);
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
