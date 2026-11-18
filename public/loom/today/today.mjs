const ROOM_UPDATES = '#updates';
const TASK_BOARD = '#officenoun-tasks';
const ROOMS = [ROOM_UPDATES, TASK_BOARD];
const SITE = 'https://pointcast.xyz';
const EASTERN = 'America/New_York';
const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: EASTERN, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayLabel = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN, weekday: 'long', month: 'long', day: 'numeric' });
const timeLabel = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN, hour: 'numeric', minute: '2-digit' });
const ID = /^m_[a-z0-9]{10}$/;
const LIMIT = 6;

function validRoom(feed, room) {
  return feed?.ok === true && feed.kvBound === true && feed.exists === true &&
    feed.log?.address === room && !feed.log.seed && Array.isArray(feed.messages);
}

function original(message) {
  return message && typeof message.id === 'string' && ID.test(message.id) && typeof message.at === 'string' && !message.via && !message.hidden && !message.withdrawn &&
    message.from?.kind !== 'robot' && typeof message.body === 'string';
}

function sourceLink(room, id) {
  const url = new URL('/loom', SITE);
  url.searchParams.set('to', room);
  url.hash = id;
  return url.href;
}

const lines = (body) => body.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const cleanLine = (line) => line?.replace(/^(?:[-*]|\d+\.)\s+/, '') ?? '';
const brief = (text, limit) => {
  const clean = cleanLine(text).replace(/\s+/g, ' ').trim();
  return clean.length > limit ? clean.slice(0, limit - 1).replace(/\s+\S*$/, '') + '…' : clean;
};
const wholeSentence = (text) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;

function noteCopy(parts) {
  if (/^ROOM NOTE\b/i.test(parts[0])) return null;
  const headline = /^UPDATE\s*[:·—]/i.test(parts[0]) && parts.length > 1 ? 1 : 0;
  return { title: brief(parts[headline], 130), detail: brief(parts[headline + 1], 180) };
}

function releaseCopy(parts, message, byId) {
  if (String(message.from?.name ?? '').toLowerCase().replaceAll('’', "'") !== "loom desk (mike's agent)") return null;
  const first = parts[0];
  const heading = /^(?:SHIPPED|PUBLISHED)(?:\s*[:·—]\s*|\s+(?=(?:OFF-|PR\s*|#)\d+\b))/i;
  if (!heading.test(first)) {
    const live = wholeSentence(first);
    return /\bis (?:now )?live[.!]?$/i.test(live) && !/^(?:no|none|not|nothing)\b/i.test(live)
      ? { title: brief(live, 130) }
      : null;
  }
  const parent = byId.get(message.parent);
  const related = parent && /^\s*OFF-\d+\s*·\s*([^·\n]+)/i.exec(parent.body)?.[1];
  return { title: brief(related || first.replace(heading, '').trim() || parts[1], 130), detail: related ? brief(first, 180) : '' };
}

export function todayChanges(feeds, now = new Date()) {
  const date = dateKey.format(now);
  const unavailable = [];
  const trimmed = [];
  const changes = [];
  for (const room of ROOMS) {
    const feed = feeds[room];
    if (!validRoom(feed, room)) {
      unavailable.push(room);
      continue;
    }
    if (feed.log.trimmedBefore != null) trimmed.push(room);
    const messages = feed.messages.filter(original);
    const byId = new Map(messages.map(message => [message.id, message]));
    for (const message of byId.values()) {
      const at = Date.parse(message.at);
      if (!Number.isFinite(at) || at > Number(now) || dateKey.format(at) !== date) continue;
      const parts = lines(message.body);
      if (!parts.length) continue;
      const copy = room === ROOM_UPDATES
        ? (!message.parent && noteCopy(parts))
        : releaseCopy(parts, message, byId);
      if (!copy?.title) continue;
      changes.push({
        ...copy,
        at,
        time: timeLabel.format(at),
        source: room === ROOM_UPDATES ? 'Loom updates' : 'Task board',
        sender: message.from?.name || 'Unnamed sender',
        href: sourceLink(room, message.id),
      });
    }
  }
  changes.sort((a, b) => b.at - a.at);
  return {
    date: dayLabel.format(now),
    items: changes.slice(0, LIMIT),
    more: changes.length > LIMIT,
    unavailable,
    trimmed,
  };
}

export async function loadToday(request = fetch) {
  const responses = await Promise.allSettled(ROOMS.map(async (room) => {
    const response = await request('/api/loom?' + new URLSearchParams({ to: room }), {
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout?.(8000),
    });
    if (!response.ok) throw new Error('Unable to read Loom room');
    return response.json();
  }));
  return todayChanges(Object.fromEntries(ROOMS.map((room, index) => [room, responses[index].value])));
}
