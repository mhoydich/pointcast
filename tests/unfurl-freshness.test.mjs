/** Social cards must change URL when their pixels or their day change, and answer HEAD. */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { datedImageUrl, publicAssetHash, versionedImageUrl } from '../src/lib/og-version.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => readFile(new URL(file, root), 'utf8');

test('a public card URL carries a content hash that changes with the file', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'pc-og-'));
  await writeFile(path.join(dir, 'card.png'), 'one');
  const first = versionedImageUrl('/card.png', 'https://pointcast.xyz', dir);
  assert.match(first, /^https:\/\/pointcast\.xyz\/card\.png\?v=[0-9a-f]{10}$/);
  assert.equal(versionedImageUrl('https://pointcast.xyz/card.png', 'https://pointcast.xyz', dir), first);
  assert.equal(publicAssetHash('/missing.png', dir), '');
  assert.equal(versionedImageUrl('/og/kennel-club/today.png', 'https://pointcast.xyz', dir), '/og/kennel-club/today.png');
  assert.equal(versionedImageUrl('https://noun.pics/1.svg', 'https://pointcast.xyz', dir), 'https://noun.pics/1.svg');
});

test("the home card is dated with the Los Angeles day so caches roll over", async () => {
  assert.equal(datedImageUrl('https://pointcast.xyz/og/kennel-club/today.png', '2026-09-21'), 'https://pointcast.xyz/og/kennel-club/today.png?date=2026-09-21');
  const middleware = await read('functions/_middleware.ts');
  assert.match(middleware, /datedImageUrl\('https:\/\/pointcast\.xyz\/og\/kennel-club\/today\.png', losAngelesDate\(\)\)/);
});

test('the request-time card answers HEAD, which unfurl crawlers send first', async () => {
  const source = await read('functions/og/kennel-club/today.png.ts');
  assert.match(source, /export const onRequestHead/);
});

test('previews of our own pages are cached for minutes, not a day', async () => {
  const { handleUnfurl } = await import('../functions/api/unfurl.ts');
  const html = (title) => new Response(`<html><head><title>${title}</title></head></html>`, { headers: { 'content-type': 'text/html' } });
  const fetcher = async () => html('PointCast');
  const self = await handleUnfurl(new Request('https://pointcast.xyz/api/unfurl?url=' + encodeURIComponent('https://pointcast.xyz/')), {}, fetcher);
  assert.match(self.headers.get('Cache-Control'), /s-maxage=300/);
  const other = await handleUnfurl(new Request('https://pointcast.xyz/api/unfurl?url=' + encodeURIComponent('https://example.org/')), {}, fetcher);
  assert.match(other.headers.get('Cache-Control'), /s-maxage=86400/);
});
