// Channels: /chain/channels (src/pages/chain/channels.astro), the logic
// public/chain/apps/channels.js (no DOM), the DOM side channels-view.js and the
// shared key panel.
//
// What this suite holds:
//   - the chain's rules are checked in the page before anything is signed, with
//     words a person can read: a code is [A-Z0-9]{1,16}; the first claim wins; a
//     house code, a code the house holds and a reserved lane are refused; one
//     account holds a fixed number; a name is 1..32 bytes without control or
//     invisible characters; a crew is at most 16 real addresses, never the owner;
//   - a claim, a change and a post are signed with the visitor's key and verify
//     against the chain's own digest; set_station sends back the pin and the
//     offer the station already has (it replaces all three); a change with two
//     steps puts the crew first;
//   - a write is checked again against a fresh read of the devnet right before it
//     is signed, a post's body is stored by its hash first and the word filter's
//     refusal is shown verbatim with nothing signed, and a refusal from the chain
//     (a stale view that still lists a crew member) is shown as the chain said it;
//   - the page broadcasts only to a channel the key owns or crews, never to a
//     house code or a code the house holds;
//   - the directory joins GET /stations to the posts in GET /feed, shows only
//     what hashes to what it commits to, marks hidden posts, reads older blocks
//     on request, and shows every devnet text as plain text;
//   - each guard is proven by mutation: the suite fails the mutant;
//   - the page pins the genesis, stops at GENESIS CHANGED, is lazy, honours
//     ?devnet= only for localhost and 127.0.0.1, writes only on button presses
//     after a confirm box, and says what moderation exists and what does not.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET, DEVNET_PREVIOUS, RESET } from '../src/data/chain-home.ts';
import { APP, HONESTY_LINE, HOW_STEPS, MODERATION, MODE_CARDS, NOT_LIST, RESERVED_LANES, RULES, STATION_FACTS, codeSnippet } from '../src/data/chain-app-channels.ts';
import { CHAIN_APPS } from '../src/data/chain-apps.ts';
import { CHANNELS } from '../src/lib/channels.ts';
import * as C from '../public/chain/apps/channels.js';
import * as view from '../public/chain/apps/channels-view.js';
import * as K from '../public/chain/apps/chain-kit.js';
import { BAD_WORD, CHAIN_ID, DOMAIN, GENESIS, HOUSE, HOUSE_CODES, WORDS, stationsDevnet } from './helpers/fake-stations.mjs';
import { assertNoSinks, bannedHits, BANNED, callArgs, code, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const FILES = {
  logic: 'public/chain/apps/channels.js',
  view: 'public/chain/apps/channels-view.js',
  keys: 'public/chain/apps/key-panel.js',
  page: 'src/pages/chain/channels.astro',
  data: 'src/data/chain-app-channels.ts',
};
const src = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, read(p)]));
const MY_FILES = [...Object.values(FILES), 'tests/chain-app-channels.test.mjs', 'tests/helpers/fake-stations.mjs', 'scripts/e2e-chain-app-channels.mjs'].filter((p) => existsSync(new URL(p, root)));
const HEX = (c) => c.repeat(64);
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const SEEDS = { owner: '41'.repeat(32), crew: '42'.repeat(32), out: '43'.repeat(32), more: '44'.repeat(32) };
const keyOf = (n) => K.keyFromSeed(SEEDS[n]);
/** The four kinds of address a crew may name. */
const ADDR = {
  tz1: K.pcc.tezosAddress({ scheme: 'ed25519', bytes: HEX('5') }),
  tz2: K.pcc.tezosAddress({ scheme: 'secp256k1', bytes: '02' + HEX('6') }),
  pca1: K.pcc.agentAddress({ scheme: 'ed25519', bytes: HEX('7') }),
  pcp1: K.pcc.PASSKEY_PREFIX + K.pcc.b58checkEncode(new Uint8Array(20).fill(8)),
};
const A1 = ADDR.tz1;
const A2 = K.pcc.tezosAddress({ scheme: 'ed25519', bytes: HEX('9') });
const OWNER_ADDR = (await keyOf('owner')).sender;
const CREW_ADDR = (await keyOf('crew')).sender;
const OUT_ADDR = (await keyOf('out')).sender;
const rot13 = (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.toLowerCase().charCodeAt(0) - 97 + 13) % 26) + 97));

/** A station as the devnet lists it. */
const stn = (o) => ({ code: 'MYCH', owner: OWNER_ADDR, name: 'My channel', mode: 'crew', crew: [], pinned: null, offer: null, house: false, claimed_at: 41, ...o });
/** The world the rules read: a stations list (with the six house codes) and the launch facts. */
function worldOf(extra = [], o = {}) {
  const rows = [...HOUSE_CODES.map((c) => stn({ code: c, owner: HOUSE, name: c, mode: 'open', house: true, claimed_at: 0 })), ...extra];
  const list = C.readStations({ enabled: o.enabled !== false, house_codes: HOUSE_CODES, max_stations: o.max ?? 4, stations: rows });
  return C.makeWorld({ status: { house: o.house === undefined ? HOUSE : o.house }, list, launch: o.launch || { stations: true, maxStations: null, maxAccountStations: o.maxAccount ?? 1024, ticketed: o.ticketed === true } });
}

