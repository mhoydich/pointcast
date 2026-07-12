import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { $ as $$RoomPresenceChip } from './RoomPresenceChip_Dur7KbDI.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumRelay = createComponent(($$result, $$props, $$slots) => {
  const title = "DRUM RELAY — async-social rhythm chain";
  const description = "A community rhythm chain. Tap 4 beats; they get appended to the chain. The next visitor extends with 4 more. Listen end-to-end. Each link tagged with a Noun. A composition that grows by visit, not by minute.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/drum-relay",
    name: "PointCast Drum Relay · Async Rhythm Chain",
    url: "https://pointcast.xyz/drum-relay",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    // ─── Identity ───────────────────────────────────────────────
    function getSid() {
      try {
        var s = localStorage.getItem('pc:sid');
        if (s) return s;
        s = (Math.random().toString(36).slice(2) + Date.now().toString(36));
        localStorage.setItem('pc:sid', s);
        return s;
      } catch (e) { return 'anon-' + Date.now(); }
    }
    function nounIdFromString(s) {
      var h = 0;
      for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
      return Math.abs(h) % 1200;
    }
    var sid = getSid();
    var myNoun = nounIdFromString(sid);

    var nounEl = document.getElementById('dr-turn-noun');
    if (nounEl) {
      nounEl.src = 'https://noun.pics/' + myNoun + '.svg';
      nounEl.alt = 'Your Noun ' + myNoun;
      nounEl.style.imageRendering = 'pixelated';
    }

    // ─── Web Audio ──────────────────────────────────────────────
    var actx = null;
    function ensureAudio() {
      if (actx) return actx;
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = null; }
      return actx;
    }
    // Each link plays at a slightly different pitch derived from its
    // nounId so the chain has melodic variation. Same noun → same pitch.
    function pitchForNoun(nounId) {
      var DEGREES = [0, 3, 5, 7, 10, 12, 14, 17];
      var deg = DEGREES[nounId % DEGREES.length];
      return 220 * Math.pow(2, deg / 12);
    }
    function playNote(freq, atTime, dur) {
      var ctx = ensureAudio();
      if (!ctx) return;
      var t = atTime || ctx.currentTime;
      var d = dur || 0.18;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + d);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      osc.connect(g).connect(ctx.destination);
      osc.start(t); osc.stop(t + d + 0.05);
    }

    // ─── 4-beat capture ─────────────────────────────────────────
    var capture = []; // ms-since-first-tap
    var captureStart = 0;
    var statusEl = document.getElementById('dr-turn-status');
    var countEl = document.getElementById('dr-pad-count');
    var submitBtn = document.getElementById('dr-submit');
    var resetBtn = document.getElementById('dr-reset');
    var submitStatusEl = document.getElementById('dr-submit-status');

    function updateCaptureUI() {
      countEl.textContent = String(capture.length);
      if (capture.length === 0) {
        statusEl.textContent = '— ready · 0 / 4 beats —';
        submitBtn.disabled = true;
      } else if (capture.length < 4) {
        statusEl.textContent = '… ' + capture.length + ' / 4 · keep tapping';
        submitBtn.disabled = true;
      } else {
        var intervals = [];
        for (var i = 1; i < capture.length; i++) intervals.push(capture[i] - capture[i - 1]);
        intervals.sort(function (a, b) { return a - b; });
        var median = intervals[Math.floor(intervals.length / 2)];
        var bpm = median > 0 ? Math.round(60000 / median) : 0;
        statusEl.textContent = '✓ 4 / 4 · ' + (bpm ? bpm + ' BPM · ' : '') + 'tap submit when ready';
        submitBtn.disabled = false;
      }
    }
    function captureTap() {
      if (capture.length >= 4) return;
      ensureAudio();
      var now = performance.now();
      if (capture.length === 0) captureStart = now;
      var delta = Math.round(now - captureStart);
      capture.push(delta);
      playNote(pitchForNoun(myNoun));
      try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
      var pad = document.getElementById('dr-pad');
      if (pad) { pad.classList.remove('dr__pad--hit'); void pad.offsetWidth; pad.classList.add('dr__pad--hit'); }
      updateCaptureUI();
    }
    function resetCapture() {
      capture = [];
      captureStart = 0;
      submitStatusEl.textContent = ' ';
      updateCaptureUI();
    }

    document.getElementById('dr-pad').addEventListener('mousedown', function (e) { captureTap(); e.preventDefault(); });
    document.getElementById('dr-pad').addEventListener('touchstart', function (e) { captureTap(); e.preventDefault(); }, { passive: false });

    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      var ae = document.activeElement;
      var tag = ae && ae.tagName ? ae.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        captureTap();
        e.preventDefault();
      }
    });

    resetBtn.addEventListener('click', resetCapture);

    submitBtn.addEventListener('click', function () {
      if (capture.length !== 4) return;
      submitBtn.disabled = true;
      submitStatusEl.textContent = '… sending …';
      fetch('/api/drum-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beats: capture, sessionId: sid, nounId: myNoun }),
      })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          var d = res.body;
          if (res.status === 200 && d && d.ok) {
            submitStatusEl.textContent = '✓ added · the chain is now ' + (d.count || '?') + ' links long';
            capture = [];
            updateCaptureUI();
            loadChain();
          } else if (res.status === 429 && d && d.retryAfterSec) {
            submitStatusEl.textContent = '⏳ wait ' + d.retryAfterSec + 's · only one link per visitor every 30s';
            submitBtn.disabled = false;
          } else {
            submitStatusEl.textContent = '✗ ' + (d && d.reason ? d.reason : 'submit failed');
            submitBtn.disabled = false;
          }
        })
        .catch(function () {
          submitStatusEl.textContent = '✗ offline';
          submitBtn.disabled = false;
        });
    });

    // ─── Render the chain ───────────────────────────────────────
    var chainListEl = document.getElementById('dr-chain-list');
    var chainCountEl = document.getElementById('dr-chain-count');
    var chainData = [];
    function renderChain(chain) {
      chainData = chain;
      chainCountEl.textContent = String(chain.length);
      if (!chain.length) {
        chainListEl.innerHTML = '<li class="dr__chain-empty mono">— no links yet · be the first to tap four —</li>';
        return;
      }
      // Show last 24 links, newest on the right
      var visible = chain.slice(-24);
      chainListEl.innerHTML = visible.map(function (link, idx) {
        var pos = chain.length - visible.length + idx + 1;
        var bpm = link.bpm || 0;
        // Beats viz — 4 dots positioned by their relative time within the link
        var beats = Array.isArray(link.beats) ? link.beats : [0, 0, 0, 0];
        var span = beats[beats.length - 1] || 1;
        var dots = beats.map(function (b) {
          var x = span > 0 ? (b / span) * 100 : 0;
          return '<span class="dr__beat-dot" style="left: ' + x + '%"></span>';
        }).join('');
        // Time "since" formatter
        var ago = ((Date.now() - link.t) / 1000) | 0;
        var agoStr = ago < 60 ? ago + 's ago' :
                     ago < 3600 ? Math.floor(ago / 60) + 'm ago' :
                     ago < 86400 ? Math.floor(ago / 3600) + 'h ago' :
                     Math.floor(ago / 86400) + 'd ago';
        return '<li class="dr__link" data-idx="' + (chain.length - visible.length + idx) + '">' +
               '<span class="dr__link-pos mono">№ ' + String(pos).padStart(3, '0') + '</span>' +
               '<img class="dr__link-noun" src="https://noun.pics/' + (link.nounId | 0) + '.svg" ' +
               'alt="" width="44" height="44" loading="lazy" />' +
               '<span class="dr__link-bpm mono">' + (bpm || '—') + ' bpm</span>' +
               '<span class="dr__link-beats" aria-hidden="true">' + dots + '</span>' +
               '<span class="dr__link-ago mono">' + agoStr + '</span>' +
               '</li>';
      }).join('');
    }

    function loadChain() {
      fetch('/api/drum-relay', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !Array.isArray(d.chain)) return;
          renderChain(d.chain);
        }).catch(function () {});
    }
    loadChain();
    // Refresh every 12s so new links from other visitors show up
    setInterval(loadChain, 12_000);

    // Click a chain link to play its 4 beats individually
    chainListEl.addEventListener('click', function (e) {
      var li = e.target.closest && e.target.closest('.dr__link');
      if (!li) return;
      var idx = Number(li.dataset.idx);
      if (!chainData[idx]) return;
      var link = chainData[idx];
      var ctx = ensureAudio();
      if (!ctx) return;
      var t0 = ctx.currentTime + 0.05;
      var freq = pitchForNoun(link.nounId | 0);
      var beats = link.beats || [];
      beats.forEach(function (b) {
        playNote(freq, t0 + (b / 1000));
      });
      li.classList.remove('dr__link--playing');
      void li.offsetWidth;
      li.classList.add('dr__link--playing');
    });

    // ─── Play the whole chain ─────────────────────────────────
    var chainPlayBtn = document.getElementById('dr-chain-play');
    var chainPlaying = false;
    chainPlayBtn.addEventListener('click', function () {
      if (chainPlaying || !chainData.length) return;
      var ctx = ensureAudio();
      if (!ctx) return;
      chainPlaying = true;
      chainPlayBtn.disabled = true;
      chainPlayBtn.textContent = '… playing …';
      var t = ctx.currentTime + 0.1;
      var GAP_MS = 600; // pause between contributors
      var totalMs = 0;
      chainData.forEach(function (link, idx) {
        var freq = pitchForNoun(link.nounId | 0);
        var span = link.beats[link.beats.length - 1] || 0;
        var startSec = t + totalMs / 1000;
        link.beats.forEach(function (b) {
          playNote(freq, startSec + b / 1000);
        });
        // Highlight the link DOM at the right time
        setTimeout(function () {
          var li = chainListEl.querySelector('.dr__link[data-idx="' + idx + '"]');
          if (li) {
            li.classList.remove('dr__link--playing');
            void li.offsetWidth;
            li.classList.add('dr__link--playing');
            li.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
          }
        }, totalMs);
        totalMs += span + GAP_MS;
      });
      setTimeout(function () {
        chainPlaying = false;
        chainPlayBtn.disabled = false;
        chainPlayBtn.textContent = '▸ play the chain';
      }, totalMs + 400);
    });

    // Initial UI
    updateCaptureUI();
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum.png", "jsonLd": jsonLd, "data-astro-cid-vqw3qc34": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dr" id="dr-main" data-astro-cid-vqw3qc34> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "relay", "data-astro-cid-vqw3qc34": true })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "relay", "data-astro-cid-vqw3qc34": true })} <header class="dr__head" data-astro-cid-vqw3qc34> <p class="dr__kicker mono" data-astro-cid-vqw3qc34>★ DRUM HUB · RELAY · A CHAIN OF FOUR-BEAT LINKS ★</p> <h1 class="dr__title" data-astro-cid-vqw3qc34>drum <em data-astro-cid-vqw3qc34>relay</em></h1> <p class="dr__strap mono" data-astro-cid-vqw3qc34>tap four beats · pass the rhythm · the next visitor extends · the chain grows</p> </header>  <section class="dr__chain" aria-label="The chain so far" data-astro-cid-vqw3qc34> <div class="dr__chain-head" data-astro-cid-vqw3qc34> <p class="dr__eyebrow mono" data-astro-cid-vqw3qc34>▌ THE CHAIN · <strong id="dr-chain-count" data-astro-cid-vqw3qc34>—</strong> LINKS</p> <button type="button" class="dr__btn dr__btn--magenta" id="dr-chain-play" data-astro-cid-vqw3qc34>
▸ play the chain
</button> </div> <ol class="dr__chain-list" id="dr-chain-list" role="list" data-astro-cid-vqw3qc34> <li class="dr__chain-empty mono" data-astro-cid-vqw3qc34>— loading chain —</li> </ol> <p class="dr__chain-foot mono" data-astro-cid-vqw3qc34>
▸ chain holds the last 60 links · 7-day TTL · 30s cooldown between contributions per visitor
</p> </section>  <section class="dr__turn" aria-label="Your turn" data-astro-cid-vqw3qc34> <p class="dr__eyebrow mono" data-astro-cid-vqw3qc34>☞ YOUR TURN</p> <div class="dr__turn-card" data-astro-cid-vqw3qc34> <div class="dr__turn-noun-wrap" data-astro-cid-vqw3qc34> <img class="dr__turn-noun" id="dr-turn-noun" src="" alt="Your Noun" width="80" height="80" data-astro-cid-vqw3qc34> </div> <div class="dr__turn-body" data-astro-cid-vqw3qc34> <p class="dr__turn-line" data-astro-cid-vqw3qc34>
Tap the pad <strong data-astro-cid-vqw3qc34>four times</strong>. Any rhythm — clipped, sparse, urgent.
            The four taps become a link in the chain.
