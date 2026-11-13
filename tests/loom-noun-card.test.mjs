import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, buildSvg } from '../src/lib/loom/share-card.mjs';
import { ROOMS } from '../src/lib/loom/noun-card.mjs';
import { NOUN_PARTS } from '../src/lib/loom/noun-data.mjs';

const human = { name: 'Stranger', kind: 'human', verified: false };
let n = 0;
const msg = (o) => ({ id: `m_${++n}`, seq: n, at: '2026-11-13T10:00:00.000Z', from: human, kind: 'note', body: 'stranger words here', parent: null, hidden: false, ...o });
const api = (address, kind, messages = [msg({})]) => ({
  ok: true, seq: messages.length, count: messages.length, messages,
  participants: [{ name: 'Stranger', kind: 'human' }],
  log: { address, kind, label: address, title: null, updatedAt: '2026-11-13T10:00:00.000Z' },
});
const card = (address, kind = 'topic') => buildSvg(summarize(api(address, kind), address), { now: Date.parse('2026-11-13T12:00:00Z') });
const nounOf = (svg) => svg.match(/data-noun="([^"]+)"/)[1];

const RECIPES = {
  '#officenoun': 'body-teal-light,accessory-glasses-logo,head-calendar,glasses-square-black',
  '#officenoun-tasks': 'body-bluegrey,accessory-tie-red,head-chart-bars,glasses-square-red',
  '#noon': 'body-gold,accessory-sunset,head-watch,glasses-square-yellow-saturated',
  '#work': 'body-green,accessory-pocket-pencil,head-stapler,glasses-square-teal',
  '#best-practices': 'body-grayscale-1,accessory-tie-black-on-white,head-pencil-tip,glasses-square-fullblack',
  '@someone': 'body-computerblue,accessory-id,head-mailbox,glasses-square-blue',
  '#sports': 'body-orange,accessory-stripes-blit,head-basketball,glasses-square-black',
};

test('each room wears its recipe Noun and background', () => {
  for (const [addr, names] of Object.entries(RECIPES)) {
    const svg = card(addr, addr.startsWith('@') ? 'handle' : 'topic');
    assert.equal(nounOf(svg), names, addr);
    const bg = ROOMS[addr]?.bg ?? 'cool';
    assert.ok(svg.includes(`<rect width="1200" height="630" fill="#${bg === 'warm' ? 'e1d7d5' : 'd5d7e1'}"/>`), addr);
    assert.match(svg, /OFFICE NOUN/);
    assert.match(svg, /LIVE AT SHARE TIME/);
    assert.match(svg, /2026-11-13/);
  }
  const parts = Object.values(RECIPES).flatMap((r) => r.split(','));
  for (const p of parts) assert.ok(Object.values(NOUN_PARTS).some((k) => p in k), p);
});

test('rooms are matched case-insensitively; the dry line is short', () => {
  assert.equal(nounOf(card('#Noon')), RECIPES['#noon']);
  for (const r of Object.values(ROOMS)) assert.ok(r.line.length > 0 && r.line.length < 60);
});

test('unknown threads keep one face per address, and most addresses differ', () => {
  assert.equal(nounOf(card('#alpha')), nounOf(card('#alpha')));
  const faces = new Set();
  for (let i = 0; i < 40; i += 1) faces.add(nounOf(card(`#thread-${i}`)));
  assert.ok(faces.size >= 30, `only ${faces.size} distinct`);
  assert.ok(!Object.values(RECIPES).includes(nounOf(card('#alpha'))));
});

test('every Noun rect sits on whole pixels (multiples of 10)', () => {
  for (const addr of ['#officenoun', '#sports', '#random-one']) {
    const g = card(addr).match(/<g data-noun-pixels[^>]*>([\s\S]*?)<\/g>/)[1];
    const rects = [...g.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g)];
    assert.ok(rects.length > 50);
    for (const r of rects) for (const v of r.slice(1)) assert.equal(Number(v) % 10, 0);
    assert.match(card(addr), /shape-rendering="crispEdges"/);
  }
});

test('inbox cards carry counts only, never text or names; default cards carry no stranger words', () => {
  const inbox = card('@mike', 'handle');
  assert.doesNotMatch(inbox, /stranger words|Stranger/);
  assert.match(inbox, /1 MESSAGE/);
  assert.doesNotMatch(card('#work'), /stranger words|Stranger/);
  assert.doesNotMatch(card('#anything'), /stranger words|Stranger/);
});
