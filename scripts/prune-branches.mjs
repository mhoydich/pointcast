#!/usr/bin/env node
// prune-branches.mjs — list, and only with --delete remove, finished remote
// branches, without getting in the way of work that is still moving.
//
// Why: GitHub's "automatically delete head branches" is off for this repo, so
// by 2026-10-17 origin carried 1,173 branches for 18 open PRs. Every fetch,
// `git branch -r`, and worktree add paid for the other 1,155.
//
// Usage:
//   node scripts/prune-branches.mjs                     dry run: classify every origin branch, print the plan
//   node scripts/prune-branches.mjs --report=plan.tsv   also write the plan as TSV
//   node scripts/prune-branches.mjs --delete            delete the `merged` class (PR merged into main, tip == merged head)
//   node scripts/prune-branches.mjs --delete --include-closed --older-than=60
//                                                       also branches whose PRs were all closed unmerged 60+ days ago
//   node scripts/prune-branches.mjs --delete --include-orphans --older-than=90
//                                                       also branches that never had a PR, idle 90+ days
//
// Flags:
//   --grace=<hours>       never touch a branch active in the last N hours (default 24):
//                         an agent may be about to open its PR
//   --older-than=<days>   closed/orphan branches must be at least this idle (default 30)
//   --limit=<n>           delete at most n branches this run
//   --include-elsewhere   also branches whose PR merged into a non-main base
//   --yes                 skip the 5-second countdown before deleting
//
// What is never deleted: main, any branch with an open PR, any branch checked
// out in a local worktree (another agent is on it), and any branch whose
// merged PR head is not the current tip (commits landed after the merge).
// Right before deleting, origin is re-read and the open-PR list re-fetched; a
// branch that moved or gained a PR since the plan was made is skipped. Each
// deletion is logged with its sha so it can be restored with
// `git push origin <sha>:refs/heads/<name>` (GitHub's PR page also offers
// "Restore branch" for merged ones).
//
// Needs: git with push rights to origin, and `gh` authenticated (REST only;
// no GraphQL is used).

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { classifyBranches, planDeletions, summarize, toTsv } from './lib/prune-branches.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoDir = join(here, '..');

// --- flags ------------------------------------------------------------------
const flags = {
  delete: false,
  yes: false,
  includeClosed: false,
  includeOrphans: false,
  includeElsewhere: false,
  graceHours: 24,
  olderThanDays: 30,
  limit: Infinity,
  report: null,
  log: process.env.PC_PRUNE_LOG || join(homedir(), '.pointcast-prune.log'),
};
for (const arg of process.argv.slice(2)) {
  const [key, value] = arg.includes('=') ? arg.split(/=(.*)/s) : [arg, undefined];
  switch (key) {
    case '--delete': flags.delete = true; break;
    case '--yes': flags.yes = true; break;
    case '--include-closed': flags.includeClosed = true; break;
    case '--include-orphans': flags.includeOrphans = true; break;
    case '--include-elsewhere': flags.includeElsewhere = true; break;
    case '--grace': flags.graceHours = positive(key, value); break;
    case '--older-than': flags.olderThanDays = positive(key, value); break;
    case '--limit': flags.limit = positive(key, value); break;
    case '--report': flags.report = value; break;
    case '--log': flags.log = value; break;
    case '--help': case '-h': usage(0); break;
    default: console.error(`unknown flag: ${arg}`); usage(2);
  }
}
function positive(key, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) { console.error(`${key} needs a non-negative number`); process.exit(2); }
  return n;
}
function usage(code) {
  console.log('see the header of scripts/prune-branches.mjs');
  process.exit(code);
}

