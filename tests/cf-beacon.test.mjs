import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountCfBeacon, shouldLoadCfBeacon, CF_BEACON_SRC } from '../src/lib/cf-beacon.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the beacon stays out of the layouts until a build token is set', () => {
  const component = read('src/components/CfBeacon.astro');
  assert.match(component, /PUBLIC_CF_BEACON_TOKEN/);
  assert.match(component, /\{token && \(/);
  assert.match(component, /mountCfBeacon/);
  for (const layout of ['src/layouts/BlockLayout.astro', 'src/layouts/DrumLayout.astro']) {
    const source = read(layout);
    assert.match(source, /import CfBeacon from '\.\.\/components\/CfBeacon\.astro';/);
    assert.match(source, /<CfBeacon \/>/);
  }
  assert.match(read('src/layouts/BlockLayout.astro'), /\{!isolated && <CfBeacon \/>\}/);
});

test('headless checks, webdriver, ?nobeacon=1, and localStorage nobeacon skip the script', () => {
  const human = { webdriver: false, userAgent: 'Mozilla/5.0 Chrome/130.0', search: '', stored: null };
  assert.equal(shouldLoadCfBeacon(human), true);
  assert.equal(shouldLoadCfBeacon({ ...human, webdriver: true }), false);
  assert.equal(shouldLoadCfBeacon({ ...human, userAgent: 'Mozilla/5.0 HeadlessChrome/130.0' }), false);
  assert.equal(shouldLoadCfBeacon({ ...human, search: '?nobeacon=1' }), false);
  assert.equal(shouldLoadCfBeacon({ ...human, search: '?x=1&nobeacon=1' }), false);
  assert.equal(shouldLoadCfBeacon({ ...human, search: '?nobeacon=0' }), true);
  assert.equal(shouldLoadCfBeacon({ ...human, stored: '1' }), false);
  assert.equal(shouldLoadCfBeacon({ ...human, stored: '' }), false);
});

test('mountCfBeacon appends one script only for a real browser with a token', () => {
  const html = '<!doctype html><html><head><meta name="pc-cf-beacon" content="site-token"></head><body></body></html>';
  const load = (url, { webdriver = false, userAgent = 'Mozilla/5.0 Chrome/130.0', stored = null } = {}) => {
    const dom = new JSDOM(html, { url });
    Object.defineProperty(dom.window.navigator, 'webdriver', { value: webdriver, configurable: true });
    Object.defineProperty(dom.window.navigator, 'userAgent', { value: userAgent, configurable: true });
    if (stored != null) dom.window.localStorage.setItem('nobeacon', stored);
    return dom;
  };
  const human = load('https://pointcast.xyz/for-agents/');
  assert.equal(mountCfBeacon(human.window.document), true);
  assert.equal(mountCfBeacon(human.window.document), false, 'second call does not add another tag');
  const script = human.window.document.querySelector('script[data-cf-beacon]');
  assert.equal(script.src, CF_BEACON_SRC);
  assert.equal(JSON.parse(script.getAttribute('data-cf-beacon')).token, 'site-token');

  const bot = load('https://pointcast.xyz/?nobeacon=1');
  assert.equal(mountCfBeacon(bot.window.document), false);
  assert.equal(bot.window.document.querySelector('script[data-cf-beacon]'), null);

  const headless = load('https://pointcast.xyz/', { userAgent: 'Mozilla/5.0 HeadlessChrome/130.0' });
  assert.equal(mountCfBeacon(headless.window.document), false);

  const driver = load('https://pointcast.xyz/', { webdriver: true });
  assert.equal(mountCfBeacon(driver.window.document), false);

  const marked = load('https://pointcast.xyz/', { stored: '1' });
  assert.equal(mountCfBeacon(marked.window.document), false);

  const empty = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'https://pointcast.xyz/' });
  assert.equal(mountCfBeacon(empty.window.document), false);
});

test('town checks and the chartmaker smoke append nobeacon on HTML fetches', () => {
  const inspector = read('scripts/town-inspector.mjs');
  const smoke = read('scripts/smoke-chartmaker-live.mjs');
  assert.match(inspector, /function withNoBeacon/);
  assert.match(inspector, /nobeacon/);
  assert.match(inspector, /const wire = withNoBeacon\(url\)/);
  assert.match(smoke, /nobeacon/);
});
