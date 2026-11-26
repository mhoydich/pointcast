/* Harmonograph plate. Damped pendulum figures, like a pen harmonograph or a scope photo. */
(function (g) {
  'use strict';
  var K = g.MakeKit;
  var W = 1000, H = 1000, TAU = Math.PI * 2;
  var CX = 500, CY = 470, R = 360;

  var PLATES = {
    paper: { bg: '#f6f4ee', ink: '#141414', faint: '#cfcabf', accent: '#d9400b', glow: 0 },
    phosphor: { bg: '#0b0f0c', ink: '#d8f5dd', faint: '#22312a', accent: '#7cf29a', glow: 1 }
  };

  var schema = [
    { key: 'seed', type: 'text', label: 'Seed', def: 'plate-0007', max: 32, hint: 'Sets the small second pendulum and the drift between traces.' },
    { group: 'Pendulums', key: 'fx', type: 'range', label: 'Frequency X', def: 3, min: 1, max: 9, step: 1 },
    { key: 'fy', type: 'range', label: 'Frequency Y', def: 2, min: 1, max: 9, step: 1, hint: 'Small whole-number ratios (3:2, 4:3, 5:4) make the classic figures.' },
    { key: 'detune', type: 'range', label: 'Detune', def: 3, min: 0, max: 100, step: 1, format: function (v) { return (v / 10).toFixed(1) + '%'; }, hint: 'A slight mistuning makes the figure slowly rotate as it draws.' },
    { key: 'phase', type: 'range', label: 'Phase', def: 90, min: 0, max: 360, step: 5, unit: 'deg' },
    { key: 'damp', type: 'range', label: 'Damping', def: 18, min: 0, max: 40, step: 1, hint: 'How fast the swing dies away. Zero never stops.' },
    { key: 'turns', type: 'range', label: 'Run time', def: 90, min: 10, max: 240, step: 5, unit: 'swings' },
    { group: 'Plate', key: 'traces', type: 'range', label: 'Traces', def: 3, min: 1, max: 6, step: 1, hint: 'Each trace is another release of the pen, nudged a little.' },
    { key: 'weight', type: 'range', label: 'Line weight', def: 12, min: 4, max: 40, step: 1, format: function (v) { return (v / 10).toFixed(1); } },
    { key: 'plate', type: 'seg', label: 'Plate', def: 'paper', options: [{ v: 'paper', label: 'Ink on paper', swatch: '#f6f4ee' }, { v: 'phosphor', label: 'Phosphor', swatch: '#0b0f0c' }] },
    { key: 'grid', type: 'toggle', label: 'Graticule', def: true },
    { key: 'caption', type: 'text', label: 'Caption', def: 'PLATE 07', max: 24, upper: true }
  ];

  // Points of one trace, normalised to [-1, 1] before damping.
  function trace(st, k) {
    var r = K.rng('harmono|' + st.seed + '|' + k);
    var r0 = K.rng('harmono|' + st.seed);
    var a2 = r0.range(0.03, 0.14), f2 = r0.int(1, 4) + r0.range(-0.01, 0.01), p2 = r0.range(0, TAU);
    var det = st.detune / 1000;
    var fx = st.fx * (1 + det), fy = st.fy;
    var ph = st.phase * Math.PI / 180 + k * r.range(0.02, 0.07);
    var d = st.damp / 2500;
    var amp = 1 - k * 0.07;
    var T = st.turns * TAU, n = Math.min(9000, 400 + st.turns * Math.max(st.fx, st.fy) * 32);
    var pts = [];
    var norm = 1 / (1 + a2);
    for (var i = 0; i <= n; i++) {
      var t = T * i / n, e = Math.exp(-d * t), e2 = Math.exp(-d * 1.4 * t);
      var x = (Math.sin(fx * t + ph) * e + a2 * Math.sin(f2 * t + p2) * e2) * norm * amp;
      var y = (Math.sin(fy * t) * e + a2 * Math.sin(f2 * t + p2 + Math.PI / 2) * e2) * norm * amp;
      pts.push([CX + x * R, CY - y * R]);
    }
    return pts;
  }

  function graticule(P) {
    var o = '<g stroke="' + P.faint + '" fill="none">';
    o += '<rect x="' + (CX - R - 20) + '" y="' + (CY - R - 20) + '" width="' + (2 * R + 40) + '" height="' + (2 * R + 40) + '" stroke-width="1.5"/>';
    for (var i = -4; i <= 4; i++) {
      var p = i * (R + 20) / 4;
      o += '<line x1="' + K.n1(CX + p) + '" y1="' + (CY - R - 20) + '" x2="' + K.n1(CX + p) + '" y2="' + (CY + R + 20) + '" stroke-width="' + (i === 0 ? 1.2 : 0.6) + '"' + (i === 0 ? '' : ' stroke-dasharray="2 6"') + '/>';
      o += '<line x1="' + (CX - R - 20) + '" y1="' + K.n1(CY + p) + '" x2="' + (CX + R + 20) + '" y2="' + K.n1(CY + p) + '" stroke-width="' + (i === 0 ? 1.2 : 0.6) + '"' + (i === 0 ? '' : ' stroke-dasharray="2 6"') + '/>';
    }
    for (var j = -20; j <= 20; j++) {
      var q = j * (R + 20) / 20;
      o += '<line x1="' + K.n1(CX + q) + '" y1="' + (CY - 5) + '" x2="' + K.n1(CX + q) + '" y2="' + (CY + 5) + '" stroke-width="0.8"/>';
      o += '<line x1="' + (CX - 5) + '" y1="' + K.n1(CY + q) + '" x2="' + (CX + 5) + '" y2="' + K.n1(CY + q) + '" stroke-width="0.8"/>';
    }
    return o + '</g>';
  }

  function render(st, opts) {
    opts = opts || {};
    var P = PLATES[st.plate];
    var body = '<rect width="' + W + '" height="' + H + '" fill="' + P.bg + '"/>';
    if (st.grid) body += graticule(P);
    var w = st.weight / 10;
    for (var k = 0; k < st.traces; k++) {
      var d = K.poly(trace(st, k));
      var col = st.plate === 'paper' ? (k === st.traces - 1 && st.traces > 1 ? P.accent : P.ink) : P.accent;
      if (P.glow) body += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + K.n2(w * 4) + '" stroke-opacity="0.06" stroke-linejoin="round"/>';
      body += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + K.n2(w) + '" stroke-opacity="' + (P.glow ? 0.6 : 0.8) + '" stroke-linejoin="round"/>';
    }
    var y = 905, mono = K.FONT.mono;
    body += '<line x1="120" y1="870" x2="880" y2="870" stroke="' + P.ink + '" stroke-width="1.2"/>';
    body += '<text x="120" y="' + y + '" font-family="' + K.FONT.sans + '" font-weight="700" font-size="22" letter-spacing="4" fill="' + P.ink + '">' + K.esc(st.caption || 'PLATE') + '</text>';
    body += '<text x="880" y="' + y + '" text-anchor="end" font-family="' + mono + '" font-size="17" fill="' + P.ink + '">' + K.esc(specText(st)) + '</text>';
    body += '<text x="120" y="' + (y + 32) + '" font-family="' + mono + '" font-size="13" letter-spacing="1.5" fill="' + P.ink + '" opacity="0.65">DAMPED PENDULUM FIGURE · ' + st.traces + ' TRACE' + (st.traces > 1 ? 'S' : '') + ' · SEED ' + K.esc(st.seed.toUpperCase()) + ' · POINTCAST.XYZ/MAKE/HARMONOGRAPH</text>';
    return K.svgDoc(W, H, body, { label: describe(st), physical: opts.physical });
  }

  function specText(st) {
    return 'F ' + st.fx + ':' + st.fy + '  PHI ' + st.phase + 'DEG  DAMP ' + st.damp + '  DETUNE ' + (st.detune / 10).toFixed(1) + '%';
  }
  function describe(st) {
    return 'Harmonograph figure at frequency ratio ' + st.fx + ' to ' + st.fy + ', phase ' + st.phase + ' degrees, ' + st.traces + ' traces, on a ' + (st.plate === 'paper' ? 'paper' : 'phosphor') + ' plate.';
  }
  function shuffle(r) {
    var pairs = [[3, 2], [4, 3], [5, 4], [2, 1], [3, 1], [5, 3], [7, 5], [5, 2], [6, 5], [1, 1], [7, 4]];
    var p = r.pick(pairs);
    return { fx: p[0], fy: p[1], detune: r.int(0, 12), phase: r.int(0, 72) * 5, damp: r.int(4, 30), turns: r.int(8, 30) * 5, traces: r.int(1, 5), plate: r.chance(0.4) ? 'phosphor' : 'paper', caption: 'PLATE ' + String(r.int(1, 99)).padStart(2, '0') };
  }

  var T = {
    slug: 'harmonograph', title: 'Harmonograph plate', schema: schema, render: render, describe: describe, shuffle: shuffle,
    trace: trace, geom: { CX: CX, CY: CY, R: R },
    size: function (st) { return { w: 3000, h: 3000, dpi: 300, label: '10 x 10 in', bg: PLATES[st.plate].bg, physical: ['10in', '10in'] }; }
  };
  g.MakeTools.harmonograph = T;
  if (g.document && document.getElementById('art')) K.mount(T);
})(typeof globalThis !== 'undefined' ? globalThis : this);
