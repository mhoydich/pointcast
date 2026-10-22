// End-to-end run of the SDK this site serves, used the way the pages tell people to use it:
//
//   node scripts/e2e-chain-app-sdksync.mjs [http://127.0.0.1:8799] [--site dist] [--live]
//
// WRITES GO ONLY TO A LOCAL DEVNET (http://127.0.0.1:PORT, the throwaway devnet-2). The public
// devnet is never written to: every child process runs with a fetch guard that refuses any
// address but the local one, and the one source of live pins (bot.mjs's DEVNET and GENESIS) is
// patched in a temp copy before it runs. --live adds GET reads of pointcast.xyz only.
// What it does, in order, printing one line per result:
//   1. serves the built site (dist/, else public/) on a port of its own and reads the local
//      devnet's /status;
//   2. runs the /chain/bots one-command quickstart as the built page prints it, in an empty
//      temp dir with the host swapped for the local server: the three files arrive, the SDK is
//      the pinned file, bot.mjs is the built bot.mjs;
//   3. patches bot.mjs's DEVNET, CHAIN_ID and GENESIS to the local devnet (nothing else changes),
//      runs it: a signed post lands on the local chain, in a block, with its title; runs it again
//      with the printed seed (the "reuse it" path); a wrong genesis pin is refused and nothing posts;
//   4. runs the /chain/net quickstart's four files and `pc-witness.mjs --dry-run` against the
//      local devnet (a replay from genesis; nothing is sent);
//   5. runs the /chain/dev SDK snippet's connect() with a local pin and calls every chain.method
//      the dev and bots pages print, and the /chain/bloom recipe from the page against bloom.js;
//   6. --live: downloads /chain/sdk/pointcast-chain.js from pointcast.xyz, compares it with the pin
//      and connects to the live devnet with bot.mjs's pin (reads only).
// Exit status 1 on any mismatch.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { homedir, tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { SDK_SOURCE } from '../src/data/chain-sdk-source.ts';
import { checkCopies } from './sync-chain-sdk.mjs';
import { harness, reach, root } from './lib/e2e-chain-apps.mjs';

const h = harness('The served SDK', 'e2e-chain-app-sdksync');
const { check, say, localOnly, api } = h;
const rootPath = fileURLToPath(root);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const siteDir = resolve(rootPath, h.opt('--site') || (existsSync(new URL('dist/chain/sdk/pointcast-chain.js', root)) ? 'dist' : 'public'));
const builtPages = existsSync(join(siteDir, 'chain/bots/index.html'));
const dirs = [];
const tmp = (p) => { const d = mkdtempSync(join(tmpdir(), p)); dirs.push(d); return d; };
// Async, not spawnSync: the static server below lives in this process and must keep answering while a child downloads from it.
const run = (cmd, args, cwd, env, ms) => new Promise((done) => {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env } });
  let stdout = '';
  let stderr = '';
  const timer = setTimeout(() => child.kill('SIGKILL'), ms);
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });
  child.on('close', (status) => { clearTimeout(timer); done({ status, stdout, stderr }); });
});
const sh = (command, cwd, env = {}) => run('sh', ['-c', command], cwd, env, 60000);
const nodeRun = (args, cwd, env = {}) => run(process.execPath, args, cwd, env, 120000);
const getJson = async (path) => { const r = await fetch(api + path, { signal: AbortSignal.timeout(8000) }); return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) }; };

// A fetch that cannot leave the local devnet, preloaded into every child that could write.
const guardDir = tmp('sdksync-guard-');
const GUARD = join(guardDir, 'guard.mjs');
writeFileSync(GUARD, `const allow = process.env.PC_E2E_ALLOW;
const real = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const u = String(input && input.url ? input.url : input);
  if (!allow || !u.startsWith(allow + '/')) throw new Error('e2e guard: refusing to fetch ' + u + ' (only ' + allow + ' is allowed)');
  return real(input, init);
};
`);
const guarded = (args) => ['--import', pathToFileURL(GUARD).href, ...args];
const GUARD_ENV = { PC_E2E_ALLOW: api };

