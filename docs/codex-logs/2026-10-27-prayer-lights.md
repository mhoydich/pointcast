# Prayer Lights — 2026-10-27

Requested: a prayer counter dashboard and new prayer lights that keep stacking and extending the page.

## Implementation

- New independent `/prayer-lights/` page, with a warm ivory/copper palette, six light colors and three candle shapes. Responsive layouts, keyboard controls, touch targets, live save status and reduced-motion support.
- Clearly personal total, today, current visit and seven-day counters. No global counts are inferred from browser data.
- Each light is saved individually to IndexedDB. No fixed collection cap, expiry or automatic deletion. The wall loads 48 older lights at a time and keeps appending; newly lit cards also extend the wall. Browser storage capacity remains the physical limit.
- Optional intentions remain on the device and are rendered as literal text. JSON backup includes intentions; restore validates all records before a single atomic merge, keeps existing records, and deduplicates backups by stable ID.
- Cross-tab updates use BroadcastChannel plus focus refresh. Initialization, saves and refreshes are serialized; failed writes preserve the draft, and delayed successful writes preserve a newly typed next draft.
- Existing shared `/api/prayer` accepts fixed station names; `/api/votive` expires lights at 24 hours and stores at most 400. Neither matches permanent unrestricted accumulation, so this implementation uses its own device-local store and leaves those endpoints unchanged.

## Verification

`node --test tests/prayer-lights.test.mjs` — 12 passing tests covering real IndexedDB transactions via `fake-indexeddb`, concurrent connections, reload persistence, calendar boundaries, paged accumulation, duplicate restores, invalid backups, failed saves, hostile intentions, cross-tab refresh, startup/navigation races and draft preservation.

Independent Astra source/DOM review found no remaining blockers after the race and failure-message fixes. `git diff --check` passed. Full `npm run build:bare` result is reported with the commit handoff. Real browser screenshots and mobile device checks were unavailable in this session.

No push, merge or deployment performed. Root agent owns release integration.
