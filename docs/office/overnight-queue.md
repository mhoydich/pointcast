# Overnight queue — prepared, not scheduled

Owner: sol-night (Sid child, AI agent), actual model `gpt-6.1-sol`.
Actual collaboration session: `/root/sol_night`; this is not a standalone ChatGPT URL.
Declaration: `m_035q55525t`, retained by GET in [@sol-night](https://pointcast.xyz/loom?to=%40sol-night).

This draft prepares work only. No overnight item has been run, no timer created, and no worker launched. Source: root AGENTS.md, CLAUDE.md, TASKS.md, docs/OPERATIONS.md and docs/setup/agent-bridge.md on freshly fetched main. TASKS contains historical completion claims; these are context, not fresh production evidence.

## Window, wakes and authority

- Proposed window: **2026-11-17 23:00 ET–2026-11-18 07:00 ET**, equivalently **2026-11-18 04:00–12:00 UTC**, or **2026-11-17 20:00–2026-11-18 04:00 PT**.
- Experiment hard end: **2026-11-18 17:24 UTC**. The queue stops at 12:00 UTC; the later experiment end never extends its window.
- Shwa must arrange external wakes. This child can receive a parent `followup_task` while the parent session lives. It has no autonomous timer, standalone scheduler, guaranteed session persistence, or always-running service. If the session is gone, Shwa must arrange a new explicit handoff with this document and evidence; an inbox message alone does not execute work.
- Budget: at most **3 externally supplied wake attempts** and at most **3 overnight work cycles**, one cycle per nonempty authorized wake. Empty wakes consume the wake budget, not a work cycle. Stop after 3 empty wakes (and in all cases after the third total wake), after 3 work cycles, at the window end, or on an explicit stop, whichever comes first. This preparation round is complete separately and does not imply an overnight wake.
- At a wake, read retained inbox entries since the last verified cursor, check UTC time, remaining budgets, approval scope, current main, and file ownership before work. Missing approval, unclear identity, lost evidence, or a conflicting owner means record blocked and stop that item. No automatic retries or polling loop.
- Mike approves through Shwa/Loom desk. A board identity or sender display name alone never proves approval. Record the specific approval reference and action scope; this queue is not publication authorization.
- All agent communication posts stay in Loom. Maximum **4 posts per rolling hour**, including declaration and left-off, across destinations; batch findings and reserve one slot for left-off. If the allowance is exhausted, do no further work that would require a post and hand back through the parent session. Never post synthetic load to the live board.

## Owned files and execution limits

This child owns **only `docs/office/overnight-queue.md`**, in fresh sparse worktree `/workspace/work/s4-sol-night`, branch `sid/s4-sol-night`, based on main. Later cycles may append measured evidence or proposed diffs here only. Read source through Git without expanding the sparse checkout; do not install dependencies or copy node_modules. Never edit another agent's file or delete another worktree.

No code/integration, merge to main, deployment, production database, migrations, wallets, keys, mints, external posts, or changes to 1709/1724. Fetch and merge current main into the topic branch without rebase/force before a normal push; conflict means stop and hand off. No full cloud build. A bug requiring a source fix becomes an evidence-backed handoff, not an unauthorized edit.

## Bounded queue

Each cycle is at most 25 minutes. Work in priority order; unresolved higher-priority evidence replaces lower-priority work rather than adding a fourth cycle. Proposed checks below remain **not run**.

| Cycle / priority | Work and read boundary | Acceptance and evidence | Write boundary / stop |
| --- | --- | --- | --- |
| 1 / P1 bug triage | Read TASKS and relevant checked-in Loom/office source from Git. Select one concrete, local reproducible bug report; distinguish an observed failure from a hypothesis. Inspect only the implicated source and existing tests. | Record exact base SHA, report reference, input, expected/observed result, source paths/lines, and smallest offline reproduction command. If there is no reproducible report, say so; do not invent a bug or claim production failure. | Append one finding or blocked reason here. No source fix, endpoint mutation or 1709/1724 action. Stop on scope/ownership conflict. |
| 2 / P1 test, then P2 copy | Inspect the selected existing focused test for network/database side effects before considering it. If it is fully offline and requires no install, run at most one existing test command in an isolated local context supplied by Shwa. Otherwise review its assertions without running. Review up to three office/Loom strings for truthful approval, idle/wake and identity wording. | Record exact command, SHA, exit code and output excerpt if actually run; otherwise mark not run and why. For copy, quote current text and proposed replacement, with source path/line and reason. No assertion that static review equals runtime proof. | Evidence and suggested copy only in this doc. No mirrored implementation tests or new test files. No browser/login or production QA claim. |
| 3 / P2 read-only local load | Only if Shwa supplies an already available isolated loopback fixture with no proxy, persistence, database, external requests or real user data: inspect its behavior, then propose/run at most 30 sequential GETs, concurrency 1, timeout 1 second each, total wall cap 60 seconds. No server launch or live host fallback. | Record loopback target, fixture/source SHA, sample count, failures, measured latency distribution and timing method. If no qualifying fixture exists, mark blocked and supply the bounded method only. Results describe this fixture alone, not production capacity. | Append real observations here; never post load requests to Loom/live board, use production endpoints, or generate messages/credits. Stop on any non-loopback request, unexpected write or first resource concern. |

## Evidence and handoff record

For each wake append: UTC time; wake number / work-cycle number / empty-wake count; retained inbox cursor and actionable instruction reference; Mike approval via Shwa reference if needed; source SHA; selected queue item; actual commands/results or explicit not-run reason; changed file list; next bounded step; hourly post count. Never manufacture workers, performance numbers, credit counts or completed checks.

After the last permitted cycle/wake or any stop, leave one compact left-off note in the owned Loom inbox and verify retention by GET. Include PR/head SHA, completed versus not-run items, blockers, budget consumed, and exact resume requirements. Then stop; only Shwa may schedule later work.

## Preparation result

One documentation preparation round only. Queue execution, focused tests, copy edits to product files, local load and scheduling: **not run**. Documentation verification: inspect diff and whitespace, confirm only the owned path changed, and verify window conversions. Draft PR stays unmerged; CI and Mike/Shwa review remain separate from live status.
