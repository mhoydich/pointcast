// Hearth Kit (/baby-bonfire/hearth-kit/): the Prayer Fire hearth film and its sound as one
// custom element, <hearth-fire>. These checks hold what the kit promised: one small module with
// no dependencies, sound only from a tap, the Prayer Fire files used where they are, a manifest
// that matches the module, and the live Prayer Fire page left exactly as it is on main.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const at = (p) => new URL(p, root);
const read = (p) => readFileSync(at(p), 'utf8');
const MODULE = 'public/baby-bonfire/hearth-kit/hearth-fire.js';
const src = read(MODULE);
const html = read('public/baby-bonfire/hearth-kit/index.html');
const kit = JSON.parse(read('public/baby-bonfire/hearth-kit/kit.json'));
const twin = JSON.parse(read('public/baby-bonfire.json'));
const hub = read('public/baby-bonfire/index.html');
const MEDIA = ['hearth-loop.mp4', 'hearth-poster.jpg', 'fire.mp3', 'bowl.mp3', 'gong.mp3'];

/** The body of a method or function, from its name to the matching closing brace. */
function body(name) {
  const start = src.search(new RegExp(`\\n\\s*(?:function )?${name}\\(`));
  assert.ok(start >= 0, `${name} is in the module`);
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`${name} does not close`);
}

