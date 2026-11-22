import { HEARTH_BATCH, HEARTH_DAY } from './hearth-day.mjs';

async function readJson(request, url) {
  const response = await request(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Loom read failed');
  const data = await response.json();
  if (!data.ok) throw new Error('Loom read failed');
  return { data, serverTime: Date.parse(response.headers.get('date')) };
}

export async function readHearth({ request = fetch, now } = {}) {
  const { data, serverTime } = await readJson(request, '/api/loom?compact=1');
  if (data.kvBound !== true || !Array.isArray(data.logs)) throw new Error('Room directory unavailable');
  const asOf = now ?? (Number.isFinite(serverTime) ? serverTime : Date.now());
  const since = asOf - HEARTH_DAY;
  const active = [], embers = [], unavailable = [], recent = [];
  for (const entry of data.logs) {
    if (entry.kind !== 'topic' && entry.kind !== 'handle') continue;
    const room = { address: entry.address, title: entry.title || entry.address };
    if (Date.parse(entry.updatedAt) < since) embers.push(room);
    else recent.push(room);
  }

  // Older rooms can be classified from the directory alone. Never infer warmth
  // from its last author or size a flame from a room's lifetime message count.
  let next = 0;
  async function readBatches() {
    while (next < recent.length) {
      const batch = recent.slice(next, next + HEARTH_BATCH);
      next += batch.length;
      const query = new URLSearchParams(batch.map(({ address }) => ['room', address]));
      try {
        const { data } = await readJson(request, '/api/loom-hearth?' + query);
        const byRoom = new Map(data.rooms.map(row => [row.address, row]));
        for (const room of batch) {
          const summary = byRoom.get(room.address);
          if (summary?.state === 'active') {
            active.push({ ...room, ...summary });
          } else if (summary?.state === 'quiet') embers.push(room);
          else unavailable.push(room);
        }
      } catch {
        unavailable.push(...batch);
      }
    }
  }
  await Promise.all([readBatches(), readBatches()]);
  const alphabetic = (a, b) => a.address.localeCompare(b.address);
  active.sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt) || alphabetic(a, b));
  return { asOf, since, active, embers: embers.sort(alphabetic), unavailable: unavailable.sort(alphabetic) };
}
