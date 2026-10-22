import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { setTimeout as wait } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import {
  parseDoc, serializeDoc, makeBlock, setVersionActive, promoteVersion, removeVersion, wordDiff, scoreEvents,
  encodeShare, decodeShare, shareCodeFromHash, SHARE_MAX, SAMPLE_DOC,
} from '../src/scripts/takes-core.mjs';
import { TakesAudio, encodeWav } from '../src/scripts/takes-audio.mjs';

const RealURL = globalThis.URL;
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('paragraph takes can be chosen, promoted and removed without losing the original', () => {
  const block = makeBlock(['one', 'two', 'three'], 2);
  assert.equal(setVersionActive(block, 1), true);
  assert.equal(block.active, 1);
  assert.equal(setVersionActive(block, 9), false);
  assert.equal(promoteVersion(block, 2), true);
  assert.deepEqual(block.versions, ['three', 'one', 'two']);
  assert.equal(block.active, 0);
  assert.equal(promoteVersion(block, 0), false, 'the original is already the original');
  block.active = 2;
  assert.equal(removeVersion(block, 1), true);
  assert.deepEqual(block.versions, ['three', 'two']);
  assert.equal(block.active, 1, 'the showing take keeps showing after an earlier one is removed');
  assert.equal(removeVersion(block, 0), false, 'the original cannot be removed');
  assert.equal(removeVersion(block, 1), true);
  assert.deepEqual(block.versions, ['three']);
  assert.equal(block.active, 0);
});

test('word diff marks only the words a take adds, keeping whitespace', () => {
  const parts = wordDiff('the tide goes out', 'the cold tide goes  out fast');
  assert.equal(parts.map(p => p.text).join(''), 'the cold tide goes  out fast');
  assert.deepEqual(parts.filter(p => p.added).map(p => p.text), ['cold', 'fast']);
  assert.deepEqual(wordDiff('', 'new words').filter(p => p.added).map(p => p.text), ['new', 'words']);
});

test('the take score lists every take in reading order with what is showing', () => {
  const doc = parseDoc(SAMPLE_DOC);
  const events = scoreEvents(doc);
  assert.deepEqual(events.map(e => [e.kind, e.index, e.total]), [
    ['take', 2, 3], ['take', 2, 3], ['paragraph', 1, 3], ['take', 0, 2],
  ]);
  assert.ok(events.every(e => e.pan >= -1 && e.pan <= 1));
});

test('share codes round-trip the full draft and reject junk', async () => {
  const md = serializeDoc(parseDoc(SAMPLE_DOC));
  const code = await encodeShare(md);
  assert.match(code, /^z[A-Za-z0-9_-]+$/, 'compressed when CompressionStream exists');
  assert.ok(code.length < md.length, 'compression makes the link shorter than the draft');
  assert.equal(await decodeShare(code), md);
  assert.equal(await decodeShare('p' + Buffer.from('# Hi ✎').toString('base64url')), '# Hi ✎');
  await assert.rejects(decodeShare('x123'));
  await assert.rejects(decodeShare('z' + 'A'.repeat(SHARE_MAX)));
  assert.equal(shareCodeFromHash('#d=zabc'), 'zabc');
  assert.equal(shareCodeFromHash('#x=1&d=pQQ'), 'pQQ');
  assert.equal(shareCodeFromHash('#top'), null);
});

test('WAV encoding writes a valid 16-bit stereo header and clamps samples', () => {
  const left = new Float32Array([0, 1, -1, 2]);
  const right = new Float32Array([0.5, -0.5, 0, -3]);
  const wav = new DataView(encodeWav({ numberOfChannels: 2, sampleRate: 44100, length: 4, getChannelData: c => (c ? right : left) }));
  const text = (o, n) => String.fromCharCode(...Array.from({ length: n }, (_, i) => wav.getUint8(o + i)));
  assert.equal(text(0, 4), 'RIFF');
  assert.equal(text(8, 4), 'WAVE');
  assert.equal(wav.getUint16(22, true), 2);
  assert.equal(wav.getUint32(24, true), 44100);
  assert.equal(wav.getUint16(34, true), 16);
  assert.equal(wav.getUint32(40, true), 16);
  assert.equal(wav.byteLength, 44 + 16);
  assert.equal(wav.getInt16(44 + 4 * 3, true), 0x7fff, 'clipped high');
  assert.equal(wav.getInt16(44 + 4 * 3 + 2, true), -0x8000, 'clipped low');
});

