// End-to-end run of PMM rooms (v0.3) in headless Chromium: phones are separate browser contexts on one
// machine, served from public/ with the real functions/api/pmm/signal.ts and stat.ts over in-memory KV.
//
//   node scripts/e2e-pmm-rooms.mjs
//
// Needs playwright-core, which is not a dependency of this repo: install it anywhere with
// `npm i --no-save playwright-core@1.57.0` and set PW_CORE to its entry if it does not resolve from here,
// e.g. PW_CORE=/tmp/pw/node_modules/playwright-core/index.mjs. CHROMIUM names the browser binary
// (default /opt/pw-browsers/chromium). OLD_REF names a commit whose public/pmm/app.js predates rooms
// (default a141f948), for the out-of-date guest scenarios. ONLY_NEW=1 runs only scenarios 7 to 10;
// SKIP_CAP=1 skips the five-phone scenario.
//
// Scenarios, one line of output each:
//   1. three phones, full mesh, signed texts, moods and hours, the lobby list;
//   2. no B–C line: texts arrive through the host as PASSED ON; an edited or re-split copy is
//      dropped; the line heals once offers flow;
//   3. five phones, ten lines, the header on one row at 390 px, RE-INVITE grey, a sixth refused;
//   4. a guest on the app from before rooms is never seated;
//   5. a reloaded member is re-invited back in; a signed LEAVE reaches everyone;
//   6. a host text queued with nobody on a line reaches the member who rejoins;
//   7. a member leaves while the host is away; the host's stale roster never brings them back;
//   8. an old goodbye replayed after the member rejoined is ignored;
//   9. a host text queued for A and B never reaches C, invited after it was written;
//  10. a friend on the old app keeps a waiting two-person note when they open a room invite;
//  and the connect stats: one RUN per room invite, mesh lines not counted.
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const { chromium } = await import(process.env.PW_CORE || 'playwright-core');
const ROOT = resolve(import.meta.dirname, '..');
const OLD = execFileSync('git', ['show', `${process.env.OLD_REF || 'a141f948'}:public/pmm/app.js`], { cwd: ROOT, encoding: 'utf8' });
assert.ok(!OLD.includes('pmm-room'), 'OLD_REF must predate rooms');