function serve(dir) {
  const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.wasm': 'application/wasm' };
  const srv = http.createServer((req, res) => {
    const p = resolve(dir, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(dir + sep) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': types[p.slice(p.lastIndexOf('.'))] || 'application/octet-stream' });
    res.end(readFileSync(p));
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

/** The text of the first <pre><code> on a built page that starts with `start`, or null. */
function codeBlock(page, start) {
  const file = join(siteDir, page);
  if (!existsSync(file)) return null;
  const doc = new JSDOM(readFileSync(file, 'utf8')).window.document;
  return [...doc.querySelectorAll('pre code')].map((c) => c.textContent).find((t) => t.startsWith(start)) ?? null;
}
/** A quickstart's text: the built page's, or the page source's String.raw constant when there is no build. */
function quickstart(page, start, astro, constName) {
  const built = codeBlock(page, start);
  if (built) return { text: built, from: 'the built page' };
  const m = readFileSync(new URL(astro, root), 'utf8').match(new RegExp(`const ${constName} = String\\.raw\`([\\s\\S]*?)\`;`));
  return m ? { text: m[1].replaceAll('${SITE}', 'https://pointcast.xyz'), from: astro + ' (no build)' } : null;
}

async function main() {
  // ---------------------------------------------------------------- 1. the site and the local devnet
  localOnly(api);
  const status = await reach(api);
  check(!!status, `local devnet ${api} answers /status`);
  if (!status) return;
  say(`     chain ${status.chain_id} · height ${status.height} · genesis ${status.genesis_hash.slice(0, 12)}…`);
  const srv = await serve(siteDir);
  const origin = `http://127.0.0.1:${srv.address().port}`;
  say(`     serving ${siteDir === resolve(rootPath, 'dist') ? 'dist/' : siteDir.replace(rootPath, '')} at ${origin}${builtPages ? ' (built pages found)' : ' (no built pages: quickstarts are read from the page sources)'}`);
  const copies = checkCopies(rootPath);
  check(copies.ok, `the three source copies are one file and the pin: ${copies.ok ? sha(readFileSync(join(siteDir, 'chain/sdk/pointcast-chain.js'))).slice(0, 12) : copies.problems.join('; ')}`);
  for (const rel of ['chain/sdk/pointcast-chain.js', 'chain/net/pointcast-chain.js', 'chain/first-mints/lib/pointcast-chain.js']) {
    check(existsSync(join(siteDir, rel)) && sha(readFileSync(join(siteDir, rel))) === SDK_SOURCE.sha256, `${siteDir === resolve(rootPath, 'dist') ? 'dist' : 'public'}/${rel} is the pinned file (pointcast-chain ${SDK_SOURCE.commit}, ${SDK_SOURCE.bytes} bytes)`);
  }
  const repoSdk = join(process.env.PC_CHAIN_REPO || join(homedir(), 'pointcast-chain'), 'sdk/pointcast-chain.js');
  if (existsSync(repoSdk)) say(`     the pointcast-chain repo's current sdk/pointcast-chain.js ${sha(readFileSync(repoSdk)) === SDK_SOURCE.sha256 ? 'is' : 'is NOT (the repo has moved on; not a failure)'} the served file`);

  // ---------------------------------------------------------------- 2. the bots quickstart, as printed
  const q = quickstart('chain/bots/index.html', 'mkdir pc-bot', 'src/pages/chain/bots.astro', 'signedQuickstart');
  check(!!q, 'the /chain/bots one-command quickstart is on the page' + (q ? ` (from ${q.from})` : ''));
  if (!q) { srv.close(); return; }
  const parts = q.text.match(/^([\s\S]*?)\s*&& node bot\.mjs ("[^"]*")\s*$/);
  check(!!parts, 'the quickstart is "download three files && node bot.mjs <title>"');
  const download = parts[1].replaceAll('https://pointcast.xyz', origin);
  check(!download.includes('pointcast.xyz'), 'the swap leaves no pointcast.xyz URL: the download is from the local server only');
  const empty = tmp('sdksync-quick-');
  check(readdirSync(empty).length === 0, 'the working folder starts empty');
  const dl = await sh(download, empty);
  check(dl.status === 0, 'the quickstart\'s curl line runs: exit ' + dl.status + (dl.stderr ? ' ' + dl.stderr.trim().slice(0, 160) : ''));
  const bot = join(empty, 'pc-bot');
  const got = existsSync(bot) ? readdirSync(bot).sort() : [];
  check(JSON.stringify(got) === JSON.stringify(['bot.mjs', 'package.json', 'pointcast-chain.js']), 'it brought exactly bot.mjs, package.json and pointcast-chain.js: ' + got.join(', '));
  const pcc = join(bot, 'pointcast-chain.js');
  check(existsSync(pcc) && sha(readFileSync(pcc)) === SDK_SOURCE.sha256, 'the downloaded pointcast-chain.js is the pinned file: ' + (existsSync(pcc) ? sha(readFileSync(pcc)).slice(0, 12) : 'missing') + ', ' + (existsSync(pcc) ? readFileSync(pcc, 'utf8').split('\n').length - 1 : 0) + ' lines');
  check(readFileSync(join(bot, 'bot.mjs'), 'utf8') === readFileSync(join(siteDir, 'chain/bots/bot.mjs'), 'utf8'), 'the downloaded bot.mjs is the built bot.mjs');

  // ---------------------------------------------------------------- 3. bot.mjs against the local devnet
  const served = readFileSync(join(bot, 'bot.mjs'), 'utf8');
  const patch = (src, genesis) => src
    .replace(/^const DEVNET = ".*";$/m, `const DEVNET = "${api}";`)
    .replace(/^const CHAIN_ID = ".*";$/m, `const CHAIN_ID = "${status.chain_id}";`)
    .replace(/^const GENESIS = ".*";$/m, `const GENESIS = "${genesis}";`);
  const local = patch(served, status.genesis_hash);
  const changed = local.split('\n').map((l, i) => (l === served.split('\n')[i] ? null : l)).filter((l) => l !== null);
  check(changed.length >= 2 && changed.length <= 3 && changed.every((l) => /^const (DEVNET|CHAIN_ID|GENESIS) = /.test(l)), `the temp copy of bot.mjs differs from the served one in ${changed.length} constant line(s) only: ${changed.map((l) => l.split(' ')[1]).join(', ')}`);
  check(!/workers\.dev|pointcast\.xyz/.test(local.replace(/^\/\/.*$/gm, '')), 'the patched code names no public address (its comments still do)');
  const localBot = join(bot, 'bot-local.mjs');
  writeFileSync(localBot, local);
  const title = 'e2e sdksync ' + new Date().toISOString().slice(11, 19);
  const before = (await getJson('/status')).body.height;
  const run1 = await nodeRun(guarded([localBot, title, 'from the served SDK']), bot, { ...GUARD_ENV, BOT_SEED: '' });
  const lines1 = run1.stdout.trim().split('\n');
  const seed = (lines1.find((l) => l.startsWith('new key: reuse it with BOT_SEED=')) || '').split('BOT_SEED=')[1];
  say('     ' + lines1.map((l) => l.replace(/BOT_SEED=[0-9a-f]{64}/, 'BOT_SEED=<redacted>')).join('\n     '));
  check(run1.status === 0 && /^posting as tz1[1-9A-HJ-NP-Za-km-z]{33}$/.test(lines1.find((l) => l.startsWith('posting as')) || ''), 'bot.mjs with the served SDK exits 0 and prints the new tz1 account: ' + (run1.stderr.trim().split('\n')[0] || 'no error'));
  const inc = lines1.find((l) => l.startsWith('included at height '));
  const height = inc && Number(inc.match(/height (\d+)/)[1]);
  const txUrl = (lines1.find((l) => l.startsWith('tx ')) || '').slice(3);
  check(!!inc && inc.endsWith(`: ${api}/block/${height}`) && txUrl.startsWith(api + '/tx/'), 'it says which local block took the post and links the tx on the local devnet only');
  const sender = (lines1.find((l) => l.startsWith('posting as')) || '').slice('posting as '.length);
  if (height) {
    const blk = await getJson('/block/' + height);
    const tx = await getJson('/tx/' + txUrl.split('/tx/')[1]);
    check(blk.ok && JSON.stringify(blk.body).includes(title) && JSON.stringify(blk.body).includes(sender), `block ${height} on the local devnet carries "${title}" from ${sender.slice(0, 10)}…`);
    check(tx.ok && JSON.stringify(tx.body).includes(sender), 'GET /tx/<hash> finds the signed transaction, from the same account');
  }
  check(!!seed && /^[0-9a-f]{64}$/.test(seed), 'it printed a 64-hex seed to keep');
  if (seed) {
    const run2 = await nodeRun(guarded([localBot, title + ' again', 'same key']), bot, { ...GUARD_ENV, BOT_SEED: seed });
    const out2 = run2.stdout.trim().split('\n');
    check(run2.status === 0 && out2[0] === 'posting as ' + sender && /^included at height \d+/.test(out2[1] || '') && Number(out2[1].match(/height (\d+)/)[1]) > height, 'BOT_SEED reuse: the same account posts again, in a later block (' + (out2[1] || run2.stderr.trim().slice(0, 100)) + ')');
  }
  // the control: a wrong genesis pin is refused, and nothing posts (this is what the old file did for the right pin)
  const tipBefore = (await getJson('/status')).body.height;
  const wrong = join(bot, 'bot-wrong-genesis.mjs');
  writeFileSync(wrong, patch(served, '00'.repeat(32)));
  const bad = await nodeRun(guarded([wrong, 'must not post']), bot, { ...GUARD_ENV, BOT_SEED: '' });
  const tipAfter = (await getJson('/status')).body.height;
  check(bad.status !== 0 && /genesis [0-9a-f]{64}, expected 0{64}/.test(bad.stderr), 'control: a wrong genesis pin is refused ("' + (bad.stderr.match(/^ChainError[^:\n]*: [^\n]*/m) || ['no error'])[0].slice(0, 130) + '")');
  check(tipAfter === tipBefore, `control: the refused run posted nothing (tip ${tipBefore} → ${tipAfter})`);
  check(before < (await getJson('/status')).body.height, `the chain moved: tip ${before} → ${(await getJson('/status')).body.height}`);

  // ---------------------------------------------------------------- 4. the net quickstart's folder
  const nq = quickstart('chain/net/index.html', 'mkdir pc-witness', 'src/pages/chain/net.astro', 'witnessQuickstart');
  if (nq) {
    const dl2 = nq.text.match(/^([\s\S]*?)\s*&& node pc-witness\.mjs/);
    const nempty = tmp('sdksync-net-');
    const r = dl2 ? await sh(dl2[1].replaceAll('https://pointcast.xyz', origin), nempty) : { status: -1, stderr: 'no curl line' };
    const dir = join(nempty, 'pc-witness');
    check(r.status === 0 && JSON.stringify(readdirSync(dir).sort()) === JSON.stringify(['package.json', 'pc-witness.mjs', 'pointcast-chain.js', 'witness.js']), 'the /chain/net quickstart brings its four files' + (nq.from === 'the built page' ? '' : ' (' + nq.from + ')'));
    check(sha(readFileSync(join(dir, 'pointcast-chain.js'))) === SDK_SOURCE.sha256, 'its pointcast-chain.js is the pinned file too');
    const dry = await nodeRun(guarded(['pc-witness.mjs', '--name', 'e2e-sdksync', '--dry-run', '--devnet', api, '--genesis', status.genesis_hash, '--verifier', join(siteDir, 'chain/yard/verifier'), '--dir', join(dir, '.pcw')]), dir, { ...GUARD_ENV, BOT_SEED: '' });
    check(dry.status === 0 && /--dry-run: nothing was sent/.test(dry.stdout) && /replayed \d+ blocks from genesis [0-9a-f]{12}… · no faults/.test(dry.stdout), 'pc-witness.mjs --dry-run replays the local devnet with that SDK, no faults, sends nothing: ' + ((dry.stdout.match(/replayed [^\n]*/) || [dry.stderr.trim().slice(0, 120)])[0]).slice(0, 100));
  } else check(false, 'the /chain/net quickstart is on the page');

  // ---------------------------------------------------------------- 5. the dev page's snippet, the bloom recipe
  const dev = codeBlock('chain/dev/index.html', 'import * as pcc from "https://pointcast.xyz/chain/sdk/pointcast-chain.js"');
  const devSign = codeBlock('chain/dev/index.html', "// For the creator's desk");
  check(!!dev && !!devSign, 'the /chain/dev SDK snippets are on the built page' + (builtPages ? '' : ' (skipped: no build)'));
  if (dev && devSign) {
    const names = [...new Set([...(dev + devSign).matchAll(/\bchain\.([A-Za-z]+)\(/g)].map((m) => m[1]))];
    const dir = tmp('sdksync-dev-');
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'pointcast-chain.js'), readFileSync(join(siteDir, 'chain/sdk/pointcast-chain.js')));
    const connectOnly = dev.slice(dev.indexOf('const chain'), dev.indexOf('// 2.')).replace('"http://127.0.0.1:8545"', JSON.stringify(api)).replace('"pointcast-dev"', JSON.stringify(status.chain_id)).replace('GENESIS_HASH', JSON.stringify(status.genesis_hash));
    writeFileSync(join(dir, 'snippet.mjs'), `import * as pcc from "./pointcast-chain.js";\n${connectOnly}\nconst names = ${JSON.stringify(names)};\nconst missing = names.filter((n) => typeof chain[n] !== "function");\nconsole.log(JSON.stringify({ missing, names }));\nconst drop = await chain.getDrop("coffee-mug-0");\nconsole.log("getDrop exists=" + drop.exists + " id=" + drop.id);\nfor (const [n, arg] of [["getMints", "coffee-mug-0"], ["getHoldings", ${JSON.stringify(status.house)}]]) { try { await chain[n](arg, { drop: "coffee-mug-0" }); console.log(n + " ok"); } catch (e) { console.log(n + " " + e.constructor.name + ": " + e.message.slice(0, 60)); } }\n`);
    const r = await nodeRun(guarded(['snippet.mjs']), dir, GUARD_ENV);
    const lines = r.stdout.trim().split('\n');
    const info = JSON.parse(lines[0] || '{"missing":["?"],"names":[]}');
    check(r.status === 0 && info.missing.length === 0 && info.names.length >= 8, `the dev snippet's connect() pins the local devnet and every chain.method the dev page prints exists (${info.names.join(', ')}): ${r.status === 0 ? 'ok' : r.stderr.trim().split('\n')[0]}`);
    check(/^getDrop exists=false id=coffee-mug-0$/.test(lines[1] || ''), 'getDrop answers on the local devnet: ' + lines[1]);
    say('     ' + lines.slice(2).join(' · ') + ' (the Worker devnet has no holdings routes; the dev quickstart is for a local node)');
  }
  const botNames = [...new Set([...served.matchAll(/\bchain\.([A-Za-z]+)\(/g)].map((m) => m[1]))];
  {
    const dir = tmp('sdksync-bn-');
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'pointcast-chain.js'), readFileSync(join(siteDir, 'chain/sdk/pointcast-chain.js')));
    writeFileSync(join(dir, 'm.mjs'), `import { connect } from "./pointcast-chain.js";\nconst chain = await connect(${JSON.stringify(api)}, { expect: { chainId: ${JSON.stringify(status.chain_id)}, genesisHash: ${JSON.stringify(status.genesis_hash)} } });\nconsole.log(${JSON.stringify(botNames)}.filter((n) => typeof chain[n] !== "function").join(",") || "none missing");\n`);
    const r = await nodeRun(guarded(['m.mjs']), dir, GUARD_ENV);
    check(r.status === 0 && r.stdout.trim() === 'none missing', `every chain.method bot.mjs calls exists on the connected client (${botNames.join(', ')})`);
  }
  const recipe = codeBlock('chain/bloom/index.html', "import { blake2b, hexToBytes } from 'https://pointcast.xyz/chain/sdk/pointcast-chain.js';");
  if (recipe) {
    const dir = tmp('sdksync-bloom-');
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'pointcast-chain.js'), readFileSync(join(siteDir, 'chain/sdk/pointcast-chain.js')));
    writeFileSync(join(dir, 'recipe.mjs'), recipe.replace('https://pointcast.xyz/chain/sdk/pointcast-chain.js', './pointcast-chain.js'));
    const B = await import(pathToFileURL(join(rootPath, 'public/chain/apps/bloom.js')).href);
    const printed = await import(pathToFileURL(join(dir, 'recipe.mjs')).href);
    const hashes = Array.from({ length: 40 }, (_, i) => sha(String(i)));
    check(hashes.every((x) => printed.bloom(x) === B.bloomSvg(x)), 'the /chain/bloom recipe, run against the served SDK, draws the same bytes as bloom.js for 40 hashes');
  } else check(!builtPages, 'the /chain/bloom recipe is on the built page' + (builtPages ? '' : ' (skipped: no build)'));

  // ---------------------------------------------------------------- 6. --live: reads of pointcast.xyz and the live devnet
  if (h.flag('--live')) {
    const r = await fetch('https://pointcast.xyz/chain/sdk/pointcast-chain.js', { signal: AbortSignal.timeout(30000) });
    const buf = Buffer.from(await r.arrayBuffer());
    check(r.ok && sha(buf) === SDK_SOURCE.sha256, `live /chain/sdk/pointcast-chain.js is the pinned file: ${r.status} ${buf.length} bytes sha256 ${sha(buf).slice(0, 12)} (pin ${SDK_SOURCE.sha256.slice(0, 12)})`);
    const dir = tmp('sdksync-live-');
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'pointcast-chain.js'), buf);
    const pin = (re) => served.match(re)[1];
    writeFileSync(join(dir, 'm.mjs'), `import { connect } from "./pointcast-chain.js";\ntry { await connect(${JSON.stringify(pin(/^const DEVNET = "([^"]+)";$/m))}, { expect: { chainId: ${JSON.stringify(pin(/^const CHAIN_ID = "([^"]+)";$/m))}, genesisHash: ${JSON.stringify(pin(/^const GENESIS = "([0-9a-f]{64})";$/m))} } }); console.log("connect ok"); } catch (e) { console.log("connect failed: " + e.message); }\n`);
    const c = await nodeRun(['m.mjs'], dir);
    check(c.stdout.trim() === 'connect ok', 'the live-served SDK pins the live devnet-2 with bot.mjs\'s constants (GET reads only): ' + c.stdout.trim());
  }
  srv.close();
}

try {
  await main();
} finally {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}
h.finish();
