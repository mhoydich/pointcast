import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { LIMITS, FeedImportError, refreshReadingFeed, safeError, validateCheckDate } from './lib/reading-feed.mjs';

const HELP = `Manual Goodreads RSS refresh; creates a draft for review, never publishes it.
Usage: node scripts/refresh-reading-feed.mjs [options]
  --input-private-file PATH  Read a privately stored RSS file instead of fetching
  --source-url URL           Private Goodreads all-shelf RSS source (or GOODREADS_RSS_URL)
  --previous PATH           Previous public snapshot (default src/data/reading-feed.json)
  --output PATH             Draft only (default src/data/reading-feed.draft.json)
  --diff-output PATH        Public-only diff (default src/data/reading-feed.diff.json)
  --checked-at YYYY-MM-DD    Check date (default current UTC date)
  --help                    Show this help
The source URL must be HTTPS Goodreads /review/list_rss/<numeric ID> with shelf=ALL.
Do not commit the private source URL or raw RSS. Review the draft and diff before integration.
`;
const options = new Map([['--input-private-file', 'inputPath'], ['--source-url', 'privateSourceUrl'], ['--previous', 'previousPath'], ['--output', 'outputPath'], ['--diff-output', 'diffPath'], ['--checked-at', 'checkedAt']]);
function parseArgs(args, env) {
  const config = { previousPath: 'src/data/reading-feed.json', outputPath: 'src/data/reading-feed.draft.json', diffPath: 'src/data/reading-feed.diff.json', checkedAt: new Date().toISOString().slice(0, 10) };
  const seen = new Set();
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--help' && args.length === 1) return { help: true };
    const key = options.get(args[i]);
    if (!key || seen.has(key) || !args[i + 1] || args[i + 1].startsWith('--')) throw new FeedImportError('INPUT_ERROR');
    seen.add(key); config[key] = args[++i];
  }
  config.privateSourceUrl ||= env.GOODREADS_RSS_URL;
  if (!!config.inputPath === !!config.privateSourceUrl) throw new FeedImportError('INPUT_ERROR');
  validateCheckDate(config.checkedAt);
  return config;
}
async function readBounded(filePath, { optional = false } = {}) {
  let handle;
  try {
    handle = await fs.open(filePath, 'r');
    const info = await handle.stat();
    if (!info.isFile()) throw new FeedImportError('INPUT_ERROR');
    if (info.size > LIMITS.bytes) throw new FeedImportError('LIMIT_BYTES');
    const stream = handle.createReadStream({ autoClose: false });
    let size = 0;
    const chunks = [];
    for await (const chunk of stream) { size += chunk.byteLength; if (size > LIMITS.bytes) throw new FeedImportError('LIMIT_BYTES'); chunks.push(chunk); }
    return Buffer.concat(chunks, size);
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    if (error instanceof FeedImportError) throw error;
    throw new FeedImportError('INPUT_ERROR');
  } finally { if (handle) await handle.close(); }
}
async function sameFile(a, b) {
  if (path.resolve(a) === path.resolve(b)) return true;
  const [realA, realB] = await Promise.all([fs.realpath(a).catch(() => path.resolve(a)), fs.realpath(b).catch(() => path.resolve(b))]);
  return realA === realB;
}
/** Stage both draft files before replacing either; never target the previous public snapshot. */
async function writeDraftBundle(config, snapshot, diff) {
  const outputPath = path.resolve(config.outputPath);
  const diffPath = path.resolve(config.diffPath);
  if (await sameFile(outputPath, config.previousPath) || await sameFile(diffPath, config.previousPath) || await sameFile(outputPath, diffPath) || config.inputPath && (await sameFile(outputPath, config.inputPath) || await sameFile(diffPath, config.inputPath))) throw new FeedImportError('OUTPUT_ERROR');
  const entries = [{ target: outputPath, value: snapshot }, { target: diffPath, value: diff }];
  const staged = [];
  const replaced = [];
  try {
    for (const entry of entries) {
      await fs.mkdir(path.dirname(entry.target), { recursive: true });
      const original = await fs.readFile(entry.target).catch((error) => { if (error.code === 'ENOENT') return null; throw error; });
      const temp = `${entry.target}.${randomUUID()}.tmp`;
      await fs.writeFile(temp, `${JSON.stringify(entry.value, null, 2)}\n`, { flag: 'wx', mode: 0o644 });
      staged.push({ ...entry, temp, original });
    }
    for (const entry of staged) { await fs.rename(entry.temp, entry.target); replaced.push(entry); }
  } catch {
    for (const entry of replaced.reverse()) {
      if (entry.original === null) await fs.rm(entry.target, { force: true }).catch(() => {});
      else {
        const recovery = `${entry.target}.${randomUUID()}.recover`;
        await fs.writeFile(recovery, entry.original, { flag: 'wx' }).then(() => fs.rename(recovery, entry.target)).catch(() => fs.rm(recovery, { force: true }).catch(() => {}));
      }
    }
    throw new FeedImportError('OUTPUT_ERROR');
  } finally { await Promise.all(staged.map((entry) => fs.rm(entry.temp, { force: true }).catch(() => {}))); }
}
export async function runManualRefresh({ args = process.argv.slice(2), env = process.env, stdout = process.stdout, stderr = process.stderr, fetchImpl } = {}) {
  let config;
  let previous = null;
  try {
    config = parseArgs(args, env);
    if (config.help) { stdout.write(HELP); return 0; }
    const previousBytes = await readBounded(config.previousPath, { optional: true });
    if (previousBytes) { try { previous = JSON.parse(previousBytes.toString('utf8')); } catch { throw new FeedImportError('SNAPSHOT_INVALID'); } }
    const input = config.inputPath ? await readBounded(config.inputPath) : undefined;
    const result = await refreshReadingFeed({ privateSourceUrl: config.privateSourceUrl, input, previous, checkedAt: config.checkedAt, fetchImpl });
    if (result.status !== 'draft-ready') { stderr.write(`${JSON.stringify({ provider: 'Goodreads', status: result.status, checkedAt: result.checkedAt, lastSuccessfulCheck: result.lastSuccessfulCheck, error: result.error })}\n`); return 1; }
    await writeDraftBundle(config, result.snapshot, result.diff);
    stdout.write(`${JSON.stringify({ provider: 'Goodreads', status: 'draft-ready', checkedAt: result.checkedAt, recordCount: result.snapshot.recordCount, diff: result.diff.counts, reviewRequired: true })}\n`);
    return 0;
  } catch (error) {
    stderr.write(`${JSON.stringify({ provider: 'Goodreads', status: previous ? 'stale' : 'error', checkedAt: config?.checkedAt || null, lastSuccessfulCheck: previous?.provider === 'Goodreads' && /^\d{4}-\d{2}-\d{2}$/.test(previous?.checkedAt || '') ? previous.checkedAt : null, error: safeError(error, 'INPUT_ERROR') })}\n`);
    return 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await runManualRefresh();
