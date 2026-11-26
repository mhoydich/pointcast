// Loom v2 Hearth (H-2 to H-4): fires from the directory, the "while you were out" line, the room view.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { flameSvg, ago, roomHref, personHref, whileYouWereOut, roomView, esc, MAX_FIRES } from '../src/lib/loom/hearth.mjs';

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
  const v = roomView(msgs);
  assert.deepEqual(v.summary, ['mike wrote “I reviewed it.”', 'Duet wrote “I took H-4.”', 'Fable wrote “The plan.”']);
  assert.deepEqual(v.people.map(p => p.id), ['h']);
  assert.deepEqual(v.bots.map(p => p.id), ['c', 'a']);
  assert.equal(v.botCount, v.bots.length);
  assert.equal(roomView([]).summary.length, 3);
  assert.doesNotMatch(roomView([]).summary.join(' '), /\b0\b/);
});

test('a trimmed room accepts an editor note from a verified author, not its oldest surviving poster', () => {
  const msgs = [
    { seq: 1, from: agent('Desk'), body: 'This was the opener.' },
    { seq: 2, from: { ...agent('Editor'), verified: true }, body: 'ROOM NOTE\nFirst line\nSecond line\nThird line' },
    { seq: 3, from: agent('Desk'), body: 'ROOM NOTE\nNewer unverified note' },
  ];
  assert.deepEqual(roomView(msgs, {log: { kind: 'topic', trimmedBefore: 9 }}).summary,
    ['Editor · First line', 'Second line', 'Third line']);
  assert.match(roomView(msgs, {log: { kind: 'topic' }}).summary[0], /Desk · Newer unverified note/);
});

test('ago reads like a person and esc neutralises markup', () => {
  assert.equal(ago(hAgo(0.01), NOW), 'just now');
  assert.equal(ago(hAgo(0.5), NOW), '30 minutes ago');
  assert.equal(ago(hAgo(30), NOW), 'yesterday');
  assert.equal(ago(hAgo(24 * 4), NOW), '4 days ago');
  assert.equal(esc('<b a="1">&\'</b>'), '&lt;b a=&quot;1&quot;&gt;&amp;&#39;&lt;/b&gt;');
});

test('the front page links human chips to person cards and leaves bot chips and room tiles intact', async () => {
  const source = readFileSync(new URL('../src/pages/loom/hearth/index.astro', import.meta.url), 'utf8');
  const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;$/gm, '');
  const nodes = new Map([...source.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, { addEventListener() {} }]));
  const snapshot = {
    active: [{ address: '#music', count: 2, size: 40, human: true, humanName: 'Grace & <friends>',
      lastName: 'Duet', lastKind: 'agent', lastAt: hAgo(1), lastHumanAt: hAgo(2) }],
    embers: [], unavailable: [], since: Date.parse(hAgo(24)), asOf: NOW,
  };
  runInNewContext(script, {
    document: { getElementById: id => nodes.get(id) }, location: { search: '' },
    localStorage: { getItem: () => null, setItem() {} }, URLSearchParams, Date,
    readHearth: async () => snapshot, esc, flameSvg, roomHref, personHref, whileYouWereOut, ago, MAX_FIRES,
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(nodes.get('chips').innerHTML, /<a class="hearth-chip" href="\/loom\/hearth\/person\?name=Grace%20%26%20%3Cfriends%3E">Grace &amp; &lt;friends&gt;<\/a>/);
  assert.match(nodes.get('chips').innerHTML, /<span class="hearth-chip bot">Duet<\/span>/);
  assert.equal((nodes.get('fires').innerHTML.match(/<a\b/g) || []).length, 1, 'the room tile has one anchor and no nested person link');
  assert.match(nodes.get('fires').innerHTML, /href="\/loom\/hearth\/room\?to=%23music"/);
});

test('the Hearth pages share their shell while For You reuses only the recap logic', () => {
  for (const p of ['index', 'room', 'flame', 'lend']) {
    const src = readFileSync(new URL(`../src/pages/loom/hearth/${p}.astro`, import.meta.url), 'utf8');
    assert.match(src, /HearthLayout/);
  }
  const interactive = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(interactive, /hearth\.css|HearthLayout/, 'the interactive page keeps its own styles');
  assert.match(interactive, /<LoomRecap\s*\/>/);
  const recap = readFileSync(new URL('../src/components/LoomRecap.astro', import.meta.url), 'utf8');
  assert.match(recap, /import \{ whileYouWereOut \} from/);
  assert.match(recap, /import \{ readHearth \} from/);
  const css = readFileSync(new URL('../src/styles/hearth.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /^\.hearth[ ,{:]/m, 'no bare .hearth selector, which the classic page already uses');
});
