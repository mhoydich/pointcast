import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanSignal, handleBand } from '../functions/api/band.ts';

class Store {
  data = new Map();
  async get(key, type) { const v = this.data.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; }
  async put(key, value) { this.data.set(key, value); }
}
const env = () => ({ VISITS: new Store(), PC_RATES_KV: new Store() });
const NOW = new Date('2026-09-25T04:00:00Z'); // 9 PM in El Segundo, Sept 24
const post = (body, ip = '192.0.2.1') => new Request('https://pointcast.xyz/api/band', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) });
const get = (ip = '192.0.2.1') => new Request('https://pointcast.xyz/api/band', { headers: { 'CF-Connecting-IP': ip } });

test('a signal is keyed, shown to everyone, and moving it keeps one station per listener', async () => {
  const e = env();
  let res = await handleBand(post({ action: 'signal', step: 131, text: 'hi from the pier', call: 'PC4-CMR', avatar: 233 }), e, NOW);
  assert.equal(res.status, 201);
  res = await handleBand(post({ action: 'signal', step: 140, text: 'moved up', call: 'PC4-CMR', avatar: 233 }), e, NOW);
  const mine = await (await handleBand(get(), e, NOW)).json();
  assert.equal(mine.date, '2026-09-24');
  assert.equal(mine.signals.length, 1);
  assert.equal(mine.signals[0].text, 'MOVED UP');
  assert.equal(mine.signals[0].step, 140);
  assert.equal(mine.signals[0].mine, true);
  assert.equal('owner' in mine.signals[0], false);
  const theirs = await (await handleBand(get('198.51.100.7'), e, NOW)).json();
  assert.equal(theirs.signals[0].mine, false);
});

test('signals are Morse-safe, short, and keep the worst words off the air', () => {
  assert.equal(cleanSignal('  73  de   el segundo '), '73 DE EL SEGUNDO');
  assert.throws(() => cleanSignal('hello!'), /letters, numbers and spaces/);
  assert.throws(() => cleanSignal('x'.repeat(25)), /24 characters/);
  assert.throws(() => cleanSignal('f u c k'), /off the air/);
  assert.throws(() => cleanSignal(''), /Say something/);
});

test('hearing a signal counts once per listener and never your own', async () => {
  const e = env();
  const made = await (await handleBand(post({ action: 'signal', step: 90, text: 'CQ', call: 'PC1-ABC' }), e, NOW)).json();
  const id = made.signals[0].id;
  await handleBand(post({ action: 'heard', id }), e, NOW);
  await handleBand(post({ action: 'heard', id }, '198.51.100.7'), e, NOW);
  await handleBand(post({ action: 'heard', id }, '198.51.100.7'), e, NOW);
  const day = await (await handleBand(get(), e, NOW)).json();
  assert.equal(day.signals[0].heard, 1);
});

test('fox copies and net check-ins count each listener once and show call signs only', async () => {
  const e = env();
  await handleBand(post({ action: 'fox', call: 'PC1-ABC', avatar: 5, with: 3 }), e, NOW);
  await handleBand(post({ action: 'fox', call: 'PC1-ABC', avatar: 5 }), e, NOW);
  await handleBand(post({ action: 'fox', call: 'PC2-DEF', avatar: 6 }, '198.51.100.7'), e, NOW);
  await handleBand(post({ action: 'net', call: 'PC2-DEF', avatar: 6 }, '198.51.100.7'), e, NOW);
  const day = await (await handleBand(get(), e, NOW)).json();
  assert.equal(day.fox.copies, 2);
  assert.deepEqual(day.fox.recent.map((m) => m.call), ['PC2-DEF', 'PC1-ABC']);
  assert.equal(day.fox.recent[1].with, 3);
  assert.equal(day.net.checkins, 1);
  assert.equal(JSON.stringify(day).includes('owner'), false);
});

test('writes are rate limited per address per day and bad actions are refused', async () => {
  const e = env();
  let last;
  for (let i = 0; i < 41; i++) last = await handleBand(post({ action: 'signal', step: 10, text: `N ${i}` }), e, NOW);
  assert.equal(last.status, 429);
  assert.equal((await handleBand(post({ action: 'mint' }), e, NOW)).status, 400);
  assert.equal((await handleBand(new Request('https://pointcast.xyz/api/band', { method: 'DELETE' }), e, NOW)).status, 405);
  assert.equal((await handleBand(get(), { }, NOW)).status, 503);
});
