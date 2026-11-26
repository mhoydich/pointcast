import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BURN_MINUTES, CATCH_MS, CODE_ALPHA, CODE_LEN, FRAME_MAX_BYTES, IDLE_DIM_MS, MAX_LOGS, PLACES, ROOM_IDLE_MS, VIEWS,
  applyCommand, circleMembers, cleanCode, clockText, compass, decodeState, demoCircle, encodeState, frameFits, hearthAt,
  isDrumRoom, isRoomId, newState, pacificToMs, parseCircleLink, roomIsIdle, shouldDim, skyModel, sunElevation, tick, tideAt,
} from '../public/house/core.js';
import * as pairing from '../functions/_lib/house-pairing.mjs';

const T0 = Date.UTC(2026, 10, 11, 20, 0, 0);
const MIN = 60000;
const fresh = () => newState('house-abcdefgh1234');
const run = (state, now, ...cmds) => cmds.map((c) => applyCommand(state, c, now));

test('codes: five letters from an alphabet without I, L or O; the two copies of the alphabet agree', () => {
  assert.equal(CODE_ALPHA, pairing.CODE_ALPHA);
  assert.equal(CODE_LEN, pairing.CODE_LEN);
  assert.equal(cleanCode(' kwx-ta '), 'KWXTA');
  assert.equal(cleanCode('KWXT'), '');
  assert.equal(cleanCode('KWXTAA'), '');
  assert.equal(cleanCode('KLXTA'), '', 'L is not in the alphabet');
  assert.equal(cleanCode(null), '');
  for (let i = 0; i < 200; i += 1) assert.equal(cleanCode(pairing.newCode()).length, CODE_LEN);
});

test('pairing: open, join, a second phone, refresh, end', async () => {
  let now = T0;
  const store = pairing.memoryStore(() => now);
  const opened = await pairing.openPairing(store, {}, now);
  assert.equal(opened.ok, true);
  assert.equal(opened.status, 201);
  assert.ok(isRoomId(opened.room) && pairing.isRoomId(opened.room));
  assert.ok(opened.room.length <= 32, 'fits the drum worker room rule');
  assert.ok(isDrumRoom(opened.drum));
  assert.equal(opened.ttlSec, pairing.CODE_TTL_SEC);

  const first = await pairing.joinPairing(store, opened.code.toLowerCase(), now);
  assert.deepEqual([first.ok, first.room], [true, opened.room]);
  assert.equal(first.key, undefined, 'a phone never gets the TV key');
  const second = await pairing.joinPairing(store, opened.code, now + 5000);
  assert.equal(second.room, opened.room, 'several phones can join one TV');

  const again = await pairing.openPairing(store, { room: opened.room, key: opened.key }, now + MIN);
  assert.equal(again.ok, true);
  assert.equal(again.room, opened.room);
  assert.notEqual(again.code, opened.code);
  assert.equal((await pairing.joinPairing(store, opened.code, now + MIN)).error, 'no-such-code', 'the old code stops working');
  assert.equal((await pairing.joinPairing(store, again.code, now + MIN)).ok, true);

  const ended = await pairing.endPairing(store, { room: opened.room, key: opened.key });
  assert.equal(ended.ended, true);
  assert.equal((await pairing.joinPairing(store, again.code, now + MIN)).status, 404);
  assert.equal(store.size(), 0, 'nothing is left behind');
});

test('pairing: codes are short-lived, rooms are capped, keys are checked', async () => {
  let now = T0;
  const store = pairing.memoryStore(() => now);
  const opened = await pairing.openPairing(store, {}, now);
  now = T0 + pairing.CODE_TTL_SEC * 1000 + 1;
  assert.equal((await pairing.joinPairing(store, opened.code, now)).error, 'no-such-code');

  assert.equal((await pairing.joinPairing(store, 'ABC', now)).error, 'bad-code');
  assert.equal((await pairing.openPairing(store, { room: opened.room, key: 'x'.repeat(32) }, now)).error, 'not-your-room');
  assert.equal((await pairing.openPairing(store, { room: 'bc-somebody-else', key: opened.key }, now)).error, 'bad-room');
  assert.equal((await pairing.endPairing(store, { room: opened.room, key: 'y'.repeat(32) })).error, 'not-your-room');

  // just before the six-hour cap the code gets whatever time is left, then the room is gone
  now = T0 + (pairing.ROOM_TTL_SEC - 120) * 1000;
  const late = await pairing.openPairing(store, { room: opened.room, key: opened.key }, now);
  assert.equal(late.ok, true);
  assert.ok(late.ttlSec <= 120);
  now = T0 + pairing.ROOM_TTL_SEC * 1000 + 1;
  assert.equal((await pairing.openPairing(store, { room: opened.room, key: opened.key }, now)).error, 'room-gone');
});

