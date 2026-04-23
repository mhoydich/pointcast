# Gamgee

**Status:** RC0 planning anchor  
**Opened:** 2026-04-23  
**Director:** Mike Hoydich  
**Agents:** Claude Code, Codex, Manus

Gamgee is the release where PointCast stops reading as a brilliant lab pile and starts reading as a named, navigable system.

The release thesis:

> PointCast is an agent-native broadcast system: human pages, machine-readable surfaces, and a visible multi-agent build ledger sharing the same source of truth.

Gamgee is not a new feature sprint. It is a consolidation release. The work is to prove the agent loop, freeze the release train, make the current breadth legible, and package one public front door for humans, agents, and builders.

## Why Gamgee

PointCast already has enough invention on disk: Blocks, Magpie, Sparrow, `/for-agents`, `/agents.json`, stripped HTML mode, WebMCP, compute ledger, presence, games, decks, contracts, and a real multi-agent build process. The bottleneck is now legibility.

Gamgee should behave like a steward release:

- it gathers what exists;
- it names what matters;
- it protects the release train from further sprawl;
- it makes the agent collaboration loop visible and repeatable.

## RC0 Outcomes

RC0 is done when these five gates are green or explicitly deferred with a reason.

| Gate | Owner | Acceptance |
|---|---|---|
| Agent loop | Claude + Codex + Manus | Claude responds from GitHub Actions, makes or recommends one low-risk cleanup, Codex reviews, Manus log records the run. |
| Release train | Codex | `cc/sprints-1-6-publish` is inventoried and split into `Gamgee` / `later` / `needs Mike`. |
| Canonical story | Codex + Mike | This release doc states the public thesis and the audiences clearly enough to drive page copy. |
| Public front door | Claude or Codex | `/gamgee` or `/agent-native` explains what humans click, what agents read, and what builders can reuse. |
| Health pass | Claude + Codex | Build warnings are triaged; first-class routes return 200; known blockers are listed instead of buried. |

## In Scope

- Fix the Claude bridge launch path until the action reaches real Claude work.
- Create a small safe cleanup PR from Claude, ideally the duplicate `share` key warning in `src/pages/agents.json.ts`.
- Review the dirty `cc/sprints-1-6-publish` train and decide what belongs in Gamgee.
- Write or refresh one canonical page for the release.
- Refresh agent-facing surfaces only when they help the release story: `/for-agents`, `/agents.json`, `/llms.txt`, `/agent-native`, `/workbench`.
- Document every handoff in the repo.

## Out of Scope

- New games, unless they are already on the release train and only need packaging.
- Contract deployments.
- Production DNS or payment changes.
- Large design rewrites.
- Any new permanent schema unless Mike explicitly approves it.

## Release Train Triage

The active local train at kickoff is:

`cc/sprints-1-6-publish`

It contains a large dirty working tree and should be treated as the current release train, not as miscellaneous local noise. Triage it into:

- **Gamgee:** must ship for the release story.
- **Later:** good work, not needed for this release.
- **Needs Mike:** brand, payment, auth, contract, or strategic calls.
- **Drop:** stale, duplicate, or superseded.

Suggested inventory output:

`docs/releases/gamgee-inventory.md`

The inventory should group changes by surface, not by raw filename: agent surfaces, public pages, content blocks, contracts, functions, workers, assets, docs, and scripts.

## Agent Loop Gate

Issue #7 is the live Claude bridge smoke test:

`https://github.com/mhoydich/pointcast/issues/7`

The expected progression:

1. Claude Code starts from `@claude`.
2. GitHub Actions checks out the repo.
3. Claude reads `CLAUDE.md` and `AGENTS.md`.
4. Claude inspects the known low-risk warnings.
5. Claude either opens a tiny PR or comments with a concrete reason it cannot.
6. Codex reviews the PR or the comment.
7. Manus records the browser/API smoke result under `docs/manus-logs/`.

Known setup fixes already merged:

- PR #8 added `id-token: write` and archived the Manus bridge smoke log.
- PR #9 added `actions/checkout@v4` before the Claude action.

Known current blocker at RC0 open:

- Latest Claude run reached Claude Code initialization and failed because the Anthropic API credit balance was too low. Mike added API credits afterward; retry is in progress.

## Public Page Shape

Gamgee's public front door should answer three questions without making visitors understand the whole repo.

### Humans

- What is PointCast?
- What can I click right now?
- Why are there agents here?

### Agents

- What should I fetch first?
- Which JSON endpoints are canonical?
- What citation format should I use?

### Builders

- Which pattern can I steal?
- What is the minimum version of the PointCast pattern?
- How do Magpie, Sparrow, the compute ledger, and `/agents.json` fit together?

## Suggested First PR Stack

1. **Claude smoke cleanup:** duplicate `share` key or another one-file warning fix.
2. **Gamgee inventory:** `docs/releases/gamgee-inventory.md`.
3. **Gamgee page:** `/gamgee` or `/agent-native` refresh.
4. **Agent docs refresh:** ensure `/for-agents`, `/agents.json`, `/llms.txt`, and README agree.
5. **Release candidate PR:** merge the selected `cc/sprints-1-6-publish` subset.

## Done Means

- There is a public URL that explains Gamgee.
- The release train has a named inventory.
- Agent surfaces are consistent enough for a fresh crawler or coding agent.
- Claude, Codex, and Manus each have one visible artifact in the loop.
- Mike can point someone at one URL and say: "This is what PointCast is becoming."

