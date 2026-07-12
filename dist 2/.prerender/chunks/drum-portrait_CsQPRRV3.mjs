import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumPortrait = createComponent(($$result, $$props, $$slots) => {
  const title = "DRUM PORTRAIT — your generative rhythm fingerprint";
  const description = "A personal take-home from a 15-second drumming session on PointCast. Tap any rhythm, and the page renders a generative SVG portrait — your Noun in the center, concentric rings from your tap timings, hue from your tempo. Save, share, or stamp it to the room. A drum fingerprint that's yours alone.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/drum-portrait",
    name: "PointCast Drum Portrait · Generative Rhythm Fingerprint",
    url: "https://pointcast.xyz/drum-portrait",
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

    // ─── Hub render ─────────────────────────────────────────────
    var hub = document.getElementById('dp-hub');
    var session = document.getElementById('dp-session');
    var result = document.getElementById('dp-result');
    var idNounEl = document.getElementById('dp-id-noun');
    var idNounIdEl = document.getElementById('dp-id-noun-id');

    if (idNounEl) {
      idNounEl.src = 'https://noun.pics/' + myNoun + '.svg';
      idNounEl.alt = 'Your Noun ' + myNoun;
      idNounEl.style.imageRendering = 'pixelated';
    }
    if (idNounIdEl) idNounIdEl.textContent = String(myNoun);

    // ─── Web Audio — synthesized tap tone ───────────────────────
    var actx = null;
    function ensureAudio() {
      if (actx) return actx;
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = null; }
      return actx;
    }
    function playTapTone(velocity) {
      var ctx = ensureAudio();
      if (!ctx) return;
      var t0 = ctx.currentTime;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      // Tone shifts subtly with the tap count for a melodic-ish feel
      var freq = 220 + (velocity || 0) * 4;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + 0.18);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + 0.22);
    }

    // ─── Live canvas during session ─────────────────────────────
    var liveCanvas = document.getElementById('dp-live-canvas');
    var liveCtx = liveCanvas ? liveCanvas.getContext('2d') : null;
    var liveTapsEl = document.getElementById('dp-live-taps');
    var liveTempoEl = document.getElementById('dp-live-tempo');
    var ripples = [];
    var pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resizeLiveCanvas() {
      if (!liveCanvas) return;
      var rect = liveCanvas.getBoundingClientRect();
      liveCanvas.width = Math.floor(rect.width * pixelRatio);
      liveCanvas.height = Math.floor(rect.height * pixelRatio);
    }
    window.addEventListener('resize', resizeLiveCanvas);

    function pushRipple() {
      ripples.push({ t: performance.now(), strength: 1 });
      if (ripples.length > 80) ripples.shift();
    }
    function drawLive() {
      if (!liveCtx) return;
      var W = liveCanvas.width, H = liveCanvas.height;
      // Fade prior frame
      liveCtx.fillStyle = 'rgba(255, 245, 216, 0.18)';
      liveCtx.fillRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2;
      var now = performance.now();
      // Draw ripples
      for (var i = 0; i < ripples.length; i++) {
        var r = ripples[i];
        var age = (now - r.t) / 1200; // 1.2s lifetime
        if (age > 1) continue;
        var radius = age * Math.min(W, H) * 0.45;
        var alpha = (1 - age) * 0.6;
        liveCtx.strokeStyle = 'rgba(214, 52, 106, ' + alpha + ')';
        liveCtx.lineWidth = 3 * pixelRatio * (1 - age * 0.6);
        liveCtx.beginPath();
        liveCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        liveCtx.stroke();
      }
      // Hub center mark
      liveCtx.fillStyle = '#11100c';
      liveCtx.beginPath();
      liveCtx.arc(cx, cy, 10 * pixelRatio, 0, Math.PI * 2);
      liveCtx.fill();
    }

    // ─── Session state ─────────────────────────────────────────
    var SESSION_MS = 15000;
    var session_state = null;
    var sessionRaf = null;

    function startSession() {
      hub.hidden = true; session.hidden = false; result.hidden = true;
      document.getElementById('dp-main').dataset.view = 'session';
      ensureAudio();
      resizeLiveCanvas();
      session_state = {
        startedAt: performance.now(),
        taps: [],   // array of { t: ms-since-start }
      };
      ripples.length = 0;
      sessionRaf = requestAnimationFrame(sessionLoop);
    }
    function sessionLoop(ts) {
      if (!session_state) return;
      var elapsed = ts - session_state.startedAt;
      var remain = Math.max(0, SESSION_MS - elapsed);
      document.getElementById('dp-session-countdown').textContent = String(Math.ceil(remain / 1000));
      document.getElementById('dp-live-taps').textContent = String(session_state.taps.length);
      var tempo = computeTempo(session_state.taps);
      document.getElementById('dp-live-tempo').textContent = tempo
        ? Math.round(tempo) + ' bpm'
        : '— tempo —';
      drawLive();
      if (remain > 0) {
        sessionRaf = requestAnimationFrame(sessionLoop);
      } else {
        endSession();
      }
    }
    function tapNow() {
      if (!session_state) return;
      var now = performance.now() - session_state.startedAt;
      session_state.taps.push({ t: now });
      pushRipple();
      playTapTone(session_state.taps.length);
      try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
    }
    function endSession() {
      cancelAnimationFrame(sessionRaf); sessionRaf = null;
      var s = session_state;
      session_state = null;
      renderPortrait(s);
    }

    function computeTempo(taps) {
      if (taps.length < 4) return null;
      var intervals = [];
      for (var i = 1; i < taps.length; i++) intervals.push(taps[i].t - taps[i - 1].t);
      // Median interval is more robust than mean for noisy timing
      intervals.sort(function (a, b) { return a - b; });
      var median = intervals[Math.floor(intervals.length / 2)];
      if (median <= 0) return null;
      return 60000 / median;
    }

    // ─── Portrait render ───────────────────────────────────────
    function renderPortrait(sess) {
      hub.hidden = true; session.hidden = true; result.hidden = false;
      document.getElementById('dp-main').dataset.view = 'result';
      var taps = sess.taps;
      var tempo = computeTempo(taps);
      // Hue: shift with tempo (60 bpm = 200 / blue, 180 bpm = 0 / red)
      var hue = tempo ? Math.max(0, Math.min(360, 240 - (tempo - 60) * 2)) : 200;

      // Build the SVG composition.
      // Layout: 600x720. Top 600x600 is the rendered portrait with the
      // Noun centered. Bottom 600x120 is the signature strip.
      var svg = document.getElementById('dp-portrait');
      svg.setAttribute('viewBox', '0 0 600 720');
      var bg = '#fff5d8';
      var ink = '#11100c';
      var accent = 'hsl(' + hue + ', 70%, 50%)';
      var accentLight = 'hsl(' + hue + ', 70%, 75%)';
      var accentDeep  = 'hsl(' + hue + ', 70%, 35%)';
      var nounHref = 'https://noun.pics/' + myNoun + '.svg';

      var dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      var sig = (taps.length).toString(36).toUpperCase().padStart(2, '0') +
                '-' + Math.round(tempo || 0).toString(36).toUpperCase().padStart(2, '0') +
                '-' + (myNoun).toString(36).toUpperCase().padStart(3, '0');

      // Concentric rings — one per 4 taps (groups of beats). Each ring's
      // dot positions are derived from tap times within that group.
      var rings = [];
      var groupSize = 4;
      for (var i = 0; i < taps.length; i += groupSize) {
        var group = taps.slice(i, i + groupSize);
        if (group.length < 2) continue;
        var ringIdx = rings.length;
        var t0 = group[0].t;
        var t1 = group[group.length - 1].t;
        var span = Math.max(1, t1 - t0);
        var dots = group.map(function (tap) {
          var phase = (tap.t - t0) / span; // 0..1
          var angle = phase * Math.PI * 2 - Math.PI / 2;
          return { angle: angle };
        });
        rings.push({ idx: ringIdx, dots: dots });
      }

      // Build SVG
      var parts = [];
      // Background
      parts.push('<rect width="600" height="720" fill="' + bg + '"/>');
      // Outer frame
      parts.push('<rect x="8" y="8" width="584" height="704" fill="none" stroke="' + ink + '" stroke-width="3"/>');
      parts.push('<rect x="14" y="14" width="572" height="692" fill="none" stroke="' + accent + '" stroke-width="1.5"/>');
      // Title bar
      parts.push('<rect x="14" y="14" width="572" height="50" fill="' + accent + '"/>');
      parts.push('<text x="300" y="46" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="800" letter-spacing="6" fill="' + bg + '">DRUM PORTRAIT</text>');

      // Concentric rings (in the upper square area, centered around 300, 320)
      var cx = 300, cy = 320;
      var maxR = 240;
      var ringMaxCount = Math.max(1, rings.length);
      // draw rings
      for (var r = 0; r < rings.length; r++) {
        var radius = 80 + (r / ringMaxCount) * (maxR - 80);
        // Outline circle
        parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="' + accentLight + '" stroke-width="1" opacity="0.5"/>');
        // dots for this ring's beats
        for (var d = 0; d < rings[r].dots.length; d++) {
          var angle = rings[r].dots[d].angle;
          var dx = cx + Math.cos(angle) * radius;
          var dy = cy + Math.sin(angle) * radius;
          parts.push('<circle cx="' + dx + '" cy="' + dy + '" r="6" fill="' + accent + '" stroke="' + ink + '" stroke-width="1.5"/>');
        }
      }
      // central frame for the noun
      parts.push('<rect x="' + (cx - 60) + '" y="' + (cy - 60) + '" width="120" height="120" fill="' + bg + '" stroke="' + ink + '" stroke-width="3"/>');
      parts.push('<image href="' + nounHref + '" x="' + (cx - 56) + '" y="' + (cy - 56) + '" width="112" height="112" image-rendering="pixelated"/>');

      // Signature strip at the bottom (y 580..680)
      parts.push('<rect x="14" y="582" width="572" height="116" fill="' + accentDeep + '"/>');
      parts.push('<text x="36" y="624" font-family="Lora, Georgia, serif" font-style="italic" font-size="32" font-weight="500" fill="' + bg + '">a fingerprint of how you played today.</text>');
      parts.push('<text x="36" y="660" font-family="JetBrains Mono, ui-monospace, monospace" font-size="13" font-weight="700" letter-spacing="3" fill="' + bg + '">');
      parts.push('NOUN ' + myNoun + ' · ' + (tempo ? Math.round(tempo) + ' BPM · ' : '') + taps.length + ' TAPS · ' + dateStr.toUpperCase());
      parts.push('</text>');
      parts.push('<text x="566" y="676" text-anchor="end" font-family="JetBrains Mono, ui-monospace, monospace" font-size="10" font-weight="600" letter-spacing="2" fill="' + bg + '" opacity="0.75">');
      parts.push('SIG ' + sig + ' · pointcast.xyz/drum-portrait');
      parts.push('</text>');

      svg.innerHTML = parts.join('');

      // Result HUD
      document.getElementById('dp-result-taps').textContent = String(taps.length);
      document.getElementById('dp-result-tempo').textContent = tempo ? Math.round(tempo) + ' bpm' : '—';
      document.getElementById('dp-result-sig').textContent = sig;

      // Save to gallery
      saveToGallery({
        ts: Date.now(),
        taps: taps.length,
        tempo: tempo ? Math.round(tempo) : 0,
        sig: sig,
        hue: Math.round(hue),
        nounId: myNoun,
        // We don't store the SVG itself (size); we re-render from these
        // params on demand. The portrait is deterministic.
        tapTimings: taps.map(function (t) { return Math.round(t.t); }),
      });
      renderGallery();
    }

    // ─── Gallery (localStorage) ─────────────────────────────────
    function loadGallery() {
      try {
        var raw = localStorage.getItem('pc:portrait:gallery');
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    function saveToGallery(entry) {
      var g = loadGallery();
      g.unshift(entry);
      // Cap at 12
      g = g.slice(0, 12);
      try { localStorage.setItem('pc:portrait:gallery', JSON.stringify(g)); } catch (e) {}
    }
    function renderGallery() {
      var grid = document.getElementById('dp-gallery-grid');
      if (!grid) return;
      var g = loadGallery();
      if (g.length === 0) {
        grid.innerHTML = '<li class="dp__gallery-empty mono">— your past portraits will appear here —</li>';
        return;
      }
      grid.innerHTML = g.map(function (e, idx) {
        var d = new Date(e.ts);
        var when = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return '<li class="dp__gallery-cell">' +
               '<div class="dp__gallery-thumb" style="--hue: ' + (e.hue || 200) + '">' +
               '<img src="https://noun.pics/' + (e.nounId || 1) + '.svg" alt="" width="44" height="44" loading="lazy" />' +
               '</div>' +
               '<span class="dp__gallery-sig mono">' + (e.sig || '???') + '</span>' +
               '<span class="dp__gallery-meta mono">' + (e.tempo || 0) + ' bpm · ' + (e.taps || 0) + ' taps · ' + when + '</span>' +
               '</li>';
      }).join('');
    }
    renderGallery();

    // ─── Result actions ─────────────────────────────────────────
    function svgToBlob(callback) {
      var svg = document.getElementById('dp-portrait');
      var serialized = new XMLSerializer().serializeToString(svg);
      // Inline images need to be fetched as data URIs since canvas
      // toDataURL on a tainted canvas won't work. Inline the noun
      // SVG by fetching it.
      var imgRe = /<image href="([^"]+)" /;
      var match = imgRe.exec(serialized);
      if (!match) {
        callback(null);
        return;
      }
      fetch(match[1]).then(function (r) { return r.text(); }).then(function (innerSvg) {
        // Strip the outer <svg> tag and embed as a <g>
        var inner = innerSvg.replace(/<\\?xml[^>]*\\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\\/svg>\\s*$/, '');
        // Insert into the parent serialized SVG, replacing the <image> tag.
        var imgFullRe = /<image[^/]*\\/>/;
        // Find size of the image to compute scaling
        var size = 112;
        var x = 244, y = 264;
        var withImage = serialized.replace(imgFullRe,
          '<g transform="translate(' + x + ',' + y + ') scale(' + (size / 320) + ',' + (size / 320) + ')">' + inner + '</g>'
        );
        // Render to canvas → PNG
        var canvas = document.createElement('canvas');
        canvas.width = 600 * 2;
        canvas.height = 720 * 2;
        var ctx = canvas.getContext('2d');
        var img = new Image();
        img.onload = function () {
          ctx.fillStyle = '#fff5d8';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) { callback(blob); }, 'image/png');
        };
        img.onerror = function () { callback(null); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(withImage);
      }).catch(function () { callback(null); });
    }

    document.getElementById('dp-result-save').addEventListener('click', function () {
      var statusEl = document.getElementById('dp-result-share-status');
      statusEl.textContent = '… rendering …';
      svgToBlob(function (blob) {
        if (!blob) {
          statusEl.textContent = '✗ render failed';
          return;
        }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'drum-portrait-' + Date.now() + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        statusEl.textContent = '✓ saved';
        setTimeout(function () { if (statusEl.textContent === '✓ saved') statusEl.textContent = ' '; }, 2000);
      });
    });

    document.getElementById('dp-result-share').addEventListener('click', function () {
      var statusEl = document.getElementById('dp-result-share-status');
      var sig = document.getElementById('dp-result-sig').textContent || '';
      var taps = document.getElementById('dp-result-taps').textContent || '0';
      var tempo = document.getElementById('dp-result-tempo').textContent || '';
      var msg = '🥁 my drum portrait · ' + taps + ' taps · ' + tempo + ' · sig ' + sig + ' · pointcast.xyz/drum-portrait';
      var url = window.location.origin + '/drum-portrait';
      if (navigator.share) {
        // Try to share the PNG too
        svgToBlob(function (blob) {
          var file = blob ? new File([blob], 'drum-portrait.png', { type: 'image/png' }) : null;
          var shareData = file && navigator.canShare && navigator.canShare({ files: [file] })
            ? { title: 'Drum Portrait', text: msg, url: url, files: [file] }
            : { title: 'Drum Portrait', text: msg, url: url };
          navigator.share(shareData).then(function () {
            statusEl.textContent = '✓ shared';
            setTimeout(function () { statusEl.textContent = ' '; }, 2000);
          }).catch(function () {});
        });
      } else {
        try {
          navigator.clipboard.writeText(msg + ' ' + url);
          statusEl.textContent = '✓ copied';
        } catch (e) {
          statusEl.textContent = '✗ unavailable';
        }
        setTimeout(function () { statusEl.textContent = ' '; }, 2000);
      }
    });

    document.getElementById('dp-result-stamp').addEventListener('click', function () {
      var statusEl = document.getElementById('dp-result-share-status');
      var taps = Number(document.getElementById('dp-result-taps').textContent) || 0;
      // Stamp to room — broadcast a portrait event so other visitors see
      // that a portrait was created. type=tap is a permissive
      // /api/sounds family that should accept.
      fetch('/api/sounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tap', seed: taps, sessionId: sid }),
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (d && d.ok) statusEl.textContent = '✓ stamped to the room';
        else statusEl.textContent = '✗ ' + (d && d.reason ? d.reason : 'stamp failed');
        setTimeout(function () { statusEl.textContent = ' '; }, 2200);
      }).catch(function () { statusEl.textContent = '✗ offline'; });
    });

    document.getElementById('dp-result-again').addEventListener('click', function () {
      hub.hidden = false; session.hidden = true; result.hidden = true;
      document.getElementById('dp-main').dataset.view = 'hub';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderGallery();
    });

    // ─── Inputs ─────────────────────────────────────────────────
    document.getElementById('dp-start').addEventListener('click', startSession);
    document.getElementById('dp-pad').addEventListener('mousedown', function (e) { tapNow(); e.preventDefault(); });
    document.getElementById('dp-pad').addEventListener('touchstart', function (e) { tapNow(); e.preventDefault(); }, { passive: false });

    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      var ae = document.activeElement;
      var tag = ae && ae.tagName ? ae.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        var view = document.getElementById('dp-main').dataset.view;
        if (view === 'hub') {
          startSession();
        } else if (view === 'session') {
          tapNow();
        }
        e.preventDefault();
      }
    });
  })();
