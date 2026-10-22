/** Keep missing rankings distinct from measured zero traffic. */
export function measuredPages(snapshot) {
  const period = snapshot?.period;
  if (!period?.start || !period?.end || !Number.isFinite(Date.parse(period.start))
    || !Number.isFinite(Date.parse(period.end)) || period.start > period.end) return [];
  return (snapshot.pages || []).filter(row => {
    try {
      const url = new URL(row.url);
      return url.origin === 'https://pointcast.xyz' && !url.username && !url.password
        && typeof row.title === 'string' && row.title.trim().length > 0
        && Number.isInteger(row.clicks) && row.clicks >= 0
        && Number.isInteger(row.impressions) && row.impressions > 0
        && row.clicks <= row.impressions
        && Number.isFinite(row.position) && row.position >= 1;
    } catch { return false; }
  });
}

export function rankPages(snapshot, metric = 'clicks') {
  const key = ['clicks', 'impressions', 'position'].includes(metric) ? metric : 'clicks';
  return [...measuredPages(snapshot)].sort((a, b) =>
    (key === 'position' ? a[key] - b[key] : b[key] - a[key])
    || b.impressions - a.impressions || a.url.localeCompare(b.url));
}