</p> <p class="dr__turn-status mono" id="dr-turn-status" data-astro-cid-vqw3qc34>— ready · 0 / 4 beats —</p> </div> </div> <button type="button" class="dr__pad" id="dr-pad" aria-label="Tap pad — 4 beats" data-astro-cid-vqw3qc34> <span class="dr__pad-cap" data-astro-cid-vqw3qc34> <span class="dr__pad-glyph" aria-hidden="true" data-astro-cid-vqw3qc34>▣</span> <span class="dr__pad-label mono" data-astro-cid-vqw3qc34>TAP</span> <span class="dr__pad-kbd mono" data-astro-cid-vqw3qc34>SPACE / RETURN</span> <span class="dr__pad-counter mono" data-astro-cid-vqw3qc34><strong id="dr-pad-count" data-astro-cid-vqw3qc34>0</strong> / 4</span> </span> </button> <div class="dr__turn-actions" data-astro-cid-vqw3qc34> <button type="button" class="dr__btn dr__btn--magenta" id="dr-submit" disabled data-astro-cid-vqw3qc34>
▸ add to the chain
</button> <button type="button" class="dr__btn dr__btn--ghost" id="dr-reset" data-astro-cid-vqw3qc34>▸ start over</button> </div> <p class="dr__submit-status mono" id="dr-submit-status" data-astro-cid-vqw3qc34>&nbsp;</p> </section>  <section class="dr__about" aria-label="About" data-astro-cid-vqw3qc34> <p class="dr__eyebrow mono" data-astro-cid-vqw3qc34>¶ ABOUT</p> <p class="dr__about-body" data-astro-cid-vqw3qc34>
Drum Relay is the <em data-astro-cid-vqw3qc34>slow</em> drum surface. There's no real-time multiplayer, no race against
        anyone. You arrive, you hear what previous visitors left, you contribute four beats, and you leave.
        Tomorrow someone else will hear yours. The chain grows by visit, not by minute.
</p> <p class="dr__about-body" data-astro-cid-vqw3qc34>
The only data we keep is timing — four numbers per visitor, in milliseconds. No words, no images,
        nothing to moderate. Just rhythm, in a long line.
</p> </section> <footer class="dr__foot" data-astro-cid-vqw3qc34> <p class="mono" data-astro-cid-vqw3qc34>DRUM RELAY · v0.1 · 2026-04-30 · pointcast.xyz/drum-relay · part of <a href="/drum-press" data-astro-cid-vqw3qc34>drum press</a></p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-relay.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-relay.astro";
const $$url = "/drum-relay";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumRelay,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
