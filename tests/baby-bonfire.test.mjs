// Baby Bonfire (/baby-bonfire/): the hub, twenty-one scenes and four workshop pages are static
// files under public/baby-bonfire/. These checks keep the JSON twin, the hub, the manifests and
// the area's content rules in step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const twin = JSON.parse(read('public/baby-bonfire.json'));
const hub = read('public/baby-bonfire/index.html');
const page = (slug) => read(`public/baby-bonfire/${slug}/index.html`);
const WORKSHOP = ['open-spec', 'open-mesh', 'barter-board', 'make-a-piece'];
const KITS = ['first-place'];
const all = [...twin.scenes.map((s) => s.slug), ...WORKSHOP, ...KITS];

test('the twin lists twenty-one scenes and four workshop pages, and every one is a file', () => {
  assert.equal(twin.scenes.length, 21);
  assert.deepEqual(twin.workshop.map((w) => w.slug), WORKSHOP);
  for (const slug of all) assert.ok(existsSync(new URL(`public/baby-bonfire/${slug}/index.html`, root)), slug);
  for (const entry of [...twin.scenes, ...twin.workshop]) assert.equal(entry.url, `https://pointcast.xyz/baby-bonfire/${entry.slug}/`);
  assert.deepEqual(twin.signals, ['landed', 'lifted', 'lit', 'snuffed']);
  assert.deepEqual([twin.licence.words, twin.licence.printables, twin.licence.chosen], ['CC-BY-4.0', 'CERN-OHL-P-2.0', '2026-11-12']);
  assert.ok(!twin.undecided.includes('licence'), 'the licence is no longer open');
  for (const file of ['LICENSE.txt', 'LICENSE-CC-BY-4.0.txt', 'first-place/files/LICENSE-CERN-OHL-P-2.0.txt']) assert.ok(existsSync(new URL(`public/baby-bonfire/${file}`, root)), file);
  assert.match(read('public/baby-bonfire/LICENSE-CC-BY-4.0.txt'), /^Creative Commons Attribution 4\.0 International/);
  assert.match(read('public/baby-bonfire/first-place/files/LICENSE-CERN-OHL-P-2.0.txt'), /^CERN Open Hardware Licence Version 2 - Permissive/);
  assert.match(read('public/baby-bonfire/LICENSE.txt'), /SPDX-License-Identifier: CERN-OHL-P-2\.0[\s\S]*SPDX-License-Identifier: CC-BY-4\.0/);
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
  for (const q of ['Dimensions.', 'The connector.', 'The radio.']) assert.ok(spec.includes(`<strong>${q}</strong>`), q);
  assert.match(spec, /<strong>The licence is chosen<\/strong> \(Nov 12, 2026\): CC BY 4\.0 for the spec and the words, CERN-OHL-P v2 for files to print/);
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

// Second pass, 2026-11-11: Mesh Street and The Roaming Shelf joined the street, and the
// precedents wall gained a shelf of PointCast's own earlier pages.
test('Mesh Street is on the street, linked from the mesh notes, and stays a report of fire', () => {
  const slugs = twin.scenes.map((s) => s.slug);
  assert.ok(slugs.includes('mesh-street'));
  const mesh = page('mesh-street');
  assert.ok(mesh.includes('<title>Baby Bonfire — Mesh Street</title>'));
  assert.match(mesh, /This is not a safety or emergency service/);
  assert.match(mesh, /Each owner decides whether their home is on or off/);
  assert.doesNotMatch(mesh, /ignite|light(s)? (a|the) (real )?flame/i);
  const notes = page('open-mesh');
  assert.ok(notes.includes('<a href="/baby-bonfire/mesh-street/">Mesh Street</a>'));
  assert.match(notes, /nothing in it has been picked or built/);
  assert.match(notes, /It never lights one/);
});

test('The Roaming Shelf: pieces move between places, and places sense presence only', () => {
  const slugs = twin.scenes.map((s) => s.slug);
  assert.equal(slugs.indexOf('pieces-roam'), slugs.indexOf('the-shelf') + 1, 'it sits next to the shelf it supersedes');
  const roam = page('pieces-roam');
  assert.match(roam, /Places sense presence and arrangement only:<\/b> which piece is on which spot\. No cameras, no microphones\./);
  assert.match(roam, /This page keeps nothing and sends nothing/);
  assert.match(roam, /nothing here lights a flame/);
  const places = roam.match(/var PLACES=\[([\s\S]*?)\n\];/)[1].match(/\['[a-z]\d'/g);
  const pieces = roam.match(/var PIECES=\[([\s\S]*?)\n\];/)[1].match(/\n \['[a-z]+'/g);
  assert.equal(places.length, 17);
  assert.equal(pieces.length, 8);
  assert.ok(roam.includes('seventeen places'));
  for (const rule of ['home', 'out', 'work', 'done', 'dinner', 'shrine']) assert.ok(roam.includes(`data-rule="${rule}"`), rule);
  // mouse and touch through pointer events, keyboard through Enter, Space, arrows and Escape
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'keydown']) assert.ok(roam.includes(`'${ev}'`), ev);
  assert.match(roam, /touch-action:none/);
  assert.match(roam, /tabindex:'0'/);
  assert.match(roam, /e\.key==='Escape'/);
  assert.match(roam, /aria-live="polite"/);
  assert.match(roam, /@media \(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(roam, /localStorage\.setItem\((?!k,)/, 'only the street marker is stored');
  // Mike's words are quoted and attributed, not written for him
  assert.match(roam, /&ldquo;all these pieces i move around my home it's part of the ritual&rdquo;<footer>Mike Hoydich, in chat\./);
  const shelf = page('the-shelf');
  assert.ok(shelf.includes('<a href="/baby-bonfire/pieces-roam/">The Roaming Shelf</a>'));
});

test('the Earlier on PointCast shelf links only to routes and blocks in this repo', () => {
  const wall = page('precedents');
  assert.ok(wall.includes('["pc","Earlier on PointCast",242]'));
  const own = [...wall.matchAll(/\{s:"pc",n:"([^"]+)",m:"PointCast",y:"[^"]*",(?:k:\[([^\]]*)\],)?\s*b:"[^"]+",u:"(\/[^"]*)"\}/g)];
  assert.equal(own.length, 14);
  assert.equal((wall.match(/\{s:"pc"/g) || []).length, own.length, 'every pc entry has a line and a path, and no invented "why"');
  for (const [, name, blocks, href] of own) {
    const route = href.replace(/\/$/, '');
    assert.ok(existsSync(new URL(`src/pages${route}.astro`, root)) || existsSync(new URL(`src/pages${route}/index.astro`, root)), `${name}: ${href}`);
    for (const id of (blocks || '').match(/\d{4}/g) || []) assert.ok(existsSync(new URL(`src/content/blocks/${id}.json`, root)), `${name}: block ${id}`);
  }
  const cited = own.flatMap((m) => (m[2] || '').match(/\d{4}/g) || []).sort();
  assert.deepEqual(cited, ['0421', '0423', '0426', '0429', '0471', '0473', '0508', '0525', '0584', '0628', '0652', '0719']);
});

test('the hub counts twenty-one windows', () => {
  assert.match(hub, /Twenty-one windows on one street/);
  assert.match(hub, /' of twenty-one windows lit'/);
  assert.ok(hub.includes("'Nineteen','Twenty','Twenty-one']"));
  assert.equal((hub.match(/class="house" href=/g) || []).length, 21);
  assert.doesNotMatch(hub, /(fifteen|thirteen) (windows|concept sketches)/i);
});

// Third pass, 2026-11-11: six finished scenes joined the street. Each went through an editorial
// pass first; these checks hold the lines that pass depended on.
const THIRD = {
  'the-helper': 'Baby Bonfire — The Helper',
  'home-press': 'Baby Bonfire — The Home Press',
  'house-power': 'Baby Bonfire — House Power',
  'the-table': 'Baby Bonfire — The Table',
  creatures: 'Baby Bonfire — Creatures',
  'four-seasons': 'Baby Bonfire — Four Seasons',
};

test('third pass: six scenes are on the street, wrapped like the others, and listed for machines', () => {
  const slugs = twin.scenes.map((s) => s.slug);
  const sitemap = read('src/pages/sitemap-discovery.xml.ts');
  const llms = read('public/llms.txt');
  const full = read('public/llms-full.txt');
  for (const [slug, title] of Object.entries(THIRD)) {
    assert.ok(slugs.includes(slug), slug);
    const html = page(slug);
    assert.ok(html.includes(`<title>${title}</title>`), `${slug} title`);
    assert.ok(html.includes('<footer>Baby Bonfire · concept sketch · Nov 2026</footer>'), `${slug} footer`);
    assert.match(html, /<meta name="description" content="[^"]+ Nothing is for sale\.">/, `${slug} description`);
    assert.ok(html.includes(`<meta property="og:url" content="https://pointcast.xyz/baby-bonfire/${slug}/">`), `${slug} og:url`);
    assert.ok(html.trimEnd().endsWith('</html>'), `${slug} is whole`);
    assert.ok(sitemap.includes(`'https://pointcast.xyz/baby-bonfire/${slug}/'`), `${slug} sitemap`);
    assert.ok(llms.includes(`https://pointcast.xyz/baby-bonfire/${slug}/`), `${slug} llms.txt`);
    assert.ok(full.includes(`https://pointcast.xyz/baby-bonfire/${slug}/`), `${slug} llms-full.txt`);
    // sound is made in the page and nothing is kept except the street marker
    assert.doesNotMatch(html, /<audio\b|<video\b|new Audio\(/, `${slug} loads no media`);
    assert.doesNotMatch(html, /localStorage\.setItem\((?!k,)|sessionStorage|document\.cookie|indexedDB/, `${slug} stores only the street marker`);
    assert.doesNotMatch(html, /[€£]\s?\d|\$\s?\d(?!_o)|\bUSD\b|\bprice[ds]?\b|subscri/i, `${slug} sells nothing`);
    for (const m of html.matchAll(/for sale/g)) assert.match(html.slice(Math.max(0, m.index - 24), m.index), /[Nn]othing (here )?is $/, `${slug} only says nothing is for sale`);
  }
  assert.match(llms, /twenty-one concept sketches/);
  assert.match(full, /a dusk street of twenty-one windows/);
});

test('third pass: no flame is lit for anyone, and no made object is called safe', () => {
  const helper = page('the-helper');
  assert.match(helper, /It never lights one, and nothing in the house can\. A person strikes the match\./);
  assert.match(helper, /It is not a safety device\./);
  assert.match(helper, /Nobody should leave a flame for it\./);
  assert.match(helper, /It has no camera, no microphone and no voice/);
  assert.match(helper, /These are this sketch's assumptions about a helper the size of a teapot\. None of it is built\./);
  const power = page('house-power');
  assert.match(power, /nothing in this house can light a flame for you/);
  assert.match(power, /Nothing here can light a flame for you\./);
  const seasons = page('four-seasons');
  assert.match(seasons, /The mantel place only notices a flame someone lit by hand; nothing lights one remotely\./);
  assert.match(seasons, /Nothing here is for sale and nothing ships\./);
  assert.match(seasons, /the temperatures and the nights with a flame are illustrative/);
  const creatures = page('creatures');
  assert.match(creatures, /No cameras, no microphones\./);
  assert.match(creatures, /a covered flame, a stable base, never left alone with animals around/);
  const press = page('home-press');
  assert.match(press, /Food-safe is the cook\\'s job\. The press cannot promise it\./);
  assert.match(press, /It is unlit, and it stays unlit\./);
  assert.match(press, /Keep it unlit\. Lighting it needs a tested design and a maker who runs burn tests\./);
  assert.match(press, /Whether it may ever hold food or drink is a potter's call on glaze and firing\. This recipe does not settle it\./);
  assert.doesNotMatch(press, /Glaze and fire again if it will hold food or drink/);
  assert.match(press, /Nothing is uploaded, and nothing is for sale\./);
  for (const slug of Object.keys(THIRD)) {
    assert.doesNotMatch(page(slug), /flame-safe|fire-safe|fireproof|flameproof|heals?\b|therap|wellness|reduces? (stress|anxiety)|improves? (sleep|mood|health)|light(s|ing)? (it|a flame|the hearth) (remotely|from (afar|away|your phone))/i, `${slug} makes no safety or health claim`);
  }
});

test('third pass: the two sourced scenes keep their drawers, and brand names stay inside them', () => {
  const press = page('home-press');
  const list = press.match(/const SOURCES=\[([\s\S]*?)\n\];/)[1];
  assert.equal((list.match(/\n \['[^']+','https:\/\/[^']+','Used for [^\n]+'\]/g) || []).length, 5);
  assert.match(press, /Five pages ground the station notes, as read Nov 11, 2026\./);
  assert.match(press, /Every line without a marker is this sketch's own assumption, and the wax station has no opened source at all\./);
  assert.match(press, /<p class="assume">This sketch's assumptions<\/p>/);
  assert.match(press, /Lines without a marker are guesses\./);
  const power = page('house-power');
  const drawer = power.match(/<ul class="src">([\s\S]*?)<\/ul>/)[1];
  assert.equal((drawer.match(/<a href="https:\/\/[^"]+" target="_blank" rel="noopener">[^<]+<\/a> · as read Nov 11, 2026<\/span>/g) || []).length, 7);
  assert.match(power, /7 sources opened · as read Nov 11, 2026/);
  assert.match(power, /<h3>Illustrative, not sourced<\/h3>/);
  assert.equal((power.match(/<ul class="ill">([\s\S]*?)<\/ul>/)[1].match(/<li>/g) || []).length, 8);
  assert.match(power, /marked illustrative where none was/);
  assert.doesNotMatch(power, /at its real size/);
  for (const k of ['sourced', 'mixed', 'illustrative']) assert.ok(power.includes(`${k}:'`), `${k} tag`);
  const brands = /cricut|cerambot|eazao|cocoa press|hackaday|makezine|3dprint|powerfilm|mdpi|de gruyter|cnx software|open electronics|design society|southampton/i;
  assert.equal(press.replace(list, '').match(brands), null, 'home press names sources only in its drawer');
  assert.equal(power.replace(drawer, '').match(brands), null, 'house power names sources only in its drawer');
  for (const slug of ['the-helper', 'the-table', 'creatures', 'four-seasons']) {
    assert.doesNotMatch(page(slug), /<a\b[^>]+href="https?:/, `${slug} links nowhere outside`);
    assert.equal(page(slug).match(brands), null, slug);
  }
});

test('third pass: make a piece points at the Home Press, and the ledger block has the real count', () => {
  const make = page('make-a-piece');
  assert.ok(make.includes('<a href="/baby-bonfire/home-press/">The Home Press</a>'));
  assert.match(make, /like the twenty-one on the street/);
  assert.match(make, /nothing in it has been built/);
  const block = JSON.parse(read('src/content/blocks/0782.json'));
  assert.match(block.dek, /Twenty-one concept sketches on one dusk street/);
  assert.match(block.body, /opens one of twenty-one sketches/);
  assert.equal(block.companions[0].label, 'The street: twenty-one sketches');
  assert.doesNotMatch(JSON.stringify(block), /thirteen|fifteen/i);
});

// First place kit, 2026-11-11: the first printable place. The files are written by
// scripts/baby-bonfire/first-place.mjs from one params.json; these checks read the files
// themselves, so a hand-edited STL or a stale page fails here.
const kitDir = 'public/baby-bonfire/first-place';
const readStl = (file) => {
  const buf = readFileSync(new URL(`${kitDir}/files/${file}`, root));
  const count = buf.readUInt32LE(80);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const edges = new Map();
  for (let t = 0; t < count; t++) {
    const keys = [];
    for (let v = 0; v < 3; v++) {
      const o = 84 + t * 50 + 12 + v * 12;
      const p = [buf.readFloatLE(o), buf.readFloatLE(o + 4), buf.readFloatLE(o + 8)];
      p.forEach((n, i) => { if (n < min[i]) min[i] = n; if (n > max[i]) max[i] = n; });
      keys.push(p.join(','));
    }
    for (let v = 0; v < 3; v++) { const k = `${keys[v]}>${keys[(v + 1) % 3]}`; edges.set(k, (edges.get(k) || 0) + 1); }
  }
  let open = 0;
  for (const [k, n] of edges) { const [a, b] = k.split('>'); if (n !== 1 || edges.get(`${b}>${a}`) !== 1) open++; }
  return { buf, count, open, size: max.map((n, i) => Math.round((n - min[i]) * 1000) / 1000), floor: min[2] };
};

test('first place: the page and its files exist, and the twin lists them', () => {
  const kit = twin.kits.find((k) => k.slug === 'first-place');
  assert.equal(kit.url, 'https://pointcast.xyz/baby-bonfire/first-place/');
  assert.match(kit.status, /proposal, not yet printed/);
  assert.ok(existsSync(new URL(`${kitDir}/index.html`, root)));
  for (const f of ['place-tile.stl', 'puck-blank.stl', 'puck-shell.stl', 'puck-lid.stl', 'params.json', 'manifest.json']) assert.ok(existsSync(new URL(`${kitDir}/files/${f}`, root)), f);
  assert.deepEqual(kit.files, ['place-tile', 'puck-blank', 'puck-shell', 'puck-lid'].map((n) => `https://pointcast.xyz/baby-bonfire/first-place/files/${n}.stl`));
  for (const slug of ['make-a-piece', 'open-spec']) assert.ok(page(slug).includes('href="/baby-bonfire/first-place/"'), `${slug} links to it`);
  assert.ok(read('src/pages/sitemap-discovery.xml.ts').includes("'https://pointcast.xyz/baby-bonfire/first-place/'"));
  for (const f of ['public/llms.txt', 'public/llms-full.txt']) assert.ok(read(f).includes('https://pointcast.xyz/baby-bonfire/first-place/'), f);
});

test('first place: each STL parses, is closed, and matches params.json and the manifest', () => {
  const p = JSON.parse(read(`${kitDir}/files/params.json`));
  const manifest = JSON.parse(read(`${kitDir}/files/manifest.json`));
  const want = {
    'place-tile.stl': [p.tile.size, p.tile.size, p.tile.bodyHeight + p.feet.height],
    'puck-blank.stl': [p.puck.diameter, p.puck.diameter, p.puck.blankHeight],
    'puck-shell.stl': [p.puck.diameter, p.puck.diameter, p.shell.height],
    'puck-lid.stl': [p.puck.diameter, p.puck.diameter, p.lid.thickness + p.lid.lipHeight],
  };
  assert.deepEqual(manifest.files.map((f) => f.file), Object.keys(want));
  const data = JSON.parse(page('first-place').match(/<script type="application\/json" id="kit-data">([\s\S]*?)<\/script>/)[1]);
  for (const f of manifest.files) {
    const stl = readStl(f.file);
    assert.ok(!stl.buf.subarray(0, 5).toString('ascii').toLowerCase().startsWith('solid'), `${f.file} is binary`);
    assert.equal(stl.buf.length, 84 + 50 * stl.count, `${f.file} length matches its header`);
    assert.ok(stl.buf.length < 1_000_000, `${f.file} under 1 MB`);
    assert.equal(stl.count, f.triangles, `${f.file} triangle count`);
    assert.equal(stl.open, 0, `${f.file} is watertight`);
    assert.deepEqual(stl.size, want[f.file].map((n) => Math.round(n * 1000) / 1000), `${f.file} bounding box`);
    assert.deepEqual(f.size, stl.size);
    assert.equal(stl.floor, 0, `${f.file} sits on z = 0`);
    assert.equal(data.parts[f.id].f.length / 3, f.triangles, `${f.id}: the drawing uses the same triangles`);
  }
  assert.ok(manifest.thinnestWall.mm >= 1.2);
});

test('first place: committed files are what the generator writes', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('scripts/baby-bonfire/first-place.mjs', root)), '--check'], { stdio: 'pipe' });
});

test('first place: the plain box, the labels and the licence note', () => {
  const html = page('first-place');
  const box = html.slice(html.indexOf('id="plain"'), html.indexOf('</header>'));
  assert.ok(html.indexOf('id="plain"') < html.indexOf('<main>'), 'the box is in the header');
  assert.match(box, /Nobody has printed or built this yet/);
  assert.match(box, /first draft for makers to try and correct/);
  assert.match(box, /This place holds no flame/);
  assert.match(box, /away from candles, stoves and anything hot/);
  assert.match(box, /63&nbsp;°C[\s\S]*84&nbsp;°C/);
  assert.match(box, /Not a product\. Nothing is for sale\./);
  assert.match(box, /No health claims/);
  assert.match(html, /v0\.1 proposal/);
  assert.match(html, /<text class="warn"[^>]*>UNTESTED SKETCH<\/text>/);
  assert.match(html, /Licence:<\/strong> the files to print and the script that writes them are under <a href="\/baby-bonfire\/first-place\/files\/LICENSE-CERN-OHL-P-2\.0\.txt">CERN-OHL-P v2<\/a>; the words and drawings are under <a href="\/baby-bonfire\/LICENSE-CC-BY-4\.0\.txt">CC BY 4\.0<\/a>/);
  assert.doesNotMatch(html, /[$€£]\s?\d|\bUSD\b/, 'no prices');
  assert.doesNotMatch(html, /Sense<\/a>/, 'the board with a microphone is not linked as a part');
  assert.ok(html.includes('mailto:hello@pointcast.xyz?subject=Baby%20Bonfire') && html.includes('https://github.com/mhoydich/pointcast/issues'));
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'keydown']) assert.ok(html.includes(`'${ev}'`), ev);
  assert.doesNotMatch(html, /localStorage|sessionStorage|document\.cookie/, 'the page stores nothing');
});
