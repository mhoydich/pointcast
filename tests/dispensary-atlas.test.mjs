import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EARTH_RADIUS_MILES, haversineMiles, geodesicMiles, boundaryPoint, projectPoint,
  filterStores, filterProducts, readFilters, writeFilters,
} from '../src/lib/dispensary-atlas.mjs';

const center = Object.freeze({ lat: 33.91992025096, lon: -118.415864992665 });
const near = boundaryPoint(center, 42, 3);
const onBoundary = boundaryPoint(center, 225, 25);
const outside = boundaryPoint(center, 90, 25.00001);
const stores = Object.freeze([
  Object.freeze({ id: 'near', name: 'Café Coastal', address: '123 Ocean Avenue', jurisdiction: 'Los Angeles', format: 'storefront', licenseStatus: 'Active', licenseNumber: 'C10-0000123-LIC', ...near }),
  Object.freeze({ id: 'boundary', name: 'Boundary Delivery', address: '45 North Street', jurisdiction: 'Torrance', format: 'delivery', licenseStatus: 'Unverified', licenseNumber: '', ...onBoundary }),
  Object.freeze({ id: 'outside', name: 'Outside Coastal', address: '9 Far Street', jurisdiction: 'Los Angeles', format: 'storefront', licenseStatus: 'Active', licenseNumber: 'C10-0000999-LIC', ...outside }),
]);
const products = Object.freeze([
  Object.freeze({ id: 'p1', name: 'Café Gummies — Pineapple', brand: 'Coastal', category: 'Edible', storeId: 'near' }),
  Object.freeze({ id: 'p2', name: 'Northern Flower', brand: 'Harbor', category: 'Flower', storeId: 'boundary' }),
  Object.freeze({ id: 'p3', name: 'Ｐｉｎｅａｐｐｌｅ Cartridge', brand: 'Coastal', category: 'Vape', storeId: 'near' }),
]);

function close(actual, expected, tolerance = 1e-7) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
}

test('haversine has correct spherical reference distances, symmetry, and antimeridian behavior', () => {
  assert.equal(haversineMiles(center, center), 0);
  close(haversineMiles({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }), EARTH_RADIUS_MILES * Math.PI / 180);
  close(haversineMiles({ lat: 0, lon: 0 }, { lat: 0, lon: 180 }), EARTH_RADIUS_MILES * Math.PI);
  close(haversineMiles({ lat: 0, lon: 179.9 }, { lat: 0, lon: -179.9 }), EARTH_RADIUS_MILES * Math.PI / 900);
  close(haversineMiles(center, near), haversineMiles(near, center));
});

test('WGS84 equatorial distance matches the analytic semimajor-axis arc and differs from a sphere', () => {
  const from = { lat: 0, lon: 0 };
  const to = { lat: 0, lon: 1 };
  close(geodesicMiles(from, to), 6378137 * Math.PI / 180 / 1609.344, 1e-9);
  assert.ok(Math.abs(geodesicMiles(from, to) - haversineMiles(from, to)) > 0.05);
  assert.equal(geodesicMiles(center, center), 0);
  close(geodesicMiles(center, near), geodesicMiles(near, center), 1e-9);
});

test('WGS84 inverse agrees with an independently generated GeographicLib 2.1 reference', () => {
  // GeographicLib.WGS84.Inverse(33.91992025096, -118.415864992665, 34.05, -118.25).
  // Reference generation: https://geographiclib.sourceforge.io/scripts/geod-calc.html
  const destination = { lat: 34.05, lon: -118.25 };
  close(geodesicMiles(center, destination), 21049.396543490948 / 1609.344, 1e-9);
});

test('25-mile WGS84 cardinal boundaries agree with independent GeographicLib direct references', () => {
  // GeographicLib 2.1 WGS84.Direct from the declared center, 40233.6 meters.
  const reference = [
    { lat: 34.28263274710092, lon: -118.415864992665 },
    { lat: 33.919151720188644, lon: -117.9807751771598 },
    { lat: 33.55718635532394, lon: -118.415864992665 },
    { lat: 33.919151720188644, lon: -118.85095480817021 },
  ];
  for (let i = 0; i < reference.length; i++) {
    const calculated = boundaryPoint(center, i * 90, 25);
    close(calculated.lat, reference[i].lat, 1e-10);
    close(calculated.lon, reference[i].lon, 1e-10);
    close(geodesicMiles(center, reference[i]), 25, 1e-9);
    assert.equal(projectPoint(reference[i], center).inRadius, true);
    assert.equal(filterStores([{ id: 'reference', ...reference[i] }], {}, center).length, 1);
  }
});

