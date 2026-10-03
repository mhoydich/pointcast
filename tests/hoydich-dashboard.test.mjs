import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { DASHBOARD_ROWS, DASHBOARD_SNAPSHOT, PROPOSALS, CHAIN_PANELS, dashboardPayload } from '../src/data/hoydich-dashboard.mjs';
import { initDashboard } from '../src/scripts/hoydich-dashboard.mjs';

function fixture() {
  const dom = new JSDOM(`<section data-hoydich-dashboard>
    <div data-dashboard-controls hidden><label>Find a project<input data-dashboard-search type="search"></label>
      ${['focus','all','open','building','ready','native'].map(value => `<button data-dashboard-filter="${value}" aria-pressed="false">${value}</button>`).join('')}
      <button data-dashboard-filter="ready" aria-pressed="false">Ready count</button><button data-dashboard-reset>Reset</button>
    </div><p data-dashboard-result role="status"></p>
    ${[
      ['live-focus','open',true,'FILA coast'], ['live-other','open',false,'weather atlas'],
      ['draft','building',true,'puzzle studio'], ['review','ready',true,'mh identity'], ['native','native',false,'Good Fortune'],
    ].map(([id,status,focus,search]) => `<article id="${id}" data-dashboard-row data-status="${status}" data-focus="${focus}" data-search="${search}">${search}</article>`).join('')}
    <p data-dashboard-empty hidden>No matching projects.</p></section>`);
  const root = dom.window.document.querySelector('section');
  initDashboard(root);
  return { root, dom, rows: () => [...root.querySelectorAll('[data-dashboard-row]')].filter(row => !row.hidden).map(row => row.id),
    filter: value => root.querySelector(`[data-dashboard-filter="${value}"]`).click(),
    search: value => { const input = root.querySelector('[data-dashboard-search]'); input.value = value; input.dispatchEvent(new dom.window.Event('input')); } };
}

test('focus starts compact while a search can find projects beyond the focus set', () => {
  const f = fixture();
  assert.equal(f.root.querySelector('[data-dashboard-controls]').hidden, false);
  assert.deepEqual(f.rows(), ['live-focus','draft','review']);
  f.search('weather');
  assert.deepEqual(f.rows(), ['live-other']);
  f.search('');
  assert.deepEqual(f.rows(), ['live-focus','draft','review']);
});

test('status and search combine, empty results are announced, and all matching count buttons synchronize', () => {
  const f = fixture();
  f.filter('ready');
  assert.deepEqual(f.rows(), ['review']);
  for (const button of f.root.querySelectorAll('[data-dashboard-filter="ready"]')) assert.equal(button.getAttribute('aria-pressed'), 'true');
  f.search('weather');
  assert.deepEqual(f.rows(), []);
  assert.equal(f.root.querySelector('[data-dashboard-empty]').hidden, false);
  assert.match(f.root.querySelector('[data-dashboard-result]').textContent, /0|No/i);
  f.root.querySelector('[data-dashboard-reset]').click();
  assert.equal(f.root.querySelector('[data-dashboard-search]').value, '');
  assert.deepEqual(f.rows(), ['live-focus','draft','review']);
  assert.equal(f.root.querySelector('[data-dashboard-empty]').hidden, true);
});

test('all stages include native work and repeated initialization does not reset a chosen view', () => {
  const f = fixture();
  f.filter('native');
  assert.deepEqual(f.rows(), ['native']);
  initDashboard(f.root);
  assert.deepEqual(f.rows(), ['native']);
  f.filter('all');
  assert.equal(f.rows().length, 5);
});

test('only verified open project groups have a destination; prepared and native editions stay distinct', () => {
  assert.ok(Number.isFinite(Date.parse(DASHBOARD_SNAPSHOT.capturedAt)));
  assert.match(DASHBOARD_SNAPSHOT.sourceRevision, /^[a-f0-9]{40}$/);
  assert.equal(new Set(DASHBOARD_ROWS.map(row => row.id)).size, DASHBOARD_ROWS.length);
  for (const row of DASHBOARD_ROWS) {
    assert.ok(['open','building','ready','native'].includes(row.status));
    assert.ok(row.summary.length > 20);
    assert.ok(row.nextAction.length > 20);
    if (row.status === 'open') { assert.ok(row.href); assert.ok(row.source?.href); }
    else assert.equal('href' in row, false, `${row.id} is not a live destination`);
  }
  assert.ok(DASHBOARD_ROWS.some(row => row.status === 'ready'));
  assert.ok(DASHBOARD_ROWS.some(row => row.status === 'building'));
  assert.ok(DASHBOARD_ROWS.some(row => row.status === 'native'));
  assert.doesNotMatch(JSON.stringify(dashboardPayload()), /linear\.app|percentComplete|completionPercent|privateKey|seedPhrase|client confidential/i);
});

test('the ten ideas remain proposals and the selected next projects match Michael’s choices', () => {
  assert.equal(PROPOSALS.length, 10);
  assert.equal(new Set(PROPOSALS.map(idea => idea.id)).size, 10);
  assert.deepEqual(PROPOSALS.filter(idea => idea.selected).map(idea => idea.title), ['Chain Observatory','Neighborhood Signals','2027 Futures Room']);
  for (const idea of PROPOSALS) {
    assert.equal('href' in idea, false);
    assert.equal('startedAt' in idea, false);
    assert.ok(idea.firstEdition.length > 30);
    assert.ok(idea.nextAction.length > 30);
    assert.ok(idea.reuse.length > 0);
  }
});

test('blockchain panels separate runtime quotes, mint restrictions and the recorded dev chain without chain actions', () => {
  assert.equal(CHAIN_PANELS.length, 4);
  for (const panel of CHAIN_PANELS) {
    assert.ok(panel.sources.length > 0);
    assert.ok(Number.isFinite(Date.parse(panel.checkedAt)));
  }
  const text = CHAIN_PANELS.map(panel => panel.summary).join(' ');
  assert.match(text, /Tezos/);
  assert.match(text, /Etherlink/);
  assert.match(text, /settlement.*not|not.*settlement|settlement.*untested/i);
  assert.match(text, /disabled|nothing.*mint/i);
  assert.match(text, /dev|recorded/i);
  assert.match(text, /no public|not.*public network/i);
  const client = readFileSync(new URL('../src/scripts/hoydich-dashboard.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(client, /fetch\(|XMLHttpRequest|setInterval|sendTransaction|requestPermissions|signPayload|walletConnect|Payment-Signature/);
});