// The site, in process: public/ plus the real signal and stat functions over in-memory KV.
const signal = await import(resolve(ROOT, 'functions/api/pmm/signal.ts'));
const statFn = await import(resolve(ROOT, 'functions/api/pmm/stat.ts'));
const signalKeys = new Map(), statKeys = new Map();
const kvOf = (m) => ({
  async get(k) { return m.get(k) ?? null; },
  async put(k, v, o = {}) { m.set(k, o.metadata ?? v); },
  async list({ prefix = '', limit = 1000 } = {}) { return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).slice(0, limit).map((name) => ({ name, metadata: m.get(name) })), list_complete: true }; },
});
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const readBody = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const fn = url.pathname === '/api/pmm/signal' ? signal : url.pathname === '/api/pmm/stat' ? statFn : null;
  if (fn) {
    const body = req.method === 'POST' ? await readBody(req) : undefined;
    const request = new Request('http://localhost' + req.url, { method: req.method, headers: req.headers, body });
    const env = fn === signal ? { PMM_KV: kvOf(signalKeys) } : { PC_ANALYTICS_KV: kvOf(statKeys) };
    const out = await (req.method === 'POST' ? fn.onRequestPost : fn.onRequestGet)({ request, env, params: {} });
    res.writeHead(out.status, Object.fromEntries(out.headers)); res.end(await out.text()); return;
  }
  if (url.pathname.startsWith('/api/') || url.pathname === '/now.json') { res.writeHead(404); res.end('{}'); return; }
  let p = normalize(join(ROOT, 'public', url.pathname));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/pmm/`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const errors = [];
// Test hooks, only in this harness: drop outgoing mesh offers (no B–C line), and let the host alter texts it passes on.
const HOOK = () => {
  const send = RTCDataChannel.prototype.send;
  RTCDataChannel.prototype.send = function (d) {
    if (window.__inject && typeof d === 'string' && d.includes('"t":"rmsg"')) send.call(this, window.__inject);
    if (typeof d === 'string') {
      if (window.__noMesh && d.includes('"t":"rsig"') && d.includes('"kind":"offer"')) return;
      if (window.__tamper && d.includes('"t":"rmsg"')) { const m = JSON.parse(d); if (m.from !== window.__me) { m.text += ' (edited by the relay)'; d = JSON.stringify(m); } }
      if (window.__resplit && d.includes('"t":"rmsg"')) { const m = JSON.parse(d); const cut = m.text.indexOf('|'); if (m.from !== window.__me && cut > 0) { m.ts = `${m.ts}|${m.text.slice(0, cut)}`; m.text = m.text.slice(cut + 1); d = JSON.stringify(m); } }
    }
    return send.call(this, d);
  };
};
async function phone(name, mood, old) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
  if (old) await ctx.route('**/pmm/app.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: OLD }));
  await ctx.addInitScript(HOOK);
  const p = await ctx.newPage(); p.label = name;
  p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(`${name}: ${m.text()}`); });
  p.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  await p.goto(BASE); await p.waitForFunction(() => /^SIGIL/.test(document.getElementById('me-id').textContent));
  await p.click('#btn-settings'); await p.fill('#set-name', name); await p.click('#btn-settings-done');
  await p.click('#btn-mood'); await p.click(`#moods button:has-text("${mood.toUpperCase()}")`);
  await p.evaluate(() => { window.__me = JSON.parse(localStorage.getItem('pmm/v1')).me.id; });
  return { ctx, p };
}
const code = async (p) => { await p.waitForSelector('#load-code:not([hidden])'); await p.waitForFunction(() => /^[A-Z2-9]{6}$/.test(document.getElementById('load-code').textContent)); return p.textContent('#load-code'); };
const members = (p) => p.evaluate(() => document.querySelectorAll('#room-sigils .sigil').length);
const lines = (p) => p.evaluate(() => document.querySelectorAll('#room-sigils .sigil.on').length);
async function say(p, text) { await p.fill('#room-input', text); await p.click('#btn-room-send'); }
const texts = (p) => p.$$eval('#room-messages .msg:not(.sys) .bubble', (b) => b.map((x) => x.textContent));
const until = async (p, fn, arg, ms = 20000) => p.waitForFunction(fn, arg, { timeout: ms });

async function invite(host, guest, first) {
  if (first) await host.click('#btn-room'); else { await host.click('#btn-room-menu'); await host.click('#btn-room-invite'); }
  const c = await code(host); const t0 = Date.now();
  await guest.goto(BASE + '#join=' + c);
  await until(guest, () => document.getElementById('app').dataset.view === 'room');
  return Date.now() - t0;
}

