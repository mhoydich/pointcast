// The spatial kit's geo helpers (public/spatial/geo.mjs). No browser needed.
// node --test site/spatial/test/geo.test.mjs
// Expected values are worked out by hand from the sphere (R = 6371008.8 m), or with a second,
// independent formula (spherical law of cosines), not with the code under test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bearingDistance, geoToLocal, makeGeoScale, EARTH_RADIUS_M } from '../public/spatial/geo.mjs';

const R = EARTH_RADIUS_M;
const DEG = (R * Math.PI) / 180; // 111195.08 m per degree of arc
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, want ${b} ± ${tol}`);

test('one degree north along the prime meridian', () => {
  const r = bearingDistance({ lat: 0, lon: 0 }, { lat: 1, lon: 0 });
  near(r.meters, 111195.08, 0.05, 'meters');
  near(r.bearingDeg, 0, 1e-9, 'bearing');
});

test('quarter of the equator, due east', () => {
  const r = bearingDistance({ lat: 0, lon: 0 }, { lat: 0, lon: 90 });
  near(r.meters, (Math.PI / 2) * R, 0.01, 'meters'); // 10,007,557.2 m
  near(r.meters, 10007557.2, 0.1, 'meters literal');
  near(r.bearingDeg, 90, 1e-9, 'bearing');
});

test('due south, ten degrees', () => {
  const r = bearingDistance({ lat: 10, lon: 0 }, { lat: 0, lon: 0 });
  near(r.meters, 10 * DEG, 0.05, 'meters');
  near(r.bearingDeg, 180, 1e-9, 'bearing');
});

test('across the antimeridian is the short way, east', () => {
  const r = bearingDistance({ lat: 0, lon: 179.5 }, { lat: 0, lon: -179.5 });
  near(r.meters, DEG, 0.05, 'meters');
  near(r.bearingDeg, 90, 1e-6, 'bearing');
});

test('north-east diagonal: bearing = atan(cos 1 deg) by hand', () => {
  const r = bearingDistance({ lat: 0, lon: 0 }, { lat: 1, lon: 1 });
  near(r.bearingDeg, 44.99564, 1e-4, 'bearing'); // atan2(sin1·cos1, sin1) = atan(cos 1°)
});

test('El Segundo pair agrees with the spherical law of cosines', () => {
  const a = { lat: 33.9192, lon: -118.4165 }, b = { lat: 33.9425, lon: -118.4081 };
  const r = bearingDistance(a, b);
  const t = Math.PI / 180;
  const cosc = Math.sin(a.lat * t) * Math.sin(b.lat * t) + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.cos((b.lon - a.lon) * t);
  near(r.meters, R * Math.acos(cosc), 0.5, 'meters vs law of cosines');
  assert.ok(r.bearingDeg > 0 && r.bearingDeg < 90, 'north-east quadrant');
});

test('same point is zero', () => {
  const r = bearingDistance({ lat: 33.9, lon: -118.4 }, { lat: 33.9, lon: -118.4 });
  assert.equal(r.meters, 0);
  assert.equal(r.bearingDeg, 0);
});

test('geoToLocal: +x east, -z north, scale applied', () => {
  const o = { lat: 0, lon: 0 };
  const e = geoToLocal(o, { lat: 0, lon: 1 });
  near(e.x, DEG, 0.05, 'east x'); near(e.z, 0, 1e-6, 'east z');
  const n = geoToLocal(o, { lat: 1, lon: 0 });
  near(n.x, 0, 1e-6, 'north x'); near(n.z, -DEG, 0.05, 'north z');
  const s = geoToLocal(o, { lat: -1, lon: 0 }, (m) => m / 1000);
  near(s.z, DEG / 1000, 1e-4, 'south z scaled'); near(s.x, 0, 1e-9, 'south x');
});

test('makeGeoScale maps the farthest place to maxRadius', () => {
  for (const type of ['linear', 'sqrt', 'log']) {
    const f = makeGeoScale(type, 40000, 20);
    near(f(40000), 20, 1e-9, type);
    near(f(0), 0, 1e-9, type + ' zero');
  }
  near(makeGeoScale('sqrt', 40000, 20)(10000), 10, 1e-9, 'sqrt quarter -> half');
});
