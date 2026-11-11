// House Channel core: the rules both screens share. Pure functions, no DOM,
// no network, so tests/house-channel.test.mjs can run them under node.
//
// The TV page is the only authority. It holds the state below, applies
// commands that paired phones send over the party relay, and broadcasts a
// compact copy of the state back. Nothing here is stored on a server.
//
// Written for old TV browsers too: no optional chaining, no `??`.

export var VIEWS = ['hearth', 'window', 'lights', 'drum', 'off'];
export var BURN_MINUTES = [15, 45, 90];
export var MAX_LOGS = 5;
export var MIN_LOGS_TO_LIGHT = 2;
export var LOG_BONUS_MINUTES = 10;
export var MAX_BURN_MINUTES = 90;
export var CATCH_MS = 25000;
export var MAX_PHONES = 8;
export var PHONE_STALE_MS = 25000;
export var IDLE_DIM_MS = 20 * 60000;
export var ROOM_IDLE_MS = 60 * 60000;
export var FRAME_MAX_BYTES = 512;

// Same alphabet as the Brick Choir TV rooms: no I, L or O, which read like 1 and 0 across a room.
export var CODE_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export var CODE_LEN = 5;

export var PLACES = [
  { id: 'el-segundo', name: 'El Segundo', lat: 33.92, lng: -118.42, tide: '9410840', tideName: 'Santa Monica' },
  { id: 'manhattan-beach', name: 'Manhattan Beach', lat: 33.88, lng: -118.41, tide: '9410840', tideName: 'Santa Monica' },
  { id: 'santa-monica', name: 'Santa Monica', lat: 34.01, lng: -118.5, tide: '9410840', tideName: 'Santa Monica' },
  { id: 'san-pedro', name: 'San Pedro', lat: 33.72, lng: -118.27, tide: '9410660', tideName: 'Los Angeles Outer Harbor' },
];

export var PHASES = ['bare', 'stacked', 'catching', 'burning', 'embers', 'out', 'snuffed'];
export var SKY_STATUS = ['wait', 'live', 'part', 'sim'];
export var LIGHTS_STATUS = ['none', 'live', 'demo', 'gone', 'down'];

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function int(n, fallback) { var v = Math.round(Number(n)); return isFinite(v) ? v : fallback; }

/** Letters only, upper case, exactly CODE_LEN from the alphabet. Returns '' for anything else. */
export function cleanCode(text) {
  var s = String(text == null ? '' : text).toUpperCase().replace(/[^A-Z]/g, '');
  if (s.length !== CODE_LEN) return '';
  for (var i = 0; i < s.length; i += 1) if (CODE_ALPHA.indexOf(s[i]) < 0) return '';
  return s;
}

/** The party room a pairing code resolves to. Unguessable; never typed by a person. */
export function isRoomId(text) { return typeof text === 'string' && /^bc-hc-[a-z0-9]{24}$/.test(text); }
export function isDrumRoom(text) { return typeof text === 'string' && /^house-[a-z0-9]{12}$/.test(text); }
export function placeOf(id) { for (var i = 0; i < PLACES.length; i += 1) if (PLACES[i].id === id) return PLACES[i]; return PLACES[0]; }

/** A Light Companion circle link, or the 32-character id at its end. Returns the id or ''. */
export function parseCircleLink(text) {
  var m = String(text == null ? '' : text).trim().match(/(?:^|\/light\/c\/)([a-z0-9]{32})\/?$/);
  return m ? m[1] : '';
}

export function newState(drumRoom) {
  return {
    rev: 0,
    view: 'hearth',
    sound: { on: false, vol: 40, muted: false },
    hearth: { logs: 0, minutes: 45, litAt: 0, endsAt: 0, endedAt: 0, ended: '' },
    sky: { place: PLACES[0].id, mode: 'auto', sim: { hour: 18, cloud: 40, wind: 8, tide: 50 } },
    lights: { circle: '', names: false },
    drum: isDrumRoom(drumRoom) ? drumRoom : '',
    lastInputAt: 0,
  };
}

