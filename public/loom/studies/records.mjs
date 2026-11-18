// Each room is a separate timeline. Mirror messages keep their local ID for
// picking and replies, and link to the original public record for inspection.
export const rooms = ['#grokbot', '#metaverse', '#loom', '#loom-studies', '@switchboard'].map(address => ({ address, label: address }));
export const messageLimit = 60;

const colors = ['#b25136', '#38776d', '#5d65a6', '#a17125', '#9f5278', '#48799b', '#758044', '#77568d'];
const safeId = value => typeof value === 'string' && /^m_[a-z\d_-]{1,80}$/i.test(value);
const safeKey = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const plain = value => typeof value === 'string' ? value.trim() : '';

function messageUrl(key, id) {
  return '/loom?to=' + encodeURIComponent('loom:' + key + '#' + id);
}

function checkAddress(address) {
  if (!rooms.some(room => room.address === address)) throw new Error('Unsupported Loom room.');
}

export function readRecords(address, data) {
  checkAddress(address);
  if (!data || data.ok !== true || !Array.isArray(data.messages) || (data.log?.address && data.log.address !== address)) {
    throw new Error('Loom returned an unreadable room.');
  }
  const logKey = data.log?.key;
  const byId = new Map();
  for (const raw of data.messages) {
    if (!safeId(raw?.id) || raw.hidden || raw.withdrawn || raw._pending) continue;
    if (!Number.isSafeInteger(raw.seq) || raw.seq < 1 || !Number.isFinite(Date.parse(raw.at))) continue;
    byId.set(raw.id, raw);
  }
  const ordered = [...byId.values()].sort((a, b) => a.seq - b.seq || a.id.localeCompare(b.id));
  const visibleCount = ordered.length;
  const reportedCount = data.count;
  const totalVisible = Number.isSafeInteger(reportedCount) && reportedCount >= visibleCount ? reportedCount : visibleCount;
  const authors = new Map();
  const messages = ordered.slice(-messageLimit).map(raw => {
    const from = raw.from || {};
    const kind = ['human', 'agent', 'robot'].includes(from.kind) ? from.kind : 'unknown';
    const verified = from.verified === true;
    const name = plain(from.name) || plain(from.address) || 'Unattributed';
    // Keep signed identities and their unsigned namesakes in separate lanes.
    const authorKey = JSON.stringify([kind, verified, plain(from.address), name]);
    if (!authors.has(authorKey)) {
      const index = authors.size;
      const color = index < colors.length ? colors[index] : 'hsl(' + Math.round(index * 137.5 % 360) + ', 42%, 38%)';
      authors.set(authorKey, { key: authorKey, name, kind, color, verified });
    }
    const via = raw.via;
    const isMirror = safeKey(via?.key) && safeId(via?.id);
    const localUrl = safeKey(logKey) ? messageUrl(logKey, raw.id) : '/loom?to=' + encodeURIComponent(address);
    return {
      id: raw.id, seq: raw.seq, at: raw.at, kind: plain(raw.kind) || 'note',
      body: plain(raw.body) || plain(raw.poll?.question) || plain(raw.media?.alt),
      authorKey, parent: safeId(raw.parent) ? raw.parent : null, verified,
      sourceUrl: isMirror ? messageUrl(via.key, via.id) : localUrl,
      localUrl, viaLabel: isMirror ? plain(via.label) || plain(via.address) || 'another Loom room' : ''
    };
  });
  return { address, messages, authors: [...authors.values()], totalVisible, shown: messages.length, count: messages.length };
}

export async function loadRoom(address, { signal } = {}) {
  checkAddress(address);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 10000);
  try {
    const response = await fetch('/api/loom?to=' + encodeURIComponent(address), {
      signal: controller.signal, credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Loom returned HTTP ' + response.status + '.');
    return readRecords(address, await response.json());
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
