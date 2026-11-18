/** Browser-only fixtures for room sound and optional live updates. No network access. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PROGRESS_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PROGRESS_PLAYWRIGHT_MODULE).href : 'playwright-core');
const root = new URL('../', import.meta.url);
const origin = 'http://office.test';
const now = Date.parse('2026-11-17T18:00:00Z');
const stamp = time => new Date(time).toISOString();
function event(sequence, roomAddress = '#officenoun-tasks') {
  const roomKey = (roomAddress === '#officenoun-tasks' ? 'a' : 'b').repeat(24);
  const messageId = 'm_test' + String(sequence).padStart(6, '0');
  const id = roomKey + '#' + messageId;
  return { id, messageId, roomKey, roomAddress, handle: '@sol-1',
    type: 'post', at: stamp(now + sequence * 1000),
    sourceUrl: 'https://pointcast.xyz/loom?to=' + encodeURIComponent('loom:' + id) };
}

function snapshot(events, state = 'ok') {
  const observedAt = stamp(now + 60000 + events.length * 1000);
  const last = events.at(-1);
  return {
    schema: 'pointcast.office-view/v1', state, observedAt, expiresAt: '2026-11-18T17:24:00Z',
    desks: [{handle: '@sol-1', name: 'Fixture desk', eligible: true, lifecycle: 'Fixture',
      artNote: '', facts: {lastPostAt: last?.at, postUrl: last?.sourceUrl, asOf: observedAt, stale: false}}],
    events, edges: [], merges: [], blocked: [], evidenceFresh: true, trackedPrs: [],
    errors: state === 'degraded' ? ['source_unavailable'] : []
  };
}

const html = (await readFile(new URL('src/pages/office.astro', root), 'utf8'))
  .replace(/^---[\s\S]*?---\s*/, '').replace('{title}', 'The Office').replace(' is:inline', '');
const mediaTypes = {'.mjs':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml'};
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']
});
const page = await browser.newPage({viewport: {width:390, height:844}, reducedMotion:'no-preference'});
const errors = [], rejectedRequests = [];
let reads = 0, httpStatus = 200, data = snapshot([event(0)]);
page.on('pageerror', e => errors.push(String(e)));

