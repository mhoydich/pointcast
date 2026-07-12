import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, b as addAttribute, r as renderComponent, F as Fragment, e as renderHead } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { a as CHANNEL_LIST, g as getChannel } from './channels_C2qW9mSV.mjs';
import { b as buildTVSlides, f as fmtTVDate } from './sparrow-tv_DfeZjmXT.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
async function getStaticPaths() {
  return CHANNEL_LIST.map((ch) => ({ params: { slug: ch.slug } }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const ch = getChannel(slug || "");
  if (!ch) {
    return Astro2.redirect("/sparrow/tv");
  }
  const all = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const slides = buildTVSlides(all, { limit: 24, channel: ch.code });
  const channels = CHANNEL_LIST.map((c) => ({ code: c.code, slug: c.slug, name: c.name }));
  const fmtDate = fmtTVDate;
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-theme="blue-hour"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sparrow TV · ', " ", ' · PointCast</title><meta name="description"', '><link rel="canonical"', '><link rel="alternate" href="/sparrow/tv" title="Sparrow TV (all channels)"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700&family=Departure+Mono&display=swap" rel="stylesheet">', '</head> <body class="sptv-body" data-surface="desktop"> <main class="sptv sptv--locked"', "", "", '> <header class="sptv-head"> <span class="sptv-glyph" aria-hidden="true">✦</span> <span class="sptv-name">Sparrow</span> <span class="sptv-sub">tv · ch · ', '</span> <span class="sptv-clock" data-sptv-clock>—:—</span> </header> <div class="sptv-progress" aria-hidden="true"> <div class="sptv-progress__bar" data-sptv-progress></div> </div> ', ' <aside class="sptv-rosette" aria-label="channels"> ', ' </aside> <aside class="sptv-here" data-sptv-here aria-label="friends here now" hidden> <span class="sptv-here__label">✦ here now</span> <ul class="sptv-here__list" data-sptv-here-list></ul> </aside> <footer class="sptv-foot"> <span class="sptv-foot__brand">pointcast.xyz/sparrow/tv/ch/', `</span> <span class="sptv-foot__sep">·</span> <span class="sptv-foot__hint">←/→ to step · 1-9 to jump channel · Esc to all channels</span> </footer> </main> <script>
      (function () {
        'use strict';
        var doc = document;
        var body = doc.body;

        // Surface detect — same contract as /sparrow/tv.
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
        } catch (_) { /* default desktop */ }

        // Clock.
        var clockEl = doc.querySelector('[data-sptv-clock]');
        function tickClock() {
          if (!clockEl) return;
          clockEl.textContent = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
          });
        }
        tickClock();
        setInterval(tickClock, 30000);

        // Slide rotation — channel-locked: pool is the entire stage
        // since slides are pre-filtered server-side.
        var stage = doc.querySelector('[data-sptv-stage]');
        var slides = stage ? Array.prototype.slice.call(stage.querySelectorAll('.sptv-slide')) : [];
        var idx = 0;
        var DWELL = 12000;
        var dwellStart = Date.now();
        var progress = doc.querySelector('[data-sptv-progress]');
        var mainEl = doc.querySelector('.sptv');

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
          dwellStart = Date.now();
          if (progress) progress.style.width = '0%';
        }

        function step(dir) {
          if (!slides.length) return;
          idx = ((idx + dir) + slides.length) % slides.length;
          paintActive();
        }

        if (slides.length) {
          setInterval(function () { step(1); }, DWELL);
          setInterval(function () {
            if (!progress) return;
            var pct = Math.min(100, ((Date.now() - dwellStart) / DWELL) * 100);
            progress.style.width = pct.toFixed(1) + '%';
          }, 200);
        }

        doc.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { step(1); e.preventDefault(); return; }
          if (e.key === 'ArrowLeft')  { step(-1); e.preventDefault(); return; }
          if (e.key === 'Escape') { location.href = '/sparrow/tv'; return; }
          var n = parseInt(e.key, 10);
          if (!isNaN(n) && n >= 1 && n <= 9) {
            var rosette = doc.querySelectorAll('.sptv-rosette__cell');
            var cell = rosette[n - 1];
            if (cell && cell instanceof HTMLAnchorElement) {
              location.href = cell.href;
            }
          }
        });

        // Federation "here now" — same WS contract as /sparrow/tv.
        var DEFAULT_RELAYS = [
          'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'
        ];
        var FRESH_MS = 90_000;
        var hereSockets = [];
        var lastSeen = Object.create(null);
        var bootTime = Math.floor(Date.now() / 1000);

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
          var ranked = friends.slice().sort(function (a, b) {
            return (lastSeen[b.pubkey] || 0) - (lastSeen[a.pubkey] || 0);
          }).slice(0, 8);
          here.hidden = false;
          list.innerHTML = '';
          ranked.forEach(function (f) {
            var li = doc.createElement('li');
            li.className = 'sptv-here__item';
            if ((now - (lastSeen[f.pubkey] || 0)) < FRESH_MS) li.setAttribute('data-fresh', '1');
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
          var subId = 'sptv-' + Math.random().toString(36).slice(2, 10);
          var filter = {
            kinds: [20078],
            authors: friends.map(function (f) { return f.pubkey; }),
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
                var frame; try { frame = JSON.parse(msg.data); } catch (_) { return; }
                if (!Array.isArray(frame)) return;
                if (frame[0] !== 'EVENT' || frame[1] !== subId) return;
                var ev = frame[2];
                if (!ev || ev.kind !== 20078 || typeof ev.pubkey !== 'string') return;
                if (typeof ev.created_at !== 'number') return;
                var hasTag = Array.isArray(ev.tags) && ev.tags.some(function (t) {
                  return Array.isArray(t) && t[0] === 't' && t[1] === 'sparrow-presence';
                });
                if (!hasTag) return;
                var live = readFriends();
                if (!live.some(function (f) { return f.pubkey === ev.pubkey; })) return;
                lastSeen[ev.pubkey] = Date.now();
                paintHere();
              });
            } catch (_) { /* skip */ }
          });
          setInterval(paintHere, 20_000);
        }

        paintHere();
        startPresenceWatch();
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

        // The page renders with data-channel-active already set
        // server-side from the slug, so the wash + rosette highlight
        // are correct on first paint. No JS-side override needed —
        // every slide carries the same channel, so the wash never
        // changes during rotation here.
      })();
    <\/script> </body> </html>`], ['<html lang="en" data-theme="blue-hour"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sparrow TV · ', " ", ' · PointCast</title><meta name="description"', '><link rel="canonical"', '><link rel="alternate" href="/sparrow/tv" title="Sparrow TV (all channels)"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700&family=Departure+Mono&display=swap" rel="stylesheet">', '</head> <body class="sptv-body" data-surface="desktop"> <main class="sptv sptv--locked"', "", "", '> <header class="sptv-head"> <span class="sptv-glyph" aria-hidden="true">✦</span> <span class="sptv-name">Sparrow</span> <span class="sptv-sub">tv · ch · ', '</span> <span class="sptv-clock" data-sptv-clock>—:—</span> </header> <div class="sptv-progress" aria-hidden="true"> <div class="sptv-progress__bar" data-sptv-progress></div> </div> ', ' <aside class="sptv-rosette" aria-label="channels"> ', ' </aside> <aside class="sptv-here" data-sptv-here aria-label="friends here now" hidden> <span class="sptv-here__label">✦ here now</span> <ul class="sptv-here__list" data-sptv-here-list></ul> </aside> <footer class="sptv-foot"> <span class="sptv-foot__brand">pointcast.xyz/sparrow/tv/ch/', `</span> <span class="sptv-foot__sep">·</span> <span class="sptv-foot__hint">←/→ to step · 1-9 to jump channel · Esc to all channels</span> </footer> </main> <script>
      (function () {
        'use strict';
        var doc = document;
        var body = doc.body;

        // Surface detect — same contract as /sparrow/tv.
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
        } catch (_) { /* default desktop */ }

        // Clock.
        var clockEl = doc.querySelector('[data-sptv-clock]');
        function tickClock() {
          if (!clockEl) return;
          clockEl.textContent = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
          });
        }
        tickClock();
        setInterval(tickClock, 30000);

        // Slide rotation — channel-locked: pool is the entire stage
        // since slides are pre-filtered server-side.
        var stage = doc.querySelector('[data-sptv-stage]');
        var slides = stage ? Array.prototype.slice.call(stage.querySelectorAll('.sptv-slide')) : [];
        var idx = 0;
        var DWELL = 12000;
        var dwellStart = Date.now();
        var progress = doc.querySelector('[data-sptv-progress]');
        var mainEl = doc.querySelector('.sptv');

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
          dwellStart = Date.now();
          if (progress) progress.style.width = '0%';
        }

        function step(dir) {
          if (!slides.length) return;
          idx = ((idx + dir) + slides.length) % slides.length;
          paintActive();
        }

        if (slides.length) {
          setInterval(function () { step(1); }, DWELL);
          setInterval(function () {
            if (!progress) return;
            var pct = Math.min(100, ((Date.now() - dwellStart) / DWELL) * 100);
            progress.style.width = pct.toFixed(1) + '%';
          }, 200);
        }

        doc.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { step(1); e.preventDefault(); return; }
          if (e.key === 'ArrowLeft')  { step(-1); e.preventDefault(); return; }
          if (e.key === 'Escape') { location.href = '/sparrow/tv'; return; }
          var n = parseInt(e.key, 10);
          if (!isNaN(n) && n >= 1 && n <= 9) {
            var rosette = doc.querySelectorAll('.sptv-rosette__cell');
            var cell = rosette[n - 1];
            if (cell && cell instanceof HTMLAnchorElement) {
              location.href = cell.href;
            }
          }
        });

        // Federation "here now" — same WS contract as /sparrow/tv.
        var DEFAULT_RELAYS = [
          'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'
        ];
        var FRESH_MS = 90_000;
        var hereSockets = [];
        var lastSeen = Object.create(null);
        var bootTime = Math.floor(Date.now() / 1000);

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
          var ranked = friends.slice().sort(function (a, b) {
            return (lastSeen[b.pubkey] || 0) - (lastSeen[a.pubkey] || 0);
          }).slice(0, 8);
          here.hidden = false;
          list.innerHTML = '';
          ranked.forEach(function (f) {
            var li = doc.createElement('li');
            li.className = 'sptv-here__item';
            if ((now - (lastSeen[f.pubkey] || 0)) < FRESH_MS) li.setAttribute('data-fresh', '1');
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
          var subId = 'sptv-' + Math.random().toString(36).slice(2, 10);
          var filter = {
            kinds: [20078],
            authors: friends.map(function (f) { return f.pubkey; }),
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
                var frame; try { frame = JSON.parse(msg.data); } catch (_) { return; }
                if (!Array.isArray(frame)) return;
                if (frame[0] !== 'EVENT' || frame[1] !== subId) return;
                var ev = frame[2];
                if (!ev || ev.kind !== 20078 || typeof ev.pubkey !== 'string') return;
                if (typeof ev.created_at !== 'number') return;
                var hasTag = Array.isArray(ev.tags) && ev.tags.some(function (t) {
                  return Array.isArray(t) && t[0] === 't' && t[1] === 'sparrow-presence';
                });
                if (!hasTag) return;
                var live = readFriends();
                if (!live.some(function (f) { return f.pubkey === ev.pubkey; })) return;
                lastSeen[ev.pubkey] = Date.now();
                paintHere();
              });
            } catch (_) { /* skip */ }
          });
          setInterval(paintHere, 20_000);
        }

        paintHere();
        startPresenceWatch();
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

        // The page renders with data-channel-active already set
        // server-side from the slug, so the wash + rosette highlight
        // are correct on first paint. No JS-side override needed —
        // every slide carries the same channel, so the wash never
        // changes during rotation here.
      })();
    <\/script> </body> </html>`])), ch.code, ch.name, addAttribute(`${ch.name} on Sparrow TV — channel-locked ambient broadcast.`, "content"), addAttribute(`https://pointcast.xyz/sparrow/tv/ch/${ch.slug}`, "href"), renderHead(), addAttribute(ch.code, "data-channel-active"), addAttribute(ch.code, "data-channel-locked"), addAttribute(`Sparrow TV · ${ch.name}`, "aria-label"), ch.code, slides.length === 0 ? renderTemplate`<section class="sptv-empty"${addAttribute(`No broadcasts in ${ch.name}`, "aria-label")}> <p class="sptv-empty__kicker">CH · ${ch.code} · ${ch.name.toUpperCase()}</p> <h2 class="sptv-empty__title">∅ Quiet on this channel.</h2> <p class="sptv-empty__dek">${ch.purpose}</p> <p class="sptv-empty__hint">Tune the rosette below or open <a href="/sparrow/tv">all channels</a>.</p> </section>` : renderTemplate`<ol class="sptv-stage" data-sptv-stage> ${slides.map((s, i) => renderTemplate`<li${addAttribute(`sptv-slide${i === 0 ? " is-active" : ""}`, "class")}${addAttribute(i, "data-slide-idx")}${addAttribute(s.channel, "data-channel")}${addAttribute(`--ch: var(--ch-${s.channel.toLowerCase()});`, "style")}${addAttribute(i !== 0 ? "true" : "false", "aria-hidden")}> <div class="sptv-slide__inner"> <div class="sptv-slide__chip"> <span class="sptv-slide__chip-dot" aria-hidden="true"></span>
