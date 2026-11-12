#!/usr/bin/env node
// SPDX-License-Identifier: CERN-OHL-P-2.0
// Baby Bonfire, first place kit (/baby-bonfire/first-place/).
// Writes the printable parts as binary STL, a manifest, and the generated parts of the page,
// all from one file of dimensions: public/baby-bonfire/first-place/files/params.json.
//
//   node scripts/baby-bonfire/first-place.mjs          write the files
//   node scripts/baby-bonfire/first-place.mjs --check  exit 1 if the committed files are stale
//
// No dependencies. The same params.json always gives the same bytes.
//
// How a part is made: it is one closed surface built from rings of points. A ring is swept to
// the next ring to make a wall or a chamfer, and each flat face is triangulated around its
// holes. Nothing is cut or merged afterwards, so there is no boolean step to go wrong. Before a
// part is written it is checked here: every edge is shared by exactly two triangles that run in
// opposite directions, no triangle is empty, and the volume is positive. A second, independent
// check in Python is in scripts/baby-bonfire/verify-first-place.py.
//
// Nobody has printed these parts. Every number is a v0.1 proposal.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KIT_DIR = 'public/baby-bonfire/first-place';
export const PARAMS_PATH = `${KIT_DIR}/files/params.json`;
const TAU = Math.PI * 2;
const EPS = 1e-9;
// Every coordinate sits on a 0.1 micron grid, so a point is the same number wherever it is used.
const grid = (n) => { const v = Math.round(n * 1e4) / 1e4; return v === 0 ? 0 : v; };
const r2 = (n) => Math.round(n * 100) / 100;
const r1 = (n) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------------------------------------
// Outlines. All of them run counter-clockwise seen from above.

export function circle(cx, cy, radius, n, phase = 0) {
  const pts = [];
  for (let j = 0; j < n; j++) { const a = phase + (TAU * j) / n; pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]); }
  return pts;
}

// A square with rounded corners, centred on the origin. k segments per corner.
export function roundedSquare(half, radius, k) {
  const c = half - radius;
  const pts = [];
  [[c, c], [-c, c], [-c, -c], [c, -c]].forEach(([cx, cy], quarter) => {
    for (let j = 0; j <= k; j++) { const a = (Math.PI / 2) * (quarter + j / k); pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]); }
  });
  return pts;
}

// A slot with round ends on A and B, half-width w, m segments per end.
export function stadium(ax, ay, bx, by, w, m) {
  const phi = Math.atan2(by - ay, bx - ax);
  const pts = [];
  for (let j = 0; j <= m; j++) { const a = phi - Math.PI / 2 + (Math.PI * j) / m; pts.push([bx + w * Math.cos(a), by + w * Math.sin(a)]); }
  for (let j = 0; j <= m; j++) { const a = phi + Math.PI / 2 + (Math.PI * j) / m; pts.push([ax + w * Math.cos(a), ay + w * Math.sin(a)]); }
  return pts;
}

// ---------------------------------------------------------------------------------------------
// Flat faces: ear clipping, with each hole first joined to the outline by a two-way bridge.
// Only the points given are used, so a face meets the walls around it edge for edge.

