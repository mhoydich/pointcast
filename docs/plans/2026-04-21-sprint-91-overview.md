# Sprint #91 — Overview (large)

**Opened:** 2026-04-21 13:15 PT
**Trigger:** Mike chat — *"create next sprint overview make large"*
**Shape:** Five themes × three tasks each = 15 concrete items, ordered so each block of 3 can be picked up independently. Items flagged `unblock` are things that, if landed, remove a blocker on something else in this sprint or the next.

---

## Theme A — Unblock the Google / Beacon / Presence triangle

Three auth/identity gaps that have been open across Sprint #88–89 and need to close before the bar's "sign in" chip can be taken seriously.

1. **A-1** *(unblock)* **Set Google OAuth env vars in Cloudflare dashboard.**
   - Doc: `docs/plans/2026-04-21-google-oauth-setup.md` (already written).
   - Mike owns this one — paste `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` into `pointcast` project → Settings → Environment variables → Production.
   - Verification: `curl -I https://pointcast.xyz/api/auth/google/start` returns 302 to accounts.google.com.
   - Time: ~10 min.
2. **A-2** **Fix `/api/presence/snapshot` 404.**
   - File/folder consolidation done in Sprint #88 didn't resolve. Suspect the DO binding in `wrangler.toml` references a standalone Worker `script_name = "pointcast-presence"` that may not be deployed.
   - Approach: read `wrangler.toml` DO block → check `wrangler deployments list --name pointcast-presence` → if missing, either deploy the standalone Worker OR rewrite the binding to reference a same-project DO class.
   - Unblocks: /tv/shows/here starts showing real visitors; `pointcast_presence_snapshot` WebMCP tool starts returning data.
   - Time: ~45–60 min.
3. **A-3** **Ship `/api/auth/logout`** clearing `pc_session` cookie.
   - New Pages Function at `functions/api/auth/logout.ts`. POST clears cookie + 302 to `/`. Referenced from `/auth` page as "sign out" button (currently missing).
   - Unblocks: users can actually sign out, making the sign-in flow testable end-to-end.
   - Time: ~20 min.

## Theme B — Beacon / Tezos wallet — make the chip do something real

The HUD has a "◆ connect tezos wallet" chip in the YOU panel that currently just links to `/profile#wallet`. It should open a real Beacon connect flow in place.

4. **B-1** **Extract Beacon flow into a reusable component.**
   - Current: `/profile#wallet` has the flow inline. Extract into `src/components/BeaconConnect.astro` that can mount anywhere and emit a `pc-wallet-connected` CustomEvent.
   - Consume from: `/profile`, HUD drawer YOU panel, `/tezos`, `/collect/[tokenId]`.
   - Time: ~45 min.
5. **B-2** **HUD Beacon chip → inline connect.**
   - Replace `href="/profile#wallet"` with an onClick that calls `BeaconConnect.mount()`. Chip label changes from "◆ connect tezos wallet" to "◆ tz2…Fw" (truncated address) on success.
   - Updates: `src/components/CoNavHUD.astro` YOU panel.
   - Time: ~20 min.
6. **B-3** **Display connected state across pages.**
   - `localStorage['pc:wallet'] = { address, network, connectedAt }` is already set on connect. Every page reads it on mount.
   - HUD label, `/profile`, `/tezos`, `/collect/*` all show the truncated address + "disconnect" chip when connected.
   - Time: ~30 min.

## Theme C — Agent-ready continue: plumb the pipes harder

Sprint #89 shipped the three `/.well-known` endpoints + WebMCP. This theme fills gaps isitagentready.com flagged OR would flag next.

7. **C-1** **`/.well-known/agent-passport` ship.**
   - An identity document for the PointCast publisher (canonical URL, contact, abuse, preferred agents, compute ledger pointer, MCP server card pointer). The spec is informal but a clear agent-passport JSON is table stakes alongside the OAuth metadata.
   - File: `functions/.well-known/agent-passport.ts`.
   - Time: ~25 min.
8. **C-2** **WebMCP tool: `pointcast_presence_snapshot`.**
   - Depends on A-2 landing.
   - Add to `src/components/WebMCPTools.astro`. Reads `/api/presence/snapshot`. Returns count + list of anonymized visitor session IDs.
   - Time: ~15 min.
9. **C-3** **Server-side MCP card at `/.well-known/mcp/server-card.json`.**
   - A directory already exists in `public/.well-known/mcp/` — verify content, update with the 7 WebMCP tools, include `http_endpoint` pointing at the real server (if any) or leave with `in_page_only: true` if it's WebMCP-only.
   - Time: ~20 min.

## Theme D — Collaboration surface — make the agents visible to themselves

