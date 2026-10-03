# Plugin field guide — review evidence

Date: 2026-10-03. Author: Codex. Status: draft; editorial/X review and MH publication approval remain with the parent release lane.

## Scope and result

The field guide covers Plugin Extensions, plugin/skill/MCP packaging, discovery, MCP Events, and Sites hosting choices. Each has three applications, a prompt, expected output, first step, use/avoid guidance, architecture, operational safeguards, and official source links. Public behaviors, analogies, and proposals use distinct text labels. No live integration was created.

New routes are `/ues/plugin-field-guide`, `/ues/plugin-field-guide.md`, and `/ues/plugin-field-guide.json`. The isolated, noindex page uses existing `BlockLayout`. It does not modify the UES hub, navigation, course progress, auth/wallet work, the MCP server, or IndustryNext. The filter is a local reading aid with no network or persistence.

## Verification boundary

The audited PointCast source baseline is `2a3e35326beffc23884b8fcca1c045623fe6565b`. Public probes returned a real JSON-RPC initialization from `/api/mcp-v2` (pointcast-v2 2.7.0, protocol 2025-06-18), 90 tools, and 22 resources. `blocks_recent` and `apps_list` read calls succeeded. The GET endpoint returned HTML. No UI metadata or `ui://` resources were returned; `server/discover` and `events/list` returned -32601. This verifies the named responses, not full transport, auth, or tool conformance.

Public `/ues/classes.json` returned HTTP 200 and its no-account, browser-local progress contract matched the source. The public IndustryNext homepage returned HTTP 200 and described the magazine/lab/work table and proposed Communications Lab. The separate destination audit identified `mhoydich/nouns5.4`; no IndustryNext source was changed here.

All product claims use actual fetched pages from developers.openai.com, platform.openai.com, or learn.chatgpt.com. The eleven source links and check date are included in the guide. No ranking guarantee is claimed. The permitted fetched documentation did not establish the narrower screenshot claim that Sites hosts MCP servers/extensions; that point remains explicitly unverified. Account eligibility, connection status, and workspace controls were not tested.

## Existing MCP annotation issue — follow-up before a pilot

The baseline auditor found `wants_post`, `wants_offer`, and `haggle_offer` advertised with `readOnlyHint: true`, although their handlers perform state-changing POST dispatches. At the baseline, `functions/api/mcp.ts` lines 227–246 omit them from `WRITE_TOOL_NAMES`; the annotation mapping around line 1288 overwrites hints; handlers around lines 2297–2309 perform writes. No write calls were executed and no server code was modified.

The guide therefore proposes only a separately reviewed allowlist: `blocks_recent`, `block_read`, `blocks_search`, `apps_list`, and `connector_links`. Review each handler and correct hint/handler consistency in a separate server change before presenting a broader catalog as read-only. An annotation is a hint, never an authorization control. This pre-existing finding does not block the educational draft, but limits the pilot recommendation.

## Independent review

The guide reviewer found no blocking content issue. Two MCP Events completeness notes were resolved: DNS validation on every callback connection with validated-IP pinning and the original TLS hostname, and signing-key rotation/replay cursor continuity. Authenticated, idempotent unsubscribe and restart/expiration handling are included. The official-docs reviewer separately verified packaging, submission, discovery, extension availability, and the Sites evidence gap.

## Checks

- `node --test tests/plugin-field-guide.test.mjs`: 4 passed. Tests cover all five topics/three brands, allowed source domains and status distinctions, the constrained event illustration, the actual TypeScript filter including live count/reinitialization, and the exact generated Markdown companion.
- `npm run build:bare`: passed; 2,809 pages built in 985.38 seconds. The build snapshot preceded final prose refinements to callback DNS/rotation guidance and reader-facing release language. No implementation, data shape, CSS, or client logic changed after that snapshot. The final page passed `@astrojs/compiler` with no diagnostics and the final data/Markdown/filter tests passed. Do not treat this as a full production deployment test.
- Actual worktree page verified in Chrome at 1440×1000 and 390×844. Brand selection shows five examples, reset shows fifteen, internal anchors resolve, keyboard Tab reaches the labeled scrollable code block, and there is no horizontal page overflow at the narrow width.
- Standalone HTML has inline assets and embedded Markdown/JSON downloads matching the final sources byte-for-byte. Its brand filter was checked in Chrome. A script-stripped copy shows all fifteen examples with the inactive filter hidden and no 390px overflow.
- Contrast review found a minimum 6:1 among the text color pairs. Source includes explicit list roles, text status labels, visible focus, skip links, reduced-motion and print styles. A full assistive-technology audit, print/PDF export, and physical mobile-device test were not performed. Native select keyboard changes were not conclusively exercised; focus/Tab and semantic selection were verified.
- One wallet extension injected an unrelated `Cannot redefine property: ethereum` browser error into the standalone test; it did not originate from the guide. No guide filter error was observed.

Review screenshots: [desktop](plugin-field-guide-20261003/desktop.jpg), [mobile](plugin-field-guide-20261003/mobile.jpg), [standalone companion](plugin-field-guide-20261003/companion-mobile.jpg).

## Release limits

Draft PR only. No merge, deploy, plugin installation, directory submission/publication, event subscription, credential, connected private app, external message, or permission change was performed. Editorial/X review, MH publication approval, and the parent release lane remain outstanding. Any live pilot needs its own reviewed implementation and account checks.
