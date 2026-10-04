/**
 * Package already-compiled public home + Hoydich output for browser QA.
 * Run after the exact-head full build and generated-output checks:
 *   node scripts/package-hoydich-qa.mjs --expected-head "$PR_HEAD"
 * No build, network request, browser launch, or backend/static-navigation crawl.
 */
import * as fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const ORIGIN = 'https://pointcast.xyz';
const PAGE_FILES = ['index.html', 'hoydich/index.html', 'hoydich.json'];
const STATIC_EXTENSIONS = /\.(?:css|m?js|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|ico|mp3|ogg|wav|mp4|webm|wasm|json|txt)$/i;
const FORBIDDEN = /^(?:api|og|_worker\.js|_server|server|functions|auth|account|accounts|session|sessions|task|tasks|desk|venues|financial|finance|wallet|wallets|me|my-ai)(?:\/|$)/i;
const MAX_FILES = 5000;
const MAX_BYTES = 200 * 1024 * 1024;

async function fileHash(file) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}

function cssReferences(text) {
  const references = [];
  for (const match of text.matchAll(/\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) references.push(match[1] ?? match[2] ?? match[3]);
  for (const match of text.matchAll(/@import\s+["']([^"']+)["']/gi)) references.push(match[1]);
  return references;
}

// URL tokenization follows the HTML srcset token boundary: URLs end at ASCII
// whitespace, with trailing commas separating candidates. Embedded commas in a
// data URL stay inside its URL token; data URLs are never copied.
function srcsetReferences(value) {
  const urls = [];
  let position = 0;
  while (position < value.length) {
    while (position < value.length && /[\s,]/.test(value[position])) position += 1;
    const start = position;
    while (position < value.length && !/\s/.test(value[position])) position += 1;
    let url = value.slice(start, position);
    if (!url) break;
    if (url.endsWith(',')) { url = url.replace(/,+$/, ''); if (url) urls.push(url); continue; }
    urls.push(url);
    let parentheses = 0;
    while (position < value.length) {
      const char = value[position++];
      if (char === '(') parentheses += 1;
      else if (char === ')') parentheses = Math.max(0, parentheses - 1);
      else if (char === ',' && parentheses === 0) break;
    }
  }
  return urls;
}

async function sourceArtworks(repository) {
  const collection = JSON.parse(await fs.readFile(path.join(repository, 'src/data/home-visit-views.json'), 'utf8'));
  const { HOME_SHARE_EDITIONS } = await import(pathToFileURL(path.join(repository, 'src/lib/home-share-editions.mjs')).href);
  if (collection.views.length !== 6 || HOME_SHARE_EDITIONS.length !== 6) throw new Error('Expected six visitor views and six share editions in source');
  const visitor = collection.views.map(view => {
    const edition = HOME_SHARE_EDITIONS.find(edition => edition.slug === view.id);
    if (!edition) throw new Error('Missing source edition for visitor view: ' + view.id);
    return `/images/home-visit/2026-10/${String(edition.number).padStart(2, '0')}-${edition.slug}.webp`;
  });
  const share = HOME_SHARE_EDITIONS.map(edition => edition.imagePath);
  if (new Set(visitor).size !== 6 || new Set(share).size !== 6 || visitor.some(url => !/^\/images\/home-visit\/2026-10\/[^/]+\.webp$/.test(url)) || share.some(url => !/^\/images\/home-share\/2026-10\/[^/]+\.png$/.test(url))) throw new Error('Unexpected source artwork paths');
  return { visitor, share };
}

export async function packageCompiledQA({ repository, sourceDirectory, outputDirectory, metadata, JSDOM, artworks, maxBytes = MAX_BYTES, maxFiles = MAX_FILES }) {
  const dist = await fs.realpath(path.resolve(sourceDirectory));
  const out = path.resolve(outputDirectory);
  if (out === dist || out.startsWith(dist + path.sep) || dist.startsWith(out + path.sep)) throw new Error('Output and dist must be separate directories');
  const existing = await fs.readdir(out).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));
  if (existing.length) throw new Error('Artifact output must be empty');
  const recorded = new Map();
  const queue = [];
  const cssQueue = [];
  const external = new Set();
  const excludedRuntime = new Set();
  let totalBytes = 0;

  async function include(value, from = 'index.html', required = true) {
    value = String(value ?? '').trim();
    if (!value || value.startsWith('#') || /^(?:data|blob|mailto|tel|javascript):/i.test(value)) return;
    const url = new URL(value.startsWith('_astro/') ? '/' + value : value, `${ORIGIN}/${from}`);
    if (url.origin !== ORIGIN) { external.add(url.href); return; }
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (relative.split('/').some(part => part === '..' || part.startsWith('.')) || relative.includes('\\')) throw new Error('Unsafe artifact reference: ' + relative);
    if (FORBIDDEN.test(relative)) { excludedRuntime.add(relative); if (required) throw new Error('Required asset is a private/runtime path: ' + relative); return; }
    if (!PAGE_FILES.includes(relative) && !relative.startsWith('_astro/') && !STATIC_EXTENSIONS.test(relative)) return;
    if (recorded.has(relative)) return;
    const candidate = path.resolve(dist, relative);
    if (!candidate.startsWith(dist + path.sep)) throw new Error('Artifact reference escapes dist');
    let physical;
    try { physical = await fs.realpath(candidate); }
    catch (error) { if (error.code !== 'ENOENT' || required) throw error; return; }
    const physicalRelative = path.relative(dist, physical).split(path.sep).join('/');
    if (!physical.startsWith(dist + path.sep) || physicalRelative.split('/').some(part => part.startsWith('.')) || FORBIDDEN.test(physicalRelative)) throw new Error('Artifact symlink escapes public output: ' + relative);
    const stat = await fs.stat(physical);
    if (!stat.isFile()) throw new Error('Artifact reference is not a file: ' + relative);
    if (recorded.size + 1 > maxFiles || totalBytes + stat.size > maxBytes) throw new Error(`Artifact exceeds bounded budget (${maxFiles} files / ${maxBytes} bytes)`);
    totalBytes += stat.size;
    recorded.set(relative, { path: relative, physical, bytes: stat.size });
    queue.push(relative);
  }

  for (const relative of PAGE_FILES) await include('/' + relative);
  const astro = path.join(dist, '_astro');
  async function includeAstro(directory, prefix = '_astro') {
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) throw new Error('Hidden file in compiled _astro output');
      if (entry.isDirectory()) await includeAstro(path.join(directory, entry.name), `${prefix}/${entry.name}`);
      else await include(`/${prefix}/${entry.name}`);
    }
  }
  await includeAstro(astro);
  if (![...recorded.keys()].some(relative => relative.startsWith('_astro/'))) throw new Error('Compiled _astro output is empty');

  const homeVisitImages = [];
  for (const file of ['index.html', 'hoydich/index.html']) {
    const document = new JSDOM(await fs.readFile(path.join(dist, file), 'utf8')).window.document;
    for (const node of document.querySelectorAll('script[src], img[src], source[src], video[poster], audio[src], video[src], track[src], link[href]')) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'link' && !/\b(stylesheet|preload|modulepreload|icon)\b/i.test(node.getAttribute('rel') || '')) continue;
      const value = node.getAttribute(tag === 'link' ? 'href' : tag === 'video' && node.hasAttribute('poster') ? 'poster' : 'src');
      await include(value, file);
      if (tag === 'link' && /\bstylesheet\b/i.test(node.getAttribute('rel') || '') && value) cssQueue.push({ value, from: file });
      if (tag === 'video' && node.hasAttribute('poster') && node.hasAttribute('src')) await include(node.getAttribute('src'), file);
    }
    for (const node of document.querySelectorAll('[srcset]')) for (const value of srcsetReferences(node.getAttribute('srcset'))) await include(value, file);
    for (const node of document.querySelectorAll('style, [style]')) for (const value of cssReferences(node.tagName.toLowerCase() === 'style' ? node.textContent : node.getAttribute('style'))) await include(value, file);
    if (file === 'index.html') homeVisitImages.push(...[...document.querySelectorAll('[data-home-visit-view] img')].map(node => new URL(node.getAttribute('src'), ORIGIN).pathname));
    document.defaultView.close();
  }
  if (homeVisitImages.length !== 6 || new Set(homeVisitImages).size !== 6 || homeVisitImages.some(url => !artworks.visitor.includes(url))) throw new Error('Compiled homepage does not contain the six source-declared visitor artworks');
  for (const value of [...artworks.visitor, ...artworks.share]) await include(value);

  // Only follow CSS used by the two pages. Scanning all unrelated JS literals or
  // all scoped CSS chunks would pull other public pages' media into this subset.
  const visitedCSS = new Set();
  for (let index = 0; index < cssQueue.length; index++) {
    const { value, from } = cssQueue[index];
    const url = new URL(value, `${ORIGIN}/${from}`);
    if (url.origin !== ORIGIN) continue;
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (visitedCSS.has(relative)) continue;
    visitedCSS.add(relative);
    const record = recorded.get(relative);
    if (!record) throw new Error('Stylesheet was not staged: ' + relative);
    for (const dependency of cssReferences(await fs.readFile(record.physical, 'utf8'))) {
      await include(dependency, relative);
      if (/\.css(?:[?#]|$)/i.test(dependency)) cssQueue.push({ value: dependency, from: relative });
    }
  }

  await fs.mkdir(out, { recursive: true });
  const files = [];
  for (const relative of queue) {
    const record = recorded.get(relative);
    const target = path.join(out, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(record.physical, target);
    const copiedBytes = (await fs.stat(target)).size;
    if (copiedBytes !== record.bytes) throw new Error('Compiled asset changed while packaging: ' + relative);
    files.push({ path: relative, bytes: copiedBytes, sha256: await fileHash(target) });
  }
  files.sort((a,b) => a.path.localeCompare(b.path));
  const manifest = { ...metadata, scope: 'Already-compiled public homepage, Hoydich page and snapshot, all compiled _astro chunks, declared HTML/srcset/style dependencies, and the six visitor plus six share artworks. Navigation destination pages and backend/private runtime routes are not included. No external resources were fetched. Full-build success is a separate CI gate.', pages: PAGE_FILES, artwork: artworks, files, bytes: files.reduce((sum,file) => sum + file.bytes, 0), externalReferences: [...external].sort(), excludedRuntime: [...excludedRuntime].sort(), budgets: { maxFiles, maxBytes } };
  await fs.writeFile(path.join(out, 'hoydich-qa-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

async function selfTest(JSDOM) {
  const temp = await fs.mkdtemp('/tmp/hoydich-qa-package-fixture-');
  const dist = path.join(temp, 'dist');
  const artwork = { visitor: Array.from({length:6},(_,i) => `/images/home-visit/2026-10/${i+1}.webp`), share: Array.from({length:6},(_,i) => `/images/home-share/2026-10/${i+1}.png`) };
  const write = async (relative, text='fixture') => { const file=path.join(dist,relative);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,text); };
  try {
    await write('index.html', `<link rel="stylesheet" href="/_astro/home.css"><script type="module" src="/_astro/home.js"></script><a href="/account/">Unchanged public navigation</a><img src="/images/direct.svg?version=1"><img srcset="/images/small.webp 1x, /images/large.webp 2x"><img src="https://example.test/external.webp">${artwork.visitor.map(url=>`<article data-home-visit-view><img src="${url}"></article>`).join('')}`);
    await write('hoydich/index.html','<img src="../images/direct.svg"><link rel="stylesheet" href="/_astro/hoydich.css"><a href="/unrelated/">Navigation</a>');
    await write('hoydich.json','{"fixture":true}');
    await write('_astro/home.css','@import "./nested.css"; body {background:url("../images/css.svg")}');
    await write('_astro/nested.css','@font-face {src:url("./font.woff2")}');
    await write('_astro/hoydich.css','body{color:black}');
    await write('_astro/font.woff2');await write('_astro/home.js','import("./dynamic.js");');await write('_astro/dynamic.js','export const fixture=true;');
    for(const url of [...artwork.visitor,...artwork.share,'/images/direct.svg','/images/small.webp','/images/large.webp','/images/css.svg'])await write(url.slice(1));
    await write('account/index.html','private fixture, must not be copied');await write('unrelated/index.html','unrelated fixture');await write('images/unrelated.png');
    const options={sourceDirectory:dist,outputDirectory:path.join(temp,'artifact'),metadata:{head:'a'.repeat(40),tree:'b'.repeat(40)},JSDOM,artworks:artwork};
    const manifest=await packageCompiledQA(options);const included=manifest.files.map(file=>file.path);
    assert.ok(included.includes('_astro/dynamic.js'));assert.ok(included.includes('_astro/font.woff2'));assert.ok(included.includes('images/large.webp'));assert.ok(included.includes('images/css.svg'));
    assert.ok(artwork.share.every(url=>included.includes(url.slice(1))));assert.ok(!included.includes('account/index.html'));assert.ok(!included.includes('unrelated/index.html'));assert.ok(!included.includes('images/unrelated.png'));
    for(const file of manifest.files)assert.equal(file.sha256,await fileHash(path.join(options.outputDirectory,file.path)));
    await fs.rm(path.join(dist,'images/large.webp'));
    await assert.rejects(packageCompiledQA({...options,outputDirectory:path.join(temp,'missing')}),/ENOENT/);
    await write('images/large.webp');await write('hoydich/index.html','<img src="/account/private.png">');
    await assert.rejects(packageCompiledQA({...options,outputDirectory:path.join(temp,'private')}),/private\/runtime/);
    await write('hoydich/index.html','<img src="/images/direct.svg">');
    await assert.rejects(packageCompiledQA({...options,outputDirectory:path.join(temp,'budget'),maxBytes:32}),/budget/);
    console.log('Packaging fixtures passed: dynamic chunk, srcset/query/relative CSS/font dependencies, twelve declared artworks, hashes, navigation exclusion, missing asset, private dependency, and byte budget.');
  } finally {await fs.rm(temp,{recursive:true,force:true});}
}

async function main() {
  const args=process.argv.slice(2);
  const readArg=(name,fallback)=>{const index=args.indexOf(name);return index<0?fallback:args[index+1];};
  const repository=path.resolve(readArg('--repo',process.cwd()));
  const dependencies=path.resolve(readArg('--deps-root',repository));
  const { JSDOM }=createRequire(path.join(dependencies,'package.json'))('jsdom');
  if(args.includes('--self-test')){await selfTest(JSDOM);return;}
  const git=(...args)=>execFileSync('git',args,{cwd:repository,encoding:'utf8'}).trim();
  const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
  const expected=readArg('--expected-head',process.env.HOYDICH_QA_EXPECTED_HEAD);
  if(!expected||!/^[a-f0-9]{40}$/.test(expected)||expected!==head)throw new Error('Supply the exact 40-character CI checkout head with --expected-head');
  if(git('status','--porcelain','--untracked-files=no'))throw new Error('Tracked source changed after checkout; artifact provenance is not exact');
  const manifest=await packageCompiledQA({repository,sourceDirectory:readArg('--dist',path.join(repository,'dist')),outputDirectory:readArg('--out',path.join(repository,'.qa/hoydich-compiled')),metadata:{head,tree},JSDOM,artworks:await sourceArtworks(repository)});
  if(git('rev-parse','HEAD')!==head||git('rev-parse','HEAD^{tree}')!==tree||git('status','--porcelain','--untracked-files=no'))throw new Error('Source changed during artifact packaging');
  console.log(JSON.stringify({head,tree,files:manifest.files.length,bytes:manifest.bytes,pages:manifest.pages,visitorArtworks:manifest.artwork.visitor.length,shareArtworks:manifest.artwork.share.length}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) await main();
