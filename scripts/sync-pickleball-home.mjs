// RALLY owns the shared experience; PointCast consumes an exact static mirror.
// Update: node scripts/sync-pickleball-home.mjs --source /path/to/tez-rally/src/pickleball-home
// Verify: node scripts/sync-pickleball-home.mjs --check [--source /path/to/source]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const files = ['render.js', 'client.js', 'styles.css', 'learning.json', 'courts.json'];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'src/lib/pickleball-home');
const index = process.argv.indexOf('--source');
const source = index < 0 ? null : resolve(process.argv[index + 1] ?? '');
const check = process.argv.includes('--check');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (!check && !source) throw new Error('Pass --source pointing at the reviewed RALLY src/pickleball-home directory.');
await mkdir(target, { recursive: true });
const expected = source
  ? JSON.parse(await readFile(resolve(source, 'shared-version.json'), 'utf8'))
  : JSON.parse(await readFile(resolve(target, 'shared-version.json'), 'utf8'));
for (const file of files) {
  const bytes = await readFile(resolve(source ?? target, file));
  if (hash(bytes) !== expected.files[file]) throw new Error(`Shared manifest mismatch: ${file}`);
  if (check) {
    if (hash(await readFile(resolve(target, file))) !== expected.files[file]) throw new Error(`PointCast mirror drift: ${file}`);
  } else await writeFile(resolve(target, file), bytes);
}
if (!check) await writeFile(resolve(target, 'shared-version.json'), JSON.stringify(expected, null, 2) + '\n');
console.log(`${check ? 'Verified' : 'Synced'} shared pickleball experience ${expected.version}.`);
