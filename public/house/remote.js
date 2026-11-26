// House Channel, the phone remote. It keeps nothing but the room name for this
// tab, sends commands, and shows what the TV says is true. The TV decides.
import { BURN_MINUTES, MIN_LOGS_TO_LIGHT, PLACES, cleanCode, clockText, decodeState, isRoomId, parseCircleLink } from './core.js';
import { makeDrumRoom, makeParty, postJson, randomId } from './party.js';

var $ = function (id) { return document.getElementById(id); };
var SAVE_KEY = 'hc.remote.v0';
var R = { room: '', pid: '', party: null, st: null, lastStateAt: 0, drum: null, drumFor: '', hold: null, endArmed: 0, hb: 0, dragging: {} };
var buzz = function (pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} };

function show(which) { ['join', 'main', 'ended'].forEach(function (id) { $(id).hidden = id !== which; }); }
function cmd(c, more) {
  if (!R.party) return false;
  var d = { t: 'cmd', c: c };
  if (more) for (var k in more) if (Object.prototype.hasOwnProperty.call(more, k)) d[k] = more[k];
  return R.party.send(d);
}

// ── pairing ─────────────────────────────────────────────────────────────
function connect(room) {
  R.room = room; R.st = null; R.lastStateAt = 0;
  try { sessionStorage.setItem(SAVE_KEY, JSON.stringify({ room: room, pid: R.pid })); } catch (e) {}
  show('main'); setStatus('', 'Connecting to the TV…');
  R.party = makeParty({ room: room, pid: R.pid, onFrame: onFrame, onStatus: function (s) {
    if (s === 'on') { R.party.send({ t: 'hi' }); setStatus('', 'Looking for the TV…'); }
    else if (s === 'unsupported') setStatus('bad', 'The relay on this site cannot carry House Channel yet.');
    else if (s === 'offline') setStatus('bad', 'This phone is offline. Trying again.');
    else if (s !== 'off') setStatus('', 'Reconnecting…');
  } });
  clearInterval(R.hb);
  R.hb = setInterval(function () {
    if (!R.party) return;
    R.party.send({ t: R.st ? 'hb' : 'hi' });
    if (R.st && Date.now() - R.lastStateAt > 12000) setStatus('bad', 'The TV is not answering. Is the page still open on it?');
  }, 8000);
}
function forget(title, text) {
  clearInterval(R.hb);
  if (R.party) { R.party.close(); R.party = null; }
  if (R.drum) { R.drum.close(); R.drum = null; R.drumFor = ''; }
  R.room = ''; R.st = null;
  try { sessionStorage.removeItem(SAVE_KEY); } catch (e) {}
  $('circle').value = '';
  if (title) { $('endedTitle').textContent = title; $('endedText').textContent = text; show('ended'); } else show('join');
}
$('joinForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var code = cleanCode($('code').value), err = $('joinErr'), btn = $('joinBtn');
  if (!code) { err.textContent = 'A code is five letters. Check the TV.'; return; }
  err.textContent = ''; btn.disabled = true;
  postJson('/api/house', { action: 'join', code: code }).then(function (r) {
    btn.disabled = false;
    if (r.ok && isRoomId(r.room)) { $('code').value = ''; connect(r.room); return; }
    err.textContent = r.error === 'rate-limited' ? 'Too many tries. Wait a minute, then type the code on the TV.'
      : r.error === 'no-such-code' ? 'No TV is showing that code. Codes last ten minutes; check the TV and try again.'
      : r.error === 'offline' ? 'This phone is offline.' : 'Pairing is not answering right now. Try again in a moment.';
  });
});
$('again').addEventListener('click', function () { show('join'); $('code').focus(); });

function onFrame(f) {
  if (f.o !== 'tv') return;
  if (f.t === 'bye') { forget('Ended', 'The TV is dark and the pairing is forgotten.'); return; }
  if (f.t === 'full' && f.to === R.pid) { forget('The TV is full', 'Eight phones are already paired with that TV.'); return; }
  if (f.t === 'tv-away') { setStatus('bad', 'The TV page was closed or reloaded.'); return; }
  var st = decodeState(f);
  if (!st) return;
  R.st = st; R.lastStateAt = Date.now();
  render();
}

