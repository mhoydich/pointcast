// Unfurl cards for Baby Bonfire, Coast Commons and House Channel: a static 1200x630 card.png
// beside each page, drawn by scripts/unfurl-cards/build.mjs, and the tags that point at it.
// These checks keep the pages, the PNGs and the card list in step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { CARDS, DESCRIPTION_MAX, H, STATUS, TITLE_MAX, W, cardFor, cardUrl, pngFile, pngSize, scenesWithoutCard, shareHead, stale, stampHead } from '../scripts/unfurl-cards/cards.mjs';
import { cardSvg, hillRows } from '../scripts/unfurl-cards/draw.mjs';
import { versionedImageUrl } from '../src/lib/og-version.mjs';
import { normalizeGeneratedSeo } from '../src/lib/seo-build.mjs';
import { planUnfurl } from '../src/lib/unfurl/plan.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const head = (card) => { const html = read(`public${card.path}index.html`); return html.slice(0, html.indexOf('</head>')); };
const tags = (h, attr, name) => [...h.matchAll(new RegExp(`<meta ${attr}="${name}" content="([^"]*)">`, 'g'))].map((m) => m[1]);
const one = (h, attr, name, where) => { const all = tags(h, attr, name); assert.equal(all.length, 1, `${where}: exactly one ${name}`); return all[0]; };
const plain = (s) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const street = JSON.parse(read('public/baby-bonfire.json')).scenes.map((s) => s.slug);
// The scenes with a card, in street order: fifteen first (2026-11-11), then the six of the
// third pass the same day.
const SCENES = ['light-the-hearth', 'the-shelf', 'pieces-roam', 'the-rounds', 'the-helper', 'any-object', 'home-press', 'paired-hearths', 'mesh-street', 'house-power', 'stations', 'the-table', 'weather-in-the-house', 'creatures', 'four-seasons', 'five-levels', 'seven-homes', 'cabinet-of-no-bounds', 'ritual-atlas', 'anchors-and-open-time', 'precedents'];

test('every page that was asked for has a card: the hubs, the street\'s scenes, the studies', () => {
  const want = [
    '/baby-bonfire/', ...SCENES.map((s) => `/baby-bonfire/${s}/`),
    ...['open-spec', 'open-mesh', 'barter-board', 'make-a-piece', 'first-place', 'prayer', 'higher-purpose'].map((s) => `/baby-bonfire/${s}/`),
    '/coast-commons/', '/coast-commons/el-segundo/', '/coast-commons/pattern/', '/coast-commons/sb-surf-house/', '/coast-commons/fresh-milk/',
    ...['malibu', 'santa-monica', 'venice', 'marina-del-rey', 'playa-del-rey', 'manhattan-beach', 'hermosa-beach', 'redondo-beach', 'torrance', 'palos-verdes-estates', 'rancho-palos-verdes', 'san-pedro', 'long-beach', 'seal-beach'].map((s) => `/coast-commons/${s}/`),
    '/house/', '/house/about/',
  ];
  assert.deepEqual(CARDS.map((c) => c.path), want);
  assert.equal(new Set(CARDS.map((c) => c.path)).size, CARDS.length);
  for (const slug of SCENES) assert.ok(street.includes(slug), `${slug} is still on the street`);
  assert.equal(cardFor('/coast-commons/nowhere/'), null, 'pages without a card keep the request-time card');
  assert.ok(!cardFor('/house/r/'), 'the remote is noindex and has no card');
});

test('the street can grow: a new scene waits for its card, and the hub card draws any number of houses', () => {
  // A scene added to the street is reported, not failed: it keeps the request-time card until it has a row.
  assert.deepEqual(scenesWithoutCard(), street.filter((slug) => !SCENES.includes(slug)));
  assert.deepEqual(hillRows(15), [4, 5, 6]);
  assert.deepEqual(hillRows(16), [4, 6, 6]);
  assert.deepEqual(hillRows(21), [4, 5, 6, 6]);
  for (let count = 1; count <= 40; count += 1) {
    const rows = hillRows(count);
    assert.equal(rows.reduce((a, b) => a + b, 0), count, `${count} houses`);
    assert.ok(rows.every((size) => size >= 1 && size <= 6), `${count} houses: ${rows}`);
  }
  const hubCard = cardFor('/baby-bonfire/');
  assert.doesNotMatch([...hubCard.line, hubCard.description, hubCard.alt].join(' '), /thirteen|fifteen|twenty|\d/i, 'the hub card names no count');
});

test('each card is a 1200x630 PNG beside its page', () => {
  for (const card of CARDS) {
    assert.equal(pngFile(card), `public${card.path}card.png`);
    assert.ok(existsSync(new URL(pngFile(card), root)), `${pngFile(card)} exists`);
    assert.deepEqual(pngSize(fileURLToPath(new URL(pngFile(card), root))), { width: W, height: H }, pngFile(card));
  }
  assert.deepEqual([W, H], [1200, 630]);
});

