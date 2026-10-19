import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { inflateRawSync } from 'node:zlib';
import { collectLocalFiles, prepareGameDownloads, safeRelativePath, writeZip, rewriteNavigation, DEFAULT_LIMITS } from '../scripts/prepare-game-downloads.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pointcast-download-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const dist = path.join(root, 'dist'); await fs.mkdir(dist);
  const write = async (file, content = 'fixture bytes') => { const target = path.join(dist, file); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, content); };
  return { root, dist, write };
}

function readZip(bytes) {
  const end = bytes.length - 22; assert.equal(bytes.readUInt32LE(end), 0x06054b50);
  const count = bytes.readUInt16LE(end + 10), result = new Map(); let position = bytes.readUInt32LE(end + 16);
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(position), 0x02014b50);
    const compressed = bytes.readUInt32LE(position + 20), size = bytes.readUInt32LE(position + 24), length = bytes.readUInt16LE(position + 28);
    const name = bytes.subarray(position + 46, position + 46 + length).toString();
    const local = bytes.readUInt32LE(position + 42); assert.equal(bytes.readUInt32LE(local), 0x04034b50);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const data = inflateRawSync(bytes.subarray(start, start + compressed)); assert.equal(data.length, size);
    const descriptor = start + compressed; assert.equal(bytes.readUInt32LE(descriptor), 0x08074b50);
    assert.equal(bytes.readUInt32LE(descriptor + 4), bytes.readUInt32LE(position + 16));
    let crc = 0xffffffff;
    for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1; }
    assert.equal((crc ^ 0xffffffff) >>> 0, bytes.readUInt32LE(position + 16));
    result.set(name, { data, mode: bytes.readUInt32LE(position + 38) >>> 16 & 0o777 });
    position += 46 + length + bytes.readUInt16LE(position + 30) + bytes.readUInt16LE(position + 32);
  }
  return result;
}

test('compiled closure includes HTML/srcset/CSS/ESM/dynamic assets while avoiding unrelated pages', async t => {
  const f = await fixture(t);
  await f.write('toy/index.html', '<link rel="stylesheet" href="/_astro/game.css"><script type="module" src="/_astro/game.js"></script><img srcset="/img/small.png 1x, /img/large.png 2x"><a href="/me/">Account</a><a href="#play">Play</a><iframe src="https://example.test/embed"></iframe>');
  await f.write('_astro/game.css', '@import "./colors.css"; body { background:url(../img/background.png) }');
  await f.write('_astro/colors.css', '@font-face{src:url("./font.woff2")}');
  await f.write('_astro/font.woff2'); await f.write('img/background.png'); await f.write('img/small.png'); await f.write('img/large.png');
  await f.write('_astro/game.js', 'import "./shared.js"; import("./dynamic.js"); fetch("/api/rooms"); const image=new URL("../img/runtime.png",import.meta.url);');
  await f.write('_astro/shared.js', 'export const x=1;'); await f.write('_astro/dynamic.js', 'export {x} from "./shared.js";'); await f.write('img/runtime.png');
  await f.write('toy/editions/v2/index.html', '<img src="/img/small.png">'); await f.write('toy/assets/computed.json');
  await f.write('unrelated/index.html', 'unrelated'); await f.write('img/huge-unrelated.png', Buffer.alloc(1000)); await f.write('me/index.html', 'private page');
  const closure = await collectLocalFiles({ dist: f.dist, entry: '/toy/', include: ['public/toy/assets', '/toy/editions/v2/'] });
  const files = closure.files.map(file => file.path);
  for (const file of ['_astro/dynamic.js', '_astro/shared.js', '_astro/font.woff2', 'img/large.png', 'img/runtime.png', 'toy/assets/computed.json', 'toy/editions/v2/index.html']) assert.ok(files.includes(file), file);
  assert.ok(!files.includes('me/index.html')); assert.ok(!files.includes('unrelated/index.html')); assert.ok(!files.includes('img/huge-unrelated.png'));
  assert.deepEqual(closure.externalReferences, ['https://example.test/embed']); assert.ok(closure.onlineFeatures.includes('/api/rooms'));
  const html = closure.files.find(file => file.path === 'toy/index.html').data.toString();
  assert.match(html, /href="https:\/\/pointcast.xyz\/me\/"/); assert.match(html, /href="#play"/);
});

