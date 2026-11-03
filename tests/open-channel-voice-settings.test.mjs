import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

async function preferences({ recordingsReady = true, saved = {}, storageFails = false } = {}) {
  const page = await readFile(new URL('../src/pages/open-channel.astro', import.meta.url), 'utf8');
  const dom = new JSDOM(page.slice(page.indexOf('<!doctype')), { runScripts: 'outside-only', url: 'https://pointcast.xyz/open-channel/' });
  const { window } = dom;
  for (const [key, value] of Object.entries(saved)) window.sessionStorage.setItem(key, value);
  if (storageFails) Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage unavailable'); } });
  let stops = 0, changes = 0, listener;
  const voices = [
    { voiceURI: 'voice-a', name: 'Natural voice A', lang: 'en-US' },
    { voiceURI: 'voice-b', name: 'Natural voice B', lang: 'en-GB' },
  ];
  window.testNarrator = {
    stop() { stops++; }, getVoices() { return voices; },
    onVoicesChanged(callback) { listener = callback; return () => { listener = undefined; }; },
    play() { throw new Error('Selecting or migrating voice settings must not start narration'); },
  };
  window.testOptions = { recordingsReady, onChange() { changes++; } };
  const source = (await readFile(new URL('../public/open-channel/voice-settings.mjs', import.meta.url), 'utf8')).replace(/^export /gm, '');
  vm.runInContext(`${source}\nwindow.testSettings = setupVoiceSettings(window.testNarrator, window.testOptions);`, dom.getInternalVMContext());
  const $ = id => window.document.getElementById(id);
  const choose = (id, value) => { $(id).value = value; $(id).dispatchEvent(new window.Event('change')); };
  const snapshot = () => Object.fromEntries(Array.from({ length: window.sessionStorage.length }, (_, index) => {
    const key = window.sessionStorage.key(index); return [key, window.sessionStorage.getItem(key)];
  }));
  return { dom, $, choose, snapshot, options: () => window.testSettings.getOptions(), stops: () => stops, changes: () => changes, voices, voicesChanged: () => listener?.() };
}

test('complete narration defaults to recordings without starting playback', async () => {
  const c = await preferences();
  assert.equal(c.options().mode, 'recording'); assert.equal(c.options().rate, 1);
  assert.equal(c.$('voice-mode').value, 'recording'); assert.equal(c.$('browser-voice-row').hidden, true);
  assert.equal(c.$('voice-mode').hidden, false); assert.equal(c.stops(), 0); assert.equal(c.changes(), 0);
  assert.match(c.$('voice-description').textContent, /ElevenLabs/);
  c.dom.window.close();
});

test('legacy device-voice preferences do not hide the first recorded-voice upgrade', async () => {
  const c = await preferences({ saved: { 'pointcast-open-channel-voice-v1': JSON.stringify({ mode: 'browser', voiceURI: 'voice-b' }) } });
  assert.equal(c.options().mode, 'recording'); assert.equal(c.options().voiceURI, 'voice-b');
  c.choose('voice-mode', 'browser'); assert.equal(c.$('browser-voice').value, 'voice-b');
  assert.equal(c.options().mode, 'browser'); assert.equal(c.stops(), 1);
  const saved = c.snapshot(); c.dom.window.close();
  const restored = await preferences({ saved });
  assert.equal(restored.options().mode, 'browser'); assert.equal(restored.options().voiceURI, 'voice-b');
  assert.equal(restored.$('browser-voice-row').hidden, false); assert.equal(restored.stops(), 0);
  restored.dom.window.close();
});

test('an explicit voice choice after the upgrade survives refresh without replaying', async () => {
  const c = await preferences();
  c.choose('voice-mode', 'browser'); c.choose('browser-voice', 'voice-b');
  assert.equal(c.stops(), 2); assert.equal(c.changes(), 2);
  const saved = c.snapshot(); c.dom.window.close();
  const restored = await preferences({ saved });
  assert.equal(restored.options().mode, 'browser'); assert.equal(restored.options().voiceURI, 'voice-b');
  assert.equal(restored.stops(), 0); assert.equal(restored.changes(), 0);
  restored.voices.push({ voiceURI: 'voice-c', name: 'New enhanced voice', lang: 'en-US' });
  restored.voicesChanged();
  assert.ok([...restored.$('browser-voice').options].some(option => option.value === 'voice-c'));
  assert.equal(restored.$('browser-voice').value, 'voice-b'); assert.equal(restored.stops(), 0);
  restored.dom.window.close();
});

test('preferences made before recordings arrive upgrade once, while a temporary outage preserves the selected source', async () => {
  const before = await preferences({ recordingsReady: false });
  assert.equal(before.options().mode, 'browser'); assert.equal(before.$('voice-mode').hidden, true);
  before.choose('browser-voice', 'voice-b');
  const old = before.snapshot(); before.dom.window.close();
  const upgraded = await preferences({ saved: old });
  assert.equal(upgraded.options().mode, 'recording'); assert.equal(upgraded.options().voiceURI, 'voice-b');
  const recorded = upgraded.snapshot(); upgraded.dom.window.close();
  const unavailable = await preferences({ recordingsReady: false, saved: recorded });
  assert.equal(unavailable.options().mode, 'browser'); assert.equal(unavailable.$('voice-mode').hidden, true);
  unavailable.choose('browser-voice', 'voice-a');
  const duringOutage = unavailable.snapshot(); unavailable.dom.window.close();
  const recovered = await preferences({ saved: duringOutage });
  assert.equal(recovered.options().mode, 'recording'); assert.equal(recovered.options().voiceURI, 'voice-a');
  recovered.dom.window.close();
});

test('unavailable or malformed preference storage does not prevent choosing a voice', async () => {
  for (const args of [{ storageFails: true }, { saved: { 'pointcast-open-channel-voice-v2': '{broken' } }]) {
    const c = await preferences(args);
    assert.equal(c.options().mode, 'recording'); c.choose('voice-mode', 'browser'); c.choose('browser-voice', 'voice-b');
    assert.equal(c.options().mode, 'browser'); assert.equal(c.options().voiceURI, 'voice-b');
    c.dom.window.close();
  }
});
