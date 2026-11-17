const SITE = 'https://pointcast.xyz';
const SPEC = 'pointcast.loom/v1';
const MESSAGE_ID = 'm_[0-9a-z]{6,24}';
const REPLY = new RegExp(`^loom:([0-9a-f]{24})#(${MESSAGE_ID})$`);
const PULL = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/[1-9]\d*\b/gi;
const PR_STATUS = /(?:^|[.!?]\s+)(BLOCKED(?:\s+for release|\s*\/[^:]*)?|(?:READY\s*\/\s*)?SHIPPED|CLEARED|CLOSED|UNBLOCKED|MERGED)\s*:\s*(.*)$/i;
const CLOSED_PR = /(?:^|[.!?]\s+)closed\s+(?:superseded\s+)?(?:pr\s*)?#?([1-9]\d*)\b/gi;
const POINTCAST_PULL = 'https://github.com/mhoydich/pointcast/pull/';
export const OWNER = 'mike';
export const BOARD = '#officenoun-tasks';
export const MAX_REPLY = 500;

export const threadUrl = (target) => `${SITE}/loom?to=${encodeURIComponent(target)}`;

export function endpoints(location) {
  const sameOrigin = location.origin === SITE || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  return { api: sameOrigin ? '/api/loom' : `${SITE}/api/loom`, canPost: sameOrigin };
}

function excerpt(value, max = 280) {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function inbox(data) {
  if (data?.ok !== true || data.spec !== SPEC || data.owner !== `@${OWNER}`) throw new Error('inbox_unavailable');
  const rows = (list) => {
    if (!Array.isArray(list)) return null;
    const seen = new Set();
    return list.flatMap((item) => {
      const target = item?.link;
      const reply = typeof target === 'string' ? REPLY.exec(target) : null;
      const text = excerpt(item?.snippet);
      if (!reply || reply[2] !== item.id || !text || seen.has(target)) return [];
      seen.add(target);
      return [{ target, text, by: excerpt(item.from?.name, 80), room: excerpt(item.label, 80) }];
    });
  };
  return { gates: rows(data.piles?.needsYes), replies: rows(data.activity?.replies) };
}

const pullUrls = (line) => [...new Set((line.match(PULL) ?? []).map((url) => url.toLowerCase()))];

function blockedUrls(line) {
  const urls = pullUrls(line);
  if (urls.length < 2) return urls;
  // A report may link another PR for context. When more than one is linked,
  // keep only an explicitly held PR and only if its number identifies one link.
  const held = new Set([...line.matchAll(/(?:^|[.!?;]\s+)hold\s+(?:release\s+of\s+)?(?:pr\s*)?#?([1-9]\d*)\b/gi)].map((match) => match[1]));
  return [...held].flatMap((number) => {
    const matches = urls.filter((url) => url.endsWith(`/pull/${number}`));
    return matches.length === 1 ? matches : [];
  });
}

export function blockedPulls(data) {
  if (data?.ok !== true || data.spec !== SPEC || data.kvBound === false || data.log?.address !== BOARD ||
      !/^[0-9a-f]{24}$/.test(data.log?.key) || !Array.isArray(data.messages)) throw new Error('board_unavailable');
  const reports = new Map();
  const current = new Map(data.messages.map((message) => [message?.id, message]));
  const report = (message, text, urls, blocked, at) => {
    const target = `loom:${data.log.key}#${message.id}`;
    if (!REPLY.test(target) || !Number.isFinite(at)) return;
    for (const pr of urls) {
      const previous = reports.get(pr);
      if (previous && (previous.at > at || (previous.at === at && previous.seq > message.seq))) continue;
      reports.set(pr, { target, text, by: excerpt(message.from?.name, 80), at, seq: message.seq, blocked });
    }
  };

  for (const message of data.messages) {
    if (!message || typeof message.body !== 'string' || message.via || message.hidden || message.withdrawn || message.from?.kind === 'robot') continue;
    const at = Date.parse(message.editedAt ?? message.at);
    // Board status updates can mention shipped and blocked work in one message.
    // Only associate PRs from the same explicit status line with that status.
    for (const rawLine of message.body.split('\n')) {
      const line = rawLine.trimStart();
      const match = line.match(PR_STATUS);
      if (match) {
        const isBlocked = /^BLOCKED/i.test(match[1]);
        report(message, excerpt(match[2].replace(PULL, '')), isBlocked ? blockedUrls(match[2]) : pullUrls(match[2]), isBlocked, at);
      }
      // The PointCast board also closes its own repo's PRs by number, often
      // alongside a URL for the replacement. Keep that link out of the closure.
      const closed = [...line.matchAll(CLOSED_PR)].map((match) => `${POINTCAST_PULL}${match[1]}`);
      if (closed.length) report(message, '', closed, false, at);
    }

    // Structured task receipts can give a blocked status without a colon.
    const status = message.taskStatus;
    if (!status?.blocked) continue;
    const sources = status.parts?.length ? status.parts.filter((part) => part.blocked).map((part) => part.source) : [status.source];
    for (const source of sources) {
      const receipt = current.get(source?.id);
      if (!receipt || receipt.hidden || receipt.withdrawn || receipt.via || receipt.parent !== message.id || typeof receipt.body !== 'string') continue;
      const line = receipt.body.split('\n').find((part) => part.trim()) ?? '';
      if (!/(?:^|[·|—/])\s*BLOCKED\b/i.test(line) || PR_STATUS.test(line)) continue;
      report(receipt, excerpt(line.replace(PULL, '')), blockedUrls(line), true, Date.parse(source.at));
    }
  }

  const grouped = new Map();
  const latest = [...reports].filter(([, report]) => report.blocked).sort((a, b) => b[1].at - a[1].at || b[1].seq - a[1].seq);
  for (const [pr, entry] of latest) {
    if (!grouped.has(entry.target)) grouped.set(entry.target, { target: entry.target, by: entry.by, notes: [] });
    const { notes } = grouped.get(entry.target);
    const text = entry.text || 'Release blocker reported on the board.';
    const note = notes.find((note) => note.text === text);
    if (note) note.prs.push(pr);
    else notes.push({ text, prs: [pr] });
  }
  return [...grouped.values()];
}

export async function postReply(api, target, name, value, request = fetch) {
  const destination = typeof target === 'string' ? REPLY.exec(target) : null;
  const body = typeof value === 'string' ? value.trim() : '';
  const from = typeof name === 'string' ? name.trim() : '';
  if (!destination || !from || from.length > 40 || !body || body.length > MAX_REPLY) return { status: 'invalid' };
  try {
    const response = await request(api, {
      method: 'POST', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: target, from: { name: from, kind: 'human' }, kind: 'answer', body }),
    });
    if (response.status === 429) return { status: 'limited' };
    if (response.status >= 400 && response.status < 500) return { status: 'rejected' };
    if (response.status !== 201) return { status: 'unknown' };
    const result = await response.json();
    const address = typeof result?.address === 'string' ? REPLY.exec(result.address) : null;
    if (result?.ok !== true || result.spec !== SPEC || address?.[1] !== destination[1] ||
        result.message?.parent !== destination[2] || result.message.id !== address[2]) return { status: 'unknown' };
    return { status: 'posted', url: threadUrl(result.address) };
  } catch {
    return { status: 'unknown' };
  }
}
