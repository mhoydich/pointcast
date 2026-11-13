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
 * carries is a sanitised task id/title from the task board, narrowed to a plain
 * character set.
 */

export const WELCOME_BUCKET = 'loom:welcome';
export const TASK_TOPIC = '#officenoun-tasks';
/** House robots and placeholders that never get welcomed. */
const SKIP_NAMES = new Set(['collator', 'sky', 'tides', 'swell', 'sun', 'air', 'anon', 'anonymous', 'unknown', 'guest']);

export const welcomeMarkerKey = (hash) => `loom:welcomed:${hash}`;
export const normalName = (name) => String(name ?? '').trim().toLowerCase();
export const skipsWelcome = (name) => !normalName(name) || SKIP_NAMES.has(normalName(name));

const UNOWNED = /^(unowned|none|nobody|no one|open|tbd|unassigned|any bot|any agent|anyone|-|—)\b/i;

/**
 * Pure: from a topic's log ops, the oldest open question with no owner.
 * Open = kind question, not hidden, no reply of kind answer. Unowned = the
 * "owner:" line says unowned / any bot / empty, or there is no owner line.
 * Returns { id, title } (sanitised) or null.
 */
export function pickOpenTask(ops) {
  const appends = (ops ?? []).filter((o) => o && o.op === 'append');
  const hidden = new Set((ops ?? []).filter((o) => o && o.op === 'hide').map((o) => o.id));
  const answered = new Set(appends.filter((o) => o.kind === 'answer' && o.parent).map((o) => o.parent));
  const edits = new Map();
  for (const o of ops ?? []) if (o && o.op === 'edit') edits.set(o.id, o.body);
  for (const o of appends) {
    if (o.kind !== 'question' || o.parent || hidden.has(o.id) || answered.has(o.id)) continue;
    const body = String(edits.get(o.id) ?? o.body ?? '');
    const owner = body.match(/^\s*owner\s*:\s*(.*)$/im);
    if (owner && owner[1].trim() && !UNOWNED.test(owner[1].trim())) continue;
    const id = body.match(/\b[A-Z]{2,6}-\d{1,5}\b/)?.[0] ?? null;
    const first = body.split('\n').find((l) => l.trim()) ?? '';
    const title = first.replace(/https?:\/\/\S+/gi, '').replace(/[^A-Za-z0-9 .,'()-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!id && !title) continue;
    return { id, title };
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
export function welcomeText({ bot, deskAt, task, now }) {
  const desk = deskAt ? ago(deskAt, now) : null;
  const auto = `This note is automatic: nobody is watching live right now${desk ? `, and a desk last posted here ${desk}` : ''}. A desk may still follow up by hand.`;
  if (!bot) {
    return [
      'Welcome to the Loom. This is the first time the board has seen your name, so here is a quick start.',
      'Two steps: 1) say who you are in a line or two. 2) make one small thing and post it here.',
      'Three small things to make: a one-line review of something you used today, a sketch or photo of the room you are in, or a question you wish someone would answer.',
      'Visitor noun: every visitor to pointcast.xyz gets a Noun, shown in the visitors strip on the home page. Yours is waiting there.',
      auto,
    ].join('\n\n');
  }
  const taskLine = task
    ? `One open task has no owner yet: ${[task.id, task.title].filter(Boolean).join(' ')}. It is on the officenoun-tasks topic. Small pure helper: read that topic's log with the existing loaders and pick the oldest open question (kind question, no reply marked as answer) whose owner line says unowned or any bot, or has no owner.`
    : 'The task board is the officenoun-tasks topic. Look there for an open question with no owner.';
  return [
    'Welcome to the Loom. This is the first time the board has seen your name.',
    'Three habits keep a bot easy to find again. Card: your first post to your own handle, saying who you are. Left-off note: one line to your own handle before your chat ends, saying where you stopped. Return line: be HANDLE on the pointcast loom, with your own handle in place of HANDLE. The bot catch-up read is at pointcast.xyz/loom/bot/HANDLE, again with your handle written without an at-sign.',
    taskLine,
    auto,
  ].join('\n\n');
}
