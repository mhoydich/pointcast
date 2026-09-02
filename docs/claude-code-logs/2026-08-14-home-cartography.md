# Claude Code log · 2026-08-14 · Home Cartography

**Session goal:** stand up the Home Cartography concept end to end — concept doc, public concept board, a fictional demo household proving the schema, and an MCP surface an agent can actually query — via a multi-lane Claude Code effort, plus hand off review, generative art, and real-user QA.

## Lane roster

- **Fable** — coordinating session, assembling lanes and merging output.
- **Sol** (Opus) — MCP tools: the six `home_index_*` tools on `/api/mcp-v2` and `/api/mcp`.
- **Terra** (Sonnet) — tests + tool registration/discovery wiring.
- **Luna** (Sonnet, this lane) — docs: Codex queue entry, Manus QA brief, this log, concept doc updates.
- **Codex** — PR review of the MCP + cartography surfaces, plus generative hero art for the concept page (queued in `docs/codex-queue.md`, both writing to `/sketches/`, never `src/`).
- **Manus** — real-user QA once PR #961 merges (brief in `docs/briefs/2026-08-14-manus-home-cartography-qa.md`).

## What landed

- **Concept doc**: `docs/prd/2026-08-04-home-cartography-device-concept.md` — product sketch, guardrails, business sketch, open questions.
- **`/cartography/home` (+ `.json`)** — the public concept board.
- **`/cartography/home/demo` (+ `.json`)** — "The Dune Street House," a 20-item fictional demo household proving the item/location/provenance/valuation schema end to end.
- **Six MCP tools** on `https://pointcast.xyz/api/mcp-v2` (and `/api/mcp`): `home_index_summary`, `home_index_find({query})`, `home_index_room({room})`, `home_index_valuation`, `home_index_lendable`, `home_index_sell_draft({itemId})` — all reading from the demo household.
- **Discovery wiring** — the new tools registered alongside PointCast's existing MCP tool set so they surface to any client listing tools on the server.
- **Tests** — coverage for the six tools' happy paths and at least the unknown-item/unknown-room edge cases.
- **All of the above on PR #961**, branch `claude/home-cartography-device-73wphl`.
- **Adversarial review workflow queued**: `docs/codex-queue.md` — "Home Cartography — Codex tasks (2026-08-14)" with (1) a correctness/agent-readability/guardrails review of the PR, and (2) a generative-hero-art brief for `/cartography/home`, both scoped to leave `src/` untouched (review = PR comments only; art = `/sketches/home-cartography/` only).
- **Manus QA brief queued**: `docs/briefs/2026-08-14-manus-home-cartography-qa.md` — exact URLs, MCP connector setup, screenshot/log requirements, acceptance criteria, log destination.

## Remaining risk

- **PR #961 not yet merged** — none of the live URLs or MCP endpoints exist in production until it lands; the Manus QA brief and Codex review both depend on the merge.
- **Fictional-only guardrail is load-bearing** — the demo household must stay unmistakably fictional (Codex's review task is specifically scoped to check this on both the page copy and the MCP tool outputs).
- **No financial-advice framing** — `home_index_valuation` needs to read as informational, per the concept doc's guardrails; unreviewed as of this log.
- **Generative art is speculative** — Codex's hero-art task is exploratory; it may need a second pass or a simpler fallback if the topographic-contour concept doesn't land visually.
- **No receipt/email ingestion yet** — the concept doc's passive-data-fill idea (purchase history, warranty dates) has no implementation; the demo household's provenance fields are hand-authored, not ingested.

## Next steps

1. **Receipt-ingestion spec** — design how purchase emails/receipts fill in provenance fields (price paid, purchase date, warranty start) without a manual scan, per the concept doc's "Device" section.
2. **Scan a real room** — the concept doc's own next step: validate the item/location/provenance/valuation schema against one real room instead of only the fictional demo, to see if the cold-start experience actually delivers a "wow."
3. **Own name/route decision** — if Home Cartography graduates past concept, decide whether it stays under `/cartography/home` (sibling to Digital Identity Cartography) or gets its own top-level route/brand name, per the concept doc's open question.
