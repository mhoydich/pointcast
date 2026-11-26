import { isPerson } from './hearth.mjs';
import { personName, visiblePost, newest, source, contributionPosts, lending } from './hearth-contributions.mjs';

export const LEDGER_ROOMS = ['#efficiency', '#ledger', '#officenoun-tasks', '#loom-v2'];

const CARD_ID = /^[A-Z][A-Z0-9]{0,7}-[0-9]{1,4}[a-z]?$/;
const cardId = message => message.card && typeof message.card === 'object' && !Array.isArray(message.card) &&
  typeof message.card.id === 'string' && CARD_ID.test(message.card.id) ? message.card.id : null;

// The standalone runner's receipt headline; match the whole ID, not V2-30 or
// V2-3-extra when looking for V2-3. The rest of the body is not task evidence.
function cardReport(message) {
  const match = typeof message.body === 'string' && message.body.split(/\r?\n/, 1)[0]
    .match(/^\s*([Mm][Ii][Nn][Ee]|[Dd][Oo][Nn][Ee])\s+([A-Z][A-Z0-9]{0,7}-[0-9]{1,4}[a-z]?)(?=$|[\s·.,:;])/);
  return match ? { action: match[1].toUpperCase(), task: match[2] } : null;
}

// Sequence belongs to a room. It survives threaded display order and edits;
// timestamps are the fallback for older compact reads without append seqs.
function appendOrder(a, b) {
  if (a.room === b.room && Number.isSafeInteger(a.seq) && Number.isSafeInteger(b.seq) && a.seq !== b.seq) {
    return a.seq - b.seq;
  }
  return Date.parse(a.at) - Date.parse(b.at) || String(a.id).localeCompare(String(b.id));
}

function sender(from) {
  if (!['agent', 'human'].includes(from?.kind)) return null;
  const address = personName(from.address), name = personName(from.name);
  if (address) return JSON.stringify([from.kind, 'address', address]);
  // The runner supplies name + operator, without an address. An operator by
  // itself is attribution, not proof that two bots are the same claimant.
  return name ? JSON.stringify([from.kind, 'name', name, personName(from.operator)]) : null;
}

function signedCardCloses(posts) {
  const cards = new Map();
  for (const post of posts) {
    const id = cardId(post);
    if (id && (!cards.has(id) || appendOrder(post, cards.get(id)) < 0)) cards.set(id, post);
  }
  const closes = [];
  for (const [task, card] of cards) {
    // Before signed cards ship, these fields are absent and nothing qualifies.
    // Later copies cannot turn an unsigned original into a signed card.
    if (card.signed !== true) continue;
    const reports = posts.filter(post => post.room === card.room && appendOrder(post, card) > 0 &&
      (!post.parent || post.parent === card.id) && cardReport(post)?.task === task).sort(appendOrder);
    const claim = reports.findLast(post => cardReport(post).action === 'MINE');
    const claimant = sender(claim?.from);
    if (!claimant) continue;
    const done = reports.find(post => cardReport(post).action === 'DONE' && appendOrder(post, claim) > 0 &&
      sender(post.from) === claimant);
    if (done) closes.push({ post: done, task });
  }
  return closes;
}

/** Keep attribution metadata, token reports and folded task state; never raw ops. */
export function ledgerThread(messages = [], { room, key, trimmed = false, now = Date.now() } = {}) {
  return { address: room, state: 'read', key, trimmed: !!trimmed,
    messages: messages.filter(message => visiblePost(message, now)).sort(newest).map(message => {
      const id = cardId(message), report = cardReport(message);
      return {
        id: message.id, at: message.at, from: message.from,
        ...(message.editedAt ? { editedAt: message.editedAt } : {}),
        ...(id || report ? { seq: message.seq, parent: message.parent } : {}),
        ...(id ? { card: { id }, signed: message.signed === true } : {}),
        ...(room === '#efficiency' ? { body: message.body } : report ? { body: report.action + ' ' + report.task } : {}),
        ...(message.taskStatus?.reported ? { taskStatus: message.taskStatus } : {}),
      };
    }) };
}

