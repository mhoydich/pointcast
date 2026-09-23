/** Every page gets its own unfurl: page cards, live rooms, El Segundo light, motion loops. */
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Resvg } from '@resvg/resvg-js';
import { lightAt, lightBucket, liveBucket, periodAt } from '../src/lib/unfurl/light.mjs';
import { unfurlClient } from '../src/lib/unfurl/client.mjs';
import { LIVE_ROOMS, MOTION_ROOMS, cardPath, channelForPath, nounForPath, quipFor, wantsOwnCard } from '../src/lib/unfurl/rooms.mjs';
import { liveCardUrl, pageCardUrl, validBucket } from '../src/lib/unfurl/urls.mjs';
import { planUnfurl } from '../src/lib/unfurl/plan.mjs';
import { LIVE_ROOM_IDS, clean, liveCard, pageCard, postText, wrap } from '../src/lib/unfurl/cards.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => readFile(new URL(file, root), 'utf8');
const renders = (svg) => {
  const png = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
  assert.equal(png.width, 1200);
  assert.equal(png.height, 630);
};

test('the light follows the El Segundo clock and names the cache bucket', () => {
  assert.equal(periodAt(6).id, 'dawn');
  assert.equal(periodAt(12).id, 'noon');
  assert.equal(periodAt(18).id, 'golden');
  assert.equal(periodAt(23).id, 'night');
  // 2026-09-24T00:40Z is 5:40 PM PDT.
  const golden = new Date('2026-09-24T00:40:00Z');
  assert.equal(lightAt(golden).id, 'golden');
  assert.equal(lightAt(golden).clock.label, '5:40 PM');
  assert.equal(lightBucket(golden), '2026-09-23.golden');
  assert.equal(liveBucket(new Date('2026-09-23T21:37:00Z')), '2026-09-23T14:35');
  // Fog is the marine layer in the morning only.
  assert.equal(lightAt(new Date('2026-09-23T16:00:00Z'), 'overcast').id, 'marine');
  assert.equal(lightAt(golden, 'overcast').id, 'golden');
});

test('unfurl clients are told apart, iMessage before X and Facebook', () => {
  assert.equal(unfurlClient('Mozilla/5.0 (Macintosh) facebookexternalhit/1.1 Facebot Twitterbot/1.0'), 'imessage');
  assert.equal(unfurlClient('Twitterbot/1.0'), 'x');
  assert.equal(unfurlClient('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'), 'slack');
  assert.equal(unfurlClient('Mozilla/5.0 (compatible; Discordbot/2.0)'), 'discord');
  assert.equal(unfurlClient('facebookexternalhit/1.1'), 'facebook');
  assert.equal(unfurlClient('Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605'), '');
});

test('card paths and buckets refuse anything that is not a plain site path', () => {
  assert.equal(cardPath('/drum-says/'), '/drum-says');
  assert.equal(cardPath('/b/0599?x=1'), '/b/0599');
  assert.equal(cardPath('//evil.example'), null);
  assert.equal(cardPath('https://evil.example/'), null);
  assert.equal(cardPath('/../etc'), null);
  assert.equal(cardPath('/a b<script>'), null);
  assert.equal(validBucket('2026-09-23.golden'), '2026-09-23.golden');
  assert.equal(validBucket('2026-09-23T14:35'), '2026-09-23T14:35');
  assert.equal(validBucket('"><script>'), '');
  assert.equal(pageCardUrl('/drum-says', '2026-09-23.golden'), 'https://pointcast.xyz/og/page.png?p=%2Fdrum-says&b=2026-09-23.golden');
  assert.equal(liveCardUrl('tug', 'nope'), 'https://pointcast.xyz/og/live/tug.png');
});

test('each page gets a stable channel, Noun and quip of its own', () => {
  assert.equal(channelForPath('/drum-says'), 'SPN');
  assert.equal(channelForPath('/paddles/joola'), 'CRT');
  assert.equal(channelForPath('/prayer-bells'), 'GDN');
  assert.equal(nounForPath('/drum-says'), nounForPath('/drum-says'));
  assert.notEqual(nounForPath('/drum-says'), nounForPath('/drum-fill'));
  assert.ok(nounForPath('/anything') >= 0 && nounForPath('/anything') < 1200);
  assert.equal(quipFor('/x', '2026-09-23.golden'), quipFor('/x', '2026-09-23.golden'));
  const quips = new Set(['night', 'dawn', 'morning', 'noon', 'afternoon', 'golden', 'blue'].map((p) => quipFor('/x', `2026-09-23.${p}`)));
  assert.ok(quips.size > 1, 'the quip rotates with the light');
});

test('generic and borrowed cards are replaced; real art is kept', () => {
  assert.ok(wantsOwnCard('/tug', 'https://pointcast.xyz/images/og/og-home-v5.png?v=1'));
  assert.ok(wantsOwnCard('/drum-says', 'https://pointcast.xyz/images/og-drum.png'));
  assert.ok(wantsOwnCard('/drum-koan', '/images/og-drum-altars.png'));
  assert.ok(!wantsOwnCard('/drum-altars', '/images/og-drum-altars.png'));
  assert.ok(!wantsOwnCard('/solar', 'https://pointcast.xyz/images/og/b/0602.png?v=cd'));
});

