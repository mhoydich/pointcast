/** A deterministic room recap. Reads folded posts only; no network or storage. */
import { asksForGoAhead, GO_AHEAD_PHRASES, isCollator, normHandle } from './for-you.mjs';
import { splitStamp } from './stamp.mjs';

const DAY = 86400000;
const SHIPPED = /^(?:DONE|SHIPPED|MERGED|RELEASE\s+RECEIPT)\b/i;
const MINE = /^MINE\b/i;
const QUOTE_OR_FENCE = /```[\s\S]*?(?:```|(?![\s\S]))|~~~[\s\S]*?(?:~~~|(?![\s\S]))|^[ \t]*>[^\n]*/gm;
const INLINE_CODE = /`([^`\n]*)`/g;
const QUOTED_TEXT = /“[^”]*”|"[^"\n]*"|‘[^’\n]*’|(?<!\w)'[^'\n]+'(?!\w)/g;
const TASK_ID = /^(#?[A-Za-z]{0,8}-?\d[\w-]{0,8})(?=$|[\s·:,.])/;
const times = new WeakMap();
const time = m => {
  if (!times.has(m)) times.set(m, Date.parse(m.at) || 0);
  return times.get(m);
};
const newest = (a, b) => time(b) - time(a) || (b.seq || 0) - (a.seq || 0);
const identity = value => String(value || 'anonymous').trim().toLowerCase().replace(/\s+/g, ' ');
const sameSender = (a, b) => (a.from?.kind || 'agent') === (b.from?.kind || 'agent') &&
  (a.from?.address && b.from?.address ? identity(a.from.address) === identity(b.from.address)
    : identity(a.from?.name) === identity(b.from?.name));
// The author's own words: block quotes and fenced code are examples, not reports.
const own = m => String(m.body || m.poll?.question || '').replace(QUOTE_OR_FENCE, '').trim();
// Emphasis marks go; an underscore inside a handle or a file name stays.
const tidy = text => splitStamp(text.trim()).text.replace(/^\s*(?:#{1,6}\s+|[-*+]\s+)/, '').replace(/\*+/g, '')
  .replace(/(^|[^\p{L}\p{N}])_+(?=\S)|(?<=\S)_+(?=$|[^\p{L}\p{N}])/gu, '$1').trim();
// What a post says, with inline code kept as words: `src/a.mjs` is the subject of a real status line.
const content = m => tidy(own(m).replace(INLINE_CODE, '$1'));
// What kind of post it is: inline code never supplies the keyword, the owner or the merge report.
const status = m => tidy(own(m).replace(INLINE_CODE, ''));
const webUrl = value => {
  try {
    const u = new URL(String(value).replace(/[.,;!?)\]]+$/, ''));
    return /^https?:$/.test(u.protocol) ? u.href : null;
  } catch { return null; }
};
const urls = m => [...new Set([
  ...(own(m).replace(INLINE_CODE, '').match(/https?:\/\/[^\s<>"']+/gi) || []),
  ...(m.links || []), ...(m.cites || []),
].map(webUrl).filter(Boolean))];
const postHref = (m, log) => '/loom?to=' + encodeURIComponent(log.address || (log.key ? `loom:${log.key}` : '#loom'))
  + (m.id ? '#' + encodeURIComponent(m.id) : '');

/** Drop display syntax and machine hashes, then keep a short phrase in the author's words. */
function phrase(value, fallback) {
  const text = String(value).replace(/\[([^\]]+)\]\(https?:\/\/[^\s]+\)/g, '$1')
    .replace(/https?:\/\/[^\s<>"']+/gi, '').replace(/\b[\da-f]{7,64}\b/gi, '')
    .replace(/[#@*`]/g, '').replace(/^\s*[·:—–-]+\s*/, '').trim()
    .split(/\n|\s+[·|]\s+|(?<=[.!?])\s+/).find(part => /[\p{L}\p{N}]/u.test(part)) || fallback;
  const short = text.replace(/\s+/g, ' ').replace(/[\s.;:·|—–-]+$/, '').trim();
  return short.length <= 88 ? short : short.slice(0, 85).replace(/\s+\S*$/, '') + '…';
}

