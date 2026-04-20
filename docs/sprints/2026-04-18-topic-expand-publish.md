---
sprintId: topic-expand-publish
firedAt: 2026-04-18T17:55:00-08:00
trigger: chat
durationMin: 18
shippedAs: deploy:960bf7df
status: complete
---

# /ping "Topic — expand and publish" toggle + Block 0273 demo

## What shipped

Mike's directive in chat: "for one of the new feature, yah, it'd be interesting i could send you a note or topic and you expand on it and publish." This sprint built the round-trip and shipped a meta-demo block in the same deploy.

- **`/api/ping` payload extended** with optional `expand: boolean` field. Stored in KV metadata + body. POST response now includes `expand: true` and a different `note` ("Topic received. Claude Code drafts + publishes as a block on the next tick.") when the flag is set.
- **`/ping` form gains a purple-bordered "Topic — expand and publish" checkbox** above the wallet-sign block. Default off — pings stay private. Status message on success becomes "Topic queued for expansion. cc drafts + publishes a block on the next tick."
- **CSS for `.expand` block** added to `/ping` page styles.
- **`AGENTS.md` updated** with the topic-expand processing rule for cc — when an `/api/ping` entry has `expand: true`, cc reads, drafts in cc-voice editorial (NOT Mike-voice), picks channel + type, sets `author: 'mh+cc'` (or `'cc'`), `source` pointing back to the ping key, ships, deletes the processed ping. One ping → one block.
- **Sprint card `topic-expand-publish` added to backlog** as `done`. Status field documented.
- **Block 0273 published** as the meta-demo: cc-voice editorial expansion of Mike's exact chat message, author `mh+cc`, source field cites the chat exchange. The block is itself the round-trip the message describes.
- **Smoke-tested end-to-end**: POST with `expand: true` returned the new note string + `expand: true` in the response. Verified key in KV, then deleted the smoke entry.

## What didn't

- **No automatic processing of pre-existing pings.** Mike's earlier 9:37pm ping (the "interactions, information gathering, games" message that became Block 0272) was preserved as a static Mike-voice block. Going forward, expand-flagged pings get cc-voice expansions. Different signal, different shape — both are correct.
- **No "republish" or "draft preview" workflow.** v1 publishes directly. If cc misreads a topic, Mike can edit the block JSON or set draft=true. Future candidate: a "review" mode where expand-flagged pings produce drafts that Mike approves before they go live.
- **No admin-only restrictions on the expand flag.** Anyone hitting /ping can check the box. cc applies the same VOICE.md safety rails regardless of who sent it. If someone abuses the surface, we add per-address rate limiting.

## Follow-ups

- The pattern needs one or two real Mike-seeded blocks beyond the meta-demo to feel proven. Mike can test it: open /ping on phone, type any topic, check the box, send. Should land as a published block within an hour.
- Consider a `/topics` page that surfaces what's been expanded (parallel to /sprints + /collabs registries). Each expanded block links back to the originating ping context. Future sprint candidate.
- Add a `topic-expand` row to the agent-feeds dl on /subscribe so agents know about the pipeline.
- The processing rule is currently in AGENTS.md prose. If we want Codex to enforce it on PRs, formalize the schema check (e.g. "any new block with author='mh+cc' must have source matching `/api/ping key …` regex").

## Notes

- 14th sprint shipped today. 13th cron-fired equivalent (this + KV bind + shelling-point-poll were chat-fired; counts as cron-fired in spirit since the cron loop's substrate is what makes them shippable safely).
- Cumulative cc work since 7:11: ~235 min across 14 sprints + 1 health check.
- Block 0273 is the first time PointCast has shipped a meta-demo where the block describes the surface that produced it. Self-referential closure on the editorial pipeline.
- The pattern lowers the barrier between "Mike has a thought" and "it's a published block on PointCast" from ~30 minutes to ~30 seconds + an hour of cc cron-tick processing time. Significant for a site whose bottleneck is editorial throughput rather than render speed.
