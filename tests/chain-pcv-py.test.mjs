// /chain/bots#python — pcv.py, the second, Python verifier (block 0694; its
// state-root replay, block 0724). public/chain/bots/pcv.py is a copy of
// tools/pcv-py/pcv.py from the pointcast-chain repo (main at a1df59e). The
// page shows its sha256, computed from the file when the page is built;
// nothing here or there types the hash in. Since 2026-10-21 pcv replays the
// state machine and recomputes every state root, and the copy says so, and
// says who wrote the replay (Claude Code, not a second lab) and what pcv
// still does not check: five tx kinds it does not replay, wallet-text and
// secp256k1 signatures, and it is not every consensus rule. Block 0694 is a
// dated historical block and keeps its own words.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { DEVNET as DEVNET_LIVE, DEVNET_PREVIOUS } from '../src/data/chain-home.ts';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const PCV = 'public/chain/bots/pcv.py';
const pcvBytes = readFileSync(new URL(PCV, root));
const pcv = pcvBytes.toString('utf8');
const SHA = createHash('sha256').update(pcvBytes).digest('hex');
const page = read('src/pages/chain/bots.astro');
const chainHome = read('src/data/chain-home.ts');
const block = JSON.parse(read('src/content/blocks/0694.json'));
const block724 = JSON.parse(read('src/content/blocks/0724.json'));
const news = JSON.parse(read('src/data/front-door-news.json'));

const DEVNET_URL = chainHome.match(/const DEVNET_URL = '([^']+)'/)[1];
// The live pin (devnet-2), read from the module: never a hash typed into a test.
const GENESIS = DEVNET_LIVE.genesis;
const PREVIOUS_GENESIS = DEVNET_PREVIOUS.genesis;

/** The text of a `const name = String.raw\`…\`;` in the page frontmatter. */
const rawConst = (name) => {
  const m = page.match(new RegExp(`const ${name} = String\\.raw\`([\\s\\S]*?)\`;`));
  assert.ok(m, `const ${name} in bots.astro`);
  return m[1];
};
const section = page.slice(page.indexOf('<section id="python"'), page.indexOf('</section>', page.indexOf('<section id="python"')));

