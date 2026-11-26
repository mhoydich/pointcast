/* Island chart. A seeded terrain contoured with marching squares, dressed as an imaginary sea chart. */
(function (g) {
  'use strict';
  var K = g.MakeKit;
  var W = 1400, H = 1000, TAU = Math.PI * 2;
  var MX = 70, MY = 70, MW = 1260, MH = 760; // map frame
  var NX = 126, NY = 76; // grid cells

  var PALETTES = {
    chart: { bg: '#f4f1e8', ink: '#16202a', land: '#e6dcc3', faint: '#9aa7b0', accent: '#1f6fb2', shoal: '#d6e6f1' },
    night: { bg: '#0f1720', ink: '#e7ecef', land: '#2a3440', faint: '#55636f', accent: '#f2b84b', shoal: '#16283a' }
  };

  var schema = [
    { key: 'seed', type: 'text', label: 'Seed', def: 'chart-0031', max: 32, hint: 'Raises the land, names the island and places the soundings.' },
    { key: 'name', type: 'text', label: 'Island name', def: '', max: 22, hint: 'Leave blank for an invented name.' },
    { group: 'Terrain', key: 'sea', type: 'range', label: 'Sea level', def: 50, min: 20, max: 80, step: 1, hint: 'Higher water, smaller island.' },
    { key: 'rough', type: 'range', label: 'Roughness', def: 50, min: 0, max: 100, step: 1 },
    { key: 'isles', type: 'range', label: 'Land masses', def: 2, min: 1, max: 5, step: 1 },
    { key: 'levels', type: 'range', label: 'Contour lines', def: 7, min: 3, max: 14, step: 1 },
    { group: 'Chart', key: 'soundings', type: 'toggle', label: 'Soundings', def: true },
    { key: 'rose', type: 'toggle', label: 'Compass rose', def: true },
    { key: 'pal', type: 'seg', label: 'Palette', def: 'chart', options: [{ v: 'chart', label: 'Day chart', swatch: '#f4f1e8' }, { v: 'night', label: 'Night chart', swatch: '#0f1720' }] }
  ];

  var SYL = ['ka', 'mo', 'ri', 'tes', 'lu', 'van', 'or', 'e', 'shi', 'pa', 'nel', 'do', 'ar', 'im', 'qua', 'bel', 'so', 'tir', 'ul', 'en'];
  function islandName(st) {
    if (st.name && st.name.trim()) return st.name.trim();
    var r = K.rng('isle-name|' + st.seed);
    var w = r.pick(SYL) + r.pick(SYL) + (r.chance(0.6) ? r.pick(SYL) : '');
    w = w.charAt(0).toUpperCase() + w.slice(1);
    return r.pick(['Isle of ' + w, w + ' Island', w + ' Cay', w + ' Rock', 'Little ' + w]);
  }

  // Value noise on a seeded lattice, a few octaves.
  function makeNoise(r) {
    var N = 64, tab = [];
    for (var i = 0; i < N * N; i++) tab.push(r());
    function at(x, y) { return tab[((y % N + N) % N) * N + ((x % N + N) % N)]; }
    function sm(t) { return t * t * (3 - 2 * t); }
    return function (x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
      var a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    };
  }

  function field(st) {
    var r = K.rng('isle|' + st.seed), noise = makeNoise(r), blobs = [];
    for (var b = 0; b < st.isles; b++) blobs.push({ x: r.range(0.3, 0.7), y: r.range(0.3, 0.7), s: r.range(0.09, 0.17) * (b ? 0.7 : 1) });
    var pers = 0.35 + st.rough / 100 * 0.3, f = [];
    for (var j = 0; j <= NY; j++) {
      var row = [];
      for (var i = 0; i <= NX; i++) {
        var u = i / NX, v = j / NY, n = 0, amp = 1, fr = 3, tot = 0;
        for (var o = 0; o < 5; o++) { n += noise(u * fr * 1.6 + o * 17, v * fr + o * 31) * amp; tot += amp; amp *= pers; fr *= 2; }
        n /= tot;
        var land = 0;
        blobs.forEach(function (bl) { var dx = (u - bl.x) * 1.6, dy = v - bl.y; land = Math.max(land, Math.exp(-(dx * dx + dy * dy) / (2 * bl.s * bl.s))); });
        var edge = Math.min(u, 1 - u, v, 1 - v) * 6; // fall off toward the frame
        row.push(land * 0.8 * Math.min(1, edge) + (n - 0.5) * 0.6 - 0.12 - (1 - Math.min(1, edge)) * 0.2);
      }
      f.push(row);
    }
    return f;
  }

  // Marching squares. Each crossing is keyed by its grid edge, so pieces chain exactly.
  function contour(f, lv) {
    var segs = [], pts = {};
    function key(i, j, dir) { return dir + i + ',' + j; } // h: edge (i,j)-(i+1,j); v: edge (i,j)-(i,j+1)
    function pt(k, i, j, dir) {
      if (!pts[k]) {
        var a = f[j][i], b = dir === 'h' ? f[j][i + 1] : f[j + 1][i], t = (lv - a) / (b - a);
        pts[k] = dir === 'h' ? [i + t, j] : [i, j + t];
      }
      return k;
    }
    for (var j = 0; j < NY; j++) for (var i = 0; i < NX; i++) {
      var tl = f[j][i] > lv, tr = f[j][i + 1] > lv, br = f[j + 1][i + 1] > lv, bl = f[j + 1][i] > lv;
      var c = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
      if (c === 0 || c === 15) continue;
      var T = pt(key(i, j, 'h'), i, j, 'h'), B = pt(key(i, j + 1, 'h'), i, j + 1, 'h');
      var L = pt(key(i, j, 'v'), i, j, 'v'), R = pt(key(i + 1, j, 'v'), i + 1, j, 'v');
      var mid = (f[j][i] + f[j][i + 1] + f[j + 1][i] + f[j + 1][i + 1]) / 4 > lv;
      switch (c) {
        case 1: case 14: segs.push([L, B]); break;
        case 2: case 13: segs.push([B, R]); break;
        case 3: case 12: segs.push([L, R]); break;
        case 4: case 11: segs.push([T, R]); break;
        case 6: case 9: segs.push([T, B]); break;
        case 7: case 8: segs.push([L, T]); break;
        case 5: if (mid) { segs.push([L, T]); segs.push([B, R]); } else { segs.push([L, B]); segs.push([T, R]); } break;
        case 10: if (mid) { segs.push([L, B]); segs.push([T, R]); } else { segs.push([L, T]); segs.push([B, R]); } break;
      }
    }
    // chain
    var adj = {};
    segs.forEach(function (s, n) { (adj[s[0]] = adj[s[0]] || []).push(n); (adj[s[1]] = adj[s[1]] || []).push(n); });
    var used = new Array(segs.length), lines = [];
    function walk(start, n0) {
      var keys = [start], cur = start, n = n0;
      while (n !== undefined && !used[n]) {
        used[n] = true;
        var s = segs[n], nxt = s[0] === cur ? s[1] : s[0];
        keys.push(nxt); cur = nxt;
        n = (adj[cur] || []).filter(function (m) { return !used[m]; })[0];
      }
      return keys;
    }
    // open ends first (degree 1), then loops
    Object.keys(adj).forEach(function (k) { if (adj[k].length === 1 && !used[adj[k][0]]) lines.push(walk(k, adj[k][0])); });
    segs.forEach(function (s, n) { if (!used[n]) lines.push(walk(s[0], n)); });
    return lines.map(function (ks) {
      var p = ks.map(function (k) { return pts[k]; });
      return { pts: p, closed: ks.length > 2 && ks[0] === ks[ks.length - 1] };
    });
  }

  function toXY(p) { return [MX + p[0] / NX * MW, MY + p[1] / NY * MH]; }
  function levelsOf(st) {
    var sea = (st.sea - 50) / 100 * 0.5 + 0.12, out = [], n = st.levels, depth = Math.max(2, Math.round(n / 3));
    for (var i = -depth; i < n - depth; i++) out.push({ v: sea + i * 0.07, i: i });
    return out;
  }

  function rose(x, y, rad, P) {
    var o = '<g stroke="' + P.ink + '" fill="none">';
    o += '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" stroke-width="1.2"/><circle cx="' + x + '" cy="' + y + '" r="' + (rad - 12) + '" stroke-width="0.6"/>';
    for (var d = 0; d < 360; d += 5) {
      var a = d * Math.PI / 180, l = d % 45 === 0 ? 12 : d % 15 === 0 ? 8 : 4;
      o += '<line x1="' + K.n1(x + Math.sin(a) * rad) + '" y1="' + K.n1(y - Math.cos(a) * rad) + '" x2="' + K.n1(x + Math.sin(a) * (rad - l)) + '" y2="' + K.n1(y - Math.cos(a) * (rad - l)) + '" stroke-width="0.8"/>';
    }
    o += '</g>';
    for (var q = 0; q < 8; q++) {
      var ang = q * Math.PI / 4, len = q % 2 ? rad * 0.5 : rad * 0.86, w = q % 2 ? 6 : 10;
      var tip = [x + Math.sin(ang) * len, y - Math.cos(ang) * len];
      var s1 = [x + Math.sin(ang + Math.PI / 2) * w, y - Math.cos(ang + Math.PI / 2) * w], s2 = [x + Math.sin(ang - Math.PI / 2) * w, y - Math.cos(ang - Math.PI / 2) * w];
      o += '<path d="' + K.poly([[x, y], tip, s1], true) + '" fill="' + (q === 0 ? P.accent : P.ink) + '"/>';
      o += '<path d="' + K.poly([[x, y], tip, s2], true) + '" fill="' + P.bg + '" stroke="' + P.ink + '" stroke-width="0.8"/>';
    }
    o += '<text x="' + x + '" y="' + (y - rad - 10) + '" text-anchor="middle" font-family="' + K.FONT.serif + '" font-size="22" font-weight="700" fill="' + P.ink + '">N</text>';
    return o;
  }

  function render(st, opts) {
    opts = opts || {};
    var P = PALETTES[st.pal], f = field(st), lvls = levelsOf(st), r = K.rng('isle-dress|' + st.seed);
    var o = '<rect width="' + W + '" height="' + H + '" fill="' + P.bg + '"/>';
    o += '<defs><clipPath id="ic-frame"><rect x="' + MX + '" y="' + MY + '" width="' + MW + '" height="' + MH + '"/></clipPath></defs>';
    o += '<g clip-path="url(#ic-frame)">';
    var coast = null, under = '', lines = '';
    lvls.forEach(function (L) {
      var cs = contour(f, L.v);
      var d = cs.map(function (c) { return K.poly(c.pts.map(toXY), c.closed); }).join('');
      if (!d) return;
      if (L.i === -1) { under += '<path d="' + d + '" fill="' + P.shoal + '" fill-rule="evenodd"/>'; lines += '<path d="' + d + '" fill="none" stroke="' + P.accent + '" stroke-width="1" stroke-dasharray="5 4"/>'; }
      else if (L.i < -1) lines += '<path d="' + d + '" fill="none" stroke="' + P.accent + '" stroke-width="0.9" stroke-dasharray="2 5" stroke-opacity="0.8"/>';
      else if (L.i === 0) coast = d;
      else lines += '<path d="' + d + '" fill="none" stroke="' + P.ink + '" stroke-width="' + (L.i % 4 === 0 ? 1.4 : 0.7) + '" stroke-opacity="0.75"/>';
    });
    if (coast) { under += '<path d="' + coast + '" fill="' + P.land + '" fill-rule="evenodd"/>'; lines += '<path d="' + coast + '" fill="none" stroke="' + P.ink + '" stroke-width="2.4" stroke-linejoin="round"/>'; }
    o += under + lines;
    // peak
    var best = [0, 0, -9];
    for (var j = 0; j <= NY; j++) for (var i = 0; i <= NX; i++) if (f[j][i] > best[2]) best = [i, j, f[j][i]];
    var sea0 = lvls[Math.max(0, lvls.findIndex(function (l) { return l.i === 0; }))].v;
    if (best[2] > sea0) {
      var pk = toXY(best), ht = Math.round((best[2] - sea0) * 2400);
      o += '<path d="' + K.poly([[pk[0], pk[1] - 9], [pk[0] + 8, pk[1] + 6], [pk[0] - 8, pk[1] + 6]], true) + '" fill="' + P.ink + '"/>';
      o += '<text x="' + K.n1(pk[0] + 13) + '" y="' + K.n1(pk[1] + 5) + '" font-family="' + K.FONT.mono + '" font-size="14" fill="' + P.ink + '">' + ht + ' ft</text>';
    }
    // soundings in fathoms
    if (st.soundings) {
      o += '<g font-family="' + K.FONT.serif + '" font-style="italic" font-size="15" fill="' + P.ink + '" text-anchor="middle">';
      for (var s = 0, placed = 0, seen = []; s < 500 && placed < 70; s++) {
        var gi = r.int(2, NX - 2), gj = r.int(2, NY - 2), v = f[gj][gi];
        if (v >= sea0 - 0.02) continue;
        var xy = toXY([gi, gj]);
        if (st.rose && Math.hypot(xy[0] - 1210, xy[1] - 690) < 120) continue;
        if (seen.some(function (q) { return Math.abs(q[0] - xy[0]) < 34 && Math.abs(q[1] - xy[1]) < 22; })) continue;
        seen.push(xy);
        o += '<text x="' + K.n1(xy[0]) + '" y="' + K.n1(xy[1]) + '">' + Math.max(1, Math.round((sea0 - v) * 90)) + '</text>';
        placed++;
      }
      o += '</g>';
    }
    if (st.rose) o += rose(1210, 690, 95, P);
    o += '</g>';
    // frame with lat/long style ticks
    o += '<rect x="' + MX + '" y="' + MY + '" width="' + MW + '" height="' + MH + '" fill="none" stroke="' + P.ink + '" stroke-width="2"/>';
    o += '<rect x="' + (MX - 10) + '" y="' + (MY - 10) + '" width="' + (MW + 20) + '" height="' + (MH + 20) + '" fill="none" stroke="' + P.ink + '" stroke-width="0.8"/>';
    for (var t = 0; t < 42; t++) { var tx = MX + t * MW / 42; o += '<rect x="' + K.n1(tx) + '" y="' + (MY - 10) + '" width="' + K.n1(MW / 42) + '" height="10" fill="' + (t % 2 ? P.ink : 'none') + '"/><rect x="' + K.n1(tx) + '" y="' + (MY + MH) + '" width="' + K.n1(MW / 42) + '" height="10" fill="' + (t % 2 ? 'none' : P.ink) + '"/>'; }
    for (var u = 0; u < 25; u++) { var ty = MY + u * MH / 25; o += '<rect x="' + (MX - 10) + '" y="' + K.n1(ty) + '" width="10" height="' + K.n1(MH / 25) + '" fill="' + (u % 2 ? P.ink : 'none') + '"/><rect x="' + (MX + MW) + '" y="' + K.n1(ty) + '" width="10" height="' + K.n1(MH / 25) + '" fill="' + (u % 2 ? 'none' : P.ink) + '"/>'; }
    // title block
    var nm = islandName(st);
    o += '<text x="' + MX + '" y="895" font-family="' + K.FONT.serif + '" font-size="' + K.n1(Math.min(46, 900 / Math.max(6, nm.length * 0.55))) + '" font-weight="700" fill="' + P.ink + '">' + K.esc(nm) + '</text>';
    o += '<text x="' + MX + '" y="935" font-family="' + K.FONT.sans + '" font-size="15" font-weight="700" letter-spacing="3" fill="' + P.accent + '">IMAGINARY CHART, NOT FOR NAVIGATION</text>';
    o += '<text x="' + MX + '" y="962" font-family="' + K.FONT.mono + '" font-size="12.5" letter-spacing="1" fill="' + P.ink + '" opacity="0.7">SOUNDINGS IN FATHOMS · HEIGHTS IN FEET · SEED ' + K.esc(st.seed.toUpperCase()) + ' · POINTCAST.XYZ/MAKE/ISLAND-CHART</text>';
    // scale bar
    var sx = 950, sy = 900, seg = 70;
    for (var k = 0; k < 5; k++) o += '<rect x="' + (sx + k * seg) + '" y="' + sy + '" width="' + seg + '" height="10" fill="' + (k % 2 ? P.bg : P.ink) + '" stroke="' + P.ink + '" stroke-width="1"/>';
    for (var m = 0; m <= 5; m++) o += '<text x="' + (sx + m * seg) + '" y="' + (sy - 8) + '" text-anchor="middle" font-family="' + K.FONT.mono + '" font-size="12" fill="' + P.ink + '">' + m + '</text>';
    o += '<text x="' + (sx + 175) + '" y="' + (sy + 32) + '" text-anchor="middle" font-family="' + K.FONT.sans + '" font-size="12" letter-spacing="2" fill="' + P.ink + '">NAUTICAL MILES (INVENTED)</text>';
    return K.svgDoc(W, H, o, { label: describe(st), physical: opts.physical });
  }

  function describe(st) { return 'Imaginary sea chart of ' + islandName(st) + ', with ' + st.levels + ' contour levels' + (st.soundings ? ', soundings' : '') + (st.rose ? ' and a compass rose' : '') + '. Not for navigation.'; }
  function shuffle(r) { return { name: '', sea: r.int(35, 65), rough: r.int(10, 90), isles: r.int(1, 4), levels: r.int(5, 11), pal: r.chance(0.3) ? 'night' : 'chart' }; }

  var T = {
    slug: 'island-chart', title: 'Island chart', schema: schema, render: render, describe: describe, shuffle: shuffle,
    field: field, contour: contour, levelsOf: levelsOf, islandName: islandName, grid: { NX: NX, NY: NY },
    size: function (st) { return { w: 4200, h: 3000, dpi: 300, label: '14 x 10 in', bg: PALETTES[st.pal].bg, physical: ['14in', '10in'] }; }
  };
  g.MakeTools['island-chart'] = T;
  if (g.document && document.getElementById('art')) K.mount(T);
})(typeof globalThis !== 'undefined' ? globalThis : this);
