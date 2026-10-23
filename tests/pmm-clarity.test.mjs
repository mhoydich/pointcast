import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInContext } from 'node:vm';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const html = readFileSync(new URL('../public/pmm/index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../public/pmm/app.js', import.meta.url), 'utf8');

// Run real handlers and renderers with automatic boot suppressed. Onboarding
// tests explicitly exercise boot with inert transport and identity seams. No test
// creates credentials or contacts services; unintended crypto/network calls fail.
const bootCall = /\n  boot\(\);\n\}\)\(\);\s*$/;
assert.match(source, bootCall, 'Update the inert test harness if PMM boot changes');
const inertSource = source.replace(bootCall, `
  window.__pmmTest = {
    state: () => state, blip, openChat, renderChat, renderChatHead,
    boot, route, ensureIdentity, identityReady: () => identityReady,
    stubIdentity: (fn) => { ensureIdentity = fn; },
    stubSessionEffects: (onRoute) => {
      ticker = () => {};
      refreshIce = () => Promise.resolve(ice);
      route = onRoute;
    },
    connection: (id, readyState) => {
      peer = id ? { friend: friendById(id), dc: { readyState }, rtt: 42, path: 'DIRECT' } : null;
      renderChatHead();
    }
  };
})();`);

function fixture(me = {}, messages = []) {
  return {
    me: { name: 'Preview', place: '', tz: 'UTC', mood: 'calm', live: false, ...me },
    friends: [{ id: '12345678'.repeat(8), name: 'Sample friend', mood: 'calm', tz: 'UTC', created: 1, unread: 0, messages, ledger: [] }],
    si: [],
  };
}

function harness(t, saved, options = {}) {
  const dom = new JSDOM(html, { url: 'https://pmm-test.invalid/pmm/' + (options.hash || ''), runScripts: 'outside-only' });
  const w = dom.window;
  const forbidden = [];
  const deny = (name) => () => { forbidden.push(name); throw new Error(`Forbidden in inert PMM test: ${name}`); };
  const imports = [];
  const subtle = new Proxy({}, { get: (_, name) => {
    if (name === 'importKey' && options.allowFakeImport) return async (...args) => { imports.push(args); return { inert: true }; };
    return deny(`crypto.${String(name)}`);
  } });
  Object.defineProperty(w, 'crypto', { value: { getRandomValues: deny('random'), subtle } });
  w.fetch = deny('fetch');
  w.XMLHttpRequest = deny('XMLHttpRequest');
  w.WebSocket = deny('WebSocket');
  w.RTCPeerConnection = deny('RTCPeerConnection');
  delete w.BroadcastChannel;
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  w.matchMedia = (media) => ({ media, matches: false, addEventListener() {} });
  w.requestAnimationFrame = (fn) => { fn(0); return 0; };
  w.setInterval = () => 0;
  w.HTMLElement.prototype.scrollTo = () => {};
  let audioContexts = 0;
  let notes = 0;
  w.AudioContext = class {
    constructor() { audioContexts++; this.currentTime = 0; this.destination = {}; }
    createOscillator() {
      return { frequency: {}, connect: (node) => node, start() { notes++; }, stop() {} };
    }
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
  };
  if (saved) w.localStorage.setItem('pmm/v1', JSON.stringify(saved));
  runInContext(inertSource, dom.getInternalVMContext(), { filename: 'pmm-inert-app.js' });
  const api = w.__pmmTest;
  const $ = (id) => w.document.getElementById(id);
  t.after(() => { dom.window.close(); assert.deepEqual(forbidden, [], 'UI checks must not use transport or identity APIs'); });
  return {
    w, api, $, imports, audio: () => ({ contexts: audioContexts, notes }),
    gesture: () => w.dispatchEvent(new w.Event('pointerdown')),
    stored: () => JSON.parse(w.localStorage.getItem('pmm/v1')),
    openFriend: () => api.openChat(api.state().friends[0].id),
  };
}

test('first use stays silent after ordinary gestures', (t) => {
  const h = harness(t);
  assert.equal(h.api.state().me.sound, false);
  assert.equal(h.api.state().me.soundChoice, false);
  h.gesture();
  h.api.blip(true);
  h.api.blip(false);
  assert.deepEqual(h.audio(), { contexts: 0, notes: 0 });
  h.$('btn-settings').click();
  assert.equal(h.$('set-sound').checked, false);
});

