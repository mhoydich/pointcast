# Death Star Computer Club

A living computer club grows out of Mike Hoydich's Death Star BBS archive. The museum preserves the historical evidence; the new ATASCII terminal invites play; the shared club is where today's members participate.

## Doors

- `/atari-bbs/`: original rig photograph, hardware and character-set references, historical timeline, primary sources, a simulated terminal, and 38-column dash.
- `/atari-bbs/death-star/`: a new 40 × 24 ATASCII canvas terminal, local handles, authored museum bulletins, glyph art, and five-arrow archery. This is newly written software, not a recovered FoReM image or historic board connection.
- `/atari-bbs/club/`: public message board, voluntary membership using existing PointCast sign-in, daily check-ins, earned badges, and the ten-design art collection.
- `/atari-bbs.json` and `/atari-bbs/club.json`: source and product data. `/api/atari-club` reads current shared state.

## First member experience

Read the history or play the terminal. Sign in to PointCast, choose a public handle, and explicitly join. Introduce yourself in General, record a memory in Memories, or show something made in Workshop. Come back and check in. The club launches with real counts and empty-state prompts; nobody is enrolled or quoted as a member automatically.

The first lightweight community ritual is a tiny build: share something made with a small constraint, such as a 40-column image, a one-screen program, or a memory attached to a machine. These are invitations in the interface, not fabricated community messages or scheduled events.

## Badge rules

| Badge | Earned by |
| --- | --- |
| First Carrier | Joining voluntarily |
| First Transmission | First accepted board message |
| Pixel Builder | First accepted Workshop message |
| Night Shift | Explicit check-ins on three different Los Angeles calendar days |

Joining counts as the first check-in. Reading, refreshing, downloading an image, or retrying a join does not add check-ins. The server awards badges; deleted posts do not erase earned history. No wallet, payment, token mint, or artificial scarcity is involved.

## Art provenance and downloads

Ten distinct, visually inspected images from Michael Hoydich's existing Midjourney archive inspired four badge images, two identity designs, two gear concept images, and two art cards. Generated with the built-in image_gen tool. Each generation used one distinct reference. Full prompts and reference hashes are in `docs/atari-club-art-prompts.json`; app data and source-gallery/image links are in `src/data/atari-club-art.ts`. Some original archive titles and old job links disagree with the visible images; the actual linked source image identifies the reference, and original Midjourney job attribution is not asserted.

Selected PNG originals and WebP display derivatives live in `public/images/atari-bbs/club/`. WebP resizing preserves alpha for the four badges. Gear is a concept presentation, not a manufacturing-ready file, stocked item, or order. Art cards are freely downloadable digital images, not minted collectibles.

## Community operation

Handles and posts are public. Account identifiers, email addresses, and reporter identities stay out of public responses. Posts are plain text, up to 1,000 characters and 16 lines. Members can delete their own posts and confidentially report others. The PointCast director can review reports, resolve them, clear a post, pause a member, or restore membership. Paused members' messages are hidden. Removal permanently clears the stored body while retaining timestamps for abuse limits and earned badge history.

Same-origin JSON writes require a valid existing PointCast session. Join consent is explicit. Posting uses atomic SQL admission limits of one message per 30 seconds and ten per hour; reports are capped at ten per day. All API responses use private, no-store caching. Storage failure is a service-unavailable response, never an invented empty board. A failed send preserves the user's draft and warns when the outcome is uncertain.

This initial board shows the newest 50 messages per selected channel. It has no replies, attachments, direct messages, notifications, or automated outreach. Those should follow observed member use. Success means real introductions, useful memories, small creations, and people returning; the UI does not imply that membership already exists.

## Release and validation

The additive migration `migrations/auth/0026_atari_club.sql` creates four tables and indexes in the existing `pointcast-auth` AUTH_DB. It has no new bindings and changes no existing auth tables. Apply only this migration to avoid sweeping in unrelated pending migrations. Deploy the compiled Pages Functions with the site artifact from the exact merged source.

Focused tests cover signed-in membership, race-safe handle/post limits, check-in/badge rules, reports and moderation permissions, transaction rollback, storage failure, expired sessions, terminal controls, rendering bounds, archery scoring, and UI failure/success states. Browser QA checks the built museum, terminal, and club at desktop and narrow mobile sizes. Live verification should distinguish public/auth-denied requests from mocked signed-in test flows; do not publish test conversations or enroll Mike automatically.
