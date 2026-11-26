#!/usr/bin/env node
// Two-phone run of Light Companion against the local in-memory server:
//
//   node scripts/light-dev.mjs 8794 &
//   PLAYWRIGHT=/path/to/node_modules/playwright CHROME=/usr/bin/google-chrome \
//     node scripts/e2e-light-companion.mjs http://127.0.0.1:8794 [screenshot-dir]
//
// Playwright is not a dependency of this repo; point PLAYWRIGHT at an install.
// Two separate browser contexts at 390x844 stand in for two phones. It refuses
// any host that is not local, so it can never make circles on the live site.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const base = (process.argv[2] || 'http://127.0.0.1:8794').replace(/\/+$/, '');
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) { console.error(`refusing ${base}: local servers only`); process.exit(2); }
const shots = process.argv[3] || '';
if (shots) mkdirSync(shots, { recursive: true });
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');

let passed = 0;
let failedCount = 0;
function check(ok, label, detail = '') {
  if (ok) passed += 1; else failedCount += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errors = [];
async function phone(name) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(m.text())) errors.push(`${name} console: ${m.text()}`); });
  return { context, page, name };
}
const shot = async (p, file) => { if (shots) await p.page.screenshot({ path: `${shots}/${file}.png` }); };
const stateOf = (p, who) => p.page.evaluate((n) => {
  const li = [...document.querySelectorAll('#hill li')].find((x) => x.querySelector('.who').textContent === n);
  return li ? { state: li.dataset.state, since: li.querySelector('.since').textContent } : null;
}, who);
const waitState = (p, who, state, timeout = 9000) => p.page.waitForFunction(([n, s]) => {
  const li = [...document.querySelectorAll('#hill li')].find((x) => x.querySelector('.who').textContent === n);
  return li && li.dataset.state === s;
}, [who, state], { timeout }).then(() => true, () => false);
async function hold(p, ms) {
  const box = await p.page.locator('#my-light').boundingBox();
  await p.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.page.mouse.down(); await p.page.waitForTimeout(ms); await p.page.mouse.up();
}
async function join(p, name) {
  await p.page.fill('#join-name', name);
  await p.page.click('#join-go');
  await p.page.waitForSelector('#my-light');
}

