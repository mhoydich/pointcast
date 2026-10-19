import assert from 'node:assert/strict';
import test from 'node:test';
import { makeProjectPanels, getPublishedProjects, groupPublishedProjects, isSafeProjectHref, isVerifiedPublishedProject, isPublicProjectSource, isUtcProjectTimestamp, publishedCatalog } from '../src/lib/home-published-projects.mjs';

function project(id = 'one', overrides = {}) {
  return {
    id, title: `Project ${id}`, href: `/${id}/`, group: 'Ideas', dek: 'An open project.', image: null,
    publishedAt: '2026-10-01T12:00:00Z',
    publication: { state: 'verified-live', commit: 'a'.repeat(40), canonical: `https://pointcast.xyz/${id}/`, immutable: 'https://abc12345.pointcast.pages.dev', verifiedAt: '2026-10-06T12:00:00Z', receipt: 'pointcast-release-20261006' },
    sources: [{ url: `https://pointcast.xyz/${id}/`, title: 'Published front door', checkedAt: '2026-10-06T12:00:00Z' }],
    imageRights: { status: 'not-used', source: null, license: null, checkedAt: null },
    ...overrides,
  };
}

test('only complete public live publication evidence is admitted', () => {
  const admitted = project();
  assert.equal(isVerifiedPublishedProject(admitted), true);
  const invalid = [
    project('one', { publication: { ...admitted.publication, state: 'pending' } }),
    project('one', { publication: null }),
    project('one', { id: undefined }),
    project('one', { id: 123 }),
    project('one', { publication: { ...admitted.publication, canonical: 'https://pointcast.xyz/wrong/' } }),
    project('one', { href: 'https://example.com' }),
    project('one', { href: '//example.com' }),
    project('one', { publishedAt: undefined }),
    project('one', { publishedAt: 'last week' }),
    project('one', { publishedAt: '2026-02-30T12:00:00Z' }),
    project('one', { sources: [] }),
    project('one', { sources: [{ url: 'http://example.com', title: 'Unsecured source', checkedAt: '2026-10-06' }] }),
    project('one', { imageRights: { status: 'unknown' } }),
    project('one', { image: '/images/cover.webp' }),
    project('one', { publication: { ...admitted.publication, receipt: '/Users/mike/receipt.json' } }),
    project('one', { publication: { ...admitted.publication, commit: 'abc123' } }),
    project('one', { publication: { ...admitted.publication, immutable: 'https://pointcast.xyz/' } }),
    project('one', { publication: { ...admitted.publication, immutable: 'https://abc12345.pointcast.pages.dev/one/' } }),
    project('one', { publication: { ...admitted.publication, immutable: 'https://main.pointcast.pages.dev' } }),
    project('one', { publishedAt: '2026-10-07T00:00:00Z' }),
  ];
  assert.ok(invalid.every((entry) => !isVerifiedPublishedProject(entry)));
  assert.deepEqual(getPublishedProjects([admitted, ...invalid]), [admitted]);
  assert.deepEqual(getPublishedProjects(null), []);
});

test('admission recognizes verified section anchors and documented published images', () => {
  const anchored = project('anchor', { href: '/essay/#chapter-one' });
  anchored.publication.canonical = 'https://pointcast.xyz/essay/#chapter-one';
  assert.equal(isVerifiedPublishedProject(anchored), true);
  const pictured = project('picture', { image: '/images/picture.webp', imageRights: { status: 'original', source: 'https://pointcast.xyz/images/picture.webp', license: 'Original PointCast artwork', checkedAt: '2026-10-06T12:00:00Z' } });
  assert.equal(isVerifiedPublishedProject(pictured), true);
  pictured.imageRights.status = 'existing-published-asset';
  pictured.imageRights.source = 'https://pointcast.xyz/images/picture.webp';
  assert.equal(isVerifiedPublishedProject(pictured), true);
  pictured.imageRights.license = null;
  assert.equal(isVerifiedPublishedProject(pictured), true, 'retained published assets do not acquire a guessed license');
  pictured.imageRights.license = '';
  assert.equal(isVerifiedPublishedProject(pictured), false);
  pictured.imageRights.status = 'original';
  pictured.imageRights.license = null;
  assert.equal(isVerifiedPublishedProject(pictured), false, 'new original assets require a rights declaration');
  for (const status of ['licensed', 'public-domain', 'permission-granted']) {
    pictured.imageRights.status = status;
    pictured.imageRights.license = 'Documented public rights evidence';
    assert.equal(isVerifiedPublishedProject(pictured), true, status);
    pictured.imageRights.license = null;
    assert.equal(isVerifiedPublishedProject(pictured), false, status);
  }
});

