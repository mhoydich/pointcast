/** Runtime OG cards must follow the same Los Angeles date as the live room. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildKennelClubCollectionCard } from '../src/lib/og-kennel-card.mjs';
import { requestedKennelOgDate } from '../src/lib/og-kennel-today.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const series = JSON.parse(await read('src/data/kennel-club-september-sitting.json'));

test('the shared SVG builder highlights the supplied sitting, not a build date', () => {
  const hartley = series.sittings.find((sitting) => sitting.mintDate === '2026-09-02');
  const marguerite = series.sittings.find((sitting) => sitting.mintDate === '2026-09-03');

  const second = buildKennelClubCollectionCard({
    sittings: series.sittings,
    today: hartley,
    plateHref: 'data:image/png;base64,SECOND',
  });
  const third = buildKennelClubCollectionCard({
    sittings: series.sittings,
    today: marguerite,
    plateHref: 'data:image/png;base64,THIRD',
  });

  assert.match(second, /TODAY · 02 · HARTLEY/);
  assert.match(second, /data:image\/png;base64,SECOND/);
  assert.match(third, /TODAY · 03 · MARGUERITE/);
  assert.match(third, /data:image\/png;base64,THIRD/);
  assert.notEqual(second, third);
});

test('the runtime OG Function resolves a fake preview date before choosing its sitting', async () => {
  const functionSource = await read('functions/og/kennel-club/today.png.ts');
  assert.match(functionSource, /requestedKennelOgDate\(request, losAngelesDate\)/);
  assert.equal(
    requestedKennelOgDate(new Request('https://pointcast.xyz/og/kennel-club/today.png?date=2026-09-02'), () => '2026-09-03'),
    '2026-09-02',
  );
  assert.equal(
    requestedKennelOgDate(new Request('https://pointcast.xyz/og/kennel-club/today.png'), () => '2026-09-03'),
    '2026-09-03',
  );
});

test('today surfaces point to runtime PNGs and retain detached five-minute caches', async () => {
  const [kennel, collect, headers] = await Promise.all([
    read('src/pages/kennel-club.astro'),
    read('src/pages/collect.astro'),
    read('public/_headers'),
  ]);
  assert.match(kennel, /image="\/og\/kennel-club\/today\.png"/);
  assert.match(collect, /image="\/og\/collect\/today\.png"/);
  for (const route of ['/og/kennel-club/today.png', '/og/collect/today.png']) {
    const block = headers.split(`\n${route}\n`)[1];
    assert.ok(block, `${route} has a _headers block`);
    const lines = block.split('\n').slice(0, 2).map((line) => line.trim());
    assert.equal(lines[0], '! Cache-Control');
    assert.equal(lines[1], 'Cache-Control: public, max-age=300');
  }
});
