// Pure geo helpers for the spatial kit. No DOM, no three.js, so they run in Node.
// Spherical Earth, mean radius (IUGG R1). Good to about 0.5 % for distances.

export const EARTH_RADIUS_M = 6371008.8;
const RAD = Math.PI / 180;

/**
 * Great-circle distance (haversine) and initial bearing from origin to point.
 * @param {{lat:number, lon:number}} origin
 * @param {{lat:number, lon:number}} point
 * @returns {{bearingDeg:number, meters:number}} bearing 0 = north, clockwise, [0, 360)
 */
export function bearingDistance(origin, point) {
  const p1 = origin.lat * RAD, p2 = point.lat * RAD;
  const dp = p2 - p1;
  const dl = (point.lon - origin.lon) * RAD;
  const s = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const meters = 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(s)));
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  let bearingDeg = meters === 0 ? 0 : Math.atan2(y, x) / RAD;
  bearingDeg = ((bearingDeg % 360) + 360) % 360;
  return { bearingDeg, meters };
}

/**
 * Map a lat/lon to scene metres around origin: +x east, -z north.
 * @param {(m:number)=>number} [scaleFn] compresses distance, default identity
 * @returns {{x:number, z:number}}
 */
export function geoToLocal(origin, point, scaleFn) {
  const { bearingDeg, meters } = bearingDistance(origin, point);
  const d = typeof scaleFn === 'function' ? scaleFn(meters) : meters;
  const b = bearingDeg * RAD;
  return { x: d * Math.sin(b), z: -d * Math.cos(b) };
}

/**
 * Build a scale function for geo layout. maxMeters is the largest real distance,
 * maxRadius the scene radius it maps to.
 * @param {'linear'|'sqrt'|'log'} type
 */
export function makeGeoScale(type, maxMeters, maxRadius) {
  const M = Math.max(1, maxMeters), R = maxRadius;
  if (type === 'sqrt') return (m) => (Math.sqrt(m) / Math.sqrt(M)) * R;
  if (type === 'log') return (m) => (Math.log1p(m) / Math.log1p(M)) * R;
  return (m) => (m / M) * R;
}
