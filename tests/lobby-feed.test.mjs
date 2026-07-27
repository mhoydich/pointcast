import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('lobby advertises its guestbook feed', async () => {
  const [page, json] = await Promise.all([
    readFile(new URL('src/pages/lobby.astro', root), 'utf8'),
    readFile(new URL('src/pages/lobby.json.ts', root), 'utf8'),
  ]);

  assert.match(page, /type="application\/rss\+xml" href="\/lobby\.xml"/);
  assert.match(page, /follow arrivals at <a href="\/lobby\.xml">/);
  assert.match(json, /guestbook_feed: '\/lobby\.xml'/);
});

test('lobby feed derives entries from the canonical guestbook', async () => {
  const feed = await readFile(new URL('src/pages/lobby.xml.ts', root), 'utf8');

  assert.match(feed, /lobby\.guestbook\.map/);
  assert.match(feed, /pubDate: new Date\(entry\.at\)/);
  assert.match(feed, /link: `\/lobby#guest-\$\{entry\.at\}`/);
});
