import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { setTimeout as wait } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import {
  W, H, idx, newGame, build, canBuild, stepMonth, finishYear, startNextYear, resolveDilemma, totals, analyze, DILEMMAS, cleanName,
  LANDMARKS, snapshot, readSnapshot,
} from '../src/scripts/chapter-city-sim.mjs';
import { prologue, writeChapter, epilogue, novelMarkdown, CAST } from '../src/scripts/chapter-city-story.mjs';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

// A small, sensible starter town on whatever map the seed makes.
function starter(state) {
  const free = i => state.tiles[i].terrain !== 'water' && !state.tiles[i].t;
  const put = (tool, x, y) => { const i = idx(x, y); if (free(i)) build(state, tool, i); };
  for (let x = 8; x <= 20; x++) put('road', x, 8);
  for (let x = 9; x <= 14; x++) { put('res', x, 7); put('res', x, 9); }
  for (let x = 16; x <= 19; x++) put('ind', x, 9);
  put('com', 16, 7); put('com', 17, 7);
  put('power', 21, 9); put('water', 21, 7); put('fire', 12, 10); put('school', 13, 6);
}

function playYear(state) {
  if (state.pending) resolveDilemma(state, 'b');
  const record = finishYear(state);
  startNextYear(state);
  return { record, chapter: writeChapter(state, record) };
}

test('the map has a sea on the west, land to build on, and the same seed makes the same coast', () => {
  const a = newGame({ seed: 99 }), b = newGame({ seed: 99 }), c = newGame({ seed: 100 });
  assert.equal(a.tiles.length, W * H);
  assert.deepEqual(a.tiles.map(t => t.terrain), b.tiles.map(t => t.terrain));
  assert.notDeepEqual(a.tiles.map(t => t.terrain), c.tiles.map(t => t.terrain));
  assert.equal(a.tiles[idx(0, 0)].terrain, 'water');
  assert.ok(a.tiles.filter(t => t.terrain === 'grass' || t.terrain === 'trees').length > W * H / 2);
});

test('building costs money, refuses the sea, and bulldozing clears a lot', () => {
  const s = newGame({ seed: 5 });
  assert.equal(canBuild(s, 'road', idx(0, 0)).ok, false, 'cannot build in the sea');
  const i = idx(12, 8);
  s.tiles[i].terrain = 'grass';
  const before = s.funds;
  assert.equal(build(s, 'power', i).ok, true);
  assert.equal(s.funds, before - 600);
  assert.equal(canBuild(s, 'road', i).ok, false, 'occupied');
  assert.equal(build(s, 'doze', i).ok, true);
  assert.equal(s.tiles[i].t, null);
  s.funds = 3;
  assert.match(canBuild(s, 'road', idx(13, 8)).why, /money/);
});

test('zones grow with road, power and water, and never without a road', () => {
  const s = newGame({ seed: 11 });
  starter(s);
  const lonely = idx(22, 2);
  s.tiles[lonely].terrain = 'grass';
  build(s, 'res', lonely);
  for (let m = 0; m < 12; m++) stepMonth(s);
  const t = totals(s);
  assert.ok(t.pop > 100, `population grew (${t.pop})`);
  assert.ok(t.jobsI > 0, 'industry hired people');
  assert.equal(s.tiles[lonely].lvl, 0, 'a lot with no road stays empty');
  assert.equal(analyze(s).access[lonely], 0);
});

test('without power nothing grows', () => {
  const s = newGame({ seed: 11 });
  starter(s);
  s.tiles.forEach(t => { if (t.t === 'power') t.t = null; });
  for (let m = 0; m < 12; m++) stepMonth(s);
  assert.equal(totals(s).pop, 0);
});

