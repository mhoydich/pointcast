#!/usr/bin/env node
/** Local review packages only; no upload, deployment or endpoint activation. */
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE_VARIANTS } from '../public/signal-atlas/site-config.mjs';
import { editionLabel, renderReviewIndex, reviewNavigationSource, reviewStyles } from './signal-atlas-review.mjs';

const REPO = fileURLToPath(new URL('../', import.meta.url));
const SOURCE = join(REPO, 'public/signal-atlas');
const INPUTS = Object.freeze([
  'index.html', 'atlas.css', 'app.mjs', 'model.mjs', 'site-config.mjs', 'manifest.json', 'participate.md',
  'practice-model.mjs', 'practice.mjs', 'practice.css', 'practice-packet.json',
  'builder-kit.zip', 'builder-kit.provenance.json',
  'art/collectible-world.webp', 'art/collectible-world-960.webp', 'art/provenance.json',
  'observatory/index.html', 'observatory/assets/app.js', 'observatory/assets/styles.css',
]);
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const within = (parent, child) => { const p = relative(parent, child); return p === '' || (!p.startsWith('..' + sep) && p !== '..' && !isAbsolute(p)); };
function replaceOne(text, pattern, replacement, label) {
  if ((text.match(new RegExp(pattern.source, 'g')) ?? []).length !== 1) throw new Error('Expected exactly one ' + label + '; review source changes');
  return text.replace(pattern, replacement);
}
function reviewHtml(source) {
  // Local, unconnected exports have no published canonical URL.
  return replaceOne(source, /<!-- atlas-release-metadata:start -->[\s\S]*?<!-- atlas-release-metadata:end -->/, '', 'release metadata block');
}
function editionHtml(source, config) {
  let text = replaceOne(source, /<title>[^<]*<\/title>/, '<title>Signal Atlas — ' + escapeHtml(editionLabel(config)) + ' preview</title>', 'title');
  text = replaceOne(text, /<a class="wordmark" href="\/">POINTCAST/, '<a class="wordmark" href="./#main" aria-label="' + escapeHtml(editionLabel(config)) + ' Signal Atlas, top">' + escapeHtml(config.brand.toUpperCase()), 'wordmark');
  text = replaceOne(text, /href="\/agent-kit\.md"/, 'href="https://pointcast.xyz/agent-kit.md"', 'agent guide');
  text = replaceOne(text, /<\/head>/, '<link rel="stylesheet" href="./review.css"><script type="module" src="./review-nav.mjs"></script>\n</head>', 'head closing tag');
  const note = config.variantId !== config.homeSiteId
    ? 'This learning edition uses the ' + SITE_VARIANTS[config.homeSiteId].brand + ' collection. It does not create a separate visit count or league score.'
    : 'This edition opens on ' + config.brand + '. The site picker explores the three parent collections.';
  return replaceOne(text, /<p class="region-note">[^<]*<\/p>/, '<p class="region-note">' + escapeHtml(note) + '</p>', 'edition note');
}
function headersFragment(path) {
  return [path.slice(0, -1), path + '*'].map(route => route + '\n' + [
    'X-Robots-Tag: noindex, nofollow', 'Referrer-Policy: no-referrer', 'Cache-Control: no-store',
    'X-Content-Type-Options: nosniff', 'Content-Security-Policy: ' + CSP,
  ].map(header => '  ' + header).join('\n')).join('\n\n') + '\n';
}
function rolloutNotes(config) {
  const hostNote = config.origin === 'https://elsegundo.xyz'
    ? 'El Segundo: coordinate desk/release locks. Add the exact namespace to netlify/lib/analytics/beacon.mjs EXCLUDE_PREFIXES before building; otherwise analytics can be injected. Preserve the existing /bots/ Visitor Center; its self-declared guestbook is not passive traffic evidence.'
    : config.variantId === 'industrynext'
      ? 'IndustryNext: preserve /communications-lab/ and verify scripts/build-client.mjs still excludes it from ad-network injection. Do not reuse private /api/agent-requests intake for enrollment.'
      : config.variantId === 'ues'
        ? 'PointCast UES: review middleware and SEO-build exclusions for /ues/signal-atlas/ and verify no sessions, ads or analytics are injected. Existing /ues/ isolation is not proof for a new static namespace. No UES-specific visits can be inferred from the retained source.'
        : 'PointCast: review the matching read-only Pages Function and middleware/SEO boundaries separately. This package includes no function, binding or endpoint activation. Without the existing authorized source, evidence remains unknown.';
  return '# ' + config.brand + ' — local review edition\n\n' +
    'Built locally, not deployed. The exporter has not rendered this package. No accounts, enrollment or standings are created.\n\n' +
    'Intended origin: ' + config.origin + '\nIntended route: ' + config.canonicalPath + '\nParent collection: ' + config.homeSiteId + '\n\n' +
    'For all five previews, serve the complete export root on loopback and open index.html. Its review bar links the editions without any public Atlas URLs. The review bar appears only on loopback under the combined bundle path; it stays absent when public/ is served alone or on a production origin. The wordmark returns to this local edition. The existing identity guide intentionally refers to PointCast. Configure a canonical trailing-slash redirect before publication, then verify it serves the page rather than a rewrite loop.\n\n' +
    (config.evidenceEndpoint ? 'Only this PointCast edition can read evidence, on its canonical origin or a loopback QA host within /signal-atlas/. The read is bounded; no write or polling endpoint is included.\n\n' : 'This edition makes no observation request, even after selecting PointCast. Visits stay unknown; fictional demos and practice receipts cannot enter standings.\n\n') +
    hostNote + '\n\n' +
    'headers.fragment is a review snippet, not a replacement for host configuration. Merge it after checking route ownership and locks. Verify the served headers and generated HTML; noindex is not access control.\n\n' +
    'Before release: run the host build, independent review and rendered desktop/mobile QA; test keyboard, storage denial, interrupted flows, reduced motion and observatory return context. Inspect requests for tracking and unexpected APIs. Repository upload and production rollout remain separate approval gates.\n\n' +
    'This package adapts the reviewed portable kit’s five-presentation/three-origin model while keeping the current runtime and quiet routes. It does not activate the Python aggregate adapter or change protocol identities.\n';
}

