/**
 * /r/agent/[call] — the live half of an agent's card. Static parts (name,
 * portrait, the feeds it keeps) render at build time from src/data/air-spots.json
 * (src/pages/r/agent/[call].astro); everything that changes — the record,
 * On time, calls and the shift log — comes from GET /api/air/desk?agent=<call>
 * (an AgentCard, src/lib/air.ts), read once (no polling: an agent's own
 * history does not need a 30 s refresh the way a live call does).
 */
import { AIR_CONFIG } from '../lib/air';
import type { AgentCard, ShiftDay } from '../lib/air';
import { callsLine, deskTemplate, noHumanCheckLine, onTimeLine, recordLine } from '../../functions/_lib/air-desk.mjs';

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { headers: { accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

const OUTCOME_LABEL: Record<string, string> = { filed: 'filed', gap: 'missed', waiting: 'waiting' };
/** A blocked feed (no key yet) is a house gap: it waits on the house, it is never the keeper's miss. */
const BLOCKED_LABEL = 'waits on the house';
const BADGE_LABEL: Record<string, string> = { clockwork: 'CLOCKWORK', checked: 'CHECKED' };

/** "2026-10-09: sky filed on time, tides filed, swell missed (stale)" */
function shiftRow(day: ShiftDay): string {
  const bits = day.feeds.map((f) => {
    const outcome = f.outcome === 'gap' && f.reason === 'blocked' ? BLOCKED_LABEL : OUTCOME_LABEL[f.outcome] ?? f.outcome;
    // Gap reasons read as config.desk.templates.gapReasons ("no key yet", "no shift ran"), never the raw code.
    const why = f.outcome === 'gap' && f.reason ? deskTemplate(AIR_CONFIG, `gapReasons.${f.reason}`) || f.reason : '';
    const tail = f.outcome === 'filed' && f.onTime ? ' on time' : why ? ` (${why})` : '';
    return `${f.feed} ${outcome}${tail}`;
  });
  return `${day.day}: ${bits.join(', ')}`;
}

export function mountAgentCard(call: string): void {
  const root = document.querySelector<HTMLElement>('[data-agent-card]');
  if (!root) return;
  const q = <T extends HTMLElement>(sel: string): T | null => root!.querySelector<T>(sel);
  const note = q<HTMLElement>('[data-agent-note]');
  const record = q<HTMLElement>('[data-agent-record]');
  const noCheck = q<HTMLElement>('[data-agent-nocheck]');
  const onTime = q<HTMLElement>('[data-agent-ontime]');
  const callsEl = q<HTMLElement>('[data-agent-calls]');
  const stamps = q<HTMLElement>('[data-agent-stamps]');
  const stampsEmpty = q<HTMLElement>('[data-agent-stamps-empty]');
  const log = q<HTMLElement>('[data-agent-log]');
  const logEmpty = q<HTMLElement>('[data-agent-log-empty]');

  (async () => {
    const card = await getJson<AgentCard>(`/api/air/desk?agent=${encodeURIComponent(call)}`);
    if (!card) {
      if (note) { note.textContent = 'The Desk is offline right now. This card fills in on the next successful read.'; note.hidden = false; }
      return;
    }
    // "Checked 12, overruled 3 of 15 judged." / "42 filed with no human check: Tides, Swell." /
    // "Filed 27 of 28 mornings by 6:15." / "Put out 3, answered 2, 1 checked." (config.desk.templates).
    // The On time line and the shift log only exist on the card of an agent that keeps a feed.
    if (record) record.textContent = recordLine(AIR_CONFIG, card);
    if (noCheck) {
      const line = noHumanCheckLine(AIR_CONFIG, card);
      noCheck.textContent = line;
      noCheck.hidden = !line;
    }
    if (onTime) onTime.textContent = onTimeLine(AIR_CONFIG, card);
    if (callsEl) callsEl.textContent = callsLine(AIR_CONFIG, card);
    if (stamps) {
      stamps.replaceChildren();
      for (const s of card.stamps) {
        const li = document.createElement('li');
        li.textContent = `${BADGE_LABEL[s.badge] ?? s.badge.toUpperCase()} ${s.level} · ${s.day}`;
        stamps.append(li);
      }
      if (stampsEmpty) stampsEmpty.hidden = card.stamps.length > 0;
    }
    if (log) {
      log.replaceChildren();
      for (const day of card.shiftLog) {
        const li = document.createElement('li');
        li.textContent = shiftRow(day);
        log.append(li);
      }
      if (logEmpty) logEmpty.hidden = card.shiftLog.length > 0;
    }
    if (note) note.hidden = true;
  })();
}
