/* PointCast Make kit. Shared by every configurator under /make/.
 * Seeded randomness, URL-hash state, control panel, and PNG/SVG export.
 * No network, no dependencies. Runs in the browser and in node (for tests). */
(function (g) {
  'use strict';

  /* ---------- seeded randomness ---------- */

  // FNV-1a over UTF-16 code units, then a final avalanche mix.
  function hashSeed(str) {
    var h = 0x811c9dc5;
    var s = String(str);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  // mulberry32, wrapped with helpers. rng(seedStringOrNumber).
  function rng(seed) {
    var a = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
    function next() {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    next.range = function (lo, hi) { return lo + (hi - lo) * next(); };
    next.int = function (lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); };
    next.pick = function (arr) { return arr[Math.floor(next() * arr.length)]; };
    next.chance = function (p) { return next() < p; };
    return next;
  }

  var SYLLABLES = ['ba', 'ko', 'ri', 'tu', 'mel', 'zo', 'pa', 'ne', 'ux', 'li', 'do', 'sa', 'vin', 'ar', 'em', 'ok', 'ty', 'qua', 'fe', 'lo'];
  function seedWord(r) {
    var w = r.pick(SYLLABLES) + r.pick(SYLLABLES) + r.pick(SYLLABLES);
    return w + '-' + r.int(10, 99);
  }

  // A fresh, non-deterministic seed for the shuffle button only.
  function freshRng() {
    var n;
    if (g.crypto && g.crypto.getRandomValues) {
      var a = new Uint32Array(1); g.crypto.getRandomValues(a); n = a[0];
    } else {
      n = Math.floor(Math.random() * 4294967296);
    }
    return rng(n >>> 0);
  }

  /* ---------- state in the URL hash ---------- */

  function optValues(f) {
    return (f.options || []).map(function (o) { return typeof o === 'object' ? String(o.v) : String(o); });
  }

  function clean(f, raw) {
    if (raw === undefined || raw === null) return f.def;
    var t = f.type;
    if (t === 'range') {
      var n = Number(raw);
      if (!isFinite(n)) return f.def;
      var step = f.step || 1;
      n = Math.round((n - f.min) / step) * step + f.min;
      n = Math.min(f.max, Math.max(f.min, n));
      return Number(n.toFixed(6));
    }
    if (t === 'select' || t === 'seg') {
      var v = String(raw);
      return optValues(f).indexOf(v) >= 0 ? v : f.def;
    }
    if (t === 'toggle') {
      if (raw === true || raw === '1' || raw === 1 || raw === 'true') return true;
      if (raw === false || raw === '0' || raw === 0 || raw === 'false') return false;
      return f.def;
    }
    if (t === 'date') {
      var d = String(raw);
      return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + 'T00:00:00Z')) ? d : f.def;
    }
    // text and seed: strip control characters, cap the length.
    var s = String(raw).replace(/[\u0000-\u001f\u007f]/g, '');
    if (f.upper) s = s.toUpperCase();
    if (f.pattern) s = s.replace(f.pattern, '');
    return s.slice(0, f.max || 40);
  }

  function defaults(schema) {
    var s = {};
    schema.forEach(function (f) { s[f.key] = f.def; });
    return s;
  }

  function encode(state, schema) {
    return schema.map(function (f) {
      var v = state[f.key];
      if (f.type === 'toggle') v = v ? '1' : '0';
      return f.key + '=' + encodeURIComponent(String(v));
    }).join('&');
  }

  function decode(hash, schema) {
    var raw = {};
    String(hash || '').replace(/^#/, '').split('&').forEach(function (part) {
      if (!part) return;
      var i = part.indexOf('=');
      var k = i < 0 ? part : part.slice(0, i);
      var v = i < 0 ? '' : part.slice(i + 1);
      try { raw[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { /* skip bad pair */ }
    });
    var s = {};
    schema.forEach(function (f) { s[f.key] = clean(f, raw[f.key]); });
    return s;
  }

  /* ---------- svg helpers ---------- */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function n1(x) { return Math.round(x * 10) / 10; }
  function n2(x) { return Math.round(x * 100) / 100; }
  // Points [[x,y],...] to an SVG path.
  function poly(pts, close) {
    var d = '';
    for (var i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + n1(pts[i][0]) + ' ' + n1(pts[i][1]);
    return close ? d + 'Z' : d;
  }
  function svgDoc(w, h, body, opts) {
    opts = opts || {};
    var size = opts.physical ? ' width="' + opts.physical[0] + '" height="' + opts.physical[1] + '"' : ' width="' + w + '" height="' + h + '"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"' + size +
      (opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : '') + '>' + body + '</svg>';
  }

  var FONT = {
    sans: 'ui-sans-serif, system-ui, -apple-system, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, &quot;SF Mono&quot;, Menlo, Consolas, &quot;Liberation Mono&quot;, monospace',
    serif: 'ui-serif, Georgia, &quot;Times New Roman&quot;, serif'
  };

  /* ---------- PNG print resolution (pHYs chunk) ---------- */

  var CRC_TABLE = null;
  function crc32(bytes) {
    if (!CRC_TABLE) {
      CRC_TABLE = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        CRC_TABLE[n] = c >>> 0;
      }
    }
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  // Insert (or replace) a pHYs chunk so print software reads the right DPI.
  function pngSetDpi(input, dpi) {
    var src = new Uint8Array(input);
    var sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (var s = 0; s < 8; s++) if (src[s] !== sig[s]) return src;
    var ppm = Math.round(dpi / 0.0254);
    var chunk = new Uint8Array(21);
    var dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9);
    chunk.set([112, 72, 89, 115], 4); // pHYs
    dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
    dv.setUint32(17, crc32(chunk.subarray(4, 17)));
    // Walk the chunks, drop any existing pHYs, insert ours after IHDR.
    var parts = [src.subarray(0, 8)];
    var p = 8;
    var view = new DataView(src.buffer, src.byteOffset, src.byteLength);
    while (p + 8 <= src.length) {
      var len = view.getUint32(p);
      var type = String.fromCharCode(src[p + 4], src[p + 5], src[p + 6], src[p + 7]);
      var end = p + 12 + len;
      if (type !== 'pHYs') parts.push(src.subarray(p, end));
      if (type === 'IHDR') parts.push(chunk);
      p = end;
    }
    var total = parts.reduce(function (a, b) { return a + b.length; }, 0);
    var out = new Uint8Array(total);
    var o = 0;
    parts.forEach(function (b) { out.set(b, o); o += b.length; });
    return out;
  }

  /* ---------- browser UI ---------- */

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (attrs[k] === true) e.setAttribute(k, '');
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'piece';
  }

  function buildField(f, state, onChange) {
    var id = 'f-' + f.key;
    var wrap = el('div', { class: 'mk-field mk-t-' + f.type, 'data-key': f.key });
    var hint = f.hint ? el('span', { class: 'mk-hint', id: id + '-hint', text: f.hint }) : null;
    var described = hint ? id + '-hint' : null;

    if (f.type === 'seg') {
      var fs = el('fieldset', { class: 'mk-seg', 'aria-describedby': described });
      fs.appendChild(el('legend', { class: 'mk-label', text: f.label }));
      var row = el('div', { class: 'mk-seg-row' });
      f.options.forEach(function (o) {
        var v = typeof o === 'object' ? String(o.v) : String(o);
        var lab = typeof o === 'object' ? o.label : String(o);
        var rid = id + '-' + slugify(v);
        var input = el('input', { type: 'radio', name: id, id: rid, value: v });
        input.checked = String(state[f.key]) === v;
        input.addEventListener('change', function () { if (input.checked) onChange(f.key, v); });
        var l = el('label', { for: rid });
        if (o.swatch) l.appendChild(el('span', { class: 'mk-swatch', 'aria-hidden': 'true', style: 'background:' + o.swatch }));
        l.appendChild(el('span', { text: lab }));
        row.appendChild(el('span', { class: 'mk-seg-item' }, [input, l]));
      });
      fs.appendChild(row);
      wrap.appendChild(fs);
      if (hint) wrap.appendChild(hint);
      return wrap;
    }

    var head = el('div', { class: 'mk-field-head' }, [el('label', { class: 'mk-label', for: id, text: f.label })]);
    var input;
    if (f.type === 'range') {
      var out = el('output', { class: 'mk-value', for: id, id: id + '-out', text: fmt(f, state[f.key]) });
      head.appendChild(out);
      input = el('input', { type: 'range', id: id, min: f.min, max: f.max, step: f.step || 1, value: state[f.key], 'aria-describedby': described });
      input.addEventListener('input', function () {
        var v = clean(f, input.value);
        out.textContent = fmt(f, v);
        onChange(f.key, v);
      });
    } else if (f.type === 'select') {
      input = el('select', { id: id, 'aria-describedby': described });
      f.options.forEach(function (o) {
        var v = typeof o === 'object' ? String(o.v) : String(o);
        var opt = el('option', { value: v, text: typeof o === 'object' ? o.label : String(o) });
        if (String(state[f.key]) === v) opt.selected = true;
        input.appendChild(opt);
      });
      input.addEventListener('change', function () { onChange(f.key, input.value); });
    } else if (f.type === 'toggle') {
      input = el('input', { type: 'checkbox', id: id, 'aria-describedby': described });
      input.checked = !!state[f.key];
      input.addEventListener('change', function () { onChange(f.key, input.checked); });
      var lab = el('label', { class: 'mk-toggle-row', for: id }, [input, el('span', { class: 'mk-label', text: f.label })]);
      wrap.appendChild(lab);
      if (hint) wrap.appendChild(hint);
      return wrap;
    } else {
      input = el('input', {
        type: f.type === 'date' ? 'date' : 'text', id: id, value: state[f.key], maxlength: f.max || 40,
        autocomplete: 'off', autocapitalize: f.upper ? 'characters' : 'off', spellcheck: 'false', 'aria-describedby': described
      });
      input.addEventListener('input', function () {
        var v = clean(f, input.value);
        onChange(f.key, v);
      });
      input.addEventListener('blur', function () { input.value = clean(f, input.value); });
    }
    wrap.appendChild(head);
    wrap.appendChild(input);
    if (hint) wrap.appendChild(hint);
    return wrap;
  }

  function fmt(f, v) { return (f.format ? f.format(v) : String(v)) + (f.unit ? ' ' + f.unit : ''); }

  function syncField(f, form, v) {
    var id = 'f-' + f.key;
    if (f.type === 'seg') {
      var r = form.querySelectorAll('input[name="' + id + '"]');
      for (var i = 0; i < r.length; i++) r[i].checked = r[i].value === String(v);
      return;
    }
    var input = form.querySelector('#' + id);
    if (!input) return;
    if (f.type === 'toggle') input.checked = !!v;
    else if (document.activeElement !== input) input.value = v;
    var out = form.querySelector('#' + id + '-out');
    if (out) out.textContent = fmt(f, v);
  }

  function mount(tool) {
    var art = document.getElementById('art');
    var form = document.getElementById('controls');
    var status = document.getElementById('status');
    var actions = document.getElementById('actions');
    if (!art || !form) return;

    var state = decode(location.hash, tool.schema);
    var pending = false;
    var lastSvg = '';
    var statusTimer = null;

    function say(msg) {
      if (!status) return;
      status.textContent = msg;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(function () { status.textContent = ''; }, 3500);
    }

    function writeHash() {
      var h = '#' + encode(state, tool.schema);
      if (location.hash !== h) history.replaceState(null, '', h);
    }

    function draw() {
      pending = false;
      lastSvg = tool.render(state);
      art.innerHTML = lastSvg;
      var svg = art.querySelector('svg');
      if (svg) { svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('focusable', 'false'); }
      art.setAttribute('aria-label', tool.describe ? tool.describe(state) : tool.title);
      if (tool.afterRender) tool.afterRender(state, art);
      writeHash();
    }
    function schedule() {
      if (pending) return;
      pending = true;
      (g.requestAnimationFrame || setTimeout)(draw);
    }
    function onChange(key, v) { state[key] = v; schedule(); }

    tool.schema.forEach(function (f) {
      if (f.group) form.appendChild(el('h2', { class: 'mk-group', text: f.group }));
      form.appendChild(buildField(f, state, onChange));
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    function setAll(next) {
      tool.schema.forEach(function (f) {
        state[f.key] = clean(f, next[f.key]);
        syncField(f, form, state[f.key]);
      });
      draw();
    }

    g.addEventListener('hashchange', function () {
      var next = decode(location.hash, tool.schema);
      if (encode(next, tool.schema) !== encode(state, tool.schema)) setAll(next);
    });

    function fileBase() { return 'pointcast-' + tool.slug + '-' + slugify(state.seed || 'piece'); }

    var buttons = {
      shuffle: function () {
        var r = freshRng();
        var next = Object.assign({}, state, tool.shuffle ? tool.shuffle(r, state) : {});
        next.seed = seedWord(r);
        setAll(next);
        say('Shuffled. New seed: ' + state.seed);
      },
      link: function () {
        writeHash();
        var url = location.href;
        function fallback() {
          var t = el('textarea', { readonly: true, 'aria-hidden': 'true' });
          t.value = url; t.style.position = 'fixed'; t.style.opacity = '0';
          document.body.appendChild(t); t.select();
          var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
          t.remove();
          say(ok ? 'Link copied.' : 'Copy this link from the address bar.');
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { say('Link copied. The whole piece lives in it.'); }, fallback);
        } else fallback();
      },
      svg: function () {
        var sz = tool.size(state);
        download(new Blob([tool.render(state, { physical: sz.physical, export: true })], { type: 'image/svg+xml' }), fileBase() + '.svg');
        say('SVG saved.');
      },
      png: function () {
        var sz = tool.size(state);
        say('Drawing PNG at ' + sz.w + ' x ' + sz.h + ' px...');
        var url = URL.createObjectURL(new Blob([tool.render(state, { export: true })], { type: 'image/svg+xml' }));
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          c.width = sz.w; c.height = sz.h;
          var ctx = c.getContext('2d');
          if (sz.bg) { ctx.fillStyle = sz.bg; ctx.fillRect(0, 0, sz.w, sz.h); }
          ctx.drawImage(img, 0, 0, sz.w, sz.h);
          URL.revokeObjectURL(url);
          c.toBlob(function (blob) {
            if (!blob) { say('PNG failed in this browser. Try the SVG.'); return; }
            if (!sz.dpi) { download(blob, fileBase() + '.png'); say('PNG saved.'); return; }
            blob.arrayBuffer().then(function (buf) {
              download(new Blob([pngSetDpi(buf, sz.dpi)], { type: 'image/png' }), fileBase() + '.png');
              say('PNG saved: ' + sz.w + ' x ' + sz.h + ' px at ' + sz.dpi + ' dpi' + (sz.label ? ' (' + sz.label + ')' : '') + '.');
            });
          }, 'image/png');
        };
        img.onerror = function () { URL.revokeObjectURL(url); say('PNG failed in this browser. Try the SVG.'); };
        img.src = url;
      }
    };

    if (actions) {
      actions.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');
        if (buttons[act]) buttons[act]();
        else if (tool.actions && tool.actions[act]) tool.actions[act](state, b, say);
      });
    }

    draw();
    if (tool.init) tool.init(state, { say: say, art: art });
  }

  var Kit = {
    hashSeed: hashSeed, rng: rng, seedWord: seedWord, freshRng: freshRng,
    clean: clean, defaults: defaults, encode: encode, decode: decode,
    esc: esc, n1: n1, n2: n2, poly: poly, svgDoc: svgDoc, FONT: FONT,
    crc32: crc32, pngSetDpi: pngSetDpi, mount: mount
  };
  g.MakeKit = Kit;
  g.MakeTools = g.MakeTools || {};
  if (typeof module !== 'undefined' && module.exports) module.exports = Kit;
})(typeof globalThis !== 'undefined' ? globalThis : this);
