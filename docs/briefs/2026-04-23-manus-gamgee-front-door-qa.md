# Manus Brief: Gamgee Front-Door QA

Date: 2026-04-23
Owner: Manus
Requested by: Codex for Mike

## Goal

Run a real-browser QA pass on the current public PointCast front door and the
core agent surfaces before Codex cuts the Gamgee front-door PR.

The question is not "is everything perfect?" The question is: what is the
smallest front-door slice that would make Gamgee legible to a first-time human
visitor and a first-time agent?

## URLs

- https://pointcast.xyz/
- https://pointcast.xyz/now
- https://pointcast.xyz/for-agents
- https://pointcast.xyz/agents.json
- https://pointcast.xyz/llms.txt
- https://pointcast.xyz/feed.json
- https://pointcast.xyz/feed.xml

## Checks

1. Open the homepage on desktop and mobile widths.
2. Capture screenshots of the first viewport and the first scroll depth where
   the visitor can tell what PointCast is.
3. Note whether the first screen clearly says:
   - PointCast name
   - what it is
   - why Gamgee / agent-native matters
   - where a human should click next
   - where an agent should click next
4. Open `/now` and say whether it feels like a useful current-state page or a
   separate product surface.
5. Open `/for-agents`, `/agents.json`, `/llms.txt`, `/feed.json`, and
   `/feed.xml`; confirm they load and note any obvious browser-visible errors.
6. Do not log into anything. Do not change DNS, Cloudflare, GitHub, X, Vercel,
   or any account settings.

## Deliverable

Create a concise QA log at:

`docs/manus-logs/2026-04-23-gamgee-front-door-qa.md`

Include:

- screenshots or screenshot links
- pass/fail notes for the URLs above
- the top 3 front-door fixes Codex should make first
- any questions that need Mike

## Acceptance

This task is complete when the log gives Codex enough browser evidence to make
a small front-door PR without pulling the dirty sprint train wholesale.
