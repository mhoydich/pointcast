/*!
 * PointCast drum — add the drum to anything.
 *
 *   <script src="https://pointcast.xyz/drum.js" data-app="my-site" async></script>
 *   <pointcast-drum look="badge"></pointcast-drum>
 *
 * Build one at pointcast.xyz/drum-kit. Every beat lands on the one PointCast
 * drum counter (pointcast.xyz/drum-signal), tagged with where it came from.
 *
 * <script> options
 *   data-app     name for your surface (defaults to your hostname)
 *   data-kind    embed | standalone | artifact | agent | other  (default: inferred)
 *   data-place   optional coarse place slug, e.g. "el-segundo" or "court-3"
 *   data-button  "true" to float a round drum in the corner
 *   data-sound   "false" to stay silent
 *
 * <pointcast-drum> attributes (each overrides the script tag for that button)
 *   look    round | pill | badge | noun | mini          (default round)
 *   size    px for round / noun                          (default 96)
 *   noun    Nouns seed 0-1199 for look="noun"            (default 253)
 *   label   text for pill / mini                         (default "drum")
 *   count   show the live global count ("false" hides it)
 *   app, place, kind, beats, sound
 *
 * Plain HTML also works: any element with data-pointcast-drum is a drum, and
 * any element with data-pointcast-drum-count shows the live total.
 *
 * JS:  PointCastDrum.beat(n?, tag?) · PointCastDrum.total() · the
 *      "pointcast:drum" window event: detail = { globalTotal, beats, source,
 *      memberTotal } (memberTotal only on pointcast.xyz while signed in)
 *
 * No cookies, no fingerprinting: beats are batched and sent as plain counts.
 */
