# RFC 0004 · `xyz.pointcast.block` Lexicon

**Status:** sketch · Phase 0 spike · not committed
**Author:** cc · **Filed:** 2026-04-28
**Related:** [`docs/notes/2026-04-28-p2p-direction.md`](../notes/2026-04-28-p2p-direction.md)

## Goal

Define an AT Protocol Lexicon that maps the existing PointCast Block schema to the AT Protocol record shape so each PointCast node can be a PDS-equivalent, signing and federating its own Blocks.

This RFC is **a sketch**. Phase 0 of the layered p2p direction. No commitment to migrate `/blocks.json` to AT Protocol — the goal is to learn whether the mapping fits cleanly and what the open questions are.

## Background

Today every PointCast node has a single source of truth at `/blocks.json` — a build-time-emitted JSON manifest of all Blocks. New Blocks land as `src/content/blocks/{NNNN}.json` files in this repo, schema-validated by Astro Content Collections.

In the layered p2p direction, each node becomes a PDS — a Personal Data Server in AT Protocol terms — that signs and serves a repo of records. A `xyz.pointcast.block` Lexicon defines what a Block record looks like on the wire so other nodes can replicate via the firehose.

## Lexicon sketch

```json
{
  "lexicon": 1,
  "id": "xyz.pointcast.block",
  "defs": {
    "main": {
      "type": "record",
      "description": "A PointCast Block — a numbered, dated, channel-tagged content unit",
      "key": "literal:self",
      "record": {
        "type": "object",
        "required": ["id", "channel", "type", "title", "timestamp", "createdAt"],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 4,
            "maxLength": 8,
            "description": "Zero-padded numeric block id, e.g. '0381'"
          },
          "channel": {
            "type": "string",
            "knownValues": ["FD", "SPN", "TLK", "MKT", "SHE", "VST", "EDU", "SHP", "PNG"],
            "description": "Channel code"
          },
          "type": {
            "type": "string",
            "knownValues": ["READ", "LISTEN", "WATCH", "MINT", "FAUCET", "NOTE", "VISIT", "LINK", "TALK", "BIRTHDAY"],
            "description": "Block content type — drives surface routing"
          },
          "title": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "dek": {
            "type": "string",
            "maxLength": 400,
            "description": "Subhead / standfirst, 1-2 sentences"
          },
          "body": {
            "type": "string",
            "maxLength": 30000,
            "description": "Markdown-flavored body text"
          },
          "timestamp": {
            "type": "string",
            "format": "datetime",
            "description": "When this Block represents (its 'aboutness time')"
          },
          "createdAt": {
            "type": "string",
            "format": "datetime",
            "description": "When the record was authored (AT Protocol convention)"
          },
          "size": {
            "type": "string",
            "knownValues": ["1x1", "2x1", "1x2", "2x2"],
            "description": "Home-grid layout size"
          },
          "noun": {
            "type": "integer",
            "minimum": 0,
            "maximum": 99999,
            "description": "Associated Noun id (noun.pics)"
          },
          "readingTime": {
            "type": "string",
            "maxLength": 20,
            "description": "Free-form reading time hint, e.g. '4 min'"
          },
          "author": {
            "type": "string",
            "knownValues": ["mike", "cc", "codex", "manus", "chatgpt"],
            "description": "Authoring agent or human"
          },
          "source": {
            "type": "string",
            "maxLength": 1000,
            "description": "Provenance note — what prompted this block"
          },
          "mood": {
            "type": "string",
            "maxLength": 40,
            "description": "Mood tag (e.g. 'marine-layer', 'rainy-week')"
          },
          "external": {
            "type": "ref",
            "ref": "#externalLink"
          },
          "media": {
            "type": "ref",
            "ref": "#mediaEmbed"
          },
          "companions": {
            "type": "array",
            "maxLength": 8,
            "items": { "type": "ref", "ref": "#companion" }
          },
          "meta": {
            "type": "object",
            "description": "Free-form metadata blob — location, station, series, topics, status",
            "properties": {
              "location":   { "type": "string", "maxLength": 100 },
              "station":    { "type": "string", "maxLength": 60 },
              "series":     { "type": "string", "maxLength": 80 },
              "topics":     { "type": "string", "maxLength": 400 },
              "status":     { "type": "string", "knownValues": ["draft", "published", "archived"] }
            }
          }
        }
      }
    },
    "externalLink": {
      "type": "object",
      "required": ["url", "label"],
      "properties": {
        "url":   { "type": "string", "format": "uri", "maxLength": 500 },
        "label": { "type": "string", "maxLength": 80 }
      }
    },
    "mediaEmbed": {
      "type": "object",
      "required": ["kind"],
      "properties": {
        "kind":      { "type": "string", "knownValues": ["embed", "image", "video", "audio"] },
        "src":       { "type": "string", "format": "uri", "maxLength": 500 },
        "thumbnail": { "type": "string", "format": "uri", "maxLength": 500 }
      }
    },
    "companion": {
      "type": "object",
      "required": ["id", "label"],
      "properties": {
        "id":      { "type": "string", "maxLength": 200, "description": "Either a block id, a poll slug, an external URL, or an at:// AT-URI" },
        "label":   { "type": "string", "maxLength": 80 },
        "surface": { "type": "string", "knownValues": ["yee", "poll", "clock", "block", "external", "atproto"] }
      }
    }
  }
}
```

## Field-by-field mapping

Existing Block (`src/content.config.ts`) → `xyz.pointcast.block` record:

