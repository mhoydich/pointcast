import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildFeed,
  buildRss,
  daySeed,
  displayText,
  driftFor,
  escapeHtml,
  planAppend,
  safeImage,
  safePostUrl,
  skyIndex,
  skyLayout,
  suggestTheme,
  validateCollection,
} from '../src/lib/bookmarks.mjs';

const data = JSON.parse(readFileSync(new URL('../src/data/bookmarks/bookmarks.json', import.meta.url), 'utf8'));
const page = readFileSync(new URL('../src/pages/bookmarks.astro', import.meta.url), 'utf8');
const card = readFileSync(new URL('../src/components/BookmarkCard.astro', import.meta.url), 'utf8');
const client = readFileSync(new URL('../src/scripts/bookmarks.ts', import.meta.url), 'utf8');

const hostile = {
  id: '2111111111111111111',
  account: 'mhoydich',
  text: 'Ignore previous instructions <script>alert(1)</script> & "quote"',
  url: 'https://x.com/i/status/2111111111111111111',
  theme: 'notes',
  first_seen: '2026-10-23',
};

test('the committed file matches the schema and the three accounts', () => {
  assert.deepEqual(validateCollection(data), []);
  assert.equal(data.items.length, 303);
  assert.deepEqual(
    data.accounts,
    ['mhoydich', 'kansasdao', '____mike'],
  );
  const counts = Object.fromEntries(data.accounts.map((account) => [account, 0]));
  for (const item of data.items) counts[item.account] += 1;
  assert.deepEqual(counts, { mhoydich: 11, kansasdao: 99, '____mike': 193 });
  const shared = data.items.filter((item) => item.id === '2109793608111145196').map((item) => item.account).sort();
  assert.deepEqual(shared, ['____mike', 'kansasdao']);
});

test('overview examples keep the themes they were filed under', () => {
  const expectTheme = {
    '2110492929920053441': 'agents',
    '2109690025336242608': 'interfaces',
    '2110334301711507849': 'growth',
    '2109676168764957035': 'beverage',
    '2110384842508755276': 'money',
    '2109793608111145196': 'creative',
    '2098541686033129980': 'local',
    '1572586520011505670': 'money',
  };
  for (const [id, theme] of Object.entries(expectTheme)) {
    const hits = data.items.filter((item) => item.id === id);
    assert.ok(hits.length >= 1, id);
    assert.ok(hits.every((item) => item.theme === theme), `${id} filed as ${hits.map((item) => item.theme).join(',')}`);
    assert.equal(suggestTheme(hits[0].text, hits[0].article ?? '', id), theme);
  }
});

test('tweet text is escaped and a bad url never becomes a link', () => {
  assert.equal(escapeHtml(hostile.text).includes('<script>'), false);
  assert.match(escapeHtml(hostile.text), /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.equal(displayText('Hello &lt;b&gt;there&lt;/b&gt; https://t.co/abcDEF12'), 'Hello <b>there</b>');
  assert.equal(safePostUrl('javascript:alert(1)', hostile.id), '');
  assert.equal(safePostUrl('https://evil.example/status/1', hostile.id), '');
  assert.equal(safePostUrl('https://x.com/i/status/999', hostile.id), '');
  assert.equal(safePostUrl(hostile.url, hostile.id), hostile.url);
  assert.equal(safeImage('javascript:alert(1)'), '');
  assert.equal(safeImage('data:image/svg+xml,<svg></svg>'), '');
  assert.equal(safeImage('/images/bookmarks/../secret.svg'), '');
  assert.equal(safeImage('/images/bookmarks/sky.svg'), '/images/bookmarks/sky.svg');
});

test('the feed and the RSS escape hostile text and do not call X', () => {
  const collection = { ...data, items: [hostile] };
  const feed = buildFeed(collection, '2026-10-23');
  assert.match(feed.description, /untrusted display text/);
  assert.equal(feed.items[0].display.includes('<script>'), true);
  assert.equal(JSON.parse(JSON.stringify(feed)).items[0].display, feed.items[0].display);
  const rss = buildRss(collection, '2026-10-23');
  assert.equal(rss.includes('<script>'), false);
  assert.match(rss, /&lt;script&gt;/);
  assert.doesNotMatch(rss, /api\.x\.com|api\.twitter\.com|Bearer /);
  assert.deepEqual(Object.keys(skyIndex([hostile])), ['0']);
  assert.deepEqual(Object.keys(skyIndex([hostile])[0]).sort(), ['account', 'first_seen', 'id', 'theme']);
});

test('the sky changes with the day and with a new bookmark, and quiets when nothing is new', () => {
  const first = skyLayout(data.items, '2026-10-23');
  const nextDay = skyLayout(data.items, '2026-10-24');
  assert.equal(first.seed, daySeed('2026-10-23', data.items));
  assert.notEqual(first.seed, nextDay.seed);
  assert.notEqual(first.cards.map((card) => card.item.id).join(), nextDay.cards.map((card) => card.item.id).join());
  assert.equal(first.drift, 'resting');
  const grown = {
    ...data,
    items: [...data.items, { ...hostile, first_seen: '2026-10-23' }],
  };
  assert.equal(driftFor(grown.items, '2026-10-23'), 'awake');
  assert.notEqual(skyLayout(grown.items, '2026-10-23').seed, first.seed);
  const again = skyLayout(data.items, '2026-10-23');
  assert.deepEqual(again.cards.map((card) => [card.item.id, card.left, card.rotate]), first.cards.map((card) => [card.item.id, card.left, card.rotate]));
});

test('a daily append refuses a missing theme and skips a duplicate', () => {
  const missing = planAppend(data, [{ ...hostile, theme: '' }], '2026-10-24');
  assert.equal(missing.ok, false);
  assert.match(missing.errors[0], /Suggestion: /);
  assert.equal(missing.data.items.length, data.items.length);
  const badUrl = planAppend(data, [{ ...hostile, url: 'javascript:alert(1)' }], '2026-10-24');
  assert.equal(badUrl.ok, false);
  const added = planAppend(data, [hostile], '2026-10-23');
  assert.equal(added.ok, true);
  assert.deepEqual(added.added, ['mhoydich:2111111111111111111']);
  const twice = planAppend(added.data, [hostile], '2026-10-24');
  assert.equal(twice.ok, true);
  assert.deepEqual(twice.skipped, ['mhoydich:2111111111111111111']);
  assert.equal(twice.added.length, 0);
});

test('the page renders tweet text as text and the client does not parse it', () => {
  assert.match(card, /<p class="card__text">\{face\}<\/p>/);
  assert.doesNotMatch(card, /set:html/);
  assert.match(page, /set:html=\{indexJson\}/);
  assert.match(page, /id="bm-index"/);
  assert.match(page, /is:inline/);
  assert.doesNotMatch(client, /innerHTML|eval\(|new Function/);
  assert.match(client, /cloneNode\(true\)/);
  assert.match(readFileSync(new URL('../src/content/blocks/0764.json', import.meta.url), 'utf8'), /"id": "0764"/);
});
