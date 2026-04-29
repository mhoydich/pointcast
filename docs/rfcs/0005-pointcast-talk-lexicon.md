# RFC 0005 · `xyz.pointcast.talk` Lexicon

**Status:** sketch · Phase 0 spike companion · not committed
**Author:** cc · **Filed:** 2026-04-29
**Related:** [RFC 0004 — Block Lexicon](./0004-pointcast-block-lexicon.md), [Day 4 round-trip drift findings](../notes/2026-04-29-roundtrip-drift-findings.md)

## Goal

Define a separate AT Protocol Lexicon for **Voice Dispatches** — TALK-type
blocks that carry audio-first content. Splitting from `xyz.pointcast.block`
because the shape is genuinely distinct: audio source, duration, optional
transcript, ephemeral quotas.

This is a sketch — Phase 0 companion to RFC 0004. Decision to commit
lives at end of Sprint 5.

## Why a separate Lexicon

In RFC 0004 §6 I listed Talk Blocks as a separate-Lexicon candidate. After
Day 2's converter spike and Day 4's round-trip findings, that holds:

1. **Audio-first is its own viewing surface.** TALK blocks render at
   `/talk/{id}` with a player UI, not the standard block reader. Different
   surface = different shape = different Lexicon.
2. **Audio metadata is rich.** Duration, transcript, mime-type, encoding,
   peak-amplitude waveform points — none of these belong in
   `xyz.pointcast.block`.
3. **Quota model differs.** TALK blocks have ephemerality (intended decay)
   that READ blocks don't. Wire shape should reflect the lifecycle.
4. **Clean federation story.** A node that wants to subscribe to
   `xyz.pointcast.talk` but skip `xyz.pointcast.block` — or vice versa —
   should be able to. Same Lexicon means coupled subscription.

## Lexicon sketch

```json
{
  "lexicon": 1,
  "id": "xyz.pointcast.talk",
  "defs": {
    "main": {
      "type": "record",
      "description": "A Voice Dispatch — audio-first PointCast content",
      "key": "literal:self",
      "record": {
        "type": "object",
        "required": ["id", "title", "audio", "timestamp", "createdAt"],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 4,
            "maxLength": 8,
            "description": "Same numbering convention as Block ids"
          },
          "title": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "dek": {
            "type": "string",
            "maxLength": 400,
            "description": "Optional standfirst, mostly used for indexing"
          },
          "transcript": {
            "type": "string",
            "maxLength": 50000,
            "description": "Optional transcript. Whisper-tier accuracy assumed; corrections allowed."
          },
          "audio": {
            "type": "ref",
            "ref": "#audioSource"
          },
          "timestamp": {
            "type": "string",
            "format": "datetime",
            "description": "When the dispatch was recorded"
          },
          "createdAt": {
            "type": "string",
            "format": "datetime",
            "description": "AT convention — when the record was signed"
          },
          "author": {
            "type": "string",
            "knownValues": ["mike", "cc", "codex", "manus", "chatgpt"]
          },
          "mood": {
            "type": "string",
            "maxLength": 40
          },
          "ephemeral": {
            "type": "boolean",
            "description": "If true, surface should hide the dispatch after expiresAt; record itself is kept on the wire for traceability."
          },
          "expiresAt": {
            "type": "string",
            "format": "datetime",
            "description": "Optional expiry hint — surface decision, not protocol enforcement"
          },
          "companions": {
            "type": "array",
            "maxLength": 8,
            "items": { "type": "ref", "ref": "#companion" }
          },
          "meta": {
            "type": "object",
            "properties": {
              "location":  { "type": "string", "maxLength": 100 },
              "station":   { "type": "string", "maxLength": 60 },
              "series":    { "type": "string", "maxLength": 80 },
              "topics":    { "type": "string", "maxLength": 400 }
            }
          }
        }
      }
    },
    "audioSource": {
      "type": "object",
      "required": ["src", "mimeType", "durationSeconds"],
      "properties": {
        "src": {
          "type": "string",
          "format": "uri",
          "maxLength": 500,
          "description": "Public URL or at:// blob reference"
        },
        "ipfsFallback": {
          "type": "string",
          "format": "uri",
          "maxLength": 500
        },
        "mimeType": {
          "type": "string",
          "knownValues": ["audio/mpeg", "audio/ogg", "audio/wav", "audio/webm"],
          "maxLength": 60
        },
        "durationSeconds": {
          "type": "number",
          "minimum": 0,
          "maximum": 7200
        },
        "peakSampleCount": {
          "type": "integer",
          "minimum": 0,
          "maximum": 4000,
          "description": "Length of optional waveform peak array"
        },
        "peakSamples": {
          "type": "array",
          "maxLength": 4000,
          "items": { "type": "number", "minimum": 0, "maximum": 1 },
          "description": "Optional pre-computed amplitude peaks for waveform UI"
        }
      }
    },
    "companion": {
      "type": "object",
      "required": ["id", "label"],
      "properties": {
        "id":      { "type": "string", "maxLength": 200 },
        "label":   { "type": "string", "maxLength": 80 },
        "surface": { "type": "string", "knownValues": ["yee", "poll", "clock", "block", "talk", "external", "atproto"] }
      }
    }
  }
}
```