try {
  const a = await phone('A');
  const b = await phone('B');

  // 1. landing → make a circle
  await a.page.goto(`${base}/light/`);
  check((await a.page.textContent('body')).includes('This is not an emergency or monitoring service. It cannot call for help.'), 'landing carries the plain notice');
  check(await a.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'landing fits 390px with no sideways scroll');
  await shot(a, '1-landing');
  await Promise.all([a.page.waitForURL(/\/light\/c\/[a-z0-9]{32}$/), a.page.click('#make')]);
  const link = a.page.url();
  check(/\/light\/c\/[a-z0-9]{32}$/.test(link), 'one tap makes a circle with a 32-character link');
  await a.page.waitForSelector('#view-join:not([hidden])');
  check((await a.page.textContent('#view-join')).includes('It cannot call for help'), 'the notice is shown at creation, before joining');
  await shot(a, '2-join');
  await join(a, 'Ada');
  check(await a.page.getAttribute('#status', 'data-conn') === 'on', 'A: the ember is lit when connected');
  check((await a.page.getAttribute('link[rel="manifest"]', 'href')).endsWith('/manifest.webmanifest'), 'the circle page links a manifest that opens this circle');

  // 2. second phone joins from the link
  await b.page.goto(link);
  await b.page.waitForSelector('#view-join:not([hidden])');
  check((await b.page.textContent('#claim-list')).includes('I am Ada'), 'B: existing members are offered for "this is me"');
  await join(b, 'Ben <b>');
  check(await a.page.waitForFunction(() => document.querySelectorAll('#hill li').length === 2, null, { timeout: 9000 }).then(() => true, () => false), 'A sees B arrive within a few seconds');
  check(await a.page.evaluate(() => [...document.querySelectorAll('#hill .who')].map((e) => e.textContent).join('|')) === 'Ada|Ben <b>', 'windows keep join order; a name with markup shows as text');
  check(await a.page.evaluate(() => document.querySelectorAll('#hill b').length) === 0, 'no element was made from a name');
  check((await stateOf(b, 'Ada')).state === 'dark' && (await stateOf(b, 'Ada')).since === 'not lit', 'B: an unlit light reads "not lit"');
  await shot(b, '3-both-dark');

  // 3. a short press does not light; a hold does
  await hold(a, 150);
  await a.page.waitForTimeout(400);
  check((await stateOf(a, 'Ada')).state === 'dark', 'a short tap does not light');
  await hold(a, 1000);
  check(await waitState(a, 'Ada', 'lit', 4000), 'A: press and hold lights my own window');
  const t0 = Date.now();
  check(await waitState(b, 'Ada', 'lit'), 'B sees it catch', `${((Date.now() - t0) / 1000).toFixed(1)}s after A`);
  check(/^up since \d{1,2}[:.]\d{2}/.test((await stateOf(b, 'Ada')).since), 'B: shows when it was lit, in local time', (await stateOf(b, 'Ada')).since);
  check((await stateOf(b, 'Ben <b>')).state === 'dark', 'B: own window stays dark');
  await shot(b, '4-b-sees-a-lit'); await shot(a, '4-a-lit');

  // 4. both lit, then a fresh load catches them in order
  await hold(b, 1000);
  check(await waitState(a, 'Ben <b>', 'lit'), 'A sees B light too');
  await a.page.addInitScript(() => {
    window.__caught = [];
    new MutationObserver(() => {
      for (const li of document.querySelectorAll('#hill li[data-state="lit"]')) {
        const n = li.querySelector('.who').textContent;
        if (!window.__caught.some((s) => s.n === n)) window.__caught.push({ n, t: performance.now() });
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-state'], childList: true });
  });
  await a.page.reload();
  await a.page.waitForFunction(() => window.__caught && window.__caught.length === 2, null, { timeout: 8000 }).catch(() => {});
  const order = await a.page.evaluate(() => window.__caught);
  check(order.length === 2 && order[0].n === 'Ada' && order[1].t - order[0].t > 250, 'on load, lights catch one after another in order', order.map((o) => o.n).join(' → ') + (order.length === 2 ? `, ${Math.round(order[1].t - order[0].t)}ms apart` : ''));

  // 5. duration choice, rename
  await b.page.click('.seg button[data-mode="hour"]');
  await b.page.waitForFunction(() => document.querySelector('.seg button[data-mode="hour"]').getAttribute('aria-pressed') === 'true');
  check(true, 'B: "1 hour" is chosen and saved for the circle');
  await b.page.click('#b-edit'); await b.page.fill('#edit-name', 'Ben'); await b.page.click('#edit-form button[type="submit"]');
  check(await a.page.waitForFunction(() => [...document.querySelectorAll('#hill .who')].some((e) => e.textContent === 'Ben'), null, { timeout: 9000 }).then(() => true, () => false), 'A sees B rename');

  // 6. snuff
  await a.page.waitForTimeout(800);
  await a.page.click('#my-light');
  check(await waitState(a, 'Ada', 'dark', 4000), 'A: tap again snuffs');
  check(await waitState(b, 'Ada', 'dark'), 'B sees A go dark');
  check((await stateOf(b, 'Ada')).since === 'not lit', 'B: reads "not lit" again');

  // 7. the connection drops on B
  await b.context.setOffline(true);
  check(await b.page.waitForFunction(() => document.getElementById('status').dataset.conn === 'off', null, { timeout: 15000 }).then(() => true, () => false), 'B offline: the ember goes out');
  const lost = await b.page.evaluate(() => ({ hidden: document.getElementById('lost').hidden, text: document.getElementById('lost').textContent, states: [...document.querySelectorAll('#hill li')].map((li) => li.dataset.state + ':' + li.querySelector('.since').textContent), ember: getComputedStyle(document.querySelector('.ember')).backgroundColor }));
  check(!lost.hidden && /cannot see the circle right now/.test(lost.text), 'B offline: the page says it cannot see the circle');
  check(lost.states.every((s) => s === 'unknown:cannot see'), 'B offline: every window reads "cannot see", not "not lit"', lost.states.join(', '));
  check(/rgba\(0, 0, 0, 0\)|transparent/.test(lost.ember), 'B offline: the ember has no glow');
  await shot(b, '5-b-offline');
  await b.page.click('#my-light');
  check((await b.page.textContent('#toast')).includes('Not connected'), 'B offline: tapping my light says it cannot change');
  await b.context.setOffline(false);
  check(await b.page.waitForFunction(() => document.getElementById('status').dataset.conn === 'on', null, { timeout: 15000 }).then(() => true, () => false), 'B back online: the ember relights');
  check((await stateOf(b, 'Ben')).state === 'lit' && (await stateOf(b, 'Ada')).state === 'dark', 'B back online: real states return');

  // 8. drum weave, share, home screen
  const drum = await a.page.getAttribute('#b-drum', 'href');
  check(/^\/drum-room-v2\?room=light-[0-9a-f]{20}$/.test(drum) && !drum.includes(link.slice(-32)), 'the drum link opens this circle\'s room and does not contain the circle id', drum);
  await a.page.click('#b-share');
  check(await a.page.inputValue('#share-link') === link, 'share shows the circle link');
  await a.page.click('#d-share [data-close]');
  const manifest = await a.page.evaluate(() => fetch(document.querySelector('link[rel="manifest"]').href).then((r) => r.json()));
  check(manifest.start_url === new URL(link).pathname && manifest.display === 'standalone', 'the manifest starts at this circle, standalone');

  // 9. this device remembers; leave forgets
  await a.page.goto(`${base}/light/`);
  check((await a.page.textContent('#mine-list')).includes('Ada'), 'the landing lists this device\'s circle');
  await a.page.goto(link);
  await a.page.waitForSelector('#my-light');
  check(true, 'A returns to the circle already known as Ada');
  await a.page.click('#b-leave'); await Promise.all([a.page.waitForURL(/\/light\/$/), a.page.click('#leave-forget')]);
  await a.page.goto(link);
  await a.page.waitForSelector('#view-join:not([hidden])');
  check((await a.page.textContent('#claim-list')).includes('I am Ada'), 'after "forget this device" the light is still there to reclaim');
  await a.page.click('#claim-list button');
  await a.page.waitForSelector('#my-light');

  // 10. put out the circle
  await a.page.click('#b-putout'); await a.page.click('#putout-go');
  await a.page.waitForSelector('#view-gone:not([hidden])');
  check(true, 'A: put out, with a confirm, shows the circle is gone');
  check(await b.page.waitForSelector('#view-gone:not([hidden])', { timeout: 9000 }).then(() => true, () => false), 'B sees the circle is gone');
  await shot(b, '6-gone');
  const again = await a.page.evaluate((id) => fetch('/api/light', { headers: { 'X-Light-Circle': id } }).then((r) => r.status), link.slice(-32));
  check(again === 404, 'the API has nothing left for that link');

  check(errors.length === 0, 'no JavaScript errors on either phone', errors.join(' | '));
} catch (error) {
  check(false, 'run completed', String(error?.stack || error));
} finally {
  await browser.close();
}
console.log(`\n${passed} passed, ${failedCount} failed`);
process.exit(failedCount ? 1 : 0);
