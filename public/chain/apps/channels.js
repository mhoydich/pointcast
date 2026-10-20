// channels.js: the logic behind Channels (/chain/channels): see every broadcast
// channel on the PointCast devnet, claim a free code, set it open or crew-only,
// add crew, and broadcast to a channel you own or crew.
//
// An ES module with no DOM access, so the page and node run the same code
// (tests/chain-app-channels.test.mjs, scripts/e2e-chain-app-channels.mjs).
//
// What a station is (launch record 13, chain-core station.rs). A channel is a
// code, [A-Z0-9]{1,16}, that posts are filed under. Any code can be claimed once:
//   claim_station {code, name, mode}   the first claim the devnet seals wins. The
//                  owner may send it again to rename the station or change its
//                  mode. A claimed code is refused to everyone else with
//                  "someone else holds this station"; the house codes are the
//                  treasury's from block 0. One account holds at most max_stations
//                  of them (the house's codes count against nobody), and the
//                  devnet holds at most max_account_stations in all.
//   set_station {code, crew, pinned, owner_to}   owner only. It REPLACES the crew
//                  (at most 16, sorted, never the owner), the pin and the standing
//                  offer all at once, so changing the crew means sending back the
//                  pin and the offer the station already has.
//   mode           open: anyone posts. crew: only the owner and the crew post (and
//                  seal capsules); anyone else is refused with "only this
//                  station's owner and crew post or seal here".
// A post is a publish_block: a title on chain and a body stored by its hash
// (POST /body), where the devnet's word filter reads it. The filter reads
// stored bodies; it does not read a title, a station's code or its name.
//
// The page's own guards, on top of the chain's: it broadcasts only to a channel
// you own or crew, never to a house code or a code the house holds, and it does
// not offer a claim on the codes the devnet's own lanes and the website use
// (RESERVED). The chain, called directly, allows more. devnet: no value, may reset;
// a reset takes every claim.

import { pcc, cleanBlock, cleanText, isHex64, isObj, isWhole, KitError, pinnedStatus, shortAddr, signAndSend } from './chain-kit.js';

export const CODE_RE = /^[A-Z0-9]{1,16}$/;
export const MODES = Object.freeze(['open', 'crew']);
export const LIMITS = Object.freeze({
  code: 16,
  name: 32,
  title: 120,
  titleBytes: 200,
  bodyBytes: 4000,
  crew: 16,
  feedPages: 4,
  morePages: 4,
  feedLimit: 100,
  maxPosts: 3000,
  shown: 20,
  rows: 400,
  preview: 600,
});

/**
 * Codes this page does not offer for a claim, and why. The chain would take them
 * (only the six house codes are the house's), and a crew-mode claim on one would
 * lock out whatever posts there: the keyless bots and the sealed capsules (BOT), the
 * Daily Mint (DLY), the Daily Net (NET, OBS, WIT), the Notary, the Nouns Money
 * station (NM) and the website's own channel codes. This is the page's rule, and
 * the page says so.
 */
export const RESERVED = Object.freeze({
  BOT: 'the bots’ lane: keyless bot posts and sealed capsules go here',
  DLY: 'the Daily Mint’s lane',
  NET: 'a Daily Net lane (duties and reports)',
  OBS: 'a Daily Net lane (observers)',
  WIT: 'a Daily Net lane (witness attestations)',
  NOTARY: 'the Notary’s lane',
  NM: 'the Nouns Money station, which the house claims',
  CRT: 'a PointCast website channel code',
  SPN: 'a PointCast website channel code',
  ESC: 'a PointCast website channel code',
  FCT: 'a PointCast website channel code',
  VST: 'a PointCast website channel code',
  BTL: 'a PointCast website channel code',
  BDY: 'a PointCast website channel code',
});

// Control characters other than the ordinary whitespace a person may type or paste (tab, newline, return), which is folded to a space.
const CONTROL = new RegExp('[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f-\\u009f\\u2028\\u2029]');
const BIDI = new RegExp('[\\u061c\\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069]');
const FORMAT_CHARS = new RegExp('\\p{Cf}', 'u');
const utf8 = (s) => new TextEncoder().encode(s);
const upperAscii = (s) => s.replace(/[a-z]/g, (c) => c.toUpperCase());
const quote = (s) => '“' + cleanText(s, 40) + '”';
/** A character a person typed, named so it can be seen: a space, an invisible one by its code point, else itself in quotes. */
const named = (ch) => (/\s/.test(ch) ? 'a space' : /[\p{Cc}\p{Cf}]/u.test(ch) ? 'the invisible character U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') : quote(ch));