for (const soundChoice of [undefined, false, 'true']) {
  test(`legacy sound=true without explicit boolean consent is silent (${String(soundChoice)})`, (t) => {
    const h = harness(t, fixture({ sound: true, soundChoice }));
    h.gesture();
    h.api.blip(true);
    h.$('btn-settings').click();
    assert.equal(h.$('set-sound').checked, false);
    h.$('btn-settings-done').click();
    h.api.blip(false);
    assert.notEqual(h.stored().me.soundChoice, true, 'DONE must not count as audio opt-in');
    assert.deepEqual(h.audio(), { contexts: 0, notes: 0 });
  });
}

test('explicit sound control opts in, persists, and can silence the next cue', (t) => {
  const h = harness(t, fixture({ sound: false, soundChoice: false }));
  h.gesture();
  h.$('btn-settings').click();
  h.$('set-sound').click();
  h.$('btn-settings-done').click();
  assert.equal(h.stored().me.sound, true);
  assert.equal(h.stored().me.soundChoice, true);
  h.api.blip(true);
  assert.equal(h.audio().contexts, 1);
  assert.ok(h.audio().notes > 0, 'an opted-in cue reaches the audio engine');
  const played = h.audio().notes;
  h.$('btn-settings').click();
  assert.equal(h.$('set-sound').checked, true);
  h.$('set-sound').click();
  h.$('btn-settings-done').click();
  h.api.blip(false);
  assert.equal(h.audio().notes, played, 'turning sound off prevents subsequent notes');
  assert.equal(h.stored().me.sound, false);
});

test('saved explicit consent still needs a gesture in a fresh session', (t) => {
  const h = harness(t, fixture({ sound: true, soundChoice: true }));
  h.api.blip(true);
  assert.deepEqual(h.audio(), { contexts: 0, notes: 0 });
  h.gesture();
  h.api.blip(true);
  assert.ok(h.audio().notes > 0);
});

test('outgoing delivery labels distinguish waiting, sending, receipt, and unknown status', (t) => {
  const statuses = ['queued', 'sent', 'read', 'failed', undefined];
  const messages = statuses.map((status, i) => ({ id: `message-${i}`, from: 'me', text: `Sample ${i}`, ts: 1_700_000_000_000 + i, status }));
  const h = harness(t, fixture({}, messages));
  h.openFriend();
  const labels = [...h.w.document.querySelectorAll('#messages .msg.me .meta')].map((el) => el.lastElementChild.textContent.trim());
  assert.deepEqual(labels, ['WAITING', 'SENT', 'RECEIVED', 'NOT CONFIRMED', 'NOT CONFIRMED']);
  assert.doesNotMatch(h.$('messages').textContent, /✓|\bREAD\b/, 'transport receipt must not imply a human read the message');
});

test('conversation explains queued notes and changes composer intent with the connection', (t) => {
  const messages = ['queued', 'sent', 'queued'].map((status, i) => ({ id: `queue-${i}`, from: 'me', text: 'Sample', ts: 1_700_000_000_000 + i, status }));
  const h = harness(t, fixture({}, messages));
  h.openFriend();
  assert.equal(h.$('peer-status').textContent.trim(), 'NOT CONNECTED');
  assert.equal(h.$('btn-send').textContent.trim(), 'KEEP HERE');
  assert.match(h.$('connection-note').textContent, /2/);
  assert.match(h.$('connection-note').textContent, /wait|kept|saved/i);
  assert.equal(h.$('btn-connect').hidden, false);
  assert.equal(h.$('btn-file').disabled, true);
  assert.equal(h.$('btn-voice').disabled, true);
  const id = h.api.state().friends[0].id;
  h.api.connection(id, 'connecting');
  assert.equal(h.$('peer-status').textContent.trim(), 'NOT CONNECTED');
  h.api.connection(id, 'open');
  assert.equal(h.$('peer-status').textContent.trim(), 'CONNECTED');
  assert.equal(h.$('btn-send').textContent.trim(), 'SEND');
  assert.equal(h.$('btn-connect').hidden, true);
  assert.equal(h.$('btn-file').disabled, false);
  assert.equal(h.$('btn-voice').disabled, false);
  h.api.connection(null);
  assert.equal(h.$('peer-status').textContent.trim(), 'NOT CONNECTED');
  assert.equal(h.$('btn-send').textContent.trim(), 'KEEP HERE');
});


