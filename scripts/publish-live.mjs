#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function run(command, args) {
  console.log(`\n$ ${[command, ...args].join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit' });

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

const message = process.argv.slice(2).join(' ').trim();

if (!message) {
  console.error('Usage: npm run publish:live -- "feat(scope): describe the ship"');
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

run('npm', ['run', 'build']);

const changed = output('git', ['status', '--porcelain']);

if (changed) {
  run('git', ['add', '-A']);
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