/** Where the fire is at `now`. `level` is 0..1 flame height before any breath. */
export function hearthAt(state, now) {
  var h = state.hearth;
  if (h.litAt && now < h.endsAt) {
    var total = h.endsAt - h.litAt, left = h.endsAt - now, age = now - h.litAt;
    var emberMs = Math.max(60000, Math.min(4 * 60000, total * 0.1));
    if (age < CATCH_MS) return { phase: 'catching', level: 0.15 + 0.75 * (age / CATCH_MS), remainingMs: left, lit: true };
    if (left <= emberMs) return { phase: 'embers', level: 0.12 + 0.25 * (left / emberMs), remainingMs: left, lit: true };
    // a slow settle from full height to two thirds across the burn
    var mid = (age - CATCH_MS) / Math.max(1, total - CATCH_MS - emberMs);
    return { phase: 'burning', level: 0.95 - 0.3 * clamp(mid, 0, 1), remainingMs: left, lit: true };
  }
  if (h.ended === 'out') return { phase: 'out', level: 0, remainingMs: 0, lit: false };
  if (h.ended === 'snuffed') return { phase: 'snuffed', level: 0, remainingMs: 0, lit: false };
  return { phase: h.logs > 0 ? 'stacked' : 'bare', level: 0, remainingMs: 0, lit: false };
}

/**
 * Clock work the TV does every second. Returns the events that happened:
 *   'burned-out' when the fire reached the end of its time.
 */
export function tick(state, now) {
  var events = [];
  var h = state.hearth;
  if (h.litAt && now >= h.endsAt) {
    h.litAt = 0; h.endedAt = h.endsAt; h.ended = 'out'; h.endsAt = 0; h.logs = 0;
    state.rev += 1;
    events.push('burned-out');
  }
  return events;
}

/**
 * Apply one command from a phone. Mutates `state`, returns
 * { ok, changed, events } where events are things the TV acts on at once and
 * does not keep: 'spark', 'breath', 'lit', 'snuffed', 'stacked', 'pair', 'end',
 * 'sound-on', 'circle'. Unknown or malformed commands are refused.
 */
export function applyCommand(state, cmd, now) {
  var out = { ok: false, changed: false, events: [] };
  if (!cmd || typeof cmd !== 'object' || typeof cmd.c !== 'string') return out;
  var h = state.hearth;
  var fire = hearthAt(state, now);
  var done = function (event) { out.ok = true; out.changed = true; if (event) out.events.push(event); };
  var v;
  switch (cmd.c) {
    case 'view':
      if (VIEWS.indexOf(cmd.v) < 0) return out;
      if (state.view !== cmd.v) { state.view = cmd.v; done(); } else out.ok = true;
      break;
    case 'minutes':
      v = int(cmd.m, 0);
      if (BURN_MINUTES.indexOf(v) < 0 || fire.lit) return out;
      h.minutes = v; done();
      break;
    case 'stack':
      if (fire.lit) {
        // a log on a burning fire buys ten minutes, never more than ninety left
        if (h.logs >= MAX_LOGS && h.endsAt - now >= MAX_BURN_MINUTES * 60000) return out;
        h.logs = Math.min(MAX_LOGS, h.logs + 1);
        h.endsAt = Math.min(now + MAX_BURN_MINUTES * 60000, h.endsAt + LOG_BONUS_MINUTES * 60000);
        done('stacked');
      } else {
        if (h.ended) { h.ended = ''; h.endedAt = 0; h.logs = 0; }
        if (h.logs >= MAX_LOGS) return out;
        h.logs += 1; done('stacked');
      }
      break;
    case 'clear':
      if (fire.lit) return out;
      h.logs = 0; h.ended = ''; h.endedAt = 0; done();
      break;
    case 'spark':
      // the hold-to-light gesture in progress; nothing is kept
      if (fire.lit || h.ended || h.logs < MIN_LOGS_TO_LIGHT) return out;
      out.ok = true; out.events.push('spark');
      out.amount = clamp(Number(cmd.p) || 0, 0, 1);
      break;
    case 'light':
      if (fire.lit || h.ended || h.logs < MIN_LOGS_TO_LIGHT) return out;
      h.litAt = now; h.endsAt = now + h.minutes * 60000; h.ended = ''; h.endedAt = 0;
      done('lit');
      break;
    case 'breath':
      if (!fire.lit) return out;
      out.ok = true; out.events.push('breath');
      out.amount = clamp(Number(cmd.s) || 0, 0, 1);
      break;
    case 'snuff':
      if (!fire.lit) return out;
      h.litAt = 0; h.endsAt = 0; h.endedAt = now; h.ended = 'snuffed';
      done('snuffed');
      break;
    case 'sound':
      state.sound.on = !!cmd.on; done(state.sound.on ? 'sound-on' : 'sound-off');
      break;
    case 'vol':
      v = int(cmd.v, -1);
      if (v < 0 || v > 100) return out;
      state.sound.vol = v; done();
      break;
    case 'mute':
      state.sound.muted = !!cmd.on; done();
      break;
    case 'place':
      v = placeOf(cmd.p);
      if (v.id !== cmd.p) return out;
      state.sky.place = v.id; done('place');
      break;
    case 'sky':
      if (cmd.mode !== 'auto' && cmd.mode !== 'sim') return out;
      state.sky.mode = cmd.mode; done('place');
      break;
    case 'sim':
      v = Number(cmd.v);
      if (!isFinite(v)) return out;
      if (cmd.k === 'hour') state.sky.sim.hour = clamp(Math.round(v * 2) / 2, 0, 23.5);
      else if (cmd.k === 'cloud') state.sky.sim.cloud = clamp(Math.round(v), 0, 100);
      else if (cmd.k === 'wind') state.sky.sim.wind = clamp(Math.round(v), 0, 40);
      else if (cmd.k === 'tide') state.sky.sim.tide = clamp(Math.round(v), 0, 100);
      else return out;
      done();
      break;
    case 'circle':
      if (cmd.id === '' || cmd.id == null) { state.lights.circle = ''; done('circle'); break; }
      v = parseCircleLink(cmd.id);
      if (!v) return out;
      state.lights.circle = v; done('circle');
      break;
    case 'names':
      state.lights.names = !!cmd.on; done();
      break;
    case 'pair':
      out.ok = true; out.events.push('pair');
      break;
    case 'end':
      out.ok = true; out.events.push('end');
      break;
    case 'wake':
      out.ok = true;
      break;
    default:
      return out;
  }
  if (out.ok) state.lastInputAt = now;
  if (out.changed) state.rev += 1;
  return out;
}

