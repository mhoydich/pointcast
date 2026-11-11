/* Light Companion — the circle page (/light/c/<id>). Talks only to /api/light. */
(function () {
  'use strict';

  var API = '/api/light';
  var POLL_MS = 15000;
  var POLL_HIDDEN_MS = 30000;
  var LOST_AFTER_MS = 10000;
  var HOLD_MS = 800;
  var CASCADE_MS = 450;
  var COLOURS = ['amber', 'rose', 'gold', 'moss', 'sky', 'lilac'];
  var COLOUR_NAMES = { amber: 'Amber', rose: 'Rose', gold: 'Gold', moss: 'Moss', sky: 'Sky', lilac: 'Lilac' };

  var $ = function (id) { return document.getElementById(id); };
  var match = location.pathname.match(/^\/light\/c\/([a-z0-9]{32})\/?$/);
  var circleId = match ? match[1] : '';

  // ── this device's memory (never required; private mode still works) ──
  var store = {
    read: function (key, fallback) { try { var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    write: function (key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } }
  };
  var CIRCLES_KEY = 'pc:light:circles';
  var SOUND_KEY = 'pc:light:sound';
  function remembered() { var all = store.read(CIRCLES_KEY, {}); return all && typeof all === 'object' ? all : {}; }
  function remember(member, name) { var all = remembered(); all[circleId] = { member: member, name: name || '', at: Date.now() }; store.write(CIRCLES_KEY, all); }
  function forget() { var all = remembered(); delete all[circleId]; store.write(CIRCLES_KEY, all); }

  var me = (remembered()[circleId] || {}).member || '';
  var soundOn = store.read(SOUND_KEY, true) !== false;
  var state = null;          // last state from the server
  var clockOffset = 0;       // this device's clock minus the server's
  var lastOk = 0;
  var fails = 0;
  var conn = 'wait';         // wait | on | off
  var shown = {};            // member id -> the lit flag currently drawn
  var catching = {};         // member id -> waiting its turn to catch
  var firstPaint = true;
  var pollTimer = 0;
  var gone = false;
  var busy = false;
  var ignoreClickUntil = 0;

  // ── sound: synthesized, quiet, and only after a touch ───────────────
  var audio = null;
  function unlockAudio() {
    if (audio || !soundOn) return;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); } catch (e) { audio = null; }
  }
  function tone(freq, start, length, peak, type) {
    if (!audio || !soundOn) return;
    try {
      if (audio.state === 'suspended') audio.resume();
      var t = audio.currentTime + start;
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(gain); gain.connect(audio.destination);
      osc.start(t); osc.stop(t + length + 0.05);
    } catch (e) { /* sound is optional */ }
  }
  /* DRUM-WEAVE HOOK: this bell is synthesized here. If the drum rooms later
     expose a shared bell voice, play that instead from this one function. */
  function bell() { tone(523.25, 0, 1.6, 0.07); tone(784, 0.01, 1.2, 0.035); tone(1046.5, 0.02, 0.7, 0.015); }
  function catchSound() { tone(196, 0, 0.35, 0.05, 'triangle'); tone(392, 0.08, 0.5, 0.04); bell(); }
  function snuffSound() { tone(330, 0, 0.25, 0.04); tone(220, 0.1, 0.4, 0.03); }
  function buzz(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* no haptics here */ } }

  // ── talking to the server ───────────────────────────────────────────
  function request(method, body) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7000);
    var init = { method: method, cache: 'no-store', referrerPolicy: 'no-referrer', headers: {} };
    if (ctrl) init.signal = ctrl.signal;
    if (method === 'GET') init.headers['X-Light-Circle'] = circleId;
    else { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    return fetch(API, init).then(function (res) {
      return res.json().then(function (data) { return { status: res.status, data: data }; });
    }).finally(function () { clearTimeout(timer); });
  }

  function accept(data) {
    state = data;
    clockOffset = Date.now() - data.now;
    lastOk = Date.now();
    fails = 0;
    setConn('on');
    render();
  }

  function poll() {
    clearTimeout(pollTimer);
    if (gone || !circleId) return;
    request('GET').then(function (r) {
      if (r.status === 404) { showGone(); return; }
      if (r.status === 200 && r.data && r.data.ok) accept(r.data);
      else failed();
    }).catch(failed).finally(function () {
      if (!gone) pollTimer = setTimeout(poll, document.hidden ? POLL_HIDDEN_MS : POLL_MS);
    });
  }
  function failed() {
    fails += 1;
    if (fails >= 2 || navigator.onLine === false) setConn('off');
  }
  function act(action, extra) {
    if (busy) return Promise.resolve(null);
    busy = true;
    var body = { action: action, circle: circleId };
    Object.keys(extra || {}).forEach(function (k) { body[k] = extra[k]; });
    return request('POST', body).then(function (r) {
      if (r.status === 404 && action !== 'put_out' && r.data && /No circle/.test(r.data.error || '')) { showGone(); return null; }
      if (r.data && r.data.ok) return r.data;
      toast((r.data && r.data.error) || 'That did not work. Nothing changed.');
      return null;
    }).catch(function () {
      toast('Could not reach the circle. Nothing changed.');
      failed();
      return null;
    }).finally(function () { busy = false; });
  }

  // ── connection: the ember ───────────────────────────────────────────
  function setConn(next) {
    if (conn === next) return;
    conn = next;
    $('status').dataset.conn = next;
    render();
  }
  function timeText(ms) {
    try { return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch (e) { return new Date(ms).toTimeString().slice(0, 5); }
  }
  function statusLine() {
    var text = $('status-text');
    var lost = $('lost');
    if (conn === 'on') { text.textContent = 'Connected to the circle'; lost.hidden = true; return; }
    if (conn === 'wait') { text.textContent = 'Looking for the circle'; lost.hidden = true; return; }
    text.textContent = 'Not connected';
    lost.textContent = 'This page cannot see the circle right now, so it cannot tell you which lights are lit.' +
      (lastOk ? ' It last saw the circle at ' + timeText(lastOk) + '.' : '') + ' It will keep trying.';
    lost.hidden = false;
  }
  setInterval(function () {
    if (conn === 'on' && Date.now() - lastOk > LOST_AFTER_MS) setConn('off');
    if (conn === 'on' && state) refreshFades();
  }, 1000);
  window.addEventListener('offline', function () { setConn('off'); });
  window.addEventListener('online', poll);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });

  // ── drawing ─────────────────────────────────────────────────────────
  function view(name) {
    ['gone', 'join', 'circle'].forEach(function (v) { $('view-' + v).hidden = v !== name; });
    $('app').dataset.view = name;
  }
  function showGone() {
    gone = true;
    clearTimeout(pollTimer);
    forget();
    $('status').hidden = true; $('lost').hidden = true;
    view('gone');
  }
  function myMember() {
    if (!state || !me) return null;
    return state.circle.members.filter(function (m) { return m.id === me; })[0] || null;
  }
  function litNow(m) { return Boolean(m.lit && m.expiresAt + clockOffset > Date.now()); }

  function render() {
    statusLine();
    if (gone) return;
    if (!circleId) { showGone(); return; }
    if (!state) return;
    if (me && !myMember()) { me = ''; forget(); }
    if (!me) { renderJoin(); view('join'); return; }
    view('circle');
    renderHill();
    var mine = myMember();
    Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === mine.mode));
    });
    $('b-drum').href = state.drum.page;
    $('practice').hidden = state.store !== 'memory';
    document.title = 'Light · ' + state.circle.members.filter(litNow).length + ' lit';
  }

  function renderJoin() {
    var members = state.circle.members;
    var full = members.length >= state.circle.memberCap;
    $('join-go').disabled = full;
    $('join-full').hidden = !full;
    var list = $('claim-list');
    list.textContent = '';
    members.forEach(function (m) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn small';
      b.textContent = 'I am ' + m.name;
      b.addEventListener('click', function () { me = m.id; remember(m.id, m.name); firstPaint = true; shown = {}; render(); });
      li.appendChild(b); list.appendChild(li);
    });
    $('claim-box').hidden = members.length === 0;
  }

  function nodeFor(m) {
    var li = document.createElement('li');
    li.dataset.member = m.id;
    var mine = m.id === me;
    var win = document.createElement(mine ? 'button' : 'div');
    if (mine) { win.type = 'button'; win.id = 'my-light'; }
    win.className = 'win' + (mine ? ' mine' : '');
    var ring = document.createElement('span'); ring.className = 'hold-ring';
    var flame = document.createElement('span'); flame.className = 'flame';
    win.appendChild(ring); win.appendChild(flame);
    var who = document.createElement('span'); who.className = 'who';
    var since = document.createElement('span'); since.className = 'since';
    li.appendChild(win);
    if (mine) { var you = document.createElement('span'); you.className = 'you'; you.textContent = 'You'; li.appendChild(you); }
    li.appendChild(who); li.appendChild(since);
    if (mine) wireMine(win);
    return li;
  }

  function paint(li, m, lit) {
    var known = conn === 'on';
    var mine = m.id === me;
    li.className = 'c-' + (COLOURS.indexOf(m.colour) >= 0 ? m.colour : 'amber');
    li.dataset.state = known ? (lit ? 'lit' : 'dark') : 'unknown';
    li.querySelector('.who').textContent = m.name; // textContent: names are never parsed as HTML
    var line = known ? (lit ? 'up since ' + timeText(m.litAt + clockOffset) : 'not lit') : 'cannot see';
    li.querySelector('.since').textContent = line;
    var win = li.querySelector('.win');
    var label = m.name + (mine ? ' (you)' : '') + ': ' + (known ? (lit ? 'lit, ' + line : 'not lit') : 'not connected, cannot tell');
    if (mine) label += known ? (lit ? '. Tap to snuff.' : '. Press and hold to light.') : '';
    win.setAttribute('aria-label', label);
    if (!mine) win.setAttribute('role', 'img');
  }

  function renderHill() {
    var hill = $('hill');
    var members = state.circle.members;
    var ids = members.map(function (m) { return m.id; }).join(',');
    if (hill.dataset.ids !== ids + '|' + me) {
      hill.textContent = '';
      members.forEach(function (m) { hill.appendChild(nodeFor(m)); });
      hill.dataset.ids = ids + '|' + me;
    }
    var step = 0;
    var queued = Object.keys(catching).length;
    members.forEach(function (m) {
      var li = hill.querySelector('[data-member="' + m.id + '"]');
      var lit = litNow(m);
      var was = shown[m.id] === true;
      if (conn !== 'on') { paint(li, m, was); return; }
      if (lit && !was && catching[m.id]) {
        paint(li, m, false); // already queued to catch; leave it dark until its turn
      } else if (lit && !was && (m.id !== me || firstPaint)) {
        // Catch one after another, in the circle's order, like beacons.
        var delay = (queued + step) * CASCADE_MS; step += 1;
        paint(li, m, false);
        var quiet = firstPaint;
        catching[m.id] = true;
        setTimeout(function () {
          delete catching[m.id];
          var now = state && state.circle.members.filter(function (x) { return x.id === m.id; })[0];
          var row = $('hill').querySelector('[data-member="' + m.id + '"]');
          if (!now || !row || !litNow(now) || conn !== 'on') return;
          shown[m.id] = true; paint(row, now, true);
          if (!quiet && m.id !== me) bell();
        }, delay);
      } else {
        shown[m.id] = lit; paint(li, m, lit);
      }
    });
    firstPaint = false;
    var mine = myMember();
    if (!$('hint').dataset.sticky) {
      $('hint').textContent = conn !== 'on' ? '' : (litNow(mine) ? 'Your light is lit. Tap it to snuff.' : 'Press and hold your window to light it.');
    }
  }
  function refreshFades() {
    // A light that reaches its end fades here without waiting for the server.
    var stale = state.circle.members.some(function (m) { return shown[m.id] === true && !litNow(m); });
    if (stale) renderHill();
  }

  // ── my light: hold to light, tap to snuff ───────────────────────────
  function localMidnight() { var d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime() - clockOffset; }
  function hint(text, ms) {
    var h = $('hint'); h.textContent = text; h.dataset.sticky = '1';
    setTimeout(function () { delete h.dataset.sticky; if (state && me && conn === 'on') renderHill(); }, ms || 2200);
  }
  function lightMine() {
    var mine = myMember(); if (!mine) return;
    var extra = { member: me, mode: mine.mode };
    if (mine.mode !== 'hour') extra.until = localMidnight();
    buzz(30);
    act('light', extra).then(function (data) {
      if (!data) return;
      shown[me] = true; catchSound(); buzz([20, 60, 40]); accept(data);
    });
  }
  function snuffMine() {
    act('snuff', { member: me }).then(function (data) {
      if (!data) return;
      shown[me] = false; snuffSound(); buzz(15); accept(data);
    });
  }
  function wireMine(win) {
    var timer = 0;
    win.style.setProperty('--hold', HOLD_MS + 'ms');
    function start() {
      var mine = myMember();
      if (!mine || litNow(mine) || conn !== 'on' || timer) return;
      unlockAudio();
      win.classList.add('holding');
      timer = setTimeout(function () {
        timer = 0; win.classList.remove('holding');
        ignoreClickUntil = Date.now() + 700;
        lightMine();
      }, HOLD_MS);
    }
    function cancel() {
      if (!timer) return;
      clearTimeout(timer); timer = 0; win.classList.remove('holding');
      ignoreClickUntil = Date.now() + 400;
      hint('Keep holding a little longer to light it.');
    }
    win.addEventListener('pointerdown', function (e) { if (e.button === 0 || e.pointerType !== 'mouse') start(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) { win.addEventListener(t, cancel); });
    // Keyboard: hold Enter or Space to light. When lit, the key's ordinary click snuffs.
    function isKey(e) { return e.key === 'Enter' || e.key === ' '; }
    function unlit() { var mine = myMember(); return Boolean(mine && !litNow(mine)); }
    win.addEventListener('keydown', function (e) { if (isKey(e) && (unlit() || timer)) { e.preventDefault(); if (!e.repeat) start(); } });
    win.addEventListener('keyup', function (e) { if (isKey(e) && (timer || Date.now() < ignoreClickUntil)) { e.preventDefault(); cancel(); } });
    win.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    win.addEventListener('click', function (e) {
      unlockAudio();
      if (Date.now() < ignoreClickUntil) return;
      var mine = myMember();
      if (!mine) return;
      if (conn !== 'on') { toast('Not connected. Your light cannot change right now.'); return; }
      if (litNow(mine)) { snuffMine(); return; }
      // A click with no pointer behind it comes from a keyboard or a screen
      // reader's activate gesture, which cannot hold. Let it light directly.
      if (e.detail === 0) lightMine();
    });
  }

  // ── controls ────────────────────────────────────────────────────────
  var toastTimer = 0;
  function toast(text) {
    var t = $('toast'); t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3800);
  }
  function openDialog(id) { var d = $(id); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  function closeDialog(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (b) {
    b.addEventListener('click', function () { closeDialog(b.closest('dialog')); });
  });
  function swatches(host, name, picked) {
    Array.prototype.slice.call(host.querySelectorAll('label')).forEach(function (l) { l.remove(); });
    COLOURS.forEach(function (c) {
      var label = document.createElement('label'); label.className = 'c-' + c;
      var input = document.createElement('input'); input.type = 'radio'; input.name = name; input.value = c;
      input.checked = c === picked; input.setAttribute('aria-label', COLOUR_NAMES[c]);
      var dot = document.createElement('i');
      label.appendChild(input); label.appendChild(dot); host.appendChild(label);
    });
  }
  function picked(name) { var el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : 'amber'; }

  swatches($('join-colours'), 'join-colour', COLOURS[Math.floor(Math.random() * COLOURS.length)]);
  $('join-form').addEventListener('submit', function (e) {
    e.preventDefault();
    unlockAudio();
    var name = $('join-name').value;
    act('join', { name: name, colour: picked('join-colour') }).then(function (data) {
      if (!data) return;
      me = data.member; remember(me, name.trim()); firstPaint = true; shown = {};
      accept(data);
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
    b.addEventListener('click', function () {
      act('update', { member: me, mode: b.dataset.mode }).then(function (data) {
        if (!data) return;
        accept(data);
        toast(b.dataset.mode === 'hour' ? 'Next time, your light stays lit for one hour.' : 'Next time, your light stays lit until midnight where you are.');
      });
    });
  });

  $('b-share').addEventListener('click', function () {
    $('share-link').value = location.origin + '/light/c/' + circleId;
    $('share-native').hidden = typeof navigator.share !== 'function';
    openDialog('d-share');
  });
  $('share-copy').addEventListener('click', function () {
    var link = $('share-link');
    var done = function () { toast('Link copied.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link.value).then(done, function () { link.select(); });
    else { link.select(); try { document.execCommand('copy'); done(); } catch (e) { /* the link is selected for a manual copy */ } }
  });
  $('share-native').addEventListener('click', function () {
    navigator.share({ title: 'Light Companion', text: 'Our circle of lights', url: $('share-link').value }).catch(function () { /* cancelled */ });
  });

  function soundLabel() { $('b-sound').textContent = 'Sound: ' + (soundOn ? 'on' : 'off'); $('b-sound').setAttribute('aria-pressed', String(soundOn)); }
  soundLabel();
  $('b-sound').addEventListener('click', function () {
    soundOn = !soundOn; store.write(SOUND_KEY, soundOn); soundLabel();
    if (soundOn) { unlockAudio(); bell(); }
  });

  $('b-edit').addEventListener('click', function () {
    var mine = myMember(); if (!mine) return;
    $('edit-name').value = mine.name;
    swatches($('edit-colours'), 'edit-colour', mine.colour);
    openDialog('d-edit');
  });
  $('edit-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('edit-name').value;
    act('update', { member: me, name: name, colour: picked('edit-colour') }).then(function (data) {
      if (!data) return;
      remember(me, name.trim()); closeDialog($('d-edit')); accept(data);
    });
  });

  $('b-leave').addEventListener('click', function () { openDialog('d-leave'); });
  $('leave-forget').addEventListener('click', function () { forget(); location.href = '/light/'; });
  $('leave-remove').addEventListener('click', function () {
    act('remove', { member: me }).then(function (data) { if (!data) return; forget(); location.href = '/light/'; });
  });

  $('b-putout').addEventListener('click', function () { openDialog('d-putout'); });
  $('putout-go').addEventListener('click', function () {
    act('put_out', { confirm: 'put out' }).then(function (data) {
      if (!data) return;
      closeDialog($('d-putout'));
      $('gone-text').textContent = 'The circle is out. Its names, colours and lights have been deleted, and the link no longer works.';
      showGone();
    });
  });

  document.addEventListener('pointerdown', unlockAudio, { passive: true });

  // ── start ───────────────────────────────────────────────────────────
  if (circleId) {
    var manifest = document.createElement('link');
    manifest.rel = 'manifest'; manifest.href = '/light/c/' + circleId + '/manifest.webmanifest';
    document.head.appendChild(manifest);
    statusLine();
    poll();
  } else {
    showGone();
  }
})();
