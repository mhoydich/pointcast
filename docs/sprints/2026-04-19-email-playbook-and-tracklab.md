---
sprintId: email-playbook-and-tracklab
firedAt: 2026-04-19T18:00:00-08:00
trigger: chat
durationMin: 20
shippedAs: deploy:e1037071
status: complete
---

# chat tick — email setup playbook + Codex project #4 (TrackLab)

## What shipped

Two asks, two artifacts.

### 1. `docs/setup/email-pointcast.md` — email setup playbook (Mike executes)

cc can't create DNS records, mailboxes, or Cloudflare secrets. Those require account-level auth. What cc CAN do: write the exact clicks + commands Mike runs in the dashboard. Playbook covers:

- **Step 1**: Cloudflare Email Routing (free, 5-minute setup) — enables `hello@`, `mike@`, `claude@` + optional catch-all, all forwarding to `mhoydich@gmail.com`.
- **Step 2**: Outbound provider — comparison table of Resend / Postmark / Mailgun / SendGrid / AWS SES, recommends Resend. Full Resend setup including DNS (MX + SPF + DKIM), API key, Pages secret binding.
- **Step 3**: cc wires the `functions/api/send-note.ts` outbound endpoint once `RESEND_API_KEY` is bound (stub shape documented, not yet written).
- **Step 4**: End-to-end verification commands (inbound curl test, outbound curl test).

Key honest section at the bottom: **"What cc can do before email infrastructure exists"** (write retros, write the stub function, add `mailto:` links) vs **"What cc cannot do"** (DNS, addresses, Gmail verification link-click, secret binding). No pretending cc can execute this.

### 2. Codex project #4 — TrackLab (`docs/briefs/2026-04-19-codex-track-authoring.md`)

Brief is ~1,600 words. The tool: paste a YouTube URL at `/tracklab`, auto-generate a `media.beats` array via in-browser onset detection, Mike names + colors each beat, exports JSON OR auto-creates a new block via GitHub API.

Why this is the right #4:

- **First content-generation primitive** for Codex. Projects #1-#3 are interaction primitives (game, channel-flip, multiplayer rhythm). TrackLab creates new data.
- **Scales YeePlayer v1.** Codex's multiplayer rhythm mode is more interesting at 20 tracks than 4. TrackLab produces the 20.
- **Unblocks a cc pain point.** Hand-authoring beats for each new track is editorial time that doesn't scale. TrackLab flips it.

Five architecture questions (A1-A5) for Codex:
- A1: onset-detection library (recommend Meyda — acceptable accuracy, Mike edits anyway)
- A2: YouTube audio extraction (recommend in-browser Web Audio via IFrame Player — TOS-compliant)
- A3: file-size / bandwidth math
- A4: Mike-only gate (recommend Beacon wallet check — graceful degradation for visitors)
- A5: write path for save-as-block (recommend GitHub API with scoped PAT)

Budget: ~4-8 hours. Biggest of the four projects because it combines audio DSP + UI + auth + write-path.

### 3. Block 0286 — announces #4

`mh+cc` author, sources Mike's verbatim framing from the tier screenshot + "feels like opportunity for more projects". Mood `sprint-pulse`. Companions: 0285 (YeePlayer v1), 0284 (STATIONS), 0283 (Pulse), 0263 (November Rain — a hand-authored track TrackLab obviates).

## Why this shape for the response

Mike's two asks required different responses:

- **Email**: honest operational-scope work. Ship a playbook; don't pretend cc can do dashboard ops. Most value added is clarifying exactly which clicks Mike owns vs which code cc ships after the infra lands.
- **Codex capacity**: substantive. Confirmed ChatGPT Pro + Max Codex = real parallelism-ready. Four projects now queued; this is the limit cc will file without explicit Mike direction to add more. If Codex stalls, next step is tier/credit diagnosis, not more briefs.

## Observations on the Codex queue

Four briefs in a single 45-minute window (17:20 Pulse, 17:45 STATIONS, 17:55 YeePlayer v1, 18:05 TrackLab). All four:

- Have public announcement blocks (0283, 0284, 0285, 0286).
- Cross-link via companions (each block lists the other three).
- Carry `mood: sprint-pulse` — filterable at `/mood/sprint-pulse` for the full Codex arc.
- Source Mike's verbatim directive in the `source` field per VOICE.md.
- Are scoped with architecture questions Codex answers + deliverables Codex ships.

The pattern itself is reusable: cc drafts briefs at this density whenever Mike signals capacity. If Codex ships 2/4 well, we learn the ideal batch is ~2; if 4/4, batch up as Mike signals.

## What didn't

- **Stub `functions/api/send-note.ts`**. Could have shipped the outbound email code (reading `RESEND_API_KEY`, posting to Resend API) as a stub that returns 503 until the secret binds. Decided against — better to write it AFTER Mike commits to Resend specifically, so the shape matches the actual provider contract rather than speculation.
- **Mailto links on /about and /for-agents**. Small but would be concrete progress visible once routing lands. Deferred to a sweep tick after Step 1 of the email playbook is confirmed working.
- **A fifth Codex project**. Tempting — /drum review, accessibility audit, events aggregation. Held off. Four is the ceiling for a single cc session; more would start to feel scattershot.

## Notes

- Build: 203 → 204 pages (+1: /b/0286).
- Deploy: `https://e1037071.pointcast.pages.dev/b/0286`
- Chat-fired tick.
- Cumulative today: 24 shipped (15 cron + 9 chat).
- Codex queue now: Pulse, STATIONS, YeePlayer v1, TrackLab. Four projects, independently scoped, total budget ~12-22 hours if Codex ships all four.

— cc, 17:49 PT
