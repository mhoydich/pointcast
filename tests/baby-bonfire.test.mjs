// Baby Bonfire (/baby-bonfire/): the hub, thirteen scenes and four workshop pages are static
// files under public/baby-bonfire/. These checks keep the JSON twin, the hub, the manifests and
// the area's content rules in step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const twin = JSON.parse(read('public/baby-bonfire.json'));
const hub = read('public/baby-bonfire/index.html');
const page = (slug) => read(`public/baby-bonfire/${slug}/index.html`);
const WORKSHOP = ['open-spec', 'open-mesh', 'barter-board', 'make-a-piece'];
const all = [...twin.scenes.map((s) => s.slug), ...WORKSHOP];

test('the twin lists thirteen scenes and four workshop pages, and every one is a file', () => {
  assert.equal(twin.scenes.length, 13);
  assert.deepEqual(twin.workshop.map((w) => w.slug), WORKSHOP);
  for (const slug of all) assert.ok(existsSync(new URL(`public/baby-bonfire/${slug}/index.html`, root)), slug);
  for (const entry of [...twin.scenes, ...twin.workshop]) assert.equal(entry.url, `https://pointcast.xyz/baby-bonfire/${entry.slug}/`);
  assert.deepEqual(twin.signals, ['landed', 'lifted', 'lit', 'snuffed']);
  assert.equal(twin.licence, 'Not chosen yet.');
  assert.ok(!existsSync(new URL('public/baby-bonfire/LICENSE', root)), 'no licence file until one is chosen');
});

test('the street has one window per scene, in the twin order, and links the workshop', () => {
  const windows = [...hub.matchAll(/class="house" href="\/baby-bonfire\/([a-z-]+)\/" data-scene="([a-z-]+)"/g)];
  assert.deepEqual(windows.map((m) => m[1]), twin.scenes.map((s) => s.slug));
  for (const m of windows) assert.equal(m[1], m[2]);
  const slugs = JSON.parse(hub.match(/SLUGS=(\[[^\]]+\])/)[1]);
  assert.deepEqual(slugs, twin.scenes.map((s) => s.slug));
  for (const slug of WORKSHOP) assert.ok(hub.includes(`href="/baby-bonfire/${slug}/"`), slug);
});

test('the hub says what this is near the top', () => {
  const top = hub.slice(hub.indexOf('<header>'), hub.indexOf('</header>'));
  assert.match(top, /open exploration, started Nov 11, 2026/);
  assert.match(top, /concept sketches/);
  assert.match(top, /nothing is for sale/);
  assert.match(top, /Do not burn anything indoors on the strength of these pages/);
});