test('HTML base paths resolve bundled module dependencies in the correct game directory', async t => {
  const f = await fixture(t);
  await f.write('cat/index.html', '<base href="/cat/"><script type="module" src="vendor/main.js"></script>');
  await f.write('cat/vendor/main.js', 'import "./core.js";'); await f.write('cat/vendor/core.js');
  const result = await collectLocalFiles({ dist: f.dist, entry: '/cat/' });
  assert.deepEqual(result.files.map(file => file.path), ['cat/index.html', 'cat/vendor/core.js', 'cat/vendor/main.js']);
});

test('navigation rewriting preserves script template interpolation and ignores commented dependencies', async t => {
  const f = await fixture(t);
  const script = '<script>const row=`<a href="${escapeHtml(block.url)}">Block</a>`; // import("./missing.js")\n/* const image="/missing.png"; */</script>';
  const html = script + '<a href="/games/">Directory</a><!-- <a href="/me/">Example</a> -->';
  const rewritten = rewriteNavigation(html, '/collabs/arena/');
  assert.ok(rewritten.startsWith(script)); assert.match(rewritten, /href="https:\/\/pointcast.xyz\/games\/"/);
  assert.ok(rewritten.endsWith('<!-- <a href="/me/">Example</a> -->'));
  await f.write('collabs/arena/index.html', html);
  const closure = await collectLocalFiles({ dist: f.dist, entry: '/collabs/arena/' });
  assert.equal(closure.files.length, 1);
});

test('explicit public folders omit Node-only asset generators but required browser modules fail closed', async t => {
  const f = await fixture(t);
  await f.write('toy/index.html', '<script type="module" src="./game.mjs"></script>');
  await f.write('toy/game.mjs', 'export const game=true;');
  await f.write('toy/scripts/generate.mjs', 'import fs from "node:fs/promises"; import imageData from "../../package/dist/image-data.json";');
  const result = await collectLocalFiles({ dist: f.dist, entry: '/toy/', include: ['/toy'] });
  assert.deepEqual(result.excludedBuildFiles, ['toy/scripts/generate.mjs']);
  assert.ok(!result.files.some(file => file.path.endsWith('generate.mjs')));
  await f.write('toy/index.html', '<script type="module" src="./scripts/generate.mjs"></script>');
  await assert.rejects(collectLocalFiles({ dist: f.dist, entry: '/toy/', include: ['/toy'] }), /playable page references a Node-only/);
});

test('deployment signer filename metadata is not fetched, while actual missing loader URLs still fail', async t => {
  const f = await fixture(t);
  await f.write('toy/index.html', '<script type="module" src="./contracts.js"></script>');
  await f.write('toy/contracts.js', 'export const config={_notes:{signerKeyFile:"/tmp/pointcast-shadownet-signer.json"}};');
  const result = await collectLocalFiles({ dist: f.dist, entry: '/toy/' });
  assert.deepEqual(result.excludedMetadataReferences, ['toy/contracts.js: /tmp/pointcast-shadownet-signer.json']);
  assert.equal(result.files.length, 2);
  await f.write('toy/contracts.js', 'fetch("/tmp/pointcast-shadownet-signer.json");');
  await assert.rejects(collectLocalFiles({ dist: f.dist, entry: '/toy/' }), /Missing compiled dependency/);
});

test('traversal, private includes, missing resources, escaped symlinks and budgets fail explicitly', async t => {
  const f = await fixture(t);
  for (const name of ['../escape', '/%2e%2e/escape', 'C:/escape', 'a\\b', '.env', '/api/me', '//remote/path']) assert.throws(() => safeRelativePath(name));
  await f.write('toy/index.html', '<img src="../../escape.png">');
  await assert.rejects(collectLocalFiles({ dist: f.dist, entry: '/toy/' }), /escapes/);
  await f.write('toy/index.html', '<img src="/missing.png">');
  await assert.rejects(collectLocalFiles({ dist: f.dist, entry: '/toy/' }), /Missing compiled/);
  await f.write('toy/index.html', '<img src="/outside.png">'); await fs.writeFile(path.join(f.root, 'outside.png'), 'private'); await fs.symlink(path.join(f.root, 'outside.png'), path.join(f.dist, 'outside.png'));
  await assert.rejects(collectLocalFiles({ dist: f.dist, entry: '/toy/' }), /Symlink escapes/);
  await f.write('toy/index.html', '<p>play</p>');
  await assert.rejects(collectLocalFiles({ dist: f.dist, entry: '/toy/', include: ['/api/me'] }), /Private\/API/);
  await assert.rejects(collectLocalFiles({ dist: f.dist, entry: '/toy/', limits: { ...DEFAULT_LIMITS, maxBytes: 2 } }), /budget/);
});

