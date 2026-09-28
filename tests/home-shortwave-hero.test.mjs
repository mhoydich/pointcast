import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Shortwave is the front door above the fold, ahead of the drop deck', async () => {
  const [home, hero, welcome] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeShortwaveHero.astro'),
    read('src/components/HomeWelcome.astro'),
  ]);
  assert.match(home, /import HomeShortwaveHero/);
  const masthead = home.indexOf('</header>');
  const heroAt = home.indexOf('<HomeShortwaveHero />');
  assert.ok(masthead > 0 && heroAt > masthead, 'hero sits right under the masthead');
  assert.ok(heroAt < home.indexOf('<HomeV2SignalDeck'), 'hero comes before the drop deck');
  assert.equal((hero.match(/<h1\b/g) ?? []).length, 1);
  assert.doesNotMatch(welcome, /HomeShortwaveLive/, 'one receiver on the page, not two');
});

test('the hero reads and says through the existing Shortwave paths, text-only', async () => {
  const hero = await read('src/components/HomeShortwaveHero.astro');
  assert.match(hero, /fetch\('\/api\/shortwave\?limit=12'/);
  assert.match(hero, /pc:shortwave:post/);
  assert.match(hero, /pc:shortwave:say/);
  assert.match(hero, /data-pc-ref="fb-omni-form"/);
  assert.match(hero, /\/api\/presence\/snapshot/);
  assert.match(hero, /maxlength="280"/);
  assert.doesNotMatch(hero, /innerHTML/, 'visitor text never goes in as HTML');
  assert.match(hero, /from '\.\.\/lib\/band'/, 'the dial is the same band /band uses');
  assert.match(hero, /netState\(\)/);
  for (const href of ['/shortwave', '/band', '/connect', '#new']) assert.ok(hero.includes(`href="${href}`), href);
  assert.match(hero, /astro:before-swap/);
  assert.match(hero, /prefers-reduced-motion: reduce/);
});

// Field Reports 2026-09-28: station posts park at their spot's frequency, and Court Call has a marker and a line.
test('station posts park at their spot frequency, outside the Net exclusion', async () => {
  const { COURT_CALL, NET, mhzToStep, postStep } = await import('../src/lib/band.ts');
  const spots = JSON.parse(await read('src/data/air-spots.json')).spots;
  assert.equal(postStep({ id: 'sw-anything', mhz: 7.5 }), 180);
  assert.equal(postStep({ id: 'sw-anything', mhz: 6.1 }), 124);
  for (const spot of spots) {
    const step = mhzToStep(spot.mhz);
    assert.ok(Math.abs(step - NET.step) >= 4, `${spot.id} at ${spot.mhz} sits inside the Net exclusion`);
    assert.equal(postStep({ id: `station-${spot.id}`, mhz: spot.mhz }), step, `${spot.id} is not shifted off its frequency`);
  }
  // Posts without mhz keep the hash rule: same step every time, never on the Net.
  for (let i = 0; i < 500; i++) {
    const id = `sw-${i}`;
    assert.equal(postStep({ id }), postStep({ id, mhz: null }));
    assert.ok(Math.abs(postStep({ id }) - NET.step) >= 4, id);
  }
  const courts = spots.find((s) => s.id === 'courts');
  assert.equal(mhzToStep(courts.mhz), COURT_CALL.step, 'COURT_CALL.step mirrors the courts frequency');
  assert.equal(courts.courtCall.weekday, COURT_CALL.weekday);
  const [h, m] = courts.courtCall.time.split(':').map(Number);
  assert.equal(h * 60 + m, COURT_CALL.minute);

  const hero = await read('src/components/HomeShortwaveHero.astro');
  assert.match(hero, /const stepOf = \(p: Post\) => postStep\(p\)/);
  assert.doesNotMatch(hero, /stepOf\((p\.id|id|a\.id|b\.id)\)/, 'every call site passes the post');
  assert.match(hero, /p\.via === 'air' \? 'the field'/);
});

test('Court Call runs Friday 7:30–8:30 AM in El Segundo, across DST', async () => {
  const { courtCallState, courtCallTime } = await import('../src/lib/band.ts');
  const at = (iso) => courtCallState(new Date(iso));
  assert.equal(courtCallTime(), 'Fri 7:30 AM');
  assert.deepEqual(at('2026-10-02T04:00:00Z'), { live: false, minutesUntil: 630, minutesLeft: 0 }); // Thu 9:00 PM PDT
  assert.deepEqual(at('2026-10-02T14:29:00Z'), { live: false, minutesUntil: 1, minutesLeft: 0 });
  assert.deepEqual(at('2026-10-02T14:30:00Z'), { live: true, minutesUntil: 0, minutesLeft: 60 });
  assert.deepEqual(at('2026-10-02T15:29:00Z'), { live: true, minutesUntil: 0, minutesLeft: 1 });
  assert.deepEqual(at('2026-10-02T15:30:00Z'), { live: false, minutesUntil: 7 * 1440 - 60, minutesLeft: 0 });
  assert.deepEqual(at('2026-10-04T07:00:00Z'), { live: false, minutesUntil: 5 * 1440 + 450, minutesLeft: 0 }); // Sun midnight PDT
  assert.deepEqual(at('2026-11-06T15:30:00Z'), { live: true, minutesUntil: 0, minutesLeft: 60 }); // Fri 7:30 AM PST
  assert.equal(at('2026-11-06T14:30:00Z').live, false);
});

test('the dial marks COURT at 7.500 and the foot links Court Call to /r/courts', async () => {
  const [hero, client] = await Promise.all([read('src/components/HomeShortwaveHero.astro'), read('src/lib/shortwave-client.ts')]);
  assert.match(hero, /<span class="swh__court" data-swh-court-mark style=\{`left:\$\{pct\(Number\(courtMhz\)\)\}%`\}[^>]*>COURT<\/span>/);
  assert.match(hero, /const courtMhz = formatMhz\(COURT_CALL\.step\)/);
  assert.match(hero, /<a href="\/r\/courts" data-swh-court>/);
  assert.match(hero, /Court Call · \{courtWhen\} on \{courtMhz\}/);
  assert.match(hero, /courtCallState\(\)/);
  assert.ok(hero.indexOf('data-swh-net>') < hero.indexOf('data-swh-court>'), 'the Court Call line sits under the Net line');
  // The static blip moved to the shared client so /r plays the same sound.
  assert.match(client, /export function playBlip\(audio: AudioContext \| null = null\): AudioContext \| null/);
  assert.match(client, /bp\.type = 'bandpass'/);
  assert.match(hero, /import \{[^}]*\bplayBlip\b[^}]*\} from '\.\.\/lib\/shortwave-client'/);
  assert.match(hero, /audio = playBlip\(audio\)/);
  assert.doesNotMatch(hero, /createBiquadFilter/, 'one copy of the blip');
});
