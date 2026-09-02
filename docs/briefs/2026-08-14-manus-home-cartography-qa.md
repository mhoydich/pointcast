# Manus brief · 2026-08-14 · Home Cartography QA

**Status:** ready once PR #961 (`claude/home-cartography-device-73wphl`) merges to `main` and deploys to production.
**Concept doc:** `docs/prd/2026-08-04-home-cartography-device-concept.md`

## What you're testing

Home Cartography is a concept: a device/app that indexes a household's stuff into a structured, agent-queryable inventory. PR #961 ships a concept board, a fictional demo household ("The Dune Street House," 20 items), and six MCP tools that expose that demo inventory. Everything here is fictional — there is no real household behind the demo data. Your job is real-user QA of the surfaces and the MCP connector, as if you were a curious visitor and then an AI agent poking at the tools.

## Exact URLs to open

- `https://pointcast.xyz/cartography/home` — concept board
- `https://pointcast.xyz/cartography/home/demo` — demo household ("The Dune Street House")
- `https://pointcast.xyz/cartography/home.json` — machine-readable twin of the concept board
- `https://pointcast.xyz/cartography/home/demo.json` — machine-readable twin of the demo household

## Accounts / tools needed

- A browser (desktop + mobile viewport, or an actual phone) for the two HTML pages.
- `curl` (or equivalent) for the JSON/CORS checks.
- Claude with the ability to add a **custom connector**, pointed at `https://pointcast.xyz/api/mcp-v2`.

## Tasks

### 1. Page QA
- Open `/cartography/home` and `/cartography/home/demo` on desktop. Screenshot both.
- Open both on a mobile viewport (or real phone). Screenshot both. Check that the item list/grid on the demo page doesn't overflow horizontally, and that the concept board's copy is readable at phone width.

### 2. JSON twin + CORS check
Run against both JSON endpoints:
```bash
curl -I https://pointcast.xyz/cartography/home.json
curl -I https://pointcast.xyz/cartography/home/demo.json
```
Confirm both return `200`, `content-type: application/json` (or similar), and an `Access-Control-Allow-Origin` header (or equivalent CORS headers) so external agents can fetch them cross-origin. Paste the raw header output into the log.

### 3. MCP connector — add and exercise
- In Claude, add `https://pointcast.xyz/api/mcp-v2` as a custom connector.
- Call each of the six tools with a sample input and screenshot the response:
  1. `home_index_summary` — no args
  2. `home_index_find` — `{"query": "drill"}`
  3. `home_index_room` — `{"room": "garage"}`
  4. `home_index_valuation` — no args
  5. `home_index_lendable` — no args
  6. `home_index_sell_draft` — `{"itemId": "it-014"}`
  7. Also call `home_index_sell_draft` with a deliberately unknown ID (e.g. `{"itemId": "it-999"}`) and confirm it fails gracefully (clear error, not a crash/500) rather than returning garbage or a fabricated item.

## Where to write results

`docs/manus-logs/2026-08-14-home-cartography-qa.md` — include:
- The desktop + mobile screenshots (or links to where they're stored)
- The two `curl -I` outputs
- Screenshots of all seven MCP calls (six real + one unknown-ID probe)
- A short pass/fail note per acceptance criterion below

## Acceptance criteria

- [ ] Both HTML pages render correctly on desktop and mobile, no horizontal overflow, no broken layout
- [ ] Both JSON twins return 200 with correct content-type and CORS headers permitting cross-origin fetch
- [ ] All six MCP tools return sensible, on-brand fictional data tied to the Dune Street House demo (nothing that reads as a real household or real financial advice)
- [ ] `home_index_sell_draft` with an unknown itemId fails gracefully with a clear error, not a fabricated item or a raw stack trace
- [ ] No page or tool response implies the demo data is real or that valuations are investment-grade advice

## Mike approval

Nothing in this QA pass needs Mike's approval — it's read-only testing against already-fictional demo data. The one exception: **merging PR #961 itself** is a Mike-approval step, separate from this QA brief, and should happen before you run these tests (the URLs above 404 until then).
