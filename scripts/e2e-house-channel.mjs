#!/usr/bin/env node
// Two-screen check for House Channel: one browser context as the TV
// (1280x720), one as a phone (390x844), against scripts/house-dev.mjs.
//
//   node scripts/e2e-house-channel.mjs [--fixtures] [--shots=/tmp/house-shots]
//
// Needs Playwright and a Chrome binary; neither is a repo dependency:
//   PLAYWRIGHT_PATH=/path/to/node_modules/playwright CHROME_PATH=/usr/bin/google-chrome
// Pairs, lights the hearth from the phone, checks the TV answered, walks the
// views, turns sound on, joins a second phone, ends the session, and fails on
// any page error or console error.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fixtures = process.argv.includes('--fixtures');
// --strict-audio: headless Chrome does not enforce the autoplay rule, so this stands in for it on the TV page:
// the AudioContext reads as suspended until the page itself has had a press, as a phone or TV browser would.
const strictAudio = process.argv.includes('--strict-audio');
const shots = (process.argv.find((a) => a.startsWith('--shots=')) || '').slice(8);
const port = 8796 + Math.floor(Math.random() * 200);
const base = `http://127.0.0.1:${port}`;
if (shots) mkdirSync(shots, { recursive: true });

const server = spawn(process.execPath, ['scripts/house-dev.mjs', String(port), ...(fixtures ? ['--fixtures'] : [])], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok, bad) => { server.stdout.once('data', ok); server.once('exit', () => bad(new Error('dev server exited'))); });

