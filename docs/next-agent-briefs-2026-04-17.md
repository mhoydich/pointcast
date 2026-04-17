# Next agent briefs — post-mainnet (2026-04-17 late PT)

Now that Visit Nouns FA2 is live on mainnet (`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`) and the faucet pipeline has 10 minted starter Nouns, the next two cycles for Codex and Manus.

**Priority axis:** each brief picks one discrete, well-scoped task that doesn't overlap with the other agent and doesn't wait on an MH decision. Shippable in one session. Short prompts on purpose — the earlier multi-step Codex prompts hung silently at 3h each under xhigh reasoning; these are tuned to one atomic concern per brief.

---

## Codex — Battler Phase 2 (match log → BTL NOTE blocks)

**Why this one:** Phase 1 landed + the Phase 1 review is closed. Phase 2 is the obvious next step and the design doc already spec'd it (`docs/codex-logs/2026-04-17-nouns-battler-design.md`). Self-contained — no waiting on Mike, no waiting on mainnet. Single-feature scope. Ships a new agent-legible endpoint (`/battle.json`, `/c/battler.json` match feed).

**Estimated:** 1-2 hours single pass.

**Prompt to run:**

```
Build Nouns Battler Phase 2: match persistence + agent feed.

READ FIRST: docs/codex-logs/2026-04-17-nouns-battler-design.md (Phase 2 section)
and src/pages/battle.astro, src/lib/battler/*.ts. Phase 1 is already shipped.

BUILD:
1. localStorage match log in src/pages/battle.astro. After every completed
   best-of-3 match, append to localStorage key `pc:battler-matches` an
   array entry:
     { matchId, cardOfDayId, challengerId, rounds: [stanceA, stanceB, damageA, damageB],
       winner: 'A' | 'B', timestamp }
   Cap the log at the most recent 50 matches (trim oldest on overflow).
   No server calls.

2. After a match completes + logs, show a small "record this match" button
   that exports the match as a downloadable JSON file the user can share.

3. /battle.json endpoint — new file src/pages/battle.json.ts. Returns a
   static JSON dump of: { cardOfTheDay: { id, seedTraits }, phase, stanceRules,
   typeMatchups, entrypoints: ['/battle', '/c/battler', '/c/battler.json'] }.
   No match data on the server — the server has none. This endpoint is for
   agents scraping the rules, not the matches.

4. Do NOT touch the existing battle page JS for stance resolution — only
   add the log + download. The resolver stays deterministic and pure.

CONSTRAINTS:
- No new npm deps.
- Run `npm run build` when done, verify zero errors + page count ≥ 101.
- Wrap in `timeout 600 codex exec` if shelling this yourself.
- If you hit anything ambiguous, leave a question in the commit message —
  do not loop on it.

DONE WHEN: commit lands + page count + brief summary of files touched.
```

**Guardrails:**
- This is a ~150-LOC task. If Codex runs >45 min, something is wrong — kill it.
- Phase 3 (commemorative mint on Visit Nouns FA2) stays deferred until we have admin control post-transfer.

---

## Manus — End-to-end mint QA + objkt listing curation

**Why this one:** the mainnet contract + the 10 minted tokens exist but no one has exercised the actual "user mints" or "user buys on objkt" flows. Manus is the right agent for this — it drives a real browser with a real wallet, captures screenshots. Pairs perfectly with the WalletChip that just shipped to the home masthead.

**Estimated:** 30-45 min QA pass + 20-min objkt curation.

**Prompt to run:**

