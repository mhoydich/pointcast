# Handoff from cc → Codex · 2026-05-08

Mike's stepping away from the cc session. This is what's in flight on the `/mist` Ethereum surface, what needs your hand, and what's gated on Mike. Cross-reference: `docs/decisions/2026-05-07-mist-room-decision.md` for the room's design framing.

## Branch state

**Branch:** `feat/mist-room-cc-2026-05-08`
**Latest commit:** `d2e42ca` (PR #9 — HelloPolygon)
**Total commits since main:** 13

| # | SHA | What |
|---|-----|------|
| 1 | `cec6778` | Scaffold — viem + siwe + chain config |
| 2 | `0a12cb8` | SIWE-shaped /api/auth/ethereum |
| 3a | `ef178d3` | /mist page skeleton + App Catalog |
| 3b | `475956e` | ENS + Base balance enrichment |
| 3c | `016ac99` | agents.json + Manus QA brief + block 0460 |
| 4 | `124a7e5` | Wire Attestations contract source |
| 5 | `abd0339` | Window onto Ethereum (Nouns live) |
| fix | `2052d9a` | Restore enrichment regression |
| 6a | `79998c4` | ERC-1271 verify in auth/ethereum |
| 6b | `81fbf1c` | Coinbase Smart Wallet (passkey) |
| receipt | `ca0ee16` | Block 0470 wire |
| 7 | `ee08ef5` | Outbound section in /mist |
| 8 | `fdebb35` | MIST coin (Zora) widget + mint brief |
| 9 | `d2e42ca` | HelloPolygon contract + /hello UI |

All pushed to origin. SHA-verified after every commit.

## Two contract reviews — your lane

### Review #1: Wire Attestations — **DONE, awaits push**

You already reviewed it. Output lives at:

- **Review log:** `docs/codex-logs/2026-05-08-wire-attestations-review.md`
- **Local commit:** `d5f5322` on `codex/wire-attestations-review-2026-05-08`
- **Origin:** NOT pushed yet (per the original brief's "do not push")
- **Verdict:** APPROVE-WITH-CHANGES
- **Six PASS, one SUGGEST (D), one CONCERN (E)** — both flagged items converge on the same fix
- **Required change:** tighten `blockId` validation in `contracts/eth/wire_attestations.sol::attest()` to a JSON/URL-safe charset `[0-9A-Za-z_-]`. Your diff is inlined in the review log.

**Codex follow-up actions (if/when you want):**

1. Push the review branch to origin so the review is visible:
   ```
   cd /private/tmp/pointcast-codex-wire-review-1778778088
   git push origin codex/wire-attestations-review-2026-05-08
   ```
2. Apply your own char-set fix to `contracts/eth/wire_attestations.sol` directly on `feat/mist-room-cc-2026-05-08`, commit as `fix(mist): apply codex char-set hardening to wire_attestations.sol`, push. After that the contract is ship-clean and Mike can originate.

### Review #2: HelloPolygon — **PENDING**

New brief is queued at:

- **Brief:** [`docs/briefs/2026-05-08-codex-hello-polygon.md`](../briefs/2026-05-08-codex-hello-polygon.md)
- **Contract:** [`contracts/polygon/hello_polygon.sol`](../../contracts/polygon/hello_polygon.sol) (~100 lines, OZ v5, pragma 0.8.24)
- **README:** [`contracts/polygon/README.md`](../../contracts/polygon/README.md)
- **Config entry:** `src/lib/eth/config.ts:HELLO_POLYGON` (currently `null`)

**Seven specific review questions** (A–G):
- A. ERC-20 baseline correctness on OZ v5
- B. Reentrancy posture on `claim()`
- C. Cooldown check (the `last == 0 || timestamp - last >= 24h` short-circuit)
- D. Faucet-dry handling (`balanceOf(address(this)) >= CLAIM_AMOUNT`)
- E. The contract holding its own supply (`_mint(address(this), 10B)`)
- F. No-admin / no-upgrade posture for a faucet specifically
- G. The `claim()` selector `0x4e71d92d` correctness for `/hello`'s raw `eth_sendTransaction` path

**Deliverable:** `docs/codex-logs/2026-05-08-hello-polygon-review.md`, mirroring the structure of the wire-attestations review.

**Commit convention:** `review(codex): HelloPolygon contract — verdict <overall>`. Don't push (cc validates).

**Branch:** make a fresh `codex/hello-polygon-review-2026-05-08` from `origin/feat/mist-room-cc-2026-05-08`. Same pattern as the wire-attestations review worktree.

**Important:** the MCP transport timed out twice during the wire-attestations review even though Codex completed the work and wrote the file. If running via MCP, set `model_reasoning_effort: "low"`, inline the contract source in the prompt, and check the worktree after a timeout — work may have landed despite the error.

## What's gated on Mike (not your lane, but worth knowing)

| Action | Where | After |
|---|---|---|
| Apply Codex's char-set fix to `wire_attestations.sol` | feat branch | Codex review (done) |
| Originate Wire Attestations on Base mainnet | Foundry | char-set fix applied |
| Originate HelloPolygon on Polygon mainnet | Foundry | Codex review #2 |
| Mint MIST on Zora (zora.co) | Zora UI | MetaMask unblocked |
| Paste contract addresses into `src/lib/eth/config.ts` | feat branch | each origination |
| Run `wrangler pages deploy` after each merge | CLI | merge to main |

**MetaMask is currently blocked** on Mike's end — Temple Wallet's EVM-injection is hijacking `window.ethereum`. Fix is in chrome://extensions: disable Temple or toggle off its "default Ethereum wallet" setting. Mike's working through that separately; not your concern.

## What's gated on Manus

When `/mist` and `/hello` are live on a Cloudflare Pages preview URL (after Mike runs `wrangler pages deploy`), Manus QA brief is at:

- [`docs/briefs/2026-05-07-manus-mist-qa.md`](../briefs/2026-05-07-manus-mist-qa.md)

Output lands at `docs/manus-logs/2026-05-08-mist-qa.md`. Five acceptance areas, five screenshot checkpoints. Real-browser QA on the SIWE flow, MetaMask + CSW sign-in, mobile Safari edge case.

A second brief for /hello QA isn't written yet — worth adding when HelloPolygon is deployed and `HELLO_POLYGON` is set. Until then, /hello renders the polite "deployment pending" placeholder so there's nothing to QA.

## Atomic ship pattern (FYI — this is how cc has been shipping)

Parallel agents in `~/pointcast/` aggressively `git checkout` other branches in the shared working tree. Uncommitted files vanish. Solution that's been working:

1. Write all changed files to `/tmp/pc-<task>-*` first
2. `git reset --hard origin/<branch>` in the working tree
3. `cp /tmp/* <pointcast paths>`
4. Verify branch with `git branch --show-current`
5. Stage explicit paths
6. Verify staged file count matches expected
7. Commit + push in one shell command
8. Verify `git ls-remote origin <branch>` SHA matches local

Memory captured in [`feedback_pointcast_parallel_agents.md`](file:///Users/michaelhoydich/.claude/projects/-Users-michaelhoydich/memory/feedback_pointcast_parallel_agents.md) (cc-local). The `/private/tmp/pointcast-codex-wire-review-*` worktree from the first review still exists if useful as a template.

## Suggested Codex starting prompt

If Mike points you at this doc and you want a one-line kickoff: read `docs/briefs/2026-05-08-codex-hello-polygon.md` and run the review for `contracts/polygon/hello_polygon.sol`. Output to `docs/codex-logs/2026-05-08-hello-polygon-review.md`. Same structure as `docs/codex-logs/2026-05-08-wire-attestations-review.md`. Commit but don't push.

— cc, 2026-05-08
