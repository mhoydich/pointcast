import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { board, fileReceipt, matchPost, redactEmails, signUp } from '../functions/_lib/civil-service-store.ts';
import {
  CIVIL_SERVICE_POSTS,
  CIVIL_SERVICE_QUESTS,
  ESCS_DISCLAIMER,
  OFFER_CLOCK_DAYS,
  buildCivilServiceManifest,
} from '../src/data/civil-service.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

/** Map-backed stand-in for the slice of KVNamespace the desk uses. */
class FakeKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key).value : null; }
  async put(key, value, options = {}) { this.map.set(key, { value, metadata: options.metadata }); }
  async list({ prefix }) {
    const keys = [...this.map.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name, metadata: this.map.get(name).metadata }));
    return { keys, list_complete: true };
  }
}

const NOW = new Date('2026-10-06T17:00:00Z');

test('eight posts with the fields the page, JSON, and MCP rely on', () => {
  assert.equal(CIVIL_SERVICE_POSTS.length, 8);
  for (const post of CIVIL_SERVICE_POSTS) {
    assert.match(post.code, /^ESC-\d{3}$/);
    assert.ok(['neighbor', 'agent', 'either'].includes(post.who));
    for (const field of ['title', 'duty', 'receipt', 'link']) assert.ok(post[field], `${post.code} ${field}`);
    assert.ok(post.points > 0);
  }
  assert.equal(new Set(CIVIL_SERVICE_POSTS.map((p) => p.code)).size, 8);
  const agentish = CIVIL_SERVICE_POSTS.filter((p) => p.who !== 'neighbor').length;
  assert.equal(CIVIL_SERVICE_QUESTS.length, agentish);
  const manifest = buildCivilServiceManifest();
  assert.equal(manifest.posts.length, 8);
  assert.equal(manifest.disclaimer, ESCS_DISCLAIMER);
  assert.ok(manifest.posts.every((p) => p.deepLink.endsWith(`#${p.code}`)));
});

test('sign-up stores a holder with a 15-day clock and is idempotent', async () => {
  const kv = new FakeKV();
  const first = await signUp(kv, { handle: 'Signal-Pup', post: 'esc-305', kind: 'neighbor' }, NOW);
  assert.equal(first.status, 200);
  assert.equal(first.body.post.code, 'ESC-305');
  assert.equal(first.body.entry.handle, 'signal-pup');
  const days = (Date.parse(first.body.entry.offerBy) - NOW.getTime()) / 86_400_000;
  assert.equal(days, OFFER_CLOCK_DAYS);
  assert.match(first.body.receipt, /ESC-305 Front Door Greeter/);
  const again = await signUp(kv, { handle: 'signal-pup', post: 'ESC-305', kind: 'neighbor' }, NOW);
  assert.equal(again.body.alreadyHolding, true);
  assert.equal([...kv.map.keys()].filter((k) => k.startsWith('escs:holder:')).length, 1);
});

test('sign-up rejects bad handles, reserved names, unknown posts, and kind mismatches', async () => {
  const kv = new FakeKV();
  assert.equal((await signUp(kv, { handle: 'me@example.com', post: 'ESC-101' })).status, 400);
  assert.equal((await signUp(kv, { handle: 'codex', post: 'ESC-212', kind: 'agent' })).status, 403);
  assert.equal((await signUp(kv, { handle: 'ava', post: 'ESC-999' })).status, 400);
  const mismatch = await signUp(kv, { handle: 'bot-one', post: 'ESC-510', kind: 'agent' });
  assert.equal(mismatch.status, 409);
  assert.equal((await signUp(kv, { handle: 'pair-one', post: 'ESC-510', kind: 'pair' })).status, 200);
});

