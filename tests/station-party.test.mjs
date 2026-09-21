// /station/party — a scripted prototype of ten listeners (2026-09-21). It must never pass for real data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/station/party.astro', import.meta.url), 'utf8');

test('the party page says it is a simulation, stays out of search, and touches no network or storage', () => {
  assert.match(page, /SIMULATION · no real listeners/);
  assert.match(page, /everything below is simulated/);
  assert.match(page, /<BlockLayout[^>]*\snoindex[\s>]/);
  assert.doesNotMatch(page, /\bfetch\(|WebSocket|localStorage|sessionStorage|sendBeacon|getUserMedia/);
});

test('the cast covers every rung of the sharing ladder, plus agents', () => {
  for (const tier of ['spotify', 'pasted', 'mic', 'tapped', 'silent', 'agent']) assert.match(page, new RegExp(`tier: '${tier}'`), tier);
  assert.match(page, /tempo only, no title/, 'the mic rung never pretends to know the song');
  assert.match(page, /Tempos are approximate/);
});

test('the simulation is deterministic and can be stepped without animation frames', () => {
  assert.match(page, /let seed = 20260921/); assert.match(page, /addEventListener\('pty:step'/);
  assert.doesNotMatch(page, /Math\.random\(/);
});
