# Manus Research Index — April 17, 2026

Manus research tasks kicked off during this session. Each delivered to Mike's
Manus account at https://manus.im/app — full docs downloadable from the
respective task view.

## Completed

### 1. Farcaster Frame spec for /drum
**Task title:** "Building a Farcaster Frame for M..." · completed ~01:05 AM

**Key finding:** Frames v2 was officially renamed **"Mini Apps"** in March 2025.
For pointcast.xyz/drum, the right target is the **legacy Frames v1** spec
(using `fc:frame` Open Graph-style meta tags). Mini Apps are heavier
(full browser-based modal w/ React/web), not needed for a static drum image
+ tap counter.

**Deliverable:** PDF `Farcaster_Frame_Implementation...` (199.91 KB) with
full spec, TypeScript code for Cloudflare Pages Functions, and
Warpcast validation URL.

**Next step:** Implement `/api/frame/drum` (POST handler for button taps)
and `/api/frame/drum-image` (SVG → PNG responder) per the PDF, plus add
Frame meta tags to `src/pages/drum.astro`.

---

### 2. Zora 1155 poster on Base
**Task title:** "Production-Ready Spec for Mintin..." · completed ~01:10 AM

**CRITICAL INSIGHT:** In February 2025, Zora pivoted from ERC-1155 NFTs to
"Zora Coins" (ERC-20 tokens). **The no-code "Zora Create" UI on zora.co has
officially deprecated the ability to mint or edit ERC-1155 NFTs.**

HOWEVER, the Zora Protocol v3 (1155) smart contracts remain fully functional.
The Zora Protocol SDK (`@zoralabs/protocol-sdk`) continues to receive updates
(currently **v0.13.5**), allowing developers to programmatically deploy and
manage ERC-1155 contracts directly.

**Implication for PointCast:** We can't use the zora.co web UI to "click-drop"
a poster. If we want a Zora poster, we have to integrate `@zoralabs/protocol-sdk`
into a small deploy script that creates the collection + tokens programmatically.
This is more work but gives us full control.

**Alternative recommendation:** Since the Zora collector community shifted
toward Zora Coins, consider:
- (a) Creating a Zora Coin (ERC-20) instead of an 1155 poster — more aligned
  with where the community is now.
- (b) Skipping Zora entirely and linking to a Tezos token — lower-friction
  for the PointCast audience, who are already on Tezos.

**Next step:** Decide poster vs coin vs skip before committing engineering time.

---

### 3. Web Push notifications on Cloudflare Pages Functions
**Task title:** "Web Push Notifications Sp..." · completed ~01:12 AM

**Key finding (summary):** Classic `web-push` npm library does NOT work on
Cloudflare Workers runtime (depends on Node crypto). The working path uses
raw WebCrypto + aes128gcm. Manus's recommended library + minimal TypeScript
example are in the task view.

iOS Safari 16.4+ supports web push but requires PWA install.

**Next step:** Pull the minimal TypeScript example from the Manus task view,
wire up `/api/push-subscribe` and `/api/push-send`. Mike generates a VAPID
keypair once + sets `VAPID_PRIVATE_KEY` secret in Cloudflare.

---

## In progress

### 4. Jackpot UX catalog
**Task title:** "Designing a Jackpot Interstitial Sy..." · running

**Ask:** Catalog of 8-10 jackpot types + shared infrastructure + animation
specs + prior art references (Ms. Pac-Man intermissions, MTV IDs, etc.).
First-to-ship recommendation.

---

### 5. SmartPy FA2 contract rewrite
**Task title:** "Tezos FA2 SmartPy Contract Rew..." · running

**Context:** `contracts/visit_nouns_fa2.py` was written against SmartPy ~0.16
fa2_lib API. Current SmartPy (April 2026) on smartpy.io IDE rejects it with:

    ParseError: SyntaxError: Unexpected keyword argument: metadata=contract_metadata

**Ask:** Produce a complete rewritten `visit_nouns_fa2.py` against current
SmartPy + include init storage JSON for `/admin/deploy`.

**Blocker:** This must complete before we can originate the Visit Nouns
FA2 contract on Tezos mainnet (i.e. before minting goes live).

---

## Mike's action items (when back)

- [ ] **Generate Manus API key** at https://manus.im/app?show_settings=integrations&app_name=api
       — then share with me so I can queue research tasks programmatically
       instead of clicking through the desktop app.
- [ ] **Read the Zora recommendation** (insight #2 above) and decide poster
       vs. coin vs. skip Zora.
- [ ] Once SmartPy rewrite task lands, paste the rewritten contract into
       smartpy.io IDE and hit Run to get the compiled Michelson.
- [ ] Generate a VAPID keypair for Web Push (one openssl command; in the
       Manus Web Push doc).
- [ ] **Set Cloudflare secrets:** `ADMIN_TOKEN` (so you can view feedback
       at /admin/feedback), `RESEND_API_KEY` (so feedback emails you),
       `VAPID_PRIVATE_KEY` (Web Push).
- [ ] Fund wallet + deploy contracts via `/admin/deploy`.

---

## Update — 2026-04-17 ~03:30 PT

All 4 follow-up Manus tasks delivered + pulled into the repo:

- **Violent Crimes module** · task `anXeX3vAEvdnSbvw9Wuyyi` · 92 credits — `.astro` (741 lines) saved to `src/components/ViolentCrimesBlock.astro`, score hand-written to match import contract, **live on pointcast.xyz**.
- **Marketplace.py rewrite** · task `d42c76c4rLsRVcfU677J6D` · 355 credits — saved to `contracts/v2/marketplace.py` + `DEPLOY_NOTES_MARKETPLACE.md`. **Compile-verified in smartpy.io IDE**.
- **drum_token.py rewrite** · task `ghYRfTTQ7wtKk3hzs77wF2` · 230 credits — saved to `contracts/v2/drum_token.py` + `DEPLOY_NOTES_DRUM.md` (365 lines incl. voucher-signing Node.js example). **Compile-verified in smartpy.io IDE**.
- **11SIX24 affiliate** · task `GbyMhVvuWwnEsXg6Dvbkkf` · 30 credits — YES program exists. Saved to `docs/11six24-affiliate.md`.

### All task IDs for API retrieval

```
Farcaster Frame spec        a7xZUkVslb0asRm8uj5wqL
Zora 1155 / Coins           6FZ9te0ZngFPW0II1NQMlx
Web Push on CF Pages        fF0i6Mct8ZvL37t0ygD4Ws
Jackpot UX catalog          OwKTwddYCQUvAUagRWlJ91
FA2 contract rewrite        RcuqaEXVDooAugcdw0YW9N
Marketplace rewrite         d42c76c4rLsRVcfU677J6D
drum_token rewrite          ghYRfTTQ7wtKk3hzs77wF2
Violent Crimes module       anXeX3vAEvdnSbvw9Wuyyi
11SIX24 affiliate           GbyMhVvuWwnEsXg6Dvbkkf
```

Pull any via `node scripts/manus.mjs list` → task URLs are `https://manus.im/app/<task_id>`.

### Mike's next session (once awake)

- **All 3 contracts ready to originate.** Compile in smartpy.io (paste, Run, download Michelson + init storage) → paste into `/admin/deploy` → Kukai signs.
- **Apply to 11SIX24 ambassador program** at https://11six24.com/pages/ambassador-program.
- **Decide Zora poster** — SDK path only (UI deprecated Feb 2025). Lean skip in favor of Tezos.
