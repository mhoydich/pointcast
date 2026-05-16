# Room Contract (v1)

The JSON shape every PointCast room exports.

A **room** is a PointCast surface that:

- reads a small set of live status fields from elsewhere on the broadcast (mood, today's block, presence, now playing, ...)
- offers one or more "programs" the visitor can pick between (breath patterns, brew styles, drum registers, tide phases)
- exposes a small number of "verbs" the visitor or an agent can fire to mutate broadcast state (ring, sing, knock, cast, tap)
- renders identically in three places: a Claude artifact, a pointcast.xyz page, and an embed dropped into someone else's site

The contract was extracted from `/meditate.json` (the first informally-shaped room) so the renderer can be one piece of code reused by every future room.

See `src/lib/room-contract.ts` for the TypeScript types + runtime validator.

## Top-level shape

```jsonc
{
  "$schema": "https://pointcast.xyz/room-contract/v1.json",
  "id": "meditate",
  "title": "The meditation room",
  "description": "Pulled from /meditate on PointCast. Three breathing programs, one shared choir.",
  "home": "https://pointcast.xyz/meditate",
  "generatedAt": "2026-05-14T09:20:55-07:00",

  "archiveBlock": {
    "id": "0337",
    "url": "https://pointcast.xyz/b/0337",
    "jsonUrl": "https://pointcast.xyz/b/0337.json"
  },

  "status": [
    { "id": "mood",        "label": "MOOD",                "value": "pot on" },
    { "id": "today-block", "label": "TODAY'S BLOCK",       "value": "We Don't Care · tap-on-beat",
      "source": "https://pointcast.xyz/today.json" },
    { "id": "presence",    "label": "PRESENT ON POINTCAST","value": "1 humans · 0 agents",
      "source": "https://pointcast.xyz/presence.json?room=meditate" },
    { "id": "now-playing", "label": "NOW PLAYING",         "value": "silent",
      "source": "https://pointcast.xyz/drum-v6.json?field=playing" }
  ],

  "visualizer": { "type": "breath", "binding": "pattern" },

  "programs": [
    {
      "id": "calm",
      "name": "Calm Bay",
      "pattern": [4, 2, 6, 2],
      "tone": "soft shoreline",
      "purpose": "Quick nervous-system reset between blocks, calls, and shipping.",
      "prompts": [
        "Let the inhale rise like a small wave.",
        "Rest at the crest without gripping.",
        "Exhale as the tide rolls back out."
      ]
    }
  ],

  "controls": [
    {
      "id": "duration",
      "type": "duration",
      "defaultId": "5m",
      "options": [
        { "id": "2m",  "label": "2 min",  "value": 120, "name": "Morning tide" },
        { "id": "5m",  "label": "5 min",  "value": 300, "name": "Deep reset" },
        { "id": "10m", "label": "10 min", "value": 600, "name": "Full drift" }
      ]
    }
  ],

  "verbs": [
    {
      "id": "sing",
      "label": "Ring the room",
      "description": "Adds one harmonic voice (Cmaj9) to the global PointCast choir.",
      "method": "POST",
      "endpoint": "https://pointcast.xyz/drum-v6/sing",
      "payload": { "voice": "alt-c", "from": "meditate" },
      "receipt": { "template": "you sang {arg} into {target} · {time}" }
    }
  ],

  "presence": {
    "source": "https://pointcast.xyz/presence.json?room=meditate",
    "showHumans": true,
    "showAgents": true
  },

  "sources": [
    { "label": "breath patterns from /meditate.json", "url": "https://pointcast.xyz/meditate.json" },
    { "label": "choir surface /drum-v6",              "url": "https://pointcast.xyz/drum-v6" },
    { "label": "ambient strip from /today & /now",    "url": "https://pointcast.xyz/today" }
  ],

  "related": [
    { "label": "Nature field guide", "url": "https://pointcast.xyz/nature" },
    { "label": "Blocks JSON",        "url": "https://pointcast.xyz/blocks.json" }
  ],

  "artifact": {
    "name": "Breathe El Segundo",
    "image": "https://pointcast.xyz/images/tokens/breathe-el-segundo.webp"
  }
}
```

## Field-by-field

### Identity

- **`$schema`** — pointer to the contract version. Always `https://pointcast.xyz/room-contract/v1.json` for v1.
- **`id`** — slug, used as the primary identifier. Lowercase, no spaces.
- **`title`** — display title shown at the top of the room.
- **`description`** — one sentence under the title.
- **`home`** — canonical URL of this room on the originating node. Federated consumers use this for the "open at source" link.
- **`generatedAt`** — ISO timestamp. Consumers compare to detect staleness.
- **`archiveBlock`** *(optional)* — link to the broadcast block this room was born from.

### `status` — top-of-room badge strip

Each status badge is a `{ id, label, value, source? }` tuple. The renderer draws them as four (or however many) horizontal cards across the top of the room — like the chyron in the meditation artifact:

```
MOOD          TODAY'S BLOCK             PRESENT ON POINTCAST    NOW PLAYING
pot on        We Don't Care · tap…      1 humans · 0 agents     silent
```

`source` is optional. When present, the embed/artifact polls it for live re-reads; the SSR page renders the snapshot value baked in.

### `visualizer` — the centerpiece

Picks the interactive element rendered between the description and the program selector. Types:

| `type`     | What it renders                                          | Used by              |
|------------|----------------------------------------------------------|----------------------|
| `breath`   | Pulsing sphere driven by active program's pattern        | `/meditate`          |
| `pour`     | Kettle/pour visual driven by duration controls           | `/coffee`, `/kettle` |
| `tap`      | Percussive disc (clickable)                              | `/drum-*`            |
| `wave`     | Flat woodblock horizon driven by a tide source           | `/sunset`, `/window` |
| `lantern`  | Single hanging lamp; brightness tracks an intensity ctrl | `/lobby`, `/booth`   |

`binding` names the Program field that drives the visual (`pattern` for breath, `pattern[0]` for pour, etc.).

### `programs` — what the visitor picks between

At least one. Selected program drives the visualizer + the caption shown below it.

`pattern`'s meaning depends on visualizer.type. For breath it's `[inhale, hold, exhale, hold]` seconds. For pour it might be `[grams, seconds]`. For tap, `[bpm, beats]`. Document per-visualizer when the contract gets a new type.

`prompts` is the editorial rotation shown under the visualizer during a session — one phrase at a time, cycled.

### `controls` — interactive controls

Per-room buttons/sliders. The renderer special-cases `type: 'duration'` (always renders as a horizontal segmented control); other types are generic.

### `verbs` — write-back actions

Each verb becomes a button. When clicked, the renderer:

1. Fires `method` request to `endpoint` with `payload` (POST body or GET query).
2. On success, renders `receipt.template` to the visitor with these tokens interpolated:
   - `{actor}` — current visitor handle (or "you" if anonymous)
   - `{action}` — `verb.id`
   - `{arg}` — `payload`'s first value if it's a simple type
   - `{target}` — `endpoint` minus scheme + host
   - `{time}` — current local time, `HH:MM:SS`

Use `renderReceipt(template, ctx)` from `room-contract.ts` to do the interpolation.

### `presence`

How the "X humans · Y agents" line at the top is sourced. The source URL is expected to return `{ humans: number, agents: number, total?: number }`.

### `sources` + `related`

`sources` renders as the italicized attribution strip at the foot of the room (the "breath patterns from /meditate.json · choir surface /drum-v6 · ambient strip from /today & /now" line).

`related` renders as nav links out of the room.

### `artifact`

The visual identity card — used by the rooms index, embed previews, and the future art-exchange marketplace.

## Versioning

Contract version is `v1`. Breaking changes bump to v2 and live at `room-contract/v2.json`. Both versions render side-by-side during a deprecation window; the renderer reads `$schema` to know which validator + which template to apply.

## Validation

`validateRoomSpec(value)` in `src/lib/room-contract.ts` is a lightweight runtime check. It throws on the first violation with a path. Use it in:

- `/foo.json.ts` endpoints — validate at build time so a malformed room fails the build
- Federation consumer code — validate when fetching a remote room before rendering
- The configurator (Sprint 5) — validate as the visitor fills the form

## What's next

- **Sprint 2** — make `/meditate` and `/meditate.json` conform to the contract verbatim and refactor the page to render off the spec.
- **Sprint 5** — build `/room-maker` as a form that outputs a valid `RoomSpec`.
- **Sprint 7** — addable live artifacts are not full rooms, but they reference a parent room via `roomId` matching `RoomSpec.id`.
