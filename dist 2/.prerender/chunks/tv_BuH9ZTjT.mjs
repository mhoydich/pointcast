import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, b as addAttribute, r as renderComponent, F as Fragment, e as renderHead } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';
import { b as buildTVSlides, f as fmtTVDate } from './sparrow-tv_DfeZjmXT.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Tv = createComponent(async ($$result, $$props, $$slots) => {
  const all = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const slides = buildTVSlides(all, { limit: 18 });
  const channels = CHANNEL_LIST.map((c) => ({ code: c.code, slug: c.slug, name: c.name }));
  const fmtDate = fmtTVDate;
  return renderTemplate(_a || (_a = __template([`<html lang="en" data-theme="blue-hour"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sparrow TV · PointCast</title><meta name="description" content="Sparrow's federation reader, on a wall. Ambient broadcast for big screens."><link rel="canonical" href="https://pointcast.xyz/sparrow/tv"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700&family=Departure+Mono&display=swap" rel="stylesheet">`, '</head> <body class="sptv-body" data-surface="desktop"> <main class="sptv" data-channel-active="" aria-label="Sparrow TV"> <header class="sptv-head"> <span class="sptv-glyph" aria-hidden="true">✦</span> <span class="sptv-name">Sparrow</span> <span class="sptv-sub">tv · live</span> <span class="sptv-clock" data-sptv-clock>—:—</span> </header> <div class="sptv-progress" aria-hidden="true"> <div class="sptv-progress__bar" data-sptv-progress></div> </div> <ol class="sptv-stage" data-sptv-stage> ', ' </ol> <aside class="sptv-rosette" aria-label="channels"> ', ` </aside> <aside class="sptv-here" data-sptv-here aria-label="friends here now" hidden> <span class="sptv-here__label">✦ here now</span> <ul class="sptv-here__list" data-sptv-here-list></ul> </aside> <footer class="sptv-foot"> <span class="sptv-foot__brand">pointcast.xyz/sparrow</span> <span class="sptv-foot__sep">·</span> <span class="sptv-foot__hint">←/→ to step · 1-9 to lock channel</span> </footer> </main> <script>
      (function () {
        'use strict';
        var doc = document;
        var body = doc.body;

        // ─── Surface detect (mirror /sit) ────────────────────────────
        // TV when:
        //   ?surface=tv override, OR
        //   (w>=1920 AND no coarse pointer / no touch), OR
        //   UA matches tv | appletv | googletv | crkey | tizen | webos.
        // Mobile: touch + w<768. Otherwise desktop.
        try {
          var qs = new URLSearchParams(location.search);
          var override = qs.get('surface');
          var w = window.innerWidth || doc.documentElement.clientWidth || 0;
          var ua = (navigator.userAgent || '').toLowerCase();
          var coarse = matchMedia('(pointer: coarse)').matches;
          var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
          var tvUA = /\\b(tv|appletv|googletv|crkey|tizen|webos|hbbtv|netcast)\\b/.test(ua);
          var isTV = override === 'tv' || tvUA || (w >= 1920 && !coarse && !touch);
          var isMobile = override === 'mobile' || (touch && w < 768);
          body.dataset.surface = isTV ? 'tv' : isMobile ? 'mobile' : 'desktop';
        } catch (_) { /* fall through to desktop default */ }

        // ─── Clock ──────────────────────────────────────────────────
        var clockEl = doc.querySelector('[data-sptv-clock]');
        function tickClock() {
          if (!clockEl) return;
          var d = new Date();
          var s = d.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
          });
          clockEl.textContent = s;
        }
        tickClock();
        setInterval(tickClock, 30000);

        // ─── Slide rotation ─────────────────────────────────────────
        var stage = doc.querySelector('[data-sptv-stage]');
        if (!stage) return;
        var slides = Array.prototype.slice.call(stage.querySelectorAll('.sptv-slide'));
        if (!slides.length) return;
        var idx = 0;
        var DWELL = 12000;       // 12 s per slide
        var dwellStart = Date.now();
        var progress = doc.querySelector('[data-sptv-progress]');
        var mainEl = doc.querySelector('.sptv');
        var locked = null;

        function paintActive() {
          for (var i = 0; i < slides.length; i++) {
            if (i === idx) {
              slides[i].classList.add('is-active');
              slides[i].setAttribute('aria-hidden', 'false');
            } else if (slides[i].classList.contains('is-active')) {
              slides[i].classList.remove('is-active');
              slides[i].setAttribute('aria-hidden', 'true');
            }
          }
          var ch = slides[idx].getAttribute('data-channel') || '';
          if (mainEl) mainEl.setAttribute('data-channel-active', ch);
          dwellStart = Date.now();
          if (progress) progress.style.width = '0%';
        }

        function step(dir) {
          if (locked !== null) {
            // Walk only within the locked channel pool.
            var pool = poolForChannel(locked);
            if (!pool.length) { locked = null; }
            else {
              var pos = pool.indexOf(idx);
              var next = pool[((pos + dir) + pool.length) % pool.length];
              idx = next;
              paintActive();
              return;
            }
          }
          idx = ((idx + dir) + slides.length) % slides.length;
          paintActive();
        }

        function poolForChannel(code) {
          var pool = [];
          for (var i = 0; i < slides.length; i++) {
            if (slides[i].getAttribute('data-channel') === code) pool.push(i);
          }
          return pool;
        }

        function lockChannel(code) {
          var pool = poolForChannel(code);
          if (!pool.length) return;
          locked = code;
          if (pool.indexOf(idx) === -1) idx = pool[0];
          paintActive();
        }

        // Auto-rotate
        setInterval(function () { step(1); }, DWELL);

        // Progress bar
        setInterval(function () {
          if (!progress) return;
          var pct = Math.min(100, ((Date.now() - dwellStart) / DWELL) * 100);
          progress.style.width = pct.toFixed(1) + '%';
        }, 200);

        // ─── Keyboard / D-pad ───────────────────────────────────────
        doc.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { step(1); e.preventDefault(); return; }
          if (e.key === 'ArrowLeft')  { step(-1); e.preventDefault(); return; }
          if (e.key === 'Escape') { locked = null; return; }
          var n = parseInt(e.key, 10);
          if (!isNaN(n) && n >= 1 && n <= 9) {
            var rosette = doc.querySelectorAll('.sptv-rosette__cell');
            var cell = rosette[n - 1];
            if (cell) {
              var code = cell.getAttribute('data-channel');
              if (code) lockChannel(code);
            }
          }
        });

        // ─── "Here now" — friends + real Nostr WS presence ──────────
        // Privacy-first: hidden until sparrow:tv-private-ok="1" so a
        // kitchen TV doesn't leak follow lists by default. Opt-in via
        // ?surface=tv&private-ok=1 (writes the flag) or future phone-
        // pairing handshake (Phase 3).
        //
        // When opted in, we open a streaming kind-20078 REQ against
        // the same relay pool the rest of Sparrow uses (damus / primal
        // / nos.lol unless overridden via sparrow:nostr-relays). Mirrors
        // the SparrowLayout v0.30 motion watcher contract verbatim:
        //   { kinds:[20078], authors:<friends>, '#t':['sparrow-presence'],
        //     since: <bootTime - 60s> }
        // Tracks lastSeen Map<pubkey, epochMs>; 90s freshness window;
        // 20s decay tick.

        var DEFAULT_RELAYS = [
          'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'
        ];
        var FRESH_MS = 90_000;
        var hereSockets = [];
        var lastSeen = Object.create(null);
        var bootTime = Math.floor(Date.now() / 1000);

        // Apply ?private-ok=1 query as a one-click opt-in for shared
        // TVs the operator controls. Writes the flag and strips param.
        try {
          var qsHere = new URLSearchParams(location.search);
          if (qsHere.get('private-ok') === '1') {
            localStorage.setItem('sparrow:tv-private-ok', '1');
            qsHere.delete('private-ok');
            var nu = location.pathname + (qsHere.toString() ? '?' + qsHere.toString() : '') + location.hash;
            history.replaceState(null, '', nu);
          }
        } catch (_) { /* empty */ }

        function readFriends() {
          try {
            var raw = JSON.parse(localStorage.getItem('sparrow:friends') || '[]');
            if (!Array.isArray(raw)) return [];
            return raw.map(function (f) {
              if (typeof f === 'string') return { pubkey: f.toLowerCase(), alias: '', muted: false };
              if (f && typeof f === 'object' && typeof f.pubkey === 'string') {
                return { pubkey: f.pubkey.toLowerCase(), alias: f.alias || '', muted: !!f.muted };
              }
              return null;
            }).filter(function (f) { return f && /^[0-9a-f]{64}$/.test(f.pubkey) && !f.muted; });
          } catch (_) { return []; }
        }
        function readProfiles() {
          try {
            var pj = JSON.parse(localStorage.getItem('sparrow:profiles') || '{}');
            return (pj && typeof pj === 'object' && !Array.isArray(pj)) ? pj : {};
          } catch (_) { return {}; }
        }
        function getRelays() {
          try {
            var raw = localStorage.getItem('sparrow:nostr-relays');
            var list = raw ? JSON.parse(raw) : null;
            if (Array.isArray(list) && list.length) {
              return list.filter(function (u) { return typeof u === 'string' && u.startsWith('ws'); });
            }
          } catch (_) { /* empty */ }
          return DEFAULT_RELAYS;
        }

        function paintHere() {
          var here = doc.querySelector('[data-sptv-here]');
          var list = doc.querySelector('[data-sptv-here-list]');
          if (!here || !list) return;
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) { here.hidden = true; return; }

          var friends = readFriends();
          if (!friends.length) { here.hidden = true; return; }

          var profiles = readProfiles();
          var now = Date.now();
          // Sort by freshness desc; fall back to friends list order so
          // the strip still shows something pre-stream.
          var ranked = friends.slice().sort(function (a, b) {
            var sa = lastSeen[a.pubkey] || 0;
            var sb = lastSeen[b.pubkey] || 0;
            return sb - sa;
          }).slice(0, 8);

          here.hidden = false;
          list.innerHTML = '';
          ranked.forEach(function (f) {
            var li = doc.createElement('li');
            li.className = 'sptv-here__item';
            var seen = lastSeen[f.pubkey] || 0;
            var fresh = (now - seen) < FRESH_MS;
            if (fresh) li.setAttribute('data-fresh', '1');
            var prof = profiles[f.pubkey] || {};
            var pic = (typeof prof.picture === 'string' && /^https?:\\/\\//i.test(prof.picture)) ? prof.picture : '';
            if (pic) {
              li.innerHTML = '<img src="' + pic.replace(/[<>"']/g, '') +
                '" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\\'none\\'">';
            } else {
              li.innerHTML = '<span class="sptv-here__placeholder" aria-hidden="true">✦</span>';
            }
            list.appendChild(li);
          });
        }

        function startPresenceWatch() {
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) return;
          var friends = readFriends();
          if (!friends.length) return;

          var authors = friends.map(function (f) { return f.pubkey; });
          var subId = 'sptv-' + Math.random().toString(36).slice(2, 10);
          var filter = {
            kinds: [20078],
            authors: authors,
            '#t': ['sparrow-presence'],
            since: bootTime - 60,
          };

          getRelays().forEach(function (url) {
            try {
              var ws = new WebSocket(url);
              hereSockets.push(ws);
              ws.addEventListener('open', function () {
                try { ws.send(JSON.stringify(['REQ', subId, filter])); } catch (_) {}
              });
              ws.addEventListener('message', function (msg) {
                var frame;
                try { frame = JSON.parse(msg.data); } catch (_) { return; }
                if (!Array.isArray(frame)) return;
                if (frame[0] !== 'EVENT' || frame[1] !== subId) return;
                var ev = frame[2];
                if (!ev || ev.kind !== 20078 || typeof ev.pubkey !== 'string') return;
                if (typeof ev.created_at !== 'number') return;
                // Defensive: relay echoes spam — confirm tag.
                var hasTag = Array.isArray(ev.tags) && ev.tags.some(function (t) {
                  return Array.isArray(t) && t[0] === 't' && t[1] === 'sparrow-presence';
                });
                if (!hasTag) return;
                // Mute check (re-read so freshly-muted friends drop).
                var live = readFriends();
                if (!live.some(function (f) { return f.pubkey === ev.pubkey; })) return;
                lastSeen[ev.pubkey] = Date.now();
                paintHere();
              });
            } catch (_) { /* relay failed, skip */ }
          });

          // Decay tick — drops stale entries from the strip every 20s.
          setInterval(paintHere, 20_000);
        }

        paintHere();
        startPresenceWatch();
        // React to friends-list edits in other tabs.
        window.addEventListener('storage', function (e) {
          if (!e.key) return;
          if (e.key === 'sparrow:friends' ||
              e.key === 'sparrow:profiles' ||
              e.key === 'sparrow:tv-private-ok') {
            paintHere();
          }
        });
        window.addEventListener('beforeunload', function () {
          hereSockets.forEach(function (ws) { try { ws.close(); } catch (_) {} });
        });
      })();
    <\/script> </body> </html>`], [`<html lang="en" data-theme="blue-hour"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sparrow TV · PointCast</title><meta name="description" content="Sparrow's federation reader, on a wall. Ambient broadcast for big screens."><link rel="canonical" href="https://pointcast.xyz/sparrow/tv"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700&family=Departure+Mono&display=swap" rel="stylesheet">`, '</head> <body class="sptv-body" data-surface="desktop"> <main class="sptv" data-channel-active="" aria-label="Sparrow TV"> <header class="sptv-head"> <span class="sptv-glyph" aria-hidden="true">✦</span> <span class="sptv-name">Sparrow</span> <span class="sptv-sub">tv · live</span> <span class="sptv-clock" data-sptv-clock>—:—</span> </header> <div class="sptv-progress" aria-hidden="true"> <div class="sptv-progress__bar" data-sptv-progress></div> </div> <ol class="sptv-stage" data-sptv-stage> ', ' </ol> <aside class="sptv-rosette" aria-label="channels"> ', ` </aside> <aside class="sptv-here" data-sptv-here aria-label="friends here now" hidden> <span class="sptv-here__label">✦ here now</span> <ul class="sptv-here__list" data-sptv-here-list></ul> </aside> <footer class="sptv-foot"> <span class="sptv-foot__brand">pointcast.xyz/sparrow</span> <span class="sptv-foot__sep">·</span> <span class="sptv-foot__hint">←/→ to step · 1-9 to lock channel</span> </footer> </main> <script>
      (function () {
        'use strict';
        var doc = document;
        var body = doc.body;

        // ─── Surface detect (mirror /sit) ────────────────────────────
        // TV when:
        //   ?surface=tv override, OR
        //   (w>=1920 AND no coarse pointer / no touch), OR
        //   UA matches tv | appletv | googletv | crkey | tizen | webos.
        // Mobile: touch + w<768. Otherwise desktop.
        try {
          var qs = new URLSearchParams(location.search);
          var override = qs.get('surface');
          var w = window.innerWidth || doc.documentElement.clientWidth || 0;
          var ua = (navigator.userAgent || '').toLowerCase();
          var coarse = matchMedia('(pointer: coarse)').matches;
          var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
          var tvUA = /\\\\b(tv|appletv|googletv|crkey|tizen|webos|hbbtv|netcast)\\\\b/.test(ua);
          var isTV = override === 'tv' || tvUA || (w >= 1920 && !coarse && !touch);
          var isMobile = override === 'mobile' || (touch && w < 768);
          body.dataset.surface = isTV ? 'tv' : isMobile ? 'mobile' : 'desktop';
        } catch (_) { /* fall through to desktop default */ }

        // ─── Clock ──────────────────────────────────────────────────
        var clockEl = doc.querySelector('[data-sptv-clock]');
        function tickClock() {
          if (!clockEl) return;
          var d = new Date();
          var s = d.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
          });
          clockEl.textContent = s;
        }
        tickClock();
        setInterval(tickClock, 30000);

        // ─── Slide rotation ─────────────────────────────────────────
        var stage = doc.querySelector('[data-sptv-stage]');
        if (!stage) return;
        var slides = Array.prototype.slice.call(stage.querySelectorAll('.sptv-slide'));
        if (!slides.length) return;
        var idx = 0;
        var DWELL = 12000;       // 12 s per slide
        var dwellStart = Date.now();
        var progress = doc.querySelector('[data-sptv-progress]');
        var mainEl = doc.querySelector('.sptv');
        var locked = null;

        function paintActive() {
          for (var i = 0; i < slides.length; i++) {
            if (i === idx) {
              slides[i].classList.add('is-active');
              slides[i].setAttribute('aria-hidden', 'false');
            } else if (slides[i].classList.contains('is-active')) {
              slides[i].classList.remove('is-active');
              slides[i].setAttribute('aria-hidden', 'true');
            }
          }
          var ch = slides[idx].getAttribute('data-channel') || '';
          if (mainEl) mainEl.setAttribute('data-channel-active', ch);
          dwellStart = Date.now();
          if (progress) progress.style.width = '0%';
        }

        function step(dir) {
          if (locked !== null) {
            // Walk only within the locked channel pool.
            var pool = poolForChannel(locked);
            if (!pool.length) { locked = null; }
            else {
              var pos = pool.indexOf(idx);
              var next = pool[((pos + dir) + pool.length) % pool.length];
              idx = next;
              paintActive();
              return;
            }
          }
          idx = ((idx + dir) + slides.length) % slides.length;
          paintActive();
        }

        function poolForChannel(code) {
          var pool = [];
          for (var i = 0; i < slides.length; i++) {
            if (slides[i].getAttribute('data-channel') === code) pool.push(i);
          }
          return pool;
        }

        function lockChannel(code) {
          var pool = poolForChannel(code);
          if (!pool.length) return;
          locked = code;
          if (pool.indexOf(idx) === -1) idx = pool[0];
          paintActive();
        }

        // Auto-rotate
        setInterval(function () { step(1); }, DWELL);

        // Progress bar
        setInterval(function () {
          if (!progress) return;
          var pct = Math.min(100, ((Date.now() - dwellStart) / DWELL) * 100);
          progress.style.width = pct.toFixed(1) + '%';
        }, 200);

        // ─── Keyboard / D-pad ───────────────────────────────────────
        doc.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { step(1); e.preventDefault(); return; }
          if (e.key === 'ArrowLeft')  { step(-1); e.preventDefault(); return; }
          if (e.key === 'Escape') { locked = null; return; }
          var n = parseInt(e.key, 10);
          if (!isNaN(n) && n >= 1 && n <= 9) {
            var rosette = doc.querySelectorAll('.sptv-rosette__cell');
            var cell = rosette[n - 1];
            if (cell) {
              var code = cell.getAttribute('data-channel');
              if (code) lockChannel(code);
            }
          }
        });

        // ─── "Here now" — friends + real Nostr WS presence ──────────
        // Privacy-first: hidden until sparrow:tv-private-ok="1" so a
        // kitchen TV doesn't leak follow lists by default. Opt-in via
        // ?surface=tv&private-ok=1 (writes the flag) or future phone-
        // pairing handshake (Phase 3).
        //
        // When opted in, we open a streaming kind-20078 REQ against
        // the same relay pool the rest of Sparrow uses (damus / primal
        // / nos.lol unless overridden via sparrow:nostr-relays). Mirrors
        // the SparrowLayout v0.30 motion watcher contract verbatim:
        //   { kinds:[20078], authors:<friends>, '#t':['sparrow-presence'],
        //     since: <bootTime - 60s> }
        // Tracks lastSeen Map<pubkey, epochMs>; 90s freshness window;
        // 20s decay tick.

        var DEFAULT_RELAYS = [
          'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'
        ];
        var FRESH_MS = 90_000;
        var hereSockets = [];
        var lastSeen = Object.create(null);
        var bootTime = Math.floor(Date.now() / 1000);

        // Apply ?private-ok=1 query as a one-click opt-in for shared
        // TVs the operator controls. Writes the flag and strips param.
        try {
          var qsHere = new URLSearchParams(location.search);
          if (qsHere.get('private-ok') === '1') {
            localStorage.setItem('sparrow:tv-private-ok', '1');
            qsHere.delete('private-ok');
            var nu = location.pathname + (qsHere.toString() ? '?' + qsHere.toString() : '') + location.hash;
            history.replaceState(null, '', nu);
          }
        } catch (_) { /* empty */ }

        function readFriends() {
          try {
            var raw = JSON.parse(localStorage.getItem('sparrow:friends') || '[]');
            if (!Array.isArray(raw)) return [];
            return raw.map(function (f) {
              if (typeof f === 'string') return { pubkey: f.toLowerCase(), alias: '', muted: false };
              if (f && typeof f === 'object' && typeof f.pubkey === 'string') {
                return { pubkey: f.pubkey.toLowerCase(), alias: f.alias || '', muted: !!f.muted };
              }
              return null;
            }).filter(function (f) { return f && /^[0-9a-f]{64}$/.test(f.pubkey) && !f.muted; });
          } catch (_) { return []; }
        }
        function readProfiles() {
          try {
            var pj = JSON.parse(localStorage.getItem('sparrow:profiles') || '{}');
            return (pj && typeof pj === 'object' && !Array.isArray(pj)) ? pj : {};
          } catch (_) { return {}; }
        }
        function getRelays() {
          try {
            var raw = localStorage.getItem('sparrow:nostr-relays');
            var list = raw ? JSON.parse(raw) : null;
            if (Array.isArray(list) && list.length) {
              return list.filter(function (u) { return typeof u === 'string' && u.startsWith('ws'); });
            }
          } catch (_) { /* empty */ }
          return DEFAULT_RELAYS;
        }

        function paintHere() {
          var here = doc.querySelector('[data-sptv-here]');
          var list = doc.querySelector('[data-sptv-here-list]');
          if (!here || !list) return;
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) { here.hidden = true; return; }

          var friends = readFriends();
          if (!friends.length) { here.hidden = true; return; }

          var profiles = readProfiles();
          var now = Date.now();
          // Sort by freshness desc; fall back to friends list order so
          // the strip still shows something pre-stream.
          var ranked = friends.slice().sort(function (a, b) {
            var sa = lastSeen[a.pubkey] || 0;
            var sb = lastSeen[b.pubkey] || 0;
            return sb - sa;
          }).slice(0, 8);

          here.hidden = false;
          list.innerHTML = '';
          ranked.forEach(function (f) {
            var li = doc.createElement('li');
            li.className = 'sptv-here__item';
            var seen = lastSeen[f.pubkey] || 0;
            var fresh = (now - seen) < FRESH_MS;
            if (fresh) li.setAttribute('data-fresh', '1');
            var prof = profiles[f.pubkey] || {};
            var pic = (typeof prof.picture === 'string' && /^https?:\\\\/\\\\//i.test(prof.picture)) ? prof.picture : '';
            if (pic) {
              li.innerHTML = '<img src="' + pic.replace(/[<>"']/g, '') +
                '" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\\\\'none\\\\'">';
            } else {
              li.innerHTML = '<span class="sptv-here__placeholder" aria-hidden="true">✦</span>';
            }
            list.appendChild(li);
          });
        }

        function startPresenceWatch() {
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) return;
          var friends = readFriends();
          if (!friends.length) return;

          var authors = friends.map(function (f) { return f.pubkey; });
          var subId = 'sptv-' + Math.random().toString(36).slice(2, 10);
          var filter = {
            kinds: [20078],
            authors: authors,
            '#t': ['sparrow-presence'],
            since: bootTime - 60,
          };

          getRelays().forEach(function (url) {
            try {
              var ws = new WebSocket(url);
              hereSockets.push(ws);
              ws.addEventListener('open', function () {
                try { ws.send(JSON.stringify(['REQ', subId, filter])); } catch (_) {}
              });
              ws.addEventListener('message', function (msg) {
                var frame;
                try { frame = JSON.parse(msg.data); } catch (_) { return; }
                if (!Array.isArray(frame)) return;
                if (frame[0] !== 'EVENT' || frame[1] !== subId) return;
                var ev = frame[2];
                if (!ev || ev.kind !== 20078 || typeof ev.pubkey !== 'string') return;
                if (typeof ev.created_at !== 'number') return;
                // Defensive: relay echoes spam — confirm tag.
                var hasTag = Array.isArray(ev.tags) && ev.tags.some(function (t) {
                  return Array.isArray(t) && t[0] === 't' && t[1] === 'sparrow-presence';
                });
                if (!hasTag) return;
                // Mute check (re-read so freshly-muted friends drop).
                var live = readFriends();
                if (!live.some(function (f) { return f.pubkey === ev.pubkey; })) return;
                lastSeen[ev.pubkey] = Date.now();
                paintHere();
              });
            } catch (_) { /* relay failed, skip */ }
          });

          // Decay tick — drops stale entries from the strip every 20s.
          setInterval(paintHere, 20_000);
        }

        paintHere();
        startPresenceWatch();
        // React to friends-list edits in other tabs.
        window.addEventListener('storage', function (e) {
          if (!e.key) return;
          if (e.key === 'sparrow:friends' ||
              e.key === 'sparrow:profiles' ||
              e.key === 'sparrow:tv-private-ok') {
            paintHere();
          }
        });
        window.addEventListener('beforeunload', function () {
          hereSockets.forEach(function (ws) { try { ws.close(); } catch (_) {} });
        });
      })();
    <\/script> </body> </html>`])), renderHead(), slides.map((s, i) => renderTemplate`<li${addAttribute(`sptv-slide${i === 0 ? " is-active" : ""}`, "class")}${addAttribute(i, "data-slide-idx")}${addAttribute(s.channel, "data-channel")}${addAttribute(`--ch: var(--ch-${s.channel.toLowerCase()});`, "style")}${addAttribute(i !== 0 ? "true" : "false", "aria-hidden")}> <div class="sptv-slide__inner"> <div class="sptv-slide__chip"> <span class="sptv-slide__chip-dot" aria-hidden="true"></span>
CH · ${s.channel} · ${s.channelName.toUpperCase()} </div> <div class="sptv-slide__meta"> <span>№ ${s.id}</span> <span>·</span> <span>${s.type}</span> <span>·</span> <time${addAttribute(s.timestamp, "datetime")}>${fmtDate(s.timestamp)}</time> ${s.mood && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <span>·</span> <span class="sptv-slide__mood">mood ${s.mood}</span> ` })}`} </div> <h2 class="sptv-slide__title">${s.title}</h2> ${s.dek && renderTemplate`<p class="sptv-slide__dek">${s.dek}</p>`} </div> </li>`), channels.map((c, i) => renderTemplate`<span class="sptv-rosette__cell"${addAttribute(c.code, "data-channel")}${addAttribute(`--ch: var(--ch-${c.code.toLowerCase()});`, "style")}> <span class="sptv-rosette__num">${i + 1}</span> <span class="sptv-rosette__code">${c.code}</span> </span>`));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/tv.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/tv.astro";
const $$url = "/sparrow/tv";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
      __proto__: null,
      default: $$Tv,
      file: $$file,
      url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
