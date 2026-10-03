/** Pure map geometry, evidence filters, and shareable state for the atlas. */
export const EARTH_RADIUS_MILES = 3958.7613;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const WGS84_A = 6378137;
const WGS84_F = 1 / 298.257223563;
const WGS84_B = (1 - WGS84_F) * WGS84_A;
const METERS_PER_MILE = 1609.344;
const VINCENTY_TOLERANCE = 1e-12;
const VINCENTY_ITERATIONS = 200;
const RADIUS_EPSILON_MILES = 1e-8;
const FILTER_KEYS = Object.freeze(['q', 'jurisdiction', 'format', 'status', 'pq', 'brand', 'category', 'store']);
const QUERY_KEYS = new Set(['q', 'pq']);
const QUERY_LIMIT = 160;
const SELECTOR_LIMIT = 96;

function validCoordinate(point) {
  return point !== null && typeof point === 'object'
    && typeof point.lat === 'number' && Number.isFinite(point.lat)
    && typeof point.lon === 'number' && Number.isFinite(point.lon)
    && point.lat >= -90 && point.lat <= 90
    && point.lon >= -180 && point.lon <= 180;
}

function validRadius(radius) {
  return typeof radius === 'number' && Number.isFinite(radius) && radius >= 0;
}

function insideRadius(distance, radius) {
  // Floating-point error in points constructed on the boundary must not exclude them.
  return Number.isFinite(distance) && distance <= radius + RADIUS_EPSILON_MILES;
}

function textValue(value) {
  return typeof value === 'string' ? value : '';
}

function searchText(value) {
  return textValue(value).normalize('NFKC').toLowerCase();
}

function cleanValue(value, limit) {
  // Keep text as text. URLSearchParams encodes markup; the UI must render with textContent.
  return Array.from(textValue(value).replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim()).slice(0, limit).join('');
}

/** Spherical approximation only; atlas radius decisions use geodesicMiles instead. */
export function haversineMiles(center, point) {
  if (!validCoordinate(center) || !validCoordinate(point)) return Number.NaN;
  const latitudeDelta = (point.lat - center.lat) * RAD;
  const longitudeDelta = (point.lon - center.lon) * RAD;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(center.lat * RAD) * Math.cos(point.lat * RAD) * Math.sin(longitudeDelta / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(Math.min(1, Math.max(0, a))), Math.sqrt(Math.max(0, 1 - a)));
}

function vincentySeries(cosSquaredAlpha) {
  const uSquared = cosSquaredAlpha * (WGS84_A ** 2 - WGS84_B ** 2) / WGS84_B ** 2;
  return {
    A: 1 + uSquared / 16384 * (4096 + uSquared * (-768 + uSquared * (320 - 175 * uSquared))),
    B: uSquared / 1024 * (256 + uSquared * (-128 + uSquared * (74 - 47 * uSquared))),
  };
}

function sigmaCorrection(B, sinSigma, cosSigma, cosTwoSigmaM) {
  return B * sinSigma * (cosTwoSigmaM + B / 4 * (
    cosSigma * (-1 + 2 * cosTwoSigmaM ** 2)
    - B / 6 * cosTwoSigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cosTwoSigmaM ** 2)
  ));
}

/** Vincenty inverse on WGS84, matching the registry's constants and iteration tolerance. */
function inverseWgs84(center, point) {
  if (!validCoordinate(center) || !validCoordinate(point)) return null;
  if (center.lat === point.lat && center.lon === point.lon) return { distanceMiles: 0, bearingDegrees: 0 };
  const U1 = Math.atan((1 - WGS84_F) * Math.tan(center.lat * RAD));
  const U2 = Math.atan((1 - WGS84_F) * Math.tan(point.lat * RAD));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);
  const L = (((point.lon - center.lon + 540) % 360) - 180) * RAD;
  let lambda = L;
  let sinLambda;
  let cosLambda;
  let sinSigma;
  let cosSigma;
  let sigma;
  let sinAlpha;
  let cosSquaredAlpha;
  let cosTwoSigmaM;
  let converged = false;
  for (let iteration = 0; iteration < VINCENTY_ITERATIONS; iteration++) {
    sinLambda = Math.sin(lambda);
    cosLambda = Math.cos(lambda);
    sinSigma = Math.hypot(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda);
    if (sinSigma === 0) return { distanceMiles: 0, bearingDegrees: 0 };
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSquaredAlpha = Math.max(0, 1 - sinAlpha ** 2);
    cosTwoSigmaM = cosSquaredAlpha > 1e-15 ? cosSigma - 2 * sinU1 * sinU2 / cosSquaredAlpha : 0;
    const C = WGS84_F / 16 * cosSquaredAlpha * (4 + WGS84_F * (4 - 3 * cosSquaredAlpha));
    const previousLambda = lambda;
    lambda = L + (1 - C) * WGS84_F * sinAlpha * (sigma + C * sinSigma * (
      cosTwoSigmaM + C * cosSigma * (-1 + 2 * cosTwoSigmaM ** 2)
    ));
    if (Math.abs(lambda - previousLambda) < VINCENTY_TOLERANCE) {
      converged = true;
      break;
    }
  }
  // Vincenty can fail near antipodes. Do not silently substitute a spherical distance.
  if (!converged) return null;
  const { A, B } = vincentySeries(cosSquaredAlpha);
  const correction = sigmaCorrection(B, sinSigma, cosSigma, cosTwoSigmaM);
  const distanceMiles = WGS84_B * A * (sigma - correction) / METERS_PER_MILE;
  const bearingDegrees = (Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * DEG + 360) % 360;
  return Number.isFinite(distanceMiles) && Number.isFinite(bearingDegrees) ? { distanceMiles, bearingDegrees } : null;
}

