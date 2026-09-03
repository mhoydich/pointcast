import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const TRACK_ID = '6kIwzLSiQU51taaaZ9zWSE';

test('PointCast publishes one canonical now-playing record and SPN block', async () => {
  const [record, endpoint, block, cardEndpoint, headers] = await Promise.all([
    readFile(new URL('src/data/now-playing.ts', root), 'utf8'),
    readFile(new URL('src/pages/now-playing.json.ts', root), 'utf8'),
    readFile(new URL('src/content/blocks/0491.json', root), 'utf8'),
    readFile(new URL('src/pages/images/og/b/0491.png.ts', root), 'utf8'),
    readFile(new URL('public/_headers', root), 'utf8'),
  ]);

  assert.match(record, new RegExp(TRACK_ID));
  assert.match(record, /Mama - 2007 Remaster/);
  assert.match(record, /artist: 'Genesis'/);
  assert.match(record, /status: 'playing'/);
  assert.match(endpoint, /NOW_PLAYING/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /stale-while-revalidate=3600/);
  assert.match(headers, /\/now-playing\.json[\s\S]*Access-Control-Allow-Origin: \*/);

  const parsed = JSON.parse(block);
  assert.equal(parsed.id, '0491');
  assert.equal(parsed.channel, 'SPN');
  assert.equal(parsed.type, 'LISTEN');
  assert.equal(parsed.meta.artist, 'Genesis');
  assert.equal(parsed.meta.trackId, TRACK_ID);
  assert.equal(parsed.meta.currentlyPlaying, true);
  assert.match(parsed.media.src, new RegExp(`/embed/track/${TRACK_ID}`));
  assert.match(cardEndpoint, /public\/images\/og\/b\/0491\.png/);
  assert.match(cardEndpoint, /image\/png/);
});

test('the PointCast dock and reciprocal widget read the canonical record', async () => {
  const [footer, dockRuntime, receipt, widget] = await Promise.all([
    readFile(new URL('src/components/FooterBar.astro', root), 'utf8'),
    readFile(new URL('src/scripts/chrome/footer-bar.ts', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
    readFile(new URL('public/open-ad-network.js', root), 'utf8'),
  ]);

  assert.match(footer, /NOW_PLAYING/);
  assert.match(dockRuntime, /NOW_PLAYING/);
  assert.match(footer, /Open the current track in Spotify/);
  assert.match(receipt, /nowPlaying: NOW_PLAYING/);
  assert.match(widget, /feed\.nowPlaying/);
  assert.match(widget, /POINTCAST NOW PLAYING/);
  assert.match(widget, /networkNowPlaying/);
  assert.match(widget, /OPEN SPOTIFY/);
  assert.doesNotMatch(widget, /autoplay/);
});
