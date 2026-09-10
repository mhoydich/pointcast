# 2026-09-09 — Pool Together: a land-to-park pool, not a fund

**Direction (Mike, 2026-09-09):** "buy land, turn it into a park or public asset, all scoped … has to hit a funding goal in some way … I'm more concerned with getting agents working together to buy real estate, we do need participation … it's almost like join a swarm."

**Decision.** Ship `/pool-together` as a public register and a game with one rule: every lot has one goal and one deadline, and a miss sends every dollar back. Nothing on the surface collects money. Pledges are wallet-signed intents (Kukai via Beacon, MetaMask via EIP-191). Agents contribute work: free parcel memos, memos sealed with one cent through the existing x402 paid-town-action gate, and recruitment via the `via` field. The pool never holds title; a steward (the city, a land trust, a conservancy) is named before any money moves. Lot 000 is the survey of 90245; its goal is 100 pledged wallets and 25 memos with an assessor parcel number and a public source by 2026-12-05.

**Why not the first framing.** "Buy real estate with others and earn yield" is an investment contract (Reg CF / Reg A+ / 506(c), Series LLC, DRE). Land-to-park with no return is a land-trust donation pool; the all-or-nothing refund is the standard crowdfunding shape. Block 0241 and DAO proposal PC-0001 (ESREF) were the prior art on this site.

**Storage.** D1 (`AUTH_DB`), migration `migrations/auth/0019_pool_together.sql`: `pool_together_pledges` (one row per wallet per lot, atomic upsert, newer `issued_at` wins), `pool_together_nonces` (primary-key insert consumes a signed message once), `pool_together_memos` (one row per memo; a sealed memo can never be lost to a list rewrite). A first draft used KV list read-modify-write; Codex's read-only review (`.codex-review/review.md`, not committed) called it a blocker because a paid memo could be dropped after its receipt was issued. Daily caps (20 per client address, 20 per handle) are counted in D1; the KV rate limit in front is best effort.

**Paid action.** `memo` joins `bench`, `cast`, `claim` in `functions/_lib/paid-town-actions.ts`; `functions/api/agent/memo.ts` mirrors `bench.ts` exactly (beginPaidIntent → withX402 → updatePaidIntent → finalizeX402Receipt). Canonical body hashed into the intent: `{ agent, kind, lot, note, apn?, address?, source? }`. `src/lib/x402-buyer.ts` accepts `memo`.

**Deploy order.**

1. Merge.
2. Apply the migration before the Pages deploy:
   `npx wrangler d1 migrations apply pointcast-auth --remote --config wrangler.toml`
3. Fresh worktree at `origin/main` → `npm ci` → `npm run build` → `node scripts/generate-pool-together-social.mjs && cp public/images/og/b/0585.png dist/images/og/b/0585.png` (the full build regenerates block cards from noun + title; the social card is the banner plate) → `npx wrangler pages deploy dist --project-name pointcast --branch main --commit-hash <merge sha>`.
4. Verify: `/pool-together` 200, `/pool-together.json` 200, `/api/pool-together/pledge` returns `dbBound: true`, `/api/pool-together/memo` returns `dbBound: true`, `/b/0585` 200, `/agents.json` lists the `memo` paid action.

**Not done, on purpose.** No capital-taking contract. No steward named. No parcel named. No professional review yet. Season One gate is on the page.

**Art.** Nine gpt-image-2 plates via `codex exec` (three parallel lanes, ~4 minutes), California public parks motif, agents drawn as ranger robots; finals in `public/pool-together/plates/*.webp`, prompts in `~/Documents/Codex/2026-09-09/pool-house/`.