export function triangulate(V, outer, holes = []) {
  const X = (i) => V[i][0];
  const Y = (i) => V[i][1];
  const cross = (a, b, c) => (X(b) - X(a)) * (Y(c) - Y(a)) - (Y(b) - Y(a)) * (X(c) - X(a));
  const area2 = (loop) => loop.reduce((s, p, i) => { const n = loop[(i + 1) % loop.length]; return s + X(p) * Y(n) - X(n) * Y(p); }, 0);
  const same = (a, b) => a === b || (X(a) === X(b) && Y(a) === Y(b));

  let poly = area2(outer) < 0 ? outer.slice().reverse() : outer.slice();
  const want = area2(poly) - holes.reduce((s, h) => s + Math.abs(area2(h)), 0);
  const clockwise = holes.map((h) => (area2(h) > 0 ? h.slice().reverse() : h.slice()));
  const maxX = (h) => h.reduce((m, p) => Math.max(m, X(p)), -Infinity);
  clockwise.sort((p, q) => maxX(q) - maxX(p));

  // Is point m inside the corner of poly at position i?
  const inCorner = (i, m) => {
    const n = poly.length;
    const a = poly[(i + n - 1) % n], v = poly[i], b = poly[(i + 1) % n];
    return cross(a, v, b) > 0 ? cross(a, v, m) >= 0 && cross(v, b, m) >= 0 : cross(a, v, m) >= 0 || cross(v, b, m) >= 0;
  };
  // A point can sit in the outline twice once a bridge has used it. Take the copy that faces m.
  const facing = (i, m) => {
    for (let k = 0; k < poly.length; k++) if (same(poly[k], poly[i]) && inCorner(k, m)) return k;
    return i;
  };

  for (const hole of clockwise) {
    // m: the hole's rightmost point. Look along +x from it for the nearest edge of the outline.
    let mi = 0;
    for (let k = 1; k < hole.length; k++) if (X(hole[k]) > X(hole[mi]) || (X(hole[k]) === X(hole[mi]) && Y(hole[k]) < Y(hole[mi]))) mi = k;
    const m = hole[mi];
    const mx = X(m), my = Y(m);
    let best = Infinity, edge = -1, onVertex = -1;
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      const ay = Y(a) - my, by = Y(b) - my;
      if ((ay > 0 && by > 0) || (ay < 0 && by < 0)) continue;
      const hits = [];
      if (ay === 0) hits.push([X(a), i]);
      if (by === 0) hits.push([X(b), (i + 1) % n]);
      if (ay !== 0 && by !== 0) hits.push([X(a) + (X(b) - X(a)) * (ay / (ay - by)), -1]);
      for (const [x, at] of hits) {
        if (x < mx - EPS || x > best - EPS) continue;
        best = x; edge = i; onVertex = at;
      }
    }
    if (edge < 0) throw new Error('triangulate: a hole is not inside its outline');
    let pi;
    if (onVertex >= 0) {
      pi = onVertex;
    } else {
      // The edge's right-hand end is visible unless a reflex corner sits inside the triangle
      // m, hit, end. If one does, the reflex corner nearest the line of sight is the visible one.
      const a = edge, b = (edge + 1) % n;
      pi = X(poly[a]) > X(poly[b]) ? a : b;
      const px = X(poly[pi]), py = Y(poly[pi]);
      const side = (x1, y1, x2, y2, x, y) => (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
      let tan = Infinity, dist = Infinity;
      for (let k = 0; k < n; k++) {
        const v = poly[k];
        if (same(v, poly[pi]) || X(v) <= mx) continue;
        const prev = poly[(k + n - 1) % n], next = poly[(k + 1) % n];
        if (cross(prev, v, next) >= 0) continue;
        const d1 = side(mx, my, best, my, X(v), Y(v)), d2 = side(best, my, px, py, X(v), Y(v)), d3 = side(px, py, mx, my, X(v), Y(v));
        if (!((d1 >= -EPS && d2 >= -EPS && d3 >= -EPS) || (d1 <= EPS && d2 <= EPS && d3 <= EPS))) continue;
        const t = Math.abs(Y(v) - my) / (X(v) - mx), d = (X(v) - mx) ** 2 + (Y(v) - my) ** 2;
        if (t < tan - EPS || (Math.abs(t - tan) <= EPS && d < dist)) { tan = t; dist = d; pi = k; }
      }
    }
    pi = facing(pi, m);
    const around = [...hole.slice(mi), ...hole.slice(0, mi)];
    poly = [...poly.slice(0, pi + 1), ...around, m, poly[pi], ...poly.slice(pi + 1)];
  }

  const tris = [];
  let start = 0;
  while (poly.length > 3) {
    const n = poly.length;
    let cut = -1;
    for (let s = 0; s < n && cut < 0; s++) {
      const i = (start + s) % n;
      const a = poly[(i + n - 1) % n], b = poly[i], c = poly[(i + 1) % n];
      if (cross(a, b, c) <= EPS) continue;
      let clear = true;
      for (let k = 0; k < n && clear; k++) {
        const p = poly[k];
        if (same(p, a) || same(p, b) || same(p, c)) continue;
        if (cross(a, b, p) > -EPS && cross(b, c, p) > -EPS && cross(c, a, p) > -EPS) clear = false;
      }
      if (clear) cut = i;
    }
    if (cut < 0) throw new Error('triangulate: no ear left to cut');
    const n2 = poly.length;
    tris.push([poly[(cut + n2 - 1) % n2], poly[cut], poly[(cut + 1) % n2]]);
    poly.splice(cut, 1);
    start = cut % poly.length;
  }
  tris.push([poly[0], poly[1], poly[2]]);

  let got = 0;
  for (const [a, b, c] of tris) {
    const t = cross(a, b, c);
    if (t <= EPS) throw new Error('triangulate: an empty or reversed triangle');
    got += t;
  }
  if (Math.abs(got - want) > 1e-6 * Math.max(1, Math.abs(want))) throw new Error(`triangulate: area ${got / 2} does not match the face ${want / 2}`);
  return tris;
}

// ---------------------------------------------------------------------------------------------
// A solid: points, triangles, and the three ways of adding surface.

export class Solid {
  constructor(name) { this.name = name; this.v = []; this.f = []; }

  ring(points, z) { return points.map(([x, y]) => this.v.push([grid(x), grid(y), grid(z)]) - 1); }

  // Join each ring to the next. Give the rings in the order you meet them walking round the
  // cross-section with the solid on your left: outward along the bottom, up the outside,
  // inward along the top, and down the inside of any hole.
  sweep(rings) {
    for (let i = 0; i + 1 < rings.length; i++) {
      const a = rings[i], b = rings[i + 1];
      for (let j = 0; j < a.length; j++) {
        const k = (j + 1) % a.length;
        this.f.push([a[j], a[k], b[k]], [a[j], b[k], b[j]]);
      }
    }
    return rings;
  }

  // Circles about (cx, cy) through each [radius, z] of the profile, swept in order.
  // A profile point that repeats the one before it is skipped, so a chamfer of 0 is allowed.
  revolve(cx, cy, profile, n) {
    const kept = profile.filter((p, i) => i === 0 || Math.abs(p[0] - profile[i - 1][0]) > EPS || Math.abs(p[1] - profile[i - 1][1]) > EPS);
    return this.sweep(kept.map(([radius, z]) => this.ring(circle(cx, cy, radius, n), z)));
  }