export async function exportAtlasEditions(destination) {
  if (typeof destination !== 'string' || !isAbsolute(destination)) throw new TypeError('Provide an explicit absolute output directory');
  const requested = resolve(destination);
  const output = join(await realpath(dirname(requested)), basename(requested));
  if (within(await realpath(REPO), output)) throw new Error('Output must be outside the source repository');
  try { await lstat(output); throw new Error('Output already exists; choose a new directory'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const root = await realpath(SOURCE);
  const sources = new Map();
  let total = 0;
  for (const input of INPUTS) {
    const path = join(root, input);
    if (!(await lstat(path)).isFile() || !within(root, await realpath(path))) throw new Error('Unsafe source input: ' + input);
    const bytes = await readFile(path);
    if ((total += bytes.length) > 5_000_000) throw new Error('Review source size before exporting more than 5 MB');
    sources.set(input, bytes);
  }
  const app = sources.get('app.mjs').toString('utf8');
  if (!app.includes("from './site-config.mjs'") || !app.includes('observationEndpoint(') || /fetch\(['"]\/api\/signal-atlas/.test(app)) throw new Error('App must use the edition endpoint boundary before export');
  const packages = [];
  for (const config of Object.values(SITE_VARIANTS)) {
    const prefix = config.variantId + '/public' + config.canonicalPath;
    const files = new Map([...sources].map(([path, bytes]) => [prefix + path, bytes]));
    files.set(prefix + 'review.css', Buffer.from(reviewStyles));
    files.set(prefix + 'review-nav.mjs', Buffer.from(reviewNavigationSource));
    files.set(prefix + 'index.html', Buffer.from(editionHtml(reviewHtml(sources.get('index.html').toString('utf8')), config)));
    files.set(prefix + 'observatory/index.html', Buffer.from(reviewHtml(sources.get('observatory/index.html').toString('utf8'))));
    files.set(prefix + 'site-config.mjs', Buffer.from(replaceOne(sources.get('site-config.mjs').toString('utf8'), /export const SITE_CONFIG = getSiteConfig\('pointcast'\);/, "export const SITE_CONFIG = getSiteConfig('" + config.variantId + "');", 'edition selection')));
    const manifest = JSON.parse(sources.get('manifest.json'));
    Object.assign(manifest, { status: 'local-review-package', editionId: config.variantId, intendedOrigin: config.origin, canonicalUrl: null,
      canonicalPath: config.canonicalPath, parentSiteId: config.homeSiteId, independentRank: false,
      builderKitDownload: config.canonicalPath + 'builder-kit.zip', builderKitProvenance: config.canonicalPath + 'builder-kit.provenance.json',
      readOnlyObservationEndpoint: config.evidenceEndpoint, participationKit: config.canonicalPath + 'participate.md', identityGuide: 'https://pointcast.xyz/agent-kit.md' });
    if (manifest.localPractice) manifest.localPractice = { ...manifest.localPractice, path: config.canonicalPath + '#practice', packet: config.canonicalPath + 'practice-packet.json' };
    if (!config.evidenceEndpoint) manifest.sites = manifest.sites.map(site => ({ ...site, adapter: null }));
    manifest.regions = [{ id: 'ues', siteId: 'pointcast', independentRank: false }, { id: 'el-segundo-university', siteId: 'el-segundo', independentRank: false }];
    files.set(prefix + 'manifest.json', Buffer.from(json(manifest)));
    let kit = sources.get('participate.md').toString('utf8');
    if (!config.evidenceEndpoint) kit = kit.replace('- Inspect a read-only, privacy-minimized projection of PointCast\'s existing retained log when its binding is available.', '- This edition has no connected observation source. Visits and collection totals remain unknown.');
    kit += '\n## This local edition\n\n' + config.brand + ' · parent collection: ' + config.homeSiteId + '. ' + config.disconnectedNote + '\n\nIntended preview route: ' + config.canonicalPath + '. Not deployed; no additional league account or enrollment exists.\n';
    files.set(prefix + 'participate.md', Buffer.from(kit));
    files.set(config.variantId + '/README.md', Buffer.from(rolloutNotes(config)));
    files.set(config.variantId + '/headers.fragment', Buffer.from(headersFragment(config.canonicalPath)));
    packages.push({ config, files });
  }
  // Exclusive mkdir prevents overwrites. Failed writes leave an inspectable partial export.
  await mkdir(output);
  const hashes = {};
  for (const [path, bytes] of [['index.html', Buffer.from(renderReviewIndex(Object.values(SITE_VARIANTS)))], ['review.css', Buffer.from(reviewStyles)]]) {
    await writeFile(join(output, path), bytes, { flag: 'wx' }); hashes[path] = digest(bytes);
  }
  for (const { files } of packages) for (const [path, bytes] of files) {
    const target = join(output, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes, { flag: 'wx' });
    hashes[path] = digest(bytes);
  }
  const manifest = { schema: 'signal-atlas.local-edition-export/v1', status: 'local-only-not-deployed', browserRendered: false,
    reviewEntrypoint: 'index.html', editions: packages.map(({ config }) => ({ id: config.variantId, parentSiteId: config.homeSiteId, entrypoint: config.variantId + '/public' + config.canonicalPath, intendedOrigin: config.origin, evidenceConnected: false })),
    generatorHashes: { 'scripts/signal-atlas-export.mjs': digest(await readFile(new URL('./signal-atlas-export.mjs', import.meta.url))), 'scripts/signal-atlas-review.mjs': digest(await readFile(new URL('./signal-atlas-review.mjs', import.meta.url))) },
    sourceHashes: Object.fromEntries([...sources].map(([path, bytes]) => [path, digest(bytes)])), fileHashes: hashes };
  await writeFile(join(output, 'manifest.json'), json(manifest), { flag: 'wx' });
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(resolve(process.argv[1]))).href) {
  if (process.argv.length !== 3) { console.error('Usage: node scripts/signal-atlas-export.mjs /absolute/new/output-directory'); process.exitCode = 1; }
  else try { const result = await exportAtlasEditions(process.argv[2]); console.log('Created ' + result.editions.length + ' local review editions; no upload or deployment.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
