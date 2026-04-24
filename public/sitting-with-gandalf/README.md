# Sitting with Gandalf

A self-contained fantasy smoking companion for a quiet pipe pause: timer, smoke rings, ambient fire/rain/road/starlight audio, original wizardly prompts, lantern view, phase guidance, and a small local session log.

Open `index.html` in a browser. The page has no build step and references only local files.

## Versions

The app defaults to V2, with a V1/V2 toggle in the masthead. The selected version is saved locally.

### V1

- Classic quiet-room mode.
- Keeps the timer, Fire/Rain/Road rooms, ambience controls, focus view, notes, and local tally.
- Hides companion portraits, V2 guide prompts, Stars mode, and the visible smoke ritual for a calmer first pass.

### V2

- Four selectable Gandalf companions: Hearth, Rain, Road, and Stars.
- A live guide card that says what to do now: choose, start, inhale, hold, exhale, pause, or return.
- The smoke/breath ritual is visible by default instead of hidden under extras.
- Four scene presets: Fire, Rain, Road, and Stars.
- Web Audio ambience with procedural crackle, rain patter, road wind/steps, and soft bell tones.
- Canvas atmosphere with smoke rings, embers, rain streaks, road dust, and starlight motes.
- Warmth and Smoke sliders stored locally.
- Lantern view for a quieter timer-only room.
- Session phases that shift from Settle to Drift to Return.
- Simplified control hierarchy: choose a Gandalf, choose a room, set ambience, then follow the smoke ritual.

## V3 Plan

- Guided sits: 5, 15, and 25 minute smoke ceremonies with gentle phase-specific narration.
- Audio mixer: separate Fire, Weather, Road, Bells, and Drone levels instead of one master ambience slider.
- Companion memory: remember preferred Gandalf, room, duration, and last note without making the UI busier.
- Visual focus table: a closer pipe, ember, cup, and smoke view for focus mode.
- Route polish: keep `/sitting-with-gandalf/` as the main room and consider a short `/gandalf/` alias after deploy behavior is confirmed.

## Assets

The backdrop was generated with the built-in image generation tool and copied into `assets/wizard-study.png`.

The companion portrait sheet was generated with the built-in image generation tool and copied into `assets/wizard-companions.jpg`.

Backdrop prompt:

```text
Use case: stylized-concept
Asset type: web app ambient background illustration
Primary request: an original fantasy smoking-room companion scene for sitting beside a wise grey wizard, evocative of a cozy epic fantasy journey without copying any film still or actor likeness
Scene/backdrop: warm round-window cottage study at night, stone hearth fire, wooden chair, pipe on a small table, tea cup, maps, old books, soft smoke curls, hints of distant mountains through the window
Subject: an elderly grey-robed wizard-like companion seated in profile near the hearth, face partially obscured by hat brim and smoke, original character design, no recognizable actor likeness
Style/medium: painterly digital illustration with rich texture, cinematic but cozy
Composition/framing: wide 16:9 background, usable darker negative space along the left and lower center for UI overlays, strong focal glow near right side
Lighting/mood: amber firelight, deep forest green shadows, slow contemplative evening mood
Color palette: amber, deep green, soot charcoal, muted parchment, small brass highlights
Materials/textures: rough stone, worn wood, wool robe, parchment maps, pipe smoke
Constraints: no text, no logos, no watermark, no exact Gandalf/movie likeness, no copyrighted dialogue
```

Companion portrait prompt:

```text
Use case: stylized-concept
Asset type: web app UI companion portrait sprite sheet
Primary request: a 2x2 grid of four distinct original elderly grey-wizard companion portraits for a cozy meditation/smoking companion web app called Sitting with Gandalf
Scene/backdrop: each portrait is a close, warm seated companion vignette with pipe smoke and a quiet fantasy-study mood; top-left hearth fire amber, top-right rainy window blue-green, bottom-left road-at-dusk ochre, bottom-right starlight midnight blue
Subject: four different original wise grey-robed wizard-like companions, old beards, broad hats or hoods, kind watchful presence, each clearly distinct in pose and mood, no recognizable actor likeness and not copied from any film
Style/medium: painterly digital illustration, rich texture, cinematic but cozy, refined UI asset quality
Composition/framing: perfectly square image divided into four equal square portraits with clean gutters; each portrait centered, readable at small card size, no text anywhere
Lighting/mood: meditative, slow, inviting, pipe smoke curls, gentle color differences per quadrant
Color palette: amber hearth, rain blue-green, road brass/ochre, starlight indigo/silver, balanced with deep charcoal and muted parchment
Constraints: no text, no logos, no watermark, no exact Gandalf/movie likeness, no recognizable actor, no copyrighted film still, no hard horror, no modern objects
```
