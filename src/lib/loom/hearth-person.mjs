import { isCollator, isPerson } from './hearth.mjs';
import { HEARTH_BATCH, HEARTH_DAY } from './hearth-day.mjs';

export const personName = value => String(value ?? '').trim().replace(/^@+/, '').trim().toLowerCase();
const time = value => Date.parse(value) || 0;
const newest = (a, b) => time(b.at) - time(a.at) || String(a.id).localeCompare(String(b.id));
const source = post => ({ at: post.at, room: post.room, key: post.key, id: post.id });

/** The model written on the post identifies a lab; names and operators do not. */
export function modelLab(model) {
  const value = String(model ?? '').trim().toLowerCase();
  if (/^(?:openai(?:\b|\/)|gpt(?:-|\b)|chatgpt\b|o[134](?:-|\b))/.test(value)) return 'OpenAI';
  if (/^(?:anthropic(?:\b|\/)|claude(?:-|\b))/.test(value)) return 'Anthropic';
  if (/^(?:google(?:\b|\/)|gemini(?:-|\b)|gemma(?:-|\b))/.test(value)) return 'Google';
  if (/^(?:xai(?:\b|\/)|grok(?:-|\b))/.test(value)) return 'xAI';
  if (/^deepseek(?:-|\b|\/)/.test(value)) return 'DeepSeek';
  if (/^(?:mistral(?:-|\b|\/)|mixtral(?:-|\b))/.test(value)) return 'Mistral';
  if (/^(?:meta(?:\b|\/)|llama(?:-|\b))/.test(value)) return 'Meta';
  return null;
}

function ownPost(post, name) {
  return isPerson(post.from)
    ? personName(post.from.name) === name || personName(post.from.address) === name
    : post.from?.kind === 'agent' && personName(post.from.operator) === name;
}

function visiblePost(message, now) {
  const at = time(message?.at);
  return message && !message.hidden && !message.withdrawn && !message.via &&
    !isCollator(message.from) && at > 0 && at <= now;
}

/** Compact one folded thread for the existing read-only Hearth batch endpoint. */
export function personThread(messages = [], { name, room, key, trimmed = false, now = Date.now() } = {}) {
  const normalized = personName(name);
  const visible = messages.filter(message => visiblePost(message, now)).sort(newest);
  const selected = new Map(), bots = new Set(), models = new Set();
  let people = 0;
  for (const message of visible) {
    const mine = normalized && ownPost(message, normalized);
    if (mine && isPerson(message.from)) {
      if (++people <= 3 || room === '#efficiency') selected.set(message.id, message);
    } else if (mine && message.from.kind === 'agent') {
      const identity = personName(message.from.address || message.from.name);
      if (room === '#efficiency') selected.set(message.id, message);
      else if (!bots.has(identity) || (message.from.model && !models.has(identity))) {
        selected.set(message.id, { id: message.id, at: message.at, from: message.from });
      }
      bots.add(identity);
      if (message.from.model) models.add(identity);
    }
    if (['#officenoun-tasks', '#ledger'].includes(room) && message.taskStatus?.reported) {
      selected.set(message.id, { ...(selected.get(message.id) || { id: message.id, at: message.at, from: message.from }),
        taskStatus: message.taskStatus });
    }
  }
  return { address: room, state: 'read', key, messages: [...selected.values()], trimmed: !!trimmed };
}

// These are latest individual reports, never a sum of the room's overlapping
// estimates and rollups. A range or a missing actual amount stays unavailable.
function reportedTokens(body) {
  const text = String(body ?? '');
  if (/\b(?:roll[ -]?up|cumulative)\b|\b(?:[2-9]\d*|1\d+|two|three|four|five|six|seven|eight|nine|ten|several|multiple|all)\s+(?:logged\s+)?sprints?\b/i.test(text)) return null;
  const amount = '(?:about\\s+|roughly\\s+|[~≈]\\s*)?(\\d[\\d,]*(?:\\.\\d+)?)\\s*([km]?)';
  const actual = new RegExp('\\bactual(?:ly)?\\s*(?:tokens)?\\s*[:=]?\\s*' + amount + '\\s*tokens\\b', 'i');
  const arrow = new RegExp('(?:\\d[\\d,.]*\\s*[km]?\\s*(?:[-–]\\s*\\d[\\d,.]*\\s*[km]?)?)\\s*(?:tokens\\s*)?(?:→|->)\\s*(?:actual\\s*)?' + amount + '(?:\\s*(tokens))?(?![\\w.]|\\s*(?:[-–—]|to)\\s*\\d)', 'i');
  const match = text.match(actual) || text.match(arrow);
  if (!match) return null;
  // An unqualified m can mean minutes. Only k amounts or an explicit token
  // unit (or the room's uppercase M convention) are usable here.
  if (!/tokens\b/i.test(match[0]) && match[2].toLowerCase() !== 'k' && match[2] !== 'M') return null;
  const tokens = Number(match[1].replace(/,/g, '')) * ({ k: 1000, m: 1000000 }[match[2].toLowerCase()] || 1);
  if (!Number.isSafeInteger(tokens) || tokens <= 0) return null;
  const context = match[0].split(/→|->/).at(-1) + text.slice(match.index + match[0].length, match.index + match[0].length + 30);
  return { tokens, approximate: /\b(?:about|roughly|guess|modeled)\b|[~≈]/i.test(context) };
}

