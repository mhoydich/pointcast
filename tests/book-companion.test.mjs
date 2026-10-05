import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountBookCompanion, buildBookStructuredData } from '../src/lib/book-companion.mjs';

const fixture = () => new JSDOM(`<article data-book-companion>
  <p id="main-reading">The main introduction remains readable.</p>
  <div data-copy-filters hidden>${['all', 'new', 'used', 'borrow', 'online'].map((kind) => `<button data-copy-filter="${kind}" aria-pressed="${kind === 'all'}">${kind}</button>`).join('')}</div>
  <p data-copy-status role="status" aria-live="polite">All 3 reading routes shown.</p>
  <article id="print-copy" data-copy-card data-copy-kinds="new used borrow"><div data-route-kind="new">New print link</div><div data-route-kind="used">Used print link</div><div data-route-kind="borrow">Library print link</div></article>
  <article id="digital-copy" data-copy-card data-copy-kinds="new borrow"><div data-route-kind="new">New digital link</div><div data-route-kind="borrow">Library ebook link</div></article>
  <article id="online-copy" data-copy-card data-copy-kinds="online">A lawful online route with jurisdiction stated.</article>
  <div data-lens-controls hidden><button data-lens-choice="place" aria-pressed="true">Place</button><button data-lens-choice="voice" aria-pressed="false">Voice</button></div>
  <div data-lens-panel hidden><h3 data-active-lens-title></h3><p data-active-lens-prompt></p></div>
  <p data-lens-status role="status" aria-live="polite"></p>
  <div data-lens-list><article data-reading-lens="place"><h3 data-lens-title>Notice the place</h3><p data-lens-prompt>What does the setting ask of the reader?</p></article><article data-reading-lens="voice"><h3 data-lens-title>Listen to the voice</h3><p data-lens-prompt>Whose perspective shapes what you know?</p></article></div>
  <details><summary>Optional discussion spoilers</summary><p>The deeper guide.</p></details>
</article>`);
const click = (document, selector) => document.querySelector(selector).click();

test('without enhancement, all copy routes and all original reading prompts are readable', () => {
  const { document } = fixture().window;
  assert.equal(document.querySelectorAll('[data-copy-card][hidden]').length, 0);
  assert.equal(document.querySelector('[data-lens-list]').hidden, false);
  assert.equal(document.querySelector('[data-copy-filters]').hidden, true);
  assert.equal(document.querySelector('[data-lens-controls]').hidden, true);
  assert.equal(document.querySelector('details').open, false);
});

test('edition filters reveal only matching cards and their matching routes, with live counts and pressed state', () => {
  const { document } = fixture().window;
  const root = document.querySelector('[data-book-companion]');
  mountBookCompanion(root);
  assert.equal(document.querySelector('[data-copy-filters]').hidden, false);
  click(document, '[data-copy-filter="used"]');
  assert.equal(document.querySelector('#print-copy').hidden, false);
  assert.equal(document.querySelector('#digital-copy').hidden, true);
  assert.equal(document.querySelector('#online-copy').hidden, true);
  assert.equal(document.querySelector('#print-copy [data-route-kind="new"]').hidden, true);
  assert.equal(document.querySelector('#print-copy [data-route-kind="used"]').hidden, false);
  assert.equal(document.querySelector('[data-copy-status]').textContent, '1 used route shown.');
  assert.equal(document.querySelector('[data-copy-filter="used"]').getAttribute('aria-pressed'), 'true');
  assert.equal(document.querySelector('[data-copy-filter="all"]').getAttribute('aria-pressed'), 'false');
  click(document, '[data-copy-filter="borrow"]');
  assert.equal(document.querySelector('[data-copy-status]').textContent, '2 borrow routes shown.');
  assert.equal(document.querySelector('#digital-copy [data-route-kind="borrow"]').hidden, false);
  assert.equal(document.querySelector('#digital-copy [data-route-kind="new"]').hidden, true);
  click(document, '[data-copy-filter="online"]');
  assert.equal(document.querySelector('#online-copy').hidden, false);
  assert.equal(document.querySelector('#print-copy').hidden, true);
  click(document, '[data-copy-filter="new"]');
  assert.equal(document.querySelector('[data-copy-status]').textContent, '2 new routes shown.');
  assert.equal(document.querySelector('#print-copy').hidden, false);
  assert.equal(document.querySelector('#digital-copy').hidden, false);
  assert.equal(document.querySelector('#online-copy').hidden, true);
  assert.equal(document.querySelector('#print-copy [data-route-kind="new"]').hidden, false);
  assert.equal(document.querySelector('#print-copy [data-route-kind="borrow"]').hidden, true);
  click(document, '[data-copy-filter="all"]');
  assert.equal(document.querySelectorAll('[data-copy-card][hidden]').length, 0);
  assert.equal(document.querySelectorAll('[data-route-kind][hidden]').length, 0);
});

