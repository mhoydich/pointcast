import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { answerValue } from '../src/lib/loom/confirm.mjs';
import { serveFor } from '../src/lib/loom/for-route.mjs';
import { confirmDb } from './helpers/loom-confirm-db.mjs';

const NOW = '2026-11-13T20:00:00.000Z';
const from = { name: 'Desk', kind: 'agent', address: '@desk' };
const human = { name: 'Mike', verified: true };
const confirm = { actionType: 'start_draft', subject: '  option A\nexactly as written.  ', risk: 'low', expiresAt: '2026-11-14T20:00:00.000Z' };
const expectedAction = `Start a draft only: ${JSON.stringify(confirm.subject)}`;
function setup(t) {
  const db = confirmDb(); t.after(() => db.close());
  const map = new Map(), kv = { get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
  const options = { db, kv, clock: () => new Date(NOW), firstHelloEnabled: false };
  const req = (query = '', body, opts = {}) => handleLoom(new Request('https://pointcast.xyz/api/loom' + query, body ? { method: 'POST', body: JSON.stringify(body) } : {}), { ...options, ...opts });
  const post = (body, opts) => req('', body, opts);
  const read = async (query) => (await req(query)).json();
  const create = async (extra = {}) => (await post({ to: '@mike', from, kind: 'confirm', confirm, ...extra })).json();
  return { db, kv, map, req, post, read, create };
}

test('confirm validates exact action, low risk, expiry and server-owned fields', async (t) => {
  const { create, post } = setup(t);
  const made = await create({ confirm: { ...confirm, revision: 99, answer: { value: 'yes' }, verified: true } });
  assert.equal(made.message.kind, 'confirm');
  assert.deepEqual(made.message.confirm, { ...confirm, action: expectedAction, revision: 1 });
  assert.equal(made.message.answer, undefined);
  for (const risk of [undefined, null, 'high', 'medium', 'LOW', false]) {
    const res = await post({ to: '@mike', from, kind: 'confirm', confirm: { ...confirm, risk } });
    assert.equal(res.status, 400); assert.match((await res.json()).error, /high-risk approvals stay in the desk's own chat/);
  }
  for (const expiresAt of [undefined, 'bad', NOW, '2026-11-20T20:00:00.001Z']) assert.equal((await post({ to: '@mike', from, kind: 'confirm', confirm: { ...confirm, expiresAt } })).status, 400);
  assert.equal((await create({ confirm: { ...confirm, expiresAt: '2026-11-20T20:00:00.000Z' } })).ok, true);
  for (const action of ['', '   ', 4, 'a'.repeat(2001)]) assert.equal((await post({ to: '@mike', from, kind: 'confirm', confirm: { ...confirm, action } })).status, 400);
  for (const amount of [0, '$0', '50 tez', 50, null, {}]) assert.equal((await post({ to: '@mike', from, kind: 'confirm', confirm: { ...confirm, amount } })).status, 400);
  assert.equal((await post({ to: '@mike', from, kind: 'confirm', confirm: { ...confirm, amount: {} } })).status, 400);
});

test('exact command only; change preserves every line and byte', async (t) => {
  for (const text of ['Yes', ' yes', 'yes ', '\nyes', 'no thanks', 'YES', 'changed my mind', 'changes', 'change my mind', 'changeable', 'yes\nmore', 'no\nmore']) assert.equal(answerValue(text), null);
  for (const text of ['yes', 'no', 'change', 'change\nuse Friday', 'change: B\r\nmore  ']) assert.equal(answerValue(text), text);
  const { create, post, read } = setup(t); const made = await create();
  await post({ to: made.address, from: human, body: 'Yes' });
  assert.equal((await read('?to=%40mike')).messages[0].answer, null);
  const answered = await (await post({ to: made.address, from: human, body: 'change: B\ncontext' })).json();
  assert.deepEqual(answered.answer, { value: 'change: B\ncontext', by: 'Mike', at: NOW, verified: false, revision: 1 });
  assert.match(answered.notice, /self-declared/);
  assert.equal((await read('?to=%40mike')).messages[0].answer.value, 'change: B\ncontext');
});

test('buttons and parent replies share one first answer; exact same responder retry returns original after expiry', async (t) => {
  const { create, post, read } = setup(t); const made = await create();
  const first = await (await post({ to: '@mike', parent: made.message.id, from: human, body: 'yes' }, { verifiedAgent: 'signed-agent' })).json();
  assert.equal(first.answer.verified, false);
  const retry = await (await post({ action: 'confirm-respond', to: made.address, from: human, value: 'yes' }, { clock: () => new Date('2026-11-22T00:00:00Z') })).json();
  assert.deepEqual(retry.answer, first.answer);
  for (const [value, name] of [['no', 'Mike'], ['yes', 'Imposter']]) {
    const conflict = await post({ action: 'confirm-respond', to: made.address, from: { name }, value });
    assert.equal(conflict.status, 409); assert.equal((await conflict.json()).error, 'confirm_already_answered');
  }
  const delta = await read('?to=%40mike&since=999&only=new');
  assert.equal(delta.messages[0].answer.value, 'yes');
  assert.ok(!JSON.stringify(delta).includes('tokenHash'));
});

test('concurrent opposite answers cannot overwrite the winner', async (t) => {
  const { create, post, read } = setup(t); const made = await create();
  const results = await Promise.all(['yes', 'no'].map((value) => post({ action: 'confirm-respond', to: made.address, from: human, value })));
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const success = await results.find((r) => r.status === 200).json();
  assert.deepEqual((await read('?to=%40mike')).messages[0].answer, success.answer);
});

test('expired, withdrawn, invalid targets and store unavailable fail clearly', async (t) => {
  const { create, post } = setup(t); const made = await create();
  const response = { action: 'confirm-respond', to: made.address, from: human, value: 'no' };
  assert.equal((await post(response, { clock: () => new Date(confirm.expiresAt) })).status, 410);
  assert.equal((await post({ ...response, value: 'YES' })).status, 400);
  assert.equal((await post({ ...response, to: '@mike' })).status, 404);
  assert.equal((await post(response, { db: null })).status, 503);
  assert.equal((await post({ to: '@mike', from, kind: 'confirm', confirm }, { db: null })).status, 503);
  assert.equal((await post({ action: 'edit', to: made.address, token: made.editToken, body: 'different' })).status, 409);
  assert.equal((await post({ action: 'withdraw', to: made.address, token: made.editToken })).status, 200);
  assert.equal((await post(response)).status, 404);
});

test('desk query and recipient piles survive index eviction and log truncation', async (t) => {
  const { create, post, read, map } = setup(t);
  const a = await create({ to: '#work', body: '@mike please choose' });
  const b = await create();
  const c = await create({ from: { name: 'Other', address: '@other' } });
  map.set('loom:index', '[]');
  const piles = await read('?for=mike');
  assert.equal(piles.piles.needsYes.length, 3);
  assert.equal(piles.piles.needsYes[0].confirm.action, expectedAction);
  const yes = await (await post({ action: 'confirm-respond', to: a.address, from: human, value: 'yes' })).json();
  assert.equal((await read('?for=mike')).piles.needsYes.length, 2);
  const desk = await read('?confirms=desk');
  assert.deepEqual(desk.open.map((m) => m.id), [b.message.id]);
  assert.deepEqual(desk.answered.map((m) => m.id), [a.message.id]);
  assert.deepEqual(desk.answered[0].answer, yes.answer);
  assert.equal((await read('?confirms=desk&after='+desk.cursor)).answered.length, 0);
  assert.equal((await read('?confirms=other')).open[0].id, c.message.id);
  const key = 'loom:log:' + a.address.split(':')[1].split('#')[0];
  const log = JSON.parse(map.get(key)); log.ops = []; map.set(key, JSON.stringify(log));
  const restored = await read('?to=' + encodeURIComponent(a.address));
  assert.equal(restored.messages[0].answer.value, 'yes');
});

test('plain text puts exact open cards first and names the expiry, asker and unverified reply address', async (t) => {
  const { create, kv, db, req } = setup(t);
  const made = await create();
  // Fixed clock API text is tested separately from the route's live clock.
  const text = await (await req('?for=mike&format=text')).text();
  assert.ok(text.indexOf('NEEDS YOUR YES') < text.indexOf('PEOPLE'));
  assert.ok(text.includes(made.address)); assert.ok(text.includes(expectedAction));
  assert.match(text, /Asked by Desk/); assert.match(text, /Unverified/);
  const res = await serveFor(new Request('https://pointcast.xyz/loom/for/mike'), kv, 'mike', db);
  assert.equal(res.status, 200); assert.match(await res.text(), /NEEDS YOUR YES/);
});

test('answer cursor orders commits even when the later commit has an older request time', async (t) => {
  const { create, post, read } = setup(t);
  const a = await create(), b = await create();
  await post({ action: 'confirm-respond', to: a.address, from: human, value: 'yes' }, { clock: () => new Date('2026-11-13T21:00:00Z') });
  const first = await read('?confirms=desk');
  await post({ action: 'confirm-respond', to: b.address, from: human, value: 'no' });
  const next = await read('?confirms=desk&after=' + first.cursor);
  assert.deepEqual(next.answered.map((m) => m.id), [b.message.id]);
  assert.ok(next.cursor > first.cursor);
});

test('D1 recovers an absent KV log and preserves the private withdrawal token', async (t) => {
  const { create, post, read, map } = setup(t); const made = await create();
  map.delete('loom:log:' + made.address.split(':')[1].split('#')[0]);
  const restored = await read('?to=' + encodeURIComponent(made.address));
  assert.equal(restored.messages[0].confirm.action, expectedAction);
  assert.ok(!JSON.stringify(restored).includes('tokenHash'));
  assert.ok(!JSON.stringify(await read('?confirms=desk')).includes('token_hash'));
  assert.equal((await post({ action: 'withdraw', to: made.address, token: made.editToken })).status, 200);
  assert.equal((await read('?confirms=desk')).open.length, 0);
});

test('unavailable D1 leaves ordinary threads usable, warns in For You and fails closed for cards', async (t) => {
  const { post, req } = setup(t);
  const db = { prepare() { throw new Error('no such table'); } };
  assert.equal((await post({ to: '@mike', from, body: 'ordinary note' }, { db })).status, 201);
  const ordinary = await req('?to=%40mike', undefined, { db });
  assert.equal(ordinary.status, 200); assert.equal((await ordinary.json()).confirmUnavailable, true);
  const piles = await (await req('?for=mike', undefined, { db })).json();
  assert.equal(piles.confirmUnavailable, true);
  assert.equal((await post({ to: '@mike', from, kind: 'confirm', confirm }, { db })).status, 503);
});

test('current answers have a separate cursor and do not rewrite historical append ops', async (t) => {
  const { create, post, read } = setup(t); const made = await create();
  await post({ action: 'confirm-respond', to: made.address, from: human, value: 'yes' });
  const thread = await read('?to=%40mike&since=1');
  assert.equal(thread.messages[0].answer.value, 'yes');
  assert.ok(thread.confirmCursor > 0);
  const full = await read('?to=%40mike');
  assert.equal(full.ops.find((o) => o.id === made.message.id).answer, undefined);
});


test('action types define the immutable scope; high-risk relabels never create cards', async (t) => {
  const { post, read, create } = setup(t);
  for (const actionType of [undefined, null, ['start_draft'], {}, 0, 'mint', 'send', 'spend', 'sign', 'publish', 'deploy', 'transfer', '__proto__', 'constructor']) {
    const r = await post({to:'@mike', from, kind:'confirm', confirm:{...confirm, actionType, action:'send 50 tez'}});
    assert.equal(r.status,400);
  }
  for (const actionType of ['start_draft','choose_option','claim_task']) {
    for (const action of ['mint', 'send 50 tez', 'sign this operation', 'publish now', 'deploy']) {
      assert.equal((await post({to:'@mike',from,kind:'confirm',confirm:{...confirm,actionType,action}})).status,400);
    }
  }
  assert.equal((await post({to:'@mike',from,kind:'confirm',confirm:{...confirm,actionType:['start_draft']}})).status,400);
  assert.equal((await read('?for=mike')).piles.needsYes.length,0);
  for (const [actionType, prefix] of [['start_draft','Start a draft only'],['choose_option','Choose an option only'],['claim_task','Claim a task only']]) {
    const made = await create({confirm:{...confirm,actionType,subject:'option A'}});
    assert.equal(made.message.confirm.action, prefix+': "option A"');
  }
  for (const subject of ['', ' ', 4, 'x'.repeat(1001), '\u0000']) {
    assert.equal((await post({to:'@mike',from,kind:'confirm',confirm:{...confirm,subject}})).status,400);
  }
  const made = await create({confirm:{...confirm,subject:'mint 50 tez\nthen send'}});
  assert.equal(made.message.confirm.action,'Start a draft only: "mint 50 tez\\nthen send"');
});

test('legacy unsafe cards cannot be answered or surface as needing a yes', async (t) => {
  const { db, create, post, read } = setup(t);
  const made = await create();
  const message = {...made.message,confirm:{action:'send 50 tez',amount:50,risk:'low',expiresAt:confirm.expiresAt,revision:1}};
  await db.prepare('UPDATE loom_confirms SET message = ? WHERE id = ?').bind(JSON.stringify(message),made.message.id).run();
  assert.equal((await read('?for=mike')).piles.needsYes.length,0);
  assert.equal((await read('?confirms=desk')).open.length,0);
  const thread = await read('?to=%40mike');
  assert.equal(thread.messages[0].confirmBlocked,true);
  for (const body of [{to:made.address,from:human,body:'yes'},{action:'confirm-respond',to:made.address,from:human,value:'yes'}]) {
    const r = await post(body); assert.equal(r.status,400);
    assert.equal((await r.json()).error,'confirm_action_type_not_supported');
  }
  assert.equal((await read('?to=%40mike')).messages[0].answer,null);
});

test('accidental change prefixes stay conversation; both answer paths preserve full change details', async (t) => {
  const { create,post,read } = setup(t); const made = await create();
  for (const body of ['changed my mind','changes please','change my mind','yes\nnot an exact command']) {
    assert.equal((await post({to:made.address,from:human,body})).status,201);
    assert.equal((await read('?to=%40mike')).messages.find(m=>m.id===made.message.id).answer,null);
  }
  const value = 'change\nuse Friday\n  keep this indentation  ';
  const answer = await (await post({to:made.address,from:human,body:value})).json();
  assert.equal(answer.answer.value,value);
  const retry = await (await post({action:'confirm-respond',to:made.address,from:human,value})).json();
  assert.deepEqual(retry.answer,answer.answer);
  const second = await create();
  const button = await (await post({action:'confirm-respond',to:second.address,from:human,value:'change: B\r\nmore'})).json();
  assert.equal(button.answer.value,'change: B\r\nmore');
});


test('legacy rows cannot crowd supported pending cards out of open lists', async (t) => {
  const {db,create,read}=setup(t);
  for (let i=0;i<105;i++) {
    const made=await create({confirm:{...confirm,expiresAt:'2026-11-13T21:00:00.000Z'}});
    const message={...made.message,confirm:{action:'mint',risk:'low',expiresAt:'2026-11-13T21:00:00.000Z',revision:1}};
    await db.prepare('UPDATE loom_confirms SET message = ? WHERE id = ?').bind(JSON.stringify(message),made.message.id).run();
  }
  const valid=await create();
  assert.deepEqual((await read('?for=mike')).piles.needsYes.map(m=>m.id),[valid.message.id]);
  const desk=await read('?confirms=desk');
  assert.deepEqual(desk.open.map(m=>m.id),[valid.message.id]);
  assert.equal(desk.openTruncated,false);
});

test('D1 cards preserve ordinary inbox waiting counts without counting closed cards', async (t) => {
  const { create, post, read, req } = setup(t);
  await post({ to: '@desk', from, body: 'Established desk card.' }, { clock: () => new Date('2026-11-09T20:00:00.000Z') });
  const ordinary = await (await post({ to: '@mike', from, body: 'An ordinary unanswered desk note.' })).json();
  const answered = await create();
  await post({ action: 'confirm-respond', to: answered.address, from: human, value: 'yes' });
  const expiring = await create({ confirm: { ...confirm, expiresAt: '2026-11-13T20:01:00.000Z' } });
  const current = await read('?for=mike');
  assert.deepEqual(current.waiting, [ordinary.address]);
  assert.deepEqual(current.newWaiting, [ordinary.address]);
  assert.equal(current.newCount, 2); // ordinary waiting note plus one open D1 card
  assert.equal(current.piles.needsYes[0].id, expiring.message.id);
  const later = await (await req('?for=mike', null, { clock: () => new Date('2026-11-13T20:02:00.000Z') })).json();
  assert.deepEqual(later.waiting, [ordinary.address]);
  assert.deepEqual(later.newWaiting, [ordinary.address]);
  assert.equal(later.piles.needsYes.length, 0);
  assert.equal(later.newCount, 1);
});
