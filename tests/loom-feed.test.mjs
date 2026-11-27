import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { addressKey } from '../src/lib/loom/address.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';
import {
  CACHE_CONTROL, DEFAULT_LIMIT, EMPTY_STAMP, MAX_LIMIT, TITLE_MAX,
  buildLoomAtom, buildLoomJsonFeed, buildLoomRss, escapeXml, handleLoomFeed, loomFeedEtag, loomFeedEtagMatches, stripIllegalXml,
} from '../src/lib/loom/loom-feed.mjs';

const FEED = 'https://pointcast.xyz/api/loom/feed';
const AT = '2026-11-01T12:00:00.000Z';
const AT2 = '2026-11-02T15:04:05.000Z';
const EDITED = '2026-11-03T08:09:10.000Z';

function memoryKv(records = {}) {
  const map = new Map(Object.entries(records));
  const calls = [];
  return {
    calls,
    async get(key) { calls.push(['get', key]); return map.has(key) ? map.get(key) : null; },
    async put(...args) { calls.push(['put', ...args]); throw new Error('loom feed must not write'); },
  };
}

const get = (query, kv, headers) => handleLoomFeed(new Request(`${FEED}${query}`, { headers }), { kv });

function assertXml(xml) {
  const parsed = spawnSync('python3', ['-c', 'import sys, xml.etree.ElementTree as ET; ET.fromstring(sys.stdin.read())'], { input: xml, encoding: 'utf8' });
  assert.equal(parsed.status, 0, parsed.stderr);
  assert.equal(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/.test(xml), false);
}

/** XML-decode the first item description, then parse it as HTML the way an RSS reader does. */
function rssItemText(xml) {
  const parsed = spawnSync('python3', ['-c', [
    'import sys, xml.etree.ElementTree as ET',
    'from html.parser import HTMLParser',
    'class T(HTMLParser):',
    '    def __init__(self):',
    '        super().__init__(convert_charrefs=True)',
    '        self.parts = []',
    '        self.tags = []',
    '    def handle_data(self, data):',
    '        self.parts.append(data)',
    '    def handle_starttag(self, tag, attrs):',
    '        self.tags.append(tag)',
    '        if tag == "br": self.parts.append("\\n")',
    'root = ET.fromstring(sys.stdin.read())',
    'descs = list(root.iter("description"))',
    'p = T(); p.feed(descs[-1].text or ""); p.close()',
    'sys.stdout.write(",".join(t for t in p.tags if t != "br") + "\\n" + "".join(p.parts))',
  ].join('\n')], { input: xml, encoding: 'utf8' });
  assert.equal(parsed.status, 0, parsed.stderr);
  const [tags, ...rest] = parsed.stdout.split('\n');
  return { tags, text: rest.join('\n') };
}

function sampleOps() {
  return [
    { seq: 1, op: 'append', id: 'm_root01', at: AT, kind: 'note', from: { name: 'Ana', kind: 'human' }, body: 'Courts are open\nSecond line stays in the body.', tags: ['#courts'], mentions: [], parent: null },
    { seq: 2, op: 'append', id: 'm_reply1', at: AT2, kind: 'question', from: { name: 'Sky', kind: 'agent', operator: 'PointCast', address: 'https://pointcast.xyz/loom' }, body: 'Need a yes on nets.', tags: ['#courts', '#tides'], parent: 'm_root01' },
    { seq: 3, op: 'edit', id: 'm_reply1', at: EDITED, body: 'Need a yes on nets, edited.' },
    { seq: 4, op: 'append', id: 'm_hiddn1', at: AT2, kind: 'note', from: { name: 'Ana', kind: 'human' }, body: 'secret <script>alert(1)</script>', tags: [] },
    { seq: 5, op: 'hide', id: 'm_hiddn1', at: EDITED, reason: 'moderated' },
  ];
}

async function storedLog(address, extra = {}) {
  const key = await addressKey(address);
  const ops = extra.ops ?? sampleOps();
  const log = {
    v: 1, address, key, kind: address.startsWith('#') ? 'topic' : 'handle', label: address, title: extra.title ?? 'Courts',
    createdAt: AT, updatedAt: extra.updatedAt ?? EDITED, seq: extra.seq ?? ops.length, ops,
  };
  return { key, log, kv: memoryKv({ [`loom:log:${key}`]: JSON.stringify(log) }) };
}

