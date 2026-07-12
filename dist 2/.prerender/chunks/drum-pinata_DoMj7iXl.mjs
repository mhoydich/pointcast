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
const $$DrumPinata = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$DrumPinata;
  const title = "/drum-pinata — virtual piñata · Birthday Imprint";
  const description = "A virtual piñata hangs at the center of the page. Take a swing. The piñata bursts when the room reaches the threshold. A small shared celebration on PointCast.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-pinata",
    name: "PointCast Drum · Piñata",
    url: "https://pointcast.xyz/drum-pinata",
    description
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () { 'use strict';
  var params = new URLSearchParams(window.location.search);
  var qFor = (params.get('for') || '').trim().slice(0, 40);
  var qFrom = (params.get('from') || '').trim().slice(0, 40);
  var qGoalRaw = parseInt(params.get('goal') || '100', 10);
  var GOAL = Math.min(500, Math.max(50, isFinite(qGoalRaw) ? qGoalRaw : 100));

  function getSession() {
    try {
      var k = 'pc:session';
      var s = localStorage.getItem(k);
      if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, s); }
      return s;
    } catch (e) { return 'dpn-' + Math.random().toString(36).slice(2, 10); }
  }
  var sid = getSession();
  var shortPid = '';
  try {
    if (window.crypto && crypto.subtle) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(sid)).then(function(buf){
        var arr = Array.from(new Uint8Array(buf)).slice(0, 5);
        shortPid = arr.map(function(b){ return b.toString(16).padStart(2,'0'); }).join('').slice(0, 8);
      }).catch(function(){});
    }
  } catch (e) {}

  var el = {
    name: document.getElementById('dpn-name-h1'),
    plate: document.getElementById('dpn-name-plate'),
    pinata: document.getElementById('dpn-pinata'),
    star: document.getElementById('dpn-star'),
    bar: document.getElementById('dpn-bar-fill'),
    roomN: document.getElementById('dpn-room-count'),
    goalN: document.getElementById('dpn-goal'),
    here: document.getElementById('dpn-room-here'),
    myN: document.getElementById('dpn-my-count'),
    swing: document.getElementById('dpn-swing'),
    note: document.getElementById('dpn-swing-note'),
    forIn: document.getElementById('dpn-for'),
    fromIn: document.getElementById('dpn-from'),
    goalIn: document.getElementById('dpn-goal-in'),
    copy: document.getElementById('dpn-copy'),
    tweet: document.getElementById('dpn-tweet'),
    native: document.getElementById('dpn-native'),
    shareStatus: document.getElementById('dpn-share-status'),
    overlay: document.getElementById('dpn-overlay'),
    confetti: document.getElementById('dpn-confetti'),
    burstN: document.getElementById('dpn-burst-n'),
    burstName: document.getElementById('dpn-burst-name'),
    again: document.getElementById('dpn-again'),
  };

  function pinataLabel() {
    if (qFor) return qFor + "'s piñata";
    return "someone's piñata";
  }
  function setHeader() {
    var lbl = pinataLabel();
    el.name.textContent = lbl;
    el.plate.textContent = lbl + (qFrom ? ' · from ' + qFrom : '');
    el.burstName.textContent = lbl;
  }
  el.forIn.value = qFor;
  el.fromIn.value = qFrom;
  el.goalIn.value = String(GOAL);
  el.goalN.textContent = String(GOAL);
  setHeader();

  var myCount = 0;
  var roomCount = 0;
  var lastTs = Date.now() - 30000;
  var burstSeen = false;
  var pendingSelf = []; // timestamps of recent self-broadcasts to filter

  function updateBar() {
    var pct = Math.min(100, Math.round((roomCount / GOAL) * 100));
    el.bar.style.width = pct + '%';
    el.roomN.textContent = String(roomCount);
    el.myN.textContent = String(myCount);
  }

  // ====== AUDIO ======
  var ac = null;
  function audio() {
    if (ac) return ac;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ac = new Ctx();
    } catch (e) { return null; }
    return ac;
  }
  function thwack() {
    var a = audio(); if (!a) return;
    try {
      var t0 = a.currentTime;
      var noise = a.createBufferSource();
      var buf = a.createBuffer(1, Math.floor(0.18 * a.sampleRate), a.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.4);
      }
      noise.buffer = buf;
      var bp = a.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 1.4;
      var g = a.createGain();
      g.gain.setValueAtTime(0.5, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      noise.connect(bp); bp.connect(g); g.connect(a.destination);
      noise.start(t0); noise.stop(t0 + 0.2);

      var osc = a.createOscillator();
      var og = a.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t0);
      osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.15);
      og.gain.setValueAtTime(0.18, t0);
      og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.connect(og); og.connect(a.destination);
      osc.start(t0); osc.stop(t0 + 0.2);
    } catch (e) {}
  }
  function bigPop() {
    var a = audio(); if (!a) return;
    try {
      var t0 = a.currentTime;
      var noise = a.createBufferSource();
      var buf = a.createBuffer(1, Math.floor(0.6 * a.sampleRate), a.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.6);
      noise.buffer = buf;
      var hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 200;
      var g = a.createGain();
      g.gain.setValueAtTime(0.6, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
      noise.connect(hp); hp.connect(g); g.connect(a.destination);
      noise.start(t0); noise.stop(t0 + 0.6);
    } catch (e) {}
  }

  // ====== SWING ======
  var wobble = 0; // intensity 0..1
  function bumpWobble() {
    wobble = Math.min(1, wobble + 0.18);
    el.pinata.style.setProperty('--dpn-wobble', String(0.5 + wobble * 1.6));
    el.pinata.classList.remove('dpn__pinata--hit');
    void el.pinata.offsetWidth;
    el.pinata.classList.add('dpn__pinata--hit');
  }
  setInterval(function(){ wobble = Math.max(0, wobble - 0.04); el.pinata.style.setProperty('--dpn-wobble', String(0.5 + wobble * 1.6)); }, 200);

  function fireSwing() {
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
    if (burstSeen) return;
    myCount += 1;
    roomCount += 1; // optimistic local bump; we'll reconcile via tail self-filter
    pendingSelf.push(Date.now());
    if (pendingSelf.length > 50) pendingSelf.shift();
    bumpWobble();
    thwack();
    updateBar();
    el.note.textContent = 'transmitting · type=pinata';
    fetch('/api/sounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'pinata', sessionId: sid, note: 'swing', goal: GOAL, forName: qFor || null })
    }).then(function(r){ return r.json(); }).then(function(data){
      if (data && data.ok) el.note.textContent = 'transmitted ✓';
      else el.note.textContent = '✗ ' + ((data && data.reason) || 'send failed');
    }).catch(function(){ el.note.textContent = '✗ offline'; });

    // Local threshold cross → broadcast burst (idempotent)
    if (roomCount >= GOAL && !burstSeen) {
      triggerBurstLocal(roomCount);
      try {
        fetch('/api/sounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'pinata-burst', sessionId: sid, at: roomCount, goal: GOAL, forName: qFor || null })
        });
      } catch (e) {}
    }
  }

  el.swing.addEventListener('mousedown', function(e){ fireSwing(); e.preventDefault(); });
  el.swing.addEventListener('touchstart', function(e){ fireSwing(); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function(e){
    if (e.repeat) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space' || e.code === 'Enter') { fireSwing(); e.preventDefault(); }
  });

  // ====== BURST ======
  var CONFETTI = ['🎉','🎊','✨','🍬','🍭','🎁','💛','💜','💖','💚'];
  var BURST_COLORS = ['#ff5cd5','#ffd400','#22d3ee','#7cf26b','#ff8a4a','#ffffff'];

  function triggerBurstLocal(at) {
    if (burstSeen) return;
    burstSeen = true;
    el.burstN.textContent = String(at);
    el.overlay.hidden = false;
    el.overlay.setAttribute('aria-hidden', 'false');
    bigPop();
    rainConfetti(140);
    setTimeout(function(){ rainConfetti(80); }, 900);
    setTimeout(function(){ rainConfetti(60); }, 2200);
    el.pinata.classList.add('dpn__pinata--burst');
  }

  function rainConfetti(n) {
    for (var i = 0; i < n; i++) {
      (function(idx){
        var s = document.createElement('span');
        var useEmoji = Math.random() < 0.55;
        if (useEmoji) {
          s.className = 'dpn__bit dpn__bit--emoji';
          s.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
        } else {
          s.className = 'dpn__bit dpn__bit--shape';
          s.style.background = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
          if (Math.random() < 0.4) s.style.borderRadius = '50%';
        }
        s.style.left = (Math.random() * 100) + '%';
        s.style.top = '-40px';
        s.style.fontSize = (14 + Math.random() * 28) + 'px';
        s.style.setProperty('--dx', ((Math.random() - 0.5) * 240) + 'px');
        s.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
        s.style.animationDuration = (2.4 + Math.random() * 2.4) + 's';
        s.style.animationDelay = (Math.random() * 0.6) + 's';
        el.confetti.appendChild(s);
        setTimeout(function(){ if (s.parentNode) s.parentNode.removeChild(s); }, 5400);
      })(i);
    }
  }

  el.again.addEventListener('click', function(){
    burstSeen = false;
    myCount = 0;
    // Don't reset room count — that's the global. Just re-enable for next round locally.
    el.overlay.hidden = true;
    el.overlay.setAttribute('aria-hidden', 'true');
    el.pinata.classList.remove('dpn__pinata--burst');
    if (el.confetti) el.confetti.innerHTML = '';
    updateBar();
    el.note.textContent = '— ready · next round —';
  });

  // ====== POLL /api/sounds for room state ======
  function looksLikeSelf(e) {
    if (!e || !e.t) return false;
    if (e.sessionId === sid) return true;
    // Fallback: time-window match against a recent self-broadcast
    for (var i = pendingSelf.length - 1; i >= 0; i--) {
      if (Math.abs(pendingSelf[i] - (e.t || 0)) < 1500) {
        pendingSelf.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function tail() {
    fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(data){
      if (!data) return;
      var events = Array.isArray(data.events) ? data.events : [];
      if (!events.length) return;
      lastTs = events[events.length - 1].t || Date.now();
      events.forEach(function(e){
        if (e.type === 'pinata') {
          if (looksLikeSelf(e)) return; // avoid double-counting our optimistic bump
          roomCount += 1;
          if (roomCount >= GOAL && !burstSeen) {
            triggerBurstLocal(roomCount);
            try {
              fetch('/api/sounds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'pinata-burst', sessionId: sid, at: roomCount, goal: GOAL, forName: qFor || null })
              });
            } catch (er) {}
          }
        } else if (e.type === 'pinata-burst') {
          if (!burstSeen) {
            var at = (e.at && Number(e.at)) || roomCount || GOAL;
            triggerBurstLocal(at);
          }
        }
      });
      updateBar();
    }).catch(function(){});
  }
  setInterval(tail, 1500); tail();

  // Periodic full reconciliation: read recent sounds and recount type=pinata.
  function reconcile() {
    fetch('/api/sounds?since=' + (Date.now() - 1000 * 60 * 60 * 6), { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(data){
        if (!data) return;
        var events = Array.isArray(data.events) ? data.events : [];
        var totalSwings = 0;
        var sawBurst = false;
        var burstAt = 0;
        events.forEach(function(e){
          if (e.type === 'pinata') totalSwings += 1;
          else if (e.type === 'pinata-burst') {
            sawBurst = true;
            if (Number(e.at) > burstAt) burstAt = Number(e.at) || 0;
          }
        });
        if (totalSwings > roomCount) roomCount = totalSwings;
        updateBar();
        if (sawBurst && !burstSeen) {
          triggerBurstLocal(burstAt || roomCount || GOAL);
        }
      }).catch(function(){});
  }
  setTimeout(reconcile, 800);
  setInterval(reconcile, 25000);

  // ====== /api/visit roster ======
  function refreshVisit() {
    fetch('/api/visit', { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(data){
      if (!data) return;
      var present = Array.isArray(data.present) ? data.present : [];
      var humans = present.filter(function(p){ var t = (p && p.type) || ''; return p && p.pid && typeof p.nounId === 'number' && !t.startsWith('bot:'); });
      el.here.textContent = String(Math.max(1, humans.length));
    }).catch(function(){});
  }
  refreshVisit(); setInterval(refreshVisit, 8000);

  // ====== SHARE ======
  function buildShareUrl() {
    var u = new URL(window.location.href);
    u.search = '';
    var f = (el.forIn.value || '').trim().slice(0, 40);
    var fr = (el.fromIn.value || '').trim().slice(0, 40);
    var g = parseInt(el.goalIn.value || '100', 10);
    if (!isFinite(g)) g = 100;
    g = Math.min(500, Math.max(50, g));
    if (f) u.searchParams.set('for', f);
    if (fr) u.searchParams.set('from', fr);
    u.searchParams.set('goal', String(g));
    return u.toString();
  }
  function refreshTweet() {
    var url = buildShareUrl();
    var f = (el.forIn.value || '').trim();
    var text = f ? ("take a swing at " + f + "'s piñata on PointCast") : 'take a swing at the PointCast piñata';
    el.tweet.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
  }
  function reflectInputs() {
    qFor = (el.forIn.value || '').trim().slice(0, 40);
    qFrom = (el.fromIn.value || '').trim().slice(0, 40);
    var g = parseInt(el.goalIn.value || '100', 10);
    if (isFinite(g)) GOAL = Math.min(500, Math.max(50, g));
    el.goalN.textContent = String(GOAL);
    setHeader();
    refreshTweet();
    updateBar();
  }
  el.forIn.addEventListener('input', reflectInputs);
  el.fromIn.addEventListener('input', reflectInputs);
  el.goalIn.addEventListener('input', reflectInputs);
  refreshTweet();

  el.copy.addEventListener('click', function(){
    var url = buildShareUrl();
    try {
      navigator.clipboard.writeText(url).then(function(){
        el.shareStatus.textContent = 'copied ✓';
        setTimeout(function(){ el.shareStatus.textContent = ''; }, 2000);
      }).catch(function(){
        el.shareStatus.textContent = url;
      });
    } catch (e) { el.shareStatus.textContent = url; }
  });
  el.native.addEventListener('click', function(){
    var url = buildShareUrl();
    var f = (el.forIn.value || '').trim();
    var title = f ? (f + "'s piñata · PointCast") : 'PointCast piñata';
    if (navigator.share) {
      navigator.share({ title: title, text: 'take a swing', url: url }).catch(function(){});
    } else {
      el.shareStatus.textContent = 'share not supported · use copy';
      setTimeout(function(){ el.shareStatus.textContent = ''; }, 2000);
    }
  });

  updateBar();
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-pinata.png", "jsonLd": jsonLd, "data-astro-cid-57sy565c": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dpn" id="dpn-main" data-astro-cid-57sy565c> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "pinata", "data-astro-cid-57sy565c": true })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "pinata", "data-astro-cid-57sy565c": true })} <header class="dpn__head" data-astro-cid-57sy565c> <p class="dpn__kicker" data-astro-cid-57sy565c>DRUM HUB · BIRTHDAY IMPRINT · TYPE=PINATA · SHARED ROUND</p> <h1 class="dpn__title" data-astro-cid-57sy565c><span id="dpn-name-h1" data-astro-cid-57sy565c>a piñata</span> <em data-astro-cid-57sy565c>· take a swing.</em></h1> <p class="dpn__dek" id="dpn-dek" data-astro-cid-57sy565c>
A piñata hangs from the rafter. Tap the button (or press <kbd data-astro-cid-57sy565c>SPACE</kbd> / <kbd data-astro-cid-57sy565c>RETURN</kbd>) to swing.
        Every visitor's swing counts toward the same goal. When the room hits the threshold, the piñata bursts —
        confetti rains, the moment is recorded, the round resets.
