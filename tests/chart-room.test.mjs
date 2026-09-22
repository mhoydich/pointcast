// The Chart Room (2026-09-21): three public charts shown as published, consensus, movement, a reading list of reviews.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { COUNTRIES, appleChart, applyMovement, chartsPayload, consensus, debuts, deezerChart, handleCharts, songKey } from '../functions/api/charts.ts';
import { FEEDS, parseFeed, plain, reviewHeadlines } from '../functions/api/charts/reviews.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const row = (rank, title, artist) => ({ rank, title, artist, url: 'https://x', key: songKey(title, artist) });

test('the same song is recognised across services, and different songs are not', () => {
  assert.equal(songKey('Dracula (with JENNIE)', 'Tame Impala'), songKey('Dracula', 'Tame Impala & JENNIE'));
  assert.equal(songKey('Mama - 2007 Remaster', 'Genesis'), songKey('Mama', 'Genesis'));
  assert.equal(songKey('Déjà Vu', 'Beyoncé feat. Jay-Z'), songKey('Deja Vu', 'Beyonce'));
  assert.notEqual(songKey('Money', 'Pink Floyd'), songKey('Money for Nothing', 'Dire Straits'));
  assert.notEqual(songKey('Hurt', 'Nine Inch Nails'), songKey('Hurt', 'Johnny Cash'));
});

test('consensus is set arithmetic over the charts: two or more, most agreement first, one vote per source', () => {
  const A = { id: 'a', source: 'ListenBrainz', rows: [row(1, 'SWIM', 'BTS'), row(2, 'Dracula', 'Tame Impala'), row(3, 'Dracula', 'Tame Impala')] };
  const B = { id: 'b', source: 'Apple Music', rows: [row(1, "Choosin' Texas", 'Ella Langley'), row(4, 'Dracula (with JENNIE)', 'Tame Impala')] };
  const C = { id: 'c', source: 'Deezer', rows: [row(1, 'Dracula (with JENNIE)', 'Tame Impala'), row(3, "Choosin' Texas", 'Ella Langley')] };
  const con = consensus([A, B, C]);
  assert.deepEqual(con.map((c) => [c.title, c.on.length]), [['Dracula', 3], ["Choosin' Texas", 2]]);
  assert.deepEqual(con[0].on.map((o) => o.source), ['ListenBrainz', 'Apple Music', 'Deezer']);
  assert.deepEqual(consensus([A]), []);
});

test('movement compares with an earlier snapshot: up, down, same, new, and nothing at all when there is none', () => {
  const c = { id: 'x', rows: [row(1, 'A', 'a'), row(2, 'B', 'b'), row(3, 'C', 'c'), row(4, 'D', 'd')] };
  applyMovement([c], { x: { [songKey('A', 'a')]: 3, [songKey('B', 'b')]: 2, [songKey('C', 'c')]: 1 } });
  assert.deepEqual(c.rows.map((r) => r.move), [2, 0, -2, 'new']);
  applyMovement([c], null); assert.deepEqual(c.rows.map((r) => r.move), [null, null, null, null]);
});