// ── drawing what the TV says ────────────────────────────────────────────
function setStatus(kind, text) { $('status').className = 'status ' + kind; $('statusText').textContent = text; }
function pressed(el, on) { el.setAttribute('aria-pressed', on ? 'true' : 'false'); }
function setRange(id, value) { if (!R.dragging[id]) $(id).value = value; }
function hourText(h) { var hh = Math.floor(h), mm = h % 1 ? '30' : '00'; return (hh % 12 === 0 ? 12 : hh % 12) + ':' + mm + (hh < 12 ? ' am' : ' pm'); }
function render() {
  var st = R.st; if (!st) return;
  setStatus('on', 'Paired with the TV · ' + st.phones + (st.phones === 1 ? ' phone' : ' phones') + (st.dim ? ' · TV dimmed, touch anything to wake it' : ''));
  var tabs = document.querySelectorAll('.tabs button'), i;
  for (i = 0; i < tabs.length; i += 1) pressed(tabs[i], tabs[i].getAttribute('data-view') === st.view);
  ['hearth', 'window', 'lights', 'drum', 'off'].forEach(function (v) { $('p-' + v).hidden = v !== st.view; });

  // hearth
  var h = st.hearth, lit = h.phase === 'catching' || h.phase === 'burning' || h.phase === 'embers';
  $('fireTime').textContent = lit ? clockText(h.remainingSec) : '';
  $('fireHint').textContent = lit ? 'press and hold to breathe on it'
    : h.phase === 'stacked' ? (h.logs < MIN_LOGS_TO_LIGHT ? 'one more log' : 'press and hold to light')
    : h.phase === 'out' ? 'burned down · add a log' : h.phase === 'snuffed' ? 'lid on · add a log to start again' : 'add two logs';
  $('stack').textContent = lit ? 'Add a log (+10 min)' : 'Add a log';
  $('clear').disabled = lit; $('lidGrip').style.opacity = lit ? 1 : 0.4;
  var mins = document.querySelectorAll('#minutes button');
  for (i = 0; i < mins.length; i += 1) { pressed(mins[i], Number(mins[i].getAttribute('data-m')) === h.minutes); mins[i].disabled = lit; }
  drawFire();

  // window
  var sky = st.sky, tag = $('skyTag');
  tag.className = 'tag ' + (sky.status === 'live' || sky.status === 'part' ? 'live' : sky.status === 'sim' ? 'sim' : '');
  tag.textContent = sky.status === 'live' ? 'Live' : sky.status === 'part' ? 'Live in part' : sky.status === 'sim' ? 'Simulated' : 'Reading';
  $('skyText').textContent = sky.status === 'live' ? 'Weather and tide for ' + sky.placeName + ' are read from live sources.'
    : sky.status === 'part' ? 'Some live readings for ' + sky.placeName + ' are missing; the TV says which.'
    : sky.status === 'sim' ? (sky.mode === 'auto' ? 'Live weather could not be read, so the TV shows a simulated sky and says so.' : 'Made-up values, labelled on the TV.')
    : 'The TV is reading the sky.';
  var places = document.querySelectorAll('#places button');
  for (i = 0; i < places.length; i += 1) pressed(places[i], places[i].getAttribute('data-p') === sky.place);
  var modes = document.querySelectorAll('#skyMode button');
  for (i = 0; i < modes.length; i += 1) pressed(modes[i], modes[i].getAttribute('data-mode') === sky.mode);
  $('simBox').hidden = sky.status !== 'sim';
  setRange('simHour', sky.sim.hour); setRange('simCloud', sky.sim.cloud); setRange('simWind', sky.sim.wind); setRange('simTide', sky.sim.tide);
  $('simHourText').textContent = hourText(Number($('simHour').value)); $('simCloudText').textContent = $('simCloud').value + '%';
  $('simWindText').textContent = $('simWind').value + ' mph'; $('simTideText').textContent = Number($('simTide').value) < 34 ? 'low' : Number($('simTide').value) > 66 ? 'high' : 'mid';

  // lights
  var l = st.lights, lt = $('lightsTag');
  lt.className = 'tag ' + (l.status === 'live' ? 'live' : l.status === 'demo' ? 'sim' : '');
  lt.textContent = l.status === 'live' ? 'Live' : l.status === 'demo' ? 'Demo' : l.status === 'gone' ? 'Not found' : l.status === 'down' ? 'Unreachable' : 'No circle';
  $('lightsText').textContent = l.status === 'live' ? 'The TV is showing your circle.'
    : l.status === 'demo' ? 'The Light Companion service is not on this site yet, so the TV shows a demo circle, labelled as a demo. They are not real people.'
    : l.status === 'gone' ? 'There is no circle at that link.'
    : l.status === 'down' ? 'The TV cannot read the circle right now, so it shows no windows.'
    : 'Paste a circle link to put its windows on the TV.';
  pressed($('names'), l.names); $('names').textContent = l.names ? 'Hide names on the TV' : 'Show names on the TV';
  $('circleClear').disabled = !l.hasCircle;

  // drum
  if (st.view === 'drum' && st.drum && R.drumFor !== st.drum) {
    if (R.drum) R.drum.close();
    R.drumFor = st.drum;
    R.drum = makeDrumRoom({ room: st.drum, pid: R.pid, onPeople: function (n) { $('drumText').textContent = n > 1 ? (n - 1) + ' other screen' + (n > 2 ? 's' : '') + ' in the room, the TV included.' : 'Connecting to the room…'; } });
  } else if (st.view !== 'drum' && R.drum) { R.drum.close(); R.drum = null; R.drumFor = ''; }
  if (st.drum) $('drumLink').href = '/drum-room-v2?room=' + encodeURIComponent(st.drum);

  // sound
  var s = st.sound;
  $('soundBtn').textContent = s.on ? 'Turn sound off' : 'Turn sound on';
  $('soundBtn').className = s.on ? 'btn ghost' : 'btn';
  $('muteBtn').textContent = s.muted ? 'Unmute' : 'Mute'; $('muteBtn').disabled = !s.on;
  $('soundText').textContent = !s.on ? 'The TV starts silent. Sound comes from the TV, never from this phone.'
    : s.needTap ? 'The TV’s browser wants one press on the TV itself before it will play sound. Press OK on the TV remote, or click the page. It is showing a prompt.'
    : s.muted ? 'Sound is on and muted.' : 'Sound is on at the TV.';
  setRange('vol', s.vol); $('volText').textContent = $('vol').value + '%';
  $('pairMoreText').textContent = st.code ? 'The TV is showing code ' + st.code + ' in its corner. On the other phone: pointcast.xyz/house/r' : '';
}
function drawFire() {
  var c = $('fireCanvas'), box = c.parentNode.getBoundingClientRect(), w = Math.round(box.width), hgt = Math.round(box.height);
  if (!w) return;
  if (c.width !== w || c.height !== hgt) { c.width = w; c.height = hgt; }
  var g = c.getContext('2d'), st = R.st, h = st ? st.hearth : { logs: 0, phase: 'bare' }, lit = h.phase === 'catching' || h.phase === 'burning' || h.phase === 'embers';
  g.clearRect(0, 0, w, hgt);
  var cx = w / 2, floor = hgt * 0.72, p = R.hold && !lit ? R.hold.p : 0;
  if (lit || p) { var gl = g.createRadialGradient(cx, floor - 30, 5, cx, floor - 30, 150); gl.addColorStop(0, 'rgba(255,150,60,' + (lit ? 0.45 : 0.4 * p) + ')'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, hgt); }
  var spots = [[-30, 0], [30, 0], [0, -14], [-16, -28], [16, -28]];
  for (var i = 0; i < h.logs && h.phase !== 'out'; i += 1) { g.fillStyle = '#5a3a24'; g.fillRect(cx + spots[i][0] - 34, floor + spots[i][1] - 7, 68, 14); g.fillStyle = '#7a563a'; g.beginPath(); g.arc(cx + spots[i][0] + 34, floor + spots[i][1], 7, 0, Math.PI * 2); g.fill(); }
  if (lit) {
    var size = h.phase === 'embers' ? 0.35 : h.phase === 'catching' ? 0.6 : 1, breath = R.hold && R.hold.breath ? 0.3 : 0;
    g.fillStyle = 'rgba(255,120,30,.9)'; g.beginPath(); g.moveTo(cx - 36 * size, floor - 6); g.quadraticCurveTo(cx - 30, floor - 70 * (size + breath), cx, floor - 110 * (size + breath)); g.quadraticCurveTo(cx + 30, floor - 70 * (size + breath), cx + 36 * size, floor - 6); g.fill();
    g.fillStyle = 'rgba(255,225,150,.95)'; g.beginPath(); g.moveTo(cx - 16 * size, floor - 6); g.quadraticCurveTo(cx - 12, floor - 40 * size, cx, floor - 62 * (size + breath)); g.quadraticCurveTo(cx + 12, floor - 40 * size, cx + 16 * size, floor - 6); g.fill();
  } else if (p) { g.fillStyle = 'rgba(255,190,90,' + (0.4 + 0.6 * p) + ')'; g.beginPath(); g.arc(cx, floor - 12, 4 + 16 * p, 0, Math.PI * 2); g.fill(); }
}

