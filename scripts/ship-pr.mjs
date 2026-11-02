// ship-pr.mjs — merge a PointCast pull request from the cloud once it has
// everything AGENTS.md asks for before main: Codex's review and Mike's okay.
//
//   Codex review (X):  the Codex GitHub reviewer (chatgpt-codex-connector[bot])
//                      reviewed the exact head commit and flagged nothing at P0
//                      or P1, or said it found no major issues (or gave the PR a
//                      thumbs-up) after that commit.
//   Mike's okay (MH):  the label `ship`. Add it only when Mike has said to
//                      publish in his own words, and quote him in the PR body.
//   Checks:            every check run and status on the head commit is green
//                      (skipped and neutral count as green), none still running.
//
// A `hold` label or the line "Publish: hold" in the body keeps a PR open.
// After merging it starts the Cloudflare deploy, because a merge made with the
// workflow token does not fire the push event that would start it.
//
// Usage (in GitHub Actions):  node scripts/ship-pr.mjs [--pr N] [--dry-run]
// With no --pr it sweeps every open PR labeled `ship`.

import { execFileSync } from 'node:child_process';

export const CODEX_LOGIN = 'chatgpt-codex-connector[bot]';
const BLOCKING_BADGE = /\bP[01]\s*Badge\b|!\[P[01]\]|\bP[01]\b\s*[:\-–]/i;
const NO_ISSUES = /didn'?t find any major issues|no major issues/i;
const GREEN = new Set(['success', 'skipped', 'neutral']);

export function eligible({ state = 'open', draft = false, labels = [], body = '', baseRef = 'main', sameRepo = true }) {
  if (state !== 'open' || draft) return 'not-open';
  if (baseRef !== 'main') return 'not-main';
  if (!sameRepo) return 'fork';
  if (labels.includes('hold') || /^publish:\s*hold\b/im.test(body || '')) return 'hold';
  if (!labels.includes('ship')) return 'no-ship-label';
  return 'ok';
}

// reviews: [{ id, user, commit_id, body, submitted_at }]
// comments: inline review comments [{ pull_request_review_id, user, body }]
// issueComments: [{ user, body, created_at }]
// reactions: on the PR itself [{ user, content, created_at }] (Codex may only thumbs-up a clean PR)
// headDate: ISO time of the head commit
export function codexVerdict({ headSha, headDate, reviews = [], comments = [], issueComments = [], reactions = [] }) {
  const since = Date.parse(headDate || 0) || 0;
  const mine = reviews.filter(r => r.user === CODEX_LOGIN && r.commit_id === headSha);
  for (const review of mine) {
    const inline = comments.filter(c => c.pull_request_review_id === review.id && c.user === CODEX_LOGIN);
    if (inline.some(c => BLOCKING_BADGE.test(c.body || '')) || BLOCKING_BADGE.test(review.body || '')) return 'blocking';
  }
  if (mine.length) return 'clean';
  const said = issueComments.some(c => c.user === CODEX_LOGIN && NO_ISSUES.test(c.body || '') && Date.parse(c.created_at) >= since);
  const thumbs = reactions.some(r => r.user === CODEX_LOGIN && r.content === '+1' && Date.parse(r.created_at) >= since);
  return said || thumbs ? 'clean' : 'missing';
}

// checkRuns: [{ name, status, conclusion }], statuses: [{ context, state }] (latest per context)
export function checksVerdict({ checkRuns = [], statuses = [], ignore = [] }) {
  const runs = checkRuns.filter(run => !ignore.includes(run.name));
  if (runs.some(run => run.status !== 'completed')) return 'pending';
  if (runs.some(run => !GREEN.has(run.conclusion))) return 'failure';
  if (statuses.some(s => s.state === 'pending')) return 'pending';
  if (statuses.some(s => s.state !== 'success')) return 'failure';
  return 'success';
}

export function decide({ eligibility, codex, checks, mergeable }) {
  if (eligibility !== 'ok') return eligibility;
  if (codex === 'blocking') return 'codex-flagged';
  if (codex !== 'clean') return 'waiting-on-codex';
  if (checks === 'failure') return 'checks-failed';
  if (checks !== 'success') return 'waiting-on-checks';
  if (mergeable === false) return 'conflict';
  if (mergeable !== true) return 'waiting-on-mergeable';
  return 'merge';
}

