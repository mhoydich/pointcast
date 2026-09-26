/*!
 * PointCast keyboard — add the keyboard to anything.
 *
 *   <script src="https://pointcast.xyz/keyboard.js" data-app="my-site" async></script>
 *   <pointcast-keyboard></pointcast-keyboard>
 *
 * Every note lands on the one PointCast keyboard counter
 * (pointcast.xyz/keyboard-signal), tagged with where it came from. Pitched
 * notes also build the town's chord of the day.
 *
 * <script> options
 *   data-app     name for your surface (defaults to your hostname)
 *   data-kind    embed | standalone | artifact | agent | other  (default: inferred)
 *   data-place   optional coarse place slug, e.g. "el-segundo"
 *   data-listen  "true" to count this page's keystrokes as unpitched notes.
 *                Only a count is sent, never which key, and password fields,
 *                shortcuts and held-key repeats are skipped.
 *   data-sound   "false" to keep <pointcast-keyboard> and note() silent
 *
 * <pointcast-keyboard> attributes
 *   look    piano | pill | badge          (default piano)
 *   octave  2-6, the piano's starting C   (default 4)
 *   keys    8-25 white+black keys on the piano (default 13 = one octave)
 *   count   show the live global count ("false" hides it)
 *   app, place, kind, sound
 *
 * Plain HTML: any element with data-pointcast-keyboard-note="60" plays that
 * MIDI note; any element with data-pointcast-keyboard-count shows the total.
 *
 * JS:  PointCastKeyboard.note(midi | midi[], tag?, {sound?}) · .play(text, tag?)
 *      .keys(n, tag?) · .total() · .flush() · .textToNotes(text) · .tone(midi)
 *      and the "pointcast:keyboard" window event: detail = { globalTotal, notes, keys, source }
 *
 * No cookies, no fingerprinting, no text: notes are batched plain numbers.
 */