// ---------- Scenario 1: three phones, full mesh ----------
if (!process.env.ONLY_NEW) {
  const A = await phone('Ana', 'sunny'), B = await phone('Ben', 'calm'), C = await phone('Cy', 'hyped');
  const t1 = await invite(A.p, B.p, true);
  await until(A.p, () => document.querySelectorAll('#room-sigils .sigil').length === 2);
  const t2 = await invite(A.p, C.p, false);
  try { for (const x of [A, B, C]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 3, null, 30000); }
  catch (e) { for (const x of [A, B, C]) console.log(x.p.label, await x.p.evaluate(() => [document.getElementById('app').dataset.view, document.getElementById('room-sigils').innerHTML, document.getElementById('room-messages').textContent, document.getElementById('load-screen').textContent])); throw e; }
  console.log('S1 join ms', t1, t2, '· members', await members(A.p), await members(B.p), await members(C.p), '· lines lit', await lines(A.p), await lines(B.p), await lines(C.p));
  await say(A.p, 'hello from Ana'); await say(B.p, 'Ben here'); await say(C.p, 'Cy says hi');
  for (const x of [A, B, C]) await until(x.p, () => document.querySelectorAll('#room-messages .msg:not(.sys)').length === 3);
  for (const x of [A, B, C]) { const t = await texts(x.p); assert.deepEqual([...t].sort(), ['Ben here', 'Cy says hi', 'hello from Ana'], x.p.label); }
  const signed = await B.p.$$eval('#room-messages .msg.them .meta .ok', (e) => e.map((x) => x.textContent));
  assert.equal(signed.length, 2); console.log('S1 B sees', signed);
  const atmo = await C.p.textContent('#room-atmo'); console.log('S1 C atmo:', atmo);
  assert.match(atmo, /YOU: hyped/); assert.match(atmo, /Ana: sunny/); assert.match(atmo, /Ben: calm/);
  // mood change travels
  await B.p.click('#btn-room-back'); await B.p.click('#btn-mood'); await B.p.click('#moods button:has-text("SALTY")'); await B.p.click('#rooms button');
  await until(C.p, () => /Ben: salty/.test(document.getElementById('room-atmo').textContent));
  await A.p.screenshot({ path: 'room-host.png' }); await C.p.screenshot({ path: 'room-guest.png' });
  // lobby lists the room
  await A.p.click('#btn-room-back'); const rl = await A.p.textContent('#rooms'); assert.match(rl, /3\/5/); console.log('S1 lobby:', rl.replace(/\s+/g, ' ').trim());
  for (const x of [A, B, C]) await x.ctx.close();
}

// ---------- Scenario 2: no B–C line; the host passes texts on, and an edited copy is dropped ----------
if (!process.env.ONLY_NEW) {
  const A = await phone('Ana', 'sunny'), B = await phone('Ben', 'calm'), C = await phone('Cy', 'low');
  for (const x of [B, C]) await x.p.evaluate(() => { window.__noMesh = true; });
  await invite(A.p, B.p, true); await until(A.p, () => document.querySelectorAll('#room-sigils .sigil').length === 2);
  await invite(A.p, C.p, false);
  await until(C.p, () => document.querySelectorAll('#room-sigils .sigil').length === 3);
  await new Promise((r) => setTimeout(r, 2500));
  console.log('S2 lines lit B,C (want 2 each: self + host)', await lines(B.p), await lines(C.p));
  await A.p.evaluate(() => { window.__tamper = true; });
  await say(B.p, 'original words');
  await until(A.p, () => [...document.querySelectorAll('#room-messages .bubble')].some((b) => b.textContent === 'original words'));
  await new Promise((r) => setTimeout(r, 1500));
  const cGot = await texts(C.p); console.log('S2 C after tampered relay:', cGot); assert.equal(cGot.length, 0, 'an edited copy is never shown');
  await A.p.evaluate(() => { window.__tamper = false; window.__resplit = true; });
  await say(B.p, 'NOT TONIGHT | meet at 9 tomorrow');
  await until(A.p, () => [...document.querySelectorAll('#room-messages .bubble')].some((b) => b.textContent.startsWith('NOT TONIGHT')));
  await new Promise((r) => setTimeout(r, 1500));
  const cSplit = await texts(C.p); console.log('S2 C after re-split relay:', cSplit); assert.equal(cSplit.length, 0, 'a re-split copy is never shown');
  await A.p.evaluate(() => { window.__resplit = false; });
  await say(B.p, 'second try');
  await until(C.p, () => document.querySelectorAll('#room-messages .msg:not(.sys)').length === 1);
  const meta = await C.p.textContent('#room-messages .msg.them .meta'); console.log('S2 C meta:', meta, (await texts(C.p))); assert.match(meta, /SIGNED · PASSED ON/);
  for (const x of [B, C]) await x.p.evaluate(() => { window.__noMesh = false; });
  const th = Date.now(); for (const x of [B, C]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 3, null, 40000);
  console.log('S2 B–C line healed by the periodic check after', Date.now() - th, 'ms');
  for (const x of [A, B, C]) await x.ctx.close();
}

