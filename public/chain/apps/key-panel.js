// key-panel.js: the "your devnet key" panel the writing apps share (The Daily
// Mint, the Notary, Time Capsules). It wires up the skeleton rendered by
// src/components/chain/KeyPanel.astro.
//
// What a key here is: 32 random bytes from the browser, used as an ed25519 key.
// Any ed25519 key is a tz1 account on the PointCast devnet, which has no value
// and may reset. The key signs in this page; only signatures leave it. It lives
// in memory (this tab) unless the person ticks "keep it on this device", which
// writes the 64 hex characters to localStorage under one slot shared by the
// three apps. Anyone who gets those characters can sign as that account, so the
// panel says: a play key, never one you use anywhere else.
//
// Rules, held by the tests: nothing here is written with innerHTML or sent
// anywhere; the key is shown only when the person presses Show; storage is
// wrapped in try/catch (a private window can refuse it) and the page works
// without it.

import { ed25519Works, forgetSeed, isHex64, keyFromSeed, loadStoredSeed, newSeedHex, shortAddr, storeSeed } from './chain-kit.js';

export const KEY_SLOT = 'pointcast-chain-apps/devnet-key/v1';

export function mountKeyPanel(panel, env = {}) {
  const doc = panel.ownerDocument;
  const win = env.window || doc.defaultView;
  const q = (sel) => panel.querySelector(sel);
  const storage = env.storage !== undefined ? env.storage : (() => { try { return win.localStorage; } catch { return null; } })();
  const S = { key: null, listeners: [], supported: null, kept: false, armed: '' };
  const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
  const make = q('[data-kp-make]');
  const forget = q('[data-kp-forget]');
  const keep = q('[data-kp-keep]');
  const reveal = q('[data-kp-reveal]');
  const seedBox = q('[data-kp-seed]');
  const copy = q('[data-kp-copy]');
  const own = q('[data-kp-own]');
  const use = q('[data-kp-use]');
  const keepOld = q('[data-kp-keepold]');
  const addr = q('[data-kp-address]');

  function paint() {
    const k = S.key;
    panel.dataset.state = k ? 'ready' : 'none';
    set('[data-kp-status]', k && S.armed ? 'This would replace ' + k.sender + (S.kept ? ', which is kept on this device' : '') + '. If it holds play ATTN, leads a lot or sealed a capsule, you lose it unless you copy it first: it is shown below. Press “Replace it” again to replace it, or keep this key.' : k ? 'Your key signs as ' + k.sender + (S.kept ? ' · kept on this device' : ' · in this tab only: close it and the key is gone') + '.' : S.supported === false ? 'This browser cannot make an ed25519 key (WebCrypto Ed25519). Use a current Chrome, Edge, Safari or Firefox.' : 'No key yet. Make one: it is a new devnet account, free.');
    if (addr) addr.textContent = k ? k.sender : '';
    if (forget) forget.disabled = !k;
    if (reveal) reveal.disabled = !k;
    if (keep) { keep.disabled = !k || !storage; keep.checked = Boolean(k) && S.kept; }
    if (make) { make.disabled = S.supported === false; make.textContent = S.armed === 'make' ? 'Replace it' : k ? 'Make a new key' : 'Make a key'; }
    if (use) { use.disabled = S.supported === false; use.textContent = S.armed === 'use' ? 'Replace it' : 'Use this key'; }
    if (keepOld) keepOld.hidden = !S.armed;
    if (!k && seedBox) { seedBox.value = ''; seedBox.hidden = true; if (copy) copy.hidden = true; if (reveal) reveal.textContent = 'Show the key'; }
    // A key that is on show must be THIS key: a new key replaces what the open box shows, or backing up what is on screen saves the wrong one.
    if (k && seedBox && !seedBox.hidden) seedBox.value = k.seedHex;
  }

  function emit() { for (const fn of S.listeners) { try { fn(S.key); } catch { /* a listener's failure is its own */ } } }

  /**
   * A key that exists is not replaced by one press: the first press shows the key that would go (so it can be copied) and asks;
   * the second replaces it. The stored copy is not touched until then.
   */
  function guardReplace(kind) {
    if (!S.key || S.armed === kind) return false;
    S.armed = kind;
    if (seedBox) { seedBox.hidden = false; seedBox.value = S.key.seedHex; if (copy) copy.hidden = false; if (reveal) reveal.textContent = 'Hide the key'; }
    paint();
    return true;
  }

  async function setSeed(seedHex, { persist = false } = {}) {
    const k = await keyFromSeed(seedHex);
    S.armed = '';
    S.key = k;
    S.kept = persist && Boolean(storage) && storeSeed(storage, KEY_SLOT, k.seedHex);
    paint();
    emit();
    return k;
  }

  if (make) make.addEventListener('click', async () => { if (guardReplace('make')) return; await setSeed(newSeedHex(), { persist: Boolean(keep && keep.checked) }); });
  if (keepOld) keepOld.addEventListener('click', () => { S.armed = ''; paint(); });
  if (forget) forget.addEventListener('click', () => { S.key = null; S.kept = false; S.armed = ''; if (storage) forgetSeed(storage, KEY_SLOT); paint(); emit(); });
  if (keep) keep.addEventListener('change', () => {
    if (!S.key) return;
    S.armed = '';
    if (keep.checked) S.kept = Boolean(storage) && storeSeed(storage, KEY_SLOT, S.key.seedHex);
    else { S.kept = false; if (storage) forgetSeed(storage, KEY_SLOT); }
    paint();
  });
  if (reveal) reveal.addEventListener('click', () => {
    if (!S.key || !seedBox) return;
    const show = seedBox.hidden;
    seedBox.hidden = !show;
    seedBox.value = show ? S.key.seedHex : '';
    if (copy) copy.hidden = !show;
    reveal.textContent = show ? 'Hide the key' : 'Show the key';
  });
  if (copy) copy.addEventListener('click', async () => {
    if (!S.key) return;
    try { await win.navigator.clipboard.writeText(S.key.seedHex); copy.textContent = 'Copied'; } catch { if (seedBox) { seedBox.select(); } copy.textContent = 'Press ⌘C'; }
    win.setTimeout(() => { copy.textContent = 'Copy'; }, 1800);
  });
  if (use) use.addEventListener('click', async () => {
    const v = own ? String(own.value || '').trim().toLowerCase() : '';
    const note = q('[data-kp-own-note]');
    if (!isHex64(v)) { if (note) { note.textContent = 'A key is 64 hex characters (32 bytes).'; note.dataset.bad = 'yes'; } return; }
    if (guardReplace('use')) { if (note) { note.textContent = 'A key is already in use: press the button again to replace it.'; note.dataset.bad = 'no'; } return; }
    if (note) { note.textContent = 'Using that key.'; note.dataset.bad = 'no'; }
    await setSeed(v, { persist: Boolean(keep && keep.checked) });
    if (own) own.value = '';
  });

  const ready = (async () => {
    S.supported = env.supported !== undefined ? env.supported : await ed25519Works();
    const stored = loadStoredSeed(storage, KEY_SLOT);
    if (S.supported && stored) { try { await setSeed(stored, { persist: true }); return; } catch { /* a bad stored seed is ignored */ } }
    paint();
  })();

  return {
    ready,
    key: () => S.key,
    supported: () => S.supported,
    onChange(fn) { S.listeners.push(fn); if (S.key) fn(S.key); },
    setSeed,
    short: () => (S.key ? shortAddr(S.key.sender) : ''),
  };
}