function receipt(m) {
  const body = status(m);
  if (SHIPPED.test(body)) return true;
  // A bare PR URL cannot tell us its GitHub state. Require a reported merge,
  // in the same sentence as the link, and exclude planned or negated merges.
  // Words inside quotation marks are someone else's report or an example.
  return body.replace(QUOTED_TEXT, '').split(/\n|(?<=[.!?])\s+/).some(sentence =>
    /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+\b/i.test(sentence)
    && /\b(?:was|is|has been|just) merged\b|\bPR\s*#?\d+\s+merged\b/i.test(sentence)
    && !/\b(?:not|never|isn't|wasn't|hasn't|when|once|if|until|after|will|should)\b/i.test(sentence));
}

// "Job:", "Answer:", "Flags:" open a section; they are not someone being asked.
const LABELS = new Set(['job', 'task', 'answer', 'question', 'flags', 'flag', 'recommendation', 'applied', 'note', 'notes', 'status',
  'next', 'why', 'how', 'what', 'goal', 'result', 'results', 'summary', 'update', 'title', 'description', 'done', 'open', 'fix',
  'plan', 'scope', 'target', 'budget', 'source', 'sources', 'context', 'ask', 'risk', 'risks', 'tests', 'files', 'verdict', 'evidence']);
function askOwners(m) {
  const body = String(m.body || m.poll?.question || '');
  // Stamps and emphasis are display syntax; "NEEDS MIKE" reads the same with or without them.
  const plain = status(m);
  const explicit = plain.match(/^NEEDS\s+@?([A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)*)\b/i);
  if (explicit && normHandle(explicit[1]) !== 'your' && !/^NEEDS\s+@?[\w.-]+['’]s\s+yes\b/i.test(plain)) return [normHandle(explicit[1])];
  // The shared classifier still decides whether these candidates are actual
  // requests. Quoted examples, UI labels and status receipts stay excluded.
  const candidates = new Set([
    ...[...body.matchAll(/@([A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)*)/g)].map(m => normHandle(m[1])),
    ...[...body.matchAll(/(?:^|\n|[.!?]\s+)(?:(?:hi|hey|hello)\s+)?([A-Za-z][\w.-]*)\s*[,;:—–-]/gi)].map(m => m[1])
      .filter(word => !LABELS.has(word.toLowerCase()) && !/^[A-Z]{3,}$/.test(word)).map(normHandle),
    ...[...body.matchAll(/\bneeds\s+([A-Za-z][\w.-]*)(?:['’]s)?\s+yes\b/gi)].map(m => normHandle(m[1])),
    ...[...body.matchAll(/,\s+([A-Za-z][\w-]*)[?.!]*(?:$|\n)/g)].map(m => normHandle(m[1])),
  ]);
  const matched = [...candidates].filter(owner => asksForGoAhead(m, GO_AHEAD_PHRASES.map(make => make(owner.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'))), owner, false));
  if (matched.length) return matched;
  // A room-wide question has the same natural-request rules as an inbox.
  return asksForGoAhead(m, GO_AHEAD_PHRASES.map(make => make('__room__')), '__room__', true) ? [''] : [];
}

function childIndex(posts) {
  const children = new Map();
  for (const p of posts) if (p.parent) {
    if (!children.has(p.parent)) children.set(p.parent, []);
    children.get(p.parent).push(p);
  }
  return children;
}

function askClosed(m, owners, children) {
  const seen = new Set([m.id]), stack = [...(children.get(m.id) || [])];
  while (stack.length) {
    const reply = stack.pop();
    if (seen.has(reply.id)) continue;
    seen.add(reply.id);
    const ownerReply = owners.some(owner => owner && [reply.from?.name, reply.from?.address].some(name => normHandle(name) === owner));
    if (newest(reply, m) < 0 && (ownerReply || (sameSender(reply, m) && /^(?:CLEARED|DONE)\b/i.test(status(reply))))) return true;
    stack.push(...(children.get(reply.id) || []));
  }
  return false;
}

const task = text => {
  const rest = text.replace(MINE, '').replace(SHIPPED, '').replace(/^\s*[·:—–-]+\s*/, '').trim();
  const id = rest.match(TASK_ID)?.[1];
  return { id: id ? id.replace(/^#/, '').toLowerCase() : '',
    words: rest.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 12).join(' ') };
};

/** Which MINE claims their own sender later reported finished. One pass, oldest
 * first. A completion closes the claim it replies under, else the claim with
 * the same card or PR id, else the claim with the same opening words, so
 * "DONE B" never clears an unrelated "MINE A".
 */
function closedClaims(posts) {
  const closed = new Set(), claims = [], byId = new Map(posts.map(p => [p.id, p]));
  for (let i = posts.length - 1; i >= 0; i--) {
    const m = posts[i], kind = status(m);
    if (MINE.test(kind)) { claims.push({ post: m, ...task(content(m)) }); continue; }
    if (!claims.length || !SHIPPED.test(kind)) continue;
    const done = task(content(m));
    const mine = claim => sameSender(claim.post, m) && newest(m, claim.post) < 0;
    const sameCard = claim => !(done.id && claim.id && done.id !== claim.id);
    let at = -1;
    for (let parent = byId.get(m.parent), hops = 0; parent && at < 0 && hops < 50; parent = byId.get(parent.parent), hops++) {
      at = claims.findIndex(claim => claim.post.id === parent.id && mine(claim));
    }
    if (at < 0 && done.id) at = claims.findIndex(claim => claim.id === done.id && mine(claim));
    if (at < 0 && done.words) at = claims.findIndex(claim => mine(claim) && sameCard(claim) && claim.words === done.words);
    if (at < 0 && done.words) {
      // A shorter wording of the same task counts only on whole words and only when one claim fits.
      const near = claims.filter(claim => mine(claim) && sameCard(claim) && claim.words
        && (claim.words.startsWith(done.words + ' ') || done.words.startsWith(claim.words + ' ')));
      if (near.length === 1) at = claims.indexOf(near[0]);
    }
    // A bare "DONE" with nothing after it can only mean the sender's one open claim.
    if (at < 0 && !done.id && !done.words && claims.filter(mine).length === 1) at = claims.findIndex(mine);
    if (at >= 0) closed.add(claims.splice(at, 1)[0].post.id);
  }
  return closed;
}

/** A fuller line for the front page: a leading card or PR id keeps the sentence after it. */
const ID_PART = /^#?[A-Za-z]{0,8}-?\d[\w-]{0,8}$/;
// Known acronyms and words with digits (HUX-6, CC0) keep their case.
const ACRONYMS = new Set(['AI', 'API', 'MCP', 'DAO', 'NFT', 'PR', 'UES', 'URL', 'HTML', 'CSS', 'JSON', 'KV', 'ID', 'XTZ', 'ETH', 'USD', 'OK', 'QA', 'UX', 'UI', 'CEO', 'COO', 'X']);
const KEEP_CASE = { test: word => /\p{N}/u.test(word) || ACRONYMS.has(word.replace(/[^\p{L}\p{N}]/gu, '')) };
/** A shouted line reads as a sentence; acronyms and ids stay as written. */
function calm(text) {
  const letters = text.match(/\p{L}/gu) || [];
  if (letters.length < 12 || letters.filter(ch => ch === ch.toUpperCase() && ch !== ch.toLowerCase()).length / letters.length < 0.7) return text;
  let first = true;
  return text.replace(/\S+/g, word => {
    const out = KEEP_CASE.test(word.replace(/^[(\[]/, '')) ? word : word.toLowerCase();
    if (first && /\p{L}/u.test(out)) {
      first = false;
      return out.replace(/\p{Ll}/u, ch => ch.toUpperCase());
    }
    return out;
  });
}
function tell(value, fallback) {
  const lines = String(value).replace(/\[([^\]]+)\]\(https?:\/\/[^\s]+\)/g, '$1')
    .replace(/https?:\/\/[^\s<>"']+/gi, '').replace(/[*`]/g, '').replace(/^\s*[·:—–-]+\s*/, '');
  const split = text => text.split(/\n|\s+[·|]\s+|(?<=[.!?])\s+/).map(part => part.replace(/\s+/g, ' ').replace(/[\s.;:·|—–-]+$/, '').trim())
    .filter(part => /[\p{L}\p{N}]/u.test(part));
  // An aside in brackets is not the headline, unless it is all the post says.
  const parts = split(lines.replace(/\s*\([^()\n]*\)/g, ' ')).length ? split(lines.replace(/\s*\([^()\n]*\)/g, ' ')) : split(lines.replace(/[()]/g, ''));
  if (!parts.length) return fallback;
  let id = ID_PART.test(parts[0]) && parts[1] ? parts.shift() : '';
  // "DONE … · LEND-2": a card id at the end of the first line leads the line instead.
  if (!id && parts[1] && ID_PART.test(parts[1]) && /^[A-Z#]/.test(parts[1])) {
    id = parts[1];
    parts.splice(1, 1);
  }
  const text = (id ? id + ' · ' : '') + calm(parts[0]);
  return text.length <= 120 ? text : text.slice(0, 117).replace(/\s+\S*$/, '') + '…';
}
const who = m => String(m.from?.name || 'Someone').replace(/\s+/g, ' ').trim().slice(0, 48) || 'Someone';

/** Receipts and still-open claims or asks among `recent`, newest first. */
function work(recent, posts, log, { say = phrase, roomWide = true } = {}) {
  const item = (m, text, href) => ({ text, href, at: m.at, by: who(m) });
  const shipped = recent.filter(receipt).map(m => item(m,
    say(content(m).replace(SHIPPED, ''), 'Work completed'), urls(m)[0] || postHref(m, log)));
  const closed = closedClaims(posts), children = childIndex(posts);
  const open = recent.filter(m => {
    if (MINE.test(status(m))) return !closed.has(m.id);
    const owners = askOwners(m).filter(owner => roomWide || owner);
    return owners.length && !askClosed(m, owners, children);
  }).map(m => item(m,
    say(content(m).replace(MINE, '').replace(/^NEEDS\s+@?[\w.-]+\s*/i, ''), 'A decision is waiting'), postHref(m, log)));
  return { shipped, open };
}

/** The front page's share of one room: what was reported done and what is
 * still open in the last day only. Never falls back to older posts. A question
 * to nobody in particular stays in its room; the front page lists claims and
 * asks that name someone.
 */
export function roomBrief(messages = [], { log = {}, now = Date.now(), limit = 12 } = {}) {
  const posts = messages.filter(m => m && !m.hidden && !m.withdrawn && !m.via && !isCollator(m.from) && time(m) <= now)
    .sort(newest);
  const { shipped, open } = work(posts.filter(m => time(m) >= now - DAY), posts, log, { say: tell, roomWide: false });
  // Say how many posts the cap left out. They may repeat known work, so readers treat
  // the listed items as a floor rather than adding these in.
  return { done: shipped.slice(0, limit), open: open.slice(0, limit),
    ...(shipped.length > limit ? { doneMore: shipped.length - limit } : {}),
    ...(open.length > limit ? { openMore: open.length - limit } : {}) };
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
  const found = work(recent, posts, log);
  const shipped = found.shipped.slice(0, 2).map(({ text, href }) => ({ text, href }));
  const open = found.open.slice(0, 2).map(({ text, href }) => ({ text, href }));
  for (const [kind, label, items] of [['shipped', 'Done', shipped], ['open', 'Open', open]]) {
    if (items.length) lines.push({ kind, label, items, text: `${label}: ${items.map(item => item.text).join('; ')}` });
  }
  return lines.length ? lines : [{ kind: 'quiet', text: 'Quiet in the last day.' }];
}