```
PointCast v2 mainnet QA — wallet connect + mint flow end-to-end.

CONTEXT:
- Visit Nouns FA2 is live at KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh (mainnet).
- 10 tokens minted (ids 137, 205, 420, 417, 1, 42, 99, 777, 808, 1111).
- A "connect wallet" pill lives in the home masthead on pointcast.xyz.
- Block 0210 ("Today's Noun — Faucet") is a MINT button wired to the real
  mainnet KT1. As of 2026-04-17 the contract is still admin-only (throwaway
  signer is admin) so non-admin wallets should see a mint fail gracefully.
- Blocks 0230–0239 are LINK blocks pointing at objkt token pages.

QA TASKS (screenshot each step, log to docs/manus-logs/2026-04-17-mainnet.md):

1. Load pointcast.xyz on desktop Chrome + iPhone Safari. Verify the masthead
   shows "connect wallet →" in the top-right.
2. Click the chip → Beacon picker opens. Confirm it lists at least Kukai
   + Temple + Umami options. Tap Kukai.
3. In Kukai's popup, choose Google sign-in, complete OAuth. Confirm the
   chip now shows "tz1abcd…wxyz · kukai" with a green dot.
4. Navigate to /b/0210. Tap the "Mint → Free" button. Expect the transaction
   to fail with a readable error (contract is admin-only). Screenshot the
   error text.
5. Open /b/0230 through /b/0239 on mobile. Verify each:
   - shows the correct Noun via noun.pics (not broken image)
   - has a "→ View on objkt" CTA strip
   - CTA opens in a new tab to the right objkt URL
6. Disconnect via the chip. Confirm state persists across refresh.
7. Open /battle on mobile. Run one best-of-3 match against Noun #137
   (default Card of the Day). Screenshot the match log + winner.
8. /drum mobile: verify the drum pads tap, counters update, no CSS breakage
   in the wallet dropdown (that was recently fixed — confirm).

objkt CURATION (after QA signs off):

9. Log into objkt as mhoydich. Confirm the KT1LP1oT… collection is auto-
   indexed — it's an FA2, so objkt picks it up passively. Set a collection
   name "PointCast · Visit Nouns", description matching /for-agents, and
   a collection banner image (use public/images/og/og-home-v2.png).
10. DO NOT list any tokens for sale yet — wait on MH nod. Just confirm
    the collection is discoverable and each token page shows the Noun
    + "owned by tz1PS4W…" correctly.

CONSTRAINTS:
- Do not sign any transaction on behalf of Mike. QA is read-only except
  for the one failing mint attempt in step 4 (which should cost 0 because
  Kukai will reject at simulation).
- Do not delete, modify, or share any file/setting.
- Screenshots in the log referenced by relative path.

DONE WHEN: the log lands with all 10 steps screenshot'd + the objkt
collection page URL + a summary of findings (worked/broken/weird).
```

**Guardrails:**
- If Kukai's Google OAuth takes >3 min, something's wrong — stop the session.
- If step 4 (mint attempt) doesn't fail quickly, stop and flag — something's off with admin-only enforcement.

---

## What's NOT on the list (intentionally)

- **Paid mints / Phase 4** — blocked until the admin transfer lands and Mike decides whether Good Feels drops go on this FA2 or a separate collection.
- **Daily faucet rate-limit contract** — needs MH decision on faucet noun selection mechanic first.
- **DRUM token contract** — Phase C is still ahead; ships after /drum v2 aesthetic rewrite.
- **Presence DO companion Worker** — nice-to-have, not blocking.
- **/about copy** — MH writes.

## Next-next-round candidates (after the two above land)

1. Codex: Battler Phase 3 (commemorative mint via Visit Nouns FA2 — requires post-admin-transfer).
2. Codex: `/drum` v2 CSS rewrite — swap internal Tailwind warm classes for --pc-* tokens, then cut layout over to BlockLayout.
3. Manus: objkt listing automation — list each of the 10 Nouns for sale at a thoughtful tez price once MH decides.
4. Manus: Plausible or Fathom analytics setup (no Google).
5. Codex: stripped-HTML mode for known agent user-agents (BLOCKS.md Phase 2 item).

---

*Brief format matches the tight-prompt remediation from `docs/codex-troubleshooting-2026-04-17.md`: one task, clear done-when, explicit guardrails, estimated bound.*
