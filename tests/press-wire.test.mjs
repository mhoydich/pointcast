import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const releases = JSON.parse(await readFile(new URL('src/data/press-releases.json', root), 'utf8'));

test('press wire seeds six product filings across every public kind', () => {
  assert.equal(releases.length, 6);
  assert.equal(new Set(releases.map((release) => release.id)).size, releases.length);
  assert.equal(new Set(releases.map((release) => release.slug)).size, releases.length);
  assert.deepEqual(
    new Set(releases.map((release) => release.kind)),
    new Set(['product', 'data', 'archive', 'game', 'engineering']),
  );

  const excludedAdRoutes = new Set([
    'https://pointcast.xyz/bell-and-signal',
    'https://pointcast.xyz/last-tag',
    'https://allworthy.xyz/nine-lives',
  ]);
  releases.forEach((release) => assert.equal(excludedAdRoutes.has(release.productUrl), false));
});

test('every filing has disclosure, primary evidence, and complete body copy', () => {
  for (const release of releases) {
    assert.match(release.id, /^PCPW-2026-\d{4}$/);
    assert.equal(release.status, 'published');
    assert.match(release.disclosure, /owned announcement/i);
    assert.match(release.disclosure, /not independent reporting/i);
    assert.ok(Date.parse(release.publishedAt));
    assert.ok(release.headline.length >= 30);
    assert.ok(release.summary.length >= 80);
    assert.ok(Array.isArray(release.body) && release.body.length >= 3);
    assert.ok(Array.isArray(release.proofs) && release.proofs.length >= 2);
    assert.ok(release.proofs.every((proof) => proof.url.startsWith('https://')));
  }
});

test('filings are stored newest first', () => {
  const timestamps = releases.map((release) => Date.parse(release.publishedAt));
  assert.deepEqual(timestamps, timestamps.slice().sort((a, b) => b - a));
});

test('home and discovery surfaces expose the press wire', async () => {
  const [home, agents, sitemap, llms] = await Promise.all([
    readFile(new URL('src/pages/index.astro', root), 'utf8'),
    readFile(new URL('src/pages/agents.json.ts', root), 'utf8'),
    readFile(new URL('src/pages/sitemap-discovery.xml.ts', root), 'utf8'),
    readFile(new URL('public/llms.txt', root), 'utf8'),
  ]);

  assert.match(home, /<PressWireStrip\s*\/>/);
  assert.match(agents, /press: 'https:\/\/pointcast\.xyz\/press'/);
  assert.match(agents, /press: 'https:\/\/pointcast\.xyz\/press\.json'/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/press\.xml/);
  assert.match(llms, /PointCast Press Wire/);
});
