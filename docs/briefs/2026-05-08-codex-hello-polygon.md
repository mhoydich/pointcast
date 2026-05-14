# Codex review brief — HelloPolygon contract

**For:** Codex
**From:** cc
**Date:** 2026-05-08
**Branch:** `feat/mist-room-cc-2026-05-08`
**Files for review:**
- `contracts/polygon/hello_polygon.sol` (~100 lines)
- `contracts/polygon/README.md` (deployment + lore)
- `src/lib/eth/config.ts` (already on branch — see `HELLO_POLYGON`)

## Why you're on this

Per `CLAUDE.md`: *"Ask Codex for review when a change touches publishing, agent-readable endpoints, **wallet/contract code**, or a large cross-route refactor."* This is the second on-chain primitive after Wire Attestations. Mike originates only after Codex gives a thumbs up — same rule as PCWIRE.

## Context

PointCast has a 2018-era HELLO ERC-20 on Ethereum L1 at `0x1Fda96405DD8Ee22631aBCf4f61282eaE802012f` — name `"Hello | a greeting"`, 10B supply, 18 decimals, deployer holds ~99.99997%. Lore-rich but L1-gas-expensive to interact with in 2026.

**HelloPolygon** is a cousin on Polygon mainnet: same name / symbol / decimals / supply, different chain, sub-cent gas. It's also its own faucet: the full 10B is minted to the contract address at construction, and `claim()` hands out 1 HELLO per call per address per 24 hours. No admin, no upgrade, no fees, no ownership — same permanent + parameterless posture as Wire Attestations.

UI lives at `/hello`.

## What I'd like you to look at

### A. ERC-20 baseline correctness (OZ v5)

Single inheritance from `ERC20`. Constructor `_mint(address(this), INITIAL_SUPPLY)`. No customizations to the `_update` hook, no extra interfaces beyond the standard ERC-20 set. Worth verifying nothing in v5's ERC-20 changed that would surprise a deployer expecting v4 semantics.

### B. Reentrancy posture on `claim()`

`_transfer(address(this), msg.sender, CLAIM_AMOUNT)` is the last interaction. State (`lastClaimAt`, the cooldown gate) is written before the transfer. Standard ERC-20 `_transfer` is a pure storage update — no receiver hooks. So reentrancy is moot here unless OZ v5 added any hook surface I missed. Worth a sanity check.

### C. The cooldown check

```solidity
require(last == 0 || block.timestamp - last >= CLAIM_COOLDOWN, "HELLO: cooldown");
```

I'm using a `last == 0` short-circuit so first-time claims don't underflow. The `block.timestamp - last` arithmetic is safe in Solidity 0.8.x (reverts on underflow), but worth confirming the gate semantics are what I think they are: "if never claimed OR 24h has elapsed, allow."

### D. Faucet-dry handling

```solidity
require(balanceOf(address(this)) >= CLAIM_AMOUNT, "HELLO: faucet dry");
```

`CLAIM_AMOUNT` is 1 HELLO. With 10B initial supply, this gate effectively never fires. Still worth confirming the message is what a user-facing UI should read, and that `balanceOf(address(this))` is the right check (vs. some other accounting).

### E. The contract holding its own supply

`_mint(address(this), INITIAL_SUPPLY)` is unusual — most ERC-20s mint to the deployer. Here the contract IS the bag. Implications:
- The deployer (Mike) gets zero HELLO at construction. Intentional.
- Nobody can withdraw the unclaimed reserve. Permanent.
- The contract's `balanceOf` shows the full unclaimed supply.

Is there a known gotcha with self-holding ERC-20 contracts? OZ's `_transfer` does allow `from == address(this)`, so this should work. But worth flagging if there's an interface convention I'm violating.

### F. No-admin / no-upgrade

Same posture as Wire Attestations: once deployed, the contract is permanent. If a bug is found, it's a v2 deployment. Worth confirming this is the right call for a faucet specifically — most production faucets have a `pause()` or `setAmount()` for operational flexibility. I'm intentionally rejecting that. Sane?

### G. `claim()` selector + ABI exposure

The page calls `claim()` via raw selector `0x4e71d92d` from client-side JS (to keep the bundle small). Worth confirming the selector is correct for this exact function signature. The ABI shape is also relevant for marketplace indexers — confirm OZ v5 ERC-20 + our extras don't trip any ABI weirdness.

## What I don't want you to look at

- **Gas golfing.** Polygon gas is already rounding-error; correctness first.
- **L1↔Polygon bridge.** Out of scope. They stay cousins.
- **EIP-2612 permit / meta-tx for gasless claims.** Possible v1 work, not v0.
- **A test scaffold.** Mike's call which Foundry/Hardhat layout to use; not part of this review.

## Process

Drop your review at `docs/codex-logs/2026-05-08-hello-polygon-review.md`. Mirror the structure of `docs/codex-logs/2026-05-08-wire-attestations-review.md` — seven sections A–G, verdict per question (PASS / CONCERN / SUGGEST), unified diff hunks for any suggested changes, then an `## Overall verdict` paragraph at the bottom.

Same commit message convention: `review(codex): HelloPolygon contract — verdict <overall>`. Don't push.

If you want Slither/Mythril output, include it as a `## Static analysis` section. Skip if the tools aren't installed.

— cc
