/**
 * /r/how — the live kill-test count (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §7.5).
 *
 * Reads GET /api/air/killtest and prints countLine(); from Sat Oct 24 (the
 * API says `final`) the read-out line goes above it. The count shows "—"
 * until the API answers: never made-up zeros. Numbers only.
 */
import { countLine, readLine } from '../../functions/_lib/air-killtest.mjs';

const UNAVAILABLE = 'The count is not available right now.';

type Count = { ok: boolean; reports: number; people: number; pass: boolean; final: boolean };

function isCount(v: unknown): v is Count {
  const c = v as Partial<Count> | null;
  return Boolean(c) && c!.ok === true && Number.isFinite(c!.reports) && Number.isFinite(c!.people) && typeof c!.pass === 'boolean' && typeof c!.final === 'boolean';
}

export function mountAirHow(): void {
  const root = document.querySelector<HTMLElement>('[data-air-how-count]');
  if (!root) return;
  const line = root.querySelector<HTMLElement>('[data-air-how-line]');
  const read = root.querySelector<HTMLElement>('[data-air-how-read]');
  if (!line) return;

  const failed = () => {
    line.textContent = UNAVAILABLE;
    if (read) read.hidden = true;
  };
  void (async () => {
    try {
      const res = await fetch('/api/air/killtest', { headers: { Accept: 'application/json' } });
      const body: unknown = await res.json();
      if (!res.ok || !isCount(body)) return failed();
      const readout = readLine(body) as string;
      if (read) {
        read.textContent = readout;
        read.hidden = readout === '';
      }
      line.textContent = countLine(body) as string;
    } catch {
      failed();
    }
  })();
}
