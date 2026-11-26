/* Guilloche note engraver. Lathe-work rosettes and borders from a seed. */
(function (g) {
  'use strict';
  var K = g.MakeKit;
  var W = 1200, H = 560, TAU = Math.PI * 2;

  var INKS = {
    graphite: '#1f1f1f', blue: '#1f3f73', sepia: '#6b4423', viridian: '#1d5c4d', plum: '#5a2a52', signal: '#d23a08'
  };
  var PAPERS = { white: '#fbfaf6', cream: '#f2e9d4', sage: '#e6ede3', fog: '#e9e9ee' };
  function inkOpts() {
    return Object.keys(INKS).map(function (k) { return { v: k, label: k, swatch: INKS[k] }; });
  }

  var schema = [
    { key: 'seed', type: 'text', label: 'Seed', def: 'lathe-0001', max: 32, hint: 'Same seed, same note. Change one letter for a new one.' },
    { key: 'word', type: 'text', label: 'Word in the cartouche', def: 'POINTCAST', max: 14, upper: true },
    { key: 'num', type: 'range', label: 'Numeral', def: 25, min: 0, max: 999, step: 1 },
    { group: 'Lathe', key: 'lathe', type: 'seg', label: 'Core curve', def: 'epi', options: [
      { v: 'epi', label: 'Epitrochoid' }, { v: 'hypo', label: 'Hypotrochoid' }, { v: 'rose', label: 'Rose' }] },
    { key: 'petals', type: 'range', label: 'Petals', def: 12, min: 3, max: 24, step: 1 },
    { key: 'lines', type: 'range', label: 'Line density', def: 22, min: 6, max: 40, step: 1, hint: 'Copies of each curve, turned a little each time.' },
    { key: 'waves', type: 'range', label: 'Border waves', def: 64, min: 24, max: 120, step: 2 },
    { key: 'bg', type: 'toggle', label: 'Wave field behind', def: true },
    { group: 'Ink and paper', key: 'ink', type: 'seg', label: 'Main ink', def: 'blue', options: inkOpts() },
    { key: 'ink2', type: 'seg', label: 'Second ink', def: 'sepia', options: inkOpts() },
    { key: 'paper', type: 'seg', label: 'Paper', def: 'cream', options: Object.keys(PAPERS).map(function (k) { return { v: k, label: k, swatch: PAPERS[k] }; }) }
  ];
  schema.forEach(function (f) { if (f.group === undefined) delete f.group; });

  /* rounded-rect perimeter: point and outward normal at arc length s */
  function rrect(x0, y0, x1, y1, r) {
    var w = x1 - x0 - 2 * r, h = y1 - y0 - 2 * r, q = Math.PI * r / 2;
    var segs = [w, q, h, q, w, q, h, q];
    var L = segs.reduce(function (a, b) { return a + b; }, 0);
    function at(s) {
      s = ((s % L) + L) % L;
      var i = 0;
      while (s > segs[i]) { s -= segs[i]; i++; }
      var a;
      switch (i) {
        case 0: return [x0 + r + s, y0, 0, -1];
        case 1: a = -Math.PI / 2 + s / r; return [x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a), Math.cos(a), Math.sin(a)];
        case 2: return [x1, y0 + r + s, 1, 0];
        case 3: a = s / r; return [x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)];
        case 4: return [x1 - r - s, y1, 0, 1];
        case 5: a = Math.PI / 2 + s / r; return [x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)];
        case 6: return [x0, y1 - r - s, -1, 0];
        default: a = Math.PI + s / r; return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a), Math.cos(a), Math.sin(a)];
      }
    }
    return { L: L, at: at };
  }

  function border(st, r, ink, ink2) {
    var path = rrect(46, 46, W - 46, H - 46, 26);
    var strands = 6, n = 1500, out = '';
    var h2 = r.range(0.15, 0.4), h3 = r.int(2, 4), ph = r.range(0, TAU);
    for (var i = 0; i < strands; i++) {
      var phase = i * TAU / strands, pts = [];
      for (var k = 0; k <= n; k++) {
        var s = k / n * path.L, p = path.at(s);
        var u = TAU * st.waves * k / n;
        var off = 15 * ((1 - h2) * Math.sin(u + phase) + h2 * Math.sin(h3 * u - phase + ph));
        pts.push([p[0] + p[2] * off, p[1] + p[3] * off]);
      }
      out += '<path d="' + K.poly(pts, true) + '" fill="none" stroke="' + (i % 2 ? ink2 : ink) + '" stroke-width="0.8"/>';
    }
    // rules either side of the band
    out += '<rect x="24.5" y="24.5" width="' + (W - 49) + '" height="' + (H - 49) + '" rx="40" fill="none" stroke="' + ink + '" stroke-width="1.6"/>';
    out += '<rect x="28.5" y="28.5" width="' + (W - 57) + '" height="' + (H - 57) + '" rx="37" fill="none" stroke="' + ink + '" stroke-width="0.6"/>';
    out += '<rect x="66.5" y="66.5" width="' + (W - 133) + '" height="' + (H - 133) + '" rx="10" fill="none" stroke="' + ink + '" stroke-width="1"/>';
    return out;
  }

  function waveField(st, r, ink) {
    var out = '', fx = r.range(0.012, 0.03), fy = r.range(0.04, 0.12), amp = r.range(3, 7), fx2 = r.range(0.002, 0.006);
    for (var y = 76; y <= H - 76; y += 7) {
      var pts = [];
      for (var x = 70; x <= W - 70; x += 8) {
        pts.push([x, y + amp * Math.sin(x * fx + y * fy) * Math.sin(x * fx2 + y * 0.01)]);
      }
      out += K.poly(pts, false);
    }
    return '<path d="' + out + '" fill="none" stroke="' + ink + '" stroke-width="0.55" opacity="0.28"/>';
  }

  // One lathe curve: returns points around (cx, cy), fitted inside radius R.
  function core(type, p, d, R, rot, steps) {
    var pts = [], k, t, x, y, m;
    if (type === 'rose') {
      for (k = 0; k <= steps; k++) {
        t = TAU * k / steps;
        m = R * (0.55 + 0.45 * Math.sin(p * t) * (0.6 + 0.4 * Math.cos(2 * p * t + d * 3)));
        pts.push([m * Math.cos(t + rot), m * Math.sin(t + rot)]);
      }
      return pts;
    }
    // trochoids with integer lobes: outer circle p, rolling circle 1, pen distance d
    var big = type === 'epi' ? p + 1 : p - 1, ratio = type === 'epi' ? p + 1 : p - 1;
    var maxr = big + d;
    for (k = 0; k <= steps; k++) {
      t = TAU * k / steps;
      if (type === 'epi') { x = big * Math.cos(t) - d * Math.cos(ratio * t); y = big * Math.sin(t) - d * Math.sin(ratio * t); }
      else { x = big * Math.cos(t) + d * Math.cos(ratio * t); y = big * Math.sin(t) - d * Math.sin(ratio * t); }
      var c = Math.cos(rot), s = Math.sin(rot);
      pts.push([(x * c - y * s) * R / maxr, (x * s + y * c) * R / maxr]);
    }
    return pts;
  }

  function shift(pts, cx, cy) { return pts.map(function (q) { return [q[0] + cx, q[1] + cy]; }); }

  // Annular wave net: lines weave between rIn and rOut.
  function ring(cx, cy, rIn, rOut, p, copies, steps, h) {
    var d = '';
    for (var j = 0; j < copies; j++) {
      var rot = j * TAU / (p * copies), pts = [];
      for (var k = 0; k <= steps; k++) {
        var t = TAU * k / steps;
        var w = 0.5 + 0.5 * ((1 - h) * Math.sin(p * t + rot * p) + h * Math.sin(3 * p * t - rot * p * 2));
        var m = rIn + (rOut - rIn) * w;
        pts.push([cx + m * Math.cos(t), cy + m * Math.sin(t)]);
      }
      d += K.poly(pts, true);
    }
    return d;
  }

  function rosette(st, r, cx, cy, R, p, copies, ink, ink2, numeral, paper, small) {
    var steps = Math.max(240, p * 30), out = '';
    var h = r.range(0.1, 0.35);
    out += '<path d="' + ring(cx, cy, R * 0.66, R, p, copies, steps, h) + '" fill="none" stroke="' + ink + '" stroke-width="' + (small ? 0.5 : 0.6) + '"/>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + K.n1(R * 0.66) + '" fill="none" stroke="' + ink + '" stroke-width="0.8"/>';
    var dcore = '', dpen = r.range(0.5, 1.6), coreCopies = Math.max(3, Math.round(copies * 0.6));
    for (var j = 0; j < coreCopies; j++) {
      dcore += K.poly(shift(core(st.lathe, p, dpen, R * 0.62, j * TAU / (p * coreCopies * 2), steps), cx, cy), true);
    }
    out += '<path d="' + dcore + '" fill="none" stroke="' + ink2 + '" stroke-width="' + (small ? 0.45 : 0.55) + '"/>';
    if (numeral !== null) {
      var rr = R * (small ? 0.4 : 0.25);
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + K.n1(rr) + '" fill="' + paper + '" stroke="' + ink + '" stroke-width="1.2"/>';
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + K.n1(rr - 4) + '" fill="none" stroke="' + ink + '" stroke-width="0.5"/>';
      var fs = rr * (String(numeral).length > 2 ? 0.78 : 1.02);
      out += '<text x="' + cx + '" y="' + K.n1(cy + fs * 0.35) + '" text-anchor="middle" font-family="' + K.FONT.serif + '" font-size="' + K.n1(fs) + '" font-weight="700" fill="' + ink + '">' + numeral + '</text>';
    }
    return out;
  }

  function ellipseBand(cx, cy, rx, ry, waves, ink, ink2) {
    var out = '', n = 900;
    for (var i = 0; i < 4; i++) {
      var pts = [];
      for (var k = 0; k <= n; k++) {
        var t = TAU * k / n, off = 7 * Math.sin(waves * t + i * TAU / 4);
        pts.push([cx + (rx + off) * Math.cos(t), cy + (ry + off) * Math.sin(t)]);
      }
      out += '<path d="' + K.poly(pts, true) + '" fill="none" stroke="' + (i % 2 ? ink2 : ink) + '" stroke-width="0.7"/>';
    }
    return out;
  }

  function render(st, opts) {
    opts = opts || {};
    var r = K.rng('guilloche|' + st.seed);
    var ink = INKS[st.ink], ink2 = INKS[st.ink2], paper = PAPERS[st.paper];
    var body = '<rect width="' + W + '" height="' + H + '" fill="' + paper + '"/>';
    body += '<defs><clipPath id="gl-in"><rect x="67" y="67" width="' + (W - 134) + '" height="' + (H - 134) + '" rx="10"/></clipPath></defs>';
    if (st.bg) body += '<g clip-path="url(#gl-in)">' + waveField(st, r, ink2) + '</g>';
    body += border(st, r, ink, ink2);

    // main rosette
    body += rosette(st, r, 296, 280, 186, st.petals, st.lines, ink, ink2, String(st.num), paper, false);
    // corner rosettes
    var p2 = Math.max(3, Math.round(st.petals * 0.75) + r.int(-1, 1));
    body += rosette(st, r, 1066, 136, 52, p2, Math.max(6, Math.round(st.lines * 0.6)), ink, ink2, String(st.num), paper, true);
    body += rosette(st, r, 1066, 412, 52, p2, Math.max(6, Math.round(st.lines * 0.6)), ink2, ink, String(st.num), paper, true);

    // cartouche
    var cx = 760, cy = 262, rx = 220, ry = 86;
    body += ellipseBand(cx, cy, rx + 12, ry + 12, Math.round(st.waves / 2), ink, ink2);
    body += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + paper + '" stroke="' + ink + '" stroke-width="1.6"/>';
    body += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (rx - 7) + '" ry="' + (ry - 7) + '" fill="none" stroke="' + ink + '" stroke-width="0.5"/>';
    var word = st.word.trim();
    if (word) {
      var fs = Math.min(58, 330 / Math.max(1, word.length) * 1.5);
      var tl = Math.min(rx * 1.6, word.length * fs * 0.82);
      body += '<text x="' + cx + '" y="' + K.n1(cy + fs * 0.34) + '" text-anchor="middle" font-family="' + K.FONT.serif + '" font-size="' + K.n1(fs) + '" letter-spacing="' + K.n1(fs * 0.12) + '" fill="' + ink + '"' +
        (word.length > 5 ? ' textLength="' + K.n1(tl) + '" lengthAdjust="spacingAndGlyphs"' : '') + '>' + K.esc(word) + '</text>';
    }

    // serial and microtext
    var serial = 'PC ' + String(r.int(0, 9999)).padStart(4, '0') + ' ' + String(r.int(0, 9999)).padStart(4, '0');
    body += '<text x="' + cx + '" y="402" text-anchor="middle" font-family="' + K.FONT.mono + '" font-size="22" letter-spacing="3" fill="' + ink2 + '">' + serial + '</text>';
    var micro = '';
    for (var i = 0; i < 14; i++) micro += 'SPECIMEN NOT MONEY · ';
    body += '<text x="540" y="432" font-family="' + K.FONT.mono + '" font-size="5.2" fill="' + ink + '" textLength="440" lengthAdjust="spacingAndGlyphs">' + micro + '</text>';
    body += '<line x1="540" y1="440" x2="980" y2="440" stroke="' + ink + '" stroke-width="0.6"/>';
    body += '<text x="' + (W - 82) + '" y="' + (H - 78) + '" text-anchor="end" font-family="' + K.FONT.sans + '" font-size="13" letter-spacing="1.5" fill="' + ink + '">Specimen, not money</text>';
    body += '<text x="540" y="' + (H - 78) + '" font-family="' + K.FONT.mono + '" font-size="11" letter-spacing="1" fill="' + ink + '" opacity="0.8">POINTCAST.XYZ/MAKE · SEED ' + K.esc(st.seed.toUpperCase()) + '</text>';
    return K.svgDoc(W, H, body, { label: describe(st), physical: opts.physical });
  }

  function describe(st) {
    return 'Guilloché specimen note, ' + st.lathe + ' rosette with ' + st.petals + ' petals, the word ' + (st.word || 'blank') + ' in the cartouche, numeral ' + st.num + ', seed ' + st.seed + '.';
  }

  function shuffle(r) {
    var inks = Object.keys(INKS), a = r.pick(inks), b = r.pick(inks.filter(function (x) { return x !== a; }));
    return {
      lathe: r.pick(['epi', 'hypo', 'rose']), petals: r.int(5, 20), lines: r.int(12, 32), waves: 2 * r.int(18, 54),
      ink: a, ink2: b, paper: r.pick(Object.keys(PAPERS)), num: r.pick([1, 2, 5, 10, 12, 20, 25, 50, 64, 100, 108, 256])
    };
  }

  var T = {
    slug: 'guilloche', title: 'Guilloché note engraver', schema: schema, render: render, describe: describe, shuffle: shuffle,
    size: function () { return { w: 2400, h: 1120, dpi: 300, label: '8 x 3.73 in', physical: ['8in', '3.7333in'] }; }
  };
  g.MakeTools.guilloche = T;
  if (g.document && document.getElementById('art')) K.mount(T);
})(typeof globalThis !== 'undefined' ? globalThis : this);
