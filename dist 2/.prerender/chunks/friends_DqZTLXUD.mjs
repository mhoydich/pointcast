import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, u as unescapeHTML, b as addAttribute, r as renderComponent, F as Fragment, e as renderHead } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS, a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';
import { b as buildTVSlides, f as fmtTVDate } from './sparrow-tv_DfeZjmXT.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Friends = createComponent(async ($$result, $$props, $$slots) => {
  const all = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const fallbackSlides = buildTVSlides(all, { limit: 12 });
  const blocksLookup = Object.fromEntries(
    all.slice(0, 60).map((b) => [
      b.data.id,
      {
        id: b.data.id,
        title: b.data.title,
        dek: b.data.dek ?? "",
        channel: b.data.channel,
        channelName: CHANNELS[b.data.channel]?.name ?? b.data.channel,
        type: b.data.type,
        mood: b.data.mood ?? "",
        timestamp: b.data.timestamp.toISOString()
      }
    ])
  );
  CHANNEL_LIST.map((c) => ({ code: c.code, slug: c.slug, name: c.name }));
  const fmtDate = fmtTVDate;
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-theme="blue-hour"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sparrow TV · Friends · PointCast</title><meta name="description" content="The federation channel of Sparrow TV — what your follows are reading right now, on a wall."><link rel="canonical" href="https://pointcast.xyz/sparrow/tv/friends"><link rel="alternate" href="/sparrow/tv" title="Sparrow TV (broadcast)"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700&family=Departure+Mono&display=swap" rel="stylesheet">', '</head> <body class="sptv-body" data-surface="desktop" data-tv-mode="friends"> <main class="sptv sptv--friends" data-channel-active="" aria-label="Sparrow TV · Friends"> <header class="sptv-head"> <span class="sptv-glyph" aria-hidden="true">✦</span> <span class="sptv-name">Sparrow</span> <span class="sptv-sub">tv · friends</span> <span class="sptv-clock" data-sptv-clock>—:—</span> </header> <div class="sptv-progress" aria-hidden="true"> <div class="sptv-progress__bar" data-sptv-progress></div> </div>  <section class="sptv-empty sptv-empty--friends" data-sptv-empty hidden aria-label="No friends configured"> <p class="sptv-empty__kicker">CH · FRIENDS</p> <h2 class="sptv-empty__title">∅ No federation tuned in.</h2> <p class="sptv-empty__dek">\nAdd a follow at <a href="/sparrow/friends">/sparrow/friends</a> — Sparrow TV will rotate\n          their freshest reads here.\n</p> <p class="sptv-empty__hint">Until then, <a href="/sparrow/tv">all channels</a> still broadcasts the latest blocks.</p> </section>  <ol class="sptv-stage" data-sptv-stage data-sptv-stage-mode="fallback"> ', ' </ol>  <aside class="sptv-fed-strip" data-sptv-fed-strip aria-label="federation slate" hidden> <span class="sptv-fed-strip__label">✦ tuned to</span> <ul class="sptv-fed-strip__list" data-sptv-fed-list></ul> <span class="sptv-fed-strip__count" data-sptv-fed-count>—</span> </aside>  <aside class="sptv-here" data-sptv-here aria-label="friends here now" hidden> <span class="sptv-here__label">✦ here now</span> <ul class="sptv-here__list" data-sptv-here-list></ul> </aside> <footer class="sptv-foot"> <span class="sptv-foot__brand">pointcast.xyz/sparrow/tv/friends</span> <span class="sptv-foot__sep">·</span> <span class="sptv-foot__hint">←/→ to step · Esc to unlock · open <a href="/sparrow/tv">all channels</a></span> </footer> </main>  <script type="application/json" id="sptv-friends-blocks">', `<\/script> <script>
      (function () {
        'use strict';
        var doc = document;
        var body = doc.body;

        // ─── Surface detect (mirror /sparrow/tv) ────────────────────
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

        // ?private-ok=1 → opt-in for shared TVs. Strips the param and
        // writes the local flag so subsequent renders behave the same.
        try {
          var qsPrivate = new URLSearchParams(location.search);
          if (qsPrivate.get('private-ok') === '1') {
            localStorage.setItem('sparrow:tv-private-ok', '1');
            qsPrivate.delete('private-ok');
            var nu = location.pathname +
              (qsPrivate.toString() ? '?' + qsPrivate.toString() : '') +
              location.hash;
            history.replaceState(null, '', nu);
          }
        } catch (_) { /* empty */ }

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

        // ─── Block lookup (server-inlined) ───────────────────────────
        var blocksLookup = {};
        try {
          var raw = doc.getElementById('sptv-friends-blocks');
          if (raw && raw.textContent) blocksLookup = JSON.parse(raw.textContent) || {};
        } catch (_) { /* empty */ }

        // ─── Helpers (friends + relays — mirror /sparrow/tv) ────────
        var DEFAULT_RELAYS = [
          'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'
        ];
        var SYNC_KIND  = 30078;
        var D_TAG      = 'sparrow-public-saved-v1';
        var FRESH_MS   = 90_000;
        var DWELL_MS   = 12_000;

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
            var r = localStorage.getItem('sparrow:nostr-relays');
            var list = r ? JSON.parse(r) : null;
            if (Array.isArray(list) && list.length) {
              return list.filter(function (u) { return typeof u === 'string' && u.startsWith('ws'); });
            }
          } catch (_) { /* empty */ }
          return DEFAULT_RELAYS;
        }
        function nameFor(pubkey, friend) {
          if (friend && friend.alias) return friend.alias;
          var p = readProfiles()[pubkey];
          if (p && (p.display_name || p.name)) return p.display_name || p.name;
          return pubkey.slice(0, 8) + '…';
        }
        function pictureFor(pubkey) {
          var p = readProfiles()[pubkey];
          if (p && typeof p.picture === 'string' && /^https?:\\/\\//i.test(p.picture)) return p.picture;
          return '';
        }

        // ─── Empty state vs fallback rotation ───────────────────────
        var emptyEl  = doc.querySelector('[data-sptv-empty]');
        var stage    = doc.querySelector('[data-sptv-stage]');
        var stageOl  = stage; // alias
        var mainEl   = doc.querySelector('.sptv');
        var progress = doc.querySelector('[data-sptv-progress]');

        function showEmpty() {
          if (emptyEl) emptyEl.hidden = false;
          if (stage)   stage.hidden = true;
        }
        function showStage() {
          if (emptyEl) emptyEl.hidden = true;
          if (stage)   stage.hidden = false;
        }

        // ─── Slide rotation (works on any current stage children) ───
        var idx = 0;
        var dwellStart = Date.now();

        function currentSlides() {
          if (!stageOl) return [];
          return Array.prototype.slice.call(stageOl.querySelectorAll('.sptv-slide'));
        }
        function paintActive() {
          var slides = currentSlides();
          if (!slides.length) return;
          if (idx >= slides.length) idx = 0;
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
          var slides = currentSlides();
          if (!slides.length) return;
          idx = ((idx + dir) + slides.length) % slides.length;
          paintActive();
        }
        setInterval(function () { step(1); }, DWELL_MS);
        setInterval(function () {
          if (!progress) return;
          var pct = Math.min(100, ((Date.now() - dwellStart) / DWELL_MS) * 100);
          progress.style.width = pct.toFixed(1) + '%';
        }, 200);
        doc.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { step(1);  e.preventDefault(); return; }
          if (e.key === 'ArrowLeft')  { step(-1); e.preventDefault(); return; }
          if (e.key === 'Escape') { /* unlock — friends mode has nothing locked yet */ }
        });

        // ─── Friend-feed slide builder ──────────────────────────────
        // Newest kind-30078 event per author under #d=sparrow-public-saved-v1.
        // Each event content is { saved: { value: ['0123', ...] }, ... }.
        // We flatten saved IDs across authors, dedupe (first-saver wins),
        // resolve via blocksLookup, and rebuild the stage in place.

        var newestByAuthor = new Map(); // pubkey -> { created_at, ids[] }

        function rebuildSlidesFromFriends() {
          if (!stageOl) return;
          var entries = Array.from(newestByAuthor.entries());
          if (!entries.length) return;
          // Sort entries by created_at desc — freshest savers first.
          entries.sort(function (a, b) { return b[1].created_at - a[1].created_at; });
          var seen = Object.create(null);
          var picks = [];
          for (var e = 0; e < entries.length; e++) {
            var pubkey = entries[e][0];
            var rec    = entries[e][1];
            for (var i = 0; i < rec.ids.length; i++) {
              var id = rec.ids[i];
              if (seen[id]) continue;
              var blk = blocksLookup[id];
              if (!blk) continue; // unknown id (older than the 60-block window) — skip
              seen[id] = pubkey;
              picks.push({ block: blk, savedBy: pubkey });
              if (picks.length >= 18) break;
            }
            if (picks.length >= 18) break;
          }
          if (!picks.length) return;

          // Build new slide DOM.
          stageOl.setAttribute('data-sptv-stage-mode', 'friends');
          stageOl.innerHTML = '';
          var friendsByPubkey = Object.create(null);
          readFriends().forEach(function (f) { friendsByPubkey[f.pubkey] = f; });

          for (var p = 0; p < picks.length; p++) {
            var pick = picks[p];
            var b = pick.block;
            var li = doc.createElement('li');
            li.className = 'sptv-slide' + (p === 0 ? ' is-active' : '');
            li.setAttribute('data-slide-idx', String(p));
            li.setAttribute('data-channel', b.channel);
            li.setAttribute('data-block-id', b.id);
            li.style.setProperty('--ch', 'var(--ch-' + String(b.channel).toLowerCase() + ')');
            li.setAttribute('aria-hidden', p === 0 ? 'false' : 'true');

            var inner = doc.createElement('div');
            inner.className = 'sptv-slide__inner';

            var chip = doc.createElement('div');
            chip.className = 'sptv-slide__chip';
            chip.innerHTML =
              '<span class="sptv-slide__chip-dot" aria-hidden="true"></span>' +
              ' CH · ' + esc(b.channel) + ' · ' + esc(String(b.channelName).toUpperCase());
            inner.appendChild(chip);

            var friendChip = doc.createElement('div');
            friendChip.className = 'sptv-slide__friend';
            var friend = friendsByPubkey[pick.savedBy] || { pubkey: pick.savedBy, alias: '' };
            var nm = nameFor(pick.savedBy, friend);
            var pic = pictureFor(pick.savedBy);
            friendChip.innerHTML =
              (pic
                ? '<img class="sptv-slide__friend-avatar" src="' + esc(pic) +
                  '" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\\'none\\'">'
                : '<span class="sptv-slide__friend-avatar sptv-slide__friend-avatar--placeholder" aria-hidden="true">✦</span>') +
              '<span class="sptv-slide__friend-label">saved by ' + esc(nm) + '</span>';
            inner.appendChild(friendChip);

            var meta = doc.createElement('div');
            meta.className = 'sptv-slide__meta';
            var when = '';
            try {
              when = new Date(b.timestamp).toLocaleDateString('en-US', {
                timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric',
              });
            } catch (_) { when = ''; }
            meta.innerHTML =
              '<span>№ ' + esc(b.id) + '</span><span>·</span>' +
              '<span>' + esc(b.type) + '</span><span>·</span>' +
              '<time datetime="' + esc(b.timestamp) + '">' + esc(when) + '</time>' +
              (b.mood ? '<span>·</span><span class="sptv-slide__mood">mood ' + esc(b.mood) + '</span>' : '');
            inner.appendChild(meta);

            var h2 = doc.createElement('h2');
            h2.className = 'sptv-slide__title';
            h2.textContent = b.title;
            inner.appendChild(h2);

            if (b.dek) {
              var dk = doc.createElement('p');
              dk.className = 'sptv-slide__dek';
              dk.textContent = b.dek;
              inner.appendChild(dk);
            }

            li.appendChild(inner);
            stageOl.appendChild(li);
          }
          idx = 0;
          paintActive();
          paintFedStrip();
        }
        function esc(s) {
          return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
          });
        }

        // ─── Federation strip (replaces rosette in friends mode) ────
        var fedStrip = doc.querySelector('[data-sptv-fed-strip]');
        var fedList  = doc.querySelector('[data-sptv-fed-list]');
        var fedCount = doc.querySelector('[data-sptv-fed-count]');

        function paintFedStrip() {
          if (!fedStrip || !fedList || !fedCount) return;
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          // Always count, even when avatars are hidden — the count alone
          // doesn't leak who, just how many.
          var contributors = Array.from(newestByAuthor.keys());
          fedCount.textContent = contributors.length
            ? String(contributors.length) + ' signer' + (contributors.length === 1 ? '' : 's')
            : '—';
          fedStrip.hidden = false;
          fedList.innerHTML = '';
          if (!allow) return; // count-only mode — keep the strip but skip avatars
          var profiles = readProfiles();
          contributors.slice(0, 8).forEach(function (pubkey) {
            var li = doc.createElement('li');
            li.className = 'sptv-fed-strip__item';
            var pic = pictureFor(pubkey);
            var nm = (profiles[pubkey] && (profiles[pubkey].display_name || profiles[pubkey].name)) ||
                     (readFriends().find(function (f) { return f.pubkey === pubkey; }) || {}).alias ||
                     pubkey.slice(0, 8) + '…';
            li.innerHTML = pic
              ? '<img src="' + esc(pic) +
                '" alt="" title="' + esc(nm) +
                '" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\\'none\\'">'
              : '<span class="sptv-fed-strip__placeholder" title="' + esc(nm) + '" aria-hidden="true">✦</span>';
            fedList.appendChild(li);
          });
          if (contributors.length > 8) {
            var more = doc.createElement('li');
            more.className = 'sptv-fed-strip__more';
            more.textContent = '+' + (contributors.length - 8);
            fedList.appendChild(more);
          }
        }

        // ─── WS subscription — friends' kind-30078 saved events ────
        var feedSockets = [];
        function subscribeToFriendsFeed(friends) {
          if (!friends.length) return;
          var authors = friends.map(function (f) { return f.pubkey; });
          var subId = 'sptv-fr-' + Math.random().toString(36).slice(2, 10);
          var filter = {
            kinds:   [SYNC_KIND],
            authors: authors,
            '#d':    [D_TAG],
            limit:   authors.length * 2,
          };
          getRelays().forEach(function (url) {
            try {
              var ws = new WebSocket(url);
              feedSockets.push(ws);
              ws.addEventListener('open', function () {
                try { ws.send(JSON.stringify(['REQ', subId, filter])); } catch (_) {}
              });
              ws.addEventListener('message', function (msg) {
                var frame;
                try { frame = JSON.parse(msg.data); } catch (_) { return; }
                if (!Array.isArray(frame)) return;
                if (frame[0] === 'EVENT' && frame[1] === subId && frame[2]) {
                  ingestEvent(frame[2]);
                } else if (frame[0] === 'EOSE' && frame[1] === subId) {
                  try { ws.send(JSON.stringify(['CLOSE', subId])); } catch (_) {}
                  try { ws.close(); } catch (_) {}
                  rebuildSlidesFromFriends();
                }
              });
              setTimeout(function () {
                try { if (ws.readyState <= 1) ws.close(); } catch (_) {}
              }, 8000);
            } catch (_) { /* relay failed, skip */ }
          });
          // Best-effort repaint after a short window even if no EOSE.
          setTimeout(rebuildSlidesFromFriends, 2500);
        }
        function ingestEvent(ev) {
          if (!ev || ev.kind !== SYNC_KIND || typeof ev.content !== 'string') return;
          if (typeof ev.pubkey !== 'string' || typeof ev.created_at !== 'number') return;
          var hasD = Array.isArray(ev.tags) && ev.tags.some(function (t) {
            return Array.isArray(t) && t[0] === 'd' && t[1] === D_TAG;
          });
          if (!hasD) return;
          var body;
          try { body = JSON.parse(ev.content); } catch (_) { return; }
          if (!body || typeof body !== 'object') return;
          var savedValue = body && body.saved && body.saved.value;
          if (!Array.isArray(savedValue)) return;
          // Confirm friend list is still live (re-read to catch local mute edits).
          var live = readFriends();
          if (!live.some(function (f) { return f.pubkey === ev.pubkey; })) return;
          var ids = savedValue.filter(function (id) { return typeof id === 'string'; });
          var prior = newestByAuthor.get(ev.pubkey);
          if (!prior || ev.created_at > prior.created_at) {
            newestByAuthor.set(ev.pubkey, { created_at: ev.created_at, ids: ids });
          }
        }

        // ─── Here-now strip (mirror /sparrow/tv contract) ───────────
        var hereSockets = [];
        var lastSeen = Object.create(null);
        var bootTime = Math.floor(Date.now() / 1000);
        var hereEl   = doc.querySelector('[data-sptv-here]');
        var hereList = doc.querySelector('[data-sptv-here-list]');

        function paintHere() {
          if (!hereEl || !hereList) return;
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) { hereEl.hidden = true; return; }
          var friends = readFriends();
          if (!friends.length) { hereEl.hidden = true; return; }
          var profiles = readProfiles();
          var now = Date.now();
          var ranked = friends.slice().sort(function (a, b) {
            var sa = lastSeen[a.pubkey] || 0;
            var sb = lastSeen[b.pubkey] || 0;
            return sb - sa;
          }).slice(0, 8);
          hereEl.hidden = false;
          hereList.innerHTML = '';
          ranked.forEach(function (f) {
            var li = doc.createElement('li');
            li.className = 'sptv-here__item';
            var seen = lastSeen[f.pubkey] || 0;
            var fresh = (now - seen) < FRESH_MS;
            if (fresh) li.setAttribute('data-fresh', '1');
            var prof = profiles[f.pubkey] || {};
            var pic = (typeof prof.picture === 'string' && /^https?:\\/\\//i.test(prof.picture))
              ? prof.picture : '';
            li.innerHTML = pic
              ? '<img src="' + esc(pic) +
                '" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\\'none\\'">'
              : '<span class="sptv-here__placeholder" aria-hidden="true">✦</span>';
            hereList.appendChild(li);
          });
        }

        function startPresenceWatch(friends) {
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) return;
          if (!friends.length) return;
          var authors = friends.map(function (f) { return f.pubkey; });
          var subId = 'sptv-fr-here-' + Math.random().toString(36).slice(2, 10);
          var filter = {
            kinds: [20078], authors: authors,
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
                var ok = Array.isArray(ev.tags) && ev.tags.some(function (t) {
                  return Array.isArray(t) && t[0] === 't' && t[1] === 'sparrow-presence';
                });
                if (!ok) return;
                var live = readFriends();
                if (!live.some(function (f) { return f.pubkey === ev.pubkey; })) return;
                lastSeen[ev.pubkey] = Date.now();
                paintHere();
              });
            } catch (_) { /* relay failed, skip */ }
          });
          setInterval(paintHere, 20_000);
        }

        // ─── Boot: pick empty / fallback / friends-feed paths ───────
        function boot() {
          var friends = readFriends();
          if (!friends.length) {
            // No follows configured — show empty CTA instead of slides.
            showEmpty();
            paintFedStrip();
            return;
          }
          // Friends configured — keep the server-rendered fallback rotation
          // active while we wait for the WS to bring real friend data.
          showStage();
          paintActive();
          paintHere();
          subscribeToFriendsFeed(friends);
          startPresenceWatch(friends);
        }
        boot();

        // React to friends-list edits in other tabs.
        window.addEventListener('storage', function (e) {
          if (!e.key) return;
          if (e.key === 'sparrow:friends' ||
              e.key === 'sparrow:profiles' ||
              e.key === 'sparrow:tv-private-ok') {
            paintHere();
            paintFedStrip();
          }
        });
        window.addEventListener('beforeunload', function () {
          feedSockets.forEach(function (ws) { try { ws.close(); } catch (_) {} });
          hereSockets.forEach(function (ws) { try { ws.close(); } catch (_) {} });
        });
      })();
    <\/script> </body> </html>`], ['<html lang="en" data-theme="blue-hour"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sparrow TV · Friends · PointCast</title><meta name="description" content="The federation channel of Sparrow TV — what your follows are reading right now, on a wall."><link rel="canonical" href="https://pointcast.xyz/sparrow/tv/friends"><link rel="alternate" href="/sparrow/tv" title="Sparrow TV (broadcast)"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700&family=Departure+Mono&display=swap" rel="stylesheet">', '</head> <body class="sptv-body" data-surface="desktop" data-tv-mode="friends"> <main class="sptv sptv--friends" data-channel-active="" aria-label="Sparrow TV · Friends"> <header class="sptv-head"> <span class="sptv-glyph" aria-hidden="true">✦</span> <span class="sptv-name">Sparrow</span> <span class="sptv-sub">tv · friends</span> <span class="sptv-clock" data-sptv-clock>—:—</span> </header> <div class="sptv-progress" aria-hidden="true"> <div class="sptv-progress__bar" data-sptv-progress></div> </div>  <section class="sptv-empty sptv-empty--friends" data-sptv-empty hidden aria-label="No friends configured"> <p class="sptv-empty__kicker">CH · FRIENDS</p> <h2 class="sptv-empty__title">∅ No federation tuned in.</h2> <p class="sptv-empty__dek">\nAdd a follow at <a href="/sparrow/friends">/sparrow/friends</a> — Sparrow TV will rotate\n          their freshest reads here.\n</p> <p class="sptv-empty__hint">Until then, <a href="/sparrow/tv">all channels</a> still broadcasts the latest blocks.</p> </section>  <ol class="sptv-stage" data-sptv-stage data-sptv-stage-mode="fallback"> ', ' </ol>  <aside class="sptv-fed-strip" data-sptv-fed-strip aria-label="federation slate" hidden> <span class="sptv-fed-strip__label">✦ tuned to</span> <ul class="sptv-fed-strip__list" data-sptv-fed-list></ul> <span class="sptv-fed-strip__count" data-sptv-fed-count>—</span> </aside>  <aside class="sptv-here" data-sptv-here aria-label="friends here now" hidden> <span class="sptv-here__label">✦ here now</span> <ul class="sptv-here__list" data-sptv-here-list></ul> </aside> <footer class="sptv-foot"> <span class="sptv-foot__brand">pointcast.xyz/sparrow/tv/friends</span> <span class="sptv-foot__sep">·</span> <span class="sptv-foot__hint">←/→ to step · Esc to unlock · open <a href="/sparrow/tv">all channels</a></span> </footer> </main>  <script type="application/json" id="sptv-friends-blocks">', `<\/script> <script>
      (function () {
        'use strict';
        var doc = document;
        var body = doc.body;

        // ─── Surface detect (mirror /sparrow/tv) ────────────────────
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

        // ?private-ok=1 → opt-in for shared TVs. Strips the param and
        // writes the local flag so subsequent renders behave the same.
        try {
          var qsPrivate = new URLSearchParams(location.search);
          if (qsPrivate.get('private-ok') === '1') {
            localStorage.setItem('sparrow:tv-private-ok', '1');
            qsPrivate.delete('private-ok');
            var nu = location.pathname +
              (qsPrivate.toString() ? '?' + qsPrivate.toString() : '') +
              location.hash;
            history.replaceState(null, '', nu);
          }
        } catch (_) { /* empty */ }

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

        // ─── Block lookup (server-inlined) ───────────────────────────
        var blocksLookup = {};
        try {
          var raw = doc.getElementById('sptv-friends-blocks');
          if (raw && raw.textContent) blocksLookup = JSON.parse(raw.textContent) || {};
        } catch (_) { /* empty */ }

        // ─── Helpers (friends + relays — mirror /sparrow/tv) ────────
        var DEFAULT_RELAYS = [
          'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'
        ];
        var SYNC_KIND  = 30078;
        var D_TAG      = 'sparrow-public-saved-v1';
        var FRESH_MS   = 90_000;
        var DWELL_MS   = 12_000;

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
            var r = localStorage.getItem('sparrow:nostr-relays');
            var list = r ? JSON.parse(r) : null;
            if (Array.isArray(list) && list.length) {
              return list.filter(function (u) { return typeof u === 'string' && u.startsWith('ws'); });
            }
          } catch (_) { /* empty */ }
          return DEFAULT_RELAYS;
        }
        function nameFor(pubkey, friend) {
          if (friend && friend.alias) return friend.alias;
          var p = readProfiles()[pubkey];
          if (p && (p.display_name || p.name)) return p.display_name || p.name;
          return pubkey.slice(0, 8) + '…';
        }
        function pictureFor(pubkey) {
          var p = readProfiles()[pubkey];
          if (p && typeof p.picture === 'string' && /^https?:\\\\/\\\\//i.test(p.picture)) return p.picture;
          return '';
        }

        // ─── Empty state vs fallback rotation ───────────────────────
        var emptyEl  = doc.querySelector('[data-sptv-empty]');
        var stage    = doc.querySelector('[data-sptv-stage]');
        var stageOl  = stage; // alias
        var mainEl   = doc.querySelector('.sptv');
        var progress = doc.querySelector('[data-sptv-progress]');

        function showEmpty() {
          if (emptyEl) emptyEl.hidden = false;
          if (stage)   stage.hidden = true;
        }
        function showStage() {
          if (emptyEl) emptyEl.hidden = true;
          if (stage)   stage.hidden = false;
        }

        // ─── Slide rotation (works on any current stage children) ───
        var idx = 0;
        var dwellStart = Date.now();

        function currentSlides() {
          if (!stageOl) return [];
          return Array.prototype.slice.call(stageOl.querySelectorAll('.sptv-slide'));
        }
        function paintActive() {
          var slides = currentSlides();
          if (!slides.length) return;
          if (idx >= slides.length) idx = 0;
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
          var slides = currentSlides();
          if (!slides.length) return;
          idx = ((idx + dir) + slides.length) % slides.length;
          paintActive();
        }
        setInterval(function () { step(1); }, DWELL_MS);
        setInterval(function () {
          if (!progress) return;
          var pct = Math.min(100, ((Date.now() - dwellStart) / DWELL_MS) * 100);
          progress.style.width = pct.toFixed(1) + '%';
        }, 200);
        doc.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { step(1);  e.preventDefault(); return; }
          if (e.key === 'ArrowLeft')  { step(-1); e.preventDefault(); return; }
          if (e.key === 'Escape') { /* unlock — friends mode has nothing locked yet */ }
        });

        // ─── Friend-feed slide builder ──────────────────────────────
        // Newest kind-30078 event per author under #d=sparrow-public-saved-v1.
        // Each event content is { saved: { value: ['0123', ...] }, ... }.
        // We flatten saved IDs across authors, dedupe (first-saver wins),
        // resolve via blocksLookup, and rebuild the stage in place.

        var newestByAuthor = new Map(); // pubkey -> { created_at, ids[] }

        function rebuildSlidesFromFriends() {
          if (!stageOl) return;
          var entries = Array.from(newestByAuthor.entries());
          if (!entries.length) return;
          // Sort entries by created_at desc — freshest savers first.
          entries.sort(function (a, b) { return b[1].created_at - a[1].created_at; });
          var seen = Object.create(null);
          var picks = [];
          for (var e = 0; e < entries.length; e++) {
            var pubkey = entries[e][0];
            var rec    = entries[e][1];
            for (var i = 0; i < rec.ids.length; i++) {
              var id = rec.ids[i];
              if (seen[id]) continue;
              var blk = blocksLookup[id];
              if (!blk) continue; // unknown id (older than the 60-block window) — skip
              seen[id] = pubkey;
              picks.push({ block: blk, savedBy: pubkey });
              if (picks.length >= 18) break;
            }
            if (picks.length >= 18) break;
          }
          if (!picks.length) return;

          // Build new slide DOM.
          stageOl.setAttribute('data-sptv-stage-mode', 'friends');
          stageOl.innerHTML = '';
          var friendsByPubkey = Object.create(null);
          readFriends().forEach(function (f) { friendsByPubkey[f.pubkey] = f; });

          for (var p = 0; p < picks.length; p++) {
            var pick = picks[p];
            var b = pick.block;
            var li = doc.createElement('li');
            li.className = 'sptv-slide' + (p === 0 ? ' is-active' : '');
            li.setAttribute('data-slide-idx', String(p));
            li.setAttribute('data-channel', b.channel);
            li.setAttribute('data-block-id', b.id);
            li.style.setProperty('--ch', 'var(--ch-' + String(b.channel).toLowerCase() + ')');
            li.setAttribute('aria-hidden', p === 0 ? 'false' : 'true');

            var inner = doc.createElement('div');
            inner.className = 'sptv-slide__inner';

            var chip = doc.createElement('div');
            chip.className = 'sptv-slide__chip';
            chip.innerHTML =
              '<span class="sptv-slide__chip-dot" aria-hidden="true"></span>' +
              ' CH · ' + esc(b.channel) + ' · ' + esc(String(b.channelName).toUpperCase());
            inner.appendChild(chip);

            var friendChip = doc.createElement('div');
            friendChip.className = 'sptv-slide__friend';
            var friend = friendsByPubkey[pick.savedBy] || { pubkey: pick.savedBy, alias: '' };
            var nm = nameFor(pick.savedBy, friend);
            var pic = pictureFor(pick.savedBy);
            friendChip.innerHTML =
              (pic
                ? '<img class="sptv-slide__friend-avatar" src="' + esc(pic) +
                  '" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\\\\'none\\\\'">'
                : '<span class="sptv-slide__friend-avatar sptv-slide__friend-avatar--placeholder" aria-hidden="true">✦</span>') +
              '<span class="sptv-slide__friend-label">saved by ' + esc(nm) + '</span>';
            inner.appendChild(friendChip);

            var meta = doc.createElement('div');
            meta.className = 'sptv-slide__meta';
            var when = '';
            try {
              when = new Date(b.timestamp).toLocaleDateString('en-US', {
                timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric',
              });
            } catch (_) { when = ''; }
            meta.innerHTML =
              '<span>№ ' + esc(b.id) + '</span><span>·</span>' +
              '<span>' + esc(b.type) + '</span><span>·</span>' +
              '<time datetime="' + esc(b.timestamp) + '">' + esc(when) + '</time>' +
              (b.mood ? '<span>·</span><span class="sptv-slide__mood">mood ' + esc(b.mood) + '</span>' : '');
            inner.appendChild(meta);

            var h2 = doc.createElement('h2');
            h2.className = 'sptv-slide__title';
            h2.textContent = b.title;
            inner.appendChild(h2);

            if (b.dek) {
              var dk = doc.createElement('p');
              dk.className = 'sptv-slide__dek';
              dk.textContent = b.dek;
              inner.appendChild(dk);
            }

            li.appendChild(inner);
            stageOl.appendChild(li);
          }
          idx = 0;
          paintActive();
          paintFedStrip();
        }
        function esc(s) {
          return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
          });
        }

        // ─── Federation strip (replaces rosette in friends mode) ────
        var fedStrip = doc.querySelector('[data-sptv-fed-strip]');
        var fedList  = doc.querySelector('[data-sptv-fed-list]');
        var fedCount = doc.querySelector('[data-sptv-fed-count]');

        function paintFedStrip() {
          if (!fedStrip || !fedList || !fedCount) return;
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          // Always count, even when avatars are hidden — the count alone
          // doesn't leak who, just how many.
          var contributors = Array.from(newestByAuthor.keys());
          fedCount.textContent = contributors.length
            ? String(contributors.length) + ' signer' + (contributors.length === 1 ? '' : 's')
            : '—';
          fedStrip.hidden = false;
          fedList.innerHTML = '';
          if (!allow) return; // count-only mode — keep the strip but skip avatars
          var profiles = readProfiles();
          contributors.slice(0, 8).forEach(function (pubkey) {
            var li = doc.createElement('li');
            li.className = 'sptv-fed-strip__item';
            var pic = pictureFor(pubkey);
            var nm = (profiles[pubkey] && (profiles[pubkey].display_name || profiles[pubkey].name)) ||
                     (readFriends().find(function (f) { return f.pubkey === pubkey; }) || {}).alias ||
                     pubkey.slice(0, 8) + '…';
            li.innerHTML = pic
              ? '<img src="' + esc(pic) +
                '" alt="" title="' + esc(nm) +
                '" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\\\\'none\\\\'">'
              : '<span class="sptv-fed-strip__placeholder" title="' + esc(nm) + '" aria-hidden="true">✦</span>';
            fedList.appendChild(li);
          });
          if (contributors.length > 8) {
            var more = doc.createElement('li');
            more.className = 'sptv-fed-strip__more';
            more.textContent = '+' + (contributors.length - 8);
            fedList.appendChild(more);
          }
        }

        // ─── WS subscription — friends' kind-30078 saved events ────
        var feedSockets = [];
        function subscribeToFriendsFeed(friends) {
          if (!friends.length) return;
          var authors = friends.map(function (f) { return f.pubkey; });
          var subId = 'sptv-fr-' + Math.random().toString(36).slice(2, 10);
          var filter = {
            kinds:   [SYNC_KIND],
            authors: authors,
            '#d':    [D_TAG],
            limit:   authors.length * 2,
          };
          getRelays().forEach(function (url) {
            try {
              var ws = new WebSocket(url);
              feedSockets.push(ws);
              ws.addEventListener('open', function () {
                try { ws.send(JSON.stringify(['REQ', subId, filter])); } catch (_) {}
              });
              ws.addEventListener('message', function (msg) {
                var frame;
                try { frame = JSON.parse(msg.data); } catch (_) { return; }
                if (!Array.isArray(frame)) return;
                if (frame[0] === 'EVENT' && frame[1] === subId && frame[2]) {
                  ingestEvent(frame[2]);
                } else if (frame[0] === 'EOSE' && frame[1] === subId) {
                  try { ws.send(JSON.stringify(['CLOSE', subId])); } catch (_) {}
                  try { ws.close(); } catch (_) {}
                  rebuildSlidesFromFriends();
                }
              });
              setTimeout(function () {
                try { if (ws.readyState <= 1) ws.close(); } catch (_) {}
              }, 8000);
            } catch (_) { /* relay failed, skip */ }
          });
          // Best-effort repaint after a short window even if no EOSE.
          setTimeout(rebuildSlidesFromFriends, 2500);
        }
        function ingestEvent(ev) {
          if (!ev || ev.kind !== SYNC_KIND || typeof ev.content !== 'string') return;
          if (typeof ev.pubkey !== 'string' || typeof ev.created_at !== 'number') return;
          var hasD = Array.isArray(ev.tags) && ev.tags.some(function (t) {
            return Array.isArray(t) && t[0] === 'd' && t[1] === D_TAG;
          });
          if (!hasD) return;
          var body;
          try { body = JSON.parse(ev.content); } catch (_) { return; }
          if (!body || typeof body !== 'object') return;
          var savedValue = body && body.saved && body.saved.value;
          if (!Array.isArray(savedValue)) return;
          // Confirm friend list is still live (re-read to catch local mute edits).
          var live = readFriends();
          if (!live.some(function (f) { return f.pubkey === ev.pubkey; })) return;
          var ids = savedValue.filter(function (id) { return typeof id === 'string'; });
          var prior = newestByAuthor.get(ev.pubkey);
          if (!prior || ev.created_at > prior.created_at) {
            newestByAuthor.set(ev.pubkey, { created_at: ev.created_at, ids: ids });
          }
        }

        // ─── Here-now strip (mirror /sparrow/tv contract) ───────────
        var hereSockets = [];
        var lastSeen = Object.create(null);
        var bootTime = Math.floor(Date.now() / 1000);
        var hereEl   = doc.querySelector('[data-sptv-here]');
        var hereList = doc.querySelector('[data-sptv-here-list]');

        function paintHere() {
          if (!hereEl || !hereList) return;
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) { hereEl.hidden = true; return; }
          var friends = readFriends();
          if (!friends.length) { hereEl.hidden = true; return; }
          var profiles = readProfiles();
          var now = Date.now();
          var ranked = friends.slice().sort(function (a, b) {
            var sa = lastSeen[a.pubkey] || 0;
            var sb = lastSeen[b.pubkey] || 0;
            return sb - sa;
          }).slice(0, 8);
          hereEl.hidden = false;
          hereList.innerHTML = '';
          ranked.forEach(function (f) {
            var li = doc.createElement('li');
            li.className = 'sptv-here__item';
            var seen = lastSeen[f.pubkey] || 0;
            var fresh = (now - seen) < FRESH_MS;
            if (fresh) li.setAttribute('data-fresh', '1');
            var prof = profiles[f.pubkey] || {};
            var pic = (typeof prof.picture === 'string' && /^https?:\\\\/\\\\//i.test(prof.picture))
              ? prof.picture : '';
            li.innerHTML = pic
              ? '<img src="' + esc(pic) +
                '" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\\\\'none\\\\'">'
              : '<span class="sptv-here__placeholder" aria-hidden="true">✦</span>';
            hereList.appendChild(li);
          });
        }

        function startPresenceWatch(friends) {
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) return;
          if (!friends.length) return;
          var authors = friends.map(function (f) { return f.pubkey; });
          var subId = 'sptv-fr-here-' + Math.random().toString(36).slice(2, 10);
          var filter = {
            kinds: [20078], authors: authors,
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
                var ok = Array.isArray(ev.tags) && ev.tags.some(function (t) {
                  return Array.isArray(t) && t[0] === 't' && t[1] === 'sparrow-presence';
                });
                if (!ok) return;
                var live = readFriends();
                if (!live.some(function (f) { return f.pubkey === ev.pubkey; })) return;
                lastSeen[ev.pubkey] = Date.now();
                paintHere();
              });
            } catch (_) { /* relay failed, skip */ }
          });
          setInterval(paintHere, 20_000);
        }

        // ─── Boot: pick empty / fallback / friends-feed paths ───────
        function boot() {
          var friends = readFriends();
          if (!friends.length) {
            // No follows configured — show empty CTA instead of slides.
            showEmpty();
            paintFedStrip();
            return;
          }
          // Friends configured — keep the server-rendered fallback rotation
          // active while we wait for the WS to bring real friend data.
          showStage();
          paintActive();
          paintHere();
          subscribeToFriendsFeed(friends);
          startPresenceWatch(friends);
        }
        boot();

        // React to friends-list edits in other tabs.
        window.addEventListener('storage', function (e) {
          if (!e.key) return;
          if (e.key === 'sparrow:friends' ||
              e.key === 'sparrow:profiles' ||
              e.key === 'sparrow:tv-private-ok') {
            paintHere();
            paintFedStrip();
          }
        });
        window.addEventListener('beforeunload', function () {
          feedSockets.forEach(function (ws) { try { ws.close(); } catch (_) {} });
          hereSockets.forEach(function (ws) { try { ws.close(); } catch (_) {} });
        });
      })();
    <\/script> </body> </html>`])), renderHead(), fallbackSlides.map((s, i) => renderTemplate`<li${addAttribute(`sptv-slide${i === 0 ? " is-active" : ""}`, "class")}${addAttribute(i, "data-slide-idx")}${addAttribute(s.channel, "data-channel")}${addAttribute(s.id, "data-block-id")}${addAttribute(`--ch: var(--ch-${s.channel.toLowerCase()});`, "style")}${addAttribute(i !== 0 ? "true" : "false", "aria-hidden")}> <div class="sptv-slide__inner"> <div class="sptv-slide__chip"> <span class="sptv-slide__chip-dot" aria-hidden="true"></span>
CH · ${s.channel} · ${s.channelName.toUpperCase()} </div> <div class="sptv-slide__friend" data-sptv-friend hidden aria-hidden="true"></div> <div class="sptv-slide__meta"> <span>№ ${s.id}</span> <span>·</span> <span>${s.type}</span> <span>·</span> <time${addAttribute(s.timestamp, "datetime")}>${fmtDate(s.timestamp)}</time> ${s.mood && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <span>·</span> <span class="sptv-slide__mood">mood ${s.mood}</span> ` })}`} </div> <h2 class="sptv-slide__title">${s.title}</h2> ${s.dek && renderTemplate`<p class="sptv-slide__dek">${s.dek}</p>`} </div> </li>`), unescapeHTML(JSON.stringify(blocksLookup)));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/tv/friends.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/tv/friends.astro";
const $$url = "/sparrow/tv/friends";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
      __proto__: null,
      default: $$Friends,
      file: $$file,
      url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