function lending(posts, owned, name) {
  const tokenPost = posts.find(post => post.room === '#efficiency' && ownPost(post, name) && reportedTokens(post.body));
  const lent = tokenPost ? { ...reportedTokens(tokenPost.body), tokenSource: source(tokenPost) } : {};
  const identities = new Set([name]);
  for (const post of owned) {
    identities.add(personName(post.from.name));
    if (post.from.address) identities.add(personName(post.from.address));
  }
  const belongs = who => !!who && (who.address
    ? identities.has(personName(who.address)) : identities.has(personName(who.name)));
  const tasks = new Map(), cards = new Map();
  for (const post of posts) {
    if (!['#officenoun-tasks', '#ledger'].includes(post.room)) continue;
    const status = post.taskStatus;
    if (!status?.reported || !status.task) continue;
    const stamp = time(status.source?.at) || time(post.editedAt || post.at);
    const previous = tasks.get(status.task);
    if (!previous || stamp > previous.stamp || (stamp === previous.stamp && status.status !== 'done')) {
      tasks.set(status.task, { post, stamp });
    }
  }
  for (const { post } of tasks.values()) {
    const status = post.taskStatus;
    if (status.status !== 'done') continue;
    const contributors = status.parts?.length ? status.parts.map(part => part.claimedBy || part.source?.by)
      : [status.claimedBy || status.by];
    if (contributors.some(belongs)) cards.set(status.task, { ...source(post), task: status.task });
  }
  if (cards.size) { lent.closedCards = cards.size; lent.cardSources = [...cards.values()]; }
  return Object.keys(lent).length ? lent : null;
}

/** Build one person's card from current folded room reads, without storage writes. */
export function personCard(threads = [], { name, now = Date.now() } = {}) {
  const normalizedName = personName(name);
  const posts = [], seen = new Set();
  for (const thread of threads) {
    const room = thread.log?.address || thread.address;
    const key = thread.log?.key || thread.key;
    if (!room) continue;
    for (const message of thread.messages ?? []) {
      if (!visiblePost(message, now)) continue;
      const receipt = `${key || room}:${message.id}`;
      if (seen.has(receipt)) continue;
      seen.add(receipt);
      posts.push({ ...message, room, key });
    }
  }
  posts.sort(newest);
  const owned = normalizedName ? posts.filter(post => ownPost(post, normalizedName)) : [];
  const humanPosts = owned.filter(post => isPerson(post.from));
  const bots = new Map();
  for (const post of owned) {
    if (post.from.kind !== 'agent') continue;
    const identity = personName(post.from.address || post.from.name);
    if (!identity) continue;
    let bot = bots.get(identity);
    if (!bot) {
      bot = { name: post.from.name, address: post.from.address || null, model: post.from.model || null,
        lab: modelLab(post.from.model), rooms: [], lastSeen: source(post) };
      bots.set(identity, bot);
    }
    if (!bot.model && post.from.model) { bot.model = post.from.model; bot.lab = modelLab(post.from.model); }
    if (time(post.at) > now - 7 * HEARTH_DAY && !bot.rooms.includes(post.room)) bot.rooms.push(post.room);
  }
  return {
    name: humanPosts[0]?.from.name || String(name ?? '').trim().replace(/^@+/, '').trim(), normalizedName,
    lastSeen: humanPosts[0] ? source(humanPosts[0]) : null,
    posts: humanPosts.slice(0, 3), bots: [...bots.values()],
    lent: normalizedName ? lending(posts, owned, normalizedName) : null,
  };
}

async function readJson(request, path) {
  const response = await request(path, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('The Loom could not read this card.');
  const data = await response.json();
  if (!data.ok || data.kvBound === false) throw new Error('The Loom could not read this card.');
  return { data, serverTime: Date.parse(response.headers?.get('date')) };
}

/** Reuse Hearth's public directory and bounded, read-only room batches. */
export async function readHearthPerson(name, { request = fetch, now } = {}) {
  if (!personName(name) || String(name).length > 120) throw new Error('Choose a person to read their card.');
  const { data, serverTime } = await readJson(request, '/api/loom?compact=1');
  if (data.kvBound !== true || !Array.isArray(data.logs)) throw new Error('Room directory unavailable.');
  const asOf = now ?? (Number.isFinite(serverTime) ? serverTime : Date.now());
  const directory = [...new Map(data.logs.filter(log => ['topic', 'handle'].includes(log.kind) && log.address)
    .map(log => [log.address, log])).values()];
  const rooms = directory.slice(0, 400), threads = [], unavailable = [], trimmed = [];
  let next = 0;
  async function readRooms() {
    while (next < rooms.length) {
      const batch = rooms.slice(next, next + HEARTH_BATCH);
      next += batch.length;
      try {
        const query = new URLSearchParams(batch.map(room => ['room', room.address]));
        query.set('person', name);
        const { data: result } = await readJson(request, '/api/loom-hearth?' + query);
        if (!Array.isArray(result.rooms)) throw new Error('Rooms unavailable.');
        const byRoom = new Map(result.rooms.map(room => [room.address, room]));
        for (const room of batch) {
          const thread = byRoom.get(room.address);
          if (thread?.state !== 'read' || !Array.isArray(thread.messages)) { unavailable.push(room.address); continue; }
          threads.push(thread);
          if (thread.trimmed) trimmed.push(room.address);
        }
      } catch { unavailable.push(...batch.map(room => room.address)); }
    }
  }
  await Promise.all([readRooms(), readRooms()]);
  if (rooms.length && !threads.length) throw new Error('The Loom could not read this card.');
  return { ...personCard(threads, { name, now: asOf }), asOf, readRooms: threads.length,
    incomplete: directory.length >= 400 || unavailable.length > 0 || trimmed.length > 0,
    unavailable: unavailable.sort(), trimmed: trimmed.sort() };
}
