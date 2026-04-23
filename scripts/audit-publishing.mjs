#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function read(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function item(label, value) {
  console.log(`- ${label}: ${value || '(none)'}`);
}

function check(ok, label) {
  console.log(`- ${ok ? 'OK' : 'CHECK'} ${label}`);
}

const rootResult = run('git', ['rev-parse', '--show-toplevel']);

if (!rootResult.ok) {
  console.error('This command must be run from inside the pointcast git repository.');
  process.exit(1);
}

const root = rootResult.stdout;
const packageJson = readJson(join(root, 'package.json'));
const astroConfig = read(join(root, 'astro.config.mjs'));
const wrangler = read(join(root, 'wrangler.toml'));
const origin = run('git', ['remote', 'get-url', 'origin'], { cwd: root });
const branch = run('git', ['branch', '--show-current'], { cwd: root });
const upstream = run('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: root });
const status = run('git', ['status', '--short', '--branch'], { cwd: root });
const dirty = run('git', ['status', '--porcelain'], { cwd: root }).stdout.length > 0;
const includesOriginMain = run('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], { cwd: root }).ok;

console.log('PointCast publishing audit');
console.log(`Generated: ${new Date().toISOString()}`);

console.log('\n## Repository');
item('root', root);
item('origin', origin.ok ? origin.stdout : origin.stderr);
item('branch', branch.stdout || 'detached HEAD');
item('upstream', upstream.ok ? upstream.stdout : 'none');
console.log(status.stdout || status.stderr || '- clean');

console.log('\n## Publishing Config');
item('site', astroConfig.match(/site:\s*['"]([^'"]+)['"]/)?.[1]);
item('Cloudflare Pages project', wrangler.match(/^name\s*=\s*"([^"]+)"/m)?.[1]);
item('Pages output dir', wrangler.match(/^pages_build_output_dir\s*=\s*"([^"]+)"/m)?.[1]);
item('build script', packageJson?.scripts?.build);
item('bare build script', packageJson?.scripts?.['build:bare']);
item('agent audit script', packageJson?.scripts?.['audit:agents']);
item('publish script', packageJson?.scripts?.['publish:live']);

console.log('\n## Verdict');
check(origin.ok && origin.stdout.includes('mhoydich/pointcast'), 'origin points at mhoydich/pointcast');
check(!dirty, 'current worktree is clean');
check(includesOriginMain, 'current HEAD includes origin/main');
check(Boolean(packageJson?.scripts?.['build:bare']), 'build:bare is available');
check(Boolean(packageJson?.scripts?.['audit:agents']), 'audit:agents is available');
check(wrangler.includes('name = "pointcast"'), 'Cloudflare Pages project is pointcast');

if (dirty) {
  console.log('\nDo not publish from this worktree until the local diff is reviewed and intentionally committed.');
} else {
  console.log('\nThis checkout is suitable for reviewed branch/PR work. Publish only with explicit Mike approval.');
}
