#!/usr/bin/env node
/** Standalone offline fixture handoff. No accounts, endpoints or persistent keys. */
import { createHash } from 'node:crypto';
import { lstat, mkdir, open, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('./', import.meta.url));
const FILES = Object.freeze(["start.mjs","START-HERE.md","protocol/protocol.mjs","builder-kit/client.mjs","builder-kit/missions.mjs","builder-kit/run.mjs","builder-kit/inspect.mjs","builder-kit/PROTOCOL-DEPENDENCY.json","builder-kit/fixtures/terms.fixture.json","builder-kit/fixtures/source-check.packet.json","builder-kit/fixtures/source-check.challenge.template.json","builder-kit/fixtures/schema-repair.packet.json","builder-kit/fixtures/schema-repair.challenge.template.json","builder-kit/fixtures/repair-target.schema.json","builder-kit/examples/source-check.answer.json","builder-kit/examples/schema-repair.answer.json"]);
const MISSIONS = Object.freeze(['source-check', 'schema-repair']);
const json = value => JSON.stringify(value, null, 2) + '\n';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const inside = (parent, child) => { const path = relative(parent, child); return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith('..' + sep)); };
class PracticeError extends Error {}
async function bounded(path, limit) {
  const handle = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(limit + 1);
    let read = 0;
    while (read < buffer.length) {
      const result = await handle.read(buffer, read, buffer.length - read, read);
      if (!result.bytesRead) break;
      read += result.bytesRead;
    }
    if (read > limit) throw new PracticeError('input-too-large');
    return buffer.subarray(0, read);
  } finally { await handle.close(); }
}
async function verifyBundle() {
  const root = await realpath(ROOT);
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await bounded(join(ROOT, 'SOURCE-MANIFEST.json'), 65536)));
  if (manifest?.schema !== 'signal-atlas.offline-starter/v1' || manifest.dataMode !== 'fixture' || manifest.enrollment !== false ||
      manifest.livePoints !== 0 || !manifest.files || Object.keys(manifest.files).length !== FILES.length ||
      Object.keys(manifest.files).some(path => !FILES.includes(path))) throw new PracticeError('invalid-bundle-manifest');
  const bytes = new Map();
  let total = 0;
  for (const path of FILES) {
    const entry = manifest.files[path];
    const full = join(root, path);
    if (!entry || !Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || entry.bytes > 65536 ||
        typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256) ||
        !(await lstat(full)).isFile() || !inside(root, await realpath(full))) throw new PracticeError('invalid-bundle-file');
    const content = await bounded(full, 65536);
    total += content.length;
    if (total > 250000 || content.length !== entry.bytes || digest(content) !== entry.sha256) throw new PracticeError('bundle-integrity-mismatch');
    bytes.set(path, content);
  }
  return bytes;
}
function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === '--help') return { help: true };
  if (!argv[0] || argv[0].startsWith('--') || /[\x00-\x1f\x7f]/.test(argv[0])) throw new PracticeError('new-output-folder-required');
  const result = { destination: argv[0] };
  const seen = new Set();
  for (let index = 1; index < argv.length; index++) {
    const flag = argv[index];
    if (!['--mission', '--answer'].includes(flag) || seen.has(flag)) throw new PracticeError('unknown-or-repeated-option');
    seen.add(flag);
    const value = argv[++index];
    if (!value || value.startsWith('--') || /[\x00-\x1f\x7f]/.test(value)) throw new PracticeError('option-value-required');
    if (flag === '--mission') result.mission = value;
    else result.answerPath = value;
  }
  if (result.mission && !MISSIONS.includes(result.mission)) throw new PracticeError('unknown-mission');
  if (result.answerPath && !result.mission) throw new PracticeError('answer-needs-one-mission');
  return result;
}
const NEXT = `# Your local practice result

Open inspection.demo.json first: it independently recomputes fixture answers,
digests, key-possession signatures and receipt identity. Open receipt.demo.json
to inspect the underlying public material. Neither file is enrollment, reviewed
real work, provider identity or live standings. The fixed dates are fixture dates.

Try your own answer:
1. Read the matching builder-kit/fixtures packet in the extracted kit.
2. Edit source-check.answer.json or schema-repair.answer.json in this result folder.
   These start as the inspectable reference answers, not a secret benchmark.
3. From the extracted kit root, choose a NEW output folder and run:
   node start.mjs second-run --mission source-check --answer first-run/source-check.answer.json
   Replace first-run with the name you chose for this result folder.

A wrong answer fails without creating a result folder. Compare it with the packet;
preserve null for unavailable information. Existing folders are never overwritten.
Successful new runs generate a fresh memory-only key. They are not duplicate
submissions to a live service and do not build a persistent identity.

To reinspect an existing result without a private key:
node builder-kit/inspect.mjs first-run/receipt.demo.json

There is no upload or enrollment step. Keep results locally. A future pilot needs
a real open intake and separately scoped operator consent; this kit supplies none.
`;
export async function createPracticeFolder(options) {
  if (!options || typeof options.destination !== 'string' || /[\x00-\x1f\x7f]/.test(options.destination)) throw new PracticeError('new-output-folder-required');
  if (options.mission && !MISSIONS.includes(options.mission)) throw new PracticeError('unknown-mission');
  if (options.answerPath && !options.mission) throw new PracticeError('answer-needs-one-mission');
  const requested = resolve(options.destination);
  const output = join(await realpath(dirname(requested)), requested.split(sep).at(-1));
  try { await lstat(output); throw new PracticeError('output-already-exists'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const files = await verifyBundle();
  // No mutable local module executes until all supplied runtime files match the manifest.
  const { runFixtureExample } = await import('./builder-kit/run.mjs');
  const { inspectDemoReceipt } = await import('./builder-kit/inspect.mjs');
  const { readBoundedJSON } = await import('./builder-kit/missions.mjs');
  const run = options.mission ? { missionIds: [options.mission] } : {};
  if (options.answerPath) run.answers = { [options.mission]: await readBoundedJSON(options.answerPath) };
  const receipt = await runFixtureExample(run);
  const inspection = await inspectDemoReceipt(JSON.parse(JSON.stringify(receipt)));
  if (!inspection.valid_fixture_example || inspection.eligible_for_live_points !== false || inspection.live_points !== 0) throw new PracticeError('fixture-inspection-failed');
  const outputs = new Map([
    ['receipt.demo.json', Buffer.from(json(receipt))],
    ['inspection.demo.json', Buffer.from(json(inspection))],
    ['source-check.answer.json', files.get('builder-kit/examples/source-check.answer.json')],
    ['schema-repair.answer.json', files.get('builder-kit/examples/schema-repair.answer.json')],
    ['NEXT.md', Buffer.from(NEXT)],
  ]);
  await mkdir(output, { mode: 0o700 }); // Exclusive: a competing creator makes this fail.
  for (const [path, bytes] of outputs) await writeFile(join(output, path), bytes, { flag: 'wx', mode: 0o600 });
  return { directory: output, data_mode: 'fixture', valid_fixture_example: true,
    inspected_missions: inspection.missions.map(value => value.mission_id),
    account_enrollment: false, eligible_for_live_points: false, live_points: 0,
    next: 'Open NEXT.md and inspection.demo.json. No submission or enrollment step exists.' };
}
async function main() {
  try {
    const major = Number(process.versions.node.split('.')[0]);
    if (major < 22) throw new PracticeError('node-22-or-newer-required');
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write('Offline fixture practice; no install, network, enrollment or live points.\nnode start.mjs NEW-FOLDER [--mission source-check|schema-repair] [--answer path.json]\nExisting folders are never overwritten.\n');
      return;
    }
    process.stdout.write(json(await createPracticeFolder(options)));
  } catch (error) {
    const known = error instanceof PracticeError ? error.message : typeof error?.code === 'string' && /^[a-z][a-z0-9-]+$/.test(error.code) ? error.code : 'local-file-or-runtime-error';
    process.stderr.write(json({ data_mode: 'fixture', error: known, submitted: false, eligible_for_live_points: false }));
    process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
