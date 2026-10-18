// Pure classification + planning for scripts/prune-branches.mjs.
//
// Nothing here touches git or GitHub; the CLI feeds in branch tips, pull
// requests, push timestamps and local worktree state, and this decides what is
// finished. Keeping it pure means tests/prune-branches.test.mjs can pin every
// rule, including the ones that exist only to protect other agents' work.

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/**
 * Classes, in the order a reader should scan them:
 *   protected         the default branch (or one named in protectedBranches)
 *   open-pr           an open pull request points at this branch
 *   merged            a PR merged into the default branch and its merged head
 *                     sha IS the current tip: every commit is on the base
 *   merged-elsewhere  a PR merged into some other branch, merged head == tip
 *   merged-tip-moved  a PR merged (anywhere), but the tip has moved since:
 *                     commits were pushed after the merge and may exist
 *                     nowhere else
 *   closed-unmerged   every PR from this branch was closed without merging
 *   orphan            no PR was ever opened from this branch
 */
export const CLASSES = [
  'protected',
  'open-pr',
  'merged',
  'merged-elsewhere',
  'merged-tip-moved',
  'closed-unmerged',
  'orphan',
];

const toTime = (iso) => (iso ? new Date(iso).getTime() : null);
const latest = (...isos) => {
  const times = isos.map(toTime).filter((t) => t !== null && !Number.isNaN(t));
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
};

/**
 * @param {object} input
 * @param {{name: string, sha: string, committedAt?: string|null}[]} input.branches
 * @param {{number: number, state: string, merged_at: string|null, closed_at: string|null,
 *          updated_at: string, head_ref: string, head_sha: string, base_ref: string}[]} input.pulls
 *          Only pulls whose head lives in this repository; the CLI drops fork PRs.
 * @param {Set<string>} [input.worktreeBranches]  branches checked out in a local worktree
 * @param {Map<string, string>} [input.pushedAt]  branch -> ISO time of the last push seen
 *          in the repository activity feed. A restore at an old sha counts as activity.
 * @param {string} [input.defaultBranch]
 * @param {string[]} [input.protectedBranches]
 * @param {Date|string|number} input.now
 */
export function classifyBranches({
  branches,
  pulls,
  worktreeBranches = new Set(),
  pushedAt = new Map(),
  defaultBranch = 'main',
  protectedBranches = [],
  now,
}) {
  const nowMs = new Date(now).getTime();
  if (Number.isNaN(nowMs)) throw new Error('classifyBranches: now is required');
  const byHead = new Map();
  for (const pr of pulls) {
    if (!byHead.has(pr.head_ref)) byHead.set(pr.head_ref, []);
    byHead.get(pr.head_ref).push(pr);
  }
  const protectedSet = new Set([defaultBranch, ...protectedBranches]);

  return branches.map((b) => {
    const prs = byHead.get(b.name) ?? [];
    const open = prs.filter((p) => p.state === 'open');
    const merged = prs
      .filter((p) => p.merged_at)
      .sort((x, y) => toTime(y.merged_at) - toTime(x.merged_at));
    const closed = prs
      .filter((p) => !p.merged_at && p.state === 'closed')
      .sort((x, y) => toTime(y.closed_at) - toTime(x.closed_at));
    const exactDefault = merged.find((p) => p.head_sha === b.sha && p.base_ref === defaultBranch);
    const exactOther = merged.find((p) => p.head_sha === b.sha);

    let cls;
    let pr = null;
    let lastActivity;
    if (protectedSet.has(b.name)) {
      cls = 'protected';
      lastActivity = b.committedAt ?? null;
    } else if (open.length) {
      cls = 'open-pr';
      pr = open[0];
      lastActivity = latest(pr.updated_at, b.committedAt);
    } else if (exactDefault) {
      cls = 'merged';
      pr = exactDefault;
      lastActivity = pr.merged_at;
    } else if (exactOther) {
      cls = 'merged-elsewhere';
      pr = exactOther;
      lastActivity = pr.merged_at;
    } else if (merged.length) {
      cls = 'merged-tip-moved';
      pr = merged.find((p) => p.base_ref === defaultBranch) ?? merged[0];
      lastActivity = latest(pr.merged_at, b.committedAt);
    } else if (closed.length) {
      cls = 'closed-unmerged';
      pr = closed[0];
      lastActivity = latest(pr.closed_at, b.committedAt);
    } else {
      cls = 'orphan';
      lastActivity = b.committedAt ?? null;
    }
    // A push is activity whatever the commit dates say: a branch restored at
    // its old merged sha, or a new branch cut from an old commit, is fresh.
    lastActivity = latest(lastActivity, pushedAt.get(b.name));

    const ageDays = lastActivity ? Math.floor((nowMs - toTime(lastActivity)) / DAY_MS) : null;
    return {
      name: b.name,
      sha: b.sha,
      cls,
      pr: pr ? pr.number : null,
      prBase: pr ? pr.base_ref : null,
      lastActivity,
      ageDays,
      worktree: worktreeBranches.has(b.name),
    };
  });
}