test('match me spreads sign-ups to the least-held eligible post', async () => {
  const kv = new FakeKV();
  const a = await signUp(kv, { handle: 'bot-a', post: 'match', kind: 'agent' }, NOW);
  const b = await signUp(kv, { handle: 'bot-b', post: 'match', kind: 'agent' }, NOW);
  assert.equal(a.body.matched, true);
  assert.notEqual(a.body.post.code, b.body.post.code);
  for (const r of [a, b]) assert.notEqual(CIVIL_SERVICE_POSTS.find((p) => p.code === r.body.post.code).who, 'neighbor');
  const next = await matchPost(kv, 'neighbor');
  assert.notEqual(next.who, 'agent');
});

test('receipts need a held post, redact emails, and swear in once', async () => {
  const kv = new FakeKV();
  const missing = await fileReceipt(kv, { handle: 'ava', post: 'ESC-101', summary: 'saw the pier' }, NOW);
  assert.equal(missing.status, 404);
  await signUp(kv, { handle: 'ava', post: 'ESC-101' }, NOW);
  const first = await fileReceipt(kv, { handle: 'ava', post: 'ESC-101', summary: '7:10am yes, clear. mail ava@example.com', link: 'https://pointcast.xyz/r/beach' }, NOW);
  assert.equal(first.status, 200);
  assert.equal(first.body.swornIn, true);
  assert.equal(first.body.stamp.id, 'sworn-in');
  assert.doesNotMatch(first.body.entry.summary, /@/);
  const second = await fileReceipt(kv, { handle: 'ava', post: 'ESC-101', summary: '7:05am no, marine layer' }, new Date(NOW.getTime() + 60_000));
  assert.equal(second.body.swornIn, false);
  assert.equal((await fileReceipt(kv, { handle: 'ava', post: 'ESC-101', summary: 'x', link: 'http://insecure.example' })).status, 400);
  assert.equal(redactEmails('a b@c.io d'), 'a [email removed] d');
});

test('board shows post → holders → receipt count and never an email', async () => {
  const kv = new FakeKV();
  await signUp(kv, { handle: 'ava', post: 'ESC-101' }, NOW);
  await signUp(kv, { handle: 'bot-a', post: 'ESC-212', kind: 'agent' }, NOW);
  await fileReceipt(kv, { handle: 'ava', post: 'ESC-101', summary: 'yes at 7am, write me at ava@example.com' }, NOW);
  const result = await board(kv, NOW);
  assert.equal(result.status, 200);
  const pier = result.body.roster.find((r) => r.code === 'ESC-101');
  assert.equal(pier.holderCount, 1);
  assert.equal(pier.receiptCount, 1);
  assert.equal(pier.holders[0].status, 'sworn');
  assert.equal(result.body.roster.find((r) => r.code === 'ESC-212').holders[0].status, 'clock-running');
  assert.equal(result.body.totals.people, 2);
  assert.equal(result.body.latestReceipts.length, 1);
  assert.doesNotMatch(JSON.stringify(result.body), /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
});

test('surfaces are wired: page, footer disclaimer, deep links, agents.json, llms.txt, MCP, passport, quests', async () => {
  const [page, agents, llms, mcp, play, channel, block] = await Promise.all([
    read('src/pages/civil-service.astro'),
    read('src/pages/agents.json.ts'),
    read('public/llms.txt'),
    read('functions/api/mcp.ts'),
    read('src/lib/play-layer.ts'),
    read('src/pages/c/[channel].astro'),
    read('src/content/blocks/0699.json'),
  ]);
  assert.match(page, /ESCS_DISCLAIMER/);
  assert.match(page, /location\.hash/);
  assert.match(page, /id=\{post\.code\}/);
  assert.match(agents, /civil-service\.json/);
  assert.match(llms, /civil-service\.json/);
  assert.match(llms, /No real public employment is offered/);
  for (const tool of ['civil_service_posts', 'civil_service_claim', 'civil_service_receipt']) assert.match(mcp, new RegExp(tool));
  assert.match(play, /id: 'sworn-in'/);
  assert.match(play, /\.\.\.CIVIL_SERVICE_QUESTS/);
  assert.match(channel, /\/civil-service/);
  const parsed = JSON.parse(block);
  assert.equal(parsed.channel, 'ESC');
  assert.match(parsed.body, /No real public employment is offered/);
});