test('a year becomes a deterministic chapter with a headline, the cast and a dilemma', () => {
  const run = () => {
    const s = newGame({ seed: 2024, name: 'Saltmarsh' });
    s.chapters.push(prologue(s));
    starter(s);
    const out = [];
    for (let y = 0; y < 6 && !s.over; y++) out.push(playYear(s).chapter);
    return { s, out };
  };
  const one = run(), two = run();
  assert.deepEqual(one.out, two.out, 'same seed, same book');
  const first = one.out[0];
  assert.match(first.title, /^Chapter 1: /);
  assert.ok(first.headline.length > 10);
  assert.ok(first.paras.length >= 4);
  assert.ok(one.out.some(c => c.paras.some(p => p.includes('Saltmarsh')) || c.headline.includes('SALTMARSH')), 'uses the town name');
  const text = one.out.flatMap(c => c.paras).join(' ');
  for (const who of ['Juniper', 'Tomas', 'Odile']) assert.ok(text.includes(who), `${who} appears`);
  assert.ok(one.out.some(c => c.title.includes('The Vote')), 'year four is an election');
  const counts = {};
  for (const p of one.out.flatMap(c => c.paras)) counts[p] = (counts[p] || 0) + 1;
  const repeats = Object.entries(counts).filter(([p, k]) => k > 1 && !p.startsWith('Then, on the first morning'));
  assert.deepEqual(repeats, [], 'no paragraph repeats word for word in six chapters');
});

test('dilemmas cost money only when chosen and change the next chapter', () => {
  const s = newGame({ seed: 77 });
  starter(s);
  playYear(s);
  s.pending = 'library';
  const funds = s.funds;
  assert.equal(resolveDilemma(s, 'a'), true);
  assert.equal(s.funds, funds - 500);
  assert.equal(s.flags.library, s.year);
  const { chapter } = playYear(s);
  assert.ok(chapter.paras.some(p => p.includes('library')), 'the choice is written into the next chapter');
  s.pending = 'rail';
  s.funds = 100;
  assert.equal(resolveDilemma(s, 'a'), false, 'cannot afford the station');
  assert.equal(resolveDilemma(s, 'z'), false);
  for (const d of Object.values(DILEMMAS)) {
    assert.ok(d.title && d.text.length > 40 && d.a.label && d.b.label);
  }
});

