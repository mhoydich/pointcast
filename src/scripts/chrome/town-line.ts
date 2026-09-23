// @ts-nocheck
// TownLine — the deck above the dock (Bar v2, phase 1 · 2026-09-23).
// Reads the town socket's `pc:presence` (cursor-room.ts), Shortwave posts,
// drum signals and waves; renders a keyed lane of tiles. See TownLine.astro.
export function mountTownLine(root, scope) {
  const { on, setTimeout, clearTimeout, setInterval } = scope;
  var $lane = root.querySelector('[data-pc-ref="town-lane"]');
  var $count = root.querySelector('[data-pc-ref="town-count"]');
  var $here = root.querySelector('[data-pc-ref="town-here"]');
  var $sub = root.querySelector('[data-pc-ref="town-sub"]');
  var $status = root.querySelector('[data-pc-ref="town-status"]');
  var $bubbles = root.querySelector('[data-pc-ref="town-bubbles"]');
  var $toggle = root.querySelector('[data-pc-ref="town-toggle"]');
  if (!$lane) return;

  var DECK_KEY = 'pc:deck';
  var LINGER_MS = 6000;
  var MAX_DESKTOP = 12, MAX_PHONE = 6;
  var DRUMS = ['kick', 'bloom', 'dew', 'thorn'];
  var phone = window.matchMedia('(max-width: 640px)');
  var st = {
    sessions: [], humans: 0, agents: 0, myNoun: -1, myPath: location.pathname || '/', mySid: '',
    live: false, sig: '', seen: {}, lastSeen: {}, said: {}, primed: false, beats: [], moments: null,
  };

  // ── open / folded ───────────────────────────────────────────────
  function readOpen() { try { return localStorage.getItem(DECK_KEY) !== 'off'; } catch (e) { return true; } }
  function setOpen(open, remember) {
    root.setAttribute('data-open', open ? 'true' : 'false');
    document.documentElement.setAttribute('data-deck', open ? 'on' : 'off');
    if ($toggle) {
      $toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      $toggle.title = open ? 'Fold the town line away' : 'Open the town line';
    }
    if (remember) { try { localStorage.setItem(DECK_KEY, open ? 'on' : 'off'); } catch (e) {} }
    window.dispatchEvent(new CustomEvent('pc:deck', { detail: { open: open } }));
  }
  setOpen(readOpen(), false);
  if ($toggle) on($toggle, 'click', function () { setOpen(root.getAttribute('data-open') !== 'true', true); });

  // ── helpers ─────────────────────────────────────────────────────
  function nounSrc(n) { return 'https://noun.pics/' + n + '.svg'; }
  function place(path) {
    if (!path || path === '/') return 'front door';
    var p = String(path).replace(/\/$/, '');
    return p.length > 14 ? p.slice(0, 13) + '…' : p;
  }
  function ago(ms) {
    var m = Math.max(0, Math.round(ms / 60000));
    return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago';
  }
  function nameOf(noun) { var k = st.said[noun]; return k && k.who && k.who !== 'visitor' ? k.who : 'noun ' + noun; }
  function myNoun() {
    if (st.myNoun >= 0) return st.myNoun;
    var img = document.querySelector('[data-pc-ref="fb-noun"]');
    var m = img && /noun\.pics\/(\d+)/.exec(img.getAttribute('src') || '');
    return m ? Number(m[1]) : -1;
  }

  // Who is on the line: you first, then people on this page, people
  // elsewhere, then AIs. The first session matching your Noun on your page is you.
  function lineup() {
    var me = myNoun(), skipped = false, others = [], byNoun = {};
    st.sessions.forEach(function (s) {
      if (!skipped && s.nounId === me && (s.currentPath || st.myPath) === st.myPath) { skipped = true; return; }
      // One tile per Noun (two tabs of one person); a tab on this page wins.
      var prev = byNoun[s.nounId];
      if (prev) { if (s.currentPath === st.myPath && prev.currentPath !== st.myPath) others[others.indexOf(prev)] = byNoun[s.nounId] = s; return; }
      byNoun[s.nounId] = s; others.push(s);
    });
    others.sort(function (a, b) {
      var ah = a.currentPath === st.myPath ? 0 : 1, bh = b.currentPath === st.myPath ? 0 : 1;
      var aa = a.kind === 'agent' ? 1 : 0, ba = b.kind === 'agent' ? 1 : 0;
      return aa - ba || ah - bh || String(b.joinedAt || '').localeCompare(String(a.joinedAt || ''));
    });
    return { me: me, others: others };
  }

  // ── tiles (keyed by noun; never rebuilt) ───────────────────────
  function tileKey(noun, you) { return you ? 'you' : 'n' + noun; }
  function makeTile(key, noun) {
    var t = document.createElement('button');
    t.type = 'button'; t.className = 'town-tile'; t.setAttribute('role', 'listitem');
    t.setAttribute('data-key', key); t.setAttribute('data-noun', String(noun));
    var f = document.createElement('span'); f.className = 'town-tile__face';
    var img = document.createElement('img'); img.alt = ''; img.width = 28; img.height = 28; img.loading = 'lazy'; img.decoding = 'async';
    img.src = nounSrc(noun); f.appendChild(img);
    var c = document.createElement('span'); c.className = 'town-tile__cap';
    t.appendChild(f); t.appendChild(c);
    return t;
  }
  function setTile(t, s, you) {
    var noun = you ? myNoun() : s.nounId;
    if (Number(t.getAttribute('data-noun')) !== noun) {
      t.setAttribute('data-noun', String(noun));
      var img = t.querySelector('img'); if (img) img.src = nounSrc(noun);
    }
    var kind = you ? 'human' : s.kind === 'agent' ? 'agent' : 'human';
    t.setAttribute('data-kind', kind);
    if (you) t.setAttribute('data-you', 'true');
    var here = !you && s.currentPath === st.myPath;
    if (here) t.setAttribute('data-here', 'true'); else t.removeAttribute('data-here');
    var listening = !you && s.listening ? String(s.listening) : '';
    if (listening) t.setAttribute('data-listening', 'true'); else t.removeAttribute('data-listening');
    t.removeAttribute('data-leaving');
    var cap = you ? 'you' : kind === 'agent' ? 'AI · reading' : listening ? '♫ ' + listening : here ? 'here' : place(s.currentPath);
    var capEl = t.querySelector('.town-tile__cap'); if (capEl.textContent !== cap) capEl.textContent = cap;
    var label = you ? 'You — noun ' + noun + ' — open your account'
      : nameOf(noun) + (kind === 'agent' ? ' (AI)' : '') + ' — ' + (here ? 'on this page' : 'at ' + (s.currentPath || '/')) + (listening ? ' — listening to ' + listening : '') + (s.mood ? ' — ' + s.mood : '');
    if (t.title !== label) { t.title = label; t.setAttribute('aria-label', label); }
  }

  function render() {
    var L = lineup(), now = Date.now();
    var max = phone.matches ? MAX_PHONE : MAX_DESKTOP;
    var shown = L.others.slice(0, max - 1);
    var extra = L.others.length - shown.length;
    var want = [{ key: 'you', s: null, you: true }].concat(shown.map(function (s) { return { key: tileKey(s.nounId), s: s }; }));
    var keep = {};
    want.forEach(function (w) { keep[w.key] = 1; st.lastSeen[w.key] = now; });

    // Leavers linger, dimmed, then go. Moments/invites/pills are rebuilt freely (they are few and static).
    Array.prototype.slice.call($lane.children).forEach(function (el) {
      var k = el.getAttribute('data-key');
      if (k === 'm' && !L.others.length && st.momentsShown) return; // the quiet-town recap stays put
      if (!k || el.className.indexOf('town-tile') < 0) { el.remove(); return; }
      if (keep[k]) return;
      if (now - (st.lastSeen[k] || 0) < LINGER_MS) { el.setAttribute('data-leaving', 'true'); return; }
      el.remove();
    });
    want.forEach(function (w, i) {
      var t = $lane.querySelector('.town-tile[data-key="' + w.key + '"]');
      if (!t) t = makeTile(w.key, w.you ? L.me : w.s.nounId);
      setTile(t, w.s, w.you);
      if ($lane.children[i] !== t) $lane.insertBefore(t, $lane.children[i] || null);
    });
    if (extra > 0) {
      var more = document.createElement('button'); more.type = 'button'; more.className = 'town-more';
      more.textContent = '+' + extra; more.title = extra + ' more in town — open attendance';
      more.setAttribute('data-town-more', '1');
      $lane.appendChild(more);
    }
    if (L.others.length) st.momentsShown = false;
    else if (!st.momentsShown) renderMoments();

    // Status + crowd weather.
    var total = st.live ? Math.max(1, st.humans + st.agents) : Math.max(1, L.others.length + 1);
    var here = L.others.filter(function (s) { return s.currentPath === st.myPath && s.kind !== 'agent'; }).length;
    var txt = total > 999 ? '1k+' : String(total);
    if ($count.textContent !== txt) $count.textContent = txt;
    $here.textContent = total === 1 ? 'in town' : 'here now';
    $sub.textContent = !st.live ? 'room is off' : total === 1 ? 'just you · say hi' : (here ? here + ' on this page' : 'none on this page') + (st.agents ? ' · ' + st.agents + ' AI' : '');
    var crowd = total <= 1 ? 'empty' : total <= 5 ? 'warm' : 'busy';
    if (root.getAttribute('data-crowd') !== crowd) root.setAttribute('data-crowd', crowd);
    if ($status) $status.setAttribute('aria-label', total + ' in town' + (here ? ', ' + here + ' on this page with you' : '') + ' — open attendance');
  }

  // Alone in town: the lane shows the last few things said, plus an invite.
  function renderMoments() {
    if (st.moments === null) {
      st.moments = [];
      fetch('/api/shortwave?limit=3', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
        st.moments = (j && Array.isArray(j.posts) ? j.posts : []).slice(0, 3);
        st.moments.forEach(function (p) { var n = Number(p.noun); if (!st.said[n]) st.said[n] = { who: String(p.who || ''), text: String(p.text || ''), at: Date.parse(p.at) || 0 }; });
        st.momentsShown = false; render();
      }).catch(function () {});
    }
    st.momentsShown = st.moments.length > 0;
    st.moments.forEach(function (p) {
      var a = document.createElement('a'); a.className = 'town-moment'; a.href = '/shortwave'; a.setAttribute('data-key', 'm');
      var img = document.createElement('img'); img.alt = ''; img.src = nounSrc(Number(p.noun) || 0);
      var sp = document.createElement('span');
      var b = document.createElement('b'); b.textContent = (p.who && p.who !== 'visitor' ? p.who : 'noun ' + p.noun) + ' ';
      var q = document.createTextNode('“' + String(p.text || '').slice(0, 70) + '” ');
      var i = document.createElement('i'); i.textContent = ago(Date.now() - (Date.parse(p.at) || Date.now()));
      sp.appendChild(b); sp.appendChild(q); sp.appendChild(i);
      a.appendChild(img); a.appendChild(sp); $lane.appendChild(a);
    });
    var inv = document.createElement('span'); inv.className = 'town-moment town-moment--invite'; inv.setAttribute('data-key', 'm');
    inv.textContent = 'quiet right now · tap a pad, the town hears it →';
    $lane.appendChild(inv);
  }

  // ── bubbles: what someone just said, floated over their tile ───
  function bubble(noun, text) {
    if (root.getAttribute('data-open') !== 'true' || !$bubbles) return;
    var key = noun === myNoun() ? 'you' : 'n' + noun;
    var t = $lane.querySelector('.town-tile[data-key="' + key + '"]');
    var deck = root.querySelector('.town__deck').getBoundingClientRect();
    var x = t ? t.getBoundingClientRect().left + t.offsetWidth / 2 - deck.left : deck.width / 2;
    x = Math.max(140, Math.min(deck.width - 140, x));
    var b = document.createElement('div'); b.className = 'town-bubble'; b.style.left = x + 'px';
    var who = document.createElement('b'); who.textContent = key === 'you' ? 'you' : nameOf(noun);
    b.appendChild(who); b.appendChild(document.createTextNode(String(text).slice(0, 90)));
    while ($bubbles.childElementCount > 2) $bubbles.firstElementChild.remove();
    $bubbles.appendChild(b);
    setTimeout(function () { try { b.remove(); } catch (e) {} }, 5200);
    if (t) { t.setAttribute('data-speaking', 'true'); setTimeout(function () { t.removeAttribute('data-speaking'); }, 5000); }
  }

  function flashTile(noun, attr, val, ms) {
    var key = noun === myNoun() ? 'you' : 'n' + noun;
    var t = $lane.querySelector('.town-tile[data-key="' + key + '"]'); if (!t) return;
    t.setAttribute(attr, val);
    clearTimeout(t['_' + attr]); t['_' + attr] = setTimeout(function () { t.removeAttribute(attr); }, ms);
  }

  // When three or more hits land within two seconds, the whole deck beats.
  function beat() {
    var now = Date.now();
    st.beats = st.beats.filter(function (t) { return now - t < 2000; }); st.beats.push(now);
    if (st.beats.length >= 3) {
      root.setAttribute('data-beat', 'true');
      clearTimeout(root._beat); root._beat = setTimeout(function () { root.removeAttribute('data-beat'); }, 180);
    }
  }

  // ── drums: every page can play with the town ───────────────────
  var homeSynth = !!document.querySelector('[data-play-first]');
  var audio = null, lastSent = 0;
  function ensureAudio() {
    if (!audio) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; audio = new AC(); }
    if (audio.state === 'suspended') { try { audio.resume(); } catch (e) {} }
    return audio;
  }
  // Same four voices as the front door's Rosebud (HomePlayFirst.astro).
  function play(drum, level) {
    var ctx = ensureAudio(); if (!ctx) return;
    var now = ctx.currentTime, gain = ctx.createGain(), out = ctx.createGain();
    out.gain.value = level || 1; gain.connect(out); out.connect(ctx.destination);
    if (drum === 'kick') {
      var osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(148, now); osc.frequency.exponentialRampToValueAtTime(43, now + 0.28);
      gain.gain.setValueAtTime(0.82, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain); osc.start(now); osc.stop(now + 0.32);
    } else {
      var size = Math.floor(ctx.sampleRate * 0.38), buf = ctx.createBuffer(1, size, ctx.sampleRate), data = buf.getChannelData(0);
      for (var i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
      var noise = ctx.createBufferSource(), filter = ctx.createBiquadFilter(); noise.buffer = buf;
      filter.type = drum === 'bloom' ? 'bandpass' : 'highpass';
      filter.frequency.value = drum === 'bloom' ? 1450 : drum === 'dew' ? 7600 : 3100;
      filter.Q.value = drum === 'bloom' ? 0.75 : 1.2;
      gain.gain.setValueAtTime(drum === 'bloom' ? 0.46 : 0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (drum === 'dew' ? 0.075 : 0.18));
      noise.connect(filter); filter.connect(gain); noise.start(now); noise.stop(now + 0.38);
    }
  }
  function padFlash(drum) {
    var p = root.querySelector('[data-town-pad="' + drum + '"]'); if (!p) return;
    p.setAttribute('data-hit', 'true'); setTimeout(function () { p.removeAttribute('data-hit'); }, 110);
  }
  function myHit(drum) {
    padFlash(drum); flashTile(myNoun(), 'data-drum', drum, 220); beat();
    if (homeSynth) {
      // The front door's synth plays it and HomeWelcome carries it across town.
      window.dispatchEvent(new CustomEvent('pc:rosebud:hit', { detail: { drum: drum } }));
      return;
    }
    play(drum, 1);
    var now = Date.now(); if (now - lastSent < 130) return; lastSent = now;
    window.dispatchEvent(new CustomEvent('pc:presence:send', { detail: { type: 'signal', event: 'drum:' + drum } }));
    window.dispatchEvent(new CustomEvent('pc:dock:event', { detail: { name: 'dock:drum', drum: drum } }));
  }
  root.querySelectorAll('[data-town-pad]').forEach(function (b) {
    on(b, 'pointerdown', function (e) { e.preventDefault(); myHit(b.getAttribute('data-town-pad')); });
    on(b, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); myHit(b.getAttribute('data-town-pad')); } });
  });
  // Hits made elsewhere on the front door still pulse your tile.
  on(window, 'pc:rosebud:played', function (e) {
    var d = e && e.detail && e.detail.drum; if (DRUMS.indexOf(d) < 0) return;
    padFlash(d); flashTile(myNoun(), 'data-drum', d, 220); beat();
  });

  // ── the feed ────────────────────────────────────────────────────
  on(window, 'pc:presence', function (e) {
    var d = (e && e.detail) || {};
    st.live = true;
    st.sessions = Array.isArray(d.sessions) ? d.sessions : [];
    st.humans = d.humans || 0; st.agents = d.agents || 0;
    if (typeof d.myNoun === 'number') st.myNoun = d.myNoun;
    if (d.myPath) st.myPath = d.myPath;
    st.mySid = String(d.mySid || '');
    var sig = st.sessions.map(function (s) { return s.nounId + s.kind + (s.currentPath || '') + (s.mood || '') + (s.listening || ''); }).join('|') + '#' + st.humans + '/' + st.agents;
    if (sig !== st.sig) { st.sig = sig; render(); }

    (d.signals || []).forEach(function (sg) {
      if (!sg || !sg.id || st.seen[sg.id]) return; st.seen[sg.id] = 1;
      var m = /^drum:(kick|bloom|dew|thorn)$/.exec(String(sg.event || '')); if (!m) return;
      if (!st.primed || sg.sid === st.mySid || Date.now() - sg.at > 2500) return;
      flashTile(Number(sg.fromNoun), 'data-drum', m[1], 260); beat();
      // Remote hits only sound once this visitor has made a sound (browsers won't start audio uninvited);
      // on the front door, HomeWelcome already routes them to the Rosebud synth.
      if (!homeSynth && audio && audio.state === 'running') play(m[1], 0.4);
    });
    (d.waves || []).forEach(function (w) {
      var key = 'w' + w.fromNoun + ':' + w.toNoun + ':' + w.at; if (st.seen[key]) return; st.seen[key] = 1;
      if (!st.primed && Date.now() - w.at > 4000) return;
      flashTile(Number(w.fromNoun), 'data-waving', 'true', 1000);
      // Someone waved at you: the deck opens even if you folded it (not remembered).
      if (w.toNoun === myNoun() && w.fromNoun !== myNoun() && root.getAttribute('data-open') !== 'true') setOpen(true, false);
    });
    st.primed = true;
    if (Object.keys(st.seen).length > 800) st.seen = {};
  });
  on(window, 'pc:shortwave:post', function (e) {
    var p = e && e.detail && e.detail.post; if (!p) return;
    var n = Number(p.noun) || 0;
    st.said[n] = { who: String(p.who || ''), text: String(p.text || ''), at: Date.now() };
    bubble(n, String(p.text || ''));
  });

  // ── clicks: a tile opens its attendance row; you open your account ──
  on($lane, 'click', function (e) {
    var more = e.target.closest && e.target.closest('[data-town-more]');
    if (more) { window.dispatchEvent(new CustomEvent('pc:attendance:open', { detail: { noun: -1 } })); return; }
    var t = e.target.closest && e.target.closest('.town-tile'); if (!t) return;
    if (t.getAttribute('data-key') === 'you') { window.dispatchEvent(new CustomEvent('pc:dock-show', { detail: { view: 'account' } })); return; }
    window.dispatchEvent(new CustomEvent('pc:attendance:open', { detail: { noun: Number(t.getAttribute('data-noun')) } }));
  });
  if ($status) on($status, 'click', function () { window.dispatchEvent(new CustomEvent('pc:attendance:open', { detail: { noun: -1 } })); });

  on(phone, 'change', render);
  // Captions age ("just now" → "3m ago") and linger-outs need a sweep even when the town is quiet.
  setInterval(function () { if (!document.hidden) render(); }, 5000);
  render();
}
