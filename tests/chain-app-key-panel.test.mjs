// The shared "your devnet key" panel (src/components/chain/KeyPanel.astro and
// public/chain/apps/key-panel.js) used by The Daily Mint, the Notary and Time
// Capsules, and the key helpers in chain-kit.js.
//
// What this suite holds: a key is made in the browser and signs real ed25519
// signatures that the SDK verifies; it lives in memory unless the person ticks
// "keep it", is shown only on request, is never written to the DOM as markup,
// never leaves the page, and a browser without ed25519 or without storage is
// told so and does not break.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import * as K from '../public/chain/apps/chain-kit.js';
import { KEY_SLOT, mountKeyPanel } from '../public/chain/apps/key-panel.js';
import { assertNoSinks, bannedHits, code, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const src = { panelJs: read('public/chain/apps/key-panel.js'), component: read('src/components/chain/KeyPanel.astro'), kit: read('public/chain/apps/chain-kit.js') };

/** The component's own markup, with the Astro frontmatter and expressions made plain, as a DOM the panel can wire. */
function panelHtml() {
  const body = src.component.split('---').slice(2).join('---').replace(/\{id \+ '-own'\}/g, '"kp-own"').replace(/id=\{id \+ '-own'\}/g, 'id="kp-own"').replace(/\{signs\}/g, 'the thing');
  return body.replace(/for=\{[^}]*\}/g, 'for="kp-own"').replace(/id=\{[^}]*\}/g, 'id="kp-own"');
}
function fakeStorage(init = {}, { failWrites = false, failReads = false } = {}) {
  const m = new Map(Object.entries(init));
  return {
    m,
    getItem: (k) => { if (failReads) throw new Error('blocked'); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (failWrites) throw new Error('blocked'); m.set(k, String(v)); },
    removeItem: (k) => { if (failWrites) throw new Error('blocked'); m.delete(k); },
  };
}
function mountPanel(opts = {}) {
  const dom = new JSDOM('<!doctype html><body>' + panelHtml() + '</body>', { url: 'http://localhost/chain/notary/' });
  const panel = dom.window.document.querySelector('[data-key-panel]');
  const clip = [];
  Object.defineProperty(dom.window.navigator, 'clipboard', { value: { writeText: async (t) => { if (opts.clipboardFails) throw new Error('denied'); clip.push(t); } }, configurable: true });
  const c = mountKeyPanel(panel, { window: dom.window, storage: opts.storage === undefined ? fakeStorage() : opts.storage, supported: opts.supported });
  return { dom, panel, c, clip, q: (s) => panel.querySelector(s) };
}
const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));

test('ed25519Works is true here, and keyFromSeed gives a tz1 address and a signature the SDK verifies', async () => {
  assert.equal(await K.ed25519Works(), true);
  const k = await K.keyFromSeed('11'.repeat(32));
  assert.match(k.sender, /^tz1[1-9A-HJ-NP-Za-km-z]{30,40}$/);
  assert.equal(k.publicKey.scheme, 'ed25519');
  assert.match(k.publicKey.bytes, /^[0-9a-f]{64}$/);
  assert.equal(K.pcc.tezosAddress(k.publicKey), k.sender);
  const digest = K.pcc.bytesToHex(K.pcc.blake2b([new TextEncoder().encode('a message')], 32));
  const sig = await k.sign(digest);
  assert.match(sig, /^[0-9a-f]{128}$/);
  assert.equal(await K.pcc.verifyEd25519(k.publicKey.bytes, K.pcc.hexToBytes(digest), sig), true);
  assert.equal(await K.pcc.verifyEd25519(k.publicKey.bytes, K.pcc.hexToBytes('00'.repeat(32)), sig), false, 'a signature does not fit another digest');
  // the same seed is the same account; a different seed is a different one
  assert.equal((await K.keyFromSeed('11'.repeat(32))).sender, k.sender);
  assert.notEqual((await K.keyFromSeed('12'.repeat(32))).sender, k.sender);
  await assert.rejects(() => K.keyFromSeed('xyz'), /64 hex/);
  await assert.rejects(() => K.keyFromSeed('11'.repeat(31)), /64 hex/);
  assert.match(K.newSeedHex(), /^[0-9a-f]{64}$/);
  assert.notEqual(K.newSeedHex(), K.newSeedHex());
});