CH · ${s.channel} · ${s.channelName.toUpperCase()} </div> <div class="sptv-slide__meta"> <span>№ ${s.id}</span> <span>·</span> <span>${s.type}</span> <span>·</span> <time${addAttribute(s.timestamp, "datetime")}>${fmtDate(s.timestamp)}</time> ${s.mood && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <span>·</span> <span class="sptv-slide__mood">mood ${s.mood}</span> ` })}`} </div> <h2 class="sptv-slide__title">${s.title}</h2> ${s.dek && renderTemplate`<p class="sptv-slide__dek">${s.dek}</p>`} </div> </li>`)} </ol>`, channels.map((c, i) => renderTemplate`<a class="sptv-rosette__cell sptv-rosette__cell--link"${addAttribute(`/sparrow/tv/ch/${c.slug}`, "href")}${addAttribute(c.code, "data-channel")}${addAttribute(`--ch: var(--ch-${c.code.toLowerCase()});`, "style")}> <span class="sptv-rosette__num">${i + 1}</span> <span class="sptv-rosette__code">${c.code}</span> </a>`), ch.slug);
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/tv/ch/[slug].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/tv/ch/[slug].astro";
const $$url = "/sparrow/tv/ch/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
      __proto__: null,
      default: $$slug,
      file: $$file,
      getStaticPaths,
      url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
