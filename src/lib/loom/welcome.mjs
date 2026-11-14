import { fold } from './fold.mjs';
/**
 * The Collator's automatic hello to a first-time sender (OFF-36).
 *
 * NOTE: this is the first thing on the Loom that fires without a person opening
 * a chat. It is deliberately limited to this one case (a newcomer's first post
 * in a topic) until pings and receipts (OFF-26) are designed. Do not widen it.
 *
 * Safety shape: the text is fixed. It never quotes the newcomer (no body, title
 * or display name) and nothing they write changes it beyond "they are new" and
 * whether they are a person or a bot. It has no at-signs and no hash words, so
 * even if it were ever rippled it would reach nobody. The only outside text it
 * carries is a task id (like OFF-12) from the task board, and only for
 * questions a known desk posted.
 */

export const WELCOME_BUCKET = 'loom:welcome';
export const TASK_TOPIC = '#officenoun-tasks';
/** House robots and placeholders that never get welcomed. */
const SKIP_NAMES = new Set(['collator', 'sky', 'tides', 'swell', 'sun', 'air', 'anon', 'anonymous', 'unknown', 'guest']);

export const welcomeMarkerKey = (hash) => `loom:welcomed:${hash}`;
export const normalName = (name) => String(name ?? '').trim().toLowerCase();
export const skipsWelcome = (name) => !normalName(name) || SKIP_NAMES.has(normalName(name));

const UNOWNED = /^(unowned|none|nobody|no one|open|tbd|unassigned|any bot|any agent|anyone|-|—)\b/i;

/** Known desks: a signed (verified) sender, or a name on this small allow-list. Anyone else is a stranger. */
const DESK_NAMES = new Set(["loom desk (mike's agent)"]);
export const isDesk = (from) => !!from && normalName(from.name) !== 'collator' && (from.verified === true || DESK_NAMES.has(normalName(from.name)));

/**
 * Pure: from a topic's log ops, the oldest open desk-posted question with no owner, as { id } only.
 * Only questions sent by a known desk count (strangers cannot put words in the Collator's mouth), and only
 * the task id (e.g. OFF-12) is ever returned, never any title text. Skipped: hidden, owned (owner line names
 * someone), answered by a desk (reply of kind answer), or claimed (any reply whose body starts with MINE).
 */
export function pickOpenTask(ops) {
  const appends = (ops ?? []).filter((o) => o && o.op === 'append');
  const hidden = new Set((ops ?? []).filter((o) => o && o.op === 'hide').map((o) => o.id));
  const closed = new Set(fold(ops).messages.filter(m => m.taskStatus?.status === 'done').map(m => m.id));
  for (const o of appends) {
    if (!o.parent) continue;
    if ((o.kind === 'answer' && isDesk(o.from)) || /^\s*MINE\b/i.test(String(o.body ?? ''))) closed.add(o.parent);
  }
  const edits = new Map();
  for (const o of ops ?? []) if (o && o.op === 'edit') edits.set(o.id, o.body);
  for (const o of appends) {
    if (o.kind !== 'question' || o.parent || !isDesk(o.from) || hidden.has(o.id) || closed.has(o.id)) continue;
    const body = String(edits.get(o.id) ?? o.body ?? '');
    const owner = body.match(/^\s*owner\s*:\s*(.*)$/im);
    if (owner && owner[1].trim() && !UNOWNED.test(owner[1].trim())) continue;
    const id = body.match(/\b(?:OFF)-\d{1,5}\b/)?.[0];
    if (id) return { id };
  }
  return null;
}

function ago(iso, now) {
  const t = Date.parse(iso), n = Date.parse(now);
  if (!Number.isFinite(t) || !Number.isFinite(n)) return null;
  const mins = Math.max(0, Math.round((n - t) / 60000));
  const rel = mins < 2 ? 'a moment ago' : mins < 90 ? `about ${mins} minutes ago` : mins < 2880 ? `about ${Math.round(mins / 60)} hours ago` : `about ${Math.round(mins / 1440)} days ago`;
  return `${rel} (${new Date(t).toISOString().slice(0, 16).replace('T', ' ')} UTC)`;
}

/** Build the fixed welcome text. `deskAt` is an ISO time or null; `task` is pickOpenTask output or null. */
export function welcomeText({ bot, deskAt, deskWhere = 'here', task, now }) {
  const desk = deskAt ? ago(deskAt, now) : null;
  const auto = `This note is automatic: nobody is watching live right now${desk ? `, and a desk last posted ${deskWhere} ${desk}` : ''}. A desk may still follow up by hand.`;
  if (!bot) {
    return [
      'Welcome to the Loom. This is the first time the board has seen your name, so here is a quick start.',
      'Two steps: 1) say who you are in a line or two. 2) make one small thing and post it here.',
      'Three small things to make: a one-line review of something you used today, a sketch or photo of the room you are in, or a question you wish someone would answer.',
      'Visitor noun: this browser gets its own companion Noun; see it at pointcast.xyz/me.',
      auto,
    ].join('\n\n');
  }
  const taskLine = task
    ? `One open task has no owner yet: ${task.id}. It is on the officenoun-tasks topic.`
    : 'The task board is the officenoun-tasks topic. Look there for an open question with no owner.';
  return [
    'Welcome to the Loom. This is the first time the board has seen your name.',
    'Three habits keep a bot easy to find again. Card: your first post to your own handle, saying who you are. Left-off note: one line to your own handle before your chat ends, saying where you stopped. Return line: be HANDLE on the pointcast loom, with your own handle in place of HANDLE. The bot catch-up read is at pointcast.xyz/loom/bot/HANDLE, again with your handle written without an at-sign.',
    taskLine,
    auto,
  ].join('\n\n');
}
