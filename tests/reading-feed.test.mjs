import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { LIMITS, FeedImportError, parseGoodreadsRss, createSnapshot, diffSnapshots, validateSourceUrl, fetchGoodreadsRss, refreshReadingFeed, compareRecords } from '../scripts/lib/reading-feed.mjs';
import { runManualRefresh } from '../scripts/refresh-reading-feed.mjs';

const source = 'https://www.goodreads.com/review/list_rss/999999?shelf=ALL';
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const item = ({ id = '10', title = 'A Book', author = 'Ada Author', extra = '' } = {}) => `<item><book_id>${escape(id)}</book_id><title>${escape(title)}</title><author_name>${escape(author)}</author_name>${extra}</item>`;
const rss = (...items) => `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>PRIVATE ACCOUNT NAME</title><link>https://www.goodreads.com/review/list/999999</link>${items.join('')}</channel></rss>`;
const oldSnapshot = () => createSnapshot(parseGoodreadsRss(rss(item({ id: '1', title: 'Earlier Book' }))), '2026-10-02', true);
const expectCode = (callback, code) => assert.throws(callback, (error) => error instanceof FeedImportError && error.code === code);
const response = (body, headers = {}) => new Response(body, { status: 200, headers: { 'content-type': 'application/rss+xml; charset=utf-8', ...headers } });

test('RSS output whitelists book metadata and never exposes private channel, review, rating, activity, cover, or feed fields', () => {
  const xml = rss(item({ extra: '<user_name>PRIVATE USER</user_name><user_review><![CDATA[PRIVATE REVIEW <b>SECRET</b>]]></user_review><user_rating>PRIVATE RATING</user_rating><user_read_at>PRIVATE READ DATE</user_read_at><user_date_added>PRIVATE ADDED DATE</user_date_added><book_description>PRIVATE DESCRIPTION</book_description><book_image_url>https://private.example/cover</book_image_url><link>https://www.goodreads.com/review/show/999999</link><description><![CDATA[<title>PRIVATE NESTED TITLE</title>]]></description>' }));
  const snapshot = createSnapshot(parseGoodreadsRss(xml), '2026-10-03', true);
  assert.deepEqual(Object.keys(snapshot.records[0]), ['id', 'title', 'author', 'bookUrl']);
  assert.deepEqual(snapshot.records[0], { id: '10', title: 'A Book', author: 'Ada Author', bookUrl: 'https://www.goodreads.com/book/show/10' });
  const output = JSON.stringify(snapshot);
  for (const privateText of ['PRIVATE', 'private.example', '/review/', 'book_image', 'user_rating', 'user_read_at', 'user_name', 'description']) assert.equal(output.includes(privateText), false);
  assert.equal(snapshot.provider, 'Goodreads');
  assert.equal(snapshot.recordCount, 1);
  assert.equal(snapshot.status, 'manually-reviewed-snapshot');
  assert.match(snapshot.scope, /not a complete account scan/);
});

test('embedded HTML becomes inert text; script/style/attributes and document nodes do not survive', () => {
  const xml = rss('<item><book_id>11</book_id><title><![CDATA[<b>A</b> <i>Book</i><br>of Words &amp; Ideas<script>PRIVATE SCRIPT</script><style>PRIVATE CSS</style><img src="https://private.example/cover"><!--PRIVATE COMMENT-->]]></title><author_name><![CDATA[<a href="javascript:PRIVATE()">Ada Author</a><iframe>PRIVATE FRAME</iframe>]]></author_name></item>');
  const records = parseGoodreadsRss(xml);
  assert.equal(records[0].title, 'A Book of Words & Ideas');
  assert.equal(records[0].author, 'Ada Author');
  assert.equal(JSON.stringify(records).includes('PRIVATE'), false);
  assert.equal(JSON.stringify(records).includes('<'), false);
  const nestedXml = rss('<item><book_id>12</book_id><title>A <b>Book</b><br/>of Words</title><author_name>Ada &amp; Author</author_name></item>');
  assert.equal(parseGoodreadsRss(nestedXml)[0].title, 'A Book of Words');
  assert.equal(parseGoodreadsRss(nestedXml)[0].author, 'Ada & Author');
});

