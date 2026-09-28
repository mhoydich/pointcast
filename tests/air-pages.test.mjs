import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Source contracts for the Field Reports pages and client (build spec §7),
// in the style of paddle-wear-api.test.mjs: the client is TypeScript, so the
// rules that smoke tests and other builders rely on are asserted in the text.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [client, spotPage, court, home, me, airSpot, ink, dial, spots] = await Promise.all([
  read('src/scripts/air-client.ts'),
  read('src/pages/r/[spot].astro'),
  read('src/pages/court.astro'),
  read('src/pages/r/index.astro'),
  read('src/pages/r/me.astro'),
  read('src/components/air/AirSpot.astro'),
  read('src/components/air/AirInk.astro'),
  read('src/components/air/AirDial.astro'),
  read('src/data/air-spots.json'),
]);
const config = JSON.parse(spots);

test('client: the five localStorage keys, every access wrapped in try/catch', () => {
  for (const key of ['pc_air_device', 'pc_air_code:', 'pc_air_queue', 'pc_air_seen_crew', 'pc_air_mute']) assert.match(client, new RegExp(`'${key.replace(':', '\\:')}'`), key);
  const raw = client.split('\n').filter((l) => /localStorage\.(getItem|setItem|removeItem)/.test(l));
  assert.equal(raw.length, 3, 'storage is touched only through the three helpers');
  for (const l of raw) assert.match(l, /try \{/, `wrapped: ${l.trim()}`);
  const session = client.split('\n').filter((l) => /sessionStorage\.(getItem|setItem)/.test(l));
  for (const l of session) assert.match(l, /try \{/, `wrapped: ${l.trim()}`);
});

test('client: root data-air-state values, events and timings from spec §7', () => {
  assert.match(client, /type State = 'idle' \| 'sending' \| 'stamped' \| 'queued' \| 'crew'/);
  for (const s of ['sending', 'stamped', 'queued', 'crew', 'idle']) assert.match(client, new RegExp(`setState\\('${s}'\\)`), s);
  for (const ev of ['air:tap', 'air:print', 'air:blip', 'air:needle', 'air:stamp', 'air:first-light', 'air:agree', 'air:crew']) assert.match(client, new RegExp(`emit\\('${ev}'`), ev);
  assert.match(client, /wait\(120\)/, 'blip, print and needle start at 120 ms');
  assert.match(client, /wait\(420\)/, 'the stamp waits for max(420 ms, server 2xx)');
  assert.match(client, /typeIn\(els\.receiptLine, line, 300\)/, 'the receipt prints over 300 ms');
  assert.match(client, /\}, 300\);\s*\n/, 'first light lands 300 ms after the stamp');
  assert.match(client, /RETRY_MS = \[1_000, 3_000, 9_000\]/);
  assert.match(client, /FAST_POLL_MS = 5_000/);
  assert.match(client, /SLOW_POLL_MS = 30_000/);
  assert.match(client, /FAST_FOR_MS = 30 \* 60_000/);
  assert.match(client, /QUEUE_MAX_AGE_MS = 15 \* 60_000/);
  assert.match(client, /CODE_TTL_MS = 12 \* 3_600_000/);
  assert.match(client, /visibilitychange/);
  assert.match(client, /'pc:shortwave:post'/);
  assert.match(client, /via [!=]== 'air'/);
});