// Deliberately invalid placeholders, never usable credentials. The returning-user
// path only passes these to a fake importKey; the real WebCrypto API is unavailable.
const inertIdentity = {
  id: 'a1b2c3d4'.repeat(8),
  pub: { x: 'fixture-x', y: 'fixture-y' },
  priv: { x: 'fixture-x', y: 'fixture-y', d: 'not-a-key' },
};
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
function submitHandle(h, value) {
  h.$('quickstart-name').value = value;
  h.$('quickstart-name').dispatchEvent(new h.w.Event('input', { bubbles: true }));
  h.$('quickstart-form').dispatchEvent(new h.w.Event('submit', { bubbles: true, cancelable: true }));
}
function successfulIdentityStub(h, calls) {
  h.api.stubIdentity(async (options) => {
    calls.push(options);
    Object.assign(h.api.state().me, structuredClone(inertIdentity));
  });
}

test('fresh boot and incoming invite routing wait for explicit quickstart', async (t) => {
  const h = harness(t, undefined, { hash: '#join=ABCDEF' });
  await h.api.boot();
  h.api.route();
  assert.equal(h.api.identityReady(), false);
  assert.equal(h.$('quickstart').hidden, false);
  assert.equal(h.$('friend-actions').hidden, true);
  assert.equal(h.$('btn-export').disabled, true);
  assert.equal(h.w.location.hash, '#join=ABCDEF');
  assert.equal(h.api.state().me.pub, undefined);
  assert.equal(h.api.state().me.priv, undefined);
  await assert.rejects(h.api.ensureIdentity(), /continue|handle/i);
  await assert.rejects(h.api.ensureIdentity({ create: false }), /continue|handle/i);
  assert.equal(h.api.state().me.pub, undefined);
});

test('quickstart rejects blank and invalid handles inline before setup', async (t) => {
  const h = harness(t, undefined, { hash: '#join=ABCDEF' });
  await h.api.boot();
  const calls = [];
  successfulIdentityStub(h, calls);
  for (const value of ['', '   ', '@', '!friend', '<friend>', 'x'.repeat(25), 'friend\u0000']) {
    submitHandle(h, value);
    await nextTurn();
    assert.equal(h.$('quickstart-error').hidden, false, `show validation for ${JSON.stringify(value)}`);
    assert.equal(h.$('quickstart-name').getAttribute('aria-invalid'), 'true');
    assert.equal(h.w.document.activeElement, h.$('quickstart-name'));
    assert.equal(h.$('quickstart').hidden, false);
  }
  assert.equal(calls.length, 0);
  assert.equal(h.w.location.hash, '#join=ABCDEF');
  h.$('quickstart-name').dispatchEvent(new h.w.Event('input'));
  assert.equal(h.$('quickstart-error').hidden, true);
  assert.equal(h.$('quickstart-name').hasAttribute('aria-invalid'), false);
});

test('Continue normalizes a local handle and resumes the original invite once', async (t) => {
  const h = harness(t, undefined, { hash: '#join=ABCDEF' });
  await h.api.boot();
  const calls = [], routes = [];
  successfulIdentityStub(h, calls);
  h.api.stubSessionEffects(() => routes.push(h.w.location.hash));
  submitHandle(h, '  @Sunny   Mike  ');
  await nextTurn();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].create, true);
  assert.equal(h.stored().me.name, 'Sunny Mike');
  assert.equal(h.api.identityReady(), true);
  assert.equal(h.$('quickstart').hidden, true);
  assert.equal(h.$('friend-actions').hidden, false);
  assert.deepEqual(routes, ['#join=ABCDEF']);
  assert.equal(h.w.document.activeElement, h.$('btn-host'));
});

