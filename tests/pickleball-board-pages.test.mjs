import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// The Pickleball Board, group B (build spec §2, §9, §10; Fable design §2,
// §3, §6; Group B's own §11): the page, its four components, the board
// client and the /r/board redirect. The client is TypeScript and the page is
// Astro, so — in the style of tests/air-pages.test.mjs — the rules other
// builders and the verification ladder (§12) rely on are asserted in the
// source text, not by running the (unbuilt-at-test-time) API.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [client, page, boardRedirect, nowHero, conditionsStrip, courtCard, tapRow, spots] = await Promise.all([
  read('src/scripts/pickleball-board.ts'),
  read('src/pages/pickleball.astro'),
  read('src/pages/r/board.astro'),
  read('src/components/courts/NowHero.astro'),
  read('src/components/courts/ConditionsStrip.astro'),
  read('src/components/courts/CourtCard.astro'),
  read('src/components/courts/TapRow.astro'),
  read('src/data/air-spots.json'),
]);
const config = JSON.parse(spots);

test('client: never imports or calls codeFor(), only the board-safe storedCode()', () => {
  assert.match(client, /import \{[^}]*\bstoredCode\b[^}]*\} from '\.\/air-client'/);
  // codeFor is named once, in the header comment explaining why the board avoids it; strip comment lines
  // and confirm the word never appears in actual code (an import, a call, anything executable).
  const codeLines = client.split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l));
  for (const l of codeLines) assert.doesNotMatch(l, /\bcodeFor\b/, `codeFor referenced outside a comment: ${l.trim()}`);
  const callSites = [...client.matchAll(/\bstoredCode\(spotId\)/g)];
  assert.ok(callSites.length >= 3, 'every code lookup (hero, Still true?, TapRow) goes through storedCode(spotId)');
});

test('client: touches no storage directly — deviceId()/storedCode() (already wrapped in air-client.ts) do that', () => {
  assert.doesNotMatch(client, /localStorage\.(getItem|setItem|removeItem)/);
  assert.doesNotMatch(client, /sessionStorage\.(getItem|setItem)/);
  assert.match(client, /\bdeviceId\(\)/);
});

test('client: never sends pid_hash/ip_hash, and a device travels in the POST body, not a query string', () => {
  assert.doesNotMatch(client, /pid_hash|ip_hash/);
  assert.doesNotMatch(client, /[?&]device=/);
});

test('client: every link into a spot is built with spotUrl(), never a literal /r/<id> template', () => {
  assert.doesNotMatch(client, /`\/r\/\$\{/, 'no hand-built /r/ template — spotUrl() owns that path');
  assert.match(client, /spotUrl\(best\.court\)/, 'the hero links to the best bet through spotUrl()');
  assert.match(client, /location\.href = spotUrl\(spotId\)/, 'wait\'s Changed sends the phone to /r/<id> to re-ask');
  for (const s of config.spots) assert.doesNotMatch(client, new RegExp(`/r/${s.id}[\`'"]`), `${s.id}: no literal link`);
});

test('client: Still true? posts {reportId, verdict, device, code} and TapRow posts {kind, value, device, code, extras, asGuest, observedAt}', () => {
  assert.match(client, /'\/api\/air\/confirm'/);
  assert.match(client, /\{ reportId: reading\.reportId, verdict: 'changed', device, code \}/);
  assert.match(client, /\{ reportId: reading\.reportId, verdict: 'still', device, code \}/);
  assert.match(client, /\{ kind, value, device, code, extras: \[\], asGuest: false, observedAt \}/);
  assert.match(client, /\{ kind, value: own\.value, device, code, extras, asGuest: false, observedAt: own\.observedAt \}/);
});

test('client: the strip or the ask, never both — parking\'s TapRow hides while Still true? is on offer', () => {
  assert.match(client, /if \(tap\) tap\.hidden = offerConfirm;/);
  assert.match(client, /kind === 'wait' \? 'Quiet\. No live report yet\.' : 'Quiet\.'/);
});

