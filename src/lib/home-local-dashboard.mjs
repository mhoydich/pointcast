/** Presentation adapters for the homepage's existing public local feeds. */
export function localDashboardDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function upcomingLocalMatch(matches = [], now = new Date()) {
  const day = localDashboardDay(now);
  return [...matches].filter(match => /^\d{4}-\d{2}-\d{2}$/.test(match.date) && match.date >= day)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

export function nearbyNeighborhoods(neighborhoods = [], radius = 25) {
  const limit = [5, 10, 25].includes(Number(radius)) ? Number(radius) : 25;
  return neighborhoods.filter(place => Number.isFinite(place.distance) && place.distance >= 0 && place.distance <= limit)
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name));
}

export function localWeatherSummary(report, now = new Date()) {
  const metrics = report?.topic === 'air' && Array.isArray(report.metrics) ? report.metrics : [];
  const read = (id, unit, min, max) => {
    const metric = metrics.find(item => item.id === id && item.source === 'nws-klax' && item.unit === unit);
    const at = Date.parse(metric?.valid_at);
    if (!metric || !['available', 'stale'].includes(metric.status) || typeof metric.value !== 'number'
      || !Number.isFinite(metric.value) || metric.value < min || metric.value > max
      || !Number.isFinite(at) || at > now.getTime() + 300_000) return null;
    return { value: metric.value, at: new Date(at).toISOString(), stale: metric.status === 'stale' || now.getTime() - at > 7_200_000 };
  };
  const temperature = read('temperature', '°C', -90, 60);
  const wind = read('wind', 'km/h', 0, 400);
  const humidity = read('humidity', '%', 0, 100);
  const observed = [temperature, wind, humidity].filter(Boolean);
  return {
    temperatureF: temperature ? Math.round(temperature.value * 9 / 5 + 32) : null,
    windMph: wind ? Math.round(wind.value / 1.609344) : null,
    humidity: humidity ? Math.round(humidity.value) : null,
    observedAt: observed.length ? observed.map(metric => metric.at).sort()[0] : null,
    status: !observed.length ? 'unavailable' : observed.some(metric => metric.stale) ? 'stale' : observed.length < 3 ? 'partial' : 'available',
  };
}
