import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildKit, kitText, readKitParams, kitParams, campPayload, itemFitsRole } from '../src/lib/thus-camp.mjs';

const data = JSON.parse(readFileSync(new URL('../src/data/thus-camp.json', import.meta.url)));

test('the requested situations are all present', () => {
  const slugs = data.situations.map((s) => s.slug);
  for (const slug of ['friday-night-football', 'ninety-eight-degrees', 'pickleball-player', 'pickleball-watcher']) assert.ok(slugs.includes(slug), slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(new Set(data.situations.map((s) => s.code)).size, slugs.length);
});

test('every situation is complete and its role references resolve', () => {
  for (const s of data.situations) {
    for (const key of ['title', 'kicker', 'setting', 'hours', 'surface', 'call']) assert.ok(s[key], `${s.slug}.${key}`);
    assert.match(s.slug, /^[a-z0-9-]+$/);
    assert.match(s.accent, /^#[0-9a-f]{6}$/i);
    assert.ok(s.roles.length >= 2, s.slug);
    assert.ok(s.loadout.length >= 6, s.slug);
    assert.ok(s.timeline.length >= 3 && s.moves.length >= 2 && s.watchFor.length >= 2 && s.skip.length >= 2, s.slug);
    const roleIds = new Set(s.roles.map((r) => r.id));
    const ids = s.loadout.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, `${s.slug} has duplicate item ids`);
    for (const item of s.loadout) {
      assert.ok(['core', 'nice'].includes(item.tier), `${s.slug}/${item.id} tier`);
      assert.ok(item.name && item.why, `${s.slug}/${item.id}`);
      for (const r of item.roles ?? []) assert.ok(roleIds.has(r), `${s.slug}/${item.id} role ${r}`);
    }
  }
});

test('the 98 degree camp names heat stroke as a 911 emergency', () => {
  const heat = data.situations.find((s) => s.slug === 'ninety-eight-degrees');
  assert.ok(heat.watchFor.some((w) => /heat stroke/i.test(w) && /911/.test(w)));
  assert.match(data.disclaimer, /911/);
});

test('role filtering keeps shared items and drops other roles', () => {
  assert.equal(itemFitsRole({ roles: ['a'] }, ''), true);
  assert.equal(itemFitsRole({ roles: ['a'] }, 'b'), false);
  assert.equal(itemFitsRole({}, 'b'), true);
  const all = buildKit(data, 'pickleball-player');
  const open = buildKit(data, 'pickleball-player', { role: 'open-play' });
  const tourney = buildKit(data, 'pickleball-player', { role: 'tournament' });
  assert.ok(open.items.length < all.items.length);
  assert.ok(tourney.items.some((i) => i.id === 'backup-paddle'));
  assert.ok(!open.items.some((i) => i.id === 'backup-paddle'));
  assert.equal(buildKit(data, 'pickleball-player', { role: 'nope' }).role, '');
  assert.equal(buildKit(data, 'nope'), null);
});

test('modifiers and the trunk kit add items without duplicates, situation wording first', () => {
  const kit = buildKit(data, 'ninety-eight-degrees', { modifiers: ['hot', 'kids'], trunk: true });
  const ids = kit.items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  const water = kit.items.find((i) => i.id === 'ice-water');
  assert.equal(water.group, 'loadout');
  assert.ok(kit.items.some((i) => i.group === 'kids'));
  assert.ok(kit.items.some((i) => i.group === 'trunk'));
  assert.deepEqual(buildKit(data, 'beach-day', { modifiers: ['hot', 'bogus'] }).modifiers, ['hot']);
});

test('URL params round-trip and ignore junk', () => {
  const state = { slug: 'pickleball-watcher', role: 'family', modifiers: ['hot', 'chill'], trunk: true };
  assert.deepEqual(readKitParams(data, kitParams(state)), state);
  const junk = readKitParams(data, new URLSearchParams('s=<x>&r=evil&m=hot,zzz&t=yes'));
  assert.deepEqual(junk, { slug: data.situations[0].slug, role: '', modifiers: ['hot'], trunk: false });
});

test('copyable text marks checked items and links back', () => {
  const kit = buildKit(data, 'friday-night-football', { role: 'player-parent' });
  const text = kitText(data, kit, new Set(['stadium-seat']));
  assert.match(text, /^THUS CAMP · High school football, as a parent/);
  assert.match(text, /\[x\] Stadium seat with a back/);
  assert.match(text, /\[ \] Post-game bag for your player/);
  assert.match(text, /https:\/\/pointcast\.xyz\/thus-camp\/friday-night-football\/$/);
});

test('JSON payload carries attribution and absolute URLs', () => {
  const p = campPayload(data);
  assert.equal(p.author, 'cc');
  assert.ok(p.source);
  for (const s of p.situations) assert.equal(s.url, `https://pointcast.xyz/thus-camp/${s.slug}/`);
});

test('weather readings map to condition suggestions', async () => {
  const { suggestConditions } = await import('../src/lib/thus-camp.mjs');
  assert.deepEqual(suggestConditions({ tempF: 98, condition: 'clear' }).modifiers, ['hot']);
  assert.match(suggestConditions({ tempF: 99, condition: 'clear' }).notes[0], /98 degree/);
  assert.deepEqual(suggestConditions({ tempF: 89, condition: 'clear' }).modifiers, []);
  assert.deepEqual(suggestConditions({ tempF: 58, condition: 'showers' }).modifiers, ['chill', 'rain']);
  assert.match(suggestConditions({ tempF: 75, condition: 'storm' }).notes.join(' '), /lightning/);
  assert.deepEqual(suggestConditions({}).modifiers, []);
  assert.deepEqual(suggestConditions({ tempF: null, condition: 'clear' }).modifiers, []);
  const modIds = new Set(data.modifiers.map((m) => m.id));
  for (const id of ['hot', 'chill', 'rain']) assert.ok(modIds.has(id), id);
});

test('camp codes run in order with no gaps', () => {
  data.situations.forEach((s, i) => assert.equal(s.code, `TC-${String(i + 1).padStart(2, '0')}`));
  assert.ok(data.situations.length >= 14);
});

test('MCP declares and handles thus_camp_kit and documents it', () => {
  const src = readFileSync(new URL('../functions/api/mcp.ts', import.meta.url), 'utf8');
  const defs = src.slice(src.indexOf('const TOOL_DEFINITIONS = ['), src.indexOf('const TOOLS = ['));
  assert.match(defs, /name: 'thus_camp_kit'/);
  assert.match(src, /case 'thus_camp_kit':/);
  assert.match(src, /<code>thus_camp_kit<\/code>/);
  // The handler reuses the page's kit logic against the published JSON.
  assert.match(src, /from '\.\.\/\.\.\/src\/lib\/thus-camp\.mjs'/);
  assert.match(src, /callJson\(`\$\{base\}\/thus-camp\.json`\)/);
});

test('the kit logic works against the published JSON payload, as the MCP tool uses it', () => {
  const p = JSON.parse(JSON.stringify(campPayload(data)));
  const kit = buildKit(p, 'pickleball-watcher', { role: 'family', modifiers: ['rain'], trunk: false });
  assert.ok(kit.items.some((i) => i.id === 'player-snacks'));
  assert.ok(kit.items.some((i) => i.group === 'rain'));
  assert.equal(kitParams(kit).get('m'), 'rain');
});
