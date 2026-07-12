import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumSolo = createComponent(($$result, $$props, $$slots) => {
  const title = "DRUM SOLO — solo rhythm campaign with achievements";
  const description = "A Guitar-Hero-style rhythm campaign on PointCast. Tap the lanes as notes fall, build combos, clear tracks, unlock achievements, share your accomplishments. Solo practice for the drum hub.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/drum-solo",
    name: "PointCast Drum Solo · Rhythm Campaign",
    url: "https://pointcast.xyz/drum-solo",
    description,
    applicationCategory: "GameApplication",
    genre: "Rhythm game"
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    // ───────────────────────────────────────────────────────────────
    // Identity + persistence
    // ───────────────────────────────────────────────────────────────
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

    var DEFAULT_STATE = {
      totalTaps: 0,
      totalHits: 0,
      bestCombo: 0,
      daysPlayed: [],
      tracks: {
        pebble: { cleared: false, bestScore: 0, bestAccuracy: 0, perfect: false },
        river:  { cleared: false, bestScore: 0, bestAccuracy: 0, perfect: false },
        wave:   { cleared: false, bestScore: 0, bestAccuracy: 0, perfect: false },
      },
      achievements: {},
    };
    function loadState() {
      try {
        var raw = localStorage.getItem('pc:solo');
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
        var parsed = JSON.parse(raw);
        return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
      } catch (e) { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
    }
    function saveState() {
      try { localStorage.setItem('pc:solo', JSON.stringify(state)); } catch (e) {}
    }
    var state = loadState();
    // Mark today's session day
    var todayKey = new Date().toISOString().slice(0, 10);
    if (state.daysPlayed.indexOf(todayKey) === -1) {
      state.daysPlayed.push(todayKey);
      saveState();
    }

    // ───────────────────────────────────────────────────────────────
    // Achievements
    // ───────────────────────────────────────────────────────────────
    var ACHIEVEMENTS = [
      { id: 'first-tap',     glyph: '👆',  name: 'First Tap',           hint: 'play a single note' },
      { id: 'combo-10',      glyph: '🔥',  name: 'Combo 10',            hint: '10 hits in a row' },
      { id: 'combo-25',      glyph: '⚡',  name: 'Combo 25',            hint: '25 hits in a row' },
      { id: 'combo-50',      glyph: '🌟',  name: 'Combo 50',            hint: '50 hits in a row' },
      { id: 'pebble-clear',  glyph: '🪨',  name: 'Pebble Cleared',      hint: 'finish track 1' },
      { id: 'river-clear',   glyph: '🏞️',  name: 'River Cleared',       hint: 'finish track 2' },
      { id: 'wave-clear',    glyph: '🌊',  name: 'Wave Cleared',        hint: 'finish track 3' },
      { id: 'perfect-track', glyph: '💎',  name: 'Perfect Track',       hint: '90%+ accuracy on any track' },
      { id: 'hundred-taps',  glyph: '💯',  name: '100 Total Taps',      hint: 'across all sessions' },
      { id: 'thousand-taps', glyph: '🎯',  name: '1,000 Total Taps',    hint: 'across all sessions' },
      { id: 'three-days',    glyph: '🗓️',  name: 'Three Days Played',   hint: 'come back, build a habit' },
      { id: 'campaign',      glyph: '🏆',  name: 'Campaign Cleared',    hint: 'all three tracks cleared' },
    ];

    function awardAchievement(id) {
      if (state.achievements[id]) return false;
      state.achievements[id] = { earnedAt: Date.now() };
      saveState();
      return true;
    }

    function checkAchievements(ctx) {
      var newly = [];
      // first-tap
      if (state.totalTaps >= 1 && awardAchievement('first-tap')) newly.push('first-tap');
      if (state.bestCombo >= 10 && awardAchievement('combo-10')) newly.push('combo-10');
      if (state.bestCombo >= 25 && awardAchievement('combo-25')) newly.push('combo-25');
      if (state.bestCombo >= 50 && awardAchievement('combo-50')) newly.push('combo-50');
      if (state.totalTaps >= 100 && awardAchievement('hundred-taps')) newly.push('hundred-taps');
      if (state.totalTaps >= 1000 && awardAchievement('thousand-taps')) newly.push('thousand-taps');
      if (state.daysPlayed.length >= 3 && awardAchievement('three-days')) newly.push('three-days');
      if (ctx && ctx.cleared) {
        var clearMap = { pebble: 'pebble-clear', river: 'river-clear', wave: 'wave-clear' };
        var cid = clearMap[ctx.trackId];
        if (cid && awardAchievement(cid)) newly.push(cid);
        if (ctx.accuracy >= 0.9 && awardAchievement('perfect-track')) newly.push('perfect-track');
      }
      var allClear = state.tracks.pebble.cleared && state.tracks.river.cleared && state.tracks.wave.cleared;
      if (allClear && awardAchievement('campaign')) newly.push('campaign');
      return newly;
    }

    // ───────────────────────────────────────────────────────────────
    // Tracks (deterministic patterns)
    // ───────────────────────────────────────────────────────────────
    var TRACKS = {
      pebble: {
        id: 'pebble', name: 'Pebble', bpm: 60, lanes: [2], // single lane (K)
        notes: (function () {
          var arr = [];
          var beatMs = 60000 / 60;
          for (var i = 0; i < 16; i++) arr.push({ lane: 2, t: i * beatMs + 1500 });
          return arr;
        })(),
        durationMs: 16 * 1000 + 2500,
        nounSeed: 156,
      },
      river: {
        id: 'river', name: 'River', bpm: 90, lanes: [0, 1, 2, 3],
        notes: (function () {
          var arr = [];
          var beatMs = 60000 / 90;
          // 12 bars × 4 beats each = 48 notes, alternating-ish pattern
          var pattern = [0, 2, 1, 3, 0, 2, 1, 3, 1, 2, 0, 3];
          for (var bar = 0; bar < 12; bar++) {
            for (var b = 0; b < 4; b++) {
              arr.push({ lane: pattern[(bar + b) % pattern.length], t: (bar * 4 + b) * beatMs + 1500 });
            }
          }
          return arr;
        })(),
        durationMs: 12 * 4 * (60000 / 90) + 2500,
        nounSeed: 805,
      },
      wave: {
        id: 'wave', name: 'Wave', bpm: 120, lanes: [0, 1, 2, 3],
        notes: (function () {
          var arr = [];
          var beatMs = 60000 / 120;
          // 96 notes — polyrhythmic-ish pattern with eighths
          var pattern = [0, 1, 2, 3, 1, 2, 0, 3, 2, 0, 3, 1, 0, 2, 1, 3];
          for (var i = 0; i < 96; i++) {
            arr.push({ lane: pattern[i % pattern.length], t: i * (beatMs * 0.5) + 1500 });
          }
          return arr;
        })(),
        durationMs: 96 * (60000 / 120) * 0.5 + 2500,
        nounSeed: 42,
      },
    };

    // ───────────────────────────────────────────────────────────────
    // Web Audio engine — synthesized lane sounds + clock
    // ───────────────────────────────────────────────────────────────
    var audioCtx = null;
    function ensureAudio() {
      if (audioCtx) return audioCtx;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { audioCtx = null; }
      return audioCtx;
    }
    var LANE_FREQS = [110, 165, 220, 330]; // A2, E3, A3, E4 — simple fifths
    var LANE_TYPES = ['triangle', 'square', 'sawtooth', 'sine'];
    function playLaneTone(lane, duration) {
      var ctx = ensureAudio();
      if (!ctx) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = LANE_TYPES[lane % LANE_TYPES.length];
      osc.frequency.setValueAtTime(LANE_FREQS[lane % LANE_FREQS.length], now);
      // Quick pitch drop for a percussive feel
      osc.frequency.exponentialRampToValueAtTime(LANE_FREQS[lane] * 0.5, now + (duration || 0.18));
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (duration || 0.2));
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (duration || 0.22));
    }
    function playMissBeep() {
      var ctx = ensureAudio();
      if (!ctx) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(80, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.13);
    }

    // ───────────────────────────────────────────────────────────────
    // Game engine
    // ───────────────────────────────────────────────────────────────
    var view = 'hub'; // 'hub' | 'game' | 'result'
    var canvas = document.getElementById('ds-canvas');
    var ctx2d = canvas.getContext('2d');
    var stage = document.getElementById('ds-stage');
    var floaters = document.getElementById('ds-floaters');
    var hud = {
      score: document.getElementById('ds-hud-score'),
      combo: document.getElementById('ds-hud-combo'),
      hits: document.getElementById('ds-hud-hits'),
      misses: document.getElementById('ds-hud-misses'),
      acc: document.getElementById('ds-hud-acc'),
      time: document.getElementById('ds-hud-time'),
      track: document.getElementById('ds-hud-track-name'),
    };
    var pads = Array.from(document.querySelectorAll('.ds__pad'));

    // Lane palette
    var LANE_COLORS = ['#ff5cd5', '#ffd400', '#22d3ee', '#7cf26b'];

    var game = null;     // current game state
    var raf = null;
    var startTs = 0;     // performance.now() at game start
    var pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resizeCanvas() {
      if (!canvas) return;
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * pixelRatio);
      canvas.height = Math.floor(rect.height * pixelRatio);
    }
    window.addEventListener('resize', resizeCanvas);

    function startGame(trackId) {
      var t = TRACKS[trackId];
      if (!t) return;
      view = 'game';
      document.getElementById('ds-main').dataset.view = 'game';
      document.getElementById('ds-hub').hidden = true;
      document.getElementById('ds-game').hidden = false;
      document.getElementById('ds-result').hidden = true;
      hud.track.textContent = t.name;
      // Reset HUD
      hud.score.textContent = '0';
      hud.combo.textContent = '0';
      hud.hits.textContent = '0';
      hud.misses.textContent = '0';
      hud.acc.textContent = '100%';
      hud.time.textContent = '0:00';
      // Build game state
      game = {
        track: t,
        // Notes: copy + add \`state\` ('pending' | 'hit' | 'miss')
        notes: t.notes.map(function (n, i) {
          return { lane: n.lane, t: n.t, idx: i, status: 'pending', hitDelta: 0 };
        }),
        score: 0,
        combo: 0,
        bestCombo: 0,
        hits: 0,
        misses: 0,
        startedAt: 0,    // set on first frame
        lastFrameAt: 0,
        ended: false,
      };
      ensureAudio();
      resizeCanvas();
      raf = requestAnimationFrame(loop);
    }

    function endGame() {
      if (!game || game.ended) return;
      game.ended = true;
      cancelAnimationFrame(raf);
      raf = null;
      var totalNotes = game.notes.length;
      var hits = game.hits;
      var misses = game.misses + game.notes.filter(function (n) { return n.status === 'pending'; }).length;
      var accuracy = totalNotes > 0 ? hits / totalNotes : 0;
      // Cleared = at least 50% hit rate (lenient — campaign is uplifting)
      var cleared = accuracy >= 0.5;
      var perfect = accuracy >= 0.9;
      // Persist
      state.totalTaps += hits + misses; // any user input we registered
      state.totalHits += hits;
      if (game.bestCombo > state.bestCombo) state.bestCombo = game.bestCombo;
      var rec = state.tracks[game.track.id];
      if (rec) {
        if (cleared) rec.cleared = true;
        if (game.score > rec.bestScore) rec.bestScore = game.score;
        if (accuracy > rec.bestAccuracy) rec.bestAccuracy = accuracy;
        if (perfect) rec.perfect = true;
      }
      saveState();
      var newAchievements = checkAchievements({ trackId: game.track.id, cleared: cleared, accuracy: accuracy });
      // Show result
      showResult({
        trackId: game.track.id,
        trackName: game.track.name,
        score: game.score,
        bestCombo: game.bestCombo,
        hits: hits,
        total: totalNotes,
        accuracy: accuracy,
        cleared: cleared,
        perfect: perfect,
        newAchievements: newAchievements,
      });
    }

    function showResult(r) {
      view = 'result';
      document.getElementById('ds-main').dataset.view = 'result';
      document.getElementById('ds-hub').hidden = true;
      document.getElementById('ds-game').hidden = true;
      document.getElementById('ds-result').hidden = false;
      document.getElementById('ds-result-status').textContent = r.cleared
        ? (r.perfect ? '★ PERFECT TRACK ★' : '✓ TRACK CLEARED')
        : '✗ TRY AGAIN';
      document.getElementById('ds-result-track').textContent = r.trackName;
      var accPct = Math.round(r.accuracy * 100);
      document.getElementById('ds-result-acc').textContent = accPct + '%';
      document.getElementById('ds-result-score').textContent = r.score.toLocaleString();
      document.getElementById('ds-result-combo').textContent = String(r.bestCombo);
      document.getElementById('ds-result-hits').textContent = String(r.hits);
      document.getElementById('ds-result-total').textContent = String(r.total);
      document.getElementById('ds-result-perfect').textContent = r.perfect ? '★ yes' : 'no';
      // Animate the ring
      var ring = document.getElementById('ds-result-ring-fill');
      var circ = 326.7;
      ring.style.transition = 'stroke-dashoffset 1100ms cubic-bezier(0.2, 0.8, 0.4, 1), stroke 600ms';
      ring.style.stroke = r.perfect ? '#ffd400' : r.cleared ? '#5fdb6e' : '#d6346a';
      requestAnimationFrame(function () {
        ring.style.strokeDashoffset = String(circ - circ * Math.min(1, r.accuracy));
      });
      // Achievements list
      var achList = document.getElementById('ds-result-ach');
      if (achList) {
        if (r.newAchievements && r.newAchievements.length) {
          achList.innerHTML = '<li class="ds__result-ach-head mono">★ NEW ACHIEVEMENTS</li>' +
            r.newAchievements.map(function (id) {
              var a = ACHIEVEMENTS.find(function (x) { return x.id === id; });
              return a ? '<li class="ds__result-ach-row"><span class="ds__result-ach-glyph">' + a.glyph + '</span><span><strong>' + a.name + '</strong> · <span class="mono">' + a.hint + '</span></span></li>' : '';
            }).join('');
        } else {
          achList.innerHTML = '';
        }
      }
      // Show "next track" button if applicable
      var next = nextTrackId(r.trackId);
      var nextBtn = document.getElementById('ds-result-next');
      if (nextBtn) {
        if (r.cleared && next && state.tracks[next]) {
          nextBtn.hidden = false;
          nextBtn.dataset.next = next;
        } else {
          nextBtn.hidden = true;
        }
      }
      // Triumphant haptic
      try {
        if (navigator.vibrate) {
          if (r.perfect) navigator.vibrate([20, 60, 30, 60, 80]);
          else if (r.cleared) navigator.vibrate([20, 80, 40]);
          else navigator.vibrate(20);
        }
      } catch (e) {}
      // Refresh hub data so when user navigates back it reflects
      renderHub();
    }
    function nextTrackId(id) {
      if (id === 'pebble') return 'river';
      if (id === 'river') return 'wave';
      return null;
    }

    function backToHub() {
      view = 'hub';
      document.getElementById('ds-main').dataset.view = 'hub';
      document.getElementById('ds-hub').hidden = false;
      document.getElementById('ds-game').hidden = true;
      document.getElementById('ds-result').hidden = true;
      renderHub();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Tap input ────────────────────────────────────────────────
    function tapLane(lane, eventTs) {
      if (view !== 'game' || !game || game.ended) return;
      var pad = pads[lane];
      if (pad) {
        pad.classList.remove('ds__pad--hit'); void pad.offsetWidth;
        pad.classList.add('ds__pad--hit');
      }
      // Find the closest active note in this lane within ±200ms of the
      // hit zone.
      var now = (eventTs || performance.now()) - game.startedAt;
      var bestNote = null;
      var bestDelta = Infinity;
      for (var i = 0; i < game.notes.length; i++) {
        var n = game.notes[i];
        if (n.status !== 'pending' || n.lane !== lane) continue;
        var delta = Math.abs(n.t - now);
        if (delta < bestDelta) { bestDelta = delta; bestNote = n; }
      }
      if (bestNote && bestDelta <= 220) {
        bestNote.status = 'hit';
        bestNote.hitDelta = bestDelta;
        var grade = bestDelta <= 60 ? 'perfect' : bestDelta <= 130 ? 'good' : 'late';
        var pts = grade === 'perfect' ? 100 : grade === 'good' ? 60 : 30;
        game.score += pts + Math.floor(game.combo * 1.5);
        game.combo += 1;
        game.bestCombo = Math.max(game.bestCombo, game.combo);
        game.hits += 1;
        playLaneTone(lane);
        floatText((grade === 'perfect' ? '★ PERFECT' : grade === 'good' ? '✓ GOOD' : '· late ·') + ' +' + pts, lane, grade);
        try { if (navigator.vibrate) navigator.vibrate(grade === 'perfect' ? [12, 8, 12] : 8); } catch (e) {}
        // Combo milestones
        if (game.combo === 10 || game.combo === 25 || game.combo === 50) {
          floatText('🔥 ' + game.combo + ' COMBO', lane, 'combo');
          try { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); } catch (e) {}
        }
      } else {
        // No matching note → record a miss
        game.misses += 1;
        game.combo = 0;
        playMissBeep();
        floatText('· miss ·', lane, 'miss');
        try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {}
      }
      updateHud();
    }

    function updateHud() {
      if (!game) return;
      hud.score.textContent = game.score.toLocaleString();
      hud.combo.textContent = String(game.combo);
      hud.hits.textContent = String(game.hits);
      hud.misses.textContent = String(game.misses);
      var attempts = game.hits + game.misses;
      var acc = attempts > 0 ? Math.round((game.hits / attempts) * 100) : 100;
      hud.acc.textContent = acc + '%';
    }

    function floatText(txt, lane, kind) {
      var div = document.createElement('div');
      div.className = 'ds__floater ds__floater--' + (kind || 'good');
      div.style.setProperty('--lane', String(lane));
      div.textContent = txt;
      floaters.appendChild(div);
      setTimeout(function () { if (div.parentNode) div.parentNode.removeChild(div); }, 1100);
    }

    // ── Render loop ──────────────────────────────────────────────
    function loop(ts) {
      if (!game || game.ended) return;
      if (game.startedAt === 0) game.startedAt = ts;
      var elapsed = ts - game.startedAt;
      // Time HUD
      hud.time.textContent = (function (ms) {
        var s = Math.floor(ms / 1000);
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      })(elapsed);
      // Auto-miss notes that have passed the hit window without being tapped
      for (var i = 0; i < game.notes.length; i++) {
        var n = game.notes[i];
        if (n.status === 'pending' && n.t + 220 < elapsed) {
          n.status = 'miss';
          game.misses += 1;
          game.combo = 0;
        }
      }
      updateHud();
      drawStage(elapsed);
      // End condition: all notes resolved AND elapsed > duration
      var allResolved = game.notes.every(function (n) { return n.status !== 'pending'; });
      if (allResolved && elapsed > game.track.durationMs) {
        endGame();
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function drawStage(elapsed) {
      var W = canvas.width;
      var H = canvas.height;
      ctx2d.clearRect(0, 0, W, H);
      // Background gradient
      var bg = ctx2d.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0612');
      bg.addColorStop(1, '#1a1028');
      ctx2d.fillStyle = bg;
      ctx2d.fillRect(0, 0, W, H);

      var laneCount = 4;
      var laneWidth = W / laneCount;
      // Fall time = how long a note takes to travel from spawn to hit zone.
      var FALL_MS = 1500;
      var hitY = H - 80 * pixelRatio;
      var spawnY = -40 * pixelRatio;

      // Draw lane dividers
      ctx2d.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx2d.lineWidth = 1;
      for (var l = 1; l < laneCount; l++) {
        ctx2d.beginPath();
        ctx2d.moveTo(l * laneWidth, 0);
        ctx2d.lineTo(l * laneWidth, H);
        ctx2d.stroke();
      }
      // Draw hit zone
      ctx2d.fillStyle = 'rgba(255,255,255,0.06)';
      ctx2d.fillRect(0, hitY - 28 * pixelRatio, W, 56 * pixelRatio);
      ctx2d.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();
      ctx2d.moveTo(0, hitY);
      ctx2d.lineTo(W, hitY);
      ctx2d.stroke();

      // Draw notes
      for (var i = 0; i < game.notes.length; i++) {
        var n = game.notes[i];
        if (n.status !== 'pending') continue;
        var msUntilHit = n.t - elapsed;
        if (msUntilHit > FALL_MS) continue; // not yet visible
        if (msUntilHit < -300) continue;     // gone already
        var progress = 1 - (msUntilHit / FALL_MS); // 0..1
        var y = spawnY + (hitY - spawnY) * progress;
        var x = n.lane * laneWidth + laneWidth / 2;
        var noteH = 36 * pixelRatio;
        var noteW = laneWidth * 0.7;
        // Note body
        ctx2d.fillStyle = LANE_COLORS[n.lane];
        ctx2d.fillRect(x - noteW / 2, y - noteH / 2, noteW, noteH);
        // Note border
        ctx2d.strokeStyle = '#0a0612';
        ctx2d.lineWidth = 3;
        ctx2d.strokeRect(x - noteW / 2, y - noteH / 2, noteW, noteH);
        // Glow when near hit zone
        if (Math.abs(y - hitY) < 50 * pixelRatio) {
          ctx2d.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx2d.fillRect(x - noteW / 2, y - noteH / 2, noteW, noteH);
        }
      }
    }

    // ── Inputs ──────────────────────────────────────────────────
    var KEY_TO_LANE = { 'a': 0, 's': 1, 'k': 2, 'l': 3 };
    window.addEventListener('keydown', function (e) {
      if (view !== 'game') return;
      if (e.repeat) return;
      var lane = KEY_TO_LANE[e.key.toLowerCase()];
      if (lane !== undefined) {
        tapLane(lane, performance.now());
        e.preventDefault();
      }
    });
    pads.forEach(function (pad) {
      var lane = Number(pad.dataset.lane);
      pad.addEventListener('mousedown', function (e) { tapLane(lane, performance.now()); e.preventDefault(); });
      pad.addEventListener('touchstart', function (e) { tapLane(lane, performance.now()); e.preventDefault(); }, { passive: false });
    });

    // ── HUD back button + result actions ───────────────────────
    document.getElementById('ds-hud-back').addEventListener('click', function () {
      cancelAnimationFrame(raf); raf = null;
      if (game) game.ended = true;
      backToHub();
    });
    document.getElementById('ds-result-retry').addEventListener('click', function () {
      if (!game) return;
      var t = game.track.id;
      startGame(t);
    });
    document.getElementById('ds-result-next').addEventListener('click', function (e) {
      var n = e.currentTarget.dataset.next;
      if (n) startGame(n);
    });
    document.getElementById('ds-result-hub').addEventListener('click', backToHub);
    document.getElementById('ds-result-share').addEventListener('click', function () {
      if (!game) return;
      var attempts = game.hits + game.misses;
      var acc = attempts > 0 ? Math.round((game.hits / attempts) * 100) : 0;
      var msg = '🥁 cleared ' + game.track.name + ' on Drum Solo · ' + acc + '% · best combo ' + game.bestCombo + ' · pointcast.xyz/drum-solo';
      var url = window.location.origin + '/drum-solo';
      var statusEl = document.getElementById('ds-result-share-status');
      function setStatus(s) {
        if (statusEl) statusEl.textContent = s || ' ';
        if (s) setTimeout(function () { if (statusEl.textContent === s) statusEl.textContent = ' '; }, 2200);
      }
      if (navigator.share) {
        navigator.share({ title: 'Drum Solo', text: msg, url: url })
          .then(function () { setStatus('✓ shared'); })
          .catch(function (err) {
            if (err && err.name === 'AbortError') return;
            try { navigator.clipboard.writeText(msg + ' ' + url); setStatus('✓ copied'); } catch (e) { setStatus('✗ unavailable'); }
          });
      } else {
        try { navigator.clipboard.writeText(msg + ' ' + url); setStatus('✓ copied'); } catch (e) { setStatus('✗ unavailable'); }
      }
    });

    // ── Hub rendering ──────────────────────────────────────────
    function renderHub() {
      // Identity
      var idNoun = document.getElementById('ds-id-noun');
      if (idNoun) {
        idNoun.src = 'https://noun.pics/' + myNoun + '.svg';
        idNoun.alt = 'Your Noun ' + myNoun;
        idNoun.style.imageRendering = 'pixelated';
      }
      document.getElementById('ds-id-noun-id').textContent = String(myNoun);
      document.getElementById('ds-id-taps').textContent = String(state.totalTaps);
      document.getElementById('ds-id-combo').textContent = String(state.bestCombo);
      var clearedCount = ['pebble','river','wave'].filter(function (id) { return state.tracks[id].cleared; }).length;
      document.getElementById('ds-id-cleared').textContent = String(clearedCount);
      // Streak
      var streakEl = document.getElementById('ds-id-streak');
      if (streakEl) {
        var n = state.daysPlayed.length;
        streakEl.textContent = n === 1 ? '— first session —' : '★ ' + n + ' days played';
      }
      // Track results + unlocks
      ['pebble','river','wave'].forEach(function (id, idx) {
        var rec = state.tracks[id];
        var resultEl = document.getElementById('ds-track-' + id + '-result');
        if (resultEl) {
          if (rec.cleared) {
            var pct = Math.round((rec.bestAccuracy || 0) * 100);
            resultEl.textContent = (rec.perfect ? '★ ' : '✓ ') + 'cleared · ' + pct + '% · ' + rec.bestScore.toLocaleString() + ' pts';
          } else {
            // locked unless previous track is cleared (or this is pebble)
            var prereq = idx === 0 ? null : (idx === 1 ? 'pebble' : 'river');
            var locked = prereq && !state.tracks[prereq].cleared;
            resultEl.textContent = locked ? '— locked · clear ' + prereq + ' first —' : '— not yet played —';
          }
        }
        var li = document.getElementById('ds-track-' + id);
        var btn = document.querySelector('[data-go="' + id + '"]');
        var prereq2 = idx === 0 ? null : (idx === 1 ? 'pebble' : 'river');
        var locked2 = prereq2 && !state.tracks[prereq2].cleared;
        if (li && id !== 'pebble') {
          li.classList.toggle('ds__track--locked', !!locked2);
        }
        if (btn) {
          btn.disabled = !!locked2;
          btn.textContent = locked2 ? '▸ locked' : (rec.cleared ? '▸ replay' : '▸ play');
        }
      });
      // Achievements
      var achGrid = document.getElementById('ds-ach-grid');
      var earnedIds = Object.keys(state.achievements);
      document.getElementById('ds-ach-count').textContent = String(earnedIds.length);
      if (achGrid) {
        achGrid.innerHTML = ACHIEVEMENTS.map(function (a) {
          var earned = !!state.achievements[a.id];
          return '<li class="ds__ach-cell' + (earned ? ' ds__ach-cell--earned' : '') + '">' +
                 '<span class="ds__ach-glyph">' + (earned ? a.glyph : '🔒') + '</span>' +
                 '<span class="ds__ach-name">' + a.name + '</span>' +
                 '<span class="ds__ach-hint mono">' + a.hint + '</span>' +
                 '</li>';
        }).join('');
      }
      // Team
      var teamRow = document.getElementById('ds-team-row');
      if (teamRow) {
        var teamSeeds = [];
        if (state.tracks.pebble.cleared) teamSeeds.push(156);
        if (state.tracks.river.cleared) teamSeeds.push(805);
        if (state.tracks.wave.cleared) teamSeeds.push(42);
        if (teamSeeds.length === 0) {
          teamRow.innerHTML = '<span class="ds__team-empty mono">— clear a track to earn a noun —</span>';
        } else {
          teamRow.innerHTML = teamSeeds.map(function (n) {
            return '<span class="ds__team-cell">' +
                   '<img src="https://noun.pics/' + n + '.svg" alt="Noun ' + n + '" width="56" height="56" loading="lazy" />' +
                   '<span class="ds__team-cell-tag mono">noun ' + n + '</span>' +
                   '</span>';
          }).join('');
        }
      }
    }

    // ── Hook up track "go" buttons (initial + after re-render) ──
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-go]');
      if (!btn || btn.disabled) return;
      startGame(btn.dataset.go);
    });

    // Initial render
    renderHub();
    checkAchievements();
    renderHub();
  })();