## Field-by-field rationale

| Field | Notes |
|---|---|
| `id` | Same numbering as Block. Ids are unique across `(did, collection, rkey)`; collection differs, so a Talk-0207 and a Block-0207 don't collide. |
| `audio` | The whole point of the type. Required ref. Carries duration so a feed reader can render runtime without fetching. |
| `transcript` | Optional. When present, search/index can hit it. Captioning surface uses it. |
| `ephemeral` + `expiresAt` | A surface signal, not protocol enforcement. The record stays on the wire; the viewing UI honors expiry. |
| `mood` | Same as `xyz.pointcast.block`. Audio dispatches carry mood. |
| `companions[].surface` | Adds `'talk'` known value so Block ↔ Talk cross-references survive. |

## Open questions

### 1. Where does the audio actually live?

Three options:

a) **Public CDN URL.** Same as today. No change to host model.
b) **AT Protocol blob.** Reference via `at://{did}/blob/{cid}`. Federation-native but requires a blob store on each node.
c) **IPFS via `ipfsFallback`.** As we already do for some block media.

I'd start with (a) on the wire, ship (c) as fallback, deprecate Phase 1+ → (b) once nodes can run a blob store.

### 2. Quota / decay

How many Talks per author per day? Current PointCast convention isn't
explicit. Federation-side, this is up to each node. Recommend documenting
"surface-level quota" as out of scope for the Lexicon.

### 3. Cross-referencing between TALK and BLOCK

A Block can companion to a Talk and vice versa. The string `id` field
on companions is already polymorphic (block id, URL, AT-URI). Adding
`talk` as a known surface value makes that explicit.

### 4. Collaborative dispatches

Some Talks have multiple speakers. The single `author` field doesn't
capture that. Same answer as RFC 0004 §2 — add a `coauthors` array.
Cheap to add when we promote the RFC.

## Phase 0 outcome

This RFC + RFC 0004 + the converter spike + the round-trip CLI form a
complete Phase 0 picture. Sprint 5 decision point covers both.

If Phase 1 is committed:
- `xyz.pointcast.block` covers READ / LISTEN / WATCH / MINT / FAUCET / NOTE / VISIT / LINK / BIRTHDAY
- `xyz.pointcast.talk` covers TALK
- A separate `xyz.pointcast.edition` (RFC 0006, future) covers MINT edition refs

## Out of scope for this RFC

- Birthday Lexicon (separate, RFC 0007 if/when promoted)
- Edition Lexicon (separate, RFC 0006 if/when promoted)
- Audio blob storage protocol (Phase 1+)
- Real-time TALK firehose / live broadcast (Phase 2+)

— cc, 2026-04-29, El Segundo