test('pairing: what is stored holds a hash of the key and nothing personal', async () => {
  const seen = [];
  const inner = pairing.memoryStore();
  const store = { ...inner, put: async (k, v, ttl) => { seen.push([k, v, ttl]); return inner.put(k, v, ttl); } };
  const opened = await pairing.openPairing(store, {});
  const text = JSON.stringify(seen);
  assert.ok(!text.includes(opened.key), 'the key itself is never stored');
  for (const [key, value, ttl] of seen) {
    assert.match(key, /^house:(code|room):/);
    assert.ok(ttl <= pairing.ROOM_TTL_SEC);
    assert.deepEqual(Object.keys(value).sort(), key.startsWith('house:code:') ? ['exp', 'room'] : ['code', 'createdAt', 'drum', 'keyHash']);
  }
});

test('hearth: stack, hold to light, burn down on its own', () => {
  const s = fresh();
  assert.equal(hearthAt(s, T0).phase, 'bare');
  assert.equal(applyCommand(s, { c: 'light' }, T0).ok, false, 'nothing to light');
  run(s, T0, { c: 'stack' });
  assert.equal(applyCommand(s, { c: 'spark', p: 0.5 }, T0).ok, false, 'one log will not catch');
  run(s, T0, { c: 'stack' }, { c: 'minutes', m: 15 });
  assert.equal(applyCommand(s, { c: 'minutes', m: 20 }, T0).ok, false);
  const spark = applyCommand(s, { c: 'spark', p: 0.5 }, T0);
  assert.deepEqual([spark.ok, spark.changed, spark.events, spark.amount], [true, false, ['spark'], 0.5]);
  const lit = applyCommand(s, { c: 'light' }, T0);
  assert.deepEqual(lit.events, ['lit']);
  assert.equal(hearthAt(s, T0 + 1000).phase, 'catching');
  assert.equal(hearthAt(s, T0 + CATCH_MS + 1000).phase, 'burning');
  assert.equal(hearthAt(s, T0 + 14.5 * MIN).phase, 'embers');
  assert.equal(applyCommand(s, { c: 'minutes', m: 45 }, T0 + MIN).ok, false, 'the time is set before lighting');
  assert.deepEqual(tick(s, T0 + 14 * MIN), []);
  assert.deepEqual(tick(s, T0 + 15 * MIN), ['burned-out']);
  assert.equal(hearthAt(s, T0 + 15 * MIN).phase, 'out');
  assert.equal(s.hearth.logs, 0);
  // the next log starts a new fire
  run(s, T0 + 16 * MIN, { c: 'stack' });
  assert.equal(hearthAt(s, T0 + 16 * MIN).phase, 'stacked');
});

test('hearth: breath, a log on a burning fire, the lid', () => {
  const s = fresh();
  run(s, T0, { c: 'stack' }, { c: 'stack' }, { c: 'minutes', m: 90 }, { c: 'light' });
  const breath = applyCommand(s, { c: 'breath', s: 2 }, T0 + MIN);
  assert.deepEqual([breath.ok, breath.changed, breath.amount], [true, false, 1]);
  const before = s.hearth.endsAt;
  run(s, T0 + 30 * MIN, { c: 'stack' });
  assert.equal(s.hearth.endsAt, before + 10 * MIN);
  run(s, T0 + 30 * MIN, { c: 'stack' }, { c: 'stack' }, { c: 'stack' }, { c: 'stack' });
  assert.ok(s.hearth.endsAt <= T0 + 30 * MIN + 90 * MIN, 'never more than ninety minutes left');
  assert.equal(s.hearth.logs, MAX_LOGS);
  assert.deepEqual(applyCommand(s, { c: 'snuff' }, T0 + 31 * MIN).events, ['snuffed']);
  assert.equal(hearthAt(s, T0 + 31 * MIN).phase, 'snuffed');
  assert.equal(applyCommand(s, { c: 'breath', s: 1 }, T0 + 32 * MIN).ok, false);
  assert.equal(applyCommand(s, { c: 'light' }, T0 + 32 * MIN).ok, false, 'a snuffed fire needs new wood');
  assert.deepEqual(tick(s, T0 + 200 * MIN), [], 'a snuffed fire does not burn out later');
});

