# Socrates Tag — OFF-54 A

Ada, an AI agent. Draft page at `/socrates-tag`, rooted in Daniel's original
rules `m_5e5z1m2s51` in #socratestag. Task `m_662s3i0j5d`; Mike's request
`m_2h6m3o5p6i`. Game created by Daniel; no endorsement or host ruling implied.

The Pages Function makes one bounded five-second public API read and renders
rules, join instructions and retained moves without scripts. The browser refreshes
visible pages every 30 seconds; failed reads disable move submission and retained
text is labelled old. A two-hour clock is derived from the latest reported move's
server timestamp. Sources are preserved as text and safe HTTP(S) links, not verified.

Move-shaped lines need a quote, attribution and Source line. Echoes, hidden posts,
status replies and claims do not advance the clock. Unthreaded moves, root/fork
branches, missing ancestry, overlong/repeated quotes, wrong reported author,
late replies and tag-backs request host review. Ancestry warnings propagate.
No host note is authenticated from a self-declared name; host/challenge
notes persist across later moves and block the form rather than assigning a new turn. Daniel must settle the
stalled round in the room. A ledger or game count here is never authoritative.

People and agents can explicitly submit a public join request, or a sourced move
when the reported handle/clock permit it. No automatic POST, no new identity proof,
no private state, no vote or elimination automation. A fresh read precedes every
submission; changing parent aborts the move. Ambiguous POST failure advises checking
the room before retry, because KV may lose accepted writes. Client checks are UI
guardrails, not server enforcement of game rules. The generic Loom API stays public.

Flame: existing Hearth Kit, `public/baby-bonfire/hearth-kit/hearth-fire.js`, reuses
`public/baby-bonfire/prayer/media/hearth-loop.mp4` and `hearth-poster.jpg`.
Credit on page: Hearth Kit, Baby Bonfire, PointCast, CC BY 4.0. Original flame film
was made with AI tools; no new flame generated. Sound is disabled; reduced motion
uses a still and a pause control is provided. Parts B/C have separate task claims.
The page emits `socrates-state` (moves/latest/deadline/attention/checkedAt) for a
visualizer. Player portraits resolve only approved local SVG paths in the manifest.

Validation: focused model/route tests including a retained public room fixture;
local Chromium at 390×844 and 1280×900, network writes mocked, checked expired-turn
blocking and explicit join/move submission. No real board writes from the app.
Full site build is delegated to PR CI under OPERATIONS.md's cloud rule.
Physical-device, production routing and host play-through remain separate QA.

Part C integration: Sid’s draft #1714 at 86747767f4fe934c407b3c4df7ca27aaba237c8b,
eight player mappings with unchanged SVGs and source/recipe hashes. Both server
render and live refresh use the same manifest. Visible handles remain alongside
portraits; unknown handles receive no invented art or identity.

Independent review found and closed async form cleanup, branch ancestry,
unresolved notice propagation and unknown-handle portrait gaps. Twenty-two focused
tests pass. Local Wrangler compiled this page’s Worker bundle without deployment.

Part B: Ada’s flame-state adapter reuses the existing film, dims the expired
clock and marks reported ember changes without ruling on eligibility. Shwa’s
six-move trail from draft #1716 at 56b4145 is integrated in place of the local
quote strip, not alongside a duplicate. It consumes the state/portrait event and
clears its active border immediately on a failed read. No networking or audio
is added by the trail. Sid retains portrait authorship.

Remaining concurrency limit: the pre-submit read and POST are not atomic;
a simultaneous move can branch. The parser flags branches, and a receipt is
not proof of durable storage. Daniel retains host decisions.
