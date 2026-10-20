import test from 'node:test';
import assert from 'node:assert/strict';
import { localWeatherSummary, nearbyNeighborhoods, upcomingLocalMatch } from '../src/lib/home-local-dashboard.mjs';

const now = new Date('2026-10-20T20:00:00Z');
const metric = (id, value, unit, overrides = {}) => ({ id, value, unit, source: 'nws-klax', status: 'available', valid_at: '2026-10-20T19:45:00Z', ...overrides });
test('weather preserves missing values and converts actual measurements', () => {
  const summary = localWeatherSummary({ topic: 'air', metrics: [metric('temperature', 0, '°C'), metric('wind', 16.09344, 'km/h'), metric('humidity', null, '%')] }, now);
  assert.equal(summary.temperatureF, 32);
  assert.equal(summary.windMph, 10);
  assert.equal(summary.humidity, null);
  assert.equal(summary.status, 'partial');
  assert.equal(localWeatherSummary(null, now).status, 'unavailable');
});
test('weather rejects wrong sources, units, future observations and non-numbers', () => {
  for (const overrides of [{ source: 'airnow' }, { unit: '°F' }, { valid_at: '2026-10-21T00:00:00Z' }, { value: '20' }, { value: null }, { value: NaN }]) {
    assert.equal(localWeatherSummary({ topic: 'air', metrics: [metric('temperature', 20, '°C', overrides)] }, now).temperatureF, null);
  }
});
test('weather marks old cached data stale rather than current', () => {
  const summary = localWeatherSummary({ topic: 'air', metrics: [metric('temperature', 20, '°C', { valid_at: '2026-10-20T16:00:00Z' })] }, now);
  assert.equal(summary.temperatureF, 68);
  assert.equal(summary.status, 'stale');
});
test('radius filter includes boundaries and sorts a copy', () => {
  const places = [{ name: 'B', distance: 5 }, { name: 'A', distance: 0 }, { name: 'C', distance: 11 }, { name: 'Invalid', distance: -1 }];
  assert.deepEqual(nearbyNeighborhoods(places, 5).map(p => p.name), ['A', 'B']);
  assert.equal(places[0].name, 'B');
  assert.equal(nearbyNeighborhoods(places, 10).length, 2);
});
test('upcoming match follows Pacific date and expires old fixtures', () => {
  const matches = [{ date: '2026-10-21' }, { date: '2026-10-20' }, { date: '2026-10-19' }];
  assert.equal(upcomingLocalMatch(matches, new Date('2026-10-21T01:00:00Z')).date, '2026-10-20');
  assert.equal(upcomingLocalMatch(matches, new Date('2026-10-22T12:00:00Z')), null);
});