test('storage helpers survive a browser that refuses storage', () => {
  const s = fakeStorage();
  assert.equal(K.storeSeed(s, 'slot', 'ab'.repeat(32)), true);
  assert.equal(K.loadStoredSeed(s, 'slot'), 'ab'.repeat(32));
  s.setItem('bad', 'not hex');
  assert.equal(K.loadStoredSeed(s, 'bad'), null, 'a stored value that is not a key is ignored');
  assert.equal(K.forgetSeed(s, 'slot'), true);
  assert.equal(K.loadStoredSeed(s, 'slot'), null);
  const blocked = fakeStorage({}, { failWrites: true, failReads: true });
  assert.equal(K.storeSeed(blocked, 's', 'ab'.repeat(32)), false);
  assert.equal(K.loadStoredSeed(blocked, 's'), null);
  assert.equal(K.forgetSeed(blocked, 's'), false);
  assert.equal(K.loadStoredSeed(null, 's'), null);
});

test('Make a key: the panel names the account, holds the key in memory and stores nothing', async () => {
  const st = fakeStorage();
  const { c, q, panel } = mountPanel({ storage: st });
  await c.ready;
  assert.equal(panel.dataset.state, 'none');
  assert.match(q('[data-kp-status]').textContent, /^No key yet/);
  assert.equal(q('[data-kp-make]').disabled, false);
  assert.equal(q('[data-kp-forget]').disabled, true);
  const seen = [];
  c.onChange((k) => seen.push(k && k.sender));
  q('[data-kp-make]').click();
  await tick(30);
  const k = c.key();
  assert.ok(k && k.sender.startsWith('tz1'));
  assert.equal(panel.dataset.state, 'ready');
  assert.match(q('[data-kp-status]').textContent, new RegExp('^Your key signs as ' + k.sender + ' · in this tab only'));
  assert.equal(q('[data-kp-address]').textContent, k.sender);
  assert.equal(st.m.size, 0, 'nothing is stored unless the person asks');
  assert.deepEqual(seen, [k.sender]);
  assert.equal(q('[data-kp-forget]').disabled, false);
  // the seed is nowhere in the page text or attributes until it is shown
  assert.ok(!panel.outerHTML.includes(k.seedHex) && !panel.textContent.includes(k.seedHex));
});

test('Show the key reveals the 64 characters once, Copy puts them on the clipboard, Hide takes them away', async () => {
  const { c, q, panel, clip } = mountPanel();
  await c.ready;
  q('[data-kp-make]').click();
  await tick(30);
  const k = c.key();
  assert.equal(q('[data-kp-seed]').hidden, true);
  q('[data-kp-reveal]').click();
  assert.equal(q('[data-kp-seed]').hidden, false);
  assert.equal(q('[data-kp-seed]').value, k.seedHex);
  assert.equal(q('[data-kp-reveal]').textContent, 'Hide the key');
  assert.equal(q('[data-kp-copy]').hidden, false);
  q('[data-kp-copy]').click();
  await tick(10);
  assert.deepEqual(clip, [k.seedHex]);
  assert.equal(q('[data-kp-copy]').textContent, 'Copied');
  q('[data-kp-reveal]').click();
  assert.equal(q('[data-kp-seed]').hidden, true);
  assert.equal(q('[data-kp-seed]').value, '');
  assert.ok(!panel.outerHTML.includes('value="' + k.seedHex));
  // a clipboard that refuses leaves the text selected and says what to do
  const b = mountPanel({ clipboardFails: true });
  await b.c.ready;
  b.q('[data-kp-make]').click();
  await tick(30);
  b.q('[data-kp-reveal]').click();
  b.q('[data-kp-copy]').click();
  await tick(10);
  assert.equal(b.q('[data-kp-copy]').textContent, 'Press ⌘C');
});

