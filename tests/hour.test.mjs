import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ptParts, bandFor, isHalloweenNight, chooseScene, moonPhase, moonName, hourLabel, SCALES } from '../src/lib/hour/scene.mjs';
import { imagePools, LINES, ROOMS } from '../src/lib/hour/pools.mjs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pools = { images: imagePools(), lines: LINES, rooms: ROOMS };
const publicDir = fileURLToPath(new URL('../public', import.meta.url));
const pagesDir = fileURLToPath(new URL('../src/pages', import.meta.url));

test('bands cover every hour', () => {
  const seen = new Set();
  for (let h = 0; h < 24; h += 1) seen.add(bandFor(h));
  assert.deepEqual([...seen].sort(), ['dawn', 'day', 'dusk', 'night']);
  assert.equal(bandFor(5), 'dawn');
  assert.equal(bandFor(12), 'day');
  assert.equal(bandFor(18), 'dusk');
  assert.equal(bandFor(23), 'night');
  assert.equal(bandFor(2), 'night');
});

test('El Segundo clock reads Pacific time', () => {
  // 2026-10-31T01:30Z is 6:30 PM on Oct 30 in Los Angeles (PDT)
  const p = ptParts(new Date('2026-10-31T01:30:00Z'));
  assert.deepEqual([p.month, p.day, p.hour], [10, 30, 18]);
});

test('Halloween night is Oct 31 from 5 PM Pacific', () => {
  assert.equal(isHalloweenNight({ month: 10, day: 31, hour: 16 }), false);
  assert.equal(isHalloweenNight({ month: 10, day: 31, hour: 17 }), true);
  assert.equal(isHalloweenNight({ month: 10, day: 31, hour: 23 }), true);
  assert.equal(isHalloweenNight({ month: 11, day: 1, hour: 0 }), false);
  const scene = chooseScene({ year: 2026, month: 10, day: 31, hour: 20 }, pools);
  assert.equal(scene.mode, 'halloween');
  assert.equal(scene.room.href, '/haunted-drum');
});

test('every hour of a day picks a full scene, the same one twice', () => {
  for (let h = 0; h < 24; h += 1) {
    const parts = { year: 2026, month: 11, day: 7, hour: h };
    const a = chooseScene(parts, pools);
    const b = chooseScene(parts, pools);
    assert.ok(a.image && a.line && a.room && a.scale, `hour ${h}`);
    assert.deepEqual(a, b);
  }
});

test('forced Halloween preview works any hour', () => {
  const s = chooseScene({ year: 2026, month: 3, day: 2, hour: 10 }, pools, { halloween: true });
  assert.equal(s.mode, 'halloween');
});

test('every pool is non-empty and every image file exists', () => {
  for (const band of ['dawn', 'day', 'dusk', 'night', 'halloween']) {
    assert.ok(pools.images[band].length >= 3, `${band} images`);
    assert.ok(pools.lines[band].length >= 1, `${band} lines`);
    assert.ok(pools.rooms[band].length >= 1, `${band} rooms`);
    assert.ok(SCALES[band], `${band} scale`);
    for (const img of pools.images[band]) {
      assert.ok(existsSync(publicDir + img.src), `missing ${img.src}`);
      assert.ok(img.alt && img.title, `alt/title for ${img.src}`);
    }
  }
});

test('every room is a real page', () => {
  for (const list of Object.values(ROOMS)) {
    for (const room of list) {
      const p = room.href.replace(/^\//, '');
      assert.ok(existsSync(`${pagesDir}/${p}.astro`) || existsSync(`${pagesDir}/${p}/index.astro`), `no page for ${room.href}`);
    }
  }
});

test('moon and labels', () => {
  const full = moonPhase(new Date('2026-10-26T04:12:00Z'));
  assert.ok(Math.abs(full - 0.5) < 0.06, `phase ${full}`);
  assert.equal(moonName(0), 'new moon');
  assert.equal(moonName(0.5), 'full moon');
  assert.equal(hourLabel(0), 'midnight');
  assert.equal(hourLabel(12), 'noon');
  assert.equal(hourLabel(21), '9 PM');
});