</p> </header> <section class="dpn__stage" aria-label="Piñata stage" data-astro-cid-57sy565c> <div class="dpn__rafter" aria-hidden="true" data-astro-cid-57sy565c></div> <div class="dpn__string" id="dpn-string" aria-hidden="true" data-astro-cid-57sy565c></div> <div class="dpn__pinata-wrap" id="dpn-pinata-wrap" data-astro-cid-57sy565c> <svg class="dpn__pinata" id="dpn-pinata" viewBox="-160 -140 320 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Piñata" data-astro-cid-57sy565c> <defs data-astro-cid-57sy565c> <radialGradient id="dpn-spot" cx="50%" cy="40%" r="65%" data-astro-cid-57sy565c> <stop offset="0%" stop-color="#ffe9a3" stop-opacity="0.42" data-astro-cid-57sy565c></stop> <stop offset="60%" stop-color="#ffe9a3" stop-opacity="0.0" data-astro-cid-57sy565c></stop> </radialGradient> <radialGradient id="dpn-body" cx="50%" cy="45%" r="55%" data-astro-cid-57sy565c> <stop offset="0%" stop-color="#ff5cd5" data-astro-cid-57sy565c></stop> <stop offset="100%" stop-color="#b8268a" data-astro-cid-57sy565c></stop> </radialGradient> </defs> <ellipse cx="0" cy="0" rx="150" ry="135" fill="url(#dpn-spot)" data-astro-cid-57sy565c></ellipse> <g class="dpn__star" id="dpn-star" data-astro-cid-57sy565c> <polygon points="0,-110 18,-30 100,-34 32,15 60,95 0,48 -60,95 -32,15 -100,-34 -18,-30" fill="url(#dpn-body)" stroke="#3a0c2c" stroke-width="3" stroke-linejoin="round" data-astro-cid-57sy565c></polygon> <polygon points="0,-78 12,-18 70,-20 22,12 42,68 0,32 -42,68 -22,12 -70,-20 -12,-18" fill="#ffd400" opacity="0.75" stroke="#3a0c2c" stroke-width="2" stroke-linejoin="round" data-astro-cid-57sy565c></polygon> <circle cx="0" cy="0" r="22" fill="#3a0c2c" stroke="#ffd400" stroke-width="3" data-astro-cid-57sy565c></circle> <circle cx="0" cy="0" r="8" fill="#ff5cd5" data-astro-cid-57sy565c></circle> <g class="dpn__fringe" data-astro-cid-57sy565c> <rect x="-8" y="-115" width="16" height="22" fill="#ff5cd5" data-astro-cid-57sy565c></rect> <rect x="-92" y="-44" width="16" height="22" fill="#ffd400" data-astro-cid-57sy565c></rect> <rect x="78" y="-44" width="16" height="22" fill="#22d3ee" data-astro-cid-57sy565c></rect> <rect x="-50" y="80" width="16" height="22" fill="#22d3ee" data-astro-cid-57sy565c></rect> <rect x="34" y="80" width="16" height="22" fill="#7cf26b" data-astro-cid-57sy565c></rect> <rect x="-8" y="40" width="16" height="22" fill="#ffd400" data-astro-cid-57sy565c></rect> </g> <g class="dpn__tassels" data-astro-cid-57sy565c> <path d="M-24,98 L-30,140 L-18,140 Z" fill="#ff5cd5" stroke="#3a0c2c" stroke-width="1" data-astro-cid-57sy565c></path> <path d="M-8,100 L-12,150 L0,150 Z" fill="#ffd400" stroke="#3a0c2c" stroke-width="1" data-astro-cid-57sy565c></path> <path d="M8,100 L4,150 L16,150 Z" fill="#22d3ee" stroke="#3a0c2c" stroke-width="1" data-astro-cid-57sy565c></path> <path d="M24,98 L20,140 L32,140 Z" fill="#7cf26b" stroke="#3a0c2c" stroke-width="1" data-astro-cid-57sy565c></path> </g> </g> </svg> <p class="dpn__name-plate" id="dpn-name-plate" data-astro-cid-57sy565c>someone's piñata</p> </div> <section class="dpn__progress" aria-label="Progress" data-astro-cid-57sy565c> <div class="dpn__bar" data-astro-cid-57sy565c><div class="dpn__bar-fill" id="dpn-bar-fill" data-astro-cid-57sy565c></div></div> <p class="dpn__bar-meta mono" data-astro-cid-57sy565c> <span id="dpn-room-count" data-astro-cid-57sy565c>0</span> / <span id="dpn-goal" data-astro-cid-57sy565c>100</span> swings
          · <span id="dpn-room-here" data-astro-cid-57sy565c>1</span> here
          · your swings: <strong id="dpn-my-count" data-astro-cid-57sy565c>0</strong> </p> </section> <div class="dpn__swing-row" data-astro-cid-57sy565c> <button type="button" class="dpn__swing" id="dpn-swing" aria-label="Take a swing" data-astro-cid-57sy565c> <span class="dpn__swing-cap" data-astro-cid-57sy565c> <span class="dpn__swing-glyph" data-astro-cid-57sy565c>🥢</span> <span class="dpn__swing-label" data-astro-cid-57sy565c>TAKE A SWING</span> <span class="dpn__swing-kbd mono" data-astro-cid-57sy565c>SPACE / RETURN</span> </span> </button> <p class="dpn__swing-note" id="dpn-swing-note" data-astro-cid-57sy565c>— ready —</p> </div> </section> <section class="dpn__share" aria-label="Share" data-astro-cid-57sy565c> <h2 class="dpn__h mono" data-astro-cid-57sy565c>★ MAKE IT YOURS &amp; SHARE</h2> <p class="dpn__share-blurb" data-astro-cid-57sy565c>
