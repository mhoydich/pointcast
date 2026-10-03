import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const json = async path => JSON.parse(await read(path));
const base = 'https://pointcast.xyz';
const slugs = ['cleaner-backhands', 'smarter-mixed-doubles'];
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks++; }
const home = new JSDOM(await read('dist/pickleball/home/index.html')).window.document;
check(home.querySelectorAll('main').length === 1, 'home must have one main landmark');
check(home.querySelectorAll('[data-pickleball-v2]').length === 1, 'one v2 practice desk');
check(home.querySelectorAll('.pb-lesson').length === 12, 'preserve twelve existing lessons');
check(home.querySelectorAll('.pb-drill').length === 8, 'preserve eight existing drills');
check(home.querySelectorAll('[data-court-card]').length === 11, 'preserve sourced court directory');
check(home.querySelectorAll('[data-learning-panel][hidden]').length === 0, 'all lessons visible before enhancement');
for (const anchor of ['learn', 'gear', 'pb-courts', 'pb-practice', 'pb-v2-planner', 'pb-v2-scorecard', 'pb-v2-articles']) check(home.getElementById(anchor), `preserve ${anchor}`);
const ids = [...home.querySelectorAll('[id]')].map(element => element.id);
check(new Set(ids).size === ids.length, 'unique home IDs');
check(home.querySelectorAll('[data-v2-enhanced-only]:not([hidden])').length === 0, 'interactive controls hidden without JS');
check(home.querySelector('[data-v2-plan] .v2-plan-blocks').children.length > 0, 'ready practice is static');
check(home.querySelectorAll('.v2-static-grid>div').length === 2, 'two more static practices');
check(home.querySelectorAll('textarea').length === 1 && home.querySelector('[data-v2-scorecard] button[type="submit"]'), 'scorecard controls remain outside textarea');
check(home.querySelector('meta[name="author"]').content === 'PointCast Editorial', 'home editorial attribution');
check(home.querySelector('link[rel="canonical"]').href === `${base}/pickleball/home/`, 'home canonical');
check((await read('dist/pickleball/index.html')).includes('THE PICKLEBALL BOARD'), 'original board exists');

const feed = await json('dist/pickleball/home.json');
assert.deepEqual(feed.learning, await json('src/lib/pickleball-home/learning.json')); checks++;
assert.deepEqual(feed.courts, await json('src/lib/pickleball-home/courts.json')); checks++;
check(feed.v2.version === '2.0' && feed.v2.articles.length === 2, 'v2 public feed');
check(feed.v2.scorecard.publicAPI === false && feed.v2.scorecard.accountSync === false && !('entries' in feed.v2.scorecard), 'scorecard data is not a public API');
const manifest = await json('src/lib/pickleball-home/shared-version.json');
for (const [file, digest] of Object.entries(manifest.files)) {
  const bytes = await readFile(new URL(`src/lib/pickleball-home/${file}`, root));
  check(createHash('sha256').update(bytes).digest('hex') === digest, `unchanged canonical shared ${file}`);
}
check(manifest.version === '1-9aa7f7903e25', 'preserved shared version');

const agents = await json('dist/agents.json');
const discovery = await read('dist/sitemap-discovery.xml');
const llms = await read('public/llms.txt');
const fullLlms = await read('public/llms-full.txt');
const agentPage = await read('dist/for-agents/index.html');
for (const slug of slugs) {
  const path = `/pickleball/articles/${slug}`;
  const document = new JSDOM(await read(`dist${path}/index.html`)).window.document;
  check(document.querySelectorAll('main').length === 1 && document.querySelectorAll('h1').length === 1, `${slug}: one main and title`);
  check(document.querySelector('link[rel="canonical"]').href === `${base}${path}/`, `${slug}: canonical`);
  check(document.querySelector('link[rel="alternate"][type="application/json"]').getAttribute('href') === `${path}.json`, `${slug}: head JSON alternate`);
  check(document.querySelector('meta[name="author"]').content === 'PointCast Editorial' && document.querySelector('meta[name="creator"]').content === 'PointCast Editorial', `${slug}: editorial metadata`);
  const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent));
  const articleSchema = schemas.flatMap(value => value['@graph'] || [value]).find(value => value['@type'] === 'Article');
  check(articleSchema?.author?.name === 'PointCast Editorial' && articleSchema?.publisher?.name === 'PointCast', `${slug}: Article author and publisher`);
  const article = document.querySelector('article');
  check(article && article.textContent.trim().split(/\s+/).length >= 650, `${slug}: full readable article`);
  check(document.querySelectorAll('article img').length >= 3, `${slug}: complete original diagrams`);
  const imageUrl = new URL(document.querySelector('meta[property="og:image"]').content);
  check(imageUrl.pathname === `/images/pickleball-v2/${slug}.webp`, `${slug}: raster social card`);
  const publicData = await json(`dist${path}.json`);
  check(publicData.slug === slug || publicData.article?.slug === slug, `${slug}: JSON twin`);
  for (const image of document.querySelectorAll('article img')) {
    check(image.alt.length > 15, `${slug}: descriptive image alt`);
    const src = image.getAttribute('src');
    check(src.startsWith('/images/pickleball-v2/') && (await stat(new URL(`dist${src}`, root))).size > 0, `${slug}: built diagram`);
  }
  for (const value of [`${base}${path}/`, `${base}${path}.json`]) {
    check(Object.values(agents.endpoints.current.human).includes(value) || Object.values(agents.endpoints.current.json).includes(value), `${slug}: current registry ${value}`);
  }
  check(discovery.includes(path) && discovery.includes(`${path}.json`), `${slug}: sitemap`);
  check(llms.includes(path) && fullLlms.includes(path) && agentPage.includes(path), `${slug}: LLM and human discovery`);
}
const originalHome = new JSDOM(await read('dist/index.html')).window.document;
check(originalHome.querySelector('meta[name="author"]').content === 'Mike Hoydich', 'default site author preserved');
console.log(`Pickleball v2 compiled audit: ${checks} checks passed; original board, shared mirror, static practices, articles, metadata and discovery verified.`);
