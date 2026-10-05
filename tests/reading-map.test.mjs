import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import feed from '../src/data/reading-feed.json' with { type: 'json' };
import { readingMapThemes, manuallyReviewedGroups, readingMapAssignments, readingMapRecords, readingMapPathsFor } from '../src/data/reading-map.ts';
import { buildReadingMapRecords, findReadingCompanion, makeThemeAssignments, matchesReadingRecord, mountReadingMap, readingCompanionMappings } from '../src/lib/reading-map-browser.mjs';

// The override supports staging-only checks against an existing dependency.
// In the project checkout the ordinary jsdom package resolves without it.
const { JSDOM } = await import(process.env.READING_MAP_JSDOM_PATH || 'jsdom');
const themeIds = ['power-money', 'imagined-worlds', 'place-identity', 'language-attention', 'memoir', 'ideas-systems', 'open-shelf'];
const shelf = readingCompanionMappings.map((mapping) => ({ id: mapping.shelfId, title: mapping.shelfTitles[0], author: mapping.author, href: mapping.href }));

test('87 unique RSS IDs are assigned exactly once to the complete editorial taxonomy', () => {
  assert.equal(feed.records.length, 87);
  assert.deepEqual(readingMapThemes.map((theme) => theme.id), themeIds);
  const assignedIds = Object.values(manuallyReviewedGroups).flat();
  assert.equal(assignedIds.length, 87);
  assert.equal(new Set(assignedIds).size, 87);
  assert.deepEqual(new Set(assignedIds), new Set(feed.records.map((record) => record.id)));
  assert.deepEqual(new Set(readingMapRecords.map((record) => record.id)), new Set(feed.records.map((record) => record.id)));
  for (const record of readingMapRecords) {
    assert.equal(record.theme, readingMapAssignments[record.id]);
    assert.ok(themeIds.includes(record.theme));
    assert.equal(record.bookUrl, `https://www.goodreads.com/book/show/${record.id}`);
  }
  for (let index = 1; index < readingMapRecords.length; index += 1) {
    assert.ok(readingMapRecords[index - 1].title.localeCompare(readingMapRecords[index].title, 'en', { sensitivity: 'base' }) <= 0);
  }
  assert.equal(readingMapRecords.filter((record) => record.theme === 'open-shelf').length, 3);
});

test('search intersects the selected theme and every literal title or author word', () => {
  assert.equal(matchesReadingRecord('The Kite Runner Khaled Hosseini', 'place-identity', '  KITE  Hosseini ', 'place-identity'), true);
  assert.equal(matchesReadingRecord('The Kite Runner Khaled Hosseini', 'place-identity', 'kite sanderson', 'all'), false);
  assert.equal(matchesReadingRecord('The Kite Runner Khaled Hosseini', 'place-identity', 'kite', 'imagined-worlds'), false);
  assert.equal(matchesReadingRecord('Édition Léa', 'open-shelf', 'edition lea', 'all'), true);
  assert.equal(matchesReadingRecord('Ender’s Game Orson Scott Card', 'imagined-worlds', "ender's card", 'all'), true);
  assert.equal(matchesReadingRecord('The Hobbit J.R.R. Tolkien', 'imagined-worlds', '[.*]', 'all'), false);
  assert.equal(matchesReadingRecord('The Hobbit J.R.R. Tolkien', 'imagined-worlds', '', 'all'), true);
});

