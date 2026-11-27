import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  CAMPAIGN,
  EXHIBITION,
  MAX_HEARTS,
  PALADIN_WAVE,
  SPRITES,
  STARTING_GOLD,
  WAVES,
  catalog,
  createMatch,
  placeTower,
  playExhibition,
  playNext,
  sha256hex,
  simulatePlan,
  stampMatch,
  upgradeTower,
} from '../src/lib/loom/loom-rush-sim.mjs';
import { onRequestGet, onRequestOptions, onRequestPost, PROTOCOL_VERSION, SERVER_NAME } from '../src/lib/mcp/loom-rush-mcp.mjs';
import { mountLoomRush } from '../src/lib/loom/loom-rush-view.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url));

test('sha256 matches Node for one block and for several', () => {
  const long = 'loom-rush '.repeat(40);
  assert.equal(sha256hex('abc'), createHash('sha256').update('abc').digest('hex'));
  assert.equal(sha256hex(long), createHash('sha256').update(long).digest('hex'));
});

test('LR-1 is ten waves with scouts, night, the long meeting, and the dragon escort', () => {
  const book = catalog();
  assert.equal(book.campaign, CAMPAIGN);
  assert.equal(book.waves.length, 10);
  assert.equal(WAVES[5].name, 'Collator Scouts');
  assert.equal(WAVES[5].groups[0].slipPad0, true);
  assert.equal(WAVES[5].groups[0].pairs, true);
  assert.equal(WAVES[6].name, 'Marching Knights');
  assert.equal(WAVES[7].night, true);
  assert.equal(WAVES[7].groups[0].kind, 'raider');
  assert.equal(WAVES[8].name, 'The Long Meeting');
  assert.equal(WAVES[8].hpMul, 2);
  assert.equal(WAVES[8].speedMil, 500);
  assert.equal(WAVES[9].groups.some((group) => group.kind === 'dragon'), true);
  assert.equal(WAVES[9].groups.some((group) => group.kind === 'raider'), true);
  assert.equal(book.towers.find((tower) => tower.id === 'paladin').unlockWave, PALADIN_WAVE);
  assert.equal(SPRITES.length, 6);
});

test('an empty Seed 1126 run falls on wave 3 and replays exactly', () => {
  const first = simulatePlan({ seed: 1126, agent: 'empty', steps: [] });
  const second = simulatePlan({ seed: 1126, agent: 'empty', steps: [] });
  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.equal(first.wavesCleared, 2);
  assert.equal(first.hearts, 0);
  assert.equal(first.fallen, true);
  assert.equal(first.survived, false);
  assert.equal(first.stars, 0);
  assert.equal(first.waves.length, 3);
  assert.notEqual(first.proof, simulatePlan({ seed: 1127, agent: 'empty', steps: [] }).proof);
});

test('pad 0 barracks cannot hold Collator Scouts', () => {
  const run = simulatePlan({
    seed: 1126,
    agent: 'slip-check',
    steps: [
      { wave: 1, op: 'build', pad: 0, tower: 'barracks' },
      { wave: 2, op: 'upgrade', pad: 0 },
      { wave: 3, op: 'upgrade', pad: 0 },
    ],
  });
  const scouts = run.waves.find((wave) => wave.wave === 6);
  assert.ok(scouts, 'the slip check reaches wave 6');
  assert.equal(scouts.killed, 0);
  assert.equal(scouts.leaked, 8);
});

test('Seed 1126 exhibition is a stable five-agent board', () => {
  const first = playExhibition(1126);
  const second = playExhibition(1126);
  assert.deepEqual(first, second);
  assert.deepEqual(first.runs.map((run) => run.agent), [
    'astra-arcane-volley',
    'antigravity-balanced',
    'town-watch',
    'sol-gong-artillery',
    'claude-citadel',
  ]);
  const expect = {
    'astra-arcane-volley': { hearts: 20, stars: 3, score: 21090, kills: 90, gold: 969, mvp: 'mage@pad2', proof: 'e5bd99d2e77d', cue: 'mint_crown' },
    'antigravity-balanced': { hearts: 20, stars: 3, score: 20390, kills: 90, gold: 899, mvp: 'archer@pad0', proof: 'c333ecbc4797', cue: 'mint_crown' },
    'town-watch': { hearts: 12, stars: 2, score: 20180, kills: 87, gold: 978, mvp: 'gong@pad3', proof: 'ba385e66006a', cue: 'bronze_gong' },
    'sol-gong-artillery': { hearts: 14, stars: 2, score: 19270, kills: 88, gold: 872, mvp: 'gong@pad3', proof: '40f00c40ffba', cue: 'bronze_gong' },
    'claude-citadel': { hearts: 15, stars: 2, score: 18715, kills: 89, gold: 804, mvp: 'barracks@pad0', proof: '2ed34d1823f8', cue: 'loom_pluck' },
  };
  for (const run of first.runs) {
    assert.equal(run.wavesCleared, 10, run.agent);
    assert.equal(run.survived, true, run.agent);
    assert.equal(run.stepsRefused.length, 0, run.agent);
    assert.equal(run.waves.length, 10, run.agent);
    assert.equal(run.waves[7].night, true);
    const row = expect[run.agent];
    assert.equal(run.hearts, row.hearts);
    assert.equal(run.stars, row.stars);
    assert.equal(run.score, row.score);
    assert.equal(run.kills, row.kills);
    assert.equal(run.gold, row.gold);
    assert.equal(run.mvp, row.mvp);
    assert.equal(run.proof, row.proof);
    assert.equal(run.sensory.cue, row.cue);
    assert.equal(run.sensory.spec, 'pointcast.sensory.mcp/v1');
  }
  const scores = first.runs.map((run) => run.score);
  assert.equal(new Set(scores).size, scores.length);
});

