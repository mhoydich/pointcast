#!/usr/bin/env node
/**
 * git-branch-attribution.mjs — map git branches to PointCast collaborators.
 *
 * Block 0388's investigation surfaced a fact already in the repo: branch
 * names encode collab attribution. `codex/*` branches carry Codex work.
 * `manus/*` carries Manus. `feat/*` + `main` carry cc. The commits
 * themselves are all author=Michael Hoydich, so `git log --author` is
 * useless — we read the BRANCH instead.
 *
 * This script walks every local branch + origin/* branch, classifies
 * each into a collab bucket via branch-name prefix, extracts the unique
 * commits per bucket (via `git log branch ^main`), and emits a JSON
 * report to docs/notes/git-branch-attribution.json.
 *
 * Output shape:
 *   {
 *     generatedAt,
 *     branches: [{name, collab, ahead_of_main, commits: [{sha, subject, date}]}],
 *     byCollab: { codex: N, manus: N, cc: N, other: N },
 *     summary: { totalBranches, totalCommits, topAuthorshipByCollab },
 *     note: ...
 *   }
 *
 * Dry-run only. No git operations, no pushes, no commits.
 *
 * Usage:
 *   node scripts/git-branch-attribution.mjs
 *   npm run attribute:git
 *
 * Written: 2026-04-21 follow-up to block 0388.
 */

import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const OUTPUT = join(repoRoot, 'docs', 'notes', 'git-branch-attribution.json');

function sh(cmd) {
  try { return execSync(cmd, { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch (e) { return ''; }
}

function classifyBranch(name) {
  // Strip `origin/` + `remotes/` prefixes for classification.
  const clean = name.replace(/^remotes\//, '').replace(/^origin\//, '');
  if (clean.startsWith('codex/')) return 'codex';
  if (clean.startsWith('manus/')) return 'manus';
  if (clean.startsWith('chatgpt/')) return 'chatgpt';
  if (clean.startsWith('cc/')) return 'claude-code';
  if (clean.startsWith('feat/')) return 'claude-code';  // feat/* is cc convention
  if (clean === 'main' || clean === 'master') return 'main';
  if (clean === 'blocks-rebuild') return 'claude-code';   // legacy cc branch
  return 'other';
}

function getBranches() {
  // All branches, local + remote, no HEAD symbolic refs.
  const raw = sh('git branch --all --format="%(refname:short)"');
  return raw.split('\n')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('origin/HEAD') && !s.includes('->'));
}

function getMainRef() {
  // Prefer origin/main, fall back to local main.
  if (sh('git rev-parse --verify origin/main 2>/dev/null')) return 'origin/main';
  if (sh('git rev-parse --verify main 2>/dev/null')) return 'main';
  return null;
}

function getCommitsAhead(branch, baseRef) {
  if (!baseRef || branch === baseRef || branch === 'main' || branch === 'origin/main') return [];
  const raw = sh(`git log ${baseRef}..${branch} --pretty=format:"%H|%at|%s"`);
  if (!raw) return [];
  return raw.split('\n').map((line) => {
    const [sha, ts, subject] = line.split('|');
    return {
      sha: (sha || '').slice(0, 10),
      date: ts ? new Date(parseInt(ts, 10) * 1000).toISOString() : null,
      subject: subject || '',
    };
  }).filter((c) => c.sha);
}

function main() {
  const generatedAt = new Date().toISOString();
  const baseRef = getMainRef();
  if (!baseRef) { console.error('✗ no main branch found'); process.exit(1); }

  const branchNames = getBranches();
  // Dedupe by classification+tracking — skip local branches that have a
  // remote equivalent already covered (origin/foo ≈ foo).
  const seen = new Set();
  const branches = [];

  for (const name of branchNames) {
    const clean = name.replace(/^origin\//, '');
    // Keep both local and origin entries, but annotate which.
    const collab = classifyBranch(name);
    const isRemote = name.startsWith('origin/');
    const key = `${isRemote ? 'R' : 'L'}:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const commits = getCommitsAhead(name, baseRef);
    branches.push({
      name,
      scope: isRemote ? 'remote' : 'local',
      collab,
      commitsAheadCount: commits.length,
      commits: commits.slice(0, 20),  // cap per branch for report size
    });
  }

  // Aggregate unique commits per collab (dedupe by sha across branches).
  const perCollab = {};
  const seenShas = new Set();
  for (const b of branches) {
    const key = b.collab;
    if (!perCollab[key]) perCollab[key] = { branches: [], uniqueCommits: [], totalCommitCount: 0 };
    perCollab[key].branches.push(b.name);
    for (const c of b.commits) {
      const dedupeKey = key + ':' + c.sha;
      if (seenShas.has(dedupeKey)) continue;
      seenShas.add(dedupeKey);
      perCollab[key].uniqueCommits.push({ sha: c.sha, subject: c.subject, date: c.date, branch: b.name });
    }
    perCollab[key].totalCommitCount = perCollab[key].uniqueCommits.length;
  }

  const byCollab = Object.fromEntries(
    Object.entries(perCollab).map(([k, v]) => [k, { branches: [...new Set(v.branches)].length, uniqueCommits: v.totalCommitCount }])
  );

  const totalCommits = Object.values(perCollab).reduce((s, v) => s + v.totalCommitCount, 0);

  const report = {
    schema: 'git-branch-attribution-v0',
    generatedAt,
    baseRef,
    summary: {
      totalBranches: branches.length,
      totalUniqueCommitsAheadOfBase: totalCommits,
      byCollab,
    },
    branches,
    perCollab,
    conventions: {
      'codex/*':   'codex',
      'manus/*':   'manus',
      'chatgpt/*': 'chatgpt',
      'cc/*':      'claude-code',
      'feat/*':    'claude-code (cc convention for feature work)',
      'main':      'canonical — not attributed to any single collab',
      'blocks-rebuild': 'legacy cc branch',
    },
    note: 'Branch-name attribution is advisory. Git commit authors are all Michael Hoydich; the real builder is encoded in the branch prefix. Use this report to enrich ledger entries post-hoc, to generate Co-Authored-By trailers, or to narrate which agent is working in which branch. Re-run any time.',
  };

  return report;
}

async function write() {
  const report = main();
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + '\n');

  console.log(`git-branch-attribution · walk complete`);
  console.log(`  base ref: ${report.baseRef}`);
  console.log(`  total branches: ${report.summary.totalBranches}`);
  console.log(`  total unique commits ahead of ${report.baseRef}: ${report.summary.totalUniqueCommitsAheadOfBase}`);
  for (const [k, v] of Object.entries(report.summary.byCollab)) {
    console.log(`  ${k.padEnd(14)} ${String(v.branches).padStart(2)} branch(es) · ${v.uniqueCommits} commit(s)`);
  }
  console.log(`✓ output: ${OUTPUT}`);
}

write().catch((err) => {
  console.error('✗ attribution failed:', err);
  process.exit(1);
});