test('pcv.py compiles with python3 (py_compile, bytecode written outside public/)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pcv-py-'));
  try {
    const r = spawnSync('python3', ['-B', '-c', 'import py_compile, sys; py_compile.compile(sys.argv[1], cfile=sys.argv[2], doraise=True)',
      fileURLToPath(new URL(PCV, root)), join(dir, 'pcv.pyc')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.ok(!existsSync(new URL('public/chain/bots/__pycache__', root)), 'no __pycache__ in public/');
});

test('the page computes the sha256 from the served file at build; no hash is typed in', () => {
  assert.match(page, /^import pcvPy from '\.\.\/\.\.\/\.\.\/public\/chain\/bots\/pcv\.py\?raw';$/m);
  assert.match(page, /^const PCV_SHA256 = createHash\('sha256'\)\.update\(pcvPy, 'utf8'\)\.digest\('hex'\);$/m);
  assert.match(section, /<code class="hash">\{PCV_SHA256\}<\/code>/);
  assert.ok(!page.includes(SHA), 'the current sha256 is not hard-coded in bots.astro');
  assert.ok(!JSON.stringify(block).includes(SHA), 'nor in block 0694');
  // ?raw hands the page a UTF-8 string; hashing it as UTF-8 gives the file's bytes back only if they round-trip.
  assert.ok(Buffer.from(pcv, 'utf8').equals(pcvBytes), 'pcv.py is plain UTF-8 (no BOM, no invalid bytes)');
  assert.ok(!pcv.startsWith('﻿'), 'no BOM');
});

test('pcv.py pins the same devnet as src/data/chain-home.ts and reads it with GET only', () => {
  assert.ok(pcv.includes(`DEVNET_GENESIS = '${GENESIS}'`), 'DEVNET_GENESIS');
  assert.ok(pcv.includes(`'${DEVNET_URL}'`), 'the devnet URL');
  assert.match(pcv, /add_argument\('--devnet'/);
  assert.match(pcv, /add_argument\('--save'/);
  // Cloudflare refuses urllib's default User-Agent, so the file must send its own.
  assert.match(pcv, /User-Agent/);
  assert.doesNotMatch(pcv, /method\s*=\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
  assert.doesNotMatch(pcv, /urlopen\([^)]*data\s*=/);
});

test('the one-command run, the sha check and the offline rerun use the real flags', () => {
  assert.equal(rawConst('pcvLive'), 'curl -fsS -O ${SITE}/chain/bots/pcv.py && python3 pcv.py --devnet ${D}');
  assert.match(page, /^const pcvCheck = `echo "\$\{PCV_SHA256\}  pcv\.py" \| shasum -a 256 -c`;$/m);
  const offline = rawConst('pcvOffline');
  assert.match(offline, /^python3 pcv\.py --devnet \$\{D\} --save pc-devnet /m);
  assert.match(offline, /^python3 pcv\.py --params pc-devnet\/params\.json --blocks pc-devnet\/blocks\.json /m);
  // The sandbox line takes its pin from the page (chain-home's DEVNET), not from the uploaded files.
  assert.match(page, /^const pcvSandbox = `python3 -B pcv\.py --params params\.json --blocks blocks\.json --genesis \$\{DEVNET\.genesis\}`;$/m);
  assert.ok(existsSync(new URL(PCV, root)));
  assert.ok(section.includes('href="/chain/bots/pcv.py" download>'), 'download button');
});

test('honest copy: who wrote it, who reviewed it, who added the replay, and what it still does not check', () => {
  for (const phrase of [/Codex \(OpenAI, gpt-6-astra\)/, /without\s+porting the Rust/, /Three Claude reviewers/, /every one on pcv’s side and none in the Rust/,
    /implementation\s+diversity/, /A bug in a rule both of them check shows up as a disagreement\. Since October 21 that includes the state:/,
    /On October 21 Claude Code taught it the rest of the chain/, /The replay is Claude Code’s, written from chain-core’s rules and pinned to\s+vectors chain-core builds itself, so for the state it is a second implementation, not a second lab\./,
    /ChatGPT’s code\s+tool/, /no network/, /a state root the replay could not reach/])
    assert.match(section, phrase);
  // the served file is the replaying version: its success line names the replay
  assert.match(pcv, /state_root \(replayed\)/);
  assert.match(pcv, /chain-core would refuse this/);
  assert.match(page, /const PCV_SOURCE = \{ branch: 'main', commit: 'a1df59e' \};/);
  assert.match(page, /\['State root', `Recomputed by replay\./);
  assert.match(page, /\['Five kinds', `Not replayed: drum sessions, sequencer rotations, session keys and controllers/);
  assert.match(page, /\['Consensus', 'Not every consensus rule, and not a node\./);
  assert.match(page, /\['Wallet text', 'Wallet-text \(tezos_message\) and secp256k1 signatures are hashed but not verified\./);
  // today's run, by the served file (GET only, then offline): every block, every state root
  assert.match(page, /const PCV_RERUN = \{ at: '19:35 UTC on October 21', blocks: 3790, tip: 'e3f57b4e[0-9a-f]{56}' \};/);
  assert.match(page, /const PCV_RECORD = \{ blocks: 3790, tipHeight: 3790, tip: 'e3f57b4e[0-9a-f]{56}', stateRoots: 3790, replayedKinds: 18, kinds: 23, sigCases: 375, gaps: 21, tests: 106 \};/);
  // the old claim is gone from the page (block 0694 keeps it, dated)
  for (const text of [section, page.slice(page.indexOf('const pcvChecks'), page.indexOf('const limits'))]) {
    assert.doesNotMatch(text, /does not recompute|Not recomputed\.|state_root: not checked \(v1\)|pcv does\s+not rebuild/i);
  }
  assert.match(block.body, /It does not recompute the state root/);
  // Agreement covers only what both implementations check; never claim it catches every bug.
  assert.match(block.body, /a bug in a rule both of them check shows up as a disagreement\. The state, which pcv does not rebuild, is outside that\./);
  for (const text of [section, block.body]) assert.doesNotMatch(text, /bug in either one/i);
  assert.match(block.body, /it is not full consensus validation/);
  for (const text of [block.body, block.dek]) {
    assert.doesNotMatch(text, /recomputes the state root|(?<!not )full consensus validation|validates consensus|main\s*net|\bworth\b|\binvest|\bprofit/i);
  }
  for (const text of [section, block724.body, block724.dek]) {
    assert.doesNotMatch(text, /(?<!not )full consensus validation|validates consensus|main\s*net|\bworth\b|\binvest|\bprofit|(?<!not )every consensus rule/i);
  }
  // block 0724 says it the same way: a replay that agreed on every block, Claude Code's, and what it still does not cover
  assert.match(block724.body, /recomputes every state root/);
  assert.match(block724.body, /not a second lab/);
  assert.match(block724.body, /does not replay drum sessions, sequencer rotations, session keys or controllers/);
  assert.match(block724.body, /block 0694 said it did not recompute the state root/);
  assert.ok(block724.companions.some((c) => c.id === 'https://pointcast.xyz/chain/bots/#python'));
  assert.ok(block724.companions.some((c) => c.id === '0694'));
  assert.match(block.body, /no value and may reset/);
  assert.doesNotMatch(block.body, /https?:\/\//, 'block body is plain text; links live in companions');
});

test('block 0694, the section nav and the front door all point at #python', () => {
  assert.equal(block.id, '0694');
  assert.equal(block.channel, 'FD');
  const ids = block.companions.map((c) => c.id);
  assert.ok(ids.includes('https://pointcast.xyz/chain/bots/#python'));
  assert.ok(ids.includes('https://pointcast.xyz/chain/bots/pcv.py'));
  assert.ok(existsSync(new URL(`public${block.media.src}`, root)));
  assert.ok(existsSync(new URL('public/images/og/b/0694.png', root)));
  // Filed on devnet-1: a historical block keeps devnet-1's genesis.
  assert.equal(block.meta.genesis, PREVIOUS_GENESIS);
  assert.match(page, /<a href="#trust">trust<\/a><a href="#python">python<\/a>/);
  const note = news.find((n) => n.link === '/chain/bots#python');
  assert.ok(note, 'the front door has the Verify in Python note');
  assert.equal(note.date, '2026-10-05');
});

test('the art is abstract: no text, images, links or script in the media SVG', () => {
  const svg = read(`public${block.media.src}`);
  assert.doesNotMatch(svg, /<text|<image|<script|foreignObject|href|\son\w+=/i);
});

const built = new URL('dist/chain/bots/index.html', root);
test('built page: the sha256 shown is the served file\'s', { skip: !existsSync(built) && 'no dist/ build' }, () => {
  const doc = new JSDOM(readFileSync(built, 'utf8')).window.document;
  const shown = doc.querySelector('#python code.hash')?.textContent;
  assert.equal(shown, SHA);
  assert.ok(readFileSync(new URL('dist/chain/bots/pcv.py', root)).equals(pcvBytes), 'dist/chain/bots/pcv.py is the file');
  const snippets = [...doc.querySelectorAll('#python .snip pre code')].map((c) => c.textContent);
  assert.ok(snippets.includes(`curl -fsS -O https://pointcast.xyz/chain/bots/pcv.py && python3 pcv.py --devnet ${DEVNET_URL}`));
  assert.ok(snippets.includes(`echo "${SHA}  pcv.py" | shasum -a 256 -c`));
  assert.ok(snippets.includes(`python3 -B pcv.py --params params.json --blocks blocks.json --genesis ${GENESIS}`));
});
