import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import * as model from '../src/lib/death-star-bbs.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('ATASCII text uses byte order and display cells stay within the 40 by 24 screen', () => {
  assert.deepEqual(model.textBytes('A0 Z'), [65, 48, 32, 90]);
  assert.deepEqual(model.textBytes('A', true), [193]);
  assert.deepEqual(model.textBytes('{'), [63], 'do not render ASCII braces as Atari control pictures');
  const state = { view: 'menu', handle: 'VISITOR', note: 0, best: null, game: model.freshGame() };
  for (const view of ['welcome', 'menu', 'offline', 'bulletins', 'info', 'glyphs', 'handle', 'game']) {
    const screen = model.makeDisplay({ ...state, view });
    assert.equal(screen.cells.length, 960);
    assert.ok(screen.cells.every(code => Number.isInteger(code) && code >= 0 && code <= 255));
    assert.ok(screen.readable.length > 40, `${view} needs useful accessible text`);
  }
  assert.ok(model.makeDisplay(state).cells.includes(160), 'Death Star art uses native inverse-space blocks');
});

test('five arrows can all hit, shots cannot score twice, and a completed round is final', () => {
  let game = model.freshGame();
  for (let round = 0; round < 5; round++) {
    game.aim = model.TARGETS[round] - model.WINDS[round];
    assert.ok(game.aim >= 0 && game.aim <= 6, 'every target must be reachable with the allowed aim');
    game = model.fireArrow(game);
    assert.equal(game.shot.points, 10);
    assert.equal(model.fireArrow(game).score, game.score, 'repeated fire cannot score twice');
    game = model.nextArrow(game);
  }
  assert.equal(game.score, 50);
  assert.equal(game.complete, true);
  assert.deepEqual(model.nextArrow(game), game);
  assert.deepEqual(model.scoreArrow(0, 3, -2), {landed: -2, points: 0});
});

function app({ storageDenied = false, reducedMotion = true, loadAtlas = false } = {}) {
  const page = read('src/pages/atari-bbs/death-star.astro');
  const html = page.slice(page.indexOf('<main'), page.indexOf('</main>') + 7);
  const dom = new JSDOM(html, { url: 'https://pointcast.xyz/atari-bbs/death-star/', runScripts: 'outside-only', pretendToBeVisual: true });
  Object.assign(dom.window, model);
  dom.window.matchMedia = () => ({ matches: reducedMotion, addEventListener() {} });
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({
    imageSmoothingEnabled: false, fillRect() {}, drawImage() {}, putImageData() {},
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (_x, _y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  });
  const scheduled = new Map();
  let timerId = 0;
  if (loadAtlas) {
    dom.window.Image = class { set src(_value) { this.onload(); } };
    dom.window.setTimeout = callback => { scheduled.set(++timerId, callback); return timerId; };
    dom.window.clearTimeout = id => scheduled.delete(id);
  }
  if (storageDenied) Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('denied'); } });
  const source = read('src/scripts/death-star-bbs.ts').replace(/^import .*?;\n/, '');
  const script = ts.transpileModule(source, {compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }}).outputText;
  dom.window.eval(script);
  const find = selector => dom.window.document.querySelector(selector);
  const click = command => find(`[data-action="${command}"]`).click();
  const key = key => find('[data-stage]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  return { dom, find, click, key, completeReveal() {
    let ticks = 0;
    while (scheduled.size && ticks++ < 1000) {
      const [id, callback] = scheduled.entries().next().value;
      scheduled.delete(id); callback();
    }
    assert.equal(scheduled.size, 0, 'a reveal must finish within one screen');
  } };
}

test('keyboard and touch share navigation, semantic screen updates, and local handle sanitization', () => {
  const bbs = app({storageDenied:true});
  try {
    assert.equal(bbs.find('[data-slow]').disabled, true, 'reduced motion keeps the display instant');
    bbs.key('Enter');
    assert.match(bbs.find('[data-screen-text]').textContent, /Main menu/);
    bbs.click('B');
    assert.match(bbs.find('[data-screen-text]').textContent, /not archived messages/);
    bbs.click('N');
    assert.match(bbs.find('[data-screen-text]').textContent, /Mike Hoydich/);
    bbs.key('Escape');
    bbs.click('H');
    bbs.find('input[name="handle"]').value = '<img>Mike_1987!';
    bbs.find('[data-handle-form]').dispatchEvent(new bbs.dom.window.Event('submit', {bubbles:true,cancelable:true}));
    assert.match(bbs.find('[data-screen-text]').textContent, /IMGMIKE_1987/);
    assert.match(bbs.find('[data-bbs-status]').textContent, /Storage is unavailable/);
    assert.equal(bbs.find('[data-screen-text] img'), null);
    bbs.click('G');
    bbs.key('ArrowDown');
    assert.match(bbs.find('[data-screen-text]').textContent, /Aim row 5/);
    bbs.click('FIRE');
    assert.match(bbs.find('[data-screen-text]').textContent, /Shot scored 6 points/);
    bbs.click('NEXT');
    assert.match(bbs.find('[data-screen-text]').textContent, /Arrow 2 of 5/);
    bbs.key('Escape');
    bbs.click('Q');
    assert.match(bbs.find('[data-screen-text]').textContent, /left the local BBS/);
  } finally { bbs.dom.window.close(); }
});


test('manual and automatic reveal completion retain terminal keyboard focus', () => {
  const bbs = app({ reducedMotion: false, loadAtlas: true });
  try {
    bbs.key('Enter');
    bbs.find('[data-slow]').checked = true;
    bbs.click('B');
    assert.equal(bbs.find('[data-skip]').hidden, false);
    bbs.find('[data-skip]').focus();
    bbs.find('[data-skip]').click();
    assert.equal(bbs.dom.window.document.activeElement, bbs.find('[data-stage]'));
    assert.equal(bbs.find('[data-stage]').getAttribute('aria-busy'), 'false');
    bbs.key('N');
    bbs.find('[data-skip]').focus();
    bbs.completeReveal();
    assert.equal(bbs.find('[data-skip]').hidden, true);
    assert.equal(bbs.dom.window.document.activeElement, bbs.find('[data-stage]'));
    bbs.key('Escape');
    assert.match(bbs.find('[data-screen-text]').textContent, /Main menu/);
  } finally { bbs.dom.window.close(); }
});