test('the module exists, has no imports and stays under the 20 KB cap', () => {
  const size = statSync(at(MODULE)).size;
  assert.ok(size < 20 * 1024, `module is ${size} bytes`);
  assert.equal(kit.moduleBytes, size, 'kit.json carries the module size');
  assert.doesNotMatch(src, /^\s*import\b|\bimport\(|require\(/m, 'no dependencies');
  assert.doesNotMatch(src, /https?:\/\/(?!pointcast\.xyz)/, 'no outside URLs');
});

test('it defines <hearth-fire> once, with the four attributes and the API', () => {
  assert.match(src, /customElements\.define\('hearth-fire', HearthFire\)/);
  assert.match(src, /if \(!customElements\.get\('hearth-fire'\)\)/);
  const observed = src.match(/observedAttributes\(\) \{ return \[([^\]]*)\]/)[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1));
  assert.deepEqual(observed, ['media', 'sound', 'fit', 'volume']);
  assert.deepEqual(kit.attributes.map((a) => a.name), observed, 'kit.json lists the module attributes');
  for (const m of ['light', 'quiet', 'ring']) assert.match(src, new RegExp(`\\n  ${m}\\(`), m);
  assert.match(src, /get lit\(\)/);
  assert.deepEqual(kit.methods.map((m) => m.name), ['light()', 'quiet()', 'ring(name)', 'lit']);
  for (const e of ['hearth-lit', 'hearth-quiet']) {
    assert.match(src, new RegExp(`new CustomEvent\\('${e}'`), e);
    assert.ok(kit.events.some((x) => x.name === e), `${e} in kit.json`);
  }
  for (const p of ['--hearth-radius', '--hearth-glow']) assert.ok(src.includes(`var(${p}`), p);
  assert.match(src, /aspect-ratio:720\/950/, 'the box has its shape before the film loads');
  assert.match(src, /env\(safe-area-inset-bottom\)/);
});

test('sound starts only from light() or ring(), never on load, connect or sight', () => {
  // The AudioContext is made in one place, audio(), and only wake() calls it.
  assert.equal((src.match(/new AC\(\)/g) || []).length, 1);
  assert.equal((src.match(/\baudio\(\)/g) || []).length, 2, 'audio() is defined once and called once, from wake()');
  assert.ok(body('wake').includes('audio()'));
  const callers = [...src.matchAll(/\bwake\(\)/g)].length;
  assert.equal(callers, 3, 'wake() is defined once and called from light() and ring() only');
  assert.ok(body('light').includes('wake()'));
  assert.ok(body('ring').includes('wake()'));
  for (const name of ['constructor', 'connectedCallback', 'attributeChangedCallback', '_film', '_apply']) {
    assert.doesNotMatch(body(name), /wake\(|audio\(|resume\(|AudioContext/, `${name} starts no sound`);
  }
  for (const name of ['connectedCallback', 'attributeChangedCallback', '_film', '_apply']) {
    assert.doesNotMatch(body(name), /\.light\(|\.ring\(/, `${name} does not light the fire`);
  }
  // The film is muted and never carries sound; the only media .play() is the muted film.
  assert.match(src, /<video[^>]* muted loop playsinline/);
  assert.match(src, /this\._v\.muted = true/);
  assert.doesNotMatch(src, /autoplay/);
  // The built-in button calls light() or quiet() from its click.
  assert.match(src, /this\._b\.addEventListener\('click', \(\) => \(this\._lit \? this\.quiet\(\) : this\.light\(\)\)\)/);
  assert.match(src, /aria-pressed="false" aria-label="Sound"/);
});

test('the fallbacks are there: generated fire, bowl and gong, and the poster with reduced motion', () => {
  assert.match(body('light'), /\(\) => \{ if \(this\._lit && this\._tok === tok\) \{ this\._gen = true; this\._stops\.push\(hush\(this\._bed\)\)/);
  assert.match(body('ring'), /chime\(this\._fx, 392/);
  assert.match(body('ring'), /gongMade\(this\._fx/);
  assert.match(src, /prefers-reduced-motion: reduce/);
  assert.match(body('_film'), /if \(still \|\| this\._failed\) \{ v\.pause\(\); return; \}/);
  assert.match(src, /IntersectionObserver/);
  assert.match(src, /visibilitychange/);
  assert.match(src, /preload="none"/);
});

test('the default media folder is Prayer Fire\'s, and every file is there with its size', () => {
  assert.match(src, /new URL\('\/baby-bonfire\/prayer\/media\/', import\.meta\.url\)/);
  assert.deepEqual(kit.media.map((m) => m.file), MEDIA);
  for (const m of kit.media) {
    const file = at(`public/baby-bonfire/prayer/media/${m.file}`);
    assert.ok(existsSync(file), m.file);
    assert.equal(m.bytes, statSync(file).size, `${m.file} size in kit.json`);
    assert.equal(m.url, `https://pointcast.xyz/baby-bonfire/prayer/media/${m.file}`);
  }
  assert.ok(!existsSync(at('public/baby-bonfire/hearth-kit/media')), 'the kit points at the files and copies none');
  assert.equal(kit.version, '0.1.0');
  assert.equal(kit.tag, 'hearth-fire');
  assert.equal(kit.module, 'https://pointcast.xyz/baby-bonfire/hearth-kit/hearth-fire.js');
});

test('the kit page loads the module, shows the snippet and the files, and says the licence', () => {
  assert.ok(html.includes('<script type="module" src="/baby-bonfire/hearth-kit/hearth-fire.js"></script>'));
  assert.match(html, /<hearth-fire id="fire"><\/hearth-fire>/);
  assert.ok(html.includes('&lt;script type="module" src="https://pointcast.xyz/baby-bonfire/hearth-kit/hearth-fire.js"&gt;&lt;/script&gt;\n&lt;hearth-fire&gt;&lt;/hearth-fire&gt;'));
  assert.deepEqual(kit.snippet, ['<script type="module" src="https://pointcast.xyz/baby-bonfire/hearth-kit/hearth-fire.js"></script>', '<hearth-fire></hearth-fire>']);
  for (const id of ['soundBtn', 'bowlBtn', 'gongBtn', 'copyBtn']) assert.ok(html.includes(`id="${id}"`), id);
  for (const a of kit.attributes) assert.ok(html.includes(`<code>${a.name}</code>`), `${a.name} in the table`);
  for (const f of MEDIA) assert.ok(html.includes(`/baby-bonfire/prayer/media/${f}`), f);
  assert.match(html, /CC BY 4\.0/);
  assert.match(html, /reduced motion/i);
  assert.match(html, /Nothing here lights a real flame\. Nothing is for sale\./);
  assert.doesNotMatch(html, /Mike|Hoydich|\bcannabis\b|\bTHC\b|wellness|heal|therapy|\$\d/i);
  assert.ok(html.includes('<link rel="canonical" href="https://pointcast.xyz/baby-bonfire/hearth-kit/">'));
  assert.ok(existsSync(at('public/baby-bonfire/hearth-kit/card.png')));
});

test('the hub, the twin and the machine lists know the kit', () => {
  const section = hub.slice(hub.indexOf('id="screen-h"'), hub.indexOf('id="work-h"'));
  assert.ok(section.includes('<a href="/baby-bonfire/hearth-kit/">'));
  const entry = twin.kits.find((k) => k.slug === 'hearth-kit');
  assert.ok(entry);
  assert.equal(entry.url, 'https://pointcast.xyz/baby-bonfire/hearth-kit/');
  assert.equal(entry.manifest, 'https://pointcast.xyz/baby-bonfire/hearth-kit/kit.json');
  assert.ok(read('src/pages/sitemap-discovery.xml.ts').includes("'https://pointcast.xyz/baby-bonfire/hearth-kit/'"));
  assert.ok(read('public/llms.txt').includes('https://pointcast.xyz/baby-bonfire/hearth-kit/'));
  assert.ok(read('public/llms-full.txt').includes('https://pointcast.xyz/baby-bonfire/hearth-kit/'));
});

test('the live Prayer Fire page is byte-identical to origin/main', (t) => {
  let main;
  try { main = execFileSync('git', ['show', 'origin/main:public/baby-bonfire/prayer/index.html'], { cwd: root, maxBuffer: 1 << 24 }); }
  catch { t.skip('origin/main is not available in this checkout'); return; }
  assert.ok(readFileSync(at('public/baby-bonfire/prayer/index.html')).equals(main));
});

test('sound="off" really hides the built-in button, and quiet then light stops the fading bed', () => {
  const src = readFileSync(at(MODULE), 'utf8');
  assert.match(src, /button\[hidden\]\{display:none\}/, 'the button rule must not beat [hidden]');
  assert.match(src, /this\._fading \|\| \[\]\)\.forEach/, 'light() stops what quiet() left fading');
  assert.match(src, /this\._tok === tok/, 'a late fetch from an earlier light() adds nothing');
});
