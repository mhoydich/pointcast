import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { $ as $$RoomPresenceChip } from './RoomPresenceChip_Dur7KbDI.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumBirthday = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$DrumBirthday;
  const title = "/drum-birthday — birthday imprint hub";
  const description = "A collaborative birthday drum hub. Tap the big drum, watch confetti rise as visitors join in, then send the link to anyone you love. Customizable greeting via ?for= ?from= ?age=.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-birthday",
    name: "PointCast Drum · Birthday Imprint",
    url: "https://pointcast.xyz/drum-birthday",
    description
  };
  const siblings = [
    { href: "/drum-cake", label: "cake", sub: "candles", blurb: "Stack candles. Tap to light them. Blow them out together." },
    { href: "/drum-card", label: "card", sub: "signatures", blurb: "Pass around a giant office card. Leave a one-line signature." },
    { href: "/drum-pinata", label: "pinata", sub: "burst", blurb: "Beat the piñata together until it bursts. Candy for everyone." }
  ];
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () { 'use strict';
  // ─── DOM refs ────────────────────────────────────────────────────────
  var forEl = document.getElementById('db-for');
  var fromEl = document.getElementById('db-from');
  var ageEl = document.getElementById('db-age');
  var ageLineEl = document.getElementById('db-age-line');
  var hintEl = document.getElementById('db-hint');

  var tap = document.getElementById('db-tap');
  var note = document.getElementById('db-note');
  var mineEl = document.getElementById('db-mine');
  var roomEl = document.getElementById('db-room');
  var fillEl = document.getElementById('db-fill');
  var confettiEl = document.getElementById('db-confetti');

  var copyBtn = document.getElementById('db-copy');
  var tweetA = document.getElementById('db-tweet');
  var nativeBtn = document.getElementById('db-native');
  var shareStatus = document.getElementById('db-share-status');

  var feed = document.getElementById('db-feed');

  // ─── URL params ──────────────────────────────────────────────────────
  function clean(s) { return (s == null ? '' : String(s)).slice(0, 40).replace(/[<>]/g, ''); }
  var params = new URLSearchParams(window.location.search);
  var forName = clean(params.get('for'));
  var fromName = clean(params.get('from'));
  var ageRaw = params.get('age');
  var age = ageRaw && /^\\d{1,3}$/.test(ageRaw) ? Number(ageRaw) : null;

  if (forName) {
    forEl.textContent = forName;
    forEl.classList.add('db__title--named');
  }
  if (fromName) {
    fromEl.textContent = fromName;
  }
  if (age != null) {
    ageEl.textContent = String(age);
    ageLineEl.hidden = false;
  }
  if (forName || fromName || age != null) {
    hintEl.hidden = true;
  }

  // ─── Session / pid ───────────────────────────────────────────────────
  function getSession() {
    try {
      var k = 'pc:session';
      var s = localStorage.getItem(k);
      if (!s) {
        s = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(k, s);
      }
      return s;
    } catch (e) { return 'db-' + Math.random().toString(36).slice(2, 10); }
  }
  function nounIdFor(sid) {
    var h = 5381;
    for (var i = 0; i < sid.length; i++) h = (h * 33 + sid.charCodeAt(i)) & 0x7fffffff;
    return h % 1200;
  }
  var sid = getSession();
  var storedNoun = 0;
  try {
    var n = localStorage.getItem('pc:nounId');
    storedNoun = n ? Number(n) : nounIdFor(sid);
  } catch (e) { storedNoun = nounIdFor(sid); }
  if (!Number.isFinite(storedNoun) || storedNoun < 0 || storedNoun > 1199) storedNoun = nounIdFor(sid);
  try { localStorage.setItem('pc:nounId', String(storedNoun)); } catch (e) {}

  var shortPid = '';
  try {
    if (window.crypto && crypto.subtle) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(sid)).then(function (buf) {
        var arr = Array.from(new Uint8Array(buf)).slice(0, 5);
        shortPid = arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 8);
      }).catch(function () {});
    }
  } catch (e) {}

  // ─── Audio: short bass-drum thump ────────────────────────────────────
  var audioCtx = null;
  function getAudio() {
    if (audioCtx) return audioCtx;
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }
  function playThump() {
    var ctx = getAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.18);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);

    // tiny click on top for snap
    var click = ctx.createOscillator();
    var cgain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(700, t);
    cgain.gain.setValueAtTime(0.0001, t);
    cgain.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
    cgain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    click.connect(cgain).connect(ctx.destination);
    click.start(t);
    click.stop(t + 0.06);
  }

  // ─── Confetti ────────────────────────────────────────────────────────
  var PALETTE = ['#d6346a', '#f0c431', '#3aa9c4', '#2f8c69', '#11100c'];
  var THRESHOLDS = [10, 50, 100, 250];
  var thresholdsHit = {};

  function spawnConfetti(count) {
    var n = Math.min(count, 80);
    for (var i = 0; i < n; i++) {
      var d = document.createElement('span');
      d.className = 'db__dot';
      var color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      d.style.background = color;
      var left = Math.random() * 100;
      var size = 6 + Math.random() * 10;
      var rot = Math.floor(Math.random() * 360);
      var dur = 1.6 + Math.random() * 1.6;
      var delay = Math.random() * 0.4;
      d.style.left = left + '%';
      d.style.width = size + 'px';
      d.style.height = (size * 0.6) + 'px';
      d.style.transform = 'rotate(' + rot + 'deg)';
      d.style.animationDuration = dur + 's';
      d.style.animationDelay = delay + 's';
      // shape variety
      if (Math.random() < 0.3) d.style.borderRadius = '50%';
      else if (Math.random() < 0.5) d.style.borderRadius = '2px';
      confettiEl.appendChild(d);
      // cleanup
      (function (node, totalMs) {
        setTimeout(function () { if (node && node.parentNode) node.parentNode.removeChild(node); }, totalMs);
      })(d, (dur + delay) * 1000 + 200);
    }
  }

  function checkThresholds(total) {
    for (var i = 0; i < THRESHOLDS.length; i++) {
      var t = THRESHOLDS[i];
      if (total >= t && !thresholdsHit[t]) {
        thresholdsHit[t] = true;
        spawnConfetti(20 + i * 18);
        flashCelebrate('★ ' + t + ' taps · the room is celebrating');
      }
    }
  }

  function flashCelebrate(msg) {
    note.textContent = msg;
    note.classList.add('db__meter-note--celebrate');
    setTimeout(function () { note.classList.remove('db__meter-note--celebrate'); }, 2200);
  }

  // ─── State ───────────────────────────────────────────────────────────
  var myTaps = 0;
  var roomTotal = 0;

  function updateFill() {
    var max = 250;
    var pct = Math.min(100, (roomTotal / max) * 100);
    fillEl.style.width = pct + '%';
  }

  // ─── Tap handler ─────────────────────────────────────────────────────
  function fireTap() {
    // Haptic feedback for mobile (taps without sound).
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    myTaps += 1;
    mineEl.textContent = String(myTaps);
    tap.classList.remove('db__tap--hit'); void tap.offsetWidth; tap.classList.add('db__tap--hit');
    playThump();
    spawnConfetti(8);
    note.textContent = 'transmitting · type=birthday';

    var payload = {
      type: 'birthday',
      sessionId: sid,
      nounId: storedNoun,
      note: forName ? ('for=' + forName) : 'tap',
    };
    fetch('/api/sounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.ok) {
          note.textContent = '✓ transmitted · ' + (myTaps === 1 ? 'first tap landed' : 'tap ' + myTaps);
        } else {
          note.textContent = '✗ ' + (data && data.reason ? data.reason : 'send failed');
        }
      }).catch(function () { note.textContent = '✗ offline · still tapping locally'; });

    // optimistic local count too — feels alive even if network hasn't echoed
    roomTotal += 1;
    roomEl.textContent = String(roomTotal);
    updateFill();
    checkThresholds(roomTotal);
  }

  tap.addEventListener('mousedown', function (e) { fireTap(); e.preventDefault(); });
  tap.addEventListener('touchstart', function (e) { fireTap(); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      // only act if the tap pad isn't blurred behind a focused input/textarea
      var ae = document.activeElement;
      var tag = ae && ae.tagName ? ae.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      fireTap();
      e.preventDefault();
    }
  });

  // ─── Polling /api/sounds ─────────────────────────────────────────────
  // Hydrate from existing room state on load — without this, the room
  // counter starts at 0 even if 50 visitors just tapped, so a guest
  // landing mid-party can't tell anyone else is here. Pull the last
  // 30s window once at boot, fold it into roomTotal, render the most
  // recent 5 events into the feed. Fixes Mike 2026-04-29:
  // "morgan and i visited from mobile, didn't see the clicks."
  var lastTs = Date.now() - 30_000;
  var hydrated = false;
  function hydrate() {
    if (hydrated) return;
    fetch('/api/sounds?since=' + (Date.now() - 30_000), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var events = Array.isArray(data.events) ? data.events : [];
        var bdays = events.filter(function (e) { return e.type === 'birthday'; });
        if (bdays.length) {
          roomTotal += bdays.length;
          roomEl.textContent = String(roomTotal);
          updateFill();
          // Render the last 5 (newest first via prepend) so the feed
          // shows real other-visitor activity from the moment of arrival.
          var slice = bdays.slice(-5);
          for (var i = 0; i < slice.length; i++) {
            var e = slice[i];
            var mine = shortPid && e.pid === shortPid;
            addFeedRow(e, !!mine);
          }
          if (events.length) lastTs = events[events.length - 1].t || lastTs;
        }
        hydrated = true;
      }).catch(function () { hydrated = true; });
  }
  hydrate();

  function fmtTime(t) {
    var d = new Date(t || Date.now());
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
  }

  function addFeedRow(e, isSelf) {
    var emptyEl = feed.querySelector('.db__feed-empty');
    if (emptyEl) emptyEl.remove();
    var li = document.createElement('li');
    li.className = 'db__feed-row mono' + (isSelf ? ' db__feed-row--self' : '');
    var pid = (e.pid || '').slice(0, 8) || '—';
    var extra = e.note || '';
    li.innerHTML =
      '<span class="db__feed-time"></span>' +
      '<span class="db__feed-tag">[birthday]</span>' +
      '<span class="db__feed-pid">pid=' + pid + '</span>' +
      '<span class="db__feed-extra"></span>';
    li.querySelector('.db__feed-time').textContent = fmtTime(e.t);
    li.querySelector('.db__feed-extra').textContent = extra;
    feed.prepend(li);
    var rows = feed.querySelectorAll('.db__feed-row');
    for (var i = 5; i < rows.length; i++) rows[i].remove();
  }

  // Tap-together pulse — when a non-self event lands, briefly highlight
  // the room counter + fire a small ring animation around the tap pad
  // so the visitor SEES that someone else just tapped. Per Mike
  // 2026-04-29: "morgan and i visited from mobile, didn't see the
  // clicks." The /api/visit chip handles presence; this handles
  // *transient* signals — Morgan tapped right now, here's the visual.
  function pulseFromOther() {
    if (!roomEl) return;
    roomEl.classList.remove('db__count-other');
    void roomEl.offsetWidth;
    roomEl.classList.add('db__count-other');
    if (tap) {
      tap.classList.remove('db__tap--echo');
      void tap.offsetWidth;
      tap.classList.add('db__tap--echo');
    }
  }

  function poll() {
    fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var events = Array.isArray(data.events) ? data.events : [];
        if (!events.length) return;
        lastTs = events[events.length - 1].t || Date.now();
        var sawOther = false;
        events.forEach(function (e) {
          if (e.type !== 'birthday') return;
          // self-filter: skip our own broadcasts (we already counted optimistically)
          var fresh = Math.abs((e.t || 0) - Date.now()) < 4000;
          var mine = shortPid && e.pid === shortPid;
          if (fresh && mine) return;
          addFeedRow(e, false);
          roomTotal += 1;
          roomEl.textContent = String(roomTotal);
          updateFill();
          checkThresholds(roomTotal);
          sawOther = true;
        });
        if (sawOther) pulseFromOther();
      }).catch(function () {});
  }
  setInterval(poll, 2000);
  poll();

  // ─── Share row ───────────────────────────────────────────────────────
  function buildShareUrl() {
    var url = new URL(window.location.href);
    // strip and rewrite to a clean canonical form
    var qp = new URLSearchParams();
    if (forName) qp.set('for', forName);
    if (fromName) qp.set('from', fromName);
    if (age != null) qp.set('age', String(age));
    var base = url.origin + url.pathname;
    var qs = qp.toString();
    return qs ? base + '?' + qs : base;
  }
  function buildShareText() {
    if (forName && fromName) return 'tapping the birthday drum for ' + forName + ' — from ' + fromName + ' · pointcast.xyz';
    if (forName) return 'tapping the birthday drum for ' + forName + ' · pointcast.xyz';
    return 'a collaborative birthday drum room · tap with us · pointcast.xyz';
  }
  function setShareStatus(msg) {
    shareStatus.textContent = msg;
    if (msg) setTimeout(function () { if (shareStatus.textContent === msg) shareStatus.textContent = ' '; }, 2400);
  }

  // tweet link
  function refreshTweet() {
    var u = encodeURIComponent(buildShareUrl());
    var t = encodeURIComponent(buildShareText());
    tweetA.href = 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u;
  }
  refreshTweet();

  // copy link
  copyBtn.addEventListener('click', function () {
    var url = buildShareUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        setShareStatus('✓ link copied · ' + url);
      }).catch(function () { fallbackCopy(url); });
    } else {
      fallbackCopy(url);
    }
  });
  function fallbackCopy(url) {
    try {
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareStatus('✓ link copied · ' + url);
    } catch (e) { setShareStatus('couldn’t copy — link: ' + url); }
  }

  // native share API — promote to primary CTA on mobile (Web Share is
  // a one-tap path to iMessage / WhatsApp / system share sheet, way
  // cheaper than copy + paste). On desktop it stays a tertiary option.
  if (navigator.share) {
    nativeBtn.hidden = false;
    var isCoarse = false;
    try { isCoarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
    if (isCoarse) nativeBtn.classList.add('db__share-btn--primary');
    nativeBtn.addEventListener('click', function () {
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
      navigator.share({
        title: 'Birthday drum · PointCast',
        text: buildShareText(),
        url: buildShareUrl(),
      }).then(function () { setShareStatus('✓ shared'); })
        .catch(function (err) {
          if (err && err.name === 'AbortError') return;
          setShareStatus('share canceled');
        });
    });
  }

  // ─── First-paint micro-confetti so the page never feels dead ─────────
  setTimeout(function () { spawnConfetti(14); }, 320);
})();
<\/script>`], ["", ` <script>
(function () { 'use strict';
  // ─── DOM refs ────────────────────────────────────────────────────────
  var forEl = document.getElementById('db-for');
  var fromEl = document.getElementById('db-from');
  var ageEl = document.getElementById('db-age');
  var ageLineEl = document.getElementById('db-age-line');
  var hintEl = document.getElementById('db-hint');

  var tap = document.getElementById('db-tap');
  var note = document.getElementById('db-note');
  var mineEl = document.getElementById('db-mine');
  var roomEl = document.getElementById('db-room');
  var fillEl = document.getElementById('db-fill');
  var confettiEl = document.getElementById('db-confetti');

  var copyBtn = document.getElementById('db-copy');
  var tweetA = document.getElementById('db-tweet');
  var nativeBtn = document.getElementById('db-native');
  var shareStatus = document.getElementById('db-share-status');

  var feed = document.getElementById('db-feed');

  // ─── URL params ──────────────────────────────────────────────────────
  function clean(s) { return (s == null ? '' : String(s)).slice(0, 40).replace(/[<>]/g, ''); }
  var params = new URLSearchParams(window.location.search);
  var forName = clean(params.get('for'));
  var fromName = clean(params.get('from'));
  var ageRaw = params.get('age');
  var age = ageRaw && /^\\\\d{1,3}$/.test(ageRaw) ? Number(ageRaw) : null;

  if (forName) {
    forEl.textContent = forName;
    forEl.classList.add('db__title--named');
  }
  if (fromName) {
    fromEl.textContent = fromName;
  }
  if (age != null) {
    ageEl.textContent = String(age);
    ageLineEl.hidden = false;
  }
  if (forName || fromName || age != null) {
    hintEl.hidden = true;
  }

  // ─── Session / pid ───────────────────────────────────────────────────
  function getSession() {
    try {
      var k = 'pc:session';
      var s = localStorage.getItem(k);
      if (!s) {
        s = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(k, s);
      }
      return s;
    } catch (e) { return 'db-' + Math.random().toString(36).slice(2, 10); }
  }
  function nounIdFor(sid) {
    var h = 5381;
    for (var i = 0; i < sid.length; i++) h = (h * 33 + sid.charCodeAt(i)) & 0x7fffffff;
    return h % 1200;
  }
  var sid = getSession();
  var storedNoun = 0;
  try {
    var n = localStorage.getItem('pc:nounId');
    storedNoun = n ? Number(n) : nounIdFor(sid);
  } catch (e) { storedNoun = nounIdFor(sid); }
  if (!Number.isFinite(storedNoun) || storedNoun < 0 || storedNoun > 1199) storedNoun = nounIdFor(sid);
  try { localStorage.setItem('pc:nounId', String(storedNoun)); } catch (e) {}

  var shortPid = '';
  try {
    if (window.crypto && crypto.subtle) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(sid)).then(function (buf) {
        var arr = Array.from(new Uint8Array(buf)).slice(0, 5);
        shortPid = arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 8);
      }).catch(function () {});
    }
  } catch (e) {}

  // ─── Audio: short bass-drum thump ────────────────────────────────────
  var audioCtx = null;
  function getAudio() {
    if (audioCtx) return audioCtx;
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }
  function playThump() {
    var ctx = getAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.18);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);

    // tiny click on top for snap
    var click = ctx.createOscillator();
    var cgain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(700, t);
    cgain.gain.setValueAtTime(0.0001, t);
    cgain.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
    cgain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    click.connect(cgain).connect(ctx.destination);
    click.start(t);
    click.stop(t + 0.06);
  }

  // ─── Confetti ────────────────────────────────────────────────────────
  var PALETTE = ['#d6346a', '#f0c431', '#3aa9c4', '#2f8c69', '#11100c'];
  var THRESHOLDS = [10, 50, 100, 250];
  var thresholdsHit = {};

  function spawnConfetti(count) {
    var n = Math.min(count, 80);
    for (var i = 0; i < n; i++) {
      var d = document.createElement('span');
      d.className = 'db__dot';
      var color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      d.style.background = color;
      var left = Math.random() * 100;
      var size = 6 + Math.random() * 10;
      var rot = Math.floor(Math.random() * 360);
      var dur = 1.6 + Math.random() * 1.6;
      var delay = Math.random() * 0.4;
      d.style.left = left + '%';
      d.style.width = size + 'px';
      d.style.height = (size * 0.6) + 'px';
      d.style.transform = 'rotate(' + rot + 'deg)';
      d.style.animationDuration = dur + 's';
      d.style.animationDelay = delay + 's';
      // shape variety
      if (Math.random() < 0.3) d.style.borderRadius = '50%';
      else if (Math.random() < 0.5) d.style.borderRadius = '2px';
      confettiEl.appendChild(d);
      // cleanup
      (function (node, totalMs) {
        setTimeout(function () { if (node && node.parentNode) node.parentNode.removeChild(node); }, totalMs);
      })(d, (dur + delay) * 1000 + 200);
    }
  }

  function checkThresholds(total) {
    for (var i = 0; i < THRESHOLDS.length; i++) {
      var t = THRESHOLDS[i];
      if (total >= t && !thresholdsHit[t]) {
        thresholdsHit[t] = true;
        spawnConfetti(20 + i * 18);
        flashCelebrate('★ ' + t + ' taps · the room is celebrating');
      }
    }
  }

  function flashCelebrate(msg) {
    note.textContent = msg;
    note.classList.add('db__meter-note--celebrate');
    setTimeout(function () { note.classList.remove('db__meter-note--celebrate'); }, 2200);
  }

  // ─── State ───────────────────────────────────────────────────────────
  var myTaps = 0;
  var roomTotal = 0;

  function updateFill() {
    var max = 250;
    var pct = Math.min(100, (roomTotal / max) * 100);
    fillEl.style.width = pct + '%';
  }

  // ─── Tap handler ─────────────────────────────────────────────────────
  function fireTap() {
    // Haptic feedback for mobile (taps without sound).
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    myTaps += 1;
    mineEl.textContent = String(myTaps);
    tap.classList.remove('db__tap--hit'); void tap.offsetWidth; tap.classList.add('db__tap--hit');
    playThump();
    spawnConfetti(8);
    note.textContent = 'transmitting · type=birthday';

    var payload = {
      type: 'birthday',
      sessionId: sid,
      nounId: storedNoun,
      note: forName ? ('for=' + forName) : 'tap',
    };
    fetch('/api/sounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.ok) {
          note.textContent = '✓ transmitted · ' + (myTaps === 1 ? 'first tap landed' : 'tap ' + myTaps);
        } else {
          note.textContent = '✗ ' + (data && data.reason ? data.reason : 'send failed');
        }
      }).catch(function () { note.textContent = '✗ offline · still tapping locally'; });

    // optimistic local count too — feels alive even if network hasn't echoed
    roomTotal += 1;
    roomEl.textContent = String(roomTotal);
    updateFill();
    checkThresholds(roomTotal);
  }

  tap.addEventListener('mousedown', function (e) { fireTap(); e.preventDefault(); });
  tap.addEventListener('touchstart', function (e) { fireTap(); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      // only act if the tap pad isn't blurred behind a focused input/textarea
      var ae = document.activeElement;
      var tag = ae && ae.tagName ? ae.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      fireTap();
      e.preventDefault();
    }
  });

  // ─── Polling /api/sounds ─────────────────────────────────────────────
  // Hydrate from existing room state on load — without this, the room
  // counter starts at 0 even if 50 visitors just tapped, so a guest
  // landing mid-party can't tell anyone else is here. Pull the last
  // 30s window once at boot, fold it into roomTotal, render the most
  // recent 5 events into the feed. Fixes Mike 2026-04-29:
  // "morgan and i visited from mobile, didn't see the clicks."
  var lastTs = Date.now() - 30_000;
  var hydrated = false;
  function hydrate() {
    if (hydrated) return;
    fetch('/api/sounds?since=' + (Date.now() - 30_000), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var events = Array.isArray(data.events) ? data.events : [];
        var bdays = events.filter(function (e) { return e.type === 'birthday'; });
        if (bdays.length) {
          roomTotal += bdays.length;
          roomEl.textContent = String(roomTotal);
          updateFill();
          // Render the last 5 (newest first via prepend) so the feed
          // shows real other-visitor activity from the moment of arrival.
          var slice = bdays.slice(-5);
          for (var i = 0; i < slice.length; i++) {
            var e = slice[i];
            var mine = shortPid && e.pid === shortPid;
            addFeedRow(e, !!mine);
          }
          if (events.length) lastTs = events[events.length - 1].t || lastTs;
        }
        hydrated = true;
      }).catch(function () { hydrated = true; });
  }
  hydrate();

  function fmtTime(t) {
    var d = new Date(t || Date.now());
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
  }

  function addFeedRow(e, isSelf) {
    var emptyEl = feed.querySelector('.db__feed-empty');
    if (emptyEl) emptyEl.remove();
    var li = document.createElement('li');
    li.className = 'db__feed-row mono' + (isSelf ? ' db__feed-row--self' : '');
    var pid = (e.pid || '').slice(0, 8) || '—';
    var extra = e.note || '';
    li.innerHTML =
      '<span class="db__feed-time"></span>' +
      '<span class="db__feed-tag">[birthday]</span>' +
      '<span class="db__feed-pid">pid=' + pid + '</span>' +
      '<span class="db__feed-extra"></span>';
    li.querySelector('.db__feed-time').textContent = fmtTime(e.t);
    li.querySelector('.db__feed-extra').textContent = extra;
    feed.prepend(li);
    var rows = feed.querySelectorAll('.db__feed-row');
    for (var i = 5; i < rows.length; i++) rows[i].remove();
  }

  // Tap-together pulse — when a non-self event lands, briefly highlight
  // the room counter + fire a small ring animation around the tap pad
  // so the visitor SEES that someone else just tapped. Per Mike
  // 2026-04-29: "morgan and i visited from mobile, didn't see the
  // clicks." The /api/visit chip handles presence; this handles
  // *transient* signals — Morgan tapped right now, here's the visual.
  function pulseFromOther() {
    if (!roomEl) return;
    roomEl.classList.remove('db__count-other');
    void roomEl.offsetWidth;
    roomEl.classList.add('db__count-other');
    if (tap) {
      tap.classList.remove('db__tap--echo');
      void tap.offsetWidth;
      tap.classList.add('db__tap--echo');
    }
  }

  function poll() {
    fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var events = Array.isArray(data.events) ? data.events : [];
        if (!events.length) return;
        lastTs = events[events.length - 1].t || Date.now();
        var sawOther = false;
        events.forEach(function (e) {
          if (e.type !== 'birthday') return;
          // self-filter: skip our own broadcasts (we already counted optimistically)
          var fresh = Math.abs((e.t || 0) - Date.now()) < 4000;
          var mine = shortPid && e.pid === shortPid;
          if (fresh && mine) return;
          addFeedRow(e, false);
          roomTotal += 1;
          roomEl.textContent = String(roomTotal);
          updateFill();
          checkThresholds(roomTotal);
          sawOther = true;
        });
        if (sawOther) pulseFromOther();
      }).catch(function () {});
  }
  setInterval(poll, 2000);
  poll();

  // ─── Share row ───────────────────────────────────────────────────────
  function buildShareUrl() {
    var url = new URL(window.location.href);
    // strip and rewrite to a clean canonical form
    var qp = new URLSearchParams();
    if (forName) qp.set('for', forName);
    if (fromName) qp.set('from', fromName);
    if (age != null) qp.set('age', String(age));
    var base = url.origin + url.pathname;
    var qs = qp.toString();
    return qs ? base + '?' + qs : base;
  }
  function buildShareText() {
    if (forName && fromName) return 'tapping the birthday drum for ' + forName + ' — from ' + fromName + ' · pointcast.xyz';
    if (forName) return 'tapping the birthday drum for ' + forName + ' · pointcast.xyz';
    return 'a collaborative birthday drum room · tap with us · pointcast.xyz';
  }
  function setShareStatus(msg) {
    shareStatus.textContent = msg;
    if (msg) setTimeout(function () { if (shareStatus.textContent === msg) shareStatus.textContent = ' '; }, 2400);
  }

  // tweet link
  function refreshTweet() {
    var u = encodeURIComponent(buildShareUrl());
    var t = encodeURIComponent(buildShareText());
    tweetA.href = 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u;
  }
  refreshTweet();

  // copy link
  copyBtn.addEventListener('click', function () {
    var url = buildShareUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        setShareStatus('✓ link copied · ' + url);
      }).catch(function () { fallbackCopy(url); });
    } else {
      fallbackCopy(url);
    }
  });
  function fallbackCopy(url) {
    try {
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareStatus('✓ link copied · ' + url);
    } catch (e) { setShareStatus('couldn’t copy — link: ' + url); }
  }

  // native share API — promote to primary CTA on mobile (Web Share is
  // a one-tap path to iMessage / WhatsApp / system share sheet, way
  // cheaper than copy + paste). On desktop it stays a tertiary option.
  if (navigator.share) {
    nativeBtn.hidden = false;
    var isCoarse = false;
    try { isCoarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
    if (isCoarse) nativeBtn.classList.add('db__share-btn--primary');
    nativeBtn.addEventListener('click', function () {
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
      navigator.share({
        title: 'Birthday drum · PointCast',
        text: buildShareText(),
        url: buildShareUrl(),
      }).then(function () { setShareStatus('✓ shared'); })
        .catch(function (err) {
          if (err && err.name === 'AbortError') return;
          setShareStatus('share canceled');
        });
    });
  }

  // ─── First-paint micro-confetti so the page never feels dead ─────────
  setTimeout(function () { spawnConfetti(14); }, 320);
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-birthday.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="db" id="db-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "birthday" })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "birthday" })} <header class="db__head"> <p class="db__kicker">DRUM HUB · BIRTHDAY IMPRINT · TYPE=BIRTHDAY · 4 SURFACES</p> <div class="db__greeting" id="db-greeting"> <p class="db__pre-line">to</p> <h1 class="db__title" id="db-for">whoever&#39;s birthday it is</h1> <p class="db__age-line" id="db-age-line" hidden><span id="db-age">—</span> trips around the sun</p> <p class="db__from-line">love, <span id="db-from">the room</span></p> </div> <p class="db__dek">
A drum room that&#39;s also a birthday card. Tap the drum, the room hears it. Other visitors tap too. The confetti meter rises. The page learns your friend&#39;s name from the link. Share it, send it, smile.
</p> <p class="db__hint mono" id="db-hint">tip · add <code>?for=Sam&amp;from=Mike&amp;age=33</code> to the URL to make it theirs</p> </header> <section class="db__stage" aria-label="Big drum-tap"> <div class="db__confetti" id="db-confetti" aria-hidden="true"></div> <button type="button" class="db__tap" id="db-tap" aria-label="Tap the birthday drum"> <span class="db__tap-cap"> <span class="db__tap-glyph">★</span> <span class="db__tap-word">BIRTHDAY</span> <span class="db__tap-sub">tap the drum</span> <span class="db__tap-kbd mono">SPACE / RETURN</span> </span> </button> <div class="db__meter"> <div class="db__meter-row"> <span class="db__meter-label mono">your taps</span> <strong class="db__meter-num" id="db-mine">0</strong> </div> <div class="db__meter-row"> <span class="db__meter-label mono">room taps</span> <strong class="db__meter-num db__meter-num--accent" id="db-room">0</strong> </div> <div class="db__meter-bar" aria-hidden="true"> <div class="db__meter-fill" id="db-fill"></div> <span class="db__meter-marker" style="left:4%">10</span> <span class="db__meter-marker" style="left:20%">50</span> <span class="db__meter-marker" style="left:40%">100</span> <span class="db__meter-marker" style="left:90%">250</span> </div> <p class="db__meter-note mono" id="db-note">— ready · press the drum · press SPACE —</p> </div> </section> <section class="db__share" aria-label="Share"> <h2 class="db__h">★ share the room</h2> <p class="db__share-sub">Paste the link anywhere. The greeting comes along — <code>?for=</code>, <code>?from=</code>, and <code>?age=</code> bake into the unfurl. iMessage, group chat, party text thread, all good.</p> <div class="db__share-row"> <button type="button" class="db__btn db__btn--magenta" id="db-copy">↗ copy link</button> <a class="db__btn db__btn--cyan" id="db-tweet" href="#" rel="noopener noreferrer" target="_blank">𝕏 tweet this</a> <button type="button" class="db__btn db__btn--yellow" id="db-native" hidden>📲 share</button> </div> <p class="db__share-status mono" id="db-share-status" aria-live="polite">&nbsp;</p> </section> <section class="db__siblings" aria-label="Other birthday surfaces"> <h2 class="db__h">★ the imprint &middot; 3 more rooms</h2> <p class="db__siblings-sub">Four surfaces in the Birthday Imprint. This is the hub. The other three each celebrate differently — a cake, a card, a piñata. All collaborative. All link back here.</p> <ul class="db__cards" role="list"> ${siblings.map((s) => renderTemplate`<li class="db__card"> <a class="db__card-link"${addAttribute(s.href, "href")}${addAttribute(s.label, "data-sib")}> <span class="db__card-tag mono">/drum-${s.label} · ${s.sub}</span> <span class="db__card-title">${s.label}</span> <span class="db__card-blurb">${s.blurb}</span> <span class="db__card-arrow" aria-hidden="true">→</span> </a> </li>`)} </ul> </section> <section class="db__feed" aria-label="Live feed"> <h2 class="db__h">★ live · last few birthday taps</h2> <ul class="db__feed-list" id="db-feed" role="list"> <li class="db__feed-empty mono">— stream open · waiting for taps —</li> </ul> </section> <footer class="db__foot"> <p>
Part of the <a href="/drum">Drum Hub</a>. Sibling rooms: <a href="/drum-cake">/drum-cake</a> · <a href="/drum-card">/drum-card</a> · <a href="/drum-pinata">/drum-pinata</a>. Customize the greeting with <code>?for=NAME&amp;from=NAME&amp;age=N</code>.
</p> <p class="db__credit mono">v0.1 · 2026-04-29 · birthday imprint · pointcast.xyz/drum-birthday</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-birthday.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-birthday.astro";
const $$url = "/drum-birthday";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumBirthday,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
