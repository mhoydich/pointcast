/**
 * Bloom Party (/bloom-party) — surface and rules spec.
 *
 * Two halves. The first asserts the registration fan-out actually happened:
 * a route without a block, an apps entry, an agent surface, and a DO binding
 * is an orphan page, not a shipped game. The second exercises the pure rules
 * in `src/lib/bloom-party.ts` — scoring and the 4-vs-15 scaling curve, which
 * is the part a browser test could never pin down precisely.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import {
  HEAT_THRESHOLD,
  MAX_PLAYERS,
  PACES,
  ROUNDS_PER_GAME,
  SHORTLIST_SIZE,
  VOICES,
  ballotSize,
  buildMs,
  dealPrompt,
  heatAllowance,
  normalizeRoomCode,
  normalizeSpec,
  orderBallot,
  playableItems,
  playbackMs,
  scheduleBloom,
  shortlistSlots,
  specToSeed,
  tallyRound,
  usesHeat,
  voteMs,
} from '../src/lib/bloom-party.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

// ---------- vocabulary ------------------------------------------------------

test('the game carries Tone Bloom\'s twelve voices and four paces', () => {
  assert.equal(VOICES.length, 12);
  assert.equal(PACES.length, 4);
  assert.deepEqual(PACES.map((pace) => pace.label), ['Float', 'Flow', 'Quick', 'Spark']);

  // These seven names come from the PointCast review; the page and the review
  // must not drift apart.
  for (const label of ['Bell', 'Gong', 'Singing Bowl', 'Velvet Vibes', 'Sunlit Marimba', 'Water Drop', 'Neon Spring']) {
    assert.ok(VOICES.some((voice) => voice.label === label), `missing voice ${label}`);
  }
  assert.equal(new Set(VOICES.map((voice) => voice.slug)).size, 12, 'voice slugs must be unique');
});

test('the page offers every voice and pace, driven from the shared module', async () => {
  const page = await read('src/pages/bloom-party.astro');
  // The picker is generated from VOICES/PACES rather than hand-listed, which
  // is what keeps the page, the worker, and the JSON twin from drifting.
  assert.match(page, /from '\.\.\/lib\/bloom-party'/);
  assert.match(page, /VOICES\.map\(\(voice\) => <option value=\{voice\.slug\}>/);
  assert.match(page, /PACES\.map\(/);
  assert.match(page, /ROOTS\.map\(/);
  assert.match(page, /join-code/, 'the page needs a room-code input');
  // Without this the whole scoreboard reads "someone — 6 votes".
  assert.match(page, /id="player-name"/, 'players must be able to enter a name');
  assert.match(page, /localStorage\.setItem\('bloom-party:name'/, 'the name must actually be saved');
  // iOS only starts an AudioContext inside a user gesture, so every entry
  // path — shared link, stage view, solo — has to land on a tap first.
  assert.match(page, /id="open-stage"/, 'the stage view needs its own gesture');
  assert.match(page, /function clearPlayback/, 'queued blooms must be cancellable');
  assert.match(page, /function reopenBallot/, 'a rejected vote must be recastable');
  assert.match(page, /mulberry32\(0xb1008\)/, 'the noise buffer must be seeded, not Math.random');
  assert.ok(!/Math\.random\(\) \* 2 - 1/.test(page), 'unseeded noise breaks cross-device determinism');
  assert.match(page, /view=stage/, 'the page needs the shared stage view');
  assert.match(page, /solo/, 'the page needs solo mode for when the DO is unavailable');
});

// ---------- specs are never trusted ----------------------------------------

test('a spec from the wire is clamped, never crashed on', () => {
  const hostile = normalizeSpec({
    voice: 'not-a-voice',
    pace: 42,
    brightness: 9e9,
    drift: -3,
    density: 900,
    root: '<script>',
    seed: Number.NaN,
  });
  assert.ok(VOICES.some((voice) => voice.slug === hostile.voice));
  assert.ok(PACES.some((pace) => pace.slug === hostile.pace));
  assert.equal(hostile.brightness, 1);
  assert.equal(hostile.drift, 0);
  assert.equal(hostile.density, 4);
  assert.equal(hostile.seed, 0);
  assert.doesNotThrow(() => normalizeSpec(null));
  assert.doesNotThrow(() => normalizeSpec('nope'));
});

/**
 * A golden vector. Calling scheduleBloom twice in one process only proves the
 * function is pure; it cannot catch the thing that actually matters, which is
 * that a build shipped today renders the same audio as the build on someone
 * else's phone. Pinning real numbers does.
 *
 * If this test fails, every phone in a room mid-game disagrees about what it
 * is hearing. Do not update the expected values without bumping
 * BLOOM_PARTY.protocolVersion.
 */