test('DTD/entity declarations and undeclared custom entities are rejected without expanding or fetching anything', () => {
  expectCode(() => parseGoodreadsRss('<!DOCTYPE rss [<!ENTITY secret SYSTEM "file:///private">]>' + rss(item())), 'DTD_FORBIDDEN');
  expectCode(() => parseGoodreadsRss('<!DOCTYPE rss SYSTEM "https://private.example/entity">' + rss(item())), 'DTD_FORBIDDEN');
  expectCode(() => parseGoodreadsRss(rss(item()).replace('A Book', '&private;')), 'XML_INVALID');
  expectCode(() => parseGoodreadsRss(rss(item()).replace('</rss>', '')), 'XML_INVALID');
});

test('numeric IDs are strict; missing or ambiguous fields fail rather than silently truncating the collection', () => {
  for (const id of ['0', '-1', '1e6', '001', '1/path', '1?key=private', '1234567890123456789', '']) expectCode(() => parseGoodreadsRss(rss(item({ id }))), 'RECORD_INVALID');
  expectCode(() => parseGoodreadsRss(rss('<item><book_id>10</book_id><title>A Book</title></item>')), 'RECORD_INVALID');
  expectCode(() => parseGoodreadsRss(rss(item({ extra: '<book_id>20</book_id>' }))), 'RECORD_INVALID');
  expectCode(() => parseGoodreadsRss('<feed><item/></feed>'), 'XML_INVALID');
  expectCode(() => parseGoodreadsRss(rss()), 'XML_INVALID');
});

test('duplicates are resolved deterministically and records sort alphabetically independent of feed order', () => {
  const entries = [item({ id: '20', title: 'Zebra' }), item({ id: '10', title: 'Beta' }), item({ id: '20', title: 'Alpha' }), item({ id: '30', title: 'Gamma' })];
  const records = parseGoodreadsRss(rss(...entries));
  assert.deepEqual(records, parseGoodreadsRss(rss(...entries.reverse())));
  assert.deepEqual(records.map((record) => record.title), ['Alpha', 'Beta', 'Gamma']);
  assert.equal(new Set(records.map((record) => record.id)).size, 3);
  assert.deepEqual(records, [...records].sort(compareRecords));
});

test('byte, record, XML depth, title, author, and raw-field limits are enforced', () => {
  expectCode(() => parseGoodreadsRss(Buffer.alloc(LIMITS.bytes + 1, 32)), 'LIMIT_BYTES');
  expectCode(() => parseGoodreadsRss(rss(...Array.from({ length: LIMITS.items + 1 }, () => item()))), 'LIMIT_RECORDS');
  expectCode(() => parseGoodreadsRss(rss(item({ title: 'T'.repeat(LIMITS.title + 1) }))), 'LIMIT_FIELD');
  expectCode(() => parseGoodreadsRss(rss(item({ author: 'A'.repeat(LIMITS.author + 1) }))), 'LIMIT_FIELD');
  expectCode(() => parseGoodreadsRss(rss(item({ title: 'T'.repeat(LIMITS.rawField + 1) }))), 'LIMIT_FIELD');
  expectCode(() => parseGoodreadsRss(rss(item({ extra: `<description>${'<deep>'.repeat(LIMITS.depth)}text${'</deep>'.repeat(LIMITS.depth)}</description>` }))), 'LIMIT_DEPTH');
});

