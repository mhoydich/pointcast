# Spatial kit

Turns one JSON list of places into a page that works on a phone, a laptop and in a WebXR
headset. The same file drives a plain list of links and a walkable 3D scene. Static files
only, no build step, no requests to other hosts. Spec: `spatial.places/v1`.

What you get from `createWorld()`:

- a `<nav><ul>` of real links built from the manifest (it stays if WebGL fails). The list is built
  by the module, so without JavaScript there is no list: add a `<noscript>` link to your manifest.
  Only http, https and relative URLs become links (`safeUrl`); anything else is shown as text.
- a three.js scene: gradient sky, ground, one station per place, portals to other 3D pages
- one ray-and-select path for mouse, touch, XR controllers, hands (pinch) and transient pointers
  (up to four input sources). Gaze dwell (1.2 s) only opens a place's panel. Keyboard uses the list:
  Tab moves the view to the focused place, Enter follows the link.
- teleport (120 ms fade) and 30 degree snap turn in XR; drag to look and tap to walk on a page
- "Enter VR" (and "Enter AR" if you ask for it) only when the browser says it is supported
- rendering pauses while the canvas is off screen or the tab is hidden

## Add a hub to any static site in five steps

1. Copy the `spatial/` folder to your site root. Keep it next to your hub folders.
2. Make a folder for the hub (for example `vr/`) and write `places.json`:

   ```json
   { "$schema": "spatial.places/v1", "id": "my-hub", "title": "My Hub",
     "layout": { "type": "grid", "cols": 3, "rows": 2, "spacing": 5 },
     "start": { "x": 0, "z": 8, "yaw": 0 },
     "places": [ { "id": "news", "title": "News", "blurb": "One plain line.", "url": "/news" } ] }
   ```

   Layouts: `grid` (cols, rows, spacing), `ring` (radius), `geo` (manifest `origin`, each
   place's `geo`, plus `scale`: `sqrt` / `log` / `linear` and `maxRadius`), `free` (each place
   has `position`). A place with no usable slot is listed but not drawn.
3. In `index.html`, link the stylesheet and add the import map (paths are relative):

   ```html
   <link rel="stylesheet" href="../spatial/spatial.css">
   <script type="importmap">
   { "imports": { "three": "../spatial/vendor/three-r185/three.module.min.js",
                  "three/addons/": "../spatial/vendor/three-r185/addons/" } }
   </script>
   ```
4. Mount it:

   ```html
   <main id="hub"></main>
   <script type="module">
     import { createWorld } from '../spatial/spatial.mjs';
     const world = await createWorld({ mount: document.getElementById('hub'), manifest: 'places.json' });
   </script>
   ```
5. Test it. In the PointCast repo: `python3 scripts/spatial/serve.py 8101` serves `public/` plus the test
   fixtures, then `python3 scripts/spatial/e2e.py --url http://localhost:8101/your-hub/ --hostile-url
   http://localhost:8101/__fixtures/hostile/ --out ./report --min-links N --min-visible M` runs the
   browser checks (page load at phone and desktop sizes, render-loop pause, context release, a
   hostile-manifest fixture, an emulated Quest 3 with controllers, hands, gaze and extra input
   sources, reduced motion). Pass `--world-global NAME` if the page puts its world on `window.NAME`.
   Some XR checks assume a walkable ground and kit place hits; a page with a fixed seated view fails
   those by design. Look at the screenshots. Plain Node tests:
   `node --test tests/spatial-geo.test.mjs tests/spatial-safe.test.mjs tests/spatial-pages.test.mjs`.

Custom looks: pass `builders: { [kind]: (place, ctx) => object }` and `decorate: async (ctx) => {}`.
Use `ctx.addBox(...)` / `ctx.addInstance(...)` for repeated shapes (one draw call per key),
`ctx.addLabel(...)` for text (atlas, one draw call per 1024 px page; give it back with
`ctx.removeLabel(handle)`), and `ctx.addPlaceHit(place, anchor, ...)` plus `ctx.addSpot(...)` so
your building opens the panel and has a standing spot like the default station. Panel text can be
set per place with `place.panel = { kicker, title, body, link }`. Camera: `opts.camera = { minHFov,
maxVFov, pageEye, pitch }`. See `API.md` for the full list of `ctx` and `world` members.

## Rules a hub must follow

1. One URL, every device. The page is a normal web page first: the list of links, then the
   canvas, then Enter VR / AR only when supported. Without WebGL the list is the page.
2. Standards only: WebXR Device API, never WebVR 1.1. three.js from `spatial/vendor/three-r185/`. No CDN,
   no remote fonts, no analytics, no controller-model downloads.
3. Content lives once, in the manifest. Do not hand-write a place twice.
4. Comfort: in XR the camera never moves unless the user caused it. Teleport and snap turn
   only. Panels 1.2 to 2.5 m away, a little below eye line. Label text at least 1.2 degrees
   of arc tall (about 3.5 cm cap height at 1.6 m).
5. One select path for pointer and XR input. Use `ctx.addInteractable`, not your own listeners.
   Gaze dwell must never move the viewer, navigate, start audio or enter a portal: register an
   interactable with `dwell: true` only when its action is harmless to trigger by looking.
6. Budget for a Quest-class GPU: at most 60 draw calls and 100k triangles in view, textures
   at most 1024 px (labels 512 px), no real-time shadows, one directional plus one hemisphere
   light, no post-processing in XR, no allocations in `onFrame` callbacks. In XR each eye is
   drawn separately, so a scene that shows 30 calls on the page shows about 60 in a headset.
   Remove fully faded objects from the scene. Report `world.info()`.
7. Accessible: the canvas has a text alternative, every place is a link, reduced motion turns
   off idle animation and glides (read `ctx.reducedMotion`), audio only after a press with a
   visible control, visible focus.
8. Spatial pages link to each other with `"spatial": true` so the headset can carry the session
   over (`sessiongranted`). Otherwise the Enter button shows again.
9. Privacy: no camera frames or room data leave the device. AR uses hit-test and anchors only.
   Store nothing in the browser.

## Files

- `spatial.mjs`: the kit. `geo.mjs`: pure `bearingDistance`, `geoToLocal`, `makeGeoScale`.
  `safe.mjs`: pure `safeUrl`, `validateManifest`, `layoutPlaces`. Neither imports three or the DOM.
- `spatial.css`: enter buttons, list, notices. Override the `--sp-*` custom properties.
- `vendor/three-r185/`: three.js r185 (MIT, see `vendor/three-r185/LICENSE`), GLTFLoader, BufferGeometryUtils,
  SkeletonUtils, meshopt decoder.
- Tests live outside this folder, in the repo: `tests/spatial-*.test.mjs` (`node --test`) and
  `scripts/spatial/e2e.py` (Playwright with an emulated headset; not run in CI) with its fixture.

Tested in headless Chrome and the IWER emulator only. Not yet tested on a physical headset.
