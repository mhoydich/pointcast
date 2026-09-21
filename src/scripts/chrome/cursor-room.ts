// @ts-nocheck
import { fetchPreview, firstUrl, tidyText } from '../../lib/shortwave-client';
export function mountCursorRoom(ROOT, scope) {
    const {
      on, setTimeout, clearTimeout, setInterval, clearInterval,
      requestAnimationFrame, cancelAnimationFrame,
    } = scope;
    const WebSocket = function (url, protocols) {
      return scope.openWebSocket(url, protocols);
    };
    'use strict';

    var CHAT_STORAGE = 'pc:room:chat-log';
    var ON_STORAGE = 'pc:room:on';
    var SID_STORAGE = 'pc:room:sid';
    var MAX_LOG = 20;
    var BUBBLE_TTL_MS = 8_000;
    var CURSOR_SEND_MIN_MS = 66; // ≤15 Hz outbound
    var PEER_STALE_MS = 20_000;
    var PEER_LERP = 0.22; // smoother than the self-cursor's 0.35

    var $cursor  = ROOT.querySelector('[data-pc-ref="cr-cursor"]');
    var $noun    = ROOT.querySelector('[data-pc-ref="cr-cursor-noun"]');
    var $bubble  = ROOT.querySelector('[data-pc-ref="cr-cursor-bubble"]');
    var $tag     = ROOT.querySelector('[data-pc-ref="cr-cursor-tag"]');
    var $peers   = ROOT.querySelector('[data-pc-ref="cr-peers"]');
    var $log     = ROOT.querySelector('[data-pc-ref="cr-log"]');
    var $logList = ROOT.querySelector('[data-pc-ref="cr-log-list"]');
    var $logHead = ROOT.querySelector('[data-pc-ref="cr-log-head-label"]');

    var state = {
      on: false,
      targetX: 0,
      targetY: 0,
      renderX: 0,
      renderY: 0,
      hasMouse: false,
      sid: null,
      ws: null,
      wsState: 'idle',           // idle | connecting | open | closed
      wsBackoffMs: 800,
      burstWs: null,
      burstWsState: 'idle',
      burstBackoffMs: 800,
      burstReconnectTimer: null,
      burstPingTimer: null,
      burstPrimed: false,
      lastCursorSentAt: 0,
      pingTimer: null,
      peerCount: 0,
      seenChatKeys: {},          // server id; sid|at|msg fallback for old peers
      seenBurstKeys: {}
    };
    var bubbleTimeout = null;
    /** @type {Record<string, {el:HTMLElement, img:HTMLImageElement, bub:HTMLElement, tag:HTMLElement, tx:number, ty:number, rx:number, ry:number, nounId:number, tagText:string, lastAt:number, msg:string, msgAt:number}>} */
    var peers = {};

    // ─── persistence ────────────────────────────────────────────
    function chatStorageKey() {
      var explicitRoomKey = ROOT.getAttribute('data-room-key');
      return explicitRoomKey
        ? CHAT_STORAGE + ':' + encodeURIComponent(explicitRoomKey).slice(0, 220)
        : CHAT_STORAGE;
    }
    function loadLog() {
      try {
        var raw = sessionStorage.getItem(chatStorageKey());
        if (!raw) return [];
        var p = JSON.parse(raw);
        return Array.isArray(p) ? p.slice(-MAX_LOG) : [];
      } catch (e) { return []; }
    }
    function saveLog(log) {
      try { sessionStorage.setItem(chatStorageKey(), JSON.stringify(log.slice(-MAX_LOG))); } catch (e) {}
    }
    // Sprint 29 (Mike 2026-04-24: "yah have the cursor on by default"):
    // Room defaults to ON for first-time visitors. The stored value
    // is three-state now:
    //   '1'        → user explicitly turned it on
    //   '0'        → user explicitly turned it off
    //   null / ''  → no prior preference, default ON
    // The "turn off" button still works and writes '0' which persists
    // across reloads so someone who doesn't want the cursor room can
    // opt out and stay out.
    function loadOn() {
      try {
        var v = localStorage.getItem(ON_STORAGE);
        if (v === '0') return false;          // user opted out
        if (v === '1') return true;           // user opted in
        return true;                          // default: ON
      } catch (e) { return true; }
    }
    function saveOn(on) {
      try { localStorage.setItem(ON_STORAGE, on ? '1' : '0'); } catch (e) {}
    }
    function getSid() {
      try {
        var s = localStorage.getItem(SID_STORAGE);
        if (s) return s;
        s = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
          : 's-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SID_STORAGE, s);
        return s;
      } catch (e) {
        return 's-' + Date.now().toString(36);
      }
    }

    // ─── wallet / noun resolution ───────────────────────────────
    function resolveMeTag() {
      try {
        var activeAddr = localStorage.getItem('pc:wallet-active');
        if (activeAddr) return activeAddr.slice(0, 6) + '…' + activeAddr.slice(-4);
      } catch (e) {}
      return 'visitor';
    }

    function mySeedNoun() {
      return parseInt(ROOT.getAttribute('data-seed-noun') || '0', 10) || 0;
    }

    function refreshMe() {
      if ($tag) $tag.textContent = resolveMeTag();
      if ($noun) $noun.src = 'https://noun.pics/' + mySeedNoun() + '.svg';
    }

    // ─── log render ─────────────────────────────────────────────
    function renderLog() {
      if (!$logList) return;
      var log = loadLog();
      $logList.innerHTML = '';
      if (log.length === 0) {
        // An empty room has no useful ticker content. Keep the presence
        // connection alive, but do not leave an orphaned status card above
        // the footer on every page.
        $log.hidden = true;
        return;
      }
      $log.hidden = false;
      if ($logHead) $logHead.textContent = state.on ? (state.peerCount ? ('ROOM · ' + state.peerCount + ' HERE') : 'ROOM · RECENT') : 'ROOM · RECENT';
      // Show the last 5 lines in the ticker.
      log.slice(-5).forEach(function (entry) {
        var li = document.createElement('li');
        li.className = 'cr-log__line';
        var who = document.createElement('span');
        who.className = 'cr-log__who mono';
        who.textContent = entry.who || 'visitor';
        var msg = document.createElement('span');
        msg.className = 'cr-log__msg';
        // One readable line: a place instead of coordinates, a title instead of a long link.
        msg.textContent = tidyText(entry.msg);
        (function (el, raw) {
          var url = firstUrl(raw);
          if (url) fetchPreview(url).then(function (preview) { if (preview && el.isConnected) el.textContent = tidyText(raw, preview); });
        })(msg, String(entry.msg || ''));
        li.appendChild(who);
        li.appendChild(msg);
        $logList.appendChild(li);
      });
      window.dispatchEvent(new CustomEvent('pc:room:log-update', { detail: { log: log } }));
      // The ticker is a notification, not furniture: it shows for new lines,
      // then tucks away so it stops covering the page. Hover keeps it open.
      var newest = log[log.length - 1];
      var newestKey = newest ? String(newest.id || '') + '|' + String(newest.at || '') + '|' + String(newest.msg || '') : '';
      if (state.logNewestKey === undefined) {
        // First paint: these are lines from before you arrived. Stay tucked until something new is said.
        state.logNewestKey = newestKey;
        $log.setAttribute('data-tucked', 'true');
      } else if (newestKey !== state.logNewestKey) {
        state.logNewestKey = newestKey;
        $log.removeAttribute('data-tucked');
        if (state.logTuckTimer) clearTimeout(state.logTuckTimer);
        state.logTuckTimer = setTimeout(function tuck() {
          if ($log.matches(':hover')) { state.logTuckTimer = setTimeout(tuck, 4000); return; }
          $log.setAttribute('data-tucked', 'true');
        }, 14000);
      }
    }

    function pushLocalLogEntry(entry) {
      var log = loadLog();
      var key = entry.id ? ('id:' + entry.id) : ((entry.sid || '') + '|' + (entry.at || 0) + '|' + entry.msg);
      if (state.seenChatKeys[key]) return false;
      state.seenChatKeys[key] = 1;
      log.push(entry);
      saveLog(log);
      return true;
    }

    // ─── cursor motion ──────────────────────────────────────────
    function onMouseMove(e) {
      state.targetX = e.clientX;
      state.targetY = e.clientY;
      state.hasMouse = true;
      if (state.on && !window.matchMedia('(hover: none), (pointer: coarse)').matches) {
        $cursor.style.display = 'block';
        document.documentElement.classList.add('cr-cursor-active');
      }
      maybeSendCursor();
    }

    function maybeSendCursor() {
      if (state.wsState !== 'open') return;
      var now = Date.now();
      if (now - state.lastCursorSentAt < CURSOR_SEND_MIN_MS) return;
      var vw = window.innerWidth || 1;
      var vh = window.innerHeight || 1;
      var nx = Math.max(0, Math.min(10000, Math.round(state.targetX / vw * 10000)));
      var ny = Math.max(0, Math.min(10000, Math.round(state.targetY / vh * 10000)));
      try {
        state.ws.send(JSON.stringify({ type: 'cursor', x: nx, y: ny }));
        state.lastCursorSentAt = now;
      } catch (e) {}
    }

    function animate() {
      // Smooth trailing cursor — lerp at ~0.35 toward target.
      if (state.hasMouse && state.on) {
        state.renderX += (state.targetX - state.renderX) * 0.35;
        state.renderY += (state.targetY - state.renderY) * 0.35;
        $cursor.style.transform = 'translate3d(' + (state.renderX - 16) + 'px, ' + (state.renderY - 16) + 'px, 0)';
      }
      // Interpolate peer positions toward broadcast target.
      var vw = window.innerWidth || 1;
      var vh = window.innerHeight || 1;
      var now = Date.now();
      for (var k in peers) {
        if (!peers.hasOwnProperty(k)) continue;
        var p = peers[k];
        // Expire stale peers (no cursor update in N ms).
        if (now - p.lastAt > PEER_STALE_MS) {
          if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
          delete peers[k];
          continue;
        }
        var pxTarget = (p.tx / 10000) * vw;
        var pyTarget = (p.ty / 10000) * vh;
        p.rx += (pxTarget - p.rx) * PEER_LERP;
        p.ry += (pyTarget - p.ry) * PEER_LERP;
        p.el.style.transform = 'translate3d(' + (p.rx - 14) + 'px, ' + (p.ry - 14) + 'px, 0)';
        // Fade bubble after 6s then hide after 8s.
        if (p.msgAt && now - p.msgAt > 8_000) {
          p.bub.hidden = true;
          p.msg = '';
          p.msgAt = 0;
        } else if (p.msgAt && now - p.msgAt > 6_000) {
          p.bub.classList.add('cr-peer__bubble--leaving');
        }
      }
      requestAnimationFrame(animate);
    }

    // ─── peer render ────────────────────────────────────────────
    function ensurePeer(sid, nounId, tagText) {
      var p = peers[sid];
      if (p) {
        if (nounId !== p.nounId) {
          p.nounId = nounId;
          p.img.src = 'https://noun.pics/' + nounId + '.svg';
        }
        if (tagText !== p.tagText) {
          p.tagText = tagText;
          p.tag.textContent = tagText;
        }
        return p;
      }
      var el = document.createElement('div');
      el.className = 'cr-peer';
      var img = document.createElement('img');
      img.className = 'cr-peer__noun';
      img.alt = '';
      img.width = 28;
      img.height = 28;
      img.src = 'https://noun.pics/' + nounId + '.svg';
      var tag = document.createElement('div');
      tag.className = 'cr-peer__tag mono';
      tag.textContent = tagText;
      var bub = document.createElement('div');
      bub.className = 'cr-peer__bubble';
      bub.hidden = true;
      el.appendChild(img);
      el.appendChild(tag);
      el.appendChild(bub);
      if ($peers) $peers.appendChild(el);
      p = peers[sid] = {
        el: el, img: img, bub: bub, tag: tag,
        tx: 0, ty: 0, rx: 0, ry: 0,
        nounId: nounId, tagText: tagText,
        lastAt: Date.now(),
        msg: '', msgAt: 0
      };
      return p;
    }

    function showPeerBubble(sid, msg) {
      var p = peers[sid];
      if (!p) return;
      p.bub.textContent = msg;
      p.bub.hidden = false;
      p.bub.classList.remove('cr-peer__bubble--leaving');
      p.msg = msg;
      p.msgAt = Date.now();
    }

    // ─── chat bubble (self) ─────────────────────────────────────
    function showBubble(msg) {
      if (!$bubble) return;
      $bubble.textContent = msg;
      $bubble.hidden = false;
      $bubble.classList.remove('cr-cursor__bubble--leaving');
      if (bubbleTimeout) clearTimeout(bubbleTimeout);
      bubbleTimeout = setTimeout(function () {
        $bubble.classList.add('cr-cursor__bubble--leaving');
        setTimeout(function () {
          $bubble.hidden = true;
          $bubble.classList.remove('cr-cursor__bubble--leaving');
        }, 500);
      }, BUBBLE_TTL_MS);
    }

    // ─── ws lifecycle ───────────────────────────────────────────
    function openSocket() {
      if (state.ws || state.wsState === 'connecting' || state.wsState === 'open') return;
      var proto = location.protocol === 'https:' ? 'wss' : 'ws';
      var sid = state.sid || getSid();
      state.sid = sid;
      var roomKeyValue = ROOT.getAttribute('data-room-key') || location.pathname;
      var url = proto + '://' + location.host + '/api/room?url=' + encodeURIComponent(roomKeyValue) +
                '&sid=' + encodeURIComponent(sid) + '&kind=human';
      state.wsState = 'connecting';
      var ws;
      try { ws = new WebSocket(url); }
      catch (e) { state.wsState = 'closed'; scheduleReconnect(); return; }
      state.ws = ws;

      on(ws, 'open', function () {
        state.wsState = 'open';
        state.wsBackoffMs = 800;
        // Handshake: identify self with nounId + tag. Server will merge
        // with any existing visitor row on this sessionId.
        try {
          ws.send(JSON.stringify({
            type: 'identify',
            nounId: mySeedNoun(),
            tag: resolveMeTag()
          }));
        } catch (e) {}
        // Keepalive ping every 30s — well below the 90s idle cutoff.
        if (state.pingTimer) clearInterval(state.pingTimer);
        state.pingTimer = setInterval(function () {
          if (state.wsState !== 'open') return;
          try { ws.send(JSON.stringify({ type: 'ping' })); } catch (e) {}
        }, 30_000);
      });

      on(ws, 'message', function (ev) {
        if (typeof ev.data !== 'string') return;
        var payload;
        try { payload = JSON.parse(ev.data); } catch (e) { return; }
        applyServerPayload(payload);
      });

      on(ws, 'close', function () {
        // An intentionally replaced socket may close after its successor opens.
        // Only the currently active socket is allowed to mutate connection state.
        if (state.ws !== ws) return;
        state.wsState = 'closed';
        state.ws = null;
        if (state.pingTimer) { clearInterval(state.pingTimer); state.pingTimer = null; }
        if (state.on) scheduleReconnect();
      });
      on(ws, 'error', function () {
        try { ws.close(); } catch (e) {}
      });
    }

    function burstKey(burst) {
      var by = burst && burst.by || {};
      return [burst && burst.kind, burst && burst.at, by.handle || '', by.noun == null ? '' : by.noun].join('|');
    }

    function showBurst(burst) {
      if (!burst || typeof burst.kind !== 'string' || typeof burst.at !== 'number') return;
      window.dispatchEvent(new CustomEvent('pc:burst:seen', { detail: burst }));
      var ownCast = burst.kind === 'cast' && burst.meta && burst.meta.clientId === (state.sid || '').slice(0, 96);
      if (!ownCast && Date.now() - burst.at < 10_000) {
        window.dispatchEvent(new CustomEvent('pc:burst', { detail: burst }));
      }
    }

    // ─── attendance (the town socket) ───────────────────────────
    function townNoun() {
      var m = String((document.querySelector('[data-pc-ref="fb-noun"]') || {}).src || '').match(/(\d+)\.svg/);
      var n = m ? parseInt(m[1], 10) : mySeedNoun();
      return n >= 0 && n < 1200 ? n : mySeedNoun();
    }
    function townPath() { var p = String(location.pathname || '/'); return /^\/[A-Za-z0-9/_\-.]*$/.test(p) && p.indexOf('//') === -1 && p.length <= 200 ? p : '/'; }
    function sendTown(type) {
      if (state.burstWsState !== 'open' || !state.burstWs) return;
      var mood = ''; try { mood = String(localStorage.getItem('pc:music:mood') || '').slice(0, 32); } catch (e) {}
      try { state.burstWs.send(JSON.stringify({ type: type, nounId: townNoun(), tag: resolveMeTag(), mood: mood, listening: townListening(), currentPath: townPath() })); } catch (e) {}
    }
    // What this visitor said they have on (the front door's Music on shelf writes
    // it, only after they press Tell the town). A song is short: after an hour
    // the label goes stale and the town stops showing it. '' clears it server-side.
    // The companion: with pc:music:auto set, the label keeps itself current instead of
    // waiting for a pasted link. 'station' = the broadcaster's on-air track (public
    // /now-playing.json); 'personal' = this signed-in visitor's own Spotify
    // (/api/me/spotify, their session only). Both are opt-in switches the visitor
    // flips on /station or /me; off-air or paused means no label.
    var autoLabel = '', autoTimer = 0;
    function autoMode() { try { var m = localStorage.getItem('pc:music:auto'); return m === 'station' || m === 'personal' ? m : ''; } catch (e) { return ''; } }
    function pollAuto() {
      var mode = autoMode();
      if (!mode) { if (autoLabel) { autoLabel = ''; sendTown('update'); } return; }
      if (document.visibilityState !== 'visible') return;
      fetch(mode === 'station' ? '/now-playing.json' : '/api/me/spotify', { headers: { accept: 'application/json' }, credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          var t = mode === 'station' ? (j && j.live ? j : null) : (j && j.connected && j.track && j.track.isPlaying !== false && j.status !== 'paused' ? j.track : null);
          var title = t ? String(t.title || t.name || '') : '', artist = t ? String(t.artist || '') : '';
          var next = title ? (artist ? title + ' — ' + artist : title).replace(/\s+/g, ' ').trim().slice(0, 120) : '';
          if (next !== autoLabel) { autoLabel = next; sendTown('update'); window.dispatchEvent(new CustomEvent('pc:music:auto-label', { detail: { label: next, mode: mode } })); }
        }).catch(function () {});
    }
    function armAuto() { clearInterval(autoTimer); autoTimer = 0; if (autoMode()) { pollAuto(); autoTimer = setInterval(pollAuto, 75000); } else pollAuto(); }
    on(window, 'pc:music:auto', armAuto);
    on(document, 'visibilitychange', function () { if (document.visibilityState === 'visible' && autoMode()) pollAuto(); });
    setTimeout(armAuto, 3000);

    function townListening() {
      if (autoMode() && autoLabel) return autoLabel;
      try {
        var rec = JSON.parse(localStorage.getItem('pc:music:listening') || 'null');
        if (!rec || typeof rec.label !== 'string' || !(Date.now() - Number(rec.at) < 3600000)) return '';
        return rec.label.replace(/\s+/g, ' ').trim().slice(0, 120);
      } catch (e) { return ''; }
    }
    on(window, 'pc:music:listening', function () { setTimeout(function () { sendTown('update'); }, 50); });
    on(window, 'pc:mood-changed', function () { setTimeout(function () { sendTown('update'); }, 50); });
    on(window, 'pc:wallet-change', function () { setTimeout(function () { sendTown('update'); }, 400); });
    // The bar and the front door ask the town socket to carry a wave or a vibe.
    on(window, 'pc:presence:send', function (e) {
      var d = (e && e.detail) || {};
      // wave, vibe, or a drum hit (the only signal the page may send on the town socket)
      if (d.type !== 'wave' && d.type !== 'vibe' && !(d.type === 'signal' && /^drum:(kick|bloom|dew|thorn)$/.test(String(d.event || '')))) return;
      if (state.burstWsState !== 'open' || !state.burstWs) return;
      try { state.burstWs.send(JSON.stringify(d)); } catch (err) {}
    });

    function applyBurstPayload(payload) {
      if (payload && Array.isArray(payload.sessions)) {
        window.dispatchEvent(new CustomEvent('pc:presence', { detail: { humans: payload.humans || 0, agents: payload.agents || 0, sessions: payload.sessions, waves: payload.waves || [], vibes: payload.vibes || [], signals: payload.signals || [], mySid: String(state.sid || '').slice(0, 8), you: payload.you || null, myNoun: townNoun(), myPath: townPath() } }));
      }
      if (!payload || !Array.isArray(payload.bursts)) return;
      var fresh = [];
      for (var i = 0; i < payload.bursts.length; i++) {
        var burst = payload.bursts[i];
        var key = burstKey(burst);
        if (!key || state.seenBurstKeys[key]) continue;
        state.seenBurstKeys[key] = 1;
        fresh.push(burst);
      }
      if (!fresh.length) { state.burstPrimed = true; return; }
      if (!state.burstPrimed) {
        state.burstPrimed = true;
        var newest = fresh[fresh.length - 1];
        if (Date.now() - newest.at < 10_000) showBurst(newest);
        return;
      }
      fresh.forEach(showBurst);
    }

    function openBurstSocket() {
      if (state.burstWs || state.burstWsState === 'connecting' || state.burstWsState === 'open') return;
      var proto = location.protocol === 'https:' ? 'wss' : 'ws';
      var sid = state.sid || getSid();
      state.sid = sid;
      state.burstWsState = 'connecting';
      var ws;
      try { ws = new WebSocket(proto + '://' + location.host + '/api/burst?sid=' + encodeURIComponent(sid) + '&kind=human'); }
      catch (e) { state.burstWsState = 'closed'; scheduleBurstReconnect(); return; }
      state.burstWs = ws;
      on(ws, 'open', function () {
        state.burstWsState = 'open';
        state.burstBackoffMs = 800;
        // Attendance: tell the town which Noun this is, its mood and its page,
        // so faces match posts everywhere and people can find each other.
        sendTown('identify');
        if (state.burstPingTimer) clearInterval(state.burstPingTimer);
        state.burstPingTimer = setInterval(function () {
          if (state.burstWsState === 'open') try { ws.send(JSON.stringify({ type: 'ping' })); } catch (e) {}
        }, 30_000);
      });
      on(ws, 'message', function (event) {
        if (typeof event.data !== 'string') return;
        try { applyBurstPayload(JSON.parse(event.data)); } catch (e) {}
      });
      on(ws, 'close', function () {
        if (state.burstWs !== ws) return;
        state.burstWs = null;
        state.burstWsState = 'closed';
        if (state.burstPingTimer) { clearInterval(state.burstPingTimer); state.burstPingTimer = null; }
        if (state.on) scheduleBurstReconnect();
      });
      on(ws, 'error', function () { try { ws.close(); } catch (e) {} });
    }

    function scheduleBurstReconnect() {
      if (!state.on || state.burstReconnectTimer) return;
      var delay = state.burstBackoffMs;
      state.burstBackoffMs = Math.min(10_000, Math.round(state.burstBackoffMs * 1.8));
      state.burstReconnectTimer = setTimeout(function () {
        state.burstReconnectTimer = null;
        if (state.on) openBurstSocket();
      }, delay);
    }

    function closeBurstSocket() {
      if (state.burstReconnectTimer) { clearTimeout(state.burstReconnectTimer); state.burstReconnectTimer = null; }
      if (state.burstPingTimer) { clearInterval(state.burstPingTimer); state.burstPingTimer = null; }
      if (state.burstWs) { try { state.burstWs.close(1000, 'room off'); } catch (e) {} }
      state.burstWs = null;
      state.burstWsState = 'closed';
    }

    function postBurst(detail) {
      if (!detail || !detail.kind) return;
      var sid = state.sid || getSid();
      state.sid = sid;
      var suppliedBy = detail.by && typeof detail.by === 'object' ? detail.by : null;
      var meta = detail.meta && typeof detail.meta === 'object' ? Object.assign({}, detail.meta) : {};
      if (detail.kind === 'cast') meta.clientId = sid.slice(0, 96);
      fetch('/api/burst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: detail.kind,
          clientId: sid,
          by: suppliedBy || { handle: resolveMeTag(), noun: mySeedNoun() },
          meta: meta,
        }),
        keepalive: true,
      }).catch(function () {});
    }

    function closeSocket() {
      if (state.pingTimer) { clearInterval(state.pingTimer); state.pingTimer = null; }
      if (state.ws) {
        try { state.ws.close(1000, 'room off'); } catch (e) {}
      }
      state.ws = null;
      state.wsState = 'closed';
      // Sweep peer DOM.
      for (var k in peers) {
        if (!peers.hasOwnProperty(k)) continue;
        var p = peers[k];
        if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
      }
      peers = {};
      state.peerCount = 0;
      closeBurstSocket();
    }

    function scheduleReconnect() {
      if (!state.on) return;
      var delay = state.wsBackoffMs;
      state.wsBackoffMs = Math.min(10_000, Math.round(state.wsBackoffMs * 1.8));
      setTimeout(function () { if (state.on) openSocket(); }, delay);
    }

    function applyServerPayload(payload) {
      if (!payload || typeof payload !== 'object') return;
      // Apply peer positions.
      var seen = {};
      if (Array.isArray(payload.peers)) {
        for (var i = 0; i < payload.peers.length; i++) {
          var pv = payload.peers[i];
          if (!pv || typeof pv.sessionId !== 'string') continue;
          var p = ensurePeer(pv.sessionId, pv.nounId | 0, String(pv.tag || 'visitor'));
          p.tx = pv.x | 0;
          p.ty = pv.y | 0;
          p.lastAt = pv.at || Date.now();
          // First time seeing a peer — snap to its current position so it
          // doesn't lerp in from (0,0) which looks busted.
          if (p.rx === 0 && p.ry === 0) {
            var vw = window.innerWidth || 1;
            var vh = window.innerHeight || 1;
            p.rx = (p.tx / 10000) * vw;
            p.ry = (p.ty / 10000) * vh;
          }
          seen[pv.sessionId] = 1;
        }
      }
      // Prune peers that vanished from this broadcast and have no recent cursor.
      var now = Date.now();
      for (var k in peers) {
        if (!peers.hasOwnProperty(k)) continue;
        if (seen[k]) continue;
        if (now - peers[k].lastAt > PEER_STALE_MS) {
          var q = peers[k];
          if (q.el && q.el.parentNode) q.el.parentNode.removeChild(q.el);
          delete peers[k];
        }
      }
      state.peerCount = 0;
      for (var kk in peers) if (peers.hasOwnProperty(kk)) state.peerCount++;

      // Apply chat log.
      if (Array.isArray(payload.chat)) {
        var changed = false;
        for (var j = 0; j < payload.chat.length; j++) {
          var c = payload.chat[j];
          if (!c || typeof c.msg !== 'string') continue;
          if (pushLocalLogEntry(c)) {
            changed = true;
            // Attach the last message to a peer bubble so you can see
            // who just said it hovering above their cursor.
            var peerSid = c.sid;
            if (peerSid && peers[peerSid]) showPeerBubble(peerSid, c.msg);
          }
        }
        if (changed) renderLog();
        else renderLog(); // still refresh header count
      } else {
        renderLog();
      }
    }

    // ─── toggle on/off ──────────────────────────────────────────
    function setRoomOn(on) {
      state.on = on;
      ROOT.setAttribute('data-on', on ? 'true' : 'false');
      if (on) {
        var canShowCursor = state.hasMouse && !window.matchMedia('(hover: none), (pointer: coarse)').matches;
        $cursor.style.display = canShowCursor ? 'block' : 'none';
        document.documentElement.classList.toggle('cr-cursor-active', canShowCursor);
        refreshMe();
        if (!state.sid) state.sid = getSid();
        openSocket();
        openBurstSocket();
        renderLog();
      } else {
        $cursor.style.display = 'none';
        document.documentElement.classList.remove('cr-cursor-active');
        $log.hidden = true;
        closeSocket();
      }
      saveOn(on);
    }

    // ─── chat submit ────────────────────────────────────────────
    function submitChat(msg) {
      msg = String(msg || '').trim().slice(0, 120);
      if (!msg) return;
      // Always show locally so the sender sees their bubble even if WS is down.
      showBubble(msg);
      var entry = {
        who: resolveMeTag(),
        nounId: mySeedNoun(),
        msg: msg,
        at: Date.now(),
        sid: (state.sid || '').slice(0, 8)
      };
      // Connected messages enter the ticker only when the server assigns an
      // id and echoes them. Offline messages keep the old local fallback.
      if (state.wsState === 'open' && state.ws) {
        try { state.ws.send(JSON.stringify({ type: 'chat', msg: msg })); } catch (e) {}
      } else {
        pushLocalLogEntry(entry);
        renderLog();
      }
    }

    // ─── event bus ──────────────────────────────────────────────
    on(window, 'pc:room:toggle', function (e) {
      var on = !!(e && e.detail && e.detail.on);
      setRoomOn(on);
    });
    on(window, 'pc:room:chat', function (e) {
      var msg = e && e.detail && e.detail.msg;
      if (msg) submitChat(msg);
    });
    // Shortwave posts from anywhere in town echo into this ticker so they
    // are seen on screen, not only on /shortwave. Own posts already arrive
    // through submitChat; repeats of a recent line are dropped.
    on(window, 'pc:shortwave:post', function (e) {
      var d = (e && e.detail) || {};
      var p = d.post;
      if (!p || d.own) return;
      var msg = String(p.text || '').slice(0, 120);
      if (!msg) return;
      // Someone on this same page also arrives as a room chat line. Let that
      // land first, then only add the post if the ticker does not have it.
      setTimeout(function () {
        if (loadLog().slice(-8).some(function (x) { return x && x.msg === msg; })) return;
        if (pushLocalLogEntry({ id: 'sw:' + p.id, who: '◉ ' + String(p.who || 'visitor').slice(0, 24), nounId: p.noun || 0, msg: msg, at: Date.parse(p.at) || Date.now() })) renderLog();
      }, 1500);
    });
    on(window, 'pc:burst:request', function (e) {
      postBurst(e && e.detail);
    });
    on(window, 'pc:spell:cast', function (e) {
      var detail = e && e.detail || {};
      if (!state.on) return;
      if (detail.source !== 'magic-word' && detail.source !== 'dock') return;
      if (!/^(confetti|rain|cat|breath)$/.test(String(detail.id || ''))) return;
      postBurst({ kind: 'cast', meta: { spell: detail.id, label: detail.id, color: '#a78bfa' } });
    });
    on(window, 'pc:room:key', function (e) {
      var nextKey = String(e && e.detail && e.detail.key || '').trim().slice(0, 256);
      if (!/^\/[A-Za-z0-9/_-]+$/.test(nextKey)) return;
      if (ROOT.getAttribute('data-room-key') === nextKey) return;
      ROOT.setAttribute('data-room-key', nextKey);
      state.seenChatKeys = {};
      if (state.on) {
        closeSocket();
        state.wsBackoffMs = 800;
        openSocket();
        openBurstSocket();
      }
      renderLog();
    });
    on(window, 'pc:wallet-change', refreshMe);

    on(document, 'mousemove', function (e) {
      if (state.on) onMouseMove(e);
    }, { passive: true });

    on(window, 'beforeunload', closeSocket);
    scope.cleanup(function () {
      closeSocket();
      if ($cursor) $cursor.style.display = 'none';
      document.documentElement.classList.remove('cr-cursor-active');
    });

    // Boot: if previously on, turn on again.
    if (loadOn()) setRoomOn(true);
    animate();
}
