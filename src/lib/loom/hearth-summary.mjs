/** A deterministic room recap. Reads folded posts only; no network or storage. */
import { asksForGoAhead, GO_AHEAD_PHRASES, isCollator, normHandle } from './for-you.mjs';
import { splitStamp } from './stamp.mjs';

const DAY = 86400000;
const SHIPPED = /^(?:DONE|SHIPPED|MERGED|RELEASE\s+RECEIPT)\b/i;
const MINE = /^MINE\b/i;
const DONE = /^DONE\b/i;
const time = m => Date.parse(m.at) || 0;
const newest = (a, b) => time(b) - time(a) || (b.seq || 0) - (a.seq || 0);
const identity = value => String(value || 'anonymous').trim().toLowerCase().replace(/\s+/g, ' ');
const sameSender = (a, b) => (a.from?.kind || 'agent') === (b.from?.kind || 'agent') &&
  (a.from?.address && b.from?.address ? identity(a.from.address) === identity(b.from.address)
    : identity(a.from?.name) === identity(b.from?.name));
const content = m => splitStamp(String(m.body || m.poll?.question || '').trim()).text
  .replace(/^\s*(?:#{1,6}\s+|[-*+]\s+)/, '').replace(/[*_]/g, '').trim();
const webUrl = value => {
  try {
    const u = new URL(String(value).replace(/[.,;!?)\]]+$/, ''));
    return /^https?:$/.test(u.protocol) ? u.href : null;
  } catch { return null; }
};
const urls = m => [...new Set([
  ...(String(m.body || '').match(/https?:\/\/[^\s<>"']+/gi) || []),
  ...(m.links || []), ...(m.cites || []),
].map(webUrl).filter(Boolean))];
const postHref = (m, log) => '/loom?to=' + encodeURIComponent(log.address || (log.key ? `loom:${log.key}` : '#loom'))
  + (m.id ? '#' + encodeURIComponent(m.id) : '');

/** Drop display syntax and machine hashes, then keep a short phrase in the author's words. */
function phrase(value, fallback) {
  const text = String(value).replace(/\[([^\]]+)\]\(https?:\/\/[^\s]+\)/g, '$1')
    .replace(/https?:\/\/[^\s<>"']+/gi, '').replace(/\b[\da-f]{7,64}\b/gi, '')
    .replace(/[#@*_`]/g, '').replace(/^\s*[·:—–-]+\s*/, '').trim()
    .split(/\n|\s+[·|]\s+|(?<=[.!?])\s+/).find(part => /[\p{L}\p{N}]/u.test(part)) || fallback;
  const short = text.replace(/\s+/g, ' ').replace(/[\s.;:·|—–-]+$/, '').trim();
  return short.length <= 88 ? short : short.slice(0, 85).replace(/\s+\S*$/, '') + '…';
}

function receipt(m) {
  const body = content(m);
  if (SHIPPED.test(body)) return true;
  // A bare PR URL cannot tell us its GitHub state. Require a reported merge,
  // in the same sentence as the link, and exclude planned or negated merges.
  return body.split(/\n|(?<=[.!?])\s+/).some(sentence =>
    /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+\b/i.test(sentence)
    && /\b(?:was|is|has been|just) merged\b|\bPR\s*#?\d+\s+merged\b/i.test(sentence)
    && !/\b(?:not|never|isn't|wasn't|hasn't|when|once|if|until|after|will|should)\b/i.test(sentence));
}

function askOwners(m) {
  const body = String(m.body || m.poll?.question || '');
  const explicit = body.trim().match(/^NEEDS\s+@?([A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)*)\b/i);
  if (explicit && normHandle(explicit[1]) !== 'your' && !/^NEEDS\s+@?[\w.-]+['’]s\s+yes\b/i.test(body.trim())) return [normHandle(explicit[1])];
  // The shared classifier still decides whether these candidates are actual
  // requests. Quoted examples, UI labels and status receipts stay excluded.
  const candidates = new Set([
    ...[...body.matchAll(/@([A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)*)/g)].map(m => normHandle(m[1])),
    ...[...body.matchAll(/(?:^|\n|[.!?]\s+)(?:(?:hi|hey|hello)\s+)?([A-Za-z][\w.-]*)\s*[,;:—–-]/gi)].map(m => normHandle(m[1])),
    ...[...body.matchAll(/\bneeds\s+([A-Za-z][\w.-]*)(?:['’]s)?\s+yes\b/gi)].map(m => normHandle(m[1])),
    ...[...body.matchAll(/,\s+([A-Za-z][\w-]*)[?.!]*(?:$|\n)/g)].map(m => normHandle(m[1])),
  ]);
  const matched = [...candidates].filter(owner => asksForGoAhead(m, GO_AHEAD_PHRASES.map(make => make(owner.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'))), owner, false));
  if (matched.length) return matched;
  // A room-wide question has the same natural-request rules as an inbox.
  return asksForGoAhead(m, GO_AHEAD_PHRASES.map(make => make('__room__')), '__room__', true) ? [''] : [];
}

function askClosed(m, owners, posts) {
  const children = new Map();
  for (const p of posts) if (p.parent) {
    if (!children.has(p.parent)) children.set(p.parent, []);
    children.get(p.parent).push(p);
  }
  const seen = new Set([m.id]), stack = [...(children.get(m.id) || [])];
  while (stack.length) {
    const reply = stack.pop();
    if (seen.has(reply.id)) continue;
    seen.add(reply.id);
    const ownerReply = owners.some(owner => owner && [reply.from?.name, reply.from?.address].some(name => normHandle(name) === owner));
    if (newest(reply, m) < 0 && (ownerReply || (sameSender(reply, m) && /^(?:CLEARED|DONE)\b/i.test(content(reply))))) return true;
    stack.push(...(children.get(reply.id) || []));
  }
  return false;
}

/** Last day of direct posts, or the newest twenty when that window is empty.
 * Lines have plain text for non-HTML readers and separately escaped link items.
 * Claims close on a later DONE by the same sender, regardless of thread nesting.
 */
export function roomSummary(messages = [], { log = {}, now = Date.now() } = {}) {
  const posts = messages.filter(m => m && !m.hidden && !m.withdrawn && !m.via && !isCollator(m.from) && time(m) <= now)
    .sort(newest);
  const day = posts.filter(m => time(m) >= now - DAY);
  const recent = day.length ? day : posts.slice(0, 20);
  const speakers = [];
  for (const m of recent) {
    if (!speakers.some(speaker => sameSender(speaker, m))) speakers.push(m);
  }
  const humans = speakers.filter(m => m.from?.kind === 'human').map(m => phrase(m.from.name || 'Someone', 'Someone'));
  const bots = speakers.length - humans.length;
  const names = [...humans, ...(bots ? [`${bots} ${bots === 1 ? 'bot' : 'bots'}`] : [])];
  const who = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names.at(-1) : names[0];
  const lines = who ? [{ kind: 'who', text: `${who} spoke.` }] : [];
  const shipped = recent.filter(receipt).slice(0, 2).map(m => ({
    text: phrase(content(m).replace(SHIPPED, ''), 'Work completed'),
    href: urls(m)[0] || postHref(m, log),
  }));
  const open = recent.filter(m => {
    if (MINE.test(content(m))) return !posts.some(p => newest(p, m) < 0 && sameSender(p, m) && DONE.test(content(p)));
    const owners = askOwners(m);
    return owners.length && !askClosed(m, owners, posts);
  }).slice(0, 2).map(m => ({
    text: phrase(content(m).replace(MINE, '').replace(/^NEEDS\s+@?[\w.-]+\s*/i, ''), 'A decision is waiting'),
    href: postHref(m, log),
  }));
  for (const [kind, label, items] of [['shipped', 'Shipped', shipped], ['open', 'Open', open]]) {
    if (items.length) lines.push({ kind, label, items, text: `${label}: ${items.map(item => item.text).join('; ')}` });
  }
  return lines.length ? lines : [{ kind: 'quiet', text: 'Quiet in the last day.' }];
}
