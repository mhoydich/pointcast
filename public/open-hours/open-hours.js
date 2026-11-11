/* Open Hours — a shrine for the working day.
 *
 * Six stations follow the business day over El Segundo, from the first key in
 * the lock to the shelf where the wins are kept. Hold PRAY to gather an
 * offering, let go to ring it.
 *
 * Sound is synthesized in the page (no audio files): each station has its own
 * instrument, a reverb made from generated noise, and an optional chime bed
 * that gets busier as the day's prayers add up.
 *
 * Touch: Android phones use the Vibration API. iPhones have no vibration API
 * on the web, so the page toggles a hidden switch control, which Safari
 * answers with a Taptic tick. That path is unofficial and can stop working.
 *
 * The ledger (PointCast's /api/prayer) is optional: when it cannot be reached
 * the shrine still works and counts on this device only.
 */
(function () {
  'use strict';
  var CFG = (typeof window !== 'undefined' && window.OPEN_HOURS) || {};
  var API = CFG.api || '/api/prayer';
  var TZ = 'America/Los_Angeles';
  var HOLD_MAX = 3200;                      // ms of holding for a full offering
  var RATE_MS = 5200;                       // the ledger takes one prayer per station every 5s

  // Pentatonic steps above each station's root, used by the chime bed and the voices.
  var PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3];

  var STATIONS = [
    { id: 'open-bell',  from: 6,  hour: 'Opening',     title: 'The bell on the door',
      line: 'For the key in the lock and whoever walks in first.', ask: 'For a good opening', hz: 261.63, img: 'img/bell.jpg',  voice: 'bell',
      haptic: [28, 70, 28] },
    { id: 'open-coin',  from: 9,  hour: 'First sale',  title: 'The first coin',
      line: 'For the first money of the day, however small.', ask: 'For money coming in', hz: 293.66, img: 'img/coin.jpg',  voice: 'coin',
      haptic: [14, 90, 14, 70, 14, 52, 14, 36, 14, 22, 30] },
    { id: 'open-noon',  from: 11, hour: 'Midday',      title: 'Oranges at noon',
      line: 'For a full room and a line that keeps moving.', ask: 'For customers', hz: 329.63, img: 'img/noon.jpg',  voice: 'marimba',
      haptic: [20, 60, 20, 60, 20, 60, 40] },
    { id: 'open-deal',  from: 14, hour: 'Afternoon',   title: 'Two cups',
      line: 'For the deal that is fair to both sides of the table.', ask: 'For the deal', hz: 196.00, img: 'img/deal.jpg',  voice: 'bowls',
      haptic: [60, 120, 60] },
    { id: 'open-count', from: 17, hour: 'The close',   title: 'The count',
      line: 'For a drawer that comes out right, and a little over.', ask: 'For a good count', hz: 220.00, img: 'img/count.jpg', voice: 'abacus',
      haptic: [10, 60, 10, 50, 10, 40, 10, 30, 10, 20, 10, 20, 70] },
    { id: 'open-shelf', from: 20, hour: 'After hours', title: 'The shelf',
      line: 'For the work that got finished, and the name on it.', ask: 'For the win', hz: 392.00, img: 'img/shelf.jpg', voice: 'fanfare',
      haptic: [20, 50, 30, 50, 45, 50, 90] }
  ];

  /* ---------- pure helpers (exported for tests) ---------- */
  // Hour of day (0-23) in El Segundo for a timestamp.
  function laHour(ms) {
    try {
      var h = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date(ms));
      return parseInt(h, 10) % 24;
    } catch (e) { return new Date(ms).getHours(); }
  }
  // Which station the working day is at. Before opening counts as after hours.
  function stationIndexForHour(h) {
    var idx = STATIONS.length - 1;
    for (var i = 0; i < STATIONS.length; i++) if (h >= STATIONS[i].from) idx = i;
    if (h < STATIONS[0].from) idx = STATIONS.length - 1;
    return idx;
  }
  // 0..1 offering size for a hold of `ms`.
  function offering(ms) { return Math.max(0, Math.min(1, ms / HOLD_MAX)); }
  // Coins shown for an offering: 1 for a tap, up to 9 for a full hold.
  function coinsFor(o) { return 1 + Math.round(o * 8); }
  // Gap between gathering ticks: slow at first, quick near a full offering.
  function tickGap(o) { return Math.round(230 - 170 * o); }
  // Chime bed: seconds between chimes for `n` prayers today. More prayers, busier chimes.
  function chimeGap(n) { return Math.max(1.1, 7 / (1 + Math.log(1 + Math.max(0, n)) / 1.2)); }
  // Turn an Android vibration pattern into the tick times (ms) used on iPhone.
  function tickTimes(pattern) {
    var t = 0, out = [];
    for (var i = 0; i < pattern.length; i++) { if (i % 2 === 0) out.push(t); t += pattern[i]; }
    return out;
  }
  var PURE = { STATIONS: STATIONS, laHour: laHour, stationIndexForHour: stationIndexForHour, offering: offering,
    coinsFor: coinsFor, tickGap: tickGap, chimeGap: chimeGap, tickTimes: tickTimes };
  if (typeof module !== 'undefined' && module.exports) { module.exports = PURE; }
  if (typeof document === 'undefined') return;

  /* ---------- state ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var idx = 0, liveIdx = 0, walking = false;
  var counts = {}, ledgerOk = false, local = {}, today = { day: '', n: 0 }, wins = [];
  var sid = '', readyAt = 0;
  var holdStart = 0, holding = false, tickTimer = 0;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  local = store.get('oh:local', {}) || {};
  wins = store.get('oh:wins', []) || [];
  today = store.get('oh:today', { day: '', n: 0 }) || { day: '', n: 0 };
  var dayKey = new Date().toISOString().slice(0, 10);
  if (today.day !== dayKey) today = { day: dayKey, n: 0 };
  try {
    sid = localStorage.getItem('pc:sid') || '';
    if (!sid) { sid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem('pc:sid', sid); }
  } catch (e) { sid = String(Math.random()).slice(2) + Date.now(); }

  /* ---------- touch ---------- */
  var hapticOn = store.get('oh:haptic', true) !== false;
  var canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var switchLabel = null;
  if (!canVibrate && isIOS) {
    // Safari ticks the Taptic Engine when a switch control is toggled through its label.
    var sw = document.createElement('input');
    sw.type = 'checkbox'; sw.id = 'oh-taptic'; sw.setAttribute('switch', '');
    sw.setAttribute('aria-hidden', 'true'); sw.tabIndex = -1;
    switchLabel = document.createElement('label');
    switchLabel.htmlFor = 'oh-taptic'; switchLabel.setAttribute('aria-hidden', 'true');
    var holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0';
    holder.appendChild(sw); holder.appendChild(switchLabel);
    document.body.appendChild(holder);
  }
  var hapticMode = canVibrate ? 'vibrate' : (switchLabel ? 'taptic' : 'none');
  function tick() {
    if (!hapticOn) return;
    if (hapticMode === 'vibrate') { try { navigator.vibrate(12); } catch (e) {} }
    else if (hapticMode === 'taptic') { try { switchLabel.click(); } catch (e) {} }
  }
  function buzz(pattern) {
    if (!hapticOn) return;
    if (hapticMode === 'vibrate') { try { navigator.vibrate(pattern); } catch (e) {} }
    else if (hapticMode === 'taptic') {
      tickTimes(pattern).forEach(function (t) { setTimeout(function () { try { switchLabel.click(); } catch (e) {} }, t); });
    }
  }

  /* ---------- sound ---------- */
  var ctx = null, master = null, wet = null, bedOn = false, bedTimer = 0, drone = null, charge = null;
  function audio() {
    try {
      if (!ctx) {
        // Play through the iPhone ring/silent switch, the way a music app does.
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.ratio.value = 4;
        master = ctx.createGain(); master.gain.value = 0.9;
        master.connect(comp); comp.connect(ctx.destination);
        // A room made of noise: three seconds of decaying static as the reverb impulse.
        var len = Math.floor(ctx.sampleRate * 3), ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
          var d = ir.getChannelData(ch);
          for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
        }
        var conv = ctx.createConvolver(); conv.buffer = ir;
        wet = ctx.createGain(); wet.gain.value = 0.34;
        wet.connect(conv); conv.connect(master);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
    return ctx;
  }
  // One enveloped oscillator, sent dry and to the room, placed left to right with `pan`.
  function tone(o) {
    var c = ctx, t = c.currentTime + (o.at || 0);
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.hz, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || o.dur));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), t + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    var out = g;
    if (c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = o.pan || 0; g.connect(p); out = p; }
    osc.connect(g); out.connect(master); out.connect(wet);
    osc.start(t); osc.stop(t + o.dur + 0.05);
  }
  // A short burst of filtered noise: a click, a bead, a drawer.
  function click(o) {
    var c = ctx, t = c.currentTime + (o.at || 0);
    var len = Math.floor(c.sampleRate * (o.dur || 0.04)), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.hz || 2400; f.Q.value = o.q || 4;
    var g = c.createGain(); g.gain.value = o.gain || 0.2;
    src.connect(f); f.connect(g); g.connect(master); g.connect(wet);
    src.start(t);
  }
  var VOICES = {
    // Two strikes of a small brass bell.
    bell: function (hz, k) {
      [0, 0.19].forEach(function (at, n) {
        [[2, 0.34, 2.6], [4.1, 0.2, 1.7], [5.43, 0.12, 1.2], [8.2, 0.06, 0.7]].forEach(function (p) {
          tone({ hz: hz * p[0], gain: p[1] * k * (n ? 0.7 : 1), dur: p[2] * (0.6 + k * 0.6), at: at, pan: n ? 0.25 : -0.25 });
        });
      });
    },
    // A coin spun on the counter: the ring, then the wobble speeding up as it settles.
    coin: function (hz, k) {
      tone({ hz: hz * 8, gain: 0.3 * k, dur: 1.6, pan: -0.1 });
      tone({ hz: hz * 8 * 1.342, gain: 0.16 * k, dur: 1.1, pan: 0.2 });
      var at = 0.12, gap = 0.16;
      for (var i = 0; i < 12; i++) {
        click({ at: at, hz: 5200 + i * 160, q: 9, gain: 0.1 * k * (1 - i / 16), dur: 0.03 });
        tone({ hz: hz * 6 + i * 18, gain: 0.05 * k, dur: 0.09, at: at, pan: (i % 2 ? 0.4 : -0.4) });
        at += gap; gap *= 0.8;
      }
    },
    // Warm wooden notes running up the scale, one per person in line.
    marimba: function (hz, k) {
      [0, 2, 3, 5, 7].forEach(function (s, i) {
        var f = hz * PENTA[s];
        tone({ hz: f, gain: 0.34 * k, dur: 0.7, at: i * 0.11, pan: -0.5 + i * 0.25, attack: 0.004 });
        tone({ hz: f * 4, gain: 0.07 * k, dur: 0.12, at: i * 0.11, pan: -0.5 + i * 0.25, attack: 0.002 });
      });
    },
    // Two bowls a fifth apart, one from each side, slightly detuned so they beat together.
    bowls: function (hz, k) {
      [[1, -0.7, 0], [1.5, 0.7, 0.35]].forEach(function (b) {
        [[1, 0.4, 6], [1.004, 0.3, 6], [2.71, 0.1, 3.2], [5.1, 0.04, 1.6]].forEach(function (p) {
          tone({ hz: hz * b[0] * p[0], gain: p[1] * k, dur: p[2] * (0.6 + 0.5 * k), at: b[2], pan: b[1], attack: 0.03 });
        });
      });
    },
    // Beads sliding across, faster and faster, then the total.
    abacus: function (hz, k) {
      var at = 0, gap = 0.13;
      for (var i = 0; i < 10; i++) {
        click({ at: at, hz: 1500 + (i % 3) * 420, q: 6, gain: 0.26 * k, dur: 0.035 });
        at += gap; gap *= 0.86;
      }
      [1, 1.25, 1.5, 2].forEach(function (r, i) {
        tone({ hz: hz * 2 * r, gain: 0.2 * k, dur: 2.4, at: at + 0.05, pan: -0.3 + i * 0.2, type: 'triangle' });
      });
    },
    // A rising figure that lands an octave up and stays.
    fanfare: function (hz, k) {
      [[1, 0], [1.25, 0.14], [1.5, 0.28], [2, 0.44]].forEach(function (n, i) {
        var last = i === 3;
        tone({ hz: hz * n[0], gain: (last ? 0.34 : 0.24) * k, dur: last ? 4.2 : 0.5, at: n[1], type: 'triangle', pan: -0.3 + i * 0.2 });
        tone({ hz: hz * n[0] * 2, gain: 0.08 * k, dur: last ? 3 : 0.3, at: n[1], pan: 0.3 - i * 0.2 });
      });
    }
  };
  function ring(st, o) {
    if (!audio()) return;
    VOICES[st.voice](st.hz, 0.45 + 0.55 * o);
  }
  // While PRAY is held: a low tone that rises and opens as the offering gathers.
  function startCharge(st) {
    if (!audio() || charge) return;
    var c = ctx, t = c.currentTime;
    var osc = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(st.hz / 2, t);
    osc.frequency.exponentialRampToValueAtTime(st.hz, t + HOLD_MAX / 1000);
    f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(180, t);
    f.frequency.exponentialRampToValueAtTime(2200, t + HOLD_MAX / 1000);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + HOLD_MAX / 1000);
    osc.connect(f); f.connect(g); g.connect(master); g.connect(wet);
    osc.start(t);
    charge = { osc: osc, g: g };
  }
  function stopCharge() {
    if (!charge || !ctx) return;
    var t = ctx.currentTime, ch = charge; charge = null;
    try {
      ch.g.gain.cancelScheduledValues(t);
      ch.g.gain.setValueAtTime(Math.max(0.0001, ch.g.gain.value), t);
      ch.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      ch.osc.stop(t + 0.16);
    } catch (e) {}
  }
  // The bed: a root drone and wind chimes on the station's scale. Busier as today's prayers add up.
  function chime() {
    if (!bedOn || !ctx) return;
    var st = STATIONS[idx], step = PENTA[Math.floor(Math.random() * PENTA.length)];
    var f = st.hz * 2 * step, pan = Math.random() * 1.6 - 0.8;
    tone({ hz: f, gain: 0.07, dur: 2.6, pan: pan, attack: 0.005 });
    tone({ hz: f * 2.76, gain: 0.02, dur: 1.1, pan: pan });
    var gap = chimeGap(today.n) * (0.5 + Math.random());
    bedTimer = setTimeout(chime, gap * 1000);
  }
  function setDrone() {
    if (!ctx) return;
    var t = ctx.currentTime;
    if (!bedOn) {
      if (drone) { drone.g.gain.setTargetAtTime(0.0001, t, 0.4); var d = drone; drone = null; setTimeout(function () { try { d.a.stop(); d.b.stop(); } catch (e) {} }, 2500); }
      return;
    }
    var hz = STATIONS[idx].hz / 2;
    if (!drone) {
      var a = ctx.createOscillator(), b = ctx.createOscillator(), g = ctx.createGain();
      a.type = 'sine'; b.type = 'sine'; g.gain.value = 0.0001;
      a.connect(g); b.connect(g); g.connect(master); g.connect(wet);
      a.start(); b.start();
      drone = { a: a, b: b, g: g };
    }
    drone.a.frequency.setTargetAtTime(hz, t, 0.8);
    drone.b.frequency.setTargetAtTime(hz * 1.5 * 1.003, t, 0.8);
    drone.g.gain.setTargetAtTime(0.05, t, 1.2);
  }
  function setBed(on) {
    bedOn = on;
    clearTimeout(bedTimer);
    if (on) { if (!audio()) { bedOn = false; return; } setDrone(); bedTimer = setTimeout(chime, 600); }
    else setDrone();
    var b = $('oh-sound');
    b.setAttribute('aria-pressed', String(bedOn));
    b.textContent = bedOn ? 'Chime bed on' : 'Chime bed off';
  }

  /* ---------- picture: coins rising as squares of light ---------- */
  var canvas = $('oh-canvas'), g2 = canvas.getContext('2d'), parts = [], raf = 0;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  }
  function spawn(n, o) {
    if (reduce) return;
    var W = canvas.width, H = canvas.height, hues = [44, 38, 50, 150];
    for (var i = 0; i < n * 5; i++) {
      var s = (8 + Math.random() * 26) * (W / 400);
      parts.push({ x: W * (0.2 + Math.random() * 0.6), y: H * (0.72 + Math.random() * 0.2), s: s,
        vy: -(0.6 + Math.random() * 1.6 + o * 1.4) * (H / 500), vx: (Math.random() - 0.5) * 0.5,
        life: 1, fade: 0.006 + Math.random() * 0.01, hue: hues[Math.floor(Math.random() * hues.length)] });
    }
    if (!raf) raf = requestAnimationFrame(draw);
  }
  function draw() {
    g2.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter(function (p) { return p.life > 0; });
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.life -= p.fade;
      g2.fillStyle = 'hsla(' + p.hue + ',85%,62%,' + Math.max(0, p.life * 0.55) + ')';
      var q = Math.round(p.s);
      g2.fillRect(Math.round(p.x / q) * q, Math.round(p.y / q) * q, q, q);
    });
    raf = parts.length ? requestAnimationFrame(draw) : 0;
  }

  /* ---------- page ---------- */
  function toast(msg) {
    var t = $('oh-toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function countFor(id) { return ledgerOk && typeof counts[id] === 'number' ? counts[id] : (local[id] || 0); }
  function show(i) {
    idx = (i + STATIONS.length) % STATIONS.length;
    var st = STATIONS[idx];
    var imgs = $('oh-well').querySelectorAll('img');
    imgs.forEach(function (im, n) { im.classList.toggle('on', n === idx); });
    $('oh-hour').textContent = st.hour + (idx === liveIdx ? ' · now' : '');
    $('oh-title').textContent = st.title;
    $('oh-line').textContent = st.line;
    $('oh-tag').textContent = st.ask;
    $('oh-count').textContent = countFor(st.id).toLocaleString();
    $('oh-ledger').textContent = ledgerOk ? 'shared ledger' : 'counting on this device';
    document.querySelectorAll('#oh-dots button').forEach(function (b, n) {
      b.setAttribute('aria-current', String(n === idx)); b.classList.toggle('live', n === liveIdx);
    });
    $('oh-now').hidden = idx === liveIdx;
    if (bedOn) setDrone();
  }
  function clock() {
    var nowMs = Date.now();
    var t = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(nowMs));
    $('oh-time').textContent = t;
    var li = stationIndexForHour(laHour(nowMs));
    if (li !== liveIdx) { liveIdx = li; if (!walking) show(liveIdx); else show(idx); }
    $('oh-day').textContent = STATIONS[liveIdx].hour;
    $('oh-today').textContent = today.n + (today.n === 1 ? ' prayer' : ' prayers') + ' from this device today';
  }
  function loadLedger() {
    fetch(API, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok && j.counts && Array.isArray(j.stations) && j.stations.indexOf('open-bell') !== -1) {
        counts = j.counts; ledgerOk = true; show(idx);
      }
    }).catch(function () {});
  }
  function post(st) {
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, station: st.id }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) { counts[st.id] = j.count; ledgerOk = true; if (STATIONS[idx].id === st.id) show(idx); } })
      .catch(function () {});
  }
  function begin(e) {
    if (holding) return;
    if (Date.now() < readyAt) { toast('The ledger takes one prayer every five seconds.'); return; }
    if (e && e.preventDefault) e.preventDefault();
    holding = true; holdStart = Date.now();
    $('oh-pray').classList.add('held');
    startCharge(STATIONS[idx]);
    (function loop() {
      if (!holding) return;
      var o = offering(Date.now() - holdStart);
      $('oh-fill').style.width = Math.round(o * 100) + '%';
      tick();
      if (o >= 1) { release(); return; }
      tickTimer = setTimeout(loop, tickGap(o));
    })();
  }
  function release() {
    if (!holding) return;
    holding = false; clearTimeout(tickTimer); stopCharge();
    var st = STATIONS[idx], o = offering(Date.now() - holdStart), n = coinsFor(o);
    $('oh-pray').classList.remove('held');
    $('oh-fill').style.width = '0%';
    ring(st, o); buzz(st.haptic); spawn(n, o);
    var fr = $('oh-frame'); fr.classList.add(o > 0.7 ? 'strike' : 'flare');
    setTimeout(function () { fr.classList.remove('strike'); fr.classList.remove('flare'); }, 1400);
    local[st.id] = (local[st.id] || 0) + 1; store.set('oh:local', local);
    today.n += 1; store.set('oh:today', today);
    if (ledgerOk) counts[st.id] = (counts[st.id] || 0) + 1;
    readyAt = Date.now() + RATE_MS;
    toast(st.ask + ' · ' + n + (n === 1 ? ' coin' : ' coins') + ' offered');
    show(idx); clock(); post(st);
  }
  function renderWins() {
    var ul = $('oh-wins'); ul.innerHTML = '';
    wins.slice(0, 12).forEach(function (w) {
      var li = document.createElement('li'), d = document.createElement('span'), t = document.createElement('span');
      d.textContent = w.d; t.textContent = w.t; li.appendChild(d); li.appendChild(t); ul.appendChild(li);
    });
    $('oh-wins-none').hidden = wins.length > 0;
  }

  function init() {
    var well = $('oh-well');
    STATIONS.forEach(function (st, n) {
      var im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = st.img;
      well.insertBefore(im, canvas);
      var b = document.createElement('button');
      b.setAttribute('aria-label', st.hour + ': ' + st.title);
      b.addEventListener('click', function () { walking = n !== liveIdx; show(n); });
      $('oh-dots').appendChild(b);
    });
    size(); window.addEventListener('resize', size);
    liveIdx = stationIndexForHour(laHour(Date.now())); show(liveIdx); clock();
    setInterval(clock, 20000);
    loadLedger();

    var pray = $('oh-pray');
    pray.addEventListener('pointerdown', begin);
    pray.addEventListener('pointerup', release);
    pray.addEventListener('pointerleave', release);
    pray.addEventListener('pointercancel', release);
    pray.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    pray.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) begin(e); });
    pray.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') release(); });
    $('oh-prev').addEventListener('click', function () { walking = true; show(idx - 1); walking = idx !== liveIdx; });
    $('oh-next').addEventListener('click', function () { walking = true; show(idx + 1); walking = idx !== liveIdx; });
    $('oh-now').addEventListener('click', function () { walking = false; show(liveIdx); });
    $('oh-sound').addEventListener('click', function () { setBed(!bedOn); });

    var hb = $('oh-haptic');
    var names = { vibrate: 'Vibration', taptic: 'Taptic ticks (iPhone, unofficial)', none: 'No touch feedback on this device' };
    $('oh-haptic-kind').textContent = names[hapticMode];
    function paintHaptic() {
      hb.setAttribute('aria-pressed', String(hapticOn && hapticMode !== 'none'));
      hb.textContent = hapticMode === 'none' ? 'Unavailable' : (hapticOn ? 'Touch on' : 'Touch off');
      hb.disabled = hapticMode === 'none';
    }
    hb.addEventListener('click', function () { hapticOn = !hapticOn; store.set('oh:haptic', hapticOn); paintHaptic(); if (hapticOn) buzz([20, 40, 20]); });
    paintHaptic();

    $('oh-win-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = $('oh-win'), text = inp.value.trim().slice(0, 140);
      if (!text) return;
      var d = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric' }).format(new Date());
      wins.unshift({ d: d, t: text }); wins = wins.slice(0, 60); store.set('oh:wins', wins);
      inp.value = ''; renderWins();
      var shelf = STATIONS[STATIONS.length - 1];
      ring(shelf, 1); buzz(shelf.haptic); spawn(6, 1);
    });
    renderWins();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
