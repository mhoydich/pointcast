# Claude, Manus, and Codex Bridge

Filed: 2026-04-23

PointCast uses GitHub as the durable work bus. Claude Code handles repo work,
Manus handles browser/ops/real-user QA, Codex reviews and keeps release hygiene.

## Current Wiring

### Claude Code

GitHub Actions workflow:

```text
.github/workflows/claude.yml
```

Trigger Claude by commenting `@claude` on a GitHub issue, PR, or review
comment. The workflow uses:

```text
anthropics/claude-code-action@v1
model: claude-opus-4-7
secret: ANTHROPIC_API_KEY
```

Required one-time setup:

1. Install the official Claude GitHub app for `mhoydich/pointcast`.
2. Add repository secret `ANTHROPIC_API_KEY` under GitHub Actions secrets.
3. Open an issue from the `Agent handoff` template and include `@claude` in
   the brief.

Reference: <https://code.claude.com/docs/en/github-actions>

### Manus

Local API wrapper:

```sh
node scripts/manus.mjs list
node scripts/manus.mjs create --title "PointCast QA" --profile manus-1.6-max --file docs/briefs/some-manus-brief.md
node scripts/manus.mjs watch <task_id>
```

The API key stays in local `.env.local`:

```text
MANUS_API_KEY=...
```

Manus should write results to `docs/manus-logs/` or comment back on the
GitHub issue. Browser actions, account setup, screenshots, listings, posting,
and real-user QA belong to Manus.

Smoke test:

```sh
npm run manus:create -- --title "PointCast Claude bridge smoke" --file docs/briefs/2026-04-23-manus-claude-bridge-smoke.md
```

Reference: <https://open.manus.ai/docs/v2/task.create>

### Codex

Codex coordinates from the repo:

- Creates clear briefs and GitHub issues.
- Dispatches Manus tasks when a local `MANUS_API_KEY` is present.
- Reviews Claude PRs before publish.
- Keeps live publishing gated by Mike approval.

## Handoff Flow

```text
Mike/Codex -> GitHub issue
GitHub issue with @claude -> Claude Code Action
Claude PR or comment -> Codex review
Browser/account/ops gap -> Manus brief
Manus log/screenshots -> Claude or Codex consumes result
Mike approval -> merge/publish
```

## Issue Template

Use:

```text
.github/ISSUE_TEMPLATE/agent-handoff.yml
```

Target choices:

- `Claude Code` for repo implementation
- `Manus` for browser, ops, QA, screenshots, or third-party posting
- `Codex` for review, release shaping, or repo hygiene
- `Mike` for product/content/approval decisions

## Safety

- No agent commits secrets.
- No agent publishes to `main` without Mike approval.
- Manus/browser tasks that submit, post, purchase, subscribe, change
  permissions, or transmit sensitive data require explicit action-time
  confirmation.
- GitHub issues are the preferred public ledger; private credentials stay in
  GitHub Secrets, Cloudflare secrets, or local `.env.local`.
