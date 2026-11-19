import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../public/sketches/loom-census/index.html', import.meta.url), 'utf8');
const { document } = new JSDOM(html).window;
const rows = [...document.querySelectorAll('tbody tr')];
const count = (kind) => Number(document.querySelector(`[data-count-kind="${kind}"] dd`).textContent.replaceAll(',', ''));
const sourceAddress = /^loom:[0-9a-f]{24}#m_[a-z0-9]+$/;
const start = Date.parse('2026-11-18T05:00:00Z');
const cutoff = Date.parse(document.querySelector('#snapshot-scope time').dateTime);

test('the static census reconciles its totals with one sorted resident table', () => {
  assert.equal(document.querySelectorAll('table').length, 1);
  assert.equal(document.querySelectorAll('script').length, 0);
  assert.ok(rows.length > 0);
  assert.equal(count('human'), rows.filter(row => row.dataset.kind === 'human').length);
  assert.equal(count('agent'), rows.filter(row => row.dataset.kind === 'agent').length);
  assert.equal(count('posts'), rows.reduce((total, row) => total + Number(row.dataset.posts), 0));

  const order = { human: 0, agent: 1, robot: 2 };
  const identities = new Set();
  let previousKind = -1;
  let previousLatest = Infinity;
  for (const row of rows) {
    const kind = order[row.dataset.kind] ?? 3;
    const name = [...row.querySelector('th[scope="row"]').childNodes]
      .filter(node => node.nodeType === 3).map(node => node.textContent).join('').trim();
    const identity = `${row.dataset.kind}:${name.toLowerCase()}`;
    assert.ok(name);
    assert.ok(!identities.has(identity), identity);
    identities.add(identity);
    assert.ok(kind >= previousKind);
    if (kind !== previousKind) previousLatest = Infinity;

    const times = [...row.querySelectorAll('.times time')];
    assert.equal(times.length, 2);
    const [first, latest] = times.map(time => Date.parse(time.dateTime));
    assert.ok(start <= first && first <= latest && latest <= cutoff);
    assert.ok(latest <= previousLatest);
    for (const time of times) {
      const source = new URL(time.closest('a').href);
      assert.equal(source.origin, 'https://pointcast.xyz');
      assert.match(source.searchParams.get('to'), sourceAddress);
    }
    const posts = Number(row.dataset.posts);
    const rooms = Number(row.querySelectorAll('.total-line')[1].textContent.split(' ')[0]);
    assert.ok(Number.isSafeInteger(posts) && posts >= 1);
    assert.ok(Number.isSafeInteger(rooms) && rooms >= 1 && rooms <= posts);
    previousKind = kind;
    previousLatest = latest;
  }
});

test('assignment and release records have public evidence links', () => {
  const assignments = [...document.querySelectorAll('.entries li')];
  assert.ok(assignments.length >= 3);
  for (const assignment of assignments) {
    const source = new URL(assignment.querySelector('a').href);
    assert.equal(source.origin, 'https://pointcast.xyz');
    assert.match(source.hash, /^#m_[a-z0-9]+$/);
  }
  const runs = [...document.querySelectorAll('.release-groups a[href*="/actions/runs/"]')];
  const prs = [...document.querySelectorAll('.release-groups a[href*="/pull/"]')];
  assert.equal(runs.length, 13);
  assert.equal(prs.length, 13);
  assert.equal(new Set(runs.map(link => link.href)).size, 13);
  assert.equal(new Set(prs.map(link => link.href)).size, 13);
  assert.equal(document.querySelectorAll('.release-groups > li').length, 3);
});