test('an empty filter announces zero results and can recover without losing focus or opening spoilers', () => {
  const { document } = fixture().window;
  document.querySelector('#online-copy').remove();
  mountBookCompanion(document.querySelector('[data-book-companion]'));
  const onlineButton = document.querySelector('[data-copy-filter="online"]');
  onlineButton.focus();
  onlineButton.click();
  assert.equal(document.querySelector('[data-copy-status]').textContent, '0 online routes shown.');
  assert.equal(document.activeElement, onlineButton);
  assert.equal(document.querySelector('details').open, false);
  click(document, '[data-copy-filter="all"]');
  assert.equal(document.querySelectorAll('[data-copy-card][hidden]').length, 0);
});

test('reading-lens choice changes only its prompt, announces it, and retains the main reading and closed spoilers', () => {
  const { document } = fixture().window;
  const root = document.querySelector('[data-book-companion]');
  const dispose = mountBookCompanion(root);
  assert.equal(mountBookCompanion(root), dispose);
  assert.equal(document.querySelector('[data-lens-list]').hidden, true);
  assert.equal(document.querySelector('[data-active-lens-title]').textContent, 'Notice the place');
  click(document, '[data-lens-choice="voice"]');
  assert.equal(document.querySelector('[data-active-lens-prompt]').textContent, 'Whose perspective shapes what you know?');
  assert.equal(document.querySelector('[data-lens-status]').textContent, 'Listen to the voice. Whose perspective shapes what you know?');
  assert.equal(document.querySelector('[data-lens-choice="place"]').getAttribute('aria-pressed'), 'false');
  assert.equal(document.querySelector('[data-lens-choice="voice"]').getAttribute('aria-pressed'), 'true');
  assert.equal(document.querySelector('#main-reading').hidden, false);
  assert.equal(document.querySelector('details').open, false);
  dispose();
  assert.equal(document.querySelector('[data-lens-list]').hidden, false);
  assert.equal(document.querySelector('[data-lens-panel]').hidden, true);
  assert.equal(document.querySelectorAll('[data-copy-card][hidden]').length, 0);
});

test('Book JSON-LD preserves verified bibliographic facts and omits unknown edition fields and commerce offers', () => {
  const book = { id: 'fixture-book', title: 'Fixture Book', subtitle: 'An editorial reading invitation', authors: ['Author One', 'Author Two'], kind: 'Novel', firstPublished: '1883', checkedAt: '2026-10-03', dek: 'An original description.', art: { src: '/images/bookshelf/fixture-book.webp' }, sources: [{ id: 'publisher', url: 'https://example.com/edition' }], editions: [{ isbn: '9780671792275', publicationDate: '1992-09-01', pages: 592, format: 'Trade paperback', publisher: 'Verified Publisher', sourceId: 'publisher' }, { isbn: null, publicationDate: null, pages: null, format: 'Print', publisher: '', sourceId: 'unknown' }] };
  const metadata = buildBookStructuredData(book);
  assert.equal(metadata.about['@type'], 'Book');
  assert.equal('alternateName' in metadata.about, false);
  assert.deepEqual(metadata.about.author.map((author) => author.name), ['Author One', 'Author Two']);
  assert.equal(metadata.about.datePublished, '1883');
  assert.equal(metadata.about.workExample[0].bookFormat, 'https://schema.org/Paperback');
  assert.equal(metadata.about.workExample[0].numberOfPages, 592);
  assert.equal(metadata.about.workExample[0].url, 'https://example.com/edition');
  assert.deepEqual(metadata.about.workExample[1], { '@type': 'Book', name: 'Fixture Book' });
  const encoded = JSON.stringify(metadata);
  assert.equal(encoded.includes(':null'), false);
  assert.equal(encoded.includes('offers'), false);
  assert.equal(encoded.includes('price'), false);
});


test('unverified historical reading rooms never assert Book authorship or edition metadata', () => {
  const metadata = buildBookStructuredData({ resourceType: 'reading-room', id: 'paul-graham-startup-essays', title: 'Paul Graham: The Art of Funding a Startup', authors: ['Andrew Warner'], firstPublished: 'Not verified', checkedAt: '2026-10-03', dek: 'A bibliographic note and primary essay routes.', art: { src: '/images/bookshelf-goodreads/paul-graham-startup-essays.webp' }, editions: [{ isbn: null, publisher: 'Unverified attribution' }] });
  assert.equal(metadata['@type'], 'WebPage');
  assert.equal('about' in metadata, false);
  assert.equal(JSON.stringify(metadata).includes('"Book"'), false);
  assert.equal(JSON.stringify(metadata).includes('"author"'), false);
});


test('publisher By and With credits remain distinct in Book metadata', () => {
 const metadata = buildBookStructuredData({ id:'credit-fixture', title:'Memoir', authors:['Narrator','Co-writer','Contributor'], authorCredits:[{name:'Narrator',role:'author'},{name:'Co-writer',role:'author'},{name:'Contributor',role:'contributor'}], firstPublished:'2004', checkedAt:'2026-10-03', kind:'Memoir', dek:'Original description', art:{src:'/image.webp'}, editions:[], sources:[] });
 assert.deepEqual(metadata.about.author.map(person => person.name), ['Narrator','Co-writer']);
 assert.deepEqual(metadata.about.contributor.map(person => person.name), ['Contributor']);
});
