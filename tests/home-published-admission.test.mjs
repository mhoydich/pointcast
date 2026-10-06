import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { admitHomePublishedProjects, buildHomePublishedCatalog, parseStrictJson } from '../scripts/admit-home-published-projects.mjs';

const COMMIT = 'a'.repeat(40);
const CHECKED = '2026-10-06T15:01:00.000Z';
const ORIGIN = 'https://pointcast.xyz';
const IMMUTABLE = 'https://deadbeef.pointcast.pages.dev';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const json = data => Buffer.from(JSON.stringify(data, null, 2) + '\n');
const candidate = (id = 'new-study', href = '/new-study/') => ({
  id, title: 'New study', href, group: 'Research · proposal', dek: 'A published research proposal, not an operating service.', image: null,
  publishedAt: '2026-10-06T15:00:00Z', publication: { state: 'pending' },
  sources: [{ url: ORIGIN + href, title: 'Public study', checkedAt: CHECKED }],
  imageRights: { status: 'not-used', source: null, license: null, checkedAt: null },
});

async function fixture(t, { catalog = [], candidates = [candidate()], canonicalBody, immutableBody } = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'home-admission-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const proofDir = path.join(directory, 'proof');
  await mkdir(proofDir);
  const bodies = [Buffer.from(canonicalBody ?? '<!doctype html><main id="chapter"><h1>New study</h1></main>'),
    Buffer.from(immutableBody ?? canonicalBody ?? '<!doctype html><main id="chapter"><h1>New study</h1></main>')];
  const target = candidates[0]?.href.split('#')[0] ?? '/new-study/';
  const proof = { commit: COMMIT, checkedAt: CHECKED, responses: bodies.map((body, index) => ({
    url: [ORIGIN, IMMUTABLE][index] + target, method: 'GET', status: 200, bodyPath: index + '.html', sha256: digest(body), bytes: body.length,
  })) };
  await Promise.all(bodies.map((body, index) => writeFile(path.join(proofDir, index + '.html'), body)));
  const receipt = { releaseId: 'pointcast-release-20261006', commit: COMMIT, canonicalOrigin: ORIGIN, immutableOrigin: IMMUTABLE,
    completedAt: '2026-10-06T15:00:00Z', proofSha256: digest(json(proof)) };
  const options = { catalogPath: path.join(directory, 'catalog.json'), candidatesPath: path.join(directory, 'candidates.json'),
    receiptPath: path.join(directory, 'receipt.json'), proofPath: path.join(proofDir, 'http-proof.json'), proofDir,
    outputPath: path.join(directory, 'review.json') };
  const save = async () => {
    receipt.proofSha256 = digest(json(proof));
    await Promise.all([writeFile(options.catalogPath, json(catalog)), writeFile(options.candidatesPath, json(candidates)),
      writeFile(options.receiptPath, json(receipt)), writeFile(options.proofPath, json(proof))]);
  };
  await save();
  return { directory, proofDir, catalog, candidates, proof, receipt, options, bodies, save };
}

async function refusalPreservesOutput(f, pattern) {
  await writeFile(f.options.outputPath, 'existing review artifact\n');
  const inputs = await Promise.all([f.options.catalogPath, f.options.candidatesPath, f.options.receiptPath, f.options.proofPath].map(file => readFile(file)));
  await assert.rejects(admitHomePublishedProjects(f.options), pattern);
  assert.equal(await readFile(f.options.outputPath, 'utf8'), 'existing review artifact\n');
  const after = await Promise.all([f.options.catalogPath, f.options.candidatesPath, f.options.receiptPath, f.options.proofPath].map(file => readFile(file)));
  assert.deepEqual(after, inputs, 'a refused intake never mutates its inputs');
  assert.ok(!(await readdir(f.directory)).some(name => name.endsWith('.tmp')));
}

