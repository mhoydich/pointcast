#!/usr/bin/env node
// prune-branches.mjs — list, and only with --delete remove, finished remote
// branches, without getting in the way of work that is still moving.
//
// Why: GitHub's "automatically delete head branches" is off for this repo, so
// by 2026-10-17 origin carried 1,173 branches for 18 open PRs. Every fetch,
// `git branch -r`, and worktree add paid for the other 1,155.
//
// Usage:
//   node scripts/prune-branches.mjs                     dry run: classify every origin branch, print the totals
//   node scripts/prune-branches.mjs --report=plan.tsv   also write every branch with its action as TSV
//   node scripts/prune-branches.mjs --delete            delete the `merged` class (PR merged into main, tip == merged head)
//   node scripts/prune-branches.mjs --delete --include-closed --older-than=60
//                                                       also branches whose PRs were all closed unmerged, idle 60+ days
//   node scripts/prune-branches.mjs --delete --include-orphans --older-than=90
//                                                       also branches that never had a PR, idle 90+ days
//   (through npm the flags go after `--`: npm run prune:branches -- --report=plan.tsv)
//
// Flags:
//   --grace=<hours>       never touch a branch active in the last N hours (default 24):
//                         an agent may be about to open its PR. Activity is the latest of
//                         the PR event, the tip's commit date, and the last push GitHub's
//                         activity feed shows for the ref (so a restored branch is fresh)
//   --older-than=<days>   closed/orphan branches must be at least this idle (default 30)
//   --limit=<n>           delete at most n branches this run
//   --include-elsewhere   also branches whose PR merged into a non-main base (tip == merged head)
//   --no-safety-fetch     skip fetching each branch into refs/pruned/<name> before deleting
//   --yes                 skip the 5-second countdown before deleting
//   --log=<path>          deletion log (default ~/.pointcast-prune.log or $PC_PRUNE_LOG)
//
// What is never deleted: main, any branch with an open PR, any branch checked
// out in a worktree of THIS clone (another agent is on it), and any branch
// whose merged PR head is not the current tip (commits landed after the merge).
//
// How a deletion is made safe against concurrent pushes: right before deleting,
// origin and the open-PR list are re-read and anything that moved or gained a
// PR is dropped; then each batch is pushed with --atomic and one
// --force-with-lease=refs/heads/<name>:<planned sha> per ref, so the server
// refuses the whole batch if any branch moved in between. A refused batch is
// re-checked once and retried without the movers. Before the first push every
// branch to be deleted is fetched into refs/pruned/<name> in this clone, and
// every deletion is logged with its sha, so any branch can be put back:
//   git push origin refs/pruned/<name>:refs/heads/<name>     (from this clone)
//   git push origin <sha>:refs/heads/<name>                  (anywhere with the objects)
//   or "Restore branch" on the merged PR's page.
//
// Run --delete from the iMac (any ~/pc-* worktree): the worktree guard only
// sees worktrees of the clone it runs in, and the log and refs/pruned safety
// copies are only useful on a machine that keeps them.
//
// Needs: git >= 2.4 with push rights to origin, and `gh` authenticated (REST
// only; no GraphQL is used).

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  classifyBranches, confirmAgainstOrigin, parseArgs, parsePushPorcelain, planDeletions, summarize, toTsv,
} from './lib/prune-branches.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoDir = join(here, '..');

process.on('uncaughtException', (err) => { console.error(`prune-branches: ${err.message}`); process.exit(2); });

// --- flags ------------------------------------------------------------------
let flags;
try {
  flags = parseArgs(process.argv.slice(2), process.env);
} catch (err) {
  console.error(`prune-branches: ${err.message}`);
  process.exit(2);
}
if (flags.help) { console.log('see the header of scripts/prune-branches.mjs'); process.exit(0); }
flags.log ??= join(homedir(), '.pointcast-prune.log');
const LOCK = process.env.PC_PRUNE_LOCK || join(homedir(), '.pointcast-prune.lock');

