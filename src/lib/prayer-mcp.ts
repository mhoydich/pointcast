/** Read only: no agent call creates an offering. */
export const PRAYER_OVERVIEW_TOOL = {
  name: 'prayer_overview',
  description: 'Read approximate counts from the linked PointCast prayer ledger and current-week drum altar ledger, separately. This is not an all-site count and does not make an offering.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
};

export async function dispatchPrayerOverview(base: string): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    // Fixed same-origin path; redirects are rejected and tool arguments cannot select a URL.
    const url = new URL('/api/prayer-overview', base);
    const response = await fetch(url, { method: 'GET', redirect: 'error', signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error('unavailable');
    const data = await response.json() as { ok?: boolean; storageAvailable?: boolean; coverage?: string; accuracy?: string; prayer?: { source: string; period: string; total: number; stationCounts: Record<string, number> }; drumAltar?: { source: string; period: string; week: number; total: number }; note?: string };
    if (!data?.ok || !data.storageAvailable || !data.prayer || !data.drumAltar) throw new Error('invalid response');
    // Whitelist overview fields; never forward upstream recent entries or identifiers.
    const { source, period, total, stationCounts } = data.prayer;
    const result = { coverage: data.coverage, accuracy: data.accuracy, prayer: { source, period, total, stationCounts }, drumAltar: { source: data.drumAltar.source, period: data.drumAltar.period, week: data.drumAltar.week, total: data.drumAltar.total }, note: data.note };
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch {
    return { content: [{ type: 'text', text: 'Prayer overview is unavailable right now.' }], isError: true };
  } finally {
    clearTimeout(timer);
  }
}
