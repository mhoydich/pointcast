import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, access, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const packageScript = join(repo, 'tools/signal-atlas-protocol/package-starter.py');
const hash = value => createHash('sha256').update(value).digest('hex');
let temporary, kit, zip, first;
const cli = (...args) => spawnSync(process.execPath, ['start.mjs', ...args], { cwd: kit, encoding: 'utf8', timeout: 10000 });
const get = async path => JSON.parse(await readFile(join(kit, path), 'utf8'));
before(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'atlas-starter-'));
  zip = join(temporary, 'first.zip');
  const packaged = spawnSync('python3', [packageScript, zip], { encoding: 'utf8' });
  assert.equal(packaged.status, 0, packaged.stderr);
  const extracted = spawnSync('python3', ['-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert all(n.startswith("signal-atlas-builder-kit/") and ".." not in n.split("/") and not n.startswith("/") for n in z.namelist());z.extractall(sys.argv[2])', zip, temporary], { encoding: 'utf8' });
  assert.equal(extracted.status, 0, extracted.stderr);
  kit = join(temporary, 'signal-atlas-builder-kit');
});
after(async () => { await rm(temporary, { recursive: true, force: true }); });
test('portable package is deterministic and pins all shipped runtime bytes', async () => {
  const second = join(temporary, 'second.zip');
  const built = spawnSync('python3', [packageScript, second], { encoding: 'utf8' });
  assert.equal(built.status, 0, built.stderr);
  assert.equal(hash(await readFile(zip)), hash(await readFile(second)));
  const manifest = await get('SOURCE-MANIFEST.json');
  assert.equal(manifest.enrollment, false);
  for (const [path, entry] of Object.entries(manifest.files)) {
    const bytes = await readFile(join(kit, path));
    assert.equal(bytes.length, entry.bytes);
    assert.equal(hash(bytes), entry.sha256);
  }
});
test('fresh extraction runs without repository files and saves an inspectable result', async () => {
  first = cli('first-run');
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(JSON.parse(first.stdout).inspected_missions, ['source-check', 'schema-repair']);
  const receipt = await get('first-run/receipt.demo.json');
  const inspection = await get('first-run/inspection.demo.json');
  assert.equal(receipt.account_enrollment, false);
  assert.equal(receipt.live_points, 0);
  assert.equal(inspection.valid_fixture_example, true);
  assert.equal(inspection.eligible_for_live_points, false);
  assert.equal(inspection.historical_execution_or_network_claims_verified, false);
  assert.ok(receipt.missions.every(row => row.protocol_submission.status === 'received_unreviewed'));
  const keys = value => value && typeof value === 'object' ? Object.entries(value).flatMap(([key, child]) => [key, ...keys(child)]) : [];
  assert.ok(!keys(receipt).some(key => /private.?key|secret|api.?key/i.test(key)));
  const checked = spawnSync(process.execPath, ['builder-kit/inspect.mjs', 'first-run/receipt.demo.json'], { cwd: kit, encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(JSON.parse(checked.stdout).valid_fixture_example, true);
});
test('new attempts retain fixture isolation and use fresh ephemeral keys', async () => {
  const result = cli('another-run');
  assert.equal(result.status, 0, result.stderr);
  const previous = await get('first-run/receipt.demo.json');
  const current = await get('another-run/receipt.demo.json');
  assert.notEqual(previous.participant.public_key, current.participant.public_key);
  assert.equal(current.eligible_for_live_points, false);
  assert.equal(current.live_points, 0);
});
test('existing result folders, files and symlink destinations cannot be overwritten', async () => {
  const beforeHash = hash(await readFile(join(kit, 'first-run/receipt.demo.json')));
  assert.notEqual(cli('first-run').status, 0);
  assert.equal(hash(await readFile(join(kit, 'first-run/receipt.demo.json'))), beforeHash);
  await writeFile(join(kit, 'occupied'), 'keep me');
  assert.notEqual(cli('occupied').status, 0);
  assert.equal(await readFile(join(kit, 'occupied'), 'utf8'), 'keep me');
  await symlink(join(kit, 'first-run'), join(kit, 'linked-output'), 'dir');
  assert.notEqual(cli('linked-output').status, 0);
  assert.equal(hash(await readFile(join(kit, 'first-run/receipt.demo.json'))), beforeHash);
});
test('editable answer copies work; incorrect answers create no result folder', async () => {
  assert.equal(cli('answer-run', '--mission', 'source-check', '--answer', 'first-run/source-check.answer.json').status, 0);
  const answer = await get('first-run/source-check.answer.json');
  answer.checks[0].observed_value = 999;
  await writeFile(join(kit, 'wrong-answer.json'), JSON.stringify(answer));
  const wrong = cli('wrong-run', '--mission', 'source-check', '--answer', 'wrong-answer.json');
  assert.notEqual(wrong.status, 0);
  assert.equal(JSON.parse(wrong.stderr).error, 'fixture-answer-rejected');
  await assert.rejects(access(join(kit, 'wrong-run')), { code: 'ENOENT' });
  const missing = cli('missing-run', '--mission', 'source-check', '--answer', 'missing.json');
  assert.notEqual(missing.status, 0);
  await assert.rejects(access(join(kit, 'missing-run')), { code: 'ENOENT' });
});
test('unknown, duplicated, live and incomplete flags do not activate work', async () => {
  for (const args of [
    ['invalid-run', '--live'], ['invalid-run', '--mission', 'real-site'],
    ['invalid-run', '--answer', 'first-run/source-check.answer.json'],
    ['invalid-run', '--mission', 'source-check', '--mission', 'schema-repair'],
  ]) {
    const result = cli(...args);
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(result.stderr).submitted, false);
    await assert.rejects(access(join(kit, 'invalid-run')), { code: 'ENOENT' });
  }
});
test('tampered runtime fails before module execution or output creation', async () => {
  const path = join(kit, 'builder-kit/client.mjs');
  const original = await readFile(path);
  try {
    await writeFile(path, original.toString() + '\nthrow new Error("tampered module executed");\n');
    const result = cli('tampered-run');
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(result.stderr).error, 'bundle-integrity-mismatch');
    await assert.rejects(access(join(kit, 'tampered-run')), { code: 'ENOENT' });
  } finally { await writeFile(path, original); }
});
test('packaging refuses an existing archive without changing it', async () => {
  const beforeHash = hash(await readFile(zip));
  const result = spawnSync('python3', [packageScript, zip], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(hash(await readFile(zip)), beforeHash);
  const linked = join(temporary, 'linked.zip');
  await symlink(zip, linked, 'file');
  const throughLink = spawnSync('python3', [packageScript, linked, '--replace'], { encoding: 'utf8' });
  assert.notEqual(throughLink.status, 0);
  assert.equal(hash(await readFile(zip)), beforeHash);
});
