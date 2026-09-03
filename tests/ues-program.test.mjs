import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('University of El Segundo publishes eight launch courses and balanced planning totals', async () => {
  const source = await read('../src/lib/ues-program.ts');
  assert.equal(source.match(/code: 'UES-\d{3}'/g)?.length, 8);
  assert.match(source, /totalUsd: 30_500/);
  assert.match(source, /totalUsd: 29_000/);
  assert.match(source, /totalUsd: 37_500/);
  assert.match(source, /amountUsd: 46_600, name: 'Full active term'/);
  assert.match(source, /amountUsd: 363_600, name: 'Five-city fellowship'/);
  assert.match(source, /UES_ACTIVE_ONLINE_BASE_USD = UES_SEASON_ONE_BUDGET\.totalUsd/);
  assert.match(source, /UES_ACTIVE_LOCAL_BASE_USD = UES_ACTIVE_ONLINE_BASE_USD/);
  assert.match(source, /totalUsd: UES_ACTIVE_LOCAL_BASE_USD \+ \(25 \* SATELLITE_SEED_BUDGET\.totalUsd\) \+ 210_000/);
});

test('UES contribution flow stays explicit, lazy, and Mainnet-acknowledged', async () => {
  const [page, fund] = await Promise.all([
    read('../src/pages/university-of-el-segundo.astro'),
    read('../src/lib/ues-fund.ts'),
  ]);
  assert.match(page, /import\('\.\.\/lib\/ues-fund'\)/);
  assert.doesNotMatch(page, /import \{[^}]+\} from '\.\.\/lib\/ues-fund'/);
  assert.match(page, /CURRENTLY NOT TAX-DEDUCTIBLE/);
  assert.match(page, /id="ues-fund-consent"/);
  assert.match(page, /id="ues-contribute" type="button" disabled/);
  assert.match(fund, /to: UES_FUND_WALLET/);
  assert.match(fund, /operation\.confirmation\(1\)/);
});

test('School navigation opens distinct makers and preserves a visible modal exit', async () => {
  const page = await read('../src/pages/el-segundo-school.astro');
  assert.match(page, /href="\?make=postcard"/);
  assert.match(page, /href="\?make=stamp"/);
  assert.match(page, /id="maker-close"[^>]+>← Back to gallery</);
  assert.match(page, /\.ess,\.maker \{ --blue:/);
  assert.match(page, /list\.slice\(0, 48\)/);
});

test('Global navigation affordances remain clickable and clear of the initial cursor', async () => {
  const [footer, cursor] = await Promise.all([
    read('../src/components/FooterBar.astro'),
    Promise.all([
      read('../src/components/CursorRoom.astro'),
      read('../src/scripts/chrome/cursor-room.ts'),
    ]).then((parts) => parts.join('\n')),
  ]);
  assert.match(footer, /\.fb__menu-close \{[\s\S]*?z-index: 100/);
  assert.match(cursor, /state\.hasMouse && !window\.matchMedia/);
  assert.match(cursor, /@media \(hover: none\), \(pointer: coarse\)/);
});