// ---------------------------------------------------------------- the words for a mode

/** What a mode means for who can post, in one sentence about one channel. */
export function modeWords(mode, code, crewCount = 0) {
  if (mode === 'crew') {
    return 'Crew: only the owner and ' + (crewCount === 1 ? 'the 1 crew member' : crewCount === 0 ? 'the crew (none yet)' : 'the ' + crewCount + ' crew members') + ' post on ' + code + ', and seal time capsules on it. Anyone else is refused by the chain with “only this station’s owner and crew post or seal here”. Everyone can still read it.';
  }
  return 'Open: anyone with a devnet key can post on ' + code + '.' + (crewCount ? ' The ' + crewCount + ' crew listed ' + (crewCount === 1 ? 'is' : 'are') + ' only a roster while it is open.' : '') + ' The owner keeps the code and can switch it to crew at any time.';
}

// ---------------------------------------------------------------- reading the devnet

/** One station, from GET /station/{code} (flat), a row of GET /stations, or {station: {...}}. A code with no station is null. */
export function readStation(json) {
  const s = isObj(json) && isObj(json.station) ? json.station : json;
  if (!isObj(s) || typeof s.code !== 'string' || !CODE_RE.test(s.code)) return null;
  if (typeof s.owner !== 'string' || pcc.addressKind(s.owner) === null) return null;
  if (!MODES.includes(s.mode)) return null;
  const crew = Array.isArray(s.crew) ? s.crew.filter((a) => typeof a === 'string' && pcc.addressKind(a) !== null) : [];
  return {
    code: s.code,
    nameRaw: typeof s.name === 'string' ? s.name : '',
    name: typeof s.name === 'string' ? cleanText(s.name, 64) : '',
    owner: s.owner,
    mode: s.mode,
    crew,
    pinned: isHex64(s.pinned) ? s.pinned : null,
    offer: typeof s.offer === 'string' && pcc.addressKind(s.offer) !== null ? s.offer : null,
    house: s.house === true,
    claimedAt: isWhole(s.claimed_at) ? s.claimed_at : 0,
  };
}

/** GET /stations -> { enabled, houseCodes, maxStations, rows }, or null when it is not the shape this page reads. */
export function readStations(json) {
  if (!isObj(json) || !Array.isArray(json.stations)) return null;
  return {
    enabled: json.enabled !== false,
    houseCodes: (Array.isArray(json.house_codes) ? json.house_codes : []).filter((c) => typeof c === 'string' && CODE_RE.test(c)),
    maxStations: isWhole(json.max_stations) ? json.max_stations : null,
    rows: json.stations.map(readStation).filter(Boolean),
  };
}

/** The launch facts the page needs from GET /params: the station limits, and whether claims need a presence ticket. */
export function readLaunch(json) {
  const launch = isObj(json) && isObj(json.launch) ? json.launch : null;
  const sp = launch && isObj(launch.stations) ? launch.stations : null;
  const pr = launch && isObj(launch.presence) ? launch.presence : null;
  return {
    stations: sp !== null,
    maxStations: sp && isWhole(sp.max_stations) ? sp.max_stations : null,
    maxAccountStations: sp && isWhole(sp.max_account_stations) ? sp.max_account_stations : null,
    // A chain whose presence record asks for tickets counts a claim against a bound presence pid, which this page cannot make.
    ticketed: Boolean(pr) && typeof pr.tap_policy === 'string' && pr.tap_policy.toLowerCase() !== 'open',
  };
}

/** What this page reads about the world: the devnet's status, its station list and its launch facts. */
export function makeWorld({ status = null, list = null, launch = null } = {}) {
  const l = launch || { stations: true, maxStations: null, maxAccountStations: null, ticketed: false };
  return {
    house: status && typeof status.house === 'string' ? status.house : '',
    list,
    enabled: Boolean(list) && list.enabled && l.stations !== false,
    max: (list && list.maxStations) || l.maxStations || 0,
    maxAccountStations: l.maxAccountStations || 0,
    ticketed: Boolean(l.ticketed),
    byCode: new Map((list ? list.rows : []).map((s) => [s.code, s])),
  };
}