test('safe routes reject traversal, external schemes, encoded separators and queries', () => {
  for (const href of ['/ideas/', '/ideas/#section', '/ideas', '/r/desk', '/projects/desk/', '/cartography/home/', '/pickleball/home/']) assert.equal(isSafeProjectHref(href), true, href);
  for (const href of ['//example.com', 'https://example.com', 'javascript:alert(1)', '/x/../ideas/', '/%2e%2e/ideas', '/%2Fexample.com', '/ideas?redirect=evil', '/bad\\path', '/bad path', '/bad%0a', '/ideas//#more', '/ideas/#', '/ideas/#one#two', '/private/secret', '/.aws/config', '/%252e%252e/ideas', '/desk', '/desk/', '/desk/private']) assert.equal(isSafeProjectHref(href), false, href);
});

test('public output is whitelisted, stable, deduplicated and newest first', () => {
  const older = project('older');
  const newest = project('newest', { publishedAt: '2026-10-05T00:00:00Z', privateNotes: '/Users/mike/intake.md' });
  newest.publication.privateReceipt = '/Users/mike/http.json';
  newest.sources[0].internalPath = '/Users/mike/source.md';
  const tie = project('tie', { publishedAt: newest.publishedAt });
  const duplicateHref = project('alias', { href: '/older/' });
  duplicateHref.publication.canonical = 'https://pointcast.xyz/older/';
  const output = getPublishedProjects([older, newest, tie, newest, duplicateHref]);
  assert.deepEqual(output.map((entry) => entry.id), ['newest', 'tie', 'older']);
  assert.equal(JSON.stringify(output).includes('/Users/'), false);
  assert.equal('privateNotes' in output[0], false);
  assert.notEqual(output[0], newest);
  assert.equal(Object.isFrozen(output[0]), true);
  assert.equal(Object.isFrozen(output[0].publication), true);
  assert.equal(Object.isFrozen(output[0].sources[0]), true);
  assert.deepEqual(publishedCatalog([newest]).projects, [output[0]]);
  assert.equal(publishedCatalog([newest]).total, 1);
});

test('three-card topic panels cover every admitted project and wrap the final set', () => {
  for (const size of [0, 1, 2, 3, 4, 7, 110, 257]) {
    const entries = Array.from({ length: size }, (_, index) => project(`p${index}`));
    const panels = makeProjectPanels(entries, 3);
    assert.equal(panels.length, size === 0 ? 0 : Math.ceil(size / 3));
    assert.deepEqual([...new Set(panels.flat().map((entry) => entry.id))], entries.map((entry) => entry.id));
    assert.ok(panels.every((panel) => panel.length === Math.min(3, size)));
    assert.ok(panels.every((panel) => new Set(panel.map((entry) => entry.id)).size === panel.length));
    assert.deepEqual(panels.flat().slice(0, size), entries);
  }
});

test('topic round robin reaches small collections before exhausting a large profile collection', () => {
  const profiles = Array.from({ length: 110 }, (_, index) => project(`ai${index}`, { group: 'AI service profiles' }));
  const play = Array.from({ length: 5 }, (_, index) => project(`play${index}`, { group: 'Games' }));
  const reading = Array.from({ length: 7 }, (_, index) => project(`read${index}`, { group: 'Reading' }));
  const input = [...profiles, ...play, ...reading];
  const panels = makeProjectPanels(input, 3);
  assert.deepEqual(panels[0].map((entry) => entry.id), ['ai0', 'play0', 'read0']);
  assert.deepEqual(panels[1].map((entry) => entry.id), ['ai1', 'play1', 'read1']);
  const firstCycle = panels.flat().slice(0, input.length);
  assert.equal(new Set(firstCycle.map((entry) => entry.id)).size, input.length);
  for (const topic of ['AI service profiles', 'Games', 'Reading']) assert.deepEqual(firstCycle.filter((entry) => entry.group === topic), input.filter((entry) => entry.group === topic));
  assert.deepEqual(makeProjectPanels(input, 3), panels, 'the derived sequence is deterministic');
  assert.deepEqual(input, [...profiles, ...play, ...reading], 'derivation never changes the source catalog');
});