test('a known spec produces exactly these notes, on every build', () => {
  const spec = normalizeSpec({ voice: 'bell', pace: 'quick', brightness: 0.42, drift: 0.6, density: 2, root: 'g', seed: 7 });
  assert.equal(specToSeed(spec), 1821011309, 'the spec hash is the seed for everything downstream');

  const notes = scheduleBloom(spec, 1500);
  assert.equal(notes.length, 6);
  const rounded = notes.map((note) => [
    Number(note.at.toFixed(6)),
    Number(note.hz.toFixed(4)),
    Number(note.gain.toFixed(6)),
    Number(note.pan.toFixed(6)),
  ]);
  assert.deepEqual(rounded, [
    [0, 392, 0.849395, 0.243724],
    [0.012, 980, 0.426031, 0.077867],
    [0.5586, 784, 0.865683, 0.452843],
    [0.5706, 1764, 0.486461, -0.054837],
    [0.98, 653.3333, 0.745939, 0.121486],
    [0.992, 588, 0.388187, 0.16453],
  ]);
});

test('the same spec renders the same bloom on every phone', () => {
  const spec = normalizeSpec({ voice: 'bell', pace: 'quick', brightness: 0.42, drift: 0.6, density: 3, root: 'g', seed: 7 });
  assert.deepEqual(scheduleBloom(spec, 4000), scheduleBloom(spec, 4000));
  assert.equal(specToSeed(spec), specToSeed({ ...spec }));
  assert.notEqual(specToSeed(spec), specToSeed({ ...spec, seed: 8 }));
  // A float that survives a JSON round-trip must hash identically — this is
  // the path a spec takes from the builder's phone to everyone else's.
  const wired = normalizeSpec(JSON.parse(JSON.stringify(spec)));
  assert.equal(specToSeed(wired), specToSeed(spec));
  assert.deepEqual(scheduleBloom(wired, 4000), scheduleBloom(spec, 4000));
});

test('a bloom never schedules a note past the time it was given', () => {
  for (const pace of PACES) {
    const spec = normalizeSpec({ pace: pace.slug, density: 1 });
    const notes = scheduleBloom(spec, 3000);
    assert.ok(notes.length >= 1, `${pace.label} produced no notes`);
    // The note must *start* inside the window. The earlier version of this
    // assertion allowed `at` to run a full note-length past the end, which is
    // exactly the overrun its name claimed to forbid.
    assert.ok(
      notes.every((note) => note.at * 1000 < 3000),
      `${pace.label} scheduled a note starting after the bloom ended`,
    );
  }
});

test('the ballot is labelled in the order the room heard the blooms', () => {
  // 10 players, heat cut to 5. shortlistSlots returns them heat-sorted; the
  // ballot must come back in playback order or "Bloom #2" means nothing.
  const heard = [7, 2, 9, 0, 4, 1, 8, 3, 6, 5];
  const shortlist = [8, 2, 5, 7, 0];
  assert.deepEqual(orderBallot(heard, shortlist), [7, 2, 0, 8, 5]);

  // A phone that joined after playback has no order and takes the ballot as-is.
  assert.deepEqual(orderBallot([], shortlist), shortlist);
  // A ballot entry never heard is kept, not dropped.
  assert.deepEqual(orderBallot([3, 1], [1, 3, 9]), [3, 1, 9]);
  assert.deepEqual(orderBallot(heard, []), []);
});

