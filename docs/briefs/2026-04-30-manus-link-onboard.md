# Manus brief · Link agent payments — `link-cli onboard` + test-mode loop QA

**To:** Manus (M)
**From:** CC
**Date:** 2026-04-30 morning-into-afternoon PT
**Priority:** Medium — gates the test-mode MVP; no live charges anywhere yet.

---

## Context

Mike kicked off Stripe Link agent payments today. Three artifacts shipped this morning:

- Issue [#262](https://github.com/mhoydich/pointcast/issues/262) — proposal + architectural correction.
- PR [#263](https://github.com/mhoydich/pointcast/pull/263) — first-principles design note + 12-slide deck + Block 0410 (the public framing).
- PR [#270](https://github.com/mhoydich/pointcast/pull/270) — MVP scaffolding (`src/lib/link.ts`, `src/pages/api/link/spend.ts`, schema diff).

`@stripe/link-cli@0.4.1` is verified published. The architecture is **CLI shell-out, hard-defaulted to `--test` mode** for v0. No live charges anywhere until a separate PR after the test loop is proven.

This brief covers the parts of the loop that need a real browser, a real phone, and a logged-in Mike — i.e. you.

Mike's Link account: **mike@getgoodfeels.com** (confirmed during initial setup; visible at app.link.com/settings).

---

## Task 1 · `link-cli onboard` walkthrough (real device, screenshots)

**Goal:** Run the guided Stripe onboarding end-to-end on Mike's machine, capture every step, and produce the `csmrpd_xxx` payment-method-id we need for the env.

**Pre-flight:**
- Mike has Link account + card on file at app.link.com/settings.
- `@stripe/link-cli@0.4.1` is already installed globally on Mike's machine (CC ran `npm install -g @stripe/link-cli` during exploration; verify with `which link-cli`).
- Mike's iPhone is the device that'll receive approval pushes (assume; confirm with him before starting).

**Steps:**

1. Open Terminal on Mike's machine. Run:
   ```bash
   link-cli onboard
   ```
2. The CLI will guide through:
   - **Auth** — `link-cli auth login` style flow. Likely opens a browser to a Link OAuth URL. Mike clicks through. Capture the URL pattern (don't capture the auth code).
   - **Payment method verification** — confirms the existing card on file. Capture the masked card display.
   - **App download QR** — install the **Link** app on Mike's iPhone if not already. Capture the QR's destination URL (just the URL, not the QR image — point is to confirm it's an App Store link).
   - **Demo flows** — runs both `--credential-type card` and `--credential-type shared_payment_token` test flows. Capture each prompt and approval.
3. At the end, `link-cli payment-methods list --format json` should show at least one method. Capture the JSON output. The payment-method-id (prefixed `csmrpd_`) is what we need.
4. Mike's phone should buzz at least twice during the demo flows (one push per demo). Confirm both pushes landed and approval worked from the phone.

**What to write back to me:**
- Full terminal transcript saved to `docs/manus-logs/2026-04-30-link-onboard-terminal.md` (redact the auth code if visible).
- Screenshots of:
  - Browser at the OAuth grant page (if any).
  - Mike's phone showing each approval prompt (one for `card`, one for `shared_payment_token`).
  - Mike's phone showing each approval confirmation.
- The full JSON from `link-cli payment-methods list --format json`. Just paste it into the log.
- The `csmrpd_xxx` id specifically, in a heading at the top of the log so I can grep for it.

---

## Task 2 · Test-mode spend request — real human approval loop

**Goal:** Verify Mike can approve a test-mode spend request end-to-end, before we wire any actual PointCast agents in.

**Steps:**

1. From Mike's terminal, run:
   ```bash
   link-cli spend-request create --test \
     --payment-method-id csmrpd_xxx \
     --credential-type card \
     --amount 100 \
     --currency usd \
     --merchant-name "Replicate (manual test)" \
     --merchant-url "https://replicate.com" \
     --context "Manual Manus QA test of the Link approval loop. This is testmode only — no real charge. Confirming end-to-end the request, push, approval, and credential return work as documented before wiring PointCast agents into src/lib/link.ts." \
     --request-approval \
     --format json
   ```
   (Replace `csmrpd_xxx` with the id from Task 1.)

2. Watch the CLI output. It should:
   - Print a spend-request id.
   - Pause polling for approval.
   - Mike's phone should buzz with an approval prompt within ~5 seconds. The prompt should show "Replicate (manual test)" + the context blurb.
   - Mike approves on his phone. CLI unblocks, prints the credential payload.

3. **Do not use the credential.** Just confirm we got one. Then run:
   ```bash
   link-cli spend-request retrieve <id> --format json
   ```
   to check the final settled state.

**What to write back:**
- Full transcript to `docs/manus-logs/2026-04-30-link-spend-test.md`.
- Screenshot of the phone push notification (cropped so the merchant name + context are legible).
- Screenshot of the phone approval confirmation.
- The final JSON from `retrieve`. We need to see what fields populate post-approval — that's what `src/lib/link.ts`'s `parseSpendRequestOutput` will need to handle.

---

## Task 3 · Capture the field shape so I can refine the schema

**Goal:** I sketched `src/content.config.ts` `spend` field based on the CLI flags. The actual settled response shape needs to be inspected.

After Task 2 completes, paste the **`retrieve <id> --format json` output verbatim** into a new file `docs/manus-logs/2026-04-30-link-settled-shape.md`. I'll use it to refine the zod schema in PR #270 or a follow-up.

Specifically capture:
- All top-level keys.
- The nested shape under `card` (if present).
- The settled-state value (probably `"settled"` or `"approved"` — we want to know which terminates the lifecycle).
- Whether `receipt_url` is populated and what it points to.

---

## Things that should NOT happen in this session

- **No live-mode spend requests.** Every command must include `--test`. If you see live mode entering an interactive prompt, abort.
- **No purchases on Replicate or any other merchant.** The credentials returned in test mode are testmode-only and shouldn't successfully charge anything real, but don't try.
- **No raising the `LINK_CAPS` in `src/lib/link.ts`.** Those are server-side enforcement; v0 caps stay where they are.
- **No flipping `LINK_SPEND_ENDPOINT_ENABLED=true` yet.** That's a separate decision after Codex review on PR #270.

---

## Hand-off

When all three tasks are done, ping me with the path to the three log files. I'll:
1. Refine the zod schema if the settled shape diverges from what I sketched.
2. Open the follow-up PR that wires `LINK_PAYMENT_METHOD_ID` into `wrangler.toml [vars]`.
3. Sketch `LinkConnect.astro` + `AllowanceShelf.astro` against the real shape.

Then we're one PR away from the test-mode Codex Scout → Replicate → receipt Block loop.

— CC, 2026-04-30
