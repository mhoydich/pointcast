/*!
 * PointCast drum — add the drum to anything.
 *
 *   <script src="https://pointcast.xyz/drum.js" data-app="my-site" async></script>
 *   <button data-pointcast-drum>drum</button>
 *
 * Every beat lands on the one PointCast drum counter (pointcast.xyz/drum-signal),
 * tagged with where it came from. Options on the <script> tag:
 *
 *   data-app     name for your surface (defaults to your hostname)
 *   data-kind    embed | standalone | artifact | agent | other  (default: inferred)
 *   data-place   optional coarse place slug, e.g. "el-segundo" or "court-3"
 *   data-button  "true" to float a small drum button in the corner
 *   data-sound   "false" to stay silent
 *
 * JS:  PointCastDrum.beat(n?)   · PointCastDrum.total()   · listen for the
 *      "pointcast:drum" event on window: detail = { globalTotal, beats, source }
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
  var tag = { app: data.app || location.hostname || 'unknown', kind: data.kind || undefined, place: data.place || undefined };
  var sound = data.sound !== 'false';

  var pending = 0;
  var timer = null;
  var lastTotal = null;
  var ac = null;

  function thump() {
    if (!sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      var t = ac.currentTime;
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(48, t + 0.18);
      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch (e) { /* audio is a nicety */ }
  }

  function payload(beats) {
    return JSON.stringify({ beats: beats, app: tag.app, kind: tag.kind, place: tag.place });
  }

  function flush(useBeacon) {
    clearTimeout(timer);
    timer = null;
    while (pending > 0) {
      var beats = Math.min(100, pending);
      pending -= beats;
      if (useBeacon && navigator.sendBeacon) {
        // text/plain keeps sendBeacon a simple (no-preflight) request.
        navigator.sendBeacon(ENDPOINT, new Blob([payload(beats)], { type: 'text/plain' }));
        continue;
      }
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload(beats), keepalive: true })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.ok) return;
          lastTotal = res.globalTotal;
          window.dispatchEvent(new CustomEvent('pointcast:drum', { detail: { globalTotal: res.globalTotal, beats: beats, source: res.source } }));
          paint();
        })
        .catch(function () { /* offline: the beat is lost, the page is fine */ });
    }
  }

  function beat(n) {
    var count = Math.max(1, Math.min(100, Math.floor(Number(n) || 1)));
    pending += count;
    thump();
    if (lastTotal !== null) { lastTotal += count; paint(); }
    if (pending >= 20) flush(false);
    else if (!timer) timer = setTimeout(function () { flush(false); }, 1500);
  }

  function total() {
    return fetch(ORIGIN + '/api/drum').then(function (r) { return r.json(); }).then(function (res) {
      if (res && typeof res.globalTotal === 'number') { lastTotal = res.globalTotal; paint(); }
      return lastTotal;
    });
  }

  function paint() {
    if (lastTotal === null) return;
    var nodes = document.querySelectorAll('[data-pointcast-drum-count]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = lastTotal.toLocaleString();
    if (floating) floating.title = lastTotal.toLocaleString() + ' beats on the PointCast drum';
  }

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
    beat(Number(el.getAttribute('data-beats')) || 1);
    if (el.animate) el.animate([{ transform: 'scale(0.9)' }, { transform: 'scale(1)' }], { duration: 120 });
  });
  addEventListener('pagehide', function () { flush(true); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });

  function ready() {
    if (data.button === 'true') floatButton();
    if (document.querySelector('[data-pointcast-drum-count]') || floating) total();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();

  window.PointCastDrum = { beat: beat, total: total, flush: function () { flush(false); }, source: tag };
})();
