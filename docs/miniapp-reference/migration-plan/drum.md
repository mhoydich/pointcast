# Farcaster Mini App Migration Plan for pointcast.xyz/drum

This document outlines the complete migration plan for upgrading `/drum` from the deprecated Farcaster Frames v1 standard to the new Farcaster Mini App (formerly Frames v2) specification.

## 1. Architecture Overview

The `/drum` application will continue to operate as a rich Astro page (with Cloudflare Pages Functions and KV) but will now also serve as a fully functional Farcaster Mini App. A Mini App is a standard web application loaded within a Farcaster client's webview, enriched with native social context and capabilities via the `@farcaster/miniapp-sdk` [1].

### Embedding and Discovery
When a user shares `pointcast.xyz/drum` on Farcaster, the client reads the `fc:miniapp` meta tags on the page [2]. These tags define the Mini App's embed card (image, title, and action URL). Tapping the card opens `/drum` inside the Farcaster client in a vertical modal.

### Authentication and Context
Once loaded, the page initializes the Mini App SDK. The SDK provides immediate access to the `sdk.context.user` object, containing the user's Farcaster ID (FID), username, and profile picture [3]. We will use this to automatically authenticate Farcaster users without requiring manual input or external wallet signatures, replacing the anonymous "name yourself" flow when viewed in a Farcaster client.

### KV Storage Schema
The existing KV schema handles anonymous drum counts and live presence. We will introduce a new schema to track counts per FID securely.

**Current Schema:**
* `drum:global:count` -> Integer
* `visit:<uuid>` -> JSON

**New Schema (Per-FID Tracking):**
* `drum:user:<fid>:count` -> Integer (Tracks individual drum hits by a Farcaster user)
* `drum:user:<fid>:profile` -> JSON (Caches username and PFP for leaderboards)

### Splash and Icon Requirements
* **Icon:** Must be a 1024x1024px PNG with no alpha channel.
* **Splash Image:** Must be exactly 200x200px.
* **Splash Background Color:** A valid hex color code (e.g., `#ffffff`).

## 2. Cloudflare Pages Function Manifest (`farcaster.json.ts`)

Farcaster requires a domain-level manifest hosted at `/.well-known/farcaster.json`. This file configures the Mini App's identity, display settings, and required capabilities [4].

See the implementation in `functions/.well-known/farcaster.json.ts`.

## 3. Updated Meta Tags (`drum.astro`)

To make `/drum` sharable as a Mini App, we must replace the deprecated `fc:frame` meta tags with the new `fc:miniapp` embed tags [2]. We will keep the existing Open Graph (`og:`) and Twitter tags intact to ensure rich link previews on non-Farcaster platforms like Twitter or iMessage.

See the implementation in `src/pages/drum.astro`.

## 4. Client-Side SDK Hydration

When the `/drum` page loads, it needs to detect if it is running inside a Farcaster Mini App context. If so, it should read the user's FID and username to bypass the anonymous flow. Crucially, it must call `sdk.actions.ready()` to dismiss the Farcaster splash screen; otherwise, the user will be stuck on an infinite loading screen [5].

See the implementation in `src/pages/drum.astro`.

## 5. `composeCast` Integration

To encourage viral growth, we will add a "Share to Farcaster" button that only appears when the user is inside a Mini App. Tapping this button calls `sdk.actions.composeCast()`, which opens the Warpcast composer pre-filled with the user's drum count and an embed linking back to the Mini App [6].

See the implementation in `src/pages/drum.astro`.

## 6. Test Plan

To ensure a smooth migration, follow this test plan:

1. **Warpcast Developer Tools:**
   * Open Warpcast on desktop and navigate to the Developer Tools (Settings -> Developer Tools).
   * Use the "Mini App Manifest Tool" to validate the `farcaster.json` manifest and generate the required `accountAssociation` signature.
   * Paste the signature into `functions/.well-known/farcaster.json.ts`.
   * Use the "Mini App Embed Tool" to verify that the `fc:miniapp` meta tags on `pointcast.xyz/drum` render the correct embed card.

2. **Cross-Platform Verification:**
   * **Desktop Warpcast Web:** Share the `/drum` URL in a cast. Click the embed card to ensure the Mini App modal opens, the splash screen dismisses, and the FID is successfully read.
   * **iOS Warpcast:** Repeat the above steps on the iOS app. Verify that the "Share to Farcaster" button successfully opens the native composer via `composeCast`.
   * **Android Warpcast:** Repeat the above steps on the Android app.
   * **Non-Farcaster Clients:** Share the `/drum` URL on Twitter and iMessage. Verify that the standard Open Graph tags still render a rich preview and that clicking the link opens the standard web version with the anonymous "name yourself" flow.

## 7. Frame Deprecation Recommendation

**Recommendation:** Return `410 Gone` with a link to the Mini App.

The current Farcaster Frames v1 standard is officially deprecated [7]. Attempting to fix the existing `/api/frame/drum` POST crash (Cloudflare Worker 1101) is not a productive use of time, as Warpcast and other major clients are actively phasing out v1 Frames in favor of Mini Apps.

Instead, you should modify the deprecated endpoints (`/api/frame/drum` and `/api/frame/drum-image`) to return a standard HTTP `410 Gone` response. If possible within the v1 Frame spec, you can return a final static image indicating that the app has been upgraded, along with a button that links to the new Mini App URL (`pointcast.xyz/drum`). This ensures that any old casts containing the v1 Frame gracefully degrade while directing users to the new experience.

## References

[1] Farcaster Mini Apps Specification (https://miniapps.farcaster.xyz/docs/specification)
[2] Farcaster Mini Apps Sharing Guide (https://miniapps.farcaster.xyz/docs/guides/sharing)
[3] Farcaster Mini Apps SDK Context (https://miniapps.farcaster.xyz/docs/sdk/context)
[4] Farcaster Mini Apps Publishing Guide (https://miniapps.farcaster.xyz/docs/guides/publishing)
[5] Farcaster Mini Apps Getting Started (https://miniapps.farcaster.xyz/llms-full.txt)
[6] Farcaster Mini Apps composeCast Action (https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast)
[7] Migrate to a Standard Web App (https://docs.base.org/apps/quickstart/migrate-to-standard-web-app)