test('a phone rejoining mid-playback waits for the next bloom', () => {
  const items = [
    { slot: 4, startAt: 1000 },
    { slot: 1, startAt: 5000 },
    { slot: 7, startAt: 9000 },
  ];
  // Fresh arrival — everything still ahead.
  assert.deepEqual(playableItems(items, 0).map((i) => i.slot), [4, 1, 7]);
  // Mid-way through bloom #2: it is dropped rather than restarted from the
  // top, which would put this phone a beat behind and overlap bloom #3.
  assert.deepEqual(playableItems(items, 6000).map((i) => i.slot), [7]);
  // Exactly on a boundary still plays.
  assert.deepEqual(playableItems(items, 5000).map((i) => i.slot), [1, 7]);
  // Arrived after the whole phase.
  assert.deepEqual(playableItems(items, 99_000), []);
});

// ---------- room codes ------------------------------------------------------

test('room codes exclude the characters people misread aloud', () => {
  assert.equal(normalizeRoomCode('ktp4xr'), 'KTP4XR');
  assert.equal(normalizeRoomCode('  KTP4XR  '), 'KTP4XR');
  for (const bad of ['KTP4X', 'KTP4XRR', 'KTPOXR', 'KTPIXR', 'KTPLXR', 'KTPUXR', 'KTP0XR', 'KTP1XR', '', null]) {
    assert.equal(normalizeRoomCode(bad), null, `${bad} should not be a valid code`);
  }
});

// ---------- scoring ---------------------------------------------------------

const subs = (...ids) => ids.map((id, index) => ({ playerId: id, slot: index, submittedAt: index + 1 }));

test('a self-vote is dropped at tally time, not just at the wire', () => {
  const result = tallyRound(subs('a', 'b'), [{ voterId: 'a', slot: 0 }]);
  assert.equal(result.tallies.find((t) => t.slot === 0).votes, 0);
  assert.deepEqual(result.winningSlots, []);
});

test('one ballot each — a second vote from the same player is ignored', () => {
  const result = tallyRound(subs('a', 'b', 'c'), [
    { voterId: 'a', slot: 1 },
    { voterId: 'a', slot: 2 },
  ]);
  assert.equal(result.tallies.find((t) => t.slot === 1).votes, 1);
  assert.equal(result.tallies.find((t) => t.slot === 2).votes, 0);
});

test('votes, plurality, and the unanimous read all pay out', () => {
  const result = tallyRound(subs('a', 'b', 'c'), [
    { voterId: 'a', slot: 1 },
    { voterId: 'c', slot: 1 },
  ]);
  // b: submitted 1 + two votes at 3 + unanimous 2 = 9
  assert.equal(result.points.b, 9);
  // a: submitted 1 + first-submit 1 + voted with the plurality 1 = 3
  assert.equal(result.points.a, 3);
  // c: submitted 1 + plurality 1 = 2
  assert.equal(result.points.c, 2);
  assert.equal(result.unanimous, true);
  assert.deepEqual(result.winningSlots, [1]);
});

test('a split room is not a unanimous read', () => {
  const result = tallyRound(subs('a', 'b', 'c', 'd'), [
    { voterId: 'a', slot: 1 },
    { voterId: 'b', slot: 2 },
    { voterId: 'c', slot: 3 },
    { voterId: 'd', slot: 0 },
  ]);
  assert.equal(result.unanimous, false);
  assert.equal(result.winningSlots.length, 4, 'a four-way tie has four winners');
});