/** Load channels.js with edits to its source, for the mutation proofs. Each edit must match once. */
let mutantSeq = 0;
async function mutant(edits, file = FILES.logic) {
  let text = src.logic;
  if (file !== FILES.logic) text = read(file);
  for (const [from, to] of edits) {
    assert.equal(text.split(from).length - 1, 1, 'the guard text to mutate appears exactly once: ' + from);
    text = text.replace(from, () => to);
  }
  text = text.replace("from './chain-kit.js'", "from '" + pathToFileURL(new URL('public/chain/apps/chain-kit.js', root).pathname).href + "'");
  const dir = mkdtempSync(join(tmpdir(), 'channels-mutant-'));
  const f = join(dir, 'channels-mutant-' + (mutantSeq += 1) + '.mjs');
  writeFileSync(f, text);
  try { return await import(pathToFileURL(f).href); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// ================================================================ the code and the name

test('a code is capital letters and digits, up to 16: lower case is made upper case, anything else is refused with the character named', () => {
  assert.deepEqual(C.checkCode(' mych2 '), { ok: true, code: 'MYCH2', error: '' });
  assert.equal(C.checkCode('A'.repeat(16)).ok, true);
  assert.equal(C.checkCode('0').ok, true);
  assert.match(C.checkCode('').error, /Type a channel code: 1 to 16 capital letters and digits/);
  assert.match(C.checkCode(undefined).error, /Type a channel code/);
  assert.match(C.checkCode('A'.repeat(17)).error, /at most 16 characters; this one is 17/);
  assert.match(C.checkCode('my-ch').error, /capital letters A to Z and the digits 0 to 9 and nothing else; “-” is not allowed/);
  assert.match(C.checkCode('my ch').error, /a space is not allowed/);
  assert.match(C.checkCode('a\u200bb').error, /the invisible character U\+200B is not allowed/);
  assert.match(C.checkCode('a\u0007b').error, /the invisible character U\+0007 is not allowed/);
  assert.match(C.checkCode('é').error, /“É” is not allowed|“é” is not allowed/);
  // upper-casing is ASCII only: ß, dotless i and full-width letters are not turned into valid codes behind the person's back
  for (const t of ['ß', 'ı', 'ＡＢ', 'ǆ', 'ﬃ']) assert.equal(C.checkCode(t).ok, false, t);
  assert.match(C.checkCode('<img>').error, /“<” is not allowed/);
  assert.equal(C.checkCode('A\u0000B').ok, false);
  assert.equal(C.checkCode('A'.repeat(17) + '-').ok, false);
});

test('a station name is 1 to 32 bytes with no control, direction or invisible characters, and a name already on chain is kept exactly', () => {
  assert.deepEqual(C.checkName('  Frog   night  shift '), { ok: true, name: 'Frog night shift', error: '' });
  assert.equal(C.checkName('é'.repeat(16)).ok, true, '32 bytes exactly');
  assert.match(C.checkName('é'.repeat(17)).error, /at most 32 bytes \(letters with accents and emoji take 2 to 4 each\); this one is 34/);
  assert.match(C.checkName('😀'.repeat(9)).error, /this one is 36/);
  assert.match(C.checkName('').error, /Give the station a name, 1 to 32 bytes/);
  assert.match(C.checkName('   ').error, /Give the station a name/);
  for (const bad of ['a\u0007b', 'a\u202eb', 'a\u200bb', 'a\u2066b', 'a\u061cb', 'a\u200db', 'a\ufeffb', 'a\u2028b']) assert.match(C.checkName(bad).error, /control, direction or invisible formatting characters/, JSON.stringify(bad));
  assert.equal(C.checkName('tab\tsep').name, 'tab sep', 'a tab is whitespace, folded');
  // the name on chain may hold double spaces; unchanged, it is sent back as it is
  assert.deepEqual(C.checkName('two  spaces ', 'two  spaces '), { ok: true, name: 'two  spaces ', error: '' });
  assert.equal(C.checkName('two  spaces', 'two  spaces ').name, 'two spaces');
});

// ================================================================ can this key claim this code

test('every refusal of a claim says why, in the words the chain and the page use', () => {
  const w = worldOf([stn({ code: 'TAKEN', owner: A1 }), stn({ code: 'MINE', owner: OWNER_ADDR }), stn({ code: 'NM', owner: HOUSE, name: 'Nouns Money' }), stn({ code: 'GIFT', owner: A1, offer: OWNER_ADDR }), stn({ code: 'HOUSEOWNED', owner: A1, house: true })]);
  const msg = (c, who = OWNER_ADDR, world = w) => C.checkClaimable(c, who, world);
  assert.deepEqual([msg('FRESH').ok, msg('FRESH').kind], [true, 'new']);
  assert.match(msg('fresh').message, /^“FRESH” is free\. First come, first served: the first claim the devnet seals wins it\.$/);
  assert.match(msg('FD').message, /^“FD” is a house code: the devnet’s house has held it since block 0, and the chain refuses every other claim on it \(“someone else holds this station”\)\.$/);
  for (const c of HOUSE_CODES) assert.equal(msg(c).ok, false, c);
  assert.match(msg('NM').message, /^“NM” is held by the devnet’s house, since block 41\. First come, first served: it is taken\.$/);
  assert.match(msg('TAKEN').message, new RegExp('^“TAKEN” is held by ' + A1 + ', since block 41\\. First come, first served: it is taken\\.$'));
  assert.match(msg('MINE').message, /^“MINE” is already yours \(claimed in block 41\)\. Change its mode or crew under “Mode and crew”\.$/);
  assert.deepEqual([msg('GIFT').ok, msg('GIFT').kind], [true, 'take_offer']);
  assert.match(msg('GIFT').message, /Its owner offered “GIFT” to you\. Claiming takes it, and clears its crew and its pin\./);
  assert.equal(msg('GIFT', OUT_ADDR).ok, false, 'an offer is for one person');
  assert.match(msg('HOUSEOWNED').message, /is a house code/);
  for (const [c, why] of [['BOT', /the bots’ lane/], ['DLY', /Daily Mint/], ['NET', /Daily Net/], ['OBS', /Daily Net/], ['WIT', /Daily Net/], ['NOTARY', /Notary/], ['CRT', /website channel code/], ['SPN', /website channel code/]]) {
    assert.match(msg(c).message, new RegExp('^“' + c + '” is not offered here, because it is .*' + why.source + '.* The chain would take the claim, and a claim in crew mode would lock out whatever posts there, so this page does not make it\\.$'), c);
    assert.equal(msg(c).ok, false);
  }
  assert.match(msg('').message, /Type a channel code/);
  assert.match(msg('A-B').message, /“-” is not allowed/);
  assert.match(C.checkClaimable('FRESH', '', w).message, /is free/, 'the hint needs no key');
});

test('one account holds a fixed number of stations: the fifth is refused, the house’s own codes count against nobody, and an offer counts too', () => {
  const four = ['A1', 'A2', 'A3', 'A4'].map((c) => stn({ code: c, owner: OWNER_ADDR }));
  const w = worldOf(four);
  assert.equal(C.heldBy(w, OWNER_ADDR), 4);
  assert.equal(C.heldBy(w, HOUSE), 0, 'the treasury’s house codes are held by nobody');
  const r = C.checkClaimable('FIFTH', OWNER_ADDR, w);
  assert.equal(r.ok, false);
  assert.match(r.message, /^You already hold 4 of the 4 stations one account may hold on this devnet, and the chain refuses a 5th \(“this holder already holds 4 stations”\)\. The house’s own codes count against nobody\.$/);
  assert.equal(C.checkClaimable('FIFTH', OUT_ADDR, w).ok, true, 'another key holds none');
  assert.equal(C.checkClaimable('FIFTH', OWNER_ADDR, worldOf(four.slice(0, 3))).ok, true);
  assert.equal(C.checkClaimable('FIFTH', OWNER_ADDR, worldOf(four, { max: 5 })).ok, true, 'the limit is the devnet’s, read from it');
  const gift = worldOf([...four, stn({ code: 'GIFT', owner: A1, offer: OWNER_ADDR })]);
  assert.match(C.checkClaimable('GIFT', OWNER_ADDR, gift).message, /offered to you, but you already hold 4 of the 4/);
  // a house station its owner holds by an offer stays the house's: it counts against nobody
  assert.equal(C.heldBy(worldOf([stn({ code: 'ART', owner: A1, house: true })]), A1), 0);
});

test('a devnet with no stations, one that asks for presence tickets, or one at its chain-wide limit takes no claim, and the page says so', () => {
  assert.match(C.checkClaimable('FRESH', OWNER_ADDR, worldOf([], { enabled: false })).message, /no stations \(launch record 13 is off\)/);
  assert.match(C.checkClaimable('FRESH', OWNER_ADDR, worldOf([], { ticketed: true })).message, /asks for a bound presence ticket to claim a station, which this page cannot make/);
  const full = worldOf(['X1', 'X2', 'X3'].map((c, i) => stn({ code: c, owner: [A1, A2, ADDR.tz2][i] })), { maxAccount: 3 });
  assert.match(C.checkClaimable('FRESH', OWNER_ADDR, full).message, /already holds its most claimed stations \(3\) and takes no more until a reset/);
  assert.match(C.checkClaimable('FRESH', OWNER_ADDR, C.makeWorld()).message, /stations are not read yet/);
  assert.deepEqual(C.readLaunch({ launch: { stations: { max_stations: 4, max_account_stations: 1024 }, presence: { tap_policy: 'open' } } }), { stations: true, maxStations: 4, maxAccountStations: 1024, ticketed: false });
  assert.equal(C.readLaunch({ launch: { stations: {}, presence: { tap_policy: 'ticketed' } } }).ticketed, true);
  assert.equal(C.readLaunch({}).stations, false);
});

test('a claim plan lists every problem at once and says what is needed', () => {
  const w = worldOf();
  const ok = C.planClaim({ code: 'fresh', name: ' My  station ', mode: 'Crew', sender: OWNER_ADDR, world: w });
  assert.equal(ok.ok, true, ok.errors.join(' '));
  assert.deepEqual(ok.fields, { code: 'FRESH', name: 'My station', mode: 'crew', kind: 'new' });
  assert.deepEqual(ok.input, { code: 'fresh', name: ' My  station ', mode: 'Crew' });
  const bad = C.planClaim({ code: 'FD', name: '', mode: '', sender: '', world: w });
  assert.equal(bad.ok, false);
  assert.equal(bad.errors.length, 4);
  assert.match(bad.errors.join(' | '), /house code.*\| Give the station a name.*\| Pick a mode: open \(anyone posts\) or crew \(only you and your crew post\)\..*\| Make a key first/);
  assert.equal(C.planClaim({ code: 'FRESH', name: 'x', mode: 'sideways', sender: OWNER_ADDR, world: w }).ok, false);
  assert.equal(C.planClaim({ code: 'FRESH', name: 'x', mode: 'open', sender: OWNER_ADDR, world: w }).ok, true);
});

// ================================================================ crew, mode, the change

test('a crew is real addresses, sorted and unique, never the owner, at most 16', () => {
  const all = C.parseCrew([ADDR.tz1, ADDR.tz2, ADDR.pca1, ADDR.pcp1].join(', '), OWNER_ADDR);
  assert.equal(all.ok, true, all.errors.join(' '));
  assert.equal(all.list.length, 4);
  assert.deepEqual(all.list, [...all.list].sort(), 'sorted the way the chain wants (byte order)');
  assert.deepEqual(C.parseCrew(A1 + '\n' + A1 + ' ' + A1, OWNER_ADDR).list, [A1], 'duplicates fold');
  assert.deepEqual(C.parseCrew('', OWNER_ADDR), { ok: true, list: [], errors: [] });
  assert.deepEqual(C.parseCrew([A1, A2], OWNER_ADDR).list, [A1, A2].sort());
  const bad = C.parseCrew('tz1notanaddress, ' + OWNER_ADDR + ', ' + A1, OWNER_ADDR);
  assert.equal(bad.ok, false);
  assert.match(bad.errors[0], /^“tz1notanaddress” is not a devnet address \(tz1…, tz2…, pca1… or pcp1…\)\.$/);
  assert.match(bad.errors[1], /^That is the channel’s owner \(tz1\w+…\w+\): the owner always may post, so it is not listed as crew\.$/);
  assert.deepEqual(bad.list, [A1]);
  const many = Array.from({ length: 17 }, (_, i) => K.pcc.tezosAddress({ scheme: 'ed25519', bytes: String(i + 10).repeat(32).slice(0, 64) }));
  assert.match(C.parseCrew(many, OWNER_ADDR).errors.join(' '), /at most 16 crew; this is 17/);
  assert.equal(C.parseCrew(many.slice(0, 16), OWNER_ADDR).ok, true);
  assert.equal(C.parseCrew('<script>', OWNER_ADDR).ok, false);
  assert.equal(C.parseCrew(ADDR.tz1.slice(0, -1) + 'x', OWNER_ADDR).ok, false, 'a checksum that does not hold is not an address');
});

test('a change to a station: crew first, then the mode; the pin and the standing offer go back exactly as they are; nothing to change is said', () => {
  const pin = HEX('d');
  const st = C.readStation(stn({ crew: [A1], pinned: pin, offer: A2, name: 'Frog  shift' }));
  const w = worldOf([stn({ crew: [A1], pinned: pin, offer: A2, name: 'Frog  shift' })]);
  const both = C.planMode({ station: st, sender: OWNER_ADDR, name: 'Frog  shift', mode: 'open', crew: [A1, ADDR.tz2], world: w });
  assert.equal(both.ok, true, both.errors.join(' '));
  assert.deepEqual(both.steps.map((s) => s.type), ['set_station', 'claim_station'], 'the crew first: a new crew is in place the moment crew mode starts');
  assert.deepEqual(both.steps[0], { type: 'set_station', code: 'MYCH', crew: [A1, ADDR.tz2].sort(), pinned: pin, owner_to: A2 });
  assert.deepEqual(both.steps[1], { type: 'claim_station', code: 'MYCH', name: 'Frog  shift', mode: 'open' }, 'an unchanged name is sent as it is on chain');
  assert.deepEqual(both.diff, { renamed: false, modeChanged: true, added: [ADDR.tz2], removed: [], crewChanged: true });
  const crewOnly = C.planMode({ station: st, sender: OWNER_ADDR, name: 'Frog  shift', mode: 'crew', crew: [], world: w });
  assert.deepEqual(crewOnly.steps.map((s) => s.type), ['set_station']);
  assert.deepEqual(crewOnly.diff.removed, [A1]);
  assert.equal(crewOnly.steps[0].pinned, pin);
  const modeOnly = C.planMode({ station: st, sender: OWNER_ADDR, name: 'Frog  shift', mode: 'open', crew: [A1], world: w });
  assert.deepEqual(modeOnly.steps.map((s) => s.type), ['claim_station']);
  const rename = C.planMode({ station: st, sender: OWNER_ADDR, name: 'New name', mode: 'crew', crew: [A1], world: w });
  assert.deepEqual(rename.steps, [{ type: 'claim_station', code: 'MYCH', name: 'New name', mode: 'crew' }]);
  assert.match(C.planMode({ station: st, sender: OWNER_ADDR, name: 'Frog  shift', mode: 'crew', crew: [A1], world: w }).errors[0], /^Nothing to change: the station already has this name, mode and crew\.$/);
  assert.match(C.planMode({ station: st, sender: OUT_ADDR, name: 'x', mode: 'open', crew: [], world: w }).errors[0], /is held by tz1\w+, not by this key\. Only the owner can change its mode or crew \(“only the station’s owner may do this”\)\./);
  assert.match(C.planMode({ station: null, sender: OWNER_ADDR, name: 'x', mode: 'open', crew: [], world: w }).errors[0], /Pick one of your channels/);
  assert.match(C.planMode({ station: st, sender: '', name: 'x', mode: 'open', crew: [], world: w }).errors[0], /Make a key first/);
  assert.match(C.planMode({ station: st, sender: OWNER_ADDR, name: 'x'.repeat(40), mode: 'open', crew: [], world: w }).errors.join(' '), /at most 32 bytes/);
  assert.match(C.planMode({ station: st, sender: OWNER_ADDR, name: 'x', mode: 'open', crew: [OWNER_ADDR], world: w }).errors.join(' '), /the channel’s owner/);
  assert.match(C.planMode({ station: st, sender: OWNER_ADDR, name: 'x', mode: 'open', crew: ['nope'], world: w }).errors.join(' '), /not a devnet address/);
  assert.match(C.planMode({ station: st, sender: OWNER_ADDR, name: 'x', mode: '', crew: [], world: w }).errors.join(' '), /Pick a mode/);
  assert.match(C.planMode({ station: st, sender: OWNER_ADDR, name: 'x', mode: 'open', crew: [], world: worldOf([], { ticketed: true }) }).errors.join(' '), /presence ticket/);
});

test('modeWords says in one sentence who can post, for each mode, and the page’s cards say the same', () => {
  assert.match(C.modeWords('crew', 'FOO', 2), /^Crew: only the owner and the 2 crew members post on FOO, and seal time capsules on it\. Anyone else is refused by the chain with “only this station’s owner and crew post or seal here”\. Everyone can still read it\.$/);
  assert.match(C.modeWords('crew', 'FOO', 1), /the 1 crew member post/);
  assert.match(C.modeWords('crew', 'FOO', 0), /the crew \(none yet\)/);
  assert.match(C.modeWords('open', 'FOO', 0), /^Open: anyone with a devnet key can post on FOO\. The owner keeps the code and can switch it to crew at any time\.$/);
  assert.match(C.modeWords('open', 'FOO', 3), /The 3 crew listed are only a roster while it is open/);
  assert.deepEqual(MODE_CARDS.map((m) => m.mode), ['open', 'crew']);
  assert.match(MODE_CARDS[1].text, /“only this station’s owner and crew post or seal here”/);
  assert.match(MODE_CARDS[0].text, /Anyone with a devnet key can post/);
});

// ================================================================ broadcasting: who, and what

test('a post is checked before anything is stored: own or crew only, never a house channel, a title and a body within the limits', () => {
  const w = worldOf([stn({ code: 'MYCH', crew: [CREW_ADDR] }), stn({ code: 'OPEN1', owner: A1, mode: 'open' }), stn({ code: 'NM', owner: HOUSE, name: 'Nouns Money' }), stn({ code: 'VIA', owner: OWNER_ADDR, house: true })]);
  const at = (code) => w.byCode.get(code) || null;
  const plan = (o = {}) => C.planBroadcast({ station: at('MYCH'), sender: OWNER_ADDR, title: 'Hello', body: 'World', world: w, ...o });
  const ok = plan();
  assert.equal(ok.ok, true, ok.errors.join(' '));
  assert.deepEqual(ok.fields, { code: 'MYCH', title: 'Hello', body: 'World', bodyHash: K.pcc.bodyHash('World') });
  assert.equal(plan({ sender: CREW_ADDR }).ok, true, 'crew may post');
  assert.match(plan({ sender: OUT_ADDR }).errors[0], /^This key is not the owner or on the crew of “MYCH”\. The chain would refuse the post: “only this station’s owner and crew post or seal here”\.$/);
  assert.match(plan({ station: at('OPEN1'), sender: OWNER_ADDR }).errors[0], /The chain lets anyone post to an open station, but this page broadcasts only to a channel you own or crew\./);
  assert.match(plan({ station: at('FD') }).errors[0], /^“FD” is a house channel, held by the devnet’s house\. This page never posts to the house’s channels\.$/);
  for (const c of HOUSE_CODES) assert.equal(plan({ station: at(c) }).ok, false, c);
  assert.match(plan({ station: at('NM') }).errors[0], /a house channel/, 'held by the treasury');
  assert.match(plan({ station: at('VIA') }).errors[0], /a house channel/, 'a house code stays the house’s even when a person owns it');
  assert.match(plan({ station: null }).errors[0], /Pick a channel you own or crew\. A code nobody has claimed has no owner or crew: claim it first\./);
  assert.match(plan({ sender: '' }).errors[0], /Make a key first/);
  assert.match(plan({ title: '' }).errors.join(' '), /The title cannot be empty\./);
  assert.match(plan({ title: 'x'.repeat(121) }).errors.join(' '), /The title: at most 120 characters\./);
  assert.match(plan({ title: 'é'.repeat(101) }).errors.join(' '), /The title: at most 200 bytes \(the chain’s limit; accents and emoji take 2 to 4 each\)\./);
  assert.equal(plan({ title: 'é'.repeat(100) }).ok, true, '200 bytes exactly');
  for (const bad of ['a\u0007b', 'a\u202eb', 'a\u200bb']) assert.match(plan({ title: bad }).errors.join(' '), /The title: no control, direction or invisible formatting characters\./);
  assert.match(plan({ body: '' }).errors.join(' '), /The body cannot be empty: the devnet’s word filter reads it, and every post here carries one\./);
  assert.match(plan({ body: 'x'.repeat(4001) }).errors.join(' '), /The body: at most 4000 bytes \(4001 now\)\./);
  assert.match(plan({ body: 'é'.repeat(2001) }).errors.join(' '), /at most 4000 bytes/);
  assert.equal(plan({ body: 'é'.repeat(2000) }).ok, true);
  assert.match(plan({ body: 'a\u0000b' }).errors.join(' '), /The body: no control or direction characters\./);
  assert.match(plan({ body: 'a\u202eb' }).errors.join(' '), /no control or direction characters/);
  assert.equal(plan({ body: 'tabs\tand\nlines' }).ok, true);
  assert.deepEqual(C.broadcastTargets(w, OWNER_ADDR).map((s) => s.code), ['MYCH'], 'the channels this key may broadcast to: owned or crewed, never the house’s');
  assert.deepEqual(C.broadcastTargets(w, CREW_ADDR).map((s) => s.code), ['MYCH']);
  assert.deepEqual(C.broadcastTargets(w, OUT_ADDR), []);
  assert.deepEqual(C.broadcastTargets(w, ''), []);
});

// ================================================================ reading

test('a station reads from the devnet’s three shapes, and a code with no station is null', () => {
  const flat = { claimed_at: 7, code: 'ABC', crew: [A1], house: false, mode: 'crew', name: 'Abc', offer: null, owner: OWNER_ADDR, pinned: HEX('e') };
  const s = C.readStation(flat);
  assert.deepEqual(s, { code: 'ABC', nameRaw: 'Abc', name: 'Abc', owner: OWNER_ADDR, mode: 'crew', crew: [A1], pinned: HEX('e'), offer: null, house: false, claimedAt: 7 });
  assert.deepEqual(C.readStation({ station: flat }), s);
  assert.equal(C.readStation({ code: 'ABC', station: null }), null);
  for (const bad of [null, 5, 'x', {}, { ...flat, code: 'abc' }, { ...flat, owner: 'nope' }, { ...flat, mode: 'secret' }, { ...flat, code: 'A'.repeat(17) }]) assert.equal(C.readStation(bad), null, JSON.stringify(bad));
  const odd = C.readStation({ ...flat, crew: [A1, 5, 'junk', null], pinned: 'nothex', offer: 'nope', claimed_at: -1 });
  assert.deepEqual(odd.crew, [A1]);
  assert.equal(odd.pinned, null);
  assert.equal(odd.offer, null);
  assert.equal(odd.claimedAt, 0);
  assert.equal(C.readStation({ ...flat, name: 'a\u202eb' }).name, 'a b'.replace(' ', ' '), 'a name is shown as one safe line');
  assert.equal(C.readStation({ ...flat, name: 'a\u202eb' }).nameRaw, 'a\u202eb', 'but the raw name is kept to be sent back');
  const list = C.readStations({ enabled: true, house_codes: ['FD', 'x', 5], max_stations: 4, stations: [flat, { nope: 1 }, null] });
  assert.deepEqual([list.enabled, list.houseCodes, list.maxStations, list.rows.length], [true, ['FD'], 4, 1]);
  assert.equal(C.readStations({}), null);
  assert.equal(C.readStations({ enabled: false, stations: [] }).enabled, false);
});

/** A feed with posts on a few channels, as the devnet serves it. */
function feedDevnet(extra = {}) {
  return stationsDevnet({
    stations: [{ code: 'MYCH', owner: OWNER_ADDR, name: 'My channel', mode: 'crew', crew: [CREW_ADDR] }, { code: 'OPEN1', owner: A1, name: 'Open one', mode: 'open' }],
    posts: [
      { channel: 'MYCH', title: 'first on MYCH', body: 'one', sender: OWNER_ADDR },
      { channel: 'BOT', title: 'a bot line', body: 'beep', sender: A2 },
      { channel: 'MYCH', title: 'second on MYCH', body: 'two\nlines', sender: CREW_ADDR },
      { channel: 'OPEN1', title: 'hello open', body: 'o', sender: A1 },
      { channel: 'MYCH', title: 'hidden one', body: 'secret text', sender: OWNER_ADDR, hidden: true },
    ],
    ...extra,
  });
}

test('the feed gives each post with the body only when it hashes to what the post commits to, a hidden post as hidden, newest first', async () => {
  const dev = feedDevnet();
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: dev.fetch });
  const page = C.readFeedPage(await net.get('/feed?limit=100'));
  assert.equal(page.blockCount, 5);
  assert.equal(page.posts.length, 5);
  assert.deepEqual(page.posts.map((p) => p.title), ['hidden one', 'hello open', 'second on MYCH', 'a bot line', 'first on MYCH'].map((t) => (t === 'hidden one' ? '[hidden by the devnet admin]' : t)));
  const second = page.posts.find((p) => p.title === 'second on MYCH');
  assert.deepEqual([second.bodyState, second.body, second.channel, second.sender], ['ok', 'two\nlines', 'MYCH', CREW_ADDR]);
  assert.ok(second.height > 0 && second.timeMs > 0);
  const hidden = page.posts[0];
  assert.deepEqual([hidden.hidden, hidden.bodyState, hidden.body], [true, 'hidden', '']);
  // a body that does not hash to body_hash is not shown
  const raw = await net.get('/feed?limit=100');
  const tampered = JSON.parse(JSON.stringify(raw));
  const card = tampered.blocks.flatMap((b) => b.txs).find((t) => t.payload.title === 'first on MYCH');
  card.payload.body = 'something else';
  assert.deepEqual(C.readFeedPage(tampered).posts.find((p) => p.title === 'first on MYCH').bodyState, 'unverified');
  assert.equal(C.readFeedPage(tampered).posts.find((p) => p.title === 'first on MYCH').body, '');
  // no body sent, an all-zero hash, and a card that is not a post
  const gone = JSON.parse(JSON.stringify(raw));
  const g = gone.blocks.flatMap((b) => b.txs).find((t) => t.payload.title === 'hello open');
  delete g.payload.body;
  assert.equal(C.readFeedPage(gone).posts.find((p) => p.title === 'hello open').bodyState, 'missing');
  g.payload.body_hash = '0'.repeat(64);
  assert.equal(C.readFeedPage(gone).posts.find((p) => p.title === 'hello open').bodyState, 'none');
  for (const bad of [null, {}, { blocks: 'x' }]) assert.equal(C.readFeedPage(bad), null);
  assert.equal(C.readPostCard({ kind: 'transfer', payload: {}, sender: A1, hash: HEX('1') }, { height: 1 }), null);
  assert.equal(C.readPostCard({ kind: 'publish_block', payload: { channel: 'lower', title: 't' }, sender: A1, hash: HEX('1') }, { height: 1 }), null);
  assert.equal(C.readPostCard({ kind: 'publish_block', payload: { channel: 'OK', title: 't' }, sender: A1, hash: 'short' }, { height: 1 }), null);
});

test('within one block the newest card comes first, and a feed scan pages with before, stops when the devnet is out, and is read again for new posts only', async () => {
  const block = { height: 9, timestamp: 1792480000000, txs: ['one', 'two', 'three'].map((t, i) => ({ hash: String(i + 1).repeat(64), kind: 'publish_block', payload: { channel: 'MYCH', title: t, body_hash: '0'.repeat(64) }, sender: A1 })) };
  assert.deepEqual(C.readFeedPage({ tip: 9, blocks: [block], next_before: 9 }).posts.map((p) => p.title), ['three', 'two', 'one']);
  const dev = feedDevnet();
  const log = [];
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: async (u, i) => { log.push(String(u).replace('http://127.0.0.1:8799', '')); return dev.fetch(u, i); } });
  const scan = C.newScan();
  await C.scanFeed(net, scan, { pages: 2, limit: 2 });
  assert.deepEqual([scan.pages, scan.blocks, scan.posts.size, scan.complete], [2, 4, 4, false]);
  assert.ok(log[1].includes('before='), 'the second page asks for older blocks');
  await C.scanFeed(net, scan, { pages: 5, limit: 2 });
  assert.equal(scan.complete, true);
  assert.equal(scan.posts.size, 5);
  const calls = log.length;
  await C.scanFeed(net, scan, { pages: 5, limit: 2 });
  assert.equal(log.length, calls, 'a finished scan reads nothing more');
  // a new post turns up in the newest page, and the older cursor does not move
  const k = await keyOf('owner');
  const chain = dev.chain;
  const before = scan.before;
  const w = await C.readWorldFresh(net, chain);
  const plan = C.planBroadcast({ station: w.byCode.get('MYCH'), sender: k.sender, title: 'fresh', body: 'new', world: w });
  await C.sendBroadcast({ chain, net, key: k, plan });
  assert.equal(await C.refreshNewest(net, scan, { limit: 2 }), 2);
  assert.equal(scan.posts.size, 6);
  assert.equal(scan.before, before);
  await C.refreshNewest(net, scan, { limit: 2 });
  assert.equal(scan.posts.size, 6, 'the same posts are not counted twice');
  assert.deepEqual(C.postsOf(scan, 'MYCH').map((p) => p.title).slice(0, 2), ['fresh', '[hidden by the devnet admin]']);
  assert.equal(C.postsOf(scan, 'MYCH', 2).length, 2);
});

