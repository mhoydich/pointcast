import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createVideoPlayer } from '../src/lib/karaoke-video.mjs';

const VIDEO_A = 'YJKiF31Keig';
const VIDEO_B = 'cb0JK8Mih3I';
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup(t, { existingAPI = false, onReady } = {}) {
  // JSDOM does not fetch iframe/script resources without resources: 'usable'.
  const dom = new JSDOM('<!doctype html><div id="video"></div>', { url: 'https://pointcast.xyz/karaoke/' });
  const win = dom.window, container = win.document.querySelector('#video');
  const timers = new Map(), players = [], states = [], errors = [], ready = [];
  let timerId = 0;
  win.setTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
  win.clearTimeout = id => timers.delete(id);
  class Player {
    constructor(iframe, options) { this.iframe = iframe; this.options = options; this.destroyed = 0; this.played = 0; players.push(this); }
    destroy() { this.destroyed++; this.iframe.remove(); }
    playVideo() { this.played++; }
    loadVideoById() { throw new Error('Video loading must not autoplay.'); }
    emit(name, data) { this.options.events[name]({ target: this, data }); }
  }
  const installAPI = () => { win.YT = { Player }; };
  if (existingAPI) installAPI();
  const adapter = createVideoPlayer({ container, onState: value => states.push(value), onError: value => errors.push(value), onReady: () => { ready.push(true); onReady?.(); } });
  t.after(() => { adapter.destroy(); dom.window.close(); });
  return {
    win, container, adapter, players, timers, states, errors, ready, installAPI,
    script: () => win.document.querySelector('script'),
    apiReady() { installAPI(); win.onYouTubeIframeAPIReady(); },
    timeout() { const first = timers.entries().next().value; assert.ok(first, 'an operation has a timeout'); timers.delete(first[0]); first[1].callback(); },
  };
}

test('creating and destroying an unused adapter performs no YouTube loading', t => {
  const app = setup(t);
  assert.equal(app.script(), null);
  assert.equal(app.container.children.length, 0);
  assert.equal(app.timers.size, 0);
  app.adapter.destroy(); app.adapter.destroy();
  assert.equal(app.script(), null);
});

test('only fixed 11-character video IDs can initiate a request', async t => {
  const app = setup(t);
  for (const id of ['', 'short', 'abcdefghijkl', 'abcdefghij!', 'https://youtu.be/YJKiF31Keig', null]) {
    await assert.rejects(app.adapter.load(id), { code: 'invalid-video-id' });
  }
  assert.equal(app.errors.length, 6);
  assert.ok(app.errors.every(code => code === 'invalid-video-id'));
  assert.equal(app.script(), null);
  assert.equal(app.container.children.length, 0);
});

test('loads the official API and visible privacy-enhanced player only on request', async t => {
  const app = setup(t);
  const loading = app.adapter.load(VIDEO_A);
  assert.equal(app.script().src, 'https://www.youtube.com/iframe_api');
  assert.equal(app.script().getAttribute('referrerpolicy'), 'strict-origin-when-cross-origin');
  assert.equal(app.container.children.length, 0);
  app.apiReady(); await flush();
  const iframe = app.container.querySelector('iframe'), url = new URL(iframe.src);
  assert.equal(url.origin, 'https://www.youtube-nocookie.com');
  assert.equal(url.pathname, `/embed/${VIDEO_A}`);
  for (const [key, value] of Object.entries({ autoplay: '0', controls: '1', playsinline: '1', enablejsapi: '1', origin: 'https://pointcast.xyz' })) assert.equal(url.searchParams.get(key), value);
  assert.equal(iframe.getAttribute('referrerpolicy'), 'strict-origin-when-cross-origin');
  assert.equal(iframe.hidden, false);
  assert.equal(iframe.style.display, 'block');
  assert.equal(iframe.style.minHeight, '200px');
  assert.equal(iframe.style.minWidth, '200px');
  assert.ok(iframe.hasAttribute('allowfullscreen'));
  assert.equal(app.players[0].played, 0);
  app.players[0].emit('onReady');
  assert.equal(await loading, true);
  assert.equal(app.ready.length, 1);
  assert.equal(app.timers.size, 0);
});

