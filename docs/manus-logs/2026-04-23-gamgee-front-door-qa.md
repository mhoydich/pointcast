# Gamgee front-door QA

Date: 2026-04-23
Owner: Manus
Requested by: Codex for Mike
Task: `SDdF3vdtaxfJcPNhqB5BWR`
Task URL: https://manus.im/app/SDdF3vdtaxfJcPNhqB5BWR

## Scope

Manus ran a real-browser QA pass against the current public PointCast site before
the Gamgee front-door patch.

Checked:

- https://pointcast.xyz/
- https://pointcast.xyz/now
- https://pointcast.xyz/for-agents
- https://pointcast.xyz/agents.json
- https://pointcast.xyz/llms.txt
- https://pointcast.xyz/feed.json
- https://pointcast.xyz/feed.xml

Screenshot artifacts are attached to the Manus task:

- `desktop-homepage-viewport1.webp`
- `mobile-homepage-viewport1.png`
- `desktop-homepage-scroll1.webp`
- `mobile-homepage-scroll1.png`
- `now-page-desktop.webp`
- `for-agents-desktop.webp`
- `agents-json-desktop.webp`
- `llms-txt-desktop.webp`
- `feed-xml-desktop.webp`

## Findings

The agent surfaces are solid. `/for-agents`, `/agents.json`, `/llms.txt`,
`/feed.json`, and `/feed.xml` load cleanly and give agents the expected
machine-readable entry points.

`/now` works as a useful current-state page. It reads as a live snapshot rather
than a generic product page.

The homepage was the weak point. Manus could not find a clear explanation of
what PointCast is within the first screen or the early scroll depth. The best
plain-English description lived on `/for-agents`, not the human front door.

## Top fixes

1. Add a visible "what is PointCast" front-door module to the homepage.
2. Surface the agent-native / Gamgee value proposition for first-time visitors.
3. Give newcomers a clear first click before they fall into the feed.

## Codex response in this PR

This PR addresses the findings without importing the dirty sprint branch:

- Adds a visible Gamgee RC0 front-door strip on `/`.
- Adds a public `/gamgee` release anchor with human, agent, and builder paths.
- Updates the home metadata, JSON-LD, and Farcaster frame buttons to point at
  `/gamgee`, `/now`, `/for-agents`, and `/agents.json`.
- Leaves `/for-agents`, `/agents.json`, `/llms.txt`, `/feed.json`, and
  `/feed.xml` structurally unchanged.

## Questions for Mike

- Should `/gamgee` remain the public RC0 release anchor after launch, or should
  it later fold into an evergreen `/agent-native` page?
- Should the public wording name the build crew as "Claude + Codex + Manus" or
  keep the release page more project-facing?
