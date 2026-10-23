// PMM rooms (v0.3): static checks that run without a browser. The three-phone mesh itself is exercised
// in headless Chromium (see docs/prd/pointcast-mobile-messaging.md, v0.3 measured).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PMM = resolve(import.meta.dirname, '../public/pmm');
const app = readFileSync(resolve(PMM, 'app.js'), 'utf8');
const html = readFileSync(resolve(PMM, 'index.html'), 'utf8');

test('every element app.js looks up by id exists in index.html', () => {
  const ids = new Set([...app.matchAll(/\$\('([a-z0-9-]+)'\)/g)].map((m) => m[1]));
  const missing = [...ids].filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, []);
});

test('rooms hold five, and a room invite rides its own channel label on the guest side too', () => {
  assert.match(app, /const ROOM_MAX = 5;/);
  assert.match(app, /createDataChannel\(room \? 'pmm-room' : 'pmm'/, 'the host labels a room invite');
  assert.match(app, /dc\.label === 'pmm-room'/, 'the guest routes on the label');
  assert.equal((app.match(/channel\(pc, e\.channel\)/g) || []).length, 2, 'both join paths (code and paste) route through channel()');
});

test('room texts are signed as a JSON tuple over the room, the host, the text, mood and hour, and verified before they are kept or passed on', () => {
  assert.match(app, /const rtuple = \(room, m\) => \['pmm-rmsg-1', m\.id, room\.id, room\.host, m\.ts, m\.text, m\.mood, m\.lt\];/);
  assert.doesNotMatch(app, /rcanon/, 'the | canon is never used for a room text');
  const body = app.slice(app.indexOf('async function onRmsg'), app.indexOf('function flushRoom'));
  assert.match(body, /okTs\(m\.ts\)/); assert.match(body, /okMood\(m\.mood\)/); assert.match(body, /okId\(id\)/);
  assert.ok(body.indexOf('verifyTuple(author, rtuple(room, m), m.sig)') < body.indexOf('room.messages.push'), 'verify before keep');
  assert.ok(body.indexOf('room.messages.push') < body.indexOf('lsend(o, raw)'), 'pass on only what was kept, as the raw bytes received');
});

test('a relay that re-splits a text across fields breaks the author signature', async () => {
  const rtuple = new Function(`return ${/const rtuple = (\(room, m\) => \[[^\]]+\]);/.exec(app)[1]}`)();
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
  const alg = { name: 'ECDSA', hash: 'SHA-256' }; const bytes = (arr) => new TextEncoder().encode(JSON.stringify(arr));
  const room = { id: 'AAAAAAAAAAAA', host: 'h'.repeat(64) };
  const real = { id: 'abc123', ts: 1761170000000, text: 'NOT TONIGHT | meet at 9 tomorrow', mood: 'calm', lt: '7:00 PM' };
  const sig = await crypto.subtle.sign(alg, kp.privateKey, bytes(rtuple(room, real)));
  assert.ok(await crypto.subtle.verify(alg, kp.publicKey, sig, bytes(rtuple(room, real))));
  for (const forged of [
    { ...real, ts: `${real.ts}|NOT TONIGHT `, text: ' meet at 9 tomorrow' },
    { ...real, text: 'NOT TONIGHT ', mood: ' meet at 9 tomorrow|calm' },
    { ...real, text: 'NOT TONIGHT | meet at 9 tomorrow', lt: '7:00 PM|' },
  ]) assert.equal(await crypto.subtle.verify(alg, kp.publicKey, sig, bytes(rtuple(room, forged))), false, JSON.stringify(forged));
  assert.equal(await crypto.subtle.verify(alg, kp.publicKey, sig, bytes(rtuple({ ...room, host: 'x'.repeat(64) }, real))), false, 'a look-alike room with another host fails');
});

test('every room signature is a versioned tuple, members sign their own join, and old apps are told to update', () => {
  for (const kind of ['pmm-room-hello-1', 'pmm-roster-1', 'pmm-join-1', 'pmm-rsig-1', 'pmm-rmsg-1', 'pmm-bye-1']) assert.ok(app.includes(`'${kind}'`), kind);
  assert.match(app, /await verifyTuple\(x, joinTuple\(shape, x\.id\), x\.join\)/, 'roster members are confirmed by their own join signature');
  assert.match(app, /if \(hp\.old\) return outdated\(l, id, m\.pub\);/);
  assert.match(app, /UPDATE PMM: reload/);
});

test('limits: half-open lines, offers in flight, relays per pair, rosters per second, inbox depth', () => {
  assert.match(app, /if \(dialing\(room\) >= ROOM_MAX - 2\) return;/);
  assert.match(app, /answering\.has\(busy\) \|\| lineTo\(room, from\.id\) \|\| dialing\(room\) >= ROOM_MAX - 2/);
  assert.match(app, /if \(recent\.length >= 6\) return;/);
  assert.match(app, /const wait = \(l\.rosterAt \|\| 0\) \+ 1000 - now\(\);/);
  assert.match(app, /l\.depth > 64\) return;/);
  assert.match(app, /meshAnswer\(room, from, m\)\.catch\(\(\) => \{\}\); return; \} \/\/ never inside the inbox/);
});

test('room lines open with the same hello, signed over the line DTLS fingerprint', () => {
  const body = app.slice(app.indexOf('async function provenHello'), app.indexOf('async function onRoomData'));
  assert.match(body, /!localFp \|\| m\.fp !== localFp\) return null;/);
  assert.match(body, /verifyTuple\(f, \['pmm-room-hello-1', id, m\.ts, localFp\], m\.rsig\)/);
  assert.match(app, /h\.rsig = await signTuple\(\['pmm-room-hello-1', state\.me\.id, h\.ts, l\.remoteFp\]\)/);
});

test('a room invite reports its outcome like a two-person line, and mesh lines report nothing', () => {
  assert.match(app, /if \(pending && pending\.pc === pc\) \{ l\.attempt = pending;/, 'the invite line keeps the pending handshake record');
  assert.match(app, /function closeLine\(l\) \{ if \(l\.closed\) return; if \(l\.attempt && !l\.attempt\.verified\) report\(l\.attempt, 'fail', 'none', 'hello'\)/);
  assert.match(app, /a\.verified = true; setTimeout\(\(\) => linePath\(l\.pc\)\.then\(\(path\) => report\(a, 'run', path, '-', ranAt\)\)/);
  const dial = app.slice(app.indexOf('async function dial'), app.indexOf('async function onRsig'));
  assert.doesNotMatch(dial, /attempt|pending/, 'a mesh dial never touches the handshake record');
});
