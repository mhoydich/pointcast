import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, d as defineScriptVars, b as addAttribute, m as maybeRenderHead, r as renderComponent } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import 'clsx';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

var __freeze$2 = Object.freeze;
var __defProp$2 = Object.defineProperty;
var __template$2 = (cooked, raw) => __freeze$2(__defProp$2(cooked, "raw", { value: __freeze$2(raw || cooked.slice()) }));
var _a$2;
const $$HereGrid = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$HereGrid;
  const { cap = 64 } = Astro2.props;
  return renderTemplate(_a$2 || (_a$2 = __template$2(["", '<section class="here-grid"', ' data-astro-cid-y5u72ry5> <header class="here-grid__head" data-astro-cid-y5u72ry5> <p class="here-grid__kicker mono" data-astro-cid-y5u72ry5> <span id="here-grid-total" data-astro-cid-y5u72ry5>1</span> HERE\n<span class="here-grid__sep" aria-hidden="true" data-astro-cid-y5u72ry5>·</span> <span id="here-grid-moods" data-astro-cid-y5u72ry5>—</span> </p> <p class="here-grid__time mono" id="here-grid-time" data-astro-cid-y5u72ry5>connecting…</p> </header> <ol class="here-grid__cells" id="here-grid-cells" aria-label="Visitors connected now" data-astro-cid-y5u72ry5>  <li class="here-cell here-cell--you" data-you="true" data-astro-cid-y5u72ry5> <span class="here-cell__ring" aria-hidden="true" data-astro-cid-y5u72ry5></span> <img class="here-cell__noun" id="here-grid-you-img" alt="" src="" loading="eager" data-astro-cid-y5u72ry5> <span class="here-cell__label mono" data-astro-cid-y5u72ry5>YOU</span> </li> </ol> <p class="here-grid__overflow mono" id="here-grid-overflow" hidden data-astro-cid-y5u72ry5>\n+ <span id="here-grid-overflow-count" data-astro-cid-y5u72ry5>0</span> MORE\n</p> <p class="here-grid__quiet mono" id="here-grid-quiet" data-astro-cid-y5u72ry5>\nwaiting for peoples · broadcast your presence by staying on the page\n</p>  <aside class="here-grid__footprint" id="here-grid-footprint" hidden aria-live="polite" data-astro-cid-y5u72ry5> <header class="here-grid__footprint-head mono" data-astro-cid-y5u72ry5> <span class="here-grid__footprint-dot" aria-hidden="true" data-astro-cid-y5u72ry5></span>\nYOUR FOOTPRINT · ONLY YOU SEE THIS\n</header> <dl class="here-grid__footprint-grid" id="here-grid-footprint-grid" data-astro-cid-y5u72ry5></dl> </aside> </section> <script>(function(){', `
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ---------- helpers -----------------------------------------------------
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function cheapHash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }
  function nounIdFor(id) { return cheapHash(String(id || '')) % 1200; }
  function escapeText(s) {
    var div = document.createElement('div');
    div.textContent = String(s == null ? '' : s);
    return div.innerHTML;
  }

  // ---------- identity ----------------------------------------------------
  var sessionId = lsGet('pc:session');
  if (!sessionId) {
    sessionId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('s' + Math.random().toString(36).slice(2) + Date.now().toString(36));
    lsSet('pc:session', sessionId);
  }
  var myNounId = nounIdFor(sessionId);
  lsSet('pc:visitor:noun', String(myNounId));

  // Paint YOU slot immediately.
  var youImg = document.getElementById('here-grid-you-img');
  if (youImg) {
    youImg.src = 'https://noun.pics/' + myNounId + '.svg';
    youImg.alt = 'you · noun ' + myNounId;
  }

  // ---------- DOM refs ----------------------------------------------------
  var cells = document.getElementById('here-grid-cells');
  var totalEl = document.getElementById('here-grid-total');
  var moodsEl = document.getElementById('here-grid-moods');
  var timeEl = document.getElementById('here-grid-time');
  var overflowEl = document.getElementById('here-grid-overflow');
  var overflowCountEl = document.getElementById('here-grid-overflow-count');
  var quietEl = document.getElementById('here-grid-quiet');
  var footprintEl = document.getElementById('here-grid-footprint');
  var footprintGridEl = document.getElementById('here-grid-footprint-grid');

  // ---------- rendering ---------------------------------------------------
  var visibleCap = Math.max(1, cap | 0);

  function timeStamp() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function aggregateMoods(sessions) {
    var counts = {};
    var unset = 0;
    for (var i = 0; i < sessions.length; i++) {
      var m = sessions[i].mood;
      if (m && typeof m === 'string' && m.trim()) {
        var key = m.toLowerCase().trim();
        counts[key] = (counts[key] || 0) + 1;
      } else {
        unset += 1;
      }
    }
    var pairs = Object.keys(counts).map(function (k) { return [k, counts[k]]; });
    pairs.sort(function (a, b) { return b[1] - a[1]; });
    var top = pairs.slice(0, 4).map(function (p) { return p[1] + ' ' + p[0]; });
    if (unset > 0) top.push(unset + ' unset');
    return top.length ? top.join(' · ') : '—';
  }

  var DEVICE_GLYPH = { mobile: '📱', tablet: '🟫', desktop: '🖥', bot: '🤖' };

  function countryFlag(cc) {
    if (!cc || typeof cc !== 'string' || cc.length !== 2) return null;
    var up = cc.toUpperCase();
    if (!/^[A-Z]{2}$/.test(up)) return null;
    var base = 0x1F1E6;
    return String.fromCodePoint(base + (up.charCodeAt(0) - 65)) +
           String.fromCodePoint(base + (up.charCodeAt(1) - 65));
  }

  function formatDwell(seconds) {
    var s = Math.max(0, seconds | 0);
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ' + (s % 60) + 's';
    var h = Math.floor(m / 60);
    return h + 'h ' + (m % 60) + 'm';
  }

  function appendFootprintRow(dl, label, value) {
    if (value === undefined || value === null || value === '') return;
    var dt = document.createElement('dt');
    dt.className = 'mono';
    dt.textContent = label;
    var dd = document.createElement('dd');
    dd.textContent = String(value);
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  function renderFootprint(you) {
    if (!footprintEl || !footprintGridEl) return;
    if (!you || typeof you !== 'object') {
      footprintEl.hidden = true;
      return;
    }
    footprintGridEl.innerHTML = '';

    var flag = countryFlag(you.country);
    var locParts = [];
    if (you.city) locParts.push(you.city);
    if (you.region && you.region !== you.city) locParts.push(you.region);
    if (you.country) locParts.push((flag ? flag + ' ' : '') + you.country);
    var location = locParts.join(', ');

    appendFootprintRow(footprintGridEl, 'NOUN', '#' + you.nounId + (you.isReturning ? ' · returning' : ' · first visit'));
    appendFootprintRow(footprintGridEl, 'LOCATION', location);
    appendFootprintRow(footprintGridEl, 'TIMEZONE', you.timezone);
    appendFootprintRow(footprintGridEl, 'DEVICE', you.deviceClass);
    if (you.asOrg || you.asn) {
      appendFootprintRow(footprintGridEl, 'NETWORK', (you.asOrg || '') + (you.asn ? ' · AS' + you.asn : ''));
    }
    appendFootprintRow(footprintGridEl, 'EDGE COLO', you.colo);
    appendFootprintRow(footprintGridEl, 'ARRIVED FROM', you.referrerHost);
    appendFootprintRow(footprintGridEl, 'RELAY TAG', you.relay);
    appendFootprintRow(footprintGridEl, 'HERE FOR', formatDwell(you.dwellSeconds));
    appendFootprintRow(footprintGridEl, 'CURRENT', you.where);
    if (Array.isArray(you.pathTrail) && you.pathTrail.length) {
      appendFootprintRow(footprintGridEl, 'TRAIL', you.pathTrail.join(' ← '));
    }
    appendFootprintRow(footprintGridEl, 'WALLET', you.walletAddress);
    appendFootprintRow(footprintGridEl, 'NOSTR', you.nostrPubkey);

    footprintEl.hidden = !footprintGridEl.childNodes.length;
  }

  function renderSessions(snapshot) {
    var sessions = Array.isArray(snapshot && snapshot.sessions) ? snapshot.sessions.slice() : [];
    var humans = (snapshot && typeof snapshot.humans === 'number') ? snapshot.humans : sessions.filter(function (s) { return s.kind === 'human'; }).length;
    var agents = (snapshot && typeof snapshot.agents === 'number') ? snapshot.agents : sessions.filter(function (s) { return s.kind === 'agent'; }).length;
    var total = humans + agents;

    // Total + moods header
    if (totalEl) totalEl.textContent = String(Math.max(total, 1));
    if (moodsEl) moodsEl.textContent = aggregateMoods(sessions);
    if (timeEl) timeEl.textContent = 'as of ' + timeStamp();

    // Find YOU in the array: match nounId + earliest joinedAt that is my own
    var myEntry = null;
    var myIndex = -1;
    var now = Date.now();
    var closestDelta = Infinity;
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].nounId === myNounId) {
        var jt = Date.parse(sessions[i].joinedAt || '') || 0;
        var delta = Math.abs(now - jt);
        if (delta < closestDelta) { closestDelta = delta; myEntry = sessions[i]; myIndex = i; }
      }
    }

    // Remove YOU from the "others" list for separate rendering.
    var others = sessions.slice();
    if (myIndex >= 0) others.splice(myIndex, 1);

    // Sort others: most recent joinedAt first (newer activity surfaces).
    others.sort(function (a, b) {
      return (Date.parse(b.joinedAt || '') || 0) - (Date.parse(a.joinedAt || '') || 0);
    });

    // Update YOU cell details (mood/listening/where if any).
    var youCell = cells && cells.querySelector('[data-you="true"]');
    if (youCell) decorateCell(youCell, myEntry, /* isYou */ true);

    // Clear existing non-YOU cells + re-render others.
    if (!cells) return;
    var existingOthers = cells.querySelectorAll('.here-cell:not(.here-cell--you)');
    for (var j = 0; j < existingOthers.length; j++) existingOthers[j].parentNode.removeChild(existingOthers[j]);

    var renderCount = Math.min(others.length, visibleCap - 1); // -1 for YOU
    for (var k = 0; k < renderCount; k++) {
      var cell = buildCell(others[k], /* isYou */ false);
      cells.appendChild(cell);
    }

    // Render YOUR FOOTPRINT card from the personalized \`you\` envelope (if present).
    renderFootprint(snapshot && snapshot.you);

    // Overflow + quiet states
    var overflow = others.length - renderCount;
    if (overflowEl) {
      if (overflow > 0) {
        overflowEl.hidden = false;
        if (overflowCountEl) overflowCountEl.textContent = String(overflow);
      } else {
        overflowEl.hidden = true;
      }
    }
    if (quietEl) quietEl.hidden = others.length > 0;
  }

  function buildCell(s, isYou) {
    var li = document.createElement('li');
    li.className = 'here-cell' + (isYou ? ' here-cell--you' : ' here-cell--other');
    if (isYou) li.setAttribute('data-you', 'true');
    if (s && s.kind) li.setAttribute('data-kind', String(s.kind));
    var ring = document.createElement('span');
    ring.className = 'here-cell__ring';
    ring.setAttribute('aria-hidden', 'true');
    li.appendChild(ring);
    var img = document.createElement('img');
    img.className = 'here-cell__noun';
    var nid = (s && typeof s.nounId === 'number') ? s.nounId : myNounId;
    img.src = 'https://noun.pics/' + nid + '.svg';
    img.alt = (isYou ? 'you · noun ' : 'visitor · noun ') + nid;
    img.loading = 'lazy';
    li.appendChild(img);
    var label = document.createElement('span');
    label.className = 'here-cell__label mono';
    label.textContent = isYou ? 'YOU' : String((s && s.kind) ? s.kind.toUpperCase() : 'HUMAN');
    li.appendChild(label);
    decorateCell(li, s, isYou);
    return li;
  }

  function decorateCell(cell, s, isYou) {
    // Remove existing mood/state chips before redecorating (YOU cell may re-decorate).
    var existing = cell.querySelectorAll('.here-cell__chip');
    for (var i = 0; i < existing.length; i++) cell.removeChild(existing[i]);
    if (!s) return;
    if (s.mood) {
      var chip = document.createElement('span');
      chip.className = 'here-cell__chip here-cell__chip--mood mono';
      chip.textContent = String(s.mood);
      cell.appendChild(chip);
    }
    if (s.listening) {
      var chip2 = document.createElement('span');
      chip2.className = 'here-cell__chip here-cell__chip--listening mono';
      chip2.textContent = '♪ ' + String(s.listening).slice(0, 40);
      chip2.title = String(s.listening);
      cell.appendChild(chip2);
    }
    if (s.where) {
      var chip3 = document.createElement('span');
      chip3.className = 'here-cell__chip here-cell__chip--where mono';
      chip3.textContent = '· ' + String(s.where).slice(0, 24);
      chip3.title = String(s.where);
      cell.appendChild(chip3);
    }
    if (!isYou) {
      var bits = [];
      var flag = countryFlag(s.country);
      if (flag) bits.push(flag + ' ' + s.country);
      else if (s.country) bits.push(s.country);
      if (s.deviceClass) {
        var g = DEVICE_GLYPH[s.deviceClass];
        bits.push((g ? g + ' ' : '') + s.deviceClass);
      }
      if (bits.length) {
        var chip4 = document.createElement('span');
        chip4.className = 'here-cell__chip here-cell__chip--edge mono';
        chip4.textContent = bits.join(' · ');
        cell.appendChild(chip4);
      }
    }
  }

  // ---------- initial snapshot --------------------------------------------
  fetch('/api/presence/snapshot', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j) renderSessions(j); })
    .catch(function () { /* ignore — WS will fill in */ });

  // ---------- WS live update ----------------------------------------------
  var ws = null;
  var reconnectDelay = 1000;
  var reconnectTimer = null;
  var pingTimer = null;

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, Math.min(reconnectDelay, 30000));
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  }

  function sendIdentify() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      var mood = lsGet('pc:visitor:mood') || null;
      var listening = lsGet('pc:visitor:listening') || null;
      var where = lsGet('pc:visitor:where') || null;
      ws.send(JSON.stringify({
        type: 'identify',
        kind: 'human',
        nounId: myNounId,
        mood: mood,
        listening: listening,
        where: where,
      }));
    } catch (e) { /* ignore */ }
  }

  function connect() {
    try {
      var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      var url = proto + '//' + location.host + '/api/presence?sid=' + encodeURIComponent(sessionId) + '&kind=human';
      ws = new WebSocket(url);
    } catch (e) {
      scheduleReconnect();
      return;
    }
    ws.addEventListener('open', function () {
      reconnectDelay = 1000;
      sendIdentify();
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = setInterval(function () {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 45000);
    });
    ws.addEventListener('message', function (ev) {
      try {
        var data = JSON.parse(ev.data);
        if (data && data.sessions) renderSessions(data);
      } catch (e) { /* ignore */ }
    });
    ws.addEventListener('close', function () {
      if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
      scheduleReconnect();
    });
    ws.addEventListener('error', function () { /* close handler reconnects */ });
  }

  connect();

  // Re-identify on visibility regain (mood/listening/where may have changed).
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ws && ws.readyState === WebSocket.OPEN) sendIdentify();
  });
})();
})();<\/script>`], ["", '<section class="here-grid"', ' data-astro-cid-y5u72ry5> <header class="here-grid__head" data-astro-cid-y5u72ry5> <p class="here-grid__kicker mono" data-astro-cid-y5u72ry5> <span id="here-grid-total" data-astro-cid-y5u72ry5>1</span> HERE\n<span class="here-grid__sep" aria-hidden="true" data-astro-cid-y5u72ry5>·</span> <span id="here-grid-moods" data-astro-cid-y5u72ry5>—</span> </p> <p class="here-grid__time mono" id="here-grid-time" data-astro-cid-y5u72ry5>connecting…</p> </header> <ol class="here-grid__cells" id="here-grid-cells" aria-label="Visitors connected now" data-astro-cid-y5u72ry5>  <li class="here-cell here-cell--you" data-you="true" data-astro-cid-y5u72ry5> <span class="here-cell__ring" aria-hidden="true" data-astro-cid-y5u72ry5></span> <img class="here-cell__noun" id="here-grid-you-img" alt="" src="" loading="eager" data-astro-cid-y5u72ry5> <span class="here-cell__label mono" data-astro-cid-y5u72ry5>YOU</span> </li> </ol> <p class="here-grid__overflow mono" id="here-grid-overflow" hidden data-astro-cid-y5u72ry5>\n+ <span id="here-grid-overflow-count" data-astro-cid-y5u72ry5>0</span> MORE\n</p> <p class="here-grid__quiet mono" id="here-grid-quiet" data-astro-cid-y5u72ry5>\nwaiting for peoples · broadcast your presence by staying on the page\n</p>  <aside class="here-grid__footprint" id="here-grid-footprint" hidden aria-live="polite" data-astro-cid-y5u72ry5> <header class="here-grid__footprint-head mono" data-astro-cid-y5u72ry5> <span class="here-grid__footprint-dot" aria-hidden="true" data-astro-cid-y5u72ry5></span>\nYOUR FOOTPRINT · ONLY YOU SEE THIS\n</header> <dl class="here-grid__footprint-grid" id="here-grid-footprint-grid" data-astro-cid-y5u72ry5></dl> </aside> </section> <script>(function(){', `
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ---------- helpers -----------------------------------------------------
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function cheapHash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }
  function nounIdFor(id) { return cheapHash(String(id || '')) % 1200; }
  function escapeText(s) {
    var div = document.createElement('div');
    div.textContent = String(s == null ? '' : s);
    return div.innerHTML;
  }

  // ---------- identity ----------------------------------------------------
  var sessionId = lsGet('pc:session');
  if (!sessionId) {
    sessionId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('s' + Math.random().toString(36).slice(2) + Date.now().toString(36));
    lsSet('pc:session', sessionId);
  }
  var myNounId = nounIdFor(sessionId);
  lsSet('pc:visitor:noun', String(myNounId));

  // Paint YOU slot immediately.
  var youImg = document.getElementById('here-grid-you-img');
  if (youImg) {
    youImg.src = 'https://noun.pics/' + myNounId + '.svg';
    youImg.alt = 'you · noun ' + myNounId;
  }

  // ---------- DOM refs ----------------------------------------------------
  var cells = document.getElementById('here-grid-cells');
  var totalEl = document.getElementById('here-grid-total');
  var moodsEl = document.getElementById('here-grid-moods');
  var timeEl = document.getElementById('here-grid-time');
  var overflowEl = document.getElementById('here-grid-overflow');
  var overflowCountEl = document.getElementById('here-grid-overflow-count');
  var quietEl = document.getElementById('here-grid-quiet');
  var footprintEl = document.getElementById('here-grid-footprint');
  var footprintGridEl = document.getElementById('here-grid-footprint-grid');

  // ---------- rendering ---------------------------------------------------
  var visibleCap = Math.max(1, cap | 0);

  function timeStamp() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function aggregateMoods(sessions) {
    var counts = {};
    var unset = 0;
    for (var i = 0; i < sessions.length; i++) {
      var m = sessions[i].mood;
      if (m && typeof m === 'string' && m.trim()) {
        var key = m.toLowerCase().trim();
        counts[key] = (counts[key] || 0) + 1;
      } else {
        unset += 1;
      }
    }
    var pairs = Object.keys(counts).map(function (k) { return [k, counts[k]]; });
    pairs.sort(function (a, b) { return b[1] - a[1]; });
    var top = pairs.slice(0, 4).map(function (p) { return p[1] + ' ' + p[0]; });
    if (unset > 0) top.push(unset + ' unset');
    return top.length ? top.join(' · ') : '—';
  }

  var DEVICE_GLYPH = { mobile: '📱', tablet: '🟫', desktop: '🖥', bot: '🤖' };

  function countryFlag(cc) {
    if (!cc || typeof cc !== 'string' || cc.length !== 2) return null;
    var up = cc.toUpperCase();
    if (!/^[A-Z]{2}$/.test(up)) return null;
    var base = 0x1F1E6;
    return String.fromCodePoint(base + (up.charCodeAt(0) - 65)) +
           String.fromCodePoint(base + (up.charCodeAt(1) - 65));
  }

  function formatDwell(seconds) {
    var s = Math.max(0, seconds | 0);
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ' + (s % 60) + 's';
    var h = Math.floor(m / 60);
    return h + 'h ' + (m % 60) + 'm';
  }

  function appendFootprintRow(dl, label, value) {
    if (value === undefined || value === null || value === '') return;
    var dt = document.createElement('dt');
    dt.className = 'mono';
    dt.textContent = label;
    var dd = document.createElement('dd');
    dd.textContent = String(value);
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  function renderFootprint(you) {
    if (!footprintEl || !footprintGridEl) return;
    if (!you || typeof you !== 'object') {
      footprintEl.hidden = true;
      return;
    }
    footprintGridEl.innerHTML = '';

    var flag = countryFlag(you.country);
    var locParts = [];
    if (you.city) locParts.push(you.city);
    if (you.region && you.region !== you.city) locParts.push(you.region);
    if (you.country) locParts.push((flag ? flag + ' ' : '') + you.country);
    var location = locParts.join(', ');

    appendFootprintRow(footprintGridEl, 'NOUN', '#' + you.nounId + (you.isReturning ? ' · returning' : ' · first visit'));
    appendFootprintRow(footprintGridEl, 'LOCATION', location);
    appendFootprintRow(footprintGridEl, 'TIMEZONE', you.timezone);
    appendFootprintRow(footprintGridEl, 'DEVICE', you.deviceClass);
    if (you.asOrg || you.asn) {
      appendFootprintRow(footprintGridEl, 'NETWORK', (you.asOrg || '') + (you.asn ? ' · AS' + you.asn : ''));
    }
    appendFootprintRow(footprintGridEl, 'EDGE COLO', you.colo);
    appendFootprintRow(footprintGridEl, 'ARRIVED FROM', you.referrerHost);
    appendFootprintRow(footprintGridEl, 'RELAY TAG', you.relay);
    appendFootprintRow(footprintGridEl, 'HERE FOR', formatDwell(you.dwellSeconds));
    appendFootprintRow(footprintGridEl, 'CURRENT', you.where);
    if (Array.isArray(you.pathTrail) && you.pathTrail.length) {
      appendFootprintRow(footprintGridEl, 'TRAIL', you.pathTrail.join(' ← '));
    }
    appendFootprintRow(footprintGridEl, 'WALLET', you.walletAddress);
    appendFootprintRow(footprintGridEl, 'NOSTR', you.nostrPubkey);

    footprintEl.hidden = !footprintGridEl.childNodes.length;
  }

  function renderSessions(snapshot) {
    var sessions = Array.isArray(snapshot && snapshot.sessions) ? snapshot.sessions.slice() : [];
    var humans = (snapshot && typeof snapshot.humans === 'number') ? snapshot.humans : sessions.filter(function (s) { return s.kind === 'human'; }).length;
    var agents = (snapshot && typeof snapshot.agents === 'number') ? snapshot.agents : sessions.filter(function (s) { return s.kind === 'agent'; }).length;
    var total = humans + agents;

    // Total + moods header
    if (totalEl) totalEl.textContent = String(Math.max(total, 1));
    if (moodsEl) moodsEl.textContent = aggregateMoods(sessions);
    if (timeEl) timeEl.textContent = 'as of ' + timeStamp();

    // Find YOU in the array: match nounId + earliest joinedAt that is my own
    var myEntry = null;
    var myIndex = -1;
    var now = Date.now();
    var closestDelta = Infinity;
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].nounId === myNounId) {
        var jt = Date.parse(sessions[i].joinedAt || '') || 0;
        var delta = Math.abs(now - jt);
        if (delta < closestDelta) { closestDelta = delta; myEntry = sessions[i]; myIndex = i; }
      }
    }

    // Remove YOU from the "others" list for separate rendering.
    var others = sessions.slice();
    if (myIndex >= 0) others.splice(myIndex, 1);

    // Sort others: most recent joinedAt first (newer activity surfaces).
    others.sort(function (a, b) {
      return (Date.parse(b.joinedAt || '') || 0) - (Date.parse(a.joinedAt || '') || 0);
    });

    // Update YOU cell details (mood/listening/where if any).
    var youCell = cells && cells.querySelector('[data-you="true"]');
    if (youCell) decorateCell(youCell, myEntry, /* isYou */ true);

    // Clear existing non-YOU cells + re-render others.
    if (!cells) return;
    var existingOthers = cells.querySelectorAll('.here-cell:not(.here-cell--you)');
    for (var j = 0; j < existingOthers.length; j++) existingOthers[j].parentNode.removeChild(existingOthers[j]);

    var renderCount = Math.min(others.length, visibleCap - 1); // -1 for YOU
    for (var k = 0; k < renderCount; k++) {
      var cell = buildCell(others[k], /* isYou */ false);
      cells.appendChild(cell);
    }

    // Render YOUR FOOTPRINT card from the personalized \\\`you\\\` envelope (if present).
    renderFootprint(snapshot && snapshot.you);

    // Overflow + quiet states
    var overflow = others.length - renderCount;
    if (overflowEl) {
      if (overflow > 0) {
        overflowEl.hidden = false;
        if (overflowCountEl) overflowCountEl.textContent = String(overflow);
      } else {
        overflowEl.hidden = true;
      }
    }
    if (quietEl) quietEl.hidden = others.length > 0;
  }

  function buildCell(s, isYou) {
    var li = document.createElement('li');
    li.className = 'here-cell' + (isYou ? ' here-cell--you' : ' here-cell--other');
    if (isYou) li.setAttribute('data-you', 'true');
    if (s && s.kind) li.setAttribute('data-kind', String(s.kind));
    var ring = document.createElement('span');
    ring.className = 'here-cell__ring';
    ring.setAttribute('aria-hidden', 'true');
    li.appendChild(ring);
    var img = document.createElement('img');
    img.className = 'here-cell__noun';
    var nid = (s && typeof s.nounId === 'number') ? s.nounId : myNounId;
    img.src = 'https://noun.pics/' + nid + '.svg';
    img.alt = (isYou ? 'you · noun ' : 'visitor · noun ') + nid;
    img.loading = 'lazy';
    li.appendChild(img);
    var label = document.createElement('span');
    label.className = 'here-cell__label mono';
    label.textContent = isYou ? 'YOU' : String((s && s.kind) ? s.kind.toUpperCase() : 'HUMAN');
    li.appendChild(label);
    decorateCell(li, s, isYou);
    return li;
  }

  function decorateCell(cell, s, isYou) {
    // Remove existing mood/state chips before redecorating (YOU cell may re-decorate).
    var existing = cell.querySelectorAll('.here-cell__chip');
    for (var i = 0; i < existing.length; i++) cell.removeChild(existing[i]);
    if (!s) return;
    if (s.mood) {
      var chip = document.createElement('span');
      chip.className = 'here-cell__chip here-cell__chip--mood mono';
      chip.textContent = String(s.mood);
      cell.appendChild(chip);
    }
    if (s.listening) {
      var chip2 = document.createElement('span');
      chip2.className = 'here-cell__chip here-cell__chip--listening mono';
      chip2.textContent = '♪ ' + String(s.listening).slice(0, 40);
      chip2.title = String(s.listening);
      cell.appendChild(chip2);
    }
    if (s.where) {
      var chip3 = document.createElement('span');
      chip3.className = 'here-cell__chip here-cell__chip--where mono';
      chip3.textContent = '· ' + String(s.where).slice(0, 24);
      chip3.title = String(s.where);
      cell.appendChild(chip3);
    }
    if (!isYou) {
      var bits = [];
      var flag = countryFlag(s.country);
      if (flag) bits.push(flag + ' ' + s.country);
      else if (s.country) bits.push(s.country);
      if (s.deviceClass) {
        var g = DEVICE_GLYPH[s.deviceClass];
        bits.push((g ? g + ' ' : '') + s.deviceClass);
      }
      if (bits.length) {
        var chip4 = document.createElement('span');
        chip4.className = 'here-cell__chip here-cell__chip--edge mono';
        chip4.textContent = bits.join(' · ');
        cell.appendChild(chip4);
      }
    }
  }

  // ---------- initial snapshot --------------------------------------------
  fetch('/api/presence/snapshot', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j) renderSessions(j); })
    .catch(function () { /* ignore — WS will fill in */ });

  // ---------- WS live update ----------------------------------------------
  var ws = null;
  var reconnectDelay = 1000;
  var reconnectTimer = null;
  var pingTimer = null;

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, Math.min(reconnectDelay, 30000));
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  }

  function sendIdentify() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      var mood = lsGet('pc:visitor:mood') || null;
      var listening = lsGet('pc:visitor:listening') || null;
      var where = lsGet('pc:visitor:where') || null;
      ws.send(JSON.stringify({
        type: 'identify',
        kind: 'human',
        nounId: myNounId,
        mood: mood,
        listening: listening,
        where: where,
      }));
    } catch (e) { /* ignore */ }
  }

  function connect() {
    try {
      var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      var url = proto + '//' + location.host + '/api/presence?sid=' + encodeURIComponent(sessionId) + '&kind=human';
      ws = new WebSocket(url);
    } catch (e) {
      scheduleReconnect();
      return;
    }
    ws.addEventListener('open', function () {
      reconnectDelay = 1000;
      sendIdentify();
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = setInterval(function () {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 45000);
    });
    ws.addEventListener('message', function (ev) {
      try {
        var data = JSON.parse(ev.data);
        if (data && data.sessions) renderSessions(data);
      } catch (e) { /* ignore */ }
    });
    ws.addEventListener('close', function () {
      if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
      scheduleReconnect();
    });
    ws.addEventListener('error', function () { /* close handler reconnects */ });
  }

  connect();

  // Re-identify on visibility regain (mood/listening/where may have changed).
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ws && ws.readyState === WebSocket.OPEN) sendIdentify();
  });
})();
})();<\/script>`])), maybeRenderHead(), addAttribute(cap, "data-cap"), defineScriptVars({ cap }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/HereGrid.astro", void 0);

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1;
const $$HerePoll = createComponent(async ($$result, $$props, $$slots) => {
  const polls = (await getCollection("polls", ({ data: data2 }) => !data2.draft)).sort((a, b) => b.data.openedAt.getTime() - a.data.openedAt.getTime());
  const poll = polls[0];
  const data = poll?.data;
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", "<script>\n(function () {\n  'use strict';\n  if (typeof window === 'undefined') return;\n\n  var optsEl = document.querySelector('.here-poll__opts');\n  if (!optsEl) return;\n  var slug = optsEl.getAttribute('data-slug') || '';\n  var status = document.getElementById('here-poll-status');\n  var buttons = Array.prototype.slice.call(optsEl.querySelectorAll('.here-poll__opt'));\n\n  var lsKey = 'pc:poll:voted:' + slug;\n  var voted = null;\n  try { voted = localStorage.getItem(lsKey); } catch (e) {}\n\n  function setStatus(msg) {\n    if (status) status.textContent = msg || '';\n  }\n\n  function paintDistribution(tallies) {\n    // tallies = { optId: count, ... }\n    var total = 0;\n    Object.keys(tallies).forEach(function (k) { total += (tallies[k] || 0); });\n    if (total === 0) total = 1;\n    buttons.forEach(function (btn) {\n      var oid = btn.getAttribute('data-opt');\n      var n = tallies[oid] || 0;\n      var pct = Math.round((n / total) * 100);\n      var bar = btn.querySelector('.here-poll__opt-bar');\n      var pctEl = btn.querySelector('.here-poll__opt-pct');\n      if (bar) bar.style.width = pct + '%';\n      if (pctEl) { pctEl.textContent = pct + '%'; pctEl.hidden = false; }\n      if (oid === voted) btn.classList.add('here-poll__opt--voted');\n      btn.disabled = true;\n    });\n  }\n\n  function fetchResults() {\n    return fetch('/api/poll?slug=' + encodeURIComponent(slug), { cache: 'no-store' })\n      .then(function (r) { return r.ok ? r.json() : null; })\n      .catch(function () { return null; });\n  }\n\n  function onVote(btn) {\n    var opt = btn.getAttribute('data-opt') || '';\n    if (!opt || !slug) return;\n    try { localStorage.setItem(lsKey, opt); } catch (e) {}\n    voted = opt;\n    setStatus('voting…');\n    fetch('/api/poll', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ slug: slug, option: opt }),\n    })\n      .then(function (r) { return r.ok ? r.json() : null; })\n      .catch(function () { return null; })\n      .then(function (data) {\n        if (data && data.tallies) {\n          paintDistribution(data.tallies);\n          setStatus('✓ vote in · thanks');\n        } else {\n          // Fallback — local-only paint\n          var localTallies = {};\n          localTallies[opt] = 1;\n          paintDistribution(localTallies);\n          setStatus('✓ vote recorded locally · server async');\n        }\n      });\n  }\n\n  buttons.forEach(function (btn) {\n    btn.addEventListener('click', function () { onVote(btn); });\n  });\n\n  function showFollowup() {\n    var follow = document.getElementById('here-poll-followup');\n    var link = document.getElementById('here-poll-followup-link');\n    if (!follow || !link) return;\n    // Pick a follow-up poll by fetching /polls.json (machine mirror).\n    fetch('/polls.json', { cache: 'no-store' })\n      .then(function (r) { return r.ok ? r.json() : null; })\n      .catch(function () { return null; })\n      .then(function (data) {\n        if (!data || !Array.isArray(data.polls)) { follow.hidden = false; return; }\n        // Pick the next poll the visitor hasn't voted on yet (or else just the next slug).\n        var candidates = data.polls.filter(function (p) { return p.slug && p.slug !== slug; });\n        for (var i = 0; i < candidates.length; i++) {\n          var s = candidates[i].slug;\n          try { if (!localStorage.getItem('pc:poll:voted:' + s)) { link.href = '/poll/' + s; link.textContent = candidates[i].question ? 'then: ' + candidates[i].question + ' →' : 'then: /poll/' + s + ' →'; follow.hidden = false; return; } } catch (e) {}\n        }\n        // All voted — send them to all polls.\n        link.href = '/polls';\n        link.textContent = 'all polls →';\n        follow.hidden = false;\n      });\n  }\n\n  if (voted) {\n    fetchResults().then(function (res) {\n      if (res && res.tallies) paintDistribution(res.tallies);\n      else {\n        var localTallies = {}; localTallies[voted] = 1;\n        paintDistribution(localTallies);\n      }\n      setStatus('you voted: ' + voted);\n      showFollowup();\n    });\n  }\n\n  // Enhance the vote handler to trigger followup after a successful submit.\n  buttons.forEach(function (btn) {\n    btn.addEventListener('click', function () {\n      // Small delay so the distribution paints first.\n      setTimeout(showFollowup, 400);\n    });\n  });\n})();\n<\/script>"])), data && renderTemplate`${maybeRenderHead()}<section class="here-poll" aria-label="Live poll on /here" data-astro-cid-iiuuifq5><header class="here-poll__head" data-astro-cid-iiuuifq5><p class="here-poll__kicker mono" data-astro-cid-iiuuifq5><span class="here-poll__live" data-astro-cid-iiuuifq5>LIVE POLL</span><span class="here-poll__sep" aria-hidden="true" data-astro-cid-iiuuifq5>·</span><span data-astro-cid-iiuuifq5>tap an option · vote lands instantly</span></p><a class="here-poll__slug mono"${addAttribute(`/poll/${data.slug}`, "href")} data-astro-cid-iiuuifq5>/poll/${data.slug} →</a></header><h2 class="here-poll__q" data-astro-cid-iiuuifq5>${data.question}</h2>${data.dek && renderTemplate`<p class="here-poll__dek" data-astro-cid-iiuuifq5>${data.dek}</p>`}<ul class="here-poll__opts"${addAttribute(data.slug, "data-slug")} data-astro-cid-iiuuifq5>${data.options.map((opt) => renderTemplate`<li data-astro-cid-iiuuifq5><button type="button" class="here-poll__opt"${addAttribute(data.slug, "data-slug")}${addAttribute(opt.id, "data-opt")} data-astro-cid-iiuuifq5><span class="here-poll__opt-label" data-astro-cid-iiuuifq5>${opt.label}</span><span class="here-poll__opt-bar" aria-hidden="true" data-astro-cid-iiuuifq5></span><span class="here-poll__opt-pct mono" hidden data-astro-cid-iiuuifq5>—</span></button></li>`)}</ul><p class="here-poll__status mono" id="here-poll-status" data-astro-cid-iiuuifq5></p><div class="here-poll__followup" id="here-poll-followup" hidden data-astro-cid-iiuuifq5><p class="here-poll__followup-kicker mono" data-astro-cid-iiuuifq5>THEN TRY</p><a class="here-poll__followup-link" id="here-poll-followup-link" href="/polls" data-astro-cid-iiuuifq5>more polls →</a></div></section>`);
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/HerePoll.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$HereBeat = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(["", `<section class="here-beat" aria-label="Meditative beat pad" data-astro-cid-zcrjymrk> <header class="here-beat__head" data-astro-cid-zcrjymrk> <p class="here-beat__kicker mono" data-astro-cid-zcrjymrk>BEAT · SOFT · TAP ANY PAD</p> <p class="here-beat__dek" data-astro-cid-zcrjymrk>
A quiet room for when there aren't many peoples. Tap a pad;
      listen. Six tones in A-minor pentatonic. Broadcast-to-others
      coming — for now it's just you.
</p> </header> <div class="here-beat__pads" id="here-beat-pads" data-astro-cid-zcrjymrk> <button type="button" class="here-beat__pad" data-tone="220.00" data-hue="28" aria-label="A3 tone" data-astro-cid-zcrjymrk><span class="here-beat__pad-ripple" aria-hidden="true" data-astro-cid-zcrjymrk></span></button> <button type="button" class="here-beat__pad" data-tone="261.63" data-hue="45" aria-label="C4 tone" data-astro-cid-zcrjymrk><span class="here-beat__pad-ripple" aria-hidden="true" data-astro-cid-zcrjymrk></span></button> <button type="button" class="here-beat__pad" data-tone="293.66" data-hue="320" aria-label="D4 tone" data-astro-cid-zcrjymrk><span class="here-beat__pad-ripple" aria-hidden="true" data-astro-cid-zcrjymrk></span></button> <button type="button" class="here-beat__pad" data-tone="329.63" data-hue="280" aria-label="E4 tone" data-astro-cid-zcrjymrk><span class="here-beat__pad-ripple" aria-hidden="true" data-astro-cid-zcrjymrk></span></button> <button type="button" class="here-beat__pad" data-tone="392.00" data-hue="210" aria-label="G4 tone" data-astro-cid-zcrjymrk><span class="here-beat__pad-ripple" aria-hidden="true" data-astro-cid-zcrjymrk></span></button> <button type="button" class="here-beat__pad" data-tone="440.00" data-hue="155" aria-label="A4 tone" data-astro-cid-zcrjymrk><span class="here-beat__pad-ripple" aria-hidden="true" data-astro-cid-zcrjymrk></span></button> </div> <p class="here-beat__foot mono" data-astro-cid-zcrjymrk>
spacebar · 1-6 · tap. volume starts low. your device, your room.
</p> </section> <script>
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var pads = Array.prototype.slice.call(document.querySelectorAll('#here-beat-pads .here-beat__pad'));
  if (!pads.length) return;

  var audioCtx = null;
  function getCtx() {
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function playTone(freq) {
    var ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    // Gentle ADSR — slow attack, long tail.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.7);
  }

  function ripple(pad) {
    pad.classList.remove('here-beat__pad--lit');
    // Force reflow to restart the animation.
    // eslint-disable-next-line no-unused-expressions
    void pad.offsetWidth;
    pad.classList.add('here-beat__pad--lit');
  }

  function trigger(pad) {
    var freq = parseFloat(pad.getAttribute('data-tone') || '0');
    if (freq > 0) playTone(freq);
    ripple(pad);
  }

  pads.forEach(function (pad) {
    pad.addEventListener('click', function () { trigger(pad); });
  });

  // Keyboard: 1-6 for pads, space for random pad.
  document.addEventListener('keydown', function (e) {
    // Ignore when typing in inputs.
    var target = e.target;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (e.key >= '1' && e.key <= '6') {
      var i = parseInt(e.key, 10) - 1;
      if (pads[i]) { e.preventDefault(); trigger(pads[i]); }
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      trigger(pads[Math.floor(Math.random() * pads.length)]);
    }
  });
})();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/HereBeat.astro", void 0);

const $$Here = createComponent(($$result, $$props, $$slots) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "PointCast · here now",
    description: "Live congregation view of visitors currently connected to pointcast.xyz.",
    url: "https://pointcast.xyz/here",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    startDate: (/* @__PURE__ */ new Date()).toISOString(),
    location: {
      "@type": "VirtualLocation",
      url: "https://pointcast.xyz/here"
    },
    organizer: {
      "@type": "Organization",
      name: "PointCast",
      url: "https://pointcast.xyz"
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Here now", "description": "Live congregation — visitors currently connected to PointCast, as noun avatars.", "jsonLd": jsonLd, "data-astro-cid-qtbky2oi": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="here-shell" data-astro-cid-qtbky2oi> <header class="here-topbar" data-astro-cid-qtbky2oi> <a class="here-brand mono" href="/" aria-label="PointCast home" data-astro-cid-qtbky2oi> <span class="here-brand__mark" data-astro-cid-qtbky2oi>PC</span> <span data-astro-cid-qtbky2oi>PointCast</span> </a> <nav class="here-nav mono" aria-label="Here navigation" data-astro-cid-qtbky2oi> <a href="/" data-astro-cid-qtbky2oi>Home</a> <a href="/tv" data-astro-cid-qtbky2oi>TV</a> <a href="/workbench" data-astro-cid-qtbky2oi>Workbench</a> <a href="/for-agents" data-astro-cid-qtbky2oi>Agents</a> </nav> </header> <section class="here-room" aria-labelledby="here-title" data-astro-cid-qtbky2oi> <div class="here-room__intro" data-astro-cid-qtbky2oi> <p class="here-room__kicker mono" data-astro-cid-qtbky2oi> <span class="here-room__live" aria-hidden="true" data-astro-cid-qtbky2oi></span>
HERE NOW · LIVE ROOM
</p> <h1 id="here-title" data-astro-cid-qtbky2oi>The peoples, right now.</h1> <p data-astro-cid-qtbky2oi>
Humans, wallets, agents, and bots arrive as noun avatars. Keep
          the page open and the room updates around you without refresh.
</p> <div class="here-room__actions mono" aria-label="Quick links" data-astro-cid-qtbky2oi> <a href="/api/presence/snapshot" data-astro-cid-qtbky2oi>Snapshot</a> <a href="/api/presence" data-astro-cid-qtbky2oi>Live WS</a> <a href="/for-nodes" data-astro-cid-qtbky2oi>Broadcast</a> </div> </div> <div class="here-room__stage" aria-label="Live congregation" data-astro-cid-qtbky2oi> ${renderComponent($$result2, "HereGrid", $$HereGrid, { "cap": 64, "data-astro-cid-qtbky2oi": true })} </div> </section> <section class="here-tools" aria-label="Live room tools" data-astro-cid-qtbky2oi> <div class="here-tools__primary" data-astro-cid-qtbky2oi> ${renderComponent($$result2, "HerePoll", $$HerePoll, { "data-astro-cid-qtbky2oi": true })} </div> <div class="here-tools__secondary" data-astro-cid-qtbky2oi> ${renderComponent($$result2, "HereBeat", $$HereBeat, { "data-astro-cid-qtbky2oi": true })} </div> </section> <aside class="here-agent-strip" data-astro-cid-qtbky2oi> <p class="here-agent-strip__label mono" data-astro-cid-qtbky2oi>MACHINE-READABLE SURFACES</p> <ul data-astro-cid-qtbky2oi> <li data-astro-cid-qtbky2oi><a href="/api/presence/snapshot" data-astro-cid-qtbky2oi>/api/presence/snapshot</a><span data-astro-cid-qtbky2oi>current state, cached 5s</span></li> <li data-astro-cid-qtbky2oi><code data-astro-cid-qtbky2oi>/api/presence</code><span data-astro-cid-qtbky2oi>live WebSocket, identify + updates</span></li> <li data-astro-cid-qtbky2oi><a href="/for-agents" data-astro-cid-qtbky2oi>/for-agents</a><span data-astro-cid-qtbky2oi>full manifest</span></li> <li data-astro-cid-qtbky2oi><a href="/for-nodes" data-astro-cid-qtbky2oi>/for-nodes</a><span data-astro-cid-qtbky2oi>how outside nodes broadcast here</span></li> </ul> </aside> </div> ` })}  `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/here.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/here.astro";
const $$url = "/here";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Here,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