(function () {
  'use strict';
  if (window.PointCastDrum) return;

  var script = document.currentScript;
  var ORIGIN = script && script.src ? new URL(script.src).origin : 'https://pointcast.xyz';
  var ENDPOINT = ORIGIN + '/api/drum/signal';
  var data = (script && script.dataset) || {};
  var baseTag = { app: data.app || location.hostname || 'unknown', kind: data.kind || undefined, place: data.place || undefined };
  var soundOn = data.sound !== 'false';

  var queues = {}; // tag key -> { tag, beats }
  var timer = null;
  var lastTotal = null;
  var ac = null;
  var buttons = new Set();

  function thump(pitch) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      var t = ac.currentTime;
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      var f = pitch || 150;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f / 3.1, t + 0.18);
      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch (e) { /* audio is a nicety */ }
  }

  function mergeTag(tag) {
    tag = tag || {};
    return { app: tag.app || baseTag.app, kind: tag.kind || baseTag.kind, place: tag.place || baseTag.place };
  }

  function send(tag, beats, useBeacon) {
    var body = JSON.stringify({ beats: beats, app: tag.app, kind: tag.kind, place: tag.place });
    if (useBeacon && navigator.sendBeacon) {
      // text/plain keeps sendBeacon a simple (no-preflight) request.
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
      return;
    }
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: body, keepalive: true })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) return;
        lastTotal = Math.max(lastTotal || 0, res.globalTotal);
        window.dispatchEvent(new CustomEvent('pointcast:drum', { detail: { globalTotal: res.globalTotal, beats: beats, source: res.source, memberTotal: res.memberTotal } }));
        paint();
      })
      .catch(function () { /* offline: the beat is lost, the page is fine */ });
  }

  function flush(useBeacon) {
    clearTimeout(timer);
    timer = null;
    Object.keys(queues).forEach(function (key) {
      var q = queues[key];
      while (q.beats > 0) {
        var n = Math.min(100, q.beats);
        q.beats -= n;
        send(q.tag, n, useBeacon);
      }
      delete queues[key];
    });
  }

  function beat(n, tag, opts) {
    var count = Math.max(1, Math.min(100, Math.floor(Number(n) || 1)));
    var t = mergeTag(tag);
    var key = [t.kind || '', t.app, t.place || ''].join('|');
    queues[key] = queues[key] || { tag: t, beats: 0 };
    queues[key].beats += count;
    var silent = (opts && opts.sound === false) || !soundOn;
    if (!silent) thump(opts && opts.pitch);
    if (lastTotal !== null) { lastTotal += count; paint(); }
    var queued = 0;
    Object.keys(queues).forEach(function (k) { queued += queues[k].beats; });
    if (queued >= 20) flush(false);
    else if (!timer) timer = setTimeout(function () { flush(false); }, 1500);
  }

  var totalPromise = null;
  function total() {
    totalPromise = totalPromise || fetch(ORIGIN + '/api/drum')
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
    var nodes = document.querySelectorAll('[data-pointcast-drum-count]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
    buttons.forEach(function (b) { b._paint(text); });
    if (floating) floating.title = text + ' beats on the PointCast drum';
  }

  // ---- <pointcast-drum> ---------------------------------------------------

  var CSS = [
    ':host{display:inline-block;vertical-align:middle;line-height:0;-webkit-tap-highlight-color:transparent}',
    'button{all:unset;box-sizing:border-box;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',
    'button:focus-visible{outline:3px solid #185fa5;outline-offset:3px}',
    'button.hit{transform:translateY(2px) scale(.96)}',
    '.round{display:grid;place-items:center;border-radius:50%;border:4px solid #111;color:#fff;font-weight:700;',
    'background:radial-gradient(circle at 40% 35%,#f06a4f,#e0452b 60%,#b8321c);box-shadow:0 5px 0 #111;transition:transform .05s}',
    '.round .n{font-size:.2em;line-height:1;margin-top:-.2em;font-variant-numeric:tabular-nums;opacity:.9}',
    '.round .i{font-size:.42em;line-height:1}',
    '.pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px 8px 10px;border:2px solid #111;border-radius:999px;',
    'background:#fffdf9;color:#111;font-size:14px;line-height:1;font-weight:600;box-shadow:0 3px 0 #111;transition:transform .05s}',
    '.pill .dot{width:22px;height:22px;border-radius:50%;background:#e0452b;border:2px solid #111;display:grid;place-items:center;color:#fff;font-size:12px}',
    '.pill .n{font-variant-numeric:tabular-nums;color:#6b6a66;font-weight:500}',
    '.badge{display:flex;width:88px;height:31px;border:1px solid #000;background:#000;font:bold 9px/1 Verdana,Tahoma,sans-serif;image-rendering:pixelated;transition:transform .05s}',
    '.badge .l{width:31px;display:grid;place-items:center;background:#e0452b;color:#ffd400;font-size:15px;border-right:1px solid #000}',
    '.badge .r{flex:1;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:0 4px;background:linear-gradient(#1b1b6b,#0a0a2e);color:#fff;letter-spacing:.02em}',
    '.badge .r b{color:#8aeac0;font-weight:bold}',
    '.badge .r span{color:#ffd400;font-variant-numeric:tabular-nums}',
    '.noun{display:grid;place-items:center;position:relative;border-radius:18%;border:4px solid #111;background:#d5d7e1;box-shadow:0 5px 0 #111;overflow:hidden;transition:transform .05s}',
    '.noun img{width:100%;height:100%;image-rendering:pixelated;display:block}',
    '.noun .n{position:absolute;left:0;right:0;bottom:0;padding:3px 0;background:rgba(17,17,17,.78);color:#fff;font-size:11px;line-height:1;text-align:center;font-variant-numeric:tabular-nums}',
    '.mini{display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:4px;color:#e0452b;font-size:inherit;line-height:1.2;font-weight:600}',
    '.mini:hover{background:rgba(224,69,43,.1)}',
    '.mini .n{color:#6b6a66;font-weight:400;font-variant-numeric:tabular-nums}',
  ].join('');

  function attr(el, name, fallback) {
    var v = el.getAttribute(name);
    return v === null || v === '' ? fallback : v;
  }

  if (window.customElements && !customElements.get('pointcast-drum')) {
    var PointCastDrumElement = function () {
      return Reflect.construct(HTMLElement, [], PointCastDrumElement);
    };
    PointCastDrumElement.prototype = Object.create(HTMLElement.prototype);
    PointCastDrumElement.prototype.constructor = PointCastDrumElement;
    Object.setPrototypeOf(PointCastDrumElement, HTMLElement);

    PointCastDrumElement.prototype.connectedCallback = function () {
      if (this._root) { buttons.add(this); return; }
      var self = this;
      var look = attr(this, 'look', 'round');
      var showCount = attr(this, 'count', 'true') !== 'false';
      var root = this._root = this.attachShadow ? this.attachShadow({ mode: 'open' }) : this;
      var style = document.createElement('style');
      style.textContent = CSS;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = look;
      btn.setAttribute('aria-label', 'Beat the PointCast drum');
      var countEl = null;

      if (look === 'pill') {
        btn.innerHTML = '<span class="dot">♪</span><span class="t"></span><span class="n"></span>';
        btn.querySelector('.t').textContent = attr(this, 'label', 'drum');
        countEl = btn.querySelector('.n');
      } else if (look === 'badge') {
        btn.innerHTML = '<span class="l">♪</span><span class="r"><b>POINTCAST</b><span class="n">DRUM</span></span>';
        countEl = btn.querySelector('.n');
      } else if (look === 'noun') {
        var size = Math.max(40, Math.min(320, Number(attr(this, 'size', 96)) || 96));
        var seed = Math.max(0, Math.min(1199, Math.floor(Number(attr(this, 'noun', 253)) || 0)));
        btn.style.width = btn.style.height = size + 'px';
        var img = document.createElement('img');
        img.alt = '';
        img.src = 'https://noun.pics/' + seed + '.svg';
        img.draggable = false;
        btn.appendChild(img);
        countEl = document.createElement('span');
        countEl.className = 'n';
        btn.appendChild(countEl);
      } else if (look === 'mini') {
        btn.innerHTML = '<span>♪</span><span class="t"></span><span class="n"></span>';
        btn.querySelector('.t').textContent = attr(this, 'label', 'drum');
        countEl = btn.querySelector('.n');
      } else {
        var px = Math.max(40, Math.min(320, Number(attr(this, 'size', 96)) || 96));
        btn.style.width = btn.style.height = px + 'px';
        btn.style.fontSize = px + 'px';
        btn.innerHTML = '<span class="i">♪</span>';
        countEl = document.createElement('span');
        countEl.className = 'n';
        btn.appendChild(countEl);
      }
      if (!showCount && countEl) { countEl.remove(); countEl = null; }

      this._paint = function (text) {
        if (!countEl) return;
        countEl.textContent = look === 'badge' ? text : look === 'pill' || look === 'mini' ? '· ' + text : text;
        btn.title = text + ' beats on the PointCast drum';
      };

      btn.addEventListener('pointerdown', function (event) {
        if (event.button && event.button !== 0) return;
        event.preventDefault();
        self._hit();
      });
      btn.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); self._hit(); }
      });
      this._hit = function () {
        beat(Number(attr(self, 'beats', 1)) || 1, {
          app: self.getAttribute('app') || undefined,
          kind: self.getAttribute('kind') || undefined,
          place: self.getAttribute('place') || undefined,
        }, { sound: attr(self, 'sound', 'true') !== 'false', pitch: look === 'mini' ? 220 : look === 'badge' ? 180 : 150 });
        btn.classList.add('hit');
        setTimeout(function () { btn.classList.remove('hit'); }, 90);
      };

      root.appendChild(style);
      root.appendChild(btn);
      buttons.add(this);
      if (lastTotal !== null) this._paint(lastTotal.toLocaleString('en-US'));
      else if (countEl) total();
    };
    PointCastDrumElement.prototype.disconnectedCallback = function () { buttons.delete(this); };
    customElements.define('pointcast-drum', PointCastDrumElement);
  }

  // ---- plain-HTML drums + the floating button -----------------------------

  var floating = null;
  function floatButton() {
    floating = document.createElement('button');
    floating.type = 'button';
    floating.setAttribute('data-pointcast-drum', '');
    floating.setAttribute('aria-label', 'Beat the PointCast drum');
    floating.textContent = '♪';
    floating.style.cssText = [
      'position:fixed', 'right:16px', 'bottom:16px', 'z-index:2147483000', 'width:52px', 'height:52px',
      'border-radius:50%', 'border:3px solid #111', 'background:#e0452b', 'color:#fff', 'font:700 22px/1 system-ui,sans-serif',
      'box-shadow:0 3px 0 #111', 'cursor:pointer', 'touch-action:manipulation',
    ].join(';');
    document.body.appendChild(floating);
  }

  document.addEventListener('click', function (event) {
    var el = event.target && event.target.closest && event.target.closest('[data-pointcast-drum]');
    if (!el) return;
    beat(Number(el.getAttribute('data-beats')) || 1, {
      app: el.getAttribute('data-app') || undefined,
      place: el.getAttribute('data-place') || undefined,
    });
    if (el.animate) el.animate([{ transform: 'scale(0.9)' }, { transform: 'scale(1)' }], { duration: 120 });
  });
  addEventListener('pagehide', function () { flush(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush(true);
    else if (buttons.size || document.querySelector('[data-pointcast-drum-count]')) total();
  });

  function ready() {
    if (data.button === 'true') floatButton();
    if (document.querySelector('[data-pointcast-drum-count]') || floating) total();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();

  window.PointCastDrum = { beat: beat, total: total, flush: function () { flush(false); }, source: baseTag };
})();
