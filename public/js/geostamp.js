// Copy of https://elsegundo.xyz/ping/geostamp.js, the shared El Segundo network check-in card.
// Hosted here so PointCast pages load no script from another origin. Refresh it from that URL when it changes.
// The geostamp: today's check-in, offered once on arrival, from anywhere.
// Drop on any page in the network:
//   <script src="https://elsegundo.xyz/ping/geostamp.js" data-site="pointcast" async></script>
// or mount inline with <div data-geostamp data-site="industry-next"></div>.
//
// A small card offers the site's call for today. Answer it, or check in from
// somewhere else with a town or ZIP, add a what-I'm-doing line if you like, and
// the check-in leaves a postmark: place, local time, weather, tide, sunset, moon.
// Skippable. No account. The browser keeps your line and key (the same key the
// ping uses), the last place you typed and whether you skipped today. That's all.
// "Use my location" rounds to about 11 km in this browser before anything is sent.
// Do Not Track or Global Privacy Control: the card never opens by itself, a small
// "Check in" tab waits instead.
(function () {
  'use strict';
  if (window.__esGeostamp) return; window.__esGeostamp = true;
  var me = document.currentScript;
  if (!me) { var all = document.getElementsByTagName('script'); for (var s = all.length - 1; s >= 0; s--) { if (/\/ping\/geostamp\.js(\?|$)/.test(all[s].src || '')) { me = all[s]; break; } } }
  var BASE = 'https://elsegundo.xyz';
  try { if (me && me.src) BASE = new URL(me.src).origin; } catch (e) { /* keep the default */ }
  // A site that hosts its own copy of this file points it back at the shared service.
  try { var api = me && me.getAttribute('data-api'); if (api && new URL(api).protocol === 'https:') BASE = new URL(api).origin; } catch (e) { /* keep BASE */ }
  var API = BASE + '/api/v1/ping';
  var LINE_KEY = 'es-ping-line-v1', STATE_KEY = 'es-geostamp-v1';
  var ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
  var VOICES = { 'el-segundo': 'neighbor', pointcast: 'broadcast', 'industry-next': 'builder', university: 'study' };

  function siteFromPage() {
    var attr = me && me.getAttribute('data-site');
    if (attr) return attr;
    var p = location.pathname;
    if (/^\/industry-next\//.test(p)) return 'industry-next';
    if (/^\/university\//.test(p)) return 'university';
    return 'el-segundo';
  }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private window */ } }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text !== undefined && text !== null) e.textContent = text; if (cls) e.className = cls; return e; }
  function trim(v) { return String(v || '').replace(/^\s+|\s+$/g, ''); }
  function getJSON(url) { return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); }).catch(function () { return null; }); }
  function postJSON(body) { return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }).catch(function () { return null; }); }
  function zeroBits(bytes) { var bits = 0; for (var i = 0; i < bytes.length; i++) { if (bytes[i] === 0) { bits += 8; continue; } var b = bytes[i]; while (!(b & 128)) { b = b << 1; bits++; } return bits; } return bits; }
  function work(challenge, bits) {
    var enc = new TextEncoder();
    return new Promise(function (resolve, reject) {
      var i = 0;
      (function step() {
        var nonce = i.toString(36);
        crypto.subtle.digest('SHA-256', enc.encode(challenge + '|' + nonce)).then(function (buf) {
          if (zeroBits(new Uint8Array(buf)) >= bits) { resolve(nonce); return; }
          i++; if (i % 400 === 0) setTimeout(step, 0); else step();
        }, reject);
      })();
    });
  }
  function freshSalt() { var a = new Uint8Array(12); crypto.getRandomValues(a); var out = ''; for (var i = 0; i < a.length; i++) out += ALPHABET.charAt(a[i] % ALPHABET.length); return out; }
  function challengeFor(day, siteId, salt) { return (siteId === 'el-segundo' ? ['elsegundo.xyz', 'ping/1', day, salt] : ['elsegundo.xyz', 'ping/1', day, siteId, salt]).join('|'); }
  var quiet = (function () { try { return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true; } catch (e) { return false; } })();

  var CSS = [
    ':host{all:initial}',
    '.gs{--ink:#14213d;--bg:#fbfaf5;--accent:#0b5cad;--soft:rgba(20,33,61,.14);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink)}',
    '.gs[data-voice=neighbor]{--ink:#f6f3ea;--bg:#17212b;--accent:#8fd3c1;--soft:rgba(246,243,234,.18)}',
    '.gs[data-voice=broadcast]{--ink:#f4f1e8;--bg:#111418;--accent:#ff7a3d;--soft:rgba(244,241,232,.18)}',
    '.gs[data-voice=builder]{--ink:#07152f;--bg:#fffdf6;--accent:#1028dc}',
    '.gs[data-voice=study]{--ink:#1d2b24;--bg:#f2efe4;--accent:#0d6b46}',
    '.dock{position:fixed;z-index:2147483000;left:12px;right:12px;bottom:12px;display:flex;justify-content:flex-start;pointer-events:none}',
    '.card{pointer-events:auto;box-sizing:border-box;width:100%;max-width:400px;max-height:calc(100vh - 24px);overflow:auto;background:var(--bg);color:var(--ink);border-radius:12px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.28)}',
    '.inline .card{box-shadow:none;border:1px solid var(--soft);max-width:none}',
    '.eyebrow{display:flex;align-items:center;gap:8px;margin:0 0 4px;font:600 12px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}',
    '.dot{width:8px;height:8px;border-radius:50%;background:var(--accent)}',
    '.call{margin:0 0 10px;font-size:20px;font-weight:800;line-height:1.15}',
    '.row{display:flex;gap:8px;flex-wrap:wrap}',
    'button{font:inherit;cursor:pointer;min-height:44px;border-radius:999px;padding:8px 16px;border:2px solid var(--accent);background:transparent;color:var(--ink);font-weight:600}',
    'button.primary{background:var(--accent);color:var(--bg)}',
    'button.ghost{border-color:transparent;opacity:.8}',
    'button:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:2px}',
    'button:disabled{opacity:.5;cursor:default}',
    '.choices{display:grid;gap:8px;margin:0 0 12px}',
    '.choice{text-align:left;border-radius:14px;background:var(--ink);color:var(--bg);border-color:var(--ink)}',
    '.choice[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--bg)}',
    '.choice.else{background:transparent;color:var(--ink);border-style:dashed}',
    '.choice.else[aria-pressed=true]{background:var(--accent);color:var(--bg);border-style:solid}',
    'label{display:block;margin:0 0 10px;font-size:13px}',
    'input[type=text]{display:block;box-sizing:border-box;width:100%;min-height:44px;margin-top:4px;padding:8px 10px;font:inherit;color:var(--ink);background:transparent;border:1px solid var(--soft);border-radius:8px}',
    '.where{display:flex;gap:8px;align-items:flex-end}.where label{flex:1;margin:0}',
    'fieldset{border:0;margin:0 0 10px;padding:0;font-size:13px}legend{padding:0;margin:0 0 4px}',
    '.radio{display:inline-flex;align-items:center;gap:6px;margin:0 12px 6px 0;min-height:32px}.radio input{accent-color:var(--accent);width:18px;height:18px}',
    '.note{margin:8px 0 0;font-size:12px;opacity:.75}',
    '.status{min-height:1.2em;margin:8px 0 0;font-size:13px}',
    '.stamp{position:relative;margin:4px 0 10px;padding:14px 16px;border:3px double var(--accent);border-radius:14px;transform:rotate(-1.5deg);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
    '.stamp:after{content:"";position:absolute;right:-6px;top:10px;width:90px;height:44px;opacity:.35;background:repeating-linear-gradient(170deg,var(--accent) 0 2px,transparent 2px 9px);border-radius:8px;pointer-events:none}',
    '.stamp .place{margin:0;font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:.06em;color:var(--accent)}',
    '.stamp .time{margin:2px 0;font-size:26px;font-weight:800}',
    '.stamp .wx{margin:0;font-size:12px;letter-spacing:.04em}',
    '.stamp .code{margin:6px 0 0;font-size:11px;opacity:.75}',
    '.badges{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px;padding:0;list-style:none}.badges li{padding:3px 10px;font-size:12px;font-weight:600;border:1px solid var(--accent);border-radius:999px}',
    'a{color:var(--accent)}',
    '.tab{pointer-events:auto;min-height:40px;padding:6px 14px;font-size:13px;background:var(--bg);color:var(--ink);box-shadow:0 4px 14px rgba(0,0,0,.25)}',
    '.chip{pointer-events:auto;display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border:2px double var(--accent);border-radius:999px;background:var(--bg);color:var(--ink);font:600 12px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.2)}',
    '@media (min-width:560px){.dock{left:16px;bottom:16px;right:auto}}',
    '@media (prefers-reduced-motion:no-preference){.card{animation:up .25s ease-out}@keyframes up{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}}',
  ].join('');

  function postmark(stamp, code, siteName) {
    var box = el('div', undefined, 'stamp');
    var parts = (stamp.line || '').split(' · ');
    box.appendChild(el('p', stamp.place ? stamp.place.label : (parts[0] || 'On the wire'), 'place'));
    box.appendChild(el('p', stamp.localTime || '', 'time'));
    var wx = [];
    if (stamp.tempF !== null && stamp.tempF !== undefined) wx.push(stamp.tempF + '°' + (stamp.sky ? ' ' + stamp.sky : ''));
    if (stamp.tide) wx.push(stamp.tide.next + ' tide ' + stamp.tide.at);
    if (stamp.sunset) wx.push('sunset ' + stamp.sunset);
    if (stamp.moon) wx.push(stamp.moon);
    if (wx.length) box.appendChild(el('p', wx.join(' · '), 'wx'));
    box.appendChild(el('p', (code ? code + ' · ' : '') + (siteName || ''), 'code'));
    return box;
  }

  function start() {
    var inlineHost = document.querySelector('[data-geostamp]');
    var siteId = (inlineHost && inlineHost.getAttribute('data-site')) || siteFromPage();
    var host = inlineHost || document.createElement('div');
    if (!inlineHost) { host.setAttribute('data-geostamp-dock', ''); document.body.appendChild(host); }
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var style = el('style'); style.textContent = CSS; root.appendChild(style);
    var wrap = el('div', undefined, 'gs' + (inlineHost ? ' inline' : '')); wrap.setAttribute('data-voice', VOICES[siteId] || 'neighbor');
    var dock = el('div', undefined, inlineHost ? '' : 'dock'); wrap.appendChild(dock); root.appendChild(wrap);

    var state = load(STATE_KEY) || {};
    var front = null;

    function clear() { while (dock.firstChild) dock.removeChild(dock.firstChild); }
    function chip(entry) {
      clear();
      var a = el('a', undefined, 'chip'); a.href = BASE + '/checkins/'; a.setAttribute('aria-label', 'Stamped today. See the check-in feed.');
      a.appendChild(el('span', '✓ Stamped'));
      a.appendChild(el('span', [entry.place, entry.time].filter(Boolean).join(' · ')));
      dock.appendChild(a);
    }
    function tab() {
      clear();
      var b = el('button', 'Check in', 'tab'); b.type = 'button';
      b.addEventListener('click', function () { offer(true); });
      dock.appendChild(b);
    }

    function offer(open) {
      clear();
      var card = el('section', undefined, 'card'); card.setAttribute('aria-label', 'Today\'s check-in');
      var eb = el('p', undefined, 'eyebrow'); eb.appendChild(el('span', undefined, 'dot')); eb.appendChild(el('span', 'Today\'s call ' + (front ? front.today.day : '')));
      card.appendChild(eb);
      card.appendChild(el('p', front ? front.today.call : 'Tuning in…', 'call'));
      dock.appendChild(card);
      if (!open) {
        card.appendChild(el('p', 'Check in from wherever you are. It leaves a postmark.', 'note'));
        var row = el('div', undefined, 'row'); row.style.marginTop = '10px';
        var yes = el('button', 'Check in', 'primary'); yes.type = 'button';
        var no = el('button', 'Not today', 'ghost'); no.type = 'button';
        yes.addEventListener('click', function () { offer(true); });
        no.addEventListener('click', function () { state[siteId] = { day: front.today.day, skipped: true }; save(STATE_KEY, state); tab(); });
        row.appendChild(yes); row.appendChild(no); card.appendChild(row);
        return;
      }
      form(card);
    }

    function form(card) {
      card.appendChild(el('p', 'Pick a response, or check in from somewhere else. Every answer checks in.', 'note'));
      var choices = el('div', undefined, 'choices'); choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Responses');
      card.appendChild(choices);
      var picked = null, elsewhere = false;
      var opts = front.today.choices.slice(); var elseText = front.today.elsewhere || 'Checking in from somewhere else.';
      opts.push(elseText);
      opts.forEach(function (text, i) {
        var b = el('button', text, 'choice' + (i === opts.length - 1 ? ' else' : '')); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          picked = text; elsewhere = i === opts.length - 1;
          Array.prototype.forEach.call(choices.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
          if (elsewhere) placeInput.focus();
        });
        choices.appendChild(b);
      });
      var mine = load(LINE_KEY) || {};
      var whereRow = el('div', undefined, 'where');
      var whereLabel = el('label', 'Where? Town or ZIP (optional)');
      var placeInput = el('input'); placeInput.type = 'text'; placeInput.maxLength = 48; placeInput.placeholder = 'Elizabeth, NJ or 90245'; placeInput.value = state.lastPlace || '';
      whereLabel.appendChild(placeInput); whereRow.appendChild(whereLabel);
      var cell = null;
      var locate = el('button', 'Near me', ''); locate.type = 'button'; locate.title = 'Uses your browser location, rounded to about 11 km before it leaves this device';
      if (!navigator.geolocation) locate.hidden = true;
      locate.addEventListener('click', function () {
        status.textContent = 'Asking your browser… only a rough area is sent.';
        navigator.geolocation.getCurrentPosition(function (pos) {
          cell = { lat: Math.round(pos.coords.latitude * 10) / 10, lon: Math.round(pos.coords.longitude * 10) / 10 };
          placeInput.value = ''; placeInput.placeholder = 'Near you (about 11 km)';
          status.textContent = 'Got a rough area. Only that is sent, and it is not stored.';
        }, function () { status.textContent = 'No location. Type a town or ZIP instead, or leave it blank.'; }, { enableHighAccuracy: false, maximumAge: 600000, timeout: 10000 });
      });
      whereRow.appendChild(locate); card.appendChild(whereRow);
      card.appendChild(el('div')).style.height = '10px';
      var doingLabel = el('label', 'What are you up to? (optional, 80 characters)');
      var doing = el('input'); doing.type = 'text'; doing.maxLength = 80; doing.placeholder = 'Coffee on Main, then the courts';
      doingLabel.appendChild(doing); card.appendChild(doingLabel);
      var nameLabel = el('label', 'Name (optional, shown only if you pick the second option below)');
      var name = el('input'); name.type = 'text'; name.maxLength = 32; name.autocomplete = 'nickname'; name.placeholder = 'Leave blank to stay anonymous'; name.value = mine.name || '';
      nameLabel.appendChild(name); card.appendChild(nameLabel);
      var fs = el('fieldset'); fs.appendChild(el('legend', 'On the public feed, show'));
      var shows = [['place', 'Town only'], ['public', 'Town, name and what I\'m up to'], ['none', 'Nothing, just count me']];
      var chosen = state.show || 'place';
      shows.forEach(function (s) {
        var l = el('label', undefined, 'radio'); var r = el('input'); r.type = 'radio'; r.name = 'show'; r.value = s[0]; r.checked = s[0] === chosen;
        r.addEventListener('change', function () { chosen = s[0]; });
        l.appendChild(r); l.appendChild(document.createTextNode(s[1])); fs.appendChild(l);
      });
      card.appendChild(fs);
      var row = el('div', undefined, 'row');
      var go = el('button', 'Check in', 'primary'); go.type = 'button';
      var later = el('button', 'Not today', 'ghost'); later.type = 'button';
      row.appendChild(go); row.appendChild(later); card.appendChild(row);
      var status = el('p', '', 'status'); status.setAttribute('role', 'status'); card.appendChild(status);
      card.appendChild(el('p', 'Places are towns or ZIPs, never your street. No account, no cookies; this browser keeps your check-in line.', 'note'));
      later.addEventListener('click', function () { state[siteId] = { day: front.today.day, skipped: true }; save(STATE_KEY, state); tab(); });

      var busy = false;
      function send(withLine) {
        var salt = freshSalt();
        return work(challengeFor(front.today.day, siteId, salt), front.proofOfWork.difficultyBits).then(function (nonce) {
          var body = { response: picked, salt: salt, nonce: nonce, site: siteId, show: chosen };
          var p = trim(placeInput.value), d = trim(doing.value), n = trim(name.value), saved = load(LINE_KEY);
          if (p) body.place = p; else if (cell) body.cell = cell;
          if (d) body.status = d;
          if (n && chosen === 'public') body.name = n;
          if (saved && saved.kind) body.kind = saved.kind;
          if (withLine && saved && saved.line && saved.key) { body.line = saved.line; body.key = saved.key; }
          return postJSON(body);
        });
      }
      go.addEventListener('click', function () {
        if (busy) return;
        if (!picked) { status.textContent = 'Pick a response first.'; return; }
        if (elsewhere && !trim(placeInput.value) && !cell) { status.textContent = 'Somewhere else needs a town or ZIP, or tap Near me.'; placeInput.focus(); return; }
        var n = trim(name.value); if (n && (n.length < 2 || n.length > 32)) { status.textContent = 'Use a name of 2 to 32 characters, or leave it blank.'; return; }
        busy = true; go.disabled = true; status.textContent = 'Stamping…';
        send(true).then(function (res) {
          if (res && res.error && res.error.code === 'line_key_mismatch') { save(LINE_KEY, null); return send(false); }
          return res;
        }).then(function (res) {
          busy = false; go.disabled = false;
          if (!res || !res.ok) { status.textContent = (res && res.error && res.error.message) || 'The line is down right now. Nothing was saved.'; return; }
          var prev = load(LINE_KEY);
          if (res.key) save(LINE_KEY, { line: res.line, key: res.key, name: res.name, zone: res.zone, kind: res.kind });
          else if (prev) save(LINE_KEY, { line: prev.line, key: prev.key, name: res.name || prev.name, zone: res.zone || prev.zone, kind: res.kind || prev.kind });
          state.lastPlace = trim(placeInput.value) || state.lastPlace || '';
          state.show = chosen;
          done(card, res);
        }, function () { busy = false; go.disabled = false; status.textContent = 'The line is down right now. Nothing was saved.'; });
      });
    }

    function done(card, res) {
      while (card.firstChild) card.removeChild(card.firstChild);
      var g = res.geostamp && res.geostamp.stamp ? res.geostamp : null;
      var eb = el('p', undefined, 'eyebrow'); eb.appendChild(el('span', undefined, 'dot')); eb.appendChild(el('span', res.alreadyPinged ? 'Already stamped today' : 'Checked in'));
      card.appendChild(eb);
      if (g) card.appendChild(postmark({ line: g.stamp.line, place: g.place, localTime: g.stamp.localTime, tempF: g.stamp.tempF, sky: g.stamp.sky, sunset: g.stamp.sunset, tide: g.stamp.tide, moon: g.stamp.moon }, res.code, res.site && res.site.name));
      else card.appendChild(el('p', 'Code ' + res.code, 'call'));
      if (res.placeNote) card.appendChild(el('p', res.placeNote, 'note'));
      var line = [];
      if (typeof res.placeToday === 'number' && g && g.place) line.push(res.placeToday + ' check-in' + (res.placeToday === 1 ? '' : 's') + ' from ' + g.place.label + ' today.');
      if (res.network) line.push(res.network.persons + ' of ' + res.network.goal + ' this week across the network.');
      if (line.length) card.appendChild(el('p', line.join(' ')));
      if (res.badges && res.badges.length) { var ul = el('ul', undefined, 'badges'); res.badges.forEach(function (b) { ul.appendChild(el('li', b.label)); }); card.appendChild(ul); }
      if (res.streak) card.appendChild(el('p', res.streak + '-day streak · ' + res.title, 'note'));
      var row = el('div', undefined, 'row'); row.style.marginTop = '8px';
      var feed = el('a', 'See who else checked in'); feed.href = BASE + '/checkins/'; row.appendChild(feed);
      var close = el('button', 'Close', 'ghost'); close.type = 'button'; row.appendChild(close);
      card.appendChild(row);
      var entry = { day: res.day, code: res.code, place: g && g.place ? g.place.label : null, time: g ? g.stamp.localTime : null };
      state[siteId] = entry; save(STATE_KEY, state);
      close.addEventListener('click', function () { chip(entry); });
    }

    getJSON(API + '?site=' + encodeURIComponent(siteId)).then(function (r) {
      if (!r || !r.ok || !r.body || !r.body.today) return; // stay out of the way when the line is down
      front = r.body;
      var today = front.today.day, mine = state[siteId];
      if (mine && mine.day === today && mine.code) { if (!inlineHost) chip(mine); else offer(true); return; }
      if (inlineHost) { offer(true); return; }
      if ((mine && mine.day === today && mine.skipped) || quiet) { tab(); return; }
      setTimeout(function () { offer(false); }, 1200);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
