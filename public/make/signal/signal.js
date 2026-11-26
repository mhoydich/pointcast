/* Signal card maker. A QSL-style radio contact card, printed like an instrument panel. */
(function (g) {
  'use strict';
  var K = g.MakeKit;
  var W = 1650, H = 1050, TAU = Math.PI * 2;

  var BANDS = {
    mw: { label: 'MW', lo: 530, hi: 1700, unit: 'kHz', minor: 10, major: 50, every: 200, dec: 0 },
    sw: { label: 'SW', lo: 3, hi: 30, unit: 'MHz', minor: 0.5, major: 1, every: 3, dec: 3 },
    fm: { label: 'FM', lo: 88, hi: 108, unit: 'MHz', minor: 0.2, major: 1, every: 2, dec: 1 },
    air: { label: 'AIR', lo: 118, hi: 137, unit: 'MHz', minor: 0.25, major: 1, every: 2, dec: 3 },
    '2m': { label: '2 M', lo: 144, hi: 148, unit: 'MHz', minor: 0.05, major: 0.25, every: 0.5, dec: 3 }
  };
  var PANELS = {
    paper: { bg: '#f6f4ee', ink: '#141414', faint: '#c9c5bb', accent: '#d9400b' },
    night: { bg: '#0e1110', ink: '#e8ece6', faint: '#34403a', accent: '#7cf29a' }
  };
  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
    N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '/': '-..-.', '-': '-....-'
  };

  var schema = [
    { key: 'seed', type: 'text', label: 'Seed', def: 'qsl-0001', max: 32, hint: 'Shapes the waveform and the card number.' },
    { key: 'call', type: 'text', label: 'Your call sign', def: 'PNTCST-1', max: 10, upper: true, pattern: /[^A-Z0-9\/-]/g, hint: 'Letters, numbers, slash or dash. Made-up stations welcome.' },
    { key: 'to', type: 'text', label: 'To station', def: 'ANY-STN', max: 10, upper: true, pattern: /[^A-Z0-9\/-]/g },
    { key: 'qth', type: 'text', label: 'Location (QTH)', def: 'El Segundo, CA', max: 22 },
    { key: 'grid', type: 'text', label: 'Grid square', def: 'DM03', max: 6, upper: true, pattern: /[^A-Z0-9]/g },
    { group: 'Signal', key: 'band', type: 'seg', label: 'Band', def: 'fm', options: Object.keys(BANDS).map(function (k) { return { v: k, label: BANDS[k].label }; }) },
    { key: 'tune', type: 'range', label: 'Tuning', def: 537, min: 0, max: 1000, step: 1, format: function (v) { return (v / 10).toFixed(1) + '%'; }, hint: 'Where the needle sits across the band. The card shows the frequency.' },
    { key: 'mode', type: 'seg', label: 'Mode', def: 'cw', options: [{ v: 'cw', label: 'CW (Morse)' }, { v: 'am', label: 'AM' }, { v: 'fm', label: 'FM' }, { v: 'data', label: 'Data' }] },
    { key: 'rst', type: 'select', label: 'Signal report (RST)', def: '599', options: ['599', '579', '559', '449', '339', '59', '57', '44'] },
    { group: 'Stamp', key: 'date', type: 'date', label: 'Date', def: '2026-11-11' },
    { key: 'utc', type: 'text', label: 'Time (UTC)', def: '18:45', max: 5, pattern: /[^0-9:]/g },
    { key: 'panel', type: 'seg', label: 'Panel', def: 'paper', options: [{ v: 'paper', label: 'Paper', swatch: '#f6f4ee' }, { v: 'night', label: 'Night', swatch: '#0e1110' }] }
  ];

  function freq(st) {
    var b = BANDS[st.band];
    return b.lo + (b.hi - b.lo) * st.tune / 1000;
  }
  function freqText(st) {
    var b = BANDS[st.band];
    return freq(st).toFixed(b.dec) + ' ' + b.unit.toUpperCase();
  }

  function txt(x, y, s, size, fill, extra) {
    return '<text x="' + K.n1(x) + '" y="' + K.n1(y) + '" font-family="' + K.FONT.mono + '" font-size="' + size + '" fill="' + fill + '"' + (extra || '') + '>' + K.esc(s) + '</text>';
  }
  function label(x, y, s, P, anchor) {
    return '<text x="' + x + '" y="' + y + '" font-family="' + K.FONT.sans + '" font-size="15" font-weight="600" letter-spacing="2.4" fill="' + P.ink + '" opacity="0.72"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + K.esc(s.toUpperCase()) + '</text>';
  }

  function dial(st, P) {
    var b = BANDS[st.band], cx = 1262, cy = 560, R = 290, a0 = -160, a1 = -20, out = '';
    function ang(f) { return (a0 + (a1 - a0) * (f - b.lo) / (b.hi - b.lo)) * Math.PI / 180; }
    function pt(f, r) { var a = ang(f); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    var arc = [];
    for (var k = 0; k <= 120; k++) { var a = (a0 + (a1 - a0) * k / 120) * Math.PI / 180; arc.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    out += '<path d="' + K.poly(arc) + '" fill="none" stroke="' + P.ink + '" stroke-width="2"/>';
    var steps = Math.round((b.hi - b.lo) / b.minor), d = '';
    for (var i = 0; i <= steps; i++) {
      var f = b.lo + i * b.minor, isMaj = Math.abs(f / b.major - Math.round(f / b.major)) < 1e-6;
      var isLab = Math.abs(f / b.every - Math.round(f / b.every)) < 1e-6;
      var p1 = pt(f, R), p2 = pt(f, R - (isLab ? 30 : isMaj ? 20 : 10));
      d += 'M' + K.n1(p1[0]) + ' ' + K.n1(p1[1]) + 'L' + K.n1(p2[0]) + ' ' + K.n1(p2[1]);
      if (isLab) {
        var pl = pt(f, R - 58);
        out += txt(pl[0], pl[1] + 7, String(Math.round(f * 100) / 100), 19, P.ink, ' text-anchor="middle"');
      }
    }
    out += '<path d="' + d + '" stroke="' + P.ink + '" stroke-width="1.6"/>';
    // inner scale ring
    var arc2 = [];
    for (k = 0; k <= 120; k++) { a = (a0 + (a1 - a0) * k / 120) * Math.PI / 180; arc2.push([cx + (R - 92) * Math.cos(a), cy + (R - 92) * Math.sin(a)]); }
    out += '<path d="' + K.poly(arc2) + '" fill="none" stroke="' + P.ink + '" stroke-width="0.8" stroke-dasharray="2 6"/>';
    // needle
    var fq = freq(st), tip = pt(fq, R + 8), base = pt(fq, 40);
    out += '<line x1="' + K.n1(base[0]) + '" y1="' + K.n1(base[1]) + '" x2="' + K.n1(tip[0]) + '" y2="' + K.n1(tip[1]) + '" stroke="' + P.accent + '" stroke-width="4" stroke-linecap="square"/>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="16" fill="' + P.bg + '" stroke="' + P.ink + '" stroke-width="2"/><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + P.ink + '"/>';
    out += txt(cx, 226, b.label + ' · ' + b.unit, 18, P.ink, ' text-anchor="middle" letter-spacing="3" opacity="0.72"');
    return out;
  }

  function morseKeying(call) {
    var seq = [];
    String(call).split('').forEach(function (ch, ci) {
      var code = MORSE[ch];
      if (!code) return;
      if (ci) seq.push([0, 3]);
      code.split('').forEach(function (s, si) {
        if (si) seq.push([0, 1]);
        seq.push([1, s === '.' ? 1 : 3]);
      });
    });
    return seq;
  }

  function wave(st, r, x0, y0, w, h, P) {
    var n = st.mode === 'cw' ? 3600 : 1600, pts = [], mid = y0 + h / 2, A = h * 0.4, i, t, v;
    var f1 = r.range(36, 60), m1 = r.range(1.5, 3.5), m2 = r.range(4, 8), ph = r.range(0, TAU);
    if (st.mode === 'cw') {
      var seq = morseKeying(st.call || 'E'), total = seq.reduce(function (s, q) { return s + q[1]; }, 0) + 2;
      var env = [];
      for (i = 0; i <= n; i++) {
        var u = i / n * total - 1, acc = 0, on = 0;
        for (var q = 0; q < seq.length; q++) { if (u >= acc && u < acc + seq[q][1]) { on = seq[q][0]; break; } acc += seq[q][1]; }
        env.push(on);
      }
      // soften the key clicks
      var sm = env.map(function (_, j) { var s = 0, c = 0; for (var k = -3; k <= 3; k++) { if (env[j + k] !== undefined) { s += env[j + k]; c++; } } return s / c; });
      for (i = 0; i <= n; i++) { t = i / n; pts.push([x0 + t * w, mid - A * sm[i] * Math.sin(t * TAU * 300)]); }
    } else if (st.mode === 'am') {
      for (i = 0; i <= n; i++) { t = i / n; v = (0.62 + 0.3 * Math.sin(t * TAU * m1 + ph) + 0.08 * Math.sin(t * TAU * m2)) * Math.sin(t * TAU * f1 * 2.4); pts.push([x0 + t * w, mid - A * v]); }
    } else if (st.mode === 'fm') {
      for (i = 0; i <= n; i++) { t = i / n; v = Math.sin(t * TAU * f1 * 0.7 + 9 * Math.sin(t * TAU * m1 + ph)); pts.push([x0 + t * w, mid - A * 0.9 * v]); }
    } else {
      var bits = [], hs = K.hashSeed(st.seed + '|' + st.call);
      for (i = 0; i < 40; i++) bits.push((K.hashSeed(hs + ':' + i) & 1));
      for (i = 0; i <= n; i++) {
        t = i / n; var bi = Math.min(39, Math.floor(t * 40)), frac = t * 40 - bi;
        var prev = bi ? bits[bi - 1] : 0, cur = bits[bi];
        v = cur ? 1 : -1;
        if (prev !== cur) v += (prev ? 1 : -1) * 0.5 * Math.exp(-frac * 9) * Math.cos(frac * 40);
        pts.push([x0 + t * w, mid - A * 0.75 * v]);
      }
    }
    return '<path d="' + K.poly(pts) + '" fill="none" stroke="' + P.accent + '" stroke-width="' + (st.mode === 'cw' ? 1.1 : 2.2) + '" stroke-linejoin="round"/>';
  }

  function scope(st, r, P) {
    var x0 = 60, y0 = 452, cell = 70, cols = 12, rows = 5, w = cols * cell, h = rows * cell, out = '', d = '', i;
    out += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + P.ink + '" stroke-width="2"/>';
    for (i = 1; i < cols; i++) d += 'M' + (x0 + i * cell) + ' ' + y0 + 'v' + h;
    for (i = 1; i < rows; i++) d += 'M' + x0 + ' ' + (y0 + i * cell) + 'h' + w;
    out += '<path d="' + d + '" stroke="' + P.faint + '" stroke-width="1"/>';
    // centre crosshair minor ticks
    var mt = '', cx = x0 + w / 2, cy = y0 + h / 2;
    for (i = 0; i <= cols * 5; i++) mt += 'M' + (x0 + i * cell / 5) + ' ' + (cy - 5) + 'v10';
    for (i = 0; i <= rows * 5; i++) mt += 'M' + (cx - 5) + ' ' + (y0 + i * cell / 5) + 'h10';
    out += '<path d="' + mt + '" stroke="' + P.ink + '" stroke-width="1" opacity="0.6"/>';
    out += wave(st, r, x0, y0, w, h, P);
    out += label(x0, y0 - 14, 'Trace · ' + ({ cw: 'CW, keyed ' + (st.call || ''), am: 'AM', fm: 'FM', data: 'Data, 40 bits' })[st.mode], P);
    out += txt(x0 + w, y0 - 14, '10 MS/DIV', 15, P.ink, ' text-anchor="end" opacity="0.72"');
    return out;
  }

  function stamp(st, P, r) {
    var x = 1270, y = 715, rot = r.range(-11, -4).toFixed(1);
    var o = '<g transform="rotate(' + rot + ' ' + x + ' ' + y + ')" fill="none" stroke="' + P.accent + '">';
    o += '<rect x="' + (x - 190) + '" y="' + (y - 62) + '" width="380" height="124" rx="10" stroke-width="5"/>';
    o += '<rect x="' + (x - 180) + '" y="' + (y - 52) + '" width="360" height="104" rx="6" stroke-width="1.5"/>';
    o += '</g><g transform="rotate(' + rot + ' ' + x + ' ' + y + ')">';
    o += '<text x="' + x + '" y="' + (y - 18) + '" text-anchor="middle" font-family="' + K.FONT.sans + '" font-weight="800" font-size="22" letter-spacing="6" fill="' + P.accent + '">CONTACT CONFIRMED</text>';
    o += txt(x, y + 30, st.date + '  ' + (st.utc || '--:--') + 'Z', 34, P.accent, ' text-anchor="middle" font-weight="700" letter-spacing="1"');
    return o + '</g>';
  }

  function table(st, P) {
    var y = 818, h = 150, cols = [
      ['To station', st.to || '-', 330], ['Date', st.date, 250], ['UTC', st.utc || '--:--', 160],
      ['Frequency', freqText(st), 330], ['Mode', st.mode.toUpperCase(), 180], ['RST', st.rst, 280]
    ];
    var x = 60, out = '<rect x="60" y="' + y + '" width="1530" height="' + h + '" fill="none" stroke="' + P.ink + '" stroke-width="2"/>';
    cols.forEach(function (c, i) {
      if (i) out += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + h) + '" stroke="' + P.ink + '" stroke-width="1"/>';
      out += label(x + 18, y + 36, c[0], P);
      var len = String(c[1]).length, fs = Math.min(44, (c[2] - 36) / Math.max(1, len * 0.62));
      out += txt(x + 18, y + 108, c[1], K.n1(fs), P.ink, ' font-weight="700"');
      x += c[2];
    });
    return out;
  }

  function render(st, opts) {
    opts = opts || {};
    var r = K.rng('signal|' + st.seed), P = PANELS[st.panel];
    var body = '<rect width="' + W + '" height="' + H + '" fill="' + P.bg + '"/>';
    body += '<rect x="28" y="28" width="' + (W - 56) + '" height="' + (H - 56) + '" fill="none" stroke="' + P.ink + '" stroke-width="2.5"/>';
    body += '<rect x="36" y="36" width="' + (W - 72) + '" height="' + (H - 72) + '" fill="none" stroke="' + P.ink + '" stroke-width="0.8"/>';
    // header strip
    var cardNo = 'NO. ' + String(r.int(1, 99999)).padStart(5, '0');
    body += '<line x1="36" y1="96" x2="' + (W - 36) + '" y2="96" stroke="' + P.ink + '" stroke-width="1.5"/>';
    body += txt(60, 76, 'RADIO CONTACT CARD · QSL', 22, P.ink, ' letter-spacing="4" font-weight="700"');
    body += txt(W - 60, 76, cardNo + '  ·  PSE QSL TNX', 20, P.ink, ' text-anchor="end" letter-spacing="3"');

    // station block
    var call = st.call || 'NOCALL';
    body += label(60, 150, 'Station', P);
    var fs = Math.min(190, 820 / Math.max(1, call.length * 0.62));
    body += '<text x="56" y="' + K.n1(160 + fs * 0.78) + '" font-family="' + K.FONT.mono + '" font-weight="800" font-size="' + K.n1(fs) + '" fill="' + P.ink + '" letter-spacing="-2">' + K.esc(call) + '</text>';
    body += '<line x1="60" y1="352" x2="900" y2="352" stroke="' + P.ink + '" stroke-width="1"/>';
    body += label(60, 384, 'QTH', P) + txt(140, 386, st.qth || '-', 26, P.ink);
    body += label(640, 384, 'Grid', P) + txt(720, 386, st.grid || '-', 26, P.ink, ' font-weight="700"');

    // dial panel
    body += '<rect x="930" y="120" width="660" height="490" fill="none" stroke="' + P.ink + '" stroke-width="2"/>';
    body += label(950, 150, 'Tuning', P);
    body += dial(st, P);
    body += '<rect x="1086" y="526" width="352" height="58" fill="' + P.bg + '" stroke="' + P.ink + '" stroke-width="2"/>';
    body += txt(1262, 568, freqText(st), 34, P.ink, ' text-anchor="middle" font-weight="700" letter-spacing="1"');

    body += scope(st, r, P);
    body += stamp(st, P, r);
    body += table(st, P);
    body += txt(60, 1000, 'FICTIONAL STATIONS WELCOME. NOT A LICENCE. MADE AT POINTCAST.XYZ/MAKE/SIGNAL · SEED ' + st.seed.toUpperCase(), 14, P.ink, ' letter-spacing="1.5" opacity="0.7"');
    return K.svgDoc(W, H, body, { label: describe(st), physical: opts.physical });
  }

  function describe(st) {
    return 'Radio contact card from ' + (st.call || 'no call') + ' to ' + (st.to || 'any station') + ', ' + freqText(st) + ', ' + st.mode.toUpperCase() + ', ' + st.date + '.';
  }

  function shuffle(r) {
    return { band: r.pick(Object.keys(BANDS)), tune: r.int(30, 970), mode: r.pick(['cw', 'am', 'fm', 'data']), rst: r.pick(['599', '579', '559', '59', '57']), panel: r.chance(0.3) ? 'night' : 'paper', utc: String(r.int(0, 23)).padStart(2, '0') + ':' + String(r.int(0, 59)).padStart(2, '0') };
  }

  var T = {
    slug: 'signal', title: 'Signal card maker', schema: schema, render: render, describe: describe, shuffle: shuffle,
    freq: freq, morse: morseKeying,
    size: function (st) { return { w: W, h: H, dpi: 300, label: '5.5 x 3.5 in', bg: PANELS[st.panel].bg, physical: ['5.5in', '3.5in'] }; }
  };
  g.MakeTools.signal = T;
  if (g.document && document.getElementById('art')) K.mount(T);
})(typeof globalThis !== 'undefined' ? globalThis : this);
