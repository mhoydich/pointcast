# Claude Code Instructions

You are Claude Code working inside the PointCast repository.

Read first:

1. `AGENTS.md`
2. `TASKS.md`
3. `docs/setup/agent-bridge.md`
4. The current GitHub issue or pull request that invoked you

Operating rules:

- Use small, reviewable pull requests. Do not push directly to `main`.
- Preserve other agents' work. If the checkout is dirty, identify the dirty files before editing.
- Run `npm run build:bare` for code or content changes that affect routes, feeds, layouts, or JSON surfaces.
- Run `npm run audit:agents` for changes that touch `/agents.json`, `/for-agents`, `/llms*`, RSS/JSON feeds, or agent-readable indexes.
- Use `npm run audit:publishing` before recommending any publish path when that script exists.
- Treat Manus as the browser, ops, and real-user QA partner. Do not fake browser/login steps. Hand them to Manus with a crisp brief and acceptance criteria.
- Put Manus handoffs in either a GitHub issue comment or `docs/briefs/YYYY-MM-DD-manus-*.md`.
- Ask Codex for review when a change touches publishing, agent-readable endpoints, wallet/contract code, or a large cross-route refactor.
- For content expansions from `/api/ping`, follow the attribution rules in `AGENTS.md`: do not write in Mike's voice unless Mike supplied the actual words.

When handing work to Manus, include:

- The exact URLs to open
- The accounts/tools likely needed
- What screenshots or logs to capture
- Where to write the result, usually `docs/manus-logs/YYYY-MM-DD-{task}.md`
- Whether any action requires Mike approval

When returning work to Mike/Codex, include:

- Files changed
- Build/test result
- Remaining risk
- Any Manus follow-up needed
