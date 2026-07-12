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
const $$Saved = createComponent(async ($$result, $$props, $$slots) => {
  const all = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const fallbackSlides = buildTVSlides(all, { limit: 18 });
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
  const channels = CHANNEL_LIST.map((c) => ({ code: c.code, slug: c.slug, name: c.name }));
  const fmtDate = fmtTVDate;
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-theme="blue-hour"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sparrow TV · Saved · PointCast</title><meta name="description" content="Your personal reading list, on a wall. Privacy-default-hidden — opt-in only."><link rel="canonical" href="https://pointcast.xyz/sparrow/tv/saved"><link rel="alternate" href="/sparrow/tv" title="Sparrow TV (broadcast)"><link rel="alternate" href="/sparrow/tv/friends" title="Sparrow TV (federation)"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700&family=Departure+Mono&display=swap" rel="stylesheet">', `</head> <body class="sptv-body" data-surface="desktop" data-tv-mode="saved"> <main class="sptv sptv--saved" data-channel-active="" aria-label="Sparrow TV · Saved"> <header class="sptv-head"> <span class="sptv-glyph" aria-hidden="true">✦</span> <span class="sptv-name">Sparrow</span> <span class="sptv-sub">tv · your list</span> <span class="sptv-clock" data-sptv-clock>—:—</span> </header> <div class="sptv-progress" aria-hidden="true"> <div class="sptv-progress__bar" data-sptv-progress></div> </div>  <section class="sptv-empty sptv-empty--gate" data-sptv-gate aria-label="Personal-channel privacy gate"> <p class="sptv-empty__kicker">CH · YOUR LIST · PRIVATE BY DEFAULT</p> <h2 class="sptv-empty__title">∅ This screen is private.</h2> <p class="sptv-empty__dek">
Your reading list is local-only and stays that way unless you opt in here. A kitchen TV
          shouldn't paint a stranger's list onto the wall just because they happened to be the
          last user signed in.
</p> <p class="sptv-empty__hint">
To show your list, set <code>sparrow:tv-saved-ok</code> to <code>1</code> in localStorage,
          or open this URL with <code>?saved-ok=1</code> (writes the flag and strips it).
          Switch back: open <a href="/sparrow/tv">all channels</a> or
<a href="/sparrow/tv/friends">federation</a>.
</p> </section>  <section class="sptv-empty sptv-empty--saved-zero" data-sptv-empty hidden aria-label="Reading list is empty"> <p class="sptv-empty__kicker">CH · YOUR LIST</p> <h2 class="sptv-empty__title">∅ Nothing saved yet.</h2> <p class="sptv-empty__dek">
Open a block at <a href="/sparrow">/sparrow</a> and press <kbd>S</kbd> to save it. Saved
          blocks rotate here in newest-first order.
</p> <p class="sptv-empty__hint">
You can also browse <a href="/sparrow/tv/friends">federation</a> or
<a href="/sparrow/tv">all channels</a> while you build a list.
</p> </section>  <ol class="sptv-stage" data-sptv-stage data-sptv-stage-mode="server-fallback" hidden> `, ' </ol>  <aside class="sptv-saved-strip" data-sptv-saved-strip aria-label="reading list summary" hidden> <span class="sptv-saved-strip__label">✦ your list</span> <span class="sptv-saved-strip__count" data-sptv-saved-count>—</span> <ul class="sptv-saved-strip__dots" data-sptv-saved-dots> ', ' </ul> </aside>  <aside class="sptv-here" data-sptv-here aria-label="friends here now" hidden> <span class="sptv-here__label">✦ here now</span> <ul class="sptv-here__list" data-sptv-here-list></ul> </aside> <footer class="sptv-foot"> <span class="sptv-foot__brand">pointcast.xyz/sparrow/tv/saved</span> <span class="sptv-foot__sep">·</span> <span class="sptv-foot__hint">←/→ to step · open <a href="/sparrow/tv/friends">federation</a> · <a href="/sparrow/tv">all channels</a></span> </footer> </main>  <script type="application/json" id="sptv-saved-blocks">', `<\/script> <script>
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

        // ?saved-ok=1 → opt-in for the personal channel (writes flag,
        // strips param). ?private-ok=1 → opt-in for the here-strip.
        try {
          var qsP = new URLSearchParams(location.search);
          var dirty = false;
          if (qsP.get('saved-ok') === '1') {
            localStorage.setItem('sparrow:tv-saved-ok', '1');
            qsP.delete('saved-ok');
            dirty = true;
          }
          if (qsP.get('private-ok') === '1') {
            localStorage.setItem('sparrow:tv-private-ok', '1');
            qsP.delete('private-ok');
            dirty = true;
          }
          if (dirty) {
            var nu = location.pathname +
              (qsP.toString() ? '?' + qsP.toString() : '') +
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

        // ─── Block lookup ───────────────────────────────────────────
        var blocksLookup = {};
        try {
          var raw = doc.getElementById('sptv-saved-blocks');
          if (raw && raw.textContent) blocksLookup = JSON.parse(raw.textContent) || {};
        } catch (_) { /* empty */ }

        // ─── Local helpers ──────────────────────────────────────────
        var DEFAULT_RELAYS = [
          'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'
        ];
        var FRESH_MS = 90_000;
        var DWELL_MS = 12_000;

        function readSaved() {
          try {
            var raw = JSON.parse(localStorage.getItem('sparrow:saved') || '[]');
            if (!Array.isArray(raw)) return [];
            return raw.filter(function (id) { return typeof id === 'string'; });
          } catch (_) { return []; }
        }
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
        function esc(s) {
          return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
          });
        }

        // ─── Privacy gate / empty / personal-stage routing ───────────
        var gateEl  = doc.querySelector('[data-sptv-gate]');
        var emptyEl = doc.querySelector('[data-sptv-empty]');
        var stage   = doc.querySelector('[data-sptv-stage]');
        var savedStrip = doc.querySelector('[data-sptv-saved-strip]');
        var savedCount = doc.querySelector('[data-sptv-saved-count]');
        var savedDots  = doc.querySelectorAll('[data-sptv-saved-dots] [data-channel]');
        var mainEl     = doc.querySelector('.sptv');
        var progress   = doc.querySelector('[data-sptv-progress]');

        function hideAll() {
          if (gateEl)  gateEl.hidden = true;
          if (emptyEl) emptyEl.hidden = true;
          if (stage)   stage.hidden = true;
          if (savedStrip) savedStrip.hidden = true;
        }
        function showGate() {
          hideAll();
          if (gateEl) gateEl.hidden = false;
        }
        function showEmpty() {
          hideAll();
          if (emptyEl) emptyEl.hidden = false;
          if (savedStrip) savedStrip.hidden = false;
        }
        function showStage() {
          hideAll();
          if (stage) stage.hidden = false;
          if (savedStrip) savedStrip.hidden = false;
        }

        // ─── Slide rotation (mirror tv.astro contract) ───────────────
        var idx = 0;
        var dwellStart = Date.now();

        function currentSlides() {
          if (!stage) return [];
          return Array.prototype.slice.call(stage.querySelectorAll('.sptv-slide'));
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
        });

        // ─── Personal slide builder ──────────────────────────────────
        function rebuildSlidesFromSaved() {
          if (!stage) return;
          var ids = readSaved();
          if (!ids.length) {
            paintSavedStrip(0, {});
            showEmpty();
            return;
          }
          // newest-first: sparrow:saved is appended in save order, so
          // reverse to put most-recent first; also dedupe defensively.
          var seen = Object.create(null);
          var ordered = [];
          for (var i = ids.length - 1; i >= 0; i--) {
            var id = ids[i];
            if (seen[id]) continue;
            seen[id] = true;
            ordered.push(id);
          }
          var picks = [];
          var distribution = {}; // channel code -> count (full list, including unknown)
          for (var p = 0; p < ordered.length; p++) {
            var blk = blocksLookup[ordered[p]];
            if (blk) {
              picks.push(blk);
              distribution[blk.channel] = (distribution[blk.channel] || 0) + 1;
            }
            if (picks.length >= 18) break;
          }

          paintSavedStrip(ordered.length, distribution);

          if (!picks.length) {
            // Saved IDs all fall outside the 60-block window — show
            // empty rather than the broadcast fallback so the user knows
            // their list is "old" rather than ambient.
            showEmpty();
            return;
          }

          stage.setAttribute('data-sptv-stage-mode', 'saved');
          stage.innerHTML = '';
          for (var n = 0; n < picks.length; n++) {
            var b = picks[n];
            var li = doc.createElement('li');
            li.className = 'sptv-slide' + (n === 0 ? ' is-active' : '');
            li.setAttribute('data-slide-idx', String(n));
            li.setAttribute('data-channel', b.channel);
            li.setAttribute('data-block-id', b.id);
            li.style.setProperty('--ch', 'var(--ch-' + String(b.channel).toLowerCase() + ')');
            li.setAttribute('aria-hidden', n === 0 ? 'false' : 'true');

            var inner = doc.createElement('div');
            inner.className = 'sptv-slide__inner';

            var chip = doc.createElement('div');
            chip.className = 'sptv-slide__chip';
            chip.innerHTML =
              '<span class="sptv-slide__chip-dot" aria-hidden="true"></span>' +
              ' CH · ' + esc(b.channel) + ' · ' + esc(String(b.channelName).toUpperCase());
            inner.appendChild(chip);

            var youChip = doc.createElement('div');
            youChip.className = 'sptv-slide__friend sptv-slide__friend--you';
            youChip.innerHTML =
              '<span class="sptv-slide__friend-avatar sptv-slide__friend-avatar--you" aria-hidden="true">★</span>' +
              '<span class="sptv-slide__friend-label">saved by you</span>';
            inner.appendChild(youChip);

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
            stage.appendChild(li);
          }
          idx = 0;
          showStage();
          paintActive();
        }

        // ─── Saved strip — count + per-channel dot fills ────────────
        function paintSavedStrip(total, distribution) {
          if (!savedStrip) return;
          if (savedCount) {
            savedCount.textContent = total
              ? String(total) + ' saved'
              : 'none yet';
          }
          // The dots are pre-rendered (one per channel); we just
          // toggle a "has" class + the fill width.
          var max = 0;
          Object.keys(distribution).forEach(function (k) {
            if (distribution[k] > max) max = distribution[k];
          });
          if (savedDots && savedDots.length) {
            savedDots.forEach(function (li) {
              var code = li.getAttribute('data-channel');
              var n = distribution[code] || 0;
              li.setAttribute('data-count', String(n));
              if (n > 0) li.classList.add('has-saved');
              else li.classList.remove('has-saved');
              var fill = li.querySelector('.sptv-saved-strip__dot-fill');
              if (fill && max > 0) {
                fill.style.height = ((n / max) * 100).toFixed(0) + '%';
              } else if (fill) {
                fill.style.height = '0%';
              }
            });
          }
        }

        // ─── Here-now strip ─────────────────────────────────────────
        var hereSockets = [];
        var lastSeen = Object.create(null);
        var bootTime = Math.floor(Date.now() / 1000);
        var hereEl = doc.querySelector('[data-sptv-here]');
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
        function startPresenceWatch() {
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) return;
          var friends = readFriends();
          if (!friends.length) return;
          var authors = friends.map(function (f) { return f.pubkey; });
          var subId = 'sptv-sv-here-' + Math.random().toString(36).slice(2, 10);
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

        // ─── Boot ────────────────────────────────────────────────────
        function boot() {
          var ok = false;
          try { ok = localStorage.getItem('sparrow:tv-saved-ok') === '1'; } catch (_) {}
          if (!ok) {
            // Don't even compute the list — privacy-default-blocked.
            showGate();
            return;
          }
          rebuildSlidesFromSaved();
          paintHere();
          startPresenceWatch();
        }
        boot();

        // React to local edits (saved list / opt-in / friends).
        window.addEventListener('storage', function (e) {
          if (!e.key) return;
          if (e.key === 'sparrow:tv-saved-ok') {
            boot();   // gate state may have changed — re-route
            return;
          }
          if (e.key === 'sparrow:saved') {
            // Only re-build if the gate is open.
            try {
              if (localStorage.getItem('sparrow:tv-saved-ok') === '1') rebuildSlidesFromSaved();
            } catch (_) {}
            return;
          }
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
    <\/script> </body> </html>`], ['<html lang="en" data-theme="blue-hour"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sparrow TV · Saved · PointCast</title><meta name="description" content="Your personal reading list, on a wall. Privacy-default-hidden — opt-in only."><link rel="canonical" href="https://pointcast.xyz/sparrow/tv/saved"><link rel="alternate" href="/sparrow/tv" title="Sparrow TV (broadcast)"><link rel="alternate" href="/sparrow/tv/friends" title="Sparrow TV (federation)"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700&family=Departure+Mono&display=swap" rel="stylesheet">', `</head> <body class="sptv-body" data-surface="desktop" data-tv-mode="saved"> <main class="sptv sptv--saved" data-channel-active="" aria-label="Sparrow TV · Saved"> <header class="sptv-head"> <span class="sptv-glyph" aria-hidden="true">✦</span> <span class="sptv-name">Sparrow</span> <span class="sptv-sub">tv · your list</span> <span class="sptv-clock" data-sptv-clock>—:—</span> </header> <div class="sptv-progress" aria-hidden="true"> <div class="sptv-progress__bar" data-sptv-progress></div> </div>  <section class="sptv-empty sptv-empty--gate" data-sptv-gate aria-label="Personal-channel privacy gate"> <p class="sptv-empty__kicker">CH · YOUR LIST · PRIVATE BY DEFAULT</p> <h2 class="sptv-empty__title">∅ This screen is private.</h2> <p class="sptv-empty__dek">
Your reading list is local-only and stays that way unless you opt in here. A kitchen TV
          shouldn't paint a stranger's list onto the wall just because they happened to be the
          last user signed in.
</p> <p class="sptv-empty__hint">
To show your list, set <code>sparrow:tv-saved-ok</code> to <code>1</code> in localStorage,
          or open this URL with <code>?saved-ok=1</code> (writes the flag and strips it).
          Switch back: open <a href="/sparrow/tv">all channels</a> or
<a href="/sparrow/tv/friends">federation</a>.
</p> </section>  <section class="sptv-empty sptv-empty--saved-zero" data-sptv-empty hidden aria-label="Reading list is empty"> <p class="sptv-empty__kicker">CH · YOUR LIST</p> <h2 class="sptv-empty__title">∅ Nothing saved yet.</h2> <p class="sptv-empty__dek">
Open a block at <a href="/sparrow">/sparrow</a> and press <kbd>S</kbd> to save it. Saved
          blocks rotate here in newest-first order.
</p> <p class="sptv-empty__hint">
You can also browse <a href="/sparrow/tv/friends">federation</a> or
<a href="/sparrow/tv">all channels</a> while you build a list.
</p> </section>  <ol class="sptv-stage" data-sptv-stage data-sptv-stage-mode="server-fallback" hidden> `, ' </ol>  <aside class="sptv-saved-strip" data-sptv-saved-strip aria-label="reading list summary" hidden> <span class="sptv-saved-strip__label">✦ your list</span> <span class="sptv-saved-strip__count" data-sptv-saved-count>—</span> <ul class="sptv-saved-strip__dots" data-sptv-saved-dots> ', ' </ul> </aside>  <aside class="sptv-here" data-sptv-here aria-label="friends here now" hidden> <span class="sptv-here__label">✦ here now</span> <ul class="sptv-here__list" data-sptv-here-list></ul> </aside> <footer class="sptv-foot"> <span class="sptv-foot__brand">pointcast.xyz/sparrow/tv/saved</span> <span class="sptv-foot__sep">·</span> <span class="sptv-foot__hint">←/→ to step · open <a href="/sparrow/tv/friends">federation</a> · <a href="/sparrow/tv">all channels</a></span> </footer> </main>  <script type="application/json" id="sptv-saved-blocks">', `<\/script> <script>
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

        // ?saved-ok=1 → opt-in for the personal channel (writes flag,
        // strips param). ?private-ok=1 → opt-in for the here-strip.
        try {
          var qsP = new URLSearchParams(location.search);
          var dirty = false;
          if (qsP.get('saved-ok') === '1') {
            localStorage.setItem('sparrow:tv-saved-ok', '1');
            qsP.delete('saved-ok');
            dirty = true;
          }
          if (qsP.get('private-ok') === '1') {
            localStorage.setItem('sparrow:tv-private-ok', '1');
            qsP.delete('private-ok');
            dirty = true;
          }
          if (dirty) {
            var nu = location.pathname +
              (qsP.toString() ? '?' + qsP.toString() : '') +
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

        // ─── Block lookup ───────────────────────────────────────────
        var blocksLookup = {};
        try {
          var raw = doc.getElementById('sptv-saved-blocks');
          if (raw && raw.textContent) blocksLookup = JSON.parse(raw.textContent) || {};
        } catch (_) { /* empty */ }

        // ─── Local helpers ──────────────────────────────────────────
        var DEFAULT_RELAYS = [
          'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'
        ];
        var FRESH_MS = 90_000;
        var DWELL_MS = 12_000;

        function readSaved() {
          try {
            var raw = JSON.parse(localStorage.getItem('sparrow:saved') || '[]');
            if (!Array.isArray(raw)) return [];
            return raw.filter(function (id) { return typeof id === 'string'; });
          } catch (_) { return []; }
        }
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
        function esc(s) {
          return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
          });
        }

        // ─── Privacy gate / empty / personal-stage routing ───────────
        var gateEl  = doc.querySelector('[data-sptv-gate]');
        var emptyEl = doc.querySelector('[data-sptv-empty]');
        var stage   = doc.querySelector('[data-sptv-stage]');
        var savedStrip = doc.querySelector('[data-sptv-saved-strip]');
        var savedCount = doc.querySelector('[data-sptv-saved-count]');
        var savedDots  = doc.querySelectorAll('[data-sptv-saved-dots] [data-channel]');
        var mainEl     = doc.querySelector('.sptv');
        var progress   = doc.querySelector('[data-sptv-progress]');

        function hideAll() {
          if (gateEl)  gateEl.hidden = true;
          if (emptyEl) emptyEl.hidden = true;
          if (stage)   stage.hidden = true;
          if (savedStrip) savedStrip.hidden = true;
        }
        function showGate() {
          hideAll();
          if (gateEl) gateEl.hidden = false;
        }
        function showEmpty() {
          hideAll();
          if (emptyEl) emptyEl.hidden = false;
          if (savedStrip) savedStrip.hidden = false;
        }
        function showStage() {
          hideAll();
          if (stage) stage.hidden = false;
          if (savedStrip) savedStrip.hidden = false;
        }

        // ─── Slide rotation (mirror tv.astro contract) ───────────────
        var idx = 0;
        var dwellStart = Date.now();

        function currentSlides() {
          if (!stage) return [];
          return Array.prototype.slice.call(stage.querySelectorAll('.sptv-slide'));
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
        });

        // ─── Personal slide builder ──────────────────────────────────
        function rebuildSlidesFromSaved() {
          if (!stage) return;
          var ids = readSaved();
          if (!ids.length) {
            paintSavedStrip(0, {});
            showEmpty();
            return;
          }
          // newest-first: sparrow:saved is appended in save order, so
          // reverse to put most-recent first; also dedupe defensively.
          var seen = Object.create(null);
          var ordered = [];
          for (var i = ids.length - 1; i >= 0; i--) {
            var id = ids[i];
            if (seen[id]) continue;
            seen[id] = true;
            ordered.push(id);
          }
          var picks = [];
          var distribution = {}; // channel code -> count (full list, including unknown)
          for (var p = 0; p < ordered.length; p++) {
            var blk = blocksLookup[ordered[p]];
            if (blk) {
              picks.push(blk);
              distribution[blk.channel] = (distribution[blk.channel] || 0) + 1;
            }
            if (picks.length >= 18) break;
          }

          paintSavedStrip(ordered.length, distribution);

          if (!picks.length) {
            // Saved IDs all fall outside the 60-block window — show
            // empty rather than the broadcast fallback so the user knows
            // their list is "old" rather than ambient.
            showEmpty();
            return;
          }

          stage.setAttribute('data-sptv-stage-mode', 'saved');
          stage.innerHTML = '';
          for (var n = 0; n < picks.length; n++) {
            var b = picks[n];
            var li = doc.createElement('li');
            li.className = 'sptv-slide' + (n === 0 ? ' is-active' : '');
            li.setAttribute('data-slide-idx', String(n));
            li.setAttribute('data-channel', b.channel);
            li.setAttribute('data-block-id', b.id);
            li.style.setProperty('--ch', 'var(--ch-' + String(b.channel).toLowerCase() + ')');
            li.setAttribute('aria-hidden', n === 0 ? 'false' : 'true');

            var inner = doc.createElement('div');
            inner.className = 'sptv-slide__inner';

            var chip = doc.createElement('div');
            chip.className = 'sptv-slide__chip';
            chip.innerHTML =
              '<span class="sptv-slide__chip-dot" aria-hidden="true"></span>' +
              ' CH · ' + esc(b.channel) + ' · ' + esc(String(b.channelName).toUpperCase());
            inner.appendChild(chip);

            var youChip = doc.createElement('div');
            youChip.className = 'sptv-slide__friend sptv-slide__friend--you';
            youChip.innerHTML =
              '<span class="sptv-slide__friend-avatar sptv-slide__friend-avatar--you" aria-hidden="true">★</span>' +
              '<span class="sptv-slide__friend-label">saved by you</span>';
            inner.appendChild(youChip);

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
            stage.appendChild(li);
          }
          idx = 0;
          showStage();
          paintActive();
        }

        // ─── Saved strip — count + per-channel dot fills ────────────
        function paintSavedStrip(total, distribution) {
          if (!savedStrip) return;
          if (savedCount) {
            savedCount.textContent = total
              ? String(total) + ' saved'
              : 'none yet';
          }
          // The dots are pre-rendered (one per channel); we just
          // toggle a "has" class + the fill width.
          var max = 0;
          Object.keys(distribution).forEach(function (k) {
            if (distribution[k] > max) max = distribution[k];
          });
          if (savedDots && savedDots.length) {
            savedDots.forEach(function (li) {
              var code = li.getAttribute('data-channel');
              var n = distribution[code] || 0;
              li.setAttribute('data-count', String(n));
              if (n > 0) li.classList.add('has-saved');
              else li.classList.remove('has-saved');
              var fill = li.querySelector('.sptv-saved-strip__dot-fill');
              if (fill && max > 0) {
                fill.style.height = ((n / max) * 100).toFixed(0) + '%';
              } else if (fill) {
                fill.style.height = '0%';
              }
            });
          }
        }

        // ─── Here-now strip ─────────────────────────────────────────
        var hereSockets = [];
        var lastSeen = Object.create(null);
        var bootTime = Math.floor(Date.now() / 1000);
        var hereEl = doc.querySelector('[data-sptv-here]');
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
        function startPresenceWatch() {
          var allow = false;
          try { allow = localStorage.getItem('sparrow:tv-private-ok') === '1'; } catch (_) {}
          if (!allow) return;
          var friends = readFriends();
          if (!friends.length) return;
          var authors = friends.map(function (f) { return f.pubkey; });
          var subId = 'sptv-sv-here-' + Math.random().toString(36).slice(2, 10);
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

        // ─── Boot ────────────────────────────────────────────────────
        function boot() {
          var ok = false;
          try { ok = localStorage.getItem('sparrow:tv-saved-ok') === '1'; } catch (_) {}
          if (!ok) {
            // Don't even compute the list — privacy-default-blocked.
            showGate();
            return;
          }
          rebuildSlidesFromSaved();
          paintHere();
          startPresenceWatch();
        }
        boot();

        // React to local edits (saved list / opt-in / friends).
        window.addEventListener('storage', function (e) {
          if (!e.key) return;
          if (e.key === 'sparrow:tv-saved-ok') {
            boot();   // gate state may have changed — re-route
            return;
          }
          if (e.key === 'sparrow:saved') {
            // Only re-build if the gate is open.
            try {
              if (localStorage.getItem('sparrow:tv-saved-ok') === '1') rebuildSlidesFromSaved();
            } catch (_) {}
            return;
          }
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
    <\/script> </body> </html>`])), renderHead(), fallbackSlides.map((s, i) => renderTemplate`<li${addAttribute(`sptv-slide${i === 0 ? " is-active" : ""}`, "class")}${addAttribute(i, "data-slide-idx")}${addAttribute(s.channel, "data-channel")}${addAttribute(s.id, "data-block-id")}${addAttribute(`--ch: var(--ch-${s.channel.toLowerCase()});`, "style")}${addAttribute(i !== 0 ? "true" : "false", "aria-hidden")}> <div class="sptv-slide__inner"> <div class="sptv-slide__chip"> <span class="sptv-slide__chip-dot" aria-hidden="true"></span>
CH · ${s.channel} · ${s.channelName.toUpperCase()} </div> <div class="sptv-slide__friend" data-sptv-friend hidden aria-hidden="true"></div> <div class="sptv-slide__meta"> <span>№ ${s.id}</span> <span>·</span> <span>${s.type}</span> <span>·</span> <time${addAttribute(s.timestamp, "datetime")}>${fmtDate(s.timestamp)}</time> ${s.mood && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <span>·</span> <span class="sptv-slide__mood">mood ${s.mood}</span> ` })}`} </div> <h2 class="sptv-slide__title">${s.title}</h2> ${s.dek && renderTemplate`<p class="sptv-slide__dek">${s.dek}</p>`} </div> </li>`), channels.map((c) => renderTemplate`<li class="sptv-saved-strip__dot"${addAttribute(c.code, "data-channel")}${addAttribute(c.name, "title")}> <span class="sptv-saved-strip__dot-fill"${addAttribute(`--ch: var(--ch-${c.code.toLowerCase()});`, "style")}></span> <span class="sptv-saved-strip__dot-label">${c.code}</span> </li>`), unescapeHTML(JSON.stringify(blocksLookup)));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/tv/saved.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/tv/saved.astro";
const $$url = "/sparrow/tv/saved";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
      __proto__: null,
      default: $$Saved,
      file: $$file,
      url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