// Review fixes 2026-09-28: the weak-signal queue, the strip-or-buttons rule, and the rest of the phone side.
test('client: a report is saved before it is sent, POSTs time out, and the queue resends on its own', () => {
  assert.match(client, /POST_TIMEOUT_MS = 4_000/);
  assert.match(client, /signal: timeoutSignal\(POST_TIMEOUT_MS\)/);
  const file = client.slice(client.indexOf('async function fileReport('));
  assert.ok(file.indexOf('enqueue(') < file.indexOf('postJson<ReportResult>'), 'queued before the first POST');
  assert.match(file, /dequeue\(observedAt\)/, 'a 2xx or 4xx takes it off the queue');
  assert.match(client, /window\.addEventListener\('online', \(\) => \{ void drain\(\); \}\)/);
  assert.match(client, /pollTimer = window\.setTimeout\(async \(\) => \{ void drain\(\);/, 'every poll tick resends');
  assert.match(client, /else \{ setClock\(\); void drain\(\);/, 'waking up resends');
  assert.match(client, /landQueued\(item, j\)/, 'a queued report that goes through lands its stamp');
});

test('client: the strip or the buttons, chips only on your report, sign-in only for an anonymous stamp', () => {
  assert.match(client, /if \(askable\) showAsk\(!offer\)/);
  assert.match(airSpot, /data-air-wait\n/, 'the buttons hold their place until the first reading');
  assert.match(airSpot, /\.air\[data-air-wait\] \.air__buttons \{ visibility: hidden; \}/);
  assert.match(client, /root\.removeAttribute\('data-air-wait'\)/);
  assert.match(client, /observedAt: myObservedAt/, 'detail chips re-send the report\'s own tap time');
  assert.match(client, /show\(els\.chips, what === 'report' && !!myValue\)/);
  assert.match(client, /show\(els\.signin, !!claim && onsite\)/);
  assert.match(airSpot, /data-air-signin hidden/);
  assert.match(client, /deadReports\.add\(r\.reportId\)/, 'an expired report is never offered again');
  assert.match(client, /memSeenCrew/, 'the crew reveal plays once even with storage blocked');
  assert.match(client, /schedule\(\); \/\/ fast polling starts at the tap/);
  assert.match(airSpot, /<noscript>/);
  assert.match(me, /<noscript>/);
  assert.doesNotMatch(me, /data-air-me-today>0</, 'no made-up zeros before the card loads');
});

test('client: haptics, sound, reduced motion and the mute toggle are guarded', () => {
  assert.match(client, /'vibrate' in navigator/);
  assert.match(client, /navigator\.vibrate\(\[30, 40, 30\]\)|buzz\(\[30, 40, 30\]\)/);
  assert.match(client, /buzz\(\[40, 60, 40, 60, 120\]\)/);
  assert.match(client, /prefers-reduced-motion: reduce/);
  assert.match(client, /playBlip/);
  assert.ok(/try \{[\s\S]{0,200}playBlip/.test(client), 'playBlip is called inside a try');
  assert.match(client, /isMuted\(\)/);
  assert.match(client, /\[261\.63, 329\.63, 392\.0\]/, 'C-E-G');
  assert.match(client, /setValueAtTime\(90, t\)/, 'the 90 Hz thump');
  assert.match(client, /confetti-overlay/);
  assert.match(client, /confetti-particle/);
});

test('client: the device id travels in bodies and the X-PC-Device header, never a query string', () => {
  assert.match(client, /'X-PC-Device': device/);
  assert.doesNotMatch(client, /[?&]device=/);
  assert.doesNotMatch(client, /pid_hash|ip_hash/);
  assert.match(client, /\/api\/air\/confirm/);
  assert.match(client, /\/api\/air\/claim/);
  assert.match(client, /getJson<AirIndex>\('\/api\/air'\)/);
});

test('spot page: getStaticPaths from the spots file, og:image is the per-spot card', () => {
  assert.match(spotPage, /export function getStaticPaths\(\)/);
  assert.match(spotPage, /airSpotPaths\(\)/);
  assert.match(spotPage, /image=\{spotOgUrl\(spot\.id\)\}/);
  assert.match(spotPage, /<AirSpot spot=\{spot\} \/>/);
});

test('/court renders the courts spot directly and points at /r/courts', () => {
  assert.match(court, /airSpot\('courts'\)/);
  assert.match(court, /aliasOf=\{canonical\}/);
  assert.match(court, /spotUrl\(spot\.id\)/);
  assert.match(court, /noindex/);
  assert.match(court, /image=\{spotOgUrl\(spot\.id\)\}/);
});

test('the spot screen: 72 px full-width buttons, a 40 px question, one added red, the copy line', () => {
  assert.match(airSpot, /min-height: 72px/);
  assert.match(airSpot, /width: 100%/);
  assert.match(airSpot, /font: 600 40px\/44px var\(--pc-font-sans\)/);
  assert.match(airSpot, /data-air-state="idle"/);
  assert.match(airSpot, /data-air-verdict="still">Yes</);
  assert.match(airSpot, /data-air-verdict="changed">Changed</);
  assert.match(airSpot, /data-air-value=\{o\.v\}/);
  assert.match(airSpot, /Reports are public\. Your location is not stored\. Reporters earn points, never cash\./);
  assert.match(airSpot, /href="\/auth\?returnTo=\/r\/me"/);
  assert.match(airSpot, /import \{ mountAir \} from '\.\.\/\.\.\/scripts\/air-client'/);
  assert.match(ink, /--air-live: #D42A1E/);
  assert.match(ink, /rotate\(-6deg\) scale\(1\.4\)/, 'the stamp slams from 1.4 at −6°');
  assert.match(ink, /cubic-bezier\(\.2, 1\.6, \.4, 1\)/);
  assert.match(ink, /<style is:global>/, 'JS-created stamps need global CSS');
  assert.match(ink, /\.confetti-overlay/);
  assert.match(dial, /data-air-needle/);
  assert.match(dial, /NET\.step/);
});

test('silence stays quiet: no surface ever says "0 reporters"', () => {
  for (const [name, src] of Object.entries({ client, spotPage, court, home, me, airSpot, ink })) assert.doesNotMatch(src, /0 reporters/, name);
  assert.match(client, /supportLabel = \(n: number\): string => \(n >= 2 \? `\$\{n\} agree` : n === 1 \? '1 reporter' : ''\)/);
});

test('band plan and card: live readings from GET /api/air, the card claims through /api/air/me + /api/air/claim', () => {
  assert.match(home, /data-air-home/);
  assert.match(home, /data-air-row=\{s\.id\}/);
  assert.match(home, /href="\/r\/me"/);
  assert.match(home, /data-air-call-text/);
  for (const s of config.spots) assert.doesNotMatch(home, new RegExp(`/r/${s.id}"`), 'spot links come from spotUrl(), not literals');
  assert.match(me, /data-air-card/);
  assert.match(me, /data-air-me-stamps/);
  assert.match(me, /data-air-me-streak/);
  assert.match(me, /href="\/auth\?returnTo=\/r\/me"/);
  assert.match(me, /noindex/);
  assert.match(client, /traitLine\(s\)/, 'every stamp on the card shows its trait line');
  for (const t of ['weekday', 'hour', 'crewSize', 'firstLight', 'deadAirHours', 'value']) assert.match(client, new RegExp(`t\\.${t}`), `trait ${t}`);
});
