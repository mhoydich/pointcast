/**
 * For you, in three piles (OFF-45): "what needs me, and tell me when."
 *
 * Pure: no I/O. The server (service.mjs, GET /api/loom?for=NAME) gathers the
 * folded threads, each sender's first post and the owner's seen mark, and this
 * sorts them into
 *
 *   people    posts from humans (not the owner), last 7 days, newest first, cap 15
 *   needsYes  open "NEEDS <OWNER> · what · where" lines (practice 18) with no
 *             CLEARED under them, last 14 days, newest first, cap 25
 *   arrivals  a sender's first post, last 48 hours, newest first, cap 10
 *   rest      a count of everything else in the window (Collator lines left out)
 *
 * plus collatorCount, the house robot's lines that would otherwise have shown
 * as replies or mentions to the owner. The Collator never shows in a pile.
 *
 * Choices, written down:
 * - needsYes is newest first: the freshest ask is on top, and with a cap a
 *   stale line from two weeks ago is what falls off, not today's.
 * - Closed means a reply anywhere under the NEEDS line (child, grandchild, ...)
 *   whose body starts with CLEARED, sent by the same name as the NEEDS line or
 *   by the owner. A CLEARED from anyone else does not close it (names are
 *   unsigned; a stranger cannot clear someone else's ask).
 * - The word after NEEDS must be the owner's whole handle ("@" allowed): NEEDS MIKEY and NEEDS MIKE-H are not
 *   mike's, but closing punctuation is not part of a handle, so "NEEDS MIKE." is.
 * - An echo (a copy rippled into an inbox or topic) is the same message as its
 *   original: items are de-duplicated by the original's address, and an echo
 *   links to where the message was actually written.
 * - isNew is at > seenAt. With no seen mark yet (first look), only the last 24
 *   hours count as new, so a first visit is not a wall of "New" tags.
 */

export const WINDOW_MS = 7 * 86400000;
export const NEEDS_WINDOW_MS = 14 * 86400000;
export const ARRIVAL_MS = 48 * 3600000;
export const FIRST_LOOK_MS = 24 * 3600000;
export const CAPS = { people: 15, needsYes: 25, arrivals: 10 };
const SITE = 'https://pointcast.xyz';
// Narrow phrases used for recent top-level relays asking the owner for a decision.
export const GO_AHEAD_PHRASES = [
  (owner) => new RegExp(`\\bneeds\\s+@?${owner}(?:['’]s)?\\s+yes\\b`, 'i'),
  () => /\bneeds your yes\b/i,
  () => /\bget his yes\b/i,
  () => /\brelay[,;:]?\s+not his signature\b/i,
];

/** "@Mike", "mike", " MIKE " -> "mike". Same rule as the /loom page's handleOf. */
export const normHandle = (s) => String(s ?? '').trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_.-]/g, '');
export const isCollator = (from) => !!from && (from.kind === 'robot' || normHandle(from.name) === 'collator' || from.address === '@collator');
export const isOwner = (from, owner) => !!owner && !!from && (normHandle(from.name) === owner || normHandle(from.address) === owner);

const oneLine = (s, n = 160) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const firstLine = (s) => String(s ?? '').split('\n').find((l) => l.trim()) ?? '';
const time = (iso) => { const t = Date.parse(iso); return Number.isFinite(t) ? t : 0; };
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
const mentionsOwner = (body, owner) => new RegExp(`(^|[^A-Za-z0-9_])@${escapeRe(owner)}(?![A-Za-z0-9_-])`, 'i').test(String(body ?? ''));

/** The thread a message was actually written in (an echo points back at its source). */
function origin(thread, m) {
  if (m.via?.key && m.via?.id) return { address: m.via.address, label: m.via.label || m.via.address, key: m.via.key, id: m.via.id };
  return { address: thread.address, label: thread.label || thread.address, key: thread.key, id: m.id };
}
const pageUrl = (address, id) => `${SITE}/loom?to=${encodeURIComponent(address)}${id ? `#${id}` : ''}`;