test('a feed in a shape this page does not read is an error, not an empty directory', async () => {
  const net = { async get() { return { nope: true }; } };
  await assert.rejects(() => C.scanFeed(net, C.newScan()), /\/feed is not the shape this page reads/);
  await assert.rejects(() => C.refreshNewest(net, C.newScan()), /\/feed is not the shape this page reads/);
});

test('the directory lists every code with a station or a post: who holds it, its mode, its crew, its last post; the house first only by activity', async () => {
  const dev = feedDevnet();
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: dev.fetch });
  const w = await C.readWorldFresh(net, dev.chain);
  const scan = await C.scanFeed(net, C.newScan());
  const rows = C.directory({ world: w, scan, me: OWNER_ADDR });
  const by = Object.fromEntries(rows.map((r) => [r.code, r]));
  assert.deepEqual(Object.keys(by).sort(), ['ART', 'BOT', 'FD', 'GDN', 'GF', 'MYCH', 'OPEN1', 'ORC', 'RLY']);
  assert.deepEqual([by.MYCH.held, by.MYCH.mode, by.MYCH.crew.length, by.MYCH.seen, by.MYCH.role, by.MYCH.mayPost], ['you', 'crew', 1, 3, 'owner', true]);
  assert.deepEqual([by.BOT.held, by.BOT.mode, by.BOT.seen, by.BOT.station], ['none', 'unclaimed', 1, null]);
  assert.deepEqual([by.FD.held, by.FD.house, by.FD.mayPost], ['house', true, false]);
  assert.deepEqual([by.OPEN1.held, by.OPEN1.role, by.OPEN1.mayPost], ['other', null, false]);
  assert.equal(by.MYCH.last.title, '[hidden by the devnet admin]', 'the newest post, hidden or not, is the last post');
  assert.equal(rows[0].code, 'MYCH', 'newest post first');
  assert.equal(rows[rows.length - 1].last, null);
  assert.deepEqual(C.filterRows(rows, 'mine').map((r) => r.code), ['MYCH']);
  assert.deepEqual(C.filterRows(rows, 'open').map((r) => r.code).sort(), ['ART', 'FD', 'GDN', 'GF', 'OPEN1', 'ORC', 'RLY']);
  assert.deepEqual(C.filterRows(rows, 'crew').map((r) => r.code), ['MYCH']);
  assert.deepEqual(C.filterRows(rows, 'free').map((r) => r.code), ['BOT']);
  assert.equal(C.filterRows(rows, 'house').length, 6);
  assert.equal(C.filterRows(rows, 'all'), rows);
  const asCrew = C.directory({ world: w, scan, me: CREW_ADDR }).find((r) => r.code === 'MYCH');
  assert.deepEqual([asCrew.held, asCrew.role, asCrew.mayPost], ['other', 'crew', true]);
  assert.equal(C.holderWords(w.byCode.get('MYCH'), w, OWNER_ADDR), 'you');
  assert.equal(C.holderWords(w.byCode.get('FD'), w, ''), 'the house (a house code)');
  assert.match(C.holderWords(w.byCode.get('OPEN1'), w, ''), /^tz1\w{5}…\w{6}$/);
  assert.equal(C.holderWords(null, w), 'nobody (unclaimed)');
});

// ================================================================ sending, with the signing checked

async function client(o = {}) {
  const dev = o.dev || feedDevnet(o.devOpts);
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: o.fetch || dev.fetch });
  return { dev, net, chain: dev.chain, owner: await keyOf('owner'), crew: await keyOf('crew'), out: await keyOf('out'), more: await keyOf('more') };
}
const worldNow = (c) => C.readWorldFresh(c.net, c.chain);

test('a claim is signed by the key, verifies against the chain’s digest, names only the code, the name and the mode, and reads the station back', async () => {
  const c = await client();
  const w = await worldNow(c);
  const plan = C.planClaim({ code: 'newch', name: 'New channel', mode: 'crew', sender: c.owner.sender, world: w });
  const r = await C.sendClaim({ chain: c.chain, net: c.net, key: c.owner, plan });
  assert.equal(c.dev.st.sent.length, 1);
  const sent = c.dev.st.sent[0];
  assert.deepEqual(sent.tx, { type: 'claim_station', sender: c.owner.sender, nonce: 0, code: 'NEWCH', name: 'New channel', mode: 'crew', pid: null });
  assert.equal(await K.pcc.verifyEd25519(sent.public_key.bytes, K.pcc.hexToBytes(K.pcc.signingHash(sent.tx, DOMAIN)), sent.signature), true);
  assert.equal(r.txHash, K.pcc.txHash(sent));
  assert.ok(Number.isInteger(r.height));
  assert.deepEqual([r.station.code, r.station.owner, r.station.mode, r.station.name, r.station.crew], ['NEWCH', c.owner.sender, 'crew', 'New channel', []]);
  // the nonce moves on
  const plan2 = C.planClaim({ code: 'other', name: 'Other', mode: 'open', sender: c.owner.sender, world: await worldNow(c) });
  await C.sendClaim({ chain: c.chain, net: c.net, key: c.owner, plan: plan2 });
  assert.equal(c.dev.st.sent[1].tx.nonce, 1);
  // an invalid plan sends nothing
  const n = c.dev.st.sent.length;
  await assert.rejects(() => C.sendClaim({ chain: c.chain, net: c.net, key: c.owner, plan: C.planClaim({ code: 'FD', name: 'x', mode: 'open', sender: c.owner.sender, world: w }) }), /“FD” is a house code/);
  assert.equal(c.dev.st.sent.length, n);
  // the receipt rows say what was sealed and what the chain now says
  const rows = view.receiptRows({ kind: 'claim_station', txHash: r.txHash, height: r.height, index: r.index, sender: c.owner.sender, api: 'http://x', chainId: CHAIN_ID, station: r.station, code: 'NEWCH' });
  assert.deepEqual(rows.map((x) => x[0]), ['Write', 'Transaction', 'In block', 'Signed by', 'Sent to', 'The chain now says', 'Check it yourself']);
  assert.match(rows[5][1], /^NEWCH · crew mode · owner tz1\w+ · name “New channel” · 0 crew members$/);
  assert.equal(rows[6][1], 'GET /tx/' + r.txHash + ' and GET /station/NEWCH');
});

test('a claim is checked again against a fresh read right before it is signed: a code taken since the plan was made sends nothing', async () => {
  const c = await client();
  const stale = await worldNow(c);
  const plan = C.planClaim({ code: 'race', name: 'Race', mode: 'crew', sender: c.owner.sender, world: stale });
  assert.equal(plan.ok, true);
  // someone else claims it first
  const rival = C.planClaim({ code: 'race', name: 'Rival', mode: 'open', sender: c.out.sender, world: stale });
  await C.sendClaim({ chain: c.chain, net: c.net, key: c.out, plan: rival });
  const before = c.dev.st.sent.length;
  await assert.rejects(() => C.sendClaim({ chain: c.chain, net: c.net, key: c.owner, plan }), (e) => e.code === 'gate' && /^“RACE” is held by tz1\w+, since block \d+\. First come, first served: it is taken\.$/.test(e.message));
  assert.equal(c.dev.st.sent.length, before, 'nothing was signed or sent');
});

test('when the chain itself refuses a claim, its words come through and the error says nothing was sent', async () => {
  const c = await client();
  // a page that still thinks the code is free: serve the stations list from before the rival's claim
  const w = await worldNow(c);
  await C.sendClaim({ chain: c.chain, net: c.net, key: c.out, plan: C.planClaim({ code: 'late', name: 'Rival', mode: 'open', sender: c.out.sender, world: w }) });
  const emptyList = { enabled: true, house_codes: HOUSE_CODES, max_stations: 4, stations: [] };
  const staleNet = { ...c.net, get: async (p) => (p === '/stations' ? emptyList : c.net.get(p)) };
  const plan = C.planClaim({ code: 'late', name: 'Mine', mode: 'open', sender: c.owner.sender, world: C.makeWorld({ status: { house: HOUSE }, list: C.readStations(emptyList) }) });
  assert.equal(plan.ok, true, 'the stale view says it is free');
  let err = null;
  try { await C.sendClaim({ chain: c.chain, net: staleNet, key: c.owner, plan }); } catch (e) { err = e; }
  assert.ok(err, 'the chain refused');
  assert.equal(err.message, WORDS.taken);
  assert.equal(err.sendState, 'refused');
  assert.match(K.sendFailureText(err, { unsent: 'Not claimed: ' }), /^Not claimed: someone else holds this station\.?$/);
});

test('changing a station: the crew is sent first, then the mode; a pin and an offer survive; the chain reads back what changed', async () => {
  const pin = HEX('d');
  const c = await client({ devOpts: { stations: [{ code: 'PINNED', owner: OWNER_ADDR, name: 'Pinned  one', mode: 'open', crew: [CREW_ADDR], pinned: pin, offer: A2 }] } });
  const w = await worldNow(c);
  const st = w.byCode.get('PINNED');
  const plan = C.planMode({ station: st, sender: c.owner.sender, name: 'Pinned  one', mode: 'crew', crew: [CREW_ADDR, c.out.sender], world: w });
  assert.equal(plan.ok, true, plan.errors.join(' '));
  const stages = [];
  const r = await C.sendMode({ chain: c.chain, net: c.net, key: c.owner, plan, onStage: (s) => stages.push(s) });
  assert.deepEqual(c.dev.st.sent.map((s) => s.tx.type), ['set_station', 'claim_station']);
  const [set, claim] = c.dev.st.sent.map((s) => s.tx);
  assert.deepEqual(set, { type: 'set_station', sender: c.owner.sender, nonce: 0, code: 'PINNED', crew: [CREW_ADDR, c.out.sender].sort(), pinned: pin, owner_to: A2 });
  assert.deepEqual(claim, { type: 'claim_station', sender: c.owner.sender, nonce: 1, code: 'PINNED', name: 'Pinned  one', mode: 'crew', pid: null });
  assert.deepEqual(r.results.map((x) => x.type), ['set_station', 'claim_station']);
  assert.ok(r.results[1].height > r.results[0].height, 'each step is sealed before the next is signed');
  assert.deepEqual([r.station.mode, r.station.crew, r.station.pinned, r.station.offer], ['crew', [CREW_ADDR, c.out.sender].sort(), pin, A2]);
  assert.deepEqual(stages.filter((s) => !s.includes(':')), ['set_station', 'claim_station']);
  for (const s of c.dev.st.sent) assert.equal(await K.pcc.verifyEd25519(s.public_key.bytes, K.pcc.hexToBytes(K.pcc.signingHash(s.tx, DOMAIN)), s.signature), true);
  // removing the whole crew
  const w2 = await worldNow(c);
  const wipe = C.planMode({ station: w2.byCode.get('PINNED'), sender: c.owner.sender, name: 'Pinned  one', mode: 'crew', crew: [], world: w2 });
  const r2 = await C.sendMode({ chain: c.chain, net: c.net, key: c.owner, plan: wipe });
  assert.deepEqual(r2.station.crew, []);
  assert.equal(r2.station.pinned, pin, 'still pinned');
});

test('a change checked against a fresh read: a station that is no longer yours sends nothing, and a failed second step reports the first', async () => {
  const c = await client();
  const w = await worldNow(c);
  await C.sendClaim({ chain: c.chain, net: c.net, key: c.owner, plan: C.planClaim({ code: 'mine1', name: 'Mine', mode: 'open', sender: c.owner.sender, world: w }) });
  const w1 = await worldNow(c);
  const plan = C.planMode({ station: w1.byCode.get('MINE1'), sender: c.owner.sender, name: 'Mine', mode: 'crew', crew: [c.crew.sender], world: w1 });
  // the station is not found on the fresh read (the devnet was reset under the page)
  const emptyNet = { ...c.net, get: async (p) => (p === '/stations' ? { enabled: true, house_codes: HOUSE_CODES, max_stations: 4, stations: [] } : c.net.get(p)) };
  const n = c.dev.st.sent.length;
  await assert.rejects(() => C.sendMode({ chain: c.chain, net: emptyNet, key: c.owner, plan }), (e) => e.code === 'gate' && /Pick one of your channels/.test(e.message));
  assert.equal(c.dev.st.sent.length, n);
  // the first step lands and the second is refused: the error carries what already landed
  const chain2 = { ...c.chain, submit: async (signed) => { if (signed.tx.type === 'claim_station') throw Object.assign(new Error('the devnet answered 503'), { status: 503, details: { error: 'the devnet answered 503' } }); return c.chain.submit(signed); } };
  let err = null;
  try { await C.sendMode({ chain: chain2, net: c.net, key: c.owner, plan }); } catch (e) { err = e; }
  assert.ok(err);
  assert.deepEqual(err.results.map((x) => x.type), ['set_station']);
  assert.equal(c.dev.st.stations.get('MINE1').crew.length, 1, 'the crew did change');
  assert.equal(c.dev.st.stations.get('MINE1').mode, 'open', 'the mode did not');
});

test('a post stores its body by its hash, then is signed and sent; the chain’s refusal and the word filter’s are shown as the devnet said them', async () => {
  const c = await client();
  const w = await worldNow(c);
  const st = w.byCode.get('MYCH');
  const plan = (sender, over = {}) => C.planBroadcast({ station: st, sender: sender.sender, title: 'Broadcast title', body: 'Broadcast body\nwith two lines', world: w, ...over });
  const stages = [];
  const r = await C.sendBroadcast({ chain: c.chain, net: c.net, key: c.owner, plan: plan(c.owner), onStage: (s) => stages.push(s) });
  assert.deepEqual(c.dev.st.stored, ['Broadcast body\nwith two lines'], 'the body is stored first');
  assert.deepEqual(stages.slice(0, 1), ['stored']);
  const tx = c.dev.st.sent[0].tx;
  assert.deepEqual(tx, { type: 'publish_block', sender: c.owner.sender, nonce: 0, channel: 'MYCH', title: 'Broadcast title', body_hash: K.pcc.bodyHash('Broadcast body\nwith two lines'), media_uri: null });
  assert.equal(await K.pcc.verifyEd25519(c.dev.st.sent[0].public_key.bytes, K.pcc.hexToBytes(K.pcc.signingHash(tx, DOMAIN)), c.dev.st.sent[0].signature), true);
  assert.deepEqual([r.post.channel, r.post.title], ['MYCH', 'Broadcast title']);
  // crew posts too
  await C.sendBroadcast({ chain: c.chain, net: c.net, key: c.crew, plan: plan(c.crew, { title: 'From the crew' }) });
  assert.equal(c.dev.st.sent[1].tx.sender, c.crew.sender);
  // the word filter refuses the body: its words, verbatim; nothing is signed or sent
  const sentBefore = c.dev.st.sent.length;
  let err = null;
  try { await C.sendBroadcast({ chain: c.chain, net: c.net, key: c.owner, plan: plan(c.owner, { body: 'this holds ' + BAD_WORD }) }); } catch (e) { err = e; }
  assert.ok(err);
  assert.equal(err.message, 'kept off the devnet by its word filter');
  assert.equal(err.status, 422);
  assert.equal(c.dev.st.sent.length, sentBefore, 'no transaction after a filter refusal');
  assert.equal(K.sendFailureText(err, { unsent: 'Not sent: ' }), 'Not sent: kept off the devnet by its word filter');
  // the page's own gate refuses a key that is not on the crew, before anything is stored
  const storedBefore = c.dev.st.stored.length;
  await assert.rejects(() => C.sendBroadcast({ chain: c.chain, net: c.net, key: c.out, plan: plan(c.out) }), /This key is not the owner or on the crew of “MYCH”/);
  assert.equal(c.dev.st.stored.length, storedBefore);
  // a devnet that stores the body under another hash is an error
  const wrongNet = { ...c.net, post: async (p, b) => (p === '/body' ? { body_hash: HEX('f') } : c.net.post(p, b)) };
  await assert.rejects(() => C.sendBroadcast({ chain: c.chain, net: wrongNet, key: c.owner, plan: plan(c.owner) }), /stored the body under a different hash/);
});

