/* 1-bit dither studio: pure image code. Works on grayscale Float32Arrays (0 = black, 1 = white).
   No DOM here, so node tests can load it. */
(function (root) {
  'use strict';

  // Error diffusion kernels: [dx, dy, weight]. Divisors are applied below.
  var KERNELS = {
    'floyd-steinberg': { div: 16, taps: [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]] },
    // Atkinson spreads only 6/8 of the error on purpose. That loss is what keeps highlights clean.
    atkinson: { div: 8, taps: [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]] }
  };
  function kernelSum(name) {
    var k = KERNELS[name];
    var s = 0;
    for (var i = 0; i < k.taps.length; i++) s += k.taps[i][2];
    return s / k.div;
  }

  // Recursive Bayer index matrix of size n (power of two), values 0..n*n-1.
  function bayer(n) {
    if (n === 1) return [[0]];
    var h = bayer(n / 2), m = [];
    for (var y = 0; y < n; y++) {
      m.push([]);
      for (var x = 0; x < n; x++) {
        var q = h[y % (n / 2)][x % (n / 2)] * 4;
        var add = (y < n / 2) ? (x < n / 2 ? 0 : 2) : (x < n / 2 ? 3 : 1);
        m[y].push(q + add);
      }
    }
    return m;
  }
  var BAYER8 = bayer(8);

  var ALGOS = ['atkinson', 'floyd-steinberg', 'bayer', 'threshold'];

  // contrast and brightness in -100..100
  function adjust(gray, contrast, brightness) {
    var c = (contrast || 0) / 100, b = (brightness || 0) / 100;
    var f = c >= 0 ? 1 + c * 3 : 1 + c; // stronger push up, gentle pull down
    var out = new Float32Array(gray.length);
    for (var i = 0; i < gray.length; i++) {
      var v = (gray[i] - 0.5) * f + 0.5 + b * 0.5;
      out[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
    return out;
  }

  // Returns Uint8Array, 1 = paper (light), 0 = ink (dark).
  function dither(gray, w, h, algo) {
    var out = new Uint8Array(w * h);
    var x, y, i;
    if (algo === 'threshold') {
      for (i = 0; i < w * h; i++) out[i] = gray[i] >= 0.5 ? 1 : 0;
      return out;
    }
    if (algo === 'bayer') {
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        i = y * w + x;
        out[i] = gray[i] > (BAYER8[y & 7][x & 7] + 0.5) / 64 ? 1 : 0;
      }
      return out;
    }
    var k = KERNELS[algo] || KERNELS.atkinson;
    var buf = new Float32Array(gray);
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        i = y * w + x;
        var old = buf[i];
        var nv = old >= 0.5 ? 1 : 0;
        out[i] = nv;
        var err = (old - nv) / k.div;
        for (var t = 0; t < k.taps.length; t++) {
          var nx = x + k.taps[t][0], ny = y + k.taps[t][1];
          if (nx < 0 || nx >= w || ny >= h) continue;
          buf[ny * w + nx] += err * k.taps[t][2];
        }
      }
    }
    return out;
  }

  function rgbaToGray(data, w, h) {
    var g = new Float32Array(w * h);
    for (var i = 0, j = 0; i < w * h; i++, j += 4) {
      // alpha composited onto white
      var a = data[j + 3] / 255;
      var l = (0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]) / 255;
      g[i] = l * a + (1 - a);
    }
    return g;
  }

  // ---- built-in sources, generated from a seed -----------------------------
  // "Scene": a lit sphere resting on a checkered plane under a ramp sky, with a small moon.
  function scene(w, h, rand) {
    var g = new Float32Array(w * h);
    var lx = -0.35 - rand() * 0.5, ly = -0.45 - rand() * 0.35, lz = 0.75;
    var ln = Math.hypot(lx, ly, lz); lx /= ln; ly /= ln; lz /= ln;
    var horizon = h * (0.5 + rand() * 0.08);
    var r = Math.min(w, h) * (0.17 + rand() * 0.06);
    var cx = w * (0.36 + rand() * 0.28);
    var cy = horizon + (h - horizon) * (0.5 + rand() * 0.15) - r;
    var mx = w * (0.1 + rand() * 0.8), my = horizon * (0.18 + rand() * 0.3), mr = Math.min(w, h) * (0.035 + rand() * 0.03);
    if (Math.abs(mx - cx) < r + mr * 2) mx = cx > w / 2 ? w * 0.16 : w * 0.84;
    var ang = (rand() - 0.5) * 0.9, ca = Math.cos(ang), sa = Math.sin(ang);
    var tile = 0.35 + rand() * 0.4, drift = rand() * 10;
    var bands = 2 + Math.floor(rand() * 4);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var v;
        if (y < horizon) {
          var t = y / horizon;
          v = 0.12 + 0.78 * t * t + 0.035 * Math.sin(t * Math.PI * bands);
        } else {
          // ground plane seen in perspective: depth from screen row, then a rotated checker
          var fy = (y - horizon + 0.5) / (h - horizon);
          var z = 1 / fy;
          var wx = ((x - w / 2) / w) * z * 2.4, wz = z + drift;
          var u = wx * ca - wz * sa, q = wx * sa + wz * ca;
          var chk = ((Math.floor(u / tile) + Math.floor(q / tile)) & 1) ? 0.82 : 0.2;
          var fade = Math.min(1, fy * 2.2);
          v = 0.55 + (chk - 0.55) * fade;
          // soft contact shadow under the sphere
          var sx = (x - cx + (lx * r * 0.6)) / (r * 1.3), sy = (y - (cy + r * 0.98)) / (r * 0.3);
          var s = sx * sx + sy * sy;
          if (s < 1) v *= 0.25 + 0.75 * s;
        }
        var mdx = x - mx, mdy = y - my;
        if (mdx * mdx + mdy * mdy < mr * mr) v = 0.97;
        var px = (x - cx) / r, py = (y - cy) / r, pp = px * px + py * py;
        if (pp < 1) {
          var pz = Math.sqrt(1 - pp);
          var diff = Math.max(0, px * lx + py * ly + pz * lz);
          var hx = lx, hy = ly, hz = lz + 1, hn = Math.hypot(hx, hy, hz);
          var spec = Math.pow(Math.max(0, (px * hx + py * hy + pz * hz) / hn), 40);
          var bounce = Math.max(0, py) * 0.12; // light reflected up from the floor
          v = 0.05 + 0.8 * diff + 0.5 * spec + bounce;
        }
        g[y * w + x] = v < 0 ? 0 : v > 1 ? 1 : v;
      }
    }
    return g;
  }

  // "Test card": stepped and smooth ramps plus a radial and a sine sweep.
  function testCard(w, h, rand) {
    var g = new Float32Array(w * h);
    var steps = 8 + Math.floor(rand() * 9);
    var freq = 3 + rand() * 5;
    var cxr = 0.5 + (rand() - 0.5) * 0.3;
    for (var y = 0; y < h; y++) {
      var fy = y / h;
      for (var x = 0; x < w; x++) {
        var fx = x / (w - 1 || 1), v;
        if (fy < 0.18) v = Math.floor(fx * steps) / (steps - 1);
        else if (fy < 0.36) v = fx;
        else if (fy < 0.82) {
          var dx = fx - cxr, dy = (fy - 0.59) / 0.46 * (h / w) * 2.2;
          var d = Math.hypot(dx, dy * 0.5);
          v = d < 0.2 ? 1 - d / 0.2 : 0.5 + 0.5 * Math.sin(d * freq * 12);
          v = d < 0.2 ? v : v * 0.6 + 0.2 * (1 - fx) + 0.1;
        } else v = 1 - fx;
        g[y * w + x] = v < 0 ? 0 : v > 1 ? 1 : v;
      }
    }
    return g;
  }

  // Run-length SVG of a 1-bit grid: one <path> of ink rectangles.
  function toSvg(bits, w, h, px, ink, paper) {
    var d = [];
    for (var y = 0; y < h; y++) {
      var x = 0;
      while (x < w) {
        if (bits[y * w + x] === 0) {
          var s = x;
          while (x < w && bits[y * w + x] === 0) x++;
          d.push('M' + s + ' ' + y + 'h' + (x - s) + 'v1h-' + (x - s) + 'z');
        } else x++;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (w * px) + '" height="' + (h * px) +
      '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">' +
      '<rect width="' + w + '" height="' + h + '" fill="' + paper + '"/>' +
      '<path fill="' + ink + '" d="' + d.join('') + '"/></svg>';
  }

  root.DitherCore = {
    KERNELS: KERNELS, kernelSum: kernelSum, bayer: bayer, BAYER8: BAYER8, ALGOS: ALGOS,
    adjust: adjust, dither: dither, rgbaToGray: rgbaToGray, scene: scene, testCard: testCard, toSvg: toSvg
  };
})(typeof window !== 'undefined' ? window : globalThis);
