import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrayerPlayback } from '../src/lib/prayer-playback.mjs';

function setup(state = 'suspended') {
  const instances = [];
  class Context {
    state = state;
    resumes = 0;
    constructor() { instances.push(this); }
    resume() { this.resumes++; return new Promise(resolve => { this.finish = () => { this.state = 'running'; resolve(); }; }); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  const scope = { AudioContext: Context, navigator: { audioSession: { type: 'auto' } } };
  return { instances, scope };
}

test('audio is lazy, requests playback mode, and waits for a resumed context', async () => {
  const { instances, scope } = setup();
  const player = createPrayerPlayback(scope);
  assert.equal(instances.length, 0);
  let finished = false;
  const ready = player.ready().then(a => { finished = true; return a; });
  assert.equal(scope.navigator.audioSession.type, 'playback');
  await Promise.resolve();
  assert.equal(finished, false);
  instances[0].finish();
  assert.equal(await ready, instances[0]);
  player.close();
});

test('an interrupted Safari context resumes on the next gesture', async () => {
  const { instances, scope } = setup('running');
  const player = createPrayerPlayback(scope);
  const a = await player.ready();
  a.state = 'interrupted';
  const ready = player.ready();
  assert.equal(a.resumes, 1);
  a.finish();
  assert.equal(await ready, a);
  assert.equal(instances.length, 1);
  player.close();
});

test('rejected resume is recoverable with a fresh context', async () => {
  const { instances, scope } = setup('running');
  const player = createPrayerPlayback(scope);
  const first = await player.ready();
  first.state = 'suspended';
  first.resume = () => Promise.reject(new Error('blocked'));
  await assert.rejects(player.ready(), /blocked/);
  assert.equal(first.state, 'closed');
  assert.notEqual(await player.ready(), first);
  assert.equal(instances.length, 2);
  player.close();
});

test('a hanging resume times out and cannot become a late successful playback', async () => {
  const { instances, scope } = setup();
  const player = createPrayerPlayback(scope, 5);
  await assert.rejects(player.ready(), /did not start/);
  assert.equal(instances[0].state, 'closed');
  instances[0].finish();
  const retry = player.ready();
  assert.equal(instances.length, 2);
  instances[1].finish();
  assert.equal(await retry, instances[1]);
  player.close();
});

test('leaving the page cancels pending playback even if resume later resolves', async () => {
  const { instances, scope } = setup();
  const player = createPrayerPlayback(scope);
  const pending = player.ready();
  player.close();
  instances[0].finish();
  await assert.rejects(pending, /paused/);
});

test('optional Audio Session restrictions do not break other browsers', async () => {
  const { scope } = setup('running');
  Object.defineProperty(scope.navigator.audioSession, 'type', { set() { throw new Error('unsupported'); } });
  scope.webkitAudioContext = scope.AudioContext;
  delete scope.AudioContext;
  const player = createPrayerPlayback(scope);
  assert.equal((await player.ready()).state, 'running');
  player.close();
  await assert.rejects(createPrayerPlayback({}).ready(), /not supported/);
});

test('a resolved resume must still reach running before returning a playable context', async () => {
  const { scope } = setup('running');
  const player = createPrayerPlayback(scope);
  const a = await player.ready();
  a.state = 'interrupted';
  a.resume = () => Promise.resolve();
  await assert.rejects(player.ready(), /paused/);
  assert.equal(a.state, 'closed');
});