// ---------- Scenario 3: cap at five ----------
if (!process.env.SKIP_CAP && !process.env.ONLY_NEW) {
  const ps = []; for (const n of ['H', 'P2', 'P3', 'P4', 'P5', 'P6']) ps.push(await phone(n, 'calm'));
  const [H] = ps;
  await invite(H.p, ps[1].p, true); await until(H.p, () => document.querySelectorAll('#room-sigils .sigil').length === 2);
  for (let i = 2; i < 5; i++) { await invite(H.p, ps[i].p, false); await until(H.p, (n) => document.querySelectorAll('#room-sigils .sigil').length === n, i + 1); }
  try { for (const x of ps.slice(0, 5)) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 5, null, 40000); }
  catch (e) { for (const x of ps.slice(0, 5)) console.log(x.p.label, await x.p.evaluate(() => [...document.querySelectorAll('#room-sigils .sigil')].map((s) => s.className + ' ' + s.title).join(' | ')), await x.p.textContent('#room-messages')); throw e; }
  console.log('S3 five-way mesh lit on all five');
  const rows = await ps[2].p.evaluate(() => new Set([...document.querySelectorAll('#room-sigils .sigil')].map((e) => e.getBoundingClientRect().top)).size);
  await ps[2].p.screenshot({ path: 'room-five.png' }); console.log('S3 header sigil rows at 390px:', rows); assert.equal(rows, 1);
  await say(ps[4].p, 'five');
  for (const x of ps.slice(0, 5)) await until(x.p, () => document.querySelectorAll('#room-messages .msg:not(.sys)').length === 1);
  const inviteDisabled = await H.p.evaluate(() => { document.getElementById('btn-room-menu').click(); const d = document.getElementById('btn-room-invite').disabled; document.getElementById('btn-room-done').click(); return d; });
  console.log('S3 INVITE disabled at five:', inviteDisabled); assert.equal(inviteDisabled, true);
  await ps[4].ctx.close();
  await until(H.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 4);
  const P6 = ps[5].p; await H.p.click('#btn-room-menu'); await H.p.click('#btn-room-invite');
  const c6 = await code(H.p); await P6.goto(BASE + '#join=' + c6);
  await until(P6, () => /ROOM FULL/.test(document.getElementById('toast').textContent));
  assert.equal(await P6.evaluate(() => JSON.parse(localStorage.getItem('pmm/v1')).rooms.length), 0);
  console.log('S3 sixth phone refused: ROOM FULL, host still at', await members(H.p));
  ps.splice(4, 1);
  for (const x of ps) await x.ctx.close();
}
// ---------- Scenario 4: a guest still on the app from before rooms ----------
if (!process.env.ONLY_NEW) {
  const A = await phone('Ana', 'sunny'), O = await phone('Olda', 'calm', true);
  assert.equal(await O.p.evaluate(() => typeof document.getElementById('btn-room')), 'object');
  await A.p.click('#btn-room'); const c = await code(A.p); await O.p.goto(BASE + '#join=' + c);
  await until(A.p, () => /OUT OF DATE/.test(document.getElementById('toast').textContent) || /VERSION MISMATCH|no room hello/.test(document.getElementById('load-screen').textContent));
  await until(O.p, () => /HELLO NOT SIGNED/.test(document.getElementById('toast').textContent));
  console.log('S4 old guest refused the room line (HELLO NOT SIGNED) · host screen:', await A.p.textContent('#load-line2'));
  assert.equal(await O.p.evaluate(() => JSON.parse(localStorage.getItem('pmm/v1')).friends.length), 0, 'the old app never took the host for a two-person friend');
  assert.equal(await A.p.evaluate(() => JSON.parse(localStorage.getItem('pmm/v1')).rooms[0].members.length), 1, 'never seated');
  for (const x of [A, O]) await x.ctx.close();
}