test('each page carries the image and Twitter tags, once each, pointing at its own card', () => {
  for (const card of CARDS) {
    const h = head(card);
    const p = card.path;
    const image = one(h, 'property', 'og:image', p);
    assert.match(image, new RegExp(`^https://pointcast\\.xyz${p}card\\.png\\?v=[0-9a-f]{10}$`), `${p} og:image is absolute and versioned`);
    assert.equal(one(h, 'property', 'og:image:width', p), '1200');
    assert.equal(one(h, 'property', 'og:image:height', p), '630');
    assert.equal(one(h, 'property', 'og:image:type', p), 'image/png');
    assert.equal(plain(one(h, 'property', 'og:image:alt', p)), card.alt);
    assert.equal(one(h, 'name', 'twitter:card', p), 'summary_large_image');
    assert.equal(one(h, 'name', 'twitter:image', p), image);
    assert.equal(one(h, 'name', 'twitter:image:alt', p), one(h, 'property', 'og:image:alt', p));
    assert.equal(one(h, 'name', 'twitter:title', p), one(h, 'property', 'og:title', p), `${p} titles agree`);
    assert.equal(one(h, 'name', 'twitter:description', p), one(h, 'property', 'og:description', p), `${p} descriptions agree`);
    assert.equal(one(h, 'property', 'og:url', p), `https://pointcast.xyz${p}`);
    assert.equal(one(h, 'property', 'og:type', p), 'website');
  }
});

test('titles stay within 60 characters and descriptions within 160', () => {
  assert.deepEqual([TITLE_MAX, DESCRIPTION_MAX], [60, 160]);
  for (const card of CARDS) {
    const h = head(card);
    const title = plain(one(h, 'name', 'twitter:title', card.path));
    const description = plain(one(h, 'name', 'twitter:description', card.path));
    assert.ok(title.length > 0 && title.length <= TITLE_MAX, `${card.path} title is ${title.length}`);
    assert.ok(description.length >= 50 && description.length <= DESCRIPTION_MAX, `${card.path} description is ${description.length}`);
    assert.ok(card.alt.length >= 40 && card.alt.length <= 220, `${card.path} alt is ${card.alt.length}`);
  }
});

test('the URL carries a hash of the PNG, the same one the layouts use, so new pixels get a new URL', () => {
  for (const card of CARDS) {
    const bytes = readFileSync(new URL(pngFile(card), root));
    const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 10);
    assert.equal(cardUrl(card), `https://pointcast.xyz${card.path}card.png?v=${hash}`);
    assert.equal(cardUrl(card), versionedImageUrl(`${card.path}card.png`, 'https://pointcast.xyz', fileURLToPath(new URL('public', root))));
  }
});

test('pages and PNGs are in step with the card list, and the generator agrees', () => {
  assert.deepEqual(stale(), []);
  execFileSync(process.execPath, [fileURLToPath(new URL('scripts/unfurl-cards/build.mjs', root)), '--check'], { stdio: 'pipe' });
});

test('the build\'s SEO pass keeps each card instead of falling back to the generic image', () => {
  // astro.config.mjs runs normalizeGeneratedSeo over every built page. It drops og:image and
  // twitter:image, and writes the fallback, unless a page has exactly one og:image whose file exists.
  const dist = mkdtempSync(path.join(tmpdir(), 'pc-cards-dist-'));
  for (const card of CARDS) {
    mkdirSync(path.join(dist, card.path), { recursive: true });
    cpSync(new URL(`public${card.path}index.html`, root), path.join(dist, card.path, 'index.html'));
  }
  normalizeGeneratedSeo(dist, {});
  for (const card of CARDS) {
    const built = readFileSync(path.join(dist, card.path, 'index.html'), 'utf8');
    const h = built.slice(0, built.indexOf('</head>'));
    assert.equal(one(h, 'property', 'og:image', card.path), cardUrl(card));
    assert.equal(one(h, 'name', 'twitter:image', card.path), cardUrl(card));
    assert.equal(one(h, 'name', 'twitter:card', card.path), 'summary_large_image');
    assert.equal(plain(one(h, 'property', 'og:image:alt', card.path)), card.alt);
    assert.doesNotMatch(h, /og-home-v\d/, `${card.path} keeps its own card`);
  }
});

test('the request-time unfurl leaves a page with its own card alone', () => {
  for (const card of CARDS) {
    assert.deepEqual(planUnfurl({ pathname: card.path, currentImage: cardUrl(card) }), { image: '', headHtml: '' }, card.path);
  }
  assert.doesNotMatch(read('public/_headers'), /card\.png/, 'no _headers rule for the cards');
});