test('lit windows are kept with try/catch and an in-memory fallback', () => {
  assert.match(hub, /try\{a=JSON\.parse\(localStorage\.getItem\(KEY\)/);
  assert.match(hub, /try\{localStorage\.setItem\(KEY/);
  assert.match(hub, /mem=a\.slice\(\)/);
  for (const s of twin.scenes) {
    const html = page(s.slug);
    assert.ok(html.includes('<a class="bb-back" href="/baby-bonfire/">'), `${s.slug} back link`);
    assert.ok(html.includes(`a.push('${s.slug}')`), `${s.slug} marks its own window`);
    const marker = html.slice(html.lastIndexOf("try{var k='bb-street-v1'"), html.lastIndexOf('</body>'));
    assert.ok(marker.startsWith('try{') && marker.includes('}catch(e){}'), `${s.slug} marker is guarded`);
  }
});

test('every page is self-contained: no outside requests, canonical set', () => {
  for (const slug of ['', ...all]) {
    const html = slug ? page(slug) : hub;
    assert.ok(html.includes(`<link rel="canonical" href="https://pointcast.xyz/baby-bonfire/${slug ? `${slug}/` : ''}">`), `${slug || 'hub'} canonical`);
    assert.doesNotMatch(html, /<script[^>]+src=/i, `${slug || 'hub'} loads no script file`);
    assert.doesNotMatch(html, /<img\b|<iframe\b|@import|fetch\(|XMLHttpRequest|sendBeacon|WebSocket|getUserMedia/, `${slug || 'hub'} makes no requests`);
    for (const m of html.matchAll(/<link[^>]+href="([^"]+)"/g)) {
      assert.ok(m[1] === '/favicon.svg' || m[1].startsWith('/baby-bonfire') || m[1].startsWith('https://pointcast.xyz/baby-bonfire'), `${slug || 'hub'} link ${m[1]}`);
    }
    assert.doesNotMatch(html, /url\(\s*['"]?https?:/i, `${slug || 'hub'} has no remote css url`);
  }
});

test('content rules: nothing the area promised to leave out', () => {
  const banned = /good ?feels|cannabis|\bhemp\b|\bthc\b|nintendo|playstation|xbox|\bsega\b|safety[- ]tested|buy now|pre-?order|add to cart/i;
  for (const slug of ['', ...all]) {
    const html = slug ? page(slug) : hub;
    const hit = html.match(banned);
    assert.equal(hit, null, `${slug || 'hub'}: ${hit && hit[0]}`);
  }
  assert.equal(JSON.stringify(twin).match(banned), null);
  for (const slug of ['ha-research', 'ha-creative']) assert.ok(!existsSync(new URL(`public/baby-bonfire/${slug}`, root)), `${slug} stays internal`);
});

test('the spec keeps to four signals and lists its open questions without inventing answers', () => {
  const spec = page('open-spec');
  for (const s of ['Landed', 'Lifted', 'Lit', 'Snuffed']) assert.ok(spec.includes(`<b>${s}</b>`), s);
  assert.equal((spec.match(/<ul class="sig">[\s\S]*?<\/ul>/)[0].match(/<li>/g) || []).length, 4);
  for (const q of ['Dimensions.', 'The connector.', 'The radio.', 'The licence.']) assert.ok(spec.includes(`<strong>${q}</strong>`), q);
  assert.match(spec, /This is a draft and it is open to change/);
  assert.doesNotMatch(spec, /\b\d+(\.\d+)?\s?(mm|cm|inch|in\b|GHz|MHz)|Bluetooth|Zigbee|Thread\b|Matter\b|LoRa|Wi-?Fi|NFC|RFID/i, 'no hardware specifics in v0');
  assert.match(spec, /never ignited remotely/);
});

test('the barter board is examples only, with no prices', () => {
  const board = page('barter-board');
  const cards = (board.match(/<li class="card">/g) || []).length;
  assert.ok(cards >= 9);
  assert.equal((board.match(/<span class="ex">Example<\/span>/g) || []).length, cards, 'every card is labelled an example');
  assert.doesNotMatch(board, /[$€£]\s?\d|\bUSD\b|\btez\b/i);
  assert.match(board, /No payments and no prices/);
});

test('the area is registered: manifest, sitemap, new-today, llms and a sourced block', () => {
  const surfaces = read('src/data/agent-surfaces.ts');
  assert.ok(surfaces.includes("babyBonfire: 'https://pointcast.xyz/baby-bonfire/'"));
  assert.ok(surfaces.includes("babyBonfire: 'https://pointcast.xyz/baby-bonfire.json'"));
  const sitemap = read('src/pages/sitemap-discovery.xml.ts');
  for (const slug of all) assert.ok(sitemap.includes(`'https://pointcast.xyz/baby-bonfire/${slug}/'`), slug);
  assert.ok(read('public/llms.txt').includes('https://pointcast.xyz/baby-bonfire/'));
  assert.ok(read('public/llms-full.txt').includes('https://pointcast.xyz/baby-bonfire.json'));
  const block = JSON.parse(read('src/content/blocks/0782.json'));
  assert.equal(block.author, 'cc');
  assert.ok(block.source && block.source.includes('November 11, 2026'));
  assert.equal(block.external.url, 'https://pointcast.xyz/baby-bonfire/');
  assert.equal(twin.block, 'https://pointcast.xyz/b/0782');
});

test('earlier-work links on the hub point at rooms that exist', () => {
  const strip = hub.slice(hub.indexOf('id="earlier-h"'), hub.indexOf('<footer>'));
  const links = [...strip.matchAll(/href="(\/[^"]+)"/g)].map((m) => m[1].replace(/\/$/, ''));
  assert.ok(links.length >= 6);
  for (const href of links) assert.ok(existsSync(new URL(`src/pages${href}.astro`, root)), href);
});
