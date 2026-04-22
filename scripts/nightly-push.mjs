#!/usr/bin/env node
/**
 * nightly-push.mjs — commit uncommitted work on the current branch + push
 * safely to GitHub. Dry-run by default.
 *
 * Problem this solves (surfaced by tonight's Sprint #94 chaos): PointCast
 * generates a lot of uncommitted state in the working tree (new blocks,
 * updated ledger, tweaked components). When a parallel thread rebases or
 * switches branches, uncommitted state can vanish. A scheduled commit-and-
 * push captures the state into a named commit before anything can eat it.
 *
 * Safety rails:
 *   1. NEVER pushes to `main` (hard-coded refusal).
 *   2. NEVER force-pushes unless `--force-with-lease` is explicitly passed.
 *   3. Dry-run by default — no filesystem or remote changes without `--apply`.
 *   4. Skips if working tree is clean.
 *   5. Refuses to run during a rebase/merge/cherry-pick (checks
 *      .git/{rebase-merge,MERGE_HEAD,CHERRY_PICK_HEAD}).
 *   6. Auto-generates commit message from `git status --porcelain` summary.
 *
 * The commit message carries a `nightly-push:` prefix so nightly commits
 * are greppable + distinguishable from hand-authored ones. The prepare-
 * commit-msg hook (Sprint #94 T2) adds `Co-Authored-By:` trailers based
 * on the branch prefix.
 *
 * Usage:
 *   node scripts/nightly-push.mjs                       # dry-run summary
 *   node scripts/nightly-push.mjs --apply               # commit + push
 *   node scripts/nightly-push.mjs --apply --force-with-lease   # force-lease
 *
 * Sprint #94 T3 · block 0388 follow-up #3. Shipped 2026-04-21.
 */

import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const forceLease = args.has('--force-with-lease') || args.has('--force-lease');

function sh(cmd, opts = {}) {
  const out = execSync(cmd, { cwd: repoRoot, encoding: 'utf8', ...opts });
  // execSync returns null when stdio is inherited (no captured output).
  return (out ?? '').trim();
}
function shQuiet(cmd) {
  try { return sh(cmd, { stdio: ['pipe', 'pipe', 'pipe'] }); }
  catch { return ''; }
}

function refuseToMain(branch) {
  if (branch === 'main' || branch === 'master') {
    console.error(`✗ REFUSED: current branch is "${branch}". nightly-push never pushes to main.`);
    console.error(`  Switch to a feature branch (codex/*, manus/*, cc/*, feat/*) and retry.`);
    process.exit(2);
  }
}

function refuseMidOperation() {
  const markers = ['rebase-merge', 'rebase-apply'].map((d) => join(repoRoot, '.git', d));
  const files = ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'BISECT_LOG'].map((f) => join(repoRoot, '.git', f));
  for (const m of [...markers, ...files]) {
    if (existsSync(m)) {
      console.error(`✗ REFUSED: repo is mid-operation (${m} exists). Finish or abort it first.`);
      process.exit(2);
    }
  }
}

function parsePorcelain(raw) {
  if (!raw) return { added: 0, modified: 0, deleted: 0, renamed: 0, untracked: 0, total: 0, paths: [] };
  const lines = raw.split('\n').filter(Boolean);
  let a = 0, m = 0, d = 0, r = 0, u = 0;
  const paths = [];
  for (const line of lines) {
    const code = line.slice(0, 2);
    const path = line.slice(3).trim();
    paths.push({ code, path });
    if (code === '??') u += 1;
    else if (code.includes('A')) a += 1;
    else if (code.includes('D')) d += 1;
    else if (code.includes('R')) r += 1;
    else if (code.includes('M') || code.startsWith(' M')) m += 1;
  }
  return { added: a, modified: m, deleted: d, renamed: r, untracked: u, total: lines.length, paths };
}

function summarizePaths(paths, cap = 5) {
  const byDir = {};
  for (const { path } of paths) {
    const top = path.split('/')[0];
    byDir[top] = (byDir[top] || 0) + 1;
  }
  const top = Object.entries(byDir).sort((a, b) => b[1] - a[1]).slice(0, cap);
  return top.map(([dir, n]) => `${dir}/(${n})`).join(' · ');
}

function generateMessage(branch, summary) {
  const date = new Date().toISOString().slice(0, 16).replace('T', ' ') + 'Z';
  const title = `nightly-push: ${branch} · ${summary.total} file${summary.total === 1 ? '' : 's'} · ${date}`;
  const breakdown = [
    summary.added      ? `+${summary.added} added`      : null,
    summary.modified   ? `~${summary.modified} modified`: null,
    summary.deleted    ? `-${summary.deleted} deleted`  : null,
    summary.renamed    ? `↻${summary.renamed} renamed`  : null,
    summary.untracked  ? `?${summary.untracked} new`    : null,
  ].filter(Boolean).join(' · ');
  const top = summarizePaths(summary.paths, 8);
  return [
    title,
    '',
    breakdown,
    top ? `top paths: ${top}` : '',
    '',
    'Auto-commit by scripts/nightly-push.mjs. Co-Authored-By trailer appended',
    'automatically by .git/hooks/prepare-commit-msg (Sprint #94 T2).',
  ].filter(Boolean).join('\n');
}

function main() {
  const branch = shQuiet('git symbolic-ref --short HEAD');
  if (!branch) { console.error('✗ not on a branch (detached HEAD?)'); process.exit(2); }

  refuseToMain(branch);
  refuseMidOperation();

  const porcelain = shQuiet('git status --porcelain=v1');
  const summary = parsePorcelain(porcelain);

  console.log(`nightly-push · ${apply ? 'APPLY' : 'dry-run'}${forceLease ? ' --force-with-lease' : ''}`);
  console.log(`  branch: ${branch}`);
  console.log(`  working tree: ${summary.total} change(s)`);
  if (summary.total === 0) {
    console.log('  ✓ working tree is clean — nothing to commit');
    return;
  }

  const msg = generateMessage(branch, summary);
  console.log(`  planned commit message:`);
  console.log('    ' + msg.split('\n').join('\n    '));

  if (!apply) {
    console.log('  ---');
    console.log('  (pass --apply to actually commit + push)');
    return;
  }

  // Stage everything (equivalent to git add -A)
  sh('git add -A', { stdio: 'inherit' });
  // Commit with the generated message — the prepare-commit-msg hook will
  // append the Co-Authored-By trailer based on branch prefix.
  const msgFile = join(repoRoot, '.git', 'NIGHTLY_PUSH_MSG');
  writeFileSync(msgFile, msg + '\n');
  sh(`git commit -F ${JSON.stringify(msgFile)}`, { stdio: 'inherit' });
  console.log('  ✓ committed');

  // Push. Default = fast-forward only. --force-with-lease opt-in.
  const pushFlags = forceLease ? '--force-with-lease' : '';
  try {
    sh(`git push origin ${branch} ${pushFlags}`.trim(), { stdio: 'inherit' });
    console.log(`  ✓ pushed to origin/${branch}`);
  } catch (err) {
    console.error(`  ✗ push failed: ${err.message}`);
    console.error(`  (commit is still local; resolve + push manually, or re-run with --force-with-lease if safe)`);
    process.exit(3);
  }
}

main();