/**
 * Decide what to do with each classified row.
 *
 * Defaults are deliberately narrow: only `merged` rows are deleted, and even
 * those are skipped while anything about them is fresh. Everything else needs
 * an explicit flag, so a cron run can never widen its own scope.
 *
 * Returned action per row:
 *   delete   finished and nothing blocks it
 *   skip     eligible by class, but a blocker holds it this run
 *   keep     not eligible (protected, open PR, needs a human, flag not given)
 */
export function planDeletions(rows, {
  includeClosed = false,
  includeOrphans = false,
  includeElsewhere = false,
  olderThanDays = 30,
  graceHours = 24,
  limit = Infinity,
  now,
}) {
  const nowMs = new Date(now).getTime();
  if (Number.isNaN(nowMs)) throw new Error('planDeletions: now is required');
  let budget = limit;

  return rows.map((row) => {
    const blockers = [];
    let eligible = false;
    let reason = '';

    switch (row.cls) {
      case 'protected':
        reason = 'protected branch';
        break;
      case 'open-pr':
        reason = `open PR #${row.pr}`;
        break;
      case 'merged':
        eligible = true;
        reason = `PR #${row.pr} merged, tip is the merged head`;
        break;
      case 'merged-tip-moved':
        reason = `PR #${row.pr} merged but commits were pushed after the merge; review by hand`;
        break;
      case 'merged-elsewhere':
        eligible = includeElsewhere;
        reason = eligible
          ? `PR #${row.pr} merged into ${row.prBase}, tip is the merged head (--include-elsewhere)`
          : `PR #${row.pr} merged into ${row.prBase}, not the default branch; needs --include-elsewhere`;
        break;
      case 'closed-unmerged':
        eligible = includeClosed;
        reason = eligible
          ? `PR #${row.pr} closed without merging (--include-closed)`
          : `PR #${row.pr} closed without merging; needs --include-closed`;
        break;
      case 'orphan':
        eligible = includeOrphans;
        reason = eligible ? 'no PR ever opened (--include-orphans)' : 'no PR ever opened; needs --include-orphans';
        break;
      default:
        reason = `unknown class ${row.cls}`;
    }

    if (eligible) {
      if (row.worktree) blockers.push('checked out in a local worktree');
      if (row.lastActivity === null) {
        blockers.push('last activity unknown');
      } else {
        const ageMs = nowMs - new Date(row.lastActivity).getTime();
        if (ageMs < graceHours * HOUR_MS) blockers.push(`active within the last ${graceHours}h`);
        if (row.cls !== 'merged' && row.cls !== 'merged-elsewhere' && ageMs < olderThanDays * DAY_MS) {
          blockers.push(`younger than --older-than=${olderThanDays} days`);
        }
      }
    }

    let action = 'keep';
    if (eligible && blockers.length === 0) {
      if (budget > 0) {
        action = 'delete';
        budget -= 1;
      } else {
        action = 'skip';
        blockers.push('over --limit');
      }
    } else if (eligible) {
      action = 'skip';
    }

    return { ...row, action, reason, blockers };
  });
}

/**
 * The last word before anything is deleted: re-read origin and the open PR
 * list, and drop every planned row whose branch is gone, moved, or now has
 * an open PR. The push itself still carries a per-ref lease on `sha`, so
 * this is a cheap pre-filter, not the only guard.
 */