test('forwards native state codes and ignores duplicate ready events', async t => {
  const app = setup(t, { existingAPI: true });
  const loading = app.adapter.load(VIDEO_A); await flush();
  const player = app.players[0];
  player.emit('onReady'); player.emit('onReady'); await loading;
  for (const state of [-1, 0, 1, 2, 3, 5]) player.emit('onStateChange', state);
  assert.deepEqual(app.states, [-1, 0, 1, 2, 3, 5]);
  assert.equal(app.ready.length, 1);
  player.emit('onStateChange', '1');
  assert.equal(app.states.length, 6);
  assert.equal(app.script(), null);
});

test('script errors reject once, clean up, and permit a fresh retry', async t => {
  const app = setup(t);
  const failed = assert.rejects(app.adapter.load(VIDEO_A), { code: 'api-load' });
  const originalScript = app.script();
  originalScript.dispatchEvent(new app.win.Event('error')); await failed;
  assert.deepEqual(app.errors, ['api-load']);
  assert.equal(app.script(), null);
  assert.equal(app.timers.size, 0);
  const loading = app.adapter.load(VIDEO_A);
  assert.notEqual(app.script(), originalScript);
  app.apiReady(); await flush(); app.players[0].emit('onReady');
  assert.equal(await loading, true);
});

test('API timeout is bounded and restores the previous ready callback', async t => {
  const app = setup(t);
  const previous = () => {};
  app.win.onYouTubeIframeAPIReady = previous;
  const failed = assert.rejects(app.adapter.load(VIDEO_A), { code: 'api-timeout' });
  assert.equal([...app.timers.values()][0].delay, 15000);
  app.timeout(); await failed;
  assert.equal(app.script(), null);
  assert.equal(app.win.onYouTubeIframeAPIReady, previous);
  assert.deepEqual(app.errors, ['api-timeout']);
});

test('player readiness timeout destroys the stale player and supports retry', async t => {
  const app = setup(t, { existingAPI: true });
  const failed = assert.rejects(app.adapter.load(VIDEO_A), { code: 'player-timeout' }); await flush();
  const stale = app.players[0]; app.timeout(); await failed;
  assert.equal(stale.destroyed, 1);
  assert.equal(app.container.children.length, 0);
  stale.emit('onReady'); stale.emit('onStateChange', 1);
  assert.equal(app.ready.length, 0);
  assert.equal(app.states.length, 0);
  const loading = app.adapter.load(VIDEO_B); await flush(); app.players[1].emit('onReady');
  assert.equal(await loading, true);
});

test('destroying during the API request cancels immediately and late callbacks do nothing', async t => {
  const app = setup(t);
  const loading = app.adapter.load(VIDEO_A), staleReady = app.win.onYouTubeIframeAPIReady;
  app.adapter.destroy();
  assert.equal(await loading, false);
  assert.equal(app.script(), null);
  assert.equal(app.timers.size, 0);
  app.installAPI(); staleReady(); await flush();
  assert.equal(app.players.length, 0);
  assert.equal(app.errors.length, 0);
  assert.equal(app.container.children.length, 0);
});

test('a newer load cancels an older pending API request', async t => {
  const app = setup(t);
  const first = app.adapter.load(VIDEO_A), oldScript = app.script();
  const latest = app.adapter.load(VIDEO_B);
  assert.equal(await first, false);
  assert.equal(oldScript.isConnected, false);
  app.apiReady(); await flush();
  assert.equal(app.players.length, 1);
  assert.equal(new URL(app.players[0].iframe.src).pathname, `/embed/${VIDEO_B}`);
  app.players[0].emit('onReady'); assert.equal(await latest, true);
});

test('switching a pending player destroys it and ignores every stale event', async t => {
  const app = setup(t, { existingAPI: true });
  const first = app.adapter.load(VIDEO_A); await flush();
  const stale = app.players[0];
  const latest = app.adapter.load(VIDEO_B); await flush();
  assert.equal(await first, false);
  assert.equal(stale.destroyed, 1);
  stale.emit('onReady'); stale.emit('onStateChange', 1); stale.emit('onError', 150);
  assert.deepEqual(app.states, []); assert.deepEqual(app.errors, []); assert.deepEqual(app.ready, []);
  app.players[1].emit('onReady'); assert.equal(await latest, true);
  assert.equal(app.container.querySelectorAll('iframe').length, 1);
});

