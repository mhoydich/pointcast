# Codex brief — The HELLO faucet (poster plate + code review)

**Date filed:** 2026-09-04 PT
**Filed by:** Claude Code (cc) on behalf of Mike
**Type:** image-gen (one plate) + review (wallet-adjacent code)
**Mike's asks (verbatim):** *"ok lets try to make a faucet for today"* · *"for the signing, can we have a better interface, its not clear what's happening on those better call saul like pages"* · *"something like what we did with the pups, have it about onboarding, the ability to claim without a wallet, to eventually onboarding wallet"* · *"use codex, and lets use the image generator as well, directionally positive hockney warhol hello, ok with some degas and a monochrome filter"* · *"use the codex image generator not that image"*
**Branch / PR:** `claude/custom-bitcoin-fork-32zal2`
**Page:** `/faucet/hello` · data at `/faucet/hello.json` · live desk at `/api/faucet/hello`

## tl;dr

Two jobs, in this order.

1. **Two poster plates for HELLO, through ChatGPT's image model.** Mike's later note: *"use chatgpt image generator"*, and *"lets make one with a fish in it, and a clean one."* Replace the placeholders at `public/images/faucet/hello-poster.png` (clean) and `hello-poster-fish.png` (one fish in the quiet right third), each with a `.webp` twin and a 1200×630 OG crop (`hello-og.png`, `hello-og-fish.png`). Direction from Mike: positive, Hockney-and-Warhol HELLO, a little Degas, finished monochrome. cc's attempt through Krea's gpt-image-2 ran out of balance mid-run; if two HELLO plates appear in Mike's Krea history from 2026-09-04, they are those runs and can be used if they pass review.
2. **Review the faucet code** before Mike funds the spigot wallet. It is a hot wallet that sends a real ERC-20 on Ethereum mainnet from a Cloudflare Pages Function. Nothing ships to mainnet until you have read it.

## Job 1 — the plate

- **Engine:** poster-image-engine, `gpt-image-1` or newest available (ChatGPT's image model, Mike's pick; Krea and Higgsfield are out of scope for now)
- **Size:** 1024 × 1280 PNG (4:5), sRGB; also export `.webp` (q82) and a 1200 × 630 crop for `hello-og.png`
- **Project dir:** `poster-image-engine/projects/faucet-hello-2026/`
- **Public paths:** `public/images/faucet/hello-poster.png`, `hello-poster.webp`, `hello-og.png` (overwrite the placeholders; the page already points at them)
- **Log:** `docs/codex-logs/2026-09-04-faucet-hello-plate.md` (engine, regenerations, cost, verified)

**Prompt (compose, tune only if the engine drifts):**

> An original pop-art poster celebrating the single word HELLO. Large hand-cut screen-print letterforms across the top two-thirds, repeated in a four-panel grid with slight registration drift, the way a silkscreen run misregisters. Flat California pool-and-stucco light: hard-edged shadows, one palm-frond shadow crossing a sunlit wall, a swimming-pool plane. Along the lower edge, soft chalk-and-pastel figures in loose rehearsal motion, drawn with visible strokes, faces undetailed, glimpsed from the wings. El Segundo, late afternoon. Warm, positive, welcoming. Finished as a monochrome print: one deep ink blue on cream paper, halftone visible, no other hue. Asymmetrical composition: letters weighted left, quiet negative space right.

**Anti-prompt:** no words other than HELLO; no logos, monograms, brand marks, watermark, signature, frame border; no humans with detailed faces or hands; no neon, no glossy 3D render, no AI sparkle. Describe the look by materials and light, never by artist name in the final prompt if the engine rejects names.

**Verification:** open the plate; reject rendered text other than HELLO, extra limbs, dead-center framing, or any second color surviving the monochrome pass. The page's `alt` text describes the intended plate; update it in `src/pages/faucet/hello.astro` if the final differs.

## Job 2 — the review

### Files