test('source allowlist accepts only HTTPS Goodreads all-shelf RSS, including encoded #ALL#, with bounded normal query options', () => {
  assert.equal(validateSourceUrl(source).hostname, 'www.goodreads.com');
  assert.equal(validateSourceUrl('https://www.goodreads.com/review/list_rss/999999?shelf=%23ALL%23&sort=date_read&order=d').searchParams.get('shelf'), '#ALL#');
  assert.equal(validateSourceUrl('https://goodreads.com/review/list_rss/999999?shelf=%23all%23&per_page=100&page=2').hostname, 'goodreads.com');
  const rejected = ['http://www.goodreads.com/review/list_rss/999999?shelf=ALL', 'https://localhost/review/list_rss/999999?shelf=ALL', 'https://127.0.0.1/review/list_rss/999999?shelf=ALL', 'https://www.goodreads.com.evil.example/review/list_rss/999999?shelf=ALL', 'https://private:password@www.goodreads.com/review/list_rss/999999?shelf=ALL', 'https://www.goodreads.com:444/review/list_rss/999999?shelf=ALL', 'https://www.goodreads.com/review/list/999999?shelf=ALL', 'https://www.goodreads.com/review/list_rss/notnumeric?shelf=ALL', 'https://www.goodreads.com/review/list_rss/999999?shelf=read', 'https://www.goodreads.com/review/list_rss/999999', 'https://www.goodreads.com/review/list_rss/999999?shelf=ALL&shelf=read', 'https://www.goodreads.com/review/list_rss/999999?shelf=ALL&redirect=https://private.example', 'https://www.goodreads.com/review/list_rss/999999?shelf=ALL&key=private', 'https://www.goodreads.com/review/list_rss/999999?shelf=ALL#private', 'https://www.goodreads.com/review/list_rss/999999?shelf=ALL&page=1001', 'https://www.goodreads.com/review/list_rss/999999?shelf=ALL&per_page=0'];
  for (const url of rejected) expectCode(() => validateSourceUrl(url), 'SOURCE_NOT_ALLOWED');
});

test('fetch uses manual redirects, no credentials, XML content validation, and a streaming 2 MiB ceiling', async () => {
  let options;
  const result = await fetchGoodreadsRss(source, { fetchImpl: async (url, init) => { options = init; return response(rss(item())); } });
  assert.equal(parseGoodreadsRss(result).length, 1);
  assert.equal(options.redirect, 'manual');
  assert.equal(options.credentials, 'omit');
  await assert.rejects(fetchGoodreadsRss(source, { fetchImpl: async () => new Response('', { status: 302, headers: { location: 'https://private.example' } }) }), (error) => error.code === 'REDIRECT_REJECTED');
  await assert.rejects(fetchGoodreadsRss(source, { fetchImpl: async () => response('not xml', { 'content-type': 'text/html' }) }), (error) => error.code === 'CONTENT_TYPE');
  await assert.rejects(fetchGoodreadsRss(source, { fetchImpl: async () => response('', { 'content-length': String(LIMITS.bytes + 1) }) }), (error) => error.code === 'LIMIT_BYTES');
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(LIMITS.bytes)); controller.enqueue(new Uint8Array(1)); controller.close(); } });
  await assert.rejects(fetchGoodreadsRss(source, { fetchImpl: async () => response(stream) }), (error) => error.code === 'LIMIT_BYTES');
  let fetchCalls = 0;
  await assert.rejects(fetchGoodreadsRss('http://localhost/private', { fetchImpl: async () => { fetchCalls += 1; return response(''); } }), (error) => error.code === 'SOURCE_NOT_ALLOWED');
  assert.equal(fetchCalls, 0);
});

test('the timeout covers both an unresponsive fetch and a stalled response body', async () => {
  await assert.rejects(fetchGoodreadsRss(source, { timeoutMs: 15, fetchImpl: () => new Promise(() => {}) }), (error) => error.code === 'TIMEOUT');
  const stalled = new ReadableStream({ start() {} });
  await assert.rejects(fetchGoodreadsRss(source, { timeoutMs: 15, fetchImpl: async () => response(stalled) }), (error) => error.code === 'TIMEOUT');
});

