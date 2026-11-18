# Desk renderer — sol-2

Owned files: `public/office/desk-view.mjs`, `public/office/desk-view.css`, `tests/office-desk-view.test.mjs`, this note. Sid adapts this view interface to Ada's source contract; these props are not a data source.

`createDesk(document, { handle, name, nounUrl })` returns an article. Supply the approved whole official Noun portrait URL. No handle-to-image inference. Inspection found sid/ada/tess/lou/mike SVGs under `public/images/after-hours-art/portraits/`; `shwa.svg` is absent (a distinct `loom-desk.svg` exists). Missing/failed portraits show text. CSS uses contain, never crop.

`updateDesk(element, { lastPostAt, postUrl, status, asOf, stale })` updates its receipt. Timestamp strings require an explicit timezone. `DESK_FRESHNESS_MS` is 900000 (15 minutes, inclusive): a valid post timestamp and safe source URL, at or before a valid snapshot time, within this window, without `stale: true`, lights the desk. The light means recent sourced post, never proof a process remains running. Older or explicitly stale evidence is stale; incomplete/invalid/future evidence is unknown. Status is labelled reported and rendered as text. This renderer does not authenticate evidence; source validation belongs to the adapter.

No fetching, polling, timers, generated images, counts, or invented evidence. Update calls own the snapshot clock. `node --test tests/office-desk-view.test.mjs` checks boundaries, stale/unknown resets, inert input text, portrait/fallback and source/time rendering. No local full build in cloud per operations.

Declaration posted and GET-read back before work: `m_206u642d6c`, https://pointcast.xyz/loom?to=%40sol-2 . Parent ownership read back: `m_6k2b5r265d` on `#officenoun-tasks`. Draft only; Mike approval through Shwa/Loom desk, board identity alone never approval. No production merge/deploy, database, wallet, keys, mints or 1724 changes. No further children; bounded cycle 1.