(function () {
  'use strict';
  if (window.PointCastKeyboard) return;

  var script = document.currentScript;
  var ORIGIN = script && script.src ? new URL(script.src).origin : 'https://pointcast.xyz';
  var ENDPOINT = ORIGIN + '/api/keyboard/signal';
  var data = (script && script.dataset) || {};
  var baseTag = { app: data.app || location.hostname || 'unknown', kind: data.kind || undefined, place: data.place || undefined };
  var soundOn = data.sound !== 'false';

  var queues = {};
  var timer = null;
  var lastTotal = null;
  var ac = null;
  var bus = null;
  var widgets = new Set();

  // ---- sound ---------------------------------------------------------------

  function audio() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      bus = ac.createGain();
      bus.gain.value = 0.5;
      var comp = ac.createDynamicsCompressor();
      bus.connect(comp).connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  /** A soft bell-piano voice. Returns quietly if audio is unavailable. */
  function tone(midi, when, length) {
    try {
      var ctx = audio();
      var t = when || ctx.currentTime;
      var f = 440 * Math.pow(2, (midi - 69) / 12);
      var dur = length || 1.1;
      [[1, 'triangle', 0.22], [2, 'sine', 0.07], [3.01, 'sine', 0.025]].forEach(function (p) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = p[1];
        o.frequency.value = f * p[0];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(p[2], t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur / p[0]);
        o.connect(g).connect(bus);
        o.start(t);
        o.stop(t + dur / p[0] + 0.05);
      });
    } catch (e) { /* audio is a nicety */ }
  }

  // ---- text → notes (same mapping as the API and MCP keyboard_play) --------

  var PENT = [0, 2, 4, 7, 9];
  function textToNotes(text, max) {
    var out = [];
    var s = String(text || '').toLowerCase();
    max = max || 64;
    for (var i = 0; i < s.length && out.length < max; i++) {
      var c = s.charCodeAt(i);
      if (c >= 97 && c <= 122) { var k = c - 97; out.push(60 + (Math.floor(k / 5) % 2) * 12 + PENT[k % 5]); }
      else if (c >= 48 && c <= 57) { var d = c - 48; out.push(48 + Math.floor(d / 5) * 12 + PENT[d % 5]); }
    }
    return out;
  }

  // ---- the queue -----------------------------------------------------------

  function mergeTag(tag) {
    tag = tag || {};
    return { app: tag.app || baseTag.app, kind: tag.kind || baseTag.kind, place: tag.place || baseTag.place };
  }

  function send(tag, notes, keys, useBeacon) {
    var body = JSON.stringify({ notes: notes, count: keys, app: tag.app, kind: tag.kind, place: tag.place });
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
      return;
    }
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: body, keepalive: true })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) return;
        lastTotal = Math.max(lastTotal || 0, res.globalTotal);
        window.dispatchEvent(new CustomEvent('pointcast:keyboard', {
          detail: { globalTotal: res.globalTotal, notes: res.notes, keys: res.keys, source: res.source, id: res.id },
        }));
        paint();
      })
      .catch(function () { /* offline: the note is lost, the page is fine */ });
  }

  function flush(useBeacon) {
    clearTimeout(timer);
    timer = null;
    Object.keys(queues).forEach(function (key) {
      var q = queues[key];
      while (q.notes.length || q.keys > 0) {
        var notes = q.notes.splice(0, 64);
        var keys = Math.min(200, q.keys);
        q.keys -= keys;
        send(q.tag, notes, keys, useBeacon);
      }
      delete queues[key];
    });
  }

  function enqueue(notes, keys, tag) {
    var t = mergeTag(tag);
    var key = [t.kind || '', t.app, t.place || ''].join('|');
    var q = queues[key] = queues[key] || { tag: t, notes: [], keys: 0 };
    for (var i = 0; i < notes.length; i++) q.notes.push(notes[i]);
    q.keys += keys;
    var count = notes.length + keys;
    if (lastTotal !== null) { lastTotal += count; paint(); }
    if (q.notes.length >= 48 || q.keys >= 150) flush(false);
    else if (!timer) timer = setTimeout(function () { flush(false); }, 1500);
  }

  function cleanNotes(input) {
    var list = Array.isArray(input) ? input : [input];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var n = Math.round(Number(list[i]));
      if (isFinite(n) && n >= 0 && n <= 127) out.push(n);
    }
    return out;
  }

  /** Play and count one note or a chord. */
  function note(midi, tag, opts) {
    var notes = cleanNotes(midi);
    if (!notes.length) return;
    if (!(opts && opts.sound === false) && soundOn) notes.forEach(function (n) { tone(n); });
    enqueue(notes, 0, tag);
  }

  /** Play text as a little melody; only the notes are sent. */
  function play(text, tag, opts) {
    var notes = textToNotes(text, 64);
    if (!notes.length) return notes;
    var step = (opts && opts.step) || 0.16;
    if (!(opts && opts.sound === false) && soundOn) {
      var ctx = audio();
      notes.forEach(function (n, i) { tone(n, ctx.currentTime + i * step, 0.9); });
    }
    enqueue(notes, 0, tag);
    return notes;
  }

  function keys(n, tag) {
    var count = Math.max(1, Math.min(200, Math.floor(Number(n) || 1)));
    enqueue([], count, tag);
  }

  var totalPromise = null;
  function total() {
    totalPromise = totalPromise || fetch(ENDPOINT)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && typeof res.globalTotal === 'number') { lastTotal = Math.max(lastTotal || 0, res.globalTotal); paint(); }
        return lastTotal;
      })
      .catch(function () { return lastTotal; })
      .then(function (v) { totalPromise = null; return v; });
    return totalPromise;
  }

  function paint() {
    if (lastTotal === null) return;
    var text = lastTotal.toLocaleString('en-US');
    var nodes = document.querySelectorAll('[data-pointcast-keyboard-count]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
    widgets.forEach(function (w) { w._paint(text); });
  }

  // ---- <pointcast-keyboard> ------------------------------------------------

  var CSS = [
    ':host{display:inline-block;vertical-align:middle;-webkit-tap-highlight-color:transparent;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
    'button{all:unset;box-sizing:border-box;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none}',
    'button:focus-visible{outline:2px solid #dfc48d;outline-offset:2px}',
    '.piano{display:inline-flex;flex-direction:column;gap:6px;padding:10px 10px 8px;border-radius:12px;background:#101813;border:1px solid #2b3c2e;box-shadow:0 6px 18px #0003}',
    '.keys{position:relative;display:flex;height:96px}',
    '.w{width:30px;height:96px;margin-right:2px;border-radius:0 0 6px 6px;background:#ede9d7;box-shadow:inset 0 -5px 0 #cfc8ac;transition:transform .05s,background .1s}',
    '.b{position:absolute;top:0;width:20px;height:58px;border-radius:0 0 5px 5px;background:#1d2a20;border:1px solid #0b120d;z-index:1;box-shadow:inset 0 -4px 0 #34463a}',
    '.w.on{background:#dfc48d;transform:translateY(2px)}.b.on{background:#b39a5f}',
    '.meta{display:flex;justify-content:space-between;gap:10px;font-size:10px;color:#97ab91;letter-spacing:.06em}',
    '.meta b{color:#dfc48d;font-weight:normal}',
    '.pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px 8px 10px;border:1px solid #2b3c2e;border-radius:999px;background:#101813;color:#ede9d7;font-size:13px}',
    '.pill .dot{width:22px;height:22px;border-radius:50%;background:#dfc48d;color:#101813;display:grid;place-items:center;font-size:12px}',
    '.pill .n{color:#97ab91}',
    '.pill.on{transform:translateY(1px)}',
    '.badge{display:flex;width:88px;height:31px;border:1px solid #000;background:#000;font:bold 9px/1 Verdana,Tahoma,sans-serif}',
    '.badge .l{width:31px;display:grid;place-items:center;background:#ede9d7;color:#101813;font-size:15px;border-right:1px solid #000}',
    '.badge .r{flex:1;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:0 4px;background:linear-gradient(#1f3a25,#0b1a0f);color:#fff}',
    '.badge .r b{color:#dfc48d}.badge .r span{color:#b8e0b0;font-variant-numeric:tabular-nums}',
  ].join('');

  function attr(el, name, fallback) {
    var v = el.getAttribute(name);
    return v === null || v === '' ? fallback : v;
  }

  var BLACK = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
  var PHRASE = [0, 2, 4, 7, 9, 12, 9, 7, 4, 2];

  if (window.customElements && !customElements.get('pointcast-keyboard')) {
    var El = function () { return Reflect.construct(HTMLElement, [], El); };
    El.prototype = Object.create(HTMLElement.prototype);
    El.prototype.constructor = El;
    Object.setPrototypeOf(El, HTMLElement);

    El.prototype.connectedCallback = function () {
      if (this._root) { widgets.add(this); return; }
      var self = this;
      var look = attr(this, 'look', 'piano');
      var showCount = attr(this, 'count', 'true') !== 'false';
      var root = this._root = this.attachShadow ? this.attachShadow({ mode: 'open' }) : this;
      var style = document.createElement('style');
      style.textContent = CSS;
      var tag = function () {
        return { app: self.getAttribute('app') || undefined, kind: self.getAttribute('kind') || undefined, place: self.getAttribute('place') || undefined };
      };
      var opts = function () { return { sound: attr(self, 'sound', 'true') !== 'false' }; };
      var countEl = null;
      var wrap;

      if (look === 'pill' || look === 'badge') {
        var step = 0;
        wrap = document.createElement('button');
        wrap.type = 'button';
        wrap.className = look;
        wrap.setAttribute('aria-label', 'Play a note on the PointCast keyboard');
        wrap.innerHTML = look === 'pill'
          ? '<span class="dot">♪</span><span class="t"></span><span class="n"></span>'
          : '<span class="l">♪</span><span class="r"><b>POINTCAST</b><span class="n">KEYS</span></span>';
        if (look === 'pill') wrap.querySelector('.t').textContent = attr(this, 'label', 'keyboard');
        countEl = wrap.querySelector('.n');
        var hit = function () {
          note(60 + PHRASE[step++ % PHRASE.length], tag(), opts());
          wrap.classList.add('on');
          setTimeout(function () { wrap.classList.remove('on'); }, 90);
        };
        wrap.addEventListener('pointerdown', function (e) { if (e.button && e.button !== 0) return; e.preventDefault(); hit(); });
        wrap.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(); } });
      } else {
        var octave = Math.max(2, Math.min(6, Math.floor(Number(attr(this, 'octave', 4))) || 4));
        var span = Math.max(8, Math.min(25, Math.floor(Number(attr(this, 'keys', 13))) || 13));
        var base = (octave + 1) * 12;
        wrap = document.createElement('div');
        wrap.className = 'piano';
        var keysEl = document.createElement('div');
        keysEl.className = 'keys';
        keysEl.setAttribute('role', 'group');
        keysEl.setAttribute('aria-label', 'PointCast keyboard');
        var whiteIndex = 0;
        for (var i = 0; i < span; i++) {
          var midi = base + i;
          var isBlack = BLACK[i % 12];
          var k = document.createElement('button');
          k.type = 'button';
          k.className = isBlack ? 'b' : 'w';
          k.dataset.midi = String(midi);
          k.setAttribute('aria-label', 'note ' + midi);
          if (isBlack) k.style.left = (whiteIndex * 32 - 11) + 'px';
          else whiteIndex++;
          keysEl.appendChild(k);
        }
        var down = function (btn) {
          note(Number(btn.dataset.midi), tag(), opts());
          btn.classList.add('on');
          setTimeout(function () { btn.classList.remove('on'); }, 140);
        };
        keysEl.addEventListener('pointerdown', function (e) {
          var btn = e.target.closest && e.target.closest('button');
          if (!btn || (e.button && e.button !== 0)) return;
          e.preventDefault();
          down(btn);
        });
        keysEl.addEventListener('keydown', function (e) {
          if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.midi) { e.preventDefault(); down(e.target); }
        });
        var meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = '<span>POINTCAST <b>KEYS</b></span><span class="n"></span>';
        countEl = meta.querySelector('.n');
        wrap.appendChild(keysEl);
        wrap.appendChild(meta);
      }
      if (!showCount && countEl) { countEl.textContent = ''; countEl = null; }

      this._paint = function (text) {
        if (!countEl) return;
        countEl.textContent = look === 'pill' ? '· ' + text : look === 'badge' ? text : text + ' notes';
      };
      root.appendChild(style);
      root.appendChild(wrap);
      widgets.add(this);
      if (lastTotal !== null) this._paint(lastTotal.toLocaleString('en-US'));
      else if (countEl) total();
    };
    El.prototype.disconnectedCallback = function () { widgets.delete(this); };
    customElements.define('pointcast-keyboard', El);
  }

  // ---- plain HTML + listen mode -------------------------------------------

  document.addEventListener('pointerdown', function (event) {
    var el = event.target && event.target.closest && event.target.closest('[data-pointcast-keyboard-note]');
    if (!el) return;
    note(String(el.getAttribute('data-pointcast-keyboard-note')).split(/[\s,]+/), {
      app: el.getAttribute('data-app') || undefined,
      place: el.getAttribute('data-place') || undefined,
    });
  });

  if (data.listen === 'true') {
    document.addEventListener('keydown', function (e) {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!e.key || e.key.length !== 1) return; // letters, digits, punctuation, space; never Enter/Tab/arrows
      var t = e.target;
      if (t && t.type === 'password') return;
      enqueue([], 1);
    }, true);
  }

  addEventListener('pagehide', function () { flush(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush(true);
    else if (widgets.size || document.querySelector('[data-pointcast-keyboard-count]')) total();
  });

  function ready() {
    if (document.querySelector('[data-pointcast-keyboard-count]')) total();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();

  window.PointCastKeyboard = {
    note: note, play: play, keys: keys, total: total, tone: tone, textToNotes: textToNotes,
    flush: function () { flush(false); }, source: baseTag, endpoint: ENDPOINT,
  };
})();
