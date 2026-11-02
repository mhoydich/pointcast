import test from 'node:test';
import assert from 'node:assert/strict';
import { SITE_CONFIG, SITE_VARIANTS, getSiteConfig, observationEndpoint } from '../public/signal-atlas/site-config.mjs';
import { SITES, disconnected, demoSnapshot } from '../public/signal-atlas/model.mjs';
import { exportAtlasEditions } from '../scripts/signal-atlas-export.mjs';
import { createHash } from 'node:crypto';
import { access, lstat, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { spawnSync } from 'node:child_process';

const repo = fileURLToPath(new URL('../', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('preview CLI runs through a symlinked absolute path instead of silently exiting', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-preview-cli-'));
  try {
    const entry = join(dir, 'preview.mjs');
    await symlink(join(repo, 'scripts/signal-atlas-preview.mjs'), entry);
    const result = spawnSync(process.execPath, [entry], { encoding: 'utf8', timeout: 5000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage: node scripts\/signal-atlas-preview\.mjs/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('export CLI creates and validates output through an absolute /tmp symlink path', async () => {
  const dir = await mkdtemp('/tmp/atlas-export-cli-');
  try {
    const entry = join(dir, 'export.mjs');
    const output = join(dir, 'editions');
    await symlink(join(repo, 'scripts/signal-atlas-export.mjs'), entry);
    const invoke = args => spawnSync(process.execPath, [entry, ...args], { cwd: dir, encoding: 'utf8', timeout: 5000 });
    const invalid = invoke([]);
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Usage: node scripts\/signal-atlas-export\.mjs/);
    const result = invoke([output]);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Created 5 local review editions/);
    const bytes = await readFile(join(output, 'manifest.json'));
    const manifest = JSON.parse(bytes);
    assert.equal(manifest.editions.length, 5);
    for (const [path, hash] of Object.entries(manifest.fileHashes)) {
      assert.equal(sha256(await readFile(join(output, path))), hash, path);
    }
    const again = invoke([output]);
    assert.equal(again.status, 1);
    assert.match(again.stderr, /already exists/);
    assert.deepEqual(await readFile(join(output, 'manifest.json')), bytes);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('export rejects existing and source-tree destinations without overwriting bytes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-export-boundary-'));
  try {
    await assert.rejects(exportAtlasEditions('relative-output'), /absolute/);
    await assert.rejects(exportAtlasEditions(join(repo, 'must-not-exist')), /outside/);
    const occupied = join(dir, 'occupied');
    await writeFile(occupied, 'keep this');
    await assert.rejects(exportAtlasEditions(occupied), /already exists/);
    assert.equal(await readFile(occupied, 'utf8'), 'keep this');
    const linked = join(dir, 'source-link');
    await symlink(repo, linked, 'dir');
    await assert.rejects(exportAtlasEditions(join(linked, 'must-not-exist')), /outside/);
    await assert.rejects(exportAtlasEditions(dir), /already exists/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('five exports preserve art, links and parents, disable other-site evidence and reproduce byte hashes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-export-'));
  try {
    const first = join(dir, 'first');
    const manifest = await exportAtlasEditions(first);
    assert.deepEqual(await exportAtlasEditions(join(dir, 'second')), manifest);
    assert.equal(manifest.editions.length, 5);
    assert.equal(manifest.reviewEntrypoint, 'index.html');
    assert.equal(manifest.browserRendered, false);
    assert.equal(new Set(manifest.editions.map(row => row.parentSiteId)).size, 3);
    for (const [path, hash] of Object.entries(manifest.sourceHashes)) assert.equal(sha256(await readFile(join(repo, 'public/signal-atlas', path))), hash, 'source unchanged: ' + path);
    for (const [path, hash] of Object.entries(manifest.fileHashes)) assert.equal(sha256(await readFile(join(first, path))), hash, 'export integrity: ' + path);
    for (const [path, hash] of Object.entries(manifest.generatorHashes)) assert.equal(sha256(await readFile(join(repo, path))), hash, 'generator integrity: ' + path);
    const launcher = new JSDOM(await readFile(join(first, 'index.html'), 'utf8')).window.document;
    const launchLinks = [...launcher.querySelectorAll('.review-card a')];
    assert.equal(launchLinks.length, 5);
    assert.equal(new Set(launchLinks.map(link => link.getAttribute('aria-label'))).size, 5);
    for (const link of launchLinks) {
      assert.ok(link.getAttribute('href').startsWith('./'));
      await access(resolve(first, link.getAttribute('href'), 'index.html'));
    }
    for (const config of Object.values(SITE_VARIANTS)) {
      const packageRoot = join(first, config.variantId);
      const publicRoot = join(packageRoot, 'public');
      const route = join(publicRoot, config.canonicalPath.slice(1));
      const actual = await import(pathToFileURL(join(route, 'site-config.mjs')).href);
      const navigation = await import(pathToFileURL(join(route, 'review-nav.mjs')).href);
      const combinedPath = '/review/' + config.variantId + '/public' + config.canonicalPath;
      const local = 'http://127.0.0.1:57100';
      assert.equal(navigation.reviewContext(local + combinedPath, local + combinedPath + 'review-nav.mjs').launcherUrl, local + '/review/index.html');
      assert.equal(navigation.reviewContext(local + combinedPath + 'index.html', local + combinedPath + 'review-nav.mjs').launcherUrl, local + '/review/index.html');
      for (const origin of [config.origin, 'https://example.invalid', 'http://localhost.evil.invalid']) {
        assert.equal(navigation.reviewContext(origin + combinedPath, origin + combinedPath + 'review-nav.mjs'), null);
      }
      assert.equal(navigation.reviewContext(local + config.canonicalPath, local + config.canonicalPath + 'review-nav.mjs'), null);
      assert.equal(actual.SITE_CONFIG.variantId, config.variantId);
      assert.equal(actual.SITE_CONFIG.homeSiteId, config.homeSiteId);
      if (config.variantId !== 'pointcast') assert.equal(actual.observationEndpoint('pointcast', 'https://pointcast.xyz/signal-atlas/'), null);
      const metadata = JSON.parse(await readFile(join(route, 'manifest.json'), 'utf8'));
      assert.equal(metadata.canonicalUrl, null);
      assert.equal(metadata.readOnlyObservationEndpoint, config.evidenceEndpoint);
      assert.equal(metadata.parentSiteId, config.homeSiteId);
      assert.equal(metadata.participationKit, config.canonicalPath + 'participate.md');
      assert.equal(metadata.builderKitDownload, config.canonicalPath + 'builder-kit.zip');
      assert.equal(metadata.builderKitProvenance, config.canonicalPath + 'builder-kit.provenance.json');
      assert.equal(sha256(await readFile(join(route, 'builder-kit.zip'))), manifest.sourceHashes['builder-kit.zip']);
      assert.equal(metadata.identityGuide, 'https://pointcast.xyz/agent-kit.md');
      assert.equal(metadata.submissionEndpoint, null);
      assert.equal(metadata.localPractice.path, config.canonicalPath + '#practice');
      assert.equal(metadata.localPractice.packet, config.canonicalPath + 'practice-packet.json');
      assert.equal(metadata.localPractice.eligibleForStandings, false);
      assert.ok(metadata.regions.every(region => region.independentRank === false));
      if (!config.evidenceEndpoint) assert.ok(metadata.sites.every(site => site.adapter === null));
      for (const asset of ['art/collectible-world.webp', 'art/collectible-world-960.webp', 'art/provenance.json']) assert.equal(sha256(await readFile(join(route, asset))), manifest.sourceHashes[asset]);
      const headers = await readFile(join(packageRoot, 'headers.fragment'), 'utf8');
      assert.ok(headers.includes(config.canonicalPath + '*'));
      assert.match(headers, /noindex, nofollow/);
      assert.match(headers, /connect-src 'self'/);
      for (const page of ['index.html', 'observatory/index.html']) {
        const pagePath = join(route, page);
        const document = new JSDOM(await readFile(pagePath, 'utf8')).window.document;
        if (page === 'index.html') assert.equal(document.querySelector('.wordmark').getAttribute('href'), './#main');
        assert.equal(document.querySelector('meta[name="robots"]').content, 'noindex,nofollow');
        for (const element of document.querySelectorAll('[href],[src]')) {
          const value = element.getAttribute('href') ?? element.getAttribute('src');
          if (!value || /^(#|\/|https?:)/.test(value)) continue;
          const linked = resolve(dirname(pagePath), value.split('#')[0].split('?')[0]);
          assert.ok(linked.startsWith(publicRoot + '/'), value);
          await access(linked);
        }
      }
      await assert.rejects(lstat(join(publicRoot, 'api')), { code: 'ENOENT' });
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('edition selection is finite and cannot be supplied by prototype or arbitrary input', () => {
  assert.equal(SITE_CONFIG, SITE_VARIANTS.pointcast);
  for (const id of ['__proto__', 'constructor', '../pointcast', '', null, {}, ['pointcast']]) {
    assert.throws(() => getSiteConfig(id), /Unknown Signal Atlas edition/);
  }
  assert.ok(Object.isFrozen(SITE_VARIANTS));
  for (const config of Object.values(SITE_VARIANTS)) assert.ok(Object.isFrozen(config));
});

test('observation requests require the PointCast edition, selected site, origin and namespace', () => {
  for (const href of ['https://pointcast.xyz/signal-atlas/', 'https://pointcast.xyz/signal-atlas', 'http://localhost:3000/signal-atlas/', 'http://127.0.0.1:3000/signal-atlas/', 'http://[::1]:3000/signal-atlas/']) {
    assert.equal(observationEndpoint('pointcast', href), '/api/signal-atlas');
    assert.equal(observationEndpoint('el-segundo', href), null);
  }
  for (const href of [undefined, '', 'bad-url', 'https://elsegundo.xyz/signal-atlas/', 'https://www.industrynext.xyz/signal-atlas/', 'https://pointcast.xyz.evil.invalid/signal-atlas/', 'http://pointcast.xyz/signal-atlas/', 'https://pointcast.xyz:444/signal-atlas/', 'https://person@pointcast.xyz/signal-atlas/', 'https://pointcast.xyz/ues/signal-atlas/', 'https://pointcast.xyz/', 'https://pointcast.xyz/signal-atlas-other/', 'https://localhost.evil.invalid/signal-atlas/', 'file:///signal-atlas/']) {
    assert.equal(observationEndpoint('pointcast', href), null, String(href));
  }
  assert.equal(observationEndpoint('pointcast', 'https://pointcast.xyz/signal-atlas/', { ...SITE_CONFIG }), null);
});

test('unconnected editions cannot read evidence even after selecting the PointCast site', () => {
  for (const config of Object.values(SITE_VARIANTS).filter(config => config.variantId !== 'pointcast')) {
    assert.equal(config.evidenceEndpoint, null);
    for (const site of SITES) {
      assert.equal(observationEndpoint(site.id, config.origin + config.canonicalPath, config), null);
      assert.equal(observationEndpoint(site.id, 'https://pointcast.xyz/signal-atlas/', config), null);
    }
    const unknown = disconnected(config.homeSiteId);
    assert.equal(unknown.observedLabelCount, null);
    assert.deepEqual(unknown.circuit.standings, []);
  }
});

test('university editions share their parent collection and never introduce a fourth rank', () => {
  assert.equal(SITE_VARIANTS.ues.homeSiteId, 'pointcast');
  assert.equal(SITE_VARIANTS.ues.canonicalPath, '/ues/signal-atlas/');
  assert.equal(SITE_VARIANTS['el-segundo-university'].homeSiteId, 'el-segundo');
  assert.equal(SITE_VARIANTS['el-segundo-university'].canonicalPath, '/university/signal-atlas/');
  assert.deepEqual(SITES.map(site => site.id), ['pointcast', 'el-segundo', 'industrynext']);
  for (const config of [SITE_VARIANTS.ues, SITE_VARIANTS['el-segundo-university']]) {
    const fixture = demoSnapshot(config.homeSiteId);
    assert.equal(fixture.siteId, config.homeSiteId);
    assert.deepEqual(fixture.circuit.standings, []);
    assert.match(config.disconnectedNote, /no separate count/i);
  }
});

test('browser preferences are isolated by edition, including both university namespaces', () => {
  const scopes = Object.values(SITE_VARIANTS).map(config => config.storageScope);
  assert.equal(new Set(scopes).size, 5);
  assert.equal(SITE_VARIANTS.pointcast.storageScope, 'pointcast:signal-atlas');
  for (const scope of scopes) assert.match(scope, /^[a-z-]+:signal-atlas$/);
});