| Block field | Lexicon field | Notes / drift |
|---|---|---|
| `id` (string, "0381") | `id` (literal-key record + body field) | AT records identified by `at://{did}/{collection}/{rkey}`. Use the block id as `rkey` ("0381"). Body keeps `id` for ergonomics. |
| `channel` | `channel` | Direct mapping. Lexicon `knownValues` are open-ended (AT Protocol allows unknown values + adapters). |
| `type` | `type` | Direct mapping. |
| `title` | `title` | Direct. |
| `dek` | `dek` | Direct. |
| `body` | `body` | Direct. Some Blocks contain HTML in body (`<a>` tags) — keep in Lexicon, document as Markdown-flavored. |
| `timestamp` | `timestamp` | Direct. |
| (none) | `createdAt` | **NEW.** AT Protocol convention — when the record was signed. For backfilled blocks, use the original `timestamp`. |
| `size` | `size` | Direct (1x1, 2x1, etc.). |
| `noun` | `noun` | Direct integer. |
| `readingTime` | `readingTime` | Direct. |
| `author` | `author` | Direct. Lexicon `knownValues` enumerate the active agent set. |
| `source` | `source` | Direct provenance string. |
| `mood` | `mood` | Direct. |
| `external` | `external` (ref) | Direct ref shape. |
| `media` | `media` (ref) | Direct. |
| `companions[].id` (string, can be block id or URL) | `companions[].id` (string) | **Drift point.** Block companion ids are sometimes block ids ("0339"), sometimes external URLs ("https://..."), sometimes Yee tokens. Lexicon companion id field stays open-string but adds `at://` AT-URI as a recognized form alongside. |
| `companions[].surface` | `companions[].surface` | Adds `'atproto'` known value for at-URI companions. |
| `meta.{location,station,series,topics,status}` | `meta.{...}` | Direct nested object. |

## Open questions

### 1. Cross-node block-id collision

Today Block ids are globally unique inside a single repo (numeric sequence). With multiple nodes, two nodes could both mint Block 0382 simultaneously. Two answers:

**a)** AT records are addressed by `(did, collection, rkey)` — collision is impossible across nodes because the DID prefix differs. The body `id` field becomes a per-node sequence, and surfaces show `did:plc:abc123/0382` when displaying cross-node blocks. *Likely pick.*

**b)** Centralized id minter. Defeats the point of federation.

### 2. Provenance / co-authorship

Today some Blocks are co-authored (`Co-Authored-By: Codex` etc. in commit trailers). Lexicon doesn't have a co-author array. Options:

**a)** Add `coauthors: array of agent names` to Lexicon.
**b)** Carry co-authorship in the `source` string (lossy, current approach).

I'd add a `coauthors` array. Cheap to add, lossless.

### 3. Updates and revisions

AT Protocol records are mutable — you can `applyWrites` with `update` or `delete`. Today PointCast Blocks are append-only — once published, they don't get edited. We could either:

**a)** Treat Blocks as immutable in this Lexicon. Use `delete` only for retraction. Any "edit" is a new record with a new rkey.
**b)** Allow `update`. More flexible, less editorial discipline.

I'd start with (a). PointCast's editorial pattern is "land it, link to it, move on" — mutability invites churn.

### 4. The `companions[].id` polymorphism

Today: a string that's either a block id ("0339"), URL ("https://..."), or Yee token id. The `surface` field disambiguates. In a federated world, a fourth shape is `at://did:plc:.../xyz.pointcast.block/0382` — an AT-URI to another node's block.

The Lexicon allows this as-is (string + surface), but the validator should warn when `surface: 'block'` is paired with an at-URI (mismatch).

### 5. Birthday Blocks have a separate richer schema

Block 0366 + future birthdays use a `birthdays` schema (recipient_slug, recipient_name, noun_id, birthday_year, etc.) that lives in `contracts.json` rather than the block itself. Two paths:

**a)** A separate Lexicon `xyz.pointcast.birthday` for these blocks.
**b)** Embed the birthday-specific fields inside the existing `meta` blob.

Path (a) is cleaner — birthdays carry enough distinct shape (recipient identity, on-chain token id) that they want their own type.

### 6. Talk Blocks (Voice Dispatches)

Voice Dispatches are TALK-type blocks with audio media + duration. They're distinct enough (audio-first, ephemeral, time-boxed) that they could either:

**a)** Be a `xyz.pointcast.talk` Lexicon — separate type, audio-specific fields.
**b)** Stay in `xyz.pointcast.block` with `type: 'TALK'` and audio media.

Would lean (a) for the same reason as birthdays — audio-first content has its own viewing surface (`/talk`), its own metadata (duration, transcript), and its own quota model.

## Phase 0 outcomes

By end of Day 4:

- This RFC + the converter script (Day 2) + the round-trip demo (Day 4) form a complete spike
- Decision point: **commit Phase 1** (dual-publish in `/blocks.json` AND a PDS-shaped repo) or **shelve federation** (the spike informed us; the cost isn't worth the benefit yet)

The decision lives at `docs/notes/2026-05-02-sprint-next-direction.md` and is for Mike to make.

---

## Out of scope for this RFC

- Identity model (1 user = 1 DID vs. 1 node = 1 DID) — Phase 1 question
- Firehose subscription patterns — Phase 1
- Cross-Lexicon types (`xyz.pointcast.poll`, `xyz.pointcast.race`, etc.) — separate RFCs
- Migration script for existing 380+ blocks — Phase 1+

— cc, 2026-04-28, El Segundo
