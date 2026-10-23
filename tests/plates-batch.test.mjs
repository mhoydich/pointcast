import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { entryProblems, entryFiles, imagePath, loadManifest, parseArgs, ASPECT_TO_SIZE, REPO_ROOT } from '../scripts/plates/run-batch.mjs';

const BATCH = path.join(REPO_ROOT, 'scripts', 'plates', 'batch');
const ok = { out: 'public/images/pmm/x.png', prompt: 'A pixel art scene with two phones and coloured packets.', aspect: 'square', quality: 'high' };

test('every manifest under scripts/plates/batch/ is valid and no file is written twice across them', () => {
  const files = fs.readdirSync(BATCH).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 1);
  const claimed = new Map();
  for (const f of files) assert.ok(loadManifest(path.join(BATCH, f), claimed).length >= 1, `${f} is empty`);
});

test('loadManifest rejects an og or a respelt out that lands on another entry\'s file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plates-'));
  const write = (name, list) => { const f = path.join(dir, name); fs.writeFileSync(f, JSON.stringify(list)); return f; };
  const p = 'A pixel art scene with two phones and coloured packets.';
  assert.throws(() => loadManifest(write('a.json', [{ out: 'public/images/t/a.png', og: 'public/images/t/b.png', prompt: p }, { out: 'public/images/t/b.png', prompt: p }])), /t\/b\.png is also written by a\.json #0/);
  assert.throws(() => loadManifest(write('b.json', [{ out: 'public/images/t/a.png', og: 'public/images/t/a.png', prompt: p }])), /also written/);
  assert.throws(() => loadManifest(write('c.json', [{ out: 'public/images/t/a.png', prompt: p }, { out: './public/images/t/a.png', prompt: p }])), /also written/);
  const claimed = new Map();
  loadManifest(write('d.json', [{ out: 'public/images/t/a.png', prompt: p }]), claimed);
  assert.throws(() => loadManifest(write('e.json', [{ out: 'public/images/t/c.png', og: 'public/images/t/a.png', prompt: p }]), claimed), /also written by d\.json #0/);
  assert.deepEqual(entryFiles({ out: 'public/images/t/a.png' }).map((f) => path.relative(REPO_ROOT, f)), [path.join('public', 'images', 't', 'a.png'), path.join('public', 'images', 't', 'a.webp')]);
  fs.rmSync(dir, { recursive: true });
});

test('parseArgs refuses unknown flags and a --model without a plain id', () => {
  assert.deepEqual(parseArgs(['--dry-run', 'batch/x.json']), { dry: true, force: false, model: null, files: ['batch/x.json'] });
  assert.equal(parseArgs(['--model', 'gpt-image-1']).model, 'gpt-image-1');
  assert.equal(parseArgs(['--model=gpt-image-1', '--force']).model, 'gpt-image-1');
  assert.throws(() => parseArgs(['--dryrun']), /unknown flag --dryrun/);
  assert.throws(() => parseArgs(['-n']), /unknown flag/);
  assert.throws(() => parseArgs(['--model']), /--model needs/);
  assert.throws(() => parseArgs(['--model', '--force']), /--model needs/);
  assert.throws(() => parseArgs(['--model=gpt image']), /--model needs/);
});

test('paths must stay under public/images/ and end in .png', () => {
  assert.ok(imagePath('public/images/a/b.png').endsWith(path.join('public', 'images', 'a', 'b.png')));
  assert.throws(() => imagePath('public/a.png'), /outside public\/images/);
  assert.throws(() => imagePath('public/images/../../etc/x.png'), /outside public\/images/);
  assert.throws(() => imagePath('public/images/x.jpg'), /must end in .png/);
  assert.throws(() => imagePath('public/images'), /must end in .png/);
});

test('entryProblems accepts a good entry and names each bad field', () => {
  assert.deepEqual(entryProblems(ok), []);
  assert.deepEqual(entryProblems({ ...ok, og: 'public/images/pmm/x-og.png', model: 'gpt-image-1' }), []);
  assert.match(entryProblems({ ...ok, aspect: 'wide' }).join(), /aspect/);
  assert.match(entryProblems({ ...ok, quality: 'ultra' }).join(), /quality/);
  assert.match(entryProblems({ ...ok, prompt: 'short' }).join(), /prompt/);
  assert.match(entryProblems({ ...ok, og: 'src/x.png' }).join(), /og/);
  assert.match(entryProblems({ ...ok, model: 'gpt image; rm -rf' }).join(), /model/);
  assert.deepEqual(entryProblems([]), ['entry is not an object']);
  assert.equal(ASPECT_TO_SIZE.landscape, '1536x1024');
});
