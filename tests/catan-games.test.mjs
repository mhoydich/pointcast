import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CATAN_GAMES, CATAN_GAME_REWARDS, CATAN_GAME_FRAMEWORK, applyShelfAction, attachClaims, gameShelfSpec, parseShelfAction, pruneClaims,
} from '../src/lib/catan-games.ts';
import { onRequestGet, onRequestPost } from '../functions/api/catan/shelf.ts';

class FakeKV {
  constructor() { this.m = new Map(); }
  async get(k, type) { const v = this.m.get(k); if (v === undefined) return null; return type === 'json' ? JSON.parse(v) : v; }
  async put(k, v) { this.m.set(k, v); }
  async delete(k) { this.m.delete(k); }
}

const post = (body, ip = '1.1.1.1') => new Request('https://pointcast.xyz/api/catan/shelf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
  body: JSON.stringify(body),
});

const pitch = 'A fog island with the second settlement after the reveal.';

test('the shelf is ten concrete games with split books and a stub reward', () => {
  assert.equal(CATAN_GAMES.length, 10);
  assert.equal(new Set(CATAN_GAMES.map((g) => g.slug)).size, 10);
  for (const g of CATAN_GAMES) {
    assert.ok(g.pitch.length > 40, g.slug);
    assert.ok(g.humanLoop.length > 40, g.slug);
    assert.match(g.agentLoop, /agent/);
    assert.ok(g.data.length >= 2, g.slug);
    assert.ok(g.mvp === 'small' || g.mvp === 'medium');
    assert.match(g.rewardHook, /Stub ATTN is 0/);
    assert.match(g.agentLoop + g.rewardHook, /agent/);
  }
  const spec = gameShelfSpec();
  assert.equal(spec.version, 'pointcast.catan.games/v1');
  assert.equal(spec.rewards.status, 'stub');
  assert.equal(spec.rewards.value, 'none');
  assert.equal(spec.rewards.label, 'no value until launch');
  assert.equal(spec.rewards.wired, false);
  assert.equal(spec.rewards.cash, false);
  for (const action of CATAN_GAME_REWARDS.actions) assert.equal(action.attn, 0, action.id);
  assert.ok(CATAN_GAME_REWARDS.caps.some((c) => c.value.includes('500')));
  assert.ok(CATAN_GAME_REWARDS.antiSybil.some((n) => /presence ticket/i.test(n)));
  assert.ok(CATAN_GAME_REWARDS.antiSybil.some((n) => /room attestation/i.test(n)));
  assert.equal(CATAN_GAME_FRAMEWORK.checklist.length >= 8, true);
  assert.equal(CATAN_GAME_FRAMEWORK.loop.length >= 5, true);
  assert.match(CATAN_GAME_FRAMEWORK.brief, /no value until launch/);
});

