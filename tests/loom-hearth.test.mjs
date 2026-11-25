// Loom v2 Hearth (H-2 to H-4): fires from the directory, the "while you were out" line, the room view.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flameSvg, ago, roomHref, whileYouWereOut, roomView, esc } from '../src/lib/loom/hearth.mjs';

const NOW = Date.parse('2026-11-21T19:00:00.000Z');
const hAgo = (h) => new Date(NOW - h * 3600000).toISOString();
const human = (name) => ({ name, kind: 'human' });
const agent = (name) => ({ name, kind: 'agent' });
const COLLATOR = { name: 'Collator', kind: 'robot', address: '@collator' };
test('the flame is one decorative 8x12 svg, sized 1.5x tall, with a still option', () => {
  const svg = flameSvg(56, 'pilot');
  assert.match(svg, /viewBox="0 0 8 12"/);
  assert.match(svg, /width="56" height="84"/);
  assert.match(svg, /aria-hidden="true"/);
  assert.match(svg, /hearth-flicker/);
  assert.match(svg, /--hearth-pilot/);
  assert.doesNotMatch(flameSvg(40, 'warm', { still: true }), /hearth-flicker/);
  assert.match(flameSvg(99), /width="40"/, 'an unknown size falls back to 40');
});

test('the recap names an actual human even when an agent spoke last in a warm room', () => {
  const warm = { address: '#music', human: true, humanName: 'Grace', lastHumanAt: hAgo(3), lastName: 'Duet', lastAt: hAgo(1) };
  const pilot = { address: '#loom-v2', human: false, lastName: 'Ada', lastAt: hAgo(2) };
  const snapshot = { active: [warm, pilot], unavailable: [], since: Date.parse(hAgo(24)), asOf: NOW };
  assert.equal(whileYouWereOut(snapshot), 'Grace posted in #music, and agents kept #loom-v2 lit.');
  assert.equal(whileYouWereOut(snapshot, hAgo(2)), 'Duet added a log to #music.');
  assert.match(whileYouWereOut(snapshot, hAgo(.5)), /quiet since your last visit/);
  assert.match(whileYouWereOut({ active: [], unavailable: ['#miss'] }), /could only read part/);
  assert.match(whileYouWereOut({ ...snapshot, active: [] }), /quiet for the past day/);
  assert.match(whileYouWereOut({ ...snapshot, active: [] }, hAgo(48)), /quiet for the past day/);
  assert.equal(roomHref('#loom-v2'), '/loom/hearth/room?to=%23loom-v2');
});

test('room recaps attribute direct human and agent posts; system and mirrored copies stay on the classic reader', () => {
  const msgs = [
    { id: 'h', seq: 6, at: hAgo(1), from: human('mike'), body: 'I reviewed it.' },
    { id: 'a', seq: 1, at: hAgo(30), from: agent('Fable'), body: 'The plan.' },
    { id: 'b', seq: 3, at: hAgo(2), from: COLLATOR, body: 'Welcome' },
    { id: 'c', seq: 2, at: hAgo(2), from: agent('Duet'), body: 'I took H-4.' },
    { id: 'd', seq: 5, at: hAgo(1), from: human('mike'), body: 'ok go', via: { address: '#ux' } },
    { id: 'e', seq: 4, at: hAgo(1), from: agent('Echo'), body: 'copied', via: { address: '#ux' } },
  ];
  const v = roomView(msgs, { now: NOW });
  assert.deepEqual(v.summary.map(line => line.text), ['mike and 1 bot spoke.']);
  assert.deepEqual(v.people.map(p => p.id), ['h']);
  assert.deepEqual(v.bots.map(p => p.id), ['c', 'a']);
  assert.equal(v.botCount, v.bots.length);
  assert.deepEqual(roomView([]).summary.map(line => line.text), ['Quiet in the last day.']);
});

test('room notes stay in the posts while the summary describes recent activity', () => {
  const msgs = [
    { seq: 1, from: agent('Desk'), body: 'This was the opener.' },
    { seq: 2, from: { ...agent('Editor'), verified: true }, body: 'ROOM NOTE\nFirst line\nSecond line\nThird line' },
    { seq: 3, from: agent('Desk'), body: 'ROOM NOTE\nNewer unverified note' },
  ];
  const view = roomView(msgs, { log: { kind: 'topic', trimmedBefore: 9 }, now: NOW });
  assert.deepEqual(view.summary.map(line => line.text), ['2 bots spoke.']);
  assert.equal(view.bots.length, 3);
});

test('ago reads like a person and esc neutralises markup', () => {
  assert.equal(ago(hAgo(0.01), NOW), 'just now');
  assert.equal(ago(hAgo(0.5), NOW), '30 minutes ago');
  assert.equal(ago(hAgo(30), NOW), 'yesterday');
  assert.equal(ago(hAgo(24 * 4), NOW), '4 days ago');
  assert.equal(esc('<b a="1">&\'</b>'), '&lt;b a=&quot;1&quot;&gt;&amp;&#39;&lt;/b&gt;');
});

test('the hearth pages sit beside /loom and the classic page is untouched', () => {
  for (const p of ['index', 'room', 'flame', 'lend']) {
    const src = readFileSync(new URL(`../src/pages/loom/hearth/${p}.astro`, import.meta.url), 'utf8');
    assert.match(src, /HearthLayout/);
  }
  const classic = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(classic, /hearth\.css|HearthLayout|lib\/loom\/hearth/, 'the classic page does not load Hearth');
  const css = readFileSync(new URL('../src/styles/hearth.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /^\.hearth[ ,{:]/m, 'no bare .hearth selector, which the classic page already uses');
});
