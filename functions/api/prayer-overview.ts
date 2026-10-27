/** Public, read-only view of two separate PointCast ledgers. */
import { onRequestGet as getPrayer, STATIONS } from './prayer';
import { onRequestGet as getAltar } from './altar';
import type { Env } from './visit';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.VISITS) return json({ ok: false, storageAvailable: false, reason: 'kv-not-bound' }, 503);
  try {
    // Call the existing readers in-process; their private recent entries are never returned.
    const [prayerResponse, altarResponse] = await Promise.all([getPrayer(context), getAltar(context)]);
    const prayer = await prayerResponse.json() as { counts: Record<string, number>; total: number };
    const altar = await altarResponse.json() as { week: number; totalThisWeek: number };
    const stationCounts = Object.fromEntries(STATIONS.map((station) => [station, prayer.counts[station] ?? 0]));
    return json({
      ok: true,
      storageAvailable: true,
      coverage: 'Only the PointCast prayer and drum altar ledgers listed here; not a count across all sites.',
      accuracy: 'Approximate: concurrent KV writes can overwrite each other and reads can lag.',
      prayer: { source: '/api/prayer', period: 'cumulative', total: prayer.total, stationCounts },
      drumAltar: { source: '/api/altar', period: 'current ISO week', week: altar.week, total: altar.totalThisWeek },
      note: 'These different periods and activities are not combined. Candle activity may also be recorded in the prayer ledger; candle totals are not added.',
    });
  } catch {
    return json({ ok: false, storageAvailable: true, reason: 'ledger-read-failed' }, 503);
  }
};
