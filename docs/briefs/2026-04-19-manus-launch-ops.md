# Manus brief — launch operations queue

**Audience:** Manus. Four ops tasks lined up for Phase 3 of the release sprint (see `docs/plans/2026-04-20-release-sprint.md`). Each is dashboard-level work cc cannot execute.

---

## M-1 — Complete the platform matrix (brief from 04-19 AM)

**Status:** in-flight; deliverable at `docs/manus/2026-04-19-broadcast-platforms.md` not yet landed.

**Re-scope if needed:** if the full matrix is heavy, deliver a minimal-viable version covering Apple TV / Chromecast / AirPlay / Samsung Tizen first. Fire TV / LG webOS / game consoles can follow.

**Due:** Tuesday 2026-04-21 EOD.

---

## M-2 — Cloudflare Email Routing setup

**Execute:** `docs/setup/email-pointcast.md` Step 1. Steps verbatim:

1. Open https://dash.cloudflare.com → pointcast.xyz → Email → Email Routing
2. Enable Email Routing. Accept the auto-added MX + TXT + SPF records when prompted.
3. Create routes:
   - `hello@pointcast.xyz` → `mhoydich@gmail.com`
   - `mike@pointcast.xyz` → `mhoydich@gmail.com`
   - `claude@pointcast.xyz` → `mhoydich@gmail.com`
   - Optional catch-all: `*@pointcast.xyz` → `mhoydich@gmail.com`
4. Verify Gmail destination (first time only — click the link in the verification email sent to `mhoydich@gmail.com`).
5. Test: from another email account, send to `hello@pointcast.xyz` with subject `inbound test 1`. Confirm delivery within 60s.

**Deliverable:** `docs/manus/2026-04-20-email-routing-complete.md` with timestamps + screenshots + test-confirmation.

**Due:** Monday 2026-04-20 EOD.

---

## M-3 — Resend account + outbound DNS

**Execute:** `docs/setup/email-pointcast.md` Step 2. Steps verbatim:

1. Create Resend account at https://resend.com using `mhoydich@gmail.com`.
2. Resend → Domains → Add → `pointcast.xyz`. Resend returns 3 DNS records (1 MX, 1 TXT SPF, 1 TXT DKIM).
3. Add these to Cloudflare DNS at https://dash.cloudflare.com → pointcast.xyz → DNS. Wait for verification (<5 min typical).
4. Resend → API Keys → Create → scope: "Sending access". Copy the key.
5. Cloudflare → pointcast (Pages project) → Settings → Environment variables → Add:
   - Name: `RESEND_API_KEY`
   - Value: (the Resend key)
   - Environment: Production
   - Encrypt: ✓
   - Save.

**Deliverable:** `docs/manus/2026-04-20-resend-setup-complete.md` confirming API key is bound + noting the sending-domain verification status.

**Due:** Tuesday 2026-04-21 EOD.

---

## M-4 — Launch-day ops checklist

**Before public launch (target Friday 2026-04-24), verify:**

1. **Google Search Console** property ownership for `pointcast.xyz` verified. Submit sitemap (`https://pointcast.xyz/sitemap-index.xml`). Confirm at least one page indexed.
2. **Bing Webmaster Tools** property ownership verified. Submit sitemap. Confirm indexing.
3. **IndexNow** — POST current URL list via `https://pointcast.xyz/api/indexnow` (endpoint exists). Confirm accept response.
4. **Farcaster Frame unfurl** — cast these URLs in a test space on Warpcast and verify frame renders with correct buttons:
   - `https://pointcast.xyz/`
   - `https://pointcast.xyz/b/0320` (today's cc editorial)
   - `https://pointcast.xyz/drum`
   - `https://pointcast.xyz/battle`
5. **Twitter card unfurl** — paste each of the same 4 URLs in a draft tweet on x.com, confirm the card previews with the og image.
6. **iMessage LinkPresentation** — text each URL to yourself; confirm the preview renders with the og image (Apple's LinkPresentation cache is aggressive; bump the `og-home-v3.png` suffix if caching is stuck on an old image).
7. **Analytics** — if Plausible / Fathom / etc is wired, confirm collection. If not yet wired, flag for cc to ship a minimal tick (recommend: Cloudflare Web Analytics, free, one-line addition).

**Deliverable:** `docs/manus/2026-04-23-launch-ops-checklist.md` with status per line-item + screenshots where useful.

**Due:** Thursday 2026-04-23 EOD.

---

## Working style

- Author blocks you post as `manus` with a `source` citing the manus doc path (per VOICE.md).
- Report blockers in chat; don't sit silently.
- If you hit a permission issue (e.g. GSC ownership verification needs DNS record Mike must approve), flag in the deliverable + ping.
- Don't install new tools or services without Mike's explicit approval — dashboard work only, within existing accounts where possible.

— cc, filed 2026-04-19 21:00 PT, sprint `release-sprint-plan`
