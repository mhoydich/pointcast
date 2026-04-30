# Correction — Link agent payments architecture

**Date:** 2026-04-30 (afternoon — same day as initial proposal)
**Author:** Mike × Claude
**Status:** Supersedes `skill.md` (deleted) and architecture sections of
[2026-04-30-link-agent-payments.md](./2026-04-30-link-agent-payments.md).

The morning proposal was drafted before `@stripe/link-cli` was inspected.
Some of it was speculation. This note corrects the architecture sections;
the first-principles design note and the public blog post stand unchanged.

---

## What was wrong in the morning draft

| Morning assertion                                                                | Reality                                                                                              |
|----------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| PointCast authors a repo-root `skill.md` describing the integration to Stripe.   | Stripe authors the skill files. `link-cli skills add` syncs **6 Stripe-authored** SKILL.md files into the agent's local skills directory (`.agents/skills/link-cli-*/`). PointCast does not need a manifest file. |
| `src/lib/link.ts` wraps a JS SDK.                                                | `@stripe/link-cli` is a CLI binary. The right wrapper is `child_process.spawn`. There is no JS SDK in v0.4.x. |
| Webhook → settle → write Block.                                                  | `link-cli spend-request create --request-approval` polls in-process until approve/deny/expire. No webhook in v0; receipt is the synchronous return value. (Webhooks may exist in higher-tier integrations; not needed for MVP.) |
| Whitelist merchants by domain in `skill.md`.                                     | Whitelist enforced server-side in `src/lib/link.ts` (`LINK_MERCHANT_WHITELIST_V0`); link-cli has no per-app merchant restriction primitive in v0.4.x. |

## What's correct as built

- The Block schema diff (new optional `spend` field) — landed in
  [content.config.ts](../../src/content.config.ts) on this branch.
- Test mode for v0 — `link-cli spend-request create --test` creates testmode
  credentials. `src/lib/link.ts` defaults to test mode and requires explicit
  override to disable. Live mode behind a separate PR after the test loop is
  proven.
- The two-rail thesis (Tezos = identity, Link = money) — unchanged.
- The +12-18mo "agents earn" inversion as the strategic threshold — unchanged.

## The actual `link-cli` surface

Verified against `link-cli@0.4.1`:

```
link-cli auth login | logout | status        # OAuth-style login to Link
link-cli demo                                # interactive end-to-end demo
link-cli onboard                             # guided setup: auth + verify methods + demo
link-cli payment-methods add | list          # manage methods on the account
link-cli spend-request create [--test]       # the agent-side runtime call
link-cli spend-request retrieve <id>
link-cli spend-request request-approval <id>
link-cli spend-request update <id>
link-cli mpp decode | pay <url>              # HTTP-402 machine-payment protocol
link-cli mcp add [--agent claude-code|cursor]  # register link-cli as an MCP server
link-cli skills add [--no-global]            # sync Stripe-authored skill files
link-cli completions                         # shell completions
```

Two integration paths emerge:

1. **MCP path** — `link-cli mcp add --agent claude-code`. Each PointCast
   resident's local environment registers link-cli as an MCP stdio server.
   The agent then calls Link tools natively, no shell-out required. This
   is the cleanest path long-term; ties into Anthropic's MCP protocol.
2. **CLI shell-out** — `child_process.spawn('link-cli', ...)`. Simpler v0,
   no per-agent setup, but only works where the binary is installed.
   PointCast `src/lib/link.ts` takes this path for the MVP.

v0 ships path 2. v1 may add path 1 for residents that want native MCP.

## Spend request schema (real)

From `link-cli spend-request create --schema`:

| Flag                  | Notes                                                                  |
|-----------------------|------------------------------------------------------------------------|
| `--payment-method-id` | `csmrpd_xxx` — produced by Mike's `onboard`; goes in env.              |
| `--credential-type`   | `card` (Stripe Elements) or `shared_payment_token` (HTTP-402 / agent). |
| `--network-id`        | Required for `shared_payment_token`. From `mpp decode`.                |
| `--amount`            | Cents. **Max 50000 ($500/req)**.                                        |
| `--merchant-name`     | Required for card; forbidden for shared_payment_token.                 |
| `--merchant-url`      | Same.                                                                  |
| `--context`           | **Min 100 chars.** User reads this when approving.                      |
| `--request-approval`  | Polls until terminal status. Default true.                             |
| `--test`              | Testmode credentials. v0 hard-defaults to this.                        |

## What ships in this PR (`feat/link-mvp-scaffolding`)

- `src/content.config.ts` — adds `spend` schema field, optional, sibling to `edition`.
- `src/lib/link.ts` — `child_process` wrapper around `link-cli spend-request create`. Hard-defaults to test mode. Caps and merchant whitelist enforced server-side.
- `src/pages/api/link/spend.ts` — agent-facing POST endpoint. Hard-disabled until `LINK_SPEND_ENDPOINT_ENABLED=true`.
- `BLOCKS.md` — v2.2 revision note describing the `spend` field.
- This correction note.

What does **not** ship yet:

- The `MNY` channel addition. Deferred — channels.ts was rolled back during
  this session; addition will be a separate decision after Mike weighs in
  on whether receipts deserve their own channel or live on FD/FCT.
- Components (`LinkConnect.astro`, `AllowanceShelf.astro`). Need a real
  `csmrpd_xxx` to render against.
- Deployment plan. The Cloudflare Worker runtime can't `spawn`. Either run
  agents locally with link-cli installed and have them call /api/link/spend
  via a Node sidecar, OR skip the API route entirely and have agents call
  `link-cli` directly then POST receipts to `/api/link/receipt`. v0 leaning
  toward the latter — simpler, keeps the Worker thin.

## Mike's next step (unchanged)

1. `npm install -g @stripe/link-cli` ✓ already published & verified.
2. `link-cli onboard` — guided flow, ends with a `csmrpd_xxx` payment-method-id.
3. Paste that id back; I'll wire it to the env and start the test-mode loop.
