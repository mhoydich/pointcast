# Signal Atlas — optional observatory

An isolated fictional geometric form study at `/signal-atlas/observatory/`. Tessel, Kiri, and Ollo are original imagined companions, visually distinct from the main Atlas illustration. The connection state always reads **Not connected**. These forms are not visitor evidence, provider identities, collected encounters, or competitors.

All assets are local. The route uses CSS 3D without WebGL, third-party packages, credentials, analytics, outbound requests, or browser storage. It does not read traffic or modify consent, receipts, collections, or scores. Static geometry is defined in CSS; DOM construction uses text-safe nodes, with no inline HTML styles, so the route works under the Atlas preview CSP.

## Controls and fallback

- Drag horizontally to orbit. Vertical scrolling remains available through `touch-action: pan-y`; pointer cancellation releases the drag.
- Select a form or card. Cards and rotation controls are ordinary keyboard buttons with visible focus and selection announcements.
- Focus the scene and use arrow keys to rotate or Home to reset. Camera travel is bounded.
- Choose **2D view** for the card alternative. Browsers without CSS 3D automatically receive the labeled 2D fallback. A no-JavaScript summary also describes the characters.
- **Gentle motion** starts off. The checkbox is disabled and cleared in 2D or while the system requests reduced motion, with the reason displayed. Live preference changes stop animation; restoring 3D or the system preference does not restart it. Optional animation pauses when the document is hidden or the scene is offscreen.
- Primary controls are at least 44px high. Cards become a readable single column on small screens.

## Integration contract

The header returns to `../#collection`. The main Atlas owns temporary UI-context preservation and restoration; this directory does not read or write that state. Keep this integrated route rather than importing the separate design kit's prototype routes.

```js
window.PointCastObservatory.selectCreature('ledger'); // or 'tessel'
window.PointCastObservatory.getState();
// { selected:'tessel', view:'3d', connected:false, fictional:true, yaw:-25, pitch:56 }
window.addEventListener('pointcast:creature-select', event => {
  // event.detail: { id:'ledger', creatureId:'tessel', fictional:true,
  //                 source:'observatory-design-study' }
});
```

| Character ID | Archetype ID | Original form |
| --- | --- | --- |
| tessel | ledger | stacked cubic archivist |
| kiri | threader | tilted folded explorer |
| ollo | tuner | softened orbital listener |

Events describe selection of fictional art only. Unknown IDs return false without changing state. There is no connection-mutating API. Selection must never be interpreted as an encounter, identity proof, consent, receipt, or score.

## Verified locally — 2026-11-01

From the repository root:

```sh
node --test tests/signal-atlas-observatory.test.mjs
node --check public/signal-atlas/observatory/assets/app.js
```

**Passed:** 14 regression tests and JavaScript syntax validation. Tests cover default fictional/disconnected state, strict-CSP-compatible construction, selection and focus, keyboard limits, interrupted and competing pointers, phantom-drag prevention, reversible 2D, unsupported CSS, and initial/live reduced-motion preferences through modern and legacy listeners.

**Chromium passed:** a loopback-only harness using installed Chromium with its sandbox enabled verified static geometry and CSSOM camera updates under the Atlas preview CSP; keyboard selection and camera controls; pointer orbit followed by selection; reversible 2D; motion disabling/reset and live preference changes; and simulated missing CSS 3D support with usable keyboard cards. No external requests, script errors, or CSP console errors occurred. Layouts at 320, 360, 390, 768, and 1440px had no horizontal page overflow, with primary controls at least 44×44px. The updated 320px, 1440px, and 390px fallback screenshots were visually inspected: labels and cards are readable, all three figures remain visible, and selected/focused states are clear. The decorative floor extends beyond the scene edge at small widths.

Standalone evidence is retained locally at `/tmp/signal-atlas-observatory-qa-20261101/result.json`, alongside `observatory-{320,360,390,768,1440}.png` and `observatory-fallback-390.png`. The local harness is `/tmp/observatory-browser-qa-20261101.mjs`; it uses the installed browser and does not download dependencies. These temporary paths are review evidence, not deployed assets.

**Integrated roundtrip passed:** the separate main-app QA run tested the actual observatory at 1440, 390, and 320px with reduced motion. Keyboard navigation from Atlas into the room and back restored site, demo, filter, search, disclosure, and focus. The room's reduced-motion and reversible 2D controls passed. Integrated evidence: `/tmp/signal-atlas-qa/integrated-results.json` (22 checks across both routes).

**Remaining coverage:** Safari and Firefox rendering, physical touch hardware, screen readers, and dedicated 200% zoom testing have not been completed. CSS 3D face ordering can vary by browser. This evidence confirms local behavior, not deployment or production availability. No remote publication was performed.