/** The TV dims when nobody has touched a remote for a while and nothing is burning. */
export function shouldDim(state, now) {
  if (state.view === 'off') return false;
  if (hearthAt(state, now).lit) return false;
  return now - (state.lastInputAt || 0) > IDLE_DIM_MS;
}

/** The TV lets the room go when no phone has been heard from for an hour and nothing is burning. */
export function roomIsIdle(state, lastPhoneAt, now) {
  if (hearthAt(state, now).lit) return false;
  return now - Math.max(lastPhoneAt || 0, state.lastInputAt || 0) > ROOM_IDLE_MS;
}

/**
 * The frame the TV sends to phones. `extra` is what only the TV knows:
 * { needTap, sky, lights, phones, code, dim }. The circle id is never sent
 * back; a phone only learns whether a circle is set.
 */
export function encodeState(state, now, extra) {
  var x = extra || {};
  var fire = hearthAt(state, now);
  return {
    t: 'st',
    r: state.rev,
    v: VIEWS.indexOf(state.view),
    s: [state.sound.on ? 1 : 0, state.sound.vol, state.sound.muted ? 1 : 0, x.needTap ? 1 : 0],
    h: [state.hearth.logs, state.hearth.minutes, PHASES.indexOf(fire.phase), Math.ceil(fire.remainingMs / 1000)],
    w: [PLACES.indexOf(placeOf(state.sky.place)), state.sky.mode === 'sim' ? 1 : 0, state.sky.sim.hour, state.sky.sim.cloud, state.sky.sim.wind, state.sky.sim.tide, Math.max(0, SKY_STATUS.indexOf(x.sky || 'wait'))],
    l: [state.lights.circle ? 1 : 0, state.lights.names ? 1 : 0, Math.max(0, LIGHTS_STATUS.indexOf(x.lights || 'none'))],
    d: state.drum,
    p: x.phones || 0,
    k: x.code || '',
    m: x.dim ? 1 : 0,
  };
}