test('two hashed GET bodies admit pending candidates and preserve legacy rows without mutating inputs', async t => {
  const old = { title: 'Older workshop', href: '/chain', group: 'Chain · local build', dek: 'No value; may reset.', image: '/images/chain/block-yard.svg', retained: { editorial: true } };
  const f = await fixture(t, { catalog: [old] });
  const snapshot = structuredClone({ catalog: f.catalog, candidates: f.candidates, receipt: f.receipt });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Admission must not use the network.'); };
  try {
    const result = await admitHomePublishedProjects(f.options);
    assert.equal(result.admitted, 1);
    assert.equal(result.total, 2);
  } finally { globalThis.fetch = previousFetch; }
  const result = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
  assert.deepEqual(result[0], old);
  assert.deepEqual({ catalog: f.catalog, candidates: f.candidates, receipt: f.receipt }, snapshot);
  assert.equal(result[1].dek, f.candidates[0].dek);
  assert.deepEqual(result[1].publication, { state: 'verified-live', commit: COMMIT, canonical: ORIGIN + '/new-study/',
    immutable: IMMUTABLE, verifiedAt: CHECKED, receipt: 'pointcast-release-20261006' });
  assert.equal(result[1].publishedAt, '2026-10-06T15:00:00.000Z');
  assert.doesNotMatch(JSON.stringify(result), /bodyPath|proofSha256|http-proof|home-admission-|completedAt/);
});

test('receipt binds exact proof JSON bytes before parsing', async t => {
  const f = await fixture(t);
  await writeFile(f.options.proofPath, Buffer.concat([json(f.proof), Buffer.from(' ')]));
  await refusalPreservesOutput(f, /Proof JSON hash/);
});

test('unknown original publication dates stay null and explicit intake dates stay separate', async t => {
  const f = await fixture(t);
  f.candidates[0].publishedAt = null;
  f.candidates[0].addedAt = '2026-10-06T15:00:30Z';
  await f.save();
  await admitHomePublishedProjects(f.options);
  const [record] = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
  assert.equal(record.publishedAt, null);
  assert.equal(record.addedAt, '2026-10-06T15:00:30.000Z');
  assert.equal(record.publication.verifiedAt, CHECKED);
});

test('raw body tampering, wrong length and empty bodies fail before any output', async t => {
  for (const kind of ['hash', 'length', 'empty']) {
    await t.test(kind, async st => {
      const f = await fixture(st);
      if (kind === 'hash') await writeFile(path.join(f.proofDir, '0.html'), Buffer.from('x'.repeat(f.bodies[0].length)));
      if (kind === 'length') f.proof.responses[0].bytes++;
      if (kind === 'empty') { await writeFile(path.join(f.proofDir, '0.html'), ''); f.proof.responses[0].bytes = 0; }
      if (kind !== 'hash') await f.save();
      await refusalPreservesOutput(f, /hash|byte|nonempty/);
    });
  }
});

test('HTTP 404, HEAD, duplicate response and boolean byte/status values are refused', async t => {
  for (const kind of ['404', 'HEAD', 'duplicate', 'bytes', 'status']) {
    await t.test(kind, async st => {
      const f = await fixture(st);
      if (kind === '404') f.proof.responses[1].status = 404;
      if (kind === 'HEAD') f.proof.responses[0].method = 'HEAD';
      if (kind === 'duplicate') f.proof.responses.push(structuredClone(f.proof.responses[0]));
      if (kind === 'bytes') f.proof.responses[0].bytes = true;
      if (kind === 'status') f.proof.responses[0].status = true;
      await f.save();
      await refusalPreservesOutput(f, /200|GET|duplicate|bytes/);
    });
  }
});

test('wrong commit, pre-deploy proof, equal-time proof and impossible dates fail', async t => {
  for (const kind of ['commit', 'early', 'equal', 'invalid']) {
    await t.test(kind, async st => {
      const f = await fixture(st);
      if (kind === 'commit') f.proof.commit = 'b'.repeat(40);
      if (kind === 'early') f.proof.checkedAt = '2026-10-06T14:59:00Z';
      if (kind === 'equal') f.proof.checkedAt = f.receipt.completedAt;
      if (kind === 'invalid') f.proof.checkedAt = '2026-02-30T15:01:00Z';
      await f.save();
      await refusalPreservesOutput(f, /commit|after deployment|calendar/);
    });
  }
});

