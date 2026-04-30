# Proposal — Link agent payments wired into PointCast Blocks

**Author:** Mike × Claude
**Date:** 2026-04-30
**Status:** Draft for Codex review. Pre-implementation.
**Precedes:** [`2026-04-30-agent-payments-first-principles.md`](./2026-04-30-agent-payments-first-principles.md)

---

## Goal

Wire Stripe's Link agent payment rails into PointCast as a sibling to the existing Tezos wallet stack. **Tezos = identity of artifact. Link = money of action.** Both surfaces emit Blocks; a single Block can carry both.

## Non-goals

- Replacing Tezos. Tezos remains identity, treasury, CC0 keepsake.
- Visitor-funded agent allowances. v0 is Mike-funded, single-tenant. Multi-tenant is v2.
- Agent-to-agent payments. Out of scope until +12mo.

## Schema diff — `BLOCKS.md`

Two additions, both backward-compatible.

### 1. New optional field on `Block`

```ts
spend?: {
  agent: 'claude' | 'codex' | 'manus'
  loop: 'scout' | 'scorekeeper' | 'host' | 'producer' | string  // see agent-value.ts
  amount_usd: number
  merchant: string                  // e.g. "replicate.com", "stripe-link-test"
  status: 'pending' | 'approved' | 'denied' | 'settled' | 'refunded'
  link_session_id: string           // Stripe Link authorization id
  receipt_url?: string              // Stripe-hosted receipt
  approved_by?: string              // visitor handle, future
}
```

A Block carrying `spend` is a **receipt block.** A Block carrying both `spend` and `edition` is a **dual-rail block** (Link funded the artifact; Tezos minted it).

### 2. New channel `MNY` Money

| Code | Name  | Color (hex / ramp)    | Purpose                                          |
|------|-------|------------------------|--------------------------------------------------|
| MNY  | Money | `#0B6B3A` / emerald-700 | Agent allowances, spend receipts, payout splits. |

Sibling to `FCT` Faucet. Faucet is *free claims to visitors*; Money is *receipts of agent loops*. The same Block schema serves both.

## File-level sketch

| Existing (Tezos)                    | New (Link)                                    |
|-------------------------------------|-----------------------------------------------|
| `src/lib/tezos.ts`                  | `src/lib/link.ts` — wraps `@stripe/link-cli`, lazy-loaded |
| `src/components/WalletConnect.astro`| `src/components/LinkConnect.astro`            |
| `src/components/WalletShelfModule.astro` | `src/components/AllowanceShelf.astro`    |
| `src/components/MintButton.astro`   | `src/components/SpendButton.astro`            |
| `/collect/[tokenId]`                | `/api/link/webhook.ts` — settle → write receipt Block |
| —                                   | `skill.md` (repo root) — Link CLI manifest    |

## MVP scope (smallest viable)

One PR. Codex-reviewable per `CLAUDE.md` (touches wallet-adjacent code).

1. `BLOCKS.md` schema diff above; bump revision to v2.2.
2. `MNY` channel registered in `src/lib/channels.ts`.
3. `src/lib/link.ts` — `@stripe/link-cli` wrapper, Beacon-style lazy init.
4. `src/components/LinkConnect.astro` — Mike-only onboard, store session in localStorage like Beacon.
5. `src/components/AllowanceShelf.astro` — read-only display of current allowance + recent receipts.
6. One end-to-end loop: **Codex → Replicate API → receipt Block in `MNY` channel**.
7. `skill.md` at repo root.
8. `docs/briefs/2026-04-30-manus-link-onboard.md` — Manus QA brief.

## Acceptance criteria

- `npm run build:bare` clean.
- `npm run audit:agents` clean (skill.md is agent-readable; agents.json updated).
- `/blocks/MNY-0001.json` exists after a real Codex loop fires; carries valid `spend` payload + Stripe receipt URL.
- Allowance Shelf shows the receipt within 30s of settle.
- Manus log captures the Link onboard flow with screenshots.

## Risks / open questions

1. **`skill.md` format is unverified.** Stripe's `link.com/agents` page references it; the actual schema is not in our hands. The draft below is a best-guess based on the public surface. Codex/Manus to verify against Stripe docs before committing.
2. **No webhook secret rotation story yet.** v0 stores secret in `wrangler.toml` env. Fine for MVP; needs proper KV/secret store before v1.
3. **Per-resident vs. per-visitor allowance** — v0 is per-resident (each agent has a Mike-funded budget). Per-visitor is the more PointCast-native model and should be designed for in v1.
4. **Geocities ethos vs. Stripe surface area.** LinkConnect should not look like a SaaS dashboard. Style guide: see PointCast aesthetic memo. Big buttons, saturated, slightly-broken-on-purpose.
5. **CC0 / Nouns culture tension.** Stripe is a centralized custodian. Be honest about that in the surface copy — don't pretend the Link side is "decentralized."

## Hand-offs (per CLAUDE.md)

- **Codex review:** `src/lib/link.ts`, webhook handler, schema diff. Wallet-adjacent code.
- **Manus QA:** real-browser `link-cli onboard`, screenshots, log to `docs/manus-logs/2026-04-30-link-onboard.md`.
- **Mike approval:** any actual money flowing. v0 cap: $20 total exposure.

## Two-year horizon (informs v0 design choices)

See first-principles doc. Design v0 such that:
- The `spend` field can grow a `payouts` sibling without breaking. ✓
- Agent identity is stable across loops (use `agent-value.ts` keys). ✓
- The channel namespace has room for a future `PAY` (payouts) channel. ✓

Decisions in v0 should not foreclose the +18-24mo future where Blocks carry both `spend` and `payouts`.