try {
  await page.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (req.method() !== 'GET' || url.origin !== origin) {
      rejectedRequests.push(req.method() + ' ' + req.url());
      return route.abort();
    }
    if (url.pathname === '/api/office') {
      reads++;
      return route.fulfill({status:httpStatus, json:data});
    }
    if (url.pathname === '/office') return route.fulfill({contentType:'text/html',body:html});
    if (url.pathname.startsWith('/office/') || url.pathname.startsWith('/images/ufogp/')) {
      const file = new URL('public' + url.pathname,root);
      return route.fulfill({contentType:mediaTypes[extname(file.pathname)],body:await readFile(file)});
    }
    return route.fulfill({status:404,body:''});
  });
  await page.addInitScript(() => {
    window.__tones = [];
    // OfflineAudioContext supplies real GainNode/AudioParam implementations, without an output device.
    window.AudioContext = class extends OfflineAudioContext {
      constructor() { super(1, 44100, 44100); }
      get state() { return 'running'; }
      async resume() {}
      async close() {}
      createOscillator() {
        const oscillator = super.createOscillator();
        const start = oscillator.start.bind(oscillator);
        oscillator.start = (...args) => { window.__tones.push(oscillator.frequency.value); return start(...args); };
        return oscillator;
      }
    };
  });
  await page.clock.install({time:new Date(now - 1000)});
  await page.clock.pauseAt(new Date(now));
  const watch = page.locator('#office-watch'), sound = page.locator('#office-sound');
  const refresh = page.locator('#office-refresh');
  const tones = () => page.evaluate(() => window.__tones.length);
  const pressed = button => button.getAttribute('aria-pressed');
  async function readAfter(trigger) {
    const response = page.waitForResponse(origin + '/api/office', {timeout:3000});
    await trigger();
    await (await response).finished();
    await page.waitForFunction(() => !document.querySelector('#office-status').textContent.includes('Reading public sources'), null, {timeout:3000});
  }
  const readManually = () => readAfter(() => refresh.dispatchEvent('click'));
  const nextPoll = () => readAfter(() => page.clock.fastForward(60000));
  async function setVisibility(hidden) {
    await page.evaluate(value => {
      Object.defineProperty(document, 'hidden', {value, configurable:true});
      Object.defineProperty(document, 'visibilityState', {value:value?'hidden':'visible', configurable:true});
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  }
  await readAfter(() => page.goto(origin + '/office'));
  assert.equal(await pressed(watch), 'false');
  assert.equal(await pressed(sound), 'false');
  assert.equal(await tones(), 0, 'initial snapshot must be silent');
  await page.clock.fastForward(120000);
  assert.equal(reads, 1, 'no auto reads by default');

  data = snapshot([event(0),event(1)]);
  await readManually();
  assert.equal(await tones(), 0, 'a new event stays silent before opt-in');
  await sound.press('Space');
  assert.equal(await pressed(sound), 'true');
  await readManually();
  assert.equal(await tones(), 0, 'unchanged facts must not make sound');
  data = snapshot([event(0),event(1),event(2)]);
  await readManually();
  const heard = await tones();
  assert.ok(heard > 0, 'an unseen event must make a tone');
  await readManually();
  assert.equal(await tones(), heard, 'the repeated event must be silent');
  data = snapshot([event(2),event(3),event(4),event(5,'@sol-1')]);
  await readManually();
  const afterRooms = await tones();
  assert.equal(afterRooms, heard + 2, 'one cue per room for three arrivals in two rooms');
  const pitches = await page.evaluate(() => window.__tones.slice(-2));
  assert.notEqual(pitches[0], pitches[1], 'the task board and desk inbox must sound different');
  for (const recent of [event(4), event(5,'@sol-1')]) {
    const receipt = page.locator('#office-events').getByRole('link').filter({hasText: ' · ' + recent.roomAddress + ' · '}).first();
    assert.ok(await receipt.isVisible(), recent.roomAddress + ' must be visible as a room label');
    assert.equal(await receipt.getAttribute('href'), recent.sourceUrl);
  }
  await sound.press('Space');
  data = snapshot([event(5,'@sol-1'),event(6)]);
  await readManually();
  assert.equal(await tones(), afterRooms, 'muting must silence future events');

  await watch.press('Space');
  assert.equal(await pressed(watch), 'true');
  const beforePoll = reads;
  await page.clock.fastForward(59000);
  assert.equal(reads, beforePoll, 'no early poll');
  await readAfter(() => page.clock.fastForward(1000));
  assert.equal(reads,beforePoll + 1,'one visible poll after one minute');
  await setVisibility(true);
  const beforeHide = reads;
  await page.clock.fastForward(180000);
  assert.equal(reads,beforeHide,'hidden page must not poll');
  await setVisibility(false);
  await nextPoll();
  await watch.press('Space');
  const beforeStop = reads;
  await page.clock.fastForward(120000);
  assert.equal(reads,beforeStop,'turning off the watch must stop polls');

  for (const failure of ['degraded','http-error','ended']) {
    await watch.press('Space');
    data = snapshot([], failure === 'http-error' ? 'ok' : failure);
    httpStatus = failure === 'http-error' ? 503 : 200;
    await nextPoll();
    assert.equal(await pressed(watch),'false',failure + ' must turn off the watch');
    const after = reads;
    await page.clock.fastForward(120000);
    assert.equal(reads,after,failure + ' must not retry automatically');
    assert.equal(await tones(),afterRooms);
    if (failure !== 'ended') {
      httpStatus = 200;
      data = snapshot([event(3)]);
      await readManually();
    }
  }
  assert.equal(await refresh.isDisabled(), true, 'no further manual reads after experiment end');
  assert.deepEqual(errors,[]);
  assert.deepEqual(rejectedRequests,[]);
  console.log('PASS: muted default, opt-in sound, deduplication, manual mute, 60s visible polling, opt-out, stop on degraded/error/end. Fixtures only.');
} finally {
  await browser.close();
}
