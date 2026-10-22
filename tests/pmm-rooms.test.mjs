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

test('room texts are signed over the room id, the text, the mood and the hour, and verified before they are kept or passed on', () => {
  assert.match(app, /const rcanon = \(m\) => \(\{ t: 'rmsg', id: m\.id, to: m\.room, ts: m\.ts, text: m\.text, note: `\$\{m\.mood\}\|\$\{m\.lt\}`/);
  const body = app.slice(app.indexOf('async function onRmsg'), app.indexOf('function flushRoom'));
  assert.ok(body.indexOf('verify(author, rcanon(m))') < body.indexOf('room.messages.push'), 'verify before keep');
  assert.ok(body.indexOf('room.messages.push') < body.indexOf('lsend(o, raw)'), 'pass on only what was kept, as the raw bytes received');
});

test('room lines open with the same hello, signed over the line DTLS fingerprint', () => {
  const body = app.slice(app.indexOf('async function provenHello'), app.indexOf('async function onRoomData'));
  assert.match(body, /m\.fp === localFp && await verify\(/);
  assert.match(app, /h\.sig = await sign\(\{ t: 'hello', id: state\.me\.id, ts: h\.ts, text: l\.remoteFp \}\)/);
});

test('a room invite reports its outcome like a two-person line, and mesh lines report nothing', () => {
  assert.match(app, /if \(pending && pending\.pc === pc\) \{ l\.attempt = pending;/, 'the invite line keeps the pending handshake record');
  assert.match(app, /function closeLine\(l\) \{ if \(l\.closed\) return; if \(l\.attempt && !l\.attempt\.verified\) report\(l\.attempt, 'fail', 'none', 'hello'\)/);
  assert.match(app, /a\.verified = true; setTimeout\(\(\) => linePath\(l\.pc\)\.then\(\(path\) => report\(a, 'run', path, '-', ranAt\)\)/);
  const dial = app.slice(app.indexOf('async function dial'), app.indexOf('async function onRsig'));
  assert.doesNotMatch(dial, /attempt|pending/, 'a mesh dial never touches the handshake record');
});