/** Is this station the house's: a house code, or held by the treasury (the Nouns Money station is)? */
export function isHouse(station, world) {
  if (!station) return false;
  return station.house === true || Boolean(world && world.house && station.owner === world.house) || Boolean(world && world.list && world.list.houseCodes.includes(station.code));
}

/** How many stations an account holds against its cap: its own, not the house’s. */
export function heldBy(world, sender) {
  if (!world.list || !sender) return 0;
  return world.list.rows.filter((s) => s.owner === sender && !s.house).length;
}

/** Whose is this station, in words: 'you', 'the house', or a short address. */
export function holderWords(station, world, me = '') {
  if (!station) return 'nobody (unclaimed)';
  if (me && station.owner === me) return 'you';
  if (world && world.house && station.owner === world.house) return 'the house' + (station.house ? ' (a house code)' : '');
  return shortAddr(station.owner) + (station.house ? ' (a house code)' : '');
}

/** What the signed-in key may do on a channel: 'owner', 'crew', or null. */
export function roleOf(station, me) {
  if (!station || !me) return null;
  if (station.owner === me) return 'owner';
  return station.crew.includes(me) ? 'crew' : null;
}

// ---------------------------------------------------------------- the feed

/** One publish_block card from GET /feed. Anything else, or anything malformed, is null. */
export function readPostCard(card, block) {
  if (!isObj(card) || card.kind !== 'publish_block' || !isObj(card.payload) || typeof card.sender !== 'string' || !isHex64(card.hash)) return null;
  const p = card.payload;
  if (typeof p.channel !== 'string' || !CODE_RE.test(p.channel)) return null;
  const hidden = card.hidden === true;
  const bodyHash = isHex64(p.body_hash) ? p.body_hash : '';
  const raw = typeof p.body === 'string' && !hidden ? p.body : null;
  let bodyState = 'none';
  let body = '';
  if (hidden) bodyState = 'hidden';
  else if (raw !== null) {
    if (bodyHash && pcc.bodyHash(raw) === bodyHash) { bodyState = 'ok'; body = cleanBlock(raw, LIMITS.bodyBytes); } else bodyState = 'unverified';
  } else if (/^0{64}$/.test(bodyHash)) bodyState = 'none';
  else if (bodyHash) bodyState = 'missing';
  return {
    hash: card.hash,
    channel: p.channel,
    title: typeof p.title === 'string' ? cleanText(p.title, 200) : '',
    body,
    bodyState,
    bodyHash,
    sender: card.sender,
    kind: isObj(card.sender_info) && typeof card.sender_info.kind === 'string' ? cleanText(card.sender_info.kind, 16) : '',
    bot: typeof card.bot === 'string' ? cleanText(card.bot, 40) : '',
    height: isWhole(block.height) ? block.height : 0,
    timeMs: isWhole(block.timestamp) ? block.timestamp : 0,
    hidden,
  };
}

/** GET /feed -> { tip, posts (newest first), blockCount, nextBefore }. Null when it is not the shape this page reads. */
export function readFeedPage(json) {
  if (!isObj(json) || !Array.isArray(json.blocks)) return null;
  const posts = [];
  let blocks = 0;
  for (const b of json.blocks) {
    if (!isObj(b) || !isWhole(b.height) || !Array.isArray(b.txs)) continue;
    blocks += 1;
    // inside a block the cards run oldest first: newest first here
    for (let i = b.txs.length - 1; i >= 0; i--) {
      const p = readPostCard(b.txs[i], b);
      if (p) posts.push(p);
    }
  }
  return { tip: isWhole(json.tip) ? json.tip : null, posts, blockCount: blocks, nextBefore: isWhole(json.next_before) && json.next_before >= 1 && json.blocks.length ? json.next_before : null };
}

export const newScan = () => ({ before: null, complete: false, pages: 0, blocks: 0, posts: new Map(), tip: null, started: false });

/** Put what was just read into the scan. The newest read of a post wins: the keeper may have hidden (or unhidden) one that was read before. */
function merge(scan, posts) {
  for (const p of posts) scan.posts.set(p.hash, p);
  if (scan.posts.size > LIMITS.maxPosts) {
    const keep = [...scan.posts.values()].sort(newestFirst).slice(0, LIMITS.maxPosts);
    scan.posts = new Map(keep.map((p) => [p.hash, p]));
  }
}