  // A flat face inside `outer`, around `holes`, facing up or down.
  cap(outer, holes, up) {
    for (const [a, b, c] of triangulate(this.v, outer, holes)) this.f.push(up ? [a, b, c] : [a, c, b]);
  }

  move(fn) { this.v = this.v.map((p) => fn(p).map(grid)); return this; }
}

// Throws unless the solid is one closed, consistently wound surface. Returns its measurements.
export function inspect(solid) {
  const { v, f, name } = solid;
  const N = v.length;
  const edges = new Map();
  for (const [a, b, c] of f) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      if (p === q) throw new Error(`${name}: a triangle uses one point twice`);
      edges.set(p * N + q, (edges.get(p * N + q) || 0) + 1);
    }
  }
  for (const [key, count] of edges) {
    const p = Math.floor(key / N), q = key % N;
    if (count !== 1 || edges.get(q * N + p) !== 1) throw new Error(`${name}: the surface is open or folded at edge ${p}-${q}`);
  }
  const used = new Set(f.flat());
  if (used.size !== N) throw new Error(`${name}: ${N - used.size} point(s) are not part of any triangle`);
  const seen = new Set();
  for (const p of v) { const k = p.join(','); if (seen.has(k)) throw new Error(`${name}: two points share the position ${k}`); seen.add(k); }

  let volume = 0, area = 0;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of v) for (let i = 0; i < 3; i++) { if (p[i] < min[i]) min[i] = p[i]; if (p[i] > max[i]) max[i] = p[i]; }
  for (const [a, b, c] of f) {
    const A = v[a], B = v[b], C = v[c];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    const wx = C[0] - A[0], wy = C[1] - A[1], wz = C[2] - A[2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const twice = Math.hypot(nx, ny, nz);
    if (twice < 1e-7) throw new Error(`${name}: an empty triangle`);
    area += twice / 2;
    volume += (A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0])) / 6;
  }
  if (!(volume > 0)) throw new Error(`${name}: the surface is inside out`);
  const euler = N - edges.size / 2 + f.length;
  return {
    triangles: f.length, points: N, min, max,
    size: [0, 1, 2].map((i) => grid(max[i] - min[i])),
    volume, area, handles: (2 - euler) / 2,
  };
}

