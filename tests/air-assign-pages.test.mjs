import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Source contracts for the Field Report Assignments front end (build spec
// §3.8: /r/assign, the /r strip, the spot-page badge and the /r/me fills
// list), in the style of tests/air-pages.test.mjs. The API and store side of
// phase 1 (functions/api/air/assign.ts, functions/_lib/air-store.ts) are a
// separate PR; these are source assertions against the pages and the client,
// not a live-server run.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [client, assignPage, home, me, airSpot, assignLib, spots] = await Promise.all([
  read('src/scripts/air-client.ts'),
  read('src/pages/r/assign.astro'),
  read('src/pages/r/index.astro'),
  read('src/pages/r/me.astro'),
  read('src/components/air/AirSpot.astro'),
  read('functions/_lib/air-assign.mjs'),
  read('src/data/air-spots.json'),
]);
const config = JSON.parse(spots);
const { ASSIGN_REASONS } = await import('../functions/_lib/air-assign.mjs');

test('/r/assign: noindex, the copy line and templates come from the shared config, nothing hardcoded', () => {
  assert.match(assignPage, /noindex/);
  assert.match(assignPage, /import \{ AIR_ASSIGN_TEMPLATES, airSpot \} from '\.\.\/\.\.\/lib\/air'/);
  assert.match(assignPage, /import \{ ASSIGN_COPY, MAX_SEATS \} from '\.\.\/\.\.\/\.\.\/functions\/_lib\/air-assign\.mjs'/);
  assert.match(assignPage, /\{ASSIGN_COPY\}/, 'the page prints the shared copy line, not its own words');
  assert.match(assignPage, /AIR_ASSIGN_TEMPLATES\.map\(/, 'template options are generated from the config, never listed by hand');
  for (const t of config.assignTemplates) assert.doesNotMatch(assignPage, new RegExp(`>${t.label}<`), 'no template label typed into the markup');
  assert.match(assignPage, /max=\{MAX_SEATS\}/);
  assert.match(assignPage, /<noscript>/);
  assert.match(assignPage, /import \{ mountAir \} from '\.\.\/\.\.\/scripts\/air-client'/);
});

test('/r/assign: the house-only split — one shell, two hidden halves, decided by the client alone', () => {
  assert.match(assignPage, /data-air-assign-page/);
  assert.match(assignPage, /data-air-assign-house hidden/);
  assert.match(assignPage, /House only\. Assignments are put out by the house/);
  assert.match(assignPage, /data-air-assign-director hidden/);
  assert.match(assignPage, /data-air-assign-form/);
  assert.match(assignPage, /data-air-assign-template required/);
  assert.match(assignPage, /data-air-assign-day required/);
  assert.match(assignPage, /data-air-assign-start/);
  assert.match(assignPage, /data-air-assign-seats/);
  assert.match(assignPage, /data-air-assign-list/);
  assert.match(assignPage, /data-air-assign-empty hidden/);
  assert.match(assignPage, /data-air-assign-note/);
  // Nothing about who may create is decided at build/render time: no server-rendered role check
  // in the frontmatter (the doc comment above the fence may still name the gate it defers to).
  const frontmatter = assignPage.slice(0, assignPage.indexOf('\n---', 3));
  assert.doesNotMatch(frontmatter, /Astro\.locals|session\.user\.roles|\.roles\.includes\(/, 'the page never re-implements the director gate; the API answers canCreate');
});

test('client: mountAirAssign reads canCreate and toggles the two halves, never the reverse', () => {
  const fn = client.slice(client.indexOf('export function mountAirAssign('), client.indexOf('\n// Auto-mount'));
  assert.ok(fn.length > 0, 'mountAirAssign is defined before the auto-mount block');
  assert.match(fn, /getJson<AssignIndex>\('\/api\/air\/assign'\)/);
  assert.match(fn, /house\.hidden = data\.canCreate/);
  assert.match(fn, /director\.hidden = !data\.canCreate/);
  assert.match(fn, /data\.canCreate \? data\.recent \?\? \[\] : data\.open \?\? \[\]/, 'everyone sees `open`; directors get `recent`; an empty list is safe if it is ever missing');
  assert.match(fn, /if \(!a\) return li;/, 'fillers, the void note and Void are on directors\' rows only');
  assert.doesNotMatch(fn, /pid_hash|ip_hash|\bowner\b|\bnet\b/, 'the assign UI never reads owner, net or the hashes');
  assert.match(client, /document\.querySelectorAll<HTMLElement>\('\[data-air-assign-page\]'\)\.forEach\(mountAirAssign\)/);
});

test('client: create posts one template, one day, one window; void carries the one free-text note, capped at 80', () => {
  assert.match(client, /action: 'create', template, day, start, seats/);
  assert.match(client, /postJson<\{ ok: true; assignment: AssignItem \}>\('\/api\/air\/assign'/);
  assert.match(client, /reason\.maxLength = 80/, 'the void note is the one piece of free text, capped client-side too');
  assert.match(client, /action: 'void', id, reason: reason \|\| undefined/);
  assert.match(client, /btn\.textContent = 'Void'/);
});

test('client: ASSIGN_ERROR_COPY covers exactly the reasons functions/_lib/air-assign.mjs documents', () => {
  const block = client.slice(client.indexOf('const ASSIGN_ERROR_COPY'), client.indexOf('};', client.indexOf('const ASSIGN_ERROR_COPY')));
  const keys = [...block.matchAll(/^\s*(?:'([\w-]+)'|(\w[\w-]*)):/gm)].map((m) => m[1] || m[2]);
  assert.deepEqual(keys.sort(), [...ASSIGN_REASONS].sort());
  assert.match(assignLib, /ASSIGN_REASONS = \[/, 'the reason list lives in one place');
});

test('spot page: the assignment badge sits above the ask, hidden until the client paints it', () => {
  const askAt = airSpot.indexOf('data-air-ask');
  const badgeAt = airSpot.indexOf('data-air-assign');
  assert.ok(badgeAt > -1 && badgeAt < askAt, 'the badge is above [data-air-ask] (build spec §3.8)');
  assert.match(airSpot, /<p class="air__assign air-mono" data-air-assign hidden><\/p>/);
});

test('client: the badge prints the three lines the spec gives verbatim, and hides with no assignment', () => {
  const fn = client.slice(client.indexOf('function assignBadgeText('), client.indexOf('function paintAssign('));
  assert.match(fn, /return 'Assignment filled'/);
  assert.match(fn, /ASSIGNMENT · \$\{a\.label\} · until \$\{laClock\(a\.endsAt\)\} · \$\{seatsOpenText\(a\.seatsLeft, a\.seats\)\} · \+\$\{a\.reward\}/, 'the seats left, never the seats taken');
  assert.match(fn, /Next assignment \$\{laWhen\(a\.startsAt\)\} · \+\$\{a\.reward\}/, 'dated past tomorrow, so a call a week out never reads as today');
  assert.match(client, /function paintAssign\(a: AssignBadge \| null \| undefined\) \{/);
  assert.match(client, /if \(!a\) \{ show\(els\.assign, false\); return; \}/);
  assert.match(client, /paintAssign\(data\.assignment\);/, 'paintReading paints the badge every refresh');
});

test('/r: the assignments strip is one small section, hidden with nothing open, linking to the Desk', () => {
  const stripAt = home.indexOf('data-air-assign-strip');
  const bandAt = home.indexOf('rh__band');
  assert.ok(stripAt > -1 && stripAt < bandAt, 'the strip sits above the band plan, not inside it');
  assert.match(home, /data-air-assign-strip hidden/);
  assert.match(home, /data-air-assign-strip-list/);
  assert.match(home, /href="\/r\/assign"/);
});

test('client: the strip only fetches when it exists on the page, and shows calls with a seat left, live or ahead', () => {
  assert.match(client, /assignStrip \? getJson<AssignIndex>\('\/api\/air\/assign'\) : Promise\.resolve\(null\)/);
  const fn = client.slice(client.indexOf('const paintAssignStrip ='), client.indexOf('const paint = (data: AirIndex)'));
  assert.match(fn, /\.filter\(\(a\) => a\.seatsLeft > 0\)/);
  assert.match(fn, /a\.live \? `until \$\{laClock\(a\.endsAt\)\}/, 'a live call shows when it closes, one ahead shows when it opens');
  assert.match(fn, /assignStrip\.hidden = open\.length === 0/);
  assert.match(fn, /\.slice\(0, 5\)/, 'a strip, not the whole open list');
});

test('/r/me: an Assignments section with the WITNESSED mark, and assigned points shown beside the total', () => {
  assert.match(me, /data-air-me-assign-section hidden/);
  assert.match(me, /data-air-me-assigns/);
  assert.match(me, /data-air-me-assigned hidden/);
});

test('client: /me paints assignments with WITNESSED and the "+N from assignments" line, never the raw net or owner', () => {
  assert.match(client, /type MeAssign = \{ id: string; label: string; spot: string; day: string; reward: number; witnessed: boolean; text: string \}/);
  assert.match(client, /assigned\?: number/);
  const fn = client.slice(client.indexOf('const assignRows = me.assignments'), client.indexOf('const nothing = places.length'));
  assert.match(fn, /if \(a\.witnessed\) \{ const status = document\.createElement\('small'\); status\.textContent = 'WITNESSED'; li\.append\(status\); \}/, 'the mark only when there is one');
  assert.match(client, /pointsAssigned\.textContent = assignedPts > 0 \? `\+\$\{assignedPts\} from assignments` : ''/);
  assert.doesNotMatch(fn, /pid_hash|ip_hash|\.owner\b|\.net\b/);
});

test('the Friday courts flow is untouched: state machine, storage keys and events unchanged', () => {
  assert.match(client, /type State = 'idle' \| 'sending' \| 'stamped' \| 'queued' \| 'crew'/);
  for (const key of ['pc_air_device', 'pc_air_code:', 'pc_air_queue', 'pc_air_seen_crew', 'pc_air_mute']) assert.match(client, new RegExp(`'${key.replace(':', '\\:')}'`), key);
  for (const ev of ['air:tap', 'air:print', 'air:blip', 'air:needle', 'air:stamp', 'air:first-light', 'air:agree', 'air:crew']) assert.match(client, new RegExp(`emit\\('${ev}'`), ev);
});
