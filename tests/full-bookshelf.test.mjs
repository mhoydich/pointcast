import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { fullBookshelf, bookshelfSummary, bookshelfContext, fullBookshelfMetadata } from '../src/data/full-bookshelf.ts';
import { readingMapWithCompanions } from '../src/data/reading-map.ts';
import { readingShelf } from '../src/data/reading-shelf.ts';
import { bookCompanions } from '../src/data/book-companions.ts';
import { buildFullBookshelf, checkedExternalUrl, eraForYear } from '../src/lib/full-bookshelf-model.mjs';
import { mountFullBookshelf, matchesFullBook } from '../src/lib/full-bookshelf-browser.mjs';

test('real shelf join preserves the 87 verified IDs, seven companions and separate curated doors', () => {
  const originals = readingMapWithCompanions(readingShelf);
  assert.equal(fullBookshelf.length, 87);
  assert.deepEqual(fullBookshelf.map(book => book.id), originals.map(book => book.id));
  assert.equal(bookshelfSummary.companions, 7);
  assert.equal(readingShelf.length, 20);
  for (const book of fullBookshelf) {
    assert.equal(book.bookUrl, `https://www.goodreads.com/book/show/${book.id}`);
    if (book.companion) assert.ok(readingShelf.some(door => door.id === book.companion.id && door.href === book.companion.href));
  }
  assert.equal(fullBookshelf.some(book => book.title === 'Atomic Habits'), false, 'a separately curated door is not silently imported into the snapshot');
});

test('public enrichment cannot expose unapproved personal RSS fields', () => {
  const originals = readingMapWithCompanions(readingShelf);
  assert.ok(originals.every(book => !('rating' in book) && !('review' in book)));
  assert.ok(fullBookshelf.every(book => !('rating' in book) && !('review' in book) && !('activity' in book)));
  assert.equal(bookshelfSummary.ratingsNotSupplied, 87);
});

test('partial publication coverage leaves unknown years visible and preserves original/edition distinctions', () => {
  assert.equal(eraForYear(undefined), 'unknown');
  assert.equal(eraForYear(2027), 'unknown');
  assert.equal(eraForYear(1883), 'before-1900');
  assert.equal(eraForYear(1922), '1900-1949');
  assert.equal(eraForYear(1998), '1950-1999');
  assert.equal(eraForYear(2003), '2000-onward');
  assert.ok(fullBookshelf.filter(book => book.era === 'unknown').length > 0);
  const kite = fullBookshelf.find(book => book.id === '77203');
  assert.equal(kite.publication.year, 2003);
  assert.ok(kite.signals.some(signal => signal.text.includes('2023')));
});

test('every reception claim and routed edition has inspectable evidence; quantities retain scope and date', () => {
  assert.equal(bookshelfSummary.sourceNotes, 12);
  const counts = [];
  for (const book of fullBookshelf) {
    for (const signal of book.signals) {
      assert.ok(signal.limit);
      for (const id of signal.sourceIds) assert.ok(book.sources.some(source => source.id === id && checkedExternalUrl(source.url)));
      if (signal.metric) { counts.push(signal); assert.ok(signal.asOf); assert.match(signal.metric.scope, /NYPL/); assert.equal(signal.metric.unit, 'checkouts'); assert.match(signal.limit, /current count/); }
    }
    if (book.routes.length) assert.ok(book.companion);
    book.routes.forEach(route => checkedExternalUrl(route.url));
  }
  assert.equal(counts.length, 2);
  assert.deepEqual(counts.map(signal => signal.metric.value).sort((a,b) => a-b), [231022, 284524]);
});

test('model rejects bad references, missing citations, unsupported years and unsafe external schemes', () => {
  const records = readingMapWithCompanions(readingShelf);
  assert.throws(() => checkedExternalUrl('javascript:alert(1)'), /Unsafe/);
  assert.throws(() => checkedExternalUrl('https://name:secret@example.org'), /Unsafe/);
  for (const mutate of [
    r => {r.books[0].id = 'missing'},
    r => {r.books.push(r.books[0])},
    r => {r.books[0].signals[0].sourceIds = ['missing']},
    r => {r.books[0].publication = {year:2027,sourceId:r.books[0].sources[0].id}},
    r => {r.angles[0].recordIds.push('missing')},
    r => {r.angles[0].sourceIds.push('missing')},
  ]) {
    const research = structuredClone(bookshelfContext); mutate(research);
    assert.throws(() => buildFullBookshelf(records, readingShelf, bookCompanions, research));
  }
});

test('literal word matching intersects theme, era, angle and coverage with accent folding', () => {
  const book = {search:'Siddhartha Hermann Hesse',theme:'language-attention',era:'1900-1949',angles:'systems',companion:'true',context:'false'};
  const all = {query:'',theme:'all',era:'all',angle:'all',scope:'all'};
  assert.equal(matchesFullBook(book,{...all,query:' hesse siddhartha ',era:'1900-1949',scope:'companions'}),true);
  for (const value of [{query:'[.*]'}, {theme:'memoir'}, {era:'unknown'}, {angle:'other'}, {scope:'context'}]) assert.equal(matchesFullBook(book,{...all,...value}),false);
  assert.equal(matchesFullBook({...book,search:'Édition Léa'},{...all,query:'edition lea'}),true);
});