// ── the fire: press and hold to light, press and hold to breathe ────────
function holdStart(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (R.hold || !R.st) return;
  var h = R.st.hearth, lit = h.phase === 'catching' || h.phase === 'burning' || h.phase === 'embers';
  if (!lit && (h.phase !== 'stacked' || h.logs < MIN_LOGS_TO_LIGHT)) { buzz(8); return; }
  R.hold = { at: Date.now(), p: 0, breath: lit, lastSend: 0, done: false };
  buzz(10);
  R.hold.timer = setInterval(function () {
    var hold = R.hold; if (!hold) return;
    var now = Date.now(), age = now - hold.at;
    if (hold.breath) {
      if (now - hold.lastSend >= 260) { hold.lastSend = now; cmd('breath', { s: Math.min(1, age / 1500) }); buzz(6); }
    } else if (!hold.done) {
      hold.p = Math.min(1, age / 1600);
      if (now - hold.lastSend >= 200) { hold.lastSend = now; cmd('spark', { p: Math.round(hold.p * 100) / 100 }); buzz(5); }
      if (hold.p >= 1) { hold.done = true; cmd('light'); buzz(40); }
    }
    drawFire();
  }, 60);
}
function holdEnd() { if (!R.hold) return; clearInterval(R.hold.timer); R.hold = null; drawFire(); }
var fire = $('fire');
fire.addEventListener('pointerdown', holdStart);
['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { fire.addEventListener(n, holdEnd); });
fire.addEventListener('contextmenu', function (e) { e.preventDefault(); });
fire.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) holdStart(e); });
fire.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') holdEnd(); });