| File | What it is |
|---|---|
| `src/lib/faucet.ts` | Registry (HELLO only), address/hash regexes, LA-day helper, desk copy |
| `migrations/auth/0009_faucet_claims.sql` | `faucet_claims` ledger: one row per account per faucet per LA day; `held` → `submitting` → `delivered` |
| `functions/api/faucet/_claims.ts` | Ledger reads/writes + the viem spigot (`createViemFaucetChain`) + `deliverHeldFaucetDrips` |
| `functions/api/faucet/[slug]/index.ts` | GET desk state (public counts, spigot balances cached 60 s in KV, `you` ledger with a session) |
| `functions/api/faucet/[slug]/claim.ts` | POST, session required, ledger write only |
| `functions/api/faucet/[slug]/deliver.ts` | POST `{address}`, session required, one ERC-20 `transfer` for all held drips |
| `src/components/FaucetDesk.astro` | The desk: sign in → claim → paste address → send. No user signatures anywhere. |
| `src/pages/faucet/hello.astro`, `hello.json.ts` | The page and its JSON twin |
| `tests/faucet-claim.test.mjs` | Runs the real migration in `node:sqlite` behind a D1 shim; covers cap, double-claim, delivery, every failure path returning rows to `held` |

### Design you are checking

- **Claim is a ledger write, never a chain call.** HELLO already exists at `0x1fda…012f`; the drip is an IOU until delivery. This is what lets the page be live today before the spigot is funded.
- **Delivery is the only chain action.** Spigot wallet = `HELLO_FAUCET_SECRET_KEY` (a fresh key, never the 2019 deployer). It signs `transfer(to, sum(held) × 10^decimals)` and pays gas. The account pastes an address and signs nothing.
- **Double-pay guard is the row status.** `held → submitting` via `UPDATE … RETURNING` before the send; on any failure the rows return to `held`; rows stuck in `submitting` for 5 min are reclaimed. A KV key is a courtesy lock across concurrent invocations (KV is eventually consistent, so the row status is the real guard).
- **Nonce.** One hot wallet, concurrent Pages invocations. viem fills the nonce from `pending` at send time. The KV lock narrows the race; it does not eliminate it. Question for you: is that acceptable at a 50-drip/day cap, or should delivery go through a queue (`PC_QUEUE_KV` + cron) before the first funding?
- **Broadcast, not confirmation.** `delivered` means broadcast with a tx hash; the page links Etherscan. A dropped tx would show as delivered with no receipt on chain. Acceptable for a valueless token, but say so if you disagree.

### Things to look hard at

1. `deliverHeldFaucetDrips` ordering: reclaim stale → take rows → lock → snapshot → balance check → send → mark. Any path that leaves rows in `submitting`?
2. `spigotSecretKey` shape check (`0x` + 64 hex). **Mike has decided the spigot is the 2019 deployer itself** (the tokens are valueless, he accepts the blast radius; see the Mike brief). So do *not* add a deployer tripwire. Instead confirm that the daily cap and per-user rate limits are the only things bounding outflow, and say whether that is enough or a hard per-day send ceiling in code is warranted.
3. Rate limits: claim 6/h/user, 20/10 min/IP; deliver 5/10 min/user. Enough?
4. `getPublicFaucetClaims` joins `users` for first names. Same exposure as Kennel Club's ticker. Fine?
5. The GET desk returns `you` for any session; no CSRF concern on GET, and POSTs rely on the session cookie exactly as Kennel Club does. Confirm nothing new here.
6. `FaucetDesk.astro` pre-fills the address from a `metamask` identity if one exists. SIWE is still `501` in `functions/api/auth/ethereum.ts`, so that path is dormant. OK to leave?

### Not in scope

Contract changes (none), Tezos, the older `/faucet` Visit Nouns reading (untouched except a one-line cross-link), front-page order beyond the one new room cell.

## Done looks like

- Plate landed, page alt text matches, log written.
- Review comments on the PR, or a note in `docs/codex-logs/2026-09-04-faucet-hello-review.md`, with a clear go / no-go on funding the spigot.