test('malformed geocodes are rejected rather than becoming zero-distance points', () => {
  for (const point of [null, {}, { lat: '', lon: 0 }, { lat: '0', lon: 0 }, { lat: NaN, lon: 0 }, { lat: 0, lon: Infinity }, { lat: 91, lon: 0 }, { lat: 0, lon: -181 }]) {
    assert.ok(Number.isNaN(haversineMiles(center, point)));
    assert.ok(Number.isNaN(geodesicMiles(center, point)));
    assert.equal(projectPoint(point, center), null);
    assert.deepEqual(filterStores([{ id: 'bad', ...point }], {}, center), []);
  }
  assert.ok(Number.isNaN(haversineMiles(null, center)));
  assert.deepEqual(filterStores(stores, {}, null), []);
  assert.deepEqual(filterStores(stores, {}, center, -1), []);
  assert.equal(boundaryPoint(null, 0, 25), null);
  assert.equal(boundaryPoint(center, NaN, 25), null);
  assert.equal(boundaryPoint(center, 0, -1), null);
});

test('boundary points round-trip distance and projection with north-up cardinal directions', () => {
  const size = 760;
  const extent = size * 0.43;
  const expected = [[380, 380 - extent], [380 + extent, 380], [380, 380 + extent], [380 - extent, 380]];
  for (let i = 0; i < 4; i++) {
    const destination = boundaryPoint(center, i * 90, 25);
    close(geodesicMiles(center, destination), 25);
    const point = projectPoint(destination, center);
    close(point.x, expected[i][0]);
    close(point.y, expected[i][1]);
    assert.equal(point.inRadius, true);
    close(((point.bearingDegrees - i * 90 + 540) % 360) - 180, 0);
  }
  assert.deepEqual(projectPoint(center, center), { x: 380, y: 380, distanceMiles: 0, bearingDegrees: 0, inRadius: true });
  const far = projectPoint(boundaryPoint(center, 90, 50), center);
  close(far.x, 380 + extent * 2);
  assert.equal(far.inRadius, false);
  assert.equal(projectPoint(center, center, 0), null);
  assert.equal(projectPoint(center, center, 25, 0), null);
});

test('destinations remain valid across the antimeridian and from near a pole', () => {
  for (const origin of [{ lat: 0, lon: 179.99 }, { lat: 89.99, lon: 40 }]) {
    const point = boundaryPoint(origin, 90, 25);
    assert.ok(point.lon >= -180 && point.lon <= 180);
    close(geodesicMiles(origin, point), 25);
  }
});

test('store search includes the 25-mile boundary, excludes beyond it, and uses actual geodesic distance', () => {
  assert.deepEqual(filterStores(stores, {}, center).map((store) => store.id), ['near', 'boundary']);
  assert.deepEqual(filterStores(stores, { q: 'coastal' }, center).map((store) => store.id), ['near']);
  assert.deepEqual(filterStores(stores, { q: 'OCEAN AVENUE' }, center).map((store) => store.id), ['near']);
  assert.deepEqual(filterStores(stores, { q: '0000123' }, center).map((store) => store.id), ['near']);
  assert.deepEqual(filterStores(stores, { q: 'café' }, center).map((store) => store.id), ['near']);
  assert.deepEqual(filterStores(stores, { jurisdiction: 'Torrance', format: 'delivery', status: 'Unverified' }, center).map((store) => store.id), ['boundary']);
  assert.deepEqual(filterStores(stores, { jurisdiction: 'torrance' }, center), []);
  assert.deepEqual(filterStores(stores, {}, center, 2), []);
  assert.deepEqual(filterStores([{ ...center, id: 'center' }, { ...near, id: 'near' }], {}, center, 0).map((store) => store.id), ['center']);
});

test('product search normalizes case and Unicode while selectors match exactly', () => {
  assert.deepEqual(filterProducts(products, { q: 'pineapple' }).map((product) => product.id), ['p1', 'p3']);
  assert.deepEqual(filterProducts(products, { q: 'ＣＡＦÉ' }).map((product) => product.id), ['p1']);
  assert.deepEqual(filterProducts(products, { q: 'harbor' }).map((product) => product.id), ['p2']);
  assert.deepEqual(filterProducts(products, { q: 'edible' }).map((product) => product.id), ['p1']);
  assert.deepEqual(filterProducts(products, { brand: 'Coastal', category: 'Vape', store: 'near' }).map((product) => product.id), ['p3']);
  assert.deepEqual(filterProducts(products, { brand: 'coastal' }), []);
  assert.deepEqual(filterProducts(products, { store: 'unknown' }), []);
});

test('reading filter state allows only known selectors and ignores unrelated parameters', () => {
  const params = new URLSearchParams('q=+Caf%C3%A9+&jurisdiction=Torrance&format=delivery&status=Active&pq=gummies&brand=Coastal&category=Flower&store=near&redirect=https%3A%2F%2Fevil.test');
  assert.deepEqual(readFilters(params, { stores, products }), {
    q: 'Café', jurisdiction: 'Torrance', format: 'delivery', status: 'Active', pq: 'gummies', brand: 'Coastal', category: 'Flower', store: 'near',
  });
  const unknown = readFilters(new URLSearchParams('jurisdiction=unknown&format=storefront&status=active&brand=coastal&category=Unknown&store=bad'), { stores, products });
  assert.deepEqual(unknown, { q: '', jurisdiction: '', format: 'storefront', status: 'Active', pq: '', brand: '', category: '', store: '' });
  assert.deepEqual(readFilters(null), { q: '', jurisdiction: '', format: '', status: 'Active', pq: '', brand: '', category: '', store: '' });
});