test('a stale view that still lists a crew member: the page sends, and the chain’s own refusal comes through verbatim with sendState refused', async () => {
  const c = await client();
  const w = await worldNow(c);
  const st = w.byCode.get('MYCH');
  // the outsider is not crew on the chain, but the page's last read says so
  const stale = { ...c.net, get: async (p) => { if (p === '/stations') { const j = await c.net.get(p); return { ...j, stations: j.stations.map((s) => (s.code === 'MYCH' ? { ...s, crew: [...s.crew, c.out.sender] } : s)) }; } return c.net.get(p); } };
  const plan = C.planBroadcast({ station: C.readStation({ ...stn({ crew: [c.out.sender] }) }), sender: c.out.sender, title: 'Not on the crew', body: 'let me in', world: w });
  assert.equal(plan.ok, true, 'the stale view allows it');
  const sentBefore = c.dev.st.sent.length;
  let err = null;
  try { await C.sendBroadcast({ chain: c.chain, net: stale, key: c.out, plan }); } catch (e) { err = e; }
  assert.ok(err);
  assert.equal(err.message, WORDS.notCrew);
  assert.equal(err.sendState, 'refused');
  assert.equal(c.dev.st.sent.length, sentBefore, 'the chain took nothing');
  assert.equal(st.mode, 'crew');
  assert.match(K.sendFailureText(err, { unsent: 'Not sent: ' }), /^Not sent: only this station's owner and crew post or seal here\.?$/);
});

test('a reset between the page’s read and its write stops it: GENESIS CHANGED, and nothing is signed', async () => {
  const c = await client();
  const w = await worldNow(c);
  const plan = C.planClaim({ code: 'late2', name: 'x', mode: 'open', sender: c.owner.sender, world: w });
  const reset = stationsDevnet({ genesis: HEX('9') });
  const net2 = K.makeNet('http://127.0.0.1:8799', { fetch: reset.fetch });
  await assert.rejects(() => C.sendClaim({ chain: c.chain, net: net2, key: c.owner, plan }), (e) => e.name === 'GenesisChanged');
  assert.equal(reset.st.sent.length, 0);
});

// ================================================================ the guards, each proven by mutation

test('mutation: without the house-code check a house code is not called a house code, and without the broadcast guards a house channel could be posted to', async () => {
  const w = worldOf([stn({ code: 'VIA', owner: OWNER_ADDR, house: true }), stn({ code: 'NM', owner: HOUSE, name: 'Nouns Money' })]);
  assert.match(C.checkClaimable('FD', OUT_ADDR, w).message, /house code/);
  const m1 = await mutant([['if (world.list.houseCodes.includes(code) || station.house) return', 'if (false) return']]);
  assert.doesNotMatch(m1.checkClaimable('FD', OUT_ADDR, w).message, /house code/, 'the mutant no longer says it');
  // broadcast: a house channel a person owns (by an offer) is still not posted to
  const plan = (mod, code) => mod.planBroadcast({ station: w.byCode.get(code), sender: OWNER_ADDR, title: 't', body: 'b', world: w });
  assert.equal(plan(C, 'VIA').ok, false);
  const m2 = await mutant([['else if (isHouse(station, world)) errors.push(', 'else if (false) errors.push(']]);
  assert.equal(plan(m2, 'VIA').ok, true, 'the mutant posts to a house channel');
  // the targets the page offers
  assert.deepEqual(C.broadcastTargets(w, OWNER_ADDR).map((s) => s.code), []);
  const m3 = await mutant([['roleOf(s, me) && !isHouse(s, world))', 'roleOf(s, me))']]);
  assert.deepEqual(m3.broadcastTargets(w, OWNER_ADDR).map((s) => s.code), ['VIA']);
  // a house station is recognised by its code, its flag and its owner
  const bare = C.makeWorld({ status: { house: HOUSE }, list: C.readStations({ enabled: true, house_codes: ['FD'], stations: [stn({ code: 'FD', owner: A1, house: false })] }) });
  assert.equal(C.isHouse(bare.byCode.get('FD'), bare), true, 'by the record’s house codes');
  const m4 = await mutant([['|| Boolean(world && world.list && world.list.houseCodes.includes(station.code));', '|| false;']]);
  assert.equal(m4.isHouse(bare.byCode.get('FD'), bare), false);
});

test('mutation: without the reserved list, the taken check, the code check, the limit or the chain-wide limit, the claim would be offered', async () => {
  const w = worldOf([stn({ code: 'TAKEN', owner: A1 })].concat(['A1', 'A2', 'A3', 'A4'].map((c) => stn({ code: c, owner: OWNER_ADDR }))));
  assert.equal(C.checkClaimable('BOT', OUT_ADDR, w).ok, false);
  const m1 = await mutant([['if (Object.hasOwn(RESERVED, code)) return', 'if (false) return']]);
  assert.equal(m1.checkClaimable('BOT', OUT_ADDR, w).ok, true);
  assert.equal(C.checkClaimable('TAKEN', OUT_ADDR, w).ok, false);
  const m2 = await mutant([['const station = world.byCode.get(code) || null;\n  if (station) {', 'const station = null;\n  if (station) {']]);
  assert.equal(m2.checkClaimable('TAKEN', OUT_ADDR, w).ok, true, 'a taken code would look free');
  assert.equal(C.checkCode('A-B').ok, false);
  const m3 = await mutant([['chars.find((ch) => !/^[A-Z0-9]$/.test(ch))', 'chars.find((ch) => false)']]);
  assert.equal(m3.checkCode('A-B').ok, true);
  const m3b = await mutant([['if (chars.length > LIMITS.code)', 'if (false)']]);
  assert.equal(m3b.checkCode('A'.repeat(20)).ok, true);
  assert.equal(C.checkClaimable('FIFTH', OWNER_ADDR, w).ok, false);
  const m4 = await mutant([['if (world.max && held >= world.max) return { ok: false, kind: \'\', message: \'You already hold ', 'if (false) return { ok: false, kind: \'\', message: \'You already hold ']]);
  assert.equal(m4.checkClaimable('FIFTH', OWNER_ADDR, w).ok, true, 'a fifth station would be offered');
  const full = worldOf(['X1', 'X2', 'X3'].map((c, i) => stn({ code: c, owner: [A1, A2, ADDR.tz2][i] })), { maxAccount: 3 });
  assert.equal(C.checkClaimable('FRESH', OWNER_ADDR, full).ok, false);
  const m5 = await mutant([['if (taken >= world.maxAccountStations) return', 'if (false) return']]);
  assert.equal(m5.checkClaimable('FRESH', OWNER_ADDR, full).ok, true);
  const tick2 = worldOf([], { ticketed: true });
  assert.equal(C.checkClaimable('FRESH', OWNER_ADDR, tick2).ok, false);
  const m6 = await mutant([['if (world.ticketed) return { ok: false, kind: \'\', message: \'This devnet asks', 'if (false) return { ok: false, kind: \'\', message: \'This devnet asks']]);
  assert.equal(m6.checkClaimable('FRESH', OWNER_ADDR, tick2).ok, true);
  // the name and the mode are in the plan
  assert.equal(C.checkName('é'.repeat(20)).ok, false);
  const m7 = await mutant([['if (n > LIMITS.name) return', 'if (false) return']]);
  assert.equal(m7.checkName('é'.repeat(20)).ok, true);
  const m8 = await mutant([['if (CONTROL.test(typed) || BIDI.test(typed) || FORMAT_CHARS.test(typed)) return { ok: false, name: typed', 'if (false) return { ok: false, name: typed']]);
  assert.equal(m8.checkName('a\u202eb').ok, true);
});

test('mutation: without the crew checks, the broadcast gate or the pin-and-offer carry-over, the change or the post would go wrong', async () => {
  const pin = HEX('d');
  const st = C.readStation(stn({ crew: [A1], pinned: pin, offer: A2 }));
  const w = worldOf([stn({ crew: [A1], pinned: pin, offer: A2 })]);
  const change = (mod, crew) => mod.planMode({ station: st, sender: OWNER_ADDR, name: 'My channel', mode: 'crew', crew, world: w });
  assert.equal(change(C, [OWNER_ADDR]).ok, false);
  const m1 = await mutant([['if (owner && a === owner) {', 'if (false) {']]);
  assert.equal(change(m1, [OWNER_ADDR]).ok, true, 'the owner would be listed as crew');
  assert.equal(change(C, ['nope']).ok, false);
  const m2 = await mutant([['if (pcc.addressKind(a) === null) {', 'if (false) {']]);
  assert.equal(change(m2, ['nope']).ok, true);
  const many = Array.from({ length: 17 }, (_, i) => K.pcc.tezosAddress({ scheme: 'ed25519', bytes: String(i + 10).repeat(32).slice(0, 64) }));
  assert.equal(change(C, many).ok, false);
  const m3 = await mutant([['if (list.length > LIMITS.crew) errors.push(', 'if (false) errors.push(']]);
  assert.equal(change(m3, many).ok, true);
  // set_station carries the pin and the offer back
  assert.deepEqual([change(C, [A1, ADDR.tz2]).steps[0].pinned, change(C, [A1, ADDR.tz2]).steps[0].owner_to], [pin, A2]);
  const m4 = await mutant([['crew: cr.list, pinned: station.pinned, owner_to: station.offer }', 'crew: cr.list, pinned: null, owner_to: null }']]);
  assert.deepEqual([change(m4, [A1, ADDR.tz2]).steps[0].pinned, change(m4, [A1, ADDR.tz2]).steps[0].owner_to], [null, null], 'the mutant drops the pin and the offer');
  // crew first, then the mode
  const both = C.planMode({ station: st, sender: OWNER_ADDR, name: 'My channel', mode: 'open', crew: [A1, ADDR.tz2], world: w });
  assert.deepEqual(both.steps.map((s) => s.type), ['set_station', 'claim_station']);
  const m5 = await mutant([["if (diff.crewChanged) steps.push({ type: 'set_station', code: station.code, crew: cr.list, pinned: station.pinned, owner_to: station.offer });\n    if (diff.renamed || diff.modeChanged) steps.push({ type: 'claim_station', code: station.code, name: nm.name, mode: md });", "if (diff.renamed || diff.modeChanged) steps.push({ type: 'claim_station', code: station.code, name: nm.name, mode: md });\n    if (diff.crewChanged) steps.push({ type: 'set_station', code: station.code, crew: cr.list, pinned: station.pinned, owner_to: station.offer });"]]);
  assert.deepEqual(m5.planMode({ station: st, sender: OWNER_ADDR, name: 'My channel', mode: 'open', crew: [A1, ADDR.tz2], world: w }).steps.map((s) => s.type), ['claim_station', 'set_station']);
  // only the owner changes a station
  assert.equal(C.planMode({ station: st, sender: OUT_ADDR, name: 'x', mode: 'open', crew: [A1], world: w }).ok, false);
  const m6 = await mutant([['if (sender && station.owner !== sender) errors.push(', 'if (false) errors.push(']]);
  assert.equal(m6.planMode({ station: st, sender: OUT_ADDR, name: 'x', mode: 'open', crew: [A1], world: w }).ok, true);
  // the broadcast gate: own or crew
  const bw = worldOf([stn({ crew: [CREW_ADDR] })]);
  const post = (mod, sender) => mod.planBroadcast({ station: bw.byCode.get('MYCH'), sender, title: 't', body: 'b', world: bw });
  assert.equal(post(C, OUT_ADDR).ok, false);
  const m7 = await mutant([['else if (sender && !roleOf(station, sender)) errors.push(', 'else if (false) errors.push(']]);
  assert.equal(post(m7, OUT_ADDR).ok, true, 'the mutant lets a stranger post');
  assert.equal(post(m7, CREW_ADDR).ok, true);
});

test('mutation: without the fresh-read gate a stale claim is sent, without the order a filtered body is followed by a transaction, without the pin the genesis is not checked', async () => {
  // the fresh-read gate in sendClaim
  const setup = async () => {
    const c = await client();
    const stale = await worldNow(c);
    const plan = C.planClaim({ code: 'race', name: 'Race', mode: 'crew', sender: c.owner.sender, world: stale });
    await C.sendClaim({ chain: c.chain, net: c.net, key: c.out, plan: C.planClaim({ code: 'race', name: 'Rival', mode: 'open', sender: c.out.sender, world: stale }) });
    return { c, plan };
  };
  const s1 = await setup();
  await assert.rejects(() => C.sendClaim({ chain: s1.c.chain, net: s1.c.net, key: s1.c.owner, plan: s1.plan }), (e) => e.code === 'gate');
  const m1 = await mutant([["gate(again, 'this claim');", '']]);
  const s2 = await setup();
  const before = s2.c.dev.st.sent.length;
  await assert.rejects(() => m1.sendClaim({ chain: s2.c.chain, net: s2.c.net, key: s2.c.owner, plan: s2.plan }), (e) => e.message === WORDS.taken, 'the mutant goes on to the chain, which refuses');
  assert.equal(s2.c.dev.st.sent.length, before);
  // the filter's refusal ends the post
  const c = await client();
  const w = await worldNow(c);
  const bad = C.planBroadcast({ station: w.byCode.get('MYCH'), sender: c.owner.sender, title: 't', body: BAD_WORD, world: w });
  const sent0 = c.dev.st.sent.length;
  await assert.rejects(() => C.sendBroadcast({ chain: c.chain, net: c.net, key: c.owner, plan: bad }), /word filter/);
  assert.equal(c.dev.st.sent.length, sent0);
  const m2 = await mutant([["const stored = await net.post('/body', { body: f.body });", "const stored = await net.post('/body', { body: f.body }).catch(() => ({ body_hash: f.bodyHash }));"]]);
  await m2.sendBroadcast({ chain: c.chain, net: c.net, key: c.owner, plan: bad });
  assert.equal(c.dev.st.sent.length, sent0 + 1, 'the mutant sends the post the filter refused');
  // the genesis pin
  const reset = stationsDevnet({ genesis: HEX('9') });
  const rnet = K.makeNet('http://127.0.0.1:8799', { fetch: reset.fetch });
  await assert.rejects(() => C.readWorldFresh(rnet, c.chain), (e) => e.name === 'GenesisChanged');
  const m3 = await mutant([['chain && chain.genesisHash ? chain.genesisHash : null', 'null']]);
  const world = await m3.readWorldFresh(rnet, c.chain);
  assert.ok(world.list, 'the mutant reads a reset devnet as if nothing happened');
  // the body is checked against its hash
  const m4 = await mutant([["if (!isObj(stored) || stored.body_hash !== f.bodyHash) throw", 'if (false) throw']]);
  const wrongNet = { ...c.net, post: async (p, b) => (p === '/body' ? { body_hash: HEX('f') } : c.net.post(p, b)) };
  const good = C.planBroadcast({ station: w.byCode.get('MYCH'), sender: c.owner.sender, title: 't', body: 'fine', world: w });
  await assert.rejects(() => C.sendBroadcast({ chain: c.chain, net: wrongNet, key: c.owner, plan: good }), /different hash/);
  await m4.sendBroadcast({ chain: c.chain, net: wrongNet, key: c.owner, plan: good });
});

test('mutation: the feed shows a body only when it hashes, and a hidden post shows none', async () => {
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: feedDevnet().fetch });
  const raw = await net.get('/feed?limit=100');
  const tampered = JSON.parse(JSON.stringify(raw));
  tampered.blocks.flatMap((b) => b.txs).find((t) => t.payload.title === 'first on MYCH').payload.body = 'forged';
  assert.equal(C.readFeedPage(tampered).posts.find((p) => p.title === 'first on MYCH').body, '');
  const m1 = await mutant([["if (bodyHash && pcc.bodyHash(raw) === bodyHash) {", 'if (true) {']]);
  assert.equal(m1.readFeedPage(tampered).posts.find((p) => p.title === 'first on MYCH').body, 'forged', 'the mutant shows a forged body');
  const withBody = JSON.parse(JSON.stringify(raw));
  const h = withBody.blocks.flatMap((b) => b.txs).find((t) => t.hidden === true);
  h.payload.body = 'leaked text';
  assert.equal(C.readFeedPage(withBody).posts.find((p) => p.hidden).body, '');
  const m2 = await mutant([["const raw = typeof p.body === 'string' && !hidden ? p.body : null;", "const raw = typeof p.body === 'string' ? p.body : null;"]]);
  const leaked = m2.readFeedPage(withBody).posts.find((p) => p.hidden);
  assert.equal(leaked.bodyState === 'hidden', true, 'hidden stays flagged');
});

// ================================================================ the view (jsdom)

/** The app region of the real page, with Astro's expressions taken out, so the view runs over the page's own markup. */
function appMarkup() {
  const start = src.page.indexOf('<div\n      data-channels-app');
  const end = src.page.indexOf('<section id="how"');
  assert.ok(start > 0 && end > start);
  let html = src.page.slice(start, end);
  html = html.replace(/\{MODE_CARDS\.map[\s\S]*?\)\)\}/, '').replace(/\{HOW_STEPS\[\d\]\.text\}/g, 'text').replace(/data-(api|genesis|chain-id)=\{[^}]+\}/g, (m, k) => 'data-' + k + '="' + (k === 'api' ? DEVNET.url : k === 'genesis' ? GENESIS : CHAIN_ID) + '"');
  const kp = '<div data-key-panel>' + ['status', 'address', 'make', 'forget', 'keep', 'reveal', 'seed', 'copy', 'own', 'own-note', 'use'].map((k) => (k === 'keep' ? '<input type="checkbox" data-kp-keep>' : '<span data-kp-' + k + '></span>')).join('') + '</div>';
  html = html.replace(/<KeyPanel[^>]*\/>/, kp);
  assert.doesNotMatch(html, /\{[A-Za-z_.[\]()]+\}/, 'no expression is left in the markup');
  assert.doesNotMatch(html, /<KeyPanel/);
  return html;
}
function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
function mountView({ search = '', dev = feedDevnet(), extra = {}, storage = fakeStorage(), log = null } = {}) {
  const dom = new JSDOM('<!doctype html><html><body>' + appMarkup() + '</body></html>', { url: 'http://localhost/chain/channels/' + search });
  const rootEl = dom.window.document.querySelector('[data-channels-app]');
  const fetchFn = async (u, i) => { if (log) log.push((i && i.method ? i.method : 'GET') + ' ' + String(u).replace(DEVNET.url, '').replace('http://127.0.0.1:8799', '')); return dev.fetch(u, i); };
  const c = view.mount(rootEl, { window: dom.window, fetch: fetchFn, storage, supported: true, connect: async () => dev.chain, wait: { timeoutMs: 3000, intervalMs: 10 }, ...extra });
  return { dom, rootEl, c, dev, storage };
}
const $ = (rootEl, sel) => rootEl.querySelector(sel);
const $$ = (rootEl, sel) => [...rootEl.querySelectorAll(sel)];
const txt = (rootEl, sel) => ($(rootEl, sel) || {}).textContent;
const fire = (dom, node, type) => node.dispatchEvent(new dom.window.Event(type, { bubbles: true }));
const type = (dom, node, value, ev = 'input') => { node.value = value; fire(dom, node, ev); };
const pick = (dom, rootEl, name, value) => { for (const r of $$(rootEl, '[' + name + ']')) r.checked = r.value === value; fire(dom, $$(rootEl, '[' + name + ']').find((r) => r.value === value), 'change'); };

