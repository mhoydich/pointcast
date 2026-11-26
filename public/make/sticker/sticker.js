/* Sticker slap maker. Bold die-cut street stickers, sized for print. */
(function (g) {
  'use strict';
  var K = g.MakeKit;
  var S = 900, C = 450, TAU = Math.PI * 2;

  var INKS = {
    black: '#111111', white: '#ffffff', signal: '#e2400c', yellow: '#ffd21f', cobalt: '#1f4fd8',
    mint: '#35c99a', pink: '#ff7ab6', red: '#d0161b', cream: '#f3e7c9'
  };
  function inkOpts() { return Object.keys(INKS).map(function (k) { return { v: k, label: k, swatch: INKS[k] }; }); }
  var CUT = '#e6007e'; // die-line magenta, preview only

  var schema = [
    { key: 'seed', type: 'text', label: 'Seed', def: 'slap-0001', max: 32, hint: 'Sets the tilt, burst spikes and pattern angle.' },
    { key: 'line1', type: 'text', label: 'Big word', def: 'HELLO', max: 12, upper: true },
    { key: 'line2', type: 'text', label: 'Small line', def: 'EL SEGUNDO', max: 18, upper: true, hint: 'Leave empty for one word.' },
    { group: 'Shape', key: 'shape', type: 'seg', label: 'Die shape', def: 'burst', options: [
      { v: 'circle', label: 'Circle' }, { v: 'hello', label: 'Hello badge' }, { v: 'shield', label: 'Shield' }, { v: 'burst', label: 'Burst' }, { v: 'pill', label: 'Pill' }] },
    { key: 'edge', type: 'seg', label: 'White border', def: '24', options: [{ v: '0', label: 'None' }, { v: '14', label: 'Thin' }, { v: '24', label: 'Medium' }, { v: '38', label: 'Fat' }] },
    { key: 'cut', type: 'toggle', label: 'Show cut line', def: true, hint: 'Magenta die line. Turn off before exporting art for a printer who adds their own.' },
    { group: 'Fill', key: 'pattern', type: 'seg', label: 'Pattern', def: 'rays', options: ['none', 'stripes', 'dots', 'checks', 'waves', 'rays'] },
    { key: 'scale', type: 'range', label: 'Pattern scale', def: 3, min: 1, max: 6, step: 1 },
    { key: 'halftone', type: 'toggle', label: 'Halftone dots', def: false },
    { group: 'Ink', key: 'inks', type: 'seg', label: 'Ink count', def: '3', options: [{ v: '2', label: '2 inks' }, { v: '3', label: '3 inks' }] },
    { key: 'a', type: 'seg', label: 'Ink A, body', def: 'signal', options: inkOpts() },
    { key: 'b', type: 'seg', label: 'Ink B, pattern', def: 'yellow', options: inkOpts() },
    { key: 'c', type: 'seg', label: 'Ink C, words', def: 'black', options: inkOpts(), hint: 'Used with 3 inks. With 2, the words print white, outlined in ink A.' },
    { group: 'Print', key: 'size', type: 'seg', label: 'Print size', def: '3', options: [{ v: '2', label: '2 in' }, { v: '3', label: '3 in' }, { v: '4', label: '4 in' }] }
  ];

  function shapePath(st, r) {
    switch (st.shape) {
      case 'circle': return 'M' + (C - 360) + ' ' + C + 'a360 360 0 1 0 720 0a360 360 0 1 0 -720 0Z';
      case 'pill': return 'M260 250H640A200 200 0 0 1 640 650H260A200 200 0 0 1 260 250Z';
      case 'hello': return 'M110 170H790Q830 170 830 210V690Q830 730 790 730H110Q70 730 70 690V210Q70 170 110 170Z';
      case 'shield': return 'M130 110Q290 150 450 92Q610 150 770 110V430C770 640 620 760 450 822C280 760 130 640 130 430Z';
      default: {
        var n = r.int(14, 24), pts = [];
        for (var i = 0; i < n * 2; i++) {
          var a = i / (n * 2) * TAU - Math.PI / 2, rad = i % 2 ? 318 + r.range(-8, 8) : 382 + r.range(-10, 6);
          pts.push([C + rad * Math.cos(a), C + rad * Math.sin(a)]);
        }
        return K.poly(pts, true);
      }
    }
  }

  function patternBody(st, r, ink) {
    var u = 14 + st.scale * 9, out = '', ang = r.pick([-30, -20, 20, 30, 45, -45]), x, y, j;
    switch (st.pattern) {
      case 'stripes':
        for (x = -S; x < S * 2; x += u * 2) out += '<rect x="' + x + '" y="-450" width="' + u + '" height="1800"/>';
        return '<g fill="' + ink + '" transform="rotate(' + ang + ' 450 450)">' + out + '</g>';
      case 'dots':
        for (y = 0; y <= S; y += u * 1.6) for (x = ((y / (u * 1.6)) % 2) * u * 0.8; x <= S; x += u * 1.6) out += '<circle cx="' + K.n1(x) + '" cy="' + K.n1(y) + '" r="' + K.n1(u * 0.42) + '"/>';
        return '<g fill="' + ink + '">' + out + '</g>';
      case 'checks':
        for (y = 0, j = 0; y < S; y += u * 1.5, j++) for (x = (j % 2) * u * 1.5; x < S; x += u * 3) out += '<rect x="' + K.n1(x) + '" y="' + K.n1(y) + '" width="' + K.n1(u * 1.5) + '" height="' + K.n1(u * 1.5) + '"/>';
        return '<g fill="' + ink + '">' + out + '</g>';
      case 'waves': {
        var d = '';
        for (y = -u; y < S + u; y += u * 1.4) {
          var pts = [];
          for (x = 0; x <= S; x += 10) pts.push([x, y + u * 0.45 * Math.sin(x / (u * 0.9))]);
          d += K.poly(pts, false);
        }
        return '<path d="' + d + '" fill="none" stroke="' + ink + '" stroke-width="' + K.n1(u * 0.42) + '"/>';
      }
      case 'rays': {
        var n = 8 + (7 - st.scale) * 4, off = r.range(0, TAU);
        for (var i = 0; i < n; i++) {
          var a0 = off + i * TAU / n, a1 = a0 + TAU / n / 2;
          out += 'M450 450L' + K.n1(C + 900 * Math.cos(a0)) + ' ' + K.n1(C + 900 * Math.sin(a0)) + 'L' + K.n1(C + 900 * Math.cos(a1)) + ' ' + K.n1(C + 900 * Math.sin(a1)) + 'Z';
        }
        return '<path d="' + out + '" fill="' + ink + '"/>';
      }
      default: return '';
    }
  }

  function halftone(r, ink) {
    var ang = r.range(0, TAU), dx = Math.cos(ang), dy = Math.sin(ang), step = 20, out = '';
    for (var y = 0; y <= S; y += step) for (var x = (y / step % 2) * step / 2; x <= S; x += step) {
      var t = ((x - C) * dx + (y - C) * dy) / 520 + 0.5;
      var rad = Math.max(0, Math.min(1, t)) * step * 0.5;
      if (rad > 0.8) out += '<circle cx="' + K.n1(x) + '" cy="' + y + '" r="' + K.n1(rad) + '"/>';
    }
    return '<g fill="' + ink + '">' + out + '</g>';
  }

  function words(st, r, area, fillInk, strokeInk, strokeW) {
    var l1 = st.line1.trim(), l2 = st.line2.trim(), out = '';
    var tilt = r.range(-4, 4);
    var cy = area.cy, w = area.w;
    var f1 = Math.min(area.max, w / Math.max(1, l1.length * 0.66));
    var f2 = l2 ? Math.min(f1 * 0.42, 80, w * 0.92 / Math.max(1, l2.length * 0.64)) : 0;
    var gap = l2 ? f2 * 0.5 : 0, total = f1 * 0.74 + (l2 ? gap + f2 * 0.74 : 0);
    var y1 = cy - total / 2 + f1 * 0.74, y2 = y1 + gap + f2 * 0.74;
    function line(txt, y, fs) {
      var tl = Math.min(w * (fs === f1 ? 1 : 0.92), txt.length * fs * (fs === f1 ? 0.66 : 0.64));
      var common = ' x="' + C + '" y="' + K.n1(y) + '" text-anchor="middle" font-family="' + K.FONT.sans + '" font-weight="900" font-size="' + K.n1(fs) + '" textLength="' + K.n1(tl) + '" lengthAdjust="spacingAndGlyphs"';
      var s = '';
      if (strokeInk) s += '<text' + common + ' fill="' + strokeInk + '" stroke="' + strokeInk + '" stroke-width="' + K.n1(fs * strokeW) + '" stroke-linejoin="round">' + K.esc(txt) + '</text>';
      return s + '<text' + common + ' fill="' + fillInk + '">' + K.esc(txt) + '</text>';
    }
    if (l1) out += line(l1, y1, f1);
    if (l2) out += line(l2, y2, f2);
    return '<g transform="rotate(' + K.n1(tilt) + ' ' + C + ' ' + K.n1(cy) + ')">' + out + '</g>';
  }

  var AREAS = {
    circle: { cy: 450, w: 560, max: 230 }, pill: { cy: 450, w: 600, max: 210 }, shield: { cy: 420, w: 500, max: 200 },
    burst: { cy: 450, w: 520, max: 210 }, hello: { cy: 535, w: 640, max: 190 }
  };

  function render(st, opts) {
    opts = opts || {};
    var r = K.rng('sticker|' + st.seed);
    var A = INKS[st.a], B = INKS[st.b], Cc = INKS[st.c];
    var three = st.inks === '3';
    var d = shapePath(st, r);
    var edge = Number(st.edge);
    var body = '';
    if (!opts.export) body += '<rect width="' + S + '" height="' + S + '" fill="#d8d5cd"/>' + sheetGrid();
    body += '<defs><clipPath id="sk-body"><path d="' + d + '"/></clipPath>' +
      (st.shape === 'hello' ? '<clipPath id="sk-band"><rect x="60" y="160" width="780" height="176"/><rect x="60" y="690" width="780" height="50"/></clipPath>' : '') + '</defs>';
    // die margin and cut line
    if (st.cut) body += '<path d="' + d + '" fill="none" stroke="' + CUT + '" stroke-width="' + (edge * 2 + 5) + '" stroke-linejoin="round"/>';
    body += '<path d="' + d + '" fill="#ffffff" stroke="#ffffff" stroke-width="' + Math.max(0.01, edge * 2) + '" stroke-linejoin="round"/>';

    var pat = patternBody(st, r, B), ht = st.halftone ? halftone(r, three ? B : B) : '';
    if (st.shape === 'hello') {
      body += '<g clip-path="url(#sk-body)"><g clip-path="url(#sk-band)"><rect width="900" height="900" fill="' + A + '"/>' + pat + ht + '</g></g>';
      body += '<text x="450" y="268" text-anchor="middle" font-family="' + K.FONT.sans + '" font-weight="900" font-size="104" letter-spacing="6" fill="#ffffff" stroke="' + A + '" stroke-width="16" stroke-linejoin="round" paint-order="stroke">HELLO</text>';
      body += '<text x="450" y="316" text-anchor="middle" font-family="' + K.FONT.sans + '" font-weight="700" font-size="34" letter-spacing="2" fill="#ffffff" stroke="' + A + '" stroke-width="8" stroke-linejoin="round" paint-order="stroke">my name is</text>';
      body += words(st, r, AREAS.hello, three ? Cc : A, null, 0);
    } else {
      body += '<g clip-path="url(#sk-body)"><rect width="900" height="900" fill="' + A + '"/>' + pat + ht + '</g>';
      body += words(st, r, AREAS[st.shape], three ? Cc : '#ffffff', A, 0.2);
    }
    if (st.cut && !opts.export) body += '<text x="450" y="' + (S - 14) + '" text-anchor="middle" font-family="' + K.FONT.mono + '" font-size="15" letter-spacing="2" fill="' + CUT + '">CUT LINE · ' + st.size + ' IN · 300 DPI</text>';
    var phys = opts.physical;
    return K.svgDoc(S, S, body, { label: describe(st), physical: phys });
  }

  function sheetGrid() {
    var d = '';
    for (var i = 50; i < S; i += 50) d += 'M' + i + ' 0V' + S + 'M0 ' + i + 'H' + S;
    return '<path d="' + d + '" stroke="#c9c5bb" stroke-width="1" fill="none"/>';
  }

  function describe(st) {
    return st.shape + ' sticker reading ' + (st.line1 || '') + (st.line2 ? ' / ' + st.line2 : '') + ', ' + st.pattern + ' pattern, ' + st.inks + ' inks, ' + st.size + ' inch.';
  }

  function shuffle(r) {
    var k = Object.keys(INKS), a = r.pick(k), b = r.pick(k.filter(function (x) { return x !== a; })), c = r.pick(k.filter(function (x) { return x !== a && x !== b; }));
    return {
      shape: r.pick(['circle', 'hello', 'shield', 'burst', 'pill']), pattern: r.pick(['none', 'stripes', 'dots', 'checks', 'waves', 'rays']),
      scale: r.int(1, 6), halftone: r.chance(0.35), inks: r.pick(['2', '3']), a: a, b: b, c: c, edge: r.pick(['14', '24', '38'])
    };
  }

  var T = {
    slug: 'sticker', title: 'Sticker slap maker', schema: schema, render: render, describe: describe, shuffle: shuffle,
    size: function (st) { var px = Number(st.size) * 300; return { w: px, h: px, dpi: 300, label: st.size + ' x ' + st.size + ' in', physical: [st.size + 'in', st.size + 'in'] }; }
  };
  g.MakeTools.sticker = T;
  if (g.document && document.getElementById('art')) K.mount(T);
})(typeof globalThis !== 'undefined' ? globalThis : this);