// Binary STL: 80 bytes of label, a count, then 50 bytes per triangle.
export function toStl(solid, label) {
  if (/^solid/i.test(label)) throw new Error('an STL label must not start with "solid"');
  const buf = Buffer.alloc(84 + solid.f.length * 50);
  buf.write(label.slice(0, 80), 0, 'ascii');
  buf.writeUInt32LE(solid.f.length, 80);
  let o = 84;
  for (const [a, b, c] of solid.f) {
    const A = solid.v[a], B = solid.v[b], C = solid.v[c];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    const wx = C[0] - A[0], wy = C[1] - A[1], wz = C[2] - A[2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const len = Math.hypot(nx, ny, nz);
    for (const n of [nx / len, ny / len, nz / len, ...A, ...B, ...C]) { buf.writeFloatLE(n === 0 ? 0 : n, o); o += 4; }
    o += 2;
  }
  return buf;
}

// ---------------------------------------------------------------------------------------------
// The numbers that follow from params.json, and the rules the geometry has to keep.

export function derive(p) {
  const { tile, bay, landing, tagRecess, feet, puck, shell, lid } = p;
  const half = tile.size / 2;
  const rp = puck.diameter / 2;                       // puck radius
  const seat = puck.seatChamfer;
  const rb = rp + bay.clearance;                      // bay radius
  const seatDepth = bay.wallDepth + seat;             // bottom of the seat, below the top face
  const puckDepth = seatDepth + bay.clearance;        // where a puck's underside rests: the seat is 45 degrees,
                                                      // so the gap at the side becomes the same drop
  const rt = tagRecess.stickerDiameter / 2 + tagRecess.clearance;
  const rg = landing.ringDiameter / 2;
  const gw = landing.grooveWidth / 2;
  const rf = feet.diameter / 2;
  const footAt = half - feet.inset;
  const rc = rp - shell.wall;                         // cavity radius
  const rlo = rc - lid.lipClearance;                  // lip, outside
  const rli = rlo - lid.lipWall;                      // lip, inside
  const boardDiagonal = Math.hypot(...shell.largestBoard);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const footCentres = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => [sx * footAt, sy * footAt]);
  const cornerC = half - tile.cornerRadius;
  // distance from the cavity's bottom corner to the seat chamfer on the outside of the shell
  const chamferGap = (() => {
    const ax = rp - seat, ay = 0, bx = rp, by = seat, px = rc, py = shell.floor;
    const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)));
    return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
  })();
  const ventWeb = 2 * lid.ventInner * Math.sin(Math.PI / lid.vents) - lid.ventWidth;

  const walls = [
    ['Tile, rim between the bay and the edge of the top face', (half - tile.topChamfer) - (Math.max(Math.abs(bay.x), Math.abs(bay.y)) + rb + bay.leadIn)],
    ['Tile, plastic between the tag and the top face', tile.bodyHeight - tagRecess.depth],
    ['Tile, straight wall of the hole below the seat', tile.bodyHeight - seatDepth],
    ['Sensing puck shell, side wall', shell.wall],
    ['Sensing puck shell, floor', shell.floor],
    ['Sensing puck shell, floor corner to the seat chamfer', chamferGap],
    ['Lid, plate', lid.thickness],
    ['Lid, lip', lid.lipWall],
    ['Lid, tip of the lip', lid.lipWall - lid.lipLeadIn],
    ['Lid, bar between two vents', ventWeb],
    ['Lid, between a vent and the lip', rli - (lid.ventOuter + lid.ventWidth / 2)],
  ].map(([where, mm]) => ({ where, mm: r2(mm) }));
  const minWall = walls.reduce((m, w) => (w.mm < m.mm ? w : m));

  const rules = [
    [tile.cornerRadius < half, 'tile.cornerRadius must be less than half of tile.size'],
    [tile.cornerRadius > Math.max(tile.topChamfer, tile.bottomChamfer), 'tile.cornerRadius must be larger than both chamfers'],
    [tile.topChamfer + tile.bottomChamfer < tile.bodyHeight, 'the two tile chamfers must fit in tile.bodyHeight'],
    [bay.wallDepth >= bay.leadIn, 'bay.wallDepth must be at least bay.leadIn'],
    [tile.bodyHeight - seatDepth >= 1.2, 'the hole needs at least 1.2 of straight wall below the seat'],
    [walls[0].mm >= 2, 'the bay is too close to the edge of the tile'],
    [seat > 0 && seat < rp, 'puck.seatChamfer must be more than 0 and less than the puck radius'],
    [puck.blankHeight > seat + puck.topChamfer, 'puck.blankHeight is too small for its two chamfers'],
    [dist(bay.x, bay.y, landing.x, landing.y) - (rb + bay.leadIn) - (rg + gw) >= 2, 'the landing ring is too close to the bay'],
    [Math.max(Math.abs(landing.x), Math.abs(landing.y)) + rg + gw <= half - tile.topChamfer - 2, 'the landing ring is too close to the edge of the tile'],
    [rg - gw > 1, 'landing.ringDiameter is too small'],
    [landing.grooveDepth < tile.bodyHeight - tagRecess.depth - 1.2, 'the landing groove is too deep'],
    [dist(bay.x, bay.y, tagRecess.x, tagRecess.y) - (rb - seat) - rt >= 1.5, 'the tag recess is too close to the hole under the bay'],
    [Math.max(Math.abs(tagRecess.x), Math.abs(tagRecess.y)) + rt <= half - tile.bottomChamfer - 2, 'the tag recess is too close to the edge of the tile'],
    [tagRecess.depth < tile.bodyHeight - 1.2, 'the tag recess is too deep'],
    [tagRecess.depth > tagRecess.stickerThickness, 'the tag recess is shallower than the sticker is thick'],
    [feet.taper < rf, 'feet.taper must be less than the foot radius'],
    [Math.hypot(footAt - cornerC, footAt - cornerC) + rf <= tile.cornerRadius - tile.bottomChamfer - 1 || footAt + rf <= cornerC, 'the feet are too close to the corners of the tile'],
    ...footCentres.flatMap(([fx, fy]) => [
      [dist(fx, fy, bay.x, bay.y) - rf - (rb - seat) >= 1.5, 'a foot is too close to the hole under the bay'],
      [dist(fx, fy, tagRecess.x, tagRecess.y) - rf - rt >= 1.5, 'a foot is too close to the tag recess'],
    ]),
    [shell.height > puckDepth + 2, 'shell.height must clear the bay'],
    [shell.floor < shell.height - 2, 'shell.floor leaves no cavity'],
    [rli > lid.ventOuter + lid.ventWidth / 2 + 1.2, 'the vents reach the lip of the lid'],
    [lid.ventInner - lid.ventWidth / 2 > 1 && lid.ventOuter > lid.ventInner, 'lid.ventInner and lid.ventOuter do not make a slot'],
    [lid.lipLeadIn < lid.lipWall && lid.lipLeadIn < lid.lipHeight, 'lid.lipLeadIn is too large for the lip'],
    [lid.topChamfer < lid.thickness, 'lid.topChamfer must be less than lid.thickness'],
    [minWall.mm >= 1.2, `the thinnest wall is ${minWall.mm} mm (${minWall.where}); keep every wall at 1.2 or more`],
    [boardDiagonal < 2 * rc, 'shell.largestBoard does not fit across the cavity'],
    ...Object.entries(p.mesh).map(([k, n]) => [Number.isInteger(n) && n >= 4 && (k === 'cornerSegments' || k === 'ventEndSegments' || n % 4 === 0), `mesh.${k} must be a whole number of 4 or more${k === 'cornerSegments' || k === 'ventEndSegments' ? '' : ', divisible by 4'}`]),
  ];
  const broken = rules.filter(([ok]) => !ok).map(([, text]) => text);
  if (broken.length) throw new Error(`params.json breaks ${broken.length} rule(s):\n  ${broken.join('\n  ')}`);

  return {
    half, rp, rb, rt, rg, gw, rf, rc, rlo, rli, seat, seatDepth, puckDepth, footAt, footCentres,
    walls, minWall,
    numbers: {
      tileOverallHeight: r2(tile.bodyHeight + feet.height),
      bayDiameter: r2(2 * rb),
      bayOpening: r2(2 * (rb + bay.leadIn)),
      holeDiameter: r2(2 * (rb - seat)),
      seatDepth: r2(seatDepth),
      puckRestsBelowTop: r2(puckDepth),
      blankPuckProud: r2(puck.blankHeight - puckDepth),
      landingFits: r1(2 * Math.min(half - Math.abs(landing.x), half - Math.abs(landing.y), dist(bay.x, bay.y, landing.x, landing.y) - rp)),
      tagRecessDiameter: r2(2 * rt),
      plasticOverTag: r2(tile.bodyHeight - tagRecess.depth),
      tagAboveTable: r1(feet.height + tagRecess.depth - tagRecess.stickerThickness),
      footPad: r2(2 * (rf - feet.taper)),
      cavityDiameter: r2(2 * rc),
      cavityDepth: r2(shell.height - shell.floor),
      boardCornerGap: r2(rc - boardDiagonal / 2),
      lipOutside: r2(2 * rlo),
      lipInside: r2(2 * rli),
      lidOverallHeight: r2(lid.thickness + lid.lipHeight),
      sensingPuckProud: r2(shell.height + lid.thickness - puckDepth),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// The four parts. Each comes back the way it prints: flat side on z = 0.

function buildTile(p, d) {
  const { tile, bay, landing, tagRecess, feet, mesh } = p;
  const T = tile.bodyHeight;
  const s = new Solid('place-tile');
  // Built the way it is used (z = 0 is the underside of the body, feet below, top at T), then turned over.
  const edgeBottom = s.ring(roundedSquare(d.half - tile.bottomChamfer, tile.cornerRadius - tile.bottomChamfer, mesh.cornerSegments), 0);
  const edgeLow = s.ring(roundedSquare(d.half, tile.cornerRadius, mesh.cornerSegments), tile.bottomChamfer);
  const edgeHigh = s.ring(roundedSquare(d.half, tile.cornerRadius, mesh.cornerSegments), T - tile.topChamfer);
  const edgeTop = s.ring(roundedSquare(d.half - tile.topChamfer, tile.cornerRadius - tile.topChamfer, mesh.cornerSegments), T);
  s.sweep([edgeBottom, edgeLow, edgeHigh, edgeTop]);

  // The bay: lead-in, straight wall, 45 degree seat, then a hole straight through.
  const bayRings = s.revolve(bay.x, bay.y, [
    [d.rb + bay.leadIn, T], [d.rb, T - bay.leadIn], [d.rb, T - bay.wallDepth], [d.rb - d.seat, T - d.seatDepth], [d.rb - d.seat, 0],
  ], mesh.roundSegments);

  // The landing ring: a V groove in the top face, with the tag recess under its centre.
  const groove = s.revolve(landing.x, landing.y, [[d.rg + d.gw, T], [d.rg, T - landing.grooveDepth], [d.rg - d.gw, T]], mesh.roundSegments);
  s.cap(edgeTop, [bayRings[0], groove[0]], true);
  s.cap(groove[2], [], true);

  // Underside: the tag recess and four feet.
  const recess = s.revolve(tagRecess.x, tagRecess.y, [[d.rt, tagRecess.depth], [d.rt, 0]], mesh.smallSegments);
  s.cap(recess[0], [], false);
  const footBases = d.footCentres.map(([fx, fy]) => {
    const foot = s.revolve(fx, fy, [[d.rf - feet.taper, -feet.height], [d.rf, 0]], mesh.footSegments);
    s.cap(foot[0], [], false);
    return foot[1];
  });
  s.cap(edgeBottom, [bayRings[bayRings.length - 1], recess[1], ...footBases], false);

  // Turn it over for printing: half a turn about the x axis, top face down on z = 0.
  return s.move(([x, y, z]) => [x, -y, T - z]);
}

function buildBlankPuck(p, d) {
  const { puck, mesh } = p;
  const h = puck.blankHeight;
  const s = new Solid('puck-blank');
  const rings = s.revolve(0, 0, [[d.rp - d.seat, 0], [d.rp, d.seat], [d.rp, h - puck.topChamfer], [d.rp - puck.topChamfer, h]], mesh.roundSegments);
  s.cap(rings[0], [], false);
  s.cap(rings[rings.length - 1], [], true);
  return s;
}

function buildShell(p, d) {
  const { shell, mesh } = p;
  const s = new Solid('puck-shell');
  const rings = s.revolve(0, 0, [[d.rp - d.seat, 0], [d.rp, d.seat], [d.rp, shell.height], [d.rc, shell.height], [d.rc, shell.floor]], mesh.roundSegments);
  s.cap(rings[0], [], false);
  s.cap(rings[rings.length - 1], [], true);
  return s;
}

function buildLid(p, d) {
  const { lid, mesh } = p;
  const t = lid.thickness, top = lid.thickness + lid.lipHeight;
  const s = new Solid('puck-lid');
  // Printed face down: the plate lies on z = 0 and the lip stands up from it.
  const rings = s.revolve(0, 0, [
    [d.rp - lid.topChamfer, 0], [d.rp, lid.topChamfer], [d.rp, t], [d.rlo, t],
    [d.rlo, top - lid.lipLeadIn], [d.rlo - lid.lipLeadIn, top], [d.rli, top], [d.rli, t],
  ], mesh.roundSegments);
  const slotsUp = [], slotsDown = [];
  for (let i = 0; i < lid.vents; i++) {
    const a = (TAU * i) / lid.vents;
    const outline = stadium(lid.ventInner * Math.cos(a), lid.ventInner * Math.sin(a), lid.ventOuter * Math.cos(a), lid.ventOuter * Math.sin(a), lid.ventWidth / 2, mesh.ventEndSegments);
    const up = s.ring(outline, t), down = s.ring(outline, 0);
    s.sweep([up, down]);
    slotsUp.push(up); slotsDown.push(down);
  }
  s.cap(rings[0], slotsDown, false);
  s.cap(rings[rings.length - 1], slotsUp, true);
  return s;
}

export const PARTS = [
  { id: 'place-tile', file: 'place-tile.stl', name: 'Place tile', build: buildTile, prints: 'Top face down. The feet and the tag recess face up while it prints.' },
  { id: 'puck-blank', file: 'puck-blank.stl', name: 'Blank puck', build: buildBlankPuck, prints: 'Chamfered side down.' },
  { id: 'puck-shell', file: 'puck-shell.stl', name: 'Sensing puck shell', build: buildShell, prints: 'Chamfered side down, open end up.', optional: true },
  { id: 'puck-lid', file: 'puck-lid.stl', name: 'Vented lid', build: buildLid, prints: 'Flat face down, lip up.', optional: true },
];

// ---------------------------------------------------------------------------------------------
// The page. index.html is written by hand; the script fills the blocks between
// <!--kit:name--> and <!--/kit:name-->, and every <span data-kit="key">, so the numbers a
// reader sees are the numbers the files were made from.

export const PAGE_PATH = `${KIT_DIR}/index.html`;

// Every number in params.json, in the order the page shows it. [path, what it is, unit if not mm]
const TABLE = [
  ['Tile', [
    ['tile.size', 'Side of the square tile'],
    ['tile.cornerRadius', 'Corner radius'],
    ['tile.bodyHeight', 'Thickness of the body, feet not counted'],
    ['tile.topChamfer', 'Chamfer round the top edge'],
    ['tile.bottomChamfer', 'Chamfer round the bottom edge'],
  ]],
  ['Puck bay', [
    ['bay.x', 'Centre of the bay, to the right of the middle of the tile'],
    ['bay.y', 'Centre of the bay, towards the back'],
    ['bay.clearance', 'Gap between puck and bay, on each side'],
    ['bay.leadIn', 'Chamfer round the mouth of the bay'],
    ['bay.wallDepth', 'From the top face down to where the seat starts'],
  ]],
  ['Landing ring', [
    ['landing.x', 'Centre of the ring, to the right of the middle (minus is left)'],
    ['landing.y', 'Centre of the ring, towards the back (minus is front)'],
    ['landing.ringDiameter', 'Across the ring, to the middle of its groove'],
    ['landing.grooveWidth', 'Width of the V groove'],
    ['landing.grooveDepth', 'Depth of the V groove'],
  ]],
  ['Tag recess, underneath', [
    ['tagRecess.x', 'Centre of the recess, measured like the ring'],
    ['tagRecess.y', 'Centre of the recess, measured like the ring'],
    ['tagRecess.stickerDiameter', 'Sticker the recess is made for'],
    ['tagRecess.stickerThickness', 'Thickness of that sticker, from its seller'],
    ['tagRecess.clearance', 'Room round the sticker, on each side'],
    ['tagRecess.depth', 'Depth of the recess'],
  ]],
  ['Feet', [
    ['feet.inset', 'Centre of each foot, in from the two nearest edges'],
    ['feet.diameter', 'Across a foot where it joins the tile'],
    ['feet.height', 'Height of a foot'],
    ['feet.taper', 'How much a foot narrows on each side (equal to its height gives 45°)'],
  ]],
  ['Pucks', [
    ['puck.diameter', 'Across any puck'],
    ['puck.seatChamfer', 'Chamfer a puck sits on, the same on the puck and in the bay'],
    ['puck.topChamfer', 'Chamfer round the top of the blank puck'],
    ['puck.blankHeight', 'Height of the blank puck'],
  ]],
  ['Sensing puck shell', [
    ['shell.height', 'Height of the shell, lid not counted'],
    ['shell.wall', 'Side wall'],
    ['shell.floor', 'Floor'],
    ['shell.largestBoard', 'Largest board the cavity is sized for'],
  ]],
  ['Vented lid', [
    ['lid.thickness', 'Plate'],
    ['lid.topChamfer', 'Chamfer round the top edge'],
    ['lid.lipHeight', 'How far the lip reaches into the shell'],
    ['lid.lipWall', 'Thickness of the lip'],
    ['lid.lipClearance', 'Gap between lip and shell, on each side'],
    ['lid.lipLeadIn', 'Chamfer on the tip of the lip'],
    ['lid.vents', 'Number of slots', 'slots'],
    ['lid.ventWidth', 'Width of a slot'],
    ['lid.ventInner', 'Inner end of a slot, from the centre'],
    ['lid.ventOuter', 'Outer end of a slot, from the centre'],
  ]],
  ['How round things are drawn: segments, not mm', [
    ['mesh.roundSegments', 'Round the bay, the ring and the pucks', 'segments'],
    ['mesh.smallSegments', 'Round the tag recess', 'segments'],
    ['mesh.footSegments', 'Round each foot', 'segments'],
    ['mesh.cornerSegments', 'Round each corner of the tile', 'segments'],
    ['mesh.ventEndSegments', 'Round each end of a slot', 'segments'],
  ]],
];

const FOLLOWS = [
  ['tileOverallHeight', 'Height of the tile standing on its feet'],
  ['bayDiameter', 'Across the bay'],
  ['bayOpening', 'Across the mouth of the bay, at the top face'],
  ['holeDiameter', 'Across the hole below the seat'],
  ['seatDepth', 'Bottom of the seat, below the top face'],
  ['puckRestsBelowTop', 'Underside of a seated puck, below the top face'],
  ['blankPuckProud', 'Blank puck stands above the top face by'],
  ['landingFits', 'Largest round base that stays on the tile and clear of a puck'],
  ['tagRecessDiameter', 'Across the tag recess'],
  ['plasticOverTag', 'Plastic between the tag and the top face'],
  ['tagAboveTable', 'Tag above the table, with the tile on its feet'],
  ['footPad', 'Across a foot where it meets the table'],
  ['cavityDiameter', 'Across the cavity of the shell'],
  ['cavityDepth', 'Depth of the cavity'],
  ['boardCornerGap', 'Room at each corner of the largest board, lying flat in the cavity'],
  ['lipOutside', 'Across the lip of the lid, outside'],
  ['lipInside', 'Across the lip of the lid, inside'],
  ['lidOverallHeight', 'Height of the lid, lip included'],
  ['sensingPuckProud', 'Sensing puck with its lid stands above the top face by'],
];

const ABOUT = {
  'place-tile': 'The place itself. A ring on top marks where a piece lands, and the recess for the tag is under the middle of that ring. Beside it is a round bay with a hole through it for a puck. Four small feet.',
  'puck-blank': 'Fills the bay of a place that does no sensing. A place with no puck at all is still a place.',
  'puck-shell': 'Optional and untested. A cup that fits the same bay, with room inside for a small board.',
  'puck-lid': 'Optional and untested. Pushes onto the shell. Slots let air and light in.',
};

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 6580 -> 6,580 and 21.60 -> 21.6. Written out here so the text never depends on the machine's locale.
const show = (n) => {
  if (Array.isArray(n)) return n.map(show).join(' × ');
  const [whole, part] = String(Math.round(n * 100) / 100).split('.');
  return `${whole.replace('-', '−').replace(/\B(?=(\d{3})+$)/g, ',')}${part ? `.${part}` : ''}`;
};
const at = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

function leaves(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? leaves(v, `${prefix}${k}.`) : typeof v === 'string' ? [] : [`${prefix}${k}`]));
}