test('the view and the page agree on every hook, and the page uses the registry, the key panel and the header', () => {
  const hooks = new Set(src.view.match(/data-cc-[a-z-]+/g));
  assert.ok(hooks.size > 60, 'hooks: ' + hooks.size);
  for (const h of hooks) assert.ok(src.page.includes(h), h + ' is in the page');
  const html = appMarkup();
  for (const h of hooks) assert.ok(html.includes(h), h + ' is in the app region');
  assert.match(src.page, /<KeyPanel signs="your claims, crew changes and posts" id="cc-kp" \/>/);
  assert.match(src.page, /<ChainHeader current="channels"/);
  assert.match(src.page, /import\('\/chain\/apps\/channels-view\.js'\)/);
  assert.match(src.page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(src.page, /assertDevnetLaunchPinned\(\)/);
  assert.equal(APP.path, '/chain/channels');
  assert.equal(HOW_STEPS.length, 4);
  // until the integrator adds the registry entry the registry does not list it; once it does, the entry must match
  const entry = CHAIN_APPS.find((a) => a.key === 'channels');
  if (entry) { assert.equal(entry.href, APP.path); assert.match(entry.blurb, /channel/i); }
});

test('the view draws every channel, who holds it, its mode, its crew and its last post, as text', async () => {
  const { rootEl, c, dom } = mountView();
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'ready');
  const rows = $$(rootEl, '[data-cc-list] tr');
  assert.equal(rows.length, 9);
  const mych = rows.find((r) => r.querySelector('button').textContent === 'MYCH');
  assert.match(mych.textContent, /^MYCHtz1\w{5}…\w{6}CREW · My channel1#\d+ · 2026-\d\d-\d\d \d\d:\d\d:\d\d UTC3$/);
  const fd = rows.find((r) => r.querySelector('button').textContent === 'FD');
  assert.match(fd.textContent, /^FDthe house \(a house code\)OPEN0none in what was read0$/);
  const bot = rows.find((r) => r.querySelector('button').textContent === 'BOT');
  assert.match(bot.textContent, /^BOTnobodyNO STATION–#\d+/);
  assert.match(txt(rootEl, '[data-cc-count]'), /^9 channels · 8 with a station · one account may hold 4$/);
  assert.match(txt(rootEl, '[data-cc-scan-note]'), /^Read the newest 5 blocks that carry transactions \(all of them\)\. A channel with posts and no station is open to everyone, until someone claims it\.$/);
  assert.match(txt(rootEl, '[data-cc-meta]'), new RegExp('^' + DEVNET.url.replace(/[.]/g, '\\.') + ' · ' + CHAIN_ID + ' · newest block #\\d+ · devnet-2 · bot · unmoderated · read \\d+ requests so far$'));
  assert.equal($(rootEl, 'caption').textContent.startsWith('Channels on the devnet'), true);
  for (const b of $$(rootEl, '[data-cc-list] button')) assert.equal(b.type, 'button');
  // the filter
  type(dom, $(rootEl, '[data-cc-filter]'), 'free', 'change');
  assert.deepEqual($$(rootEl, '[data-cc-list] button').map((b) => b.textContent), ['BOT']);
  assert.match(txt(rootEl, '[data-cc-count]'), /showing 1$/);
});

test('hostile text from the devnet is shown as plain text and makes no element', async () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const dev = stationsDevnet({
    stations: [{ code: 'EVIL', owner: OWNER_ADDR, name: evil, mode: 'open', crew: [] }],
    posts: [{ channel: 'EVIL', title: evil, body: evil, sender: OWNER_ADDR }, { channel: 'EVIL', title: 'bidi \u202e gnp.exe', body: 'line\u202e', sender: A1 }],
  });
  const { rootEl, c } = mountView({ dev, search: '?channel=EVIL' });
  await c.begin();
  c.stop();
  assert.equal(c.state.selected, 'EVIL');
  assert.equal([...rootEl.querySelectorAll('img, script, iframe, object, embed, a[href], [onerror], [onload], style')].filter((n) => !n.closest('noscript')).length, 0);
  assert.ok(rootEl.textContent.includes('alert(1)'), 'it is on the page, as text');
  assert.ok(![...rootEl.textContent].some((ch) => ch === '\u202e'), 'a direction override is not carried to the page');
  for (const el of rootEl.querySelectorAll('*')) if (!el.closest('noscript')) for (const a of el.attributes) assert.ok(!/^(on|href|src|srcdoc|style|action|formaction)/i.test(a.name), a.name);
});

test('choosing a channel shows its station and its live feed; a hidden post is marked; the buttons offer only what the key may do', async () => {
  const { rootEl, c } = mountView();
  await c.begin();
  c.stop();
  assert.equal($(rootEl, '[data-cc-detail]').hidden, true);
  c.select('MYCH');
  assert.equal($(rootEl, '[data-cc-detail]').hidden, false);
  assert.equal(txt(rootEl, '[data-cc-detail-title]'), 'MYCH');
  const facts = txt(rootEl, '[data-cc-detail-facts]');
  assert.match(facts, /Held bytz1\w+…\w+ · tz1\w+NameMy channelModeCREW · only the owner and the crew postCrewtz1\w+PinnoneStanding offernoneClaimed in block#12This keynone yet/);
  assert.match(txt(rootEl, '[data-cc-detail-words]'), /^Crew: only the owner and the 1 crew member post on MYCH/);
  const posts = $$(rootEl, '[data-cc-feed] li');
  assert.equal(posts.length, 3);
  assert.equal(posts[0].querySelector('strong').textContent, '[hidden by the devnet admin]');
  assert.equal(posts[0].dataset.state, 'hidden');
  assert.match(posts[0].textContent, /The devnet’s keeper hid this post\. The block is unchanged and still verifies; the body and any media link are withheld here\./);
  assert.match(posts[0].textContent, /hidden by the devnet admin$/);
  assert.equal(posts[1].querySelector('pre').textContent, 'two\nlines');
  assert.ok(!rootEl.textContent.includes('secret text'), 'a hidden post’s body is never shown');
  assert.equal($$(rootEl, '[data-cc-detail-actions] button').length, 0, 'no key, no buttons');
  // a key that owns it
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  assert.deepEqual($$(rootEl, '[data-cc-detail-actions] button').map((b) => b.textContent), ['Manage it', 'Broadcast on it']);
  assert.match(txt(rootEl, '[data-cc-detail-facts]'), /Held byyou/);
  assert.match(txt(rootEl, '[data-cc-detail-facts]'), /This keyowns it/);
  // a key that is neither owner nor crew gets nothing to press on a crew station; a free code can be claimed from here
  await c.keys.setSeed(SEEDS.out);
  await tick(30);
  assert.equal($$(rootEl, '[data-cc-detail-actions] button').length, 0);
  c.select('NEWCODE');
  assert.deepEqual($$(rootEl, '[data-cc-detail-actions] button').map((b) => b.textContent), ['Use this code in Claim']);
  $$(rootEl, '[data-cc-detail-actions] button')[0].click();
  assert.equal($(rootEl, '[data-cc-claim-code]').value, 'NEWCODE');
  assert.match(txt(rootEl, '[data-cc-claim-hint]'), /^“NEWCODE” is free\./);
  c.select('FD');
  assert.equal($$(rootEl, '[data-cc-detail-actions] button').length, 0, 'a house channel offers neither Manage nor Broadcast');
  assert.match(txt(rootEl, '[data-cc-detail-words]'), /This is a house channel: this page never posts to it\./);
});

test('choosing a channel from the table moves focus to its heading, and a look-up takes a code, tells a bad one why, and opens a free one', async () => {
  const { rootEl, c, dom } = mountView();
  await c.begin();
  c.stop();
  const btn = $$(rootEl, '[data-cc-list] button').find((b) => b.textContent === 'OPEN1');
  btn.click();
  assert.equal(c.state.selected, 'OPEN1');
  assert.equal(dom.window.document.activeElement, $(rootEl, '[data-cc-detail-title]'));
  assert.equal($(rootEl, '[data-cc-detail-title]').getAttribute('tabindex'), '-1');
  assert.equal($$(rootEl, '[data-cc-list] button[aria-current="true"]').length, 1);
  assert.equal($$(rootEl, '[data-cc-list] button').find((b) => b.textContent === 'OPEN1').getAttribute('aria-label'), 'Open channel OPEN1');
  type(dom, $(rootEl, '[data-cc-lookup]'), 'bad code!', 'input');
  $(rootEl, '[data-cc-lookup-go]').click();
  assert.match(txt(rootEl, '[data-cc-lookup-note]'), /a space is not allowed/);
  assert.equal(c.state.selected, 'OPEN1');
  type(dom, $(rootEl, '[data-cc-lookup]'), 'free1', 'input');
  $(rootEl, '[data-cc-lookup-go]').click();
  assert.equal(c.state.selected, 'FREE1');
  assert.match(txt(rootEl, '[data-cc-detail-words]'), /^Nobody has claimed FREE1\./);
  assert.match(txt(rootEl, '[data-cc-feed]'), /No post on FREE1 in the 5 blocks read \(all of them\)\./);
});

test('?channel= opens that channel, and says nothing of one that is not a code', async () => {
  const a = mountView({ search: '?channel=open1' });
  await a.c.begin();
  a.c.stop();
  assert.equal(a.c.state.selected, 'OPEN1');
  const b = mountView({ search: '?channel=' + encodeURIComponent('<b>x</b>') });
  await b.c.begin();
  b.c.stop();
  assert.equal(b.c.state.selected, '');
});

test('the claim form checks the code as you type, review lists what goes on chain, nothing is sent until Send, and the receipt shows what the chain now says', async () => {
  const { rootEl, c, dom, dev } = mountView();
  await c.begin();
  c.stop();
  const hint = () => txt(rootEl, '[data-cc-claim-hint]');
  assert.equal(hint(), 'Type a code. Lower case is made upper case for you.');
  for (const [v, re] of [['fd', /is a house code/], ['bot', /not offered here, because it is the bots’ lane/], ['my-ch', /“-” is not allowed/], ['mych', /“MYCH” is held by tz1/], ['brandnew', /“BRANDNEW” is free\./]]) {
    type(dom, $(rootEl, '[data-cc-claim-code]'), v);
    assert.match(hint(), re, v);
  }
  assert.equal($(rootEl, '[data-cc-claim-hint]').dataset.bad, 'no');
  type(dom, $(rootEl, '[data-cc-claim-code]'), 'fd');
  assert.equal($(rootEl, '[data-cc-claim-hint]').dataset.bad, 'yes');
  // no key, no name: review says so
  type(dom, $(rootEl, '[data-cc-claim-code]'), 'brandnew');
  $(rootEl, '[data-cc-claim-review]').click();
  assert.equal($(rootEl, '[data-cc-claim-confirm]').hidden, true);
  assert.match(txt(rootEl, '[data-cc-claim-errors]'), /Give the station a name.*Make a key first/);
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  type(dom, $(rootEl, '[data-cc-claim-name]'), 'Brand new');
  pick(dom, rootEl, 'data-cc-claim-mode', 'open');
  $(rootEl, '[data-cc-claim-review]').click();
  assert.equal($(rootEl, '[data-cc-claim-confirm]').hidden, false);
  assert.equal($(rootEl, '[data-cc-claim-errors]').hidden, true);
  const items = $$(rootEl, '[data-cc-claim-list] li').map((l) => l.textContent);
  assert.equal(items.length, 3);
  assert.match(items[0], new RegExp('^One claim_station transaction signed by ' + OWNER_ADDR + ': code BRANDNEW, name “Brand new”, mode open\\.$'));
  assert.match(items[1], /^Open: anyone with a devnet key can post on BRANDNEW\./);
  assert.match(items[2], /^First come, first served: if another claim on BRANDNEW is sealed first, yours is refused and nothing changes\. Nobody can take the code back from you, and a reset removes it\.$/);
  assert.match(txt(rootEl, '[data-cc-claim-where]'), /^Sent to .* \(pointcast-devnet-2\)\. The page reads the devnet again right before it signs\.$/);
  assert.equal(dev.st.sent.length, 0, 'review sends nothing');
  $(rootEl, '[data-cc-claim-cancel]').click();
  assert.equal($(rootEl, '[data-cc-claim-confirm]').hidden, true);
  $(rootEl, '[data-cc-claim-review]').click();
  $(rootEl, '[data-cc-claim-send]').click();
  await tick(400);
  assert.equal(dev.st.sent.length, 1);
  assert.equal(dev.st.sent[0].tx.type, 'claim_station');
  assert.equal($(rootEl, '[data-cc-claim-result]').dataset.state, 'ok');
  assert.match(txt(rootEl, '[data-cc-claim-result-text]'), /^Claimed in block \d+\. BRANDNEW is yours, in open mode\. The chain’s own copy is below\.$/);
  const receipt = txt(rootEl, '[data-cc-claim-receipt]');
  assert.match(receipt, /Writeclaim_stationTransaction[0-9a-f]{64}In block#\d+ · position 0Signed bytz1\w+Sent tohttps:\/\/\S+ \(pointcast-devnet-2\)The chain now saysBRANDNEW · open mode · owner tz1\w+ · name “Brand new” · 0 crew membersCheck it yourselfGET \/tx\/[0-9a-f]{64} and GET \/station\/BRANDNEW/);
  // it is in the directory, held by you, and selected
  assert.equal(c.state.selected, 'BRANDNEW');
  assert.match($$(rootEl, '[data-cc-list] tr').find((r) => r.querySelector('button').textContent === 'BRANDNEW').textContent, /^BRANDNEWyouOPEN · Brand new0/);
  assert.match(txt(rootEl, '[data-cc-held]'), /^This key holds 2 of the 4 stations one account may hold\.$/, 'MYCH is this key’s too');
  // and its own section 3 now lists it
  assert.deepEqual([...$(rootEl, '[data-cc-mine-select]').options].map((o) => o.value), ['', 'BRANDNEW', 'MYCH']);
  assert.equal($(rootEl, '[data-cc-mine-select]').value, 'BRANDNEW');
});

test('editing the claim form after Review withdraws the review: a changed code, name or mode leaves no confirm box and no plan to send', async () => {
  const { rootEl, c, dom, dev } = mountView();
  await c.begin();
  c.stop();
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  const review = () => {
    type(dom, $(rootEl, '[data-cc-claim-code]'), 'revchk');
    type(dom, $(rootEl, '[data-cc-claim-name]'), 'first name');
    pick(dom, rootEl, 'data-cc-claim-mode', 'crew');
    $(rootEl, '[data-cc-claim-review]').click();
    assert.equal($(rootEl, '[data-cc-claim-confirm]').hidden, false, 'the review is up');
    assert.ok(c.state.claim.plan, 'with a plan');
  };
  const withdrawn = (why) => {
    assert.equal($(rootEl, '[data-cc-claim-confirm]').hidden, true, why + ': the confirm box is gone');
    assert.equal(c.state.claim.plan, null, why + ': so is the plan');
  };
  review();
  type(dom, $(rootEl, '[data-cc-claim-name]'), 'SECOND NAME');
  withdrawn('a changed name');
  review();
  pick(dom, rootEl, 'data-cc-claim-mode', 'open');
  withdrawn('a changed mode');
  review();
  type(dom, $(rootEl, '[data-cc-claim-code]'), 'revchk2');
  withdrawn('a changed code');
  // the stale Send button sends nothing, and the form is what a person sees
  $(rootEl, '[data-cc-claim-send]').click();
  await tick(100);
  assert.equal(dev.st.sent.length, 0);
  // a review made again from the changed form is the one that is sent
  type(dom, $(rootEl, '[data-cc-claim-code]'), 'revchk');
  type(dom, $(rootEl, '[data-cc-claim-name]'), 'SECOND NAME');
  pick(dom, rootEl, 'data-cc-claim-mode', 'open');
  $(rootEl, '[data-cc-claim-review]').click();
  assert.match(txt(rootEl, '[data-cc-claim-list]'), /code REVCHK, name “SECOND NAME”, mode open\./);
  $(rootEl, '[data-cc-claim-send]').click();
  await tick(400);
  assert.equal(dev.st.sent.length, 1);
  assert.deepEqual([dev.st.sent[0].tx.code, dev.st.sent[0].tx.name, dev.st.sent[0].tx.mode], ['REVCHK', 'SECOND NAME', 'open']);
});

test('the claim form says a taken code, a fifth station and a refusal from the chain in words, and a stale view does not send', async () => {
  const dev = stationsDevnet({ stations: ['K1', 'K2', 'K3', 'K4'].map((code) => ({ code, owner: OWNER_ADDR, name: code, mode: 'open' })) });
  const { rootEl, c, dom } = mountView({ dev });
  await c.begin();
  c.stop();
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  type(dom, $(rootEl, '[data-cc-claim-code]'), 'fifth');
  assert.match(txt(rootEl, '[data-cc-claim-hint]'), /^You already hold 4 of the 4 stations one account may hold on this devnet/);
  assert.match(txt(rootEl, '[data-cc-held]'), /^This key holds 4 of the 4 stations one account may hold\.$/);
  type(dom, $(rootEl, '[data-cc-claim-name]'), 'Fifth');
  $(rootEl, '[data-cc-claim-review]').click();
  assert.equal($(rootEl, '[data-cc-claim-confirm]').hidden, true);
  assert.match(txt(rootEl, '[data-cc-claim-errors]'), /^You already hold 4 of the 4/);
  assert.equal(dev.st.sent.length, 0);
});

test('mode and crew in the page: pick a channel, add and remove crew, switch the mode, see who can post, review the two steps, send, and read the change back', async () => {
  const dev = stationsDevnet({ stations: [{ code: 'MYCH', owner: OWNER_ADDR, name: 'My channel', mode: 'open', crew: [], pinned: HEX('d') }] });
  const { rootEl, c, dom } = mountView({ dev });
  await c.begin();
  c.stop();
  assert.match(txt(rootEl, '[data-cc-mine-note]'), /^Make a key to see the channels it owns\.$/);
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  assert.match(txt(rootEl, '[data-cc-mine-note]'), /^1 channel owned by this key\.$/);
  assert.equal($(rootEl, '[data-cc-set-review]').disabled, true, 'nothing is chosen yet');
  type(dom, $(rootEl, '[data-cc-mine-select]'), 'MYCH', 'change');
  assert.equal($(rootEl, '[data-cc-set-review]').disabled, false);
  assert.equal($(rootEl, '[data-cc-set-name]').value, 'My channel');
  assert.equal($$(rootEl, '[data-cc-set-mode]').find((r) => r.checked).value, 'open');
  assert.match(txt(rootEl, '[data-cc-set-explain]'), /^After this: Open: anyone with a devnet key can post on MYCH\./);
  // nothing to change yet
  $(rootEl, '[data-cc-set-review]').click();
  assert.match(txt(rootEl, '[data-cc-set-errors]'), /Nothing to change/);
  // add crew: a bad address, the owner, then two good ones
  const note = () => txt(rootEl, '[data-cc-crew-note]');
  type(dom, $(rootEl, '[data-cc-crew-add]'), 'nonsense');
  $(rootEl, '[data-cc-crew-add-go]').click();
  assert.match(note(), /^“nonsense” is not a devnet address/);
  assert.equal($(rootEl, '[data-cc-crew-note]').dataset.bad, 'yes');
  type(dom, $(rootEl, '[data-cc-crew-add]'), OWNER_ADDR);
  $(rootEl, '[data-cc-crew-add-go]').click();
  assert.match(note(), /That is the channel’s owner/);
  type(dom, $(rootEl, '[data-cc-crew-add]'), CREW_ADDR + ', ' + A1);
  $(rootEl, '[data-cc-crew-add-go]').click();
  assert.match(note(), /^Added to the list below\. Nothing is sent until you review and send\.$/);
  assert.equal($$(rootEl, '[data-cc-crew] li').length, 2);
  assert.match(txt(rootEl, '[data-cc-set-explain]'), /The 2 crew listed are only a roster while it is open/);
  // remove one, with a labelled button
  const rm = $$(rootEl, '[data-cc-crew] button')[0];
  assert.match(rm.getAttribute('aria-label'), /^Remove tz1\w+ from the crew$/);
  rm.click();
  assert.equal($$(rootEl, '[data-cc-crew] li').length, 1);
  type(dom, $(rootEl, '[data-cc-crew-add]'), [CREW_ADDR, A1].join(' '));
  $(rootEl, '[data-cc-crew-add-go]').click();
  assert.equal(c.state.mode.crew.length, 2);
  // the mode
  pick(dom, rootEl, 'data-cc-set-mode', 'crew');
  assert.match(txt(rootEl, '[data-cc-set-explain]'), /^After this: Crew: only the owner and the 2 crew members post on MYCH/);
  $(rootEl, '[data-cc-set-review]').click();
  assert.equal($(rootEl, '[data-cc-set-confirm]').hidden, false);
  const steps = $$(rootEl, '[data-cc-set-list] li').map((l) => l.textContent);
  assert.equal(steps.length, 3);
  assert.match(steps[0], /^One set_station transaction signed by tz1\w+ on MYCH: the crew becomes 2 addresses, adding tz1\w+, tz1\w+\. The pin \([0-9a-f]{8}…[0-9a-f]{6}\) and the standing offer \(none\) are sent back exactly as they are, because set_station replaces all three\.$/);
  assert.match(steps[1], /^One claim_station transaction signed by tz1\w+ on MYCH \(the owner’s re-claim\): name unchanged, mode crew \(it is open now\)\.$/);
  assert.match(steps[2], /^Who can post after this: Crew: only the owner and the 2 crew members post on MYCH/);
  assert.equal(dev.st.sent.length, 0);
  $(rootEl, '[data-cc-set-send]').click();
  await tick(500);
  assert.deepEqual(dev.st.sent.map((s) => s.tx.type), ['set_station', 'claim_station']);
  assert.equal(dev.st.sent[0].tx.pinned, HEX('d'), 'the pin went back');
  assert.equal($(rootEl, '[data-cc-set-result]').dataset.state, 'ok');
  assert.match(txt(rootEl, '[data-cc-set-result-text]'), /^Sealed in block \d+ and block \d+\. The chain’s own copy is below\.$/);
  assert.match(txt(rootEl, '[data-cc-set-receipt]'), /Writeset_station.*Writeclaim_station.*The chain now saysMYCH · crew mode · owner tz1\w+ · name “My channel” · 2 crew members · pin [0-9a-f]{8}…[0-9a-f]{6}/);
  assert.equal(dev.st.stations.get('MYCH').mode, 'crew');
  assert.equal(dev.st.stations.get('MYCH').crew.length, 2);
  // the draft is now what the chain has: nothing to change again
  $(rootEl, '[data-cc-set-review]').click();
  assert.match(txt(rootEl, '[data-cc-set-errors]'), /Nothing to change/);
  // "back to what the chain has" restores the chain's crew after an edit
  $$(rootEl, '[data-cc-crew] button')[0].click();
  assert.equal(c.state.mode.crew.length, 1);
  $(rootEl, '[data-cc-set-reset]').click();
  assert.equal(c.state.mode.crew.length, 2);
});

test('mode and crew say when a channel changed on the chain since you opened it, and a key that owns nothing sees nothing to change', async () => {
  const dev = stationsDevnet({ stations: [{ code: 'MYCH', owner: OWNER_ADDR, name: 'My channel', mode: 'open', crew: [] }] });
  const { rootEl, c, dom } = mountView({ dev });
  await c.begin();
  c.stop();
  await c.keys.setSeed(SEEDS.out);
  await tick(30);
  assert.match(txt(rootEl, '[data-cc-mine-note]'), /^This key owns no station yet\. Claim one above\.$/);
  assert.deepEqual([...$(rootEl, '[data-cc-mine-select]').options].map((o) => o.value), ['']);
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  type(dom, $(rootEl, '[data-cc-mine-select]'), 'MYCH', 'change');
  assert.equal(txt(rootEl, '[data-cc-set-note]'), '');
  dev.st.stations.get('MYCH').crew = [A1];
  await c.refresh({ feed: false });
  assert.match(txt(rootEl, '[data-cc-set-note]'), /^The chain’s copy of MYCH changed since you opened it\./);
});

test('broadcast in the page: only channels you own or crew are offered, a preview shows the post as it will read, the confirm says what happens, and the post shows in the feed', async () => {
  const { rootEl, c, dom, dev } = mountView();
  await c.begin();
  c.stop();
  assert.match(txt(rootEl, '[data-cc-post-note]'), /^Make a key to see the channels it may broadcast to\.$/);
  await c.keys.setSeed(SEEDS.crew);
  await tick(30);
  const options = () => [...$(rootEl, '[data-cc-post-channel]').options].map((o) => o.value);
  assert.deepEqual(options(), ['', 'MYCH'], 'crew on one channel; the house’s channels and open stations of others are not offered');
  assert.match(txt(rootEl, '[data-cc-post-note]'), /^1 channel this key may broadcast to\.$/);
  type(dom, $(rootEl, '[data-cc-post-channel]'), 'MYCH', 'change');
  type(dom, $(rootEl, '[data-cc-post-title]'), 'Evening net');
  type(dom, $(rootEl, '[data-cc-post-body]'), 'Checking in.\nAll quiet.');
  assert.equal(txt(rootEl, '[data-cc-preview-channel]'), 'MYCH');
  assert.equal(txt(rootEl, '[data-cc-preview-title]'), 'Evening net');
  assert.equal(txt(rootEl, '[data-cc-preview-body]'), 'Checking in.\nAll quiet.');
  assert.match(txt(rootEl, '[data-cc-preview-meta]'), /^Not sent · signed by tz1\w+ · pointcast-devnet-2 · no value · may reset$/);
  assert.equal($(rootEl, '[data-cc-preview]').dataset.ok, 'yes');
  assert.match(txt(rootEl, '[data-cc-post-count]'), /^11 of 120 characters in the title · 23 of 4,000 bytes in the body$/);
  $(rootEl, '[data-cc-post-review]').click();
  assert.equal($(rootEl, '[data-cc-post-confirm]').hidden, false);
  const items = $$(rootEl, '[data-cc-post-list] li').map((l) => l.textContent);
  assert.equal(items.length, 3);
  assert.match(items[0], /^The body \(23 bytes\) is stored on the devnet by its hash, POST \/body\. The devnet’s word filter reads it there; if it refuses, the refusal is shown here word for word and nothing else is sent\.$/);
  assert.match(items[1], /^Then one publish_block transaction signed by tz1\w+ on channel MYCH \(you are on its crew\), titled “Evening net”\. The title goes on chain as written: the word filter does not read it\.$/);
  assert.match(items[2], /The devnet’s keeper can hide a post from the devnet’s own views; nobody can take it back\./);
  assert.equal(dev.st.sent.length, 0);
  assert.equal(dev.st.stored.length, 0, 'review stores nothing');
  $(rootEl, '[data-cc-post-send]').click();
  await tick(500);
  assert.equal(dev.st.stored.length, 1);
  assert.equal(dev.st.sent.length, 1);
  assert.equal($(rootEl, '[data-cc-post-result]').dataset.state, 'ok');
  assert.match(txt(rootEl, '[data-cc-post-result-text]'), /^On air in block \d+ on MYCH\. It shows in the channel’s feed above\.$/);
  assert.equal(c.state.selected, 'MYCH');
  assert.equal($$(rootEl, '[data-cc-feed] li')[0].querySelector('strong').textContent, 'Evening net');
  assert.match($$(rootEl, '[data-cc-feed] li')[0].textContent, /by you/);
  assert.equal($(rootEl, '[data-cc-post-title]').value, '', 'the form is cleared once it is on air');
  // a title or a body over its limit says so in the review, with nothing sent
  type(dom, $(rootEl, '[data-cc-post-title]'), 'x'.repeat(130));
  type(dom, $(rootEl, '[data-cc-post-body]'), 'ok');
  $(rootEl, '[data-cc-post-review]').click();
  assert.match(txt(rootEl, '[data-cc-post-errors]'), /The title: at most 120 characters\./);
  assert.equal($(rootEl, '[data-cc-preview]').dataset.ok, 'no');
});

test('the word filter’s refusal is shown verbatim, nothing is sent, and a refusal from the chain says its body was stored and no post names it', async () => {
  const { rootEl, c, dom, dev } = mountView();
  await c.begin();
  c.stop();
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  type(dom, $(rootEl, '[data-cc-post-channel]'), 'MYCH', 'change');
  type(dom, $(rootEl, '[data-cc-post-title]'), 'Fine title');
  type(dom, $(rootEl, '[data-cc-post-body]'), 'this has ' + BAD_WORD + ' in it');
  $(rootEl, '[data-cc-post-review]').click();
  $(rootEl, '[data-cc-post-send]').click();
  await tick(400);
  assert.equal($(rootEl, '[data-cc-post-result]').dataset.state, 'bad');
  assert.equal(txt(rootEl, '[data-cc-post-result-text]'), 'Not sent: kept off the devnet by its word filter');
  assert.equal(dev.st.sent.length, 0);
  assert.equal($(rootEl, '[data-cc-post-confirm]').hidden, true);
  // the owner removes the crew member on the chain while the page still lists them: a stale view
  await c.keys.setSeed(SEEDS.crew);
  await tick(30);
  type(dom, $(rootEl, '[data-cc-post-channel]'), 'MYCH', 'change');
  type(dom, $(rootEl, '[data-cc-post-title]'), 'Still crew?');
  type(dom, $(rootEl, '[data-cc-post-body]'), 'a body');
  dev.st.stations.get('MYCH').crew = [];
  // the page's read of the stations still lists the crew member (a read from before the owner removed them)
  const realFetch = dev.fetch;
  dev.fetch = async (u, i) => { const r = await realFetch(u, i); if (new URL(String(u)).pathname === '/stations') { const j = JSON.parse(await r.text()); j.stations = j.stations.map((s) => (s.code === 'MYCH' ? { ...s, crew: [CREW_ADDR] } : s)); return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(j) }; } return r; };
  $(rootEl, '[data-cc-post-review]').click();
  $(rootEl, '[data-cc-post-send]').click();
  await tick(500);
  assert.equal($(rootEl, '[data-cc-post-result]').dataset.state, 'bad');
  assert.match(txt(rootEl, '[data-cc-post-result-text]'), /^Not sent: only this station's owner and crew post or seal here\.? Its body was already stored by its hash; no post names it\.$/);
  assert.equal(dev.st.sent.length, 0, 'the chain took nothing');
});

test('after a send that may have landed the page does not say no post names the body: that sentence is for a refusal only', async () => {
  // (a) the devnet accepted the post and the wait for its block gave only a pending verdict
  const a = mountView();
  await a.c.begin();
  a.c.stop();
  await a.c.keys.setSeed(SEEDS.owner);
  await tick(30);
  a.dev.chain.waitForTx = async () => { throw Object.assign(new Error('the transaction is pending'), { details: { status: 'pending' } }); };
  type(a.dom, $(a.rootEl, '[data-cc-post-channel]'), 'MYCH', 'change');
  type(a.dom, $(a.rootEl, '[data-cc-post-title]'), 'It may still land');
  type(a.dom, $(a.rootEl, '[data-cc-post-body]'), 'a body');
  $(a.rootEl, '[data-cc-post-review]').click();
  $(a.rootEl, '[data-cc-post-send]').click();
  await tick(400);
  assert.equal(a.dev.st.sent.length, 1, 'the devnet accepted it');
  assert.equal($(a.rootEl, '[data-cc-post-result]').dataset.state, 'warn');
  const sent = txt(a.rootEl, '[data-cc-post-result-text]');
  assert.match(sent, /^Sent, not confirmed yet: /);
  assert.doesNotMatch(sent, /no post names it/);
  assert.match(sent, /Its body was already stored by its hash; the post may still appear\./);
  // (b) the request left and no answer came back: it may have arrived
  const b = mountView();
  await b.c.begin();
  b.c.stop();
  await b.c.keys.setSeed(SEEDS.owner);
  await tick(30);
  b.dev.chain.submit = async () => { throw new TypeError('Failed to fetch'); };
  type(b.dom, $(b.rootEl, '[data-cc-post-channel]'), 'MYCH', 'change');
  type(b.dom, $(b.rootEl, '[data-cc-post-title]'), 'Did it arrive');
  type(b.dom, $(b.rootEl, '[data-cc-post-body]'), 'a body');
  $(b.rootEl, '[data-cc-post-review]').click();
  $(b.rootEl, '[data-cc-post-send]').click();
  await tick(400);
  assert.equal($(b.rootEl, '[data-cc-post-result]').dataset.state, 'warn');
  const maybe = txt(b.rootEl, '[data-cc-post-result-text]');
  assert.match(maybe, /^Not confirmed: /);
  assert.doesNotMatch(maybe, /no post names it/);
  assert.match(maybe, /the post may still appear\./);
});

test('a reset shows GENESIS CHANGED, reads nothing else and cannot send; an unreachable devnet is said so; ?devnet= is honoured only for localhost and 127.0.0.1; the page starts lazily', async () => {
  const log = [];
  const reset = mountView({ dev: stationsDevnet({ genesis: HEX('9') }), log });
  await reset.c.begin();
  reset.c.stop();
  assert.equal(reset.rootEl.dataset.state, 'changed');
  assert.equal($(reset.rootEl, '[data-cc-genesis]').hidden, false);
  assert.match(txt(reset.rootEl, '[data-cc-genesis]'), /GENESIS CHANGED/);
  assert.deepEqual(log, ['GET /status']);
  assert.match(txt(reset.rootEl, '[data-cc-status]'), /Every claim and crew list from before the reset is gone/);
  assert.equal(reset.c.state.halted, true);
  // sending is not possible after a halt
  await reset.c.keys.setSeed(SEEDS.owner);
  await reset.c.sendClaim();
  assert.equal(reset.dev.st.sent.length, 0);
  const down = stationsDevnet();
  down.st.down = true;
  const d = mountView({ dev: down });
  await d.c.begin();
  d.c.stop();
  assert.equal(d.rootEl.dataset.state, 'down');
  assert.match(txt(d.rootEl, '[data-cc-status]'), /devnet did not answer/);
  assert.equal(mountView({ search: '?devnet=http://127.0.0.1:8799' }).c.where.api, 'http://127.0.0.1:8799');
  for (const bad of ['?devnet=https://pointcast-devnet.mhoydich.workers.dev', '?devnet=http://localhost@evil.example', '?devnet=//127.0.0.1', '?devnet=http://127.0.0.1.evil.example']) {
    const m = mountView({ search: bad });
    assert.equal(m.c.where.api, DEVNET.url, bad);
    assert.equal(m.c.where.genesis, GENESIS, bad);
  }
  const lazyLog = [];
  const lazy = mountView({ log: lazyLog });
  assert.deepEqual(lazyLog, []);
  assert.equal(lazy.c.state.begun, false);
  assert.match(code(src.view), /whenReady\(root, \(\) => c\.begin\(\), env\)/);
  assert.match(src.page, /requestIdleCallback/);
});

test('a poll that finds nothing new leaves the table alone, and one that finds a new post shows it; the older-blocks button reads further back', async () => {
  const dev = feedDevnet();
  const { rootEl, c } = mountView({ dev });
  await c.begin();
  c.stop();
  const tbody = $(rootEl, '[data-cc-list]');
  const first = tbody.firstElementChild;
  await c.refresh({ feed: true });
  assert.equal(tbody.firstElementChild, first, 'the same row nodes: a keyboard user’s place is not thrown away');
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  const k = await keyOf('owner');
  const w = await C.readWorldFresh(K.makeNet('http://127.0.0.1:8799', { fetch: dev.fetch }), dev.chain);
  await C.sendBroadcast({ chain: dev.chain, net: K.makeNet('http://127.0.0.1:8799', { fetch: dev.fetch }), key: k, plan: C.planBroadcast({ station: w.byCode.get('MYCH'), sender: k.sender, title: 'posted elsewhere', body: 'x', world: w }) });
  c.select('MYCH');
  await c.refresh({ feed: true });
  assert.equal($$(rootEl, '[data-cc-feed] li')[0].querySelector('strong').textContent, 'posted elsewhere');
  assert.equal($(rootEl, '[data-cc-older]').disabled, true, 'every block is read: nothing older');
  assert.equal($(rootEl, '[data-cc-older]').textContent, 'All blocks read');
});

test('a poll leaves a list a keyboard user has open and a live region alone, and a new post on the channel in view is announced as one short line', async () => {
  const dev = feedDevnet();
  const { rootEl, c } = mountView({ dev });
  await c.begin();
  c.stop();
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  c.select('MYCH');
  const optionNodes = [...$(rootEl, '[data-cc-post-channel]').options];
  const mineNodes = [...$(rootEl, '[data-cc-mine-select]').options];
  const li = $$(rootEl, '[data-cc-feed] li')[0];
  const crewBtn = $(rootEl, '[data-cc-detail-actions] button');
  const statusNode = $(rootEl, '[data-cc-status]').firstChild;
  assert.equal(txt(rootEl, '[data-cc-feed-note]'), '', 'nothing new yet');
  await c.refresh({ feed: true });
  assert.deepEqual([...$(rootEl, '[data-cc-post-channel]').options], optionNodes, 'the select a person may have open keeps its option nodes');
  assert.deepEqual([...$(rootEl, '[data-cc-mine-select]').options], mineNodes);
  assert.equal($$(rootEl, '[data-cc-feed] li')[0], li, 'the feed is not rebuilt when nothing changed');
  assert.equal($(rootEl, '[data-cc-detail-actions] button'), crewBtn, 'nor the buttons under it');
  assert.equal($(rootEl, '[data-cc-status]').firstChild, statusNode, 'a status line with the same words is not written again');
  assert.equal(txt(rootEl, '[data-cc-feed-note]'), '');
  // someone else posts on MYCH
  const k = await keyOf('crew');
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: dev.fetch });
  const w = await C.readWorldFresh(net, dev.chain);
  await C.sendBroadcast({ chain: dev.chain, net, key: k, plan: C.planBroadcast({ station: w.byCode.get('MYCH'), sender: k.sender, title: 'Fresh from the crew', body: 'x', world: w }) });
  await c.refresh({ feed: true });
  assert.equal(txt(rootEl, '[data-cc-feed-note]'), 'A new post on MYCH: Fresh from the crew');
  assert.equal($$(rootEl, '[data-cc-feed] li')[0].querySelector('strong').textContent, 'Fresh from the crew');
  // moving to another channel is not a "new post"
  c.select('OPEN1');
  assert.equal(txt(rootEl, '[data-cc-feed-note]'), '');
  assert.equal($(rootEl, '[data-cc-feed]').getAttribute('aria-live'), null, 'the list itself is not a live region');
});

/** Watch every live region under the app (aria-live, role status or alert) for any write at all, even of the same words. */
function watchLive(dom, rootEl) {
  const nodes = $$(rootEl, '[aria-live], [role="status"], [role="alert"]');
  assert.ok(nodes.length >= 8, 'the page has its live regions: ' + nodes.length);
  // the observer's callback runs in a microtask and empties its queue, so the records are kept as they are delivered
  const seen = nodes.map((node) => {
    const hits = [];
    const obs = new dom.window.MutationObserver((records) => hits.push(...records));
    obs.observe(node, { subtree: true, childList: true, characterData: true });
    return { node, obs, hits };
  });
  return async () => {
    await tick(0);
    return seen.filter((s) => s.hits.length || s.obs.takeRecords().length).map((s) => (s.node.hasAttribute('data-cc-claim-hint') ? 'claim-hint' : s.node.hasAttribute('data-cc-post-count') ? 'post-count' : s.node.hasAttribute('data-wt-roll-text') ? 'roll-text' : (s.node.className || s.node.tagName) + ' [' + [...s.node.attributes].map((a) => a.name).join(' ') + ']'));
  };
}

test('a poll that finds nothing new writes to no live region at all, even with the same words: with and without a key, a channel open and a claim typed', async () => {
  const { rootEl, c, dom } = mountView();
  await c.begin();
  c.stop();
  const quiet = async (label) => {
    const changed = watchLive(dom, rootEl);
    await c.refresh({ feed: true });
    await c.refresh({ feed: true });
    assert.deepEqual(await changed(), [], label + ': a polite or assertive region was rewritten by a poll that changed nothing');
  };
  await quiet('no key, nothing typed');
  type(dom, $(rootEl, '[data-cc-claim-code]'), 'brandnew');
  await quiet('a code typed in the claim form');
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  c.select('MYCH');
  type(dom, $(rootEl, '[data-cc-post-channel]'), 'MYCH', 'change');
  type(dom, $(rootEl, '[data-cc-post-title]'), 'a title');
  await quiet('a key, a channel open, a post being written');
});

/** Count the writes to one node (a text node replaced counts), counting even a write of the same words. */
function writesTo(dom, node) {
  const hits = [];
  new dom.window.MutationObserver((records) => hits.push(...records)).observe(node, { subtree: true, childList: true, characterData: true });
  return async () => { await tick(0); return hits.length; };
}

test('typing speaks nothing per keystroke: the counters and the claim hint are plain text while you type, and a polite line follows once you pause or cross a limit', async () => {
  const { rootEl, c, dom } = mountView({ extra: { typingMs: 40 } });
  await c.begin();
  c.stop();
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  const liveRegion = (node) => node.closest('[aria-live], [role="status"], [role="alert"]');
  // the visible counter and hint are not live regions; a separate polite line is
  const countLive = $(rootEl, '[data-cc-post-count-live]');
  const hintLive = $(rootEl, '[data-cc-claim-hint-live]');
  assert.ok(countLive && hintLive, 'the page has a polite line for each');
  for (const sel of ['[data-cc-post-count]', '[data-cc-claim-hint]']) {
    assert.equal(liveRegion($(rootEl, sel)), null, sel + ' is not a live region');
    assert.equal($(rootEl, sel).getAttribute('aria-live'), null);
    assert.equal($(rootEl, sel).getAttribute('role'), null);
  }
  for (const n of [countLive, hintLive]) assert.equal(n.getAttribute('aria-live'), 'polite');
  // (a) eleven characters in the body: the visible count follows each key, the polite line is not written until a pause
  type(dom, $(rootEl, '[data-cc-post-channel]'), 'MYCH', 'change');
  const countWrites = writesTo(dom, countLive);
  const body = $(rootEl, '[data-cc-post-body]');
  let text = '';
  const seen = new Set();
  for (const ch of 'hello-world') { text += ch; type(dom, body, text); seen.add(txt(rootEl, '[data-cc-post-count]')); }
  assert.equal(seen.size, 11, 'the visible counter changed on every key');
  assert.equal(await countWrites(), 0, 'no polite line while typing');
  await tick(150);
  assert.equal(await countWrites(), 1, 'one polite line once typing stopped');
  assert.equal(countLive.textContent, txt(rootEl, '[data-cc-post-count]'));
  assert.match(countLive.textContent, /0 of 120 characters in the title · 11 of 4,000 bytes in the body/);
  // (b) crossing a limit is said at once, not after a pause
  const before = await countWrites();
  type(dom, $(rootEl, '[data-cc-post-title]'), 'x'.repeat(121));
  assert.equal(await countWrites(), before + 1, 'crossing the title limit is announced straight away');
  assert.match(countLive.textContent, /^121 of 120 characters in the title/);
  // (c) four characters in the claim code
  const hintWrites = writesTo(dom, hintLive);
  const code = $(rootEl, '[data-cc-claim-code]');
  const hints = new Set();
  let typed = '';
  for (const ch of 'newx') { typed += ch; type(dom, code, typed); hints.add(txt(rootEl, '[data-cc-claim-hint]')); }
  assert.equal(hints.size, 4, 'the visible hint followed every key');
  assert.equal(await hintWrites(), 0, 'no polite line while typing a code');
  await tick(150);
  assert.equal(await hintWrites(), 1);
  assert.equal(hintLive.textContent, '“NEWX” is free. First come, first served: the first claim the devnet seals wins it.');
  // a poll afterwards leaves both polite lines alone
  await c.refresh({ feed: true });
  assert.equal(await hintWrites(), 1);
});

test('a poll that finds new data rebuilds the table and the actions, and a keyboard user keeps their place: focus goes back to the same button', async () => {
  const dev = feedDevnet();
  const { rootEl, c, dom } = mountView({ dev });
  await c.begin();
  c.stop();
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  const doc = dom.window.document;
  const rowButton = (code) => $$(rootEl, '[data-cc-list] button').find((b) => b.textContent === code);
  // someone posts on another channel while the keyboard user sits on the GDN row
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: dev.fetch });
  const ownerKey = await keyOf('owner');
  const post = async (title) => { const w = await C.readWorldFresh(net, dev.chain); await C.sendBroadcast({ chain: dev.chain, net, key: ownerKey, plan: C.planBroadcast({ station: w.byCode.get('MYCH'), sender: ownerKey.sender, title, body: 'x', world: w }) }); };
  const gdn = rowButton('GDN');
  gdn.focus();
  assert.equal(doc.activeElement, gdn);
  await post('a new post while GDN has focus');
  await c.refresh({ feed: true });
  const again = rowButton('GDN');
  assert.notEqual(again, gdn, 'the table really was rebuilt by the poll');
  assert.equal(gdn.isConnected, false);
  assert.equal(doc.activeElement, again, 'focus went to the rebuilt GDN button, not to the page');
  // the detail's action buttons: a station that changes on the chain rebuilds them, and the focused one keeps focus
  c.select('MYCH');
  const acts = () => $$(rootEl, '[data-cc-detail-actions] button');
  const labels = acts().map((b) => b.textContent);
  assert.ok(labels.length >= 2, 'the owner of MYCH has two actions: ' + labels.join(' | '));
  const second = acts()[1];
  second.focus();
  assert.equal(doc.activeElement, second);
  dev.st.stations.get('MYCH').name = 'Renamed on chain';
  await c.refresh({ feed: true });
  assert.equal(second.isConnected, false, 'the actions were rebuilt');
  assert.equal(doc.activeElement.textContent, labels[1], 'focus is on the same action again');
  assert.equal(doc.activeElement.isConnected, true);
  assert.equal(doc.activeElement.closest('[data-cc-detail-actions]') !== null, true);
  // a focus elsewhere is left alone
  const filter = $(rootEl, '[data-cc-filter]');
  filter.focus();
  await post('and another');
  await c.refresh({ feed: true });
  assert.equal(doc.activeElement, filter);
});

