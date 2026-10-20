// One SDK, three served paths, one pinned source.
//
//   node scripts/sync-chain-sdk.mjs
//       Copies the pointcast-chain repo's sdk/pointcast-chain.js to every place this
//       site serves it, byte for byte, and rewrites src/data/chain-sdk-source.ts with
//       the repo commit it came from and the file's sha256. Refuses a source that is
//       not committed in a git repo (the pin would be a guess).
//   node scripts/sync-chain-sdk.mjs --check
//       Offline, no repo needed, exit 1 on any problem: all three copies exist, are
//       byte-identical, and are the file src/data/chain-sdk-source.ts pins (sha256,
//       bytes, lines, the same three paths). tests/chain-app-sdksync.test.mjs runs it.
//   node scripts/sync-chain-sdk.mjs --check --against-repo
//       Also compares the copies with the repo's current file: exit 1 when the repo has
//       moved on and a sync is due.
//
//   --repo DIR   the pointcast-chain checkout (default: $PC_CHAIN_REPO, else ~/pointcast-chain)
//   --root DIR   the site checkout to write into or check (default: this repo; tests use a temp copy)
//
// The three copies exist because pages import them by different paths: /chain/sdk/ is the
// download the bot and developer quickstarts point at, /chain/net/ is the Daily Net witness
// folder, /chain/first-mints/lib/ is what the minter and the apps import. A path that is not
// in COPIES is a fourth copy, and tests/chain-app-sdksync.test.mjs fails on it.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Where the site serves the SDK, relative to the site root. Order is the order they are reported in. */
export const COPIES = [
  'public/chain/sdk/pointcast-chain.js',
  'public/chain/net/pointcast-chain.js',
  'public/chain/first-mints/lib/pointcast-chain.js',
];
/** The file in the pointcast-chain repo. */
export const REPO_PATH = 'sdk/pointcast-chain.js';
/** The pin: written by this script, read by the site and the tests. */
export const PIN_PATH = 'src/data/chain-sdk-source.ts';

const SELF_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
export const countLines = (buf) => {
  const s = Buffer.from(buf).toString('utf8');
  return s.length === 0 ? 0 : s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
};

/** The facts about one file's bytes. */
export function describeBytes(buf) {
  return { sha256: sha256(buf), bytes: buf.length, lines: countLines(buf) };
}

function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** Read the pin out of src/data/chain-sdk-source.ts (it is plain literals, so a regex reads it; no TS loader needed). */
export function readPin(root) {
  const file = join(root, PIN_PATH);
  if (!existsSync(file)) return { error: `${PIN_PATH} is missing` };
  const text = readFileSync(file, 'utf8');
  const str = (k) => text.match(new RegExp(`^  ${k}: '([^']*)',$`, 'm'))?.[1];
  const num = (k) => {
    const m = text.match(new RegExp(`^  ${k}: (\\d+),$`, 'm'));
    return m ? Number(m[1]) : undefined;
  };
  const copies = text.match(/^  copies: \[([^\]]*)\],$/m)?.[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  const pin = {
    commit: str('commit'), commitFull: str('commitFull'), commitDate: str('commitDate'), lastChangedIn: str('lastChangedIn'),
    sha256: str('sha256'), bytes: num('bytes'), lines: num('lines'), copies,
  };
  const missing = Object.entries(pin).filter(([, v]) => v === undefined || (Array.isArray(v) && !v.length)).map(([k]) => k);
  return missing.length ? { error: `${PIN_PATH} is missing ${missing.join(', ')}` } : { pin };
}

/** The text of src/data/chain-sdk-source.ts for these facts. Deterministic: no clock, so a rerun changes nothing. */
export function pinSource(facts) {
  const q = (s) => `'${s}'`;
  return `/**
 * Where the SDK this site serves came from. Written by scripts/sync-chain-sdk.mjs: run it
 * (\`node scripts/sync-chain-sdk.mjs\`) to move to a newer SDK; do not edit by hand.
 * \`node scripts/sync-chain-sdk.mjs --check\` and tests/chain-app-sdksync.test.mjs fail when a
 * served copy is not exactly this file.
 *
 * The file is the pointcast-chain repo's sdk/pointcast-chain.js, copied byte for byte (it is
 * not edited and carries no note about the copy; this module is where the provenance lives).
 * \`commit\` is the repo's HEAD when it was copied; \`lastChangedIn\` is the last commit that
 * touched the file.
 */
export const SDK_SOURCE = {
  repo: 'pointcast-chain',
  path: ${q(REPO_PATH)},
  commit: ${q(facts.commit)},
  commitFull: ${q(facts.commitFull)},
  commitDate: ${q(facts.commitDate)},
  lastChangedIn: ${q(facts.lastChangedIn)},
  sha256: ${q(facts.sha256)},
  bytes: ${facts.bytes},
  lines: ${facts.lines},
  copies: [${facts.copies.map(q).join(', ')}],
} as const;

/** The size the pages print, in KB (1 KB = 1,000 bytes, as the file listing shows it). */
export const SDK_KB: number = Math.round(SDK_SOURCE.bytes / 1000);
`;
}

/**
 * Check the served copies against each other and the pin. Returns { ok, problems, facts }.
 * With `repoFile` (a Buffer) the copies must also equal the repo's current file.
 */