const esc = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function fixture(url='https://pointcast.xyz/books/map/') {
  const options = values => values.map(value => `<option value="${value}">${value}</option>`).join('');
  const rows = fullBookshelf.map(book => `<li id="reading-${book.id}" data-full-record="${book.id}" data-full-search="${esc(book.title+' '+book.author)}" data-full-theme="${book.theme}" data-full-era="${book.era}" data-full-angles="${book.angleIds.join(' ')}" data-full-companion="${Boolean(book.companion)}" data-full-context="${Boolean(book.signals.length)}"><details><summary>${esc(book.title)}</summary><p>Source notes</p></details></li>`).join('');
  const dom = new JSDOM(`<main data-full-bookshelf><div data-full-controls hidden><input data-full-query/><select data-full-theme>${options(['all',...new Set(fullBookshelf.map(book=>book.theme))])}</select><select data-full-era>${options(['all',...new Set(fullBookshelf.map(book=>book.era))])}</select><select data-full-angle>${options(['all',...bookshelfContext.angles.map(angle=>angle.id)])}</select><select data-full-scope>${options(['all','companions','context'])}</select><button data-full-reset>Reset all</button></div><p data-full-status role="status" aria-live="polite"></p><ol>${rows}</ol><p data-full-empty hidden>Empty</p></main>`,{url});
  const root=dom.window.document.querySelector('[data-full-bookshelf]');
  const visible=()=>[...root.querySelectorAll('[data-full-record]')].filter(book=>!book.hidden);
  const select=(field,value)=>{const el=root.querySelector(`[data-full-${field}]`);el.value=value;el.dispatchEvent(new dom.window.Event(field==='query'?'input':'change'));return el;};
  return {dom,root,visible,select};
}

test('unenhanced HTML exposes all 87 native detail entries and hides filters', () => {
  const {dom,root,visible}=fixture();
  assert.equal(visible().length,87); assert.equal(root.querySelectorAll('details').length,87);
  assert.ok(root.querySelector('[data-full-controls]').hidden); dom.window.close();
});

test('combined filters announce empty results; reset restores titles and focus', () => {
  const {dom,root,visible,select}=fixture(); const dispose=mountFullBookshelf(root);
  assert.equal(mountFullBookshelf(root),dispose);
  select('query','Hesse'); assert.equal(visible().length,5);
  select('theme','place-identity'); assert.equal(visible().length,4);
  select('scope','companions'); assert.equal(visible().length,0);
  assert.equal(root.querySelector('[data-full-empty]').hidden,false);
  assert.match(root.querySelector('[data-full-status]').textContent,/0 of 87/);
  root.querySelector('[data-full-reset]').click(); assert.equal(visible().length,87);
  assert.equal(dom.window.document.activeElement,root.querySelector('[data-full-query]'));
  assert.equal(root.querySelector('[data-full-reset]').disabled,true);
  dispose(); dom.window.close();
});

test('deep links open their exact book and safely resolve conflicting or malformed filter state', () => {
  const f=fixture('https://pointcast.xyz/books/map/?shelf-theme=imagined-worlds#reading-52036');
  mountFullBookshelf(f.root); assert.ok(f.root.querySelector('#reading-52036 details').open); assert.equal(f.visible().length,87); mountFullBookshelf(f.root)(); f.dom.window.close();
  const malformed=fixture('https://pointcast.xyz/books/map/?shelf-theme=missing&shelf-era=missing#reading-missing');
  mountFullBookshelf(malformed.root); assert.equal(malformed.visible().length,87); mountFullBookshelf(malformed.root)(); malformed.dom.window.close();
});

test('filter-away clears a stale book hash so a saved URL restores the filtered view', () => {
  const f=fixture('https://pointcast.xyz/books/map/?unrelated=keep#reading-52036'); mountFullBookshelf(f.root);
  f.select('query','Tolkien'); assert.equal(f.visible().length,3); assert.equal(f.dom.window.location.hash,'');
  assert.equal(new URL(f.dom.window.location.href).searchParams.get('unrelated'),'keep');
  const restored=fixture(f.dom.window.location.href); mountFullBookshelf(restored.root); assert.equal(restored.visible().length,3);
  mountFullBookshelf(f.root)(); f.dom.window.close(); mountFullBookshelf(restored.root)(); restored.dom.window.close();
});

test('hash navigation reveals a filtered-out title and popstate restores filter controls', () => {
  const f=fixture(); mountFullBookshelf(f.root);f.select('query','Tolkien');
  f.dom.window.history.replaceState(null,'','#reading-5246');f.dom.window.dispatchEvent(new f.dom.window.HashChangeEvent('hashchange'));
  assert.equal(f.visible().length,87);assert.ok(f.root.querySelector('#reading-5246 details').open);
  f.dom.window.history.replaceState(null,'','?shelf-scope=companions');f.dom.window.dispatchEvent(new f.dom.window.PopStateEvent('popstate'));
  assert.equal(f.visible().length,7);assert.equal(f.root.querySelector('[data-full-scope]').value,'companions');mountFullBookshelf(f.root)(); f.dom.window.close();
});

// A public companion citation must never be confused with the private RSS source URL.
test('publication citations stay on known public companions and serialized metadata retains feed privacy', () => {
  const known = new Set(readingShelf.map(door => `${door.href}#sources`));
  const cited = fullBookshelf.filter(book => book.publication?.citationUrl);
  assert.ok(cited.length > 0, 'the existing companion publication fallback remains cited');
  for (const book of cited) {
    assert.equal(book.publication.citationUrl, `${book.companion.href}#sources`);
    assert.ok(known.has(book.publication.citationUrl));
    assert.match(book.publication.citationUrl, /^(?:\/books\/[a-z0-9-]+\/|\/siddhartha\/)#sources$/);
  }
  const serialized = JSON.stringify(fullBookshelfMetadata);
  for (const forbidden of ['user_rating', 'user_review', 'user_name', 'user_shelves', 'user_read_at', 'user_date_added', 'book_description', 'book_image_url', 'review/list_rss', '/review/list/', 'profileUrl', 'sourceUrl']) {
    assert.equal(serialized.includes(forbidden), false, `private feed field remains absent: ${forbidden}`);
  }
});
