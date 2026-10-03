import fs from 'node:fs';
import assert from 'node:assert/strict';

const books = JSON.parse(fs.readFileSync('src/data/bookshelf-goodreads.json', 'utf8'));
const snapshot = JSON.parse(fs.readFileSync('src/data/reading-feed.json', 'utf8'));
assert.equal(books.length, 11);
assert.equal(books.filter(book => book.resourceType === 'reading-room').length, 1);
assert.equal(snapshot.recordCount, 87);
assert.equal(snapshot.records.length, 87);
assert.equal(new Set(snapshot.records.map(record => record.id)).size, 87);
for (const record of snapshot.records) {
  assert.deepEqual(Object.keys(record).sort(), ['author', 'bookUrl', 'id', 'title']);
  assert.equal(record.bookUrl, `https://www.goodreads.com/book/show/${record.id}`);
}
for (const book of books) {
  const ids = new Set(book.sources.map(source => source.id));
  for (const id of [...book.context.sourceIds, ...book.authorNote.sourceIds, ...book.editions.map(edition => edition.sourceId), ...book.digitalRoutes.map(route => route.sourceId)]) assert(ids.has(id), `${book.id}: missing source ${id}`);
  for (const file of [`dist/books/${book.id}/index.html`, `dist/books/${book.id}.json`, `dist${book.art.src}`]) assert(fs.existsSync(file), `Missing ${file}`);
  const html = fs.readFileSync(`dist/books/${book.id}/index.html`, 'utf8');
  assert(!/<details[^>]*\sopen[\s>]/.test(html), `${book.id}: discussion must start closed`);
  assert(!html.includes('"@type":"Offer"'), `${book.id}: unexpected commerce offer`);
  if (book.resourceType === 'reading-room') assert(!html.includes('"@type":"Book"'), 'Unverified historical title must not assert Book metadata');
}
for (const file of ['dist/books/index.html', 'dist/books.json', 'dist/books/map/index.html', 'dist/books/map.json', 'dist/images/bookshelf-goodreads/provenance.json']) assert(fs.existsSync(file), `Missing ${file}`);
const map = fs.readFileSync('dist/books/map.json', 'utf8');
for (const forbidden of ['user_rating', 'user_review', 'user_name', 'user_shelves', 'user_read_at', 'user_date_added', 'book_description', 'book_image_url', 'review/list_rss', '/review/list/', 'profileUrl', 'sourceUrl']) assert(!map.includes(forbidden), `Private feed metadata leaked: ${forbidden}`);
console.log('Eleven companions, original artwork, 87 public title records and privacy/metadata guards passed.');