function renderPage(html, { params, derived, manifest, preview }) {
  const listed = TABLE.flatMap(([, rows]) => rows.map(([path]) => path));
  const missing = leaves(params).filter((path) => !listed.includes(path));
  const extra = listed.filter((path) => at(params, path) === undefined);
  if (missing.length || extra.length) throw new Error(`the page table and params.json disagree: not on the page ${missing.join(', ') || 'none'}; not in params.json ${extra.join(', ') || 'none'}`);

  const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
  const parts = `    <ul class="cards">\n${manifest.files.map((f, i) => `      <li class="card"><span class="k">Part ${i + 1}${f.optional ? ' · optional' : ''}</span><h3>${esc(f.name)}</h3><p>${esc(ABOUT[f.id])}</p><p>${show(f.size)} mm. ${show(f.triangles)} triangles, ${kb(f.bytes)}. Prints: ${esc(f.prints.charAt(0).toLowerCase() + f.prints.slice(1))}</p><p><a class="btn" href="/baby-bonfire/first-place/files/${f.file}" download>${f.file}</a></p></li>`).join('\n')}
    </ul>
    <p><a class="btn" href="/baby-bonfire/first-place/files/params.json" download>params.json</a> <a class="btn" href="/baby-bonfire/first-place/files/manifest.json" download>manifest.json</a></p>`;

  const table = `    <table class="dim">
      <caption>In millimetres unless the row says otherwise. The name under each row is its name in params.json.</caption>
      <thead><tr><th scope="col">Dimension</th><th scope="col" class="n">Value</th></tr></thead>
      <tbody>
${TABLE.map(([group, rows]) => `      <tr class="g"><th scope="colgroup" colspan="2">${esc(group)}</th></tr>\n${rows.map(([path, label]) => `      <tr><th scope="row">${esc(label)}<code>${path}</code></th><td class="n">${show(at(params, path))}</td></tr>`).join('\n')}`).join('\n')}
      </tbody>
    </table>`;

  const follows = `    <table class="dim">
      <caption>Worked out by the script from the table above. In millimetres.</caption>
      <tbody>
${FOLLOWS.map(([key, label]) => { if (!(key in derived.numbers)) throw new Error(`no derived number called ${key}`); return `      <tr><th scope="row">${esc(label)}</th><td class="n">${show(derived.numbers[key])}</td></tr>`; }).join('\n')}
      </tbody>
    </table>`;

  const walls = `    <table class="dim">
      <caption>By design, from the numbers above. In millimetres. The thinnest is marked.</caption>
      <tbody>
${derived.walls.map((w) => `      <tr${w === derived.minWall ? ' class="min"' : ''}><th scope="row">${esc(w.where)}${w === derived.minWall ? ' (thinnest)' : ''}</th><td class="n">${show(w.mm)}</td></tr>`).join('\n')}
      </tbody>
    </table>`;

  const data = `<script type="application/json" id="kit-data">
{"unit":${preview.unit},"scene":${JSON.stringify(preview.scene)},"parts":{
${Object.entries(preview.parts).map(([id, part]) => `${JSON.stringify(id)}:${JSON.stringify(part)}`).join(',\n')}
}}
</script>`;

  const tokens = { 'm.triangles': show(manifest.files.reduce((n, f) => n + f.triangles, 0)), 'm.tileCm3': show(Math.round(manifest.files[0].volumeMm3 / 1000)) };
  for (const path of listed) tokens[path] = show(at(params, path));
  for (const [key, value] of Object.entries(derived.numbers)) tokens[`n.${key}`] = show(value);

  let out = html;
  for (const [name, body] of Object.entries({ parts, params: table, derived: follows, walls, data })) {
    const block = new RegExp(`(<!--kit:${name}-->)[\\s\\S]*?(\\s*<!--/kit:${name}-->)`);
    if (!block.test(out)) throw new Error(`index.html has no <!--kit:${name}--> block`);
    out = out.replace(block, (all, open, close) => `${open}\n${body}${close}`);
  }
  return out.replace(/(<span data-kit="([\w.]+)">)[^<]*(<\/span>)/g, (all, open, key, close) => {
    if (!(key in tokens)) throw new Error(`index.html asks for a number the script does not have: ${key}`);
    return `${open}${tokens[key]}${close}`;
  });
}

