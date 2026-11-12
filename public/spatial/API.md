# Spatial kit: API notes

Version 1.1.0, 2026-11-11. Spec: spatial.places/v1.

```
What the tests exercise (the kit's browser test: headless Chrome + SwiftShader + IWER Quest 3
emulator; node --test test/geo.test.mjs test/safe.test.mjs). Emulator only, never a physical headset.
- page load at 1280x800 and 390x844: no errors, canvas lower half not blank, places in view,
  horizontal FOV >= 60, budget, same-origin requests only
- render loop stops with the canvas scrolled off screen and resumes; 20 create/dispose cycles leave
  1 live WebGL context
- hostile manifest fixture (javascript:, data:, mixed case with leading spaces; places and a portal):
  no link, no OPEN button, window.__pwned never set from the list or from OPEN
- XR in IWER: enter VR; double enterVR = one requestSession; no bounded-floor; controller select opens
  the panel; ground teleport; two teleports in one fade; a teleport right before session end lands;
  snap turn 30 deg; session end restores the page and hides the panel; a dispatched sessiongranted
  event enters VR; gaze with no controllers opens a panel only (no move, no navigation, OPEN and
  portal ignored); real IWER hand pinch select; synthetic 3rd and 4th transient-pointer sources
  connect with no ray and can select
- reduced motion: moves are instant
- a mutation run (each fix reverted in a scratch copy) makes the matching checks fail
Not exercised: real sessiongranted timing in a browser, AR entry, Vision Pro, the document.hidden
pause (code path only), reference-space reset, keyboard select (Tab moves the view; Enter follows the
native link, which is not the in-scene select path), screen readers.

1.1.0 changes
- safeUrl(u, base?, {sameOrigin?}) exported (also from safe.mjs, which imports nothing from three and
  runs in plain Node). Only http:, https: and relative URLs pass; javascript:, data:, vbscript:, blob:,
  file:, mailto: and unparsable strings return null. The URL parser strips leading spaces/control
  characters and tabs in the scheme first, so those tricks are rejected too. "//host/" resolves to
  https://host/ and is accepted unless {sameOrigin:true}. Behaviour: a place or portal whose url fails
  is listed as plain text (span.spatial-nolink), its panel has no OPEN button, and openItem refuses it.
  Cross-origin list links get rel="noopener".
- validateManifest(m, base?) and layoutPlaces(m) exported (safe.mjs). createWorld console.warns
  validation problems; it does not reject.
- Gaze dwell (behaviour): dwell only opens a place's or portal's panel. It never moves the viewer,
  follows a link, presses OPEN, enters a portal or calls a page handler, unless that interactable was
  registered with addInteractable(obj, { dwell: true, onSelect }). New addInteractable option onDwell
  (used by the kit's place hits). Off in AR. opts.gazeDwell:false turns dwell off. New event 'dwell'.
- Four XR controller slots (was two). The ray line shows for tracked-pointer only (not transient-pointer,
  gaze, screen). New event 'input' { slot, mode, hand, handedness, connected }.
- Render loop pauses when the stage is off screen (IntersectionObserver) or the document is hidden;
  never during an XR session. Read-only world.running, world.frameCount.
- dispose() also calls renderer.forceContextLoss().
- sessiongranted is listened for when the module loads; createWorld takes a grant that came earlier.
  New export sessionGranted().
- enterVR()/enterAR() while one is pending or active return the same promise. bounded-floor is no
  longer requested (behaviour).
- Session end hides the panel, removes the AR overlay and applies a teleport that was mid-fade. A
  teleport asked for during a fade is queued.
- Panel: 1024 x 576 canvas on a 1.28 x 0.72 m plane; body 42 px (about 1.3 deg at 1.6 m), smallest line
  40 px. Long titles/bodies end with an ellipsis; long links are cut in the middle. Panel lines can
  come from place.panel = { kicker, title, body, link } or opts.panel(place) returning the same shape;
  the default is unchanged (kind, glyph + title, blurb, url). world.showPanel(place), world.hidePanel(),
  world.panelOpen; ctx.showPanel, ctx.hidePanel.
- Camera policy: opts.camera = { fov: 60, minHFov: 60, maxVFov: 80, pageEye: 1.6, pitch: -5.7 }
  (degrees, metres). Tall canvases raise the vertical FOV to keep minHFov, capped at maxVFov. pageEye
  and pitch apply on the page only; XR uses the head pose. Behaviour: portrait FOV was 64 deg across
  with an 85 deg cap; now 60 / 80 as asked. Pages that set camera.fov themselves still win.
- spatial.css (behaviour): the stage is aspect-ratio 16:10, and 4:5 on portrait viewports (max-height
  82vh / 78vh). Pages that set their own stage height still win.
- Labels: ctx.removeLabel(handle), world.removeLabel(handle) or handle.remove() gives a label back
  (atlas cell reused; makeLabel meshes are disposed). Atlas pages take new labels after they are built
  (up to 96 per page). addLabel opt boost:true grows a label with distance on the page only
  (opts.labels.boostRef default 8 m, boostMax default 2), upward from its lower edge.
- ctx.addPlaceHit(place, anchor, { center, size, highlightRadius, onHover }) and
  ctx.addSpot(place, anchor, { distance, visual, size, highlightRadius }): the pieces the default
  builders use. goTo() uses the spot distance (anchor.userData.standDistance, default 1.8 m). ctx.safeUrl.

1.0.0 notes (still true)
Deviations and additions (additive; nothing in section 3 removed):
- createWorld resolves (does not reject) when WebGL fails: world.webgl === false, list still shown.
  Check world.webgl before using world.scene.
- createWorld calls start() itself. Pass autoStart:false to hold rendering. start() is idempotent.
- 'ready' fires after the first rendered frame, so world.on('ready', fn) right after await still works.
- Manifest yaw (start.yaw, place.yaw, portal.yaw) is in degrees, 0 = facing north (-z), clockwise.
- Grid layout: a place may carry "cell": {"col","row"}; otherwise slots fill in list order.
  "spacing" may be a number or {"x","z"}. A place with "position" keeps it under any layout.
- Kinds: builders[place.kind] if given, else builders.station (default). Built-in "marker" kind = small post.
- Teleport is rig-move (world.rig position/rotation). Reference space local-floor, else local + rig.y 1.6.
- Extra ctx members: anchor (positioned Group for this place, builders only), slot {x,z,yaw},
  addBox({parent,x,y,z,sx,sy,sz,rotY,color,key,material}) and addInstance(key, geometry, material,
  matrix4World, color) -> instanced batches (one draw call per key); call ctx.flushInstances() if you
  add instances after createWorld resolved. selectPlace(place, how), showHighlight/hideHighlight,
  removeInteractable(obj), theme, shared {box, plane, disc, ring, lambert}, manifest.
- addInteractable(obj, {label, onSelect(how, hit), onHover(bool), box:{center:[x,y,z], size:[x,y,z]}}).
  Hit testing is ray vs the object's local bounding box (OBB). Give box for empty Object3D hit zones.
- makeLabel(text, {size, color, bg, maxWidth, sub, glyph, billboard, caps, font:'mono'|'sans'}) may
  return null once labels.max is reached. Each makeLabel mesh is its own texture and draw call.
- (1.0.0, same day): ctx.addLabel(text, opts, parent, x, y, z) puts a
  label in a shared 1024 px atlas drawn as one InstancedMesh per page (one draw call for many
  labels). Extra opts: bottom (y of the label's lower edge, overrides y), yaw. Returns
  { setColor(css), setVisible(bool), wm, hm, world } or null at the cap. The built-in station,
  marker and portal builders now use addLabel; portal inner planes are instanced and their hit
  zone is an Object3D box. Labels added after createWorld resolved need ctx.flushInstances().
- Draw calls in XR: three r185 has no multiview here, so each eye costs its own calls. Town hub
  (1.1.0): 11 calls on the page, 32 in VR with the panel open. Keep page-mode calls near 30.
- Extra world members: moveTo(x, z, yawDeg), snapTurn(dir), select(id, how), mode ('page'|'vr'|'ar'),
  referenceSpaceType, list (the nav element), root, portals, ctx, version, flushInstances().
- opts.listMount: element to hold the DOM list (default: inside mount, under the canvas).
- opts.teleportRadius (default 40 m from origin).
- AR: transparent clear, sky/ground/fog hidden, ground teleport off. hit-test is requested as an
  optional feature but not used for placement yet.
- how values for select: 'mouse' | 'touch' | 'pen' | 'keyboard' | 'controller' | 'hand' | 'transient' | 'gaze' | 'api'.

Usage (page needs the import map from SPEC section 2):

  <link rel="stylesheet" href="../spatial/spatial.css">
  <script type="importmap">{ "imports": { "three": "../spatial/vendor/three-r185/three.module.min.js",
    "three/addons/": "../spatial/vendor/three-r185/addons/" } }</script>
  <script type="module">
  import { createWorld } from '../spatial/spatial.mjs';
  const world = await createWorld({ mount: document.querySelector('main'), manifest: 'places.json',
    xr: { vr: true }, decorate: async (ctx) => {
      const g = await ctx.loadGLB('models/thing.glb'); ctx.scene.add(g);
      ctx.onFrame((dt) => { if (!ctx.reducedMotion) g.rotation.y += dt * 0.2; }); } });
  world.on('select', (place, how) => console.log(place.id, how));
  </script>
```
