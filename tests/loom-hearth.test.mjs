// Loom v2 Hearth (H-2 to H-4): fires from the directory, the "while you were out" line, the room view.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flameSvg, fireSize, paletteFor, ago, hearthFromDirectory, whileYouWereOut, roomView, esc, MAX_FIRES } from '../src/lib/loom/hearth.mjs';

const NOW = Date.parse('2026-11-21T19:00:00.000Z');
const hAgo = (h) => new Date(NOW - h * 3600000).toISOString();
const human = (name) => ({ name, kind: 'human' });
const agent = (name) => ({ name, kind: 'agent' });
const COLLATOR = { name: 'Collator', kind: 'robot', address: '@collator' };
const room = (address, h, last, extra = {}) => ({ address, kind: address.startsWith('@') ? 'handle' : 'topic', label: address, updatedAt: hAgo(h), count: 3, last, ...extra });

test('fire size steps down with age and becomes an ember after three days', () => {
  assert.equal(fireSize(hAgo(1), NOW), 64);
  assert.equal(fireSize(hAgo(6), NOW), 56);
  assert.equal(fireSize(hAgo(20), NOW), 40);
  assert.equal(fireSize(hAgo(48), NOW), 32);
  assert.equal(fireSize(hAgo(80), NOW), null);
});

test('warm only when a person spoke last; bots and the Collator are pilot', () => {
  assert.equal(paletteFor(human('mike')), 'warm');
  assert.equal(paletteFor(agent('Duet')), 'pilot');
  assert.equal(paletteFor(COLLATOR), 'pilot');
  assert.equal(paletteFor(undefined), 'pilot');
});

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

test('directory: only rooms, newest first, capped fires, recent quiet rooms as embers', () => {
  const logs = [
    room('#music', 5, human('Grace')),
    room('#loom-v2', 1, agent('Duet')),
    { address: 'https://example.com/a', kind: 'url', updatedAt: hAgo(0.5), last: human('x') },
    room('#pickleball', 100, human('mike')),
    room('#ancient', 24 * 30, human('mike')),
    room('@shwa', 2, COLLATOR),
  ];
  const { fires, embers } = hearthFromDirectory(logs, NOW);
  assert.deepEqual(fires.map((f) => f.name), ['#loom-v2', '@shwa', '#music']);
  assert.equal(fires[0].palette, 'pilot');
  assert.equal(fires[2].palette, 'warm');
  assert.equal(fires[1].lastName, null, 'the Collator is never named as the last speaker');
  assert.equal(fires[0].href, '/loom/hearth/room?to=%23loom-v2');
  assert.deepEqual(embers.map((e) => e.name), ['#pickleball']);
  const many = Array.from({ length: 20 }, (_, i) => room(`#r${i}`, 1 + i / 10, agent('a')));
  assert.equal(hearthFromDirectory(many, NOW).fires.length, MAX_FIRES);
});

test('while you were out never says zero and names people when they spoke', () => {
  const { fires } = hearthFromDirectory([room('#music', 2, human('Grace')), room('#loom-v2', 1, agent('Duet'))], NOW);
  const out = whileYouWereOut(fires, { seenAt: hAgo(3), now: NOW });
  assert.equal(out.lead, 'WHILE YOU WERE OUT');
  assert.match(out.line, /^2 fires moved\. #loom-v2 is the brightest, Duet spoke last\. Grace was at the fire\.$/);
  const quiet = whileYouWereOut(fires, { seenAt: hAgo(0.5), now: NOW });
  assert.match(quiet.line, /^Quiet since you last looked\. The last fire to move was #loom-v2, an hour ago\.$/);
  const bots = whileYouWereOut(hearthFromDirectory([room('#t', 1, agent('Duet'))], NOW).fires, { now: NOW });
  assert.equal(bots.lead, 'TODAY ON THE LOOM');
  assert.match(bots.line, /^One fire moved\..*Only bots spoke\.$/);
  assert.doesNotMatch(whileYouWereOut([], { now: NOW }).line, /\b0\b/);
  for (const o of [out, quiet, bots]) assert.doesNotMatch(o.line, /\b0\b/);
});

test('room view: people first, bots folded, Collator and echoes left out, three lines at most', () => {
  const msgs = [
    { id: 'a', at: hAgo(30), from: agent('Fable'), body: 'The plan.' },
    { id: 'b', at: hAgo(2), from: COLLATOR, body: 'Welcome' },
    { id: 'c', at: hAgo(2), from: agent('Duet'), body: 'No claim yet.' },
    { id: 'd', at: hAgo(1), from: human('mike'), body: 'ok go' },
    { id: 'e', at: hAgo(1), from: agent('Echo'), body: 'copied', via: { address: '#x' } },
  ];
  const v = roomView(msgs, { title: 'Loom v2', now: NOW });
  assert.ok(v.summary.length <= 3);
  assert.equal(v.summary[0], 'Loom v2');
  assert.match(v.summary[1], /^2 posts in the last day from 2 voices\.$/);
  assert.match(v.summary[2], /^mike said: ok go$/);
  assert.deepEqual(v.people.map((p) => p.id), ['d']);
  assert.deepEqual(v.bots.map((p) => p.id), ['c', 'a']);
  assert.equal(v.botCount, 2);
  const botsOnly = roomView(msgs.filter((m) => m.id !== 'd'), { now: NOW });
  assert.match(botsOnly.summary.at(-1), /^No person has spoken here yet\. Latest from Duet: No claim yet\.$/);
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
