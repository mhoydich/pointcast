/** Pure observation adapter. Posts are neither execution nor approval evidence. */
const SCHEMA = 'pointcast.office-data/v1';
const MESSAGE_ID = /^m_[a-z0-9]{10}$/;
const ROOM_KEY = /^[a-f0-9]{24}$/;
const HANDLE = /^@[a-z0-9][a-z0-9_-]{0,63}$/;
const KINDS = new Set(['note', 'question', 'claim', 'answer', 'image', 'poll', 'link']);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
function time(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return NaN;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value.replace(/(?<=\d)Z$/, value.includes('.') ? 'Z' : '.000Z') ? parsed : NaN;
}
function provenance(sourceUrl, room) {
  try {
    const url = new URL(sourceUrl);
    const to = url.searchParams.get('to');
    return url.origin === 'https://pointcast.xyz' && !url.username && !url.password &&
      ['/api/loom', '/loom'].includes(url.pathname) &&
      (to === room.address || new RegExp(`^loom:${room.key}#m_[a-z0-9]{10}$`).test(to));
  } catch { return false; }
}

export function normalizeLoomEvents({ rooms, now = Date.now(), maxAgeMs = 120000 } = {}) {
  const result = { schema: SCHEMA, state: 'idle', observedAt: null, sourceUrl: null,
    data: { events: [], unresolvedReplies: [] }, errors: [] };
  const errors = new Set();
  let failed = false, stale = false;
  const reject = (code, isStale = false) => { errors.add(code); if (isStale) stale = true; else failed = true; };
  if (!Array.isArray(rooms) || rooms.length > 64 || !Number.isFinite(now) ||
      Math.abs(now) > 8640000000000000 || !Number.isFinite(maxAgeMs) || maxAgeMs < 0) {
    return { ...result, state: 'error', errors: ['invalid_input'] };
  }
  const records = new Map(), conflicted = new Set(), sources = new Set(), observations = [];
  for (const feed of rooms) {
    if (!object(feed) || feed.schema !== SCHEMA) { reject('invalid_feed'); continue; }
    if (feed.state === 'stale') { reject('stale_feed', true); continue; }
    if (!['ok', 'idle'].includes(feed.state)) { reject('failed_feed'); continue; }
    const observed = time(feed.observedAt);
    if (!Number.isFinite(observed) || observed > now) { reject('invalid_observation'); continue; }
    if (now - observed > maxAgeMs) { reject('stale_feed', true); continue; }
    const room = feed.data?.room, messages = feed.data?.messages;
    if (!object(room) || typeof room.key !== 'string' || !ROOM_KEY.test(room.key) || typeof room.address !== 'string' ||
        !provenance(feed.sourceUrl, room) || !Array.isArray(messages) || messages.length > 2000 ||
        !Array.isArray(feed.errors) || feed.errors.length || (feed.state === 'idle' && messages.length)) {
      reject('invalid_feed'); continue;
    }
    observations.push(observed); sources.add(feed.sourceUrl);
    for (const message of messages) {
      if (!object(message)) { reject('invalid_message'); continue; }
      // Ripple records and system notices are not independent user posts.
      if (message.via != null || message.echo === true || message.hidden === true ||
          message.from?.address === '@collator' || message.from?.kind === 'robot' ||
          message.id?.startsWith?.('m_seed')) continue;
      const at = time(message.at);
      if (typeof message.id !== 'string' || !MESSAGE_ID.test(message.id) || !KINDS.has(message.kind) || !object(message.from) ||
          !['human', 'agent'].includes(message.from.kind) || !Number.isFinite(at) || at > observed || at > now ||
          (message.parent != null && (typeof message.parent !== 'string' || !MESSAGE_ID.test(message.parent)))) { reject('invalid_message'); continue; }
      // Older validated messages remain ancestry context, never fresh activity.
      if (now - at > maxAgeMs) stale = true;
      const id = `${room.key}#${message.id}`;
      const event = { id, type: message.parent == null ? 'post' : 'reply', roomKey: room.key,
        messageId: message.id, handle: typeof message.from.address === 'string' && HANDLE.test(message.from.address) ? message.from.address : null,
        parentId: message.parent ?? null, at: new Date(at).toISOString(),
        sourceUrl: `https://pointcast.xyz/loom?to=${encodeURIComponent(`loom:${room.key}#${message.id}`)}` };
      const prior = records.get(id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(event)) { conflicted.add(id); reject('conflicting_message'); }
      else records.set(id, event);
    }
  }
  for (const id of conflicted) records.delete(id);
  // Resolve only chains reaching an observed root in the same source room.
  function resolved(event) {
    const visited = new Set();
    while (event.parentId !== null) {
      if (visited.has(event.id)) return false;
      visited.add(event.id);
      const parent = records.get(`${event.roomKey}#${event.parentId}`);
      if (!parent || parent.at > event.at) return false;
      event = parent;
    }
    return true;
  }
  for (const event of records.values()) {
    if (now - Date.parse(event.at) > maxAgeMs) continue;
    (resolved(event) ? result.data.events : result.data.unresolvedReplies).push(event);
  }
  const order = (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id);
  result.data.events.sort(order); result.data.unresolvedReplies.sort(order);
  result.observedAt = observations.length ? new Date(Math.min(...observations)).toISOString() : null;
  result.sourceUrl = sources.size === 1 ? [...sources][0] : null;
  // Degraded feeds remain visible as degraded even when another room succeeded.
  result.state = failed ? 'error' : errors.has('stale_feed') ? 'stale' :
    result.data.events.length ? 'ok' : stale ? 'stale' : 'idle';
  result.errors = [...errors];
  return result;
}