test('chart rows keep only links and images on the source’s own hosts, whatever the feed says', async () => {
  const apple = async () => Response.json({ feed: { results: [
    { name: 'Good', artistName: 'Artist', url: 'https://music.apple.com/us/album/x/1?i=2', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/a.jpg' },
    { name: 'Evil link', artistName: 'x', url: 'https://music.apple.com.evil.example/x', artworkUrl100: 'https://is1-ssl.mzstatic.com/a.jpg' },
    { name: 'Evil art', artistName: 'x', url: 'https://music.apple.com/us/song/y/3', artworkUrl100: 'https://evil.example/mzstatic.com/a.jpg' },
    { name: 12345, artistName: null, url: 'javascript:alert(1)' },
  ] } });
  const c = await appleChart('us', 'songs', apple);
  assert.deepEqual(c.rows.map((r) => [r.rank, r.title, Boolean(r.img)]), [[1, 'Good', true], [2, 'Evil art', false]]);
  const dz = await deezerChart(async () => Response.json({ data: [{ title: 'T', artist: { name: 'A' }, link: 'https://www.deezer.com/track/1', album: { cover_medium: 'https://cdn-images.dzcdn.net/images/cover/x.jpg' } }, { title: 'Bad', artist: { name: 'A' }, link: 'http://www.deezer.com/track/2' }] }));
  assert.equal(dz.rows.length, 1); assert.ok(dz.rows[0].img);
  assert.equal(await appleChart('us', 'songs', async () => new Response('nope', { status: 500 })), null);
  // Apple Music's host refuses some server runtimes (403 seen from workerd, 2026-09-21): fall back to the iTunes Store chart, and say so.
  const fallback = await appleChart('gb', 'albums', async (url) => (String(url).includes('marketingtools') ? new Response('Forbidden', { status: 403 }) : Response.json({ feed: { entry: [{ 'im:name': { label: 'Bass Persuades' }, 'im:artist': { label: 'Someone' }, 'im:image': [{ label: 'https://is1-ssl.mzstatic.com/55.jpg' }, { label: 'https://is1-ssl.mzstatic.com/170.jpg' }], link: { attributes: { href: 'https://music.apple.com/gb/album/bass-persuades/1?uo=2' } } }] } })));
  assert.equal(fallback.source, 'iTunes Store'); assert.match(fallback.note, /buying/); assert.equal(fallback.rows[0].img, 'https://is1-ssl.mzstatic.com/170.jpg'); assert.equal(fallback.id, 'itunes-albums-gb');
  const d = { id: 'x', source: 'Deezer', name: 'Songs', rows: [{ ...row(1, 'A', 'a'), move: 0 }, { ...row(2, 'B', 'b'), move: 'new' }] }; assert.deepEqual(debuts([d]).map((x) => [x.title, x.rank, x.chart]), [['B', 2, 'Deezer · Songs']]);
});

test('the endpoint refuses unknown countries, snapshots once a day, and says so when every source is down', async () => {
  const m = new Map(); let puts = 0; const env = { VISITS: { async get(k, t) { const v = m.get(k) ?? null; return t === 'json' && v ? JSON.parse(v) : v; }, async put(k, v) { puts++; m.set(k, v); } } };
  const fake = async (url) => { const u = String(url);
    if (u.includes('sitewide/recordings')) return Response.json({ payload: { recordings: [{ track_name: 'SWIM', artist_name: 'BTS', listen_count: 180392 }] } });
    if (u.includes('marketingtools')) return Response.json({ feed: { results: [{ name: 'SWIM', artistName: 'BTS', url: 'https://music.apple.com/us/song/swim/1' }] } });
    return new Response('{}', { status: 500 }); };
  const now = Date.parse('2026-09-21T12:00:00Z');
  const a = await chartsPayload(env, 'us', fake, now); assert.equal(a.songs.length, 2); assert.equal(a.consensus[0].title, 'SWIM'); assert.equal(a.movedSince, null); assert.equal(puts, 1);
  await chartsPayload(env, 'us', fake, now + 3600000); assert.equal(puts, 1, 'one snapshot a day');
  const next = await chartsPayload(env, 'us', fake, now + 86400000); assert.equal(next.movedSince, '2026-09-21'); assert.equal(next.songs[0].rows[0].move, 0); assert.equal(puts, 2);
  const res = await handleCharts(new Request('https://pointcast.xyz/api/charts?country=zz'), env, fake); assert.equal((await res.json()).country, 'us');
  assert.equal((await handleCharts(new Request('https://pointcast.xyz/api/charts'), {}, async () => new Response('', { status: 500 }))).status, 503);
  assert.ok(Object.keys(COUNTRIES).length >= 12);
});

test('reviews are headlines only: decoded, stripped, recent, and linked to the publication’s own host', () => {
  const feed = FEEDS.find((f) => f.id === 'pitchfork'), now = Date.parse('2026-09-21T12:00:00Z');
  const xml = `<rss><channel>
    <item><title><![CDATA[Beck: <i>Ride Lonesome</i> &amp; friends &#8211; review]]></title><link>https://pitchfork.com/reviews/albums/beck-ride-lonesome/?utm_source=rss&amp;x=1</link><pubDate>Sun, 20 Sep 2026 04:00:00 GMT</pubDate><description>${'The full review text must never be kept. '.repeat(20)}</description></item>
    <item><title>Off-site</title><link>https://evil.example/pitchfork.com/x</link><pubDate>Sun, 20 Sep 2026 04:00:00 GMT</pubDate></item>
    <item><title>Script</title><link>javascript:alert(1)</link><pubDate>Sun, 20 Sep 2026 04:00:00 GMT</pubDate></item>
    <item><title>Old news</title><link>https://pitchfork.com/reviews/albums/old/</link><pubDate>Sat, 01 Aug 2026 04:00:00 GMT</pubDate></item>
    <item><title></title><link>https://pitchfork.com/reviews/albums/untitled/</link><pubDate>Sun, 20 Sep 2026 04:00:00 GMT</pubDate></item>
  </channel></rss>`;
  const got = parseFeed(xml, feed, now);
  assert.deepEqual(got.map((h) => [h.title, h.url]), [['Beck: Ride Lonesome & friends – review', 'https://pitchfork.com/reviews/albums/beck-ride-lonesome/?x=1']]);
  assert.deepEqual(Object.keys(got[0]).sort(), ['at', 'reviewsOnly', 'source', 'sourceId', 'title', 'url'], 'no body text is kept');
  assert.equal(plain('<script>alert(1)</script>Hello&nbsp;&#x1F3B5;'), 'alert(1) Hello 🎵');
  const atom = parseFeed('<feed><entry><title>Kim Deal – Nobody Loves You More</title><link rel="alternate" href="https://www.loudandquiet.com/reviews/kim-deal/"/><updated>2026-09-19T10:00:00Z</updated></entry></feed>', FEEDS.find((f) => f.id === 'loudandquiet'), now);
  assert.equal(atom[0].url, 'https://www.loudandquiet.com/reviews/kim-deal/');
});

test('a dead feed is simply absent, and the page never copies lyrics or review text', async () => {
  const r = await reviewHeadlines(async (url) => (String(url).includes('nme.com') ? new Response(`<rss><item><title>One</title><link>https://www.nme.com/reviews/album/one</link><pubDate>${new Date().toUTCString()}</pubDate></item></rss>`) : new Response('', { status: 503 })));
  assert.equal(r.headlines.length, 1); assert.equal(r.sources.find((s) => s.id === 'nme').count, 1); assert.equal(r.sources.find((s) => s.id === 'pitchfork').count, 0);
  const page = read('src/pages/charts.astro');
  assert.doesNotMatch(page, /innerHTML|insertAdjacentHTML|set:html/); assert.match(page, /The town does not copy lyrics\./); assert.match(page, /genius\.com\/search\?q=/);
  assert.match(page, /Billboard and Spotify publish no open chart feed/); assert.doesNotMatch(read('functions/api/charts.ts') + read('functions/api/charts/reviews.ts'), /billboard\.com|charts\.spotify\.com|lrclib|lyrics\.ovh|api\.genius\.com/i, 'no scraping, no lyrics sources');
});
