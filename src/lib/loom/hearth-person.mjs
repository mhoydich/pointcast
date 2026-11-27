import { isPerson } from './hearth.mjs';
import { HEARTH_BATCH, HEARTH_DAY } from './hearth-day.mjs';

import { personName, ownPost, visiblePost, newest, source, lending, contributionPosts } from './hearth-contributions.mjs';
export { personName } from './hearth-contributions.mjs';
const time = value => Date.parse(value) || 0;

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

/** Build one person's card from current folded room reads, without storage writes. */
export function personCard(threads = [], { name, now = Date.now() } = {}) {
  const normalizedName = personName(name);
  const posts = contributionPosts(threads, now);
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
  // updatedAt is already in the compact directory. Keep unknown dates rather
  // than silently dropping a room whose activity cannot be established.
  const recent = directory.filter(room => !(Date.parse(room.updatedAt) < asOf - 7 * HEARTH_DAY));
  // Stable batches keep cache keys useful when directory activity order changes.
  const rooms = recent.slice(0, 400).sort((a, b) => a.address.localeCompare(b.address));
  const threads = [], unavailable = [], trimmed = [];
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
    incomplete: directory.length >= 400 || recent.length < directory.length || unavailable.length > 0 || trimmed.length > 0,
    unavailable: unavailable.sort(), trimmed: trimmed.sort() };
}