test('grouping preserves all projects and their publication order within areas', () => {
  const entries = [project('a'), project('b', { group: 'Play' }), project('c')];
  const groups = groupPublishedProjects(entries);
  assert.deepEqual(groups.map((group) => group.name), ['Ideas', 'Play']);
  assert.deepEqual(groups[0].entries.map((entry) => entry.id), ['a', 'c']);
  assert.equal(groups.flatMap((group) => group.entries).length, entries.length);
});

test('unknown original publication dates stay null and never become live-check dates', () => {
  const unknown = project('old-room', { publishedAt: null });
  const anotherUnknown = project('another-room', { publishedAt: null });
  assert.equal(isVerifiedPublishedProject(unknown), true);
  const output = getPublishedProjects([unknown, project('new-room'), anotherUnknown]);
  assert.deepEqual(output.map((entry) => entry.id), ['new-room', 'old-room', 'another-room']);
  assert.equal(output[1].publishedAt, null);
  assert.equal(output[1].publication.verifiedAt, '2026-10-06T12:00:00Z');
});

test('public metadata rejects private hosts, Library tracking and credential parameters', () => {
  for (const value of ['https://example.org/study', 'https://example.org/api/study', 'https://en.wikipedia.org/wiki/Sound', 'https://github.com/team/repo/pull/1399', 'https://github.com/team/repo/home/README.md', 'https://pointcast.xyz/cartography/home/', 'https://pointcast.xyz/pickleball/home/']) assert.equal(isPublicProjectSource(value), true, value);
  for (const value of ['https://localhost/private/report', 'https://127.0.0.1/report', 'https://10.0.0.8/report', 'https://[::1]/report', 'https://intranet/report', 'https://home.internal/report', 'https://example.org:8080/report', 'https://user:password@example.org/report', 'https://chatgpt.com/library/private-id', 'https://chatgpt.com/c/private-id', 'https://pointcast.xyz/private/report', 'https://pointcast.xyz/.aws/config', 'https://pointcast.xyz/desk/', 'https://example.org/study?api_key=secret', 'https://example.org/study?utm_source=private', 'https://example.org/study#access_token=secret']) {
    assert.equal(isPublicProjectSource(value), false, value);
    const invalid = project();
    invalid.sources[0].url = value;
    assert.equal(isVerifiedPublishedProject(invalid), false, value);
  }
  const privateReceipt = project();
  privateReceipt.publication.receipt = 'https://example.org/receipt?token=secret';
  assert.equal(isVerifiedPublishedProject(privateReceipt), false);
  const privateRights = project('image', { image: '/images/picture.webp', imageRights: { status: 'licensed', source: 'https://127.0.0.1/report', license: 'Permission evidence', checkedAt: '2026-10-06T12:00:00Z' } });
  assert.equal(isVerifiedPublishedProject(privateRights), false);
  for (const value of ['/Users/mike/.aws/credentials', 'Saved in /home/user/report.md', 'See "/Users/mike/report.md"', 'Path=`/Users/mike/report.md`', 'Read file:///private/report', 'Internal library://tracking-id', 'Saved in ~/Documents/report.md', 'https://chatgpt.com/library/private-id']) {
    const privateProse = project();
    privateProse.dek = value;
    assert.equal(isVerifiedPublishedProject(privateProse), false, value);
  }
});

test('evidence times must be actual UTC timestamps and cannot postdate verification', () => {
  for (const value of ['2026-10-06T12:00:00Z', '2026-10-06T12:00:00.123456+00:00']) assert.equal(isUtcProjectTimestamp(value), true, value);
  for (const value of ['2026-10-06', '2026-10-06T24:00:00Z', '2026-02-30T12:00:00Z', '2026-10-06T12:00:00+01:00', 'last Tuesday']) {
    assert.equal(isUtcProjectTimestamp(value), false, value);
    const invalid = project();
    invalid.publication.verifiedAt = value;
    assert.equal(isVerifiedPublishedProject(invalid), false, value);
  }
  const futureSource = project();
  futureSource.sources[0].checkedAt = '2026-10-07T12:00:00Z';
  assert.equal(isVerifiedPublishedProject(futureSource), false);
  futureSource.publication.verifiedAt = '2026-10-06T12:00:00.000001Z';
  futureSource.sources[0].checkedAt = '2026-10-06T12:00:00.000002Z';
  assert.equal(isVerifiedPublishedProject(futureSource), false, 'microsecond precision is preserved when comparing proof times');
});