test('commands: views, sound, sky, lights; junk is refused', () => {
  const s = fresh();
  for (const v of VIEWS) assert.equal(applyCommand(s, { c: 'view', v }, T0).ok, true);
  assert.equal(s.view, 'off');
  for (const bad of [null, 5, {}, { c: 'view', v: 'cinema' }, { c: 'vol', v: 400 }, { c: 'place', p: 'paris' }, { c: 'sim', k: 'moon', v: 1 }, { c: 'circle', id: 'nope' }, { c: '__proto__' }]) {
    assert.equal(applyCommand(s, bad, T0).ok, false);
  }
  assert.equal(s.sound.on, false, 'silent until a phone says otherwise');
  assert.deepEqual(applyCommand(s, { c: 'sound', on: 1 }, T0).events, ['sound-on']);
  run(s, T0, { c: 'vol', v: 65 }, { c: 'mute', on: true }, { c: 'place', p: 'san-pedro' }, { c: 'sky', mode: 'sim' }, { c: 'sim', k: 'hour', v: 6.26 }, { c: 'sim', k: 'wind', v: 99 });
  assert.deepEqual([s.sound.vol, s.sound.muted, s.sky.place, s.sky.mode, s.sky.sim.hour, s.sky.sim.wind], [65, true, 'san-pedro', 'sim', 6.5, 40]);
  const id = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
  assert.equal(parseCircleLink(`https://pointcast.xyz/light/c/${id}/`), id);
  assert.equal(parseCircleLink('https://example.com/other'), '');
  run(s, T0, { c: 'circle', id: `https://pointcast.xyz/light/c/${id}` });
  assert.equal(s.lights.circle, id);
  run(s, T0, { c: 'circle', id: '' });
  assert.equal(s.lights.circle, '');
  assert.deepEqual(applyCommand(s, { c: 'end' }, T0).events, ['end']);
  assert.deepEqual(applyCommand(s, { c: 'pair' }, T0).events, ['pair']);
});

test('state frame: round trip, fits the relay, never carries the circle link', () => {
  const s = fresh();
  const id = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
  run(s, T0, { c: 'stack' }, { c: 'stack' }, { c: 'light' }, { c: 'sound', on: true }, { c: 'circle', id }, { c: 'names', on: true }, { c: 'view', v: 'lights' });
  const frame = encodeState(s, T0 + MIN, { needTap: true, sky: 'part', lights: 'demo', phones: 3, code: 'KWXTA', dim: false });
  frame.o = 'tv';
  assert.ok(frameFits(frame));
  assert.ok(JSON.stringify(frame).length < FRAME_MAX_BYTES - 40);
  assert.ok(!JSON.stringify(frame).includes(id));
  const seen = decodeState(JSON.parse(JSON.stringify(frame)));
  assert.equal(seen.view, 'lights');
  assert.deepEqual(seen.sound, { on: true, vol: 40, muted: false, needTap: true });
  assert.deepEqual(seen.hearth, { logs: 2, minutes: 45, phase: 'burning', remainingSec: 44 * 60 });
  assert.deepEqual(seen.lights, { hasCircle: true, names: true, status: 'demo' });
  assert.equal(seen.sky.status, 'part');
  assert.deepEqual([seen.phones, seen.code, seen.drum], [3, 'KWXTA', 'house-abcdefgh1234']);
  assert.equal(decodeState({ t: 'hi' }), null);
  assert.equal(frameFits({ t: 'x', blob: 'z'.repeat(600) }), false);
  assert.equal(clockText(44 * 60 + 5), '44:05');
});

test('manners: dim when idle, let the room go after an hour, never while a fire burns', () => {
  const s = fresh();
  run(s, T0, { c: 'wake' });
  assert.equal(shouldDim(s, T0 + IDLE_DIM_MS - 1000), false);
  assert.equal(shouldDim(s, T0 + IDLE_DIM_MS + 1000), true);
  assert.equal(roomIsIdle(s, T0, T0 + ROOM_IDLE_MS - 1000), false);
  assert.equal(roomIsIdle(s, T0, T0 + ROOM_IDLE_MS + 1000), true);
  run(s, T0, { c: 'stack' }, { c: 'stack' }, { c: 'minutes', m: 90 }, { c: 'light' });
  assert.equal(shouldDim(s, T0 + 80 * MIN), false);
  assert.equal(roomIsIdle(s, T0, T0 + 80 * MIN), false);
  run(s, T0 + 81 * MIN, { c: 'view', v: 'off' });
  assert.equal(shouldDim(s, T0 + 300 * MIN), false, 'off is already dark');
  assert.ok(BURN_MINUTES.includes(15) && BURN_MINUTES.includes(45) && BURN_MINUTES.includes(90));
});

