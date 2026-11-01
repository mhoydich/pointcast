/**
 * Pair Line: a private line between people's own AIs, where a bot drafts and
 * its person shares. functions/_lib/pair-line.mjs and functions/api/pair-line.ts.
 * No real people's data: the names here are placeholders.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  BURST_MAX, HOLD_MS, IDLE_PURGE_MS, MAX_MEMBERS,
  cleanLabel, closeLine, createLine, decide, joinLine, leaveLine, parseCreate, parseSay, purgeIdle, readLine, sayOnLine,
} from '../functions/_lib/pair-line.mjs';
import { onRequestGet, onRequestPost } from '../functions/api/pair-line.ts';

function d1() {
  const db = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args) }; },
    async run() {
      const r = db.prepare(sql).run(...args);
      return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    },
  });
  return { raw: db, prepare: (sql) => statement(sql) };
}

const T = Date.now();
async function openPair(db, now = T) {
  const made = await createLine(db, parseCreate({ title: 'Weekend plans', you: { label: 'Alex', bot: 'Alex AI' }, invite: ['Sam'] }), now);
  const joined = await joinLine(db, made.invites[0].inviteCode, { bot: 'Sam AI' }, now + 1);
  return { made, joined, alex: made.you, sam: joined.you };
}

test('labels: first names only, no links or addresses', () => {
  assert.equal(cleanLabel('Alex'), 'Alex');
  assert.equal(cleanLabel('alex@example.com'), '');
  assert.equal(cleanLabel('https://x.y'), '');
  assert.equal(cleanLabel('1234'), '');
  assert.equal(parseCreate({ you: 'Alex', invite: [] }).ok, false);
  assert.equal(parseCreate({ you: 'Alex', invite: ['alex'] }).ok, false, 'names must differ');
  assert.equal(parseCreate({ you: 'Alex', invite: Array.from({ length: MAX_MEMBERS }, (_, i) => `P${'abcdefg'[i]}`) }).ok, false);
});

test('nothing can be said until everyone invited has joined', async () => {
  const db = d1();
  const made = await createLine(db, parseCreate({ you: 'Alex', invite: ['Sam'] }));
  assert.equal(made.line.state, 'waiting');
  const said = await sayOnLine(db, made.you.personKey, parseSay({ text: 'hi' }));
  assert.equal(said.status, 409);
  const joined = await joinLine(db, made.invites[0].inviteCode, {});
  assert.equal(joined.line.state, 'open');
  const again = await joinLine(db, made.invites[0].inviteCode, {});
  assert.equal(again.ok, false, 'an invite works once');
});

test('a bot drafts, its person shares', async () => {
  const db = d1();
  const { alex, sam } = await openPair(db);
  const held = await sayOnLine(db, alex.botKey, parseSay({ text: 'Alex can do Saturday after 2pm.' }), T + 100);
  assert.equal(held.state, 'held');

  const samSees = await readLine(db, sam.personKey);
  assert.equal(samSees.messages.length, 0, 'another person never sees a held line');
  const samBotSees = await readLine(db, sam.botKey);
  assert.equal(samBotSees.messages.length, 0, 'nor does their bot');
  const alexSees = await readLine(db, alex.personKey);
  assert.equal(alexSees.messages[0].status, 'held');

  const botApproves = await decide(db, alex.botKey, held.seq, true);
  assert.equal(botApproves.status, 401, 'a bot cannot approve itself');
  const otherApproves = await decide(db, sam.personKey, held.seq, true);
  assert.equal(otherApproves.status, 404, 'only its own person can approve');

  const ok = await decide(db, alex.personKey, held.seq, true, T + 200);
  assert.equal(ok.state, 'shared');
  const after = await readLine(db, sam.botKey);
  assert.equal(after.messages.length, 1);
  assert.deepEqual(after.messages[0].from, { kind: 'bot', name: 'Alex AI', for: 'Alex' });
  assert.equal(after.messages[0].approvedBy, 'Alex');

  const person = await sayOnLine(db, sam.personKey, parseSay({ text: 'Saturday works.' }));
  assert.equal(person.state, 'shared', 'a person typing is already a person deciding');
});

test('declined and expired lines never reach the other side', async () => {
  const db = d1();
  const { alex, sam } = await openPair(db);
  const a = await sayOnLine(db, alex.botKey, parseSay({ text: 'draft one' }), T + 100);
  await sayOnLine(db, alex.botKey, parseSay({ text: 'draft two' }), T + 100);
  await decide(db, alex.personKey, a.seq, false);
  const later = await readLine(db, alex.personKey, { now: T + HOLD_MS + 1000 });
  assert.deepEqual(later.messages.map((m) => m.status), ['declined', 'expired']);
  assert.equal((await readLine(db, sam.personKey)).messages.length, 0);
});

test('leave and close revoke access; erase deletes everything', async () => {
  const db = d1();
  const { alex, sam } = await openPair(db);
  await sayOnLine(db, sam.personKey, parseSay({ text: 'hello' }));
  const left = await leaveLine(db, sam.personKey);
  assert.equal(left.left, true);
  assert.equal((await readLine(db, sam.personKey)).status, 401, 'keys stop working');
  assert.equal((await readLine(db, sam.botKey)).status, 401);
  assert.equal((await readLine(db, alex.personKey)).line.state, 'ended');
  assert.equal((await sayOnLine(db, alex.personKey, parseSay({ text: 'still there?' }))).status, 409);

  const db2 = d1();
  const p = await openPair(db2);
  await sayOnLine(db2, p.alex.personKey, parseSay({ text: 'one' }));
  const shut = await closeLine(db2, p.sam.personKey, { erase: true });
  assert.equal(shut.erased, true);
  assert.equal(db2.raw.prepare('SELECT COUNT(*) AS n FROM pair_messages').get().n, 0);
  assert.equal((await readLine(db2, p.alex.personKey)).status, 401);
});

test('burst limit and idle purge', async () => {
  const db = d1();
  const { alex } = await openPair(db);
  for (let i = 0; i < BURST_MAX; i += 1) assert.equal((await sayOnLine(db, alex.botKey, parseSay({ text: `n${i}` }), T + 100)).ok, true);
  assert.equal((await sayOnLine(db, alex.botKey, parseSay({ text: 'one more' }), T + 100)).status, 429);
  assert.equal(await purgeIdle(db, T + IDLE_PURGE_MS + 1000), 1);
  assert.equal((await readLine(db, alex.personKey)).status, 401);
});

test('keys are stored only as hashes', async () => {
  const db = d1();
  const { alex } = await openPair(db);
  const dump = JSON.stringify(db.raw.prepare('SELECT * FROM pair_members').all());
  assert.equal(dump.includes(alex.personKey), false);
  assert.equal(dump.includes(alex.botKey), false);
});

test('HTTP: create, join, say, approve, read; noindex; reading needs a key', async () => {
  const db = d1();
  const shut = await onRequestGet({ env: { AUTH_DB: db }, request: new Request('https://pointcast.xyz/api/pair-line') });
  assert.equal(shut.status, 503, 'lands dark: closed until PAIR_LINE_ENABLED=true');
  const env = { AUTH_DB: db, PAIR_LINE_ENABLED: 'true' };
  const post = (body, key) => onRequestPost({ env, request: new Request('https://pointcast.xyz/api/pair-line', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify(body) }) });
  const get = (key) => onRequestGet({ env, request: new Request('https://pointcast.xyz/api/pair-line', { headers: key ? { Authorization: `Bearer ${key}` } : {} }) });

  const created = await post({ action: 'create', you: { label: 'Alex' }, invite: ['Sam'] });
  assert.equal(created.status, 201);
  assert.equal(created.headers.get('x-robots-tag'), 'noindex, nofollow');
  const c = await created.json();
  const j = await (await post({ action: 'join' }, c.invites[0].inviteCode)).json();
  const held = await (await post({ action: 'say', text: 'From Alex AI: grocery list is ready.' }, c.you.botKey)).json();
  assert.equal(held.state, 'held');
  assert.equal((await post({ action: 'approve', seq: held.seq }, c.you.personKey)).status, 200);
  assert.equal((await get()).status, 401);
  const read = await (await get(j.you.botKey)).json();
  assert.equal(read.messages[0].approvedBy, 'Alex');
  assert.equal((await onRequestGet({ env: { ...env, PAIR_LINE_ENABLED: 'false' }, request: new Request('https://pointcast.xyz/api/pair-line') })).status, 503);
});

test('MCP: a bot can read and draft with its bot key, never with a person key', async (t) => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const mcp = await server.ssrLoadModule('/functions/api/mcp.ts');
  const db = d1();
  let env = { AUTH_DB: db };
  const { alex, sam } = await openPair(db);
  const rpc = async (method, params, headers = {}) => (await mcp.onRequestPost({
    env,
    request: new Request('https://pointcast.xyz/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }),
  })).json();
  const { result } = await rpc('tools/list', {});
  assert.equal(result.tools.find((x) => x.name === 'pair_line_read').annotations.readOnlyHint, true);
  assert.equal(result.tools.find((x) => x.name === 'pair_line_say').annotations.readOnlyHint, false);

  const dark = await rpc('tools/call', { name: 'pair_line_read', arguments: { key: alex.botKey } });
  assert.equal(dark.result.isError, true, 'MCP tools are closed until switched on');
  env = { AUTH_DB: db, PAIR_LINE_ENABLED: 'true' };
  const refused = await rpc('tools/call', { name: 'pair_line_say', arguments: { text: 'hi', key: alex.personKey } });
  assert.equal(refused.result.isError, true);
  const drafted = await rpc('tools/call', { name: 'pair_line_say', arguments: { text: 'Grocery list ready when you are.' } }, { Authorization: `Bearer ${alex.botKey}` });
  assert.equal(JSON.parse(drafted.result.content[0].text).state, 'held');
  const samRead = JSON.parse((await rpc('tools/call', { name: 'pair_line_read', arguments: { key: sam.botKey } })).result.content[0].text);
  assert.equal(samRead.messages.length, 0);
});