test('ties break on heats received', () => {
  const result = tallyRound(
    subs('a', 'b', 'c'),
    [{ voterId: 'c', slot: 0 }, { voterId: 'a', slot: 1 }],
    [{ voterId: 'a', slot: 1 }, { voterId: 'c', slot: 1 }],
  );
  assert.equal(result.tallies[0].slot, 1, 'the hotter of two tied blooms sorts first');
});

test('nobody scores a round nobody voted in, but building still counts', () => {
  const result = tallyRound(subs('a', 'b'), []);
  assert.equal(result.points.a, 2); // submitted + first
  assert.equal(result.points.b, 1);
  assert.deepEqual(result.winningSlots, []);
  assert.equal(result.unanimous, false);
});

// ---------- scaling: the whole reason this works at 4 and at 15 -------------

test('build time grows with the room but stays bounded', () => {
  assert.equal(buildMs(4), 38_000);
  assert.equal(buildMs(15), 60_000);
  for (let n = 2; n <= MAX_PLAYERS; n++) {
    assert.ok(buildMs(n) >= 35_000 && buildMs(n) <= 60_000);
    assert.ok(buildMs(n) >= buildMs(n - 1), 'build time must not shrink as players join');
  }
});

test('total playback stays in a listenable window at every room size', () => {
  assert.equal(playbackMs(4), 6_000);
  assert.equal(playbackMs(15), 3_200);
  for (let n = 4; n <= MAX_PLAYERS; n++) {
    const total = playbackMs(n) * n;
    assert.ok(total <= 66_000, `${n} players would sit through ${total}ms of playback`);
    assert.ok(playbackMs(n) >= 2_600, 'a bloom below 2.6s stops being legible');
  }
});

test('the ballot never grows past five options', () => {
  for (let n = 2; n <= MAX_PLAYERS; n++) {
    assert.ok(ballotSize(n) <= Math.max(SHORTLIST_SIZE, n < HEAT_THRESHOLD ? n : SHORTLIST_SIZE));
    if (n >= HEAT_THRESHOLD) assert.equal(ballotSize(n), SHORTLIST_SIZE);
    else assert.equal(ballotSize(n), n);
  }
  assert.equal(usesHeat(6), false);
  assert.equal(usesHeat(7), true);
  assert.ok(voteMs(ballotSize(15)) <= 25_000);
});

test('the heat pass cuts a big room down to the shortlist', () => {
  const tallies = Array.from({ length: 12 }, (_, slot) => ({
    slot, playerId: `p${slot}`, votes: 0, heats: slot,
  }));
  const short = shortlistSlots(tallies, 12);
  assert.equal(short.length, SHORTLIST_SIZE);
  assert.deepEqual(short, [11, 10, 9, 8, 7], 'the hottest five advance');

  // A small room skips the cut entirely — everyone is on the ballot.
  assert.equal(shortlistSlots(tallies.slice(0, 4), 4).length, 4);
  assert.ok(heatAllowance(15) >= 1 && heatAllowance(15) <= 15);
});

test('the prompt deck does not repeat until it is exhausted', () => {
  const used = [];
  for (let i = 0; i < 40; i++) {
    const card = dealPrompt(used, () => 0.5);
    assert.ok(!used.includes(card.id), `dealt ${card.id} twice`);
    used.push(card.id);
  }
  // Deck empty — it reshuffles rather than stalling a long night.
  assert.ok(dealPrompt(used, () => 0.5).id);
});

// ---------- the fan-out actually happened ----------------------------------

test('the route is a real app on the shelf', async () => {
  const apps = await read('src/lib/pointcast-apps.ts');
  assert.match(apps, /slug: 'bloom-party'/);
  assert.match(apps, /path: '\/bloom-party'/);
  assert.match(apps, /channel: 'CH\.GDN'/);
});

test('agents can find the game and its socket', async () => {
  const agents = await read('src/pages/agents.json.ts');
  assert.match(agents, /bloomParty: 'https:\/\/pointcast\.xyz\/bloom-party'/);
  assert.match(agents, /bloomPartyJson/);
  assert.match(agents, /wss:\/\/pointcast\.xyz\/api\/bloom\/room/);

  const llms = await read('public/llms.txt');
  assert.match(llms, /\/bloom-party/);
  const llmsFull = await read('public/llms-full.txt');
  assert.match(llmsFull, /Bloom Party/);
});

