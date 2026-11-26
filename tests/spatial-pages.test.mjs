// The 3D pages: the kit under public/spatial/, the town at /vr/, and the two Baby Bonfire screens
// that use them (/baby-bonfire/room/ and /baby-bonfire/ar/). These checks hold what the pages
// promise: a normal page first, their own files only, nothing stored, links that cannot run
// script, and honest words about what has and has not been tried.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateManifest, safeUrl } from '../public/spatial/safe.mjs';

const root = new URL('../', import.meta.url);
const at = (p) => new URL(p, root);
const read = (p) => readFileSync(at(p), 'utf8');
const size = (p) => statSync(at(p)).size;

const kit = read('public/spatial/spatial.mjs');
const town = read('public/vr/index.html');
const room = read('public/baby-bonfire/room/index.html');
const roomJs = read('public/baby-bonfire/room/room.js');
const table = read('public/baby-bonfire/ar/index.html');
const twin = JSON.parse(read('public/baby-bonfire.json'));
const NOTICE = 'Concept sketch. Nothing is for sale. Do not burn anything indoors on the strength of these pages.';

test('the kit ships whole: code, styles, docs, three.js r185 and its licence', () => {
  for (const f of ['spatial.mjs', 'safe.mjs', 'geo.mjs', 'spatial.css', 'README.md', 'API.md',
    'vendor/three-r185/LICENSE', 'vendor/three-r185/three.module.min.js', 'vendor/three-r185/three.core.min.js',
    'vendor/three-r185/addons/loaders/GLTFLoader.js', 'vendor/three-r185/addons/libs/meshopt_decoder.module.js']) {
    assert.ok(existsSync(at(`public/spatial/${f}`)), f);
  }
  assert.match(read('public/spatial/vendor/three-r185/LICENSE'), /MIT License/);
  assert.match(read('public/spatial/vendor/three-r185/three.core.min.js').slice(0, 4000), /185/);
  assert.match(kit, /export const VERSION = '1\.1\.0'/);
});

