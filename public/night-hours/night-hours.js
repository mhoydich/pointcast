/* Night Hours — shared shrine engine.
 *
 * One engine, two rooms. Each page sets window.NIGHT_HOURS = { room, api }
 * before this script loads:
 *   room  'pc' (PointCast) or 'es' (El Segundo)
 *   api   URL of the shared prayer ledger (PointCast's /api/prayer)
 *
 * The live station follows the real night over El Segundo: sunset and sunrise
 * are computed here from the date (no network), and the night between them is
 * split into six stations. The ledger is optional: when it cannot be reached
 * the shrine still works and counts on this device only.
 */
(function () {
  'use strict';
  var CFG = (typeof window !== 'undefined' && window.NIGHT_HOURS) || {};
  var ROOM = CFG.room === 'es' ? 'es' : 'pc';
  var API = CFG.api || '/api/prayer';
  var LAT = 33.9192, LON_W = 118.4165;           // El Segundo
  var TZ = 'America/Los_Angeles';
  var STRIKE_MIN = 5;                             // the common bell: every 5 minutes
  var POLL_MS = 6000, RATE_MS = 5200;

  var STATIONS = [
    { id: 'night-dusk',   hour: 'Dusk',        title: 'The swell goes blue', line: 'The day lets go of the water first.',            hz: 196.00, src: [0.80, 0.34],
      slides: ['img/dusk1.jpg', 'img/dusk2.jpg', 'img/dusk3.jpg'] },
    { id: 'night-shore',  hour: 'First dark',  title: 'Shore shrine',        line: 'Three candles, one flower, the refinery for a skyline.', hz: 220.00, src: [0.72, 0.50],
      slides: ['img/shore1.jpg', 'img/shore2.jpg', 'img/shore3.jpg'] },
    { id: 'night-niche',  hour: 'Deep night',  title: 'The niche',           line: 'The painting keeps its own weather.',            hz: 261.63, src: [0.62, 0.44],
      slides: ['media/niche.mp4|img/niche1.jpg', 'img/niche2.jpg', 'img/niche3.jpg'] },
    { id: 'night-bell',   hour: 'Small hours', title: 'The bell',            line: 'Smoke that forgot how to be smoke.',             hz: 293.66, src: [0.62, 0.52],
      slides: ['media/bell.mp4|img/bell1.jpg', 'img/bell2.jpg', 'img/bell3.jpg'] },
    { id: 'night-moon',   hour: 'Moonset',     title: 'The bowl',            line: 'Seawater holds the moon at low resolution.',     hz: 329.63, src: [0.46, 0.58],
      slides: ['media/moon.mp4|img/moon1.jpg', 'img/moon2.jpg', 'img/moon3.jpg'] },
    { id: 'night-light',  hour: 'First light', title: 'The offering',        line: 'One branch, one flower, morning again.',         hz: 392.00, src: [0.50, 0.30],
      slides: ['img/light1.jpg', 'img/light2.jpg', 'img/light3.jpg'] }
  ];
  var ROOM_NAME = { es: 'El Segundo', pc: 'PointCast' };

  /* ---------- sky: sun and moon, computed (pure functions, exported for tests) ---------- */
  var RAD = Math.PI / 180, DAY = 86400000;
  function jd(ms) { return ms / DAY + 2440587.5; }
  function fromJd(j) { return (j - 2440587.5) * DAY; }
  // Sunrise and sunset (ms) for solar cycle n at this longitude/latitude.
  function sunCycle(n, lat, lonW) {
    var js = n + lonW / 360;
    var M = (357.5291 + 0.98560028 * js) % 360;
    var C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
    var L = (M + C + 180 + 102.9372) % 360;
    var jt = 2451545.0 + js + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
    var sinD = Math.sin(L * RAD) * Math.sin(23.44 * RAD);
    var cosD = Math.cos(Math.asin(sinD));
    var cosW = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinD) / (Math.cos(lat * RAD) * cosD);
    var w = Math.acos(Math.max(-1, Math.min(1, cosW))) / RAD;
    return { rise: fromJd(jt - w / 360), set: fromJd(jt + w / 360) };
  }
  // The night that contains `now` (with a 40-minute shoulder each side), or the next one.
  function nightFor(now, lat, lonW) {
    var SHOULDER = 40 * 60000;
    var n0 = Math.round(jd(now) - 2451545.0 - 0.0009 - lonW / 360);
    var cyc = [];
    for (var k = -2; k <= 2; k++) cyc.push(sunCycle(n0 + k, lat, lonW));
    for (var i = 0; i < cyc.length - 1; i++) {
      var set = cyc[i].set, rise = cyc[i + 1].rise;
      if (now >= set - SHOULDER && now <= rise + SHOULDER) {
        return { live: true, set: set, rise: rise, frac: (now - set) / (rise - set) };
      }
    }
    var next = null;
    for (var j = 0; j < cyc.length; j++) if (cyc[j].set > now && (next === null || cyc[j].set < next)) next = cyc[j].set;
    return { live: false, set: next, rise: null, frac: 0 };
  }
  function stationIndexFor(frac) {
    if (frac < 0.08) return 0;
    if (frac < 0.28) return 1;
    if (frac < 0.50) return 2;
    if (frac < 0.72) return 3;
    if (frac < 0.92) return 4;
    return 5;
  }
  function moon(now) {
    var SYN = 29.530588853;
    var age = ((jd(now) - 2451550.1) % SYN + SYN) % SYN;
    var lit = (1 - Math.cos(2 * Math.PI * age / SYN)) / 2;
    var names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
    var idx = Math.floor((age / SYN) * 8 + 0.5) % 8;
    return { age: age, lit: lit, name: names[idx] };
  }
  // Next common-bell strike at or after `now`.
  function nextStrike(now) { var step = STRIKE_MIN * 60000; return Math.ceil(now / step) * step; }
  // Distinct people in the ledger within `windowMs` of time `t`.
  function countNear(ledger, t, windowMs) {
    var seen = {};
    (ledger || []).forEach(function (e) { if (e && Math.abs(e.t - t) <= windowMs) seen[e.pid] = 1; });
    return Object.keys(seen).length;
  }
  var PURE = { sunCycle: sunCycle, nightFor: nightFor, stationIndexFor: stationIndexFor, moon: moon, nextStrike: nextStrike, countNear: countNear, STATIONS: STATIONS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = PURE; }
  if (typeof document === 'undefined') return;

  /* ---------- state ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var idx = 0, liveIdx = 0, slide = 0, walking = false;
  var skew = 0;                                   // server clock minus device clock
  var counts = {}, rooms = {}, ledger = [], ledgerOk = false, lastSeenT = 0;
  var localCounts = {};
  var myPid = '', sid = '';
  var gather = false, lastStrikeHandled = 0, lastStrikeShown = 0;
  var prayReadyAt = 0;
  function now() { return Date.now() + skew; }

  try { localCounts = JSON.parse(localStorage.getItem('nh:local') || '{}') || {}; } catch (e) { localCounts = {}; }
  try { gather = localStorage.getItem('nh:gather') === '1'; } catch (e) {}
  try {
    sid = localStorage.getItem('pc:sid') || '';
    if (!sid) { sid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem('pc:sid', sid); }
  } catch (e) { sid = String(Math.random()).slice(2) + Date.now(); }
  (function () {
    try {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(sid)).then(function (buf) {
        myPid = Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 10);
      });
    } catch (e) {}
  })();

  /* ---------- sound ---------- */
  var ctx = null, bed = null, bedOn = false;
  function audio() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
    return ctx;
  }
  function bell(hz, gain, voices) {
    var c = audio(); if (!c) return;
    var t = c.currentTime, out = c.createGain();
    out.gain.value = gain; out.connect(c.destination);
    var partials = [[1, .5, 5.5], [2.01, .22, 3.6], [2.76, .14, 2.6], [5.4, .06, 1.4]];
    // Each extra person adds a note above the bell: a fifth, an octave, a tenth…
    var chord = [1, 1.5, 2, 2.5, 3];
    for (var v = 0; v < Math.min(voices || 1, chord.length); v++) {
      partials.forEach(function (p) {
        var o = c.createOscillator(), a = c.createGain();
        o.type = 'sine'; o.frequency.value = hz * chord[v] * p[0];
        var g = p[1] / (1 + v * 0.8);
        a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + .012);
        a.gain.exponentialRampToValueAtTime(.0001, t + p[2]);
        o.connect(a); a.connect(out); o.start(t); o.stop(t + p[2] + .1);
      });
    }
  }
  function startBed() {
    var c = audio(); if (!c || bed) return;
    var out = c.createGain(); out.gain.value = 0; out.connect(c.destination);
    var o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sine'; o2.type = 'sine';
    var g1 = c.createGain(), g2 = c.createGain(); g1.gain.value = .5; g2.gain.value = .28;
    o1.connect(g1); g1.connect(out); o2.connect(g2); g2.connect(out);
    // surf: filtered noise that swells slowly
    var len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var n = c.createBufferSource(); n.buffer = buf; n.loop = true;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    var ng = c.createGain(); ng.gain.value = .35;
    var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .09; lg.gain.value = .25;
    lfo.connect(lg); lg.connect(ng.gain);
    n.connect(lp); lp.connect(ng); ng.connect(out);
    o1.start(); o2.start(); n.start(); lfo.start();
    bed = { out: out, o1: o1, o2: o2 };
    tuneBed();
  }
  function tuneBed() {
    if (!bed || !ctx) return;
    var hz = STATIONS[idx].hz / 2, t = ctx.currentTime;
    bed.o1.frequency.linearRampToValueAtTime(hz, t + 3);
    bed.o2.frequency.linearRampToValueAtTime(hz * 1.498, t + 3);
    bed.out.gain.linearRampToValueAtTime(bedOn ? .07 : 0, t + 2);
  }

  /* ---------- glitch layer: live blocks, never a loop ---------- */
  var cv = null, g = null, blocks = [], COLORS = ['#4f6dff', '#cf52cc', '#7a5cff', '#f3b964'];
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function spawn(n, spread) {
    var s = STATIONS[idx].src;
    for (var i = 0; i < n; i++) {
      blocks.push({
        x: s[0] + (Math.random() - .5) * (spread || .22), y: s[1] + (Math.random() - .5) * (spread || .22),
        vx: (Math.random() - .5) * .0006, vy: -.0004 - Math.random() * .0012,
        size: 1 + Math.floor(Math.random() * 3), life: 1, decay: .004 + Math.random() * .008,
        c: COLORS[(Math.random() * COLORS.length) | 0]
      });
    }
    if (blocks.length > 260) blocks.splice(0, blocks.length - 260);
  }
  function frame() {
    if (!g) return;
    var w = cv.width, h = cv.height, cell = Math.max(4, Math.round(w / 48));
    g.clearRect(0, 0, w, h);
    var others = Math.max(0, countNear(ledger, now(), 120000) - 1);
    if (Math.random() < .10 + others * .12) spawn(1);
    for (var i = blocks.length - 1; i >= 0; i--) {
      var b = blocks[i];
      b.x += b.vx; b.y += b.vy; b.life -= b.decay;
      if (b.life <= 0) { blocks.splice(i, 1); continue; }
      g.globalAlpha = Math.min(1, b.life) * .85;
      g.fillStyle = b.c;
      // snap to the grid so it reads as blocks, not particles
      g.fillRect(Math.round(b.x * w / cell) * cell, Math.round(b.y * h / cell) * cell, cell * b.size, cell * b.size);
    }
    requestAnimationFrame(frame);
  }
  function sizeCanvas() {
    if (!cv) return;
    var r = cv.getBoundingClientRect();
    cv.width = Math.max(120, Math.round(r.width)); cv.height = Math.max(160, Math.round(r.height));
  }

  /* ---------- rendering ---------- */
  function fmtTime(ms) {
    try { return new Date(ms).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return new Date(ms).toLocaleTimeString(); }
  }
  function buildSlides() {
    var well = $('nh-well');
    Array.prototype.slice.call(well.querySelectorAll('img,video')).forEach(function (n) { n.remove(); });
    STATIONS[idx].slides.forEach(function (s, k) {
      var el, parts = s.split('|');
      if (/\.mp4$/.test(parts[0])) {
        el = document.createElement('video');
        el.src = parts[0]; el.poster = parts[1] || ''; el.muted = true; el.loop = true;
        el.playsInline = true; el.setAttribute('playsinline', ''); el.preload = 'metadata';
        el.setAttribute('aria-label', STATIONS[idx].title + ', moving');
      } else {
        el = document.createElement('img');
        el.src = s; el.alt = STATIONS[idx].title + ', view ' + (k + 1); el.decoding = 'async';
      }
      el.dataset.k = k;
      well.insertBefore(el, well.firstChild);
    });
    slide = 0; showSlide();
  }
  function showSlide() {
    var nodes = $('nh-well').querySelectorAll('img,video');
    Array.prototype.forEach.call(nodes, function (n) {
      var on = Number(n.dataset.k) === slide;
      n.classList.toggle('on', on);
      if (n.tagName === 'VIDEO') { if (on) { n.muted = true; n.play().catch(function () {}); } else n.pause(); }
    });
    var cur = STATIONS[idx].slides[slide];
    $('nh-tag').textContent = (/\.mp4/.test(cur) ? 'Moving · ' : 'Still · ') + (slide + 1) + ' of ' + STATIONS[idx].slides.length;
  }
  function stationCount(i) {
    var id = STATIONS[i].id;
    return ledgerOk ? (counts[id] || 0) : (localCounts[id] || 0);
  }
  function render() {
    var s = STATIONS[idx];
    $('nh-hour').textContent = 'Station ' + (idx + 1) + ' of 6 · ' + s.hour + (idx === liveIdx && !walking ? ' · now' : '');
    $('nh-title').textContent = s.title;
    $('nh-line').textContent = s.line;
    $('nh-count').textContent = stationCount(idx);
    $('nh-ledger').textContent = ledgerOk ? 'shared ledger' : 'counting on this device';
    Array.prototype.forEach.call($('nh-dots').children, function (d, n) {
      d.setAttribute('aria-current', n === idx ? 'true' : 'false');
      d.classList.toggle('live', n === liveIdx);
    });
    $('nh-now').hidden = (idx === liveIdx);
    renderRooms();
  }
  function renderRooms() {
    var es = rooms.es || 0, pc = rooms.pc || 0;
    $('nh-room-es').textContent = ledgerOk ? es : '–';
    $('nh-room-pc').textContent = ledgerOk ? pc : '–';
    var others = Math.max(0, countNear(ledger, now(), 120000) - (ledger.some(function (e) { return e.pid === myPid && now() - e.t <= 120000; }) ? 1 : 0));
    $('nh-others').textContent = !ledgerOk ? 'unavailable' : (others === 0 ? 'no one else right now' : others === 1 ? '1 other person' : others + ' other people');
  }
  function renderClock() {
    var t = now(), n = nightFor(t, LAT, LON_W), m = moon(t);
    var newLive = n.live ? stationIndexFor(n.frac) : 0;
    $('nh-time').textContent = fmtTime(t);
    $('nh-sky').textContent = n.live
      ? 'night until ' + fmtTime(n.rise)
      : 'daylight · night opens ' + fmtTime(n.set);
    $('nh-moon').textContent = m.name + ', ' + Math.round(m.lit * 100) + '% lit';
    if (newLive !== liveIdx) { liveIdx = newLive; if (!walking) go(liveIdx, true); else render(); }
    // common bell
    var strike = nextStrike(t), left = Math.max(0, strike - t);
    var mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
    $('nh-strike').textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
    var prev = strike - STRIKE_MIN * 60000;
    if (t - prev < 1500 && prev !== lastStrikeHandled) { lastStrikeHandled = prev; onStrike(prev); }
    if (lastStrikeShown && t - lastStrikeShown < 45000) {
      var c = countNear(ledger, lastStrikeShown, 20000);
      $('nh-struck').textContent = ledgerOk ? (c === 0 ? 'Last bell: no one rang it' : c === 1 ? 'Last bell: 1 person rang it' : 'Last bell: ' + c + ' people rang it together') : '';
    }
    $('nh-pray').disabled = Date.now() < prayReadyAt;
  }
  function go(k, fromClock) {
    idx = (k + STATIONS.length) % STATIONS.length;
    if (!fromClock) walking = (idx !== liveIdx);
    blocks = [];
    buildSlides(); render(); tuneBed();
  }
  function toast(msg) {
    var el = $('nh-toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 4200);
  }
  function flare(cls) {
    var f = $('nh-frame'); f.classList.add(cls);
    setTimeout(function () { f.classList.remove(cls); }, cls === 'strike' ? 2600 : 1400);
  }

  /* ---------- the ledger ---------- */
  function applyState(d) {
    if (!d || !d.ok) return;
    if (typeof d.now === 'number') skew = d.now - Date.now();
    counts = d.counts || {};
    rooms = d.rooms || {};
    // `ledger` is the wide feed with rooms; older servers only have `recent`.
    var feed = Array.isArray(d.ledger) ? d.ledger : (Array.isArray(d.recent) ? d.recent : []);
    var fresh = feed.filter(function (e) { return e.t > lastSeenT && e.pid !== myPid; });
    if (lastSeenT && fresh.length) {
      fresh.slice(0, 3).forEach(function (e, n) {
        var si = STATIONS.findIndex(function (s) { return s.id === e.station; });
        if (si < 0) return;
        setTimeout(function () {
          if (ctx) bell(STATIONS[si].hz, .16, 1);
          spawn(10, .5); flare('flare');
          toast('Someone at ' + STATIONS[si].title.toLowerCase() + (e.room && ROOM_NAME[e.room] ? ' · ' + ROOM_NAME[e.room] + ' room' : ''));
        }, n * 900);
      });
    }
    feed.forEach(function (e) { if (e.t > lastSeenT) lastSeenT = e.t; });
    if (!lastSeenT) lastSeenT = now();
    ledger = feed;
    // The night wing only counts as connected once the server knows its stations.
    ledgerOk = Array.isArray(d.stations) && d.stations.indexOf(STATIONS[0].id) !== -1;
    render();
  }
  function poll() {
    if (document.hidden) return;
    fetch(API, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(applyState).catch(function () { ledgerOk = false; render(); });
  }
  function offer(stationIdx) {
    var id = STATIONS[stationIdx].id;
    localCounts[id] = (localCounts[id] || 0) + 1;
    try { localStorage.setItem('nh:local', JSON.stringify(localCounts)); } catch (e) {}
    if (ledgerOk) { counts[id] = (counts[id] || 0) + 1; rooms[ROOM] = (rooms[ROOM] || 0) + 1; }
    render();
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid, station: id, room: ROOM }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok) { setTimeout(poll, 400); } })
      .catch(function () {});
  }

  /* ---------- actions ---------- */
  function pray() {
    if (Date.now() < prayReadyAt) return;
    prayReadyAt = Date.now() + RATE_MS;            // the ledger takes one prayer per station every 5 seconds
    var s = STATIONS[idx];
    var together = Math.max(1, countNear(ledger, now(), 90000) + (ledger.some(function (e) { return e.pid === myPid; }) ? 0 : 1));
    slide = (slide + 1) % s.slides.length; showSlide();
    var v = $('nh-well').querySelector('video.on');
    if (v) { try { v.currentTime = 0; v.muted = false; v.play().catch(function () { v.muted = true; }); } catch (e) {} bell(s.hz, .22, together); }
    else bell(s.hz, .5, together);
    flare('flare'); spawn(26, .4);
    offer(idx);
  }
  function onStrike(t) {
    lastStrikeShown = t;
    $('nh-struck').textContent = 'The common bell';
    if (!gather) { spawn(14, .6); return; }
    // Everyone with "ring with it" on strikes at the same instant, at the live station.
    bell(STATIONS[liveIdx].hz / 2, .6, 3); flare('strike'); spawn(60, .9);
    toast('The common bell · ' + STATIONS[liveIdx].hour.toLowerCase());
    offer(liveIdx);
    setTimeout(poll, 3000); setTimeout(poll, 9000);
  }

  /* ---------- boot ---------- */
  function boot() {
    var dots = $('nh-dots');
    STATIONS.forEach(function (s, k) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Station ' + (k + 1) + ', ' + s.hour);
      b.addEventListener('click', function () { go(k); });
      dots.appendChild(b);
    });
    cv = $('nh-canvas');
    if (cv && !reduce) { g = cv.getContext('2d'); sizeCanvas(); window.addEventListener('resize', sizeCanvas); requestAnimationFrame(frame); }

    $('nh-pray').addEventListener('click', pray);
    $('nh-prev').addEventListener('click', function () { go(idx - 1); });
    $('nh-next').addEventListener('click', function () { go(idx + 1); });
    $('nh-now').addEventListener('click', function () { walking = false; go(liveIdx, true); });
    var gb = $('nh-gather');
    function paintGather() { gb.setAttribute('aria-pressed', gather ? 'true' : 'false'); gb.textContent = gather ? 'Ringing with it' : 'Ring with it'; }
    gb.addEventListener('click', function () {
      gather = !gather; audio();
      try { localStorage.setItem('nh:gather', gather ? '1' : '0'); } catch (e) {}
      paintGather();
    });
    paintGather();
    var sb = $('nh-sound');
    sb.addEventListener('click', function () {
      bedOn = !bedOn; startBed(); tuneBed();
      sb.setAttribute('aria-pressed', bedOn ? 'true' : 'false'); sb.textContent = bedOn ? 'Sound bed on' : 'Sound bed off';
    });
    var x0 = null, well = $('nh-well');
    well.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    well.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });

    var n = nightFor(now(), LAT, LON_W);
    liveIdx = n.live ? stationIndexFor(n.frac) : 0;
    go(liveIdx, true);
    renderClock(); setInterval(renderClock, 500);
    poll(); setInterval(poll, POLL_MS);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