test('the request-time plan: live rooms, page cards, buckets, motion, homepage untouched', () => {
  const now = new Date('2026-09-24T00:40:00Z');
  assert.deepEqual(planUnfurl({ pathname: '/', currentImage: 'x', now }), { image: '', headHtml: '' });
  const tug = planUnfurl({ pathname: '/tug', currentImage: 'https://pointcast.xyz/images/og/og-home-v5.png', now });
  assert.equal(tug.image, 'https://pointcast.xyz/og/live/tug.png?b=2026-09-23T17%3A40');
  assert.match(tug.headHtml, /og:video" content="https:\/\/pointcast\.xyz\/images\/og\/motion\/tug\.mp4"/);
  const says = planUnfurl({ pathname: '/drum-says', currentImage: 'https://pointcast.xyz/og/page.png?p=%2Fdrum-says', now });
  assert.equal(says.image, 'https://pointcast.xyz/og/page.png?p=%2Fdrum-says&b=2026-09-23.golden');
  assert.equal(planUnfurl({ pathname: '/solar', currentImage: 'https://pointcast.xyz/images/og/b/0602.png', now }).image, '');
  const bare = planUnfurl({ pathname: '/bare', missing: true, now });
  assert.match(bare.headHtml, /<meta property="og:image" content="https:\/\/pointcast\.xyz\/og\/page\.png\?p=%2Fbare&amp;b=2026-09-23\.golden"/);
});

test('copy is cleaned to what the Latin font subsets can draw', () => {
  assert.equal(clean('hi 🎉 there'), 'hi there');
  assert.equal(clean('🤝', '(a sticker)'), '(a sticker)');
  assert.equal(postText('♫ https://open.spotify.com/track/45Del'), '[open.spotify.com]');
  const lines = wrap('one two three four five six seven eight nine ten eleven twelve', { size: 60, width: 400, maxLines: 2 });
  assert.equal(lines.length, 2);
  assert.match(lines[1], /…$/);
});

test('every card body renders at 1200×630, and escapes what it is given', () => {
  const light = lightAt(new Date('2026-09-23T16:00:00Z'));
  const page = pageCard({ path: '/x', title: 'A <b>bold</b> & "quoted" title', description: 'desc', light, client: 'slack', serial: 42 });
  assert.ok(!page.includes('<b>'));
  assert.match(page, /UNFURL #42/);
  assert.match(page, /HELLO, SLACK\./);
  // Every site-name separator the pages use is trimmed from the card title.
  for (const sep of ['—', '|', '·', '-']) {
    assert.match(pageCard({ path: '/k', title: `Koan ${sep} PointCast`, light }), />Koan<\/text>/);
  }
  renders(page);
  const data = {
    shortwave: { posts: [{ text: 'hello town', who: 'visitor', at: new Date().toISOString(), noun: 3 }] },
    station: { onAir: { title: 'Head Over Heels', artist: 'Tears For Fears', live: true }, stats: { plays: 260 } },
    tug: { tug: { humanPulls: 36, machinePulls: 1, knot: -0.4 } },
    drum: { globalTotal: 27187 },
    window: { tempF: 66, condition: 'overcast', sunset: '2026-09-23T18:48' },
    'bell-post': { phrases: [{ notes: [{ n: 1 }, { n: 3 }], voice: 'chime', hue: 200, t: Date.now() }], total: 9 },
  };
  assert.deepEqual([...LIVE_ROOM_IDS].sort(), Object.values(LIVE_ROOMS).sort());
  for (const room of LIVE_ROOM_IDS) renders(liveCard({ room, data: data[room], light, presence: { humans: 2, agents: 1 } }));
  assert.match(liveCard({ room: 'tug', data: data.tug, light }), /People are winning\./);
  assert.match(liveCard({ room: 'tug', data: { tug: { machinePulls: 1 } }, light }), /1 PULL · MACHINES/);
});

test('motion loops exist and stay small', () => {
  for (const { src } of Object.values(MOTION_ROOMS)) {
    const file = new URL(`public${src}`, root);
    assert.ok(existsSync(file), `${src} missing — run node scripts/og-motion.mjs`);
    assert.ok(statSync(file).size < 1_000_000, `${src} over 1 MB`);
  }
});

test('the routes, middleware and layouts are wired to the engine', async () => {
  const [page, live, middleware, layout, render] = await Promise.all([
    read('functions/og/page.png.ts'),
    read('functions/og/live/[room].ts'),
    read('functions/_middleware.ts'),
    read('src/layouts/BlockLayout.astro'),
    read('functions/_lib/og-render.ts'),
  ]);
  for (const route of [page, live]) {
    assert.match(route, /export const onRequestHead/);
    assert.match(route, /fallback\(/);
  }
  // The page card reads the page's own words; the query can only name a path.
  assert.match(page, /readPageMeta/);
  assert.doesNotMatch(page, /searchParams\.get\('t'\)/);
  assert.match(middleware, /planUnfurl\(/);
  assert.match(middleware, /x-pointcast-card-probe/);
  assert.match(layout, /pageCardUrl\(Astro\.url\.pathname/);
  assert.match(render, /CREATE TABLE IF NOT EXISTS unfurl_counts/);
});

test('a full build keeps committed block cards instead of redrawing them', async () => {
  const generator = await read('scripts/generate-og-images.mjs');
  assert.match(generator, /git', \['ls-files'/);
  assert.match(generator, /if \(tracked\.has\(out\)\) \{ kept\+\+; continue; \}/);
});

test('the Unfurl Wall manifest reads each built page’s own card and skips hidden pages', async () => {
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const path = (await import('node:path')).default;
  const { buildManifest } = await import('../scripts/unfurl-wall-manifest.mjs');
  const dist = await mkdtemp(path.join(tmpdir(), 'pc-wall-'));
  const page = async (dir, head) => {
    await mkdir(path.join(dist, dir), { recursive: true });
    await writeFile(path.join(dist, dir, 'index.html'), `<html><head>${head}</head><body></body></html>`);
  };
  await page('tug', '<meta property="og:title" content="The Tug — PointCast"><meta property="og:image" content="https://pointcast.xyz/images/og/og-home-v5.png?v=1">');
  await page('solar', '<title>Small Solar &amp; You · PointCast</title><meta property="og:image" content="https://pointcast.xyz/images/og/b/0602.png">');
  await page('secret', '<meta name="robots" content="noindex, nofollow"><title>Secret</title>');
  await page('old', '<meta http-equiv="refresh" content="0; url=/new"><title>Old</title>');
  await page('unfurl-wall', '<title>The Unfurl Wall</title>');
  const manifest = await buildManifest(dist);
  assert.deepEqual(manifest.cards, [
    { p: '/solar', t: 'Small Solar & You', i: '/images/og/b/0602.png' },
    { p: '/tug', t: 'The Tug', i: '/images/og/og-home-v5.png?v=1' },
  ]);
});

test('the light dial names periods, and only real unfurlers are counted', async () => {
  const { lightForPeriod } = await import('../src/lib/unfurl/light.mjs');
  assert.equal(lightForPeriod('golden').id, 'golden');
  assert.equal(lightForPeriod('marine').id, 'marine');
  assert.equal(lightForPeriod('"><x'), null);
  const [page, live, wall, pkg] = await Promise.all([
    read('functions/og/page.png.ts'), read('functions/og/live/[room].ts'), read('src/pages/unfurl-wall.astro'), read('package.json'),
  ]);
  for (const route of [page, live]) {
    assert.match(route, /client \? bumpUnfurlCounter\(env\) : Promise\.resolve\(0\)/);
    assert.match(route, /&l=\$\{forced \|\| 'now'\}/);
  }
  assert.match(wall, /fetch\('\/unfurl-wall\.json'\)/);
  assert.match(wall, /planUnfurl\(/);
  assert.match(JSON.parse(pkg).scripts.build, /astro\.mjs build && node scripts\/unfurl-wall-manifest\.mjs$/);

test('keyboard quartet invites pick a seat, never words', async () => {
  const { quartetSeat, quartetCardUrl } = await import('../src/lib/unfurl/urls.mjs');
  const { unfurlWords } = await import('../src/lib/unfurl/plan.mjs');
  const { quartetCard } = await import('../src/lib/unfurl/cards.mjs');
  const { lightAt } = await import('../src/lib/unfurl/light.mjs');
  const now = new Date('2026-09-23T17:41:00Z');
  assert.equal(quartetSeat('?seat=2&from=Mike'), 2);
  assert.equal(quartetSeat('?seat=7'), null);
  assert.equal(quartetSeat('?seat=1%3Cb'), null);
  assert.equal(quartetCardUrl(null), 'https://pointcast.xyz/og/quartet.png');
  const plan = planUnfurl({ pathname: '/keyboard-quartet', search: '?seat=1&from=<b>hi</b>', currentImage: 'https://pointcast.xyz/og/quartet.png', now });
  assert.match(plan.image, /^https:\/\/pointcast\.xyz\/og\/quartet\.png\?seat=1\&b=2026-09-23\.[a-z]+$/);
  assert.equal(unfurlWords({ pathname: '/keyboard-quartet', search: '' }), null);
  assert.equal(unfurlWords({ pathname: '/keyboard', search: '?seat=1' }), null);
  const words = unfurlWords({ pathname: '/keyboard-quartet/', search: '?seat=1&from=Evil' });
  assert.match(words.description, /Gold seat/);
  assert.doesNotMatch(JSON.stringify(words), /Evil/);
  for (const seat of [null, 0, 3]) renders(quartetCard({ seat, light: lightAt(now), client: 'slack', serial: 3 }));
});
