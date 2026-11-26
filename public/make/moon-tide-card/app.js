/* Moon and tide mood card: page wiring and the SVG card. */
(function () {
  'use strict';
  var K = window.KitB, S = window.SkyCore;
  var $ = K.$;
  var W = 900, H = 1200;
  var SANS = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace';
  var BANDS = ['60', '45', '34', '23', '0', '-23', '-34', '-45'];
  var BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  var lastSvg = '';

  function nowParts() {
    // the device clock is the closest thing to local solar time we have without a location
    var d = new Date();
    var date = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    return { date: date, hour: d.getHours() };
  }
  function validDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
    var t = S.instant(s, 0);
    return isFinite(t) && new Date(t).toISOString().slice(0, 10) === s && s >= '1900-01-01' && s <= '2100-12-31';
  }
  var st;
  function fromHash() {
    var h = K.readHash(), n = nowParts();
    return {
      d: validDate(h.d) ? h.d : n.date,
      h: Math.round(K.num(h.h, 0, 23, n.hour)),
      lat: K.pick(h.lat, BANDS, '34')
    };
  }
  function toHash() { K.writeHash({ d: st.d, h: st.h, lat: st.lat }); }

  // ---- palette that follows the hour ---------------------------------------------
  var STOPS = [[-90, '#0c0d11'], [-12, '#0f1118'], [-6, '#252a3b'], [-2, '#4d5064'], [1, '#b98a74'], [5, '#e2cdb6'], [12, '#f3f1ea'], [90, '#f3f1ea']];
  function palette(alt) {
    var bg = STOPS[0][1];
    for (var i = 0; i < STOPS.length - 1; i++) {
      var a = STOPS[i], b = STOPS[i + 1];
      if (alt >= a[0] && alt <= b[0]) { bg = K.mix(a[1], b[1], (alt - a[0]) / (b[0] - a[0])); break; }
    }
    var fg = K.contrast(bg, '#101010') >= K.contrast(bg, '#f3f1ea') ? '#101010' : '#f3f1ea';
    var accent = ['#c9351a', '#ff6a3d'].sort(function (x, y) { return K.contrast(bg, y) - K.contrast(bg, x); })[0];
    var mood = alt > 6 ? 'day' : alt < -12 ? 'night' : alt < -6 ? 'late twilight' : 'twilight';
    return { bg: bg, fg: fg, accent: accent, mute: K.mix(fg, bg, 0.5), faint: K.mix(fg, bg, 0.82), mood: mood, dark: fg !== '#101010' };
  }

  // ---- drawing --------------------------------------------------------------------
  function pixelMoon(m, lat, cx, top, size, n, col) {
    var cell = size / n, dir = m.waxing ? 1 : -1;
    if (lat < 0) dir = -dir;
    var i = m.phaseAngle * Math.PI / 180;
    var sx = Math.sin(i > Math.PI ? 2 * Math.PI - i : i) * dir, sz = Math.cos(i);
    var lit = [], dark = [];
    var limbR = Math.pow(1 - 2.2 / n, 2);
    for (var y = 0; y < n; y++) {
      var runL = -1, runD = -1;
      for (var x = 0; x <= n; x++) {
        var kind = 0;
        if (x < n) {
          var u = (x + 0.5) / n * 2 - 1, v = (y + 0.5) / n * 2 - 1, rr = u * u + v * v;
          if (rr <= 1) {
            var z = Math.sqrt(1 - rr);
            var dot = sx * u + sz * z;
            var t = S.smooth(-0.07, 0.09, dot);
            var th = (BAYER4[y & 3][x & 3] + 0.5) / 16;
            var isLit = t > th, limb = rr > limbR;
            if (col.dark) {
              // night: light falls on the lit side; faint earthshine and limb on the dark side
              if (isLit) kind = 1;
              else if (BAYER4[y & 3][x & 3] === 0 || (limb && (x + y) % 2 === 0)) kind = 2;
            } else {
              // day: printed like an almanac, dark side in ink, lit side left as paper inside a pixel rim
              if (!isLit || limb) kind = 1;
            }
          }
        }
        if (kind === 1 && runL < 0) runL = x;
        if (kind !== 1 && runL >= 0) { lit.push([runL, y, x - runL]); runL = -1; }
        if (kind === 2 && runD < 0) runD = x;
        if (kind !== 2 && runD >= 0) { dark.push([runD, y, x - runD]); runD = -1; }
      }
    }
    var left = cx - size / 2;
    function path(runs) {
      return runs.map(function (r) {
        return 'M' + fx(left + r[0] * cell) + ' ' + fx(top + r[1] * cell) + 'h' + fx(r[2] * cell) + 'v' + fx(cell) + 'h-' + fx(r[2] * cell) + 'z';
      }).join('');
    }
    return '<path fill="' + col.fg + '" opacity="0.32" d="' + path(dark) + '"/><path fill="' + col.fg + '" d="' + path(lit) + '"/>';
  }
  function fx(v) { return Math.round(v * 100) / 100; }
  function hhmm(hours) {
    var h = Math.floor(hours), m = Math.round((hours - h) * 60);
    if (m === 60) { h++; m = 0; }
    return h + 'h ' + ('0' + m).slice(-2) + 'm';
  }
  function clock(hours) {
    var t = Math.round(hours * 60) % 1440;
    return ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + (t % 60)).slice(-2);
  }
  function text(x, y, s, size, fill, opt) {
    opt = opt || {};
    return '<text x="' + x + '" y="' + y + '" font-family="' + (opt.sans ? SANS : MONO) + '" font-size="' + size + '"' +
      (opt.weight ? ' font-weight="' + opt.weight + '"' : '') + (opt.anchor ? ' text-anchor="' + opt.anchor + '"' : '') +
      (opt.ls ? ' letter-spacing="' + opt.ls + '"' : '') + ' fill="' + fill + '">' + K.escapeXml(s) + '</text>';
  }

  function compute() {
    var t = S.instant(st.d, st.h);
    var m = S.moon(t), lat = +st.lat;
    var decl = S.sunDeclination(t);
    var alt = S.sunAltitude(lat, decl, st.h);
    var tide = S.tideModel(m);
    return { t: t, m: m, lat: lat, decl: decl, alt: alt, tide: tide, len: S.dayLength(lat, decl), col: palette(alt) };
  }

  function buildSvg(c) {
    var col = c.col, m = c.m, out = [];
    var latLabel = c.lat === 0 ? '0°' : Math.abs(c.lat) + '°' + (c.lat > 0 ? 'N' : 'S');
    out.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">');
    out.push('<rect width="' + W + '" height="' + H + '" fill="' + col.bg + '"/>');
    // header
    out.push(text(60, 78, 'MOON + TIDE', 22, col.fg, { weight: 700, ls: 3 }));
    out.push(text(840, 78, st.d + ' · ' + ('0' + st.h).slice(-2) + ':00 · ' + latLabel, 22, col.fg, { anchor: 'end', ls: 1 }));
    out.push('<rect x="60" y="98" width="780" height="2" fill="' + col.fg + '"/>');
    // moon
    out.push(pixelMoon(m, c.lat, 450, 150, 480, 48, col));
    // name and numbers
    out.push(text(60, 726, m.name, 66, col.fg, { sans: true, weight: 650, ls: -1 }));
    out.push(text(60, 772, 'LIT ' + (m.illumination * 100).toFixed(1) + '%  ·  AGE ' + m.age.toFixed(1) + ' D  ·  ' + (m.waxing ? 'WAXING' : 'WANING'), 22, col.fg, { ls: 1 }));
    // sun arc
    var x0 = 60, x1 = 840, base = 902, span = x1 - x0;
    out.push(text(60, 826, 'SUN  ·  DAYLIGHT ' + hhmm(c.len) + '  ·  ALT ' + Math.round(c.alt) + '°', 18, col.fg, { ls: 2 }));
    out.push('<rect x="' + x0 + '" y="' + base + '" width="' + span + '" height="2" fill="' + col.mute + '"/>');
    var dots = [];
    for (var k = 0; k <= 96; k++) {
      var hr = k / 4, a = S.sunAltitude(c.lat, c.decl, hr);
      var y = base - (a >= 0 ? a / 90 * 64 : a / 90 * 34);
      if (a >= 0) dots.push('<rect x="' + fx(x0 + hr / 24 * span - 3) + '" y="' + fx(y - 3) + '" width="6" height="6" fill="' + col.fg + '"/>');
      else if (k % 2 === 0) dots.push('<rect x="' + fx(x0 + hr / 24 * span - 2) + '" y="' + fx(y - 2) + '" width="4" height="4" fill="' + col.mute + '"/>');
    }
    out.push(dots.join(''));
    var nowX = x0 + st.h / 24 * span, nowY = base - (c.alt >= 0 ? c.alt / 90 * 64 : c.alt / 90 * 34);
    out.push('<rect x="' + fx(nowX - 9) + '" y="' + fx(nowY - 9) + '" width="18" height="18" fill="' + col.accent + '"/>');
    // tide-like band
    var mid = 1036, ampPx = 44;
    var stage = c.tide.spring ? 'SPRING-LIKE' : c.tide.neap ? 'NEAP-LIKE' : 'MID-RANGE';
    out.push(text(60, 974, 'TIDE-LIKE BAND  ·  ' + stage + '  ·  NOT A TIDE TABLE', 18, col.fg, { ls: 2 }));
    var bars = [], bw = span / 96;
    for (k = 0; k < 96; k++) {
      var hh = (k + 0.5) / 4, v = c.tide.at(hh), hpx = Math.max(2, Math.abs(v) * ampPx);
      var isNow = Math.floor(hh) === st.h;
      bars.push('<rect x="' + fx(x0 + k * bw + 1) + '" y="' + fx(v >= 0 ? mid - hpx : mid) + '" width="' + fx(bw - 2) + '" height="' + fx(hpx) + '" fill="' + (isNow ? col.accent : col.fg) + '"/>');
    }
    out.push('<rect x="' + x0 + '" y="' + (mid - ampPx - 6) + '" width="' + span + '" height="' + (ampPx * 2 + 12) + '" fill="none" stroke="' + col.faint + '" stroke-width="1"/>');
    out.push(bars.join(''));
    // hour ticks
    [0, 6, 12, 18, 24].forEach(function (h) {
      var x = x0 + h / 24 * span;
      out.push('<rect x="' + fx(x - 1) + '" y="1094" width="2" height="8" fill="' + col.fg + '"/>');
      out.push(text(fx(x), 1124, ('0' + h).slice(-2), 16, col.fg, { anchor: h === 0 ? 'start' : h === 24 ? 'end' : 'middle' }));
    });
    out.push('<rect x="60" y="1140" width="780" height="2" fill="' + col.fg + '"/>');
    out.push(text(60, 1172, 'APPROXIMATE · COMPUTED IN YOUR BROWSER · NOT A TIDE TABLE', 15, col.mute, { ls: 1 }));
    out.push(text(840, 1172, 'POINTCAST B.03', 15, col.mute, { anchor: 'end', ls: 1 }));
    out.push('</svg>');
    return out.join('');
  }

  function render() {
    var c = compute();
    lastSvg = buildSvg(c);
    var stage = $('#stage');
    stage.innerHTML = lastSvg;
    var svg = stage.querySelector('svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', c.m.name + ', ' + Math.round(c.m.illumination * 100) + ' percent lit, on ' + st.d + ' at ' + st.h + ':00 local solar time, latitude band ' + st.lat + ' degrees. Sun arc and a tide-like band, approximate.');
    stage.style.background = c.col.bg;
    $('#cap-left').innerHTML = '<b>' + K.escapeXml(c.m.name) + '</b> · ' + c.col.mood;
    var rows = [
      ['Illuminated', (c.m.illumination * 100).toFixed(1) + '%'],
      ['Moon age', c.m.age.toFixed(2) + ' days'],
      ['Elongation', c.m.elongation.toFixed(1) + '°'],
      ['Sun declination', c.decl.toFixed(1) + '°'],
      ['Sun altitude at hour', c.alt.toFixed(1) + '°'],
      ['Daylight', hhmm(c.len)],
      ['Wave peaks (model)', clock(c.tide.transit % S.tideModel(c.m).period) + ' and ' + clock(c.tide.transit % c.tide.period + c.tide.period)]
    ];
    $('#readout').innerHTML = rows.map(function (r) { return '<div><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join('');
    toHash();
  }

  // ---- controls -----------------------------------------------------------------
  var dateIn = $('#date'), hourIn = $('#hour'), bandIn = $('#band');
  var syncHour = K.bindOutput(hourIn, function (v) { return ('0' + v).slice(-2) + ':00 solar'; });
  function push() {
    dateIn.value = st.d; hourIn.value = st.h; bandIn.value = st.lat; syncHour();
    render();
  }
  dateIn.addEventListener('change', function () { if (validDate(dateIn.value)) { st.d = dateIn.value; render(); } });
  hourIn.addEventListener('input', function () { st.h = +hourIn.value; render(); });
  bandIn.addEventListener('change', function () { st.lat = K.pick(bandIn.value, BANDS, '34'); render(); });
  function shiftDay(n) {
    var d = new Date(S.instant(st.d, 12) + n * 86400000).toISOString().slice(0, 10);
    if (validDate(d)) { st.d = d; push(); }
  }
  $('#prev').addEventListener('click', function () { shiftDay(-1); });
  $('#next').addEventListener('click', function () { shiftDay(1); });
  $('#today').addEventListener('click', function () { var n = nowParts(); st.d = n.date; st.h = n.hour; push(); });
  $('#shuffle').addEventListener('click', function () {
    var r = K.rng(K.newSeed());
    var t = Date.UTC(1990, 0, 1) + Math.floor(r() * 60 * 365.25) * 86400000;
    st.d = new Date(t).toISOString().slice(0, 10);
    st.h = Math.floor(r() * 24);
    st.lat = BANDS[Math.floor(r() * BANDS.length)];
    push();
  });
  $('#copy').addEventListener('click', function () { toHash(); K.copyLink(); });
  $('#svg').addEventListener('click', function () { K.downloadSvg(lastSvg, 'pointcast-moon-' + st.d + '-' + st.h + 'h.svg'); });
  $('#png').addEventListener('click', function () { K.downloadSvgAsPng(lastSvg, W * 2, H * 2, 'pointcast-moon-' + st.d + '-' + st.h + 'h.png'); });

  window.addEventListener('hashchange', function () { st = fromHash(); push(); });
  st = fromHash();
  push();
})();