test('claims: one slot, one handle, submit, release, expiry', () => {
  const now = Date.parse('2026-10-06T18:00:00Z');
  const claim = parseShelfAction({ action: 'claim', slug: 'fog-island', handle: 'Sheep-Bot', kind: 'agent', pitch });
  assert.equal(claim.ok, true);
  assert.equal(claim.action.handle, 'sheep-bot');
  let book = applyShelfAction([], claim.action, now);
  assert.equal(book.status, 201);
  assert.equal(book.claim.kind, 'agent');

  const again = applyShelfAction(book.claims, claim.action, now);
  assert.equal(again.duplicate, true);
  assert.equal(again.claims.length, 1);

  const other = parseShelfAction({ action: 'claim', slug: 'fog-island', handle: 'other-bot', kind: 'agent', pitch });
  assert.equal(applyShelfAction(book.claims, other.action, now).status, 409);

  const second = parseShelfAction({ action: 'claim', slug: 'quiet-corners', handle: 'sheep-bot', kind: 'agent', pitch });
  assert.match(applyShelfAction(book.claims, second.action, now).error, /one slot/);

  assert.equal(parseShelfAction({ action: 'claim', slug: 'monopoly', handle: 'sheep-bot', kind: 'agent', pitch }).ok, false);
  assert.equal(parseShelfAction({ action: 'claim', slug: 'fog-island', handle: 'mike', kind: 'human', pitch }).ok, false);
  assert.equal(parseShelfAction({ action: 'claim', slug: 'fog-island', handle: 'sheep-bot', kind: 'robot', pitch }).ok, false);
  assert.equal(parseShelfAction({ action: 'claim', slug: 'fog-island', handle: 'sheep-bot', kind: 'agent', pitch: 'see https://x' }).ok, false);

  const badUrl = parseShelfAction({ action: 'submit', slug: 'fog-island', handle: 'sheep-bot', buildUrl: 'http://insecure.example/game' });
  assert.equal(badUrl.ok, false);
  const badPr = parseShelfAction({ action: 'submit', slug: 'fog-island', handle: 'sheep-bot', buildUrl: 'https://games.example/fog', prUrl: 'https://github.com/other/pointcast/pull/1' });
  assert.equal(badPr.ok, false);
  const submit = parseShelfAction({
    action: 'submit', slug: 'fog-island', handle: 'sheep-bot',
    buildUrl: 'https://games.example/fog',
    prUrl: 'https://github.com/mhoydich/pointcast/pull/1400',
  });
  book = applyShelfAction(book.claims, submit.action, now);
  assert.equal(book.claim.status, 'submitted');
  assert.equal(book.claim.prUrl.includes('/pull/1400'), true);

  const stranger = parseShelfAction({ action: 'release', slug: 'fog-island', handle: 'other-bot' });
  assert.equal(applyShelfAction(book.claims, stranger.action, now).status, 403);

  const stale = [{ ...book.claim, status: 'claimed', submittedAt: null, buildUrl: null, claimedAt: new Date(now - 15 * 86400_000).toISOString() }];
  assert.equal(pruneClaims(stale, now).length, 0);
  assert.equal(pruneClaims(book.claims, now + 20 * 86400_000).length, 1, 'a submitted build stays listed');

  const released = applyShelfAction(book.claims, parseShelfAction({ action: 'release', slug: 'fog-island', handle: 'sheep-bot' }).action, now);
  assert.equal(released.claims.length, 0);
  const view = attachClaims(released.claims, now);
  assert.equal(view.open.length, 10);
  assert.equal(view.games.every((g) => g.slot === 'open'), true);
});

test('shelf API lists ten open games and stores a claim', async () => {
  const env = { VISITS: new FakeKV() };
  const listed = await (await onRequestGet({ request: new Request('https://pointcast.xyz/api/catan/shelf'), env })).json();
  assert.equal(listed.ok, true);
  assert.equal(listed.games.length, 10);
  assert.equal(listed.open.length, 10);
  assert.equal(listed.rewards.label, 'no value until launch');
  assert.equal(listed.rewards.wired, false);

  const created = await onRequestPost({
    request: post({ action: 'claim', slug: 'segundo-settle', handle: 'pier-pin', kind: 'human', pitch }),
    env,
  });
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.claim.kind, 'human');
  assert.equal(body.rewards.attn, 0);
  assert.deepEqual(body.open.includes('segundo-settle'), false);

  const offline = await onRequestPost({
    request: post({ action: 'claim', slug: 'fog-island', handle: 'pier-pin', kind: 'agent', pitch }),
    env: {},
  });
  assert.equal(offline.status, 503);

  for (let i = 0; i < 3; i++) {
    const r = await onRequestPost({
      request: post({ action: 'claim', slug: CATAN_GAMES[i].slug, handle: `bot-${i}-x`, kind: 'agent', pitch }, '8.8.8.8'),
      env,
    });
    assert.equal(r.status, 201, CATAN_GAMES[i].slug);
  }
  const limited = await onRequestPost({
    request: post({ action: 'claim', slug: 'weather-island', handle: 'bot-late', kind: 'agent', pitch }, '8.8.8.8'),
    env,
  });
  assert.equal(limited.status, 429);
});
