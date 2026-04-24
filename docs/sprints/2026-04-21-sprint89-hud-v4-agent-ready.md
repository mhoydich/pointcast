---
sprintId: sprint89-hud-v4-agent-ready
firedAt: 2026-04-21T12:10:00-08:00
trigger: chat
durationMin: 28
shippedAs: deploy:tbd
status: complete
---

# chat tick — Sprint #89: HUD v4 + agent-ready metadata + WebMCP

## Context

Mike, 12:10 PT: "yah, bar still very wonky, not working, take another pass
and add additional items to sprint, check backlog, like google auth"

Followed by the isitagentready.com failing-checks list — four missing
pieces: OAuth authz server metadata, OIDC discovery, protected-resource
metadata, WebMCP tools.

Sprint #88 had landed a smoothness pass on the HUD (10 polish moves) but
Mike's browser was stuck in the `tiny` state — a holdover from v3's
4-state model where `tiny` was a 32px icon-only strip. It reads as broken,
not compact, on return visits. v3.1's migration surfaced users out of
`min` but not `tiny`.

## What shipped

### HUD v4 — state model collapse

- **Dropped the `tiny` state.** Heights are now just: `min` (hidden + reopen
  chip), `compact` (default bar), `tall` (bar + drawer).
- **Removed ▲▼ shade buttons** — redundant with ≡ expand toggle when there
  are only 2 visible states.
- **Removed ⌘↑/⌘↓ hotkeys** — conflicted with macOS scroll-to-top.
- **Grab-strip simplified** — click toggles compact↔tall; drag gesture
  removed (quantization was confusing without enough states to snap to).
- **One-time v4.0 migration** — any user on any pre-v4 state is reset to
  `compact` + legacy `pc:hud:minimized` / `pc:hud:expanded` keys cleared.
- **Removed `will-change: transform`** from chips (was creating extra
  compositing layers that caused jitter on lower-power devices).
- **Removed drawer clip-path roll-down + cascading panel fade** + popover
  pop-in keyframe + reopen-chip entrance animation. All introduced latency
  that made the bar feel laggy. Bar now responds instantly.
- **Removed shade button CSS** + dead `shadeUp/shadeDown` JS functions.

### /.well-known endpoints (Pages Functions)

- **`functions/.well-known/oauth-authorization-server.ts`** — RFC 8414
  OAuth 2.0 Authorization Server Metadata. Advertises PointCast's Google
  relay: authorization_endpoint = /api/auth/google/start; token_endpoint =
  Google; jwks_uri = Google; grant_types = [authorization_code]; scopes
  = [openid, email, profile]; PKCE S256; subject_types = [public].
- **`functions/.well-known/openid-configuration.ts`** — OIDC Discovery
  1.0 equivalent with userinfo_endpoint + full claims list.
- **`functions/.well-known/oauth-protected-resource.ts`** — RFC 9728
  Protected Resource Metadata. resource = pointcast.xyz;
  authorization_servers = [pointcast.xyz, accounts.google.com];
  bearer_methods = [header, cookie]; authentication_required = false;
  open_apis = [ping, presence/snapshot, drop, drum, poll, feedback].
- **`public/.well-known/oauth-authorization-server.json` + `.json` siblings
  updated** to match — any caller using the extensioned paths still gets
  identical content.
- All endpoints: application/json + 5 min cache + CORS (*).

### WebMCP tools

- **`src/components/WebMCPTools.astro`** (new) — registers 7 tools via
  `navigator.modelContext.provideContext()` on every page. Graceful
  degrade if API not supported.
- **7 tools**: `pointcast_latest_blocks`, `pointcast_get_block`,
  `pointcast_send_ping`, `pointcast_push_drop`, `pointcast_drum_beat`,
  `pointcast_federation`, `pointcast_compute_ledger`. Each has JSON
  Schema input + async execute callback hitting /api/* endpoints.
- **Included in BaseLayout + BlockLayout** — runs on every page.
- **Debug hook**: `window.__pointcast_webmcp_tools` lists registered
  tool names for devtools.

### Google OAuth setup doc

- **`docs/plans/2026-04-21-google-oauth-setup.md`** — step-by-step for
  Mike: create OAuth client in Google Cloud Console → paste
  GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REDIRECT_URI into
  Cloudflare Pages env vars → verify. Total ~10 min.
- After env vars land, /api/auth/google/start starts returning 302 to
  Google's consent screen, and the HUD's "sign in with google" chip
  becomes functional.

### Editorial + record

- **Block 0363** — 6-min retro explaining all three threads.
- **This sprint recap.**
- **Ledger entries** — sprint + block + retro at top of
  `src/lib/compute-ledger.ts`.

## What didn't ship

- **`/api/presence/snapshot` 404.** The file-vs-folder conflict was
  resolved by consolidating to `presence/index.ts` yesterday, but the
  route still 404s. Suspect the cross-script DO binding references a
  standalone `pointcast-presence` Worker that isn't deployed. Out of
  scope for this sprint; flagged for next.
- **Bell Tolls advanced + exceptional difficulties** (4th + 5th tiers).
  Still waiting on Mike's canonical YouTube ID for the Metallica VEVO
  track before the beat maps are worth completing.

## Notes

- Migration hits every user on first load after deploy — no one stays
  stuck in a pre-v4 state. Future migrations can reuse the same
  `pc:hud:version` marker pattern.
- The `.well-known` Pages Functions start responding the moment they
  deploy (no caching issue). isitagentready.com should re-check clean.
- WebMCP only runs on browsers that support it (Chrome Canary + experimental
  flag right now). Everyone else sees the page normally; tools simply
  aren't registered.
- Astro build: 341 pages in 16s. Clean.

## Follow-ups

- Investigate `/api/presence/snapshot` 404 (cross-script DO binding).
- Ship Bell Tolls advanced + exceptional once the YouTube ID lands.
- Observe: does the HUD feel better on next Mike reload? If not, the
  next pass might need to look at the information architecture of the
  bar (chip ordering, drawer panel labels) rather than visual/state polish.
- Set up Google OAuth env vars per the setup doc — then the sign-in
  chip starts working and /auth shows a populated "YOUR STATE" section.