test('playing the steps by hand matches simulatePlan on Seed 1126', () => {
  const entry = EXHIBITION[0];
  const planned = simulatePlan({ seed: 1126, agent: entry.agent, steps: entry.steps });
  const { match } = createMatch(1126);
  for (let wave = 1; wave <= 10; wave += 1) {
    for (const step of entry.steps.filter((item) => item.wave === wave)) {
      const acted = step.op === 'build' ? placeTower(match, step.pad, step.tower) : upgradeTower(match, step.pad);
      assert.equal(acted.ok, true, `${entry.agent} ${step.op} pad ${step.pad}`);
    }
    assert.equal(playNext(match).ok, true);
  }
  assert.equal(match.hearts, planned.hearts);
  assert.equal(match.gold, planned.gold);
  assert.equal(match.kills, planned.kills);
  assert.equal(stampMatch(match, entry.agent), planned.proof);
});

test('invalid plans are refused before any wave is resolved', () => {
  const cases = [
    [{ seed: -1, agent: 'a', steps: [] }, 'bad_seed'],
    [{ seed: 1.5, agent: 'a', steps: [] }, 'bad_seed'],
    [{ seed: 2 ** 32, agent: 'a', steps: [] }, 'bad_seed'],
    [{ seed: 1126, agent: 'Astra', steps: [] }, 'bad_agent'],
    [{ seed: 1126, agent: 'a', steps: [{ wave: 5, op: 'build', pad: 0, tower: 'paladin' }] }, 'paladin_locked'],
    [{ seed: 1126, agent: 'a', steps: [{ wave: 1, op: 'build', pad: 6, tower: 'archer' }] }, 'bad_pad'],
    [{ seed: 1126, agent: 'a', steps: [{ wave: 1, op: 'build', pad: 0, tower: 'laser' }] }, 'bad_tower'],
    [{ seed: 1126, agent: 'a', steps: [{ wave: 1, op: 'upgrade', pad: 0 }] }, 'no_tower'],
    [{ seed: 1126, agent: 'a', steps: [{ wave: 1, op: 'build', pad: 0, tower: 'archer' }, { wave: 1, op: 'build', pad: 0, tower: 'mage' }] }, 'pad_taken'],
    [{ seed: 1126, agent: 'a', steps: [
      { wave: 1, op: 'build', pad: 0, tower: 'archer' },
      { wave: 2, op: 'upgrade', pad: 0 },
      { wave: 3, op: 'upgrade', pad: 0 },
      { wave: 4, op: 'upgrade', pad: 0 },
    ] }, 'max_level'],
    [{ seed: 1126, agent: 'a', steps: [
      { wave: 2, op: 'build', pad: 0, tower: 'archer' },
      { wave: 1, op: 'build', pad: 1, tower: 'mage' },
    ] }, 'wave_order'],
    [{ seed: 1126, agent: 'a', steps: [
      { wave: 6, op: 'build', pad: 0, tower: 'paladin' },
      { wave: 7, op: 'build', pad: 1, tower: 'paladin' },
    ] }, 'paladin_duplicate'],
    [{ seed: 1126, agent: 'a', steps: [{ wave: 1, op: 'build', pad: 0, tower: 'archer', extra: true }] }, 'bad_step'],
  ];
  for (const [input, code] of cases) {
    const result = simulatePlan(input);
    assert.equal(result.ok, false, code);
    assert.equal(result.error.code, code);
    assert.equal(result.proof, undefined);
  }
});

