# Farcaster Frame → Mini App Migration Plan

**Status:** Deferred (Frames v1 deprecated late 2025; link preview working fine)
**Last update:** 2026-04-17

## TL;DR

PointCast's `/drum` Frame was built against Farcaster Frames v1 (`fc:frame: vNext`). That spec was deprecated in early 2025 and renamed **Mini Apps**. Warpcast + Farcaster clients no longer render v1 Frames as interactive — they fall back to a plain Open Graph link preview.

**Current state (2026-04-17):**
- Mike's test cast at https://farcaster.xyz/mhoydich/0x0b003a1c shows as a **plain link preview** (gorgeous, actually — Drum Room wordmark + Noun + ON AIR badge).
- The Frame button (`🥁 Drum along`) does NOT render, as confirmed by Manus debug (task `5vQbyMjAGX7ogWxfFJeC75`).
- The existing v1 POST handler at `/api/frame/drum` has an unrelated Cloudflare Worker 1101 crash bug on payload (Manus flagged it).

## Decision: skip v1 fixes, plan Mini App migration for later

The link preview is doing the work — pointcast.xyz/drum still drives traffic. Paying engineering to fix Frames v1 is a dead-end. Mini App migration is its own project.

## What Mini Apps are (vs Frames v1)

| Aspect | Frames v1 (vNext) | Mini Apps (2025+) |
|---|---|---|
| Meta tag | `fc:frame=vNext` | `fc:miniApp=1.0` (or newer) |
| Render surface | Button row below link preview | Full modal / webview inside Warpcast |
| Client runtime | HTTP POST to your server on button click | Full browser environment (React/Vue/etc.) |
| Interaction | 1–4 buttons, text input | Full UI: scroll, tap, form, keyboard |
| Auth | FID payload in POST body | Farcaster SIWE / FID context injected into webview |
| Suitable for | Counters, simple forms, voting | Full apps — chat, minting, multiplayer |

For PointCast's `/drum`, the Mini App route is actually a **better fit** — the existing `/drum` page IS a full webview experience (Noun drum rack, sounds, live presence, achievements). Wrapping it as a Mini App means Farcaster users get the full drum room inside Warpcast without leaving the client.

## Migration roadmap (when we commit)

### Phase 1 — Mini App manifest
- Replace `fc:frame` meta tags in `src/pages/drum.astro` with `fc:miniApp` meta tags per the current Mini Apps spec.
- Add a `/.well-known/farcaster.json` route (Cloudflare Pages Function) describing the Mini App — name, icon, homeUrl, description.
- Update the OG image to match the Mini App splash screen dimensions (per current spec — check https://docs.farcaster.xyz/ or the successor).

### Phase 2 — Mini App runtime integration
- Add the Farcaster Mini App SDK (`@farcaster/miniapp-sdk` or successor) to `/drum`.
- On load inside Warpcast, call `sdk.actions.ready()` to signal the app is mounted.
- Read FID/username from `sdk.context.user` and use it in the drum room identity (replaces localStorage handle for Farcaster users).
- Persist drum counts per-FID in a new KV namespace binding `DRUM_FARCASTER` (separate from anonymous counts).

### Phase 3 — In-app sharing
- Use `sdk.actions.composeCast()` to let users share their drum session back to their Farcaster feed from inside the Mini App.
- Render a share-card preview (can use the share-card generator Manus built, task `LUKTFzRhfG5ZsRKe4Fg6Ni`).

### Phase 4 — Deep integration (optional)
- Leaderboard filtered to Farcaster users.
- Push notifications via `sdk.actions.addMiniApp()` (user opt-in).
- In-app tipping via Warps (Farcaster's credits system) — requires Warpcast merchant onboarding.

## Cleanup to do now (no migration commitment)

1. **Fix the Cloudflare Worker 1101 crash in `functions/api/frame/drum.ts`** — even though the Frame button doesn't render, bots + scanners may still hit the POST endpoint; crashing on payload is ugly. Either:
   - Add a try/catch wrapping the full handler and return a 200 with a "deprecated" message; OR
   - Make the handler return 410 Gone with a note pointing to the Mini App migration.
2. **Optionally remove the `fc:frame` meta tags** from `src/pages/drum.astro` — they're harmless but misleading. Replace with a comment noting the Mini App migration plan.
3. **Keep the OG/Twitter image meta** — those still drive the gorgeous link preview.

## References

- Manus debug task (3 root causes, v1 deprecation notice): `docs/frame-debug.md`
- Original Manus Frame spec (pre-deprecation, kept for historical context): task `a7xZUkVslb0asRm8uj5wqL`
- Mike's test cast showing link-preview render: https://farcaster.xyz/mhoydich/0x0b003a1c