test('repeated Continue while setup is pending starts identity setup only once', async (t) => {
  const h = harness(t);
  await h.api.boot();
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  let setups = 0, routes = 0;
  h.api.stubIdentity(async (options) => {
    assert.equal(options.create, true);
    setups++;
    await pending;
    Object.assign(h.api.state().me, structuredClone(inertIdentity));
  });
  h.api.stubSessionEffects(() => { routes++; });
  submitHandle(h, 'Sunny');
  submitHandle(h, 'Changed during setup');
  assert.equal(h.$('quickstart-submit').disabled, true);
  assert.equal(setups, 1);
  assert.equal(routes, 0);
  release();
  await nextTurn();
  assert.equal(h.stored().me.name, 'Sunny');
  assert.equal(routes, 1);
  assert.equal(h.$('quickstart-submit').disabled, false);
});

test('failed setup preserves the invite and can retry without saving a partial handle', async (t) => {
  const h = harness(t, undefined, { hash: '#join=ABCDEF' });
  await h.api.boot();
  let setups = 0;
  const routes = [];
  h.api.stubIdentity(async () => { setups++; throw new Error('simulated setup failure'); });
  h.api.stubSessionEffects(() => routes.push(h.w.location.hash));
  submitHandle(h, 'Sunny');
  await nextTurn();
  assert.equal(h.$('quickstart-error').hidden, false);
  assert.match(h.$('quickstart-error').textContent, /try again/i);
  assert.equal(h.$('quickstart-submit').disabled, false);
  assert.equal(h.api.state().me.name, '');
  assert.equal(h.api.identityReady(), false);
  assert.equal(h.w.location.hash, '#join=ABCDEF');
  assert.deepEqual(routes, []);
  h.api.stubIdentity(async () => { setups++; Object.assign(h.api.state().me, structuredClone(inertIdentity)); });
  submitHandle(h, 'Sunny');
  await nextTurn();
  assert.equal(setups, 2);
  assert.equal(h.stored().me.name, 'Sunny');
  assert.deepEqual(routes, ['#join=ABCDEF']);
});

test('returning saved profile imports its existing identity and keeps legacy names intact', async (t) => {
  const saved = fixture({ ...inertIdentity, name: 'Legacy 🐚 Name!' }, [{ id: 'kept', from: 'me', text: 'Saved local note', status: 'queued', ts: 1 }]);
  const h = harness(t, saved, { allowFakeImport: true, hash: '#join=ABCDEF' });
  const routes = [];
  h.api.stubSessionEffects(() => routes.push(h.w.location.hash));
  await h.api.boot();
  assert.equal(h.imports.length, 1);
  assert.equal(h.imports[0][0], 'jwk');
  assert.equal(h.api.identityReady(), true);
  assert.equal(h.$('quickstart').hidden, true);
  assert.deepEqual(routes, ['#join=ABCDEF']);
  h.$('btn-settings').click();
  h.$('btn-settings-done').click();
  assert.equal(h.stored().me.name, 'Legacy 🐚 Name!');
  assert.equal(h.stored().me.id, saved.me.id);
  assert.deepEqual(h.stored().friends, saved.friends);
  assert.equal(h.imports.length, 1);
  assert.deepEqual(routes, ['#join=ABCDEF'], 'closing Settings on an existing profile must not restart routing');
});

test('a returning identity without a handle is kept through quickstart', async (t) => {
  const h = harness(t, fixture({ ...inertIdentity, name: '' }), { allowFakeImport: true });
  let routes = 0;
  h.api.stubSessionEffects(() => { routes++; });
  await h.api.boot();
  assert.equal(h.imports.length, 1);
  assert.equal(h.$('quickstart').hidden, false);
  assert.equal(routes, 0);
  submitHandle(h, 'Zoë');
  await nextTurn();
  assert.equal(h.imports.length, 2, 'Continue imports the same existing identity; generateKey stays forbidden');
  assert.equal(h.stored().me.id, inertIdentity.id);
  assert.equal(h.stored().me.name, 'Zoë');
  assert.equal(routes, 1);
});