function api(path, args = []) {
  return JSON.parse(execFileSync('gh', ['api', path, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}

function apiAll(path) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = api(`${path}${sep}per_page=100&page=${page}`);
    const items = Array.isArray(batch) ? batch : batch.check_runs || [];
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

function latestStatuses(list) {
  const seen = new Map();
  for (const s of list) if (!seen.has(s.context)) seen.set(s.context, s);
  return [...seen.values()];
}

async function considerPr(repo, number, { dryRun, selfJob }) {
  let pr = api(`repos/${repo}/pulls/${number}`);
  for (let i = 0; i < 5 && pr.mergeable === null; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    pr = api(`repos/${repo}/pulls/${number}`);
  }
  const sha = pr.head.sha;
  const eligibility = eligible({
    state: pr.state,
    draft: pr.draft,
    labels: (pr.labels || []).map(l => l.name),
    body: pr.body || '',
    baseRef: pr.base.ref,
    sameRepo: pr.head.repo && pr.head.repo.full_name === repo,
  });
  if (eligibility !== 'ok') return { number, decision: eligibility };
  const head = api(`repos/${repo}/commits/${sha}`);
  const user = x => (x.user && x.user.login) || '';
  const codex = codexVerdict({
    headSha: sha,
    headDate: head.commit.committer.date,
    reviews: apiAll(`repos/${repo}/pulls/${number}/reviews`).map(r => ({ ...r, user: user(r) })),
    comments: apiAll(`repos/${repo}/pulls/${number}/comments`).map(c => ({ ...c, user: user(c) })),
    issueComments: apiAll(`repos/${repo}/issues/${number}/comments`).map(c => ({ ...c, user: user(c) })),
    reactions: apiAll(`repos/${repo}/issues/${number}/reactions`).map(r => ({ ...r, user: user(r) })),
  });
  const checks = checksVerdict({
    checkRuns: apiAll(`repos/${repo}/commits/${sha}/check-runs`),
    statuses: latestStatuses(api(`repos/${repo}/commits/${sha}/status`).statuses || []),
    ignore: [selfJob],
  });
  const decision = decide({ eligibility, codex, checks, mergeable: pr.mergeable });
  if (decision !== 'merge' || dryRun) return { number, sha, decision, codex, checks };
  // Merge exactly the head that was checked; GitHub refuses if it moved.
  api(`repos/${repo}/pulls/${number}/merge`, ['-X', 'PUT', '-f', `sha=${sha}`, '-f', 'merge_method=merge']);
  return { number, sha, decision: 'merged', codex, checks };
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GITHUB_REPOSITORY is not set');
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const prArg = argv.indexOf('--pr');
  const selfJob = process.env.SHIP_JOB_NAME || 'ship';
  const numbers = prArg !== -1 && argv[prArg + 1]
    ? [Number(argv[prArg + 1])]
    : apiAll(`repos/${repo}/issues?state=open&labels=ship`).filter(i => i.pull_request).map(i => i.number);
  let merged = 0;
  for (const number of numbers) {
    try {
      const result = await considerPr(repo, number, { dryRun, selfJob });
      console.log(`ship: #${number} ${result.decision}${result.sha ? ` at ${result.sha.slice(0, 8)}` : ''}${result.codex ? ` (codex ${result.codex}, checks ${result.checks})` : ''}`);
      if (result.decision === 'merged') merged++;
    } catch (error) {
      console.error(`ship: #${number} not merged: ${(error.stderr || error.message || '').toString().trim()}`);
    }
  }
  if (merged && !dryRun) {
    // A merge by the workflow token doesn't fire `push`, so start the deploy here.
    api(`repos/${repo}/actions/workflows/cloudflare-pages.yml/dispatches`, ['-X', 'POST', '-f', 'ref=main']);
    console.log('ship: started "Deploy PointCast to Cloudflare Pages" on main');
  }
}

if (process.argv[1] && process.argv[1].endsWith('ship-pr.mjs')) {
  main().catch(error => { console.error(error.message); process.exit(1); });
}