test('destroy is idempotent after readiness and the same adapter can load again', async t => {
  const app = setup(t, { existingAPI: true });
  const first = app.adapter.load(VIDEO_A); await flush(); app.players[0].emit('onReady'); await first;
  app.adapter.destroy(); app.adapter.destroy();
  assert.equal(app.players[0].destroyed, 1);
  assert.equal(app.container.children.length, 0);
  app.players[0].emit('onStateChange', 1);
  assert.deepEqual(app.states, []);
  const second = app.adapter.load(VIDEO_B); await flush(); app.players[1].emit('onReady');
  assert.equal(await second, true);
});

for (const code of [2, 5, 100, 101, 150, 153]) {
  test(`YouTube error ${code} before readiness rejects with the original numeric code`, async t => {
    const app = setup(t, { existingAPI: true });
    const failed = assert.rejects(app.adapter.load(VIDEO_A), { code }); await flush();
    app.players[0].emit('onError', code); await failed;
    assert.deepEqual(app.errors, [code]);
    assert.equal(app.players[0].destroyed, 1);
    assert.equal(app.timers.size, 0);
    app.players[0].emit('onError', code);
    assert.deepEqual(app.errors, [code]);
  });
}

test('playback errors after readiness still report and release the player', async t => {
  const app = setup(t, { existingAPI: true });
  const loading = app.adapter.load(VIDEO_A); await flush(); app.players[0].emit('onReady'); await loading;
  app.players[0].emit('onError', 153);
  assert.deepEqual(app.errors, [153]);
  assert.equal(app.players[0].destroyed, 1);
  assert.equal(app.container.children.length, 0);
});

test('shared API loading survives one consumer cancelling and preserves prior integrations', async t => {
  const app = setup(t);
  let previousCalls = 0;
  const previous = () => { previousCalls++; };
  app.win.onYouTubeIframeAPIReady = previous;
  const otherContainer = app.win.document.createElement('div'); app.win.document.body.append(otherContainer);
  const other = createVideoPlayer({ container: otherContainer }); t.after(() => other.destroy());
  const first = app.adapter.load(VIDEO_A), second = other.load(VIDEO_B);
  assert.equal(app.win.document.querySelectorAll('script').length, 1);
  app.adapter.destroy(); assert.equal(await first, false);
  assert.ok(app.script());
  app.apiReady(); await flush();
  assert.equal(previousCalls, 1);
  assert.equal(app.win.onYouTubeIframeAPIReady, previous);
  assert.equal(app.players.length, 1);
  app.players[0].emit('onReady'); assert.equal(await second, true);
  other.destroy();
});

test('constructor failure releases the iframe and permits another load', async t => {
  const app = setup(t, { existingAPI: true });
  app.win.YT.Player = class { constructor() { throw new Error('Player setup failed'); } };
  await assert.rejects(app.adapter.load(VIDEO_A), { code: 'player-create' });
  assert.equal(app.container.children.length, 0);
  assert.equal(app.timers.size, 0);
  app.installAPI(); const loading = app.adapter.load(VIDEO_B); await flush(); app.players[0].emit('onReady');
  assert.equal(await loading, true);
});

test('destroy from a synchronous ready callback cannot leave the constructed player behind', async t => {
  let adapter, constructed;
  const app = setup(t, { existingAPI: true, onReady: () => adapter.destroy() });
  adapter = app.adapter;
  app.win.YT.Player = class {
    constructor(iframe, options) { this.destroyed = 0; constructed = this; options.events.onReady({ target: this }); }
    destroy() { this.destroyed++; }
  };
  assert.equal(await adapter.load(VIDEO_A), true);
  assert.equal(constructed.destroyed, 1);
  assert.equal(app.container.children.length, 0);
  assert.equal(app.timers.size, 0);
});