// ---------------------------------------------------------------------------------------------
// Everything the kit ships, as a map of repository path to bytes.

export function readParams() { return JSON.parse(readFileSync(resolve(root, PARAMS_PATH), 'utf8')); }

export function build(params = readParams()) {
  const d = derive(params);
  const out = new Map();
  const manifest = {
    kit: params.kit,
    version: params.version,
    status: params.status,
    units: params.units,
    generator: 'scripts/baby-bonfire/first-place.mjs',
    params: 'https://pointcast.xyz/baby-bonfire/first-place/files/params.json',
    licence: 'CERN-OHL-P-2.0',
    licenceText: 'https://pointcast.xyz/baby-bonfire/first-place/files/LICENSE-CERN-OHL-P-2.0.txt',
    note: 'Each file sits the way it prints, flat side on z = 0. Sizes are the bounding box of the mesh.',
    files: [],
    derived: d.numbers,
    walls: d.walls,
    thinnestWall: d.minWall,
  };
  // What the drawing on the page needs to stand the parts up the way they are used.
  const preview = {
    unit: 0.001,
    scene: {
      top: d.numbers.tileOverallHeight,
      bay: [params.bay.x, params.bay.y],
      seat: r2(d.numbers.tileOverallHeight - d.puckDepth),
      shell: params.shell.height,
      lid: params.lid.thickness,
      lift: 14,
    },
    parts: {},
  };
  const solids = {};
  for (const part of PARTS) {
    const solid = part.build(params, d);
    const m = inspect(solid);
    const bytes = toStl(solid, `Baby Bonfire first place v${params.version} ${part.id} mm - a proposal, not yet printed`);
    out.set(`${KIT_DIR}/files/${part.file}`, bytes);
    manifest.files.push({
      id: part.id,
      name: part.name,
      file: part.file,
      url: `https://pointcast.xyz/baby-bonfire/first-place/files/${part.file}`,
      optional: Boolean(part.optional),
      prints: part.prints,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      triangles: m.triangles,
      points: m.points,
      size: m.size,
      min: m.min,
      max: m.max,
      volumeMm3: Math.round(m.volume),
      holesThrough: m.handles,
    });
    preview.parts[part.id] = { v: solid.v.flat().map((n) => Math.round(n * 1000)), f: solid.f.flat() };
    solids[part.id] = solid;
  }
  out.set(`${KIT_DIR}/files/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  const pagePath = resolve(root, PAGE_PATH);
  if (!existsSync(pagePath)) throw new Error(`${PAGE_PATH} is missing`);
  out.set(PAGE_PATH, renderPage(readFileSync(pagePath, 'utf8'), { params, derived: d, manifest, preview }));
  return { params, derived: d, manifest, preview, solids, out };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const check = process.argv.includes('--check');
  const { out, manifest } = build();
  const stale = [];
  for (const [path, bytes] of out) {
    const full = resolve(root, path);
    const now = existsSync(full) ? readFileSync(full) : null;
    const same = now && Buffer.compare(now, Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)) === 0;
    if (same) continue;
    stale.push(path);
    if (!check) { mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, bytes); }
  }
  for (const f of manifest.files) console.log(`  ${f.file.padEnd(16)} ${String(f.triangles).padStart(5)} triangles  ${f.size.join(' x ')} mm  ${(f.bytes / 1024).toFixed(1)} KB`);
  console.log(`  thinnest wall ${manifest.thinnestWall.mm} mm (${manifest.thinnestWall.where})`);
  if (check && stale.length) { console.error(`Stale: ${stale.join(', ')}\nRun node scripts/baby-bonfire/first-place.mjs`); process.exit(1); }
  console.log(check ? 'first place kit: committed files are current' : stale.length ? `first place kit: wrote ${stale.length} file(s)` : 'first place kit: nothing to change');
}
