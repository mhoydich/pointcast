/**
 * /r/desk — the Desk Log: live calls, this morning's shift and the last 50
 * lines (GET /api/air/desk, a DeskPayload; src/lib/air.ts), polled every 30 s
 * while the tab is visible — the same pattern as pickleball-board.ts. Agents
 * are named throughout; people never are ("answered on site" is baked into
 * the log lines themselves, functions/_lib/air-desk.mjs's deskLog()).
 *
 * Nothing claims an empty desk before a read succeeds: the "No open calls" and
 * "Nothing filed yet" lines ship hidden and only a good payload unhides them.
 */
import { AIR_CONFIG, agentUrl, airSpot, deskAgent, spotUrl } from '../lib/air';
import { beliefParts, callHead, deskTemplate, logDays } from '../../functions/_lib/air-desk.mjs';
import type { CallView, DeskLogLine, DeskPayload, ShiftView } from '../lib/air';

const POLL_MS = 30_000;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { headers: { accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

const nameOf = (call: string): string => deskAgent(call)?.name ?? call;

function agentLink(call: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = agentUrl(call);
  a.textContent = nameOf(call);
  return a;
}

/**
 * One live call, as the board and the spot page print it (config.desk.templates):
 * "CALL FROM THE DESK · CC" (the holder, linked) · the spot, the question, and
 * the asker's own read — "Frog read *8 PM* on citymb.info." — so a passed call
 * never credits the holder with the asker's read.
 */
function callItem(c: CallView): HTMLLIElement {
  const li = document.createElement('li');
  const head = document.createElement('p');
  head.className = 'dk__callhead air-mono';
  const holder = document.createElement('a');
  holder.href = agentUrl(c.agent);
  holder.textContent = callHead(AIR_CONFIG, c);
  const spot = document.createElement('a');
  spot.href = spotUrl(c.spot);
  spot.textContent = airSpot(c.spot)?.name ?? c.spot;
  head.append(holder, document.createTextNode(' · '), spot);
  const question = document.createElement('p');
  question.className = 'dk__q';
  question.textContent = c.question;
  const belief = document.createElement('p');
  belief.className = 'dk__belief';
  belief.append(...(beliefParts(AIR_CONFIG, c) as { text: string; key?: string }[]).map((part) => {
    if (part.key === 'label') { const em = document.createElement('em'); em.textContent = part.text; return em; }
    if (part.key === 'name') { const a = agentLink(c.asker); a.textContent = part.text; return a; }
    return document.createTextNode(part.text);
  }));
  li.append(head, question, belief);
  return li;
}

function paintCalls(root: HTMLElement, calls: CallView[]): void {
  const list = root.querySelector<HTMLElement>('[data-desk-calls]');
  const empty = root.querySelector<HTMLElement>('[data-desk-calls-empty]');
  if (!list) return;
  list.replaceChildren(...calls.map(callItem));
  if (empty) empty.hidden = calls.length > 0;
}

function paintShift(root: HTMLElement, shift: ShiftView): void {
  const list = root.querySelector<HTMLElement>('[data-desk-shift]');
  const by = root.querySelector<HTMLElement>('[data-desk-shift-by]');
  if (by) by.textContent = shift.onTimeBy;
  if (!list) return;
  list.replaceChildren();
  for (const f of shift.feeds) {
    const li = document.createElement('li');
    const why = f.reason ? deskTemplate(AIR_CONFIG, `gapReasons.${f.reason}`) || f.reason : '';
    // A blocked feed waits on the house (no key yet): a house gap, never worded as the keeper's miss.
    const status = f.outcome === 'filed' ? (f.onTime ? 'filed on time' : 'filed late')
      : f.outcome === 'gap' ? `${f.reason === 'blocked' ? 'waits on the house' : 'missed'}${why ? ` (${why})` : ''}` : 'waiting';
    li.append(agentLink(f.keeper), document.createTextNode(` keeps ${f.feed}: ${status}`));
    list.append(li);
  }
}

/** The log under LA day heads ("Today", "Yesterday", "Fri Oct 2"), each line led by its clock. */
function paintLog(root: HTMLElement, lines: DeskLogLine[], serverTime: string): void {
  const list = root.querySelector<HTMLElement>('[data-desk-log]');
  const empty = root.querySelector<HTMLElement>('[data-desk-log-empty]');
  if (!list) return;
  const now = Date.parse(serverTime);
  const days = logDays(lines, Number.isFinite(now) ? now : Date.now()) as { day: string; head: string; lines: { clock: string; text: string }[] }[];
  list.replaceChildren();
  for (const d of days) {
    const head = document.createElement('li');
    head.className = 'dk__day air-mono';
    head.textContent = d.head;
    list.append(head);
    for (const l of d.lines) {
      const li = document.createElement('li');
      const clock = document.createElement('span');
      clock.className = 'dk__clock air-mono';
      clock.textContent = l.clock;
      li.append(clock, document.createTextNode(` ${l.text}`));
      list.append(li);
    }
  }
  if (empty) empty.hidden = days.length > 0;
}

export function mountDeskLog(): void {
  const root = document.querySelector<HTMLElement>('[data-desk]');
  if (!root) return;
  const note = root.querySelector<HTMLElement>('[data-desk-note]');
  let loaded = false;

  async function refresh(): Promise<void> {
    const data = await getJson<DeskPayload>('/api/air/desk');
    if (!data) {
      // After a good read the last paint stays up; before one, only the offline note shows.
      if (note) { note.textContent = loaded ? 'The Desk is offline right now. This page keeps its last read.' : 'The Desk is offline right now. Try again in a minute.'; note.hidden = false; }
      return;
    }
    loaded = true;
    if (note) note.hidden = true;
    paintCalls(root!, data.calls);
    paintShift(root!, data.shift);
    paintLog(root!, data.log, data.serverTime);
  }

  let timer: number | undefined;
  const schedule = (): void => {
    clearTimeout(timer);
    if (!document.hidden) timer = window.setTimeout(() => { void refresh().then(schedule); }, POLL_MS);
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else void refresh().then(schedule); });
  void refresh().then(schedule);
}
