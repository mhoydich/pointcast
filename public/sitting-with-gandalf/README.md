# Sitting with Gandalf

A self-contained fantasy smoking and meditation companion for a quiet pause: timer, cozy visuals, ambient fire/rain/road/starlight audio, an optional "Myth" listen-along, original wizardly and nature prompts, lantern view, phase guidance, and a small local session log.

Open `index.html` in a browser. The page has no build step and references only local files.

## Versions

The app defaults to V5, with a V1/V2/V3/V4/V5 toggle in the masthead. The selected version is saved locally after the V5 release is seen once.

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

### V3

- Nature-first meditation room.
- Adds a generated 2x2 nature visual sheet with no Gandalf, people, pipes, or smoking objects: Moss glade, Rain garden, Meadow path, and Moon lake.
- Keeps V1 and V2 available from the version toggle.
- Adds a nature visual selector that also syncs the best matching ambience sound.
- Adds intention controls: Rest, Ground, Wander, and Sleep.
- Adds sensory cue buttons: Look, Listen, Breathe, and Release.
- Logs V3 notes with the selected nature view and intention.
- Keeps the same timer, ambience, focus view, notes, and local storage behavior.

### V4

- Pixel campfire release.
- Keeps V1, V2, and V3 available from the version toggle.
- Adds a generated pixel-art 2x2 nature sheet for Moss glade, Rain garden, Meadow path, and Moon lake.
- Uses the version switch as the single release control: V3 snaps to Storybook and V4 snaps to Pixel when selected.
- Adds blockier V4 UI polish: squared controls, pixelated background/thumbs, subtle grid texture, and monospace timer treatment.
- Migrates prior local settings to V4 once, then saves whichever version the visitor chooses next.

### V5

- Defaults to the collectible Nouns Gandalf deck, now shaped as a V5 collect-v2 ritual loop.
- Adds 30 tiny Gandalf companion cards, each with a noun, visual mood, room, intention, mantra, breath cue, and original wizard line.
- Adds 12 pocket keepsakes that pair with pulled cards, sit completions, and the presence tally.
- Adds a Gandalf resource sharpener with Focus, Patience, Warmth, Wonder, Courage, and Ease.
- Adds a tiny spell-building game: pair the active Gandalf with a keepsake, sharpen a resource, build a spell, and keep it in a local spellbook.
- Adds a V5 listen-along card for "Myth" by Beach House with a direct Spotify link and a Myth mode that tunes the room to Moon lake, Stars, Wander, and Wonder.
- Adds five V5 rituals: Enjoy, Meditate, Pipe, Beer, and Study.
- Makes the first action clearer: choose a sit, pull a Gandalf, pair a keepsake, sharpen a resource, build a spell, then begin a 5-minute sit.
- Reframes the local tally as a presence score and rank derived from kept cards, keepsakes, sharpened resources, kept spells, saved sits, minutes, and cues.
- Bumps the local settings release so returning V5 visitors land on the new Myth/spell-building pass once without losing their kept card or keepsake collection.
- Keeps V1, V2, V3, and V4 available from the version toggle.
- Stores the local collection in `localStorage` under `sitting-with-gandalf-nouns-collection`.
- Stores the pocket keepsakes in `localStorage` under `sitting-with-gandalf-keepsake-collection`.
- Stores sharpened resources and kept spells under `sitting-with-gandalf-resource-levels` and `sitting-with-gandalf-spellbook`.
- Logs V5 notes with the active ritual, card, keepsake, resource, spell, view, intention, and pixel style.

## V6 Notes

- Audio mixer: separate Fire, Weather, Road, Bells, and Drone levels instead of one master ambience slider.
- Companion memory: remember preferred Gandalf, nature view, room, duration, and last note without making the UI busier.
- Visual focus table: closer nature crops and a calmer timer-only view for longer sits.
- Collection rituals: daily card, gentle streaks, and exportable keepsake sheet.

## Assets

The backdrop was generated with the built-in image generation tool and copied into `assets/wizard-study.png`.

The companion portrait sheet was generated with the built-in image generation tool and copied into `assets/wizard-companions.jpg`.

The V3 nature visual sheet was generated with the built-in image generation tool and copied into `assets/nature-visuals-v3.jpg`.

The V4 pixel visual sheet was generated with the built-in image generation tool and copied into `assets/nature-visuals-pixel-v4.png`.

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

V3 nature visual prompt:

```text
Use case: stylized-concept
Asset type: web app ambient background illustration sprite sheet for a cozy meditation companion
Primary request: create a 2x2 sheet of four super cozy, pleasing nature visuals with no person, no wizard, no characters, no pipe, and no smoking object visible
Scene/backdrop: four distinct calm fantasy-adjacent nature rooms: top-left mossy forest glade with warm lantern-like fireflies, top-right rainy cottage garden seen from under a porch roof, bottom-left sunlit meadow path with distant soft hills, bottom-right moonlit lakeside with reeds and stars reflected in water
Subject: nature itself as the companion; gentle places to rest attention, each quadrant readable as a separate scene
Style/medium: painterly digital illustration, rich texture, calm premium app background, cozy but not dark, tactile natural detail
Composition/framing: perfectly square 2x2 grid with clean gutters; each quadrant should work as a thumbnail and as a soft background crop; no text anywhere
Lighting/mood: meditative, quiet, warm, restorative, slow breathing energy; balanced contrast with soft negative space
Color palette: moss green, rain blue-green, meadow gold, moonlit indigo, natural amber highlights, muted cream, no harsh neon
Constraints: no text, no logos, no watermark, no people, no wizard, no recognizable copyrighted locations, no film still, no smoking object, no pipe, no modern objects, no horror
```

V4 pixel visual prompt:

```text
Use case: stylized-concept
Asset type: web app ambient background illustration sprite sheet for a cozy meditation companion
Primary request: a pixel-art visual style option for Sitting with Gandalf V4, matching the existing four nature scenes in a neat, fun, cozy way
Scene/backdrop: four distinct calm fantasy-adjacent nature rooms in a 2x2 sprite sheet: top-left mossy forest glade with warm firefly pixels, top-right rainy cottage garden seen from under a porch roof, bottom-left sunlit meadow path with soft distant hills, bottom-right moonlit lakeside with reeds and stars reflected in water
Subject: nature itself as the companion; tiny environmental details only, no people, no wizard, no characters, no pipe, no smoking object
Style/medium: high-quality pixel art, cozy 16-bit / 32-bit adventure-game mood, crisp blocky pixels, refined color clusters, premium app background asset
Composition/framing: perfectly square 2x2 grid with clean gutters; each quadrant readable as a separate scene, usable as a soft full-screen background crop and as thumbnails; no text anywhere
Lighting/mood: meditative, playful, restorative, warm, quiet, pleasing to stare at for a short sit
Color palette: moss green, rain blue-green, meadow gold, moonlit indigo, natural amber highlights, muted cream; gentle contrast, no harsh neon
Constraints: no text, no logos, no watermark, no people, no wizard, no recognizable copyrighted locations, no film still, no smoking object, no pipe, no modern objects, no horror
```
