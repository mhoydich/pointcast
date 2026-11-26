/**
 * Tide (Small Shrine 05): show the next predicted high or low at Santa Monica
 * from our own NOAA proxy (/api/tide). If NOAA does not answer, say so. Never
 * invent the water, and never present a prediction as a swim safety reading.
 */
type TidePrediction = { time: string; heightFt: number; kind: 'high' | 'low' };

export function nextTide(predictions: TidePrediction[], nowLocal: string): TidePrediction | null {
  return predictions.find((p) => p.time > nowLocal) ?? null;
}

function pacificNow(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}`;
}

function clock(time: string): string {
  const [h, m] = time.slice(11, 16).split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export async function initializeTideSignal(): Promise<void> {
  const box = document.querySelector<HTMLElement>('[data-tide-signal] [data-tide-text]');
  if (!box || box.dataset.loaded) return;
  box.dataset.loaded = '1';
  try {
    const res = await fetch('/api/tide?station=9410840', { headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.predictions)) throw new Error('no tide');
    const next = nextTide(data.predictions, pacificNow());
    if (!next) throw new Error('no upcoming tide');
    box.textContent = `Next ${next.kind} tide at Santa Monica: ${clock(next.time)}, ${next.heightFt.toFixed(1)} ft. A NOAA prediction, not a surf or swim reading.`;
  } catch {
    box.textContent = 'NOAA is not answering right now, so no tide time is shown. Nothing here is guessed.';
  }
}