// ---------- Scenario 5: re-invite after a reload lands in the room; a signed LEAVE reaches everyone ----------
if (!process.env.ONLY_NEW) {
  const A = await phone('Ana', 'sunny'), B = await phone('Ben', 'calm'), C = await phone('Cy', 'hyped');
  await invite(A.p, B.p, true); await until(A.p, () => document.querySelectorAll('#room-sigils .sigil').length === 2);
  await invite(A.p, C.p, false);
  for (const x of [A, B, C]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 3, null, 30000);
  await C.p.reload(); await C.p.waitForFunction(() => /^SIGIL/.test(document.getElementById('me-id').textContent));
  await until(A.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 2);
  await A.p.click('#btn-room-menu'); await A.p.click('#btn-room-invite'); const c = await code(A.p);
  await C.p.goto(BASE + '#join=' + c);
  await until(C.p, () => document.getElementById('app').dataset.view === 'room' && /RUN · back in/.test(document.getElementById('room-messages').textContent));
  for (const x of [A, B, C]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 3, null, 30000);
  console.log('S5 re-invited member back in the room, mesh lit 3/3/3');
  const unsure = await B.p.evaluate(() => document.querySelectorAll('#room-sigils .sigil.unsure').length); console.log('S5 unconfirmed sigils on B:', unsure); assert.equal(unsure, 0);
  C.p.on('dialog', (d) => d.accept());
  await C.p.click('#btn-room-menu'); await C.p.click('#btn-room-leave');
  for (const x of [A, B]) await until(x.p, () => /CY LEFT THE ROOM/.test(document.getElementById('room-messages').textContent) && document.querySelectorAll('#room-sigils .sigil').length === 2);
  console.log('S5 LEAVE seen by host and member; seats 2/2; C rooms', await C.p.evaluate(() => JSON.parse(localStorage.getItem('pmm/v1')).rooms.length));
  for (const x of [A, B, C]) await x.ctx.close();
}
// ---------- Scenario 6: a host text queued while nobody is on a line reaches the member when they rejoin ----------
if (!process.env.ONLY_NEW) {
  const A = await phone('Ana', 'sunny'), B = await phone('Ben', 'calm');
  await invite(A.p, B.p, true); await until(A.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 2);
  await B.p.reload(); await B.p.waitForFunction(() => /^SIGIL/.test(document.getElementById('me-id').textContent));
  await until(A.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 1);
  await say(A.p, 'waiting for you'); assert.match(await A.p.textContent('#room-messages .msg.me .meta'), /WAITING/);
  await A.p.click('#btn-room-menu'); await A.p.click('#btn-room-invite'); await B.p.goto(BASE + '#join=' + await code(A.p));
  await until(B.p, () => [...document.querySelectorAll('#room-messages .bubble')].some((b) => b.textContent === 'waiting for you'));
  console.log('S6 queued host text reached the rejoining member:', await B.p.textContent('#room-messages .msg.them .meta'));
  for (const x of [A, B]) await x.ctx.close();
}
const roomOf = (x) => x.p.evaluate(() => JSON.parse(localStorage.getItem('pmm/v1')).rooms[0]);
const reinvite = async (H, G) => { await H.p.click('#btn-room-menu'); await H.p.click('#btn-room-invite'); const c = await code(H.p); await G.p.goto(BASE + '#join=' + c); await until(G.p, () => document.getElementById('app').dataset.view === 'room' && /RUN · (back )?in/.test(document.getElementById('room-messages').textContent)); };
const reloadP = async (x) => { await x.p.reload(); await x.p.waitForFunction(() => /^SIGIL/.test(document.getElementById('me-id').textContent)); };