/** WGS84 ellipsoidal distance in miles; invalid input or nonconvergence yields NaN. */
export function geodesicMiles(center, point) {
  return inverseWgs84(center, point)?.distanceMiles ?? Number.NaN;
}

/**
 * Radial projection of WGS84 ellipsoidal distance/bearing, north up and east right.
 * The radius circle is centered in the square and occupies 43% of its size.
 * Points outside the radius retain their actual distance; they are not clamped.
 * Returns null for malformed inputs or a nonpositive map radius/size.
 */
export function projectPoint(point, center, radiusMiles = 25, size = 760) {
  if (!validCoordinate(center) || !validCoordinate(point)
    || !validRadius(radiusMiles) || radiusMiles === 0
    || typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return null;
  const inverse = inverseWgs84(center, point);
  if (!inverse) return null;
  const { distanceMiles, bearingDegrees } = inverse;
  const mapDistance = distanceMiles / radiusMiles * size * 0.43;
  const bearing = bearingDegrees * RAD;
  return {
    x: size / 2 + Math.sin(bearing) * mapDistance,
    y: size / 2 - Math.cos(bearing) * mapDistance,
    distanceMiles,
    bearingDegrees,
    inRadius: insideRadius(distanceMiles, radiusMiles),
  };
}

/** WGS84 Vincenty direct destination, useful for drawing or testing the radius boundary. */
export function boundaryPoint(center, bearing, distanceMiles) {
  if (!validCoordinate(center) || typeof bearing !== 'number' || !Number.isFinite(bearing)
    || !validRadius(distanceMiles)) return null;
  if (distanceMiles === 0) return { lat: center.lat, lon: center.lon };
  const tanU1 = (1 - WGS84_F) * Math.tan(center.lat * RAD);
  const cosU1 = 1 / Math.sqrt(1 + tanU1 ** 2);
  const sinU1 = tanU1 * cosU1;
  const direction = bearing * RAD;
  const sinDirection = Math.sin(direction);
  const cosDirection = Math.cos(direction);
  const sigma1 = Math.atan2(tanU1, cosDirection);
  const sinAlpha = cosU1 * sinDirection;
  const cosSquaredAlpha = Math.max(0, 1 - sinAlpha ** 2);
  const { A, B } = vincentySeries(cosSquaredAlpha);
  const sigmaBase = distanceMiles * METERS_PER_MILE / (WGS84_B * A);
  let sigma = sigmaBase;
  let converged = false;
  for (let iteration = 0; iteration < VINCENTY_ITERATIONS; iteration++) {
    const correction = sigmaCorrection(B, Math.sin(sigma), Math.cos(sigma), Math.cos(2 * sigma1 + sigma));
    const previousSigma = sigma;
    sigma = sigmaBase + correction;
    if (Math.abs(sigma - previousSigma) < VINCENTY_TOLERANCE) {
      converged = true;
      break;
    }
  }
  if (!converged) return null;
  const sinSigma = Math.sin(sigma);
  const cosSigma = Math.cos(sigma);
  const cosTwoSigmaM = Math.cos(2 * sigma1 + sigma);
  const temporary = sinU1 * sinSigma - cosU1 * cosSigma * cosDirection;
  const destinationLatitude = Math.atan2(
    sinU1 * cosSigma + cosU1 * sinSigma * cosDirection,
    (1 - WGS84_F) * Math.hypot(sinAlpha, temporary),
  );
  const lambda = Math.atan2(sinSigma * sinDirection, cosU1 * cosSigma - sinU1 * sinSigma * cosDirection);
  const C = WGS84_F / 16 * cosSquaredAlpha * (4 + WGS84_F * (4 - 3 * cosSquaredAlpha));
  const L = lambda - (1 - C) * WGS84_F * sinAlpha * (sigma + C * sinSigma * (
    cosTwoSigmaM + C * cosSigma * (-1 + 2 * cosTwoSigmaM ** 2)
  ));
  const destinationLongitude = center.lon * RAD + L;
  return { lat: destinationLatitude * DEG, lon: ((destinationLongitude * DEG + 540) % 360) - 180 };
}

/** Store filters preserve input order and objects, and always enforce the geodesic radius. */
export function filterStores(stores, { q = '', jurisdiction = '', format = '', status = '' } = {}, center, radius = 25) {
  if (!Array.isArray(stores) || !validCoordinate(center) || !validRadius(radius)) return [];
  const query = searchText(q).trim();
  return stores.filter((store) => {
    if (store === null || typeof store !== 'object') return false;
    if (!insideRadius(geodesicMiles(center, store), radius)) return false;
    if (jurisdiction && store.jurisdiction !== jurisdiction) return false;
    if (format && store.format !== format) return false;
    if (status && status !== 'all' && store.licenseStatus !== status) return false;
    return !query || [store.name, store.address, store.licenseNumber].some((value) => searchText(value).includes(query));
  });
}

/** Only supplied product observations are searched; selectors are exact and case-sensitive. */
export function filterProducts(products, { q = '', brand = '', category = '', store = '' } = {}) {
  if (!Array.isArray(products)) return [];
  const query = searchText(q).trim();
  return products.filter((product) => {
    if (product === null || typeof product !== 'object') return false;
    if (brand && product.brand !== brand) return false;
    if (category && product.category !== category) return false;
    if (store && product.storeId !== store) return false;
    return !query || [product.name, product.brand, product.category].some((value) => searchText(value).includes(query));
  });
}

function selectorValues(allowed, key) {
  const aliases = { jurisdiction: 'jurisdictions', format: 'formats', status: 'statuses', brand: 'brands', category: 'categories', store: 'storeIds' };
  const explicit = allowed[key] ?? allowed[aliases[key]];
  if (Array.isArray(explicit) || explicit instanceof Set) return new Set(Array.from(explicit).filter((value) => typeof value === 'string'));
  const stores = Array.isArray(allowed.stores) ? allowed.stores : [];
  const products = Array.isArray(allowed.products) ? allowed.products : [];
  const storeField = { jurisdiction: 'jurisdiction', format: 'format', status: 'licenseStatus', store: 'id' }[key];
  const productField = { brand: 'brand', category: 'category', store: 'storeId' }[key];
  return new Set([
    ...(storeField ? stores.map((item) => item?.[storeField]) : []),
    ...(productField ? products.map((item) => item?.[productField]) : []),
  ].filter((value) => typeof value === 'string'));
}

/**
 * Read all eight filter keys, discarding unknown selectors and unrelated URL parameters.
 * Allowed values can be explicit arrays/Sets keyed by selector, or { stores, products }.
 * Missing/unknown status defaults to Active; explicit status=all requests all history.
 */
export function readFilters(params, allowed = {}) {
  const source = params instanceof URLSearchParams ? params : new URLSearchParams();
  const choices = allowed !== null && typeof allowed === 'object' ? allowed : {};
  return Object.fromEntries(FILTER_KEYS.map((key) => {
    const value = cleanValue(source.get(key), QUERY_KEYS.has(key) ? QUERY_LIMIT : SELECTOR_LIMIT);
    if (key === 'status') return [key, value === 'all' || value === 'Active' || (value && selectorValues(choices, key).has(value)) ? value : 'Active'];
    return [key, QUERY_KEYS.has(key) || selectorValues(choices, key).has(value) ? value : ''];
  }));
}

/** Produce a deterministic URL-encoded query string, omitting empty or unrelated values. */
export function writeFilters(state = {}) {
  const source = state !== null && typeof state === 'object' ? state : {};
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = cleanValue(source[key], QUERY_KEYS.has(key) ? QUERY_LIMIT : SELECTOR_LIMIT);
    if (value) params.set(key, value);
  }
  return params.toString();
}