export function confirmAgainstOrigin(toDelete, freshHeads, freshOpen) {
  const confirmed = [];
  const skipped = [];
  for (const r of toDelete) {
    const current = freshHeads.get(r.name);
    if (current === undefined) skipped.push({ name: r.name, why: 'already gone' });
    else if (current !== r.sha) skipped.push({ name: r.name, why: `moved since the plan (${r.sha.slice(0, 8)} -> ${current.slice(0, 8)})` });
    else if (freshOpen.has(r.name)) skipped.push({ name: r.name, why: 'gained an open PR' });
    else confirmed.push(r);
  }
  return { confirmed, skipped };
}

export function summarize(planned) {
  const byClass = {};
  const byAction = { delete: 0, skip: 0, keep: 0 };
  for (const row of planned) {
    byClass[row.cls] = (byClass[row.cls] ?? 0) + 1;
    byAction[row.action] = (byAction[row.action] ?? 0) + 1;
  }
  return { total: planned.length, byClass, byAction };
}

export function toTsv(planned) {
  const header = ['action', 'class', 'branch', 'sha', 'pr', 'last_activity', 'age_days', 'reason', 'blockers'];
  const lines = planned.map((r) => [
    r.action,
    r.cls,
    r.name,
    r.sha,
    r.pr ?? '',
    r.lastActivity ? r.lastActivity.slice(0, 10) : '',
    r.ageDays ?? '',
    r.reason,
    r.blockers.join('; '),
  ].join('\t'));
  return [header.join('\t'), ...lines].join('\n') + '\n';
}

/**
 * Parse `git push --porcelain` output for a batch of `:refs/heads/<name>`
 * deletions. With --atomic a rejected batch reports every ref as `!`; without
 * it git applies each refspec on its own, so the caller must always log by
 * ref, never by batch.
 *
 * Lines look like:  -\t:refs/heads/foo\t[deleted]
 *                   !\t:refs/heads/bar\t[rejected] (stale info)
 */
export function parsePushPorcelain(output) {
  const ok = [];
  const failed = [];
  for (const line of String(output).split('\n')) {
    const [flag, spec, summary = ''] = line.split('\t');
    if (!spec || !spec.includes(':refs/heads/')) continue;
    const name = spec.slice(spec.indexOf(':refs/heads/') + ':refs/heads/'.length);
    if (flag === '!') failed.push({ name, summary: summary.trim() });
    else ok.push(name);
  }
  return { ok, failed };
}

const BOOLEAN_FLAGS = {
  '--delete': 'delete',
  '--yes': 'yes',
  '--include-closed': 'includeClosed',
  '--include-orphans': 'includeOrphans',
  '--include-elsewhere': 'includeElsewhere',
  '--no-safety-fetch': 'noSafetyFetch',
  '--help': 'help',
  '-h': 'help',
};
const NUMBER_FLAGS = { '--grace': 'graceHours', '--older-than': 'olderThanDays', '--limit': 'limit' };
const PATH_FLAGS = { '--report': 'report', '--log': 'log' };

/** Strict flag parsing: an empty number is an error, not zero. Throws on bad input. */
export function parseArgs(argv, env = {}) {
  const flags = {
    delete: false,
    yes: false,
    includeClosed: false,
    includeOrphans: false,
    includeElsewhere: false,
    noSafetyFetch: false,
    help: false,
    graceHours: 24,
    olderThanDays: 30,
    limit: Infinity,
    report: null,
    log: env.PC_PRUNE_LOG || null,
  };
  for (const arg of argv) {
    const eq = arg.indexOf('=');
    const key = eq === -1 ? arg : arg.slice(0, eq);
    const value = eq === -1 ? undefined : arg.slice(eq + 1);
    if (key in BOOLEAN_FLAGS) {
      if (value !== undefined) throw new Error(`${key} takes no value`);
      flags[BOOLEAN_FLAGS[key]] = true;
    } else if (key in NUMBER_FLAGS) {
      if (value === undefined || !/^\d+(\.\d+)?$/.test(value)) throw new Error(`${key} needs a number, e.g. ${key}=24`);
      flags[NUMBER_FLAGS[key]] = Number(value);
    } else if (key in PATH_FLAGS) {
      if (!value || !value.trim()) throw new Error(`${key} needs a path`);
      flags[PATH_FLAGS[key]] = value;
    } else {
      throw new Error(`unknown flag: ${arg}`);
    }
  }
  return flags;
}