test('the Enter key does what the button next to it does, and a new key clears the form for the channel that was open', async () => {
  const { rootEl, c, dom } = mountView({ dev: stationsDevnet({ stations: [{ code: 'MYCH', owner: OWNER_ADDR, name: 'My channel', mode: 'open', crew: [] }] }) });
  await c.begin();
  c.stop();
  const enter = (node) => node.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  type(dom, $(rootEl, '[data-cc-lookup]'), 'mych');
  enter($(rootEl, '[data-cc-lookup]'));
  assert.equal(c.state.selected, 'MYCH');
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  type(dom, $(rootEl, '[data-cc-mine-select]'), 'MYCH', 'change');
  assert.equal($(rootEl, '[data-cc-set-name]').value, 'My channel');
  type(dom, $(rootEl, '[data-cc-crew-add]'), CREW_ADDR);
  enter($(rootEl, '[data-cc-crew-add]'));
  assert.equal(c.state.mode.crew.length, 1, 'Enter adds the crew member');
  await c.keys.setSeed(SEEDS.out);
  await tick(30);
  assert.equal($(rootEl, '[data-cc-set-name]').value, '', 'the name box is not left holding another key’s channel');
  assert.equal(c.state.mode.code, '');
  assert.equal($(rootEl, '[data-cc-set-review]').disabled, true);
});