test('rendering a score asks for an offline context and schedules every event in order', async () => {
  await assert.rejects(new TakesAudio().renderScore([{ kind: 'take', index: 1, total: 2, pan: 0 }]), /offline/);
  const calls = [];
  const fakeParam = () => ({ value: 0, setValueAtTime() {}, setTargetAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} });
  const node = () => ({ connect() {}, gain: fakeParam(), frequency: fakeParam(), Q: fakeParam(), threshold: fakeParam(), ratio: fakeParam(), delayTime: fakeParam(), pan: fakeParam(), detune: fakeParam(), buffer: null, start() {}, stop() {} });
  globalThis.OfflineAudioContext = class {
    constructor(ch, len, sr) { this.sampleRate = sr; this.length = len; this.currentTime = 0; this.state = 'suspended'; this.destination = {}; }
    createGain() { return node(); } createDynamicsCompressor() { return node(); } createBiquadFilter() { return node(); }
    createConvolver() { return node(); } createDelay() { return node(); } createStereoPanner() { return node(); }
    createOscillator() { return node(); } createBufferSource() { return node(); }
    createBuffer(c, len) { return { getChannelData: () => new Float32Array(len) }; }
    resume() { throw new Error('offline contexts must never resume'); }
    async startRendering() { return { length: this.length, sampleRate: this.sampleRate }; }
  };
  const original = TakesAudio.prototype.play;
  TakesAudio.prototype.play = function (voice, freq, opts) { calls.push(+opts.at.toFixed(2)); };
  try {
    const out = await new TakesAudio({ space: 1, length: 0.5 }).renderScore([
      { kind: 'take', index: 1, total: 3, pan: 0 }, { kind: 'paragraph', index: 2, total: 3, pan: 0.5 }, { kind: 'take', index: 0, total: 2, pan: 1 },
    ], { gap: 0.5 });
    assert.equal(out.sampleRate, 44100);
    assert.deepEqual(calls, [0.3, 0.8, 0.85, 1.3, 1.33], 'alternate, paragraph chord, original with its fifth');
  } finally {
    TakesAudio.prototype.play = original;
    delete globalThis.OfflineAudioContext;
  }
});

async function boot(t, { url = 'https://pointcast.xyz/takes/', md } = {}) {
  const html = await read('src/pages/takes.astro');
  const markup = html.slice(html.indexOf('<div class="tk"'), html.lastIndexOf('<script>'));
  const plain = markup.replace(/\{[A-Za-z][^{}]*?\.map\([\s\S]*?\)\}/g, '').replace(/\{'([^']*)'\}/g, '$1').replace(/\{`[\s\S]*?`\}/g, '');
  const dom = new JSDOM(`<!doctype html><body>${plain}</body>`, { pretendToBeVisual: true, url });
  const { window } = dom;
  const copies = [], downloads = [];
  let printed = 0;
  window.print = () => { printed++; };
  const globals = {
    window, document: window.document, localStorage: window.localStorage, getComputedStyle: window.getComputedStyle,
    requestAnimationFrame: fn => setTimeout(fn, 0), Element: window.Element, confirm: () => true,
    URL: class extends RealURL { static createObjectURL(blob) { downloads.push(blob); return 'blob:takes'; } static revokeObjectURL() {} },
    navigator: { clipboard: { writeText: async text => { copies.push(text); } } },
  };
  const saved = new Map(Object.keys(globals).map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  for (const [k, v] of Object.entries(globals)) Object.defineProperty(globalThis, k, { configurable: true, writable: true, value: v });
  window.HTMLAnchorElement.prototype.click = function () {};
  const { initTakes, STORAGE_KEY, BACKUP_KEY } = await import('../src/scripts/takes.mjs');
  if (md !== undefined) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ md }));
  const root = window.document.querySelector('[data-takes]');
  const app = initTakes(root);
  t.after(() => {
    root.remove();
    dom.window.close();
    for (const [k, d] of saved) { if (d) Object.defineProperty(globalThis, k, d); else delete globalThis[k]; }
  });
  const $ = s => root.querySelector(s);
  return { app, root, window, $, copies, downloads, printed: () => printed, STORAGE_KEY, BACKUP_KEY };
}

const settle = async () => { for (let i = 0; i < 20; i++) await wait(5); };