test('diff identifies added, removed, and changed book metadata without private data', () => {
  const previous = createSnapshot(parseGoodreadsRss(rss(item({ id: '1', title: 'Alpha' }), item({ id: '2', title: 'Beta' }))), '2026-10-02', true);
  previous.privateSource = 'PRIVATE URL'; previous.records[0].rating = 'PRIVATE RATING';
  const current = createSnapshot(parseGoodreadsRss(rss(item({ id: '2', title: 'Beta Revised' }), item({ id: '3', title: 'Gamma' }))), '2026-10-03');
  const diff = diffSnapshots(previous, current);
  assert.deepEqual(diff.counts, { added: 1, removed: 1, changed: 1 });
  assert.equal(diff.added[0].id, '3'); assert.equal(diff.removed[0].id, '1');
  assert.equal(diff.changed[0].before.title, 'Beta'); assert.equal(diff.changed[0].after.title, 'Beta Revised');
  assert.equal(JSON.stringify(diff).includes('PRIVATE'), false);
  assert.deepEqual(diff, diffSnapshots(previous, current));
});

test('refresh failure reports stale data and leaves the prior snapshot untouched; errors never disclose source or parser details', async () => {
  const previous = oldSnapshot(); const original = JSON.stringify(previous);
  const malformed = await refreshReadingFeed({ previous, input: '<rss><PRIVATE_SECRET>', checkedAt: '2026-10-03' });
  assert.equal(malformed.status, 'stale'); assert.equal(malformed.lastSuccessfulCheck, '2026-10-02');
  assert.deepEqual(malformed.snapshot, previous); assert.equal(JSON.stringify(previous), original);
  assert.equal(JSON.stringify(malformed.error).includes('PRIVATE'), false);
  const failed = await refreshReadingFeed({ previous, privateSourceUrl: source, checkedAt: '2026-10-03', fetchImpl: async () => { throw new Error('PRIVATE FEED URL AND KEY'); } });
  assert.equal(failed.status, 'stale'); assert.equal(failed.error.code, 'FETCH_ERROR');
  assert.equal(JSON.stringify(failed).includes('PRIVATE'), false);
  const absent = await refreshReadingFeed({ input: '<bad/>', checkedAt: '2026-10-03' });
  assert.equal(absent.status, 'error'); assert.equal(absent.snapshot, null);
});

test('manual CLI writes only draft+diff, preserves published and existing draft bytes on parse errors, and rejects overwriting prior data', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'reading-feed-test-'));
  try {
    const previousPath = path.join(directory, 'reading-feed.json');
    const inputPath = path.join(directory, 'private.xml');
    const outputPath = path.join(directory, 'draft.json'); const diffPath = path.join(directory, 'diff.json');
    const original = JSON.stringify(oldSnapshot(), null, 2);
    await fs.writeFile(previousPath, original); await fs.writeFile(inputPath, rss(item({ id: '2', title: 'Later Book' })));
    let stdout = ''; let stderr = '';
    const settings = { env: {}, stdout: { write: (text) => { stdout += text; } }, stderr: { write: (text) => { stderr += text; } } };
    const args = ['--input-private-file', inputPath, '--previous', previousPath, '--output', outputPath, '--diff-output', diffPath, '--checked-at', '2026-10-03'];
    assert.equal(await runManualRefresh({ ...settings, args }), 0);
    assert.equal(await fs.readFile(previousPath, 'utf8'), original);
    const draftBytes = await fs.readFile(outputPath, 'utf8'); const diffBytes = await fs.readFile(diffPath, 'utf8');
    assert.equal(JSON.parse(draftBytes).status, 'draft-pending-review');
    assert.deepEqual(JSON.parse(diffBytes).counts, { added: 1, removed: 1, changed: 0 });
    assert.equal(stdout.includes('private.xml'), false);
    await fs.writeFile(inputPath, '<rss><PRIVATE SECRET>');
    assert.equal(await runManualRefresh({ ...settings, args }), 1);
    assert.equal(await fs.readFile(previousPath, 'utf8'), original);
    assert.equal(await fs.readFile(outputPath, 'utf8'), draftBytes);
    assert.equal(await fs.readFile(diffPath, 'utf8'), diffBytes);
    assert.equal(stderr.includes('"status":"stale"'), true); assert.equal(stderr.includes('PRIVATE'), false);
    await fs.writeFile(inputPath, rss(item({ id: '2' })));
    assert.equal(await runManualRefresh({ ...settings, args: args.map((value) => value === outputPath ? previousPath : value) }), 1);
    assert.equal(await fs.readFile(previousPath, 'utf8'), original);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
