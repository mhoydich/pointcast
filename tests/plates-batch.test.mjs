import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { entryProblems, imagePath, loadManifest, ASPECT_TO_SIZE, REPO_ROOT } from '../scripts/plates/run-batch.mjs';

const BATCH = path.join(REPO_ROOT, 'scripts', 'plates', 'batch');
const ok = { out: 'public/images/pmm/x.png', prompt: 'A pixel art scene with two phones and coloured packets.', aspect: 'square', quality: 'high' };

test('every manifest under scripts/plates/batch/ is valid and has no duplicate outputs across files', () => {
  const files = fs.readdirSync(BATCH).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 1);
  const seen = new Map();
  for (const f of files) {
    const list = loadManifest(path.join(BATCH, f));
    assert.ok(list.length >= 1, `${f} is empty`);
    for (const e of list) {
      assert.ok(!seen.has(e.out), `${e.out} is in both ${seen.get(e.out)} and ${f}`);
      seen.set(e.out, f);
    }
  }
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
