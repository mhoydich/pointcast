import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { WX } from '../src/lib/wx-core.mjs';

const ui = readFileSync(new URL('../src/scripts/wx-ui.mjs', import.meta.url), 'utf8');
const imports = "import { WX } from '../lib/wx-core.mjs';\nimport LANDMASK from '../data/wx-landmask.json';\n";
assert.ok(ui.startsWith(imports), 'Only replace the two static browser imports');
const landmask = JSON.parse(readFileSync(new URL('../src/data/wx-landmask.json', import.meta.url), 'utf8'));
const settle = () => new Promise((resolve) => setImmediate(resolve));

async function board(initialFailure = false) {
  class Node {
    constructor() {
      this.textContent = ''; this.children = []; this.hidden = false;
      this.value = ''; this.classList = { toggle() {}, add() {}, remove() {} };
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute() {}
    addEventListener() {}
  }
  const nodes = new Map();
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, new Node());
    return nodes.get(id);
  };
  node('homeKind').textContent = 'Home · live'; // Actual initial page markup.
  node('home').querySelector = (selector) => {
    assert.equal(selector, '.kind');
    return node('homeKind');
  };
  const timers = new Map();
  const controls = { weatherFails: initialFailure, feedFails: false,
    observed: Date.now() - 10 * 60e3, tempC: 19 };
  const reading = (place) => ({ place, tempC: controls.tempC, phrase: 'Clear sky', sky: 'clear',
    code: 0, obsMs: controls.observed, tz: 'America/Los_Angeles', windKmh: 1, rh: 60 });
  const fixtures = {
    ...WX,
    async fetchStatus() { return { limits: WX.DEFAULT_LIMITS, chainId: 'fixture', height: 7, writes: 'fixture' }; },
    async fetchCurrent(places) {
      if (controls.weatherFails) throw new Error('offline provider failure');
      return places.map(reading);
    },
    async fetchFeed() {
      if (controls.feedFails) throw new Error('offline feed failure');
      const report = WX.buildReport(WX.HOME, reading(WX.HOME), 'fixture');
      return { blocks: [{ height: 7, timestamp: Date.now(), txs: [{ kind: 'publish_block',
        bot: 'fixture', hash: 'fixture-home', payload: { title: report.title, body: report.body, channel: 'BOT' } }] }] };
    },
  };
  const document = {
    hidden: false, getElementById: node,
    createElement: () => new Node(), createElementNS: () => new Node(),
    createTextNode: (text) => ({ textContent: text }),
    querySelectorAll: () => [], addEventListener() {},
  };
  // Execute the actual complete UI IIFE. Only imports, external reads, DOM and timers are supplied offline.
  vm.runInNewContext(ui.slice(imports.length), {
    WX: fixtures, LANDMASK: landmask, document, location: { search: '' }, URLSearchParams,
    setInterval(callback, delay) { assert.ok(!timers.has(delay)); timers.set(delay, callback); },
    setTimeout() { throw new Error('Unexpected timeout in offline UI fixture'); },
    fetch() { throw new Error('Network is forbidden in this test'); },
  }, { filename: 'src/scripts/wx-ui.mjs', timeout: 1000 });
  await settle();
  return { controls, node, async tick(delay) { assert.ok(timers.has(delay)); timers.get(delay)(); await settle(); } };
}

test('failed weather refresh retains its warning and real last reading through every wire refresh', async () => {
  const app = await board();
  const oldTemperature = app.node('homeTemp').textContent;
  const oldClock = WX.localClock(app.controls.observed, 'America/Los_Angeles');
  assert.equal(app.node('homeKind').textContent, 'Home · live');
  assert.ok(app.node('homeSky').textContent.includes(`as of ${oldClock} PT`));

  app.controls.weatherFails = true;
  await app.tick(10 * 60e3);
  const assertRetained = () => {
    assert.equal(app.node('homeKind').textContent, 'Home · last reading · refresh unavailable');
    assert.match(app.node('homeSky').textContent, /Open-Meteo didn't answer/);
    assert.match(app.node('homeSky').textContent, /Last successful reading/);
    assert.ok(app.node('homeSky').textContent.includes(`as of ${oldClock} PT on `));
    assert.equal(app.node('homeTemp').textContent, oldTemperature);
  };
  assertRetained();
  await app.tick(60e3); assertRetained(); // Successful feed must not clear weather failure.
  app.controls.feedFails = true;
  await app.tick(60e3); assertRetained(); // Failed feed also re-renders home.
  await app.tick(30e3); assertRetained(); // Regular age re-render with a real parsed fixture report.

  app.controls.weatherFails = false;
  app.controls.tempC = 22;
  app.controls.observed = Date.now();
  await app.tick(10 * 60e3);
  assert.equal(app.node('homeKind').textContent, 'Home · live');
  assert.doesNotMatch(app.node('homeSky').textContent, /didn't answer|Last successful reading/);
  assert.equal(app.node('homeTemp').textContent, '72°F');
  assert.ok(app.node('homeSky').textContent.includes(`as of ${WX.localClock(app.controls.observed, 'America/Los_Angeles')} PT`));
});

test('an initial weather failure stays unavailable after feed renders until weather succeeds', async () => {
  const app = await board(true);
  assert.equal(app.node('homeKind').textContent, 'Home · unavailable');
  assert.match(app.node('homeSky').textContent, /Open-Meteo didn't answer/);
  assert.doesNotMatch(app.node('homeSky').textContent, /Last successful reading/);
  await app.tick(60e3);
  await app.tick(30e3);
  assert.equal(app.node('homeKind').textContent, 'Home · unavailable');
  assert.match(app.node('homeSky').textContent, /Open-Meteo didn't answer/);
  app.controls.weatherFails = false;
  await app.tick(10 * 60e3);
  assert.equal(app.node('homeKind').textContent, 'Home · live');
  assert.doesNotMatch(app.node('homeSky').textContent, /didn't answer/);
});