test('the kit keeps nothing, asks no other host for anything, and never writes HTML from a manifest', () => {
  assert.doesNotMatch(kit, /localStorage|sessionStorage|document\.cookie|indexedDB|sendBeacon|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(kit, /\binnerHTML\b|\bouterHTML\b|insertAdjacentHTML|document\.write/);
  assert.doesNotMatch(kit, /https?:\/\/(?!www\.w3\.org\/)/, 'the kit names another host');
  assert.equal((kit.match(/\bfetch\(/g) || []).length, 1, 'one fetch: the manifest');
  assert.match(kit, /fetch\(sameOrigin\(manifest\)\)/);
});

test('only http, https and relative URLs can become links or be opened', () => {
  // the kit routes every manifest URL through safeUrl, for the list and for the in-scene Open button
  assert.match(kit, /function openItem\(item\) \{\s*const href = safeUrl\(item && item\.url\);\s*if \(!href\) return false;/);
  assert.ok((kit.match(/safeUrl\(/g) || []).length >= 4);
  const base = 'https://pointcast.xyz/vr/';
  for (const bad of ['javascript:alert(1)', ' \u0001JaVa\tScRiPt:alert(1)', 'data:text/html,<p>x', 'vbscript:x', 'blob:https://pointcast.xyz/x', 'file:///etc/passwd']) {
    assert.equal(safeUrl(bad, base), null, bad);
  }
  assert.equal(safeUrl('/drum', base), 'https://pointcast.xyz/drum');
});

test('gaze alone can open a panel and nothing else; movement in a headset is teleport and snap turn', () => {
  assert.match(kit, /Gaze dwell on a place: open its panel, nothing else/);
  assert.match(kit, /dwell: o\.dwell === true/);
  assert.match(kit, /const SNAP = 30 \* RAD;/);
  assert.doesNotMatch(kit, /bounded-floor/);
  // four input slots, so a pinch that arrives as a third source still reaches something
  assert.match(kit, /for \(let i = 0; i < 4; i\+\+\)/);
  // neither Baby Bonfire page lets a look start sound or blow on the fire
  assert.doesNotMatch(roomJs, /dwell:\s*true/);
});

test('the town manifest is in step with the town, and every link in it is a real route', () => {
  execFileSync(process.execPath, [fileURLToPath(at('scripts/spatial/build-town-places.mjs')), '--check'], { stdio: 'pipe' });
  const m = JSON.parse(read('public/vr/places.json'));
  assert.equal(m.$schema, 'spatial.places/v1');
  const v = validateManifest(m, 'https://pointcast.xyz/vr/');
  assert.deepEqual(v.errors, []);
  assert.deepEqual(v.warnings, []);
  assert.equal(m.places.length, 14, 'twelve buildings and two off-grid entries');
  const townSrc = read('src/pages/town.json.ts');
  for (const p of m.places) {
    assert.ok(townSrc.includes(`'${p.url}'`), `${p.title} -> ${p.url} is not in the town source`);
    assert.ok(townSrc.includes(p.title.replace(/'/g, "\\'")), `${p.title} is not in the town source`);
  }
  assert.deepEqual(m.portals.map((p) => p.url), ['/baby-bonfire/room/']);
});

test('the town is a page first: title, canonical, a list fallback, its own files only', () => {
  assert.ok(town.includes('<title>PointCast Town in 3D</title>'));
  assert.ok(town.includes('<link rel="canonical" href="https://pointcast.xyz/vr/">'));
  assert.ok(town.includes('<meta property="og:url" content="https://pointcast.xyz/vr/">'));
  assert.match(town, /<noscript><p>The 3D view needs JavaScript\./);
  assert.match(town, /Checked in a WebXR emulator only; nobody has tried it in a headset yet\./);
  const map = JSON.parse(town.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(Object.values(map.imports), ['/spatial/vendor/three-r185/three.module.min.js', '/spatial/vendor/three-r185/addons/']);
  for (const page of [town, room, table]) {
    // The JSON-LD block names schema.org as its @context; it is data and fetches nothing.
    const html = page.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
    assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
    assert.doesNotMatch(html, /<iframe\b|@import|XMLHttpRequest|sendBeacon|WebSocket|getUserMedia|geolocation/);
    assert.doesNotMatch(html, /localStorage|sessionStorage|document\.cookie|indexedDB/);
    assert.doesNotMatch(html, /url\(\s*['"]?https?:/i);
    for (const m of html.matchAll(/https?:\/\/[^\s"'<>)]+/g)) {
      assert.ok(m[0].startsWith('https://pointcast.xyz/') || m[0] === 'http://www.w3.org/2000/svg', m[0]);
    }
  }
});

test('The Room: Baby Bonfire head tags, the notice, three doors, sound only on a press', () => {
  assert.ok(room.includes('<title>The Room · Baby Bonfire</title>'));
  assert.ok(room.includes('<link rel="canonical" href="https://pointcast.xyz/baby-bonfire/room/">'));
  assert.ok(room.includes('<link rel="alternate" type="application/json" href="/baby-bonfire.json"'));
  assert.match(room, /<meta name="description" content="[^"]+ Nothing is for sale\.">/);
  assert.ok(room.includes('<a class="bb-back" href="/baby-bonfire/">'));
  assert.ok(room.includes(NOTICE));
  assert.match(room, /This page keeps nothing and sends nothing\./);
  assert.match(room, /The fireplace model and the fire sound were generated with AI tools\. The room and the page are by Claude, at Mike Hoydich's direction/);
  const m = JSON.parse(read('public/baby-bonfire/room/places.json'));
  assert.deepEqual(m.places.map((p) => p.url), ['/baby-bonfire/prayer/', '/baby-bonfire/ar/', '/vr/']);
  assert.deepEqual(validateManifest(m, 'https://pointcast.xyz/baby-bonfire/room/').warnings, []);
  for (const f of ['models/baby-bonfire.glb', 'models/baby-bonfire-simple.glb', 'media/fire.mp3', 'room.js']) {
    assert.ok(existsSync(at(`public/baby-bonfire/room/${f}`)), f);
  }
  assert.ok(size('public/baby-bonfire/room/models/baby-bonfire.glb') < 600_000);
  // the audio context is made inside the function the Sound button calls, and the file is fetched there
  assert.equal((roomJs.match(/fetch\(/g) || []).length, 1);
  assert.match(roomJs, /fetch\('media\/fire\.mp3'\)/);
  assert.match(roomJs, /prefers-reduced-motion: reduce/);
});

test('On Your Table: the model, the notice, model-viewer vendored with its licence', () => {
  assert.ok(table.includes('<title>On Your Table · Baby Bonfire</title>'));
  assert.ok(table.includes('<link rel="canonical" href="https://pointcast.xyz/baby-bonfire/ar/">'));
  assert.match(table, /<meta name="description" content="[^"]+ Nothing is for sale\.">/);
  assert.ok(table.includes('<a class="bb-back" href="/baby-bonfire/">'));
  assert.ok(table.includes(NOTICE));
  assert.match(table, /nobody has made this object, and it is not a design to build from/);
  assert.match(table, /It has not been tested on a physical device\./);
  assert.ok(table.includes('<script type="module" src="vendor/model-viewer-4.4.0.min.js"></script>'));
  assert.match(read('public/baby-bonfire/ar/vendor/model-viewer.LICENSE'), /Apache License/);
  // an ordinary GLB with no compression extension, so a phone's own AR viewer can read it
  const glb = readFileSync(at('public/baby-bonfire/ar/models/baby-bonfire-plain.glb'));
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
  assert.equal(json.extensionsRequired, undefined);
  assert.ok(glb.length < 1_100_000, `${glb.length} bytes`);
  assert.match(table, /alt="A small round stone fireplace/);
});

test('content rules hold on the three pages', () => {
  const banned = /good ?feels|cannabis|\bhemp\b|\bthc\b|nintendo|playstation|xbox|\bsega\b|safety[- ]tested|buy now|pre-?order|add to cart/i;
  const claims = /flame-safe|fire-safe|fireproof|flameproof|heals?\b|therap|wellness|reduces? (stress|anxiety)|improves? (sleep|mood|health)/i;
  for (const [name, html] of [['town', town], ['room', room + roomJs], ['table', table]]) {
    assert.equal(html.match(banned), null, name);
    assert.equal(html.match(claims), null, name);
    assert.doesNotMatch(html, /[€£]\s?\d|\bUSD\b|\bprice[ds]?\b|subscri/i, name);
  }
});

test('the hub, the twin and the machine lists know the four screens', () => {
  const hub = read('public/baby-bonfire/index.html');
  const section = hub.slice(hub.indexOf('id="screen-h"'), hub.indexOf('id="work-h"'));
  for (const href of ['/baby-bonfire/prayer/', '/baby-bonfire/higher-purpose/', '/baby-bonfire/room/', '/baby-bonfire/ar/']) assert.ok(section.includes(`<a href="${href}">`), href);
  assert.equal((hub.match(/class="obj" href=/g) || []).length, twin.scenes.length, 'one cabinet object per scene');
  assert.deepEqual(twin.screens.map((s) => s.slug), ['prayer', 'room', 'ar', 'higher-purpose']);
  for (const s of twin.screens) {
    assert.equal(s.url, `https://pointcast.xyz/baby-bonfire/${s.slug}/`);
    assert.match(s.tested, /Not yet|has not been tried/);
    for (const mfile of s.media) {
      const rel = mfile.file.includes('/') ? mfile.file : `media/${mfile.file}`;
      assert.ok(existsSync(at(`public/baby-bonfire/${s.slug}/${rel}`)), `${s.slug}: ${mfile.file}`);
    }
  }
  const sitemap = read('src/pages/sitemap-discovery.xml.ts');
  for (const u of ['https://pointcast.xyz/vr/', 'https://pointcast.xyz/vr/places.json', 'https://pointcast.xyz/baby-bonfire/room/', 'https://pointcast.xyz/baby-bonfire/ar/']) {
    assert.ok(sitemap.includes(`'${u}'`), u);
  }
  const llms = read('public/llms.txt');
  const full = read('public/llms-full.txt');
  for (const u of ['https://pointcast.xyz/vr/', 'https://pointcast.xyz/baby-bonfire/room/', 'https://pointcast.xyz/baby-bonfire/ar/']) {
    assert.ok(llms.includes(u), `llms.txt ${u}`);
    assert.ok(full.includes(u), `llms-full.txt ${u}`);
  }
});

test('the test fixtures are not public', () => {
  assert.ok(!existsSync(at('public/spatial/test')));
  assert.ok(existsSync(at('scripts/spatial/fixtures/hostile/places.json')));
  assert.match(read('scripts/spatial/fixtures/hostile/places.json'), /javascript:/);
});