/** A phone's reading of that frame. Returns null for anything that is not a state frame. */
export function decodeState(f) {
  if (!f || f.t !== 'st' || !Array.isArray(f.s) || !Array.isArray(f.h) || !Array.isArray(f.w) || !Array.isArray(f.l)) return null;
  var place = PLACES[f.w[0]] || PLACES[0];
  return {
    rev: int(f.r, 0),
    view: VIEWS[f.v] || 'hearth',
    sound: { on: !!f.s[0], vol: clamp(int(f.s[1], 40), 0, 100), muted: !!f.s[2], needTap: !!f.s[3] },
    hearth: { logs: clamp(int(f.h[0], 0), 0, MAX_LOGS), minutes: int(f.h[1], 45), phase: PHASES[f.h[2]] || 'bare', remainingSec: Math.max(0, int(f.h[3], 0)) },
    sky: { place: place.id, placeName: place.name, mode: f.w[1] ? 'sim' : 'auto', sim: { hour: Number(f.w[2]) || 0, cloud: int(f.w[3], 0), wind: int(f.w[4], 0), tide: int(f.w[5], 0) }, status: SKY_STATUS[f.w[6]] || 'wait' },
    lights: { hasCircle: !!f.l[0], names: !!f.l[1], status: LIGHTS_STATUS[f.l[2]] || 'none' },
    drum: isDrumRoom(f.d) ? f.d : '',
    phones: int(f.p, 0),
    code: cleanCode(f.k),
    dim: !!f.m,
  };
}

/** Would this party frame fit through the relay? The relay drops anything over 512 bytes. */
export function frameFits(d) {
  var text = JSON.stringify({ v: 1, type: 'party', d: d });
  var bytes = 0;
  for (var i = 0; i < text.length; i += 1) { var c = text.charCodeAt(i); bytes += c < 0x80 ? 1 : c < 0x800 ? 2 : 3; }
  return bytes <= FRAME_MAX_BYTES;
}

export function clockText(seconds) {
  var s = Math.max(0, Math.round(seconds));
  var m = Math.floor(s / 60), r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

// ── The sky ───────────────────────────────────────────────────────────

/** Sun elevation in degrees for a place and time. Closed form, good to about a degree; it is computed, not observed. */
export function sunElevation(ms, lat, lng) {
  var d = ms / 86400000 - 10957.5; // days since J2000
  var rad = Math.PI / 180;
  var g = (357.529 + 0.98560028 * d) * rad;
  var q = 280.459 + 0.98564736 * d;
  var L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  var e = (23.439 - 0.00000036 * d) * rad;
  var dec = Math.asin(Math.sin(e) * Math.sin(L));
  var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  var gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  var lst = (gmst * 15 + lng) * rad;
  var ha = lst - ra;
  var el = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha));
  return el / rad;
}

/** A stand-in sun for the simulated sky: up at 6, overhead at noon, down at 18. */
export function simSunElevation(hour) {
  return 62 * Math.sin(((hour - 6) / 12) * Math.PI);
}

/**
 * Water height between two NOAA high/low predictions, on a cosine curve.
 * `predictions` is /api/tide's list: [{ time: 'YYYY-MM-DD HH:MM', heightFt, kind }],
 * times in Pacific local time. `toMs` turns one of those strings into UTC ms.
 * Returns null unless `now` sits between two predictions: no guess outside them.
 */
export function tideAt(predictions, now, toMs) {
  if (!Array.isArray(predictions)) return null;
  var pts = [];
  for (var i = 0; i < predictions.length; i += 1) {
    var p = predictions[i];
    var t = toMs(p && p.time);
    if (isFinite(t) && p && isFinite(Number(p.heightFt))) pts.push({ t: t, ft: Number(p.heightFt), kind: p.kind });
  }
  pts.sort(function (a, b) { return a.t - b.t; });
  for (var k = 0; k < pts.length - 1; k += 1) {
    var a = pts[k], b = pts[k + 1];
    if (now >= a.t && now <= b.t) {
      var f = (now - a.t) / Math.max(1, b.t - a.t);
      var ft = a.ft + (b.ft - a.ft) * (1 - Math.cos(Math.PI * f)) / 2;
      var lo = Infinity, hi = -Infinity;
      for (var j = 0; j < pts.length; j += 1) { lo = Math.min(lo, pts[j].ft); hi = Math.max(hi, pts[j].ft); }
      return { heightFt: Math.round(ft * 10) / 10, rising: b.ft > a.ft, next: b, fill: hi > lo ? clamp((ft - lo) / (hi - lo), 0, 1) : 0.5 };
    }
  }
  return null;
}