test('losing an election or going broke ends the book with an epilogue', () => {
  const s = newGame({ seed: 3 });
  s.chapters.push(prologue(s));
  for (let y = 1; y <= 4; y++) {
    s.approval = 20;
    s.modifiers.push({ key: 'approval', value: -100, until: 99 });
    if (s.pending) resolveDilemma(s, 'b');
    const record = finishYear(s);
    startNextYear(s);
    s.chapters.push(writeChapter(s, record));
    if (s.over) break;
  }
  assert.equal(s.over, 'election');
  assert.equal(s.pending, null);
  const end = epilogue(s);
  assert.equal(end.title, 'Epilogue');
  assert.match(s.chapters.at(-1).paras.join(' '), /lost/);
  const broke = newGame({ seed: 4 });
  broke.funds = -5000;
  finishYear(broke);
  assert.equal(broke.over, 'bankrupt');
  assert.match(epilogue(broke).paras[0], /treasury ran dry/);
  const md = novelMarkdown(s);
  assert.match(md, /^# .+: A City in Chapters/);
  assert.match(md, /## Prologue/);
});

test('landmarks unlock with population, come one at a time, and the coastal ones need the sea', () => {
  const s = newGame({ seed: 21 });
  s.funds = 50000;
  assert.deepEqual(LANDMARKS, ['lighthouse', 'pier', 'college', 'stadium']);
  const inland = idx(18, 4); s.tiles[inland].terrain = 'grass';
  assert.match(canBuild(s, 'college', inland).why, /unlocks at 1,300/);
  s.stats.pop = 1400;
  assert.equal(build(s, 'college', inland).ok, true);
  const second = idx(19, 4); s.tiles[second].terrain = 'grass';
  assert.match(canBuild(s, 'college', second).why, /already has/);
  assert.match(canBuild(s, 'lighthouse', second).why, /touch the sea/);
  const shore = s.tiles.findIndex((t, i) => t.terrain !== 'water' && !t.t && [i - 1, i + 1].some(n => s.tiles[n]?.terrain === 'water' && Math.floor(n / W) === Math.floor(i / W)));
  assert.equal(build(s, 'lighthouse', shore).ok, true);
  const cover = analyze(s).cover.school;
  assert.ok(cover[idx(18, 10)] > 0.5, 'the college counts as schooling over a wide radius');
  s.stats.pop = 0;
  const later = newGame({ seed: 22 });
  later.stats.pop = 900;
  const rec = finishYear(later);
  assert.ok(Array.isArray(rec.unlocked));
});

test('every chapter carries a one-character-per-tile snapshot that reads back', () => {
  const s = newGame({ seed: 31 });
  starter(s);
  const snap = snapshot(s);
  assert.equal(snap.length, W * H);
  const back = readSnapshot(snap);
  assert.equal(back.length, W * H);
  assert.equal(back[idx(0, 0)].terrain, 'water');
  assert.ok(back.some(t => t.t === 'power'));
  assert.ok(back.some(t => t.t === 'road'));
  const { chapter } = playYear(s);
  assert.equal(chapter.snap.length, W * H);
  assert.equal(prologue(newGame({ seed: 31 })).snap.length, W * H);
});

test('town names are cleaned and the cast is fictional', () => {
  assert.equal(cleanName('<b>Port</b> "Gull"'), 'bPortb Gull');
  assert.equal(cleanName(''), 'Halcyon');
  assert.equal(cleanName('x'.repeat(40)).length, 24);
  assert.ok(Object.keys(CAST).length >= 5);
});

test('page, JSON and discovery surfaces are wired and honest', async () => {
  const page = await read('src/pages/chapter-city.astro');
  assert.match(page, /immersive isolated/);
  assert.match(page, /are fiction/);
  for (const act of ["read", "card", "download", "zoom"]) assert.match(page, new RegExp(`data-act="${act}"`), act + " button");
  const json = await read('src/pages/chapter-city.json.ts');
  assert.match(json, /ai: false/);
  for (const file of ['src/lib/pointcast-apps.ts', 'src/data/agent-surfaces.ts', 'src/pages/sitemap-discovery.xml.ts', 'public/llms.txt', 'src/pages/for-agents.astro']) {
    assert.match(await read(file), /chapter-city/, file);
  }
});

test('the page boots, builds, writes a chapter and offers the dilemma', async t => {
  const html = await read('src/pages/chapter-city.astro');
  const markup = html.slice(html.indexOf('<div class="cc"'), html.lastIndexOf('<script>'));
  const tools = Object.keys((await import('../src/scripts/chapter-city-sim.mjs')).TOOLS)
    .map(id => `<button type="button" data-tool="${id}" aria-pressed="false"></button>`).join('');
  const plain = markup.replace(/\{tools\.map\([\s\S]*?\)\)\}/, tools).replace(/\{[A-Za-z][^{}]*?\.map\([\s\S]*?\)\}/g, '');
  const dom = new JSDOM(`<!doctype html><body>${plain}</body>`, { pretendToBeVisual: true, url: 'https://pointcast.xyz/chapter-city/' });
  const { window } = dom;
  const ctx2d = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  window.HTMLCanvasElement.prototype.getContext = () => ctx2d;
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 768, height: 512 });
  window.matchMedia = () => ({ matches: true });
  const globals = { window, document: window.document, localStorage: window.localStorage, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, Element: window.Element, Blob: window.Blob };
  const saved = new Map(Object.keys(globals).map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  for (const [k, v] of Object.entries(globals)) Object.defineProperty(globalThis, k, { configurable: true, writable: true, value: v });
  t.after(() => { dom.window.close(); for (const [k, d] of saved) { if (d) Object.defineProperty(globalThis, k, d); else delete globalThis[k]; } });
  const { initChapterCity, SAVE_KEY } = await import('../src/scripts/chapter-city.mjs');
  const root = window.document.querySelector('[data-cc]');
  const game = initChapterCity(root);
  assert.match(root.querySelector('[data-page]').textContent, /Prologue|Clerk/);
  starter(game.state);
  root.querySelector('[data-act="turn"]').click();
  for (let k = 0; k < 50 && game.state.chapters.length < 2; k++) await wait(10);
  assert.equal(game.state.chapters.length, 2);
  assert.match(root.querySelector('[data-page] h2').textContent, /\w/);
  assert.ok(root.querySelector('[data-page] [data-plate]'), 'the chapter has a plate of the town');
  assert.ok(JSON.parse(window.localStorage.getItem(SAVE_KEY)).chapters.length === 2, 'saved after the chapter');
  const dilemma = root.querySelector('[data-dilemma]');
  if (game.state.pending) {
    assert.equal(dilemma.hidden, false);
    assert.equal(root.querySelector('[data-act="turn"]').disabled, true, 'decide before the next chapter');
    dilemma.querySelector('[data-choose="b"]').click();
    assert.equal(game.state.pending, null);
    assert.equal(root.querySelector('[data-act="turn"]').disabled, false);
  }
});