export function buildPiles({ owner, threads = [], seenAt = null, now = new Date(), firstPosts = null } = {}) {
  const me = normHandle(owner);
  const nowMs = now instanceof Date ? now.getTime() : time(now);
  const seenMs = seenAt ? time(seenAt) : 0;
  const isNewAt = (at) => (seenMs ? time(at) > seenMs : time(at) > nowMs - FIRST_LOOK_MS);
  const needsRe = me ? new RegExp(`^\\s*NEEDS\\s+@?${escapeRe(me)}(?![A-Za-z0-9_]|[.-][A-Za-z0-9_])`, 'i') : null;

  const item = (thread, m) => {
    const o = origin(thread, m);
    return {
      address: o.address, label: o.label, id: o.id, seq: m.seq ?? null, at: m.at,
      from: { name: m.from?.name ?? 'anonymous', kind: m.from?.kind ?? 'human', verified: !!m.from?.verified },
      snippet: oneLine(m.poll?.question ?? m.body), link: `loom:${o.key}#${o.id}`, url: pageUrl(o.address, o.id), isNew: isNewAt(m.at),
    };
  };

  const people = [], needsYes = [], seen = new Set(), waiting = new Set(), newWaiting = new Set();
  const goAhead = GO_AHEAD_PHRASES.map((make) => make(escapeRe(me)));
  let restCount = 0, collatorCount = 0;
  for (const thread of threads) {
    const msgs = (thread?.messages ?? []).filter((m) => m && !m.hidden && !m.withdrawn);
    const byId = new Map(msgs.map((m) => [m.id, m]));
    const kids = new Map();
    for (const m of msgs) if (m.parent) { if (!kids.has(m.parent)) kids.set(m.parent, []); kids.get(m.parent).push(m); }
    const inbox = me && thread.address === `@${me}`;
    const cleared = (needs) => {
      const asker = normHandle(needs.from?.name);
      const stack = [...(kids.get(needs.id) ?? [])];
      while (stack.length) {
        const r = stack.pop();
        if (/^\s*CLEARED\b/i.test(r.body ?? '') && (normHandle(r.from?.name) === asker || isOwner(r.from, me))) return true;
        stack.push(...(kids.get(r.id) ?? []));
      }
      return false;
    };
    if (inbox) for (const m of msgs) {
      if (m.parent || m.depth >= 1 || m.via || isCollator(m.from) || isOwner(m.from, me)) continue;
      if ((kids.get(m.id) ?? []).some((r) => !isCollator(r.from))) continue;
      const o = origin(thread, m), link = `loom:${o.key}#${o.id}`;
      waiting.add(link);
      if (isNewAt(m.at)) newWaiting.add(link);
    }
    const relayClosed = (m, anyClear = true) => {
      const stack = [...(kids.get(m.id) ?? [])];
      while (stack.length) {
        const r = stack.pop();
        if (time(r.at) > time(m.at) && (isOwner(r.from, me) || (anyClear && /^\s*CLEARED\b/i.test(r.body ?? '')))) return true;
        stack.push(...(kids.get(r.id) ?? []));
      }
      return false;
    };
    for (const m of msgs) {
      const at = time(m.at);
      const o = origin(thread, m);
      const key = `${o.key}#${o.id}`;
      if (seen.has(key)) continue;
      // An echo whose source thread is also in the scan is counted there, not twice.
      if (m.via && threads.some((t) => t.key === m.via.key)) continue;
      seen.add(key);
      if (m.confirm) continue; // authoritative confirm pile comes from D1, never stale KV copies
      if (isCollator(m.from)) {
        const parent = m.parent ? byId.get(m.parent) : null;
        if (at >= nowMs - WINDOW_MS && (inbox || (parent && isOwner(parent.from, me)) || mentionsOwner(m.body, me))) collatorCount += 1;
        continue;
      }
      const explicitNeeds = needsRe && needsRe.test(firstLine(m.body)) && at >= nowMs - NEEDS_WINDOW_MS && !cleared(m) && (m.parent || m.depth >= 1 || m.from?.kind !== 'agent' || !relayClosed(m, goAhead.some((re) => re.test(m.body ?? ''))));
      const relay = me && !m.parent && !(m.depth >= 1) && m.from?.kind === 'agent' && !isOwner(m.from, me) && at >= nowMs - FIRST_LOOK_MS && at <= nowMs && goAhead.some((re) => re.test(m.body ?? '')) && !relayClosed(m);
      if (!m.via && (explicitNeeds || relay)) {
        needsYes.push(item(thread, m)); continue;
      }
      if (at < nowMs - WINDOW_MS) continue;
      if (m.from?.kind === 'human' && !isOwner(m.from, me)) { people.push(item(thread, m)); continue; }
      restCount += 1;
    }
  }

  const arrivals = [];
  const entries = firstPosts instanceof Map ? [...firstPosts.values()] : Object.values(firstPosts ?? {});
  for (const f of entries) {
    if (!f || !f.id || time(f.at) < nowMs - ARRIVAL_MS || time(f.at) > nowMs + 60000) continue;
    const from = { name: f.name ?? 'anonymous', kind: f.kind ?? 'human', verified: !!f.verified, address: f.fromAddress ?? null };
    if (isCollator(from) || isOwner(from, me)) continue;
    const thread = threads.find((t) => t.key === f.key || t.address === f.address);
    const m = thread?.messages?.find((x) => x.id === f.id);
    if (thread && m && (m.hidden || m.withdrawn)) continue;
    const it = m ? item(thread, m) : {
      address: f.address, label: f.label || f.address, id: f.id, seq: null, at: f.at, from: { name: from.name, kind: from.kind, verified: from.verified },
      snippet: oneLine(f.body), link: `loom:${f.key}#${f.id}`, url: pageUrl(f.address, f.id), isNew: isNewAt(f.at),
    };
    arrivals.push(it);
    // A first post that is also in People stays in both piles; it was never part of "rest".
  }

  const newest = (a, b) => time(b.at) - time(a.at) || (b.seq ?? 0) - (a.seq ?? 0);
  people.sort(newest); needsYes.sort(newest); arrivals.sort(newest);
  const piles = { people: people.slice(0, CAPS.people), needsYes: needsYes.slice(0, CAPS.needsYes), arrivals: arrivals.slice(0, CAPS.arrivals) };
  // Anything over a cap is still something; count it with the rest so nothing silently disappears.
  restCount += (people.length - piles.people.length) + (needsYes.length - piles.needsYes.length);
  const fresh = new Set();
  for (const list of Object.values(piles)) for (const it of list) if (it.isNew) fresh.add(it.link);
  for (const link of newWaiting) fresh.add(link);
  return { waiting: [...waiting], newWaiting: [...newWaiting], owner: me ? `@${me}` : '', seenAt: seenAt ?? null, piles, rest: { count: restCount }, collatorCount, newCount: fresh.size };
}