test('canonical and immutable origin proof must both exist and match the exact deployment host', async t => {
  for (const kind of ['missing', 'wrong', 'branch', 'userinfo', 'port', 'suffix', 'private-id']) {
    await t.test(kind, async st => {
      const f = await fixture(st);
      if (kind === 'missing') f.proof.responses.pop();
      if (kind === 'wrong') f.proof.responses[1].url = 'https://cafebabe.pointcast.pages.dev/new-study/';
      if (kind === 'branch') f.receipt.immutableOrigin = 'https://main.pointcast.pages.dev';
      if (kind === 'userinfo') f.receipt.immutableOrigin = 'https://user:secret@deadbeef.pointcast.pages.dev';
      if (kind === 'port') f.receipt.immutableOrigin = 'https://deadbeef.pointcast.pages.dev:443';
      if (kind === 'suffix') f.receipt.immutableOrigin = 'https://deadbeef.pointcast.pages.dev.example.org';
      if (kind === 'private-id') f.receipt.releaseId = '/Users/mike/private/receipt.json';
      await f.save();
      await refusalPreservesOutput(f, /Missing|origin|Origin|slug/);
    });
  }
});

test('proof traversal, absolute paths, final symlinks and symlink directories cannot escape the proof directory', async t => {
  for (const kind of ['traversal', 'absolute', 'encoded', 'link', 'directory']) {
    await t.test(kind, async st => {
      const f = await fixture(st);
      const outside = path.join(f.directory, 'outside.html');
      await writeFile(outside, f.bodies[0]);
      if (kind === 'traversal') f.proof.responses[0].bodyPath = '../outside.html';
      if (kind === 'absolute') f.proof.responses[0].bodyPath = outside;
      if (kind === 'encoded') f.proof.responses[0].bodyPath = '%2e%2e/outside.html';
      if (kind === 'link') { await symlink(outside, path.join(f.proofDir, 'link.html')); f.proof.responses[0].bodyPath = 'link.html'; }
      if (kind === 'directory') { await symlink(f.directory, path.join(f.proofDir, 'linked')); f.proof.responses[0].bodyPath = 'linked/outside.html'; }
      await f.save();
      await refusalPreservesOutput(f, /proof directory|symlink/);
    });
  }
});

test('every proof record is checked, including an unused body', async t => {
  const f = await fixture(t);
  f.proof.responses.push({ ...f.proof.responses[0], url: ORIGIN + '/unused/', bodyPath: '../outside.html' });
  await f.save();
  await refusalPreservesOutput(f, /proof directory/);
});

test('candidate paths reject traversal, ambiguous encoding, external origins, queries and private routes', async t => {
  const paths = ['/x/../new-study/', '/x/%2e%2e/new-study/', '/x/%252e%252e/', '/x/%2fprivate/', '/x/%5cprivate/',
    '/new-study/?token=secret', '/x/%zz/', '//example.org/new-study/', 'https://example.org/new-study/', '/api/private/', '/desk/', '/desk/private-report/', '/private/receipt', '/x//y/'];
  for (const href of paths) {
    await t.test(href, async st => {
      const f = await fixture(st);
      f.candidates[0].href = href;
      await f.save();
      await refusalPreservesOutput(f, /path|query|separator|traversal|encoding|private/);
    });
  }
});

