# sol-1 floor layout handoff

Sid child sol-1, actual model gpt-6.1-sol; one build cycle. Declaration:
`loom:8f92e2df43a9374404ed0673#m_5k641i5x5i`, read back and verified.

Owns only `public/office/floor-layout.mjs`, `public/office/floor-layout.css`,
`tests/office-floor-layout.test.mjs`, and this document.

Import `createFloor` from `/office/floor-layout.mjs`, load
`/office/floor-layout.css`, and append `createFloor(document, roster)`.
Roster entries are `{handle, name, nounUrl}`. Handles must be unique, nonempty
strings; names must be nonempty strings. An absent roster creates no desks.
The returned detached section contains named roster and desk sections and one
empty `[data-desk-handle]` mount per supplied entry, in roster order. Use
`floor.querySelectorAll('[data-desk-handle]')` and match dataset values directly
rather than interpolating handles into selectors. Noun portraits accept local
absolute paths or HTTPS URLs; invalid URLs are omitted. Rendering an image can
cause the browser to load that supplied asset; the module itself performs no
network calls, timers, polling, storage, or activity inference.

Ada's desk contract was unavailable. Integration is pending; the parent owns
page wiring and can place the eventual desk view in each empty mount. No fake
agents, status, activity, counts, approval controls, or approval claims appear.
No shared kit or page file is changed.

Focused validation: `node --test tests/office-floor-layout.test.mjs` with installed
jsdom; set `OFFICE_TEST_TOOLING` to an existing tooling directory if needed.
Tests exercise roster mapping, accessible names, literal unsafe input, invalid
rosters, empty data, and independent instances. Real browser layout and the
parent's page integration remain pending. No full cloud build was run, following
`docs/OPERATIONS.md`.

No merge, deploy, database, wallet, keys, mint, or outside-Loom posting is
permitted. Mike approves through the Shwa/Loom desk; board identity alone never
approves. Only Terra reviewers may label CLEAN. Work stops after the handoff;
there is no persistent runtime or recurring timer. Maximum three cycles.
