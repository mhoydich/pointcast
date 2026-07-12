#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import process from 'node:process';

const FETCH_TIMEOUT_HOOK = pathToFileURL(join(process.cwd(), 'scripts/fetch-timeout-hook.mjs')).href;

function run(command, args, env = process.env) {
  console.log(`\n$ ${[command, ...args].join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit', env });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function output(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(result.stderr.trim());
    process.exit(result.status ?? 1);
  }

  return result.stdout.trim();
}

const rawArgs = process.argv.slice(2);
const all = rawArgs.includes('--all');
const pathArg = rawArgs.find((arg) => arg.startsWith('--paths='));
const scopedPaths = pathArg
  ? pathArg.slice('--paths='.length).split(',').map((path) => path.trim()).filter(Boolean)
  : (process.env.PUBLISH_PATHS || '').split(',').map((path) => path.trim()).filter(Boolean);
const message = rawArgs
  .filter((arg) => arg !== '--all' && !arg.startsWith('--paths='))
  .join(' ')
  .trim();

if (!message) {
  console.error('Usage: npm run publish:live -- --all "feat(scope): describe the ship"');
  console.error('   or: PUBLISH_PATHS=src/pages/ask.astro,scripts/reindex.mjs npm run publish:live -- "feat(scope): describe the ship"');
  process.exit(1);
}

const root = output('git', ['rev-parse', '--show-toplevel']);
process.chdir(root);

const remoteHead = output('git', ['ls-remote', '--symref', 'origin', 'HEAD']);
const defaultBranch =
  remoteHead
    .split('\n')
    .map((line) => line.match(/^ref: refs\/heads\/(.+)\s+HEAD$/)?.[1])
    .find(Boolean) ?? 'main';

const branch = output('git', ['branch', '--show-current']) || 'detached HEAD';
console.log(`Publishing from ${branch} to origin/${defaultBranch}.`);

run('git', ['fetch', 'origin', defaultBranch]);

const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', `origin/${defaultBranch}`, 'HEAD'], {
  stdio: 'ignore',
});

if (ancestor.status !== 0) {
  console.error(`Refusing to publish: this HEAD does not include origin/${defaultBranch}. Pull or rebase first.`);
  process.exit(1);
}

  const buildOutDir = join('/private/tmp', `pointcast-publish-${Date.now()}`);
  run('node', ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', buildOutDir], {
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ''}--import=${FETCH_TIMEOUT_HOOK}`,
  });

const changed = output('git', ['status', '--porcelain']);

if (changed) {
  if (scopedPaths.length > 0) {
    run('git', ['add', '--', ...scopedPaths]);
  } else if (all) {
    run('git', ['add', '-A']);
  } else {
    console.error('Refusing to stage all changes implicitly. Pass --all or set PUBLISH_PATHS=file1,file2.');
    console.error(changed);
    process.exit(1);
  }
  const stagedFiles = output('git', ['diff', '--cached', '--name-only']);

  if (stagedFiles) {
    run('git', ['commit', '-m', message]);
  } else {
    console.log('No staged changes after git add -A.');
  }
} else {
  console.log('No local changes to commit.');
}

run('git', ['push', 'origin', `HEAD:${defaultBranch}`]);

const shortSha = output('git', ['rev-parse', '--short', 'HEAD']);
console.log(`\nPublished ${shortSha} to origin/${defaultBranch}. Cloudflare Pages should deploy pointcast.xyz from this push.`);