test('Keep it on this device writes the key to one shared slot, and the next visit finds it; Forget removes it', async () => {
  const st = fakeStorage();
  const a = mountPanel({ storage: st });
  await a.c.ready;
  a.q('[data-kp-make]').click();
  await tick(30);
  const k = a.c.key();
  assert.equal(a.q('[data-kp-keep]').disabled, false);
  a.q('[data-kp-keep]').checked = true;
  a.q('[data-kp-keep]').dispatchEvent(new a.dom.window.Event('change'));
  assert.equal(st.m.get(KEY_SLOT), k.seedHex);
  assert.match(a.q('[data-kp-status]').textContent, /kept on this device/);
  assert.equal(KEY_SLOT, 'pointcast-chain-apps/devnet-key/v1');
  // another page of the three apps, same origin: the key is there
  const b = mountPanel({ storage: st });
  await b.c.ready;
  assert.equal(b.c.key().sender, k.sender);
  assert.equal(b.q('[data-kp-keep]').checked, true);
  // un-ticking Keep removes it from storage, the key stays in this tab
  b.q('[data-kp-keep]').checked = false;
  b.q('[data-kp-keep]').dispatchEvent(new b.dom.window.Event('change'));
  assert.equal(st.m.has(KEY_SLOT), false);
  assert.ok(b.c.key());
  // Forget clears memory and storage and tells listeners
  const seen = [];
  b.c.onChange((x) => seen.push(x));
  b.q('[data-kp-keep]').checked = true;
  b.q('[data-kp-keep]').dispatchEvent(new b.dom.window.Event('change'));
  assert.equal(st.m.has(KEY_SLOT), true);
  b.q('[data-kp-forget]').click();
  assert.equal(b.c.key(), null);
  assert.equal(st.m.has(KEY_SLOT), false);
  assert.equal(seen.at(-1), null);
  assert.equal(b.panel.dataset.state, 'none');
});

test('a stored value that is not a key is ignored, and a browser without storage still makes keys in memory', async () => {
  const bad = mountPanel({ storage: fakeStorage({ [KEY_SLOT]: 'not a key' }) });
  await bad.c.ready;
  assert.equal(bad.c.key(), null);
  const none = mountPanel({ storage: null });
  await none.c.ready;
  none.q('[data-kp-make]').click();
  await tick(30);
  assert.ok(none.c.key());
  assert.equal(none.q('[data-kp-keep]').disabled, true, 'Keep is off when there is no storage');
  const blocked = mountPanel({ storage: fakeStorage({}, { failWrites: true }) });
  await blocked.c.ready;
  blocked.q('[data-kp-make]').click();
  await tick(30);
  blocked.q('[data-kp-keep]').checked = true;
  blocked.q('[data-kp-keep]').dispatchEvent(new blocked.dom.window.Event('change'));
  assert.match(blocked.q('[data-kp-status]').textContent, /in this tab only/, 'it does not claim a key is kept when storage refused');
});

test('Use a key you already have: 64 hex is taken, anything else is refused with a reason', async () => {
  const { c, q } = mountPanel();
  await c.ready;
  q('[data-kp-own]').value = 'nope';
  q('[data-kp-use]').click();
  await tick(10);
  assert.equal(c.key(), null);
  assert.match(q('[data-kp-own-note]').textContent, /64 hex characters/);
  assert.equal(q('[data-kp-own-note]').dataset.bad, 'yes');
  q('[data-kp-own]').value = ('AB'.repeat(32));
  q('[data-kp-use]').click();
  await tick(30);
  assert.equal(c.key().seedHex, 'ab'.repeat(32), 'upper case is folded');
  assert.equal(q('[data-kp-own]').value, '', 'the field is cleared once used');
  assert.equal((await K.keyFromSeed('ab'.repeat(32))).sender, c.key().sender);
});

test('a browser without ed25519 is told so, and nothing is enabled', async () => {
  const { c, q, panel } = mountPanel({ supported: false });
  await c.ready;
  assert.equal(c.supported(), false);
  assert.match(q('[data-kp-status]').textContent, /cannot make an ed25519 key/);
  assert.equal(q('[data-kp-make]').disabled, true);
  assert.equal(q('[data-kp-use]').disabled, true);
  assert.equal(panel.dataset.state, 'none');
});

test('the panel never uses markup or the network, and the component says what the key is and is not', () => {
  assertNoSinks(src.panelJs, 'key-panel.js');
  assert.doesNotMatch(code(src.panelJs), /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|document\.cookie|sessionStorage|indexedDB/);
  assert.match(src.panelJs, /\.hidden/);
  const c = src.component;
  assert.match(c, /free account on the devnet/);
  assert.match(c, /only the signatures leave it/);
  assert.match(c, /play key with no value/);
  assert.match(c, /never reuse a key you hold anywhere else/);
  for (const h of ['data-kp-make', 'data-kp-keep', 'data-kp-reveal', 'data-kp-copy', 'data-kp-forget', 'data-kp-seed', 'data-kp-own', 'data-kp-use', 'data-kp-status', 'data-kp-address']) assert.ok(c.includes(h), h);
  assert.match(c, /<label class="ca-label" for=\{id \+ '-own'\}>/);
  assert.match(c, /aria-label="Your key, 64 hex characters"/);
  for (const f of [src.panelJs, c]) {
    assert.deepEqual(bannedHits(f), []);
    assert.deepEqual(currencyHits(f), []);
  }
});