Block 0365 lays out who's shipping. This theme makes that reality visible ON the site (not just in JSON) so visitors + agents can see the live network.

10. **D-1** **`/compute` page refresh — four-column ledger view.**
    - Current: compute.json is a flat feed. New page at `/compute` renders a table grouped by `collab` (cc, codex, manus, chatgpt) with the latest 20 entries each, signature band, artifact link.
    - Time: ~45 min.
11. **D-2** **PulseStrip click → collab-detail panel.**
    - Clicking a dot on PulseStrip opens a small panel showing that collab's last 5 ships + their active brief (if any) + pending status.
    - Time: ~30 min.
12. **D-3** **`/for-agents` page update — document the MCP shim + WebMCP tools + how a peer agent registers.**
    - Current `/for-agents` is a manifest. Add a "how to contribute a ship" section that tells an agent: (a) hit any of the 7 WebMCP tools, (b) post a pc-ping-v1, (c) open a PR against the compute-ledger.ts.
    - Time: ~40 min.

## Theme E — Editorial + distribution cadence

The network has a lot of ships. It doesn't have a regular publishing cadence yet. This theme tries to set one.

13. **E-1** **Daily "top of the morning" block on home.**
    - A small component that, at 08:00 PT each day, auto-selects the three most-interesting blocks from the last 24h and renders them atop the home feed.
    - Heuristic v1: `editorial` or `sprint` kind + signature ≥ modest + less than 24h old.
    - Time: ~45 min.
14. **E-2** **Weekly retro block (Fri 18:00 PT, auto-published).**
    - A new block every Friday that summarizes the past 7 days of ledger activity — by collab, by kind, with totals. Queued via sprint scheduler.
    - Time: ~40 min (template) + 15 min (scheduler wire).
15. **E-3** **Manus V-1 Warpcast frame — fire the first post.**
    - Brief already at `docs/briefs/2026-04-21-manus-vol-2-gtm.md`. V-1 target is Wed 04-22 08:00 PT.
    - Mike approves wording; Manus drafts + posts via Warpcast API (or via Frame-Server MCP if that's set up).
    - Unblocks: the remaining V-2..V-5 tasks in the GTM cadence.
    - Time: ~30 min (Manus) + ~10 min (Mike review).

---

## Prioritization

If time is tight, the order I'd execute is:

1. **A-1** (Mike's 10-min paste of env vars — unblocks every auth discussion downstream)
2. **A-2** (presence 404 — longest-standing known bug)
3. **B-1 + B-2 + B-3** (Beacon wallet chip that actually works — biggest product delta)
4. **D-1 + D-2** (compute page + pulse click — makes the collaboration visible to humans)
5. **E-1** (top-of-morning block — sets the daily cadence)
6. **C-1, C-2, C-3** (agent-ready plumbing — nice-to-have until an agent complains)
7. **D-3, E-2, E-3** (editorial infrastructure — fine to land late in the week)

## What this sprint is NOT

- NOT a visual redesign. The HUD v4 shape from Sprint #89 holds; any polish requests get their own focused sprint.
- NOT a new game. /noundrum, /drum/click, /cards, /quiz all keep shipping via their own cadences.
- NOT a shelving of Bell Tolls ADVANCED + EXCEPTIONAL tiers — they ship the day Mike pastes the canonical YouTube ID.
- NOT a DAO / token / mint push. That's a separate sprint when the DRUM contract story is closer.

## Success criteria

By Friday 2026-04-24 18:00 PT:
- Google sign-in button works end-to-end (A-1 + A-3 done).
- `/api/presence/snapshot` returns 200 (A-2 done).
- Beacon wallet chip connects inline (B-1 + B-2 + B-3 done).
- `/compute` page shows 4-column ledger by collab (D-1 done).
- Top-of-morning block has auto-published at least once (E-1 done).
- Warpcast frame has shipped via Manus on Wed (E-3 done).

Stretch: all 15 tasks land. Realistic: 10-12 of 15.

## Team

- **cc** (this session, main PointCast repo): lead on A-2, A-3, B-1/2/3, C-1/2/3, D-1/2, E-1/2.
- **Mike**: owns A-1 env var paste + approves Manus V-1 copy.
- **Manus**: V-1 draft + fire (E-3).
- **Codex CLI**: B-1 BeaconConnect component (low-reasoning single-file scope) if Mike wants to delegate.
- **ChatGPT Agent**: drum cookie clicker backlog from 04-20 if Mike wants to paste in parallel.

---

*— cc, 2026-04-21 13:15 PT. Sprint #91 overview filed. Execution begins Tuesday afternoon 2026-04-21 14:00 PT.*