test('duplicate candidates and existing identities fail; id-only or href-only updates are never guessed', async t => {
  for (const kind of ['candidate-id', 'candidate-href', 'existing-id', 'existing-href', 'id-only', 'href-only', 'legacy']) {
    await t.test(kind, async st => {
      const f = await fixture(st);
      if (kind === 'candidate-id') f.candidates.push({ ...candidate(), href: '/other-study/' });
      if (kind === 'candidate-href') f.candidates.push({ ...candidate('other-study'), href: '/new-study/' });
      if (kind === 'existing-id') f.catalog.push(candidate('old', '/old/'), candidate('old', '/different/'));
      if (kind === 'existing-href') f.catalog.push(candidate('old', '/old/'), candidate('other', '/old/'));
      if (kind === 'id-only') f.catalog.push(candidate('new-study', '/different/'));
      if (kind === 'href-only') f.catalog.push(candidate('old-study', '/new-study/'));
      if (kind === 'legacy') f.catalog.push({ title: 'Old', href: '/new-study/' });
      await f.save();
      await refusalPreservesOutput(f, /duplicate|identity collision/);
    });
  }
});

test('exact matched updates require an explicit flag and retain their existing position', async t => {
  const old = { ...candidate(), title: 'Original title', publication: { state: 'pending' } };
  const untouched = { id: 'older', href: '/older/', title: 'Kept', editorial: { detail: 'Unchanged' } };
  const f = await fixture(t, { catalog: [old, untouched] });
  await refusalPreservesOutput(f, /--update-existing/);
  await admitHomePublishedProjects({ ...f.options, allowUpdates: true });
  const result = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
  assert.equal(result.length, 2);
  assert.equal(result[0].title, 'New study');
  assert.deepEqual(result[1], untouched);
});

test('pending and forged live inputs cannot bypass missing proof, unknown fields or missing qualification', async t => {
  for (const kind of ['pending', 'live', 'unknown-state', 'unknown-field', 'empty-dek', 'empty-sources', 'rights']) {
    await t.test(kind, async st => {
      const f = await fixture(st);
      if (kind === 'pending') f.proof.responses.pop();
      if (kind === 'live') f.candidates[0].publication = { state: 'verified-live' };
      if (kind === 'unknown-state') f.candidates[0].publication = { state: 'approved' };
      if (kind === 'unknown-field') f.candidates[0].privateReceiptPath = '/Users/private/receipt';
      if (kind === 'empty-dek') f.candidates[0].dek = ' ';
      if (kind === 'empty-sources') f.candidates[0].sources = [];
      if (kind === 'rights') f.candidates[0].imageRights.status = 'unverified';
      await f.save();
      await refusalPreservesOutput(f, /Missing|pending|unknown|nonempty|public sources|not-used/);
    });
  }
});

test('source URLs reject credentials, local/private tracking and malformed encoding', async t => {
  const urls = ['https://user:secret@example.org/study', 'file:///Users/mike/private.md', 'https://localhost/study', 'https://localhost./study', 'https://127.0.0.1/study',
    'https://example.org/study?api_key=secret', 'https://example.org/study?utm_source=library', 'https://chatgpt.com/library/private-id',
    ORIGIN + '/private/receipt.json', 'https://example.org/study?value=%zz', 'https://example.org/study#access_token=secret'];
  for (const url of urls) {
    await t.test(url, async st => {
      const f = await fixture(st);
      f.candidates[0].sources[0].url = url;
      await f.save();
      await refusalPreservesOutput(f, /HTTPS|public|credential|tracking|encoding/);
    });
  }
});

test('anchors must be real DOM targets on both origins; entities and legacy named links work', async t => {
  for (const kind of ['id', 'name', 'comment', 'script', 'template', 'one-origin']) {
    await t.test(kind, async st => {
      const good = '<main id="reading&amp;notes">New study</main>';
      const bodies = { id: good, name: '<a name="reading&amp;notes">New study</a>', comment: '<!-- <main id="reading&amp;notes">fake</main> -->',
        script: '<script>const fake = \'<main id="reading&amp;notes">\';</script>', template: '<template><main id="reading&amp;notes">fake</main></template>', 'one-origin': good };
      const f = await fixture(st, { candidates: [candidate('new-study', '/new-study/#reading%26notes')], canonicalBody: bodies[kind],
        immutableBody: kind === 'one-origin' ? '<main>No target</main>' : bodies[kind] });
      if (kind === 'id' || kind === 'name') {
        await admitHomePublishedProjects(f.options);
        const result = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
        assert.equal(result[0].publication.canonical, ORIGIN + '/new-study/#reading%26notes');
      } else await refusalPreservesOutput(f, /Missing target anchor/);
    });
  }
});

