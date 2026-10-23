/**
 * PointCast Script pen: turn a centerline into a filled ribbon.
 *
 * Coordinates are font units, y up. The ribbon is original geometry for
 * PointCast Script. It does not trace any other face.
 *
 * `through` draws a curve that passes through the points you give
 * (Catmull-Rom, converted to cubics). `ribbon` offsets that curve into a
 * closed outline, thicker on downstrokes, with round caps.
 */

const num = (n) => Math.round(n * 100) / 100;

export function pt(p) {
  if (Array.isArray(p)) return { x: p[0], y: p[1] };
  return { x: p.x, y: p.y };
}

/** A cubic path through `points`. Closed paths repeat back to the first point. */
export function through(points, { closed = false } = {}) {
  const s = points.map(pt);
  if (s.length < 2) throw new Error('a stroke needs at least two points');
  const at = (i) => (closed ? s[(i + s.length) % s.length] : s[Math.max(0, Math.min(s.length - 1, i))]);
  let d = `M ${num(s[0].x)} ${num(s[0].y)}`;
  const segs = closed ? s.length : s.length - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${num(c1x)} ${num(c1y)} ${num(c2x)} ${num(c2y)} ${num(p2.x)} ${num(p2.y)}`;
  }
  if (closed) d += ' Z';
  return d;
}

/** A filled circle, as one closed contour (not a ribbon). */
export function disk(cx, cy, r) {
  const k = r * 0.5522847498;
  return `M ${num(cx - r)} ${num(cy)} C ${num(cx - r)} ${num(cy + k)} ${num(cx - k)} ${num(cy + r)} ${num(cx)} ${num(cy + r)} C ${num(cx + k)} ${num(cy + r)} ${num(cx + r)} ${num(cy + k)} ${num(cx + r)} ${num(cy)} C ${num(cx + r)} ${num(cy - k)} ${num(cx + k)} ${num(cy - r)} ${num(cx)} ${num(cy - r)} C ${num(cx - k)} ${num(cy - r)} ${num(cx - r)} ${num(cy - k)} ${num(cx - r)} ${num(cy)} Z`;
}

function tokenize(d) {
  const out = [];
  const re = /([MLQCZ])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
  let cmd = '';
  let args = [];
  const need = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };
  for (const m of d.matchAll(re)) {
    const t = m[1];
    if (t) {
      if (cmd) out.push({ cmd, args });
      cmd = t.toUpperCase();
      args = [];
      if (cmd === 'Z') out.push({ cmd, args: [] });
    } else {
      args.push(Number(m[0]));
      const n = need[cmd];
      if (n && args.length === n) {
        out.push({ cmd, args });
        args = [];
        if (cmd === 'M') cmd = 'L';
      }
    }
  }
  return out.filter((c) => c.cmd !== 'Z' || c.args.length === 0);
}

function sampleCubic(p0, p1, p2, p3, steps) {
  const pts = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return pts;
}

function sampleQuad(p0, p1, p2, steps) {
  const pts = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    });
  }
  return pts;
}

/** Sample an SVG path (`M/L/Q/C/Z`) into points. Relative commands are not accepted. */
export function samplePath(d, step = 12) {
  const tokens = tokenize(d);
  const pts = [];
  let cur = null;
  let start = null;
  const push = (p) => {
    if (!pts.length || Math.hypot(p.x - pts[pts.length - 1].x, p.y - pts[pts.length - 1].y) > 0.4) pts.push(p);
    cur = p;
  };
  for (const tok of tokens) {
    if (tok.cmd === 'M') {
      cur = { x: tok.args[0], y: tok.args[1] };
      start = cur;
      push(cur);
    } else if (tok.cmd === 'L') {
      const next = { x: tok.args[0], y: tok.args[1] };
      const dist = Math.hypot(next.x - cur.x, next.y - cur.y);
      const n = Math.max(1, Math.round(dist / step));
      for (let i = 1; i <= n; i++) push({ x: cur.x + ((next.x - cur.x) * i) / n, y: cur.y + ((next.y - cur.y) * i) / n });
    } else if (tok.cmd === 'Q') {
      const p1 = { x: tok.args[0], y: tok.args[1] };
      const p2 = { x: tok.args[2], y: tok.args[3] };
      const dist = Math.hypot(p1.x - cur.x, p1.y - cur.y) + Math.hypot(p2.x - p1.x, p2.y - p1.y);
      for (const p of sampleQuad(cur, p1, p2, Math.max(4, Math.round(dist / step)))) push(p);
    } else if (tok.cmd === 'C') {
      const p1 = { x: tok.args[0], y: tok.args[1] };
      const p2 = { x: tok.args[2], y: tok.args[3] };
      const p3 = { x: tok.args[4], y: tok.args[5] };
      const dist = Math.hypot(p1.x - cur.x, p1.y - cur.y) + Math.hypot(p2.x - p1.x, p2.y - p1.y) + Math.hypot(p3.x - p2.x, p3.y - p2.y);
      for (const p of sampleCubic(cur, p1, p2, p3, Math.max(6, Math.round(dist / step)))) push(p);
    } else if (tok.cmd === 'Z' && start) {
      push(start);
    }
  }
  return pts;
}

function normals(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    out.push({ tx, ty, nx: -ty, ny: tx });
  }
  return out;
}

function arc(cx, cy, r, a0, a1, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((a1 - a0) * i) / steps;
    pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r });
  }
  return pts;
}

/**
 * Closed outline of a stroke. `width` is the downstroke thickness.
 * Upstrokes narrow toward `thin` (0–1 of width). Set `pressure` false for a
 * constant width (bars, circles-as-strokes).
 */
export function ribbon(d, width, { pressure = true, thin = 0.42 } = {}) {
  const closed = /Z\s*$/i.test(d.trim());
  let pts = samplePath(d, Math.max(8, width / 4));
  if (pts.length < 2) return '';
  if (closed && pts.length > 2) pts = pts.slice(0, -1);
  const nrm = normals(pts);
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const down = pressure ? Math.max(0, -nrm[i].ty) : 1;
    const w = (width * (thin + (1 - thin) * (pressure ? down : 1))) / 2;
    left.push({ x: pts[i].x + nrm[i].nx * w, y: pts[i].y + nrm[i].ny * w });
    right.push({ x: pts[i].x - nrm[i].nx * w, y: pts[i].y - nrm[i].ny * w });
  }
  if (closed) return contour([...left, ...right.reverse()], true);
  const end = pts[pts.length - 1];
  const start = pts[0];
  const eAng = Math.atan2(nrm[nrm.length - 1].ny, nrm[nrm.length - 1].nx);
  const sAng = Math.atan2(nrm[0].ny, nrm[0].nx);
  const eW = Math.hypot(left[left.length - 1].x - end.x, left[left.length - 1].y - end.y);
  const sW = Math.hypot(left[0].x - start.x, left[0].y - start.y);
  const capE = arc(end.x, end.y, eW, eAng, eAng + Math.PI, 5).slice(1, -1);
  const capS = arc(start.x, start.y, sW, sAng + Math.PI, sAng + Math.PI * 2, 5).slice(1, -1);
  return contour([...left, ...capE, ...right.reverse(), ...capS], true);
}

export function contour(points, closed = true) {
  if (!points.length) return '';
  let d = `M ${num(points[0].x)} ${num(points[0].y)}`;
  for (let i = 1; i < points.length; i++) d += ` L ${num(points[i].x)} ${num(points[i].y)}`;
  if (closed) d += ' Z';
  return d;
}

/** Apply a rightward slant: x' = x + y * slope. Slope 0.28 is about 16 degrees. */
export function slantContours(contours, slope) {
  if (!slope) return contours;
  return contours.map((d) =>
    d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_, xs, ys) => {
      const x = Number(xs);
      const y = Number(ys);
      return `${num(x + y * slope)} ${num(y)}`;
    }),
  );
}

/**
 * Build the filled contours for one glyph.
 * strokes: { d, w, pressure? } ribbons, or { fill } already-closed paths.
 */
export function glyphContours(strokes, slope = 0) {
  const contours = [];
  for (const s of strokes) {
    if (s.fill) contours.push(s.fill);
    else contours.push(ribbon(s.d, s.w, { pressure: s.pressure !== false, thin: s.thin ?? 0.4 }));
  }
  return slantContours(contours.filter(Boolean), slope);
}