test('a live board rejects a locked paladin and an unpaid build', () => {
  const { match } = createMatch(1126);
  const locked = placeTower(match, 0, 'paladin');
  assert.equal(locked.ok, false);
  assert.equal(locked.error.code, 'paladin_locked');
  assert.equal(match.gold, STARTING_GOLD);
  assert.equal(match.towers[0], null);
  assert.equal(placeTower(match, 0, 'gong').ok, true);
  assert.equal(placeTower(match, 1, 'barracks').ok, true);
  assert.equal(placeTower(match, 2, 'mage').ok, true);
  const broke = placeTower(match, 3, 'archer');
  assert.equal(broke.ok, false);
  assert.equal(broke.error.code, 'gold');
  assert.equal(match.gold, 0);
  assert.equal(match.towers[3], null);
  assert.equal(upgradeTower(match, 4).error.code, 'no_tower');
});

async function rpc(method, params, body) {
  const response = await onRequestPost({
    request: new Request('https://pointcast.xyz/api/loom-rush-mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ?? JSON.stringify({ jsonrpc: '2.0', id: 7, method, params }),
    }),
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, json: text ? JSON.parse(text) : null };
}

test('the MCP endpoint speaks the PointCast JSON-RPC subset', async () => {
  const init = await rpc('initialize', {});
  assert.equal(init.json.result.protocolVersion, PROTOCOL_VERSION);
  assert.equal(init.json.result.serverInfo.name, SERVER_NAME);
  assert.equal(init.headers.get('Access-Control-Allow-Origin'), '*');

  const listed = await rpc('tools/list', {});
  assert.deepEqual(listed.json.result.tools.map((tool) => tool.name), [
    'loom_rush_catalog',
    'loom_rush_play',
    'loom_rush_tournament',
    'open_loom_rush',
  ]);
  for (const tool of listed.json.result.tools) {
    assert.equal(tool.annotations['pointcast/effect'], 'read');
    assert.equal(tool.annotations.readOnlyHint, true);
  }

  const catalogCall = await rpc('tools/call', { name: 'loom_rush_catalog', arguments: {} });
  const catalogJson = JSON.parse(catalogCall.json.result.content[1].text);
  assert.equal(catalogJson.campaign, 'LR-1');
  assert.equal(catalogJson.hearts, MAX_HEARTS);

  const entry = EXHIBITION[0];
  const play = await rpc('tools/call', { name: 'loom_rush_play', arguments: { seed: 1126, agent: entry.agent, steps: entry.steps } });
  const played = JSON.parse(play.json.result.content[1].text);
  assert.equal(play.json.result.isError, undefined);
  assert.equal(played.proof, 'e5bd99d2e77d');
  assert.equal(played.wavesCleared, 10);
  assert.match(play.json.result.content[0].text, /mage@pad2/);

  const locked = await rpc('tools/call', {
    name: 'loom_rush_play',
    arguments: { seed: 1126, agent: 'early', steps: [{ wave: 5, op: 'build', pad: 0, tower: 'paladin' }] },
  });
  assert.equal(locked.json.result.isError, true);
  assert.match(locked.json.result.content[0].text, /wave 6/);

  const board = await rpc('tools/call', { name: 'loom_rush_tournament', arguments: { seed: 1126 } });
  const ranked = JSON.parse(board.json.result.content[1].text);
  assert.equal(ranked.runs.length, 5);
  assert.equal(ranked.runs[0].agent, 'astra-arcane-volley');
  assert.equal(ranked.runs[0].place, 1);

  const opened = await rpc('tools/call', { name: 'open_loom_rush', arguments: {} });
  const door = JSON.parse(opened.json.result.content[1].text);
  assert.equal(door.url, 'https://pointcast.xyz/sketches/loom-rush/');
  assert.equal(door.sound, 'off');

  const resource = await rpc('resources/read', { uri: 'loom-rush://exhibition/1126' });
  assert.equal(JSON.parse(resource.json.result.contents[0].text).runs[0].proof, 'e5bd99d2e77d');

  const missing = await rpc('nope', {});
  assert.equal(missing.json.error.code, -32601);
  const broken = await rpc('initialize', {}, '{');
  assert.equal(broken.json.error.code, -32700);

  const note = await onRequestPost({
    request: new Request('https://pointcast.xyz/api/loom-rush-mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    }),
  });
  assert.equal(note.status, 204);

  const options = onRequestOptions();
  assert.equal(options.status, 204);
  const page = await onRequestGet().text();
  assert.match(page, /loom_rush_play/);
  assert.match(page, /\/sketches\/loom-rush\//);
  assert.doesNotMatch(page, /unpkg|jsdelivr|cdnjs|googleapis|esm\.sh/);
});

test('bundled Noun sprites match the #loom-rush SHA-256 notes', async () => {
  for (const sprite of SPRITES) {
    const bytes = await read(`public/sketches/loom-rush/${sprite.file}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sprite.sha256, sprite.file);
    assert.equal(bytes.readUInt32BE(16), 32);
    assert.equal(bytes.readUInt32BE(20), 32);
  }
});

function fakeWindow() {
  const all = [];
  const byId = new Map();
  const doc = {
    createElement(name) {
      const el = {
        tagName: name.toUpperCase(),
        children: [],
        attrs: {},
        listeners: {},
        className: '',
        textContent: '',
        width: 0,
        height: 0,
        ownerDocument: null,
        setAttribute(key, value) {
          this.attrs[key] = String(value);
          if (key === 'id') byId.set(String(value), this);
          if (key === 'width') this.width = Number(value);
          if (key === 'height') this.height = Number(value);
        },
        getAttribute(key) { return this.attrs[key] ?? null; },
        removeAttribute(key) { delete this.attrs[key]; },
        append(...kids) { for (const kid of kids) this.children.push(kid); },
        replaceChildren(...kids) { this.children = []; this.append(...kids); },
        addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
        click() { for (const fn of this.listeners.click || []) fn(); },
        querySelector(sel) { return walk(this, sel)[0] || null; },
        querySelectorAll(sel) { return walk(this, sel); },
        getContext() { return null; },
      };
      el.ownerDocument = doc;
      all.push(el);
      return el;
    },
    getElementById(id) { return byId.get(id) || null; },
    querySelector(sel) { return all.flatMap((el) => walk(el, sel))[0] || null; },
  };
  function matches(el, sel) {
    if (sel === 'button') return el.tagName === 'BUTTON';
    const attr = /^\[([a-z0-9-]+)="([^"]+)"\]$/.exec(sel);
    return attr ? el.attrs[attr[1]] === attr[2] : false;
  }
  function walk(el, sel) {
    const found = [];
    for (const child of el.children) {
      if (matches(child, sel)) found.push(child);
      found.push(...walk(child, sel));
    }
    return found;
  }
  const root = doc.createElement('div');
  return { root, window: { document: doc } };
}

test('the sketch is local, 390px wide, quiet, and reduced-motion aware', async () => {
  const page = (await read('src/pages/sketches/loom-rush.astro')).toString('utf8');
  const view = (await read('src/lib/loom/loom-rush-view.mjs')).toString('utf8');
  const endpoint = (await read('functions/api/loom-rush-mcp.ts')).toString('utf8');
  assert.match(page, /width=device-width/);
  assert.match(page, /max-width: 390px/);
  assert.match(page, /prefers-reduced-motion:\s*reduce/);
  assert.match(page, /min-height:\s*44px/);
  assert.match(page, /loom-rush-view\.mjs/);
  assert.match(page, /m_690b3z3n58/);
  assert.match(page, /m_4k2h6h1v31/);
  assert.match(view, /Sound off/);
  assert.match(view, /let sound = false/);
  assert.match(view, /prefers-reduced-motion/);
  assert.doesNotMatch(`${page}\n${view}`, /unpkg|jsdelivr|cdnjs|googleapis|esm\.sh|cdn\.jsdelivr/);
  assert.match(endpoint, /onRequestGet/);
  assert.match(endpoint, /onRequestPost/);
  assert.match(endpoint, /onRequestOptions/);
  assert.match(endpoint, /loom-rush-mcp\.mjs/);

  const { window, root } = fakeWindow();
  let audioStarts = 0;
  window.AudioContext = class { constructor() { audioStarts += 1; } };
  let frames = 0;
  window.requestAnimationFrame = () => { frames += 1; return 1; };
  window.matchMedia = (query) => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} });
  mountLoomRush(root, window);
  const sound = window.document.getElementById('sound');
  assert.equal(sound.getAttribute('aria-pressed'), 'false');
  assert.equal(sound.textContent, 'Sound off');
  assert.equal(audioStarts, 0);
  sound.click();
  assert.equal(sound.textContent, 'Sound on');
  assert.equal(audioStarts, 1);
  sound.click();
  assert.equal(sound.textContent, 'Sound off');

  window.document.querySelector('[data-tower="paladin"]').click();
  window.document.querySelector('[data-pad="0"]').click();
  assert.match(window.document.getElementById('status').textContent, /wave 6/);
  assert.equal(frames, 0);
  window.document.getElementById('send').click();
  assert.equal(frames, 0);
  assert.match(window.document.getElementById('status').textContent, /Wave 2 of 10/);
  assert.match(window.document.getElementById('status').textContent, /Hearts 12/);
  assert.equal(window.document.getElementById('field').width, 390);
});
