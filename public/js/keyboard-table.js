/*!
 * KeyboardTable — online seats for the four-seat keyboard games
 * (/keyboard-quartet, /keyboard-rush).
 *
 * One screen is the TABLE: it runs the game exactly as before and is the only
 * authority. Anyone else opens the table link (?table=CODE) and gets a
 * CONTROLLER for one seat: five big keys, the table's prompt, the scores, and
 * every note the table plays, so a friend in another city hears the round.
 *
 * Transport: the pointcast-drum Durable Object's party rooms
 * (/api/drum/room?room=bc-kq-<code>), which relay small JSON frames to every
 * peer but the sender and store nothing. No Worker changes.
 *
 * Frames (d):
 *   controller → table   {t:'hi'} · {t:'sit', s} · {t:'k', d} · {t:'go'} · {t:'again'}
 *   table → controllers  {t:'st', g, m, sit, sc, turn, lit, bar, p, own}  (state, on change)
 *                        {t:'n', s, m, v, dt, l}                          (a note the table played)
 */
(function () {
  'use strict';
  if (window.KeyboardTable) return;

  var ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
  var CODE_RE = /^[a-z0-9]{4,8}$/;
  var DEG_COLORS = ['#f2c14e', '#ef7d6b', '#6fc9e6', '#8fdc7a', '#c8a2ff'];

  function newCode() {
    var a = new Uint8Array(5), s = '';
    crypto.getRandomValues(a);
    for (var i = 0; i < a.length; i++) s += ALPHA[a[i] % ALPHA.length];
    return s;
  }
  function sid() {
    try {
      var v = sessionStorage.getItem('kt:sid');
      if (!v) { v = crypto.randomUUID(); sessionStorage.setItem('kt:sid', v); }
      return v;
    } catch (e) { return crypto.randomUUID(); }
  }
  function cleanCode(v) { v = String(v || '').toLowerCase(); return CODE_RE.test(v) ? v : ''; }

  /** One socket with reconnect. onFrame(d, from) for party frames; onPresence(ids). */
  function connect(code, handlers) {
    var S = { ws: null, me: '', status: 'off', closed: false, tries: 0 };
    var proto = location.protocol === 'https:' ? 'wss' : 'ws';
    var url = proto + '://' + location.host + '/api/drum/room?room=bc-kq-' + code + '&sid=' + sid();
    var timer = null;
    function status(s) { if (S.status !== s) { S.status = s; if (handlers.onStatus) handlers.onStatus(s); } }
    function open() {
      if (S.closed) return;
      status(S.tries ? 'reconnecting' : 'connecting');
      var ws;
      try { ws = new WebSocket(url); } catch (e) { return retry(); }
      S.ws = ws;
      ws.onmessage = function (e) {
        var m;
        try { m = JSON.parse(e.data); } catch (err) { return; }
        if (!m || typeof m !== 'object') return;
        if (m.type === 'welcome') {
          if (!(m.features || []).includes('bc-party')) { status('unsupported'); S.closed = true; ws.close(); return; }
          S.me = (m.you && m.you.clientId) || '';
          S.tries = 0;
          status('on');
          if (handlers.onOpen) handlers.onOpen();
        } else if (m.type === 'party' && m.d && typeof m.d === 'object' && typeof m.from === 'string') {
          handlers.onFrame(m.d, m.from);
        } else if (m.type === 'presence' && Array.isArray(m.people) && handlers.onPresence) {
          // The roster calls a clientId `id` (the welcome calls it `clientId`).
          handlers.onPresence(m.people.map(function (p) { return p && p.id; }).filter(Boolean));
        }
      };
      ws.onclose = function () { if (S.ws === ws) { S.ws = null; if (!S.closed) retry(); } };
      ws.onerror = function () {};
    }
    function retry() {
      status('reconnecting');
      clearTimeout(timer);
      timer = setTimeout(open, Math.min(6000, 400 * Math.pow(2, S.tries++)));
    }
    S.send = function (d) {
      if (!S.ws || S.ws.readyState !== 1 || S.status !== 'on') return false;
      try { S.ws.send(JSON.stringify({ v: 1, type: 'party', d: d })); return true; } catch (e) { return false; }
    };
    S.close = function () { S.closed = true; clearTimeout(timer); try { if (S.ws) S.ws.close(); } catch (e) {} };
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && !S.closed && (!S.ws || S.ws.readyState > 1)) { S.tries = 0; clearTimeout(timer); open(); }
    });
    open();
    return S;
  }

  var CSS = [
    '.kt-chip{position:fixed;right:14px;bottom:14px;z-index:50;display:flex;align-items:center;gap:10px;flex-wrap:wrap;max-width:calc(100vw - 28px);',
    'background:#0f1a16f2;border:1px solid #2e4a3f;border-radius:14px;padding:10px 12px;color:#e8efe9;font:12px/1.4 ui-monospace,Menlo,monospace;box-shadow:0 10px 30px #0006}',
    '.kt-chip b{color:#e6c98a;font-weight:normal;letter-spacing:.12em}',
    '.kt-chip .dot{width:8px;height:8px;border-radius:50%;background:#e6c98a}.kt-chip .dot.on{background:#8fdc7a}.kt-chip .dot.off{background:#ef7d6b}',
    '.kt-chip button{font:inherit;color:inherit;background:#1d2e27;border:1px solid #2e4a3f;border-radius:20px;padding:6px 10px;cursor:pointer}',
    '.kt-chip .seats{display:flex;gap:4px}.kt-chip .seats i{width:12px;height:12px;border-radius:4px;border:1px solid var(--c);opacity:.35}.kt-chip .seats i.r{background:var(--c);opacity:1}',
    '.kt-ctrl{position:fixed;inset:0;z-index:60;overflow:auto;background:radial-gradient(ellipse at 50% 0%,#1d2e27,#0b1411 70%);color:#e8efe9;',
    'font:14px/1.5 ui-monospace,Menlo,monospace;display:flex;flex-direction:column;gap:16px;padding:18px 16px 28px;-webkit-user-select:none;user-select:none}',
    '.kt-top{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:11px;color:#9fb5aa;letter-spacing:.08em}',
    '.kt-top a{color:#9fb5aa}',
    '.kt-title{font-family:Georgia,serif;font-size:26px;color:#fff;margin:0}.kt-title em{color:var(--c,#e6c98a)}',
    '.kt-prompt{font-family:Georgia,serif;font-size:20px;min-height:2.6em;margin:0;color:#e8efe9}',
    '.kt-pick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '.kt-pick button{font:inherit;color:#0b1411;background:var(--c);border:0;border-radius:16px;padding:22px 10px;font-size:18px;cursor:pointer}',
    '.kt-pick button small{display:block;font-size:11px;opacity:.7;margin-top:4px}',
    '.kt-pick button:disabled{opacity:.3;cursor:default}',
    '.kt-pads{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;flex:1;min-height:220px;max-height:420px}',
    '.kt-pad{border:2px solid color-mix(in srgb,var(--d) 60%,#000);border-radius:18px;background:color-mix(in srgb,var(--d) 22%,#0b1411);color:#fff;font:inherit;font-size:18px;touch-action:manipulation;cursor:pointer;transition:transform .05s,background .1s}',
    '.kt-pad.lit{background:var(--d);color:#0b1411;box-shadow:0 0 30px color-mix(in srgb,var(--d) 60%,transparent)}',
    '.kt-pad.on{transform:translateY(3px) scale(.97)}',
    '.kt-ctrl.idle .kt-pad{opacity:.45}',
    '.kt-ctrl.turn .kt-pads{outline:3px solid var(--c);outline-offset:6px;border-radius:20px}',
    '.kt-scores{display:flex;gap:8px;flex-wrap:wrap;font-size:12px}',
    '.kt-scores span{border:1px solid color-mix(in srgb,var(--c) 50%,transparent);border-radius:20px;padding:5px 11px;color:var(--c)}',
    '.kt-scores span.me{background:color-mix(in srgb,var(--c) 22%,transparent)}',
    '.kt-bar{height:6px;border-radius:4px;background:#ffffff14;overflow:hidden}.kt-bar i{display:block;height:100%;background:var(--c,#e6c98a);width:0;transition:width .2s}',
    '.kt-acts{display:flex;gap:8px;flex-wrap:wrap}',
    '.kt-acts button{font:inherit;color:#0b1411;background:var(--c,#e6c98a);border:0;border-radius:24px;padding:12px 18px;cursor:pointer}',
    '.kt-acts button.ghost{background:transparent;color:#e8efe9;border:1px solid #2e4a3f}',
    '.kt-note{font-size:11px;color:#9fb5aa;margin:0}',
    '[hidden]{display:none!important}',
  ].join('');
  function style() {
    if (document.getElementById('kt-style')) return;
    var s = document.createElement('style');
    s.id = 'kt-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---- the table (host) ---------------------------------------------------

  /**
   * opts: { game, path, seats:[{name,color,caps}], snapshot():state, onKey(seat,deg),
   *         onSit(seat), onStart(), onAgain() }
   */
  function host(opts) {
    style();
    var code = '';
    try { code = cleanCode(sessionStorage.getItem('kt:host:' + opts.game)); } catch (e) {}
    code = code || newCode();
    try { sessionStorage.setItem('kt:host:' + opts.game, code); } catch (e) {}
    var link = location.origin + opts.path + '?table=' + code;
    var own = [null, null, null, null];     // clientId per seat
    var present = null;
    var lastState = '';
    var budget = 50, budgetAt = performance.now();

    function spend(priority) {
      var now = performance.now();
      budget = Math.min(50, budget + (now - budgetAt) * 0.05);
      budgetAt = now;
      if (budget < (priority ? 1 : 12)) return false; // notes back off before state does
      budget -= 1;
      return true;
    }

    var chip = document.createElement('div');
    chip.className = 'kt-chip';
    chip.setAttribute('role', 'status');
    chip.innerHTML = '<span class="dot"></span><span>Online table <b></b></span><span class="seats"></span><span class="n"></span>' +
      '<button type="button" data-copy>Copy link</button><button type="button" data-share hidden>Share…</button><button type="button" data-end>End</button>';
    chip.querySelector('b').textContent = code.toUpperCase();
    var seatDots = opts.seats.map(function (s) {
      var i = document.createElement('i');
      i.style.setProperty('--c', s.color);
      i.title = s.name + ' · open';
      chip.querySelector('.seats').appendChild(i);
      return i;
    });
    document.body.appendChild(chip);
    chip.querySelector('[data-share]').hidden = !navigator.share;

    function paintChip() {
      var n = own.filter(Boolean).length;
      chip.querySelector('.n').textContent = n ? n + ' online' : 'send the link';
      seatDots.forEach(function (d, i) { d.classList.toggle('r', !!own[i]); d.title = opts.seats[i].name + (own[i] ? ' · online' : ' · open'); });
    }
    paintChip();

    function sendState(force) {
      var st = opts.snapshot();
      st.t = 'st';
      st.g = opts.game;
      st.own = own.map(function (id) { return id || ''; });
      st.p = String(st.p || '').replace(/\s+/g, ' ').trim().slice(0, 110);
      var json = JSON.stringify(st);
      if (!force && json === lastState) return;
      if (!spend(true)) return;
      if (conn.send(st)) lastState = json;
    }

    var conn = connect(code, {
      onStatus: function (s) {
        var dot = chip.querySelector('.dot');
        dot.className = 'dot' + (s === 'on' ? ' on' : s === 'unsupported' || s === 'reconnecting' ? ' off' : '');
        if (s === 'unsupported') chip.querySelector('.n').textContent = 'online seats unavailable right now';
      },
      onOpen: function () { sendState(true); },
      onFrame: function (d, from) {
        var seat = own.indexOf(from);
        if (d.t === 'hi') { sendState(true); return; }
        if (d.t === 'sit') {
          var s = d.s | 0;
          if (s < 0 || s > 3 || (own[s] && own[s] !== from)) { sendState(true); return; }
          if (seat >= 0) own[seat] = null;
          own[s] = from;
          paintChip();
          if (opts.onSit) opts.onSit(s);
          sendState(true);
          return;
        }
        if (seat < 0) return; // only a seated controller can play
        if (d.t === 'k') {
          var deg = d.d | 0;
          if (deg >= 0 && deg <= 4) opts.onKey(seat, deg);
        } else if (d.t === 'go' && opts.onStart) opts.onStart();
        else if (d.t === 'again' && opts.onAgain) opts.onAgain(seat);
        else if (d.t === 'leave') { own[seat] = null; paintChip(); sendState(true); }
      },
      onPresence: function (ids) {
        present = ids;
        var changed = false;
        own.forEach(function (id, i) { if (id && ids.indexOf(id) < 0) { own[i] = null; changed = true; } });
        if (changed) { paintChip(); sendState(true); }
      },
    });

    var poll = setInterval(function () { sendState(false); }, 150);
    var keepAlive = setInterval(function () { sendState(true); }, 5000);

    chip.querySelector('[data-copy]').onclick = function () {
      var b = this;
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () {
        b.textContent = 'Copied';
      }, function () { prompt('Table link', link); }).then(function () { setTimeout(function () { b.textContent = 'Copy link'; }, 1600); });
    };
    chip.querySelector('[data-share]').onclick = function () {
      navigator.share({ title: opts.title || 'Pull up a seat', text: 'Pick a seat at my keyboard table. Your phone is your five keys.', url: link }).catch(function () {});
    };
    var api = {
      code: code,
      link: link,
      /** Echo a note the table just played; `delay` in seconds from now. */
      note: function (seat, midi, vel, delay, len) {
        if (!(midi >= 0 && midi <= 127) || !spend(false)) return;
        conn.send({ t: 'n', s: seat | 0, m: Math.round(midi), v: Math.round((vel == null ? 0.8 : vel) * 100) / 100, dt: Math.max(0, Math.round((delay || 0) * 1000)), l: len || 1 });
      },
      remoteSeats: function () { return own.map(function (id) { return !!id; }); },
      end: function () {
        clearInterval(poll); clearInterval(keepAlive);
        conn.send({ t: 'st', g: opts.game, m: 'closed', sit: [0, 0, 0, 0], sc: [0, 0, 0, 0], turn: -1, lit: -1, bar: 0, p: 'The table closed.', own: ['', '', '', ''] });
        setTimeout(function () { conn.close(); }, 200);
        chip.remove();
        try { sessionStorage.removeItem('kt:host:' + opts.game); } catch (e) {}
        if (opts.onEnd) opts.onEnd();
      },
    };
    chip.querySelector('[data-end]').onclick = api.end;
    return api;
  }

  // ---- a controller (a remote seat) -----------------------------------------------

  /**
   * opts: { game, title, code, path, seats:[{name,color,caps}], tone(seat,midi,vel,t,len), boot() }
   */
  function join(opts) {
    style();
    var code = cleanCode(opts.code);
    if (!code) return null;
    var seats = opts.seats;
    var mySeat = -1;
    var hostId = '';
    var state = null;
    var wantSeat = -1;

    var el = document.createElement('section');
    el.className = 'kt-ctrl';
    el.setAttribute('aria-label', opts.title + ' controller');
    el.innerHTML =
      '<div class="kt-top"><span data-status>connecting…</span><span>table <b data-code></b> · <a href="' + opts.path + '">leave</a></span></div>' +
      '<h1 class="kt-title">' + opts.title + ' <em data-seatname></em></h1>' +
      '<p class="kt-prompt" data-prompt>Finding the table…</p>' +
      '<div class="kt-pick" data-pick></div>' +
      '<div class="kt-pads" data-pads hidden></div>' +
      '<div class="kt-bar" data-barwrap hidden><i data-bar></i></div>' +
      '<div class="kt-scores" data-scores></div>' +
      '<div class="kt-acts"><button type="button" data-go hidden>Start the round</button><button type="button" class="ghost" data-again hidden>Hear it again</button><button type="button" class="ghost" data-switch hidden>Switch seat</button></div>' +
      '<p class="kt-note" data-note>Keys: your seat\'s letters, or 1–5, or A S D F G. Sound on — you hear the whole table.</p>';
    document.body.appendChild(el);
    var q = function (s) { return el.querySelector(s); };
    q('[data-code]').textContent = code.toUpperCase();

    seats.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.setProperty('--c', s.color);
      b.dataset.seat = i;
      b.innerHTML = s.name + '<small>' + s.caps.split('').join(' ') + '</small>';
      b.onclick = function () { if (opts.boot) opts.boot(); wantSeat = i; conn.send({ t: 'sit', s: i }); };
      q('[data-pick]').appendChild(b);
    });
    var pads = [];
    for (var d = 0; d < 5; d++) {
      var p = document.createElement('button');
      p.type = 'button';
      p.className = 'kt-pad';
      p.dataset.deg = d;
      p.style.setProperty('--d', DEG_COLORS[d]);
      q('[data-pads]').appendChild(p);
      pads.push(p);
    }
    function press(deg) {
      if (mySeat < 0) return;
      if (opts.boot) opts.boot();
      conn.send({ t: 'k', d: deg });
      var p = pads[deg];
      p.classList.add('on');
      clearTimeout(p._t);
      p._t = setTimeout(function () { p.classList.remove('on'); }, 90);
    }
    q('[data-pads]').addEventListener('pointerdown', function (e) {
      var p = e.target.closest('.kt-pad');
      if (!p) return;
      e.preventDefault();
      press(+p.dataset.deg);
    });
    // Capture phase on window runs before the game's own listeners; the game
    // behind the controller never sees these keys.
    var ALT = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, KeyA: 0, KeyS: 1, KeyD: 2, KeyF: 3, KeyG: 4 };
    addEventListener('keydown', function (e) {
      e.stopImmediatePropagation();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Enter' && state && (state.m === 'jam' || state.m === 'done')) { e.preventDefault(); conn.send({ t: 'go' }); return; }
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); conn.send({ t: 'again' }); return; }
      if (e.repeat || mySeat < 0) return;
      var deg = ALT[e.code];
      if (deg == null && opts.seatCodes) deg = opts.seatCodes[mySeat].indexOf(e.code);
      if (deg == null || deg < 0) return;
      e.preventDefault();
      press(deg);
    }, true);
    q('[data-go]').onclick = function () { if (opts.boot) opts.boot(); conn.send({ t: 'go' }); };
    q('[data-again]').onclick = function () { conn.send({ t: 'again' }); };
    q('[data-switch]').onclick = function () { conn.send({ t: 'leave' }); mySeat = -1; wantSeat = -1; paint(); };

    function paint() {
      var s = state;
      var me = conn.me;
      if (s) {
        var mine = s.own.indexOf(me);
        mySeat = mine;
        if (wantSeat >= 0 && mine < 0 && s.own[wantSeat] && s.own[wantSeat] !== me) wantSeat = -1;
      }
      var seat = mySeat >= 0 ? seats[mySeat] : null;
      el.style.setProperty('--c', seat ? seat.color : '#e6c98a');
      q('[data-seatname]').textContent = seat ? '· ' + seat.name : '';
      q('[data-pick]').hidden = !!seat;
      q('[data-pads]').hidden = !seat;
      q('[data-switch]').hidden = !seat || !s || (s.m !== 'jam' && s.m !== 'done');
      if (!s) return;
      q('[data-prompt]').textContent = s.m === 'closed' ? 'The table closed. Thanks for playing.' : seat ? s.p : 'Pick a seat. ' + s.p;
      Array.prototype.forEach.call(q('[data-pick]').children, function (b, i) {
        b.disabled = !!s.own[i] && s.own[i] !== me;
        b.querySelector('small').textContent = s.own[i] && s.own[i] !== me ? 'taken online' : seats[i].caps.split('').join(' ');
      });
      pads.forEach(function (p, i) { p.classList.toggle('lit', s.lit === i); p.textContent = seat ? seat.caps[i] : ''; });
      el.classList.toggle('turn', s.turn >= 0 && s.turn === mySeat);
      el.classList.toggle('idle', s.turn >= 0 && s.turn !== mySeat);
      q('[data-barwrap]').hidden = !(s.bar > 0);
      q('[data-bar]').style.width = Math.max(0, Math.min(100, s.bar)) + '%';
      q('[data-go]').hidden = !(seat && (s.m === 'jam' || s.m === 'done'));
      q('[data-again]').hidden = !(opts.game === 'quartet' && s.m === 'echo' && s.turn === mySeat);
      q('[data-scores]').innerHTML = '';
      seats.forEach(function (st, i) {
        if (!s.sit[i]) return;
        var span = document.createElement('span');
        span.style.setProperty('--c', st.color);
        span.className = i === mySeat ? 'me' : '';
        span.textContent = st.name + ' ' + (s.sc[i] | 0) + (s.own[i] ? '' : ' · at the table');
        q('[data-scores]').appendChild(span);
      });
    }

    var conn = connect(code, {
      onStatus: function (st) {
        q('[data-status]').textContent = st === 'on' ? (hostId ? '● at the table' : '● looking for the table…')
          : st === 'unsupported' ? 'online seats unavailable right now' : st === 'reconnecting' ? '○ reconnecting…' : 'connecting…';
      },
      onOpen: function () {
        conn.send({ t: 'hi' });
        if (mySeat >= 0) conn.send({ t: 'sit', s: mySeat });
        else if (wantSeat >= 0) conn.send({ t: 'sit', s: wantSeat });
        setTimeout(function () { if (!hostId) q('[data-prompt]').textContent = 'No table is open with this code yet. Ask for a fresh link, or leave this open — it joins as soon as the table does.'; }, 4000);
      },
      onFrame: function (d, from) {
        if (d.t === 'st') {
          // Lock onto the first table that answers; ignore look-alikes.
          if (hostId && from !== hostId) return;
          if (d.g !== opts.game || !Array.isArray(d.own) || !Array.isArray(d.sit) || !Array.isArray(d.sc)) return;
          hostId = from;
          q('[data-status]').textContent = '● at the table';
          state = {
            m: String(d.m || ''), own: d.own.slice(0, 4).map(String), sit: d.sit.slice(0, 4).map(Boolean), sc: d.sc.slice(0, 4).map(Number),
            turn: typeof d.turn === 'number' ? d.turn : -1, lit: typeof d.lit === 'number' ? d.lit : -1,
            bar: typeof d.bar === 'number' ? d.bar : 0, p: String(d.p || '').slice(0, 110),
          };
          paint();
        } else if (d.t === 'n' && from === hostId) {
          var s = d.s | 0, m = +d.m;
          if (s < 0 || s > 3 || !(m >= 0 && m <= 127)) return;
          var vel = Math.max(0.05, Math.min(1, +d.v || 0.8));
          var len = Math.max(0.2, Math.min(3, +d.l || 1));
          setTimeout(function () { try { opts.tone(s, m, vel, undefined, len); } catch (e) {} }, Math.min(3000, Math.max(0, d.dt | 0)));
        }
      },
    });
    addEventListener('pagehide', function () { conn.send({ t: 'leave' }); });
    return { close: function () { conn.close(); el.remove(); } };
  }

  window.KeyboardTable = { host: host, join: join, cleanCode: cleanCode };
})();
