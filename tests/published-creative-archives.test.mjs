import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const files = [
  "sketches/baby-bonfire-permission/index.html",
  "sketches/baby-bonfire-permission/gate.js",
  "sketches/baby-bonfire-permission/style.css",
  "sketches/midnight-printers-2026-11-14/Midnight-Printers-The-Last-Light.md",
  "sketches/midnight-printers-2026-11-14/Midnight-Printers-The-Last-Light.png",
  "sketches/midnight-printers-2026-11-14/The-Last-Light-Garden-Music-No-1.mp3",
  "sketches/midnight-printers-2026-11-14/new_garden_cards.json",
  "sketches/midnight-printers-2026-11-14/launch/Midnight-Printers-A-Name-for-the-Apprentice.mp4",
  "sketches/midnight-printers-2026-11-14/launch/Original-Story-02-Thirty-Seven-Flowers-Forty-Guests.md",
  "sketches/midnight-printers-2026-11-14/round3/Garden-Paths.md",
  "sketches/midnight-printers-2026-11-14/round3/Garden-Start-Here.md"
];
const root = new URL('../', import.meta.url);
test('published archive files preserve the reviewed originals byte for byte', async () => {
  for (const file of files) assert.deepEqual(await readFile(new URL('public/' + file, root)), await readFile(new URL(file, root)), file);
});
test('only explicitly selected reader assets are exposed', async () => {
  async function walk(dir) { let names=[]; for(const f of await readdir(new URL('public/'+dir, root),{withFileTypes:true})) { const p=dir+'/'+f.name; names.push(...(f.isDirectory()?await walk(p):[p])); } return names; }
  const actual = [...await walk('sketches/baby-bonfire-permission'), ...await walk('sketches/midnight-printers-2026-11-14')];
  assert.deepEqual(actual.sort(), [...files,'sketches/midnight-printers-2026-11-14/index.html'].sort());
  assert.ok(!actual.some(f => /test\.cjs|Draft-Social|Tumblr-Ready|Launch-Plan|Production-Plan|Discovery-Brief/.test(f)));
});
test('reader offers opt-in media and complete stories', async () => {
 const html=await readFile(new URL('public/sketches/midnight-printers-2026-11-14/index.html',root),'utf8');
 assert.ok(!/autoplay|<script/i.test(html));
 for (const path of ['Midnight-Printers-The-Last-Light.md','launch/Original-Story-02-Thirty-Seven-Flowers-Forty-Guests.md','round3/Garden-Paths.md']) assert.ok(html.includes(path));
});
