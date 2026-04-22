# Manus · manus-05 · Cultural-angle press pitch

**Priority:** independent. Runs anytime. Longest time-to-reply of the 10, start early.

## The ask

Write a cultural-angle pitch for PointCast — aimed at publications that cover how people are actually using the web in 2026. Identify 5 target publications + one specific writer or editor per. Send the pitches.

## The angle

**Not** the technical angle (that's the HN post + Nostr RFC).

The pitch is: in the middle of the LLM-era feed collapse, a guy in El Segundo is publishing a "living broadcast" as a website — 300+ atomic "Blocks" across 9 channels with hand-made editorial, a proprietary design system, zero algorithm — and he's building the reader with a Claude loop that ships a sprint every 15 minutes. The experiment has a cultural shape, not just a technical one: **what does publishing look like when one person + one AI is the entire newsroom?**

Angles to lead with (pick per publication):

- **Publishing-as-broadcast.** El Segundo as a studio, not a bureau. The "On Air" framing. The editorial consistency (EB Garamond + Gloock + Courier Prime) as a tell that someone is actually making decisions.
- **Agent-pair programming in the wild.** The git commit graph as an artifact. One 8-hour session shipping v0.1 → v0.33. What that implies for one-person publications.
- **Reading as a room.** The Sparrow federation surface — ambient presence, friends' saves as signal, no algorithm — as a deliberate response to the feed.

## Target publications (suggested starting set)

Refine if better-fit outlets emerge during research:

1. **404 Media** — independent journalism, loves technical-cultural intersections. Writer: Jason Koebler or Joseph Cox.
2. **The Verge** — covers web infra + culture. Writer: David Pierce or Sean Hollister for the infra angle.
3. **Dirt / Dirt Media** — writes about digital culture with teeth. Writer: Kyle Chayka if still contributing, else Terry Nguyen.
4. **Garbage Day (Ryan Broderick)** — newsletter with real reach on these themes.
5. **Robin Sloan's newsletter** (unconventional pick) — personal, but if he writes about it, it travels through exactly the network PointCast wants.

## Per-publication shape

```md
## {N}. {Publication} · {Writer name, role}

- **Why them:** one sentence.
- **Pitch angle:** which of the three angles lands best for their beat.
- **Contact:** email first (public press@ or writer's direct), DM backup.
- **Subject line:** ≤ 60 chars, concrete-and-weird not generic ("The guy publishing a live 'broadcast' from El Segundo, with a Claude co-pilot").
- **Pitch body (draft):** 200-280 words MAX. Structure:
  - 1 paragraph: the thing (include ONE concrete detail — specific commit count, specific feature, specific screenshot).
  - 1 paragraph: why now (the feed collapse + agent-coding shift; skip if obvious).
  - 1 paragraph: what Mike can provide (demo, walkthrough, source, time — be specific about what's offered).
  - CTA: "15-min call this week if useful. Otherwise, here's the link and go play — happy to answer in email."
- **Attachments:** link to `pointcast.xyz`, the HN post once live, 1-2 screen recordings from codex-03, git log screenshot.
```

## Rules

- **One pitch, one publication at a time.** Don't BCC. Don't mass-email. Each pitch is personalized in at least two concrete sentences.
- **No embargos.** Mike isn't announcing a product; he's running a live project. Let writers come to the site at any time.
- **Follow-ups: one, seven days later, one paragraph.** Then stop.
- **If a writer engages:** offer the Claude-loop transcript (the jsonl files in `~/.claude/projects/…` — Mike can sanitize + share). That's the tangible artifact nobody else has.

## Deliverables

1. `docs/outreach/2026-04-22-press-pitch.md` with the five pitches drafted + contact shape + subject lines.
2. A tiny "sent log" at the bottom: `Sent: {date} {publication} {writer} via {channel}`.
3. A summary paragraph on which angles you'd predict resonates most with each publication and why.

## Done when

- Five pitches drafted.
- First two sent.
- Remaining three sent within 72 hours.
- Responses (including non-responses) logged.
- Update `docs/plans/2026-04-22-10-assignments.md` row for manus-05.