test('a share link opens the shared draft, keeps the old one restorable and clears the hash', async t => {
  const shared = '# Shared\n\nThe {{tide | >sea}} is out.\n';
  const code = await encodeShare(shared);
  const mine = '# Mine\n\nMy own words.\n';
  const desk = await boot(t, { url: `https://pointcast.xyz/takes/#d=${code}`, md: mine });
  await settle();
  assert.equal(serializeDoc(desk.app.state.doc), shared);
  assert.equal(desk.window.location.hash, '', 'the draft is not left in the address bar');
  assert.equal(JSON.parse(desk.window.localStorage.getItem(desk.BACKUP_KEY)).md, mine);
  const restore = desk.$('[data-act="restore-backup"]');
  assert.equal(restore.hidden, false);
  restore.click();
  assert.equal(serializeDoc(desk.app.state.doc), mine);
  assert.equal(JSON.parse(desk.window.localStorage.getItem(desk.BACKUP_KEY)).md, shared, 'restoring swaps, so neither draft is lost');
});

test('copying a share link puts the whole draft in the fragment', async t => {
  const desk = await boot(t, { md: '# Mine\n\nA {{b | >c}} d.\n' });
  desk.$('[data-act="share-link"]').click();
  await settle();
  assert.equal(desk.copies.length, 1);
  const url = new RealURL(desk.copies[0]);
  assert.equal(url.origin + url.pathname, 'https://pointcast.xyz/takes/');
  assert.equal(await decodeShare(shareCodeFromHash(url.hash)), '# Mine\n\nA {{b | >c}} d.\n');
  assert.equal(desk.$('[data-share-out]').value, desk.copies[0]);
});

test('compare shows paragraph takes side by side with new words marked, and Use/Make original/Delete work', async t => {
  const desk = await boot(t);
  const multi = [...desk.root.querySelectorAll('.tk-block')].find(el => el.dataset.versions);
  const b = +multi.dataset.b;
  multi.querySelector('[data-act="compare"]').click();
  const panel = desk.$('[data-compare]');
  assert.equal(panel.hidden, false);
  assert.equal(panel.querySelectorAll('.tk-cmp-col').length, 3);
  assert.ok(panel.querySelector('.tk-cmp-col.is-on [aria-pressed="true"]'));
  assert.ok(panel.querySelectorAll('.tk-cmp-col')[2].querySelectorAll('mark').length > 0, 'new words are highlighted');
  panel.querySelector('[data-act="cmp-use"][data-i="2"]').click();
  assert.equal(desk.app.state.doc.blocks[b].active, 2);
  const third = desk.app.state.doc.blocks[b].versions[2];
  panel.querySelector('[data-act="cmp-promote"][data-i="2"]').click();
  assert.equal(desk.app.state.doc.blocks[b].versions[0], third);
  panel.querySelector('[data-act="cmp-remove"][data-i="1"]').click();
  assert.equal(desk.app.state.doc.blocks[b].versions.length, 2);
  desk.$('[data-act="undo"]').click();
  assert.equal(desk.app.state.doc.blocks[b].versions.length, 3, 'delete is undoable');
  assert.equal(panel.hidden, false, 'undo keeps the compare panel on the same paragraph');
  assert.equal(panel.querySelectorAll('.tk-cmp-col').length, 3);
  panel.querySelector('[data-act="close-compare"]').click();
  assert.equal(panel.hidden, true);
});

test('compare on a single-take paragraph explains how to make one; C opens compare from the keyboard', async t => {
  const desk = await boot(t);
  const single = desk.root.querySelector('.tk-block:not([data-versions])');
  assert.equal(single.querySelector('[data-act="compare"]'), null, 'no compare button without takes');
  const multi = desk.root.querySelector('.tk-block[data-versions]');
  desk.app.state.focusBlock = +multi.dataset.b;
  desk.$('[data-page]').dispatchEvent(new desk.window.KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true }));
  assert.equal(desk.$('[data-compare]').hidden, false);
  desk.$('[data-compare] button').dispatchEvent(new desk.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(desk.$('[data-compare]').hidden, true);
});

test('print marks the mode and calls the browser print dialog', async t => {
  const desk = await boot(t);
  desk.$('[data-act="print-marks"]').click();
  assert.equal(desk.root.dataset.print, 'marks');
  desk.$('[data-act="print-clean"]').click();
  assert.equal(desk.root.dataset.print, 'clean');
  assert.equal(desk.printed(), 2);
  const css = await read('src/styles/takes.css');
  assert.match(css, /@media print/);
  assert.match(css, /\[data-print="marks"\]/);
});

test('record the take score explains when there is nothing to play', async t => {
  const desk = await boot(t, { md: '# Plain\n\nNo takes here.\n' });
  desk.$('[data-panel="file"] [data-act="export-wav"]').click();
  await settle();
  assert.match(desk.$('[data-toast]').textContent, /No takes to play/);
  assert.equal(desk.downloads.length, 0);
});
