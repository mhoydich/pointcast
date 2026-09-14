import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../../../node_modules/esbuild/lib/main.js';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from '../../shwa-voice/node_modules/miniflare/dist/src/index.js';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const compiled = await build({ stdin: { contents: `import worker,{ShwaRoom} from ${JSON.stringify(source)}; export class TestRoom extends ShwaRoom { async expire() { const room=this.read(); room.expiresAt=Date.now()-1; this.save(room); await this.alarm(); return this.read(); } async prune(id) { this.ctx.storage.sql.exec('INSERT OR REPLACE INTO departures (id,at) VALUES (?,?)',id,Date.now()-100000); await this.alarm(); } } export default { fetch(req,env) { const u=new URL(req.url); if(u.pathname==='/test-expire') return env.ROOMS.getByName(u.searchParams.get('room')).expire().then(v=>Response.json(v)); if(u.pathname==='/test-prune') return env.ROOMS.getByName(u.searchParams.get('room')).prune(u.searchParams.get('id')).then(()=>new Response('ok')); return worker.fetch(req,env); } };`, resolveDir: fileURLToPath(new URL('..', import.meta.url)), sourcefile: 'test-entry.ts' }, bundle: true, write: false, format: 'esm', platform: 'browser', external: ['cloudflare:workers'] });
const origin = 'https://pointcast.xyz';
function runtime(path) { return new Miniflare({ ...convertV4MiniflareOptions({ modules: true, script: compiled.outputFiles[0].text, compatibilityDate: '2026-09-14', durableObjects: { ROOMS: { className: 'TestRoom', useSQLite: true } }, durableObjectsPersist: path, ratelimits: { CREATION_LIMIT: { namespace_id: '1209', simple: { limit: 6, period: 60 } }, JOIN_LIMIT: { namespace_id: '1210', simple: { limit: 60, period: 60 } } }, log: new Log(LogLevel.ERROR) }), resourcePersistencePath: path }); }
async function create(mf) { const response = await mf.dispatchFetch('https://room.test/rooms', { method: 'POST', headers: { Origin: origin } }); assert.equal(response.status, 201); return (await response.json()).room; }
async function client(mf, token, name, secret = randomBytes(32).toString('hex')) {
  const response = await mf.dispatchFetch('https://room.test/rooms/' + token, { headers: { Origin: origin, Upgrade: 'websocket' } });
  assert.equal(response.status, 101); const ws = response.webSocket, messages = [], waiters = [];
  ws.accept(); ws.addEventListener('message', event => { if (event.data === 'pong') return; const value = JSON.parse(event.data); messages.push(value); for (const wait of [...waiters]) if (wait.match(value)) { clearTimeout(wait.timer); waiters.splice(waiters.indexOf(wait), 1); wait.resolve(value); } });
  const next = (match) => { const found = messages.findLast(match); if (found) return Promise.resolve(found); return new Promise((resolve, reject) => { const item = { match, resolve, timer: setTimeout(() => reject(Error('Room event timeout. Last: ' + JSON.stringify(messages.at(-1)))), 4000) }; waiters.push(item); }); };
  const send = value => ws.send(JSON.stringify(value)); send({ type: 'join', name, secret, resource: 'house' });
  const first = await next(value => ['joined', 'error'].includes(value.type));
  return { ws, next, send, secret, messages, id: first.id, first };
}
test('five humans share bounded contributions and votes, with isolated rooms, reconnection and expiry', { timeout: 30000 }, async () => {
  const path = await mkdtemp(join(tmpdir(), 'shwa-room-test-')); let mf = runtime(path); const clients = [];
  try {
    assert.equal((await mf.dispatchFetch('https://room.test/rooms', { method: 'POST', headers: { Origin: 'https://untrusted.test' } })).status, 403);
    const token = await create(mf), other = await create(mf); assert.match(token, /^[a-f0-9]{64}$/); assert.notEqual(token, other);
    const sixAtOnce = await Promise.all(Array.from({ length: 6 }, (_, i) => client(mf, token, 'Tester ' + (i + 1)))); clients.push(...sixAtOnce);
    const five = sixAtOnce.filter(c => c.id); assert.equal(five.length, 5); assert.equal(sixAtOnce.filter(c => c.first.message?.includes('five seats')).length, 1);
    const snapshot = await five[0].next(message => message.type === 'state' && message.room.members.length === 5); assert.equal(new Set(snapshot.room.members.map(m => m.id)).size, 5);
    const sixth = await client(mf, token, 'Sixth'); clients.push(sixth); assert.match(sixth.first.message, /five seats/);
    const outsider = await client(mf, other, 'Other room'); clients.push(outsider);
    const author = five[0], voter = five[1], pieceId = crypto.randomUUID();
    author.send({ type: 'add', id: pieceId, kind: 'proposal', text: 'Make a garden radio station.' });
    await Promise.all(five.map(c => c.next(m => m.type === 'state' && m.room.pieces.some(p => p.id === pieceId))));
    assert.equal(outsider.messages.findLast(m => m.type === 'state').room.pieces.length, 0);
    voter.send({ type: 'vote', id: pieceId, vote: 'yes' });
    const vote = await author.next(m => m.type === 'state' && m.room.pieces[0]?.votes[voter.id] === 'yes'); assert.equal(Object.keys(vote.room.pieces[0].votes).length, 1);
    voter.send({ type: 'vote', id: pieceId, vote: 'no' }); await author.next(m => m.type === 'state' && m.room.pieces[0]?.votes[voter.id] === 'no');
    voter.send({ type: 'profile', name: 'Voter', resource: 'x402', funded: true, token: 'DO NOT BROADCAST' });
    const profile = await author.next(m => m.type === 'state' && m.room.members.some(member => member.id === voter.id && member.resource === 'x402'));
    assert.ok(!JSON.stringify(profile).includes('funded')); assert.ok(!JSON.stringify(profile).includes('DO NOT BROADCAST')); assert.ok(!JSON.stringify(profile).includes(author.secret));
    voter.send({ type: 'remove', id: pieceId }); await voter.next(m => m.type === 'error' && m.message.includes('your own'));
    author.send({ type: 'add', kind: 'note', text: 'x'.repeat(1601) }); await author.next(m => m.type === 'error' && m.message.includes('1,600'));
    author.send({ type: 'add', id: pieceId, kind: 'proposal', text: 'Duplicate' });
    const duplicate = await client(mf, token, 'Same seat', author.secret); clients.push(duplicate); assert.match(duplicate.first.message, /already open/);
    voter.ws.close(); await author.next(m => m.type === 'state' && m.room.members.some(member => member.id === voter.id && !member.online));
    const rejoined = await client(mf, token, 'Reconnect name', voter.secret); clients.push(rejoined); assert.equal(rejoined.id, voter.id, JSON.stringify(rejoined.first));
    const restored = await rejoined.next(m => m.type === 'state'); assert.equal(restored.room.pieces.length, 1); assert.equal(restored.room.pieces[0].votes[voter.id], 'no'); assert.equal(restored.room.members.find(m => m.id === voter.id).name, 'Voter');
    rejoined.send({ type: 'leave' }); await author.next(m => m.type === 'state' && m.room.members.length === 4);
    const replacement = await client(mf, token, 'Replacement'); clients.push(replacement); assert.ok(replacement.id); const replacementState = await replacement.next(m => m.type === 'state'); assert.equal(replacementState.room.pieces[0].votes[voter.id], undefined);
    five[4].ws.close(); await author.next(m => m.type === 'state' && m.room.members.some(member => member.id === five[4].id && !member.online));
    await mf.dispatchFetch('https://room.test/test-prune?room=' + token + '&id=' + five[4].id); await author.next(m => m.type === 'state' && !m.room.members.some(member => member.id === five[4].id));
    // The same SQLite-backed room survives a real local runtime restart.
    for (const c of clients) try { c.ws.close(); } catch {};
    await mf.dispose(); mf = runtime(path);
    const afterRestart = await client(mf, token, 'Tester 1', author.secret); clients.push(afterRestart);
    const persisted = await afterRestart.next(m => m.type === 'state'); assert.equal(persisted.room.pieces[0].text, 'Make a garden radio station.');
    const expired = await mf.dispatchFetch('https://room.test/test-expire?room=' + token); const erased = await expired.json(); assert.deepEqual(erased.pieces, []); assert.deepEqual(erased.members, []);
    assert.equal((await mf.dispatchFetch('https://room.test/rooms/' + token, { headers: { Origin: origin, Upgrade: 'websocket' } })).status, 410);
  } finally { for (const c of clients) try { c.ws.close(); } catch {} await mf.dispose(); await rm(path, { recursive: true, force: true }); }
});