test('the MCP surface is read-only on purpose', async () => {
  const mcp = await read('functions/api/mcp.ts');
  assert.match(mcp, /bloom_party_state/);
  assert.ok(!/bloom_party_vote|bloom_party_submit|bloom_party_join/.test(mcp),
    'agents must not be able to play a game for people who are in a room together');
});

test('the Durable Object binding is declared and points at its own Worker', async () => {
  const wrangler = await read('wrangler.toml');
  assert.match(wrangler, /name = "BLOOM_ROOM"/);
  assert.match(wrangler, /class_name = "BloomPartyRoom"/);
  assert.match(wrangler, /script_name = "pointcast-bloom"/);

  const workerConfig = JSON.parse(
    (await read('workers/pointcast-bloom/wrangler.jsonc')).replace(/^\s*\/\/.*$/gm, ''),
  );
  assert.equal(workerConfig.name, 'pointcast-bloom');
  assert.deepEqual(workerConfig.migrations[0].new_sqlite_classes, ['BloomPartyRoom']);
});

test('the worker validates frames and refuses an unknown room code', async () => {
  const worker = await read('workers/pointcast-bloom/src/index.ts');
  assert.match(worker, /MAX_FRAME_BYTES = 1024/);
  assert.match(worker, /MAX_MESSAGES_PER_SECOND = 10/);
  assert.match(worker, /setAlarm/, 'phase timing must survive hibernation');
  assert.ok(!/\bsetInterval\s*\(/.test(worker), 'setInterval does not survive WebSocket hibernation');
  assert.match(worker, /no-self-vote/);

  // A DO has one alarm slot, shared by the phase deadline and the idle sweep.
  // Arming it anywhere but armAlarm() is how a reconnecting phone used to push
  // the running phase 45 minutes out and freeze the room.
  const alarmCalls = worker.match(/this\.ctx\.storage\.setAlarm\(/g) ?? [];
  assert.equal(alarmCalls.length, 1, 'only armAlarm() may set the alarm');
  assert.match(worker, /private armAlarm\(\): void \{[^}]*phase_ends_at/s);

  // Playback order must not be submission order — the roster shows who has
  // submitted, live, so sequential slots would name every bloom in advance.
  assert.match(worker, /Math\.random\(\)[^\n]*\n?\s*\}?\s*$|free\[Math\.floor\(Math\.random\(\)/s);
  assert.match(worker, /private nextSlot/);
  assert.ok(!/for \(let slot = 0; slot < MAX_PLAYERS; slot\+\+\) \{\s*\n\s*if \(!used\.has\(slot\)\) return slot;/.test(worker),
    'nextSlot must not hand out the lowest free slot');

  // The rules that depend on room size are frozen when playback starts.
  assert.match(worker, /round_players/);
  assert.match(worker, /private roundPlayers\(\)/);

  const proxy = await read('functions/api/bloom/room.ts');
  assert.match(proxy, /bad-room-code/, 'an unknown code must not fall back to a shared room');
  assert.match(proxy, /BLOOM_ROOM/);
});

test('block 0572 is the permanent record', async () => {
  const block = JSON.parse(await read('src/content/blocks/0572.json'));
  assert.equal(block.id, '0572');
  assert.equal(block.channel, 'GDN');
  assert.equal(block.external.url, 'https://pointcast.xyz/bloom-party');
  assert.equal(block.author, 'cc');
  assert.match(block.source, /2026-08-08/);
  assert.equal(block.meta.maxPlayers, MAX_PLAYERS);
  assert.equal(block.meta.rounds, ROUNDS_PER_GAME);
  assert.equal(block.meta.audioOverTheWire, false);
});
