export const COFFEE_CENTER = Object.freeze({
  name: 'El Segundo City Hall', address: '350 Main St, El Segundo, CA 90245',
  latitude: 33.91992025096, longitude: -118.415864992665, radiusMiles: 25,
  precision: 'Census address interpolation; not roof-level precision',
});

export function matchesCoffee(record, filters = {}) {
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'");
  const haystack = normalize([record.name, record.city, record.address, record.type, record.summary, ...(record.tags || []), ...(record.brewMethods || []), ...(record.assortment || [])].join(' '));
  return (!filters.query || haystack.includes(normalize(filters.query.trim())))
    && (!filters.kind || (record.tags || []).includes(filters.kind))
    && record.distanceMiles <= (filters.radius ?? 25);
}

export function coffeeMapPoint(distanceMiles, bearingDegrees) {
  const radians = bearingDegrees * Math.PI / 180;
  const radius = distanceMiles / 25 * 220;
  return { x: 300 + radius * Math.sin(radians), y: 300 - radius * Math.cos(radians) };
}

// Teaching assumptions only. All labor and occupancy are included in monthly fixed costs.
// The variable share includes ingredients, packaging, payment fees and expected waste.
export function calculateCafeScenario(input) {
  const keys = ['ticket', 'orders', 'days', 'variablePercent', 'fixedCosts'];
  if (keys.some(key => !Number.isFinite(input[key]) || input[key] < 0) || input.variablePercent >= 100 || input.ticket === 0 || input.days === 0) return null;
  const sales = input.ticket * input.orders * input.days;
  const contribution = sales * (1 - input.variablePercent / 100);
  const surplus = contribution - input.fixedCosts;
  const breakEvenOrders = input.fixedCosts / (input.ticket * input.days * (1 - input.variablePercent / 100));
  return { sales, contribution, surplus, breakEvenOrders };
}