// the lid: drag the grip down over the fire, or press it from a keyboard
var grip = $('lidGrip'), lid = $('lid'), drag = null;
function snuff() { if (cmd('snuff')) buzz([20, 40, 20]); }
grip.addEventListener('pointerdown', function (e) { e.preventDefault(); drag = { y: e.clientY, d: 0 }; try { grip.setPointerCapture(e.pointerId); } catch (err) {} });
grip.addEventListener('pointermove', function (e) { if (!drag) return; drag.d = e.clientY - drag.y; lid.style.top = Math.min(150, -44 + Math.max(0, Math.abs(drag.d)) * 1.6) + 'px'; });
function dragEnd() { if (!drag) return; var far = Math.abs(drag.d) > 70; drag = null; lid.style.top = '-44px'; if (far) snuff(); }
grip.addEventListener('pointerup', dragEnd); grip.addEventListener('pointercancel', dragEnd);
grip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); snuff(); } });

// ── buttons ─────────────────────────────────────────────────────────────
document.querySelector('.tabs').addEventListener('click', function (e) { var v = e.target.getAttribute && e.target.getAttribute('data-view'); if (v) { cmd('view', { v: v }); buzz(8); } });
$('stack').addEventListener('click', function () { if (cmd('stack')) buzz(15); });
$('clear').addEventListener('click', function () { cmd('clear'); });
$('minutes').addEventListener('click', function (e) { var m = e.target.getAttribute && e.target.getAttribute('data-m'); if (m) cmd('minutes', { m: Number(m) }); });
PLACES.forEach(function (p) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-p', p.id); b.textContent = p.name; $('places').appendChild(b); });
$('places').addEventListener('click', function (e) { var p = e.target.getAttribute && e.target.getAttribute('data-p'); if (p) cmd('place', { p: p }); });
$('skyMode').addEventListener('click', function (e) { var m = e.target.getAttribute && e.target.getAttribute('data-mode'); if (m) cmd('sky', { mode: m }); });
function slider(id, send) {
  var el = $(id), last = 0, pending = null;
  var push = function () { pending = null; last = Date.now(); send(Number(el.value)); };
  el.addEventListener('input', function () { R.dragging[id] = true; if (R.st) render(); if (Date.now() - last > 150) push(); else if (!pending) pending = setTimeout(push, 160); });
  el.addEventListener('change', function () { clearTimeout(pending); push(); setTimeout(function () { R.dragging[id] = false; }, 600); });
}
slider('simHour', function (v) { cmd('sim', { k: 'hour', v: v }); });
slider('simCloud', function (v) { cmd('sim', { k: 'cloud', v: v }); });
slider('simWind', function (v) { cmd('sim', { k: 'wind', v: v }); });
slider('simTide', function (v) { cmd('sim', { k: 'tide', v: v }); });
slider('vol', function (v) { cmd('vol', { v: v }); });
$('circleSet').addEventListener('click', function () {
  var id = parseCircleLink($('circle').value.replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, ''));
  if (!id) { $('circleErr').textContent = 'That does not look like a circle link. It ends in 32 letters and numbers.'; return; }
  $('circleErr').textContent = ''; cmd('circle', { id: id }); $('circle').value = '';
});
$('circleClear').addEventListener('click', function () { cmd('circle', { id: '' }); });
$('names').addEventListener('click', function () { if (R.st) cmd('names', { on: !R.st.lights.names }); });
['kick', 'snare', 'hat', 'tom', 'clap', 'bell'].forEach(function (pad) {
  var b = document.createElement('button'); b.type = 'button'; b.className = 'pad'; b.textContent = pad;
  b.addEventListener('pointerdown', function (e) { e.preventDefault(); if (R.drum && R.drum.hit(pad, 0.85)) { buzz(12); b.className = 'pad hit'; setTimeout(function () { b.className = 'pad'; }, 120); } });
  b.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat && R.drum) R.drum.hit(pad, 0.85); });
  $('pads').appendChild(b);
});
$('soundBtn').addEventListener('click', function () { if (R.st) cmd('sound', { on: !R.st.sound.on }); });
$('muteBtn').addEventListener('click', function () { if (R.st) cmd('mute', { on: !R.st.sound.muted }); });
$('pairMore').addEventListener('click', function () { cmd('pair'); });
$('end').addEventListener('click', function () {
  var b = $('end'), now = Date.now();
  if (now - R.endArmed < 5000) {
    R.endArmed = 0; b.textContent = 'End';
    var sent = cmd('end');
    // if the TV cannot be reached, still forget on this side
    setTimeout(function () { if (R.room) forget('Ended on this phone', sent ? 'The TV did not confirm. If it is still lit, reload its page.' : 'This phone could not reach the TV. If it is still lit, reload its page.'); }, 2500);
    return;
  }
  R.endArmed = now; b.textContent = 'Tap again to end';
  setTimeout(function () { if (R.endArmed === now) { R.endArmed = 0; b.textContent = 'End'; } }, 5000);
});
addEventListener('pagehide', function () { if (R.party) R.party.send({ t: 'left' }); });
addEventListener('resize', drawFire);

// ── start ───────────────────────────────────────────────────────────────
(function boot() {
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
  R.pid = saved && /^[a-z0-9]{8}$/.test(saved.pid || '') ? saved.pid : randomId(8);
  if (saved && isRoomId(saved.room)) connect(saved.room); else show('join');
  void BURN_MINUTES;
}());
window.__remote = R;