const errors = [];
const watch = (page, name) => {
  page.on('pageerror', (e) => errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // the dev server answers 404 for endpoints it does not have; the pages are meant to cope with that
    if (/Failed to load resource/.test(text) && /404/.test(text)) return;
    errors.push(`${name} console: ${text}`);
  });
};
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
const log = (...a) => console.log('  ', ...a);
const shot = async (page, name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
try {
  const tvCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const tv = await tvCtx.newPage(); watch(tv, 'tv');
  if (strictAudio) await tv.addInitScript(() => {
    const Real = window.AudioContext;
    let pressed = false;
    ['click', 'keydown'].forEach((n) => window.addEventListener(n, (e) => { if (e.isTrusted) pressed = true; }, true));
    window.AudioContext = class extends Real { get state() { return pressed ? super.state : 'suspended'; } };
  });
  const phone = await phoneCtx.newPage(); watch(phone, 'phone');
  const tvState = () => tv.evaluate(() => { const h = window.__house; return { view: h.S.state && h.S.state.view, fire: h.fire(), phones: Object.keys(h.S.phones).length, sound: h.S.state && h.S.state.sound, needTap: h.A.needTap, audio: h.A.ctx ? h.A.ctx.state : 'none', ended: h.S.ended, pairHidden: document.getElementById('pair').hidden, blackHidden: document.getElementById('black').hidden, sky: h.S.live, lights: h.S.lightsStatus, members: h.S.members.length, drumOn: !!(h.S.drumRoom && h.S.drumRoom.on), hits: h.S.drumHits.length, flare: h.S.flare, session: !!h.S.session }; });
  const phoneView = () => phone.evaluate(() => window.__remote.st);

  await tv.goto(`${base}/house/`);
  await tv.waitForFunction(() => /^[A-Z]{5}$/.test(document.getElementById('pairCode').textContent));
  const code = await tv.textContent('#pairCode');
  log('TV shows code', code, '|', await tv.textContent('#pairNote'));
  assert.equal((await tvState()).audio, 'none', 'the TV makes no sound object until asked');
  await shot(tv, '1-tv-pairing');

  await phone.goto(`${base}/house/r/`);
  await phone.fill('#code', 'ZZZZZ'); await phone.click('#joinBtn');
  await phone.waitForFunction(() => document.getElementById('joinErr').textContent.length > 0);
  log('wrong code:', await phone.textContent('#joinErr'));
  await phone.fill('#code', code.toLowerCase()); await phone.click('#joinBtn');
  await phone.waitForFunction(() => window.__remote.st && window.__remote.st.phones === 1);
  let t = await tvState();
  assert.deepEqual([t.phones, t.pairHidden, t.view], [1, true, 'hearth']);
  log('paired:', await phone.textContent('#statusText'));

  // hearth: two logs, hold to light, the TV answers
  await phone.click('#stack'); await phone.click('#stack');
  await phone.click('#minutes button[data-m="15"]');
  await phone.waitForFunction(() => window.__remote.st.hearth.logs === 2 && window.__remote.st.hearth.minutes === 15);
  const box = await phone.locator('#fire').boundingBox();
  await phone.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await phone.mouse.down(); await phone.waitForTimeout(2000); await phone.mouse.up();
  await tv.waitForFunction(() => window.__house.fire().lit === true);
  t = await tvState();
  log('TV fire:', t.fire.phase, 'remaining', Math.round(t.fire.remainingMs / 1000), 's');
  assert.equal(t.fire.phase, 'catching');
  await phone.waitForFunction(() => window.__remote.st.hearth.phase === 'catching');
  await phone.mouse.down(); await phone.waitForTimeout(900);
  assert.ok((await tvState()).flare > 0.2, 'breath reaches the TV');
  await phone.mouse.up();
  await shot(tv, '2-tv-hearth'); await shot(phone, '2-phone-hearth');

  // sound: asked for from the phone, made on the TV
  await phone.click('#soundBtn');
  await phone.waitForFunction(() => window.__remote.st.sound.on === true);
  await tv.waitForTimeout(900);
  t = await tvState();
  log('sound on → TV audio', t.audio, '| TV asks for a local press:', t.needTap, '| phone says:', (await phone.textContent('#soundText')).slice(0, 60));
  if (strictAudio) assert.equal(t.needTap, true, 'with a strict autoplay policy the TV must ask for a press');
  if (t.needTap) {
    assert.equal(await tv.isVisible('#tap'), true);
    assert.equal((await phoneView()).sound.needTap, true, 'the phone is told the TV needs a press');
    await tv.click('#tap');
    await tv.waitForFunction(() => window.__house.A.ctx.state === 'running' && !window.__house.A.needTap);
    log('after a press on the TV: audio', (await tvState()).audio);
  }
  await phone.fill('#vol', '20'); await phone.dispatchEvent('#vol', 'change');
  await phone.click('#muteBtn');
  await tv.waitForFunction(() => window.__house.S.state.sound.vol === 20 && window.__house.S.state.sound.muted === true);

  // a second phone joins with the same code
  const phone2 = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage(); watch(phone2, 'phone2');
  await phone2.goto(`${base}/house/r/`);
  await phone2.fill('#code', code); await phone2.click('#joinBtn');
  await phone.waitForFunction(() => window.__remote.st.phones === 2);
  log('second phone joined:', await phone2.textContent('#statusText'));

  // window
  await phone2.click('.tabs [data-view="window"]');
  await tv.waitForFunction(() => window.__house.S.state.view === 'window' && window.__house.S.live && window.__house.S.live.tried);
  await phone.waitForFunction(() => window.__remote.st.sky.status !== 'wait');
  const sky = (await phoneView()).sky;
  log('window status:', sky.status, '|', await phone.textContent('#skyText'));
  assert.equal(sky.status, fixtures ? 'live' : 'sim', fixtures ? 'fixture data reads as live' : 'no weather source in dev, so it must say simulated');
  if (!fixtures) {
    await phone.fill('#simCloud', '90'); await phone.dispatchEvent('#simCloud', 'change');
    await tv.waitForFunction(() => window.__house.S.state.sky.sim.cloud === 90);
  }
  await phone.click('#places [data-p="san-pedro"]');
  await tv.waitForFunction(() => window.__house.S.state.sky.place === 'san-pedro');
  await tv.waitForTimeout(1300);
  await shot(tv, '3-tv-window'); await shot(phone, '3-phone-window');

  // lights
  await phone.click('.tabs [data-view="lights"]');
  await tv.waitForFunction(() => window.__house.S.lightsStatus === (window.__house.S.lightApi === true ? 'none' : 'demo') && typeof window.__house.S.lightApi === 'boolean');
  t = await tvState();
  log('lights status:', t.lights, 'windows', t.members);
  if (fixtures) {
    await phone.fill('#circle', 'nonsense'); await phone.click('#circleSet');
    assert.match(await phone.textContent('#circleErr'), /circle link/);
    await phone.fill('#circle', 'https://pointcast.xyz/light/c/f1x7ur3f1x7ur3f1x7ur3f1x7ur3f1x7'); await phone.click('#circleSet');
    await tv.waitForFunction(() => window.__house.S.lightsStatus === 'live' && window.__house.S.members.length === 3);
    assert.equal(await phone.inputValue('#circle'), '', 'the link is not kept in the field');
    assert.equal(await tv.evaluate(() => (sessionStorage.getItem('hc.tv.v0') || '').includes('f1x7ur3')), false, 'the TV does not write the link down');
  } else {
    assert.deepEqual([t.lights, t.members], ['demo', 7]);
    await phone.waitForFunction(() => window.__remote.st.lights.status === 'demo');
  }
  await tv.waitForTimeout(1200);
  await shot(tv, '4-tv-lights');

  // drum: pads on the phone, the existing drum room in the middle, the TV shows and sounds it
  await phone.click('.tabs [data-view="drum"]');
  await tv.waitForFunction(() => window.__house.S.drumRoom && window.__house.S.drumRoom.on);
  await phone.waitForFunction(() => window.__remote.drum && window.__remote.drum.on);
  await phone.locator('.pad').nth(0).dispatchEvent('pointerdown'); await phone.locator('.pad').nth(1).dispatchEvent('pointerdown');
  await tv.waitForFunction(() => window.__house.S.drumHits.length >= 2);
  log('drum: TV heard', (await tvState()).hits, 'hits; link', await phone.getAttribute('#drumLink', 'href'));
  await shot(tv, '5-tv-drum'); await shot(phone, '5-phone-drum');

  // off is black, and waking works
  await phone.click('.tabs [data-view="off"]');
  await tv.waitForFunction(() => !document.getElementById('black').hidden);
  await shot(tv, '6-tv-off');
  await phone.click('.tabs [data-view="hearth"]');
  await tv.waitForFunction(() => document.getElementById('black').hidden);
  // the lid
  await phone.waitForFunction(() => window.__remote.st.view === 'hearth' && !document.getElementById('p-hearth').hidden);
  const grip = await phone.locator('#lidGrip').boundingBox();
  await phone.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2); await phone.mouse.down();
  await phone.mouse.move(grip.x + grip.width / 2, grip.y - 100, { steps: 6 }); await phone.mouse.up();
  await tv.waitForFunction(() => window.__house.fire().phase === 'snuffed');
  log('lid on: TV fire', (await tvState()).fire.phase);

  // a reload keeps the pairing and comes back silent
  await tv.reload();
  await tv.waitForFunction(() => window.__house.S.session && Object.keys(window.__house.S.phones).length >= 1, null, { timeout: 20000 });
  t = await tvState();
  assert.deepEqual([t.pairHidden, t.sound.on], [true, false]);
  log('TV reloaded: still paired, sound back off');

  // end
  await phone.click('#end'); await phone.click('#end');
  await phone.waitForFunction(() => !document.getElementById('ended').hidden);
  await phone2.waitForFunction(() => !document.getElementById('ended').hidden);
  await tv.waitForFunction(() => window.__house.S.ended === true && !document.getElementById('black').hidden && !window.__house.S.session);
  assert.equal(await tv.evaluate(() => sessionStorage.getItem('hc.tv.v0')), null);
  assert.equal(await phone.evaluate(() => sessionStorage.getItem('hc.remote.v0')), null);
  const after = await (await fetch(`${base}/api/house`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'join', code }) })).json();
  assert.equal(after.error, 'no-such-code', 'the code is dead after End');
  log('ended:', await phone.textContent('#endedText'));
  await shot(tv, '7-tv-ended');

  assert.deepEqual(errors, [], 'no page errors and no console errors');
  console.log(`House Channel two-screen check passed${fixtures ? ' (fixtures)' : ''}.`);
} catch (error) {
  console.error(error);
  if (errors.length) console.error('page errors:', errors);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill();
}