/** Credit named operators as on their person cards; other bots keep their own row. */
export function ledgerRows(threads = [], { now = Date.now() } = {}) {
  const evidence = contributionPosts(threads, now).filter(post => LEDGER_ROOMS.includes(post.room));
  const signedCloses = signedCardCloses(evidence);
  const closers = new Set(signedCloses.map(({ post }) => post));
  // The new room supplies signed closes only. Unrelated or pre-card posts must
  // not change the existing ledger's identities or legacy task attribution.
  const posts = evidence.filter(post => post.room !== '#loom-v2' || closers.has(post));
  const people = new Map(), aliases = new Map(), bots = new Map();
  const operatedBots = new Set(posts.filter(post => post.from?.kind === 'agent' && personName(post.from.operator))
    .map(post => personName(post.from.address || post.from.name)));
  const addressedNames = new Map();
  const humanHandles = new Set();
  for (const { from } of posts) {
    if (!isPerson(from) || !personName(from.address)) continue;
    const handle = personName(from.address);
    humanHandles.add(handle);
    aliases.set(handle, handle);
    if (!personName(from.name)) continue;
    const name = personName(from.name);
    if (!addressedNames.has(name)) addressedNames.set(name, new Set());
    addressedNames.get(name).add(handle);
  }
  for (const [name, handles] of addressedNames) {
    if (handles.size === 1 && !humanHandles.has(name)) aliases.set(name, [...handles][0]);
  }
  // Learn human handles before resolving operator names. Addresses are the
  // stable identity; spelling/case changes must not split an existing handle.
  for (const post of posts) {
    if (!isPerson(post.from)) continue;
    const from = post.from;
    const handle = personName(from.address) || aliases.get(personName(from.name)) || personName(from.name);
    if (!handle) continue;
    if (!people.has(handle)) people.set(handle, { handle, name: from.name || handle, kind: 'human', aliases: new Set([handle]) });
    const row = people.get(handle);
    for (const value of [from.address, from.name]) {
      const alias = personName(value);
      if (!alias) continue;
      // A shared display name cannot identify either of two explicit handles.
      if (alias === handle || (!humanHandles.has(alias) && !(addressedNames.get(alias)?.size > 1))) {
        row.aliases.add(alias);
        if (!aliases.has(alias)) aliases.set(alias, handle);
      }
    }
  }
  for (const post of posts) {
    const from = post.from;
    if (from?.kind !== 'agent') continue;
    const operator = personName(from.operator);
    if (operator) {
      const handle = aliases.get(operator) || operator;
      if (!people.has(handle)) people.set(handle, { handle, name: String(from.operator).trim().replace(/^@+/, '').trim(),
        kind: 'human', aliases: new Set([handle]) });
      people.get(handle).aliases.add(operator);
    } else {
      const handle = personName(from.address || from.name);
      if (handle && (!operatedBots.has(handle) || closers.has(post)) && !bots.has(handle)) {
        bots.set(handle, { handle, name: from.name || handle, kind: 'agent' });
      }
    }
  }
  const groups = [...people.values(), ...bots.values()].map(row => {
    const owns = post => row.kind === 'human'
      ? isPerson(post.from)
        ? (post.from.address ? personName(post.from.address) === row.handle : row.aliases.has(personName(post.from.name)))
        : post.from?.kind === 'agent' && row.aliases.has(personName(post.from.operator))
      : post.from?.kind === 'agent' && !personName(post.from.operator) && personName(post.from.address || post.from.name) === row.handle &&
        // A close without an operator keeps its own row, even if older posts
        // name an operator. Do not revive that bot's old standalone reports.
        (!operatedBots.has(row.handle) || closers.has(post));
    const owned = posts.filter(owns);
    return { row, owns, owned, key: row.kind + ':' + row.handle };
  });
  // A task receipt carries an address or a display name, without kind/operator.
  // Keep those namespaces separate and omit ambiguous attribution rather than
  // crediting two rows for a single claimant with a shared name.
  const addresses = new Map(), names = new Map();
  const remember = (map, value, group) => {
    const identity = personName(value);
    if (!identity) return;
    if (!map.has(identity)) map.set(identity, new Set());
    map.get(identity).add(group);
  };
  for (const { row, owned, key } of groups) {
    remember(addresses, row.handle, key);
    for (const { from } of owned) {
      remember(addresses, from.address, key);
      remember(names, from.name, key);
    }
  }
  const rows = [];
  for (const { row, owns, owned, key } of groups) {
    const matchesContributor = who => {
      const owners = who && (who.address ? addresses.get(personName(who.address)) : names.get(personName(who.name)));
      return owners?.size === 1 && owners.has(key);
    };
    const lent = lending(posts, owned, row.handle, owns, matchesContributor) || {};
    const closed = signedCloses.filter(({ post }) => owns(post));
    if (closed.length) {
      lent.signedClosedCards = closed.length;
      lent.signedCardSources = closed.map(({ post, task }) => ({ ...source(post), task }));
    }
    if (Object.keys(lent).length) rows.push({ handle: row.handle, name: row.name, kind: row.kind, lent });
  }
  // Cards are completed work; token reports break ties without combining units.
  const closedCount = row => (row.lent.closedCards || 0) + (row.lent.signedClosedCards || 0);
  return rows.sort((a, b) => closedCount(b) - closedCount(a) ||
    (b.lent.tokens || 0) - (a.lent.tokens || 0) || a.handle.localeCompare(b.handle));
}

/** One bounded cached batch, including older source rooms with retained evidence. */
export async function readHearthLedger({ request = fetch, now } = {}) {
  async function read(path) {
    const response = await request(path, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('The Loom could not read this ledger.');
    const data = await response.json();
    if (!data.ok || data.kvBound === false) throw new Error('The Loom could not read this ledger.');
    return { data, serverTime: Date.parse(response.headers?.get('date')) };
  }
  const { data, serverTime } = await read('/api/loom?compact=1');
  if (data.kvBound !== true || !Array.isArray(data.logs)) throw new Error('Room directory unavailable.');
  const asOf = now ?? (Number.isFinite(serverTime) ? serverTime : Date.now());
  const available = new Set(data.logs.filter(log => log.kind === 'topic').map(log => log.address));
  const rooms = LEDGER_ROOMS.filter(room => available.has(room));
  const threads = [], unavailable = [], trimmed = [];
  if (rooms.length) {
    try {
      const query = new URLSearchParams(rooms.map(room => ['room', room]));
      query.set('ledger', '1');
      const { data: result } = await read('/api/loom-hearth?' + query);
      if (!Array.isArray(result.rooms)) throw new Error('Rooms unavailable.');
      const byRoom = new Map(result.rooms.map(room => [room.address, room]));
      for (const address of rooms) {
        const thread = byRoom.get(address);
        if (thread?.state !== 'read' || !Array.isArray(thread.messages)) { unavailable.push(address); continue; }
        threads.push(thread);
        if (thread.trimmed) trimmed.push(address);
      }
    } catch { unavailable.push(...rooms); }
    if (!threads.length) throw new Error('The Loom could not read this ledger.');
  }
  return { rows: ledgerRows(threads, { now: asOf }), asOf, readRooms: threads.length,
    incomplete: data.logs.length >= 400 || unavailable.length > 0 || trimmed.length > 0,
    unavailable: unavailable.sort(), trimmed: trimmed.sort() };
}
