import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { buildSitemap, buildTopicIndex, buildTopicPage, canonicalTopicName, parseTopicName } from '../src/lib/loom/topic-page.mjs';
import { serveSitemap, serveTopic, serveTopicIndex } from '../src/lib/loom/topic-route.mjs';

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const post = (kv, body) => handleLoom(new Request('https://pointcast.xyz/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { kv });
const req = (path) => new Request(`https://pointcast.xyz${path}`);

test('topic names: lowercase topic grammar only', () => {
  assert.equal(parseTopicName('officenoun'), 'officenoun');
  assert.equal(parseTopicName('a-1'), 'a-1');
  assert.equal(parseTopicName('officenoun/'), 'officenoun');
  for (const bad of ['', '#loom', 'Loom', '-x', 'a b', 'a_b', '@mike', 'x'.repeat(41), '../etc', 'a/b', '%23loom', '<script>', 'geo:1,2', 'https://x.com', '%E0%A4%A']) {
    assert.equal(parseTopicName(bad), null, bad);
  }
  assert.equal(parseTopicName('x'.repeat(40)), 'x'.repeat(40));
});

const msg = (i, body, extra = {}) => ({ id: `m_${i}`, seq: i, at: '2026-11-12T10:00:00.000Z', from: { name: `u${i}`, kind: 'human' }, kind: 'note', body, ...extra });

test('topic page escapes hostile text and caps at twenty messages', () => {
  const messages = Array.from({ length: 30 }, (_, i) => msg(i + 1, `body number ${i + 1}`));
  const sorted = true;
  messages[29] = msg(30, '<script>alert(1)</script> "><img src=x onerror=alert(2)>', { from: { name: '<b>evil</b>"\'', kind: 'agent' } });
  const html = buildTopicPage({ ok: true, log: { title: 'x"><svg onload=1>', updatedAt: '2026-11-12T10:00:00.000Z' }, messages, count: 30, participants: [{}, {}] }, { name: 'officenoun' });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<svg'));
  assert.ok(!html.includes('<b>evil'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.equal((html.match(/<li id=/g) ?? []).length, 20);
  assert.ok(html.includes('body number 11') && !html.includes('body number 10<'));
  assert.ok(html.includes('The latest 20 of 30'));
  // JSON-LD cannot be broken out of
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  assert.ok(!ld.includes('<'));
  JSON.parse(ld);
});

test('topic page: canonical, links, no robots block when it has messages', () => {
  const html = buildTopicPage({ ok: true, log: {}, messages: [msg(1, 'a'), msg(2, 'b'), msg(3, 'c')], count: 3, participants: [{}] }, { name: 'officenoun' });
  assert.ok(html.includes('<link rel="canonical" href="https://pointcast.xyz/loom/topic/officenoun">'));
  assert.ok(html.includes('<title>#officenoun · the Loom · PointCast</title>'));
  assert.ok(html.includes('href="/loom?to=%23officenoun#thread"'));
  assert.ok(html.includes('type="application/rss+xml" href="/api/loom?to=%23officenoun&amp;format=rss"'));
  assert.ok(!html.includes('noindex'));
  assert.ok(html.includes('3 messages from 3 participants'));
});

test('empty topic is noindex with a nothing-here line', () => {
  const html = buildTopicPage({ ok: true, log: {}, messages: [], count: 0, participants: [] }, { name: 'quiet' });
  assert.ok(html.includes('<meta name="robots" content="noindex, follow">'));
  assert.ok(html.includes('Nothing here yet'));
  assert.ok(!html.includes('application/ld+json'));
});

test('image attachments are links with alt text, never <img>; non-https is not linked', () => {
  const html = buildTopicPage({ ok: true, log: {}, count: 2, participants: [{}], messages: [
    msg(1, '', { kind: 'image', media: { url: 'https://example.com/a.png?x=1&y=2', alt: 'a "cat"' } }),
    msg(2, 'x', { media: { url: 'javascript:alert(1)', alt: 'bad' } }),
  ] }, { name: 'pics' });
  assert.ok(!/<img/i.test(html));
  assert.ok(html.includes('<a href="https://example.com/a.png?x=1&amp;y=2" rel="nofollow ugc noopener">Image: a &quot;cat&quot;</a>'));
  assert.ok(!html.includes('href="javascript'));
});

test('title: log title wins when set', () => {
  assert.ok(buildTopicPage({ log: { title: 'Pickleball ladder' }, messages: [msg(1, 'x')], count: 1 }, { name: 'p' }).includes('<title>Pickleball ladder · the Loom · PointCast</title>'));
  assert.ok(buildTopicPage({ log: { title: 'The Loom — start here' }, messages: [msg(1, 'x')], count: 1 }, { name: 'loom' }).includes('<title>The Loom — start here · PointCast</title>'));
});

const dir = { ok: true, logs: [
  { address: '#thin', kind: 'topic', count: 2, updatedAt: '2026-11-12T00:00:00.000Z' },
  { address: '#a', kind: 'topic', count: 3, updatedAt: '2026-11-10T00:00:00.000Z', title: 'A <b>', last: { body: '<i>last</i>' } },
  { address: '#empty', kind: 'topic', count: 0, updatedAt: '2026-11-11T00:00:00.000Z' },
  { address: '@mike', kind: 'handle', count: 9, updatedAt: '2026-11-11T00:00:00.000Z' },
  { address: 'https://x.com/p', kind: 'url', count: 9, updatedAt: '2026-11-11T00:00:00.000Z' },
  { address: '#BadCase', kind: 'topic', count: 4, updatedAt: '2026-11-11T00:00:00.000Z' },
  { address: '#b', kind: 'topic', count: 3, updatedAt: '2026-11-12T00:00:00.000Z' },
] };

test('sitemap lists /loom, /loom/topic/ and topics with messages only', () => {
  const xml = buildSitemap(dir);
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, ['https://pointcast.xyz/loom', 'https://pointcast.xyz/loom/topic/', 'https://pointcast.xyz/loom/topic/a', 'https://pointcast.xyz/loom/topic/b']);
  assert.ok(!xml.includes('/topic/thin'));
  assert.ok(xml.includes('<loc>https://pointcast.xyz/loom/topic/a</loc><lastmod>2026-11-10</lastmod>'));
  assert.ok(xml.includes('<loc>https://pointcast.xyz/loom</loc><lastmod>2026-11-12</lastmod>'));
});

test('sitemap caps at the directory size (400) and skips thin topics', () => {
  const logs = Array.from({ length: 800 }, (_, i) => ({ address: `#t${i}`, kind: 'topic', count: 3, updatedAt: '2026-11-12T00:00:00.000Z' }));
  assert.equal((buildSitemap({ logs }).match(/<loc>/g) ?? []).length, 402); // directory cap is 400 (MAX_ROOMS)
});

test('topic index escapes titles and skips non-topics', () => {
  const html = buildTopicIndex(dir);
  assert.ok(html.includes('href="/loom/topic/a"') && html.includes('href="/loom/topic/b"'));
  assert.ok(html.includes('/loom/topic/thin'));
  assert.ok(!html.includes('/loom/topic/empty') && !html.includes('mike') && !html.includes('BadCase'));
  assert.ok(!html.includes('<b>') && !html.includes('<i>last'));
  assert.ok(buildTopicIndex({ logs: [] }).includes('noindex'));
});

test('route: end to end through the real Loom service', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#officenoun', from: { name: 'Mike' }, body: 'hello <script>x</script> world' });
  for (const n of [2, 3]) await post(kv, { to: '#officenoun', from: { name: `P${n}` }, body: `more ${n}` });
  const ok = await serveTopic(req('/loom/topic/officenoun'), kv, 'officenoun');
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get('content-type'), /text\/html/);
  assert.match(ok.headers.get('cache-control'), /max-age=300/);
  const page = await ok.text();
  assert.ok(page.includes('hello &lt;script&gt;x&lt;/script&gt; world'));
  assert.ok(!page.includes('<script>x'));
  assert.ok(!page.includes('noindex'));

  const never = await serveTopic(req('/loom/topic/nothing'), kv, 'nothing');
  assert.equal(never.status, 404);
  assert.match(never.headers.get('x-robots-tag'), /noindex/);
  await post(kv, { to: '#thin', from: { name: 'A' }, body: 'only one' });
  const thin = await serveTopic(req('/loom/topic/thin'), kv, 'thin');
  assert.equal(thin.status, 200);
  assert.match(thin.headers.get('x-robots-tag'), /noindex/);
  for (const raw of ['Pickleball', '%23pickleball', '#Pickleball']) {
    const r = await serveTopic(req('/x'), kv, raw);
    assert.equal(r.status, 301, raw);
    assert.equal(r.headers.get('location'), '/loom/topic/pickleball');
  }

  for (const bad of ['@mike', 'a b', '', 'x'.repeat(41)]) assert.equal((await serveTopic(req('/x'), kv, bad)).status, 404, bad);
  assert.equal((await serveTopic(new Request('https://pointcast.xyz/x', { method: 'POST' }), kv, 'officenoun')).status, 405);

  const seed = await (await serveTopic(req('/loom/topic/loom'), kv, 'loom')).text();
  assert.ok(seed.includes('Collator') && !seed.includes('noindex'));

  const index = await (await serveTopicIndex(req('/loom/topic/'), kv)).text();
  assert.ok(index.includes('/loom/topic/officenoun') && index.includes('/loom/topic/loom'));
  const sm = await serveSitemap(req('/loom/sitemap.xml'), kv);
  assert.match(sm.headers.get('content-type'), /xml/);
  assert.ok((await sm.text()).includes('/loom/topic/officenoun'));
});

test('route without storage still answers', async () => {
  const res = await serveTopic(req('/loom/topic/loom'), null, 'loom');
  assert.equal(res.status, 200);
});

test('front-door files are wired', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  assert.match(read('public/robots.txt'), /^Sitemap: https:\/\/pointcast\.xyz\/loom\/sitemap\.xml$/m);
  const top = read('public/llms.txt').split('\n').slice(0, 15).join('\n');
  for (const s of ['/loom/topic/', '/loom.json', '/api/loom', 'loom_read', 'loom_append', 'format=rss', 'button.js']) assert.ok(top.includes(s), s);
  const page = read('src/pages/loom/index.astro');
  assert.ok(page.includes('type="application/rss+xml" href="/api/loom?to=%23loom&format=rss"'));
  assert.ok(page.includes('href="/loom/topic/"'));
  assert.ok(page.includes("get('compose') === '1'"));
  const button = read('public/loom/button.js');
  assert.ok(!/innerHTML/.test(button));
  assert.ok(button.includes('compose=1#thread'));
});