test('companions require an explicit RSS ID, full title, author and real curated route', () => {
  const mapped = buildReadingMapRecords(feed.records, readingMapAssignments, shelf);
  assert.equal(mapped.filter((record) => record.companion).length, 7);
  assert.equal(buildReadingMapRecords(feed.records, readingMapAssignments, []).filter((record) => record.companion).length, 0);
  const mistborn = feed.records.find((record) => record.id === '68428');
  assert.equal(findReadingCompanion(mistborn, shelf)?.href, '/books/mistborn-the-final-empire/');
  assert.equal(findReadingCompanion({ ...mistborn, title: 'Mistborn: The Final Empire study guide' }, shelf), null);
  assert.equal(findReadingCompanion({ ...mistborn, author: 'Another author' }, shelf), null);
  assert.equal(findReadingCompanion({ ...mistborn, id: '68429' }, shelf), null);
  assert.equal(findReadingCompanion(feed.records.find((record) => record.id === '68429'), shelf), null);
  assert.equal(findReadingCompanion(mistborn, shelf.map((record) => ({ ...record, href: '/books/unpublished/' }))), null);
  assert.equal(findReadingCompanion(mistborn, shelf.map((record) => ({ ...record, author: 'Another author' }))), null);
});

test('public map output prunes private feed fields and rejects noncatalog URLs or duplicates', () => {
  const record = { ...feed.records[0], review: 'PRIVATE', rating: 5, activity: 'PRIVATE', description: 'PRIVATE', cover: 'PRIVATE', profile: 'PRIVATE' };
  const [publicRecord] = buildReadingMapRecords([record], readingMapAssignments);
  assert.deepEqual(Object.keys(publicRecord).sort(), ['author', 'bookUrl', 'companion', 'id', 'theme', 'title']);
  assert.equal(JSON.stringify(publicRecord).includes('PRIVATE'), false);
  assert.throws(() => buildReadingMapRecords([{ ...record, bookUrl: 'https://www.goodreads.com/review/list/account' }], readingMapAssignments), /Noncanonical/);
  assert.throws(() => buildReadingMapRecords([{ ...record, bookUrl: record.bookUrl + '?profile=private' }], readingMapAssignments), /Noncanonical/);
  assert.throws(() => buildReadingMapRecords([record, record], readingMapAssignments), /duplicate/);
  assert.throws(() => makeThemeAssignments({ first: ['1'], second: ['1'] }), /Duplicate/);
  assert.equal(buildReadingMapRecords([{ id: '999999999', title: 'An unknown title', author: 'An unknown author', bookUrl: 'https://www.goodreads.com/book/show/999999999' }], {})[0].theme, 'open-shelf');
});

test('three optional editorial paths preserve exact RSS records and use only catalog or curated doors', () => {
  const paths = readingMapPathsFor(readingMapRecords);
  assert.deepEqual(paths.map((path) => path.records.map((record) => record.id)), [
    ['5246', '77203', '52036'], ['375802', '234225', '68428'], ['48731', '68143', '8517215'],
  ]);
  for (const path of paths) {
    for (const record of path.records) {
      const source = feed.records.find((item) => item.id === record.id);
      assert.equal(record.title, source.title);
      assert.equal(record.author, source.author);
      assert.equal(record.href, source.bookUrl);
    }
  }
  const withCompanions = readingMapPathsFor(buildReadingMapRecords(feed.records, readingMapAssignments, shelf));
  assert.equal(withCompanions[0].records[0].href, '/books/ethan-frome/');
  assert.equal(withCompanions[1].records[0].href, 'https://www.goodreads.com/book/show/375802');
  assert.throws(() => readingMapPathsFor([]), /Missing editorial path record/);
});

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
function fixture() {
  const buttons = [{ id: 'all', label: 'All titles' }, ...readingMapThemes].map((theme) => `<button type="button" data-map-theme="${theme.id}" data-map-label="${escape(theme.label)}" aria-controls="reading-records" aria-pressed="${theme.id === 'all'}" hidden>${escape(theme.label)}</button>`).join('');
  const staticLabels = readingMapThemes.map((theme) => `<span data-map-static>${escape(theme.label)}</span>`).join('');
  const rows = readingMapRecords.map((record) => `<li data-map-record="${record.id}" data-map-search="${escape(record.title + ' ' + record.author)}" data-map-group="${record.theme}">${escape(record.title)} / ${escape(record.author)}</li>`).join('');
  const dom = new JSDOM(`<main data-reading-map>${buttons}${staticLabels}<div data-map-controls hidden><label for="search">Find a title or author</label><input id="search" type="search" data-map-search/><button type="button" data-map-reset disabled>Reset all</button></div><p data-map-status role="status" aria-live="polite">All 87 title records shown.</p><ol id="reading-records">${rows}</ol><p data-map-empty hidden>No title records match.</p></main>`, { url: 'https://pointcast.xyz/books/map/' });
  return { dom, root: dom.window.document.querySelector('[data-reading-map]') };
}

