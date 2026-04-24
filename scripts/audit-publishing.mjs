#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  if (result.error) {
    return { ok: false, stdout: '', stderr: result.error.message, status: 1 };
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    status: result.status ?? 0,
  };
}

function git(args, cwd) {
  return run('git', args, { cwd });
}

function log(title) {
  console.log(`\n## ${title}`);
}

function item(label, value) {
  console.log(`- ${label}: ${value || '(none)'}`);
}

function printStatus(output, maxLines = 60) {
  const lines = output.split('\n').filter(Boolean);
  for (const line of lines.slice(0, maxLines)) console.log(line);
  if (lines.length > maxLines) {
    console.log(`... ${lines.length - maxLines} more status line(s) omitted`);
  }
}

function parseWorktrees(output) {
  const worktrees = [];
  let current = null;

  for (const line of output.split('\n')) {
    if (!line.trim()) {
      if (current) worktrees.push(current);
      current = null;
      continue;
    }

    const [key, ...rest] = line.split(' ');
    const value = rest.join(' ');

    if (key === 'worktree') current = { path: value };
    if (!current) continue;
    if (key === 'HEAD') current.head = value;
    if (key === 'branch') current.branch = value.replace('refs/heads/', '');
    if (key === 'detached') current.detached = true;
  }

  if (current) worktrees.push(current);
  return worktrees;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function readFile(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

const rootResult = git(['rev-parse', '--show-toplevel'], process.cwd());

if (!rootResult.ok) {
  console.error('This command must be run from inside the pointcast git repository.');
  process.exit(1);
}

const root = rootResult.stdout;
const packageJson = readJson(join(root, 'package.json'));
const wrangler = readFile(join(root, 'wrangler.toml'));
const astroConfig = readFile(join(root, 'astro.config.mjs'));
const expectedRemote = 'mhoydich/pointcast';
const expectedRoot = '/Users/michaelhoydich/pointcast';

console.log('PointCast publishing audit');
console.log(`Generated: ${new Date().toISOString()}`);

log('Repository');
item('root', root);
item('parent', dirname(root));
item('root name', basename(root));

const origin = git(['remote', 'get-url', 'origin'], root);
item('origin', origin.ok ? origin.stdout : origin.stderr);

const branch = git(['branch', '--show-current'], root);
const currentBranch = branch.stdout || 'detached HEAD';
item('current branch', currentBranch);

const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], root);
item('upstream', upstream.ok ? upstream.stdout : 'none');

const status = git(['status', '--short', '--branch'], root);
printStatus(status.stdout || status.stderr);

const remoteLooksRight = origin.ok && origin.stdout.includes(expectedRemote);
const rootLooksRight = root === expectedRoot;
const dirty = git(['status', '--porcelain'], root).stdout.length > 0;
const includesOriginMain = git(['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], root).ok;
const hasExplicitPublish = Boolean(packageJson?.scripts?.['publish:live'] || packageJson?.scripts?.['push:nightly']);

log('Publishing Config');
item('site', astroConfig.match(/site:\s*['"]([^'"]+)['"]/)?.[1]);
item('Cloudflare Pages project', wrangler.match(/^name\s*=\s*"([^"]+)"/m)?.[1]);
item('Pages output dir', wrangler.match(/^pages_build_output_dir\s*=\s*"([^"]+)"/m)?.[1]);
item('build script', packageJson?.scripts?.build);
item('publish script', packageJson?.scripts?.['publish:live'] || '(none)');
item('nightly push script', packageJson?.scripts?.['push:nightly'] || '(none)');
item('node engine', packageJson?.engines?.node);

log('Worktrees');
const worktreeResult = git(['worktree', 'list', '--porcelain'], root);
if (worktreeResult.ok) {
  for (const worktree of parseWorktrees(worktreeResult.stdout)) {
    const wtStatus = git(['status', '--short', '--branch'], worktree.path);
    const dirtyCount = git(['status', '--porcelain'], worktree.path).stdout
      .split('\n')
      .filter(Boolean).length;
    const head = worktree.head ? worktree.head.slice(0, 7) : 'unknown';
    console.log(`- ${worktree.path}`);
    console.log(`  branch: ${worktree.branch || 'detached'} @ ${head}`);
    console.log(`  state: ${dirtyCount ? `${dirtyCount} local change(s)` : 'clean'}`);
    if (wtStatus.stdout) {
      const firstLine = wtStatus.stdout.split('\n')[0];
      console.log(`  status: ${firstLine}`);
    }
  }
} else {
  console.log(`- unable to read worktrees: ${worktreeResult.stderr}`);
}

log('GitHub');
const ghAvailable = run('gh', ['--version']).ok;
if (!ghAvailable) {
  console.log('- gh CLI: unavailable; use the GitHub connector or browser for PR state.');
} else {
  const prs = run(
    'gh',
    ['pr', 'list', '--repo', expectedRemote, '--state', 'open', '--json', 'number,title,headRefName,updatedAt', '--limit', '20'],
    { cwd: root },
  );

  if (!prs.ok) {
    console.log(`- open PRs: unavailable (${prs.stderr || 'gh returned an error'})`);
  } else {
    const parsed = JSON.parse(prs.stdout || '[]');
    if (!parsed.length) {
      console.log('- open PRs: none');
    } else {
      for (const pr of parsed) {
        console.log(`- #${pr.number} ${pr.title} (${pr.headRefName}, updated ${pr.updatedAt})`);
      }
    }
  }
}

log('Verdict');
const checks = [
  [`canonical root is ${expectedRoot}`, rootLooksRight],
  ['origin points at mhoydich/pointcast', remoteLooksRight],
  ['current worktree is clean', !dirty],
  ['current HEAD includes origin/main', includesOriginMain],
  ['an explicit publish/push script exists', hasExplicitPublish],
  ['Cloudflare Pages project is pointcast', wrangler.includes('name = "pointcast"')],
];

for (const [label, ok] of checks) {
  console.log(`- ${ok ? 'OK' : 'CHECK'} ${label}`);
}

if (dirty) {
  console.log('\nDo not publish from this worktree until the local diff is reviewed and intentionally committed or moved to a branch.');
} else if (rootLooksRight && remoteLooksRight) {
  console.log('\nThis checkout is suitable for reviewed local work. Publish only with explicit approval.');
}

if (existsSync('/Users/michaelhoydich/pointcast')) {
  item('stable path', '/Users/michaelhoydich/pointcast');
}
