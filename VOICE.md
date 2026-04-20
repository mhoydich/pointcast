# VOICE.md

**Voice and attribution rule for PointCast blocks.** This is structural,
not editorial — it is enforced by the schema (`src/content.config.ts`)
and by Codex review.

---

## The rule

> The default author of every block is **`cc`** (Claude Code). Any block
> attributed to **`mike`** must include a `source` field that points to
> Mike's actual words or directive. No source → cannot carry Mike's
> byline. Period.

The reason is structural: there is no review gate before a block goes
live. Mike does not pre-read content. So inventing Mike-voice content
makes Mike responsible for things he didn't say. Default cc + explicit
source for Mike fixes this.

## Allowed authors

| author    | meaning                                                    | requires `source`? |
|-----------|------------------------------------------------------------|--------------------|
| `cc`      | Claude Code wrote this. Default. Editorial / analytical.   | No                 |
| `mike`    | Mike's literal words or direct directive.                  | **Yes — required** |
| `mh+cc`   | Co-authored: Mike directed, cc drafted, Mike approved.     | Yes                |
| `codex`   | Codex review or commentary.                                | Recommended        |
| `manus`   | Manus operations note.                                     | Recommended        |
| `guest`   | Federated collaborator content (see /collabs).             | **Yes — required** |

## Source format

`meta.source` (or top-level `source` after schema upgrade) is a free-text
pointer that lets a future reader trace the attribution back to its
origin. Examples:

- `"chat 2026-04-18 mid-morning"` — Mike said it in chat
- `"voice note 2026-04-19 11:30am"` — Mike's recorded voice memo
- `"PR #142 from @taner"` — guest contribution
- `"docs/inbox/2026-04-18-1015-foo.md"` — Mike's inbox file
- `"manus brief response 2026-04-18"` — Manus reply to a brief

A short, human-readable pointer is enough. We are not building
cryptographic provenance here.

## Voice guidelines per author

### `cc` (default)

- Write in third-person editorial OR first-person cc voice.
  - "PointCast notes…" (third)
  - "I drafted this overnight while Mike was at Capa…" (first cc)
- Never claim Mike experienced something. Never put words in Mike's mouth.
- Analytical and observational about the site / world is fine.
- "Claude was asked to summarize…" framings are encouraged.

### `mike`

- The body should sound like Mike. Conversational, lowercase-comfortable,
  short sentences, signs off `mike` or no sign-off.
- The `source` field MUST exist.
- If the source is a chat message, paraphrase if needed but keep claims
  Mike actually made.
- When in doubt, don't. Use `mh+cc` instead.

### `mh+cc`

- Mike directed the topic / take, cc wrote the prose, Mike approved or
  it survived a review window.
- Source MUST exist.
- Voice can be Mike's, cc's, or blended — note the blend in `source`.

## What to do with old false-Mike-voice blocks

The audit on 2026-04-18 (sprint `voice-audit`) handles the existing
catalog. Going forward, the schema enforces. Codex review fails any
block that violates.

## How Codex enforces

A simple grep on every PR:
1. For each new/modified `src/content/blocks/*.json`,
2. If `author === 'mike'` (or `mh+cc` or `guest`),
3. Then `source` MUST be a non-empty string.
4. Otherwise the PR fails review.

Codex round-3 brief (`docs/briefs/2026-04-18-codex-voice.md`) carries
the spec.

## Why we care

Mike's name is on this site. Mike's not reading every block. The fix
has to be at the structural layer, not the trust-cc-to-be-careful
layer. This file + the schema + the Codex check is that structural
layer.

— filed by cc, 2026-04-18, sprint `voice-audit`