test('the words on a card: a short headline, one line of what to do, small type per area', () => {
  const banned = /good ?feels|cannabis|\bhemp\b|\bthc\b|hoydich|enterprises|nintendo|playstation|xbox|airbnb|zillow|buy now|invest/i;
  for (const card of CARDS) {
    assert.ok(card.headline.length >= 1 && card.headline.length <= 2, `${card.path} headline rows`);
    assert.ok(card.headline.join(' ').length <= 26, `${card.path} headline is short`);
    assert.ok(card.line.length >= 1 && card.line.length <= 2, `${card.path} line rows`);
    for (const row of card.line) assert.ok(row.length <= 36, `${card.path}: "${row}" is ${row.length} characters`);
    // The one photograph card (Prayer Fire) says two short sentences; every other card says one.
    assert.match(card.line.join(' '), card.motif === 'photo' ? /^[A-Z][^.]*\. [A-Z][^.]*\.$/ : /^[A-Z][^.]*\.$/, `${card.path} line is one sentence`);
    const words = [card.kicker, ...card.headline, ...card.line, card.alt, STATUS[card.area]].join(' ');
    assert.equal(words.match(banned), null, `${card.path}: ${words.match(banned)}`);
  }
  assert.equal(STATUS['coast-commons'], 'a study, not an offer');
  for (const card of CARDS.filter((c) => c.area === 'coast-commons')) assert.match(card.alt, /not an offer/i, `${card.path} alt`);
  // Mesh Street reports fire and never starts one (tests/baby-bonfire.test.mjs holds the page to that).
  assert.doesNotMatch(JSON.stringify(cardFor('/baby-bonfire/mesh-street/')), /ignite|light(s)? (a|the) (real )?flame/i);
});

test('every card draws as a 1200x630 SVG from the pages’ own drawings', () => {
  // Widths here are a rough guess; build.mjs measures the real type before it writes a PNG.
  const measure = (line) => line.text.length * line.size * 0.56;
  for (const card of CARDS) {
    const { svg, lines } = cardSvg(card, measure);
    const image = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
    assert.deepEqual([image.width, image.height], [W, H], card.path);
    assert.ok(lines.some((l) => l.text === 'pointcast.xyz'), `${card.path} carries the site mark`);
    assert.ok(lines.some((l) => l.text === (card.motif === 'photo' ? 'concept sketch' : STATUS[card.area])), `${card.path} carries its small type`);
    // Nothing loads from outside. The photograph card embeds its page's own poster as a data URI.
    const outside = card.motif === 'photo' ? svg.replace(/(?:xlink:)?href="data:image\/jpeg;base64,[^"]*"/g, '') : svg;
    assert.doesNotMatch(outside, /<image\b[^>]*href=|(?<!<image)\shref=|@font-face|url\(\s*['"]?https?:/i, `${card.path} loads nothing`);
  }
});

test('stamping a hand-written page adds the tags after og:type and changes nothing the second time', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pc-cards-'));
  mkdirSync(path.join(dir, 'house'), { recursive: true });
  writeFileSync(path.join(dir, 'house/card.png'), 'one');
  const card = cardFor('/house/');
  const page = '<html>\n<head>\n<title>T</title>\n<meta property="og:title" content="House Channel">\n<meta property="og:description" content="The TV as the hearth.">\n<meta property="og:url" content="https://pointcast.xyz/house/">\n<meta property="og:type" content="website">\n<meta property="og:image" content="https://pointcast.xyz/og/page.png?p=%2Fhouse">\n<meta name="twitter:card" content="summary">\n<meta name="theme-color" content="#000000">\n</head>\n<body><meta name="twitter:card" content="left alone"></body>\n</html>\n';
  const once = stampHead(page, card, dir);
  assert.equal(stampHead(once, card, dir), once);
  const lines = once.split('\n');
  assert.equal(lines[lines.indexOf('<meta property="og:type" content="website">') + 1], `<meta property="og:image" content="${cardUrl(card, dir)}">`);
  assert.equal((once.match(/property="og:image"/g) || []).length, 1, 'the old image tag is replaced');
  assert.ok(once.includes('<meta name="twitter:title" content="House Channel">'));
  assert.ok(once.includes('<body><meta name="twitter:card" content="left alone"></body>'), 'the body is not touched');
  writeFileSync(path.join(dir, 'house/card.png'), 'two');
  assert.notEqual(stampHead(page, card, dir), once, 'new pixels, new URL');
  assert.throws(() => stampHead(page.replace('The TV as the hearth.', 'x'.repeat(161)), card, dir), /over 160/);
  // The generators' helper writes the same block, with the card's shorter words where it has them.
  const hub = cardFor('/coast-commons/');
  mkdirSync(path.join(dir, 'coast-commons'), { recursive: true });
  writeFileSync(path.join(dir, 'coast-commons/card.png'), 'three');
  const block = shareHead('/coast-commons/', 'A longer page title that only the browser tab shows, not the preview', 'Page description.', dir);
  assert.ok(block.startsWith(`<meta property="og:title" content="${hub.title}">`));
  assert.ok(block.includes(`<meta name="twitter:image" content="${cardUrl(hub, dir)}">`));
  assert.equal(shareHead('/coast-commons/nowhere/', 'Nowhere', 'x', dir), null);
});
