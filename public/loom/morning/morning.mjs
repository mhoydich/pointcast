export const BOARD = '#officenoun-tasks';
const SITE = 'https://pointcast.xyz';
const DAY = 24 * 60 * 60 * 1000;
const HOUR = DAY / 24;
const MAX_BRIEF_ROWS = 2;
const MAX_DECISIONS = 3;
const east = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const SHIPPED = /^(?:SHIPPED|PUBLISHED)(?:\s*[:·—]\s*|\s+(?=(?:OFF-\d+|PR\s*\d+|#\d+)\b))/i;
const DECISION = /^NEEDS\s+@?MIKE\s*[·:—]\s*(.+)/i;
const MESSAGE_ID = /^m_[a-z0-9]{10}$/;

function easternWallTime(instant) {
  const parts = Object.fromEntries(east.formatToParts(instant).map(({ type, value }) => [type, Number(value)]));
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

// These evening and morning clock times occur exactly once, including on DST weekends.
function easternInstant(wallTime) {
  const candidate = wallTime - (easternWallTime(wallTime) - wallTime);
  return candidate + wallTime - easternWallTime(candidate);
}

export function editionWindow(now = new Date()) {
  const wallTime = easternWallTime(now);
  const midnight = Math.floor(wallTime / DAY) * DAY;
  const cardDay = wallTime < midnight + 7 * HOUR ? midnight - DAY : midnight;
  return {
    from: easternInstant(cardDay - 5 * HOUR),
    until: easternInstant(cardDay + 7 * HOUR),
    next: easternInstant(cardDay + DAY + 7 * HOUR),
  };
}

export function boardLink(id) {
  const url = new URL('/loom', SITE);
  url.searchParams.set('to', BOARD);
  if (MESSAGE_ID.test(id ?? '')) url.hash = id;
  return url.href;
}

export async function readBoard(location, request = fetch) {
  const url = new URL('/api/loom', location.hostname === 'rawcdn.githack.com' ? SITE : location.origin);
  url.searchParams.set('to', BOARD);
  const response = await request(url, {
    credentials: 'omit',
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Board read failed');
  return response.json();
}

const firstLine = (body) => typeof body === 'string' ? (body.split(/\r?\n/).find(line => line.trim()) ?? '').trim() : '';
const taskTitle = (body) => firstLine(body).split(/\s+·\s+(?=posted by\b)/i)[0];
const timestamp = (message) => Date.parse(message.editedAt ?? message.at);
const newest = (a, b) => b.at - a.at || b.seq - a.seq;
const fromName = (from) => String(from?.name ?? '').trim().toLowerCase();
const isMike = (from) => fromName(from).replace(/^@/, '') === 'mike' || String(from?.address ?? '').toLowerCase() === '@mike';

function blockedParts(body, parts) {
  const labels = new Map([...String(body ?? '').matchAll(/^\s*(?:\*\*)?(S\d{1,2}|[A-Z]|\d{1,2})(?:\*\*)?\s*[·.)]\s+([^.!?\n]+)/gm)]
    .map(([, tag, label]) => [tag, label.trim()]));
  return parts.map(({ part }) => labels.has(part) ? `${part} · ${labels.get(part)}` : part).join(' / ');
}

function boardRows(messages, window) {
  const byId = new Map(messages.map(message => [message.id, message]));
  const children = new Map();
  for (const message of messages) {
    if (!message.parent) continue;
    if (!children.has(message.parent)) children.set(message.parent, []);
    children.get(message.parent).push(message);
  }

  function cleared(ask) {
    const queue = [...(children.get(ask.id) ?? [])];
    const seen = new Set([ask.id]);
    while (queue.length) {
      const reply = queue.pop();
      if (seen.has(reply.id)) continue;
      seen.add(reply.id);
      if (/^CLEARED\b/i.test(firstLine(reply.body)) &&
          (isMike(reply.from) || (fromName(ask.from) && fromName(reply.from) === fromName(ask.from)))) return true;
      queue.push(...(children.get(reply.id) ?? []));
    }
    return false;
  }

  const shipped = [];
  const stuck = [];
  const decisions = [];
  for (const message of messages) {
    const text = firstLine(message.body);
    const at = timestamp(message);
    const row = { href: boardLink(message.id), at, seq: message.seq ?? 0 };
    if (at >= window.from && at < window.until && SHIPPED.test(text)) {
      const receipt = text.replace(SHIPPED, '').trim() || text;
      shipped.push({
        ...row,
        title: taskTitle(byId.get(message.parent)?.body) || receipt,
        detail: message.parent && byId.has(message.parent) ? receipt : '',
      });
    }

    const status = message.taskStatus;
    if (!message.parent && status?.reported === true && status.status === 'open' && status.blocked === true) {
      const parts = Array.isArray(status.parts) ? status.parts.filter(part => part?.blocked === true && part.status === 'open') : [];
      const receipts = (parts.length ? parts.map(part => part.source) : [status.source])
        .map(source => byId.get(source?.id)).filter(Boolean).sort((a, b) => timestamp(b) - timestamp(a));
      const source = receipts[0] ?? message;
      stuck.push({
        ...row,
        at: timestamp(source),
        href: boardLink(source.id),
        title: taskTitle(message.body),
        detail: parts.length ? blockedParts(message.body, parts) : 'Marked blocked',
      });
    }

    const ask = text.match(DECISION)?.[1].split(/\s+·\s+/)[0].trim();
    if (ask && !isMike(message.from) && !cleared(message)) decisions.push({ ...row, title: ask });
  }
  return {
    shipped: shipped.sort(newest),
    stuck: stuck.sort(newest),
    decisions: decisions.sort(newest),
  };
}

export function morningCard(board, now = new Date()) {
  if (board?.ok !== true || board?.kvBound !== true || board?.exists !== true ||
      board.log?.address !== BOARD || board.log.seed || !Array.isArray(board.messages)) {
    throw new Error('Live task board unavailable');
  }
  const window = editionWindow(now);
  const messages = board.messages.filter(message => message && MESSAGE_ID.test(message.id) &&
    !message.hidden && !message.withdrawn && !message.via &&
    message.from?.kind !== 'robot' && fromName(message.from) !== 'collator' &&
    timestamp(message) <= Number(now));
  const rows = boardRows(messages, window);
  return {
    window,
    trimmed: board.log.trimmedBefore != null,
    shipped: rows.shipped.slice(0, MAX_BRIEF_ROWS),
    stuck: rows.stuck.slice(0, MAX_BRIEF_ROWS),
    decisions: rows.decisions.slice(0, MAX_DECISIONS),
    more: {
      shipped: Math.max(0, rows.shipped.length - MAX_BRIEF_ROWS),
      stuck: Math.max(0, rows.stuck.length - MAX_BRIEF_ROWS),
      decisions: Math.max(0, rows.decisions.length - MAX_DECISIONS),
    },
  };
}