// ---------- Scenario 7 (#1): C leaves while the host is away; the host's stale roster never brings C back ----------
{
  const H = await phone('Hal', 'calm'), A = await phone('Ana', 'sunny'), B = await phone('Ben', 'soft'), C = await phone('Cy', 'hyped');
  await invite(H.p, A.p, true); await until(H.p, () => document.querySelectorAll('#room-sigils .sigil').length === 2);
  await invite(H.p, B.p, false); await until(H.p, () => document.querySelectorAll('#room-sigils .sigil').length === 3);
  await invite(H.p, C.p, false);
  for (const x of [H, A, B, C]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 4, null, 60000);
  await reloadP(H); // the host's phone goes away; its room and roster stay on the phone
  await until(A.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 3);
  C.p.on('dialog', (d) => d.accept()); await C.p.click('#btn-room-menu'); await C.p.click('#btn-room-leave');
  for (const x of [A, B]) await until(x.p, () => /CY LEFT THE ROOM/.test(document.getElementById('room-messages').textContent));
  assert.equal((await roomOf(H)).members.length, 4, 'the host still lists C: its roster is stale');
  if (await H.p.evaluate(() => document.getElementById('app').dataset.view) !== 'room') await H.p.click('#rooms button');
  await reinvite(H, A);
  await until(H.p, () => document.querySelectorAll('#room-sigils .sigil').length === 3, null, 15000);
  await reinvite(H, B);
  await new Promise((r) => setTimeout(r, 2000));
  const counts = [(await roomOf(H)).members.length, (await roomOf(A)).members.length, (await roomOf(B)).members.length];
  console.log('S7 seats after the host came back (H, A, B):', counts); assert.deepEqual(counts, [3, 3, 3]);
  for (const x of [H, A, B, C]) await x.ctx.close();
}

// ---------- Scenario 8 (#2): an old goodbye replayed after A rejoined leaves A seated everywhere ----------
{
  const H = await phone('Hal', 'calm'), A = await phone('Ana', 'sunny'), B = await phone('Ben', 'soft'), Y = await phone('Yu', 'low');
  await invite(H.p, A.p, true); await until(H.p, () => document.querySelectorAll('#room-sigils .sigil').length === 2);
  await invite(H.p, B.p, false); await until(H.p, () => document.querySelectorAll('#room-sigils .sigil').length === 3);
  await invite(H.p, Y.p, false);
  for (const x of [H, A, B, Y]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 4, null, 60000);
  A.p.on('dialog', (d) => d.accept()); await A.p.click('#btn-room-menu'); await A.p.click('#btn-room-leave');
  for (const x of [H, B, Y]) await until(x.p, () => /ANA LEFT THE ROOM/.test(document.getElementById('room-messages').textContent));
  const oldBye = (await roomOf(B)).gone.find((g) => true).raw;
  await reloadP(A); await reinvite(H, A);
  for (const x of [H, A, B, Y]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 4, null, 60000);
  await B.p.evaluate((raw) => { window.__inject = raw; }, oldBye); await say(B.p, 'replaying an old goodbye'); await B.p.evaluate(() => { window.__inject = null; });
  await new Promise((r) => setTimeout(r, 1500));
  const counts = [(await roomOf(H)).members.length, (await roomOf(Y)).members.length];
  await say(A.p, 'still here'); await until(Y.p, () => [...document.querySelectorAll('#room-messages .bubble')].some((b) => b.textContent === 'still here'));
  console.log('S8 after an old goodbye was replayed (H, Y seats):', counts, '· A’s new text reached Y'); assert.deepEqual(counts, [4, 4]);
  for (const x of [H, A, B, Y]) await x.ctx.close();
}