test('older blocks are read on request when the first read stopped early', async () => {
  const posts = Array.from({ length: 12 }, (_, i) => ({ channel: i < 3 ? 'OLD' : 'NEWER', title: 'post ' + i, body: 'b' + i, sender: A1 }));
  const dev = stationsDevnet({ posts });
  const { rootEl, c } = mountView({ dev });
  await c.begin();
  c.stop();
  // the first read took every block (12): give the page a scan that stopped after one small page, as it would on a devnet with more history
  const scan = C.newScan();
  await C.scanFeed(c.net, scan, { pages: 1, limit: 3 });
  assert.equal(scan.complete, false);
  c.state.scan = scan;
  c.select('OLD');
  assert.match(txt(rootEl, '[data-cc-feed]'), /No post on OLD in the 3 blocks read so far\./);
  assert.equal($(rootEl, '[data-cc-older]').disabled, false);
  assert.equal($(rootEl, '[data-cc-older]').textContent, 'Read older blocks');
  await c.readOlder();
  assert.equal(c.state.scan.complete, true);
  assert.equal($$(rootEl, '[data-cc-feed] li').length, 3);
  assert.equal($(rootEl, '[data-cc-older]').disabled, true);
});

test('the key changing withdraws every confirm box, and a confirm names the key that will sign', async () => {
  const { rootEl, c, dom, dev } = mountView();
  await c.begin();
  c.stop();
  await c.keys.setSeed(SEEDS.owner);
  await tick(30);
  type(dom, $(rootEl, '[data-cc-claim-code]'), 'swapkey');
  type(dom, $(rootEl, '[data-cc-claim-name]'), 'Swap');
  $(rootEl, '[data-cc-claim-review]').click();
  assert.equal($(rootEl, '[data-cc-claim-confirm]').hidden, false);
  assert.match(txt(rootEl, '[data-cc-claim-list]'), new RegExp('signed by ' + OWNER_ADDR));
  await c.keys.setSeed(SEEDS.out);
  await tick(30);
  assert.equal($(rootEl, '[data-cc-claim-confirm]').hidden, true);
  assert.equal(c.state.claim.plan, null);
  assert.match(txt(rootEl, '[data-cc-as]'), new RegExp('^Signing as ' + OUT_ADDR + '\\.$'));
  // Send without a plan does nothing
  await c.sendClaim();
  assert.equal(dev.st.sent.length, 0);
});