test('escapeXml strips illegal XML 1.0 characters before escaping markup', () => {
  const raw = 'A \u0000& B\u0001 <script>\'alert("x")\'</script>\u0008\u000B\u000C\u000E\u001F\uFFFE\uFFFF\uD800';
  const escaped = escapeXml(raw);
  assert.equal(escaped, 'A &amp; B &lt;script&gt;&apos;alert(&quot;x&quot;)&apos;&lt;/script&gt;');
  assert.equal(stripIllegalXml('hi\uD800there 😀'), 'hithere 😀');
  assert.equal(stripIllegalXml('keep\ttab\nand\rcr'), 'keep\ttab\nand\rcr');
  assert.equal(stripIllegalXml('\u007F'), '\u007F');
});

test('RSS 2.0, Atom 1.0, and JSON Feed 1.1 carry id, permalink, title, author, tags, stamps, and reply-to', async () => {
  const { key, log } = await storedLog('#courts');
  const messages = [
    { id: 'm_root01', seq: 1, at: AT, kind: 'note', from: { name: 'Ana', kind: 'human' }, body: 'Courts are open\nSecond line stays in the body.', tags: ['#courts'], parent: null },
    { id: 'm_reply1', seq: 2, at: AT2, editedAt: EDITED, kind: 'question', from: { name: 'Sky', kind: 'agent', operator: 'PointCast', address: 'https://pointcast.xyz/loom' }, body: 'Need a yes on nets, edited.', tags: ['#courts', '#tides'], parent: 'm_root01' },
  ];
  const page = 'https://pointcast.xyz/loom?to=%23courts';
  const replyUrl = `${page}#m_reply1`;
  const parentUrl = `${page}#m_root01`;
  const replyId = `loom:${key}#m_reply1`;
  const parentId = `loom:${key}#m_root01`;

  const rss = buildLoomRss(log, messages);
  assertXml(rss);
  assert.match(rss, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(rss, /<rss version="2\.0"/);
  assert.match(rss, /xmlns:dc="http:\/\/purl.org\/dc\/elements\/1.1\/"/);
  assert.ok(rss.includes(`<link>${page}</link>`));
  assert.ok(rss.includes(`<guid isPermaLink="false">${replyId}</guid>`));
  assert.ok(rss.includes(`<link>${replyUrl}</link>`));
  assert.match(rss, /<title>Need a yes on nets, edited\.<\/title>/);
  assert.match(rss, /<dc:creator>Sky \(operator: PointCast\)<\/dc:creator>/);
  assert.match(rss, /<dc:creator>Ana<\/dc:creator>/);
  assert.match(rss, /<category>question<\/category>/);
  assert.match(rss, /<category>#courts<\/category>/);
  assert.match(rss, /<category>#tides<\/category>/);
  assert.match(rss, new RegExp(`<pubDate>${new Date(AT2).toUTCString()}</pubDate>`));
  assert.ok(rss.includes(`<thr:in-reply-to ref="${parentId}" href="${parentUrl}"/>`));
  assert.match(rss, /Second line stays in the body\./);
  assert.doesNotMatch(rss, /<author>/);

  const atom = buildLoomAtom(log, messages);
  assertXml(atom);
  assert.match(atom, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
  assert.ok(atom.includes(`<id>${replyId}</id>`));
  assert.ok(atom.includes(`<link rel="alternate" type="text/html" href="${replyUrl}"/>`));
  assert.match(atom, /<name>Sky \(operator: PointCast\)<\/name>/);
  assert.match(atom, /<uri>https:\/\/pointcast\.xyz\/loom<\/uri>/);
  assert.match(atom, /<category term="question"\/>/);
  assert.match(atom, /<category term="#tides"\/>/);
  assert.match(atom, /<category term="note"\/>/);
  assert.ok(atom.includes(`<published>${AT2}</published>`));
  assert.ok(atom.includes(`<updated>${EDITED}</updated>`));
  assert.ok(atom.includes(`<thr:in-reply-to ref="${parentId}" href="${parentUrl}"/>`));

  const json = JSON.parse(buildLoomJsonFeed(log, messages));
  assert.equal(json.version, 'https://jsonfeed.org/version/1.1');
  assert.equal(json.home_page_url, page);
  assert.equal(json.feed_url, 'https://pointcast.xyz/api/loom/feed?to=%23courts&format=json');
  assert.equal(json.items[1].id, replyId);
  assert.equal(json.items[1].url, replyUrl);
  assert.equal(json.items[1].title, 'Need a yes on nets, edited.');
  assert.equal(json.items[1].authors[0].name, 'Sky (operator: PointCast)');
  assert.equal(json.items[1].authors[0].url, 'https://pointcast.xyz/loom');
  assert.deepEqual(json.items[1].tags, ['question', '#courts', '#tides']);
  assert.equal(json.items[1].date_published, AT2);
  assert.equal(json.items[1].date_modified, EDITED);
  assert.deepEqual(json.items[1]._loom, { in_reply_to: parentId, in_reply_to_url: parentUrl });
  assert.equal(json.items[0]._loom, undefined);
  assert.equal(json.items[0].authors[0].name, 'Ana');
  assert.match(json.items[0].content_text, /Second line stays in the body\./);
});

test('titles come from the first line and stay inside the length bound', () => {
  const long = `${'a'.repeat(TITLE_MAX + 40)}\nrest`;
  const rss = buildLoomRss({ address: '#t', key: 'a'.repeat(24), seq: 1, updatedAt: AT }, [{ id: 'm_long01', at: AT, from: { name: 'Ana' }, body: long, kind: 'note' }]);
  const title = rss.match(/<item>\s*<title>([^<]*)<\/title>/)[1];
  assert.equal(title.length, TITLE_MAX);
  assert.ok(title.endsWith('…'));
  assert.doesNotMatch(title, /rest/);
  const blank = buildLoomRss({ address: '#t', key: 'a'.repeat(24) }, [{ id: 'm_blank1', at: AT, from: { name: 'Ana' }, body: '\n\n  \nonly later', kind: 'note' }]);
  assert.match(blank, /<title>only later<\/title>/);
});

test('untrusted posts cannot break XML', () => {
  const nasty = 'Tom & Jerry\'s <script>alert("x")</script>\u0000\u0007\u0001before';
  const tag = 'say "hi" & <x>';
  const message = { id: 'm_nasty1', at: AT, kind: 'note', from: { name: 'A <b>', operator: 'Ops & Co', kind: 'agent' }, body: nasty, tags: [tag, '#ok'], parent: 'm_parent' };
  const log = { address: '#t', key: 'ab'.repeat(12), title: 'A & B <log>', seq: 2, updatedAt: AT };
  const rss = buildLoomRss(log, [message]);
  const atom = buildLoomAtom(log, [message]);
  for (const xml of [rss, atom]) {
    assertXml(xml);
    assert.doesNotMatch(xml, /<script>/);
    assert.match(xml, /A &lt;b&gt; \(operator: Ops &amp; Co\)/);
    assert.match(xml, /say &quot;hi&quot; &amp; &lt;x&gt;/);
    assert.equal(xml.includes('\u0000') || xml.includes('\u0007'), false);
  }
  // RSS descriptions are HTML after the XML parse, so the plain text is escaped twice.
  assert.match(rss, /Tom &amp;amp; Jerry&amp;apos;s &amp;lt;script&amp;gt;alert\(&amp;quot;x&amp;quot;\)&amp;lt;\/script&amp;gt;before/);
  const decoded = rssItemText(rss);
  assert.equal(decoded.tags, '');
  assert.equal(decoded.text, 'Tom & Jerry\'s <script>alert("x")</script>before');
  assert.match(atom, /Tom &amp; Jerry&apos;s &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;before/);
  const json = JSON.parse(buildLoomJsonFeed(log, [message]));
  assert.equal(json.items[0].content_text, 'Tom & Jerry\'s <script>alert("x")</script>before');
  assert.equal(json.items[0].authors[0].name, 'A <b> (operator: Ops & Co)');
  assert.ok(json.items[0].tags.includes('say "hi" & <x>'));
});

test('ETag is a deterministic function of key, seq, updatedAt, and format', async () => {
  const { log } = await storedLog('#courts');
  const strong = loomFeedEtag(log, 'rss');
  assert.equal(loomFeedEtag(log, 'rss'), strong);
  assert.equal(loomFeedEtag(log, 'rss', { weak: true }), `W/${strong}`);
  assert.notEqual(loomFeedEtag(log, 'atom'), strong);
  assert.notEqual(loomFeedEtag({ ...log, seq: log.seq + 1 }, 'rss'), strong);
  assert.notEqual(loomFeedEtag({ ...log, updatedAt: AT }, 'rss'), strong);
  assert.notEqual(loomFeedEtag({ ...log, key: 'f'.repeat(24) }, 'rss'), strong);
  assert.match(strong, new RegExp(`^"${log.key}\\|${log.seq}\\|${EDITED}\\|rss"$`));
  assert.equal(loomFeedEtagMatches(strong, strong), true);
  assert.equal(loomFeedEtagMatches(`W/${strong}`, strong), true);
  assert.equal(loomFeedEtagMatches(`"other", ${`W/${strong}`}`, strong), true);
  assert.equal(loomFeedEtagMatches('*', strong), true);
  assert.equal(loomFeedEtagMatches('"nope"', strong), false);
  assert.equal(loomFeedEtag({ ...log, updatedAt: null }, 'json'), `"${log.key}|${log.seq}||json"`);
});

test('GET defaults, content types, limit cap, and conditional 304', async () => {
  const { key, log, kv } = await storedLog('#courts');
  const rss = await get(`?to=${encodeURIComponent('#Courts')}`, kv);
  assert.equal(rss.status, 200);
  assert.equal(rss.headers.get('content-type'), 'application/rss+xml; charset=utf-8');
  assert.equal(rss.headers.get('cache-control'), CACHE_CONTROL);
  assert.equal(rss.headers.get('etag'), loomFeedEtag(log, 'rss'));
  const rssText = await rss.text();
  assertXml(rssText);
  assert.match(rssText, /Need a yes on nets, edited\./);
  assert.doesNotMatch(rssText, /secret/);
  assert.match(rssText, new RegExp(`loom:${key}#m_reply1`));
  assert.equal(kv.calls.filter((call) => call[0] === 'put').length, 0);
  assert.deepEqual(kv.calls.filter((call) => call[0] === 'get').map((call) => call[1]), [`loom:log:${key}`]);

  const atom = await get('?to=%23courts&format=Atom', kv);
  assert.equal(atom.status, 200);
  assert.equal(atom.headers.get('content-type'), 'application/atom+xml; charset=utf-8');
  assertXml(await atom.text());
  assert.notEqual(atom.headers.get('etag'), rss.headers.get('etag'));

  const jsonRes = await get('?to=%23courts&format=json&limit=1', kv);
  assert.equal(jsonRes.headers.get('content-type'), 'application/feed+json; charset=utf-8');
  const json = JSON.parse(await jsonRes.text());
  assert.equal(json.items.length, 1);
  assert.equal(json.items[0].id, `loom:${key}#m_reply1`);
  assert.equal(json.feed_url, 'https://pointcast.xyz/api/loom/feed?to=%23courts&format=json&limit=1');
  assert.equal(jsonRes.headers.get('etag'), loomFeedEtag(log, 'json'));
  assert.equal(loomFeedEtag(log, 'rss'), rss.headers.get('etag'));

  const cached = await get('?to=%23courts', kv, { 'If-None-Match': rss.headers.get('etag') });
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), '');
  assert.equal(cached.headers.get('etag'), rss.headers.get('etag'));
  assert.equal(cached.headers.get('cache-control'), CACHE_CONTROL);

  const weak = await get('?to=%23courts', kv, { 'If-None-Match': `W/${rss.headers.get('etag')}` });
  assert.equal(weak.status, 304);
  const star = await get('?to=%23courts&format=json', kv, { 'If-None-Match': '*' });
  assert.equal(star.status, 304);
  const miss = await get('?to=%23courts', kv, { 'If-None-Match': '"other"' });
  assert.equal(miss.status, 200);
  assert.match(await miss.text(), /<rss /);

  const head = await handleLoomFeed(new Request(`${FEED}?to=%23courts`, { method: 'HEAD' }), { kv });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal(head.headers.get('etag'), rss.headers.get('etag'));
  assert.equal(head.headers.get('content-type'), 'application/rss+xml; charset=utf-8');
});

test('limit defaults to 50 and caps at 100', async () => {
  const ops = Array.from({ length: 120 }, (_, i) => ({
    seq: i + 1, op: 'append', id: `m_${String(i).padStart(6, '0')}`, at: new Date(Date.parse(AT) + i * 1000).toISOString(),
    kind: 'note', from: { name: 'Ana', kind: 'human' }, body: `post ${i}`, tags: [],
  }));
  const { kv } = await storedLog('#courts', { ops, seq: ops.length, updatedAt: EDITED });
  const defaults = JSON.parse(await (await get('?to=%23courts&format=json', kv)).text());
  assert.equal(defaults.items.length, DEFAULT_LIMIT);
  assert.equal(defaults.items[0].title, 'post 119');
  assert.equal(defaults.items.at(-1).title, 'post 70');
  const capped = JSON.parse(await (await get('?to=%23courts&format=json&limit=500', kv)).text());
  assert.equal(capped.items.length, MAX_LIMIT);
  assert.equal(capped.items[0].title, 'post 119');
  const one = JSON.parse(await (await get('?to=%23courts&format=json&limit=1', kv)).text());
  assert.equal(one.items.length, 1);
  assert.equal(loomFeedEtagMatches(
    (await get('?to=%23courts&format=json&limit=1', kv)).headers.get('etag'),
    (await get('?to=%23courts&format=json', kv)).headers.get('etag'),
  ), true);
});

test('invalid format or limit is 400 and does not read the log', async () => {
  const { kv } = await storedLog('#courts');
  const bad = await get('?to=%23courts&format=as2', kv, { 'If-None-Match': '*' });
  assert.equal(bad.status, 400);
  assert.match(bad.headers.get('content-type'), /application\/json/);
  assert.equal(bad.headers.get('cache-control'), 'no-store');
  assert.equal((await bad.json()).error, 'format_invalid');
  const limit = await get('?to=%23courts&limit=0', kv);
  assert.equal(limit.status, 400);
  assert.equal((await limit.json()).error, 'limit_invalid');
  const word = await get('?to=%23courts&limit=many', kv);
  assert.equal(word.status, 400);
  const address = await get('?to=', kv);
  assert.equal(address.status, 400);
  assert.equal((await address.json()).error, 'address_required');
  const junk = await get('?to=not%20an%20address', kv);
  assert.equal(junk.status, 400);
  assert.equal((await junk.json()).error, 'address_unrecognised');
  assert.equal(kv.calls.length, 0);

  const posted = await handleLoomFeed(new Request(FEED, { method: 'POST', body: '{}' }), { kv });
  assert.equal(posted.status, 405);
  assert.match(posted.headers.get('allow'), /GET/);
  assert.equal(kv.calls.length, 0);
});

test('unbound, missing, and broken KV return a valid empty feed', async () => {
  const unbound = await handleLoomFeed(new Request(FEED), { kv: null });
  assert.equal(unbound.status, 200);
  assert.equal(unbound.headers.get('content-type'), 'application/rss+xml; charset=utf-8');
  const unboundXml = await unbound.text();
  assertXml(unboundXml);
  // #loom with no store is the reader's seed. Those posts are Collator notes, so the feed has a channel and no items.
  assert.match(unboundXml, /<title>The Loom — start here · the Loom<\/title>/);
  assert.doesNotMatch(unboundXml, /<item>/);
  assert.match(unboundXml, /<lastBuildDate>Tue, 20 Oct 2026 16:00:00 GMT<\/lastBuildDate>/);
  const again = await (await handleLoomFeed(new Request(FEED), {})).text();
  assert.equal(again, unboundXml);

  const missing = await get('?to=%40mike&format=atom', memoryKv());
  assert.equal(missing.status, 200);
  const atom = await missing.text();
  assertXml(atom);
  assert.match(atom, /<title>@mike · the Loom<\/title>/);
  assert.doesNotMatch(atom, /<entry>/);
  assert.ok(atom.includes(`<updated>${EMPTY_STAMP}</updated>`));

  const broken = {
    async get() { throw new Error('kv down'); },
    async put() { throw new Error('loom feed must not write'); },
  };
  const failed = await get('?to=%23courts&format=json', broken);
  assert.equal(failed.status, 200);
  const json = JSON.parse(await failed.text());
  assert.deepEqual(json.items, []);
  assert.equal(json.home_page_url, 'https://pointcast.xyz/loom?to=%23courts');

  const corrupt = memoryKv({ [`loom:log:${await addressKey('#courts')}`]: '{' });
  const corruptRes = await get('?to=%23courts&format=rss', corrupt);
  assert.equal(corruptRes.status, 200);
  assert.doesNotMatch(await corruptRes.text(), /<item>/);
});

test('a reply address reads that log and nowhere else', async () => {
  const { key, kv } = await storedLog('@sky');
  const res = await get(`?to=${encodeURIComponent(`loom:${key}#m_root01`)}&format=json`, kv);
  assert.equal(res.status, 200);
  const json = JSON.parse(await res.text());
  assert.equal(json.home_page_url, 'https://pointcast.xyz/loom?to=%40sky');
  assert.equal(json.items.length, 2);
  assert.deepEqual(kv.calls.filter((call) => call[0] === 'get').map((call) => call[1]), [`loom:log:${key}`]);
});

test('Collator echoes are dropped unless include_collator=1', async () => {
  const ops = [
    { seq: 1, op: 'append', id: 'm_human1', at: AT, kind: 'note', from: { name: 'Ana', kind: 'human' }, body: 'real post', tags: [] },
    { seq: 2, op: 'append', id: 'm_robot1', at: AT2, kind: 'note', from: { name: 'Collator', kind: 'robot', address: '@collator' }, body: 'Also threaded elsewhere — #other.', tags: [] },
    { seq: 3, op: 'append', id: 'm_link01', at: AT2, kind: 'link', from: { name: 'Ana', kind: 'human' }, body: 'echo copy', tags: [], via: { address: '#other' } },
    { seq: 4, op: 'append', id: 'm_named1', at: AT2, kind: 'note', from: { name: 'Someone', kind: 'human', address: '@collator' }, body: 'collator address', tags: [] },
  ];
  const { kv } = await storedLog('#courts', { ops, seq: ops.length });
  const plain = JSON.parse(await (await get('?to=%23courts&format=json', kv)).text());
  assert.deepEqual(plain.items.map((item) => item.title), ['real post']);
  const kept = JSON.parse(await (await get('?to=%23courts&format=json&include_collator=1', kv)).text());
  assert.deepEqual(kept.items.map((item) => item.title), [
    'collator address',
    'echo copy',
    'Also threaded elsewhere — #other.',
    'real post',
  ]);
  assert.equal(kv.calls.some((call) => call[0] === 'put'), false);
});

test('the feed shows the same posts handleLoom returns, minus Collator echoes', async () => {
  const { key, kv } = await storedLog('#courts');
  const direct = await handleLoom(new Request(`https://pointcast.xyz/api/loom?to=${encodeURIComponent('#courts')}`), { kv });
  assert.equal(direct.status, 200);
  const data = await direct.json();
  assert.equal(data.ok, true);
  assert.equal(data.log.key, key);
  const feed = JSON.parse(await (await get('?to=%23courts&format=json', kv)).text());
  const visible = data.messages.filter((message) => message.from?.kind !== 'robot' && message.from?.address !== '@collator' && message.kind !== 'link');
  visible.sort((a, b) => b.seq - a.seq);
  assert.deepEqual(feed.items.map((item) => item.id), visible.map((message) => `loom:${key}#${message.id}`));
  assert.equal(feed.items.length, 2);
  assert.equal(kv.calls.some((call) => call[0] === 'put'), false);
  const lib = readFileSync(new URL('../src/lib/loom/loom-feed.mjs', import.meta.url), 'utf8');
  assert.match(lib, /const internal = \(query, kv\) => handleLoom\(new Request\(`\$\{API\}\$\{query\}`\), \{ kv \}\)/);
  assert.doesNotMatch(lib, /kv\.get\s*\(/);
});

test('the route file is a read-only adapter and does not touch the write path', () => {
  const route = readFileSync(new URL('../functions/api/loom/feed.ts', import.meta.url), 'utf8');
  const lib = readFileSync(new URL('../src/lib/loom/loom-feed.mjs', import.meta.url), 'utf8');
  for (const src of [route, lib]) assert.doesNotMatch(src, /\.put\s*\(/);
  assert.doesNotMatch(lib, /from ['"].*(atomic|hearth)[^'"]*['"]/);
  assert.match(lib, /from '\.\/service\.mjs'/);
  assert.match(route, /handleLoomFeed/);
  assert.match(route, /complements GET \/api\/loom\?to=<address>&format=rss/);
  assert.match(route, /env\.PC_LOOM_KV \?\? env\.VISITS \?\? null/);
  assert.match(route, /export const onRequest/);
});
