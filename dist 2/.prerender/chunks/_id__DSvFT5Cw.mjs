import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
async function getStaticPaths() {
  const blocks = await getCollection(
    "blocks",
    ({ data }) => !data.draft && data.type === "WATCH" && Array.isArray(data.media?.beats) && data.media.beats.length > 0
  );
  return blocks.map((block) => ({
    params: { id: block.data.id },
    props: { block }
  }));
}
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { block } = Astro2.props;
  const data = block.data;
  const ch = CHANNELS[data.channel];
  const beats = data.media.beats;
  const yeeMeta = data.meta?.yeeplayer ?? {};
  function labelFromBeatNote(note, word) {
    if (!note) return word;
    const cleaned = note.includes(":") ? note.split(":").slice(1).join(":") : note;
    return cleaned.split(/[-_:]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }
  const fallbackLegendMap = /* @__PURE__ */ new Map();
  for (const beat of beats) {
    const key = beat.note || beat.word;
    if (!fallbackLegendMap.has(key)) {
      fallbackLegendMap.set(key, {
        label: labelFromBeatNote(beat.note, beat.word),
        word: beat.word,
        color: beat.color || "#1864AB"
      });
    }
  }
  const legendItems = Array.isArray(yeeMeta.legend) && yeeMeta.legend.length > 0 ? yeeMeta.legend.map((item) => ({
    label: item.label || item.word || "Cue",
    word: item.word || item.label || "Cue",
    color: item.color || "#1864AB"
  })) : Array.from(fallbackLegendMap.values()).slice(0, 10);
  const cueName = yeeMeta.cueName || "cues";
  const legendTitle = yeeMeta.legendTitle || `BEAT MAP · ${beats.length} CUES`;
  const legendNote = yeeMeta.legendNote || "Cues fall from the top. Mark SPACE when a cue reaches the raised listening line, or let it pass. The NEXT TURN chip above the track shows what is coming and when. Attention is the point.";
  function youtubeIdFromUrl(url) {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
      if (/(^|\.)youtube\.com$/.test(u.hostname)) {
        if (u.pathname === "/watch") return u.searchParams.get("v");
        const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([\w-]{6,})/);
        if (m) return m[1];
      }
    } catch {
    }
    return null;
  }
  const ytId = youtubeIdFromUrl(data.media?.src);
  const totalBeats = beats.length;
  beats[0]?.t ?? 0;
  const lastBeat = beats[beats.length - 1]?.t ?? 0;
  const durationSec = data.meta?.duration ? (() => {
    const m = data.meta.duration.match(/^(\d+):(\d{2})$/);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : lastBeat + 30;
  })() : lastBeat + 30;
  const title = `YeePlayer · ${data.title}`;
  const description = `Mark the cued turns as they drift. A static listening-map overlay on CH.${ch.code} № ${data.id} — ${data.title}. ${totalBeats} beats across ${Math.round(durationSec / 60)} minutes.`;
  const ogImage = `/images/og/b/${data.id}.png`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: title,
    description,
    applicationCategory: "Game",
    operatingSystem: "Web Browser (any)",
    genre: "Rhythm",
    playMode: "SinglePlayer",
    isPartOf: {
      "@type": "CreativeWork",
      "@id": `https://pointcast.xyz/b/${data.id}`,
      name: data.title
    }
  };
  const alternates = [
    { type: "application/json", href: `/b/${data.id}.json`, title: "Source block (JSON)" },
    { type: "text/html", href: `/b/${data.id}`, title: "Source block (canonical HTML)" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": ogImage, "jsonLd": jsonLd, "alternates": alternates, "data-astro-cid-yl5eoznr": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="yee" data-astro-cid-yl5eoznr> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-yl5eoznr> <a', " data-astro-cid-yl5eoznr>← Back to block № ", '</a> <span class="crumb__sep" aria-hidden="true" data-astro-cid-yl5eoznr>/</span> <span class="crumb__here" data-astro-cid-yl5eoznr>YeePlayer v0</span> </nav> <header class="yee__head" data-astro-cid-yl5eoznr> <p class="yee__kicker mono"', " data-astro-cid-yl5eoznr>CH.", " · № ", ' · YEEPLAYER v0</p> <h1 class="yee__title" data-astro-cid-yl5eoznr>', '</h1> <p class="yee__dek" data-astro-cid-yl5eoznr>', '</p> </header> <div class="yee__stage" id="yee-stage"', "", ' data-astro-cid-yl5eoznr>  <div class="yee__video" data-astro-cid-yl5eoznr> ', ' <div class="yee__hud" data-astro-cid-yl5eoznr> <div class="hud-row" data-astro-cid-yl5eoznr> <span class="mono hud-label" data-astro-cid-yl5eoznr>TIME</span> <span class="mono hud-value" id="hud-time" data-astro-cid-yl5eoznr>0:00 / ', ":", '</span> </div> <div class="hud-row" data-astro-cid-yl5eoznr> <span class="mono hud-label" data-astro-cid-yl5eoznr>ATTUNE</span> <span class="mono hud-value" id="hud-score" data-astro-cid-yl5eoznr>0</span> </div> <div class="hud-row" data-astro-cid-yl5eoznr> <span class="mono hud-label" data-astro-cid-yl5eoznr>THREAD</span> <span class="mono hud-value" id="hud-combo" data-astro-cid-yl5eoznr>×0</span> </div> <div class="hud-row" data-astro-cid-yl5eoznr> <span class="mono hud-label" data-astro-cid-yl5eoznr>MARKED</span> <span class="mono hud-value" id="hud-hits" data-astro-cid-yl5eoznr>0 / ', '</span> </div> <div class="hud-row hud-row--wide" data-astro-cid-yl5eoznr> <span class="mono hud-label" data-astro-cid-yl5eoznr>MEMORY</span> <span class="mono hud-value" id="hud-best" data-astro-cid-yl5eoznr>—</span> </div> </div> </div>  <div class="yee__track" id="yee-track"', ' data-astro-cid-yl5eoznr> <div class="track__zone" id="track-zone" data-astro-cid-yl5eoznr> <div class="track__rails" aria-hidden="true" data-astro-cid-yl5eoznr> <span data-astro-cid-yl5eoznr></span><span data-astro-cid-yl5eoznr></span><span data-astro-cid-yl5eoznr></span> </div> <div class="track__target" aria-hidden="true" data-astro-cid-yl5eoznr></div> <div class="track__judgement mono" id="track-judgement" aria-live="polite" data-astro-cid-yl5eoznr></div>  <div class="track__howto" id="track-howto" data-astro-cid-yl5eoznr> <p class="howto__eyebrow mono" data-astro-cid-yl5eoznr>HOW TO LISTEN</p> <ol class="howto__list" data-astro-cid-yl5eoznr> <li data-astro-cid-yl5eoznr><strong data-astro-cid-yl5eoznr>Press ▶ BEGIN</strong> (or SPACE) to open the listening map.</li> <li data-astro-cid-yl5eoznr>Colored <strong data-astro-cid-yl5eoznr>', '</strong> drift down three lanes toward the raised listening line.</li> <li data-astro-cid-yl5eoznr>When a cue crosses the glow band, <strong data-astro-cid-yl5eoznr>mark it with SPACE</strong> or let it pass.</li> <li data-astro-cid-yl5eoznr>Close marks become <strong data-astro-cid-yl5eoznr>CENTERED</strong>. Near marks become <strong data-astro-cid-yl5eoznr>DRIFT</strong>. Passing is part of the piece.</li> </ol> <p class="howto__note" data-astro-cid-yl5eoznr>\nThis is not karaoke. It is a quiet attention instrument: watch the room, mark the turns you feel, and let the rest keep moving.\n</p> </div> </div> <div class="track__label mono" id="track-label" data-astro-cid-yl5eoznr>PRESS ▶ TO LISTEN</div> <div class="track__groove mono" id="track-groove" data-astro-cid-yl5eoznr> <span class="track__groove-label" data-astro-cid-yl5eoznr>PRESENCE</span> <span class="track__groove-bar" data-astro-cid-yl5eoznr><span id="track-groove-fill" data-astro-cid-yl5eoznr></span></span> <span class="track__groove-value" id="track-groove-value" data-astro-cid-yl5eoznr>0%</span> </div> <div class="track__next mono" id="track-next" hidden data-astro-cid-yl5eoznr> <span class="track__next-label" data-astro-cid-yl5eoznr>NEXT TURN</span> <span class="track__next-word" id="track-next-word" data-astro-cid-yl5eoznr>—</span> <span class="track__next-sep" aria-hidden="true" data-astro-cid-yl5eoznr>·</span> <span class="track__next-eta" id="track-next-eta" data-astro-cid-yl5eoznr>—</span> </div> <button class="track__hit" id="track-hit" type="button" aria-label="Mark cue" data-astro-cid-yl5eoznr> <span class="hit__pulse" aria-hidden="true" data-astro-cid-yl5eoznr></span> <span class="hit__label mono" data-astro-cid-yl5eoznr>MARK · SPACE</span> </button> </div> </div> <section class="yee__controls" data-astro-cid-yl5eoznr> <button class="btn btn--primary" id="btn-start" type="button" data-astro-cid-yl5eoznr>▶ Begin</button> <button class="btn" id="btn-restart" type="button" data-astro-cid-yl5eoznr>↻ Reset</button> <a class="btn btn--ghost"', ' data-astro-cid-yl5eoznr>← Back to block</a> </section> <section class="yee__legend" data-astro-cid-yl5eoznr> <p class="legend__title mono" data-astro-cid-yl5eoznr>', '</p> <ul class="legend__list" data-astro-cid-yl5eoznr> ', ' </ul> <p class="legend__note" data-astro-cid-yl5eoznr>', '</p> </section> <section class="yee__meta" data-astro-cid-yl5eoznr> <p class="mono" data-astro-cid-yl5eoznr><strong data-astro-cid-yl5eoznr>Source:</strong> ', " · ", '</p> <p class="mono" data-astro-cid-yl5eoznr><strong data-astro-cid-yl5eoznr>Run time:</strong> ', '</p> <p class="mono" data-astro-cid-yl5eoznr><strong data-astro-cid-yl5eoznr>Canonical block:</strong> <a', " data-astro-cid-yl5eoznr>/b/", '</a></p> <p class="mono" data-astro-cid-yl5eoznr><strong data-astro-cid-yl5eoznr>Machine-readable:</strong> <a', " data-astro-cid-yl5eoznr>/b/", '.json</a></p> </section> </main> <script type="application/json" id="yee-beats">', `<\/script> <script>
    /**
     * YeePlayer v0 client.
     *
     * Flow:
     * 1. Inject YouTube IFrame API.
     * 2. Create player in #yee-player; expose ready callback.
     * 3. rAF loop polls player.getCurrentTime() → positions cues,
     *    flags mark window, lets unmarked beats pass.
     * 4. Keyboard (Space) + pointer (click mark zone) → attempt mark:
     *    within ±200 ms of nearest active beat → CENTERED,
     *    within ±650 ms → DRIFT, else breathe and keep listening.
     * 5. Web Audio for soft mark confirmations, tuned more like a
     *    listening bowl than an arcade clack.
     */
    (function () {
      const beatsEl = document.getElementById('yee-beats');
      const beats = JSON.parse(beatsEl ? beatsEl.textContent : '[]');
      const total = beats.length;
      const mount = document.getElementById('yee-player');
      const ytId = mount ? mount.dataset.yt : null;
      const zone = document.getElementById('track-zone');
      const stage = document.getElementById('yee-stage');
      const hitBtn = document.getElementById('track-hit');
      const hudTime = document.getElementById('hud-time');
      const hudScore = document.getElementById('hud-score');
      const hudCombo = document.getElementById('hud-combo');
      const hudHits = document.getElementById('hud-hits');
      const label = document.getElementById('track-label');
      const btnStart = document.getElementById('btn-start');
      const btnRestart = document.getElementById('btn-restart');
      const grooveFill = document.getElementById('track-groove-fill');
      const grooveValue = document.getElementById('track-groove-value');
      const judgementEl = document.getElementById('track-judgement');

      // Per Mike 2026-04-19 morning ("wasn't totally clear what to do /
      // too slow"): give beats 6s of visible travel so players can see
      // them approaching from well in advance. On meditation tracks
      // with long gaps this also doubles how much of the track has a
      // beat visible on-screen at any time.
      const LEAD_MS = 6000;     // how far ahead of hit-time beats appear
      const CENTERED_MS = 200;
      const DRIFT_MS = 650;
      const LANES = ['24%', '50%', '76%'];
      const LANE_PATTERN = [1, 0, 2, 1, 2, 0];

      const state = {
        player: null,
        ready: false,
        started: false,
        score: 0,
        hits: 0,
        combo: 0,
        maxCombo: 0,
        groove: 0,
        passes: 0,
        judgementTimer: null,
        // Per-beat state: status = 'pending' | 'hit' | 'pass', plus a dom node.
        list: beats.map((b) => ({ ...b, status: 'pending', el: null, lastY: -9999 })),
      };

      function fmtTime(s) {
        s = Math.max(0, Math.floor(s));
        const m = Math.floor(s / 60);
        const r = s - m * 60;
        return m + ':' + String(r).padStart(2, '0');
      }

      /* Build DOM nodes for every beat up front. CSS transform moves them. */
      state.list.forEach((b, i) => {
        const el = document.createElement('div');
        el.className = 'beat';
        el.dataset.index = String(i);
        el.setAttribute('aria-hidden', 'true');
        el.style.setProperty('--lane-left', LANES[LANE_PATTERN[i % LANE_PATTERN.length]]);
        el.style.setProperty('--beat-color', b.color || '#1864AB');
        el.style.setProperty('--beat-y', '-9999px');
        el.innerHTML = '<span class="beat__word">' + (b.word || '·') + '</span>';
        zone.appendChild(el);
        b.el = el;
      });

      /* ============== Web Audio for hit-confirmation ============== */
      let actx = null;
      function ensureAudio() {
        if (actx) return actx;
        try {
          actx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { actx = null; }
        return actx;
      }
      function chime(freq, dur) {
        const ctx = ensureAudio();
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + dur);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + dur + 0.05);
      }
      function pad(freq, dur) {
        const ctx = ensureAudio();
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        o.frequency.linearRampToValueAtTime(freq * 1.012, ctx.currentTime + dur);
        g.gain.setValueAtTime(0.0005, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.028, ctx.currentTime + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + dur);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + dur + 0.12);
      }
      function buzz(ms) {
        try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
      }
      function drum(freq, dur) {
        const ctx = ensureAudio();
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), ctx.currentTime + dur);
        g.gain.setValueAtTime(0.0005, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + dur);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + dur + 0.04);
      }

      /* ============== Best-run persistence ==============
       * One localStorage key per title: yee:best:{id}. Stored as JSON.
       * Shape: { score, hits, total, maxCombo, at: ISO }.
       * Displayed pre-listen in the HUD and updated on final summary.
       */
      const BEST_KEY = 'yee:best:' + (location.pathname.split('/').pop() || 'x');
      function readBest() {
        try { const raw = localStorage.getItem(BEST_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
      }
      function writeBest(run) {
        try { localStorage.setItem(BEST_KEY, JSON.stringify(run)); } catch {}
      }
      function paintBest() {
        const b = readBest();
        if (!b) return;
        const bestEl = document.getElementById('hud-best');
        if (bestEl) bestEl.textContent = b.score + ' attention · ' + b.hits + '/' + b.total + ' · thread ×' + b.maxCombo;
      }

      /* ============== YouTube IFrame API ============== */
      function loadYT() {
        if (!ytId) return;
        if (window.YT && window.YT.Player) { onYTReady(); return; }
        if (!document.querySelector('script[data-yt-api]')) {
          const s = document.createElement('script');
          s.src = 'https://www.youtube.com/iframe_api';
          s.dataset.ytApi = '1';
          document.head.appendChild(s);
        }
        window.onYouTubeIframeAPIReady = onYTReady;
      }
      function onYTReady() {
        if (!ytId) return;
        state.player = new YT.Player('yee-player', {
          width: '100%',
          height: '100%',
          videoId: ytId,
          playerVars: {
            playsinline: 1, modestbranding: 1, rel: 0, iv_load_policy: 3, controls: 1,
          },
          events: {
            onReady: () => { state.ready = true; label.textContent = 'READY · PRESS BEGIN'; },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING && !state.started) {
                state.started = true;
                label.textContent = 'LISTENING';
                // Hide the how-to overlay once playback begins. Also
                // unhide the NEXT countdown so players always know
                // what's coming, per the 2026-04-19 morning feedback.
                var howto = document.getElementById('track-howto');
                if (howto) howto.style.display = 'none';
                var next = document.getElementById('track-next');
                if (next) next.hidden = false;
                loop();
              }
              if (e.data === YT.PlayerState.ENDED) {
                label.textContent = finalSummary();
                var next2 = document.getElementById('track-next');
                if (next2) next2.hidden = true;
              }
            },
          },
        });
      }

      /* ============== Loop ============== */
      function currentSec() {
        if (!state.player || !state.player.getCurrentTime) return 0;
        try { return state.player.getCurrentTime() || 0; } catch { return 0; }
      }

      // NEXT countdown element refs — looked up once.
      var nextWordEl = document.getElementById('track-next-word');
      var nextEtaEl = document.getElementById('track-next-eta');
      var nextContainerEl = document.getElementById('track-next');

      function paintNext(now) {
        if (!nextWordEl || !nextEtaEl) return;
        // Find the next pending beat
        var nextBeat = null;
        for (var i = 0; i < state.list.length; i++) {
          var b = state.list[i];
          if (b.status === 'pending' && b.t >= now - 0.2) { nextBeat = b; break; }
        }
        if (!nextBeat) {
          nextWordEl.textContent = '—';
          nextEtaEl.textContent = 'done';
          if (nextContainerEl) nextContainerEl.classList.remove('track__next--imminent');
          return;
        }
        nextWordEl.textContent = nextBeat.word || '·';
        nextWordEl.style.color = nextBeat.color || '#f1f1ee';
        var sec = Math.max(0, nextBeat.t - now);
        nextEtaEl.textContent = 'in ' + fmtTime(sec);
        if (nextContainerEl) {
          if (sec <= 3) nextContainerEl.classList.add('track__next--imminent');
          else nextContainerEl.classList.remove('track__next--imminent');
        }
      }
      function hitLineY() {
        const raw = window.getComputedStyle(zone).getPropertyValue('--hit-line-offset');
        const offset = Number.parseFloat(raw) || 88;
        return Math.max(96, (zone.clientHeight || 1) - offset);
      }
      function hideBeat(b) {
        if (!b || !b.el) return;
        b.el.style.setProperty('--beat-y', '-9999px');
      }
      function flashJudgement(text, color) {
        if (!judgementEl) return;
        window.clearTimeout(state.judgementTimer);
        judgementEl.textContent = text;
        judgementEl.style.color = color || '#f1f1ee';
        judgementEl.classList.remove('track__judgement--show');
        void judgementEl.offsetWidth;
        judgementEl.classList.add('track__judgement--show');
        state.judgementTimer = window.setTimeout(() => {
          judgementEl.classList.remove('track__judgement--show');
        }, 900);
      }
      function setGroove(next) {
        state.groove = Math.max(0, Math.min(100, next));
        if (grooveFill) grooveFill.style.width = Math.round(state.groove) + '%';
        if (grooveValue) grooveValue.textContent = Math.round(state.groove) + '%';
        if (stage) {
          stage.classList.toggle('yee__stage--flow', state.groove >= 66 || state.combo >= 4);
        }
      }
      function scoreFor(kind) {
        const base = kind === 'centered' ? 11 : 7;
        const comboBonus = Math.min(21, Math.max(0, state.combo - 1) * (kind === 'centered' ? 2 : 1));
        const grooveBonus = state.groove >= 66 ? (kind === 'centered' ? 5 : 3) : 0;
        return base + comboBonus + grooveBonus;
      }
      function passBeat(b) {
        b.status = 'pass';
        b.el.classList.add('beat--pass');
        state.combo = Math.max(0, state.combo - 1);
        state.passes += 1;
        setGroove(state.groove - 6);
        flashJudgement('LET PASS', '#a9a7a2');
        window.setTimeout(() => { hideBeat(b); }, 760);
        updateHud();
      }

      function loop() {
        if (!state.started) return;
        const now = currentSec();
        hudTime.textContent = fmtTime(now) + ' / ' + hudTime.textContent.split(' / ')[1];
        paintNext(now);

        const targetY = hitLineY();
        for (let i = 0; i < state.list.length; i++) {
          const b = state.list[i];
          if (b.status !== 'pending') continue;

          const deltaMs = (b.t - now) * 1000;
          if (deltaMs > LEAD_MS) {
            // not yet visible
            hideBeat(b);
            continue;
          }
          if (deltaMs < -DRIFT_MS) {
            // Passed without a mark. Let it fade.
            passBeat(b);
            continue;
          }

          // Position: at deltaMs = LEAD_MS → y = 0 (top of zone)
          //           at deltaMs = 0      → y = raised listening line
          const progress = 1 - deltaMs / LEAD_MS;
          const y = progress * targetY;
          b.el.style.setProperty('--beat-y', Math.round(y) + 'px');
          b.lastY = y;

          // In-window glow
          const absDelta = Math.abs(deltaMs);
          if (absDelta < DRIFT_MS) b.el.classList.add('beat--in-window');
          else b.el.classList.remove('beat--in-window');
        }

        requestAnimationFrame(loop);
      }

      function updateHud() {
        hudScore.textContent = String(state.score);
        hudCombo.textContent = '×' + state.combo;
        hudHits.textContent = state.hits + ' / ' + total;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        setGroove(state.groove);
      }

      /* ============== Hit attempt ============== */
      function attempt() {
        if (!state.started) {
          // first press = start the video (after user gesture → audio is unlocked)
          ensureAudio();
          if (state.player && state.player.playVideo) {
            state.player.playVideo();
            // Pull keyboard focus off the iframe so SPACE hits the overlay,
            // not YouTube's pause control. Refocus on the hit button so
            // keyboard users keep a visible focus indicator.
            setTimeout(() => {
              try {
                const frame = document.querySelector('#yee-player iframe');
                if (frame && frame.blur) frame.blur();
              } catch {}
              try { hitBtn.focus({ preventScroll: true }); } catch {}
            }, 120);
          } else {
            // no video fallback: simulate a clock using performance.now()
            state.started = true;
            label.textContent = 'SILENT MAP';
            state.startT = performance.now();
            state.player = { getCurrentTime: () => (performance.now() - state.startT) / 1000 };
            loop();
          }
          return;
        }
        const now = currentSec();
        // Find the closest pending beat within the mark window.
        let best = null, bestAbs = Infinity;
        for (const b of state.list) {
          if (b.status !== 'pending') continue;
          const d = Math.abs((b.t - now) * 1000);
          if (d < bestAbs && d <= DRIFT_MS) { best = b; bestAbs = d; }
        }
        if (!best) {
          // stray mark: no penalty, just a breath reminder.
          chime(146, 0.12);
          flashJudgement('BREATHE', '#8a8882');
          return;
        }
        const absDelta = bestAbs;
        const timing = (best.t - now) > 0 ? 'EARLY' : 'LATE';
        if (absDelta <= CENTERED_MS) {
          best.status = 'hit';
          best.el.classList.add('beat--perfect');
          state.combo += 1;
          state.hits += 1;
          setGroove(state.groove + 10 + Math.min(8, state.combo));
          state.score += scoreFor('centered');
          chime(528, 0.22);
          setTimeout(() => chime(792, 0.16), 42);
          pad(132, 0.72);
          drum(108, 0.18);
          buzz(8);
          flashJudgement('CENTERED', '#f1f1ee');
        } else {
          best.status = 'hit';
          best.el.classList.add('beat--good');
          state.combo += 1;
          state.hits += 1;
          setGroove(state.groove + 5 + Math.min(4, Math.floor(state.combo / 2)));
          state.score += scoreFor('drift');
          chime(396, 0.2);
          pad(99, 0.5);
          drum(86, 0.14);
          buzz(5);
          flashJudgement('DRIFT · ' + timing, best.color || '#9bd7c7');
        }
        best.el.classList.remove('beat--in-window');
        window.setTimeout(() => { best.el.classList.add('beat--judged'); }, 180);
        window.setTimeout(() => { hideBeat(best); }, 320);
        updateHud();
      }

      function finalSummary() {
        const pct = total ? Math.round((state.hits / total) * 100) : 0;
        const prior = readBest();
        const run = {
          score: state.score,
          hits: state.hits,
          total: total,
          maxCombo: state.maxCombo,
          at: new Date().toISOString(),
        };
        let newBest = false;
        if (!prior || run.score > prior.score) { writeBest(run); newBest = true; }
        paintBest();
        return 'COMPLETE · ' + state.score + ' attention · ' + state.hits + '/' + total + ' marks (' + pct + '%) · longest thread ×' + state.maxCombo + (newBest ? ' · NEW MEMORY' : '');
      }

      /* ============== Controls ============== */
      btnStart.addEventListener('click', attempt);
      btnRestart.addEventListener('click', () => { location.reload(); });
      hitBtn.addEventListener('click', attempt);
      // Keyboard: SPACE hits a beat. Capture phase so we win against any
      // inner handler (including iframe focus-stealing) before the event
      // reaches a passive listener.
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
          // Don't intercept space when the user is typing into an input.
          const t = e.target;
          const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
          if (tag === 'input' || tag === 'textarea' || (t && t.isContentEditable)) return;
          e.preventDefault();
          e.stopPropagation();
          attempt();
        }
      }, { capture: true });

      // Belt-and-suspenders: if focus drifts back to the iframe, pull it off.
      document.addEventListener('focusin', (e) => {
        if (state.started && e.target && e.target.tagName === 'IFRAME') {
          try { hitBtn.focus({ preventScroll: true }); } catch {}
        }
      });

      /* ============== Kick off ============== */
      paintBest();
      loadYT();
    })();
  <\/script> `])), maybeRenderHead(), addAttribute(`/b/${data.id}`, "href"), data.id, addAttribute(`color: ${ch.color800}`, "style"), ch.code, data.id, data.title, data.dek, addAttribute(totalBeats, "data-total-beats"), addAttribute(durationSec, "data-duration"), ytId ? renderTemplate`<div class="yt-mount" id="yee-player"${addAttribute(ytId, "data-yt")} data-astro-cid-yl5eoznr></div>` : renderTemplate`<div class="yt-fallback" data-astro-cid-yl5eoznr>Video source unavailable — beats will still play along to silent clock.</div>`, Math.floor(durationSec / 60), String(durationSec % 60).padStart(2, "0"), totalBeats, addAttribute(`Listening track — ${cueName} drift from top, mark SPACE near the raised line`, "aria-label"), cueName, addAttribute(`/b/${data.id}`, "href"), legendTitle, legendItems.map((item) => renderTemplate`<li data-astro-cid-yl5eoznr><span class="swatch"${addAttribute(`background: ${item.color}`, "style")} data-astro-cid-yl5eoznr></span> ${item.label} · <strong data-astro-cid-yl5eoznr>${item.word}</strong></li>`), legendNote, data.meta?.creator ?? "—", data.meta?.source ?? "—", data.meta?.duration ?? "—", addAttribute(`/b/${data.id}`, "href"), data.id, addAttribute(`/b/${data.id}.json`, "href"), data.id, unescapeHTML(JSON.stringify(beats))) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yee/[id].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yee/[id].astro";
const $$url = "/yee/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