test('latest twenty go by time posted, so a new reply to an old root is kept', () => {
  // fold() order: root 1, its late reply (seq 31) right after it, then the rest
  const msgs = [msg(1, 'old root'), msg(31, 'LATE REPLY', { parent: 'm_1' }), ...Array.from({ length: 29 }, (_, i) => msg(i + 2, `n${i + 2}`))];
  const html = buildTopicPage({ ok: true, log: {}, messages: msgs, count: 31 }, { name: 't' });
  assert.ok(html.includes('LATE REPLY'));
  assert.ok(!html.includes('old root'));
  assert.ok(html.indexOf('n30') < html.indexOf('LATE REPLY'));
  assert.ok(html.includes('oldest first by time posted'));
});

test('verified mark shown only when set; robots are not people', () => {
  const html = buildTopicPage({ ok: true, log: {}, count: 3, messages: [
    msg(1, 'a', { from: { name: 'Bot', kind: 'agent', verified: true } }),
    msg(2, 'b', { from: { name: 'Collator', kind: 'robot', verified: true } }),
    msg(3, 'c', { from: { name: 'Kim', kind: 'human' } }),
  ] }, { name: 't' });
  assert.equal((html.match(/<span class="k">verified<\/span>/g) ?? []).length, 2);
  assert.ok(html.includes('3 messages from 2 participants'));
  assert.ok(html.includes('only senders marked verified'));
  assert.ok(!html.includes('twitter:card'));
});

test('index never prints last message text (moderated text can linger there)', () => {
  assert.ok(!buildTopicIndex({ logs: [{ address: '#a', kind: 'topic', count: 3, last: { body: 'HIDDEN SPAM' } }] }).includes('HIDDEN SPAM'));
});

test('canonicalTopicName forgives case and #', () => {
  assert.equal(canonicalTopicName('#Pickleball'), 'pickleball');
  assert.equal(canonicalTopicName('%23Pickleball'), 'pickleball');
  assert.equal(canonicalTopicName('@mike'), null);
});

test('button.js default address drops query and hash; middleware keeps route noindex', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  const b = read('public/loom/button.js');
  assert.ok(b.includes('link[rel~="canonical"]') && b.includes('u.origin + u.pathname'));
  assert.ok(read('functions/_middleware.ts').includes("if (!routeSetRobots) headers.set('X-Robots-Tag', 'index, follow')"));
});
