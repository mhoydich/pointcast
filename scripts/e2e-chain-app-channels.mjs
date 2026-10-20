// End-to-end run of Channels against a devnet over HTTP:
//
//   node scripts/e2e-chain-app-channels.mjs [http://127.0.0.1:8799] [--live]
//
// With no address it uses the throwaway local devnet-2 at 127.0.0.1:8799. WRITES GO
// ONLY TO A LOCAL DEVNET: stations are claimed, changed and posted to there, with
// throwaway keys and random codes. The public devnet is only ever read (GET), and
// --live repeats the read checks on it. It drives the same module the page runs
// (public/chain/apps/channels.js), with three keys: an owner, a crew member and an
// outsider. In order, one line per result:
//   1. reads the stations, the launch facts and the feed; the house codes are house
//      stations, and the page's rules refuse them, a reserved lane and a bad code;
//      the chain itself would take a claim on a reserved lane (its own simulation
//      says so, committing nothing), which is why the page does not;
//   2. CLAIM: the owner claims a random code in crew mode; the chain reads it back;
//      the outsider's claim is refused by the page's rules and, sent raw, by the
//      chain ("someone else holds this station"), as is a house code;
//   3. SET MODE AND CREW: a pin is set raw; the page adds the crew member; the pin is
//      still there; mode goes open and back;
//   4. BROADCAST: the owner posts, the crew member posts, and the feed shows both
//      with bodies that hash to what each post commits to;
//   5. REFUSED: the outsider is refused by the page; with a stale view that still
//      lists them, the chain refuses them in its own words and nothing lands; the
//      word filter refuses a body in its own words and no transaction follows;
//   6. the crew member is removed and is refused by the chain; the model the tests
//      use (tests/helpers/fake-stations.mjs) says the same words as the real devnet;
//   7. the per-account limit: the page refuses a fifth, and so does the chain;
//   8. an offer: set raw, taken by the page, the crew and pin cleared;
//   9. runs the "same steps, in code" script from the page;
//  10. the page's view over the built page (dist/): claim, crew, broadcast, with
//      the same three keys' worth of work;
//  11. --live: the stations and the feed on the public devnet, read only.
// Exit status 1 on any mismatch.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEVNET } from '../src/data/chain-home.ts';
import { codeSnippet } from '../src/data/chain-app-channels.ts';
import * as K from '../public/chain/apps/chain-kit.js';
import * as C from '../public/chain/apps/channels.js';
import * as view from '../public/chain/apps/channels-view.js';
import { WORDS } from '../tests/helpers/fake-stations.mjs';
import { builtSection, harness, reach, root, sleep, sturdyFetch, until } from './lib/e2e-chain-apps.mjs';

const h = harness('Channels', 'e2e-chain-app-channels');
const { say, check } = h;
const api = h.api;
const isLocal = api.startsWith('http://127.0.0.1');
const status = await reach(api);
if (!status) { say('FAIL no devnet answers at ' + api); process.exit(1); }
say('node ' + api + ' · ' + status.chain_id + ' · tip ' + status.height + ' · genesis ' + status.genesis_hash.slice(0, 12) + '…');
const net = K.makeNet(api, { fetch: sturdyFetch });
const pinned = isLocal ? status.genesis_hash : DEVNET.genesis;
const HOUSE_CODES = ['ART', 'FD', 'GDN', 'GF', 'ORC', 'RLY'];
const rot13 = (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.toLowerCase().charCodeAt(0) - 97 + 13) % 26) + 97));
const launch = C.readLaunch(await net.get('/params'));
const world = async () => C.readWorldFresh(net, { genesisHash: pinned }, launch);
const stationOf = async (code) => C.readStation(await net.get('/station/' + code));
const nextNonce = async (key) => (await net.get('/account/' + key.sender)).next_nonce;
const fresh = (n = 6) => 'E2E' + Math.random().toString(36).slice(2, 2 + n).toUpperCase();