test('client: a rating kind (vibe) never offers Still true? — paintReading is only called for wait and parking', () => {
  const calls = [...client.matchAll(/paintReading\(card, boardCourt\.id, '(\w+)'/g)].map((m) => m[1]);
  assert.deepEqual(calls, ['wait', 'parking']);
  assert.match(client, /paintVibe\(card, boardCourt\.id, boardCourt\.vibe\)/);
});

test('client: polls GET /api/air/board every 30 s, paused while hidden', () => {
  assert.match(client, /POLL_MS = 30_000/);
  assert.match(client, /getJson<BoardPayload>\('\/api\/air\/board'\)/);
  assert.match(client, /document\.addEventListener\('visibilitychange'/);
  assert.match(client, /if \(document\.hidden\) clearTimeout\(timer\)/);
});

test('client: the best bet moves to the front of the card list and is marked', () => {
  assert.match(client, /cardsEl\.prepend\(card\)/);
  assert.match(client, /card\.setAttribute\('data-pb-best', ''\)/);
  assert.match(client, /reorder\(data\.best\?\.court \?\? null\)/);
});

test('/r/board: noindex, meta-refresh to /pickleball, and "board" stays reserved so it is never a spot id', () => {
  assert.match(boardRedirect, /noindex/);
  assert.match(boardRedirect, /http-equiv="refresh"\}? ?content=\{`0; url=\$\{targetUrl\}`\}/);
  assert.match(boardRedirect, /const targetUrl = '\/pickleball'/);
  assert.match(boardRedirect, /window\.location\.replace\(targetUrl\)/);
  assert.ok(config.reserved.includes('board'), 'src/data/air-spots.json must keep "board" reserved for this route');
});

test('page: every court renders through CourtCard with spotUrl-backed report links, board order from COURTS', () => {
  assert.match(page, /import \{ COURTS, PRIVATE_COURTS, CONFIRM_ITEMS, COURT_SOURCES, provenanceLine \} from '\.\.\/lib\/courts'/);
  assert.match(page, /\{COURTS\.map\(\(court\) => \(/);
  assert.match(page, /<CourtCard court=\{court\} spot=\{court\.air \? airSpot\(court\.id\) : null\} \/>/);
  assert.match(courtCard, /const reportHref = spot \? spotUrl\(spot\.id\) : null/);
  assert.doesNotMatch(courtCard, /href=\{`\/r\//, 'the report link is spotUrl(), not a hand-built template');
});

test('page: hideAds, og:image /og/pickleball.png, and a non-null jsonLd (the CC addendum)', () => {
  assert.match(page, /hideAds/);
  assert.match(page, /const ogImage = '\/og\/pickleball\.png'/);
  assert.match(page, /image=\{ogImage\}/);
  assert.match(page, /jsonLd=\{jsonLd\}/);
  assert.match(page, /'@type': 'CollectionPage'/);
  assert.match(page, /mainEntity: COURTS\.map\(courtEntity\)/);
});

test('JSON-LD: one SportsActivityLocation per court; hours and drop-in Events render only when verified', () => {
  assert.match(page, /'@type': 'SportsActivityLocation'/);
  assert.match(page, /additionalType: 'https:\/\/en\.wikipedia\.org\/wiki\/Pickleball'/);
  assert.match(page, /if \(court\.hours && court\.hours\.confidence === 'verified'\)/, 'OpeningHoursSpecification only where verified');
  assert.match(page, /const dropins = court\.blocks\.filter\(\(b\) => b\.kind === 'dropin' && b\.confidence === 'verified'\)/, 'Event/Schedule only for verified drop-ins');
  assert.match(page, /if \(spec\.length > 0\) entity\.openingHoursSpecification = spec/, 'never an empty [] when every rule is dusk-close');
  assert.match(page, /'@type': 'Event'/);
  assert.match(page, /'@type': 'Schedule'/);
});

test('showable(): verified renders, partial is tagged "unconfirmed", unverified never renders, 45+ days reads "may have changed"', () => {
  assert.match(courtCard, /if \(p\.confidence === 'unverified'\) return \{ show: false, tag: null \}/);
  assert.match(courtCard, /const stale = daysSince\(p\.checked, now\) >= 45/);
  assert.match(courtCard, /p\.confidence === 'partial' \? 'unconfirmed' : stale \? 'stale' : null/);
  assert.match(courtCard, /may have changed/);
  assert.match(courtCard, /provenanceLine\(/, 'every rendered fact carries its source + checked date');
});

test('CourtCard: readings, Still true? and TapRow hooks are keyed "<spotId>:<kind>", and a listing-only court gets none of them', () => {
  assert.match(courtCard, /data-pb-reading=\{`\$\{spot\.id\}:wait`\}/);
  assert.match(courtCard, /data-pb-reading=\{`\$\{spot\.id\}:parking`\}/);
  assert.match(courtCard, /data-pb-confirm=\{`\$\{spot\.id\}:wait`\}/);
  assert.match(courtCard, /data-pb-confirm=\{`\$\{spot\.id\}:parking`\}/);
  assert.match(courtCard, /data-pb-vibe=\{`\$\{spot\.id\}:vibe`\}/);
  assert.match(courtCard, /\{spot && waitCfg && \(/, 'no reading strip without a spot to report at');
  assert.match(courtCard, /<TapRow spotId=\{spot\.id\} kind="parking" cfg=\{parkingCfg\} \/>/);
  assert.match(courtCard, /<TapRow spotId=\{spot\.id\} kind="vibe" cfg=\{vibeCfg\} \/>/);
});

test('TapRow: options and extras come from the spot\'s own AirKind config, never a hardcoded list', () => {
  assert.match(tapRow, /interface Props \{\s*spotId: string;\s*kind: string;\s*cfg: AirKind;\s*\}/);
  assert.match(tapRow, /\{cfg\.options\.map\(\(o\) => \(/);
  assert.match(tapRow, /data-pb-tap-value=\{o\.v\}/);
  assert.match(tapRow, /\{cfg\.extras\.length > 0 && \(/);
  assert.match(tapRow, /data-pb-tap-extra=\{x\}/);
  assert.doesNotMatch(tapRow, /Pancake|Solid|Character|Survival|Condemned|Easy|Tight|Full|Paid/, 'no bucket labels hardcoded — they come from air-spots.json');
});

test('NowHero and ConditionsStrip render a neutral, non-guessing shell (honesty rule 5) until the client fills it', () => {
  assert.match(nowHero, /Checking the board…/);
  assert.doesNotMatch(nowHero, /locked|booked|taken|waiting/i, 'the static shell never guesses a wait');
  assert.match(conditionsStrip, />KLAX</);
  assert.match(conditionsStrip, /data-pb-cond-wind/);
  assert.match(conditionsStrip, /data-pb-cond-sunset/);
});

test('the masthead badge art reuses the existing Field Reports stamps (courts-stamp, still-true)', () => {
  assert.match(page, /images\/air\/badges\/courts-stamp\.webp/);
  assert.match(courtCard, /images\/air\/badges\/still-true\.webp/);
});

test('/r/board stays out of the sitemap (seo-rules), like /court and /r/me; /pickleball is the page to index', async () => {
  const { isNoindexPath } = await import('../src/lib/seo-rules.mjs');
  assert.equal(isNoindexPath('/r/board'), true);
  assert.equal(isNoindexPath('/r/board/'), true);
  assert.equal(isNoindexPath('/pickleball'), false);
});

/* ---------- fixer pass ---------- */

test('components: a scoped `display` rule never beats [hidden] (TapRow chips, the hero link, the strip)', () => {
  // Astro scopes the page's `.pb [hidden]` and the card's `.pb-card [hidden]` to their own elements, so each
  // child component that sets `display` on something it hides carries its own guard.
  for (const [name, src] of [['TapRow', tapRow], ['NowHero', nowHero], ['ConditionsStrip', conditionsStrip]]) {
    assert.match(src, /\[hidden\] \{ display: none !important; \}/, `${name} guards [hidden]`);
  }
  assert.match(tapRow, /\.pb-tap__chips \{ display: flex;/, 'the rule the guard exists for');
  assert.match(nowHero, /\.pb-hero__link \{ display: inline-block;/);
});

test('client: Still true? answers every outcome — +N, already counted, expired, own report, a failed send', () => {
  assert.match(client, /btn\.setAttribute\('data-pressed', ''\)/, 'the tapped button shows pressed');
  assert.match(client, /for \(const b of buttons\) b\.disabled = true;/, 'and the pair is off while it sends');
  assert.match(client, /points > 0 \? `\+\$\{points\} · counted`/);
  assert.match(client, /repaint\(spotId, kind, toBoardReading\(json\.reading, kind\) \?\? reading\)/, 'the reading the endpoint returns is painted at once');
  assert.match(client, /res\.status === 409 \|\| reason === 'already-confirmed'/);
  assert.match(client, /'Already counted\.'/);
  assert.match(client, /res\.status === 410 \|\| reason === 'expired'/);
  assert.match(client, /reason === 'own-report'/);
  assert.match(client, /'Didn’t send\. Tap again\.'/);
  assert.match(courtCard, /data-pb-confirm-note/);
  assert.match(courtCard, /data-pb-reask=\{`\$\{spot\.id\}:wait`\}/, 'an expired wait reading shows Report instead of Still true');
});

test('client: Changed stays changed across polls, and the wait branch sends with keepalive before it navigates', () => {
  assert.match(client, /changedIds\.add\(rid\)/);
  assert.match(client, /const closed = !!rid && \(changedIds\.has\(rid\) \|\| ownIds\.has\(rid\) \|\| expiredIds\.has\(rid\)\)/);
  assert.match(client, /const offerConfirm = !!reading && !!rid && reading\.value !== 'cant' && !closed;/);
  assert.match(client, /verdict: 'changed', device, code \}, \{ keepalive: true \}\)/);
  assert.match(client, /keepalive: Boolean\(opts\.keepalive\)/);
});

test('client: a TapRow filed from away says so, and a phone with no code sees "no on-site code yet"', () => {
  assert.match(client, /res\.json\.report\?\.onsite === false/);
  assert.match(client, /'Filed from away · open your group link at the court to count\.'/);
  assert.match(client, /if \(res\.json\.report\?\.id\) ownIds\.add\(res\.json\.report\.id\)/, 'never asked "Still true?" about its own tap');
  assert.match(tapRow, /data-pb-tap-hint hidden>No on-site code yet/);
  assert.match(client, /const hasCode = storedCode\(spotId\) != null;/);
});

test('client: a board that never loads says so instead of "Checking the board…" forever', () => {
  assert.match(client, /if \(!loaded\) paintUnavailable\(\);/);
  assert.match(client, /Live board unavailable right now\. The schedules below are from the sources\./);
});

test('client: live now/next lines and the hero carry source, date and the "unconfirmed" tag; clocks read 12-hour', () => {
  assert.match(client, /import \{ STALE_DAYS, daysBetween, provenanceText \} from '\.\.\/lib\/court-format'/);
  const courtsImports = [...client.matchAll(/^import (.*) from '\.\.\/lib\/courts';$/gm)];
  assert.ok(courtsImports.length > 0);
  for (const [, what] of courtsImports) assert.match(what, /^type /, 'courts.ts (and its JSON) reaches the client only as types');
  assert.match(client, /if \(tag\) tag\.hidden = !blocks\.some\(\(b\) => b\.confidence === 'partial'\)/);
  assert.match(client, /prov\.textContent = best\.prov \? provLine\(best\.prov\)/);
  assert.match(page, /data-pb-sources=\{sourceLabels\}/);
  assert.match(courtCard, /data-pb-sched-prov/);
  assert.match(nowHero, /data-pb-hero-prov/);
  assert.doesNotMatch(client, /\blaStamp\b/, 'the masthead is "Mon 5:12 PM", not "MON 17:12"');
  assert.match(client, /`Last report \$\{clock12\(last\.observedAt\)\}: \$\{last\.label\}`/);
});

test('page: Private and paid runs every fact, hours line and link through the same tag rule as a card', () => {
  assert.match(page, /const facts = p\.facts\.map\(\(f\) => \(\{ f, \.\.\.sourcedTag\(f, buildDay\) \}\)\)\.filter\(\(x\) => x\.show\)/);
  assert.match(page, /tag === 'unconfirmed' && <b class="pb-tag">unconfirmed<\/b>/);
  assert.match(page, /Hours: \{hoursLine\(p\.hours\.rules\)\}/);
  assert.match(page, /const reserve = p\.reserve \? sourcedTag\(p\.reserve, buildDay\) : null/);
  assert.doesNotMatch(page, /f\.confidence !== 'unverified'\)\.map/, 'no bare unverified-only filter');
});

test('JSON-LD: schedules carry their time zone, and a closed court says it is closed', () => {
  assert.match(page, /scheduleTimezone: 'America\/Los_Angeles'/);
  assert.match(page, /if \(court\.status === 'closed'\) \{/);
  assert.match(page, /entity\.description = closure \? closure\.text : 'Closed'/);
});
