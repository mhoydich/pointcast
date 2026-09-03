import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const fixture = `<!doctype html><html><body>
  <aside class="fb" data-dock>
    <p data-pc-ref="fb-burst" hidden></p>
    <button data-pc-ref="fb-you" aria-expanded="false"></button>
    <button data-pc-ref="fb-menu-btn" aria-expanded="false"></button>
    <img data-pc-ref="fb-noun" src="https://noun.pics/7.svg">
    <span data-pc-ref="fb-you-label"></span><span data-pc-ref="fb-mood-label"></span>
    <form data-pc-ref="fb-omni-form"><span data-pc-ref="fb-omni-mode"></span><input data-pc-ref="fb-omni"></form>
    <button class="fb__stamp" data-pc-ref="fb-stamp-room" data-stamp-id="room" data-tray="room" aria-expanded="false"></button>
    <span data-pc-ref="fb-stamp-dot-room"></span>
    <section class="fb__tray" data-pc-ref="fb-tray-room" hidden>
      <button class="fb__action" data-tray="room" data-action="here">who is here</button>
      <button data-pc-ref="fb-tray-room-toggle"></button>
      <span data-pc-ref="fb-tray-room-label"></span><span data-pc-ref="fb-tray-room-here"></span>
    </section>
    <div data-pc-ref="fb-menu" hidden><div data-pc-ref="fb-menu-scrim"></div><div data-pc-ref="fb-menu-panel"><button data-pc-ref="fb-menu-close"></button></div></div>
    <img data-pc-ref="fb-menu-noun"><span data-pc-ref="fb-menu-name"></span><span data-pc-ref="fb-menu-wallet-status"></span>
    <button data-pc-ref="fb-btn-wallet"></button><select data-pc-ref="fb-mood-select"></select>
    <button data-pc-ref="fb-btn-soundtrack"><span data-pc-ref="fb-soundtrack-label"></span></button>
    <div data-pc-ref="fb-soundtrack" hidden></div><span data-pc-ref="fb-live-here"></span>
  </aside>
  <aside class="tug" data-lead="slack">
    <span data-pc-ref="pc-tug-human"></span><button data-pc-ref="pc-tug-pull"></button>
    <span data-pc-ref="pc-tug-machine"></span><p data-pc-ref="pc-tug-read"></p>
  </aside>
  <div class="spell-layer"></div>
  <div class="cursor-room" data-on="false" data-seed-noun="7" data-room-key="/smoke">
    <div data-pc-ref="cr-cursor"><img data-pc-ref="cr-cursor-noun"><div data-pc-ref="cr-cursor-bubble" hidden></div><span data-pc-ref="cr-cursor-tag"></span></div>
    <div data-pc-ref="cr-peers"></div><div data-pc-ref="cr-log" hidden><span data-pc-ref="cr-log-head-label"></span><ol data-pc-ref="cr-log-list"></ol></div>
  </div>
</body></html>`;

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('jsdom chrome smoke: lifecycle, dock analytics, room de-dupe, visible tug, and bursts', async () => {
  const dom = new JSDOM(fixture, { url: 'https://pointcast.xyz/about', pretendToBeVisual: true });
  const prior = new Map();
  const install = (key, value) => {
    prior.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };

  const requests = [];
  const beacons = [];
  const observers = [];

  class FakeWebSocket extends dom.window.EventTarget {
    static instances = [];
    constructor(url) {
      super();
      this.url = String(url);
      this.readyState = 0;
      this.sent = [];
      FakeWebSocket.instances.push(this);
      queueMicrotask(() => {
        if (this.readyState !== 0) return;
        this.readyState = 1;
        this.dispatchEvent(new dom.window.Event('open'));
      });
    }
    send(value) { this.sent.push(String(value)); }
    close() {
      if (this.readyState === 3) return;
      this.readyState = 3;
      this.dispatchEvent(new dom.window.Event('close'));
    }
    receive(payload) {
      this.dispatchEvent(new dom.window.MessageEvent('message', { data: JSON.stringify(payload) }));
    }
  }

  class FakeIntersectionObserver {
    constructor(callback) { this.callback = callback; this.target = null; this.disconnected = false; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    trigger(isIntersecting) { this.callback([{ target: this.target, isIntersecting }], this); }
  }

  const fakeFetch = async (input, init = {}) => {
    const url = String(input);
    requests.push({ url, init });
    if (url === '/api/auth/session') return new Response(null, { status: 401 });
    if (url === '/api/presence/snapshot') return Response.json({ humans: 1, agents: 0 });
    if (url === '/api/tug') return Response.json({ tug: { humanPulls: 3, machinePulls: 4, knot: 0 } });
    if (url === '/now-playing.json') return Response.json({ provider: 'SPOTIFY', title: 'Smoke', artist: 'PointCast', status: 'playing', live: true });
    return Response.json({ ok: true });
  };

  for (const key of ['window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'Element', 'HTMLElement', 'Node', 'Event', 'CustomEvent', 'MouseEvent', 'MessageEvent', 'AbortController', 'AbortSignal']) {
    install(key, dom.window[key]);
  }
  install('fetch', fakeFetch);
  install('WebSocket', FakeWebSocket);
  install('IntersectionObserver', FakeIntersectionObserver);
  dom.window.fetch = fakeFetch;
  dom.window.WebSocket = FakeWebSocket;
  dom.window.IntersectionObserver = FakeIntersectionObserver;
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  Object.defineProperty(dom.window.navigator, 'sendBeacon', { configurable: true, value: (url, body) => { beacons.push({ url, body }); return true; } });

  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    await server.ssrLoadModule('/src/scripts/chrome.ts');
    await tick();

    const tray = document.querySelector('[data-pc-ref="fb-tray-room"]');
    document.querySelector('[data-pc-ref="fb-stamp-room"]').click();
    assert.equal(tray.hidden, false, 'dock stamp opens its tray');

    document.querySelector('.fb__action').click();
    await tick();
    const analyticsBodies = await Promise.all(beacons.map(({ body }) => body.text()));
    assert.ok(analyticsBodies.some((body) => body.includes('"event":"dock"') && body.includes('"action":"stamp_action"')));

    const tugRequestsBefore = requests.filter(({ url }) => url === '/api/tug').length;
    assert.equal(tugRequestsBefore, 0, 'tug stays idle before it intersects');
    observers.find((observer) => observer.target?.matches('.tug')).trigger(true);
    await tick();
    assert.equal(requests.filter(({ url }) => url === '/api/tug').length, 1, 'visible tug starts polling');

    const roomSocket = FakeWebSocket.instances.find((socket) => socket.url.includes('/api/room?'));
    assert.ok(roomSocket, 'room presence client opens');
    window.dispatchEvent(new CustomEvent('pc:room:chat', { detail: { msg: 'hello' } }));
    roomSocket.receive({ chat: [{ id: 'chat-1', sid: 'remote', who: 'visitor', nounId: 8, msg: 'hello', at: Date.now() }] });
    roomSocket.receive({ chat: [{ id: 'chat-1', sid: 'remote', who: 'visitor', nounId: 8, msg: 'hello', at: Date.now() }] });
    assert.equal(document.querySelectorAll('[data-pc-ref="cr-log-list"] li').length, 1, 'server chat ids de-dupe');

    window.dispatchEvent(new CustomEvent('pc:burst', { detail: { kind: 'bell', at: Date.now(), by: {}, meta: { color: '#185fa5' } } }));
    assert.equal(document.querySelectorAll('.spell-burst-pulse').length, 1, 'burst renders into the spell layer');

    const moodOptionCount = document.querySelector('[data-pc-ref="fb-mood-select"]').options.length;
    document.dispatchEvent(new CustomEvent('astro:page-load'));
    await tick();
    assert.equal(document.querySelector('[data-pc-ref="fb-mood-select"]').options.length, moodOptionCount, 'remount is idempotent');
    assert.equal(document.querySelectorAll('.spell-burst-pulse').length, 0, 'remount cleans up old burst DOM');
    const activeSockets = FakeWebSocket.instances.filter((socket) => socket.readyState !== 3);
    assert.equal(activeSockets.filter((socket) => socket.url.includes('/api/room?')).length, 1);
    assert.equal(activeSockets.filter((socket) => socket.url.includes('/api/burst?')).length, 1);
  } finally {
    document.dispatchEvent(new CustomEvent('astro:before-swap'));
    await server.close();
    dom.window.close();
    for (const [key, descriptor] of prior) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