// 1. reading
{
  const list = C.readStations(await net.get('/stations'));
  check(Boolean(list && list.enabled) && list.rows.length >= 6, 'GET /stations reads: ' + list.rows.length + ' stations, at most ' + list.maxStations + ' per account');
  const w = C.makeWorld({ status, list, launch });
  check(HOUSE_CODES.every((c) => w.byCode.has(c) && w.byCode.get(c).house === true && w.byCode.get(c).owner === status.house), 'the six house codes are house stations held by the treasury ' + status.house.slice(0, 10) + '…, and the page calls them “' + C.holderWords(w.byCode.get('FD'), w) + '”');
  check(launch.stations && launch.ticketed === false && launch.maxStations === list.maxStations, 'GET /params: stations on, no presence tickets, ' + launch.maxStations + ' per account, ' + launch.maxAccountStations + ' on the devnet in all');
  const scan = await C.scanFeed(net, C.newScan(), { pages: 3 });
  const rows = C.directory({ world: w, scan, me: '' });
  check(scan.posts.size > 0 && rows.length >= list.rows.length, 'the directory joins ' + list.rows.length + ' stations to ' + scan.posts.size + ' posts in ' + scan.blocks + ' blocks: ' + rows.length + ' channels');
  const states = {};
  for (const p of scan.posts.values()) states[p.bodyState] = (states[p.bodyState] || 0) + 1;
  check(!states.unverified, 'every body the feed sends hashes to what its post commits to (' + JSON.stringify(states) + ')');
  const me = await K.keyFromSeed(K.newSeedHex());
  for (const c of HOUSE_CODES) if (C.checkClaimable(c, me.sender, w).ok) check(false, 'the rules refuse the house code ' + c);
  check(HOUSE_CODES.every((c) => !C.checkClaimable(c, me.sender, w).ok && /house code/.test(C.checkClaimable(c, me.sender, w).message)), 'the page’s rules refuse every house code, in words');
  check(['BOT', 'DLY', 'NET', 'OBS', 'WIT', 'NOTARY', 'NM', 'CRT'].every((c) => !C.checkClaimable(c, me.sender, w).ok) && !C.checkClaimable('a-b', me.sender, w).ok, 'and a reserved lane, and a code that is not a code');
  check(C.readStation(await net.get('/station/E2ENOSUCHCODE')) === null, 'a code nobody holds reads as no station (GET /station/CODE answers station: null)');
  if (isLocal) {
    // the chain would take a claim on BOT: its own simulation says so, and commits nothing
    const chain0 = await K.connectPinned(api, { pinned });
    const tx = K.pcc.buildTx('claim_station', { sender: me.sender, nonce: 0, code: 'BOT', name: 'simulated', mode: 'crew' });
    const signed = { tx, public_key: me.publicKey, signature: await me.sign(K.pcc.signingHash(tx, chain0.domain)) };
    const sim = await (await sturdyFetch(api + '/tx/simulate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(signed) })).json();
    check(sim.ok === true && C.readStation(await net.get('/station/BOT')) === null, 'the chain itself would take a claim on BOT (POST /tx/simulate says ok, on a copy of the pending state, committing nothing): the page refuses it, not the chain');
  }
}

if (isLocal) {
  h.localOnly(api);
  const chain = await K.connectPinned(api, { pinned });
  const owner = await K.keyFromSeed(K.newSeedHex());
  const crew = await K.keyFromSeed(K.newSeedHex());
  const out = await K.keyFromSeed(K.newSeedHex());
  const code = fresh();
  const raw = async (key, tx) => K.signAndSend(chain, key, tx);
  const rawRefusal = async (key, tx) => { try { await raw(key, tx); return null; } catch (e) { return e; } };

  // 2. claim
  let w = await world();
  const plan = C.planClaim({ code: code.toLowerCase(), name: 'E2E station', mode: 'crew', sender: owner.sender, world: w });
  check(plan.ok && plan.fields.code === code, 'the owner’s claim plans clean: ' + code + ', crew mode, ' + C.heldBy(w, owner.sender) + ' held so far');
  const claimed = await C.sendClaim({ chain, net, key: owner, plan, launch });
  check(Number.isInteger(claimed.height) && claimed.station && claimed.station.owner === owner.sender && claimed.station.mode === 'crew' && claimed.station.name === 'E2E station' && claimed.station.claimedAt === claimed.height, 'claimed in block ' + claimed.height + ': GET /station/' + code + ' says owner, crew mode, name, claimed_at ' + (claimed.station && claimed.station.claimedAt));
  w = await world();
  check(C.heldBy(w, owner.sender) === 1 && C.directory({ world: w, scan: C.newScan(), me: owner.sender }).find((r) => r.code === code).held === 'you', 'the directory has it held by “you”, and the key holds 1 of ' + w.max);
  const takenPlan = C.checkClaimable(code, out.sender, w);
  check(!takenPlan.ok && /is held by tz1\w+, since block \d+\. First come, first served: it is taken\./.test(takenPlan.message), 'the outsider’s claim is refused by the rules: ' + takenPlan.message.slice(0, 70) + '…');
  const rawTaken = await rawRefusal(out, K.pcc.buildTx('claim_station', { sender: out.sender, nonce: await nextNonce(out), code, name: 'steal', mode: 'open' }));
  check(rawTaken && rawTaken.message === WORDS.taken && rawTaken.sendState === 'refused', 'sent raw, the chain refuses it in its own words: “' + (rawTaken && rawTaken.message) + '”');
  const rawHouse = await rawRefusal(out, K.pcc.buildTx('claim_station', { sender: out.sender, nonce: await nextNonce(out), code: 'FD', name: 'steal', mode: 'open' }));
  check(rawHouse && rawHouse.message === WORDS.taken, 'and a house code gets the same: “' + (rawHouse && rawHouse.message) + '”');
  // the guard against a stale view: a claim planned while the code was free, sent after it is taken, sends nothing
  const race = fresh();
  const racePlan = C.planClaim({ code: race, name: 'Race', mode: 'open', sender: out.sender, world: await world() });
  await C.sendClaim({ chain, net, key: crew, plan: C.planClaim({ code: race, name: 'Rival', mode: 'open', sender: crew.sender, world: await world() }), launch });
  const nBefore = await nextNonce(out);
  let gateErr = null;
  try { await C.sendClaim({ chain, net, key: out, plan: racePlan, launch }); } catch (e) { gateErr = e; }
  check(gateErr && gateErr.code === 'gate' && (await nextNonce(out)) === nBefore, 'a claim that lost the race is stopped by the fresh read, and sends nothing: ' + (gateErr && gateErr.message.slice(0, 60)) + '…');

  // 3. mode and crew; a pin set raw survives the page's change
  const pin = K.pcc.bodyHash('pin ' + code);
  await raw(owner, K.pcc.buildTx('set_station', { sender: owner.sender, nonce: await nextNonce(owner), code, crew: [], pinned: pin, owner_to: null }));
  check((await stationOf(code)).pinned === pin, 'a pin is set with a raw set_station');
  w = await world();
  const modePlan = C.planMode({ station: w.byCode.get(code), sender: owner.sender, name: 'E2E station', mode: 'crew', crew: [crew.sender], world: w });
  check(modePlan.ok && modePlan.steps.length === 1 && modePlan.steps[0].pinned === pin, 'adding the crew member plans one set_station that carries the pin back');
  const moded = await C.sendMode({ chain, net, key: owner, plan: modePlan, launch });
  check(moded.station.crew.length === 1 && moded.station.crew[0] === crew.sender && moded.station.pinned === pin && moded.station.mode === 'crew', 'the chain reads back the crew member, the pin still set, still crew mode');
  const bothPlan = C.planMode({ station: moded.station, sender: owner.sender, name: 'E2E renamed', mode: 'open', crew: [crew.sender, out.sender], world: await world() });
  check(bothPlan.ok && bothPlan.steps.map((s) => s.type).join() === 'set_station,claim_station', 'a crew change with a rename and a mode switch plans the crew first, then the re-claim');
  const both = await C.sendMode({ chain, net, key: owner, plan: bothPlan, launch });
  check(both.results.length === 2 && both.results[1].height > both.results[0].height && both.station.mode === 'open' && both.station.name === 'E2E renamed' && both.station.crew.length === 2 && both.station.pinned === pin, 'both steps are sealed in order (blocks ' + both.results.map((r) => r.height).join(' then ') + '); open mode, renamed, 2 crew, pin kept');
  const back = C.planMode({ station: both.station, sender: owner.sender, name: 'E2E renamed', mode: 'crew', crew: [crew.sender], world: await world() });
  await C.sendMode({ chain, net, key: owner, plan: back, launch });
  const st3 = await stationOf(code);
  check(st3.mode === 'crew' && st3.crew.length === 1 && st3.crew[0] === crew.sender && st3.pinned === pin, 'and back to crew mode with one crew member');
  check(!C.planMode({ station: st3, sender: out.sender, name: 'x', mode: 'open', crew: [], world: await world() }).ok, 'a stranger’s change is refused by the rules');
  const rawNotOwner = await rawRefusal(out, K.pcc.buildTx('set_station', { sender: out.sender, nonce: await nextNonce(out), code, crew: [], pinned: null, owner_to: null }));
  check(rawNotOwner && rawNotOwner.message === WORDS.notOwner, 'sent raw, the chain refuses it: “' + (rawNotOwner && rawNotOwner.message) + '”');

  // 4. broadcast as owner and as crew
  w = await world();
  const ownerPost = await C.sendBroadcast({ chain, net, key: owner, plan: C.planBroadcast({ station: w.byCode.get(code), sender: owner.sender, title: 'Owner on ' + code, body: 'The owner is on air.\nSecond line.', world: w }), launch });
  const crewPost = await C.sendBroadcast({ chain, net, key: crew, plan: C.planBroadcast({ station: w.byCode.get(code), sender: crew.sender, title: 'Crew on ' + code, body: 'The crew is on air.', world: w }), launch });
  check(Number.isInteger(ownerPost.height) && Number.isInteger(crewPost.height) && crewPost.height > ownerPost.height, 'the owner posted in block ' + ownerPost.height + ' and the crew member in block ' + crewPost.height);
  const scan = await C.scanFeed(net, C.newScan(), { pages: 2 });
  const posts = C.postsOf(scan, code);
  check(posts.length === 2 && posts[0].title === 'Crew on ' + code && posts[0].sender === crew.sender && posts[0].bodyState === 'ok' && posts[1].sender === owner.sender && posts[1].body === 'The owner is on air.\nSecond line.', 'the feed shows both, newest first, each body hashing to what its post commits to');
  check(C.directory({ world: await world(), scan, me: crew.sender }).find((r) => r.code === code).role === 'crew', 'the directory shows the crew member as crew, with a last post in block ' + posts[0].height);

  // 5. refused: the outsider
  w = await world();
  const outPlan = C.planBroadcast({ station: w.byCode.get(code), sender: out.sender, title: 'Let me in', body: 'I am not crew.', world: w });
  check(!outPlan.ok && /This key is not the owner or on the crew of “/.test(outPlan.errors[0]), 'the page refuses the outsider’s post before anything is stored: ' + outPlan.errors[0].slice(0, 60) + '…');
  const staleStations = async () => { const j = await net.get('/stations'); return { ...j, stations: j.stations.map((s) => (s.code === code ? { ...s, crew: [...s.crew, out.sender] } : s)) }; };
  const staleNet = { ...net, get: async (p) => (p === '/stations' ? staleStations() : net.get(p)) };
  const stalePlan = C.planBroadcast({ station: C.readStation({ ...(await net.get('/station/' + code)), crew: [crew.sender, out.sender] }), sender: out.sender, title: 'Let me in', body: 'I am not crew.', world: w });
  const nonceOut = await nextNonce(out);
  let refused = null;
  try { await C.sendBroadcast({ chain, net: staleNet, key: out, plan: stalePlan, launch }); } catch (e) { refused = e; }
  check(refused && refused.message === WORDS.notCrew && refused.sendState === 'refused', 'with a stale view that lists them, the chain refuses the outsider in its own words: “' + (refused && refused.message) + '”');
  check((await nextNonce(out)) === nonceOut && !C.postsOf(await C.scanFeed(net, C.newScan(), { pages: 1 }), code).some((p) => p.sender === out.sender), 'nothing landed: the outsider’s nonce is where it was, and the channel shows no post from them');
  const bad = rot13('fuvg');
  const nonceOwner = await nextNonce(owner);
  let filtered = null;
  try { await C.sendBroadcast({ chain, net, key: owner, plan: C.planBroadcast({ station: w.byCode.get(code), sender: owner.sender, title: 'Fine title', body: 'a body with ' + bad + ' in it', world: w }), launch }); } catch (e) { filtered = e; }
  check(filtered && filtered.message === WORDS.filter && filtered.status === 422, 'the devnet’s word filter refuses a body, in its own words: “' + (filtered && filtered.message) + '” (' + (filtered && filtered.status) + ')');
  check(K.sendFailureText(filtered, { unsent: 'Not sent: ' }) === 'Not sent: kept off the devnet by its word filter' && (await nextNonce(owner)) === nonceOwner, 'the page says “Not sent: …” and no transaction followed (the owner’s nonce is unchanged)');

  // 6. the crew member leaves; the chain refuses them
  const leave = C.planMode({ station: await stationOf(code), sender: owner.sender, name: 'E2E renamed', mode: 'crew', crew: [], world: await world() });
  await C.sendMode({ chain, net, key: owner, plan: leave, launch });
  w = await world();
  check(!C.planBroadcast({ station: w.byCode.get(code), sender: crew.sender, title: 'Still here?', body: 'x', world: w }).ok, 'once removed, the page refuses the former crew member');
  const rawGone = await rawRefusal(crew, await chain.buildPublish({ sender: crew.sender, channel: code, title: 'Still here?', body: 'x' }));
  check(rawGone && rawGone.message === WORDS.notCrew, 'and sent raw, the chain does too: “' + (rawGone && rawGone.message) + '”');
  // open mode: the chain lets anyone post; the page still posts only for its owner and crew
  await C.sendMode({ chain, net, key: owner, plan: C.planMode({ station: await stationOf(code), sender: owner.sender, name: 'E2E renamed', mode: 'open', crew: [], world: await world() }), launch });
  w = await world();
  check(!C.planBroadcast({ station: w.byCode.get(code), sender: out.sender, title: 'Hello', body: 'x', world: w }).ok && /broadcasts only to a channel you own or crew/.test(C.planBroadcast({ station: w.byCode.get(code), sender: out.sender, title: 'Hello', body: 'x', world: w }).errors[0]), 'in open mode the page still posts only for its owner and crew');
  const rawOpen = await raw(out, await chain.buildPublish({ sender: out.sender, channel: code, title: 'Raw post in open mode', body: 'the chain lets anyone post to an open station' }));
  check(Number.isInteger(rawOpen.height), 'while the chain, called directly, lets the outsider post to an open station (block ' + rawOpen.height + '): the guard is the page’s');

  // 7. the per-account limit, with the crew key as the holder
  const mine = [];
  for (let i = 0; i < (launch.maxStations || 4); i++) {
    const c = fresh();
    const w2 = await world();
    if (C.heldBy(w2, crew.sender) >= w2.max) break;
    await C.sendClaim({ chain, net, key: crew, plan: C.planClaim({ code: c, name: 'Held ' + i, mode: 'open', sender: crew.sender, world: w2 }), launch });
    mine.push(c);
  }
  w = await world();
  check(C.heldBy(w, crew.sender) === w.max, 'the crew key holds ' + C.heldBy(w, crew.sender) + ' of ' + w.max + ' stations');
  const fifth = fresh();
  const fifthCheck = C.checkClaimable(fifth, crew.sender, w);
  check(!fifthCheck.ok && /^You already hold \d+ of the \d+ stations one account may hold on this devnet, and the chain refuses a \d+th/.test(fifthCheck.message), 'the page refuses one more: ' + fifthCheck.message.slice(0, 70) + '…');
  const rawFifth = await rawRefusal(crew, K.pcc.buildTx('claim_station', { sender: crew.sender, nonce: await nextNonce(crew), code: fifth, name: 'one too many', mode: 'open' }));
  check(rawFifth && rawFifth.message === WORDS.limit(w.max), 'and the chain does too: “' + (rawFifth && rawFifth.message) + '”');

  // 8. an offer, taken by the page: the crew and the pin are cleared
  const toOut = await stationOf(code);
  await raw(owner, K.pcc.buildTx('set_station', { sender: owner.sender, nonce: await nextNonce(owner), code, crew: [crew.sender], pinned: pin, owner_to: out.sender }));
  w = await world();
  const take = C.checkClaimable(code, out.sender, w);
  check(take.ok && take.kind === 'take_offer', 'the offered station can be taken by the key it was offered to: ' + take.message.slice(0, 60) + '…');
  check(!C.checkClaimable(code, crew.sender, w).ok, 'and by nobody else');
  const taken = await C.sendClaim({ chain, net, key: out, plan: C.planClaim({ code, name: 'Taken over', mode: 'open', sender: out.sender, world: w }), launch });
  check(taken.station.owner === out.sender && taken.station.crew.length === 0 && taken.station.pinned === null && taken.station.offer === null && taken.station.name === 'Taken over' && toOut.owner === owner.sender, 'the chain moved it to the new owner, with the crew, the pin and the offer cleared');

  // 9. the script on the page
  const dir = mkdtempSync(join(tmpdir(), 'channel-e2e-'));
  try {
    copyFileSync(new URL('public/chain/first-mints/lib/pointcast-chain.js', root), join(dir, 'pointcast-chain.js'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'channel.mjs'), codeSnippet(api, status.genesis_hash));
    const seed = K.newSeedHex();
    const sk = await K.keyFromSeed(seed);
    const env = { ...process.env, SEED: seed };
    const sc = fresh();
    const run = (...a) => spawnSync(process.execPath, [join(dir, 'channel.mjs'), ...a], { encoding: 'utf8', cwd: dir, env });
    const claim = run('claim', sc, 'Scripted station', 'crew');
    check(claim.status === 0 && /tx_hash/.test(claim.stdout), 'the script from the page claims ' + sc + (claim.status ? ': ' + claim.stderr.slice(0, 200) : ''));
    const st9 = await until(async () => { const s = await stationOf(sc); return s && s.owner === sk.sender ? s : null; }, 20000, 500);
    check(Boolean(st9) && st9.mode === 'crew', 'and, a block later, the chain has it: owner and crew mode');
    // pin it raw so the script’s crew change has something to send back
    await raw(sk, K.pcc.buildTx('set_station', { sender: sk.sender, nonce: await nextNonce(sk), code: sc, crew: [], pinned: pin, owner_to: null }));
    const crewRun = run('crew', sc, crew.sender + ',' + out.sender);
    check(crewRun.status === 0 && /tx_hash/.test(crewRun.stdout), 'the script sets a crew of two');
    const st10 = await until(async () => { const s = await stationOf(sc); return s && s.crew.length === 2 ? s : null; }, 20000, 500);
    check(Boolean(st10) && st10.pinned === pin, 'and the pin it read first is still set');
    const postRun = run('post', sc, 'Scripted post', 'Posted by the page’s script.');
    check(postRun.status === 0 && /tx_hash/.test(postRun.stdout), 'the script stores a body and posts');
    const shown = await until(async () => C.postsOf(await C.scanFeed(net, C.newScan(), { pages: 1 }), sc).find((p) => p.title === 'Scripted post' && p.body === 'Posted by the page’s script.' && p.bodyState === 'ok'), 20000, 600);
    check(Boolean(shown), 'and, a block later, the feed shows it');
    const read = run('read', sc);
    check(read.status === 0 && /Scripted station/.test(read.stdout) && /Scripted post/.test(read.stdout), 'read prints the station and its newest posts');
  } finally { rmSync(dir, { recursive: true, force: true }); }

  // 10. the page's view over the built page
  const sec = builtSection('dist/chain/channels/index.html', '[data-channels-app]', 'http://localhost/chain/channels/?devnet=' + api);
  if (!sec) say('note dist/chain/channels is absent: build the site to run the page checks (npm run build:bare)');
  else {
    const vcode = fresh();
    const c = view.mount(sec.section, { window: sec.dom.window, fetch: sturdyFetch, storage: null, supported: true, now: () => Date.now() });
    await c.begin();
    c.stop();
    const $ = (s) => sec.section.querySelector(s);
    const $$ = (s) => [...sec.section.querySelectorAll(s)];
    const setv = (sel, v) => { const n = $(sel); n.value = v; n.dispatchEvent(new sec.dom.window.Event('input', { bubbles: true })); };
    check(sec.section.dataset.state === 'ready' && $$('[data-cc-list] tr').length >= 6, 'the built page reads the devnet: ' + $('[data-cc-count]').textContent);
    check(/house/.test($$('[data-cc-list] tr').find((r) => r.querySelector('button').textContent === 'FD').textContent), 'it lists FD as a house code');
    const vk = await c.keys.setSeed(K.newSeedHex());
    await sleep(100);
    setv('[data-cc-claim-code]', vcode.toLowerCase());
    check(/is free\./.test($('[data-cc-claim-hint]').textContent), 'typing a free code says so: ' + $('[data-cc-claim-hint]').textContent.slice(0, 40) + '…');
    setv('[data-cc-claim-name]', 'Page station');
    $('[data-cc-claim-review]').click();
    check($('[data-cc-claim-confirm]').hidden === false && $$('[data-cc-claim-list] li').length === 3, 'Review lists what goes on chain and what does not, and sends nothing');
    $('[data-cc-claim-send]').click();
    const claimedOk = await until(() => $('[data-cc-claim-result]').dataset.state === 'ok' || $('[data-cc-claim-result]').dataset.state === 'bad', 30000, 400);
    check(Boolean(claimedOk) && $('[data-cc-claim-result]').dataset.state === 'ok' && /The chain now says/.test($('[data-cc-claim-receipt]').textContent), 'Send claims it, and the receipt shows what the chain now says: ' + $('[data-cc-claim-result-text]').textContent.slice(0, 50) + '…');
    check((await stationOf(vcode)).owner === vk.sender, 'GET /station/' + vcode + ' has the page’s key as owner');
    // mode and crew in the page
    const sel = $('[data-cc-mine-select]');
    check(sel.value === vcode, 'section 3 has the new channel selected');
    setv('[data-cc-crew-add]', crew.sender);
    $('[data-cc-crew-add-go]').click();
    $('[data-cc-set-review]').click();
    check($('[data-cc-set-confirm]').hidden === false, 'the crew change reviews');
    $('[data-cc-set-send]').click();
    const setOk = await until(() => $('[data-cc-set-result]').dataset.state === 'ok' || $('[data-cc-set-result]').dataset.state === 'bad', 30000, 400);
    check(Boolean(setOk) && $('[data-cc-set-result]').dataset.state === 'ok' && (await stationOf(vcode)).crew.includes(crew.sender), 'Send adds the crew member on the chain');
    // broadcast in the page
    const target = $('[data-cc-post-channel]');
    target.value = vcode;
    target.dispatchEvent(new sec.dom.window.Event('change', { bubbles: true }));
    setv('[data-cc-post-title]', 'Posted from the page');
    setv('[data-cc-post-body]', 'Hello from the built page.');
    check($('[data-cc-preview-title]').textContent === 'Posted from the page', 'the preview shows the title as typed');
    $('[data-cc-post-review]').click();
    $('[data-cc-post-send]').click();
    const postOk = await until(() => $('[data-cc-post-result]').dataset.state === 'ok' || $('[data-cc-post-result]').dataset.state === 'bad', 30000, 400);
    check(Boolean(postOk) && $('[data-cc-post-result]').dataset.state === 'ok', 'Broadcast: ' + $('[data-cc-post-result-text]').textContent.slice(0, 60) + '…');
    check($$('[data-cc-feed] li').some((li) => li.textContent.includes('Posted from the page') && li.textContent.includes('Hello from the built page.')), 'and the channel’s feed on the page shows it');
    // the word filter, in the page
    setv('[data-cc-post-title]', 'Filtered');
    setv('[data-cc-post-body]', 'with ' + bad + ' inside');
    $('[data-cc-post-review]').click();
    $('[data-cc-post-send]').click();
    const filteredOk = await until(() => /word filter/.test($('[data-cc-post-result-text]').textContent), 30000, 400);
    check(Boolean(filteredOk) && $('[data-cc-post-result-text]').textContent === 'Not sent: kept off the devnet by its word filter' && $('[data-cc-post-result]').dataset.state === 'bad', 'the page shows the filter’s words verbatim: ' + $('[data-cc-post-result-text]').textContent);
    const wrong = builtSection('dist/chain/channels/index.html', '[data-channels-app]', 'http://localhost/chain/channels/?devnet=' + api + '&genesis=' + '9'.repeat(64));
    const c2 = view.mount(wrong.section, { window: wrong.dom.window, fetch: sturdyFetch, storage: null, supported: true });
    await c2.begin();
    c2.stop();
    check(wrong.section.dataset.state === 'changed', 'a wrong pin stops the page at GENESIS CHANGED');
  }
}

// 11. the public devnet, read only
if (h.flag('--live')) {
  const live = await reach(DEVNET.url);
  if (!live) say('note the public devnet is not reachable');
  else if (live.genesis_hash !== DEVNET.genesis) say('note the public devnet reports another genesis (' + live.genesis_hash.slice(0, 12) + '…): it was reset, and this page pins ' + DEVNET.genesis.slice(0, 12) + '…');
  else {
    const ln = K.makeNet(DEVNET.url, { fetch: sturdyFetch });
    const list = C.readStations(await ln.get('/stations'));
    check(Boolean(list && list.enabled) && HOUSE_CODES.every((c) => list.rows.some((s) => s.code === c && s.house)), 'live: GET /stations reads: ' + list.rows.length + ' stations, the six house codes among them');
    const lw = C.makeWorld({ status: live, list, launch: C.readLaunch(await ln.get('/params')) });
    const scan = await C.scanFeed(ln, C.newScan(), { pages: 5 });
    const rows = C.directory({ world: lw, scan, me: '' });
    check(scan.posts.size > 0 && rows.length >= list.rows.length, 'live: the directory has ' + rows.length + ' channels (' + rows.filter((r) => !r.station).length + ' with posts and no station) from ' + scan.posts.size + ' posts in ' + scan.blocks + ' blocks');
    const held = list.rows.filter((s) => !s.house);
    check(held.every((s) => C.checkClaimable(s.code, 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME', lw).ok === false), 'live: every held station is refused to a newcomer' + (held.length ? ' (' + held.map((s) => s.code).join(', ') + ')' : ''));
    check(HOUSE_CODES.every((c) => !C.planBroadcast({ station: lw.byCode.get(c), sender: lw.byCode.get(c).owner, title: 't', body: 'b', world: lw }).ok), 'live: the page would post to none of the house channels, not even for the house’s own key');
  }
}
h.finish();
