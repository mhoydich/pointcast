# Codex · codex-05 · Nostr RFC-style post

**Priority:** fifth. Inputs to manus-04 (Nostr community cross-post).

## The ask

Draft a technical RFC-style post: "Nostr-federated reading lists via kind-30078." Target audience: Nostr protocol developers + client authors. Publishable to `njump.me`, `notes.fiatjaf.com`-style, or submitted as a NIP draft to the nostr-protocol repo.

## Why this specific post

Sparrow's federation layer uses kind-30078 (NIP-78 "arbitrary app data") with three distinct d-tags:

1. `sparrow-reader-state-v1` — full reader state, NIP-44 self-encrypted, for cross-device sync.
2. `sparrow-public-saved-v1` — public reading list, unencrypted, for federation.
3. `sparrow-presence` (kind-20078 ephemeral, tag not d) — "I'm here reading right now."

Nobody else is using NIP-78 this way. The Nostr community will engage with a well-written explanation because it maps a new pattern to existing primitives without proposing a new kind number.

## Post structure

Target length: 1000-1500 words. Markdown.

### 1. Problem

One paragraph: reading lists are trapped inside each reader app. Feed readers export OPML; social readers don't. Cross-client state is a proprietary mess.

### 2. The observation

One paragraph: NIP-78 already gives us a way for apps to stash arbitrary addressable data under a `d-tag`. What if the `d-tag` is itself a protocol, not just an app identifier? Different `d-tag`s = different public contracts.

### 3. Three concrete uses in Sparrow

For each of the three schemas above, show:

- The full payload shape (JSON with inline comments).
- An example signed event (dummy data, ≤ 50 lines).
- The contract consumers need to honor (newest-`created_at`-wins, scope guarantees, what's NOT in the payload).

### 4. Why this works

- kind-30078 is addressable; replaceable; relays cooperate.
- d-tags scope the schema per-protocol, not per-app. Any client can speak sparrow-public-saved-v1.
- Encryption is a per-schema decision, not a layer above. NIP-44 to self = private; no encryption = public; encryption to a recipient = direct message.
- Presence is a separate discipline — ephemeral kinds (20000-29999) avoid persistence overhead.

### 5. Open questions (invite feedback)

- Should this become a NIP? If yes, pro: reserved d-tag namespace. Con: slows iteration. Lean toward "no NIP for now, document the d-tags in `/sparrow/federation.json` and invite forks."
- Relay hint tag pattern for cross-client discovery.
- Deletion semantics (kind-5 e-tags work but are per-event; does that matter for replaceable events?).
- Compatibility with kind-10003 (bookmark list) — Sparrow deliberately doesn't use it because 10003 forces a single list per user; our scheme supports n lists via d-tag variation.

### 6. Links

- `https://pointcast.xyz/sparrow/federation.json`
- `https://pointcast.xyz/sparrow.json#nostr`
- `https://pointcast.xyz/federation-llms.txt` (once codex-04 ships it)
- GitHub repo for the reader.

## Voice

- Precise. No marketing. No "we think the Nostr community might benefit from …"
- Short paragraphs. Direct claims.
- Code is first-class. Prose explains code, not the other way around.
- Don't oversell. The interesting-ness is in the pattern, not in Sparrow's implementation.

## Deliverables

1. `docs/rfc/2026-04-22-nostr-reading-list-via-kind-30078.md`
2. An nJump-friendly short version (≤ 500 words) at `docs/outreach/2026-04-22-nostr-rfc-short.md` for the relay-broadcast companion.
3. One JSON sample file per schema in `docs/rfc/examples/` so consumers can see full event shapes.

## Done when

- A Nostr client author reading the long version understands the pattern in 5 minutes.
- At least one open question feels genuine, not rhetorical.
- Update `docs/plans/2026-04-22-10-assignments.md` row for codex-05.
