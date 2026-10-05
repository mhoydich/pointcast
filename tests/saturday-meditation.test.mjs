import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSession, breathAt } from '../src/lib/saturday-session.mjs';

test('session counts real elapsed time and cannot advance while paused', () => {
  const session = createSession(180);
  assert.equal(session.snapshot(90000).state, 'idle');
  session.start(1000);
  assert.equal(session.snapshot(11000).remaining, 170);
  session.pause(21000);
  assert.equal(session.snapshot(999999).remaining, 160);
  session.start(1000000);
  assert.equal(session.snapshot(1005000).remaining, 155);
  assert.equal(session.snapshot(2000000).state, 'complete');
  assert.equal(session.snapshot(3000000).remaining, 0);
  assert.equal(session.reset(3000000).state, 'idle');
});

test('movement transitions and completion are bounded for every session duration', () => {
  for (const seconds of [180, 300, 480]) {
    const session = createSession(seconds);
    session.start(0);
    for (let phase = 0; phase < 4; phase++) assert.equal(session.snapshot(seconds * 1000 * phase / 4).movement, phase);
    const end = session.snapshot(seconds * 1000 + 10000);
    assert.equal(end.movement, 3);
    assert.equal(end.progress, 1);
    assert.equal(end.state, 'complete');
  }
  assert.throws(() => createSession(240), RangeError);
});

test('optional breath cue is continuous with a four-second inhale and six-second exhale', () => {
  assert.equal(breathAt(0).label, 'Breathe in');
  assert.equal(breathAt(4000).label, 'Breathe out');
  assert.equal(breathAt(4000).scale, 1.16);
  assert.ok(Math.abs(breathAt(9999).scale - 1) < .001);
  assert.equal(breathAt(10000).scale, 1);
});

test('dated edition keeps observation, forecast, provenance, and playback boundaries explicit', async () => {
  const page = await readFile(new URL('../src/pages/meditate/2026-10-03.astro', import.meta.url), 'utf8');
  const data = JSON.parse(await readFile(new URL('../src/data/saturday-meditation-2026-10-03.json', import.meta.url), 'utf8'));
  assert.equal(data.date, '2026-10-03');
  assert.equal(data.timeZone, 'America/Los_Angeles');
  assert.equal(data.weather.observedAt, '2026-10-03T08:53:00-07:00');
  assert.equal(data.weather.station, 'KLAX');
  assert.equal(data.weather.observedF, 87.1);
  assert.equal(data.weather.forecastHighF, null);
  assert.match(data.weather.forecastHighStatus, /could not be reconciled/);
  assert.equal(data.audio.exactRecordingIdentified, false);
  assert.equal(data.audio.hostedAudio, false);
  assert.match(page, /visibilitychange/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /<noscript>/);
  assert.match(page, /Read the full meditation/);
  assert.doesNotMatch(page, /<audio|<iframe|autoplay|localStorage|sessionStorage/);
});