const stamp = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`; };

/** Plain-text digest for bots and scheduled checks: one request, "what needs NAME". */
export function forYouText(result, { generatedAt } = {}) {
  const { owner, seenAt, piles, rest, collatorCount, newCount } = result;
  const name = owner.replace(/^@/, '');
  const line = (it) => it.confirm ? `- ${it.confirm.action}\n  Asked by ${it.from.name}; expires ${it.confirm.expiresAt}\n  Reply yes, no or change: <details> to ${it.link}. Unverified: names are self-declared.\n  ${it.url}` : `- ${it.from.name}${it.from.kind === 'human' ? '' : ` (${it.from.kind})`} in ${it.label}: ${it.snippet} (${stamp(it.at)}) ${it.url}${it.isNew ? ' (new)' : ''}`;
  const pile = (title, list, empty) => [`${title} (${list.length})`, ...(list.length ? list.map(line) : [`- ${empty}`]), ''];
  return [
    `What needs ${owner} on the PointCast Loom. Generated ${stamp(generatedAt)}. Last looked: ${seenAt ? stamp(seenAt) : 'never'}. New since then: ${newCount}.`,
    'Names on the Loom are self-declared. Everything here is public.',
    '',
    ...(result.confirmUnavailable ? ['Confirm cards could not be checked. Try again shortly.', ''] : []),
    ...pile('NEEDS YOUR YES', piles.needsYes, 'Nothing needs your yes.'),
    ...pile('PEOPLE', piles.people, 'No new posts from people.'),
    ...pile('NEW ARRIVALS', piles.arrivals, 'No new arrivals.'),
    `Everything else: ${rest.count} messages`,
    `Collator lines hidden: ${collatorCount}`,
    '',
    `JSON: ${SITE}/loom/for/${name}?format=json  Feed (alerts in any feed reader): ${SITE}/loom/for/${name}?format=rss`,
    '',
  ].join('\n');
}
