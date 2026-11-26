/* Court lines poster: pure geometry, seeded rally and the SVG poster. No DOM.
   Pickleball court: 20 ft by 44 ft, net across the middle, a 7 ft non-volley zone each side
   of the net, a centre line splitting each service court. Units are feet. */
(function (root) {
  'use strict';
  var COURT = { width: 20, length: 44, nvz: 7, net: 22, postOverhang: 1, regulationLineIn: 2 };
  var SANS = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace';

  // Line centre segments, x across (0..20), y along (0..44).
  function lines() {
    var W = COURT.width, L = COURT.length, n = COURT.net, k = COURT.nvz;
    return {
      perimeter: [[0, 0, W, 0], [W, 0, W, L], [W, L, 0, L], [0, L, 0, 0]],
      nvz: [[0, n - k, W, n - k], [0, n + k, W, n + k]],
      centre: [[W / 2, 0, W / 2, n - k], [W / 2, n + k, W / 2, L]],
      net: [-COURT.postOverhang, n, W + COURT.postOverhang, n]
    };
  }
  function serviceCourts() {
    var W = COURT.width, n = COURT.net, k = COURT.nvz, L = COURT.length;
    return [
      { side: 'far', x: 0, y: 0, w: W / 2, h: n - k }, { side: 'far', x: W / 2, y: 0, w: W / 2, h: n - k },
      { side: 'near', x: 0, y: n + k, w: W / 2, h: L - n - k }, { side: 'near', x: W / 2, y: n + k, w: W / 2, h: L - n - k }
    ];
  }

  // ---- a seeded rally ---------------------------------------------------------------
  // Each shot: { type, from:[x,y], to:[x,y], out:bool }. Near side is y > 22 and serves first.
  function rally(rand) {
    function rr(a, b) { return a + rand() * (b - a); }
    var shots = [];
    var serverRight = rand() < 0.5;
    var from = [serverRight ? rr(11.5, 18) : rr(2, 8.5), 44.9];
    // serve crosses court into the diagonal service court beyond the far kitchen
    var to = [serverRight ? rr(1.5, 8.5) : rr(11.5, 18.5), rr(2.5, 12.5)];
    shots.push({ type: 'serve', from: from, to: to });
    // return goes deep to the near side
    var contact = [to[0] + rr(-1, 1), Math.max(-1.2, to[1] - rr(2, 4))];
    to = [rr(3, 17), rr(33, 42.5)];
    shots.push({ type: 'return', from: contact, to: to });
    var side = 'near'; // side that hits the next shot
    function kitchen(s) { return s === 'far' ? [rr(1.5, 18.5), rr(15.6, 21.2)] : [rr(1.5, 18.5), rr(22.8, 28.4)]; }
    function deep(s) { return s === 'far' ? [rr(2, 18), rr(1, 9)] : [rr(2, 18), rr(35, 43)]; }
    function other(s) { return s === 'near' ? 'far' : 'near'; }
    function step(type, land, contactFrom) {
      shots.push({ type: type, from: contactFrom, to: land });
      side = other(side);
    }
    function back(p, s, d) { return [p[0] + rr(-0.8, 0.8), s === 'far' ? Math.max(-1, p[1] - d) : Math.min(45, p[1] + d)]; }
    function atLine(p, s) { return [p[0] + rr(-1, 1), s === 'far' ? 14.2 + rr(-0.6, 0.4) : 29.8 + rr(-0.4, 0.6)]; }
    // third shot
    var third = rand() < 0.65 ? 'drop' : 'drive';
    contact = back(to, 'near', rr(1.5, 3));
    step(third, third === 'drop' ? kitchen('far') : deep('far'), contact);
    if (third === 'drive') {
      // a reset block back into the kitchen
      contact = back(shots[shots.length - 1].to, 'far', rr(0, 2));
      step('reset', kitchen('near'), contact);
    }
    // dinks
    var dinks = Math.floor(rand() * 6);
    for (var d = 0; d < dinks; d++) {
      var prev = shots[shots.length - 1].to;
      step('dink', kitchen(other(side)), atLine(prev, side));
    }
    // the finish
    var prevTo = shots[shots.length - 1].to;
    var f = rand();
    var hitFrom = atLine(prevTo, side);
    if (f < 0.4) step('speed-up', [rr(4, 16), side === 'near' ? rr(9, 14) : rr(30, 35)], hitFrom);
    else if (f < 0.65) step('lob', deep(other(side)), hitFrom);
    else if (f < 0.85) {
      // around the post: the ball travels outside the net post and lands low in the far kitchen corner
      var leftPost = hitFrom[0] < 10;
      var hf = [leftPost ? rr(-2.5, -1.6) : rr(21.6, 22.5), side === 'near' ? rr(23, 26) : rr(18, 21)];
      step('around the post', [leftPost ? rr(0.8, 3) : rr(17, 19.2), side === 'near' ? rr(16, 20) : rr(24, 28)], hf);
    } else step('erne', [rr(3, 17), side === 'near' ? rr(15.6, 20) : rr(24, 28.4)], [prevTo[0] < 10 ? rr(-1.6, -0.6) : rr(20.6, 21.6), side === 'near' ? rr(22.5, 24) : rr(20, 21.5)]);
    return shots;
  }
  function describe(shots) {
    var out = [], i = 0;
    while (i < shots.length) {
      var t = shots[i].type, n = 1;
      while (i + n < shots.length && shots[i + n].type === t) n++;
      out.push(n > 1 ? t + ' ×' + n : t);
      i += n;
    }
    return out.join(' → ');
  }

  // ---- poster ---------------------------------------------------------------------------
  var PW = 900, PH = 1200;
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]; });
  }
  function f2(v) { return Math.round(v * 1000) / 1000; }
  // opts: { ground, ink, weightIn, rotation, style:'lines'|'solid', title, shots, showPath }
  function poster(o) {
    var W = COURT.width, L = COURT.length;
    var rot = (o.rotation || 0) * Math.PI / 180;
    var ow = W + 2 * COURT.postOverhang + 2, oh = L + 2; // breathing room around the court in feet
    var bw = Math.abs(ow * Math.cos(rot)) + Math.abs(oh * Math.sin(rot));
    var bh = Math.abs(ow * Math.sin(rot)) + Math.abs(oh * Math.cos(rot));
    var areaX = 80, areaY = 80, areaW = PW - 160, areaH = PH - 80 - 300;
    var s = Math.min(areaW / bw, areaH / bh);
    var cx = areaX + areaW / 2, cy = areaY + areaH / 2;
    var lw = Math.max(0.05, (o.weightIn || 2) / 12); // feet
    var ink = o.ink, ground = o.ground;
    var solid = o.style === 'solid';
    var lineCol = solid ? ground : ink;
    var g = [];
    g.push('<g transform="translate(' + f2(cx) + ' ' + f2(cy) + ') rotate(' + f2(o.rotation || 0) + ') scale(' + f2(s) + ') translate(' + (-W / 2) + ' ' + (-L / 2) + ')">');
    if (solid) g.push('<rect x="0" y="0" width="' + W + '" height="' + L + '" fill="' + ink + '"/>');
    var ln = lines();
    var segs = ln.perimeter.concat(ln.nvz, ln.centre);
    var d = segs.map(function (q) { return 'M' + q[0] + ' ' + q[1] + 'L' + q[2] + ' ' + q[3]; }).join('');
    g.push('<path d="' + d + '" fill="none" stroke="' + lineCol + '" stroke-width="' + f2(lw) + '" stroke-linecap="square" stroke-linejoin="miter"/>');
    // net: a finer double rule that runs past the sidelines to the posts
    var n = ln.net;
    g.push('<path d="M' + n[0] + ' ' + (n[1] - lw * 0.9) + 'H' + n[2] + 'M' + n[0] + ' ' + (n[1] + lw * 0.9) + 'H' + n[2] + '" stroke="' + ink + '" stroke-width="' + f2(lw * 0.45) + '" fill="none"/>');
    g.push('<rect x="' + f2(n[0] - 0.25) + '" y="' + f2(n[1] - 0.25) + '" width="0.5" height="0.5" fill="' + ink + '"/><rect x="' + f2(n[2] - 0.25) + '" y="' + f2(n[1] - 0.25) + '" width="0.5" height="0.5" fill="' + ink + '"/>');
    if (o.showPath !== false && o.shots) {
      var pathCol = solid ? ground : ink;
      var pw = f2(Math.max(0.06, lw * 0.55));
      o.shots.forEach(function (sh, i) {
        var dash = sh.type === 'lob' ? '1.2 0.6' : sh.type === 'dink' || sh.type === 'drop' || sh.type === 'reset' ? '0.35 0.35' : 'none';
        g.push('<path d="M' + f2(sh.from[0]) + ' ' + f2(sh.from[1]) + 'L' + f2(sh.to[0]) + ' ' + f2(sh.to[1]) + '" stroke="' + pathCol + '" stroke-width="' + pw + '" fill="none"' + (dash !== 'none' ? ' stroke-dasharray="' + dash + '"' : '') + '/>');
        g.push('<rect x="' + f2(sh.from[0] - 0.22) + '" y="' + f2(sh.from[1] - 0.22) + '" width="0.44" height="0.44" fill="' + (solid ? ink : ground) + '" stroke="' + pathCol + '" stroke-width="' + f2(pw * 0.6) + '"/>');
        var last = i === o.shots.length - 1;
        var b = last ? 0.55 : 0.32;
        g.push('<rect x="' + f2(sh.to[0] - b) + '" y="' + f2(sh.to[1] - b) + '" width="' + f2(b * 2) + '" height="' + f2(b * 2) + '" fill="' + pathCol + '"/>');
      });
    }
    g.push('</g>');
    var t = [];
    var title = String(o.title || '').slice(0, 48);
    var size = title.length > 26 ? 44 : 60;
    t.push('<rect x="80" y="' + (PH - 252) + '" width="' + (PW - 160) + '" height="2" fill="' + ink + '"/>');
    t.push('<text x="80" y="' + (PH - 180) + '" font-family="' + SANS + '" font-size="' + size + '" font-weight="650" letter-spacing="-1" fill="' + ink + '">' + esc(title) + '</text>');
    var seq = o.shots ? describe(o.shots).toUpperCase() : '';
    t.push('<text x="80" y="' + (PH - 130) + '" font-family="' + MONO + '" font-size="' + (seq.length > 58 ? 15 : 18) + '" letter-spacing="1" fill="' + ink + '">' + esc(seq) + '</text>');
    t.push('<text x="80" y="' + (PH - 84) + '" font-family="' + MONO + '" font-size="16" letter-spacing="1.5" fill="' + ink + '" opacity="0.7">20 × 44 FT · NVZ 7 FT · LINE ' + esc(String(o.weightIn)) + ' IN</text>');
    t.push('<text x="' + (PW - 80) + '" y="' + (PH - 84) + '" text-anchor="end" font-family="' + MONO + '" font-size="16" letter-spacing="1.5" fill="' + ink + '" opacity="0.7">' + esc((o.seed ? 'SEED ' + o.seed + ' · ' : '') + 'B.04') + '</text>');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + PW + '" height="' + PH + '" viewBox="0 0 ' + PW + ' ' + PH + '">' +
      '<rect width="' + PW + '" height="' + PH + '" fill="' + ground + '"/>' + g.join('') + t.join('') + '</svg>';
  }

  root.CourtCore = { COURT: COURT, lines: lines, serviceCourts: serviceCourts, rally: rally, describe: describe, poster: poster, PW: PW, PH: PH };
})(typeof window !== 'undefined' ? window : globalThis);
