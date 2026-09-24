// @ts-nocheck
import { MOOD_SOUNDTRACKS as PC_SOUNDTRACKS } from '../../lib/moods-soundtracks';
import { MOOD_SPELLS as PC_MOOD_SPELLS } from '../../data/mood-spells';
import { DOCK_KIT as PC_DOCK_KIT } from '../../data/dock-kit';
import { FEDERATION_PEERS } from '../../data/federation-peers';
import { NOW_PLAYING } from '../../data/now-playing';
import { SHORTWAVE } from '../../lib/shortwave';

const PC_FED_PEERS_COUNT = FEDERATION_PEERS.length;

export function mountFooterBar(root, scope) {
    const {
      on, setTimeout, clearTimeout, setInterval, clearInterval,
      requestAnimationFrame, cancelAnimationFrame,
    } = scope;
    var PC_NOW_PLAYING = NOW_PLAYING;
    'use strict';

    var $bar       = root;
    var $you       = root.querySelector('[data-pc-ref="fb-you"]');
    var $menuBtn   = root.querySelector('[data-pc-ref="fb-menu-btn"]');
    var $menu      = root.querySelector('[data-pc-ref="fb-menu"]');
    var $panel     = root.querySelector('[data-pc-ref="fb-menu-panel"]');
    var $scrim     = root.querySelector('[data-pc-ref="fb-menu-scrim"]');
    var $close     = root.querySelector('[data-pc-ref="fb-menu-close"]');
    var $omni      = root.querySelector('[data-pc-ref="fb-omni"]');
    var $omniForm  = root.querySelector('[data-pc-ref="fb-omni-form"]');
    var $omniMode  = root.querySelector('[data-pc-ref="fb-omni-mode"]');
    var $moodLabel = root.querySelector('[data-pc-ref="fb-mood-label"]');
    var $youLabel  = root.querySelector('[data-pc-ref="fb-you-label"]');
    var $noun      = root.querySelector('[data-pc-ref="fb-noun"]');
    var $menuNoun  = root.querySelector('[data-pc-ref="fb-menu-noun"]');
    var $menuName  = root.querySelector('[data-pc-ref="fb-menu-name"]');
    var $menuWallet = root.querySelector('[data-pc-ref="fb-menu-wallet-status"]');
    var $walletBtn = root.querySelector('[data-pc-ref="fb-btn-wallet"]');
    var $moodSelect = root.querySelector('[data-pc-ref="fb-mood-select"]');
    var $soundBtn  = root.querySelector('[data-pc-ref="fb-btn-soundtrack"]');
    var $soundLabel = root.querySelector('[data-pc-ref="fb-soundtrack-label"]');
    var $soundtrack = root.querySelector('[data-pc-ref="fb-soundtrack"]');
    var $liveHere  = root.querySelector('[data-pc-ref="fb-live-here"]');

    if (!$bar || !$menu) return;

    try {
      var st = PC_SOUNDTRACKS || {};
      Object.keys(st).forEach(function (k) {
        if (Array.from($moodSelect.options).some(function (option) { return option.value === k; })) return;
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = (st[k].label || k).toLowerCase();
        $moodSelect.appendChild(opt);
      });
    } catch (e) {}

    var openPopover = null;
    var lastFocused = null;

    function getTrayEl(id) { return root.querySelector('[data-pc-ref="fb-tray-' + id + '"]'); }
    function getStampEl(id) { return root.querySelector('[data-pc-ref="fb-stamp-' + id + '"]'); }

    function closeAll() {
      if ($menu.getAttribute('data-open') === 'true') {
        $menu.setAttribute('data-open', 'false');
        setTimeout(function () { $menu.hidden = true; }, 220);
        $menuBtn.setAttribute('aria-expanded', 'false');
        $you.setAttribute('aria-expanded', 'false');
      }
      root.querySelectorAll('.fb__tray').forEach(function (tr) {
        if (tr.getAttribute('data-open') === 'true') {
          tr.setAttribute('data-open', 'false');
          setTimeout(function () { tr.hidden = true; }, 200);
          var stampId = String(tr.getAttribute('data-pc-ref') || '').replace('fb-tray-', '');
          var st = getStampEl(stampId);
          if (st) st.setAttribute('aria-expanded', 'false');
        }
      });
      openPopover = null;
      document.removeEventListener('keydown', onEsc);
      document.documentElement.classList.remove('pc-dock-open');
      window.dispatchEvent(new CustomEvent('pc:dock-visibility', { detail: { open: false } }));
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (e) {}
      }
    }

    function onEsc(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeAll(); }
    }

    function openMenu() {
      closeAll();
      lastFocused = document.activeElement;
      $menu.hidden = false;
      void $menu.offsetWidth;
      $menu.setAttribute('data-open', 'true');
      $menuBtn.setAttribute('aria-expanded', 'true');
      $you.setAttribute('aria-expanded', 'true');
      setTimeout(function () { try { $panel.focus(); } catch (e) {} }, 10);
      openPopover = 'menu';
      on(document, 'keydown', onEsc);
      document.documentElement.classList.add('pc-dock-open');
      window.dispatchEvent(new CustomEvent('pc:dock-visibility', { detail: { open: true } }));
    }

    function openTray(id, quiet) {
      var tray = getTrayEl(id);
      var stamp = getStampEl(id);
      if (!tray) return;
      var anchor = stamp || $menuBtn;
      closeAll();
      lastFocused = document.activeElement;
      tray.hidden = false;
      void tray.offsetWidth;
      tray.setAttribute('data-open', 'true');
      if (stamp) stamp.setAttribute('aria-expanded', 'true');
      try {
        var rect = anchor.getBoundingClientRect();
        var trayWidth = tray.getBoundingClientRect().width || 320;
        var winWidth = window.innerWidth;
        var center = rect.left + rect.width / 2;
        var leftPx = Math.max(8, Math.min(center - trayWidth / 2, winWidth - trayWidth - 8));
        tray.style.left = leftPx + 'px';
        tray.style.right = 'auto';
        var arrow = tray.querySelector('.fb__tray-arrow');
        if (arrow) arrow.style.left = (center - leftPx) + 'px';
      } catch (e) {}
      if (!quiet) setTimeout(function () {
        var focusable = tray.querySelector('input, textarea, button, select, a[href]');
        if (focusable) try { focusable.focus(); } catch (e) {}
      }, 30);
      openPopover = 'tray:' + id;
      on(document, 'keydown', onEsc);
      document.documentElement.classList.add('pc-dock-open');
      window.dispatchEvent(new CustomEvent('pc:dock-visibility', { detail: { open: true, tray: id } }));
      // Per-tray on-open hooks (defined later in the IIFE; hoisted because
      // they're function declarations).
      try {
        if (id === 'ask') {
          renderEchoes();
          reconcileEchoes();
        } else if (id === 'agent') {
          refreshAgentActivity();
        } else if (id === 'passport') {
          renderPassport();
        } else if (id === 'seismo') {
          seismoOpen();
        } else if (id === 'my-ai') {
          renderAiHere();
        } else if (id === 'attendance') {
          renderAttendance();
        }
      } catch (e) {}
    }

    root.querySelectorAll('.fb__stamp').forEach(function (st) {
      on(st, 'click', function () {
        var id = st.getAttribute('data-stamp-id');
        if (openPopover === 'tray:' + id) closeAll();
        else openTray(id);
      });
    });
    root.querySelectorAll('.fb-binder__open').forEach(function (bc) {
      on(bc, 'click', function () {
        var id = bc.getAttribute('data-tray');
        closeAll();
        setTimeout(function () { openTray(id); }, 240);
      });
    });
    root.querySelectorAll('.fb__tray-close').forEach(function (btn) {
      on(btn, 'click', closeAll);
    });

    on(document, 'mousedown', function (e) {
      if (!openPopover) return;
      var t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest('.fb__tray') || t.closest('.fb__menu-panel') ||
          t.closest('.fb__stamp') || t.closest('.fb-binder__open') ||
          t.closest('[data-pc-ref="fb-menu-btn"]') || t.closest('[data-pc-ref="fb-you"]')) return;
      closeAll();
    });

    on($menuBtn, 'click', function () {
      if (openPopover === 'menu') closeAll();
      else openMenu();
    });
    // YOU chip → the Account view (profile, access, mood). ≡ stays the launcher.
    on($you, 'click', function () {
      if (openPopover === 'menu') { closeAll(); return; }
      openMenu();
      window.dispatchEvent(new CustomEvent('pc:dock-show', { detail: { view: 'account' } }));
    });
    on($close, 'click', closeAll);
    on($scrim, 'click', closeAll);

    var inviteMike = root.querySelector('[data-ai-invite]');
    if (inviteMike) on(inviteMike, 'click', function () {
      var path = /^\/(?:me|profile|auth|api|signin|login|callback)(?:\/|$)/i.test(location.pathname) ? '/' : location.pathname;
      var roomLink = location.origin + path;
      openTray('ask');
      var body = root.querySelector('[data-pc-ref="fb-ask-body"]');
      var to = root.querySelector('[data-pc-ref="fb-ask-to"]');
      if (to) to.value = 'mh';
      if (body) { body.value = 'Mike, would you join me on this PointCast page? ' + roomLink + '\nWe can talk using the page’s shared SAY chat. My private AI conversation is not included in this invitation.'; body.dispatchEvent(new Event('input', { bubbles: true })); }
      var form = root.querySelector('[data-pc-ref="fb-ask-form"]');
      if (form) form.removeAttribute('data-expand');
    });

    var KIT = PC_DOCK_KIT || [];

    on(document, 'keydown', function (e) {
      var meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        $omni.focus();
        $omni.select();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        var numbered = KIT.find(function (item) { return Number(item.number) === Number(e.key); });
        if (numbered) {
          e.preventDefault();
          openTray(numbered.id);
        }
      }
    });

    function inferOmniMode(value) {
      var v = String(value || '').trim();
      if (!v) return roomOn ? 'SAY' : 'GO';
      if (/^\/ai(?:\s|$)/i.test(v)) return 'AI';
      if (v.charAt(0) === '!') return 'AIR';
      if (v.charAt(0) === '+') return 'CAST';
      if (v.charAt(0) === '>') return 'OP';
      if (v.charAt(0) === '?') return 'ASK';
      if (v.charAt(0) === '@') return 'AGT';
      if (v.charAt(0) === '/' || /^https?:\/\//.test(v)) return 'GO';
      // Shortwave: a sentence is something said, even with the room off.
      if (roomOn || /\s/.test(v) || /[📍♫]/u.test(v)) return 'SAY';
      return 'GO';
    }

    function applyOmniMode() {
      if (!$omniMode) return;
      var mode = inferOmniMode($omni.value);
      $omniMode.textContent = mode;
      $omniMode.setAttribute('data-mode', mode.toLowerCase());
      try { syncAirStrip(mode); } catch (e) {}
    }

    // ─── AIR — Shortwave from the bar (2026-09-17) ───────────────────
    // `!words` casts on the Tezos broadcast tower through the visitor's
    // own wallet. No server, no delete. The strip above the omnibox
    // shows the count and two chips: 📍 here (approximate location) and
    // ♫ playing (a Spotify link). /shortwave renders both.
    var $air        = root.querySelector('[data-pc-ref="fb-air"]');
    var $airCount   = root.querySelector('[data-pc-ref="fb-air-count"]');
    var $airHere    = root.querySelector('[data-pc-ref="fb-air-here"]');
    var $airPlaying = root.querySelector('[data-pc-ref="fb-air-playing"]');
    var $airSend    = root.querySelector('[data-pc-ref="fb-air-send"]');
    var airBusy = false;
    var AIR_MAX = (SHORTWAVE && SHORTWAVE.maxChars) || 280;
    function airText() { return String($omni.value || '').replace(/^!\s*/, '').trim(); }
    function airLen(t) { return Array.from(t).length; }
    function syncAirStrip(mode) {
      if (!$air) return;
      var onAir = mode === 'AIR';
      $air.hidden = !onAir;
      if (!onAir) return;
      var n = airLen(airText());
      if ($airCount) { $airCount.textContent = n + '/' + AIR_MAX; $airCount.setAttribute('data-over', n > AIR_MAX ? 'true' : 'false'); }
      if ($airSend) $airSend.disabled = airBusy || n === 0 || n > AIR_MAX;
    }
    function airToast(msg, ms) {
      var prev = $omni.getAttribute('data-air-prev-placeholder') || $omni.placeholder;
      $omni.setAttribute('data-air-prev-placeholder', prev);
      $omni.placeholder = msg;
      clearTimeout($omni._airToast);
      $omni._airToast = setTimeout(function () { $omni.placeholder = prev; $omni.removeAttribute('data-air-prev-placeholder'); }, ms || 4000);
    }
    function airAppend(fragment) {
      var cur = String($omni.value || '');
      if (cur.indexOf(fragment) !== -1) return;
      var bare = cur.replace(/\s+$/, '');
      $omni.value = bare + (bare && bare !== '!' ? ' ' : '') + fragment + ' ';
      $omni.focus();
      applyOmniMode();
    }
    function airHere(ev) {
      var $btn = (ev && ev.currentTarget) || $airHere;
      var label = $btn.textContent;
      if (!navigator.geolocation) { airToast('no location on this device'); return; }
      $btn.disabled = true; $btn.textContent = '…';
      navigator.geolocation.getCurrentPosition(function (pos) {
        // Two decimals ≈ 1 km. Enough for "near El Segundo", not a doorstep.
        var lat = pos.coords.latitude.toFixed(2), lon = pos.coords.longitude.toFixed(2);
        airAppend('📍 ' + lat + ',' + lon);
        $btn.disabled = false; $btn.textContent = label;
      }, function () {
        airToast('location was declined — nothing added');
        $btn.disabled = false; $btn.textContent = label;
      }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
    }
    function airPlaying() {
      var done = function (url, note) { if (url) airAppend('♫ ' + url); if (note) airToast(note, 6000); };
      var fromClipboard = function (t) { var m = String(t || '').match(/https?:\/\/open\.spotify\.com\/[^\s]+/); return m ? m[0].replace(/[?&]si=[^&]*/, '') : ''; };
      var house = (PC_NOW_PLAYING && PC_NOW_PLAYING.url) || '';
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(function (t) {
            var u = fromClipboard(t);
            if (u) done(u); else done(house, 'no Spotify link on the clipboard — using the house track. Share → Copy link in Spotify, then tap ♫ again.');
          }, function () { done(house, 'clipboard not allowed — using the house track. Paste a Spotify share link to broadcast yours.'); });
          return;
        }
      } catch (e) {}
      done(house, 'paste a Spotify share link to broadcast yours');
    }
    function castOnAir(text) {
      if (airBusy) return;
      var n = airLen(text);
      if (!n) return;
      if (n > AIR_MAX) { airToast('too long — ' + n + '/' + AIR_MAX); return; }
      airBusy = true; syncAirStrip('AIR');
      airToast('opening your wallet…', 20000);
      var announce = function (phase, extra) {
        try { window.dispatchEvent(new CustomEvent('pc:shortwave:cast', { detail: Object.assign({ phase: phase, body: text }, extra || {}) })); } catch (e) {}
      };
      import('../../lib/tezos').then(function (tz) {
        return tz.connectKukai().then(function (addr) {
          airToast('approve the cast in your wallet…', 60000);
          return tz.tezosClient().then(function (tezos) { return tezos.wallet.at(SHORTWAVE.tower); }).then(function (c) {
            return c.methodsObject.default({ kind: 0, body: tz.utf8ToHex(text) }).send();
          }).then(function (op) {
            var hash = op.opHash;
            announce('pending', { author: addr, hash: hash });
            $omni.value = ''; applyOmniMode();
            airToast('on the air — waiting for a block (' + String(hash).slice(0, 8) + '…)', 90000);
            return op.confirmation(1).then(function () {
              announce('confirmed', { author: addr, hash: hash });
              airToast('confirmed. it is on the chain for good → /shortwave', 8000);
            });
          });
        });
      }).catch(function (e) {
        var m = String((e && e.message) || e || '');
        announce('failed', { error: m.slice(0, 140) });
        airToast(/abort|reject|cancel/i.test(m) ? 'cancelled in the wallet' : /balance/i.test(m) ? 'not enough tez for the network fee' : 'could not cast: ' + m.slice(0, 80), 8000);
      }).then(function () { airBusy = false; syncAirStrip(inferOmniMode($omni.value)); });
    }
    // ─── Shortwave v1 — the main bar is the composer (2026-09-18) ────
    // Whatever is said in the bar (SAY) shows on screen in the room and is
    // posted to /api/shortwave, no wallet needed. New posts from anywhere
    // in town echo into the room ticker via pc:shortwave:post. The Tezos
    // tower (`!words`) stays as the optional permanent layer.
    var $omniHere    = root.querySelector('[data-pc-ref="fb-omni-here"]');
    var $omniPlaying = root.querySelector('[data-pc-ref="fb-omni-playing"]');
    var $omniFeed    = root.querySelector('.fb__omni-chip--feed');
    if ($omniHere) on($omniHere, 'click', airHere);
    if ($omniPlaying) on($omniPlaying, 'click', airPlaying);
    var swSeen = {}, swPrimed = false;
    function swOwnIds() { try { return JSON.parse(sessionStorage.getItem('pc:shortwave:own') || '[]'); } catch (e) { return []; } }
    function swRememberOwn(id) { try { var a = swOwnIds(); a.push(id); sessionStorage.setItem('pc:shortwave:own', JSON.stringify(a.slice(-30))); } catch (e) {} }
    function swWho() {
      try { var a = localStorage.getItem('pc:wallet-active'); if (a) return a.slice(0, 6) + '…' + a.slice(-4); } catch (e) {}
      var label = $youLabel ? String($youLabel.textContent || '').trim() : '';
      return label || 'visitor';
    }
    function swNoun() { var m = $noun && String($noun.getAttribute('src') || '').match(/(\d+)\.svg/); return m ? Math.min(1199, parseInt(m[1], 10) || 0) : 0; }
    function swSid() { try { return String(localStorage.getItem('pc:room:sid') || '').slice(0, 96); } catch (e) { return ''; } }
    function swFlashFeed() { if (!$omniFeed) return; $omniFeed.setAttribute('data-fresh', 'true'); setTimeout(function () { $omniFeed.removeAttribute('data-fresh'); }, 8000); }
    // Real time: the API announces every saved post on the sitewide burst bus.
    // cursor-room re-emits each burst as pc:burst:seen; Shortwave ones become
    // pc:shortwave:post for the room ticker, the homepage panel and /shortwave.
    on(window, 'pc:burst:seen', function (e) {
      var b = e && e.detail; var m = b && b.meta;
      if (!b || b.kind !== 'cast' || !m || !m.shortwave || !m.id || swSeen[m.id]) return;
      swSeen[m.id] = 1;
      var own = (m.clientId && m.clientId === swSid()) || swOwnIds().indexOf(m.id) !== -1;
      if (own) return;
      var post = { id: String(m.id), at: String(m.postedAt || new Date(b.at || Date.now()).toISOString()), who: String((b.by && b.by.handle) || 'visitor'), noun: Number(b.by && b.by.noun) || 0, text: String(m.t1 || '') + String(m.t2 || ''), via: String(m.via || 'bar'), handle: typeof m.handle === 'string' && /^[a-z0-9-]{3,24}$/.test(m.handle) ? m.handle : undefined, live: true };
      window.dispatchEvent(new CustomEvent('pc:shortwave:post', { detail: { post: post, own: false, live: true } }));
      swFlashFeed();
    });
    function postShortwave(text, via) {
      var body = Array.from(String(text || '')).slice(0, AIR_MAX).join('');
      if (!body.trim()) return;
      fetch('/api/shortwave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: body, who: swWho(), noun: swNoun(), via: via === 'page' ? 'page' : 'bar', clientId: swSid() }) })
        .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.j && res.j.ok && res.j.post) {
            swSeen[res.j.post.id] = 1; swRememberOwn(res.j.post.id);
            window.dispatchEvent(new CustomEvent('pc:shortwave:post', { detail: { post: res.j.post, own: true } }));
            airToast(res.j.live ? 'said · live across town · on shortwave ◉' : 'said · on shortwave ◉', 3200); swFlashFeed();
          } else if (res.status === 429) { airToast('shown in the room · shortwave limit reached for this hour', 5000); }
        }).catch(function () { /* the room still heard it */ });
    }
    function swPoll(force) {
      if (force !== true && document.visibilityState !== 'visible') return;
      fetch('/api/shortwave?limit=8').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.posts) return;
        var own = swOwnIds(), fresh = [];
        j.posts.forEach(function (p) {
          if (!p || !p.id || swSeen[p.id]) return;
          swSeen[p.id] = 1;
          if (own.indexOf(p.id) !== -1) return;
          // First poll only surfaces the last two minutes; later polls surface anything new.
          if (swPrimed || (Date.now() - Date.parse(p.at)) < 120000) fresh.push(p);
        });
        swPrimed = true;
        fresh.reverse().forEach(function (p) { window.dispatchEvent(new CustomEvent('pc:shortwave:post', { detail: { post: p, own: false } })); });
        if (fresh.length) swFlashFeed();
      }).catch(function () {});
    }
    setTimeout(function () { swPoll(true); }, 2500);
    setInterval(swPoll, 60000);

    if ($airHere) on($airHere, 'click', airHere);
    if ($airPlaying) on($airPlaying, 'click', airPlaying);
    if ($airSend) on($airSend, 'click', function () { castOnAir(airText()); });

    on($omni, 'input', function () {
      applyOmniMode();
      try { syncBubbleFromInput(); } catch (e) {}
    });
    on($omni, 'focus', function () {
      applyOmniMode();
      try { syncBubbleFromInput(); } catch (e) {}
    });
    on($omni, 'blur', function () {
      // Hide if not in a sent-snapshot window. Empty input still clears.
      if (!bubbleState.persistUntil || Date.now() >= bubbleState.persistUntil) {
        if (!String($omni.value || '').trim()) hideBubble();
      }
    });

    // ─── Attendance — many people and agents in the same town ────────
    // The town socket (cursor-room) publishes `pc:presence` about once a
    // second: every session's Noun, kind, mood and page, plus waves and
    // vibes. The bar turns that into a crowd cluster, a tray of who is where,
    // wave toasts and floating reactions. People on your page come first.
    var $crowd      = root.querySelector('[data-pc-ref="fb-stamp-attendance"]');
    var $crowdFaces = root.querySelector('[data-pc-ref="fb-crowd-faces"]');
    var $crowdCount = root.querySelector('[data-pc-ref="fb-crowd-count"]');
    var $attSum     = root.querySelector('[data-pc-ref="fb-att-sum"]');
    var $attList    = root.querySelector('[data-pc-ref="fb-att-list"]');
    var $attYou     = root.querySelector('[data-pc-ref="fb-att-you"]');
    var $wave       = root.querySelector('[data-pc-ref="fb-wave"]');
    var $vibes      = root.querySelector('[data-pc-ref="fb-vibes"]');
    var att = { sessions: [], humans: 0, agents: 0, myNoun: -1, myPath: '/', said: {}, seen: {}, sig: '', faceSeen: {}, focus: -1, primed: false, waveFrom: -1 };

    function attSince(iso) { var m = Math.max(0, Math.floor((Date.now() - Date.parse(iso || '')) / 60000)); return !isFinite(m) || m < 1 ? 'just arrived' : m < 60 ? m + 'm here' : Math.floor(m / 60) + 'h here'; }
    function attPlace(path) { return !path || path === '/' ? 'the front door' : path; }
    function attName(s) { var k = att.said[s.nounId]; return k && k.who && k.who !== 'visitor' ? k.who : 'noun ' + s.nounId; }
    function attOthers() {
      var skippedSelf = false;
      return att.sessions.filter(function (s) {
        // The first session that matches this Noun on this page is you.
        if (!skippedSelf && s.nounId === att.myNoun && (s.currentPath || att.myPath) === att.myPath) { skippedSelf = true; return false; }
        return true;
      }).sort(function (a, b) {
        var ah = a.currentPath === att.myPath ? 0 : 1, bh = b.currentPath === att.myPath ? 0 : 1;
        return ah - bh || (a.kind === 'agent' ? 1 : 0) - (b.kind === 'agent' ? 1 : 0) || String(b.joinedAt).localeCompare(String(a.joinedAt));
      });
    }
    function attFace(s) {
      var f = document.createElement('span'); f.className = 'fb__crowd-face';
      f.setAttribute('data-noun', String(s.nounId)); f.setAttribute('data-kind', s.kind === 'agent' ? 'agent' : 'human');
      if (s.currentPath === att.myPath) f.setAttribute('data-here', 'true');
      var img = document.createElement('img'); img.src = 'https://noun.pics/' + s.nounId + '.svg'; img.alt = ''; img.width = 22; img.height = 22;
      f.appendChild(img); return f;
    }
    function renderCrowd() {
      if (!$crowd) return;
      var others = attOthers(), total = att.humans + att.agents, here = others.filter(function (s) { return s.currentPath === att.myPath; }).length;
      // Reconcile faces by Noun instead of rebuilding them: the chip keeps a
      // fixed width (CSS) and the same <img> nodes, so a join, a leave or a
      // tab reconnecting never nudges the bar. Someone who drops off lingers
      // for a few seconds, which also swallows socket blips.
      var now = Date.now(), shown = others.slice(0, 4), keep = {};
      shown.forEach(function (s) { keep[s.nounId] = 1; att.faceSeen[s.nounId] = now; });
      Array.prototype.slice.call($crowdFaces.children).forEach(function (f) {
        var n = Number(f.getAttribute('data-noun'));
        if (keep[n]) { f.removeAttribute('data-leaving'); return; }
        if (now - (att.faceSeen[n] || 0) < 6000 && $crowdFaces.childElementCount > shown.length) { f.setAttribute('data-leaving', 'true'); return; }
        f.remove();
      });
      shown.forEach(function (s, i) {
        var f = $crowdFaces.querySelector('.fb__crowd-face[data-noun="' + s.nounId + '"]');
        if (!f) f = attFace(s);
        else { f.setAttribute('data-kind', s.kind === 'agent' ? 'agent' : 'human'); if (s.currentPath === att.myPath) f.setAttribute('data-here', 'true'); else f.removeAttribute('data-here'); }
        if ($crowdFaces.children[i] !== f) $crowdFaces.insertBefore(f, $crowdFaces.children[i] || null);
      });
      while ($crowdFaces.childElementCount > 4) $crowdFaces.lastElementChild.remove();
      $crowdCount.textContent = total > 999 ? '1k+' : String(Math.max(1, total));
      $crowd.setAttribute('data-alone', others.length ? 'false' : 'true');
      $crowd.title = others.length ? (total + ' in town' + (att.agents ? ' · ' + att.agents + ' AI' : '') + (here ? ' · ' + here + ' on this page with you' : '') + ' — open attendance') : 'Just you in town right now';
      $crowd.setAttribute('aria-label', $crowd.title);
    }
    function attRow(s) {
      var row = document.createElement('div'); row.className = 'fb-att__row'; row.setAttribute('data-noun', String(s.nounId));
      if (s.nounId === att.focus) row.setAttribute('data-focus', 'true');
      var img = document.createElement('img'); img.src = 'https://noun.pics/' + s.nounId + '.svg'; img.alt = ''; img.width = 34; img.height = 34;
      var main = document.createElement('div');
      var name = document.createElement('p'); name.className = 'fb-att__name'; var nm = document.createElement('span'); nm.textContent = attName(s); name.appendChild(nm);
      if (s.kind === 'agent') { var ai = document.createElement('i'); ai.textContent = 'AI'; name.appendChild(ai); }
      var sub = document.createElement('p'); sub.className = 'fb-att__sub';
      var same = s.currentPath === att.myPath;
      sub.textContent = [s.mood || '', s.kind === 'agent' ? 'reading along' : (same ? 'on this page' : 'at ' + attPlace(s.currentPath)), s.country || '', attSince(s.joinedAt)].filter(Boolean).join(' · ');
      main.appendChild(name); main.appendChild(sub);
      if (s.listening) { var tune = document.createElement('p'); tune.className = 'fb-att__tune'; tune.textContent = '♫ ' + String(s.listening).slice(0, 120); main.appendChild(tune); }
      var k = att.said[s.nounId];
      if (k && k.text && Date.now() - k.at < 30 * 60000) { var said = document.createElement('p'); said.className = 'fb-att__said'; said.textContent = '“' + k.text.slice(0, 120) + '”'; main.appendChild(said); }
      var acts = document.createElement('div'); acts.className = 'fb-att__acts';
      var wave = document.createElement('button'); wave.type = 'button'; wave.textContent = '👋'; wave.title = 'Wave'; wave.setAttribute('aria-label', 'Wave at ' + attName(s));
      on(wave, 'click', function () { sendWave(s.nounId, ''); wave.disabled = true; wave.textContent = '✓'; setTimeout(function () { wave.disabled = false; wave.textContent = '👋'; }, 2500); });
      acts.appendChild(wave);
      if (s.kind !== 'agent' && !same) {
        var bring = document.createElement('button'); bring.type = 'button'; bring.textContent = '⤵'; bring.title = 'Invite them to this page'; bring.setAttribute('aria-label', 'Invite ' + attName(s) + ' to this page');
        on(bring, 'click', function () { sendWave(s.nounId, att.myPath); bring.disabled = true; bring.textContent = '✓'; setTimeout(function () { bring.disabled = false; bring.textContent = '⤵'; }, 2500); });
        acts.appendChild(bring);
        if (s.currentPath) { var go = document.createElement('a'); go.href = s.currentPath; go.textContent = 'join ↗'; go.title = 'Go to ' + attPlace(s.currentPath); acts.appendChild(go); }
      }
      var to = document.createElement('button'); to.type = 'button'; to.textContent = '↩'; to.title = 'Say something to them'; to.setAttribute('aria-label', 'Say something to ' + attName(s));
      on(to, 'click', function () { closeAll(); $omni.value = '↩ ' + attName(s) + ' · '; applyOmniMode(); $omni.focus(); try { $omni.setSelectionRange($omni.value.length, $omni.value.length); } catch (e) {} });
      acts.appendChild(to);
      row.appendChild(img); row.appendChild(main); row.appendChild(acts);
      return row;
    }
    function renderAttendance() {
      if (!$attList) return;
      var others = attOthers(), total = att.humans + att.agents;
      $attSum.textContent = others.length ? (att.humans + (att.humans === 1 ? ' person' : ' people') + (att.agents ? ' · ' + att.agents + ' AI' + (att.agents === 1 ? '' : 's') : '') + ' in town, you included') : 'Just you in town right now';
      var nodes = [];
      if (!others.length) { var e = document.createElement('p'); e.className = 'fb-att__empty'; e.textContent = 'When someone else arrives, on any page, they show up here. You can wave, join them where they are, or say something to them.'; nodes.push(e); }
      var ais = others.filter(function (s) { return s.kind === 'agent'; }), people = others.filter(function (s) { return s.kind !== 'agent'; });
      var here = people.filter(function (s) { return s.currentPath === att.myPath; }), away = people.filter(function (s) { return s.currentPath !== att.myPath; });
      if (here.length) { var h = document.createElement('p'); h.className = 'fb-att__group'; h.textContent = 'On this page with you · ' + here.length; nodes.push(h); here.forEach(function (s) { nodes.push(attRow(s)); }); }
      if (away.length) { var a = document.createElement('p'); a.className = 'fb-att__group'; a.textContent = 'Elsewhere in town · ' + away.length; nodes.push(a); away.slice(0, 30).forEach(function (s) { nodes.push(attRow(s)); }); }
      if (ais.length) { var g = document.createElement('p'); g.className = 'fb-att__group'; g.textContent = 'AIs in attendance · ' + ais.length; nodes.push(g); ais.slice(0, 20).forEach(function (s) { nodes.push(attRow(s)); }); }
      $attList.replaceChildren.apply($attList, nodes);
      if ($attYou) $attYou.textContent = 'You · noun ' + att.myNoun + ' · at ' + attPlace(att.myPath) + ' · as ' + swWho();
      var focused = $attList.querySelector('[data-focus="true"]'); if (focused) try { focused.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
    function sendWave(toNoun, targetPath) {
      var d = { type: 'wave', to: toNoun, emoji: targetPath ? '🫴' : '👋' }; if (targetPath) d.targetPath = targetPath;
      window.dispatchEvent(new CustomEvent('pc:presence:send', { detail: d }));
    }
    function flashFace(noun, attr, ms) {
      root.querySelectorAll('.fb__crowd-face[data-noun="' + noun + '"]').forEach(function (f) { f.setAttribute(attr, 'true'); setTimeout(function () { f.removeAttribute(attr); }, ms); });
    }
    function showWave(w) {
      if (!$wave) return;
      att.waveFrom = w.fromNoun;
      var s = att.sessions.filter(function (x) { return x.nounId === w.fromNoun; })[0] || { nounId: w.fromNoun, kind: 'human' };
      root.querySelector('[data-pc-ref="fb-wave-noun"]').src = 'https://noun.pics/' + w.fromNoun + '.svg';
      var go = root.querySelector('[data-pc-ref="fb-wave-go"]');
      var invited = w.targetPath && w.targetPath !== att.myPath;
      root.querySelector('[data-pc-ref="fb-wave-text"]').textContent = invited ? attName(s) + ' is inviting you to ' + attPlace(w.targetPath) + '.' : attName(s) + ' waved at you ' + (w.emoji || '👋');
      go.hidden = !invited; if (invited) { go.href = w.targetPath; go.textContent = 'go to ' + attPlace(w.targetPath) + ' →'; }
      $wave.hidden = false;
      clearTimeout($wave._t); $wave._t = setTimeout(function () { $wave.hidden = true; }, 9000);
    }
    function floatVibe(emoji) {
      if (!$vibes || $vibes.childElementCount > 14) return;
      var v = document.createElement('span'); v.className = 'fb-vibe'; v.textContent = emoji;
      v.style.left = (8 + Math.random() * 84) + '%'; v.style.animationDuration = (2.2 + Math.random() * 1.2) + 's';
      $vibes.appendChild(v); setTimeout(function () { try { v.remove(); } catch (e) {} }, 3600);
    }
    on(window, 'pc:presence', function (e) {
      var d = (e && e.detail) || {};
      att.sessions = Array.isArray(d.sessions) ? d.sessions : []; att.humans = d.humans || 0; att.agents = d.agents || 0;
      att.myNoun = typeof d.myNoun === 'number' ? d.myNoun : swNoun(); att.myPath = d.myPath || '/';
      var sig = att.sessions.map(function (s) { return s.nounId + s.kind + (s.currentPath || '') + (s.mood || '') + (s.listening || ''); }).join('|') + '#' + att.humans + '/' + att.agents;
      if (sig !== att.sig) { att.sig = sig; renderCrowd(); if (openPopover === 'tray:attendance') renderAttendance(); }
      (d.waves || []).forEach(function (w) {
        var key = 'w' + w.fromNoun + ':' + w.toNoun + ':' + w.at; if (att.seen[key]) return; att.seen[key] = 1;
        if (!att.primed && Date.now() - w.at > 4000) return;
        flashFace(w.fromNoun, 'data-waving', 1000);
        window.dispatchEvent(new CustomEvent('pc:presence:wave-seen', { detail: w }));
        if (w.toNoun === att.myNoun && w.fromNoun !== att.myNoun) showWave(w);
      });
      (d.vibes || []).forEach(function (v) {
        var key = 'v' + v.fromNoun + ':' + v.at + ':' + v.emoji; if (att.seen[key]) return; att.seen[key] = 1;
        if (!att.primed && Date.now() - v.at > 3000) return;
        if (v.fromNoun === att.myNoun) return; // yours already floated when you tapped it
        floatVibe(String(v.emoji || '✨'));
      });
      att.primed = true;
    });
    on(window, 'pc:shortwave:post', function (e) {
      var p = e && e.detail && e.detail.post; if (!p) return;
      att.said[Number(p.noun) || 0] = { who: String(p.who || ''), text: String(p.text || ''), at: Date.now() };
      flashFace(Number(p.noun) || 0, 'data-speaking', 5000);
      if (openPopover === 'tray:attendance') renderAttendance();
    });
    on(window, 'pc:attendance:open', function (e) { att.focus = Number(e && e.detail && e.detail.noun); if (isNaN(att.focus)) att.focus = -1; openTray('attendance'); });
    if ($crowd) on($crowd, 'click', function () { att.focus = -1; if (openPopover === 'tray:attendance') closeAll(); else openTray('attendance'); });
    root.querySelectorAll('.fb-att__vibes [data-vibe]').forEach(function (b) {
      on(b, 'click', function () { var emoji = b.getAttribute('data-vibe'); window.dispatchEvent(new CustomEvent('pc:presence:send', { detail: { type: 'vibe', emoji: emoji } })); floatVibe(emoji); });
    });
    if ($wave) {
      on(root.querySelector('[data-pc-ref="fb-wave-back"]'), 'click', function () { if (att.waveFrom >= 0) sendWave(att.waveFrom, ''); $wave.hidden = true; });
      on(root.querySelector('[data-pc-ref="fb-wave-close"]'), 'click', function () { $wave.hidden = true; });
    }
    renderCrowd();

    // One path for anything said: the room hears it (bubble + ticker), and
    // Shortwave keeps it. The homepage panel uses the same path via
    // pc:shortwave:say so a single word can never be mistaken for a route.
    function sayLine(raw, via) {
      raw = String(raw || '').trim();
      if (!raw) return;
      window.dispatchEvent(new CustomEvent('pc:room:chat', { detail: { msg: raw } }));
      try { showBubble(raw, 4000, true); } catch (e) {}
      try { postShortwave(raw, via); } catch (e) {}
    }
    on(window, 'pc:shortwave:say', function (e) { var d = (e && e.detail) || {}; sayLine(d.text, d.via === 'page' ? 'page' : 'bar'); });

    // Enter always submits. Implicit form submission is not reliable across
    // mobile keyboards and automation, and the bar is now the town composer.
    on($omni, 'keydown', function (e) {
      if (e.key !== 'Enter' || e.isComposing || e.shiftKey) return;
      e.preventDefault();
      if ($omniForm.requestSubmit) $omniForm.requestSubmit();
      else $omniForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    on($omniForm, 'submit', function (e) {
      e.preventDefault();
      var raw = String($omni.value || '').trim();
      if (!raw) return;
      var mode = inferOmniMode(raw);
      if (mode === 'AI') {
        openTray('my-ai');
        var conversation = root.querySelector('[data-shwa-conversation]'); if (conversation) conversation.open = true;
        var aiPrompt = root.querySelector('[data-ai-runtime][data-compact="true"] [data-runtime-prompt]');
        if (aiPrompt) { aiPrompt.value = raw.replace(/^\/ai\s*/i, ''); aiPrompt.dispatchEvent(new Event('input', { bubbles: true })); }
        $omni.value = ''; applyOmniMode();
        return;
      }
      if (mode === 'AIR') {
        castOnAir(airText());
        return;
      }
      if (mode === 'CAST') {
        // Magic word — `+confetti`, `+cat`, `+breath`, `+candle`, `+clear`.
        // Strip the prefix, take first word, emit pc:spell:cast.
        var spellId = raw.replace(/^\+\s*/, '').split(/\s+/)[0].toLowerCase();
        if (spellId === 'clear') {
          window.dispatchEvent(new CustomEvent('pc:spell:clear'));
        } else if (spellId) {
          window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId, source: 'magic-word' } }));
        }
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'OP') {
        // Operator command — `>cmd args`. Mike 2026-05-01: director mode
        // kickoff. Recognized commands run for real; unrecognized soft-
        // toast in the placeholder so the user sees the parse.
        var rest = raw.replace(/^>\s*/, '').trim();
        var parts = rest.split(/\s+/);
        var cmd = (parts.shift() || '').toLowerCase();
        var args = parts.join(' ');
        var ack = runOperatorCommand(cmd, args);
        window.dispatchEvent(new CustomEvent('pc:dock:operator', { detail: { cmd: cmd, args: args, raw: rest } }));
        // Soft toast in the omnibox placeholder so user gets feedback.
        var prevPlaceholder = $omni.placeholder;
        $omni.value = '';
        $omni.placeholder = ack;
        applyOmniMode();
        setTimeout(function () { $omni.placeholder = prevPlaceholder; }, 3000);
        return;
      }
      if (mode === 'ASK') {
        var body = raw.replace(/^\?\s*/, '');
        openTray('ask');
        var tb = root.querySelector('[data-pc-ref="fb-ask-body"]');
        if (tb) { tb.value = body; tb.dispatchEvent(new Event('input')); }
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'AGT') {
        openTray('agent');
        var slug = raw.replace(/^@\s*/, '').split(/\s+/)[0].toLowerCase();
        var btn = root.querySelector('.fb-resident__btn[data-ping-slug="' + slug + '"]');
        if (btn) btn.click();
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'SAY') {
        sayLine(raw);
        $omni.value = '';
        $omni.placeholder = 'say something…';
        applyOmniMode();
        return;
      }
      if (raw.startsWith('/') || /^https?:\/\//.test(raw)) {
        window.location.href = raw;
        return;
      }
      var maybe = '/' + raw.replace(/^\/+/, '').split(/\s+/)[0];
      window.location.href = '/search?q=' + encodeURIComponent(raw) + '&from=' + encodeURIComponent(maybe);
    });

    var roomOn = true;
    try {
      var v = localStorage.getItem('pc:room:on');
      if (v === '0') roomOn = false;
      else if (v === '1') roomOn = true;
      else roomOn = true;
    } catch (e) {}

    function applyRoomUI() {
      var stamp = getStampEl('room');
      if (stamp) stamp.setAttribute('data-on', roomOn ? 'true' : 'false');
      var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-room"]');
      if (dot) dot.setAttribute('data-state', roomOn ? 'on' : 'off');
      if ($omni) $omni.placeholder = roomOn ? 'say something…' : 'ask or go…';
      var label = root.querySelector('[data-pc-ref="fb-tray-room-label"]');
      var btn = root.querySelector('[data-pc-ref="fb-tray-room-toggle"]');
      if (label) label.textContent = roomOn ? 'Room: ON' : 'Room: OFF';
      if (btn) btn.setAttribute('aria-pressed', roomOn ? 'true' : 'false');
      applyOmniMode();
      // Bubble follows room state — turning room off clears any pending
      // bubble; turning it on does nothing yet (waits for input).
      if (!roomOn) try { hideBubble(); } catch (e) {}
    }

    var $roomToggleBtn = root.querySelector('[data-pc-ref="fb-tray-room-toggle"]');
    if ($roomToggleBtn) {
      on($roomToggleBtn, 'click', function () {
        roomOn = !roomOn;
        try { localStorage.setItem('pc:room:on', roomOn ? '1' : '0'); } catch (e) {}
        applyRoomUI();
        window.dispatchEvent(new CustomEvent('pc:room:toggle', { detail: { on: roomOn } }));
      });
    }
    applyRoomUI();

    var $askForm = root.querySelector('[data-pc-ref="fb-ask-form"]');
    var $askBody = root.querySelector('[data-pc-ref="fb-ask-body"]');
    var $askTo   = root.querySelector('[data-pc-ref="fb-ask-to"]');
    var $askCount = root.querySelector('[data-pc-ref="fb-ask-count"]');
    var $askStatus = root.querySelector('[data-pc-ref="fb-ask-status"]');
    var $echoes      = root.querySelector('[data-pc-ref="fb-echoes"]');
    var $echoesList  = root.querySelector('[data-pc-ref="fb-echoes-list"]');
    var $echoesCount = root.querySelector('[data-pc-ref="fb-echoes-counts"]');

    if ($askBody && $askCount) {
      on($askBody, 'input', function () {
        $askCount.textContent = String($askBody.value.length) + ' / 2000';
      });
    }

    // ─── Echoes — visible round-trip for ASK ──────────────────────
    // Mike 2026-04-29 sprint: "fun just started interacting" → make
    // the loop visible. Each send is stashed in localStorage; when the
    // ASK tray opens we re-render and check /blocks.json for any block
    // whose `source` references a stashed ping key — those flip to
    // "answered" with a link to the block.
    var ECHOES_KEY = 'pc:ask:echoes';
    var ECHOES_MAX = 6;

    function loadEchoes() {
      try {
        var raw = localStorage.getItem(ECHOES_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    function saveEchoes(arr) {
      try { localStorage.setItem(ECHOES_KEY, JSON.stringify(arr.slice(-ECHOES_MAX))); } catch (e) {}
    }
    function addEcho(echo) {
      var arr = loadEchoes();
      arr.push(echo);
      saveEchoes(arr);
    }
    function shortTime(ts) {
      try {
        var d = new Date(ts);
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
      } catch (e) { return '—'; }
    }
    function renderEchoes() {
      if (!$echoes || !$echoesList) return;
      var arr = loadEchoes();
      if (!arr.length) {
        $echoes.hidden = true;
        return;
      }
      $echoes.hidden = false;
      var answered = arr.filter(function (e) { return e.status === 'answered'; }).length;
      if ($echoesCount) {
        $echoesCount.textContent = answered + ' / ' + arr.length + ' answered';
      }
      function escapeHtml(str) {
        return String(str || '').replace(/[<>&"]/g, function (c) {
          return c === '<' ? '&lt;'
               : c === '>' ? '&gt;'
               : c === '&' ? '&amp;'
               : '&quot;';
        });
      }
      // Astro scopes this component's CSS with a data-astro-cid-* attr;
      // innerHTML-created nodes need it copied on or the cards render bare.
      var cid = '';
      for (var ai = 0; ai < $echoesList.attributes.length; ai++) {
        if ($echoesList.attributes[ai].name.indexOf('data-astro-cid-') === 0) { cid = $echoesList.attributes[ai].name; break; }
      }
      $echoesList.innerHTML = arr.slice().reverse().map(function (e) {
        var pill = e.status === 'answered'
          ? ('<a class="fb-echo__pill fb-echo__pill--answered mono" href="' + (e.blockHref || '#') + '">✓ answered</a>')
          : '<span class="fb-echo__pill fb-echo__pill--sent mono">● sent</span>';
        // Mike 2026-05-02: when a block has answered an ASK, render the
        // reply text inline as a parchment quote — closes the round-trip
        // loop visually all the way around. Body cap at 220 chars; click
        // through to the block for the rest.
        var reply = '';
        if (e.status === 'answered' && (e.blockBody || e.blockTitle)) {
          var title = escapeHtml(e.blockTitle || '');
          var bodyText = String(e.blockBody || '');
          var truncated = bodyText.length > 220;
          var bodyEsc = escapeHtml(bodyText.slice(0, 220)) + (truncated ? '…' : '');
          var author = escapeHtml(e.blockAuthor || 'cast');
          var blockId = escapeHtml(e.blockId || '');
          reply =
            '<div class="fb-echo__reply">' +
              '<a class="fb-echo__reply-link" href="' + (e.blockHref || '#') + '">' +
                '<span class="fb-echo__reply-kicker mono">' + author + ' replied · № ' + blockId + '</span>' +
                (title ? '<span class="fb-echo__reply-title">' + title + '</span>' : '') +
                '<span class="fb-echo__reply-body">' + bodyEsc + '</span>' +
                (truncated ? '<span class="fb-echo__reply-more mono">read full block ↗</span>' : '') +
              '</a>' +
            '</div>';
        }
        return '<li class="fb-echo">' +
          '<div class="fb-echo__row">' +
            '<span class="fb-echo__time mono">' + shortTime(e.ts) + '</span>' +
            '<span class="fb-echo__to mono">→ ' + escapeHtml(e.to || 'cast') + '</span>' +
            '<span class="fb-echo__body">' + escapeHtml(e.body || '') + '</span>' +
            pill +
          '</div>' +
          reply +
          '</li>';
      }).join('');
      if (cid) {
        $echoesList.querySelectorAll('*').forEach(function (n) { n.setAttribute(cid, ''); });
      }
    }

    // ─── AGENT stamp activity ──────────────────────────────────────
    // The 03 AGENT stamp gets a green "live" dot when residents are
    // active. Reads /agents.json (the agent-readable manifest), counts
    // entries with status='resident'/'live'/'director'. Cheap, fails
    // silent. Heuristic: 1 live = on, 2+ = busy (pulsing).
    var AGENT_ACTIVITY_TTL = 10 * 60 * 1000;
    var agentActivityCache = { ts: 0, data: null };
    async function refreshAgentActivity() {
      var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-agent"]');
      if (!dot) return;
      try {
        var now = Date.now();
        var data;
        if (agentActivityCache.data && (now - agentActivityCache.ts) < AGENT_ACTIVITY_TTL) {
          data = agentActivityCache.data;
        } else {
          var r = await fetch('/agents.json', { cache: 'no-store' });
          if (!r.ok) return;
          data = await r.json();
          agentActivityCache = { ts: now, data: data };
        }
        var residents = (data && data.residents) || (data && data.agents) || [];
        var liveCount = 0;
        for (var i = 0; i < residents.length; i++) {
          var x = residents[i];
          if (x && (x.status === 'resident' || x.status === 'live' || x.status === 'director')) liveCount++;
        }
        if (liveCount >= 2) {
          dot.setAttribute('data-state', 'busy');
        } else if (liveCount >= 1) {
          dot.setAttribute('data-state', 'on');
        } else {
          dot.setAttribute('data-state', 'off');
        }
      } catch (e) {}
    }

    // Cross-check echoes against published blocks. If a block's `source`
    // string contains the ping key from any echo, mark it answered.
    var ECHO_BLOCKS_TTL = 60 * 1000;
    var echoBlocksCache = { ts: 0, data: null };
    async function reconcileEchoes() {
      var arr = loadEchoes();
      // Mike 2026-05-02: also re-process answered-but-missing-body echoes
      // so old localStorage entries from before reply-rendering shipped
      // get backfilled with title/body/author on next load.
      var pending = arr.filter(function (e) {
        if (!e.key) return false;
        if (e.status !== 'answered') return true;
        return !e.blockBody && !e.blockTitle;
      });
      if (!pending.length) return;
      try {
        var now = Date.now();
        var data;
        if (echoBlocksCache.data && (now - echoBlocksCache.ts) < ECHO_BLOCKS_TTL) {
          data = echoBlocksCache.data;
        } else {
          var r = await fetch('/blocks.json', { cache: 'no-store' });
          if (!r.ok) return;
          data = await r.json();
          echoBlocksCache = { ts: now, data: data };
        }
        var blocks = Array.isArray(data) ? data : (data && data.blocks) || [];
        var changed = false;
        for (var i = 0; i < arr.length; i++) {
          var echo = arr[i];
          if (!echo.key) continue;
          // Skip echoes that are already fully answered with body data.
          if (echo.status === 'answered' && (echo.blockBody || echo.blockTitle)) continue;
          for (var j = 0; j < blocks.length; j++) {
            var b = blocks[j];
            var src = (b && b.source) || '';
            if (typeof src === 'string' && src.indexOf(echo.key) !== -1) {
              var wasAnswered = echo.status === 'answered';
              echo.status = 'answered';
              echo.blockId = b.id;
              echo.blockHref = '/b/' + b.id;
              // Mike 2026-05-02: stash enough of the reply to render
              // it inline in the echo card. Cap body at 320 chars in
              // storage; render-time truncates further.
              echo.blockTitle = String(b.title || '').slice(0, 80);
              echo.blockBody = String(b.body || b.dek || '').slice(0, 320);
              echo.blockAuthor = String(b.author || 'cast').slice(0, 20);
              if (!wasAnswered) {
                window.dispatchEvent(new CustomEvent('pc:burst:request', { detail: {
                  kind: 'ping-answered',
                  by: { handle: echo.blockAuthor },
                  meta: { label: echo.blockTitle || ('ping ' + echo.key), blockId: String(b.id || ''), color: '#185fa5' }
                } }));
              }
              changed = true;
              break;
            }
          }
        }
        if (changed) {
          saveEchoes(arr);
          renderEchoes();
        }
      } catch (e) {}
    }

    if ($askForm) {
      on($askForm, 'submit', async function (e) {
        e.preventDefault();
        var body = String($askBody.value || '').trim();
        if (!body) return;
        var to = $askTo.value || 'cast';
        $askStatus.textContent = 'sending…';
        $askStatus.setAttribute('data-state', 'pending');
        var expand = $askForm.getAttribute('data-expand') === 'true';
        var addr = '';
        try { addr = localStorage.getItem('pc:wallet-active') || ''; } catch (e) {}
        var payload = {
          type: 'pc-ping-v1',
          subject: 'ask · footer · → ' + to,
          body: body,
          from: addr ? ('wallet ' + addr.slice(0, 6) + '…' + addr.slice(-4) + ' (footer/ask)') : 'visitor (footer/ask)',
          timestamp: new Date().toISOString(),
        };
        if (addr) payload.address = addr;
        if (expand) payload.expand = true;
        try {
          var res = await fetch('/api/ping', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            $askStatus.textContent = expand
              ? 'sent · expand flag set — cc drafts a block on next read.'
              : 'sent. one of us picks this up next session.';
            $askStatus.setAttribute('data-state', 'ok');
            try {
              var payload = await res.clone().json();
              addEcho({
                key: payload && payload.key ? String(payload.key) : '',
                ts: new Date().toISOString(),
                to: to,
                body: body.slice(0, 140),
                status: 'sent',
              });
            } catch (e) {}
            $askBody.value = '';
            if ($askCount) $askCount.textContent = '0 / 2000';
            $askForm.removeAttribute('data-expand');
            renderEchoes();
          } else if (res.status === 503) {
            $askStatus.textContent = 'inbox not bound on this preview — try pointcast.xyz';
            $askStatus.setAttribute('data-state', 'warn');
          } else {
            $askStatus.textContent = 'send failed (' + res.status + '). try again.';
            $askStatus.setAttribute('data-state', 'err');
          }
        } catch (err) {
          $askStatus.textContent = 'network error — try again.';
          $askStatus.setAttribute('data-state', 'err');
        }
      });
    }

    root.querySelectorAll('.fb-resident__btn').forEach(function (rbtn) {
      on(rbtn, 'click', function () {
        var slug = rbtn.getAttribute('data-ping-slug');
        if (!slug) return;
        openTray('ask');
        if ($askTo) {
          var opts = $askTo.options;
          for (var i = 0; i < opts.length; i++) {
            if (opts[i].value === slug) { $askTo.selectedIndex = i; break; }
          }
        }
        if ($askBody) try { $askBody.focus(); } catch (e) {}
      });
    });

    // HERE line inside the YOUR AI panel: public page title + who's here.
    // Detail for the visitor, and the same public packet the AI may get.
    function renderAiHere() {
      var titleEl = root.querySelector('[data-ai-here-title]');
      var countEl = root.querySelector('[data-ai-here-count]');
      if (titleEl) {
        var isPrivate = /^\/(?:me|profile|auth|api|signin|login|callback)(?:\/|$)/i.test(location.pathname);
        var title = isPrivate ? 'A private page' : String(document.title || location.pathname).replace(/\s*[·—|-]\s*PointCast\s*$/i, '').trim();
        titleEl.textContent = title || location.pathname;
        titleEl.setAttribute('title', title || location.pathname);
      }
      if (countEl) {
        var here = $liveHere ? String($liveHere.textContent || '').trim() : '';
        countEl.textContent = /^\d+$/.test(here) ? here + ' here' : '';
      }
      var signin = root.querySelector('[data-ai-signin]');
      if (signin) {
        var back = /^\/(?:me|profile|auth|api|signin|login|callback)(?:\/|$)/i.test(location.pathname) ? '/' : location.pathname;
        signin.setAttribute('href', '/auth?returnTo=' + encodeURIComponent(back));
      }
    }

    var $youDot = root.querySelector('[data-pc-ref="fb-you-dot"]');
    var accountOn = false;
    function setAccess(kind) { if ($youDot) $youDot.setAttribute('data-access', accountOn ? 'account' : kind); }

    function refreshWalletUI() {
      try {
        var wallets = JSON.parse(localStorage.getItem('pc:wallets') || '[]');
        var activeAddr = localStorage.getItem('pc:wallet-active');
        var active = null;
        if (activeAddr && Array.isArray(wallets)) {
          for (var i = 0; i < wallets.length; i++) {
            if (wallets[i] && wallets[i].address === activeAddr) { active = wallets[i]; break; }
          }
        }
        if (active && active.address) {
          var short = active.address.slice(0, 6) + '…' + active.address.slice(-4);
          $menuWallet.textContent = 'wallet · ' + short + (active.provider ? ' · ' + active.provider : '');
          $walletBtn.textContent = 'Disconnect';
          $walletBtn.setAttribute('data-state', 'connected');
          $menuName.textContent = short;
          $youLabel.textContent = short.slice(0, 7);
          setAccess('wallet');
        } else {
          $menuWallet.textContent = 'no wallet connected';
          $walletBtn.textContent = 'Connect wallet (Beacon)';
          $walletBtn.setAttribute('data-state', 'disconnected');
          $youLabel.textContent = 'visitor';
          setAccess('none');
        }
      } catch (e) {}
    }
    on($walletBtn, 'click', function () {
      var state = $walletBtn.getAttribute('data-state');
      var chipBtn = root.querySelector('.wallet-chip__btn');
      if (state === 'connected' && chipBtn) { chipBtn.click(); return; }
      if (chipBtn) { chipBtn.click(); return; }
      var authTrigger = root.querySelector('[data-auth-trigger]');
      if (authTrigger) {
        window.dispatchEvent(new CustomEvent('pc:dock-show', { detail: { view: 'account' } }));
        authTrigger.click();
        return;
      }
      window.location.href = '/me';
    });
    on(window, 'pc:wallet-change', refreshWalletUI);
    on(window, 'pc:auth-change', function (event) {
      var user = event && event.detail && event.detail.user;
      accountOn = Boolean(user);
      if (!user) {
        refreshWalletUI();
        return;
      }
      var name = String(user.preferredName || 'PointCast account');
      var identityCount = Array.isArray(user.identities) ? user.identities.length : 1;
      $menuName.textContent = name;
      $menuWallet.textContent = identityCount + ' linked identit' + (identityCount === 1 ? 'y' : 'ies');
      $youLabel.textContent = name.slice(0, 12);
      $walletBtn.textContent = 'Manage account';
      $walletBtn.setAttribute('data-state', 'account');
      setAccess('account');
    });
    refreshWalletUI();

    on($moodSelect, 'change', function () {
      var k = $moodSelect.value;
      if (!k) return;
      window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: k } }));
      var st = (PC_SOUNDTRACKS || {})[k];
      if (st && st.label) {
        $moodLabel.textContent = String(st.label).toLowerCase();
        $soundLabel.textContent = 'Play ' + String(st.label).toLowerCase();
      }
      try { localStorage.setItem('pc:music:mood', k); } catch (e) {}
    });
    on(window, 'pc:mood-changed', function (e) {
      var k = e && e.detail && e.detail.moodId;
      if (!k) return;
      $moodSelect.value = k;
      var st = (PC_SOUNDTRACKS || {})[k];
      if (st && st.label) $moodLabel.textContent = String(st.label).toLowerCase();
      // Mike 2026-05-02: mood-spells. Cast a thematically-matched
      // spell when the mood changes. Silent no-op if SpellLayer
      // isn't mounted on this page or if auto-cast is off. Clears
      // any current ambient first so we don't pile candles + rain
      // on top of each other.
      try { castMoodSpell(k, /* fromUserChange */ true); } catch (err) {}
    });

    // Read auto-cast pref. Defaults ON for first-time visitors —
    // the whole point is "the dock becomes a room dial". Visitors
    // who want a quiet page flip it off in the binder.
    function autoCastEnabled() {
      try {
        var v = localStorage.getItem('pc:dock:auto-cast');
        if (v === '0') return false;
        return true; // default '1' (also covers null on first visit)
      } catch (e) { return true; }
    }
    function setAutoCast(on) {
      try { localStorage.setItem('pc:dock:auto-cast', on ? '1' : '0'); } catch (e) {}
      var $cb = root.querySelector('[data-pc-ref="fb-auto-cast"]');
      if ($cb) $cb.checked = !!on;
      // If turning off, clear any active ambient. If turning on, cast
      // the current mood's spell (if any) so the page reflects state.
      if (!on) {
        window.dispatchEvent(new CustomEvent('pc:spell:clear'));
      } else {
        try {
          var mid = localStorage.getItem('pc:music:mood');
          if (mid) castMoodSpell(mid, false);
        } catch (e) {}
      }
    }
    // Wire the checkbox + initial sync.
    (function () {
      var $cb = root.querySelector('[data-pc-ref="fb-auto-cast"]');
      if (!$cb) return;
      $cb.checked = autoCastEnabled();
      on($cb, 'change', function () { setAutoCast($cb.checked); });
    })();

    // Operator command: `>autocast on/off`. Listen on pc:dock:operator
    // so this stays decoupled from runOperatorCommand (which lives in
    // PR #318's director mode work). When #318 merges, the case can
    // also be added there for placeholder-toast accuracy.
    on(window, 'pc:dock:operator', function (e) {
      var d = e && e.detail;
      if (!d || d.cmd !== 'autocast') return;
      var v = String(d.args || '').trim().toLowerCase();
      if (v === 'on' || v === '1' || v === 'enable')   setAutoCast(true);
      else if (v === 'off' || v === '0' || v === 'disable') setAutoCast(false);
      else setAutoCast(!autoCastEnabled()); // bare `>autocast` toggles
      // Override the stub ack with something honest.
      try {
        var prev = $omni.placeholder;
        $omni.placeholder = '> autocast ' + (autoCastEnabled() ? 'on · mood drives spells' : 'off · spells stay silent');
        setTimeout(function () { $omni.placeholder = prev; }, 2400);
      } catch (er) {}
    });
    function castMoodSpell(moodId, fromUserChange) {
      if (!autoCastEnabled()) return;
      var spellId = (PC_MOOD_SPELLS || {})[moodId];
      if (!spellId) return;
      // Clear any currently-cast ambient so the new mood takes over
      // rather than stacking.
      window.dispatchEvent(new CustomEvent('pc:spell:clear'));
      // Tiny delay so the clear-all completes its DOM removals before
      // the new spell renders. Smoother visual transition.
      setTimeout(function () {
        window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId, source: fromUserChange ? 'mood-change' : 'mood-replay' } }));
      }, fromUserChange ? 240 : 0);
    }

    try {
      var prior = localStorage.getItem('pc:music:mood');
      if (prior && (PC_SOUNDTRACKS || {})[prior]) {
        $moodSelect.value = prior;
        $moodLabel.textContent = (PC_SOUNDTRACKS[prior].label || prior).toLowerCase();
        // Replay the mood's spell on page load (if auto-cast is on).
        // Delay long enough for SpellLayer to register its listeners.
        setTimeout(function () { try { castMoodSpell(prior, false); } catch (e) {} }, 1800);
      }
    } catch (e) {}

    on($soundBtn, 'click', function () {
      var k = $moodSelect.value;
      if (!k) {
        $soundLabel.textContent = 'pick a mood first';
        return;
      }
      var st = (PC_SOUNDTRACKS || {})[k];
      if (!st || !st.url) { $soundLabel.textContent = 'no soundtrack for this mood'; return; }
      if ($soundtrack.hidden) {
        $soundtrack.hidden = false;
        $soundtrack.innerHTML = '<iframe src="' + st.url + '" width="100%" height="80" frameborder="0" allow="autoplay; encrypted-media" loading="lazy" title="PointCast soundtrack"></iframe>';
        $soundLabel.textContent = 'Playing · stop';
        try { localStorage.setItem('pc:music:playing', '1'); } catch (e) {}
      } else {
        $soundtrack.hidden = true;
        $soundtrack.innerHTML = '';
        $soundLabel.textContent = 'Play ' + (st.label || k).toLowerCase();
        try { localStorage.setItem('pc:music:playing', '0'); } catch (e) {}
      }
    });

    // ─── speech-bubble mode (Mike 2026-04-30) ───────────────────
    // The bar grows a chat-bubble face when room is on, others are
    // present, and omni is in SAY mode. Three signals together gate
    // visibility; presence count flips bubbleState.othersPresent.
    var bubbleState = { othersPresent: false, hideTimer: 0, persistTimer: 0, persistUntil: 0 };

    var $bubble     = root.querySelector('[data-pc-ref="fb-bubble"]');
    var $bubbleBody = root.querySelector('[data-pc-ref="fb-bubble-body"]');

    function clampBubble(s, n) {
      var str = String(s || '');
      if (str.length <= n) return str;
      return str.slice(0, n - 1) + '…';
    }

    function hideBubble() {
      if (!$bubble) return;
      bubbleState.persistUntil = 0;
      if (bubbleState.hideTimer) { clearTimeout(bubbleState.hideTimer); bubbleState.hideTimer = 0; }
      if (bubbleState.persistTimer) { clearTimeout(bubbleState.persistTimer); bubbleState.persistTimer = 0; }
      $bubble.setAttribute('data-state', 'hidden');
      setTimeout(function () {
        if ($bubble.getAttribute('data-state') === 'hidden') $bubble.hidden = true;
      }, 200);
    }

    function showBubble(text, persistMs, force) {
      if (!$bubble || !$bubbleBody) return;
      // `force`: a sent line always shows for its snapshot, even alone in the room.
      if (!force && (!roomOn || !bubbleState.othersPresent)) { hideBubble(); return; }
      $bubbleBody.textContent = clampBubble(text, 100);
      $bubble.hidden = false;
      void $bubble.offsetWidth;
      $bubble.setAttribute('data-state', persistMs ? 'sent' : 'typing');
      if (bubbleState.hideTimer) { clearTimeout(bubbleState.hideTimer); bubbleState.hideTimer = 0; }
      if (bubbleState.persistTimer) { clearTimeout(bubbleState.persistTimer); bubbleState.persistTimer = 0; }
      if (persistMs && persistMs > 0) {
        bubbleState.persistUntil = Date.now() + persistMs;
        bubbleState.persistTimer = setTimeout(function () {
          bubbleState.persistUntil = 0;
          if (roomOn && bubbleState.othersPresent && inferOmniMode($omni.value) === 'SAY' && $omni.value.trim()) {
            showBubble($omni.value, 0);
          } else {
            hideBubble();
          }
        }, persistMs);
      }
    }

    function syncBubbleFromInput() {
      if (bubbleState.persistUntil && Date.now() < bubbleState.persistUntil) return;
      if (!roomOn || !bubbleState.othersPresent) { hideBubble(); return; }
      var mode = inferOmniMode($omni.value);
      var raw = String($omni.value || '').trim();
      if (mode !== 'SAY' || !raw) { hideBubble(); return; }
      showBubble(raw, 0);
    }

    async function updatePresence() {
      try {
        var r = await fetch('/api/presence/snapshot', { cache: 'no-store' });
        if (!r.ok) return;
        var j = await r.json();
        var h = Number(j.humans ?? 0);
        var a = Number(j.agents ?? 0);
        var total = h + a;
        if ($liveHere) $liveHere.textContent = String(total);
        if (openPopover === 'tray:my-ai') try { renderAiHere(); } catch (e) {}
        var here = root.querySelector('[data-pc-ref="fb-tray-room-here"]');
        if (here) here.textContent = String(total);
        // Bubble cares whether anyone else is here (>1 means at least one peer).
        bubbleState.othersPresent = total > 1;
        if (!bubbleState.othersPresent) hideBubble();
        var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-room"]');
        if (dot) {
          if (roomOn && total > 1) dot.setAttribute('data-state', 'busy');
          else dot.setAttribute('data-state', roomOn ? 'on' : 'off');
        }
      } catch (e) {}
    }
    updatePresence();
    setInterval(updatePresence, 45 * 1000);

    setTimeout(function () {
      try { reconcileEchoes(); } catch (e) {}
      try { refreshAgentActivity(); } catch (e) {}
    }, 1500);
    setInterval(function () {
      try { reconcileEchoes(); } catch (e) {}
    }, 90 * 1000);
    setInterval(function () {
      try { refreshAgentActivity(); } catch (e) {}
    }, 5 * 60 * 1000);

    // Walked-up wallet address — used to auto-stamp pings with `address`.
    function activeWalletAddress() {
      try {
        var addr = localStorage.getItem('pc:wallet-active');
        return addr && typeof addr === 'string' ? addr : '';
      } catch (e) { return ''; }
    }

    // ─── Director mode (Mike 2026-05-01) ──────────────────────────
    // Recognized via localStorage[pc:director]='1' for now. Real
    // wallet-address recognition (matching MH's tz address) is a
    // follow-up sprint. The flag flips body[data-director='true'],
    // which CSS uses to show the gold inline forms in the BROADCAST
    // tray + the ★ DIR badge on the YOU chip.
    function isDirector() {
      try {
        if (localStorage.getItem('pc:director') === '1') return true;
      } catch (e) {}
      // Future: also return true if activeWalletAddress() matches a
      // configured director list. Empty for now.
      return false;
    }

    function applyDirectorUI() {
      var on = isDirector();
      try { document.body.setAttribute('data-director', on ? 'true' : 'false'); } catch (e) {}
      var $badge = root.querySelector('[data-pc-ref="fb-dir-badge"]');
      if ($badge) $badge.setAttribute('data-on', on ? 'true' : 'false');
      var $note = root.querySelector('[data-pc-ref="fb-bcast-director-note"]');
      var $controls = root.querySelector('[data-pc-ref="fb-dir-controls"]');
      if ($note) $note.hidden = on;
      if ($controls) $controls.hidden = !on;
    }

    function setDirector(on) {
      try { localStorage.setItem('pc:director', on ? '1' : '0'); } catch (e) {}
      applyDirectorUI();
    }

    // Boot: apply director UI once on load. Check again on
    // pc:wallet-change so wallet-driven recognition lights up live.
    setTimeout(applyDirectorUI, 0);
    on(window, 'pc:wallet-change', applyDirectorUI);
    on(window, 'pc:director-change', applyDirectorUI);

    // Director-only ping POST helper. Always tags from='director' and
    // includes the active wallet address if present.
    async function postDirectorPing(subject, body) {
      if (!isDirector()) return { ok: false, reason: 'not-director' };
      try {
        var res = await postPing({
          subject: subject,
          body: body,
          from: 'director (footer/dir)',
        });
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) };
      }
    }

    // Operator-command runner. Returns a one-line ack string for the
    // omnibox placeholder. Recognized commands: director, mood,
    // announce, schedule. Unrecognized → "?" toast.
    function runOperatorCommand(cmd, args) {
      if (cmd === 'director') {
        var v = (args || '').trim().toLowerCase();
        if (v === 'on' || v === '1' || v === 'enable')   { setDirector(true);  return '> director on · ★ DIR mode lit'; }
        if (v === 'off' || v === '0' || v === 'disable') { setDirector(false); return '> director off · back to visitor'; }
        return '> director on/off — toggles ★ DIR mode locally';
      }
      if (cmd === 'mood') {
        var key = (args || '').trim().toLowerCase();
        if (!key) return '> mood <key> — dispatch a mood (' + Object.keys(PC_SOUNDTRACKS || {}).join(', ').slice(0, 60) + '…)';
        if (PC_SOUNDTRACKS && PC_SOUNDTRACKS[key]) {
          window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: key } }));
          try { localStorage.setItem('pc:music:mood', key); } catch (e) {}
          return '> mood · ' + key + ' set';
        }
        return '> mood · "' + key + '" not in soundtracks';
      }
      if (cmd === 'announce') {
        if (!isDirector()) return '> announce — director only (try >director on)';
        var msg = (args || '').trim();
        if (!msg) return '> announce <msg> — one-line cast announcement';
        postDirectorPing('cast announce', msg);
        return '> announce · queued for residents · ' + msg.slice(0, 40) + (msg.length > 40 ? '…' : '');
      }
      if (cmd === 'schedule') {
        if (!isDirector()) return '> schedule — director only';
        var sched = (args || '').trim();
        if (!sched) return '> schedule <id> <when> — e.g. >schedule 0420 09:00';
        postDirectorPing('schedule', sched);
        return '> schedule · queued · ' + sched.slice(0, 50);
      }
      // Unknown — soft toast.
      return '> ' + (cmd || '?') + (args ? ' · ' + args : '') + ' — unknown command';
    }

    // BROADCAST tray inline forms — wire submit to postDirectorPing.
    var $dirAnnounceForm = root.querySelector('[data-pc-ref="fb-dir-announce-form"]');
    var $dirAnnounceInput = root.querySelector('[data-pc-ref="fb-dir-announce-input"]');
    var $dirScheduleForm = root.querySelector('[data-pc-ref="fb-dir-schedule-form"]');
    var $dirScheduleInput = root.querySelector('[data-pc-ref="fb-dir-schedule-input"]');
    var $dirStatus = root.querySelector('[data-pc-ref="fb-dir-status"]');

    function dirToast(text, state) {
      if (!$dirStatus) return;
      $dirStatus.textContent = text;
      $dirStatus.setAttribute('data-state', state || 'pending');
      setTimeout(function () {
        if ($dirStatus.textContent === text) {
          $dirStatus.textContent = '';
          $dirStatus.removeAttribute('data-state');
        }
      }, 4000);
    }

    if ($dirAnnounceForm && $dirAnnounceInput) {
      on($dirAnnounceForm, 'submit', async function (e) {
        e.preventDefault();
        var msg = String($dirAnnounceInput.value || '').trim();
        if (!msg) return;
        dirToast('queueing announcement…', 'pending');
        var res = await postDirectorPing('cast announce', msg);
        if (res.ok) {
          dirToast('★ queued for residents — appears as a banner block next session', 'ok');
          $dirAnnounceInput.value = '';
        } else if (res.reason === 'not-director') {
          dirToast('director only — set localStorage[pc:director]=\'1\' or run >director on', 'warn');
        } else if (res.status === 503) {
          dirToast('inbox not bound on this preview — try pointcast.xyz', 'warn');
        } else {
          dirToast('send failed (' + (res.status || 'network') + ')', 'err');
        }
      });
    }
    if ($dirScheduleForm && $dirScheduleInput) {
      on($dirScheduleForm, 'submit', async function (e) {
        e.preventDefault();
        var sched = String($dirScheduleInput.value || '').trim();
        if (!sched) return;
        dirToast('queueing schedule…', 'pending');
        var res = await postDirectorPing('schedule', sched);
        if (res.ok) {
          dirToast('★ schedule queued — residents will honor on next session', 'ok');
          $dirScheduleInput.value = '';
        } else if (res.reason === 'not-director') {
          dirToast('director only', 'warn');
        } else {
          dirToast('send failed (' + (res.status || 'network') + ')', 'err');
        }
      });
    }

    function postPing(payload, peerBaseUrl) {
      var url = (peerBaseUrl ? peerBaseUrl.replace(/\/+$/, '') : '') + '/api/ping';
      var addr = activeWalletAddress();
      var enriched = Object.assign({
        type: 'pc-ping-v1',
        timestamp: new Date().toISOString(),
      }, payload || {});
      if (addr && !enriched.address) enriched.address = addr;
      return fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(enriched),
      });
    }

    // ASK template handler — pre-fills the textarea with a starter, focuses.
    var ASK_TEMPLATES = {
      note:   { prefix: 'note · ',  body: '' },
      idea:   { prefix: 'idea · ',  body: '' },
      bug:    { prefix: 'bug · ',   body: 'where: \nwhat happened: \nexpected: ' },
      // Per AGENTS.md: setting expand:true means cc reads, drafts a block
      // in cc-voice editorial. The form posts with that flag included.
      expand: { prefix: 'expand · ', body: 'topic: \nwhy: \nshape: ' },
    };
    function applyAskTemplate(actionId) {
      openTray('ask');
      var tpl = ASK_TEMPLATES[actionId];
      if (!tpl) return;
      var $b = root.querySelector('[data-pc-ref="fb-ask-body"]');
      if (!$b) return;
      var existing = String($b.value || '');
      var seed = tpl.prefix + tpl.body;
      $b.value = existing ? (seed + '\n\n' + existing) : seed;
      $b.dispatchEvent(new Event('input'));
      try { $b.focus(); $b.setSelectionRange($b.value.length, $b.value.length); } catch (e) {}
      // Stash a hint on the form so the submit handler can include the
      // expand flag for /expand templates.
      var $f = root.querySelector('[data-pc-ref="fb-ask-form"]');
      if ($f) {
        if (actionId === 'expand') $f.setAttribute('data-expand', 'true');
        else $f.removeAttribute('data-expand');
      }
    }

    // BROADCAST tray polling — use the editorial now-playing record and
    // reuse the presence snapshot for audience count.
    async function refreshBroadcast() {
      var $now      = root.querySelector('[data-pc-ref="fb-bcast-now"]');
      var $nowId    = root.querySelector('[data-pc-ref="fb-bcast-now-id"]');
      var $nowTitle = root.querySelector('[data-pc-ref="fb-bcast-now-title"]');
      var $nowChan  = root.querySelector('[data-pc-ref="fb-bcast-now-channel"]');
      var $time     = root.querySelector('[data-pc-ref="fb-bcast-time"]');
      var $hereOut  = root.querySelector('[data-pc-ref="fb-bcast-here"]');
      var $moodOut  = root.querySelector('[data-pc-ref="fb-bcast-mood"]');
      var $peersOut = root.querySelector('[data-pc-ref="fb-bcast-peers"]');
      if (!$now) return;
      var playing = PC_NOW_PLAYING || null;
      try {
        var nowResponse = await fetch('/now-playing.json', {
          cache: 'no-store',
          headers: { accept: 'application/json' },
        });
        if (nowResponse.ok) {
          playing = await nowResponse.json();
          PC_NOW_PLAYING = playing;
        }
      } catch (e) {
        // Keep the build-time editorial signal when the live bridge is offline.
      }
      if (playing) {
        if ($nowId)    $nowId.textContent    = playing.provider || 'PLAY';
        if ($nowTitle) $nowTitle.textContent = playing.title || '(untitled)';
        if ($nowChan)  $nowChan.textContent  = playing.artist || 'CH.SPN';
        if ($now && playing.url) $now.setAttribute('href', playing.url);
        if ($time) $time.textContent = playing.status === 'playing' && playing.live === true
          ? 'ON AIR'
          : 'STANDBY';
      }
      // Next — the station's request line (people and agents share it).
      var $next = root.querySelector('[data-pc-ref="fb-bcast-next"]'), $nextSub = root.querySelector('[data-pc-ref="fb-bcast-next-sub"]');
      if ($next) {
        try {
          var lineResponse = await fetch('/api/station/requests', { headers: { accept: 'application/json' } });
          var line = lineResponse.ok ? await lineResponse.json() : null;
          var waiting = line && Array.isArray(line.requests) ? line.requests.filter(function (r) { return !r.playedAt; }) : [];
          $next.textContent = waiting.length ? String(waiting[0].title || '').slice(0, 40) : 'request a track';
          if ($nextSub) $nextSub.textContent = waiting.length ? (waiting.length + ' waiting · from ' + String(waiting[0].who || 'a visitor').slice(0, 24) + ' →') : 'the request line →';
        } catch (e) { /* the link still works */ }
      }
      // Audience — reuse the live-here number we already poll.
      if ($hereOut && $liveHere) {
        $hereOut.textContent = $liveHere.textContent || '—';
      }
      // Mood — pull from current select value if set.
      if ($moodOut) {
        var mk = ($moodSelect && $moodSelect.value) || '';
        if (mk && PC_SOUNDTRACKS && PC_SOUNDTRACKS[mk]) {
          $moodOut.textContent = (PC_SOUNDTRACKS[mk].label || mk).toLowerCase();
        } else {
          $moodOut.textContent = '— unset';
        }
      }
      // Peers — count federation-peers entries from the kit data.
      if ($peersOut) {
        // Hardcoded count from the data file — no live discovery yet.
        // The 'discover' action in the FED tray is where live probing lands.
        $peersOut.textContent = String((PC_FED_PEERS_COUNT || 4));
      }
    }

    // Cross-ping handler — POST to the peer's /api/ping with a small
    // probe message. Surfaces a one-line status next to the button.
    async function crossPingPeer(baseUrl, handle, btn) {
      if (!baseUrl) return;
      var prevText = btn ? btn.textContent : '';
      if (btn) { btn.textContent = '…'; btn.disabled = true; }
      try {
        var res = await postPing({
          subject: 'cross-cast probe from pointcast.xyz',
          body: 'hi @' + handle + ' — hello from the pointcast.xyz dock. xyz.pointcast.block lexicon.',
          from: 'pointcast.xyz (footer/cross-ping)',
        }, baseUrl);
        if (res.ok) {
          if (btn) btn.textContent = '✓ sent';
        } else if (res.status === 404) {
          if (btn) btn.textContent = 'no inbox';
        } else if (res.status === 503) {
          if (btn) btn.textContent = 'inbox off';
        } else {
          if (btn) btn.textContent = 'failed ' + res.status;
        }
      } catch (e) {
        // CORS blocked or network — most peers don't have CORS open
        // for cross-origin POSTs yet. That's expected. Surface the
        // friction so the federation handshake is honest.
        if (btn) btn.textContent = 'cors blocked';
      }
      setTimeout(function () {
        if (btn) { btn.textContent = prevText || 'cross-ping'; btn.disabled = false; }
      }, 3000);
    }

    // Action button dispatcher — listens for clicks on .fb__action,
    // routes to handlers by (tray, action).
    on(document, 'click', function (ev) {
      var t = ev.target;
      if (!(t instanceof Element)) return;
      // Action buttons in tray headers.
      var actionBtn = t.closest('.fb__action');
      if (actionBtn && root.contains(actionBtn)) {
        var tray = actionBtn.getAttribute('data-tray');
        var action = actionBtn.getAttribute('data-action');
        var directorOnly = actionBtn.getAttribute('data-director') === 'true';
        if (directorOnly && !activeWalletAddress()) {
          // Friendly nudge: open binder so user can connect wallet.
          actionBtn.setAttribute('data-flash', 'true');
          setTimeout(function () { actionBtn.removeAttribute('data-flash'); }, 700);
          return;
        }
        handleDockAction(tray, action);
        return;
      }
      // Per-peer cross-ping buttons.
      var crossBtn = t.closest('[data-cross-ping]');
      if (crossBtn && root.contains(crossBtn)) {
        var base = crossBtn.getAttribute('data-cross-ping');
        var handle = crossBtn.getAttribute('data-handle') || base;
        crossPingPeer(base, handle, crossBtn);
        return;
      }
    });

    function handleDockAction(tray, action) {
      // Single switch — easy to extend, easy to read.
      if (tray === 'room') {
        if (action === 'here') {
          openTray('room');
          // Surface the count by forcing a fresh presence read.
          updatePresence();
        } else if (action === 'quiet') {
          window.dispatchEvent(new CustomEvent('pc:room:quiet', { detail: { on: true } }));
        } else if (action === 'reset') {
          // Clear any cursor identity, then re-emit a toggle event.
          try { localStorage.removeItem('pc:room:cursor'); } catch (e) {}
          window.dispatchEvent(new CustomEvent('pc:room:reset'));
        }
        return;
      }
      if (tray === 'ask') {
        applyAskTemplate(action);
        return;
      }
      if (tray === 'agent') {
        var $list = root.querySelector('[data-pc-ref="fb-residents-list"]');
        if (!$list) return;
        if (action === 'live') {
          $list.setAttribute('data-filter', 'live');
        } else if (action === 'plus-one') {
          $list.setAttribute('data-filter', 'open');
        } else if (action === 'roster') {
          window.location.href = '/residents';
          return;
        }
        // Apply filter via CSS attr selector — handled in styles.
        return;
      }
      if (tray === 'fed') {
        if (action === 'discover') {
          // Probe each peer in parallel; mark live/unreachable.
          discoverFederationPeers();
        } else if (action === 'rfc') {
          window.location.href = '/federation/preview';
        }
        return;
      }
      if (tray === 'broadcast') {
        if (action === 'now') {
          var $a = root.querySelector('[data-pc-ref="fb-bcast-now"]');
          if ($a) $a.click();
        } else if (action === 'channel') {
          window.location.href = '/c';
        } else if (action === 'schedule' || action === 'announce') {
          // Director-only — gated by activeWalletAddress() upstream.
          // For now: emit an operator event so future director plugins
          // can listen.
          window.dispatchEvent(new CustomEvent('pc:dock:director', { detail: { action: action } }));
        }
        return;
      }
      if (tray === 'cast') {
        // Magic word chips. The action id IS the spell id (or 'clear').
        if (action === 'clear') {
          window.dispatchEvent(new CustomEvent('pc:spell:clear'));
        } else {
          window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: action, source: 'dock' } }));
        }
        return;
      }
      if (tray === 'passport') {
        if (action === 'stamp') {
          pressEntryStamp();
        } else if (action === 'desk') {
          window.location.href = '/passport';
        }
        return;
      }
      if (tray === 'seismo') {
        if (action === 'felt') {
          seismoFelt();
        } else if (action === 'thump') {
          seismoThump();
        } else if (action === 'wire') {
          window.location.href = '/wire';
        }
        return;
      }
    }

    // ─── № 08 SEISMO — the town seismograph ────────────────────────
    // Wire activity, pointer motion, and drum thumps drive the needle.
    var SG_MARKS_KEY = 'pc:seismo:marks';
    var sgCanvas = root.querySelector('[data-pc-ref="fb-sg-strip"]');
    var sgCtx = sgCanvas ? sgCanvas.getContext('2d') : null;
    var $sgMag  = root.querySelector('[data-pc-ref="fb-sg-mag"]');
    var $sgRead = root.querySelector('[data-pc-ref="fb-sg-read"]');
    var $sgFelt = root.querySelector('[data-pc-ref="fb-sg-felt"]');
    var sgBuf = null;        // one amplitude per paper column, newest last
    var sgMarks = [];        // in-session felt marks riding the paper: {x, t}
    var sgEnergy = 0;        // decaying excitement, 0..~3
    var sgFloor = 0.06;      // ambient floor from wire density
    var sgPrev = 0;
    var sgPhase = 0;
    var sgAcc = 0;
    var sgGridOff = 0;
    var sgMagTxt = '';
    var sgRunning = false;
    var sgWire = null;       // cached /wire.json summary
    var sgReduced = false;
    try { sgReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function sgLoadMarks() {
      try {
        var raw = localStorage.getItem(SG_MARKS_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }

    function sgPaintFelt() {
      if (!$sgFelt) return;
      var n = sgLoadMarks().length;
      $sgFelt.textContent = n ? 'felt ' + n + '× at this desk' : 'never felt — press it when the town moves you';
    }

    function sgSetupCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cssW = Math.max(120, sgCanvas.clientWidth || 300);
      var cssH = Math.max(80, sgCanvas.clientHeight || 148);
      sgCanvas.width = Math.round(cssW * dpr);
      sgCanvas.height = Math.round(cssH * dpr);
      sgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!sgBuf || sgBuf.length !== cssW) {
        sgBuf = new Array(cssW);
        for (var i = 0; i < cssW; i++) sgBuf[i] = 0;
      }
    }

    async function sgReadWire() {
      if (sgWire) return sgWire;
      try {
        var r = await fetch('/wire.json', { cache: 'no-store' });
        if (!r.ok) throw new Error('wire ' + r.status);
        var data = await r.json();
        var evs = (data && data.events) || [];
        var now = Date.now();
        var commits = 0, blocks = 0, lastTs = 0, recent = 0;
        for (var i = 0; i < evs.length; i++) {
          var t = Date.parse(evs[i].at || '') || 0;
          if (evs[i].kind === 'commit') commits++;
          else if (evs[i].kind === 'block') blocks++;
          if (t > lastTs) lastTs = t;
          if (now - t < 20 * 60 * 1000) recent++;
        }
        sgWire = { ok: true, commits: commits, blocks: blocks, lastTs: lastTs, recent: recent, count: evs.length };
      } catch (e) {
        sgWire = { ok: false };
      }
      return sgWire;
    }

    function seismoOpen() {
      if (!sgCanvas || !sgCtx) return;
      sgSetupCanvas();
      sgMarks = [];
      sgPaintFelt();
      sgReadWire().then(function (w) {
        if (!w.ok) {
          sgFloor = 0.05;
          if ($sgRead) $sgRead.textContent = 'wire unreachable — the needle runs on nerves alone';
          return;
        }
        sgFloor = Math.min(0.3, 0.04 + w.count * 0.006);
        if (w.recent) sgEnergy = Math.max(sgEnergy, 0.9);
        if ($sgRead) {
          $sgRead.textContent = 'WIRE 24H · ' + w.commits + ' commits · ' + w.blocks + ' blocks · last ' + (w.lastTs ? shortTime(w.lastTs) : '——');
        }
        var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-seismo"]');
        if (dot && w.lastTs && (Date.now() - w.lastTs) < 45 * 60 * 1000) dot.setAttribute('data-state', 'on');
      });
      if (!sgRunning) { sgRunning = true; sgFrame(); }
    }

    function sgFrame() {
      if (!sgRunning) return;
      if (document.hidden) { sgRunning = false; return; }
      var tray = getTrayEl('seismo');
      if (!tray || tray.getAttribute('data-open') !== 'true') { sgRunning = false; return; }
      sgStep();
      sgDraw();
      if (sgReduced) setTimeout(function () { requestAnimationFrame(sgFrame); }, 90);
      else requestAnimationFrame(sgFrame);
    }

    function sgStep() {
      sgEnergy = Math.max(0, sgEnergy * 0.965 - 0.0004);
      sgAcc += sgReduced ? 1 : 0.45;
      while (sgAcc >= 1) {
        sgAcc -= 1;
        sgGridOff = (sgGridOff + 23) % 24;
        sgPhase += 0.55 + Math.random() * 0.3;
        var e = sgFloor + sgEnergy;
        var jag = Math.random() * 2 - 1;
        var v = jag * 0.12 * (0.4 + e) + Math.sin(sgPhase) * e * 0.7 + jag * e * 0.5;
        v = Math.max(-1, Math.min(1, sgPrev * 0.45 + v * 0.55));
        sgPrev = v;
        sgBuf.push(v);
        sgBuf.shift();
        for (var i = 0; i < sgMarks.length; i++) sgMarks[i].x -= 1;
      }
      sgMarks = sgMarks.filter(function (m) { return m.x > -30; });
    }

    function sgDraw() {
      var w = sgBuf.length;
      var h = sgCanvas.clientHeight || 148;
      var mid = h * 0.52;
      var amp = h * 0.36;
      var ctx = sgCtx;
      ctx.clearRect(0, 0, w, h);
      // Drum-chart paper: verticals scroll with the strip, horizontals sit still.
      ctx.strokeStyle = 'rgba(141, 120, 84, 0.16)';
      ctx.lineWidth = 1;
      var gx;
      for (gx = sgGridOff; gx < w; gx += 24) {
        ctx.beginPath(); ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, h); ctx.stroke();
      }
      for (var gy = mid % 18; gy < h; gy += 18) {
        ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(w, gy + 0.5); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(141, 120, 84, 0.4)';
      ctx.beginPath(); ctx.moveTo(0, mid + 0.5); ctx.lineTo(w, mid + 0.5); ctx.stroke();
      // Felt marks — a pin above the paper with the moment it was pressed.
      ctx.font = '9px ui-monospace, Menlo, monospace';
      ctx.fillStyle = '#8a2432';
      for (var mi = 0; mi < sgMarks.length; mi++) {
        var m = sgMarks[mi];
        ctx.beginPath();
        ctx.moveTo(m.x, 12); ctx.lineTo(m.x - 4, 4); ctx.lineTo(m.x + 4, 4);
        ctx.closePath(); ctx.fill();
        ctx.fillText('felt · ' + shortTime(m.t), m.x + 7, 11);
      }
      // The ink line, then the pen head at the newest column.
      ctx.strokeStyle = '#c73e2e';
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var i = 0; i < w; i++) {
        var y = mid - sgBuf[i] * amp;
        if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#c73e2e';
      ctx.beginPath();
      ctx.arc(w - 1.5, mid - sgBuf[w - 1] * amp, 2.2, 0, Math.PI * 2);
      ctx.fill();
      if ($sgMag) {
        var mag = 0.8 + (sgFloor + sgEnergy) * 3.4;
        var word = mag < 1.5 ? 'still' : mag < 2.2 ? 'calm' : mag < 3 ? 'stirring' : mag < 3.8 ? 'busy' : 'the whole town is up';
        var magTxt = 'M ' + mag.toFixed(1) + ' · ' + word;
        if (magTxt !== sgMagTxt) { sgMagTxt = magTxt; $sgMag.textContent = magTxt; }
      }
    }

    function seismoFelt() {
      sgEnergy = Math.min(3, sgEnergy + 0.8);
      if (sgBuf) sgMarks.push({ x: sgBuf.length - 4, t: Date.now() });
      try {
        var arr = sgLoadMarks();
        arr.push(Date.now());
        localStorage.setItem(SG_MARKS_KEY, JSON.stringify(arr.slice(-24)));
      } catch (e) {}
      sgPaintFelt();
    }

    function seismoThump() {
      sgEnergy = Math.min(3.2, sgEnergy + 2.1);
      var tray = getTrayEl('seismo');
      if (tray && !sgReduced) {
        tray.setAttribute('data-shake', 'true');
        setTimeout(function () { tray.removeAttribute('data-shake'); }, 460);
      }
    }

    // Microseism — your hand on the strip. Pointer speed adds energy.
    if (sgCanvas) {
      var sgLastX = null, sgLastY = null;
      on(sgCanvas, 'pointermove', function (e) {
        if (!sgRunning) return;
        if (sgLastX !== null) {
          var d = Math.abs(e.clientX - sgLastX) + Math.abs(e.clientY - sgLastY);
          sgEnergy = Math.min(3, sgEnergy + Math.min(0.05, d * 0.0015));
        }
        sgLastX = e.clientX; sgLastY = e.clientY;
      });
      on(sgCanvas, 'pointerleave', function () { sgLastX = null; sgLastY = null; });
      on(sgCanvas, 'pointerdown', function () {
        if (sgRunning) sgEnergy = Math.min(3, sgEnergy + 0.35);
      });
      on(document, 'visibilitychange', function () {
        if (document.hidden) sgRunning = false;
        else {
          var tray = getTrayEl('seismo');
          if (tray && tray.getAttribute('data-open') === 'true') seismoOpen();
        }
      });
    }

    // Federation discovery — probe each peer's /agents.json.
    async function discoverFederationPeers() {
      var peers = root.querySelectorAll('[data-pc-ref="fb-peers-list"] .fb-peer');
      peers.forEach(async function (li) {
        var base = li.getAttribute('data-base');
        if (!base) return;
        var statusEl = li.querySelector('.fb-peer__status');
        if (statusEl) { statusEl.textContent = 'probing'; statusEl.setAttribute('data-state', 'beta'); }
        try {
          var r = await fetch(base.replace(/\/+$/, '') + '/agents.json', { cache: 'no-store' });
          if (r.ok) {
            if (statusEl) { statusEl.textContent = 'live'; statusEl.setAttribute('data-state', 'live'); }
          } else {
            if (statusEl) { statusEl.textContent = 'no manifest'; statusEl.setAttribute('data-state', 'dream'); }
          }
        } catch (e) {
          if (statusEl) { statusEl.textContent = 'unreachable'; statusEl.setAttribute('data-state', 'dream'); }
        }
      });
    }

    // Open BROADCAST tray when stamp 05 is clicked — same hook pattern
    // as room/ask/etc., but BROADCAST also fires its data refresh.
    on(window, 'click', function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      var stamp = t.closest('[data-pc-ref="fb-stamp-broadcast"]');
      if (stamp) setTimeout(refreshBroadcast, 60);
    });
    // Initial broadcast pulse so values are populated by the time the
    // tray opens for the first time.
    setTimeout(refreshBroadcast, 1800);
    setInterval(refreshBroadcast, 90 * 1000);

    (function scheduleNounRefresh() {
      var now = new Date();
      var nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      var ms = nextMidnight.getTime() - now.getTime();
      setTimeout(function () {
        var day = Math.floor(Date.now() / (24 * 3600 * 1000));
        var seed = ((day + 7) * 2654435761) >>> 0;
        var id = seed % 1200;
        if ($noun) $noun.src = 'https://noun.pics/' + id + '.svg';
        if ($menuNoun) $menuNoun.src = 'https://noun.pics/' + id + '.svg';
        scheduleNounRefresh();
      }, Math.min(ms, 2_000_000_000));
    })();

    // ─── 07 PASSPORT — stamps, entries, holos ───
    var PP_STAMP_KEY = 'pc:passport:stamps';
    var PP_ENTRY_KEY = 'pc:passport:entries';
    var PP_HOLO_KEY = 'pc:passport:holos';
    var PP_NO_KEY = 'pc:passport:no';
    var PP_ENTRY_MAX = 6;

    function ppRead(key) {
      try {
        var raw = localStorage.getItem(key);
        var parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (e) { return {}; }
    }
    function ppWrite(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }
    function ppToday() {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());
    }
    function ppNo() {
      try {
        var no = localStorage.getItem(PP_NO_KEY);
        if (!no) {
          no = 'PC-' + Math.random().toString(36).slice(2, 8).toUpperCase();
          localStorage.setItem(PP_NO_KEY, no);
        }
        return no;
      } catch (e) { return 'PC-VISITOR'; }
    }
    function ppHash(s) {
      var h = 0x811c9dc5;
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
      return h >>> 0;
    }

    // Holo earn checks. Each returns true if earned RIGHT NOW; once
    // earned they persist in PP_HOLO_KEY forever (foil doesn't peel).
    function ppEarnHolos() {
      var holos = ppRead(PP_HOLO_KEY);
      var changed = false;
      function earn(id) {
        if (!holos[id]) { holos[id] = new Date().toISOString(); changed = true; }
      }
      try {
        if ((parseInt(localStorage.getItem('meadow:mine') || '0', 10) || 0) > 0) earn('blue');
      } catch (e) {}
      var path = location.pathname.replace(/\/+$/, '') || '/';
      if (path === '/everything') earn('census');
      if (path === '/door') earn('duster');
      var hour = new Date().getHours();
      if (hour >= 22 || hour < 5) earn('night');
      if (changed) ppWrite(PP_HOLO_KEY, holos);
      return holos;
    }

    function renderPassport() {
      var $no = root.querySelector('[data-pc-ref="fb-pp-no"]');
      if ($no) $no.textContent = '№ ' + ppNo();
      var $ppNoun = root.querySelector('[data-pc-ref="fb-pp-noun"]');
      if ($ppNoun && $noun) $ppNoun.src = $noun.src;

      // Stamps — ink the earned ones, keep the rest as ghosts.
      var earned = ppRead(PP_STAMP_KEY);
      var count = 0, points = 0;
      root.querySelectorAll('[data-stamp-slot]').forEach(function (li) {
        var id = li.getAttribute('data-stamp-slot');
        var rec = earned[id];
        var rot = ((ppHash(id) % 9) - 4);
        li.style.setProperty('--pp-rot', rot + 'deg');
        if (rec && rec.at) {
          li.setAttribute('data-earned', 'true');
          count++;
          var ptsEl = li.querySelector('.fb-pp-stamp__pts');
          if (ptsEl) points += parseInt(ptsEl.textContent, 10) || 0;
          var dateEl = li.querySelector('[data-stamp-date]');
          if (dateEl) dateEl.textContent = String(rec.at).slice(0, 10);
        } else {
          li.setAttribute('data-earned', 'false');
        }
      });
      var $count = root.querySelector('[data-pc-ref="fb-pp-stamp-count"]');
      if ($count) $count.textContent = count + ' / ' + root.querySelectorAll('[data-stamp-slot]').length;
      var $pts = root.querySelector('[data-pc-ref="fb-pp-points"]');
      if ($pts) $pts.textContent = points + ' pts';

      renderEntries(null);

      // Holos — flip earned foils on.
      var holos = ppEarnHolos();
      root.querySelectorAll('.fb-holo').forEach(function (el) {
        var id = el.getAttribute('data-holo');
        el.setAttribute('data-earned', holos[id] ? 'true' : 'false');
        if (holos[id]) el.setAttribute('title', 'earned ' + String(holos[id]).slice(0, 10));
      });
      ppBindShine();
      ppPaintDot();
    }

    function renderEntries(thunkDate) {
      var $wrap = root.querySelector('[data-pc-ref="fb-pp-entries"]');
      var $hint = root.querySelector('[data-pc-ref="fb-pp-entries-hint"]');
      if (!$wrap) return;
      // Astro scopes this component's CSS with a data-astro-cid-* attr;
      // JS-created nodes need it copied on or the entry stamps render bare.
      var cid = '';
      for (var ai = 0; ai < $wrap.attributes.length; ai++) {
        if ($wrap.attributes[ai].name.indexOf('data-astro-cid-') === 0) { cid = $wrap.attributes[ai].name; break; }
      }
      var entries = ppRead(PP_ENTRY_KEY);
      var dates = Object.keys(entries).sort().slice(-PP_ENTRY_MAX);
      $wrap.querySelectorAll('.fb-pp-entry').forEach(function (n) { n.remove(); });
      if ($hint) $hint.hidden = dates.length > 0;
      dates.forEach(function (d) {
        var el = document.createElement('span');
        el.className = 'fb-pp-entry mono';
        el.style.setProperty('--pp-rot', (((ppHash(d) % 11) - 5)) + 'deg');
        el.innerHTML = '<span class="fb-pp-entry__top">POINTCAST · ENTRY</span><span class="fb-pp-entry__date">' + d + '</span>';
        if (cid) {
          el.setAttribute(cid, '');
          el.querySelectorAll('*').forEach(function (n) { n.setAttribute(cid, ''); });
        }
        $wrap.appendChild(el);
        if (d === thunkDate) {
          el.setAttribute('data-thunk', 'true');
          setTimeout(function () { el.removeAttribute('data-thunk'); }, 900);
        }
      });
    }

    function pressEntryStamp() {
      var today = ppToday();
      var entries = ppRead(PP_ENTRY_KEY);
      entries[today] = entries[today] || new Date().toISOString();
      ppWrite(PP_ENTRY_KEY, entries);
      if (openPopover !== 'tray:passport') openTray('passport');
      // Re-render with the thunk targeted at today's stamp — replays
      // even if today was already pressed, because pressing is the fun.
      setTimeout(function () { renderEntries(today); }, 40);
    }

    // Foil shine — pointer position drives a gradient angle + a small
    // 3D tilt on earned holos. Bound once per session, cheap mousemove.
    var ppShineBound = false;
    function ppBindShine() {
      if (ppShineBound) return;
      var tray = root.querySelector('[data-pc-ref="fb-tray-passport"]');
      if (!tray) return;
      ppShineBound = true;
      on(tray, 'mousemove', function (e) {
        tray.querySelectorAll('.fb-holo[data-earned="true"]').forEach(function (el) {
          var r = el.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
          var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          el.style.setProperty('--shx', (50 + dx * 60).toFixed(1) + '%');
          el.style.setProperty('--shy', (50 + dy * 60).toFixed(1) + '%');
          el.style.setProperty('--tiltx', (dy * -6).toFixed(2) + 'deg');
          el.style.setProperty('--tilty', (dx * 6).toFixed(2) + 'deg');
        });
      });
      on(tray, 'mouseleave', function () {
        tray.querySelectorAll('.fb-holo').forEach(function (el) {
          el.style.removeProperty('--tiltx');
          el.style.removeProperty('--tilty');
        });
      });
    }

    // Dot on the 07 stamp: lit when there's something new to look at —
    // an unpressed entry stamp today, or a holo earned this visit.
    function ppPaintDot() {
      var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-passport"]');
      if (!dot) return;
      var entries = ppRead(PP_ENTRY_KEY);
      dot.setAttribute('data-state', entries[ppToday()] ? 'off' : 'on');
    }
    // Boot: earn any page-visit holos silently (being ON /everything
    // earns CENSUS TAKER whether or not the tray ever opens), then
    // light the 07 dot if today's entry stamp is still unpressed.
    setTimeout(function () {
      try { ppEarnHolos(); } catch (e) {}
      ppPaintDot();
    }, 0);
    on(window, 'pc:me-state', renderPassport);
    // The YOUR AI panel never opens on its own. Mike 2026-09-17: the
    // observatory tray was auto-opening over the front door on every
    // visit. It opens on the chip, on /ai in the bar, or on #my-ai.
    if (location.hash === '#my-ai' && !/^\/me(?:\/|$)/.test(location.pathname)) {
      setTimeout(function () { if (!openPopover) openTray('my-ai'); }, 250);
    }
    scope.cleanup(function () {
      document.documentElement.classList.remove('pc-dock-open');
      root.querySelectorAll('.fb__tray').forEach(function (tray) {
        tray.removeAttribute('data-open');
        tray.hidden = true;
      });
      if ($menu) {
        $menu.removeAttribute('data-open');
        $menu.hidden = true;
      }
      if ($menuBtn) $menuBtn.setAttribute('aria-expanded', 'false');
      if ($you) $you.setAttribute('aria-expanded', 'false');
    });
}