export const newestFirst = (a, b) => b.height - a.height || 0;

/** Read `pages` more pages of GET /feed, older and older, into `scan`. Returns the scan. */
export async function scanFeed(net, scan, { pages = LIMITS.feedPages, limit = LIMITS.feedLimit } = {}) {
  let n = 0;
  while (n < pages && !scan.complete) {
    const page = readFeedPage(await net.get('/feed?limit=' + limit + (scan.before === null ? '' : '&before=' + scan.before)));
    if (!page) throw new KitError('the devnet’s /feed is not the shape this page reads', { code: 'shape' });
    n += 1;
    scan.pages += 1;
    scan.blocks += page.blockCount;
    scan.started = true;
    if (scan.tip === null || (page.tip !== null && page.tip > scan.tip)) scan.tip = page.tip;
    merge(scan, page.posts);
    if (page.nextBefore === null || (scan.before !== null && page.nextBefore >= scan.before)) scan.complete = true;
    else scan.before = page.nextBefore;
  }
  return scan;
}

/** The newest page again, merged in: new posts appear, the older cursor is not moved. */
export async function refreshNewest(net, scan, { limit = LIMITS.feedLimit } = {}) {
  const page = readFeedPage(await net.get('/feed?limit=' + limit));
  if (!page) throw new KitError('the devnet’s /feed is not the shape this page reads', { code: 'shape' });
  if (page.tip !== null) scan.tip = page.tip;
  merge(scan, page.posts);
  return page.posts.length;
}

/** The posts of one channel, newest first, at most `max`. */
export function postsOf(scan, code, max = LIMITS.shown) {
  return [...scan.posts.values()].filter((p) => p.channel === code).sort(newestFirst).slice(0, max);
}

// ---------------------------------------------------------------- the directory

/**
 * Every channel that has a station or a post in what was read, as rows:
 * { code, station, held ('you' | 'house' | 'other' | 'none'), mode ('open' | 'crew' | 'unclaimed'), crew, last, seen, role, mayPost }.
 * Newest post first, then the rest by code.
 */