test('local ZIP roundtrip preserves actual game bytes, root layout and executable launcher deterministically', async t => {
  const f = await fixture(t); await f.write('toy/index.html', '<h1>Playable fixture</h1><a href="/games/">More</a>');
  const catalog = [{ slug: 'toy', name: 'Toy', route: '/toy/', download: { kind: 'local', entry: '/toy/', include: [], note: 'Online rooms need the live page.' } }];
  const first = await prepareGameDownloads({ dist: f.dist, catalog });
  const target = path.join(f.dist, 'downloads/games/toy.zip'), bytes = await fs.readFile(target), files = readZip(bytes);
  assert.match(files.get('toy/site/toy/index.html').data.toString(), /Playable fixture/);
  assert.match(files.get('toy/site/toy/index.html').data.toString(), /https:\/\/pointcast.xyz\/games\//);
  assert.equal(files.get('toy/Start-Game.command').mode, 0o755);
  assert.match(files.get('toy/serve.py').data.toString(), /ENTRY = "\/toy\/"/); assert.match(files.get('toy/serve.py').data.toString(), /127\.0\.0\.1/);
  assert.match(files.get('toy/README.md').data.toString(), /Online features may need the live PointCast page/); assert.match(files.get('toy/README.md').data.toString(), /never proxies APIs/);
  await fs.utimes(path.join(f.dist, 'toy/index.html'), Date.now() / 1000, Date.now() / 1000);
  const second = await prepareGameDownloads({ dist: f.dist, catalog });
  assert.deepEqual(await fs.readFile(target), bytes); assert.deepEqual(first, second);
});

test('online kits contain real platform shortcuts and explicitly require Internet', async t => {
  const f = await fixture(t);
  const manifest = await prepareGameDownloads({ dist: f.dist, catalog: [{ slug: 'online-game', name: 'Online game', download: { kind: 'online', entry: '/satellite/', note: 'Live sessions only.' } }] });
  const files = readZip(await fs.readFile(path.join(f.dist, 'downloads/games/online-game.zip')));
  assert.equal(files.size, 4); assert.match(files.get('online-game/Open-Game.webloc').data.toString(), /<string>https:\/\/pointcast.xyz\/satellite\/<\/string>/);
  assert.match(files.get('online-game/Open-Game.url').data.toString(), /\[InternetShortcut\]\r\nURL=https:/);
  assert.match(files.get('online-game/Launch.html').data.toString(), /Internet is required; no local game/);
  assert.match(files.get('online-game/README.md').data.toString(), /Internet required/); assert.equal(manifest.games[0].kind, 'online');
});

test('prepared ZIPs retain exact release bytes and writer rejects traversal or over-budget data', async t => {
  const f = await fixture(t); const prepared = path.join(f.dist, 'downloads/games/prepared.zip');
  await writeZip([{ path: 'prepared/game.html', data: '<p>prepared release</p>' }], prepared);
  const before = await fs.readFile(prepared);
  const manifest = await prepareGameDownloads({ dist: f.dist, catalog: [{ slug: 'prepared', name: 'Prepared', download: { kind: 'prepared', entry: '/downloads/games/prepared.zip' } }] });
  assert.deepEqual(await fs.readFile(prepared), before); assert.equal(manifest.games[0].prepared, true);
  await assert.rejects(writeZip([{ path: '../unsafe', data: 'unsafe' }], path.join(f.root, 'unsafe.zip')), /Unsafe/);
  await assert.rejects(writeZip([{ path: 'safe/data', data: 'too large' }], path.join(f.root, 'large.zip'), { ...DEFAULT_LIMITS, maxBytes: 1 }), /budget/);
  await assert.rejects(fs.stat(path.join(f.root, 'large.zip.partial')), /ENOENT/);
  await assert.rejects(writeZip([{ path: 'safe/data', data: 'compressed deployment check' }], path.join(f.root, 'asset.zip'), { ...DEFAULT_LIMITS, maxArchiveBytes: 1 }), /single-asset deployment limit/);
  await assert.rejects(fs.stat(path.join(f.root, 'asset.zip.partial')), /ENOENT/);
  await assert.rejects(prepareGameDownloads({ dist: f.dist, limits: { ...DEFAULT_LIMITS, maxArchiveBytes: 1 }, catalog: [{ slug: 'prepared', name: 'Prepared', download: { kind: 'prepared', entry: '/downloads/games/prepared.zip' } }] }), /deployment limit/);
});
