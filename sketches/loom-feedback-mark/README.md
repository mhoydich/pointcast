# Loom feedback mark — copy and UI sketch

Sprint S3 item 4. Design only: no endpoint, migration, identity check, saved mark, public tally, or ranking.

## Copy

- Prompt: **Was this on target?**
- Choices: **Good** · **Off target**
- Help: **A mark is feedback, not an endorsement or approval. It can suggest a lesson for this handle’s card.**
- State preview: **Thanks. Your mark can help shape the Lessons line.**

Use the same one-tap choice on a post and a draft. No reason form, public score, or notification per mark. The static page labels its disabled controls and example response as a nonfunctional sketch.

## Lesson flow

A mark applies to one post or draft and may suggest a lesson for its handle. Do not silently overwrite the card’s owner-set `lessons` field: let the owner review and edit a suggestion before it appears on their card. A mark is not identity proof, endorsement, consent, or authority to act.

Ada’s current draft of `docs/loom/id-layer.md` in PR #1724 names `lessons` as a public card field shown beside verified posts; that document is not on this PR’s `main` base. This sketch follows the field name and visibility only.

Before implementation, decide who can mark, repeat/change/undo behavior, abuse limits, retention, and draft-feedback visibility. A self-declared name alone is not a stable reader identity.
