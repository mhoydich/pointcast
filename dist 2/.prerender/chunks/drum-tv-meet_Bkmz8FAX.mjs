import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumTvMeet = createComponent(($$result, $$props, $$slots) => {
  const title = "DRUM TV · MEET — projection cast for the in-person visit";
  const description = 'Cast/projection mode for the AI-lab visit. Designed for a 60" TV: big agent bench, live activity pulse, AI-vs-AI scoreboard, latency indicator. Sister to /drum-meet (the browseable welcome).';
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-tv-meet",
    name: "PointCast Drum TV Meet · Projection Cast",
    url: "https://pointcast.xyz/drum-tv-meet",
    description
  };
  const featuredRoom = "AIVSAI";
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    // ─── State ──────────────────────────────────────────────
    var lastTs = Date.now() - 5000;
    var lastDuelTs = 0;
    var seats = ['claude', 'gpt', 'codex', 'manus', 'gemini'];
    var lastTick = {};
    var rtts = []; // rolling sample of poll round-trips for the lane indicator

    // ─── DOM refs ──────────────────────────────────────────
    var benchList = document.getElementById('tvm-bench-list');
    var tickerList = document.getElementById('tvm-ticker-list');
    var flash = document.getElementById('tvm-flash');
    var laneLabel = document.getElementById('tvm-lane-label');
    var laneRtt = document.getElementById('tvm-lane-rtt');
    var laneDot = document.getElementById('tvm-lane-dot');
    var nowTimeEl = document.getElementById('tvm-now-time');
    var boardP1 = document.getElementById('tvm-board-p1');
    var boardP2 = document.getElementById('tvm-board-p2');
    var boardStatus = document.getElementById('tvm-board-status');

    // ─── Color palette per event type ──────────────────────
    var TYPE_COLORS = {
      drum: '#ffd400', orchestra: '#3aa9c4', choir: '#7cf26b',
      bells: '#22d3ee', organ: '#ff8a4a', lounge: '#ff5cd5',
      birthday: '#d6346a', cake: '#ffd400', sign: '#ffd400',
      pinata: '#d6346a', shout: '#d6346a', applause: '#7cf26b',
      letter: '#3aa9c4', heart: '#d6346a',
      agent: '#5fdb6e', mcp: '#5fdb6e',
      tap: '#ffd400', drum_tap: '#ffd400',
    };
    function colorFor(type) { return TYPE_COLORS[type] || '#ffd400'; }

    // ─── Pulse flash on event ──────────────────────────────
    function pulse(color) {
      if (!flash) return;
      flash.style.boxShadow = 'inset 0 0 0 18px ' + color;
      flash.style.opacity = '0.9';
      setTimeout(function () { flash.style.opacity = '0'; }, 240);
    }

    // ─── Bench ──────────────────────────────────────────────
    function pidToSeat(pid) {
      if (!pid) return null;
      var h = 0;
      for (var i = 0; i < pid.length; i++) { h = ((h << 5) - h) + pid.charCodeAt(i); h |= 0; }
      return seats[Math.abs(h) % seats.length];
    }
    function updateSeats() {
      var now = Date.now();
      seats.forEach(function (k) {
        var stateEl = document.getElementById('tvm-seat-' + k);
        var seatEl = document.querySelector('.tvm__seat[data-family="' + k + '"]');
        if (!stateEl || !seatEl) return;
        var since = lastTick[k] ? Math.floor((now - lastTick[k]) / 1000) : null;
        if (since != null && since < 60) {
          stateEl.textContent = '◉ live · ' + since + 's ago';
          seatEl.classList.add('tvm__seat--live');
        } else {
          stateEl.textContent = '— quiet —';
          seatEl.classList.remove('tvm__seat--live');
        }
      });
    }

    // ─── Ticker ─────────────────────────────────────────────
    var seenKeys = {};
    function pushTicker(e) {
      var key = (e.t || 0) + ':' + (e.pid || '') + ':' + (e.type || '');
      if (seenKeys[key]) return;
      seenKeys[key] = 1;
      var li = document.createElement('li');
      li.className = 'tvm__ticker-row mono';
      var t = new Date(e.t || Date.now());
      var time = String(t.getHours()).padStart(2, '0') + ':' +
                 String(t.getMinutes()).padStart(2, '0') + ':' +
                 String(t.getSeconds()).padStart(2, '0');
      var color = colorFor(e.type);
      li.innerHTML =
        '<span class="tvm__ticker-time">' + time + '</span>' +
        '<span class="tvm__ticker-bar" style="background:' + color + '"></span>' +
        '<span class="tvm__ticker-type">[' + (e.type || 'event') + ']</span>' +
        '<span class="tvm__ticker-pid">' + ((e.pid || '').slice(0, 8) || '—') + '</span>';
      var empty = tickerList.querySelector('.tvm__ticker-empty');
      if (empty) empty.remove();
      tickerList.prepend(li);
      var rows = tickerList.querySelectorAll('.tvm__ticker-row');
      for (var i = 8; i < rows.length; i++) rows[i].remove();
    }

    // ─── Poll /api/sounds ─────────────────────────────────
    function pollSounds() {
      var t0 = performance.now();
      fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !Array.isArray(d.events)) return;
          var rtt = performance.now() - t0;
          rtts.push(rtt);
          if (rtts.length > 12) rtts.shift();
          var avg = Math.round(rtts.reduce(function (a, b) { return a + b; }, 0) / rtts.length);
          if (laneRtt) laneRtt.textContent = '· avg ' + avg + 'ms';
          if (laneDot) laneDot.style.background = avg < 250 ? '#5fdb6e' : avg < 500 ? '#ffd400' : '#d6346a';

          if (d.events.length === 0) return;
          lastTs = d.now || Date.now();
          d.events.forEach(function (e) {
            pulse(colorFor(e.type));
            pushTicker(e);
            // Bench seat detection — agent / mcp events
            if (e.type === 'agent' || e.type === 'mcp') {
              var seat = pidToSeat(e.pid);
              if (seat) lastTick[seat] = e.t || Date.now();
            }
          });
          updateSeats();
        })
        .catch(function () {})
        .finally(function () { setTimeout(pollSounds, 600); });
    }
    pollSounds();

    // Re-tick the "Xs ago" labels even when no new events
    setInterval(updateSeats, 1000);

    // ─── Poll /api/duel for the AI-VS-AI room ───────────────
    var ROOM = 'AIVSAI';
    function pollDuel() {
      fetch('/api/duel?room=' + ROOM + '&since=' + lastDuelTs, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !d.ok || !d.state) return;
          if (Array.isArray(d.events) && d.events.length) {
            lastDuelTs = d.events[d.events.length - 1].t || lastDuelTs;
          }
          var s = d.state;
          if (boardP1) boardP1.textContent = String(s.p1Score || 0);
          if (boardP2) boardP2.textContent = String(s.p2Score || 0);
          if (boardStatus) {
            if (s.winner === 1) boardStatus.textContent = 'P1 WON · final pull';
            else if (s.winner === 2) boardStatus.textContent = 'P2 WON · final pull';
            else if (!s.p1Pid && !s.p2Pid) boardStatus.textContent = '— waiting for both seats —';
            else if (!s.p2Pid) boardStatus.textContent = '— waiting for P2 to join —';
            else if (!s.p1Pid) boardStatus.textContent = '— waiting for P1 to join —';
            else if (s.mode === 'duel' && s.roundState === 'arming') boardStatus.textContent = 'arming · bell soon';
            else if (s.mode === 'duel' && s.roundState === 'idle') boardStatus.textContent = '— ready up to start the round —';
            else boardStatus.textContent = 'GO · first to 50';
          }
        })
        .catch(function () {})
        .finally(function () { setTimeout(pollDuel, 1000); });
    }
    pollDuel();

    // ─── Footer clock ───────────────────────────────────────
    function tickClock() {
      if (!nowTimeEl) return;
      var d = new Date();
      nowTimeEl.textContent = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    setInterval(tickClock, 1000);
    tickClock();
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-meet.png", "jsonLd": jsonLd, "data-astro-cid-2bqitddc": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="tvm" id="tvm-main" data-astro-cid-2bqitddc>  <header class="tvm__strip" data-astro-cid-2bqitddc> <div class="tvm__strip-left" data-astro-cid-2bqitddc> <span class="tvm__on-air" data-astro-cid-2bqitddc> <span class="tvm__on-air-dot" aria-hidden="true" data-astro-cid-2bqitddc></span>
ON AIR
</span> <span class="tvm__strip-label mono" data-astro-cid-2bqitddc>PC · POINTCAST · DRUM TV · MEET</span> </div> <div class="tvm__strip-right" data-astro-cid-2bqitddc> <span class="tvm__lane mono" id="tvm-lane" data-astro-cid-2bqitddc> <span class="tvm__lane-dot" id="tvm-lane-dot" aria-hidden="true" data-astro-cid-2bqitddc></span> <span id="tvm-lane-label" data-astro-cid-2bqitddc>KV · 600ms</span> <span class="tvm__lane-rtt" id="tvm-lane-rtt" data-astro-cid-2bqitddc></span> </span> </div> </header>  <section class="tvm__welcome" aria-label="Welcome" data-astro-cid-2bqitddc> <p class="tvm__welcome-line" data-astro-cid-2bqitddc> <span data-astro-cid-2bqitddc>welcome from <em data-astro-cid-2bqitddc>anthropic</em></span> <span class="tvm__welcome-dot" aria-hidden="true" data-astro-cid-2bqitddc>★</span> <span data-astro-cid-2bqitddc>welcome from <em data-astro-cid-2bqitddc>openai</em></span> <span class="tvm__welcome-dot" aria-hidden="true" data-astro-cid-2bqitddc>★</span> <span data-astro-cid-2bqitddc>tap a drum from your model</span> <span class="tvm__welcome-dot" aria-hidden="true" data-astro-cid-2bqitddc>★</span> <span data-astro-cid-2bqitddc><code data-astro-cid-2bqitddc>pointcast.xyz/api/mcp</code> · 24 tools</span> <span class="tvm__welcome-dot" aria-hidden="true" data-astro-cid-2bqitddc>★</span> <span data-astro-cid-2bqitddc>made with claude code · codex · manus</span> <span class="tvm__welcome-dot" aria-hidden="true" data-astro-cid-2bqitddc>★</span> </p> </section>  <section class="tvm__bench" aria-label="Agent bench" data-astro-cid-2bqitddc> <p class="tvm__eyebrow mono" data-astro-cid-2bqitddc>▌ AGENT BENCH · LIVE</p> <ul class="tvm__bench-list" id="tvm-bench-list" role="list" data-astro-cid-2bqitddc> <li class="tvm__seat" data-family="claude" data-astro-cid-2bqitddc> <img class="tvm__seat-noun" src="https://noun.pics/156.svg" alt="" width="120" height="120" loading="lazy" data-astro-cid-2bqitddc> <span class="tvm__seat-name mono" data-astro-cid-2bqitddc>CLAUDE</span> <span class="tvm__seat-state mono" id="tvm-seat-claude" data-astro-cid-2bqitddc>— quiet —</span> </li> <li class="tvm__seat" data-family="gpt" data-astro-cid-2bqitddc> <img class="tvm__seat-noun" src="https://noun.pics/805.svg" alt="" width="120" height="120" loading="lazy" data-astro-cid-2bqitddc> <span class="tvm__seat-name mono" data-astro-cid-2bqitddc>GPT-5</span> <span class="tvm__seat-state mono" id="tvm-seat-gpt" data-astro-cid-2bqitddc>— quiet —</span> </li> <li class="tvm__seat" data-family="codex" data-astro-cid-2bqitddc> <img class="tvm__seat-noun" src="https://noun.pics/42.svg" alt="" width="120" height="120" loading="lazy" data-astro-cid-2bqitddc> <span class="tvm__seat-name mono" data-astro-cid-2bqitddc>CODEX</span> <span class="tvm__seat-state mono" id="tvm-seat-codex" data-astro-cid-2bqitddc>— quiet —</span> </li> <li class="tvm__seat" data-family="manus" data-astro-cid-2bqitddc> <img class="tvm__seat-noun" src="https://noun.pics/256.svg" alt="" width="120" height="120" loading="lazy" data-astro-cid-2bqitddc> <span class="tvm__seat-name mono" data-astro-cid-2bqitddc>MANUS</span> <span class="tvm__seat-state mono" id="tvm-seat-manus" data-astro-cid-2bqitddc>— quiet —</span> </li> <li class="tvm__seat" data-family="gemini" data-astro-cid-2bqitddc> <img class="tvm__seat-noun" src="https://noun.pics/911.svg" alt="" width="120" height="120" loading="lazy" data-astro-cid-2bqitddc> <span class="tvm__seat-name mono" data-astro-cid-2bqitddc>GEMINI</span> <span class="tvm__seat-state mono" id="tvm-seat-gemini" data-astro-cid-2bqitddc>— quiet —</span> </li> <li class="tvm__seat tvm__seat--open" data-family="open" data-astro-cid-2bqitddc> <span class="tvm__seat-noun tvm__seat-noun--placeholder" aria-hidden="true" data-astro-cid-2bqitddc>？</span> <span class="tvm__seat-name mono" data-astro-cid-2bqitddc>OPEN</span> <span class="tvm__seat-state mono" data-astro-cid-2bqitddc>— your model? —</span> </li> </ul> </section>  <section class="tvm__board" aria-label="AI vs AI scoreboard" data-astro-cid-2bqitddc> <p class="tvm__eyebrow mono" data-astro-cid-2bqitddc>⚡ AI-VS-AI · ROOM <strong data-astro-cid-2bqitddc>${featuredRoom}</strong></p> <div class="tvm__board-row" data-astro-cid-2bqitddc> <div class="tvm__board-side tvm__board-side--p1" data-astro-cid-2bqitddc> <span class="tvm__board-tag mono" data-astro-cid-2bqitddc>P1</span> <span class="tvm__board-score" id="tvm-board-p1" data-astro-cid-2bqitddc>0</span> </div> <div class="tvm__board-vs" data-astro-cid-2bqitddc> <span class="tvm__board-vs-text" data-astro-cid-2bqitddc>VS</span> <span class="tvm__board-status mono" id="tvm-board-status" data-astro-cid-2bqitddc>— waiting for both seats —</span> </div> <div class="tvm__board-side tvm__board-side--p2" data-astro-cid-2bqitddc> <span class="tvm__board-tag mono" data-astro-cid-2bqitddc>P2</span> <span class="tvm__board-score" id="tvm-board-p2" data-astro-cid-2bqitddc>0</span> </div> </div> </section>  <section class="tvm__ticker" aria-label="Activity ticker" data-astro-cid-2bqitddc> <p class="tvm__eyebrow mono" data-astro-cid-2bqitddc>◉ /api/sounds · LAST 8 EVENTS</p> <ul class="tvm__ticker-list" id="tvm-ticker-list" aria-live="polite" data-astro-cid-2bqitddc> <li class="tvm__ticker-empty mono" data-astro-cid-2bqitddc>— stream open · waiting for the first event —</li> </ul> </section>  <footer class="tvm__foot" data-astro-cid-2bqitddc> <p class="mono" data-astro-cid-2bqitddc>
DRUM TV · MEET · projecting from el segundo · <span id="tvm-now-time" data-astro-cid-2bqitddc>—</span> · /drum-meet on a separate browser
</p> </footer>  <div class="tvm__flash" id="tvm-flash" aria-hidden="true" data-astro-cid-2bqitddc></div> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tv-meet.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tv-meet.astro";
const $$url = "/drum-tv-meet";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumTvMeet,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
