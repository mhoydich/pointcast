/* PointCast make, kit B. Small shared helpers for four art configurators.
   No network, no storage, no third parties. Pure helpers work in node too. */
(function (root) {
  'use strict';

  // ---- seeded randomness -------------------------------------------------
  function hashString(str) {
    var h = 2166136261 >>> 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function rng(seed) {
    var a = hashString(seed) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var SEED_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
  function newSeed(len) {
    len = len || 6;
    var out = '';
    var buf = new Uint32Array(len);
    var c = root.crypto || (typeof crypto !== 'undefined' ? crypto : null);
    if (c && c.getRandomValues) c.getRandomValues(buf);
    else for (var j = 0; j < len; j++) buf[j] = Math.floor(Math.random() * 4294967296);
    for (var i = 0; i < len; i++) out += SEED_ALPHABET[buf[i] % SEED_ALPHABET.length];
    return out;
  }
  function cleanSeed(s) {
    s = String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
    return s;
  }

  // ---- small math / format -----------------------------------------------
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function num(v, lo, hi, dflt) {
    var n = Number(v);
    if (v === '' || v == null || !isFinite(n)) return dflt;
    return clamp(n, lo, hi);
  }
  function hex(v, dflt) {
    var s = String(v == null ? '' : v).replace(/^#/, '').toLowerCase();
    return /^[0-9a-f]{6}$/.test(s) ? '#' + s : dflt;
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function escapeXml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c];
    });
  }
  function hexToRgb(h) {
    h = String(h).replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return ('0' + clamp(Math.round(v), 0, 255).toString(16)).slice(-2); }).join('');
  }
  function mix(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  }
  function luminance(h) {
    var c = hexToRgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  // ---- URL hash state ----------------------------------------------------
  function parseHash(h) {
    var out = {};
    h = String(h || '').replace(/^#/, '');
    if (!h) return out;
    h.split('&').forEach(function (pair) {
      if (!pair) return;
      var i = pair.indexOf('=');
      var k = i < 0 ? pair : pair.slice(0, i);
      var v = i < 0 ? '' : pair.slice(i + 1);
      try { out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { /* skip bad pair */ }
    });
    return out;
  }
  function buildHash(obj) {
    return Object.keys(obj).filter(function (k) { return obj[k] !== undefined && obj[k] !== null && obj[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(String(obj[k])).replace(/%20/g, '+'); })
      .join('&');
  }
  function readHash() { return parseHash(root.location ? root.location.hash : ''); }
  function writeHash(obj) {
    if (!root.location || !root.history) return;
    var h = '#' + buildHash(obj);
    if (root.location.hash === h) return;
    try { root.history.replaceState(null, '', h); } catch (e) { root.location.hash = h; }
  }

  // ---- browser-only helpers ---------------------------------------------
  function $(sel, ctx) { return (ctx || root.document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || root.document).querySelectorAll(sel)); }

  var statusTimer = 0;
  function status(msg) {
    var el = $('#kb-status');
    if (!el) return;
    el.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { el.textContent = ''; }, 4000);
  }

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = root.document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    root.document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function downloadCanvas(canvas, name) {
    if (canvas.toBlob) {
      canvas.toBlob(function (b) { if (b) { downloadBlob(b, name); status('Saved ' + name); } }, 'image/png');
    }
  }
  function downloadSvg(svgText, name) {
    downloadBlob(new Blob([svgText], { type: 'image/svg+xml' }), name);
    status('Saved ' + name);
  }
  // Render an SVG string to a canvas (all local: data from a Blob URL).
  function svgToCanvas(svgText, w, h, cb) {
    var img = new root.Image();
    var url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
    img.onload = function () {
      var c = root.document.createElement('canvas');
      c.width = w; c.height = h;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      cb(c);
    };
    img.onerror = function () { URL.revokeObjectURL(url); status('Could not render the PNG in this browser'); };
    img.src = url;
  }
  function downloadSvgAsPng(svgText, w, h, name) {
    svgToCanvas(svgText, w, h, function (c) { downloadCanvas(c, name); });
  }
  function copyLink() {
    var url = root.location.href;
    function fallback() {
      var t = root.document.createElement('textarea');
      t.value = url; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
      root.document.body.appendChild(t); t.select();
      var ok = false;
      try { ok = root.document.execCommand('copy'); } catch (e) { ok = false; }
      t.remove();
      status(ok ? 'Link copied' : 'Copy this link from the address bar');
    }
    if (root.navigator && root.navigator.clipboard && root.isSecureContext) {
      root.navigator.clipboard.writeText(url).then(function () { status('Link copied'); }, fallback);
    } else fallback();
  }
  function reducedMotion() {
    return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  // Bind a range input to its <output>, with a formatter.
  function bindOutput(input, fmt) {
    var out = root.document.querySelector('output[for="' + input.id + '"]');
    function sync() { if (out) out.textContent = fmt ? fmt(input.value) : input.value; }
    input.addEventListener('input', sync);
    sync();
    return sync;
  }
  function setRadio(name, value) {
    $all('input[name="' + name + '"]').forEach(function (r) { r.checked = r.value === value; });
  }
  function getRadio(name) {
    var r = $('input[name="' + name + '"]:checked');
    return r ? r.value : null;
  }
  // Colour picker with a hex readout next to it.
  function bindColor(input) {
    var code = input.parentNode.querySelector('code');
    function sync() { if (code) code.textContent = input.value.toUpperCase(); }
    input.addEventListener('input', sync);
    sync();
    return sync;
  }
  function debounce(fn, ms) {
    var t = 0;
    return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); };
  }
  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'pointcast';
  }

  var api = {
    hashString: hashString, rng: rng, newSeed: newSeed, cleanSeed: cleanSeed,
    clamp: clamp, num: num, hex: hex, pick: pick, escapeXml: escapeXml,
    hexToRgb: hexToRgb, rgbToHex: rgbToHex, mix: mix, luminance: luminance, contrast: contrast,
    parseHash: parseHash, buildHash: buildHash, readHash: readHash, writeHash: writeHash,
    $: $, $all: $all, status: status,
    downloadBlob: downloadBlob, downloadCanvas: downloadCanvas, downloadSvg: downloadSvg,
    svgToCanvas: svgToCanvas, downloadSvgAsPng: downloadSvgAsPng, copyLink: copyLink,
    reducedMotion: reducedMotion, bindOutput: bindOutput, setRadio: setRadio, getRadio: getRadio,
    bindColor: bindColor, debounce: debounce, slugify: slugify
  };
  root.KitB = api;
})(typeof window !== 'undefined' ? window : globalThis);