test('sky: live readings are passed through, gaps stay gaps, simulated is labelled', () => {
  const s = fresh();
  const tide = { ok: true, predictions: [
    { time: '2026-11-11 09:00', heightFt: 5.0, kind: 'high' },
    { time: '2026-11-11 15:00', heightFt: 1.0, kind: 'low' },
  ] };
  const noon = pacificToMs('2026-11-11 12:00');
  assert.equal(noon, Date.UTC(2026, 10, 11, 20, 0), 'November is standard time');
  assert.equal(pacificToMs('2026-07-04T12:00'), Date.UTC(2026, 6, 4, 19, 0), 'July is daylight time');
  const at = tideAt(tide.predictions, noon, pacificToMs);
  assert.deepEqual([at.heightFt, at.rising], [3, false]);
  assert.equal(tideAt(tide.predictions, noon + 12 * 3600000, pacificToMs), null, 'no guess outside the predictions');

  assert.equal(skyModel(s, noon, null).status, 'wait');
  const old = skyModel(s, noon, { tried: true, weather: { ok: true, tempF: 61, condition: 'overcast' }, tide, readAt: noon });
  assert.deepEqual([old.status, old.tempF, old.windMph, old.cloud], ['live', 61, null, null], 'an endpoint without wind reports no wind');
  const full = skyModel(s, noon, { tried: true, weather: { ok: true, tempF: 61, condition: 'fog', windMph: 9, windDirDeg: 270, cloudCover: 95 }, tide: { ok: false }, readAt: noon });
  assert.deepEqual([full.status, full.windMph, full.cloud, full.tide], ['part', 9, 95, null]);
  const none = skyModel(s, noon, { tried: true, weather: null, tide: null });
  assert.deepEqual([none.status, none.fallback], ['sim', true]);
  run(s, T0, { c: 'sky', mode: 'sim' });
  const sim = skyModel(s, noon, { tried: true, weather: { ok: true, tempF: 61 }, tide });
  assert.deepEqual([sim.status, sim.fallback, sim.tempF], ['sim', false, null], 'simulated never mixes in live numbers');

  const el = PLACES[0];
  assert.ok(sunElevation(noon, el.lat, el.lng) > 30, 'the sun is up at noon');
  assert.ok(sunElevation(noon + 12 * 3600000, el.lat, el.lng) < -30, 'and down at midnight');
  assert.equal(compass(270), 'W');
  assert.equal(compass(null), '');
});

test('lights: the documented /api/light shape, and a demo that says it is one', () => {
  const body = { ok: true, schema: 'pointcast.light/v0', circle: { members: [
    { id: 'k3m9x2pa', name: 'June', colour: 'rose', mode: 'tonight', lit: true, litAt: 1, expiresAt: 2 },
    { id: 'p0o9i8u7', name: 'A name that is much longer than allowed', colour: 'sky', lit: false },
    { nope: true },
  ] } };
  const members = circleMembers(body);
  assert.deepEqual(members.map((m) => [m.id, m.lit, m.colour]), [['k3m9x2pa', true, 'rose'], ['p0o9i8u7', false, 'sky']]);
  assert.ok(members[1].name.length <= 24);
  assert.deepEqual(circleMembers({}), []);
  const demo = demoCircle(T0);
  assert.equal(demo.length, 7);
  assert.ok(demo.every((m) => /^Demo \d$/.test(m.name)));
});

test('endpoint: open, join, end through the Pages Function with no bindings', async () => {
  const api = await import('../functions/api/house.ts');
  const call = async (body) => {
    const res = await api.onRequestPost({ request: new Request('https://pointcast.xyz/api/house', { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) }), env: {} });
    return { status: res.status, body: await res.json(), headers: res.headers };
  };
  const about = await (await api.onRequestGet({ request: new Request('https://pointcast.xyz/api/house'), env: {} })).json();
  assert.deepEqual([about.schema, about.store], ['pointcast.house/v0', 'memory']);
  const opened = await call({ action: 'open' });
  assert.equal(opened.status, 201);
  assert.equal(opened.headers.get('cache-control'), 'no-store');
  assert.equal(opened.body.store, 'memory');
  const joined = await call({ action: 'join', code: opened.body.code });
  assert.deepEqual([joined.status, joined.body.room, joined.body.key], [200, opened.body.room, undefined]);
  assert.equal((await call({ action: 'join', code: 'QQQQQ' })).status, 404);
  assert.equal((await call({ action: 'dance' })).status, 400);
  assert.equal((await call('not json')).status, 400);
  assert.equal((await call({ action: 'join', code: 'A'.repeat(600) })).status, 413);
  assert.equal((await call({ action: 'end', room: opened.body.room, key: 'z'.repeat(32) })).status, 403);
  assert.equal((await call({ action: 'end', room: opened.body.room, key: opened.body.key })).body.ended, true);
  assert.equal((await call({ action: 'join', code: opened.body.code })).status, 404);
});