test('duplicate JSON keys and escaped aliases fail instead of silently selecting a value', () => {
  for (const input of ['{"commit":"first","commit":"second"}', '{"id":"x","\\u0069d":"y"}', '[{"nested":{"x":1,"x":2}}]']) {
    assert.throws(() => parseStrictJson(Buffer.from(input)), /duplicate object key/);
  }
});

test('valid parsed intake leaves deeply frozen in-memory inputs intact', async t => {
  const f = await fixture(t);
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const catalog = freeze([{ id: 'older', href: '/older/', editorial: { note: 'kept' } }]);
  const candidates = freeze(structuredClone(f.candidates));
  const receipt = freeze(structuredClone(f.receipt));
  const result = await buildHomePublishedCatalog({ catalog, candidates, receipt, proofBytes: json(f.proof), proofDir: f.proofDir });
  assert.deepEqual(result[0], catalog[0]);
  assert.equal(candidates[0].publication.state, 'pending');
  assert.equal(result[1].publication.state, 'verified-live');
});

test('output cannot alias an input or use a symlink', async t => {
  const f = await fixture(t);
  const catalogBytes = await readFile(f.options.catalogPath);
  await assert.rejects(admitHomePublishedProjects({ ...f.options, outputPath: f.options.catalogPath }), /separate/);
  await symlink(f.options.catalogPath, f.options.outputPath);
  await assert.rejects(admitHomePublishedProjects(f.options), /symlink/);
  assert.deepEqual(await readFile(f.options.catalogPath), catalogBytes);
});

test('output cannot replace a saved body or any file within the proof directory', async t => {
  const f = await fixture(t);
  const bodyPath = path.join(f.proofDir, f.proof.responses[0].bodyPath);
  const original = await readFile(bodyPath);
  await assert.rejects(admitHomePublishedProjects({ ...f.options, outputPath: bodyPath }), /outside the proof directory/);
  await assert.rejects(admitHomePublishedProjects({ ...f.options, outputPath: path.join(f.proofDir, 'new-review.json') }), /outside the proof directory/);
  assert.deepEqual(await readFile(bodyPath), original);
  assert.ok(!(await readdir(f.proofDir)).includes('new-review.json'));
});

test('reviewed image rights retain public evidence and refuse missing rights or unsafe assets', async t => {
  for (const status of ['original', 'existing-published-asset', 'licensed', 'public-domain', 'permission-granted']) {
    await t.test(status, async st => {
      const f = await fixture(st);
      f.candidates[0].image = '/images/new-study.webp';
      f.candidates[0].imageRights = { status, source: ORIGIN + '/images/new-study.webp', license: 'Reviewed public rights evidence', checkedAt: CHECKED };
      await f.save();
      await admitHomePublishedProjects(f.options);
      const [record] = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
      assert.equal(record.imageRights.status, status);
      assert.equal(record.image, '/images/new-study.webp');
    });
  }
  await t.test('retained published asset with rights unknown', async st => {
    const f = await fixture(st);
    f.candidates[0].image = '/images/new-study.webp';
    f.candidates[0].imageRights = { status: 'existing-published-asset', source: ORIGIN + '/images/new-study.webp', license: null, checkedAt: CHECKED };
    await f.save();
    await admitHomePublishedProjects(f.options);
    const [record] = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
    assert.equal(record.imageRights.license, null);
    assert.equal(record.imageRights.status, 'existing-published-asset');
  });
  for (const kind of ['missing', 'unsafe', 'future']) {
    await t.test(kind, async st => {
      const f = await fixture(st);
      f.candidates[0].image = '/images/new-study.webp';
      if (kind === 'unsafe') f.candidates[0].image = '/images/%2e%2e/private.webp';
      if (kind === 'future') f.candidates[0].imageRights = { status: 'licensed', source: ORIGIN + '/images/new-study.webp', license: 'Reviewed rights', checkedAt: '2026-10-06T16:00:00Z' };
      await f.save();
      await refusalPreservesOutput(f, /rights|traversal/);
    });
  }
});