export function directory({ world, scan, me = '' }) {
  const codes = new Set(world.byCode.keys());
  const seen = new Map();
  for (const p of scan.posts.values()) {
    codes.add(p.channel);
    const cur = seen.get(p.channel) || { n: 0, last: null };
    cur.n += 1;
    if (!cur.last || p.height > cur.last.height) cur.last = p;
    seen.set(p.channel, cur);
  }
  const rows = [...codes].map((code) => {
    const station = world.byCode.get(code) || null;
    const s = seen.get(code) || { n: 0, last: null };
    const role = roleOf(station, me);
    const house = isHouse(station, world);
    return {
      code,
      station,
      held: !station ? 'none' : me && station.owner === me ? 'you' : house ? 'house' : 'other',
      mode: station ? station.mode : 'unclaimed',
      crew: station ? station.crew : [],
      last: s.last,
      seen: s.n,
      role,
      house,
      mayPost: Boolean(role) && !house,
    };
  });
  rows.sort((a, b) => (b.last ? b.last.height : -1) - (a.last ? a.last.height : -1) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  return rows;
}

/** Filter the directory: 'all', 'mine' (owned or crewed), 'open', 'crew', 'free' (posts but no station), 'house'. */
export function filterRows(rows, how) {
  switch (how) {
    case 'mine': return rows.filter((r) => r.role);
    case 'open': return rows.filter((r) => r.mode === 'open');
    case 'crew': return rows.filter((r) => r.mode === 'crew');
    case 'free': return rows.filter((r) => r.mode === 'unclaimed');
    case 'house': return rows.filter((r) => r.house);
    default: return rows;
  }
}

// ---------------------------------------------------------------- the rules, before anything is signed

/** A channel code as typed: lower case is made upper case; anything else outside [A-Z0-9] is refused with the character named. */
export function checkCode(raw) {
  const s = upperAscii(String(raw === undefined || raw === null ? '' : raw).trim());
  if (!s) return { ok: false, code: '', error: 'Type a channel code: 1 to 16 capital letters and digits.' };
  const chars = Array.from(s);
  const bad = chars.find((ch) => !/^[A-Z0-9]$/.test(ch));
  if (bad !== undefined) return { ok: false, code: s, error: 'A channel code is the capital letters A to Z and the digits 0 to 9 and nothing else; ' + named(bad) + ' is not allowed.' };
  if (chars.length > LIMITS.code) return { ok: false, code: s, error: 'A channel code is at most ' + LIMITS.code + ' characters; this one is ' + chars.length + '.' };
  return { ok: true, code: s, error: '' };
}

/** A station name: 1 to 32 bytes, no control or invisible formatting characters. `current` is the name already on chain, kept exactly when unchanged. */
export function checkName(raw, current = null) {
  if (current !== null && raw === current && current !== '') return { ok: true, name: current, error: '' };
  const typed = String(raw === undefined || raw === null ? '' : raw);
  // refused as typed: folding first would turn an invisible character into a visible space and hide that it was there
  if (CONTROL.test(typed) || BIDI.test(typed) || FORMAT_CHARS.test(typed)) return { ok: false, name: typed, error: 'The name cannot hold control, direction or invisible formatting characters.' };
  const s = typed.replace(/\s+/g, ' ').trim();
  if (!s) return { ok: false, name: '', error: 'Give the station a name, 1 to 32 bytes.' };
  const n = utf8(s).length;
  if (n > LIMITS.name) return { ok: false, name: s, error: 'A station name is at most ' + LIMITS.name + ' bytes (letters with accents and emoji take 2 to 4 each); this one is ' + n + '.' };
  return { ok: true, name: s, error: '' };
}

/**
 * Can this key claim this code, and if not, why? Pure: the answer comes from what
 * was read. Returns { ok, kind ('new' | 'take_offer'), message, code }. `kind`
 * 'take_offer' is a station its owner offered to this key.
 */
export function checkClaimable(rawCode, sender, world) {
  const c = checkCode(rawCode);
  if (!c.ok) return { ok: false, kind: '', message: c.error, code: c.code };
  const code = c.code;
  if (!world.list) return { ok: false, kind: '', message: 'The devnet’s stations are not read yet.', code };
  if (!world.enabled) return { ok: false, kind: '', message: 'This devnet has no stations (launch record 13 is off), so no code can be claimed.', code };
  if (world.ticketed) return { ok: false, kind: '', message: 'This devnet asks for a bound presence ticket to claim a station, which this page cannot make. Nothing can be claimed from here.', code };
  const station = world.byCode.get(code) || null;
  if (station) {
    if (sender && station.owner === sender) return { ok: false, kind: '', message: quote(code) + ' is already yours (claimed in block ' + station.claimedAt + '). Change its mode or crew under “Mode and crew”.', code };
    if (sender && station.offer === sender) {
      const held = heldBy(world, sender);
      if (world.max && held >= world.max) return { ok: false, kind: '', message: quote(code) + ' was offered to you, but you already hold ' + held + ' of the ' + world.max + ' stations one account may hold, and the chain refuses a ' + (world.max + 1) + 'th (“this holder already holds ' + world.max + ' stations”).', code };
      return { ok: true, kind: 'take_offer', message: 'Its owner offered ' + quote(code) + ' to you. Claiming takes it, and clears its crew and its pin.', code };
    }
    if (world.list.houseCodes.includes(code) || station.house) return { ok: false, kind: '', message: quote(code) + ' is a house code: the devnet’s house has held it since block 0, and the chain refuses every other claim on it (“someone else holds this station”).', code };
    if (world.house && station.owner === world.house) return { ok: false, kind: '', message: quote(code) + ' is held by the devnet’s house, since block ' + station.claimedAt + '. First come, first served: it is taken.', code };
    return { ok: false, kind: '', message: quote(code) + ' is held by ' + station.owner + ', since block ' + station.claimedAt + '. First come, first served: it is taken.', code };
  }
  if (Object.hasOwn(RESERVED, code)) return { ok: false, kind: '', message: quote(code) + ' is not offered here, because it is ' + RESERVED[code] + '. The chain would take the claim, and a claim in crew mode would lock out whatever posts there, so this page does not make it.', code };
  if (sender) {
    const held = heldBy(world, sender);
    if (world.max && held >= world.max) return { ok: false, kind: '', message: 'You already hold ' + held + ' of the ' + world.max + ' stations one account may hold on this devnet, and the chain refuses a ' + (world.max + 1) + 'th (“this holder already holds ' + world.max + ' stations”). The house’s own codes count against nobody.', code };
  }
  if (world.maxAccountStations) {
    const taken = world.list.rows.filter((s) => !world.list.houseCodes.includes(s.code)).length;
    if (taken >= world.maxAccountStations) return { ok: false, kind: '', message: 'The devnet already holds its most claimed stations (' + world.maxAccountStations + ') and takes no more until a reset.', code };
  }
  return { ok: true, kind: 'new', message: quote(code) + ' is free. First come, first served: the first claim the devnet seals wins it.', code };
}

function modeOf(raw) {
  const m = String(raw === undefined || raw === null ? '' : raw).trim().toLowerCase();
  return MODES.includes(m) ? m : '';
}

/** Check a claim before anything is signed. Returns { ok, errors, fields: { code, name, mode, kind }, input }. */
export function planClaim({ code, name, mode, sender, world }) {
  const errors = [];
  const fields = { code: '', name: '', mode: '', kind: '' };
  const input = { code, name, mode };
  const claim = checkClaimable(code, sender, world);
  fields.code = claim.code;
  if (!claim.ok) errors.push(claim.message); else fields.kind = claim.kind;
  const nm = checkName(name);
  if (!nm.ok) errors.push(nm.error); else fields.name = nm.name;
  const md = modeOf(mode);
  if (!md) errors.push('Pick a mode: open (anyone posts) or crew (only you and your crew post).'); else fields.mode = md;
  if (!sender) errors.push('Make a key first: it claims the code and owns it.');
  return { ok: errors.length === 0, errors, fields, input, note: claim.ok ? claim.message : '' };
}

/** Crew addresses as typed (commas, spaces or lines), checked. Returns { ok, list (sorted, unique), errors }. */
export function parseCrew(raw, owner = '') {
  const parts = (Array.isArray(raw) ? raw : String(raw === undefined || raw === null ? '' : raw).split(/[\s,]+/)).map((x) => String(x).trim()).filter(Boolean);
  const errors = [];
  const list = [];
  for (const a of parts) {
    if (pcc.addressKind(a) === null) { errors.push(quote(a) + ' is not a devnet address (tz1…, tz2…, pca1… or pcp1…).'); continue; }
    if (owner && a === owner) { errors.push('That is the channel’s owner (' + shortAddr(a) + '): the owner always may post, so it is not listed as crew.'); continue; }
    if (!list.includes(a)) list.push(a);
  }
  if (list.length > LIMITS.crew) errors.push('A station lists at most ' + LIMITS.crew + ' crew; this is ' + list.length + '.');
  list.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  return { ok: errors.length === 0, list, errors };
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * Check a change to a station you own: its name, its mode and its crew. Returns
 * { ok, errors, steps, fields, diff, input }. `steps` is what would be signed, in
 * order: a set_station for the crew first (a crew list is only a roster until the
 * mode is crew, and a new crew is in place the moment crew mode starts), then a
 * claim_station for the name or mode. The pin and the standing offer are sent back
 * exactly as the station has them, because set_station replaces all three.
 */
export function planMode({ station, sender, name, mode, crew, world }) {
  const errors = [];
  const input = { name, mode, crew };
  if (!sender) errors.push('Make a key first: only the owner can change a station.');
  if (!station) { errors.push('Pick one of your channels.'); return { ok: false, errors, steps: [], fields: null, diff: null, input }; }
  if (sender && station.owner !== sender) errors.push(quote(station.code) + ' is held by ' + (world && world.house && station.owner === world.house ? 'the devnet’s house' : station.owner) + ', not by this key. Only the owner can change its mode or crew (“only the station’s owner may do this”).');
  if (world && world.ticketed) errors.push('This devnet asks for a bound presence ticket to change a station, which this page cannot make.');
  const nm = checkName(name, station.nameRaw);
  if (!nm.ok) errors.push(nm.error);
  const md = modeOf(mode);
  if (!md) errors.push('Pick a mode: open (anyone posts) or crew (only you and your crew post).');
  const cr = parseCrew(crew, station.owner);
  errors.push(...cr.errors);
  const diff = {
    renamed: nm.ok && nm.name !== station.nameRaw,
    modeChanged: Boolean(md) && md !== station.mode,
    added: cr.list.filter((a) => !station.crew.includes(a)),
    removed: station.crew.filter((a) => !cr.list.includes(a)),
  };
  diff.crewChanged = diff.added.length + diff.removed.length > 0;
  if (errors.length === 0 && !diff.renamed && !diff.modeChanged && !diff.crewChanged) errors.push('Nothing to change: the station already has this name, mode and crew.');
  const fields = { code: station.code, name: nm.name, mode: md, crew: cr.list, pinned: station.pinned, offer: station.offer };
  const steps = [];
  if (errors.length === 0) {
    if (diff.crewChanged) steps.push({ type: 'set_station', code: station.code, crew: cr.list, pinned: station.pinned, owner_to: station.offer });
    if (diff.renamed || diff.modeChanged) steps.push({ type: 'claim_station', code: station.code, name: nm.name, mode: md });
  }
  return { ok: errors.length === 0, errors, steps, fields, diff, input };
}

function plainLine(v, max, maxBytes, what) {
  const typed = String(v === undefined || v === null ? '' : v);
  if (CONTROL.test(typed) || BIDI.test(typed) || FORMAT_CHARS.test(typed)) return { error: what + ': no control, direction or invisible formatting characters.' };
  const s = typed.replace(/\s+/g, ' ').trim();
  if (!s) return { error: what + ' cannot be empty.' };
  if (Array.from(s).length > max) return { error: what + ': at most ' + max + ' characters.' };
  if (utf8(s).length > maxBytes) return { error: what + ': at most ' + maxBytes + ' bytes (the chain’s limit; accents and emoji take 2 to 4 each).' };
  return { value: s };
}

function messageBody(v) {
  const s = String(v === undefined || v === null ? '' : v).replace(/\r\n?/g, '\n').trim();
  if (!s) return { error: 'The body cannot be empty: the devnet’s word filter reads it, and every post here carries one.' };
  if (new RegExp('[\\u0000-\\u0008\\u000b-\\u001f\\u007f-\\u009f\\u2028\\u2029]').test(s) || BIDI.test(s)) return { error: 'The body: no control or direction characters.' };
  if (utf8(s).length > LIMITS.bodyBytes) return { error: 'The body: at most ' + LIMITS.bodyBytes + ' bytes (' + utf8(s).length + ' now).' };
  return { value: s };
}

/** Which of the stations could this key broadcast to from this page: owned or crewed, and not the house's. */
export function broadcastTargets(world, me) {
  if (!me || !world.list) return [];
  return world.list.rows.filter((s) => roleOf(s, me) && !isHouse(s, world));
}

/** Check a broadcast before anything is stored or signed. Returns { ok, errors, fields: { code, title, body, bodyHash }, input }. */
export function planBroadcast({ station, sender, title, body, world }) {
  const errors = [];
  const input = { title, body };
  const fields = { code: station ? station.code : '', title: '', body: '', bodyHash: '' };
  if (!sender) errors.push('Make a key first: it signs the post.');
  if (!station) errors.push('Pick a channel you own or crew. A code nobody has claimed has no owner or crew: claim it first.');
  else if (isHouse(station, world)) errors.push(quote(station.code) + ' is a house channel, held by the devnet’s house. This page never posts to the house’s channels.');
  else if (sender && !roleOf(station, sender)) errors.push('This key is not the owner or on the crew of ' + quote(station.code) + '. ' + (station.mode === 'open' ? 'The chain lets anyone post to an open station, but this page broadcasts only to a channel you own or crew.' : 'The chain would refuse the post: “only this station’s owner and crew post or seal here”.'));
  const t = plainLine(title, LIMITS.title, LIMITS.titleBytes, 'The title');
  if (t.error) errors.push(t.error); else fields.title = t.value;
  const b = messageBody(body);
  if (b.error) errors.push(b.error); else { fields.body = b.value; fields.bodyHash = pcc.bodyHash(b.value); }
  return { ok: errors.length === 0, errors, fields, input };
}

// ---------------------------------------------------------------- sending

async function nextNonce(net, sender) {
  const acct = await net.get('/account/' + encodeURIComponent(sender));
  return isObj(acct) && isWhole(acct.next_nonce) ? acct.next_nonce : 0;
}

/** Read the world again, right before a write: the stations (and the status, checked against the genesis the page pinned). */
export async function readWorldFresh(net, chain, launch = null) {
  const status = await pinnedStatus(net, chain && chain.genesisHash ? chain.genesisHash : null);
  const list = readStations(await net.get('/stations'));
  if (!list) throw new KitError('the devnet’s /stations is not the shape this page reads', { code: 'shape' });
  return makeWorld({ status, list, launch });
}

function gate(plan, what) {
  if (plan.ok) return;
  throw new KitError(plan.errors[0] || what + ' is not valid', { code: 'gate' });
}

/** Read the station back, so a receipt shows what the chain says now. */
export async function readBack(net, code) {
  try { return readStation(await net.get('/station/' + encodeURIComponent(code))); } catch { return null; }
}

/**
 * Claim a code. `plan` is from planClaim; it is checked again against a fresh read
 * of the devnet right before signing (someone may have claimed the code since the
 * page last looked). Returns { txHash, height, index, receipt, station }.
 */
export async function sendClaim({ chain, net, key, plan, launch = null, onStage = () => {}, wait = {} }) {
  gate(plan, 'this claim');
  const world = await readWorldFresh(net, chain, launch);
  const again = planClaim({ ...plan.input, sender: key.sender, world });
  gate(again, 'this claim');
  const f = again.fields;
  const tx = pcc.buildTx('claim_station', { sender: key.sender, nonce: await nextNonce(net, key.sender), code: f.code, name: f.name, mode: f.mode });
  const done = await signAndSend(chain, key, tx, { onStage, ...wait });
  return { ...done, tx, station: await readBack(net, f.code) };
}

/**
 * Change a station you own. Each step in `plan.steps` is signed and waited for in
 * turn, with a fresh nonce; the station is read again first and the plan checked
 * against it. Returns { results: [{ type, txHash, height, index, receipt }], station }.
 * If a later step fails, the error carries `results` (what already landed).
 */
export async function sendMode({ chain, net, key, plan, launch = null, onStage = () => {}, wait = {} }) {
  gate(plan, 'this change');
  const world = await readWorldFresh(net, chain, launch);
  const station = world.byCode.get(plan.fields.code) || null;
  const again = planMode({ ...plan.input, station, sender: key.sender, world });
  gate(again, 'this change');
  const results = [];
  try {
    for (const step of again.steps) {
      const nonce = await nextNonce(net, key.sender);
      const tx = step.type === 'set_station'
        ? pcc.buildTx('set_station', { sender: key.sender, nonce, code: step.code, crew: step.crew, pinned: step.pinned, owner_to: step.owner_to })
        : pcc.buildTx('claim_station', { sender: key.sender, nonce, code: step.code, name: step.name, mode: step.mode });
      onStage(step.type);
      const done = await signAndSend(chain, key, tx, { onStage: (s) => onStage(step.type + ':' + s), ...wait });
      results.push({ type: step.type, tx, ...done });
    }
  } catch (e) {
    if (e && typeof e === 'object') e.results = results;
    throw e;
  }
  return { results, station: await readBack(net, again.fields.code) };
}

/**
 * Broadcast a post. Checks the plan against a fresh read of the station, stores the
 * body by its hash (POST /body: where the devnet's word filter reads it, and its
 * refusal is thrown as the devnet worded it, with nothing signed or sent), then signs
 * and sends the publish_block. Returns { txHash, height, index, receipt, post }.
 */
export async function sendBroadcast({ chain, net, key, plan, launch = null, onStage = () => {}, wait = {} }) {
  gate(plan, 'this post');
  const world = await readWorldFresh(net, chain, launch);
  const station = world.byCode.get(plan.fields.code) || null;
  const again = planBroadcast({ ...plan.input, station, sender: key.sender, world });
  gate(again, 'this post');
  const f = again.fields;
  const stored = await net.post('/body', { body: f.body });
  if (!isObj(stored) || stored.body_hash !== f.bodyHash) throw new KitError('the devnet stored the body under a different hash from the one signed', { code: 'body' });
  onStage('stored');
  const tx = pcc.buildTx('publish_block', { sender: key.sender, nonce: await nextNonce(net, key.sender), channel: f.code, title: f.title, body_hash: f.bodyHash });
  const done = await signAndSend(chain, key, tx, { onStage, ...wait });
  return { ...done, tx, post: { channel: f.code, title: f.title, body: f.body, bodyHash: f.bodyHash } };
}