test('readFilters accepts explicit allowed arrays/Sets and plural aliases', () => {
  const state = readFilters(new URLSearchParams('jurisdiction=Custom&brand=Rare&store=special&format=delivery&status=Active&category=Oil'), {
    jurisdictions: ['Custom'], brand: new Set(['Rare']), storeIds: ['special'], formats: ['delivery'], statuses: ['Active'], categories: ['Oil'],
  });
  assert.equal(state.jurisdiction, 'Custom');
  assert.equal(state.brand, 'Rare');
  assert.equal(state.store, 'special');
  assert.equal(state.category, 'Oil');
});

test('shared queries encode markup, ampersands, Unicode, and retain only whitelisted keys', () => {
  const literal = '<img src=x onerror=alert(1)> Café & “Flower” # 🌿';
  const original = Object.freeze({ q: literal, pq: '雪+花', jurisdiction: 'Los Angeles', store: 'near', unrelated: 'inject', __proto__: null });
  const query = writeFilters(original);
  assert.ok(!query.includes('<'));
  assert.ok(!query.includes('>'));
  assert.ok(!query.includes('unrelated'));
  assert.equal(new URLSearchParams(query).get('q'), literal);
  assert.deepEqual(readFilters(new URLSearchParams(query), { stores, products }), {
    q: literal, jurisdiction: 'Los Angeles', format: '', status: 'Active', pq: '雪+花', brand: '', category: '', store: 'near',
  });
  assert.equal(writeFilters({ pq: 'b', q: 'a', unknown: 'c' }), 'q=a&pq=b');
});

test('share-state values have code-point limits, no control characters, and stable empty handling', () => {
  const query = writeFilters({ q: `\u0000 ${'🌿'.repeat(200)}\n`, pq: 123, store: 'x'.repeat(120), status: undefined });
  const parsed = new URLSearchParams(query);
  assert.equal(Array.from(parsed.get('q')).length, 160);
  assert.equal(parsed.get('store').length, 96);
  assert.equal(parsed.has('pq'), false);
  assert.equal(writeFilters(null), '');
  assert.equal(writeFilters({ q: ' \t\n ' }), '');
  const state = readFilters(new URLSearchParams(`q=${'a'.repeat(200)}&q=second&store=not-allowed`), { stores, products });
  assert.equal(state.q.length, 160);
  assert.equal(state.store, '');
});

test('default status is Active, history requires explicit all, and known manual status remains exact', () => {
  const active = readFilters(new URLSearchParams(), { stores, products });
  assert.equal(active.status, 'Active');
  assert.deepEqual(filterStores(stores, active, center).map((store) => store.id), ['near']);
  const history = readFilters(new URLSearchParams('status=all'), { stores, products });
  assert.equal(history.status, 'all');
  assert.deepEqual(filterStores(stores, history, center).map((store) => store.id), ['near', 'boundary']);
  assert.equal(readFilters(new URLSearchParams(writeFilters(history)), { stores, products }).status, 'all');
  const manual = readFilters(new URLSearchParams('status=Unverified'), { stores, products });
  assert.deepEqual(filterStores(stores, manual, center).map((store) => store.id), ['boundary']);
  assert.equal(readFilters(new URLSearchParams('status=Suspended'), { statuses: ['Suspended'] }).status, 'Suspended');
  assert.equal(readFilters(new URLSearchParams('status=unknown'), { stores, products }).status, 'Active');
});

test('Vincenty failure near antipodes yields NaN/null and never silently falls back to haversine', () => {
  const origin = { lat: 0, lon: 0 };
  const antipode = { lat: 0, lon: 180 };
  assert.ok(Number.isFinite(haversineMiles(origin, antipode)));
  assert.ok(Number.isNaN(geodesicMiles(origin, antipode)));
  assert.equal(projectPoint(antipode, origin), null);
  assert.deepEqual(filterStores([{ id: 'antipode', ...antipode }], {}, origin, 20000), []);
});

test('functions have no input mutation, sorting, or global side effects', () => {
  const beforeStores = JSON.stringify(stores);
  const beforeProducts = JSON.stringify(products);
  const params = new URLSearchParams('brand=Coastal&unknown=retained');
  const beforeParams = params.toString();
  const beforeGlobals = Reflect.ownKeys(globalThis);
  filterStores(stores, {}, center);
  filterProducts(products, { brand: 'Coastal' });
  readFilters(params, { stores, products });
  writeFilters(Object.freeze({ q: 'coastal' }));
  assert.equal(JSON.stringify(stores), beforeStores);
  assert.equal(JSON.stringify(products), beforeProducts);
  assert.equal(params.toString(), beforeParams);
  assert.deepEqual(Reflect.ownKeys(globalThis), beforeGlobals);
  assert.strictEqual(filterStores(stores, {}, center)[0], stores[0]);
  assert.strictEqual(filterProducts(products, {})[0], products[0]);
});