/** 'YYYY-MM-DD HH:MM' or 'YYYY-MM-DDTHH:MM' in Pacific time to UTC ms. Handles the daylight-time change. */
export function pacificToMs(text) {
  var m = String(text == null ? '' : text).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return NaN;
  var y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5];
  // US daylight time: second Sunday of March 2:00 to first Sunday of November 2:00
  var nthSunday = function (year, month, n) { var first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); return 1 + ((7 - first) % 7) + 7 * (n - 1); };
  var stamp = (mo * 100 + d) * 100 + h;
  var dst = stamp >= (300 + nthSunday(y, 3, 2)) * 100 + 2 && stamp < (1100 + nthSunday(y, 11, 1)) * 100 + 2;
  return Date.UTC(y, mo - 1, d, h + (dst ? 7 : 8), mi);
}

/**
 * Build what the Window view draws. Live values come from /api/weather and
 * /api/tide; anything those did not return is null and is drawn as "no
 * reading", never filled in. status: 'live' (weather and tide both read),
 * 'part' (some of it), 'sim' (the simulated sky), 'wait' (nothing yet).
 */
export function skyModel(state, now, live) {
  var place = placeOf(state.sky.place);
  var s = state.sky.sim;
  if (state.sky.mode === 'sim') {
    return { status: 'sim', fallback: false, place: place, sunEl: simSunElevation(s.hour), cloud: s.cloud, windMph: s.wind, windDir: null, tide: { fill: s.tide / 100, heightFt: null, rising: null }, tempF: null, condition: null, readAt: 0 };
  }
  var w = live && live.weather && live.weather.ok ? live.weather : null;
  var t = live && live.tide && live.tide.ok ? tideAt(live.tide.predictions, now, pacificToMs) : null;
  if (!w && !t) {
    // Nothing live could be read. Once a read has been tried, fall back to the simulated sky and say so.
    if (live && live.tried) return { status: 'sim', fallback: true, place: place, sunEl: simSunElevation(s.hour), cloud: s.cloud, windMph: s.wind, windDir: null, tide: { fill: s.tide / 100, heightFt: null, rising: null }, tempF: null, condition: null, readAt: 0 };
    return { status: 'wait', place: place, sunEl: sunElevation(now, place.lat, place.lng), cloud: null, windMph: null, windDir: null, tide: null, tempF: null, condition: null, readAt: 0 };
  }
  var num = function (x) { return typeof x === 'number' && isFinite(x) ? x : null; };
  return {
    status: w && t ? 'live' : 'part',
    place: place,
    sunEl: sunElevation(now, place.lat, place.lng),
    cloud: w ? num(w.cloudCover) : null,
    windMph: w ? num(w.windMph) : null,
    windDir: w ? num(w.windDirDeg) : null,
    tide: t,
    tempF: w ? num(w.tempF) : null,
    condition: w && typeof w.condition === 'string' ? w.condition : null,
    readAt: live.readAt || 0,
  };
}

export function compass(deg) {
  if (typeof deg !== 'number' || !isFinite(deg)) return '';
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// ── The hillside ──────────────────────────────────────────────────────

/** A circle labelled as a demo, for when the Light Companion endpoint is not there. Not real people. */
export function demoCircle(now) {
  var members = [];
  for (var i = 0; i < 7; i += 1) {
    // each demo window is lit for part of a slow cycle so they catch in turn
    var phase = ((now / 1000 + i * 11) % 77) / 77;
    members.push({ id: 'demo' + i, name: 'Demo ' + (i + 1), colour: ['amber', 'rose', 'gold', 'moss', 'sky', 'lilac'][i % 6], lit: phase < 0.62 });
  }
  return members;
}

/** Members of a /api/light response, reduced to what the TV draws. */
export function circleMembers(body) {
  var list = body && body.circle && Array.isArray(body.circle.members) ? body.circle.members : [];
  var out = [];
  for (var i = 0; i < list.length && out.length < 12; i += 1) {
    var m = list[i];
    if (!m || typeof m.id !== 'string') continue;
    out.push({ id: m.id, name: String(m.name || '').slice(0, 24), colour: String(m.colour || 'amber'), lit: !!m.lit });
  }
  return out;
}
