import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const finance = JSON.parse(read('src/data/finance.json'));

test('finance room leads with principles and keeps the MN case dated', () => {
  assert.deepEqual(finance.order, ['principles', 'majors', 'crypto', 'alts', 'bots', 'portend']);
  assert.match(finance.disclaimer, /Not investment advice/);
  assert.match(finance.disclaimer, /Not an offer to sell securities/);
  assert.match(finance.disclaimer, /does not custody funds or place trades/);
  assert.equal(finance.author, 'cc');

  const mn = finance.alts.cases.find((item) => item.id === 'mn-corgi-mangos');
  assert.equal(mn.status, 'live');
  assert.equal(mn.ticker, 'MN');
  assert.equal(mn.snapshot.asOf, '2026-10-02');
  assert.equal(mn.snapshot.retrieved, '2026-10-05');
  assert.equal(mn.snapshot.sourceUrl, 'https://corgiinvest.com/mn');
  assert.ok(mn.links.some((link) => link.url.includes('sec.gov') && link.url.includes('2078265')));
  assert.equal(finance.alts.cases.filter((item) => item.status === 'placeholder').length, 2);
  assert.equal(finance.bots.swarmHook.status, 'expandable');
  assert.equal(JSON.stringify(finance).includes('"livePrice"'), false);
  assert.match(mn.nicoNote, /figure of record/);
  assert.match(mn.nicoNote, /around 5%/);
  assert.doesNotMatch(mn.nicoNote, /could not read/);
});

test('finance page renders the required order from the shared record', () => {
  const page = read('src/pages/finance.astro');
  const jsonRoute = read('src/pages/finance.json.ts');
  const positions = ['id="principles"', 'id="majors"', 'id="crypto"', 'id="alts"', 'id="bots"', 'id="portend"']
    .map((id) => page.indexOf(id));
  assert.ok(positions.every((index) => index > 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(page, /Not investment advice/);
  assert.match(jsonRoute, /finance\.json/);
  assert.match(page, /item\.id === 'mn-corgi-mangos'/);
  assert.match(page, /id=\{mn\.id\}/);
  assert.match(page, /id=\{slot\.id\}/);
});

test('finance is on the same discovery surfaces as peer doors', () => {
  const files = [
    read('src/data/agent-surfaces.ts'),
    read('src/pages/agents.json.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/for-agents.astro'),
    read('src/lib/pointcast-apps.ts'),
  ].join('\n');
  for (const url of [
    'https://pointcast.xyz/finance/',
    'https://pointcast.xyz/finance.json',
    '/finance/',
    '/finance.json',
  ]) {
    assert.ok(files.includes(url), `missing ${url}`);
  }
});

test('built finance twins agree when dist exists', {
  skip: !existsSync(new URL('dist/finance/index.html', root)),
}, () => {
  const html = read('dist/finance/index.html');
  const payload = JSON.parse(read('dist/finance.json'));
  assert.match(html, /First principles/);
  assert.match(html, /Corgi MANGOS ETF/);
  assert.match(html, /Not investment advice/);
  assert.equal(payload.order[0], 'principles');
  assert.equal(payload.alts.cases[0].snapshot.asOf, '2026-10-02');
  const agents = JSON.parse(read('dist/agents.json'));
  assert.equal(agents.endpoints.current.human.finance, 'https://pointcast.xyz/finance/');
  assert.equal(agents.endpoints.current.json.finance, 'https://pointcast.xyz/finance.json');
});