// --- helpers ----------------------------------------------------------------
const git = (...args) => execFileSync('git', ['-C', repoDir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gh = (path, jq) => {
  try {
    return execFileSync('gh', ['api', path, ...(jq ? ['--jq', jq] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error('gh is not installed; this script needs the GitHub CLI (authenticated) for PR data');
    const msg = String(err.stderr || err.message).trim().split('\n')[0];
    throw new Error(`gh api ${path} failed: ${msg}`);
  }
};
const say = (...parts) => console.log(...parts);

function repoSlug() {
  const url = git('remote', 'get-url', 'origin').trim();
  const m = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?\/?$/);
  if (!m) throw new Error(`cannot read owner/repo from origin url ${url}`);
  return `${m[1]}/${m[2]}`;
}

function remoteHeads() {
  const out = git('ls-remote', '--heads', 'origin').trim();
  if (!out) throw new Error('origin advertised no branches; refusing to continue');
  return new Map(out.split('\n').map((line) => { const [sha, ref] = line.split('\t'); return [ref.replace('refs/heads/', ''), sha]; }));
}

function pulls(slug, state) {
  const out = [];
  for (let page = 1; page <= 100; page += 1) {
    const chunk = JSON.parse(gh(
      `repos/${slug}/pulls?state=${state}&per_page=100&page=${page}`,
      '[.[] | {number, state, merged_at, closed_at, updated_at, head_ref: .head.ref, head_sha: .head.sha, head_repo: .head.repo.full_name, base_ref: .base.ref}]',
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

// Latest push per ref from GitHub's activity feed. Best effort: the feed is
// a safety margin on top of commit/PR dates, not the only source.
function pushedAtMap(slug, period) {
  const map = new Map();
  try {
    for (let page = 1; page <= 50; page += 1) {
      const chunk = JSON.parse(gh(
        `repos/${slug}/activity?time_period=${period}&per_page=100&page=${page}`,
        '[.[] | {ref, timestamp, activity_type}]',
      ));
      for (const a of chunk) {
        if (!a.ref || !a.ref.startsWith('refs/heads/')) continue;
        const name = a.ref.slice('refs/heads/'.length);
        if (!map.has(name) || map.get(name) < a.timestamp) map.set(name, a.timestamp);
      }
      if (chunk.length < 100) break;
    }
  } catch (err) {
    say(`warning: could not read the activity feed (${err.message}); using commit and PR dates only`);
  }
  return map;
}

function commitDate(slug, sha) {
  try {
    return gh(`repos/${slug}/commits/${sha}`, '.commit.committer.date').trim() || null;
  } catch {
    return null;
  }
}

// One run at a time, same mkdir lock pattern as scripts/deploy.sh.
function takeLock() {
  try {
    mkdirSync(LOCK);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    const holder = Number(readFileSync(join(LOCK, 'pid'), 'utf8').trim() || 0);
    let alive = false;
    try { process.kill(holder, 0); alive = true; } catch { alive = false; }
    if (alive) throw new Error(`another prune is running (pid ${holder}); lock ${LOCK}`);
    rmSync(LOCK, { recursive: true, force: true });
    mkdirSync(LOCK);
  }
  writeFileSync(join(LOCK, 'pid'), String(process.pid));
  process.on('exit', () => rmSync(LOCK, { recursive: true, force: true }));
}

// --- gather -----------------------------------------------------------------
const now = new Date();
const slug = repoSlug();
const defaultBranch = gh(`repos/${slug}`, '.default_branch').trim() || 'main';
say(`origin ${slug}, default branch ${defaultBranch}`);

const headMap = remoteHeads();
const heads = [...headMap].map(([name, sha]) => ({ name, sha }));
say(`${heads.length} remote branches`);
const everyPull = pulls(slug, 'all');
const allPulls = everyPull.filter((p) => !p.head_repo || p.head_repo === slug);
say(`${allPulls.length} pull requests${everyPull.length !== allPulls.length ? ` (${everyPull.length - allPulls.length} from forks ignored)` : ''}`);
const local = worktreeBranches();
if (local.size <= 1 && flags.delete) {
  say('note: this clone has no other worktrees; branches checked out on another machine are not visible to the worktree guard');
}
const needsLongWindow = flags.includeClosed || flags.includeOrphans || flags.includeElsewhere || flags.graceHours > 24 * 7;
const pushed = pushedAtMap(slug, needsLongWindow ? 'month' : 'week');
if (pushed.size) say(`activity feed: ${pushed.size} branches pushed in the last ${needsLongWindow ? 'month' : 'week'}`);

// Tip dates only matter where the PR record does not already fix the tip in
// time: anything that is not an open PR head or an exact merged head.
const fixedShas = new Set(allPulls
  .filter((p) => p.state === 'open' || p.merged_at)
  .map((p) => p.head_sha));
const needDates = heads.filter((b) => b.name !== defaultBranch && !fixedShas.has(b.sha));
if (needDates.length) say(`reading tip dates for ${needDates.length} branches without a settled PR`);
for (const b of needDates) b.committedAt = commitDate(slug, b.sha);

const rows = classifyBranches({ branches: heads, pulls: allPulls, worktreeBranches: local, pushedAt: pushed, defaultBranch, now });
const planned = planDeletions(rows, { ...flags, now });
const summary = summarize(planned);

// --- report -----------------------------------------------------------------
say('');
say('by class:');
for (const cls of Object.keys(summary.byClass).sort()) say(`  ${String(summary.byClass[cls]).padStart(5)}  ${cls}`);
say(`plan: delete ${summary.byAction.delete}, skip ${summary.byAction.skip}, keep ${summary.byAction.keep}`);

const toDelete = planned.filter((r) => r.action === 'delete');
if (toDelete.length) {
  say('');
  say(`would delete (first ${Math.min(20, toDelete.length)} of ${toDelete.length}; full list with --report=<file>):`);
  for (const r of toDelete.slice(0, 20)) say(`  ${r.name}  PR #${r.pr}`);
}
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

if (!flags.delete) {
  say(`\ndry run: ${toDelete.length} branch(es) would be deleted. Re-run with --delete to remove them.`);
  process.exit(0);
}
if (!toDelete.length) { say('\nnothing to delete'); process.exit(0); }

// --- preflight: lock and a writable log before anything is touched ----------
takeLock();
mkdirSync(dirname(flags.log), { recursive: true });
appendFileSync(flags.log, `# ${now.toISOString()} prune run: ${toDelete.length} planned (${process.argv.slice(2).join(' ')})\n`);

if (!flags.yes) {
  say(`\ndeleting ${toDelete.length} branch(es) from origin in 5s (ctrl-c to stop, --yes to skip the wait)`);
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

// --- re-check origin, then keep a local copy of every ref we will delete ----
function recheck(rowsToCheck) {
  const freshOpen = new Set(pulls(slug, 'open').map((p) => p.head_ref));
  const { confirmed, skipped: held } = confirmAgainstOrigin(rowsToCheck, remoteHeads(), freshOpen);
  for (const s of held) say(`  skipping ${s.name}: ${s.why}`);
  return confirmed;
}
let queue = recheck(toDelete);

if (!flags.noSafetyFetch && queue.length) {
  say(`fetching ${queue.length} branch(es) into refs/pruned/* as a local safety copy`);
  for (let i = 0; i < queue.length; i += 100) {
    const batch = queue.slice(i, i + 100);
    try {
      git('fetch', '--quiet', 'origin', ...batch.map((r) => `+refs/heads/${r.name}:refs/pruned/${r.name}`));
    } catch (err) {
      say(`warning: safety fetch failed for a batch (${String(err.stderr || err.message).trim().split('\n')[0]}); the log still records every sha`);
    }
  }
}

// --- delete: atomic batches, each ref leased to the sha the plan saw --------
let deleted = 0;
const rejected = [];
let consecutiveFailures = 0;
const BATCH = 25;
while (queue.length) {
  const batch = queue.slice(0, BATCH);
  const args = [
    'push', '--porcelain', '--atomic', 'origin',
    ...batch.map((r) => `--force-with-lease=refs/heads/${r.name}:${r.sha}`),
    ...batch.map((r) => `:refs/heads/${r.name}`),
  ];
  let out = '';
  let failed = false;
  try {
    out = git(...args);
  } catch (err) {
    failed = true;
    out = String(err.stdout || '');
    const reason = String(err.stderr || '').trim().split('\n').filter(Boolean).pop() || err.message;
    say(`  batch refused: ${reason}`);
  }
  const result = parsePushPorcelain(out);
  if (!failed && result.ok.length) {
    const byName = new Map(batch.map((r) => [r.name, r]));
    for (const name of result.ok) {
      const r = byName.get(name);
      if (!r) continue;
      appendFileSync(flags.log, [now.toISOString(), r.name, r.sha, r.pr ?? '', r.cls].join('\t') + '\n');
      deleted += 1;
    }
    queue = queue.slice(batch.length);
    consecutiveFailures = 0;
    say(`  deleted ${deleted}/${toDelete.length}`);
    continue;
  }
  // The whole batch was refused (atomic): something moved under us. Re-check
  // the rest of the queue against origin, drop the movers, retry once.
  for (const f of result.failed) if (!/atomic push failed|stale info/.test(f.summary)) say(`  ${f.name}: ${f.summary}`);
  consecutiveFailures += 1;
  if (consecutiveFailures >= 2) {
    say('two refused batches in a row; stopping. Deleted branches are in the log; re-run to continue.');
    rejected.push(...batch.map((r) => r.name));
    break;
  }
  const before = queue.length;
  queue = recheck(queue);
  if (queue.length === before) {
    say('  nothing moved according to origin, retrying the batch once');
  }
}
say(`\ndeleted ${deleted} branch(es)${rejected.length ? `, stopped with ${rejected.length} still queued` : ''}. Log: ${flags.log}`);
say('restore one with: git push origin refs/pruned/<name>:refs/heads/<name>   (or <sha>:refs/heads/<name>)');
if (deleted > 0) {
  try {
    git('remote', 'prune', 'origin');
  } catch {
    say('remote prune failed; run `git fetch --prune origin` later to drop the stale remote-tracking refs');
  }
}