test('handles can be edited later with validation without changing identity or friends', async (t) => {
  const saved = fixture({ ...inertIdentity, name: 'Sunny' });
  const h = harness(t, saved, { allowFakeImport: true });
  h.api.stubSessionEffects(() => {});
  await h.api.boot();
  h.$('btn-settings').click();
  h.$('set-name').value = '!invalid';
  h.$('btn-settings-done').click();
  assert.equal(h.$('set-name-error').hidden, false);
  assert.equal(h.$('set-name').getAttribute('aria-invalid'), 'true');
  assert.equal(h.api.state().me.name, 'Sunny');
  h.$('set-name').value = '@Mañana-2';
  h.$('btn-settings-done').click();
  assert.equal(h.stored().me.name, 'Mañana-2');
  assert.equal(h.stored().me.id, saved.me.id);
  assert.deepEqual(h.stored().friends, saved.friends);
  assert.equal(h.imports.length, 1);
});

test('duplicate display handles are allowed on independent local profiles', async (t) => {
  for (let i = 0; i < 2; i++) {
    const h = harness(t);
    await h.api.boot();
    successfulIdentityStub(h, []);
    h.api.stubSessionEffects(() => {});
    submitHandle(h, 'Same Name');
    await nextTurn();
    assert.equal(h.stored().me.name, 'Same Name');
    assert.equal(h.$('quickstart').hidden, true);
  }
});


test('Settings can finish a nameless returning profile and resume its held invite', async (t) => {
  const h = harness(t, fixture({ ...inertIdentity, name: '' }), { allowFakeImport: true, hash: '#join=ABCDEF' });
  const routes = [];
  h.api.stubSessionEffects(() => routes.push(h.w.location.hash));
  await h.api.boot();
  assert.equal(h.$('quickstart').hidden, false);
  assert.equal(h.$('quickstart-invite').hidden, false);
  assert.equal(h.imports.length, 1);
  assert.deepEqual(routes, []);
  h.$('btn-settings').click();
  h.$('set-name').value = 'Restored Friend';
  h.$('btn-settings-done').click();
  assert.equal(h.stored().me.name, 'Restored Friend');
  assert.equal(h.stored().me.id, inertIdentity.id);
  assert.equal(h.$('quickstart').hidden, true);
  assert.deepEqual(routes, ['#join=ABCDEF']);
  assert.equal(h.imports.length, 1, 'Settings must not recreate or reimport the identity');
  h.$('btn-settings').click();
  h.$('btn-settings-done').click();
  assert.deepEqual(routes, ['#join=ABCDEF'], 'later Settings saves must not resume the invite again');
});

test('skip link focuses the visible task without replacing invite or conversation hashes', async (t) => {
  const fresh = harness(t, undefined, { hash: '#join=ABCDEF' });
  await fresh.api.boot();
  fresh.w.document.querySelector('.skip').click();
  await nextTurn();
  assert.equal(fresh.w.document.activeElement, fresh.$('quickstart-name'));
  assert.equal(fresh.w.location.hash, '#join=ABCDEF');

  const ready = harness(t, fixture({ ...inertIdentity, name: 'Sunny' }), { allowFakeImport: true });
  ready.api.stubSessionEffects(() => {});
  await ready.api.boot();
  ready.openFriend();
  const conversationHash = ready.w.location.hash;
  assert.match(conversationHash, /^#f=/);
  ready.w.document.querySelector('.skip').click();
  await nextTurn();
  assert.equal(ready.w.document.activeElement, ready.$('composer-input'));
  assert.equal(ready.w.location.hash, conversationHash);
});

test('first-message guidance remains after system notices and clears after a human message', (t) => {
  const h = harness(t, fixture({}, [{ id: 'connected', from: 'them', kind: 'sys', text: 'RUN · connected', ts: 1_700_000_000_000 }]));
  h.openFriend();
  assert.ok(h.$('messages').querySelector('.conversation-empty'), 'the automatic connection notice must not hide first-message guidance');
  h.api.state().friends[0].messages.push({ id: 'hello', from: 'them', text: 'Hello!', ts: 1_700_000_000_001 });
  h.api.renderChat();
  assert.equal(h.$('messages').querySelector('.conversation-empty'), null);
  assert.match(h.$('messages').textContent, /Hello!/);
});
