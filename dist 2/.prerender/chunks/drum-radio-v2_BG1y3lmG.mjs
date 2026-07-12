import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumRadioV2 = createComponent(($$result, $$props, $$slots) => {
  const title = "DRUM RADIO V2 — the dial · multi-station drum radio";
  const description = "A vintage-style multi-station radio for the drum hub. Tune the dial across four themed stations: All Rooms · Birthday · Instruments · Comms. Toggle auto-tune to let the radio pick. Every /api/sounds event becomes a synth hit.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/drum-radio-v2",
    name: "PointCast Drum Radio v2 · The Dial",
    url: "https://pointcast.xyz/drum-radio-v2",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    // ─── State ──────────────────────────────────────────────────
    var STATION_FILTERS = {
      all:   null, // null = no filter (everything)
      bd:    new Set(['birthday', 'cake-light', 'cake-blow', 'sign', 'pinata', 'pinata-burst']),
      inst:  new Set(['drum', 'orchestra', 'choir', 'choir-chord', 'lounge', 'theremin', 'bells', 'organ', 'strings', 'marimba', 'hang', 'tr808', 'harp', 'rhodes', 'symphony', 'button']),
      comms: new Set(['shout', 'applause', 'walkie', 'letter', 'pin', 'heart', 'graffiti', 'confessional', 'soft']),
    };
    // Per-station audio palette
    var STATION_AUDIO = {
      all:   { osc: 'triangle', filt: 1800, gain: 0.18, decay: 0.40 },
      bd:    { osc: 'sine',     filt: 2400, gain: 0.20, decay: 0.55 },
      inst:  { osc: 'sawtooth', filt: 1400, gain: 0.16, decay: 0.50 },
      comms: { osc: 'square',   filt: 1100, gain: 0.14, decay: 0.30 },
    };
    // Per-station base note (MIDI)
    var STATION_BASE = { all: 48, bd: 55, inst: 50, comms: 45 }; // C3, G3, D3, A2

    var view = {
      station: 'all',
      power: true,
      autoTune: false,
      volume: 0.6,
    };

    // ─── DOM ─────────────────────────────────────────────────────
    var main = document.getElementById('rd2-main');
    var nameEl = document.getElementById('rd2-station-name');
    var tagEl = document.getElementById('rd2-station-tag');
    var freqEl = document.getElementById('rd2-dial-freq');
    var needle = document.getElementById('rd2-dial-needle');
    var presets = Array.from(document.querySelectorAll('.rd2__preset'));
    var nowList = document.getElementById('rd2-now-list');
    var vuLeft = ['rd2-vu-l-1','rd2-vu-l-2','rd2-vu-l-3','rd2-vu-l-4','rd2-vu-l-5'].map(function (id) { return document.getElementById(id); });
    var vuRight = ['rd2-vu-r-1','rd2-vu-r-2','rd2-vu-r-3','rd2-vu-r-4','rd2-vu-r-5'].map(function (id) { return document.getElementById(id); });
    var autoTuneEl = document.getElementById('rd2-auto-tune');
    var powerEl = document.getElementById('rd2-power');
    var volumeEl = document.getElementById('rd2-volume');
    var volOut = document.getElementById('rd2-vol-out');

    // Needle angle per station
    var STATION_ANGLE = { all: -75, bd: -25, inst: 25, comms: 75 };

    function setStation(key, opts) {
      if (!STATION_FILTERS.hasOwnProperty(key)) return;
      view.station = key;
      main.dataset.station = key;
      var btn = presets.find(function (b) { return b.dataset.station === key; });
      presets.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('rd2__preset--active', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      if (btn) {
        var freq = btn.dataset.freq || '—';
        var name = btn.dataset.name || '—';
        var tag = btn.dataset.tag || '—';
        if (nameEl) nameEl.textContent = freq + ' · ' + name;
        if (tagEl) tagEl.textContent = tag;
        if (freqEl) freqEl.textContent = freq;
      }
      if (needle) needle.style.transform = 'translate(-50%, -100%) rotate(' + STATION_ANGLE[key] + 'deg)';
      // Audible "tune" click
      if (!opts || !opts.silent) tuneClick();
    }

    presets.forEach(function (b) {
      b.addEventListener('click', function () {
        // Manual click cancels auto-tune
        if (autoTuneEl && autoTuneEl.checked) autoTuneEl.checked = false;
        view.autoTune = false;
        setStation(b.dataset.station);
      });
    });

    if (powerEl) {
      powerEl.addEventListener('change', function () {
        view.power = !!powerEl.checked;
        main.dataset.power = view.power ? 'on' : 'off';
        if (!view.power) for (var i = 0; i < vuLeft.length; i++) {
          if (vuLeft[i]) vuLeft[i].style.height = '8%';
          if (vuRight[i]) vuRight[i].style.height = '8%';
        }
      });
    }
    if (volumeEl) {
      volumeEl.addEventListener('input', function () {
        view.volume = Number(volumeEl.value) / 100;
        if (volOut) volOut.textContent = String(volumeEl.value);
      });
    }
    if (autoTuneEl) {
      autoTuneEl.addEventListener('change', function () {
        view.autoTune = !!autoTuneEl.checked;
      });
    }

    // Auto-tune sweep
    var STATION_ORDER = ['all', 'bd', 'inst', 'comms'];
    setInterval(function () {
      if (!view.autoTune) return;
      var idx = STATION_ORDER.indexOf(view.station);
      var next = STATION_ORDER[(idx + 1) % STATION_ORDER.length];
      setStation(next);
    }, 30000);

    // ─── Web Audio ──────────────────────────────────────────────
    var actx = null;
    var masterGain = null;
    function ensureAudio() {
      if (actx) return actx;
      try {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = actx.createGain();
        masterGain.gain.value = view.volume;
        masterGain.connect(actx.destination);
      } catch (e) { actx = null; }
      return actx;
    }
    document.body.addEventListener('pointerdown', ensureAudio, { once: true });
    document.body.addEventListener('keydown', ensureAudio, { once: true });

    function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    function playStationHit(velocity) {
      if (!view.power) return;
      var ctx = ensureAudio();
      if (!ctx) return;
      // Tune master to current volume
      if (masterGain) masterGain.gain.setValueAtTime(view.volume, ctx.currentTime);
      var pal = STATION_AUDIO[view.station] || STATION_AUDIO.all;
      var base = STATION_BASE[view.station] || 48;
      // A pleasing scale degree
      var DEGREES = [0, 4, 7, 12, 14, 16, 19];
      var degree = DEGREES[Math.floor(Math.random() * DEGREES.length)];
      var freq = midiToHz(base + degree);
      var t0 = ctx.currentTime;

      var osc = ctx.createOscillator();
      osc.type = pal.osc;
      osc.frequency.setValueAtTime(freq, t0);
      var lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(pal.filt * 1.6, t0);
      lpf.frequency.exponentialRampToValueAtTime(pal.filt * 0.5, t0 + pal.decay);
      var g = ctx.createGain();
      var amp = pal.gain * (velocity || 1);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(amp, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + pal.decay);
      osc.connect(lpf).connect(g).connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + pal.decay + 0.05);
    }

    // Tune click — quick low blip when changing stations
    function tuneClick() {
      if (!view.power) return;
      var ctx = ensureAudio();
      if (!ctx) return;
      var t0 = ctx.currentTime;
      var osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, t0);
      osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.08);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.07, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      osc.connect(g).connect(masterGain);
      osc.start(t0); osc.stop(t0 + 0.13);
    }

    // ─── VU meters ──────────────────────────────────────────────
    var vuLevel = 0;
    function pulseVU(amount) {
      vuLevel = Math.max(vuLevel, 0.4 + Math.random() * 0.6 * (amount || 1));
    }
    function tickVU() {
      vuLevel *= 0.86;
      if (vuLevel < 0.06) vuLevel = 0.06;
      var cap = view.power ? 100 : 8;
      var base = vuLevel * cap;
      for (var i = 0; i < 5; i++) {
        var jitter = (Math.random() - 0.5) * 8;
        var v = Math.max(8, Math.min(100, base + jitter - i * 5));
        if (vuLeft[i]) vuLeft[i].style.height = v + '%';
        if (vuRight[i]) vuRight[i].style.height = (Math.max(8, Math.min(100, base + (Math.random() - 0.5) * 8 - i * 5))) + '%';
      }
    }
    setInterval(tickVU, 80);

    // ─── Now playing ticker ─────────────────────────────────────
    var nowSeen = {};
    function pushNow(e) {
      var key = (e.t || 0) + ':' + (e.pid || '') + ':' + (e.type || '');
      if (nowSeen[key]) return;
      nowSeen[key] = 1;
      var li = document.createElement('li');
      li.className = 'rd2__now-row mono';
      var t = new Date(e.t || Date.now());
      var time = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + ':' + String(t.getSeconds()).padStart(2, '0');
      li.innerHTML =
        '<span class="rd2__now-time">' + time + '</span>' +
        '<span class="rd2__now-type">[' + (e.type || 'event') + ']</span>' +
        '<span class="rd2__now-pid">pid ' + ((e.pid || '').slice(0, 8) || '—') + '</span>';
      // Clear empty placeholder
      var empty = nowList.querySelector('.rd2__now-empty');
      if (empty) empty.remove();
      nowList.prepend(li);
      // Cap to last 8
      var rows = nowList.querySelectorAll('.rd2__now-row');
      for (var i = 8; i < rows.length; i++) rows[i].remove();
    }

    // ─── Poll /api/sounds, filter by station, play ──────────────
    var lastTs = Date.now() - 8000;
    function poll() {
      fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !Array.isArray(d.events)) return;
          if (d.events.length === 0) return;
          lastTs = d.now || Date.now();
          var filt = STATION_FILTERS[view.station];
          d.events.forEach(function (e) {
            // Skip events that don't match the current station's filter
            if (filt && !filt.has(e.type)) return;
            playStationHit(0.7 + Math.random() * 0.3);
            pulseVU(0.9);
            pushNow(e);
          });
        }).catch(function () {});
    }
    setInterval(poll, 1500);
    poll();

    // Initial render
    setStation('all', { silent: true });
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum.png", "jsonLd": jsonLd, "data-astro-cid-f6pvaxk3": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="rd2" id="rd2-main" data-station="all" data-astro-cid-f6pvaxk3> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "radio", "data-astro-cid-f6pvaxk3": true })} <header class="rd2__head" data-astro-cid-f6pvaxk3> <p class="rd2__kicker mono" data-astro-cid-f6pvaxk3>★ DRUM HUB · RADIO V2 · THE DIAL · 4 STATIONS ★</p> <h1 class="rd2__title" data-astro-cid-f6pvaxk3>drum <em data-astro-cid-f6pvaxk3>radio</em></h1> <p class="rd2__strap mono" data-astro-cid-f6pvaxk3>tune the dial · let the room play to you · auto-tune for the long haul</p> </header> <section class="rd2__cabinet" aria-label="Radio cabinet" data-astro-cid-f6pvaxk3>  <div class="rd2__brass" data-astro-cid-f6pvaxk3> <span class="rd2__brass-on-air" data-astro-cid-f6pvaxk3> <span class="rd2__brass-dot" aria-hidden="true" data-astro-cid-f6pvaxk3></span>
ON AIR
</span> <span class="rd2__brass-station mono" id="rd2-station-name" data-astro-cid-f6pvaxk3>96.1 · ALL ROOMS</span> <span class="rd2__brass-tag mono" id="rd2-station-tag" data-astro-cid-f6pvaxk3>— everything from the hub —</span> </div>  <div class="rd2__dial-wrap" aria-label="Tuning dial" data-astro-cid-f6pvaxk3> <div class="rd2__dial" id="rd2-dial" data-astro-cid-f6pvaxk3> <div class="rd2__dial-face" data-astro-cid-f6pvaxk3>  <span class="rd2__dial-tick" style="--a: -90deg" data-f="96.1" data-astro-cid-f6pvaxk3>96.1</span> <span class="rd2__dial-tick" style="--a: -30deg" data-f="100.5" data-astro-cid-f6pvaxk3>100.5</span> <span class="rd2__dial-tick" style="--a: 30deg" data-f="102.3" data-astro-cid-f6pvaxk3>102.3</span> <span class="rd2__dial-tick" style="--a: 90deg" data-f="104.7" data-astro-cid-f6pvaxk3>104.7</span>  <span class="rd2__dial-hub" aria-hidden="true" data-astro-cid-f6pvaxk3> <span class="rd2__dial-hub-glyph mono" id="rd2-dial-freq" data-astro-cid-f6pvaxk3>96.1</span> <span class="rd2__dial-hub-mhz mono" data-astro-cid-f6pvaxk3>MHz</span> </span>  <span class="rd2__dial-needle" id="rd2-dial-needle" aria-hidden="true" data-astro-cid-f6pvaxk3></span> </div> </div>  <div class="rd2__vu rd2__vu--l" aria-hidden="true" data-astro-cid-f6pvaxk3> <span class="rd2__vu-bar" id="rd2-vu-l-1" data-astro-cid-f6pvaxk3></span> <span class="rd2__vu-bar" id="rd2-vu-l-2" data-astro-cid-f6pvaxk3></span> <span class="rd2__vu-bar" id="rd2-vu-l-3" data-astro-cid-f6pvaxk3></span> <span class="rd2__vu-bar" id="rd2-vu-l-4" data-astro-cid-f6pvaxk3></span> <span class="rd2__vu-bar" id="rd2-vu-l-5" data-astro-cid-f6pvaxk3></span> </div> <div class="rd2__vu rd2__vu--r" aria-hidden="true" data-astro-cid-f6pvaxk3> <span class="rd2__vu-bar" id="rd2-vu-r-1" data-astro-cid-f6pvaxk3></span> <span class="rd2__vu-bar" id="rd2-vu-r-2" data-astro-cid-f6pvaxk3></span> <span class="rd2__vu-bar" id="rd2-vu-r-3" data-astro-cid-f6pvaxk3></span> <span class="rd2__vu-bar" id="rd2-vu-r-4" data-astro-cid-f6pvaxk3></span> <span class="rd2__vu-bar" id="rd2-vu-r-5" data-astro-cid-f6pvaxk3></span> </div> </div>  <div class="rd2__presets" role="radiogroup" aria-label="Station presets" data-astro-cid-f6pvaxk3> <button type="button" class="rd2__preset rd2__preset--active" role="radio" aria-checked="true" data-station="all" data-freq="96.1" data-name="ALL ROOMS" data-tag="— everything from the hub —" data-astro-cid-f6pvaxk3> <span class="rd2__preset-num mono" data-astro-cid-f6pvaxk3>96.1</span> <span class="rd2__preset-label" data-astro-cid-f6pvaxk3>all rooms</span> </button> <button type="button" class="rd2__preset" role="radio" aria-checked="false" data-station="bd" data-freq="100.5" data-name="BIRTHDAY" data-tag="— cakes, cards, piñatas, candles —" data-astro-cid-f6pvaxk3> <span class="rd2__preset-num mono" data-astro-cid-f6pvaxk3>100.5</span> <span class="rd2__preset-label" data-astro-cid-f6pvaxk3>birthday</span> </button> <button type="button" class="rd2__preset" role="radio" aria-checked="false" data-station="inst" data-freq="102.3" data-name="INSTRUMENTS" data-tag="— orchestra, choir, hang, organ —" data-astro-cid-f6pvaxk3> <span class="rd2__preset-num mono" data-astro-cid-f6pvaxk3>102.3</span> <span class="rd2__preset-label" data-astro-cid-f6pvaxk3>instruments</span> </button> <button type="button" class="rd2__preset" role="radio" aria-checked="false" data-station="comms" data-freq="104.7" data-name="COMMS" data-tag="— shouts, applause, letters, pins —" data-astro-cid-f6pvaxk3> <span class="rd2__preset-num mono" data-astro-cid-f6pvaxk3>104.7</span> <span class="rd2__preset-label" data-astro-cid-f6pvaxk3>comms</span> </button> </div>  <div class="rd2__controls" data-astro-cid-f6pvaxk3> <label class="rd2__toggle" data-astro-cid-f6pvaxk3> <input type="checkbox" id="rd2-auto-tune" data-astro-cid-f6pvaxk3> <span class="rd2__toggle-track" aria-hidden="true" data-astro-cid-f6pvaxk3><span class="rd2__toggle-thumb" data-astro-cid-f6pvaxk3></span></span> <span class="rd2__toggle-label mono" data-astro-cid-f6pvaxk3>auto tune · 30s sweep</span> </label> <label class="rd2__vol" data-astro-cid-f6pvaxk3> <span class="rd2__vol-label mono" data-astro-cid-f6pvaxk3>vol</span> <input type="range" id="rd2-volume" min="0" max="100" value="60" data-astro-cid-f6pvaxk3> <span class="rd2__vol-out mono" id="rd2-vol-out" data-astro-cid-f6pvaxk3>60</span> </label> <label class="rd2__toggle" data-astro-cid-f6pvaxk3> <input type="checkbox" id="rd2-power" checked data-astro-cid-f6pvaxk3> <span class="rd2__toggle-track" aria-hidden="true" data-astro-cid-f6pvaxk3><span class="rd2__toggle-thumb" data-astro-cid-f6pvaxk3></span></span> <span class="rd2__toggle-label mono" data-astro-cid-f6pvaxk3>power · on air</span> </label> </div>  <div class="rd2__now" aria-label="Now playing" data-astro-cid-f6pvaxk3> <p class="rd2__now-label mono" data-astro-cid-f6pvaxk3>▌ NOW PLAYING</p> <ul class="rd2__now-list" id="rd2-now-list" aria-live="polite" data-astro-cid-f6pvaxk3> <li class="rd2__now-empty mono" data-astro-cid-f6pvaxk3>— stream open · waiting for the first event —</li> </ul> </div> </section> <footer class="rd2__foot" data-astro-cid-f6pvaxk3> <p class="mono" data-astro-cid-f6pvaxk3>
DRUM RADIO V2 · v0.1 · 2026-04-30 · pointcast.xyz/drum-radio-v2 · sister to <a href="/drum-radio" data-astro-cid-f6pvaxk3>96.1 v1</a> · part of the <a href="/drum-press" data-astro-cid-f6pvaxk3>drum press</a> </p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-radio-v2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-radio-v2.astro";
const $$url = "/drum-radio-v2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumRadioV2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
