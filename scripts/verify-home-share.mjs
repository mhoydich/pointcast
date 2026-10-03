import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { HOME_SHARE_EDITIONS, HOME_SHARE_CANONICAL, homeShareEditionForDate } from '../src/lib/home-share-editions.mjs';

const dist = resolve(process.argv.find((arg) => arg.startsWith('--dist='))?.slice(7) ?? 'dist');
const base = process.argv.find((arg) => arg.startsWith('--base='))?.slice(7);
const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [match[1], decode(match[2])]));
const head = (html) => {
  const source = html.split('</head>')[0];
  const meta = new Map([...source.matchAll(/<meta\b[^>]*>/gi)].map((match) => attrs(match[0])).filter((tag) => tag.property || tag.name).map((tag) => [tag.property ?? tag.name, tag.content]));
  const canonicals = [...source.matchAll(/<link\b[^>]*>/gi)].map((match) => attrs(match[0])).filter((tag) => tag.rel === 'canonical');
  assert.equal(canonicals.length, 1, 'one canonical link');
  return { meta, canonical: canonicals[0].href };
};
const verifyHead = (html, edition, canonical) => {
  const parsed = head(html);
  assert.equal(parsed.canonical, canonical);
  assert.equal(parsed.meta.get('og:url'), canonical);
  assert.equal(parsed.meta.get('og:image'), edition.imageUrl);
  assert.equal(parsed.meta.get('og:image:secure_url'), edition.imageUrl);
  assert.equal(parsed.meta.get('twitter:image'), edition.imageUrl);
  assert.equal(parsed.meta.get('og:image:alt'), edition.alt);
  assert.equal(parsed.meta.get('twitter:image:alt'), edition.alt);
  assert.equal(parsed.meta.get('og:image:type'), 'image/png');
  assert.equal(parsed.meta.get('og:image:width'), '1200');
  assert.equal(parsed.meta.get('og:image:height'), '630');
  assert.equal(parsed.meta.get('twitter:card'), 'summary_large_image');
  assert.equal(parsed.meta.get('og:title'), parsed.meta.get('twitter:title'));
  assert.equal(parsed.meta.get('og:description'), parsed.meta.get('twitter:description'));
  assert.ok(parsed.meta.get('og:description').length > 20);
  return parsed;
};

verifyHead(await readFile(resolve(dist, 'index.html'), 'utf8'), HOME_SHARE_EDITIONS[0], HOME_SHARE_CANONICAL);
for (const edition of HOME_SHARE_EDITIONS) {
  const html = await readFile(resolve(dist, edition.path.slice(1), 'index.html'), 'utf8');
  verifyHead(html, edition, edition.url);
  const source = await readFile(new URL(`../public${edition.imagePath}`, import.meta.url));
  const built = await readFile(resolve(dist, edition.imagePath.slice(1)));
  assert.deepEqual(built, source, `${edition.id}: build preserves original delivery bytes`);
}

const evidence = { editions: HOME_SHARE_EDITIONS.length, builtMetadata: 'passed', crawlerMetadata: 'not run', images: [] };
if (base) {
  const daily = homeShareEditionForDate(new Date());
  const summaries = [];
  for (const ua of ['Mozilla/5.0', 'Twitterbot/1.0', 'facebookexternalhit/1.1', 'Slackbot-LinkExpanding 1.0']) {
    const response = await fetch(new URL('/', base), { headers: { 'user-agent': ua, accept: 'text/html' } });
    assert.equal(response.status, 200, ua);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    const parsed = verifyHead(await response.text(), daily, HOME_SHARE_CANONICAL);
    summaries.push(JSON.stringify([...parsed.meta].filter(([key]) => key.startsWith('og:') || key.startsWith('twitter:'))));
  }
  assert.equal(new Set(summaries).size, 1, 'human and social crawlers receive the same metadata');
  const rootHead = await fetch(new URL('/', base), { method: 'HEAD', headers: { accept: 'text/html', 'user-agent': 'Twitterbot/1.0' } });
  assert.equal(rootHead.status, 200, 'root HEAD');
  assert.match(rootHead.headers.get('content-type'), /^text\/html/);
  assert.equal(rootHead.headers.get('x-pointcast-home-edition'), daily.id);
  assert.match(rootHead.headers.get('cache-control'), /no-store/, 'the root preserves the existing no-store policy');
  assert.equal(rootHead.headers.get('etag'), null);
  const conditional = await fetch(new URL('/', base), { headers: { accept: 'text/html', 'if-none-match': '*', 'if-modified-since': 'Wed, 31 Dec 2099 23:59:59 GMT' } });
  assert.equal(conditional.status, 200, 'the home selects its edition before stale static validators can return 304');
  verifyHead(await conditional.text(), daily, HOME_SHARE_CANONICAL);
  for (const edition of HOME_SHARE_EDITIONS) {
    const page = await fetch(new URL(edition.path, base), { headers: { 'user-agent': 'Twitterbot/1.0', accept: 'text/html' } });
    assert.equal(page.status, 200, edition.path);
    verifyHead(await page.text(), edition, edition.url);
    const imageUrl = new URL(edition.imageUrl);
    const localImage = new URL(imageUrl.pathname + imageUrl.search, base);
    const response = await fetch(localImage);
    assert.equal(response.status, 200, edition.id);
    assert.match(response.headers.get('content-type'), /^image\/png/);
    assert.match(response.headers.get('cache-control'), /immutable/);
    assert.doesNotMatch(response.headers.get('cache-control'), /no-store/);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(bytes, await readFile(resolve(dist, edition.imagePath.slice(1))));
    const probe = await fetch(localImage, { method: 'HEAD' });
    assert.equal(probe.status, 200, `${edition.id}: HEAD`);
    assert.match(probe.headers.get('content-type'), /^image\/png/);
    evidence.images.push({ edition: edition.id, status: 200, mime: response.headers.get('content-type'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), cache: response.headers.get('cache-control') });
  }
  evidence.crawlerMetadata = 'passed: normal, X, Facebook, Slack, root HEAD/no-store and conditional root requests';
}
console.log(JSON.stringify(evidence, null, 2));