// --- helpers ----------------------------------------------------------------
const git = (...args) => execFileSync('git', ['-C', repoDir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gh = (path, jq) => {
  try {
    return execFileSync('gh', ['api', path, ...(jq ? ['--jq', jq] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const msg = String(err.stderr || err.message).trim().split('\n')[0];
    throw new Error(`gh api ${path} failed: ${msg}`);
  }
};
const say = (...parts) => console.log(...parts);

function repoSlug() {
  const url = git('remote', 'get-url', 'origin').trim();
  const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?\/?$/);
  if (!m) throw new Error(`cannot read owner/repo from origin url ${url}`);
  return `${m[1]}/${m[2]}`;
}

function remoteHeads() {
  return git('ls-remote', '--heads', 'origin')
    .trim().split('\n').filter(Boolean)
    .map((line) => { const [sha, ref] = line.split('\t'); return { name: ref.replace('refs/heads/', ''), sha }; });
}

function pulls(slug, state) {
  const out = [];
  for (let page = 1; page <= 100; page += 1) {
    const chunk = JSON.parse(gh(
      `repos/${slug}/pulls?state=${state}&per_page=100&page=${page}`,
      '[.[] | {number, state, merged_at, closed_at, updated_at, head_ref: .head.ref, head_sha: .head.sha, base_ref: .base.ref}]',
    ));
    out.push(...chunk);
    if (chunk.length < 100) break;
  }
  return out;
}

function worktreeBranches() {
  const set = new Set();
  for (const line of git('worktree', 'list', '--porcelain').split('\n')) {
    if (line.startsWith('branch refs/heads/')) set.add(line.slice('branch refs/heads/'.length));
  }
  return set;
}

function commitDate(slug, sha) {
  try {
    return gh(`repos/${slug}/commits/${sha}`, '.commit.committer.date').trim() || null;
  } catch {
    return null;
  }
}

// --- gather -----------------------------------------------------------------
const now = new Date();
const slug = repoSlug();
const defaultBranch = gh(`repos/${slug}`, '.default_branch').trim() || 'main';
say(`origin ${slug}, default branch ${defaultBranch}`);

const heads = remoteHeads();
say(`${heads.length} remote branches`);
const allPulls = pulls(slug, 'all');
say(`${allPulls.length} pull requests`);
const local = worktreeBranches();

// Tip dates only matter where the PR record does not already fix the tip in
// time: anything that is not an open PR head or an exact merged head.
const fixedShas = new Set(allPulls
  .filter((p) => p.state === 'open' || (p.merged_at && p.base_ref === defaultBranch))
  .map((p) => p.head_sha));
const needDates = heads.filter((b) => b.name !== defaultBranch && !fixedShas.has(b.sha));
if (needDates.length) say(`reading tip dates for ${needDates.length} branches without a settled PR`);
for (const b of needDates) b.committedAt = commitDate(slug, b.sha);

const rows = classifyBranches({ branches: heads, pulls: allPulls, worktreeBranches: local, defaultBranch, now });
const planned = planDeletions(rows, { ...flags, now });
const summary = summarize(planned);

// --- report -----------------------------------------------------------------
say('');
say('by class:');
for (const cls of Object.keys(summary.byClass).sort()) say(`  ${String(summary.byClass[cls]).padStart(5)}  ${cls}`);
say(`plan: delete ${summary.byAction.delete}, skip ${summary.byAction.skip}, keep ${summary.byAction.keep}`);

const skipped = planned.filter((r) => r.action === 'skip');
if (skipped.length) {
  say('');
  say('eligible but held this run:');
  for (const r of skipped.slice(0, 40)) say(`  ${r.name}  (${r.blockers.join('; ')})`);
  if (skipped.length > 40) say(`  ... and ${skipped.length - 40} more`);
}
const review = planned.filter((r) => r.cls === 'merged-tip-moved');
if (review.length) {
  say('');
  say('merged but the tip moved afterwards (look before deleting by hand):');
  for (const r of review) say(`  ${r.name}  PR #${r.pr}  tip ${r.sha.slice(0, 8)}`);
}

if (flags.report) {
  mkdirSync(dirname(flags.report), { recursive: true });
  writeFileSync(flags.report, toTsv(planned));
  say(`\nplan written to ${flags.report}`);
}

const toDelete = planned.filter((r) => r.action === 'delete');
if (!flags.delete) {
  say(`\ndry run: ${toDelete.length} branch(es) would be deleted. Re-run with --delete to remove them.`);
  process.exit(0);
}
if (!toDelete.length) { say('\nnothing to delete'); process.exit(0); }

// --- delete, re-checking origin first ---------------------------------------
if (!flags.yes) {
  say(`\ndeleting ${toDelete.length} branch(es) from origin in 5s (ctrl-c to stop, --yes to skip the wait)`);
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

const freshHeads = new Map(remoteHeads().map((b) => [b.name, b.sha]));
const freshOpen = new Set(pulls(slug, 'open').map((p) => p.head_ref));
const confirmed = [];
for (const r of toDelete) {
  const current = freshHeads.get(r.name);
  if (current === undefined) { say(`  already gone: ${r.name}`); continue; }
  if (current !== r.sha) { say(`  moved since the plan, skipping: ${r.name} (${r.sha.slice(0, 8)} -> ${current.slice(0, 8)})`); continue; }
  if (freshOpen.has(r.name)) { say(`  gained an open PR, skipping: ${r.name}`); continue; }
  confirmed.push(r);
}

mkdirSync(dirname(flags.log), { recursive: true });
let deleted = 0;
const BATCH = 25;
for (let i = 0; i < confirmed.length; i += BATCH) {
  const batch = confirmed.slice(i, i + BATCH);
  try {
    git('push', '--quiet', 'origin', ...batch.map((r) => `:refs/heads/${r.name}`));
  } catch (err) {
    say(`push failed for a batch of ${batch.length}; stopping. ${String(err.stderr || err.message).trim().split('\n')[0]}`);
    say('deleted so far are in the log; re-run to continue.');
    break;
  }
  for (const r of batch) {
    appendFileSync(flags.log, [now.toISOString(), r.name, r.sha, r.pr ?? '', r.cls].join('\t') + '\n');
    deleted += 1;
  }
  say(`  deleted ${Math.min(i + BATCH, confirmed.length)}/${confirmed.length}`);
}
say(`\ndeleted ${deleted} branch(es). Log: ${flags.log}`);
say('restore one with: git push origin <sha>:refs/heads/<name>');
git('remote', 'prune', 'origin');