export function checkCopies(root, { repoFile } = {}) {
  const problems = [];
  const got = new Map();
  for (const rel of COPIES) {
    const file = join(root, rel);
    if (!existsSync(file)) { problems.push(`${rel} is missing`); continue; }
    got.set(rel, readFileSync(file));
  }
  const digests = new Map([...got].map(([rel, buf]) => [rel, sha256(buf)]));
  if (new Set(digests.values()).size > 1) {
    problems.push('the served copies differ: ' + [...digests].map(([rel, d]) => `${rel} ${d.slice(0, 12)}`).join(', '));
  }
  const { pin, error } = readPin(root);
  if (error) problems.push(error);
  if (pin) {
    if (JSON.stringify(pin.copies) !== JSON.stringify(COPIES)) problems.push(`${PIN_PATH} lists ${JSON.stringify(pin.copies)}, not the three paths this script copies to`);
    if (!/^[0-9a-f]{64}$/.test(pin.sha256)) problems.push(`${PIN_PATH}: sha256 is not 64 hex characters`);
    if (!/^[0-9a-f]{7,40}$/.test(pin.commit) || !/^[0-9a-f]{40}$/.test(pin.commitFull) || !pin.commitFull.startsWith(pin.commit)) problems.push(`${PIN_PATH}: commit and commitFull do not agree`);
    for (const [rel, buf] of got) {
      const d = describeBytes(buf);
      if (d.sha256 !== pin.sha256) problems.push(`${rel} is not the pinned file: sha256 ${d.sha256.slice(0, 12)}, pinned ${pin.sha256.slice(0, 12)}`);
      else if (d.bytes !== pin.bytes || d.lines !== pin.lines) problems.push(`${rel}: ${d.bytes} bytes and ${d.lines} lines, pinned ${pin.bytes} and ${pin.lines}`);
    }
  }
  if (repoFile) {
    const d = sha256(repoFile);
    for (const [rel, got1] of digests) if (got1 !== d) problems.push(`${rel} is not the repo's current ${REPO_PATH} (${got1.slice(0, 12)} vs ${d.slice(0, 12)}): run node scripts/sync-chain-sdk.mjs`);
  }
  return { ok: problems.length === 0, problems, pin: pin ?? null };
}

/** The repo's source file and where it stands in git. Throws with a plain reason when the pin would be a guess. */
export function readSource(repo) {
  const file = join(repo, REPO_PATH);
  if (!existsSync(file)) throw new Error(`no ${REPO_PATH} in ${repo}`);
  // .git must be here (not a parent's), or HEAD would be some other repository's commit
  if (!existsSync(join(repo, '.git'))) throw new Error(`${repo} is not a git repository with a commit: the pin needs one`);
  let commitFull;
  try { commitFull = git(repo, ['rev-parse', 'HEAD']); } catch { throw new Error(`${repo} is not a git repository with a commit: the pin needs one`); }
  try { git(repo, ['ls-files', '--error-unmatch', '--', REPO_PATH]); } catch { throw new Error(`${REPO_PATH} is not tracked in ${repo}`); }
  if (git(repo, ['status', '--porcelain', '--', REPO_PATH])) {
    throw new Error(`${REPO_PATH} has uncommitted changes in ${repo}: commit them first, so the pinned commit is the file that is copied`);
  }
  const buf = readFileSync(file);
  const facts = {
    commit: git(repo, ['rev-parse', '--short=7', 'HEAD']),
    commitFull,
    commitDate: git(repo, ['log', '-1', '--format=%cs', 'HEAD']),
    lastChangedIn: git(repo, ['log', '-1', '--format=%h', '--abbrev=7', '--', REPO_PATH]),
    ...describeBytes(buf),
    copies: [...COPIES],
  };
  return { buf, facts };
}

/** Copy the repo's file to every place and write the pin. Returns the facts. */
export function sync(root, repo) {
  const { buf, facts } = readSource(repo);
  for (const rel of COPIES) {
    const file = join(root, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, buf);
  }
  mkdirSync(dirname(join(root, PIN_PATH)), { recursive: true });
  writeFileSync(join(root, PIN_PATH), pinSource(facts));
  return facts;
}

function main(argv) {
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const flag = (name) => argv.includes(name);
  const root = resolve(opt('--root') ?? SELF_ROOT);
  const repo = resolve(opt('--repo') ?? process.env.PC_CHAIN_REPO ?? join(homedir(), 'pointcast-chain'));
  const known = new Set(['--check', '--against-repo', '--repo', '--root']);
  const stray = argv.filter((a, i) => a.startsWith('--') ? !known.has(a) : !['--repo', '--root'].includes(argv[i - 1]));
  if (stray.length) { console.error('sync-chain-sdk: unknown argument ' + stray[0] + ' (see the top of scripts/sync-chain-sdk.mjs)'); return 2; }

  if (flag('--check')) {
    let repoFile;
    if (flag('--against-repo')) {
      try { repoFile = readSource(repo).buf; } catch (e) { console.error('sync-chain-sdk: ' + e.message); return 1; }
    }
    const r = checkCopies(root, { repoFile });
    if (!r.ok) { for (const p of r.problems) console.error('sync-chain-sdk: ' + p); return 1; }
    console.log(`sync-chain-sdk: ${COPIES.length} copies identical, ${r.pin.bytes} bytes, sha256 ${r.pin.sha256.slice(0, 12)}, from ${r.pin.repo ?? 'pointcast-chain'} ${r.pin.commit}${repoFile ? ' (and the repo has not moved)' : ''}`);
    return 0;
  }
  try {
    const f = sync(root, repo);
    console.log(`sync-chain-sdk: copied ${REPO_PATH} (${f.bytes} bytes, ${f.lines} lines, sha256 ${f.sha256.slice(0, 12)}) from pointcast-chain ${f.commit} to:`);
    for (const rel of COPIES) console.log('  ' + rel);
    console.log('  ' + PIN_PATH + ' (the pin)');
    return 0;
  } catch (e) { console.error('sync-chain-sdk: ' + e.message); return 1; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
