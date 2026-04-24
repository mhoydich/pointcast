# Manus brief — RFC v0 cross-post (addendum to Vol. II GTM)

**Audience:** Manus. One-task addendum to the Vol. II GTM brief at `docs/briefs/2026-04-21-manus-vol-2-gtm.md`. The Compute Ledger RFC v0 just shipped; the cross-post is a distinct workstream because it targets a different audience (standards bodies + open-source AI working groups) than V-1 through V-5 (social media + newsletter).

**Prereq:** none beyond basic Manus-has-MCP-access. Does not depend on the Resend / Cloudflare email setup in M-2/M-3 (though if a reply email address like `rfc@pointcast.xyz` is live via CF Email Routing, use that; otherwise `hello@pointcast.xyz` works).

**Files to reference:**
- `/rfc/compute-ledger-v0` — the spec (live after next deploy)
- `https://github.com/mhoydich/pointcast/blob/feat/collab-clock/docs/rfc/compute-ledger-v0.md` — GitHub mirror
- `/b/0370` — the cover-letter block
- `/b/0368` — the research pass that named the RFC as the move
- `/compute.json` — the reference-implementation endpoint
- `docs/federation-examples/` — the drop-in starter kit referenced in §12

---

## R-1 — Linux Foundation AAIF working group post

**Target:** The Agentic AI Foundation's public working group list or Discourse (under Linux Foundation). AAIF was formed Dec 2025 with Anthropic + Block + OpenAI; the Model Context Protocol was donated to it. AAIF is the natural home for a federated attribution spec — it's the space where MCP, A2A, and related agent-infrastructure specs live.

**Execute:**

1. Confirm the current AAIF communication channel (mailing list, Discourse, Slack, or GitHub Discussions at `linuxfoundation/aaif` or similar). If the channel has changed since this brief was written, use the current one and note the change in the log.
2. Compose a short post. Target 250–400 words. Subject: **"Compute Ledger v0 — a federated protocol for human + AI work attribution (CC0)"**.
3. Body structure:
   - Paragraph 1: motivate (Gil's "compute is the new currency" thesis → need for site-level attribution receipts complementary to MCP/A2A).
   - Paragraph 2: summarize the shape (JSON doc at `/compute.json`, four signature bands, federation via optional `upstream`, Git commit trailer bridge).
   - Paragraph 3: cite prior art briefly (Co-Authored-By, botcommits.dev, Paris Summit Assisted-by) — positioned as complementary.
   - Paragraph 4: ask for review + call out explicit gaps v0 doesn't close (verifiable-credential proofs, automated spam detection, multi-aggregator first-class support).
4. Links: full spec at pointcast.xyz/rfc/compute-ledger-v0. Reference implementation at github.com/mhoydich/pointcast.
5. Sign-off: Mike's name + contact (`hello@pointcast.xyz`). Do NOT sign as Manus or cc — posts to standards bodies are from the project operator.

**Approval loop:** draft the post → Mike reviews the exact wording in the Manus reply → Mike approves → you post.

**Deliverable:** `docs/manus-logs/2026-04-{XX}-rfc-aaif-post.md` with the target URL, final post text, thread URL, and reply/engagement counts at T+48h.

**Success:** posted + acknowledged. Even one substantive response (critique or interest) is useful signal.

**Due:** within 7 days. Slot flexibly — this is a slow-audience target, not a time-sensitive one.

---

## R-2 — Paris Open Source AI Summit 2026 CfP submission

**Target:** The Paris Open Source AI Summit 2026 is where the `Assisted-by:` / `Generated-by:` commit-trailer conventions originated. A 15-minute lightning talk or a position paper would be the natural format. Confirm current CfP status and deadlines before drafting.

**Execute:**

1. Find the CfP page. If no CfP is open, find the adjacent community venue (Discourse, mailing list, working group) where the commit-trailer discussion lives and post there instead.
2. Frame a 200-word submission: "Compute Ledger v0 extends the Assisted-by: trailer convention with a companion site-level JSON endpoint." The RFC's §7 is the bridge; this talk/paper describes it.
3. Include: title, abstract, speaker bio (Mike), speaker availability, two prior-talks or writing samples (link /manifesto + /b/0368 as writing samples if no talks are listed).
4. Specify the talk would be joint cc + Mike credit, presented by Mike.

**Approval loop:** draft → Mike reviews → Mike submits.

**Deliverable:** `docs/manus-logs/2026-04-{XX}-rfc-paris-cfp.md` with the submission URL + confirmation number + scheduled-response date.

**Success:** submitted. Acceptance is not required for this brief to be considered complete.

**Due:** within 14 days, earlier if the CfP deadline is imminent.

---

## R-3 — Two personal-blog federation pings

**Target:** Two writers / builders whose blogs plausibly care about federated AI attribution. Candidates to research:

- **Simon Willison** (simonwillison.net) — writes extensively about AI tool use + attribution; publishes an eng log.
- **Maggie Appleton** (maggieappleton.com) — writes about AI + cognition + legible tooling; has publicly cared about attribution.
- **Karpathy** (karpathy.ai) — long shot; occasionally engages with protocol-shaped ideas.
- **Adrian Roselli** (adrianroselli.com) — accessibility + pragmatic standards; a friendly critical reader.
- **Gwern** (gwern.net) — long-form analysis; interested in AI measurement.

Pick two based on recent posts that suggest alignment (use the last 30 days of each blog as the signal). Mike has final say on who to reach out to.

**Execute:**

1. For each target: find a recent post (within 90 days) that intersects the attribution / AI-tooling / infra space. Draft a 3-paragraph email to the writer.
2. Paragraph 1: specific reference to their recent post.
3. Paragraph 2: 2-sentence pitch for why Compute Ledger v0 might interest them, link to the RFC + reference impl.
4. Paragraph 3: soft ask — "if this resonates, would you consider hosting a `/compute.json` at your domain? It's ~5 minutes to stand up using the drop-in at `docs/federation-examples/`. If you'd prefer to just leave comments on the spec, that's equally valuable."

**Approval loop:** Manus drafts both emails → Mike reviews + edits tone → Mike sends from his own account (not Manus's; these are personal outreach).

**Deliverable:** `docs/manus-logs/2026-04-{XX}-rfc-blogger-outreach.md` listing targets, draft emails, Mike-edited versions, and reply status at T+7d.

**Success:** emails sent. Any reply (including "not interested") is a useful signal. Two federating peers in the month would fire Vol. III Trigger 2.

**Due:** within 10 days.

---

## Notes + guardrails

- **No spam.** Three targets total in this brief. Don't broaden without Mike's say-so.
- **No signing as cc or Manus.** External-facing posts go out under Mike's name.
- **Record everything.** Every R-N task gets a `docs/manus-logs/2026-04-{XX}-{task}.md` log, even if the action was "deferred" or "skipped."
- **Respect audience.** The LF AAIF audience wants technical + protocol-shaped framing. Personal blogs want personal framing. The Paris Summit wants academic-adjacent framing. Don't cross-wire the registers.

---

— filed by cc, 2026-04-21 14:20 PT. Addendum to `docs/briefs/2026-04-21-manus-vol-2-gtm.md`. Source: Mike chat 2026-04-21 PT "lets go, do" approving the Compute Ledger RFC + its follow-on distribution. Block 0370 (the RFC cover letter) + the RFC itself ship alongside.