Set the name and sender, set a goal between 50 and 500, copy the link.
</p> <form class="dpn__form" id="dpn-form" onsubmit="return false;" data-astro-cid-57sy565c> <label class="dpn__lbl" data-astro-cid-57sy565c> <span class="dpn__lbl-t mono" data-astro-cid-57sy565c>FOR</span> <input class="dpn__in" id="dpn-for" type="text" placeholder="name on the piñata" maxlength="40" data-astro-cid-57sy565c> </label> <label class="dpn__lbl" data-astro-cid-57sy565c> <span class="dpn__lbl-t mono" data-astro-cid-57sy565c>FROM</span> <input class="dpn__in" id="dpn-from" type="text" placeholder="from whom" maxlength="40" data-astro-cid-57sy565c> </label> <label class="dpn__lbl" data-astro-cid-57sy565c> <span class="dpn__lbl-t mono" data-astro-cid-57sy565c>GOAL</span> <input class="dpn__in dpn__in--num" id="dpn-goal-in" type="number" min="50" max="500" step="10" placeholder="100" data-astro-cid-57sy565c> </label> </form> <div class="dpn__share-row" data-astro-cid-57sy565c> <button type="button" class="dpn__btn" id="dpn-copy" data-astro-cid-57sy565c>copy link</button> <a class="dpn__btn" id="dpn-tweet" href="#" target="_blank" rel="noopener noreferrer" data-astro-cid-57sy565c>tweet</a> <button type="button" class="dpn__btn" id="dpn-native" data-astro-cid-57sy565c>share…</button> <span class="dpn__share-status mono" id="dpn-share-status" data-astro-cid-57sy565c></span> </div> </section> <footer class="dpn__foot" data-astro-cid-57sy565c> <p data-astro-cid-57sy565c>
Same /api/sounds bus as the rest of the drum hub. Your swings + everyone else's land on every cast surface.
        The burst is shared: when the room hits the goal, the page bursts on every visitor's screen at once.
</p> <p class="dpn__credit mono" data-astro-cid-57sy565c>v0.1 · 2026-04-29 · Birthday Imprint · pointcast.xyz/drum-pinata</p> </footer> <div class="dpn__overlay" id="dpn-overlay" hidden aria-hidden="true" data-astro-cid-57sy565c> <div class="dpn__confetti" id="dpn-confetti" data-astro-cid-57sy565c></div> <div class="dpn__burst-card" data-astro-cid-57sy565c> <p class="dpn__burst-kicker mono" data-astro-cid-57sy565c>★ THE PIÑATA BURST ★</p> <p class="dpn__burst-line" data-astro-cid-57sy565c>at swing #<span id="dpn-burst-n" data-astro-cid-57sy565c>—</span></p> <p class="dpn__burst-name" id="dpn-burst-name" data-astro-cid-57sy565c>someone's piñata</p> <button type="button" class="dpn__btn dpn__btn--big" id="dpn-again" data-astro-cid-57sy565c>swing again</button> </div> </div> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-pinata.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-pinata.astro";
const $$url = "/drum-pinata";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumPinata,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
