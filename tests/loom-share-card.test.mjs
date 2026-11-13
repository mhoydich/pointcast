import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { summarize, buildSvg, metaFor, openQuestions, isTrustedSender } from '../src/lib/loom/share-card.mjs';

const human = { name: 'Stranger', kind: 'human', verified: false };
const agent = { name: 'Frog', kind: 'agent', verified: true, address: 'agent:pci_' + 'a'.repeat(32) };
const robot = { name: 'Collator', kind: 'robot', verified: true };
let n = 0;
const msg = (o) => ({ id: `m_${++n}`, seq: n, at: '2026-11-13T10:00:00.000Z', from: human, kind: 'note', body: 'hello', parent: null, hidden: false, ...o });
const api = (messages, log = {}, participants) => ({
  ok: true, seq: messages.length, count: messages.length, messages,
  participants: participants ?? [...new Map(messages.map((m) => [m.from.name, { name: m.from.name, kind: m.from.kind, verified: !!m.from.verified }])).values()],
  log: { address: '#officenoun-tasks', kind: 'topic', label: '#officenoun-tasks', title: null, updatedAt: '2026-11-13T10:00:00.000Z', ...log },
});

test('open questions: visible questions without a direct answer', () => {
  const q1 = msg({ kind: 'question' }), q2 = msg({ kind: 'question' }), q3 = msg({ kind: 'question', hidden: true });
  const a1 = msg({ kind: 'answer', parent: q1.id }), reply = msg({ kind: 'note', parent: q2.id });
  assert.equal(openQuestions([q1, q2, q3, a1, reply]), 1);
  assert.equal(openQuestions([q1, { ...a1, hidden: true }]), 1);
  assert.equal(openQuestions(undefined), 0);
});

test('counts, title and task label for a tasks topic', () => {
  const ms = [msg({ from: agent, kind: 'note' }), msg({ kind: 'question' }), msg({ kind: 'question' })];
  const s = summarize(api(ms), '#OfficeNoun-Tasks');
  assert.equal(s.description, '3 messages · 1 person · 1 agent · 2 open tasks');
  assert.equal(s.openLabel, '2 open tasks');
  assert.equal(s.title, '#officenoun-tasks · the Loom');
  const plain = summarize(api(ms, { address: 'https://example.com/a', kind: 'url', label: 'example.com/a' }), 'example.com/a');
  assert.match(plain.description, /2 open questions$/);
});

test('words rule: stranger -> no text; verified and Collator -> excerpt', () => {
  const stranger = summarize(api([msg({ from: human, body: 'buy my coin' })]), '#x');
  assert.equal(stranger.last.text, null);
  assert.match(buildSvg(stranger), /Stranger posted · open the thread to read it/);
  assert.doesNotMatch(buildSvg(stranger), /buy my coin/);
  const long = 'word '.repeat(60);
  const v = summarize(api([msg({ from: agent, body: long })]), '#x');
  assert.ok(v.last.text.length <= 90 && v.last.text.endsWith('…'));
  assert.match(buildSvg(v), /word word/);
  assert.equal(summarize(api([msg({ from: robot, body: 'Seeded.' })]), '#x').last.text, 'Seeded.');
  assert.equal(isTrustedSender({ name: 'Collator', kind: 'human', verified: false }), false);
});

test('title from the log is used only when the first poster is trusted', () => {
  const evil = summarize(api([msg({ from: human })], { title: 'Win a prize' }), '#x');
  assert.equal(evil.name, '#officenoun-tasks');
  const ok = summarize(api([msg({ from: agent })], { title: 'Tasks board' }), '#x');
  assert.equal(ok.name, 'Tasks board');
});

test('inbox addresses never show text, even from a verified sender', () => {
  for (const [kind, address] of [['handle', '@mike'], ['agent', 'agent:pci_' + 'b'.repeat(32)], ['wallet', 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb']]) {
    const s = summarize(api([msg({ from: agent, body: 'private words' })], { address, kind, label: address, title: 'secret title' }), address);
    assert.equal(s.inbox, true);
    assert.equal(s.last.text, null);
    assert.equal(s.name, address);
    const svg = buildSvg(s);
    assert.doesNotMatch(svg, /private words|secret title/);
    assert.doesNotMatch(JSON.stringify(metaFor(s, address, 3)), /private words|secret title/);
  }
});

test('SVG escapes hostile text', () => {
  const hostile = '</text><script>alert(1)</script>"&';
  const s = summarize(api([msg({ from: { name: hostile, kind: 'human' } })], { label: hostile }), '#x');
  const svg = buildSvg(s);
  assert.doesNotMatch(svg, /<script/);
  assert.doesNotMatch(svg, /<\/text><script/);
  const verified = summarize(api([msg({ from: { ...agent, name: 'A<b>' }, body: '<img onerror=x> & "q"' })]), '#x');
  const v = buildSvg(verified);
  assert.doesNotMatch(v, /<img|<b>/);
  assert.match(v, /&amp;/);
});

test('meta carries the address and seq', () => {
  const s = summarize(api([msg({})], { address: 'https://example.com/a?x=1', kind: 'url', label: 'example.com/a' }), 'example.com/a?x=1');
  const m = metaFor(s, 'example.com/a?x=1', 7);
  const enc = encodeURIComponent('https://example.com/a?x=1');
  assert.equal(m.url, `https://pointcast.xyz/loom?to=${enc}`);
  assert.equal(m.canonical, m.url);
  assert.equal(m.image, `https://pointcast.xyz/og/loom.png?to=${enc}&s=7`);
  assert.equal(m.rss, `https://pointcast.xyz/api/loom?to=${enc}&format=rss`);
  assert.equal(m.twitterCard, 'summary_large_image');
  assert.equal(metaFor(s, 'x', 8).image.endsWith('&s=8'), true);
});

test('noun is stable per address and differs across addresses', () => {
  const a1 = summarize(api([msg({})]), '#x').noun;
  assert.equal(summarize(api([msg({}), msg({})]), '#x').noun, a1);
  assert.ok(a1 >= 0 && a1 < 1200);
  const other = summarize(api([msg({})], { address: '#other', label: '#other' }), '#other').noun;
  assert.notEqual(other, a1);
});

test('end to end against the real service: reply address resolves to its log', async () => {
  const map = new Map();
  const kv = { get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
  const post = (body) => handleLoom(new Request('https://pointcast.xyz/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { kv });
  const r = await (await post({ to: '#share-test', from: { name: 'Ann', kind: 'human' }, kind: 'question', body: 'Anyone?' })).json();
  const read = async (to) => (await handleLoom(new Request(`https://pointcast.xyz/api/loom?to=${encodeURIComponent(to)}`), { kv })).json();
  const direct = summarize(await read('#share-test'), '#share-test');
  const viaReply = summarize(await read(r.address), r.address);
  assert.equal(direct.address, '#share-test');
  assert.equal(viaReply.address, '#share-test');
  assert.equal(direct.counts.openQuestions, 1);
  assert.equal(direct.last.text, null);
  assert.equal(metaFor(viaReply, r.address, 1).url, 'https://pointcast.xyz/loom?to=' + encodeURIComponent('#share-test'));
});