test('the controls are real controls and the page is usable from the keyboard alone', () => {
  const html = appMarkup();
  const doc = new JSDOM('<!doctype html><body>' + html).window.document;
  for (const b of doc.querySelectorAll('button')) assert.equal(b.getAttribute('type'), 'button', 'a button that submits nothing: ' + b.textContent);
  for (const el of doc.querySelectorAll('[onclick], [tabindex]:not([tabindex="-1"])')) assert.fail('a positive tabindex or an inline handler: ' + el.outerHTML.slice(0, 60));
  for (const id of ['cc-filter', 'cc-lookup', 'cc-claim-code', 'cc-claim-name', 'cc-mine', 'cc-set-name', 'cc-crew-add', 'cc-post-channel', 'cc-post-title', 'cc-post-body']) {
    assert.ok(doc.querySelector('label[for="' + id + '"]'), 'a label for ' + id);
    assert.ok(doc.getElementById(id), id);
  }
  assert.equal(doc.querySelectorAll('fieldset legend').length, 2, 'each radio group has a legend');
  for (const r of doc.querySelectorAll('input[type="radio"]')) assert.ok(r.closest('label'), 'a radio is inside its label');
  for (const sel of ['[data-cc-status]', '[data-cc-claim-hint-live]', '[data-cc-held]', '[data-cc-mine-note]', '[data-cc-crew-note]', '[data-cc-set-explain]', '[data-cc-post-note]', '[data-cc-post-count-live]', '[data-cc-lookup-note]', '[data-cc-feed-note]', '[data-cc-claim-result]', '[data-cc-set-result]', '[data-cc-post-result]']) {
    assert.match(doc.querySelector(sel).getAttribute('aria-live') || '', /polite/, sel + ' is a polite live region');
  }
  // what changes on every key is plain text, with a hidden polite twin that is written once typing pauses
  for (const sel of ['[data-cc-claim-hint]', '[data-cc-post-count]']) {
    assert.equal(doc.querySelector(sel).getAttribute('aria-live'), null, sel + ' is not a live region');
    assert.equal(doc.querySelector(sel).getAttribute('role'), null, sel + ' has no live role');
  }
  for (const sel of ['[data-cc-claim-errors]', '[data-cc-set-errors]', '[data-cc-post-errors]']) assert.equal(doc.querySelector(sel).getAttribute('role'), 'alert', sel);
  assert.ok(doc.querySelector('table caption'));
  for (const th of doc.querySelectorAll('thead th')) assert.equal(th.getAttribute('scope'), 'col');
  assert.equal(doc.querySelector('[data-cc-detail-title]').getAttribute('tabindex'), '-1');
  assert.match(src.page, /@media \(max-width:760px\)/);
  assert.match(read('src/styles/chain-apps.css'), /prefers-reduced-motion: reduce/);
  assert.match(read('src/styles/chain.css'), /button:focus-visible\{outline:2px solid var\(--c600\)/);
  assert.match(read('src/styles/chain-apps.css'), /\.chn \.ca-checkbox:focus-visible\{outline:2px solid var\(--c600\)/);
  assert.match(src.page, /\.cc-detail__t:focus-visible\{outline:2px solid var\(--c600\)/);
  // house style: square corners, 1.5px borders, weights 400 and 500 only, no animation
  const css = src.page.slice(src.page.indexOf('<style is:global>'));
  assert.doesNotMatch(css, /border-radius\s*:\s*[1-9]/);
  assert.doesNotMatch(css, /font:\s*(?:italic\s+)?(?:100|200|300|600|700|800|900)\b/);
  assert.doesNotMatch(css, /animation|transition|@keyframes/);
  assert.doesNotMatch(css, /border(?:-top|-bottom|-left|-right)?:\s*(?!1\.5px|0)\d/);
});

// ================================================================ rules read off the sources

test('nothing from the devnet becomes markup, a link or a style, and this page makes no link or download at all — proven by mutation', () => {
  assertNoSinks(src.view, 'channels-view.js');
  assertNoSinks(src.logic, 'channels.js');
  assertNoSinks(src.keys, 'key-panel.js');
  const inline = (src.page.match(/<script is:inline[\s\S]*?<\/script>/) || [''])[0];
  assertNoSinks(inline, 'the page script');
  assert.equal((code(src.view).match(/\.href\s*=/g) || []).length, 0);
  assert.doesNotMatch(code(src.view), /createObjectURL|new\s+(?:win\.)?Blob|\.download\s*=/, 'no download');
  assert.throws(() => assertNoSinks(src.view + '\nlink.href = row.url;', 'view'), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.innerHTML = x;', 'view'), /an HTML sink/);
  assert.throws(() => assertNoSinks(src.view + "\nn.setAttribute('onclick', x);", 'view'), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.logic + '\nn.insertAdjacentHTML("beforeend", x);', 'logic'), /an HTML sink/);
});

test('the page writes only the SDK’s signed transactions and a body by its hash: two routes, each behind a button and a confirm, after the page has checked again', () => {
  const posts = callArgs(src.logic, 'net.post(').map((a) => a.split(',')[0]);
  assert.deepEqual(posts, ["'/body'"], 'the body store; the signed transactions go through signAndSend');
  assert.equal((code(src.logic).match(/signAndSend\(/g) || []).length, 3, 'a claim, each step of a change, the post');
  assert.doesNotMatch(code(src.view), /\.post\(|method\s*:\s*['"]POST|\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
  assert.doesNotMatch(code(src.logic), /\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
  for (const arg of callArgs(src.logic, 'net.get(')) assert.ok(/^'\/(?:stations|params)'$|^'\/account\/' \+ encodeURIComponent\(sender\)$|^'\/station\/' \+ encodeURIComponent\(code\)$|^'\/feed\?limit=' \+ limit \+ \(scan\.before === null \? '' : '&before=' \+ scan\.before\)$|^'\/feed\?limit=' \+ limit$/.test(arg), arg);
  for (const arg of callArgs(src.view, 'net.get(')) assert.ok(/^'\/(?:stations|params)'$/.test(arg), arg);
  // every write is checked against a fresh read first, and the plan is checked again
  for (const fn of ['sendClaim', 'sendMode', 'sendBroadcast']) {
    const body = code(src.logic).slice(code(src.logic).indexOf('export async function ' + fn), code(src.logic).indexOf('export async function ' + fn) + 1400);
    assert.match(body, /gate\(plan, /, fn + ' refuses an invalid plan');
    assert.match(body, /await readWorldFresh\(net, chain, launch\)/, fn + ' reads the devnet again');
    assert.match(body, /gate\(again, /, fn + ' checks the plan again');
    assert.ok(body.indexOf('readWorldFresh') < body.indexOf('signAndSend'), fn + ' reads before it signs');
  }
  const post = code(src.logic).slice(code(src.logic).indexOf('export async function sendBroadcast'));
  assert.ok(post.indexOf("net.post('/body'") < post.indexOf('signAndSend('), 'the body is stored before the post is signed, so the filter’s refusal ends it');
  // the view reaches every write through a button and a plan
  assert.match(code(src.view), /on\('\[data-cc-claim-send\]', 'click', sendClaim\)/);
  assert.match(code(src.view), /on\('\[data-cc-set-send\]', 'click', sendMode\)/);
  assert.match(code(src.view), /on\('\[data-cc-post-send\]', 'click', sendPost\)/);
  assert.match(code(src.view), /if \(!plan \|\| !plan\.ok \|\| !k \|\| S\.halted\) return;/);
  assert.equal((code(src.view).match(/if \(!plan \|\| !plan\.ok \|\| !k \|\| S\.halted\) return;/g) || []).length, 3);
  // the page signs with the key it was given, never one it makes
  assert.doesNotMatch(code(src.view) + code(src.logic), /newSeedHex|keyFromSeed/);
  // a change carries the pin and the offer: set_station is built from them
  assert.match(code(src.logic), /pinned: station\.pinned, owner_to: station\.offer/);
});

test('the reserved list covers the website’s channel codes and the lanes the other apps post to, and the page’s rules say the same list', () => {
  const lanes = [...src.logic.matchAll(/^  ([A-Z]{2,6}): '/gm)].map((m) => m[1]);
  assert.deepEqual(Object.keys(C.RESERVED).sort(), [...lanes].sort());
  for (const site of Object.keys(CHANNELS)) assert.ok(Object.hasOwn(C.RESERVED, site) || HOUSE_CODES.includes(site), site + ' is reserved or a house code');
  // the lanes the devnet's own apps post to
  const lane = (file, re) => assert.match(read(file), re, file);
  lane('public/chain/apps/notary.js', /CHANNEL = 'NOTARY'/);
  lane('public/chain/apps/daily-mint.js', /channel: 'DLY'/);
  lane('public/chain/apps/capsules.js', /CHANNELS = Object\.freeze\(\['BOT', 'GDN'\]\)/);
  for (const c of ['BOT', 'DLY', 'NOTARY', 'NET', 'OBS', 'WIT', 'NM']) assert.ok(Object.hasOwn(C.RESERVED, c), c);
  const listed = RESERVED_LANES.flatMap((l) => l.codes).sort();
  assert.deepEqual(listed, Object.keys(C.RESERVED).sort(), 'the copy lists exactly the codes the page refuses');
  assert.deepEqual([...STATION_FACTS.houseCodes], HOUSE_CODES);
  assert.equal(STATION_FACTS.maxPerAccount, 4);
  assert.equal(STATION_FACTS.nameBytes, C.LIMITS.name);
  assert.equal(STATION_FACTS.crewMax, C.LIMITS.crew);
  assert.equal(STATION_FACTS.codeMax, C.LIMITS.code);
});

test('the page is honest: first come first served, a reset takes every claim, no value, a code is not a trademark, the moderation is named exactly and so is what the house cannot do', () => {
  assert.equal(HONESTY_LINE, 'devnet · no value · may reset');
  const para = (src.page.match(/<p class="ca-honest"[\s\S]*?<\/p>/) || [''])[0].replace(/\s+/g, ' ');
  for (const needle of ['{HONESTY_LINE}', 'first come, first served', 'dated and recorded, never silent', '{DEVNET_PREVIOUS.path}', '{notYet(RESET.date)}', 'no claim survived it', 'promises nobody their code back', 'A channel is a code, not a trademark', 'carries no endorsement']) assert.ok(para.includes(needle), needle);
  assert.equal(DEVNET_PREVIOUS.path, '/chain/yard/devnet-1/');
  assert.match(RESET.date, /^20\d\d-\d\d-\d\d/);
  const rules = Object.fromEntries(RULES.map((r) => [r.title, r.text]));
  assert.match(rules['First come, first served'], /Nobody reviews a claim, and nobody can take a code back from its owner, the house included/);
  assert.match(rules['A reset takes every claim'], /every claim, crew list and post goes with the old one, and the new chain does not promise anyone their code back/);
  assert.match(rules['A reset takes every claim'], /dated and recorded, never silent/);
  assert.match(rules['No value, no endorsement'], /Names carry no endorsement\. PointCast does not vouch for any station/);
  assert.match(rules['A channel is a code, not a trademark'], /does not make you FOO anywhere else/);
  assert.match(rules['A channel is a code, not a trademark'], /that is this page’s rule, not the chain’s/);
  assert.match(rules['Limits the chain sets'], /1 to 16 capital letters and digits/);
  assert.match(rules['Limits the chain sets'], /at most 16 addresses and never the owner/);
  assert.match(rules['Limits the devnet sets on sending'], /at most 8 KiB on the devnet \(this page stops at 4,000 bytes\)/);
  assert.match(rules['Limits the devnet sets on sending'], /60 signed transactions a minute/);
  const mod = Object.fromEntries(MODERATION.map((r) => [r.title, r.text]));
  assert.match(mod['The word filter'], /POST \/body.*best-effort list, answering “kept off the devnet by its word filter”/);
  assert.match(mod['What the word filter does not read'], /does not read a post’s title, a station’s code or a station’s name: those go onto the chain exactly as you sign them/);
  assert.match(mod['The house can hide a post'], /“\[hidden by the devnet admin\]”.*The block is unchanged and still verifies, and anyone who replays the chain still sees the post/);
  assert.match(mod['The house can pause a keyless bot'], /pausing one of the keyless bots/);
  assert.match(mod['What the house cannot do'], /no route that takes a station back, renames it or hides its name, and none that removes a crew member for the owner/);
  assert.match(mod['What the house cannot do'], /devnet-2 · bot · unmoderated/);
  assert.match(mod['The page’s own guards'], /only to a channel you own or crew, never to a house code or a code the house holds/);
  assert.match(mod['The page’s own guards'], /The chain, called directly, allows more\./);
  assert.ok(NOT_LIST.some((t) => /It is not moderated/.test(t)) && NOT_LIST.some((t) => /It is not permanent/.test(t)) && NOT_LIST.some((t) => /not a channel of the PointCast website/.test(t)));
  assert.match(src.page, /Claim a channel\. Broadcast on it\./);
  assert.match(src.page, /NOTHING IS SENT UNTIL YOU PRESS SEND/);
  assert.match(src.page, /<h2 id="rules-title"[^>]*>What you are agreeing to\.<\/h2>/);
  assert.match(src.page, /<h2 id="how-title"[^>]*>A claim, a crew and a post\.<\/h2>/);
  assert.match(src.page, /\{HOW_STEPS\.map\(/);
  assert.match(src.page, /\{NOT_LIST\.map\(/);
  assert.match(src.page, /Moderation, exactly/);
  assert.match(src.page, /\{DEVNET\.label\}/);
  assert.match(src.page, /Codes this page does not offer/);
  // the claims about the devnet are the Worker's: the words it uses
  assert.equal(WORDS.filter, 'kept off the devnet by its word filter');
  assert.equal(WORDS.notCrew, "only this station's owner and crew post or seal here");
  assert.match(C.modeWords('crew', 'X', 1), /“only this station’s owner and crew post or seal here”/);
});

test('no banned word and no currency sign anywhere in the app’s files, and the scanner catches each one', () => {
  assert.ok(MY_FILES.length >= 8, MY_FILES.join(' '));
  for (const f of MY_FILES) {
    const text = read(f);
    assert.deepEqual(bannedHits(text), [], f + ' carries a banned word');
    assert.deepEqual(currencyHits(text), [], f + ' carries a price');
  }
  for (const w of BANNED) assert.ok(bannedHits('some ' + w + ' here').length, w);
  assert.ok(currencyHits('costs ' + String.fromCharCode(36) + '5').length);
  assert.deepEqual(currencyHits('a template ${x} and a regular expression /^[a-z]+$/'), [], 'code is not money');
});

test('the snippet on the page is real JavaScript, pins the genesis, reads the station before it sets a crew, stores a body before it posts, and is plain strings', () => {
  const text = codeSnippet(DEVNET.url, DEVNET.genesis);
  const dir = mkdtempSync(join(tmpdir(), 'channel-snippet-'));
  try {
    writeFileSync(join(dir, 'channel.mjs'), text);
    const syntax = spawnSync(process.execPath, ['--check', join(dir, 'channel.mjs')], { encoding: 'utf8' });
    assert.equal(syntax.status, 0, syntax.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.ok(text.includes('genesisHash: GENESIS'));
  assert.ok(text.indexOf('get("/station/" + code)') < text.indexOf('"set_station"'), 'the station is read before the crew is set');
  assert.match(text, /pinned: st\.pinned, owner_to: st\.offer/);
  assert.ok(text.indexOf('post("/body"') < text.indexOf('buildTx("publish_block"'), 'the body is stored before the post');
  assert.doesNotMatch(text, /`|\$\{/);
  assert.ok(text.split('\n').length <= 32);
  assert.ok(text.includes(DEVNET.url) && text.includes(DEVNET.genesis));
});

// ================================================================ the built page (skips while dist/ is absent)

const builtPath = new URL('dist/chain/channels/index.html', root);
test('the built page carries the hooks, the honesty line, the pinned genesis, the key panel, the rules, the code and no outside script', { skip: !existsSync(builtPath) && 'dist/ is absent: run npm run build:bare to check the built page' }, () => {
  const html = readFileSync(builtPath, 'utf8');
  for (const h of new Set(src.view.match(/data-cc-[a-z-]+/g))) assert.ok(html.includes(h), h);
  assert.ok(html.includes(HONESTY_LINE));
  assert.ok(html.includes('data-genesis="' + DEVNET.genesis + '"'));
  assert.ok(html.includes('data-key-panel'));
  assert.match(html, /<h1>Claim a channel\. Broadcast on it\.<\/h1>/);
  assert.ok(html.includes('channel.mjs'));
  for (const r of RULES) assert.ok(html.includes(r.title), r.title);
  for (const st of HOW_STEPS) assert.ok(html.includes(st.title), st.title);
  for (const t of NOT_LIST) assert.ok(html.includes(t.slice(0, 40).replace(/’/g, '&#8217;')) || html.includes(t.slice(0, 40)), t.slice(0, 40));
  for (const r of MODERATION) assert.ok(html.includes(r.title), r.title);
  assert.ok(html.includes(DEVNET.label));
  assert.ok(!/<script[^>]+src="https?:\/\/(?!pointcast\.xyz)/.test(html));
  assert.ok(!html.includes('{HOW_STEPS') && !html.includes('{RULES'), 'no Astro expression left in the output');
});

// ================================================================ the real devnets (GET only; skipped when unreachable)

async function reach(base) {
  try {
    const r = await fetch(base + '/status', { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    return { base, status: await r.json() };
  } catch {
    return null;
  }
}
const LOCAL = await reach('http://127.0.0.1:8799');
const LIVE = await reach(DEVNET.url);

for (const [label, ep, genesis] of [['local devnet-2 at 127.0.0.1:8799', LOCAL, () => (LOCAL ? LOCAL.status.genesis_hash : '')], ['the live devnet', LIVE, () => DEVNET.genesis]]) {
  test('against ' + label + ': the stations read, every station reads back from its own route, and the feed joins to them', async (t) => {
    if (!ep) return t.skip(label + ' is not reachable');
    if (ep.status.genesis_hash !== genesis()) return t.skip(label + ' has a different genesis from the one pinned here');
    const net = K.makeNet(ep.base);
    const list = C.readStations(await net.get('/stations'));
    assert.ok(list && list.enabled);
    assert.ok(list.rows.length >= 6);
    for (const h of HOUSE_CODES) assert.ok(list.rows.some((s) => s.code === h && s.house), h + ' is a house station');
    assert.ok(list.maxStations >= 1);
    const launch = C.readLaunch(await net.get('/params'));
    assert.equal(launch.stations, true);
    assert.equal(launch.ticketed, false, 'devnet-2 does not ask for presence tickets');
    for (const s of list.rows.slice(0, 5)) assert.deepEqual(C.readStation(await net.get('/station/' + s.code)), s);
    const none = await net.get('/station/ZZZNOSUCHCODE');
    assert.equal(C.readStation(none), null, 'a code with no station reads as none');
    const scan = await C.scanFeed(net, C.newScan(), { pages: 3 });
    for (const p of scan.posts.values()) assert.ok(['ok', 'none', 'hidden', 'missing', 'unverified'].includes(p.bodyState));
    const w = C.makeWorld({ status: { house: ep.status.house }, list, launch });
    const rows = C.directory({ world: w, scan, me: '' });
    assert.ok(rows.length >= list.rows.length);
    for (const s of list.rows) assert.ok(rows.some((r) => r.code === s.code));
    // the house codes are never offered to claim or broadcast to
    for (const h of HOUSE_CODES) {
      assert.equal(C.checkClaimable(h, OWNER_ADDR, w).ok, false, h);
      assert.equal(C.planBroadcast({ station: w.byCode.get(h), sender: w.byCode.get(h).owner, title: 't', body: 'b', world: w }).ok, false, h);
    }
  });
}
