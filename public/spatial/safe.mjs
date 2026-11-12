// safe.mjs: DOM-free, three-free helpers for the spatial kit (runs under plain `node --test`).
// safeUrl: which manifest URLs may become links. validateManifest: shape checks. layoutPlaces: slots.

import { bearingDistance, geoToLocal, makeGeoScale } from './geo.mjs';

const RAD = Math.PI / 180;
const isObj = (v) => v !== null && typeof v === 'object';

/**
 * Accept only http: and https: URLs, and relative URLs (they resolve against `base`).
 * Everything else returns null: javascript:, data:, vbscript:, blob:, file:, mailto:, unparsable
 * strings, and relative URLs when there is no base. The WHATWG URL parser strips leading spaces and
 * control characters and tabs/newlines inside the scheme, and lower-cases the scheme, so
 * " \u0001JaVa\tScRiPt:..." is still seen as javascript: and rejected.
 * A protocol-relative "//other.host/" resolves to https://other.host/ and is ACCEPTED by default:
 * linking to another site is allowed (the list marks such links rel="noopener"). Pass
 * { sameOrigin: true } to accept only URLs on base's origin.
 * @param {string} u
 * @param {string} [base] absolute URL; defaults to location.href in a browser
 * @param {{sameOrigin?: boolean}} [o]
 * @returns {string|null} absolute href, or null
 */
export function safeUrl(u, base, o = {}) {
  if (typeof u !== 'string' || !u.trim()) return null;
  const b = base || (typeof location !== 'undefined' ? location.href : undefined);
  let x;
  try { x = b ? new URL(u, b) : new URL(u); } catch (e) { return null; }
  if (x.protocol !== 'https:' && x.protocol !== 'http:') return null;
  if (o.sameOrigin) {
    if (!b) return null;
    if (x.origin !== new URL(b).origin) return null;
  }
  return x.href;
}

/**
 * Check a spatial.places/v1 manifest. Returns { ok, errors: string[], warnings: string[] }.
 * Errors: not an object, places not an array, a place without id or title, duplicate ids.
 * Warnings: a url that safeUrl rejects (that place is shown as text, with no link or Open button).
 */
export function validateManifest(m, base) {
  const errors = [], warnings = [];
  if (!isObj(m)) return { ok: false, errors: ['manifest is not an object'], warnings };
  if (!Array.isArray(m.places)) errors.push('places must be an array');
  const seen = new Set();
  for (const [i, p] of (m.places || []).entries()) {
    if (!isObj(p)) { errors.push(`places[${i}] is not an object`); continue; }
    if (typeof p.id !== 'string' || !p.id) errors.push(`places[${i}] has no id`);
    else if (seen.has(p.id)) errors.push(`duplicate id ${p.id}`); else seen.add(p.id);
    if (typeof p.title !== 'string' || !p.title) errors.push(`places[${i}] has no title`);
    if (p.url != null && !safeUrl(p.url, base || 'https://example.invalid/')) warnings.push(`places[${i}] url rejected (not http/https/relative)`);
  }
  for (const [i, p] of (Array.isArray(m.portals) ? m.portals : []).entries()) {
    if (!isObj(p)) { errors.push(`portals[${i}] is not an object`); continue; }
    if (p.url != null && !safeUrl(p.url, base || 'https://example.invalid/')) warnings.push(`portals[${i}] url rejected (not http/https/relative)`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

/** Compute scene slots { x, z, yaw } for places, per layout. Places with no slot are omitted. */
export function layoutPlaces(manifest) {
  const L = manifest.layout || { type: 'free' };
  const places = manifest.places || [];
  const slots = new Map();
  const faceOrigin = (x, z) => Math.atan2(-x, -z); // rotation.y so local +z points at the origin
  if (L.type === 'grid') {
    const cols = L.cols || 4, rows = L.rows || Math.ceil(places.length / cols);
    const sx = isObj(L.spacing) ? L.spacing.x : (L.spacing || 5);
    const sz = isObj(L.spacing) ? L.spacing.z : (L.spacing || 5);
    let i = 0;
    for (const p of places) {
      if (p.position) { slots.set(p.id, { x: p.position.x, z: p.position.z, yaw: p.yaw != null ? -p.yaw * RAD : 0 }); continue; }
      let c, r;
      if (p.cell) { c = p.cell.col; r = p.cell.row; } else { c = i % cols; r = Math.floor(i / cols); i++; }
      if (c >= cols || r >= rows) continue;
      slots.set(p.id, { x: (c - (cols - 1) / 2) * sx, z: (r - (rows - 1) / 2) * sz, yaw: 0 });
    }
  } else if (L.type === 'ring') {
    const n = places.filter((p) => !p.position).length || 1;
    const R = L.radius || 8;
    let i = 0;
    for (const p of places) {
      if (p.position) { slots.set(p.id, { x: p.position.x, z: p.position.z, yaw: faceOrigin(p.position.x, p.position.z) }); continue; }
      const a = (i++ / n) * Math.PI * 2;
      const x = Math.sin(a) * R, z = -Math.cos(a) * R;
      slots.set(p.id, { x, z, yaw: faceOrigin(x, z) });
    }
  } else if (L.type === 'geo') {
    const o = manifest.origin;
    const usable = places.filter((p) => p.geo && Number.isFinite(p.geo.lat) && Number.isFinite(p.geo.lon));
    if (o && usable.length) {
      const maxM = Math.max(...usable.map((p) => bearingDistance(o, p.geo).meters));
      const scale = makeGeoScale(L.scale || 'sqrt', maxM, L.maxRadius || 20);
      for (const p of usable) {
        const { x, z } = geoToLocal(o, p.geo, scale);
        slots.set(p.id, { x, z, yaw: faceOrigin(x, z) });
      }
    }
    for (const p of places) if (p.position && !slots.has(p.id)) slots.set(p.id, { x: p.position.x, z: p.position.z, yaw: faceOrigin(p.position.x, p.position.z) });
  } else {
    for (const p of places) if (p.position) slots.set(p.id, { x: p.position.x, z: p.position.z, yaw: p.yaw != null ? -p.yaw * RAD : faceOrigin(p.position.x, p.position.z) });
  }
  return slots;
}
