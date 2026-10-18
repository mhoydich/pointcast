/**
 * /r/me — the house phone button (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §7.4).
 *
 * GET /api/air/house with the phone's id in the X-PC-Device header (never the
 * URL); the section shows only when the director's session says canMark.
 * Marking and Undo POST { action, device } and repaint. A phone marked as
 * house never counts in the kill test or the paper's busiest-court pick.
 */
import { deviceId } from './air-client';

const FAILED = "That didn't go through. Try again.";

export function mountAirHouse(): void {
  const root = document.querySelector<HTMLElement>('[data-air-house]');
  if (!root) return;
  const mark = root.querySelector<HTMLButtonElement>('[data-air-house-mark]');
  const marked = root.querySelector<HTMLElement>('[data-air-house-marked]');
  const undo = root.querySelector<HTMLButtonElement>('[data-air-house-undo]');
  const note = root.querySelector<HTMLElement>('[data-air-house-note]');
  if (!mark || !marked || !undo) return;

  const paint = (isMarked: boolean) => {
    mark.hidden = isMarked;
    marked.hidden = !isMarked;
    if (note) note.hidden = true;
  };
  const fail = () => {
    if (!note) return;
    note.textContent = FAILED;
    note.hidden = false;
  };

  const send = async (action: 'mark' | 'unmark') => {
    mark.disabled = true;
    undo.disabled = true;
    try {
      const res = await fetch('/api/air/house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action, device: deviceId() }),
        credentials: 'same-origin',
      });
      const body = (await res.json()) as { ok?: boolean; marked?: boolean };
      if (!res.ok || body.ok !== true || typeof body.marked !== 'boolean') return fail();
      paint(body.marked);
    } catch {
      fail();
    } finally {
      mark.disabled = false;
      undo.disabled = false;
    }
  };
  mark.addEventListener('click', () => { void send('mark'); });
  undo.addEventListener('click', () => { void send('unmark'); });

  void (async () => {
    try {
      const res = await fetch('/api/air/house', {
        headers: { 'X-PC-Device': deviceId(), Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const body = (await res.json()) as { ok?: boolean; canMark?: boolean; marked?: boolean };
      if (!res.ok || body.ok !== true || body.canMark !== true) return;
      root.hidden = false;
      paint(body.marked === true);
    } catch { /* the section stays hidden: nothing to mark without an answer */ }
  })();
}
