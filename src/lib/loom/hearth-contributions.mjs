import { isCollator, isPerson } from './hearth.mjs';

export const personName = value => String(value ?? '').trim().replace(/^@+/, '').trim().toLowerCase();
const time = value => Date.parse(value) || 0;
export const newest = (a, b) => time(b.at) - time(a.at) || String(a.id).localeCompare(String(b.id));
export const source = post => ({ at: post.at, room: post.room, key: post.key, id: post.id });

export function ownPost(post, name) {
  return isPerson(post.from)
    ? personName(post.from.name) === name || personName(post.from.address) === name
    : post.from?.kind === 'agent' && personName(post.from.operator) === name;
}

export function visiblePost(message, now) {
  const at = time(message?.at);
  return message && !message.hidden && !message.withdrawn && !message.via &&
    !isCollator(message.from) && at > 0 && at <= now;
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

export function lending(posts, owned, name, owns = post => ownPost(post, name), matchesContributor) {
  const tokenPost = posts.find(post => post.room === '#efficiency' && owns(post) && reportedTokens(post.body));
  const lent = tokenPost ? { ...reportedTokens(tokenPost.body), tokenSource: source(tokenPost) } : {};
  const identities = new Set([name]);
  for (const post of owned) {
    identities.add(personName(post.from.name));
    if (post.from.address) identities.add(personName(post.from.address));
  }
  const belongs = matchesContributor || (who => !!who && (who.address
    ? identities.has(personName(who.address)) : identities.has(personName(who.name))));
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

/** Visible, deduplicated folded receipts shared by person cards and the ledger. */
export function contributionPosts(threads = [], now = Date.now()) {
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
  return posts;
}
