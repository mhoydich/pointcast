import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import * as G from '../public/chain/apps/signal-run.js';
import * as C from '../public/chain/apps/signal-run-chain.js';
import { mount, PASSPORT_SLOT } from '../public/chain/apps/signal-run-view.js';
import * as K from '../public/chain/apps/chain-kit.js';
import { FX } from './helpers/fake-devnet.mjs';

const day = '2026-10-27';
const complete = (d = day) => G.completedEvent({ day: d, routes: [0, 1, 2].map(i => G.shortestRoute(G.makeMap(d, i))) });
test('daily maps are deterministic, varied and finishable within budget across a year', () => {
  const layouts = new Set();
  for (let d = 0; d < 366; d++) {
    const date = G.utcDay(Date.UTC(2026, 0, 1 + d));
    for (let s = 0; s < 3; s++) {
      const map = G.makeMap(date, s), route = G.shortestRoute(map);
      assert.equal(G.replay(map, route).status, 'won');
      assert.ok(route.length <= map.budget); assert.ok(map.walls.length >= 10);
      assert.deepEqual(G.makeMap(date, s), map); layouts.add(map.walls.join(','));
    }
  }
  assert.ok(layouts.size > 1000);
});
test('rules reject walls, row wrapping, early exits and malformed/post-finish replays', () => {
  const map = G.makeMap(day), start = G.initialState(map);
  assert.equal(G.move(map, start, 'U'), start); assert.equal(G.move(map, start, 'L'), start);
  assert.equal(G.neighbor(6, 'R'), -1); assert.equal(G.neighbor(7, 'L'), -1);
  const exitState = { pos: 47, mask: 0, route: '', status: 'playing' };
  assert.notEqual(G.move({ ...map, walls: [] }, exitState, 'R').status, 'won');
  const route = G.shortestRoute(map);
  assert.equal(G.replay(map, route + 'L'), null); assert.equal(G.replay(map, 'X'), null);
  assert.equal(G.replay(map, 'U'), null);
  assert.equal(G.validDay('2026-99-99'), false); assert.equal(G.validDay('2026-02-30'), false);
  assert.throws(() => G.makeMap(day, 3));
});
test('move budget ends the run but permits arrival on the final move', () => {
  const map = { ...G.makeMap(day), walls: [], shards: [1, 2, 3], exit: 4, budget: 4 };
  assert.equal(G.replay(map, 'RRRR').status, 'won');
  assert.equal(G.replay({ ...map, budget: 3 }, 'RRR').status, 'lost');
});
test('passport keeps only replayable completions; bodies describe player-reported participation', () => {
  const e = complete(); assert.ok(e); assert.equal(G.completedEvent({ ...e, routes: ['R', 'R', 'R'] }), null);
  const values = [e, { ...e, moves: 999999 }, { day: '2026-99-99', routes: [] }, { ...e, day: '<script>' }];
  const saved = G.loadPassport({ getItem: () => JSON.stringify(values) }, PASSPORT_SLOT);
  assert.equal(saved.length, 1); assert.equal(saved[0].moves, e.moves);
  assert.match(G.eventBody(e), /claim:player-reported/); assert.match(G.eventBody(e), /not a token/);
  assert.throws(() => G.eventBody({ day, routes: [] }));
});
function fixture() {
  const page = readFileSync(new URL('../src/pages/chain/play/index.astro', import.meta.url), 'utf8');
  const body = page.slice(page.indexOf('<main'), page.indexOf('</main>') + 7)
    .replace(/<KeyPanel[^>]+\/>/, '<div data-key-panel><button data-kp-make>Make</button><p data-kp-status></p><code data-kp-address></code></div>');
  const dom = new JSDOM(body, { url: 'https://pointcast.xyz/chain/play/' });
  const root = dom.window.document.querySelector('main'); root.dataset.api = 'https://example.test'; root.dataset.genesis = 'a'.repeat(64);
  root.dataset.chainId = 'test-chain';
  return { dom, root, q: s => root.querySelector(s) };
}
test('DOM game completes all stages, collects local stamp, replays, and uses accessible controls without a chain call', () => {
  const { dom, root, q } = fixture(); let requests = 0;
  const app = mount(root, { now: () => Date.UTC(2026, 9, 27), supported: false, fetch: () => { requests++; throw Error('must stay local'); } });
  assert.equal(q('[data-board]').children.length, 49);
  for (let stage = 0; stage < 3; stage++) {
    for (const d of G.shortestRoute(app.state.map)) app.step(d);
    assert.equal(app.state.state.status, 'won');
    if (stage < 2) q('[data-next]').click();
  }
  assert.equal(app.state.passport.length, 1); assert.match(q('[data-game-status]').textContent, /stamp is in your passport/);
  assert.equal(q('[data-passport]').querySelectorAll('article').length, 1); assert.equal(requests, 0);
  q('[data-next]').click(); assert.equal(app.state.stage, 0); assert.equal(app.state.routes.length, 0);
  q('[data-hint]').click(); assert.equal(app.state.assisted, true); assert.equal(root.querySelectorAll('[data-suggested=yes]').length, 1);
  dom.window.close();
});
test('DOM handles blocked storage and forged completion without enabling chain review', () => {
  const { dom, root, q } = fixture();
  const app = mount(root, { supported: false, now: () => Date.UTC(2026, 9, 27), storage: { getItem: () => JSON.stringify([{ day, routes: ['R', 'R', 'R'] }]), setItem: () => { throw Error('blocked'); } } });
  assert.equal(app.state.passport.length, 0); assert.equal(q('[data-review]').disabled, true);
  assert.equal(q('[data-receipt-panel]').hidden, true); dom.window.close();
});
test('DOM review shows the exact public payload and account, cancels without writes, and invalidates after a key change', async () => {
  const { dom, root, q } = fixture(), calls = [];
  dom.window.localStorage.setItem(PASSPORT_SLOT, JSON.stringify([complete()]));
  const chain = { genesisHash: 'a'.repeat(64), chainId: 'test-chain', params: { chain_id: 'test-chain' }, domain: K.pcc.domainOf('test-chain', 'a'.repeat(64)),
    buildPublish: async fields => { calls.push('nonce-read'); return { sender: fields.sender, nonce: 0, type: 'publish_block', channel: fields.channel, title: fields.title, body_hash: fields.bodyHash, media_uri: null }; } };
  const app = mount(root, { supported: true, now: () => Date.UTC(2026, 9, 27), connect: async () => chain,
    fetch: async () => { calls.push('unexpected-write'); throw Error('no'); } });
  await app.keys.ready; await app.keys.setSeed('45'.repeat(32));
  assert.equal(q('[data-review]').disabled, false); await app.review();
  assert.equal(q('[data-review-panel]').hidden, false); assert.equal(q('[data-review-account]').textContent, app.keys.key().sender);
  assert.equal(q('[data-review-body]').textContent, G.eventBody(complete()));
  assert.match(q('[data-review-fields]').textContent, /Signing digest: [a-f0-9]{64}/);
  assert.deepEqual(calls, ['nonce-read']);
  q('[data-cancel]').click(); assert.equal(q('[data-review-panel]').hidden, true); assert.deepEqual(calls, ['nonce-read']);
  await app.review(); await app.keys.setSeed('56'.repeat(32));
  assert.equal(q('[data-review-panel]').hidden, true); assert.equal(app.state.plan, null); await app.sign();
  assert.deepEqual(calls, ['nonce-read', 'nonce-read']); dom.window.close();
});
test('receipt preparation only reads; explicit publish checks identity then uploads exact body and preserves hash before submit', async () => {
  const events = [], key = await K.keyFromSeed('12'.repeat(32)), event = complete();
  const chain = { genesisHash: 'a'.repeat(64), domain: K.pcc.domainOf('test-chain', 'a'.repeat(64)),
    buildPublish: async fields => { assert.equal(fields.body, undefined); events.push('prepare'); return { sender: fields.sender, nonce: 0, type: 'publish_block', channel: fields.channel, title: fields.title, body_hash: fields.bodyHash, media_uri: null }; },
    submit: async () => { events.push('submit'); throw new Error('gateway dropped'); } };
  const plan = await C.prepareEvent(chain, key, event); assert.deepEqual(events, ['prepare']);
  const net = { get: async () => { events.push('identity'); return { chain_id: 'test-chain', genesis_hash: 'a'.repeat(64), height: 1 }; }, post: async (path, body) => { assert.equal(path, '/body'); assert.equal(body.body, plan.body); events.push('body'); return { body_hash: plan.tx.body_hash }; } };
  let error;
  try { await C.publishEvent({ chain, net, key, plan, onSigned: ({ txHash }) => { assert.match(txHash, /^[a-f0-9]{64}$/); events.push('saved-hash'); } }); } catch (e) { error = e; }
  assert.deepEqual(events, ['prepare', 'identity', 'body', 'saved-hash', 'submit']);
  assert.equal(error.sendState, 'maybe'); assert.match(error.txHash, /^[a-f0-9]{64}$/);
  events.length = 0;
  await assert.rejects(C.publishEvent({ chain, net, key: { sender: 'different' }, plan }), /changed/); assert.equal(events.length, 0);
  await assert.rejects(C.publishEvent({ chain, net: { ...net, get: async () => ({ chain_id: 'test-chain', genesis_hash: 'b'.repeat(64), height: 1 }) }, key, plan }), /GENESIS CHANGED/);
  assert.equal(events.includes('body'), false);
});
test('event channel obeys the chain post grammar, and leaving/changing keys during upload stops signing', async () => {
  assert.match(C.CHANNEL, /^[A-Z0-9]{1,16}$/);
  const events = [], key = await K.keyFromSeed('67'.repeat(32));
  const chain = { genesisHash: 'a'.repeat(64),
    buildPublish: async fields => ({ sender: fields.sender, nonce: 0, type: 'publish_block', channel: fields.channel, title: fields.title, body_hash: fields.bodyHash, media_uri: null }),
    submit: async () => events.push('submit') };
  const plan = await C.prepareEvent(chain, key, complete());
  const net = { get: async () => ({ chain_id: 'test-chain', genesis_hash: plan.genesis, height: 1 }), post: async () => { events.push('body'); return { body_hash: plan.tx.body_hash }; } };
  await assert.rejects(C.publishEvent({ chain, net, key: { ...key, sign: async () => events.push('sign') }, plan, beforeSign: () => false }), /page or key changed/);
  assert.deepEqual(events, ['body']);
});
test('included-looking status alone cannot produce a checked event receipt', async () => {
  const receipt = { txHash: 'c'.repeat(64), genesis: 'a'.repeat(64), body: 'anything', sender: 'alice' };
  const chain = { genesisHash: receipt.genesis, _req: async () => ({ header: { height: 2 }, txs: [] }) };
  const net = { get: async p => p === '/status' ? { chain_id: 'test', genesis_hash: receipt.genesis, height: 2 } : { status: 'included', height: 2 } };
  await assert.rejects(C.checkEvent(chain, net, receipt), /missing/);
  const other = { ...receipt, genesis: 'b'.repeat(64) }; await assert.rejects(C.checkEvent(chain, net, other), /different devnet/);
});
test('an actual signed event, committed in a sealed block, checks; body, sender and seal tampering fail', async () => {
  const key = await K.keyFromSeed('23'.repeat(32)), sequencer = await K.keyFromSeed('34'.repeat(32));
  const genesis = 'a'.repeat(64), domain = K.pcc.domainOf('test-chain', genesis), body = G.eventBody(complete());
  const tx = { sender: key.sender, nonce: 0, type: 'publish_block', channel: C.CHANNEL, title: 'Signal Run', body_hash: K.pcc.bodyHash(body), media_uri: null };
  const signed = { tx, public_key: key.publicKey, signature: await key.sign(K.pcc.signingHash(tx, domain)) };
  const header = { ...FX.blocks[0].header, height: 2, tx_root: K.pcc.txRoot([signed]) };
  header.sequencer_sig = await sequencer.sign(K.pcc.sealDigest(header, genesis));
  const block = { header, txs: [signed] }, receipt = { txHash: K.pcc.txHash(signed), genesis, sender: key.sender, body };
  const chain = { genesisHash: genesis, domain, params: { sequencer: sequencer.publicKey }, _req: async () => block };
  const net = { get: async p => p === '/status' ? { chain_id: 'test-chain', genesis_hash: genesis, height: 2 } : { status: 'included', height: 2 }, getText: async () => body };
  assert.equal((await C.checkEvent(chain, net, receipt)).included, true);
  await assert.rejects(C.checkEvent(chain, net, { ...receipt, body: body + 'fake' }), /does not contain/);
  await assert.rejects(C.checkEvent(chain, net, { ...receipt, sender: sequencer.sender }), /does not contain/);
  await assert.rejects(C.checkEvent(chain, { ...net, getText: async () => body + 'changed' }, receipt), /exact event body/);
  header.sequencer_sig = '00'.repeat(64);
  await assert.rejects(C.checkEvent(chain, net, receipt), /seal/);
});