<\/script>`], ["", ` <script>
  (function () {
    'use strict';

    // ───────────────────────────────────────────────────────────────
    // Identity + persistence
    // ───────────────────────────────────────────────────────────────
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

    var DEFAULT_STATE = {
      totalTaps: 0,
      totalHits: 0,
      bestCombo: 0,
      daysPlayed: [],
      tracks: {
        pebble: { cleared: false, bestScore: 0, bestAccuracy: 0, perfect: false },
        river:  { cleared: false, bestScore: 0, bestAccuracy: 0, perfect: false },
        wave:   { cleared: false, bestScore: 0, bestAccuracy: 0, perfect: false },
      },
      achievements: {},
    };
    function loadState() {
      try {
        var raw = localStorage.getItem('pc:solo');
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
        var parsed = JSON.parse(raw);
        return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
      } catch (e) { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
    }
    function saveState() {
      try { localStorage.setItem('pc:solo', JSON.stringify(state)); } catch (e) {}
    }
    var state = loadState();
    // Mark today's session day
    var todayKey = new Date().toISOString().slice(0, 10);
    if (state.daysPlayed.indexOf(todayKey) === -1) {
      state.daysPlayed.push(todayKey);
      saveState();
    }

    // ───────────────────────────────────────────────────────────────
    // Achievements
    // ───────────────────────────────────────────────────────────────
    var ACHIEVEMENTS = [
      { id: 'first-tap',     glyph: '👆',  name: 'First Tap',           hint: 'play a single note' },
      { id: 'combo-10',      glyph: '🔥',  name: 'Combo 10',            hint: '10 hits in a row' },
      { id: 'combo-25',      glyph: '⚡',  name: 'Combo 25',            hint: '25 hits in a row' },
      { id: 'combo-50',      glyph: '🌟',  name: 'Combo 50',            hint: '50 hits in a row' },
      { id: 'pebble-clear',  glyph: '🪨',  name: 'Pebble Cleared',      hint: 'finish track 1' },
      { id: 'river-clear',   glyph: '🏞️',  name: 'River Cleared',       hint: 'finish track 2' },
      { id: 'wave-clear',    glyph: '🌊',  name: 'Wave Cleared',        hint: 'finish track 3' },
      { id: 'perfect-track', glyph: '💎',  name: 'Perfect Track',       hint: '90%+ accuracy on any track' },
      { id: 'hundred-taps',  glyph: '💯',  name: '100 Total Taps',      hint: 'across all sessions' },
      { id: 'thousand-taps', glyph: '🎯',  name: '1,000 Total Taps',    hint: 'across all sessions' },
      { id: 'three-days',    glyph: '🗓️',  name: 'Three Days Played',   hint: 'come back, build a habit' },
      { id: 'campaign',      glyph: '🏆',  name: 'Campaign Cleared',    hint: 'all three tracks cleared' },
    ];

    function awardAchievement(id) {
      if (state.achievements[id]) return false;
      state.achievements[id] = { earnedAt: Date.now() };
      saveState();
      return true;
    }

    function checkAchievements(ctx) {
      var newly = [];
      // first-tap
      if (state.totalTaps >= 1 && awardAchievement('first-tap')) newly.push('first-tap');
      if (state.bestCombo >= 10 && awardAchievement('combo-10')) newly.push('combo-10');
      if (state.bestCombo >= 25 && awardAchievement('combo-25')) newly.push('combo-25');
      if (state.bestCombo >= 50 && awardAchievement('combo-50')) newly.push('combo-50');
      if (state.totalTaps >= 100 && awardAchievement('hundred-taps')) newly.push('hundred-taps');
      if (state.totalTaps >= 1000 && awardAchievement('thousand-taps')) newly.push('thousand-taps');
      if (state.daysPlayed.length >= 3 && awardAchievement('three-days')) newly.push('three-days');
      if (ctx && ctx.cleared) {
        var clearMap = { pebble: 'pebble-clear', river: 'river-clear', wave: 'wave-clear' };
        var cid = clearMap[ctx.trackId];
        if (cid && awardAchievement(cid)) newly.push(cid);
        if (ctx.accuracy >= 0.9 && awardAchievement('perfect-track')) newly.push('perfect-track');
      }
      var allClear = state.tracks.pebble.cleared && state.tracks.river.cleared && state.tracks.wave.cleared;
      if (allClear && awardAchievement('campaign')) newly.push('campaign');
      return newly;
    }

    // ───────────────────────────────────────────────────────────────
    // Tracks (deterministic patterns)
    // ───────────────────────────────────────────────────────────────
    var TRACKS = {
      pebble: {
        id: 'pebble', name: 'Pebble', bpm: 60, lanes: [2], // single lane (K)
        notes: (function () {
          var arr = [];
          var beatMs = 60000 / 60;
          for (var i = 0; i < 16; i++) arr.push({ lane: 2, t: i * beatMs + 1500 });
          return arr;
        })(),
        durationMs: 16 * 1000 + 2500,
        nounSeed: 156,
      },
      river: {
        id: 'river', name: 'River', bpm: 90, lanes: [0, 1, 2, 3],
        notes: (function () {
          var arr = [];
          var beatMs = 60000 / 90;
          // 12 bars × 4 beats each = 48 notes, alternating-ish pattern
          var pattern = [0, 2, 1, 3, 0, 2, 1, 3, 1, 2, 0, 3];
          for (var bar = 0; bar < 12; bar++) {
            for (var b = 0; b < 4; b++) {
              arr.push({ lane: pattern[(bar + b) % pattern.length], t: (bar * 4 + b) * beatMs + 1500 });
            }
          }
          return arr;
        })(),
        durationMs: 12 * 4 * (60000 / 90) + 2500,
        nounSeed: 805,
      },
      wave: {
        id: 'wave', name: 'Wave', bpm: 120, lanes: [0, 1, 2, 3],
        notes: (function () {
          var arr = [];
          var beatMs = 60000 / 120;
          // 96 notes — polyrhythmic-ish pattern with eighths
          var pattern = [0, 1, 2, 3, 1, 2, 0, 3, 2, 0, 3, 1, 0, 2, 1, 3];
          for (var i = 0; i < 96; i++) {
            arr.push({ lane: pattern[i % pattern.length], t: i * (beatMs * 0.5) + 1500 });
          }
          return arr;
        })(),
        durationMs: 96 * (60000 / 120) * 0.5 + 2500,
        nounSeed: 42,
      },
    };

    // ───────────────────────────────────────────────────────────────
    // Web Audio engine — synthesized lane sounds + clock
    // ───────────────────────────────────────────────────────────────
    var audioCtx = null;
    function ensureAudio() {
      if (audioCtx) return audioCtx;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { audioCtx = null; }
      return audioCtx;
    }
    var LANE_FREQS = [110, 165, 220, 330]; // A2, E3, A3, E4 — simple fifths
    var LANE_TYPES = ['triangle', 'square', 'sawtooth', 'sine'];
    function playLaneTone(lane, duration) {
      var ctx = ensureAudio();
      if (!ctx) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = LANE_TYPES[lane % LANE_TYPES.length];
      osc.frequency.setValueAtTime(LANE_FREQS[lane % LANE_FREQS.length], now);
      // Quick pitch drop for a percussive feel
      osc.frequency.exponentialRampToValueAtTime(LANE_FREQS[lane] * 0.5, now + (duration || 0.18));
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (duration || 0.2));
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (duration || 0.22));
    }
    function playMissBeep() {
      var ctx = ensureAudio();
      if (!ctx) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(80, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.13);
    }

    // ───────────────────────────────────────────────────────────────
    // Game engine
    // ───────────────────────────────────────────────────────────────
    var view = 'hub'; // 'hub' | 'game' | 'result'
    var canvas = document.getElementById('ds-canvas');
    var ctx2d = canvas.getContext('2d');
    var stage = document.getElementById('ds-stage');
    var floaters = document.getElementById('ds-floaters');
    var hud = {
      score: document.getElementById('ds-hud-score'),
      combo: document.getElementById('ds-hud-combo'),
      hits: document.getElementById('ds-hud-hits'),
      misses: document.getElementById('ds-hud-misses'),
      acc: document.getElementById('ds-hud-acc'),
      time: document.getElementById('ds-hud-time'),
      track: document.getElementById('ds-hud-track-name'),
    };
    var pads = Array.from(document.querySelectorAll('.ds__pad'));

    // Lane palette
    var LANE_COLORS = ['#ff5cd5', '#ffd400', '#22d3ee', '#7cf26b'];

    var game = null;     // current game state
    var raf = null;
    var startTs = 0;     // performance.now() at game start
    var pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resizeCanvas() {
      if (!canvas) return;
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * pixelRatio);
      canvas.height = Math.floor(rect.height * pixelRatio);
    }
    window.addEventListener('resize', resizeCanvas);

    function startGame(trackId) {
      var t = TRACKS[trackId];
      if (!t) return;
      view = 'game';
      document.getElementById('ds-main').dataset.view = 'game';
      document.getElementById('ds-hub').hidden = true;
      document.getElementById('ds-game').hidden = false;
      document.getElementById('ds-result').hidden = true;
      hud.track.textContent = t.name;
      // Reset HUD
      hud.score.textContent = '0';
      hud.combo.textContent = '0';
      hud.hits.textContent = '0';
      hud.misses.textContent = '0';
      hud.acc.textContent = '100%';
      hud.time.textContent = '0:00';
      // Build game state
      game = {
        track: t,
        // Notes: copy + add \\\`state\\\` ('pending' | 'hit' | 'miss')
        notes: t.notes.map(function (n, i) {
          return { lane: n.lane, t: n.t, idx: i, status: 'pending', hitDelta: 0 };
        }),
        score: 0,
        combo: 0,
        bestCombo: 0,
        hits: 0,
        misses: 0,
        startedAt: 0,    // set on first frame
        lastFrameAt: 0,
        ended: false,
      };
      ensureAudio();
      resizeCanvas();
      raf = requestAnimationFrame(loop);
    }

    function endGame() {
      if (!game || game.ended) return;
      game.ended = true;
      cancelAnimationFrame(raf);
      raf = null;
      var totalNotes = game.notes.length;
      var hits = game.hits;
      var misses = game.misses + game.notes.filter(function (n) { return n.status === 'pending'; }).length;
      var accuracy = totalNotes > 0 ? hits / totalNotes : 0;
      // Cleared = at least 50% hit rate (lenient — campaign is uplifting)
      var cleared = accuracy >= 0.5;
      var perfect = accuracy >= 0.9;
      // Persist
      state.totalTaps += hits + misses; // any user input we registered
      state.totalHits += hits;
      if (game.bestCombo > state.bestCombo) state.bestCombo = game.bestCombo;
      var rec = state.tracks[game.track.id];
      if (rec) {
        if (cleared) rec.cleared = true;
        if (game.score > rec.bestScore) rec.bestScore = game.score;
        if (accuracy > rec.bestAccuracy) rec.bestAccuracy = accuracy;
        if (perfect) rec.perfect = true;
      }
      saveState();
      var newAchievements = checkAchievements({ trackId: game.track.id, cleared: cleared, accuracy: accuracy });
      // Show result
      showResult({
        trackId: game.track.id,
        trackName: game.track.name,
        score: game.score,
        bestCombo: game.bestCombo,
        hits: hits,
        total: totalNotes,
        accuracy: accuracy,
        cleared: cleared,
        perfect: perfect,
        newAchievements: newAchievements,
      });
    }

    function showResult(r) {
      view = 'result';
      document.getElementById('ds-main').dataset.view = 'result';
      document.getElementById('ds-hub').hidden = true;
      document.getElementById('ds-game').hidden = true;
      document.getElementById('ds-result').hidden = false;
      document.getElementById('ds-result-status').textContent = r.cleared
        ? (r.perfect ? '★ PERFECT TRACK ★' : '✓ TRACK CLEARED')
        : '✗ TRY AGAIN';
      document.getElementById('ds-result-track').textContent = r.trackName;
      var accPct = Math.round(r.accuracy * 100);
      document.getElementById('ds-result-acc').textContent = accPct + '%';
      document.getElementById('ds-result-score').textContent = r.score.toLocaleString();
      document.getElementById('ds-result-combo').textContent = String(r.bestCombo);
      document.getElementById('ds-result-hits').textContent = String(r.hits);
      document.getElementById('ds-result-total').textContent = String(r.total);
      document.getElementById('ds-result-perfect').textContent = r.perfect ? '★ yes' : 'no';
      // Animate the ring
      var ring = document.getElementById('ds-result-ring-fill');
      var circ = 326.7;
      ring.style.transition = 'stroke-dashoffset 1100ms cubic-bezier(0.2, 0.8, 0.4, 1), stroke 600ms';
      ring.style.stroke = r.perfect ? '#ffd400' : r.cleared ? '#5fdb6e' : '#d6346a';
      requestAnimationFrame(function () {
        ring.style.strokeDashoffset = String(circ - circ * Math.min(1, r.accuracy));
      });
      // Achievements list
      var achList = document.getElementById('ds-result-ach');
      if (achList) {
        if (r.newAchievements && r.newAchievements.length) {
          achList.innerHTML = '<li class="ds__result-ach-head mono">★ NEW ACHIEVEMENTS</li>' +
            r.newAchievements.map(function (id) {
              var a = ACHIEVEMENTS.find(function (x) { return x.id === id; });
              return a ? '<li class="ds__result-ach-row"><span class="ds__result-ach-glyph">' + a.glyph + '</span><span><strong>' + a.name + '</strong> · <span class="mono">' + a.hint + '</span></span></li>' : '';
            }).join('');
        } else {
          achList.innerHTML = '';
        }
      }
      // Show "next track" button if applicable
      var next = nextTrackId(r.trackId);
      var nextBtn = document.getElementById('ds-result-next');
      if (nextBtn) {
        if (r.cleared && next && state.tracks[next]) {
          nextBtn.hidden = false;
          nextBtn.dataset.next = next;
        } else {
          nextBtn.hidden = true;
        }
      }
      // Triumphant haptic
      try {
        if (navigator.vibrate) {
          if (r.perfect) navigator.vibrate([20, 60, 30, 60, 80]);
          else if (r.cleared) navigator.vibrate([20, 80, 40]);
          else navigator.vibrate(20);
        }
      } catch (e) {}
      // Refresh hub data so when user navigates back it reflects
      renderHub();
    }
    function nextTrackId(id) {
      if (id === 'pebble') return 'river';
      if (id === 'river') return 'wave';
      return null;
    }

    function backToHub() {
      view = 'hub';
      document.getElementById('ds-main').dataset.view = 'hub';
      document.getElementById('ds-hub').hidden = false;
      document.getElementById('ds-game').hidden = true;
      document.getElementById('ds-result').hidden = true;
      renderHub();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Tap input ────────────────────────────────────────────────
    function tapLane(lane, eventTs) {
      if (view !== 'game' || !game || game.ended) return;
      var pad = pads[lane];
      if (pad) {
        pad.classList.remove('ds__pad--hit'); void pad.offsetWidth;
        pad.classList.add('ds__pad--hit');
      }
      // Find the closest active note in this lane within ±200ms of the
      // hit zone.
      var now = (eventTs || performance.now()) - game.startedAt;
      var bestNote = null;
      var bestDelta = Infinity;
      for (var i = 0; i < game.notes.length; i++) {
        var n = game.notes[i];
        if (n.status !== 'pending' || n.lane !== lane) continue;
        var delta = Math.abs(n.t - now);
        if (delta < bestDelta) { bestDelta = delta; bestNote = n; }
      }
      if (bestNote && bestDelta <= 220) {
        bestNote.status = 'hit';
        bestNote.hitDelta = bestDelta;
        var grade = bestDelta <= 60 ? 'perfect' : bestDelta <= 130 ? 'good' : 'late';
        var pts = grade === 'perfect' ? 100 : grade === 'good' ? 60 : 30;
        game.score += pts + Math.floor(game.combo * 1.5);
        game.combo += 1;
        game.bestCombo = Math.max(game.bestCombo, game.combo);
        game.hits += 1;
        playLaneTone(lane);
        floatText((grade === 'perfect' ? '★ PERFECT' : grade === 'good' ? '✓ GOOD' : '· late ·') + ' +' + pts, lane, grade);
        try { if (navigator.vibrate) navigator.vibrate(grade === 'perfect' ? [12, 8, 12] : 8); } catch (e) {}
        // Combo milestones
        if (game.combo === 10 || game.combo === 25 || game.combo === 50) {
          floatText('🔥 ' + game.combo + ' COMBO', lane, 'combo');
          try { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); } catch (e) {}
        }
      } else {
        // No matching note → record a miss
        game.misses += 1;
        game.combo = 0;
        playMissBeep();
        floatText('· miss ·', lane, 'miss');
        try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {}
      }
      updateHud();
    }

    function updateHud() {
      if (!game) return;
      hud.score.textContent = game.score.toLocaleString();
      hud.combo.textContent = String(game.combo);
      hud.hits.textContent = String(game.hits);
      hud.misses.textContent = String(game.misses);
      var attempts = game.hits + game.misses;
      var acc = attempts > 0 ? Math.round((game.hits / attempts) * 100) : 100;
      hud.acc.textContent = acc + '%';
    }

    function floatText(txt, lane, kind) {
      var div = document.createElement('div');
      div.className = 'ds__floater ds__floater--' + (kind || 'good');
      div.style.setProperty('--lane', String(lane));
      div.textContent = txt;
      floaters.appendChild(div);
      setTimeout(function () { if (div.parentNode) div.parentNode.removeChild(div); }, 1100);
    }

    // ── Render loop ──────────────────────────────────────────────
    function loop(ts) {
      if (!game || game.ended) return;
      if (game.startedAt === 0) game.startedAt = ts;
      var elapsed = ts - game.startedAt;
      // Time HUD
      hud.time.textContent = (function (ms) {
        var s = Math.floor(ms / 1000);
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      })(elapsed);
      // Auto-miss notes that have passed the hit window without being tapped
      for (var i = 0; i < game.notes.length; i++) {
        var n = game.notes[i];
        if (n.status === 'pending' && n.t + 220 < elapsed) {
          n.status = 'miss';
          game.misses += 1;
          game.combo = 0;
        }
      }
      updateHud();
      drawStage(elapsed);
      // End condition: all notes resolved AND elapsed > duration
      var allResolved = game.notes.every(function (n) { return n.status !== 'pending'; });
      if (allResolved && elapsed > game.track.durationMs) {
        endGame();
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function drawStage(elapsed) {
      var W = canvas.width;
      var H = canvas.height;
      ctx2d.clearRect(0, 0, W, H);
      // Background gradient
      var bg = ctx2d.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0612');
      bg.addColorStop(1, '#1a1028');
      ctx2d.fillStyle = bg;
      ctx2d.fillRect(0, 0, W, H);

      var laneCount = 4;
      var laneWidth = W / laneCount;
      // Fall time = how long a note takes to travel from spawn to hit zone.
      var FALL_MS = 1500;
      var hitY = H - 80 * pixelRatio;
      var spawnY = -40 * pixelRatio;

      // Draw lane dividers
      ctx2d.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx2d.lineWidth = 1;
      for (var l = 1; l < laneCount; l++) {
        ctx2d.beginPath();
        ctx2d.moveTo(l * laneWidth, 0);
        ctx2d.lineTo(l * laneWidth, H);
        ctx2d.stroke();
      }
      // Draw hit zone
      ctx2d.fillStyle = 'rgba(255,255,255,0.06)';
      ctx2d.fillRect(0, hitY - 28 * pixelRatio, W, 56 * pixelRatio);
      ctx2d.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();
      ctx2d.moveTo(0, hitY);
      ctx2d.lineTo(W, hitY);
      ctx2d.stroke();

      // Draw notes
      for (var i = 0; i < game.notes.length; i++) {
        var n = game.notes[i];
        if (n.status !== 'pending') continue;
        var msUntilHit = n.t - elapsed;
        if (msUntilHit > FALL_MS) continue; // not yet visible
        if (msUntilHit < -300) continue;     // gone already
        var progress = 1 - (msUntilHit / FALL_MS); // 0..1
        var y = spawnY + (hitY - spawnY) * progress;
        var x = n.lane * laneWidth + laneWidth / 2;
        var noteH = 36 * pixelRatio;
        var noteW = laneWidth * 0.7;
        // Note body
        ctx2d.fillStyle = LANE_COLORS[n.lane];
        ctx2d.fillRect(x - noteW / 2, y - noteH / 2, noteW, noteH);
        // Note border
        ctx2d.strokeStyle = '#0a0612';
        ctx2d.lineWidth = 3;
        ctx2d.strokeRect(x - noteW / 2, y - noteH / 2, noteW, noteH);
        // Glow when near hit zone
        if (Math.abs(y - hitY) < 50 * pixelRatio) {
          ctx2d.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx2d.fillRect(x - noteW / 2, y - noteH / 2, noteW, noteH);
        }
      }
    }

    // ── Inputs ──────────────────────────────────────────────────
    var KEY_TO_LANE = { 'a': 0, 's': 1, 'k': 2, 'l': 3 };
    window.addEventListener('keydown', function (e) {
      if (view !== 'game') return;
      if (e.repeat) return;
      var lane = KEY_TO_LANE[e.key.toLowerCase()];
      if (lane !== undefined) {
        tapLane(lane, performance.now());
        e.preventDefault();
      }
    });
    pads.forEach(function (pad) {
      var lane = Number(pad.dataset.lane);
      pad.addEventListener('mousedown', function (e) { tapLane(lane, performance.now()); e.preventDefault(); });
      pad.addEventListener('touchstart', function (e) { tapLane(lane, performance.now()); e.preventDefault(); }, { passive: false });
    });

    // ── HUD back button + result actions ───────────────────────
    document.getElementById('ds-hud-back').addEventListener('click', function () {
      cancelAnimationFrame(raf); raf = null;
      if (game) game.ended = true;
      backToHub();
    });
    document.getElementById('ds-result-retry').addEventListener('click', function () {
      if (!game) return;
      var t = game.track.id;
      startGame(t);
    });
    document.getElementById('ds-result-next').addEventListener('click', function (e) {
      var n = e.currentTarget.dataset.next;
      if (n) startGame(n);
    });
    document.getElementById('ds-result-hub').addEventListener('click', backToHub);
    document.getElementById('ds-result-share').addEventListener('click', function () {
      if (!game) return;
      var attempts = game.hits + game.misses;
      var acc = attempts > 0 ? Math.round((game.hits / attempts) * 100) : 0;
      var msg = '🥁 cleared ' + game.track.name + ' on Drum Solo · ' + acc + '% · best combo ' + game.bestCombo + ' · pointcast.xyz/drum-solo';
      var url = window.location.origin + '/drum-solo';
      var statusEl = document.getElementById('ds-result-share-status');
      function setStatus(s) {
        if (statusEl) statusEl.textContent = s || ' ';
        if (s) setTimeout(function () { if (statusEl.textContent === s) statusEl.textContent = ' '; }, 2200);
      }
      if (navigator.share) {
        navigator.share({ title: 'Drum Solo', text: msg, url: url })
          .then(function () { setStatus('✓ shared'); })
          .catch(function (err) {
            if (err && err.name === 'AbortError') return;
            try { navigator.clipboard.writeText(msg + ' ' + url); setStatus('✓ copied'); } catch (e) { setStatus('✗ unavailable'); }
          });
      } else {
        try { navigator.clipboard.writeText(msg + ' ' + url); setStatus('✓ copied'); } catch (e) { setStatus('✗ unavailable'); }
      }
    });

    // ── Hub rendering ──────────────────────────────────────────
    function renderHub() {
      // Identity
      var idNoun = document.getElementById('ds-id-noun');
      if (idNoun) {
        idNoun.src = 'https://noun.pics/' + myNoun + '.svg';
        idNoun.alt = 'Your Noun ' + myNoun;
        idNoun.style.imageRendering = 'pixelated';
      }
      document.getElementById('ds-id-noun-id').textContent = String(myNoun);
      document.getElementById('ds-id-taps').textContent = String(state.totalTaps);
      document.getElementById('ds-id-combo').textContent = String(state.bestCombo);
      var clearedCount = ['pebble','river','wave'].filter(function (id) { return state.tracks[id].cleared; }).length;
      document.getElementById('ds-id-cleared').textContent = String(clearedCount);
      // Streak
      var streakEl = document.getElementById('ds-id-streak');
      if (streakEl) {
        var n = state.daysPlayed.length;
        streakEl.textContent = n === 1 ? '— first session —' : '★ ' + n + ' days played';
      }
      // Track results + unlocks
      ['pebble','river','wave'].forEach(function (id, idx) {
        var rec = state.tracks[id];
        var resultEl = document.getElementById('ds-track-' + id + '-result');
        if (resultEl) {
          if (rec.cleared) {
            var pct = Math.round((rec.bestAccuracy || 0) * 100);
            resultEl.textContent = (rec.perfect ? '★ ' : '✓ ') + 'cleared · ' + pct + '% · ' + rec.bestScore.toLocaleString() + ' pts';
          } else {
            // locked unless previous track is cleared (or this is pebble)
            var prereq = idx === 0 ? null : (idx === 1 ? 'pebble' : 'river');
            var locked = prereq && !state.tracks[prereq].cleared;
            resultEl.textContent = locked ? '— locked · clear ' + prereq + ' first —' : '— not yet played —';
          }
        }
        var li = document.getElementById('ds-track-' + id);
        var btn = document.querySelector('[data-go="' + id + '"]');
        var prereq2 = idx === 0 ? null : (idx === 1 ? 'pebble' : 'river');
        var locked2 = prereq2 && !state.tracks[prereq2].cleared;
        if (li && id !== 'pebble') {
          li.classList.toggle('ds__track--locked', !!locked2);
        }
        if (btn) {
          btn.disabled = !!locked2;
          btn.textContent = locked2 ? '▸ locked' : (rec.cleared ? '▸ replay' : '▸ play');
        }
      });
      // Achievements
      var achGrid = document.getElementById('ds-ach-grid');
      var earnedIds = Object.keys(state.achievements);
      document.getElementById('ds-ach-count').textContent = String(earnedIds.length);
      if (achGrid) {
        achGrid.innerHTML = ACHIEVEMENTS.map(function (a) {
          var earned = !!state.achievements[a.id];
          return '<li class="ds__ach-cell' + (earned ? ' ds__ach-cell--earned' : '') + '">' +
                 '<span class="ds__ach-glyph">' + (earned ? a.glyph : '🔒') + '</span>' +
                 '<span class="ds__ach-name">' + a.name + '</span>' +
                 '<span class="ds__ach-hint mono">' + a.hint + '</span>' +
                 '</li>';
        }).join('');
      }
      // Team
      var teamRow = document.getElementById('ds-team-row');
      if (teamRow) {
        var teamSeeds = [];
        if (state.tracks.pebble.cleared) teamSeeds.push(156);
        if (state.tracks.river.cleared) teamSeeds.push(805);
        if (state.tracks.wave.cleared) teamSeeds.push(42);
        if (teamSeeds.length === 0) {
          teamRow.innerHTML = '<span class="ds__team-empty mono">— clear a track to earn a noun —</span>';
        } else {
          teamRow.innerHTML = teamSeeds.map(function (n) {
            return '<span class="ds__team-cell">' +
                   '<img src="https://noun.pics/' + n + '.svg" alt="Noun ' + n + '" width="56" height="56" loading="lazy" />' +
                   '<span class="ds__team-cell-tag mono">noun ' + n + '</span>' +
                   '</span>';
          }).join('');
        }
      }
    }

    // ── Hook up track "go" buttons (initial + after re-render) ──
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-go]');
      if (!btn || btn.disabled) return;
      startGame(btn.dataset.go);
    });

    // Initial render
    renderHub();
    checkAchievements();
    renderHub();
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum.png", "jsonLd": jsonLd, "data-astro-cid-zjfk2u7r": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ds" id="ds-main" data-view="hub" data-astro-cid-zjfk2u7r> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "solo", "data-astro-cid-zjfk2u7r": true })} <header class="ds__head" data-astro-cid-zjfk2u7r> <p class="ds__kicker mono" data-astro-cid-zjfk2u7r>★ DRUM HUB · SOLO CAMPAIGN · YOUR PRIVATE PRACTICE ★</p> <h1 class="ds__title" data-astro-cid-zjfk2u7r>drum <em data-astro-cid-zjfk2u7r>solo</em></h1> <p class="ds__strap mono" data-astro-cid-zjfk2u7r>tap the lanes · clear the tracks · earn the nouns · share the win</p> </header>  <section class="ds__hub" id="ds-hub" data-astro-cid-zjfk2u7r>  <div class="ds__id" data-astro-cid-zjfk2u7r> <div class="ds__id-noun-wrap" data-astro-cid-zjfk2u7r> <img class="ds__id-noun" id="ds-id-noun" src="" alt="Your Noun" width="96" height="96" data-astro-cid-zjfk2u7r> </div> <div class="ds__id-body" data-astro-cid-zjfk2u7r> <p class="ds__id-tag mono" data-astro-cid-zjfk2u7r>YOU · NOUN <strong id="ds-id-noun-id" data-astro-cid-zjfk2u7r>—</strong></p> <p class="ds__id-stats mono" data-astro-cid-zjfk2u7r> <span data-astro-cid-zjfk2u7r><strong id="ds-id-taps" data-astro-cid-zjfk2u7r>0</strong> taps</span> <span class="ds__id-sep" data-astro-cid-zjfk2u7r>·</span> <span data-astro-cid-zjfk2u7r><strong id="ds-id-combo" data-astro-cid-zjfk2u7r>0</strong> best combo</span> <span class="ds__id-sep" data-astro-cid-zjfk2u7r>·</span> <span data-astro-cid-zjfk2u7r><strong id="ds-id-cleared" data-astro-cid-zjfk2u7r>0</strong>/3 tracks cleared</span> </p> <p class="ds__id-streak mono" id="ds-id-streak" data-astro-cid-zjfk2u7r>— first session —</p> </div> </div>  <section class="ds__tracks" aria-label="Tracks" data-astro-cid-zjfk2u7r> <p class="ds__eyebrow mono" data-astro-cid-zjfk2u7r>▌ CAMPAIGN · 3 TRACKS</p> <ol class="ds__track-list" role="list" data-astro-cid-zjfk2u7r> <li class="ds__track" data-track="pebble" data-astro-cid-zjfk2u7r> <div class="ds__track-noun-wrap" data-astro-cid-zjfk2u7r> <img class="ds__track-noun" src="https://noun.pics/156.svg" alt="" width="64" height="64" loading="lazy" data-astro-cid-zjfk2u7r> </div> <div class="ds__track-body" data-astro-cid-zjfk2u7r> <p class="ds__track-tag mono" data-astro-cid-zjfk2u7r>★ TRACK 1 · WARM-UP</p> <h3 class="ds__track-name" data-astro-cid-zjfk2u7r>Pebble</h3> <p class="ds__track-desc" data-astro-cid-zjfk2u7r>Eight quiet notes. Find the pulse. Anyone clears this.</p> <p class="ds__track-meta mono" data-astro-cid-zjfk2u7r> <span data-astro-cid-zjfk2u7r>60 BPM · 16 notes · 1 lane</span> <span class="ds__track-result" id="ds-track-pebble-result" data-astro-cid-zjfk2u7r>— not yet played —</span> </p> </div> <button type="button" class="ds__track-go ds__btn ds__btn--magenta" data-go="pebble" data-astro-cid-zjfk2u7r>▸ play</button> </li> <li class="ds__track ds__track--locked" data-track="river" id="ds-track-river" data-astro-cid-zjfk2u7r> <div class="ds__track-noun-wrap" data-astro-cid-zjfk2u7r> <img class="ds__track-noun" src="https://noun.pics/805.svg" alt="" width="64" height="64" loading="lazy" data-astro-cid-zjfk2u7r> </div> <div class="ds__track-body" data-astro-cid-zjfk2u7r> <p class="ds__track-tag mono" data-astro-cid-zjfk2u7r>★ TRACK 2 · BUILDING</p> <h3 class="ds__track-name" data-astro-cid-zjfk2u7r>River</h3> <p class="ds__track-desc" data-astro-cid-zjfk2u7r>Four lanes. A loop. Find the river. Two minutes long.</p> <p class="ds__track-meta mono" data-astro-cid-zjfk2u7r> <span data-astro-cid-zjfk2u7r>90 BPM · 48 notes · 4 lanes</span> <span class="ds__track-result" id="ds-track-river-result" data-astro-cid-zjfk2u7r>— locked · clear Pebble first —</span> </p> </div> <button type="button" class="ds__track-go ds__btn" data-go="river" disabled data-astro-cid-zjfk2u7r>▸ locked</button> </li> <li class="ds__track ds__track--locked" data-track="wave" id="ds-track-wave" data-astro-cid-zjfk2u7r> <div class="ds__track-noun-wrap" data-astro-cid-zjfk2u7r> <img class="ds__track-noun" src="https://noun.pics/42.svg" alt="" width="64" height="64" loading="lazy" data-astro-cid-zjfk2u7r> </div> <div class="ds__track-body" data-astro-cid-zjfk2u7r> <p class="ds__track-tag mono" data-astro-cid-zjfk2u7r>★ TRACK 3 · WAVE</p> <h3 class="ds__track-name" data-astro-cid-zjfk2u7r>Wave</h3> <p class="ds__track-desc" data-astro-cid-zjfk2u7r>Polyrhythm. Big patterns. Hold your breath.</p> <p class="ds__track-meta mono" data-astro-cid-zjfk2u7r> <span data-astro-cid-zjfk2u7r>120 BPM · 96 notes · 4 lanes</span> <span class="ds__track-result" id="ds-track-wave-result" data-astro-cid-zjfk2u7r>— locked · clear River first —</span> </p> </div> <button type="button" class="ds__track-go ds__btn" data-go="wave" disabled data-astro-cid-zjfk2u7r>▸ locked</button> </li> </ol> </section>  <section class="ds__ach" aria-label="Achievements" data-astro-cid-zjfk2u7r> <p class="ds__eyebrow mono" data-astro-cid-zjfk2u7r>★ ACHIEVEMENTS · <span id="ds-ach-count" data-astro-cid-zjfk2u7r>0</span> / 12</p> <ul class="ds__ach-grid" id="ds-ach-grid" role="list" data-astro-cid-zjfk2u7r>  </ul> </section>  <section class="ds__team" aria-label="Your team" data-astro-cid-zjfk2u7r> <p class="ds__eyebrow mono" data-astro-cid-zjfk2u7r>☞ YOUR TEAM · NOUNS YOU'VE EARNED</p> <div class="ds__team-row" id="ds-team-row" data-astro-cid-zjfk2u7r> <span class="ds__team-empty mono" data-astro-cid-zjfk2u7r>— clear a track to earn a noun —</span> </div> </section> <p class="ds__hub-foot mono" data-astro-cid-zjfk2u7r>
progress saves locally · clear with 90%+ accuracy for a perfect ★
</p> </section>  <section class="ds__game" id="ds-game" hidden data-astro-cid-zjfk2u7r> <div class="ds__hud" data-astro-cid-zjfk2u7r> <button type="button" class="ds__hud-back" id="ds-hud-back" aria-label="Back to hub" data-astro-cid-zjfk2u7r>← hub</button> <p class="ds__hud-track" id="ds-hud-track-name" data-astro-cid-zjfk2u7r>Pebble</p> <p class="ds__hud-score mono" data-astro-cid-zjfk2u7r><strong id="ds-hud-score" data-astro-cid-zjfk2u7r>0</strong></p> </div> <div class="ds__hud-line" data-astro-cid-zjfk2u7r> <p class="ds__hud-meter mono" data-astro-cid-zjfk2u7r> <span data-astro-cid-zjfk2u7r>combo <strong id="ds-hud-combo" aria-live="polite" data-astro-cid-zjfk2u7r>0</strong></span> <span class="ds__hud-sep" data-astro-cid-zjfk2u7r>·</span> <span data-astro-cid-zjfk2u7r>hits <strong id="ds-hud-hits" data-astro-cid-zjfk2u7r>0</strong></span> <span class="ds__hud-sep" data-astro-cid-zjfk2u7r>·</span> <span data-astro-cid-zjfk2u7r>misses <strong id="ds-hud-misses" data-astro-cid-zjfk2u7r>0</strong></span> <span class="ds__hud-sep" data-astro-cid-zjfk2u7r>·</span> <span data-astro-cid-zjfk2u7r>acc <strong id="ds-hud-acc" data-astro-cid-zjfk2u7r>100%</strong></span> </p> <p class="ds__hud-time mono" data-astro-cid-zjfk2u7r><strong id="ds-hud-time" data-astro-cid-zjfk2u7r>0:00</strong></p> </div> <div class="ds__stage" id="ds-stage" aria-label="Falling notes" data-astro-cid-zjfk2u7r> <canvas class="ds__canvas" id="ds-canvas" width="800" height="700" data-astro-cid-zjfk2u7r></canvas> <div class="ds__lane-keys" aria-hidden="true" data-astro-cid-zjfk2u7r> <span class="ds__lane-key mono" data-lane="0" data-astro-cid-zjfk2u7r>A</span> <span class="ds__lane-key mono" data-lane="1" data-astro-cid-zjfk2u7r>S</span> <span class="ds__lane-key mono" data-lane="2" data-astro-cid-zjfk2u7r>K</span> <span class="ds__lane-key mono" data-lane="3" data-astro-cid-zjfk2u7r>L</span> </div> </div> <div class="ds__pads" id="ds-pads" data-astro-cid-zjfk2u7r> <button type="button" class="ds__pad ds__pad--0" data-lane="0" aria-label="Lane A" data-astro-cid-zjfk2u7r></button> <button type="button" class="ds__pad ds__pad--1" data-lane="1" aria-label="Lane S" data-astro-cid-zjfk2u7r></button> <button type="button" class="ds__pad ds__pad--2" data-lane="2" aria-label="Lane K" data-astro-cid-zjfk2u7r></button> <button type="button" class="ds__pad ds__pad--3" data-lane="3" aria-label="Lane L" data-astro-cid-zjfk2u7r></button> </div> <div class="ds__floaters" id="ds-floaters" aria-hidden="true" data-astro-cid-zjfk2u7r></div> </section>  <section class="ds__result" id="ds-result" hidden data-astro-cid-zjfk2u7r> <div class="ds__result-card" data-astro-cid-zjfk2u7r> <p class="ds__eyebrow mono" id="ds-result-status" data-astro-cid-zjfk2u7r>★ TRACK CLEARED ★</p> <h2 class="ds__result-track" id="ds-result-track" data-astro-cid-zjfk2u7r>Pebble</h2> <div class="ds__result-ring-wrap" data-astro-cid-zjfk2u7r> <svg class="ds__result-ring" viewBox="0 0 120 120" aria-hidden="true" data-astro-cid-zjfk2u7r> <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.15)" stroke-width="10" fill="none" data-astro-cid-zjfk2u7r></circle> <circle id="ds-result-ring-fill" cx="60" cy="60" r="52" stroke="#5fdb6e" stroke-width="10" fill="none" stroke-dasharray="326.7" stroke-dashoffset="326.7" stroke-linecap="round" transform="rotate(-90 60 60)" data-astro-cid-zjfk2u7r></circle> </svg> <div class="ds__result-ring-num" data-astro-cid-zjfk2u7r> <strong id="ds-result-acc" data-astro-cid-zjfk2u7r>0%</strong> <span class="mono" data-astro-cid-zjfk2u7r>accuracy</span> </div> </div> <dl class="ds__result-stats mono" data-astro-cid-zjfk2u7r> <div class="ds__result-stat" data-astro-cid-zjfk2u7r><dt data-astro-cid-zjfk2u7r>score</dt><dd id="ds-result-score" data-astro-cid-zjfk2u7r>0</dd></div> <div class="ds__result-stat" data-astro-cid-zjfk2u7r><dt data-astro-cid-zjfk2u7r>best combo</dt><dd id="ds-result-combo" data-astro-cid-zjfk2u7r>0</dd></div> <div class="ds__result-stat" data-astro-cid-zjfk2u7r><dt data-astro-cid-zjfk2u7r>hits / total</dt><dd data-astro-cid-zjfk2u7r><span id="ds-result-hits" data-astro-cid-zjfk2u7r>0</span> / <span id="ds-result-total" data-astro-cid-zjfk2u7r>0</span></dd></div> <div class="ds__result-stat" data-astro-cid-zjfk2u7r><dt data-astro-cid-zjfk2u7r>perfect ★</dt><dd id="ds-result-perfect" data-astro-cid-zjfk2u7r>no</dd></div> </dl> <ul class="ds__result-ach" id="ds-result-ach" role="list" data-astro-cid-zjfk2u7r></ul> <div class="ds__result-row" data-astro-cid-zjfk2u7r> <button type="button" class="ds__btn ds__btn--magenta" id="ds-result-retry" data-astro-cid-zjfk2u7r>▸ retry</button> <button type="button" class="ds__btn" id="ds-result-next" hidden data-astro-cid-zjfk2u7r>▸ next track</button> <button type="button" class="ds__btn" id="ds-result-share" data-astro-cid-zjfk2u7r>▸ share</button> <button type="button" class="ds__btn ds__btn--ghost" id="ds-result-hub" data-astro-cid-zjfk2u7r>← hub</button> </div> <p class="ds__result-share-status mono" id="ds-result-share-status" data-astro-cid-zjfk2u7r>&nbsp;</p> </div> </section> <footer class="ds__foot" data-astro-cid-zjfk2u7r> <p class="mono" data-astro-cid-zjfk2u7r>DRUM SOLO · v0.1 · 2026-04-30 · pointcast.xyz/drum-solo · progress saves locally · part of <a href="/drum-press" data-astro-cid-zjfk2u7r>drum press</a></p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-solo.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-solo.astro";
const $$url = "/drum-solo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumSolo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