// ---------- Scenario 9 (#3): a host text queued for A and B never goes to C, invited next ----------
{
  const H = await phone('Hal', 'calm'), A = await phone('Ana', 'sunny'), B = await phone('Ben', 'soft'), C = await phone('Cy', 'hyped');
  await invite(H.p, A.p, true); await until(H.p, () => document.querySelectorAll('#room-sigils .sigil').length === 2);
  await invite(H.p, B.p, false);
  for (const x of [H, A, B]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 3, null, 30000);
  await reloadP(A); await reloadP(B);
  await until(H.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 1);
  await say(H.p, "Saturday is C's surprise party. Don't tell C.");
  await reinvite(H, C); await new Promise((r) => setTimeout(r, 2000));
  const cGot = await texts(C.p); console.log('S9 C, invited after the text was written, sees:', cGot); assert.equal(cGot.length, 0);
  assert.match(await H.p.textContent('#room-messages .msg.me .meta'), /WAITING/, 'still waiting for A and B');
  await reinvite(H, A);
  await until(A.p, () => /surprise party/.test(document.getElementById('room-messages').textContent));
  console.log('S9 A got the queued text on rejoin');
  for (const x of [H, A, B, C]) await x.ctx.close();
}

// ---------- Scenario 10 (#5): a friend on the old app keeps a waiting two-person note when they open a room invite ----------
{
  const H = await phone('Hal', 'calm'), G = await phone('Gus', 'low', true);
  await H.p.click('#btn-host'); await G.p.goto(BASE + '#join=' + await code(H.p));
  for (const x of [H, G]) await x.p.waitForFunction(() => /^RUN/.test(document.getElementById('peer-status').textContent), null, { timeout: 30000 });
  await reloadP(H); // the two-person line drops
  await G.p.waitForFunction(() => /OFFLINE/.test(document.getElementById('peer-status').textContent), null, { timeout: 30000 });
  await G.p.fill('#composer-input', 'see you at 7'); await G.p.click('#btn-send');
  await G.p.waitForFunction(() => /WAITING/.test(document.querySelector('#messages .msg.me:last-child .meta')?.textContent || ''));
  await H.p.click('#btn-back'); await H.p.click('#btn-room'); const c = await code(H.p); await G.p.goto('about:blank'); await G.p.goto(BASE + '#join=' + c);
  await until(G.p, () => /HELLO NOT SIGNED/.test(document.getElementById('toast').textContent));
  await new Promise((r) => setTimeout(r, 1000));
  const waiting = await G.p.evaluate(() => JSON.parse(localStorage.getItem('pmm/v1')).friends[0].messages.filter((m) => m.from === 'me' && m.status === 'queued').map((m) => m.text));
  console.log('S10 old-app friend after the room invite, notes still waiting:', waiting); assert.deepEqual(waiting, ['see you at 7']);
  for (const x of [H, G]) await x.ctx.close();
}
// ---------- Stats: one RUN per room invite; mesh lines are not counted ----------
if (!process.env.ONLY_NEW) {
  statKeys.clear();
  const A = await phone('Ana', 'sunny'), B = await phone('Ben', 'calm'), C = await phone('Cy', 'hyped');
  await invite(A.p, B.p, true); await until(A.p, () => document.querySelectorAll('#room-sigils .sigil').length === 2);
  await invite(A.p, C.p, false);
  for (const x of [A, B, C]) await until(x.p, () => document.querySelectorAll('#room-sigils .sigil.on').length === 3, null, 30000);
  await new Promise((r) => setTimeout(r, 1500));
  const k = [...statKeys.keys()].map((x) => x.split(':').slice(3, 8).join(':'));
  console.log('stats after 2 invites + a mesh line:', k); assert.deepEqual(k, ['run:code:store:direct:-', 'run:code:store:direct:-']);
  for (const x of [A, B, C]) await x.ctx.close();
}
console.log('console errors:', errors.length ? errors : 0);
assert.equal(errors.length, 0);
await browser.close(); server.close();
console.log('PMM rooms e2e: all scenarios passed');