test('the no-JavaScript view exposes all 87 records and hides enhancement controls', () => {
  const { dom, root } = fixture();
  assert.equal([...root.querySelectorAll('[data-map-record]')].filter((row) => !row.hidden).length, 87);
  assert.equal(root.querySelector('[data-map-controls]').hidden, true);
  assert.ok([...root.querySelectorAll('[data-map-theme]')].every((button) => button.hidden));
  assert.ok([...root.querySelectorAll('[data-map-static]')].every((label) => !label.hidden));
  const source = readFileSync(new URL('../src/pages/books/map.astro', import.meta.url), 'utf8');
  const rowOpening = source.match(/<li\b[^>]*data-map-record[^>]*>/)?.[0];
  assert.ok(rowOpening, 'The real page renders the same record contract');
  assert.doesNotMatch(rowOpening, /\bhidden\b/, 'The real server template starts with all records visible');
  assert.match(source, /<div class="map-controls" data-map-controls hidden>/);
  assert.match(source, /aria-live="polite"/);
  dom.window.close();
});

test('DOM filters combine, announce empty results, and reset restores every record and input focus', () => {
  const { dom, root } = fixture();
  const dispose = mountReadingMap(root);
  assert.equal(mountReadingMap(root), dispose, 'Mounting twice does not duplicate handlers');
  const input = root.querySelector('[data-map-search]');
  const reset = root.querySelector('[data-map-reset]');
  const status = root.querySelector('[data-map-status]');
  const empty = root.querySelector('[data-map-empty]');
  const visible = () => [...root.querySelectorAll('[data-map-record]')].filter((row) => !row.hidden);
  assert.equal(root.querySelector('[data-map-controls]').hidden, false);
  assert.ok([...root.querySelectorAll('[data-map-theme]')].every((button) => !button.hidden));
  assert.equal(visible().length, 87);
  input.value = 'Hesse';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(visible().length, 5);
  root.querySelector('[data-map-theme="place-identity"]').click();
  assert.equal(visible().length, 4);
  assert.ok(visible().every((row) => row.dataset.mapGroup === 'place-identity'));
  root.querySelector('[data-map-theme="imagined-worlds"]').click();
  assert.equal(visible().length, 0);
  assert.equal(empty.hidden, false);
  assert.match(status.textContent, /^0 of 87 title records shown/);
  assert.equal(root.querySelectorAll('[data-map-theme][aria-pressed="true"]').length, 1);
  reset.click();
  assert.equal(visible().length, 87);
  assert.equal(input.value, '');
  assert.equal(empty.hidden, true);
  assert.equal(reset.disabled, true);
  assert.equal(dom.window.document.activeElement, input);
  assert.equal(root.querySelector('[data-map-theme="all"]').getAttribute('aria-pressed'), 'true');
  input.value = 'Tolkien';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(visible().length, 3);
  dispose();
  assert.equal(visible().length, 87);
  assert.equal(root.querySelector('[data-map-controls]').hidden, true);
  assert.ok([...root.querySelectorAll('[data-map-theme]')].every((button) => button.hidden));
  assert.ok([...root.querySelectorAll('[data-map-static]')].every((label) => !label.hidden));
  assert.equal(status.textContent, 'All 87 title records shown.');
  dom.window.close();
});