test('a later invalid candidate refuses the entire batch without partial output', async t => {
  const f = await fixture(t);
  f.candidates.push(candidate('second-study', '/second-study/'));
  await f.save();
  await refusalPreservesOutput(f, /Missing canonical or immutable/);
});

test('microsecond proof ordering uses original precision while public timestamps normalize to milliseconds', async t => {
  const f = await fixture(t);
  f.receipt.completedAt = '2026-10-06T15:01:00.000001+00:00';
  f.proof.checkedAt = '2026-10-06T15:01:00.000002+00:00';
  await f.save();
  await admitHomePublishedProjects(f.options);
  const [record] = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
  assert.equal(record.publication.verifiedAt, '2026-10-06T15:01:00.000Z');
  f.proof.checkedAt = '2026-10-06T15:01:00.000000999Z';
  await f.save();
  await refusalPreservesOutput(f, /after deployment/);
});

test('public text fields refuse embedded private paths without silently redacting them', async t => {
  for (const field of ['title', 'group', 'dek', 'source-title', 'license']) {
    await t.test(field, async st => {
      const f = await fixture(st);
      const privateText = 'Read /Users/mike/.aws/credentials for details';
      if (field === 'source-title') f.candidates[0].sources[0].title = privateText;
      else if (field === 'license') {
        f.candidates[0].image = '/images/new-study.webp';
        f.candidates[0].imageRights = { status: 'licensed', source: ORIGIN + '/images/new-study.webp', license: privateText, checkedAt: CHECKED };
      } else f.candidates[0][field] = privateText;
      await f.save();
      await refusalPreservesOutput(f, /private filesystem paths/);
    });
  }
});

test('official public HTTPS API sources are allowed without assuming their paths are private', async t => {
  const f = await fixture(t);
  f.candidates[0].sources[0].url = 'https://aa.usno.navy.mil/api/rstt/oneday';
  await f.save();
  await admitHomePublishedProjects(f.options);
  const [record] = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
  assert.equal(record.sources[0].url, 'https://aa.usno.navy.mil/api/rstt/oneday');
});

test('nonregular body and JSON inputs are refused before opening them for reading', async t => {
  const f = await fixture(t);
  await mkdir(path.join(f.proofDir, 'body-directory'));
  f.proof.responses[0].bodyPath = 'body-directory';
  await f.save();
  await refusalPreservesOutput(f, /regular file/);
  await assert.rejects(admitHomePublishedProjects({ ...f.options, candidatesPath: f.proofDir }), /regular file/);
});

test('public nested home routes remain eligible as both proven targets and source URLs', async t => {
  for (const href of ['/cartography/home/', '/pickleball/home/']) {
    await t.test(href, async st => {
      const f = await fixture(st, { candidates: [candidate('public-home', href)] });
      await admitHomePublishedProjects(f.options);
      const [record] = JSON.parse(await readFile(f.options.outputPath, 'utf8'));
      assert.equal(record.href, href);
      assert.equal(record.sources[0].url, ORIGIN + href);
    });
  }
  await t.test('public source repository home directory', async st => {
    const f = await fixture(st);
    f.candidates[0].sources[0].url = 'https://github.com/mhoydich/pointcast/blob/' + COMMIT + '/src/pages/cartography/home/index.astro';
    await f.save();
    await admitHomePublishedProjects(f.options);
  });
});

test('private absolute home paths remain refused at prose token boundaries', async t => {
  for (const value of ['Read /home/user/private.txt for details', 'source="/Users/mike/private.txt"']) {
    await t.test(value, async st => {
      const f = await fixture(st);
      f.candidates[0].dek = value;
      await f.save();
      await refusalPreservesOutput(f, /private filesystem paths/);
    });
  }
});