<\/script>`], ["", ` <script>
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

    // ─── Hub render ─────────────────────────────────────────────
    var hub = document.getElementById('dp-hub');
    var session = document.getElementById('dp-session');
    var result = document.getElementById('dp-result');
    var idNounEl = document.getElementById('dp-id-noun');
    var idNounIdEl = document.getElementById('dp-id-noun-id');

    if (idNounEl) {
      idNounEl.src = 'https://noun.pics/' + myNoun + '.svg';
      idNounEl.alt = 'Your Noun ' + myNoun;
      idNounEl.style.imageRendering = 'pixelated';
    }
    if (idNounIdEl) idNounIdEl.textContent = String(myNoun);

    // ─── Web Audio — synthesized tap tone ───────────────────────
    var actx = null;
    function ensureAudio() {
      if (actx) return actx;
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = null; }
      return actx;
    }
    function playTapTone(velocity) {
      var ctx = ensureAudio();
      if (!ctx) return;
      var t0 = ctx.currentTime;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      // Tone shifts subtly with the tap count for a melodic-ish feel
      var freq = 220 + (velocity || 0) * 4;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + 0.18);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + 0.22);
    }

    // ─── Live canvas during session ─────────────────────────────
    var liveCanvas = document.getElementById('dp-live-canvas');
    var liveCtx = liveCanvas ? liveCanvas.getContext('2d') : null;
    var liveTapsEl = document.getElementById('dp-live-taps');
    var liveTempoEl = document.getElementById('dp-live-tempo');
    var ripples = [];
    var pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resizeLiveCanvas() {
      if (!liveCanvas) return;
      var rect = liveCanvas.getBoundingClientRect();
      liveCanvas.width = Math.floor(rect.width * pixelRatio);
      liveCanvas.height = Math.floor(rect.height * pixelRatio);
    }
    window.addEventListener('resize', resizeLiveCanvas);

    function pushRipple() {
      ripples.push({ t: performance.now(), strength: 1 });
      if (ripples.length > 80) ripples.shift();
    }
    function drawLive() {
      if (!liveCtx) return;
      var W = liveCanvas.width, H = liveCanvas.height;
      // Fade prior frame
      liveCtx.fillStyle = 'rgba(255, 245, 216, 0.18)';
      liveCtx.fillRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2;
      var now = performance.now();
      // Draw ripples
      for (var i = 0; i < ripples.length; i++) {
        var r = ripples[i];
        var age = (now - r.t) / 1200; // 1.2s lifetime
        if (age > 1) continue;
        var radius = age * Math.min(W, H) * 0.45;
        var alpha = (1 - age) * 0.6;
        liveCtx.strokeStyle = 'rgba(214, 52, 106, ' + alpha + ')';
        liveCtx.lineWidth = 3 * pixelRatio * (1 - age * 0.6);
        liveCtx.beginPath();
        liveCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        liveCtx.stroke();
      }
      // Hub center mark
      liveCtx.fillStyle = '#11100c';
      liveCtx.beginPath();
      liveCtx.arc(cx, cy, 10 * pixelRatio, 0, Math.PI * 2);
      liveCtx.fill();
    }

    // ─── Session state ─────────────────────────────────────────
    var SESSION_MS = 15000;
    var session_state = null;
    var sessionRaf = null;

    function startSession() {
      hub.hidden = true; session.hidden = false; result.hidden = true;
      document.getElementById('dp-main').dataset.view = 'session';
      ensureAudio();
      resizeLiveCanvas();
      session_state = {
        startedAt: performance.now(),
        taps: [],   // array of { t: ms-since-start }
      };
      ripples.length = 0;
      sessionRaf = requestAnimationFrame(sessionLoop);
    }
    function sessionLoop(ts) {
      if (!session_state) return;
      var elapsed = ts - session_state.startedAt;
      var remain = Math.max(0, SESSION_MS - elapsed);
      document.getElementById('dp-session-countdown').textContent = String(Math.ceil(remain / 1000));
      document.getElementById('dp-live-taps').textContent = String(session_state.taps.length);
      var tempo = computeTempo(session_state.taps);
      document.getElementById('dp-live-tempo').textContent = tempo
        ? Math.round(tempo) + ' bpm'
        : '— tempo —';
      drawLive();
      if (remain > 0) {
        sessionRaf = requestAnimationFrame(sessionLoop);
      } else {
        endSession();
      }
    }
    function tapNow() {
      if (!session_state) return;
      var now = performance.now() - session_state.startedAt;
      session_state.taps.push({ t: now });
      pushRipple();
      playTapTone(session_state.taps.length);
      try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
    }
    function endSession() {
      cancelAnimationFrame(sessionRaf); sessionRaf = null;
      var s = session_state;
      session_state = null;
      renderPortrait(s);
    }

    function computeTempo(taps) {
      if (taps.length < 4) return null;
      var intervals = [];
      for (var i = 1; i < taps.length; i++) intervals.push(taps[i].t - taps[i - 1].t);
      // Median interval is more robust than mean for noisy timing
      intervals.sort(function (a, b) { return a - b; });
      var median = intervals[Math.floor(intervals.length / 2)];
      if (median <= 0) return null;
      return 60000 / median;
    }

    // ─── Portrait render ───────────────────────────────────────
    function renderPortrait(sess) {
      hub.hidden = true; session.hidden = true; result.hidden = false;
      document.getElementById('dp-main').dataset.view = 'result';
      var taps = sess.taps;
      var tempo = computeTempo(taps);
      // Hue: shift with tempo (60 bpm = 200 / blue, 180 bpm = 0 / red)
      var hue = tempo ? Math.max(0, Math.min(360, 240 - (tempo - 60) * 2)) : 200;

      // Build the SVG composition.
      // Layout: 600x720. Top 600x600 is the rendered portrait with the
      // Noun centered. Bottom 600x120 is the signature strip.
      var svg = document.getElementById('dp-portrait');
      svg.setAttribute('viewBox', '0 0 600 720');
      var bg = '#fff5d8';
      var ink = '#11100c';
      var accent = 'hsl(' + hue + ', 70%, 50%)';
      var accentLight = 'hsl(' + hue + ', 70%, 75%)';
      var accentDeep  = 'hsl(' + hue + ', 70%, 35%)';
      var nounHref = 'https://noun.pics/' + myNoun + '.svg';

      var dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      var sig = (taps.length).toString(36).toUpperCase().padStart(2, '0') +
                '-' + Math.round(tempo || 0).toString(36).toUpperCase().padStart(2, '0') +
                '-' + (myNoun).toString(36).toUpperCase().padStart(3, '0');

      // Concentric rings — one per 4 taps (groups of beats). Each ring's
      // dot positions are derived from tap times within that group.
      var rings = [];
      var groupSize = 4;
      for (var i = 0; i < taps.length; i += groupSize) {
        var group = taps.slice(i, i + groupSize);
        if (group.length < 2) continue;
        var ringIdx = rings.length;
        var t0 = group[0].t;
        var t1 = group[group.length - 1].t;
        var span = Math.max(1, t1 - t0);
        var dots = group.map(function (tap) {
          var phase = (tap.t - t0) / span; // 0..1
          var angle = phase * Math.PI * 2 - Math.PI / 2;
          return { angle: angle };
        });
        rings.push({ idx: ringIdx, dots: dots });
      }

      // Build SVG
      var parts = [];
      // Background
      parts.push('<rect width="600" height="720" fill="' + bg + '"/>');
      // Outer frame
      parts.push('<rect x="8" y="8" width="584" height="704" fill="none" stroke="' + ink + '" stroke-width="3"/>');
      parts.push('<rect x="14" y="14" width="572" height="692" fill="none" stroke="' + accent + '" stroke-width="1.5"/>');
      // Title bar
      parts.push('<rect x="14" y="14" width="572" height="50" fill="' + accent + '"/>');
      parts.push('<text x="300" y="46" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="800" letter-spacing="6" fill="' + bg + '">DRUM PORTRAIT</text>');

      // Concentric rings (in the upper square area, centered around 300, 320)
      var cx = 300, cy = 320;
      var maxR = 240;
      var ringMaxCount = Math.max(1, rings.length);
      // draw rings
      for (var r = 0; r < rings.length; r++) {
        var radius = 80 + (r / ringMaxCount) * (maxR - 80);
        // Outline circle
        parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="' + accentLight + '" stroke-width="1" opacity="0.5"/>');
        // dots for this ring's beats
        for (var d = 0; d < rings[r].dots.length; d++) {
          var angle = rings[r].dots[d].angle;
          var dx = cx + Math.cos(angle) * radius;
          var dy = cy + Math.sin(angle) * radius;
          parts.push('<circle cx="' + dx + '" cy="' + dy + '" r="6" fill="' + accent + '" stroke="' + ink + '" stroke-width="1.5"/>');
        }
      }
      // central frame for the noun
      parts.push('<rect x="' + (cx - 60) + '" y="' + (cy - 60) + '" width="120" height="120" fill="' + bg + '" stroke="' + ink + '" stroke-width="3"/>');
      parts.push('<image href="' + nounHref + '" x="' + (cx - 56) + '" y="' + (cy - 56) + '" width="112" height="112" image-rendering="pixelated"/>');

      // Signature strip at the bottom (y 580..680)
      parts.push('<rect x="14" y="582" width="572" height="116" fill="' + accentDeep + '"/>');
      parts.push('<text x="36" y="624" font-family="Lora, Georgia, serif" font-style="italic" font-size="32" font-weight="500" fill="' + bg + '">a fingerprint of how you played today.</text>');
      parts.push('<text x="36" y="660" font-family="JetBrains Mono, ui-monospace, monospace" font-size="13" font-weight="700" letter-spacing="3" fill="' + bg + '">');
      parts.push('NOUN ' + myNoun + ' · ' + (tempo ? Math.round(tempo) + ' BPM · ' : '') + taps.length + ' TAPS · ' + dateStr.toUpperCase());
      parts.push('</text>');
      parts.push('<text x="566" y="676" text-anchor="end" font-family="JetBrains Mono, ui-monospace, monospace" font-size="10" font-weight="600" letter-spacing="2" fill="' + bg + '" opacity="0.75">');
      parts.push('SIG ' + sig + ' · pointcast.xyz/drum-portrait');
      parts.push('</text>');

      svg.innerHTML = parts.join('');

      // Result HUD
      document.getElementById('dp-result-taps').textContent = String(taps.length);
      document.getElementById('dp-result-tempo').textContent = tempo ? Math.round(tempo) + ' bpm' : '—';
      document.getElementById('dp-result-sig').textContent = sig;

      // Save to gallery
      saveToGallery({
        ts: Date.now(),
        taps: taps.length,
        tempo: tempo ? Math.round(tempo) : 0,
        sig: sig,
        hue: Math.round(hue),
        nounId: myNoun,
        // We don't store the SVG itself (size); we re-render from these
        // params on demand. The portrait is deterministic.
        tapTimings: taps.map(function (t) { return Math.round(t.t); }),
      });
      renderGallery();
    }

    // ─── Gallery (localStorage) ─────────────────────────────────
    function loadGallery() {
      try {
        var raw = localStorage.getItem('pc:portrait:gallery');
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    function saveToGallery(entry) {
      var g = loadGallery();
      g.unshift(entry);
      // Cap at 12
      g = g.slice(0, 12);
      try { localStorage.setItem('pc:portrait:gallery', JSON.stringify(g)); } catch (e) {}
    }
    function renderGallery() {
      var grid = document.getElementById('dp-gallery-grid');
      if (!grid) return;
      var g = loadGallery();
      if (g.length === 0) {
        grid.innerHTML = '<li class="dp__gallery-empty mono">— your past portraits will appear here —</li>';
        return;
      }
      grid.innerHTML = g.map(function (e, idx) {
        var d = new Date(e.ts);
        var when = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return '<li class="dp__gallery-cell">' +
               '<div class="dp__gallery-thumb" style="--hue: ' + (e.hue || 200) + '">' +
               '<img src="https://noun.pics/' + (e.nounId || 1) + '.svg" alt="" width="44" height="44" loading="lazy" />' +
               '</div>' +
               '<span class="dp__gallery-sig mono">' + (e.sig || '???') + '</span>' +
               '<span class="dp__gallery-meta mono">' + (e.tempo || 0) + ' bpm · ' + (e.taps || 0) + ' taps · ' + when + '</span>' +
               '</li>';
      }).join('');
    }
    renderGallery();

    // ─── Result actions ─────────────────────────────────────────
    function svgToBlob(callback) {
      var svg = document.getElementById('dp-portrait');
      var serialized = new XMLSerializer().serializeToString(svg);
      // Inline images need to be fetched as data URIs since canvas
      // toDataURL on a tainted canvas won't work. Inline the noun
      // SVG by fetching it.
      var imgRe = /<image href="([^"]+)" /;
      var match = imgRe.exec(serialized);
      if (!match) {
        callback(null);
        return;
      }
      fetch(match[1]).then(function (r) { return r.text(); }).then(function (innerSvg) {
        // Strip the outer <svg> tag and embed as a <g>
        var inner = innerSvg.replace(/<\\\\?xml[^>]*\\\\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\\\\/svg>\\\\s*$/, '');
        // Insert into the parent serialized SVG, replacing the <image> tag.
        var imgFullRe = /<image[^/]*\\\\/>/;
        // Find size of the image to compute scaling
        var size = 112;
        var x = 244, y = 264;
        var withImage = serialized.replace(imgFullRe,
          '<g transform="translate(' + x + ',' + y + ') scale(' + (size / 320) + ',' + (size / 320) + ')">' + inner + '</g>'
        );
        // Render to canvas → PNG
        var canvas = document.createElement('canvas');
        canvas.width = 600 * 2;
        canvas.height = 720 * 2;
        var ctx = canvas.getContext('2d');
        var img = new Image();
        img.onload = function () {
          ctx.fillStyle = '#fff5d8';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) { callback(blob); }, 'image/png');
        };
        img.onerror = function () { callback(null); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(withImage);
      }).catch(function () { callback(null); });
    }

    document.getElementById('dp-result-save').addEventListener('click', function () {
      var statusEl = document.getElementById('dp-result-share-status');
      statusEl.textContent = '… rendering …';
      svgToBlob(function (blob) {
        if (!blob) {
          statusEl.textContent = '✗ render failed';
          return;
        }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'drum-portrait-' + Date.now() + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        statusEl.textContent = '✓ saved';
        setTimeout(function () { if (statusEl.textContent === '✓ saved') statusEl.textContent = ' '; }, 2000);
      });
    });

    document.getElementById('dp-result-share').addEventListener('click', function () {
      var statusEl = document.getElementById('dp-result-share-status');
      var sig = document.getElementById('dp-result-sig').textContent || '';
      var taps = document.getElementById('dp-result-taps').textContent || '0';
      var tempo = document.getElementById('dp-result-tempo').textContent || '';
      var msg = '🥁 my drum portrait · ' + taps + ' taps · ' + tempo + ' · sig ' + sig + ' · pointcast.xyz/drum-portrait';
      var url = window.location.origin + '/drum-portrait';
      if (navigator.share) {
        // Try to share the PNG too
        svgToBlob(function (blob) {
          var file = blob ? new File([blob], 'drum-portrait.png', { type: 'image/png' }) : null;
          var shareData = file && navigator.canShare && navigator.canShare({ files: [file] })
            ? { title: 'Drum Portrait', text: msg, url: url, files: [file] }
            : { title: 'Drum Portrait', text: msg, url: url };
          navigator.share(shareData).then(function () {
            statusEl.textContent = '✓ shared';
            setTimeout(function () { statusEl.textContent = ' '; }, 2000);
          }).catch(function () {});
        });
      } else {
        try {
          navigator.clipboard.writeText(msg + ' ' + url);
          statusEl.textContent = '✓ copied';
        } catch (e) {
          statusEl.textContent = '✗ unavailable';
        }
        setTimeout(function () { statusEl.textContent = ' '; }, 2000);
      }
    });

    document.getElementById('dp-result-stamp').addEventListener('click', function () {
      var statusEl = document.getElementById('dp-result-share-status');
      var taps = Number(document.getElementById('dp-result-taps').textContent) || 0;
      // Stamp to room — broadcast a portrait event so other visitors see
      // that a portrait was created. type=tap is a permissive
      // /api/sounds family that should accept.
      fetch('/api/sounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tap', seed: taps, sessionId: sid }),
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (d && d.ok) statusEl.textContent = '✓ stamped to the room';
        else statusEl.textContent = '✗ ' + (d && d.reason ? d.reason : 'stamp failed');
        setTimeout(function () { statusEl.textContent = ' '; }, 2200);
      }).catch(function () { statusEl.textContent = '✗ offline'; });
    });

    document.getElementById('dp-result-again').addEventListener('click', function () {
      hub.hidden = false; session.hidden = true; result.hidden = true;
      document.getElementById('dp-main').dataset.view = 'hub';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderGallery();
    });

    // ─── Inputs ─────────────────────────────────────────────────
    document.getElementById('dp-start').addEventListener('click', startSession);
    document.getElementById('dp-pad').addEventListener('mousedown', function (e) { tapNow(); e.preventDefault(); });
    document.getElementById('dp-pad').addEventListener('touchstart', function (e) { tapNow(); e.preventDefault(); }, { passive: false });

    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      var ae = document.activeElement;
      var tag = ae && ae.tagName ? ae.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        var view = document.getElementById('dp-main').dataset.view;
        if (view === 'hub') {
          startSession();
        } else if (view === 'session') {
          tapNow();
        }
        e.preventDefault();
      }
    });
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum.png", "jsonLd": jsonLd, "data-astro-cid-zoanaoe7": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dp" id="dp-main" data-view="hub" data-astro-cid-zoanaoe7> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "portrait", "data-astro-cid-zoanaoe7": true })} <header class="dp__head" data-astro-cid-zoanaoe7> <p class="dp__kicker mono" data-astro-cid-zoanaoe7>★ DRUM HUB · PORTRAIT · A 15-SECOND TAKE-HOME ★</p> <h1 class="dp__title" data-astro-cid-zoanaoe7>drum <em data-astro-cid-zoanaoe7>portrait</em></h1> <p class="dp__strap mono" data-astro-cid-zoanaoe7>tap any rhythm · the room renders you · save the picture</p> </header>  <section class="dp__hub" id="dp-hub" data-astro-cid-zoanaoe7> <div class="dp__id" data-astro-cid-zoanaoe7> <div class="dp__id-noun-wrap" data-astro-cid-zoanaoe7> <img class="dp__id-noun" id="dp-id-noun" src="" alt="Your Noun" width="120" height="120" data-astro-cid-zoanaoe7> </div> <div class="dp__id-body" data-astro-cid-zoanaoe7> <p class="dp__id-tag mono" data-astro-cid-zoanaoe7>YOU · NOUN <strong id="dp-id-noun-id" data-astro-cid-zoanaoe7>—</strong></p> <p class="dp__id-line" data-astro-cid-zoanaoe7>Press <strong data-astro-cid-zoanaoe7>SPACE</strong> or tap the big pad to start your 15-second session. Tap any rhythm — fast, slow, halting, syncopated — there's no wrong way.</p> <p class="dp__id-meta mono" id="dp-id-meta" data-astro-cid-zoanaoe7>— ready when you are —</p> </div> </div> <button type="button" class="dp__start" id="dp-start" aria-label="Start your 15-second session" data-astro-cid-zoanaoe7> <span class="dp__start-cap" data-astro-cid-zoanaoe7> <span class="dp__start-glyph" aria-hidden="true" data-astro-cid-zoanaoe7>●</span> <span class="dp__start-label mono" data-astro-cid-zoanaoe7>begin</span> <span class="dp__start-kbd mono" data-astro-cid-zoanaoe7>SPACE</span> </span> </button>  <section class="dp__gallery" aria-label="Your past portraits" data-astro-cid-zoanaoe7> <p class="dp__eyebrow mono" data-astro-cid-zoanaoe7>▌ YOUR GALLERY</p> <ul class="dp__gallery-grid" id="dp-gallery-grid" role="list" data-astro-cid-zoanaoe7> <li class="dp__gallery-empty mono" data-astro-cid-zoanaoe7>— your past portraits will appear here —</li> </ul> </section> </section>  <section class="dp__session" id="dp-session" hidden data-astro-cid-zoanaoe7> <div class="dp__session-hud" data-astro-cid-zoanaoe7> <p class="dp__session-prompt" id="dp-session-prompt" data-astro-cid-zoanaoe7>tap when you want · any rhythm</p> <p class="dp__session-countdown mono" data-astro-cid-zoanaoe7><strong id="dp-session-countdown" data-astro-cid-zoanaoe7>15</strong>s</p> </div> <div class="dp__live" id="dp-live" aria-label="Live tap canvas" data-astro-cid-zoanaoe7> <canvas class="dp__live-canvas" id="dp-live-canvas" width="800" height="600" data-astro-cid-zoanaoe7></canvas> <p class="dp__live-meter mono" data-astro-cid-zoanaoe7> <span data-astro-cid-zoanaoe7><strong id="dp-live-taps" data-astro-cid-zoanaoe7>0</strong> taps</span> <span class="dp__live-sep" data-astro-cid-zoanaoe7>·</span> <span id="dp-live-tempo" data-astro-cid-zoanaoe7>— tempo —</span> </p> </div> <button type="button" class="dp__pad" id="dp-pad" aria-label="Tap pad" data-astro-cid-zoanaoe7> <span class="dp__pad-cap" data-astro-cid-zoanaoe7> <span class="dp__pad-glyph" aria-hidden="true" data-astro-cid-zoanaoe7>▣</span> <span class="dp__pad-label mono" data-astro-cid-zoanaoe7>TAP</span> <span class="dp__pad-kbd mono" data-astro-cid-zoanaoe7>SPACE / RETURN</span> </span> </button> </section>  <section class="dp__result" id="dp-result" hidden data-astro-cid-zoanaoe7> <p class="dp__eyebrow mono" id="dp-result-status" data-astro-cid-zoanaoe7>★ YOUR PORTRAIT</p> <div class="dp__result-card" data-astro-cid-zoanaoe7> <svg class="dp__portrait" id="dp-portrait" viewBox="0 0 600 720" xmlns="http://www.w3.org/2000/svg" aria-label="Your generative drum portrait" data-astro-cid-zoanaoe7>  </svg> </div> <div class="dp__result-stats mono" data-astro-cid-zoanaoe7> <div class="dp__result-stat" data-astro-cid-zoanaoe7><dt data-astro-cid-zoanaoe7>taps</dt><dd id="dp-result-taps" data-astro-cid-zoanaoe7>0</dd></div> <div class="dp__result-stat" data-astro-cid-zoanaoe7><dt data-astro-cid-zoanaoe7>tempo</dt><dd id="dp-result-tempo" data-astro-cid-zoanaoe7>—</dd></div> <div class="dp__result-stat" data-astro-cid-zoanaoe7><dt data-astro-cid-zoanaoe7>signature</dt><dd id="dp-result-sig" data-astro-cid-zoanaoe7>—</dd></div> </div> <div class="dp__result-row" data-astro-cid-zoanaoe7> <button type="button" class="dp__btn dp__btn--magenta" id="dp-result-save" data-astro-cid-zoanaoe7>▸ save · download PNG</button> <button type="button" class="dp__btn" id="dp-result-share" data-astro-cid-zoanaoe7>▸ share</button> <button type="button" class="dp__btn" id="dp-result-stamp" data-astro-cid-zoanaoe7>▸ stamp to room</button> <button type="button" class="dp__btn dp__btn--ghost" id="dp-result-again" data-astro-cid-zoanaoe7>▸ another</button> </div> <p class="dp__result-share-status mono" id="dp-result-share-status" data-astro-cid-zoanaoe7>&nbsp;</p> </section> <footer class="dp__foot" data-astro-cid-zoanaoe7> <p class="mono" data-astro-cid-zoanaoe7>DRUM PORTRAIT · v0.1 · 2026-04-30 · pointcast.xyz/drum-portrait · gallery saves locally · part of <a href="/drum-press" data-astro-cid-zoanaoe7>drum press</a></p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-portrait.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-portrait.astro";
const $$url = "/drum-portrait";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumPortrait,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
