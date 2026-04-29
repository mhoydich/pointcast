# Sparrow as the front door — humans, their AIs, and the next browser

> Status: strategy + sprint plan
> Author: Claude Code (Mike's directive, 2026-04-29)
> Predecessors: `2026-04-24-sparrow-2026-2027-browser.md`, `2026-04-28-sparrow-hud.md`, `2026-04-28-sparrow-tv-mode.md`

## I · The question

Mike: "How do we plug ones subscriptions to AI in — make this a next-generation front door for humans and their AI, the next browser, think first principles, like inventing Netscape, a Mac, Atari, BBS for the first time."

Reframed:

1. Today's browser is a content viewer that doesn't know you have an AI relationship. You copy-paste between tabs.
2. Today's AI app is a content processor that doesn't know what content you have. It knows nothing of your reading list, your friends, your places.
3. The user is the proton in the middle, manually shuttling content. Every paste is a pasteboard tax.
4. The shape that wins is a surface that brokers (1) and (2) — a browser whose primary chrome **is** the relationship between user, content, and AIs. Not a chat sidebar bolted onto Chrome. A new front door.

## II · First principles

1. **The user owns the AI relationship, not the page.** Keys, prompts, sessions live with them. Portable. Mirror of what Nostr did for social identity.
2. **The browser is the broker.** Knows what you're reading × your AIs × your trusted humans. Combines via ⌘K affordances. No cuts. No lock-in.
3. **AI is many things, not one.** Text, image, audio, video, embeddings, agents, memory. Cartridges are *typed* — capabilities declared, not "talk to the AI."
4. **The relationship is paid.** Subscriptions are the user's contract. Cartridges represent that contract. Transparent cost estimates.
5. **Privacy default, federation opt-in.** One toggle to publish your cartridge list (names only). One toggle per artifact to share.
6. **Open formats over open SDKs.** `sparrow.cartridge` and `sparrow.manifest` JSON specs anyone can implement. No SDK to integrate. Like HTML, RSS, Nostr.

## III · The cartridge — the missing primitive

A small JSON object describing one of the user's AI subscriptions. NIP-44 encrypted at rest, portable, listable, revocable.

```jsonc
{
  "id": "claude-personal",
  "schema": "sparrow-cartridge-v1",
  "provider": "anthropic",
  "model": "claude-sonnet-4-5-20251020",
  "label": "Claude · personal",
  "color": "oklch(74% 0.16 72)",
  "glyph": "✦",
  "capabilities": ["text.complete", "text.chat", "text.tool_use", "image.understand"],
  "auth": {
    "method": "api_key",
    "header": "x-api-key",
    "endpoint": "https://api.anthropic.com/v1/messages",
    "key_ref": "sparrow:cartridges:keys:claude-personal"
  },
  "limits": { "context_tokens": 200000, "rate_per_min": 50, "cost_estimate_per_1k_input": 0.003, "cost_estimate_per_1k_output": 0.015 },
  "added_at": 1745923200,
  "shared": false
}
```

Cartridge object intentionally does NOT carry the API key — keys live separately under a NIP-44-encrypted localStorage entry. So a user can publish their cartridge list without leaking secrets.

### `sparrow.manifest` — pages declare AI affordances

```jsonc
{
  "@context": "https://pointcast.xyz/schemas/sparrow-manifest-v1",
  "id": "/sparrow/b/0235",
  "kind": "block",
  "capabilities": {
    "text.complete": { "context": "title+body", "max_input_tokens": 4000 },
    "text.chat": { "context": "title+body+saved", "max_input_tokens": 8000 },
    "image.understand": { "context": "screenshot" }
  },
  "affordances": [
    { "id": "summarize", "label": "Summarize this block", "capability": "text.complete" },
    { "id": "ask", "label": "Ask about this…", "capability": "text.chat" },
    { "id": "imagine", "label": "Make an image of this idea", "capability": "image.generate" }
  ]
}
```

Reader scans manifest, intersects with installed cartridges, offers affordances that match.

## IV · The five lanes

1. **Reading** (live) — what's on screen.
2. **Federation** (live) — friends, signals, ambient presence.
3. **Capability** (v0.41 first take) — the cartridges. New HUD slot — cartridge rack — sits next to federation pulse.
4. **Session** (v0.42+) — stateful conversation bound to (identity × cartridge × content anchor). Addressable: `/sparrow/s/<id>`.
5. **Artifact** (v0.43+) — single AI output. Addressable like blocks: `/sparrow/a/<id>`. Save-able, reactable, federate-able.

## V · The historical lineage — what we steal

- **Netscape (1994)** — the GUI made the web. The front door wins by feeling like home.
- **Macintosh (1984)** — the metaphor named the file. *Cartridge / session / artifact* are nouns a non-engineer says aloud. Drag a block onto a cartridge — same gesture, different result.
- **Atari 2600 (1977)** — the slot made the game portable. Standardize the slot, vary the cartridges. A friend's cartridge runs on your visit.
- **BBS / FidoNet (1980s)** — the phonebook made the network. Federation = list of trusted nodes. Rooms = shared sessions, BBS chat updated.
- **Winamp (1997)** — the skin made it personal. Cartridges have color + glyph because the user picks how their Claude looks.
- **iPhone (2007)** — the chassis became the platform. Open spec, no SDK, no review queue.
- **Hypercard (1987)** — the document was the program. Pages with manifests are programmable.
- **Gemini protocol (2019)** — a clear "what we are not" doc is half the spec.

## VI · What we are consciously not building

- Not a chat sidebar.
- Not a "talk to your data" SaaS — cartridges run client-side against the user's keys.
- Not an LLM aggregator marketplace — no cuts, no rankings.
- Not a tracking layer — no analytics on cartridge use.
- Not a payment processor — user's contract with provider is direct.
- Not a model — we're the rack, not the intelligence.
- Not a Chrome extension — real native app + real web reader.

## VII · Roadmap (Q2 2026 → Q3 2027)

- **v0.40** — Sparrow.app standalone (shipped 2026-04-29).
- **v0.41** — first cartridge: anthropic-text. ⌘K affordance ("Summarize this block"). Side-panel artifact. NIP-44-encrypted key store. **8 binary acceptance criteria** (§VIII).
- **v0.42** — cartridge rack in HUD; OpenAI + Mistral; cartridge switcher.
- **v0.43** — sessions as routes (`/sparrow/s/<id>`), side panel, history.
- **v0.44** — artifacts as routes (`/sparrow/a/<id>`), saveable, federate-able.
- **v0.45** — `sparrow.manifest` spec freeze; PointCast blocks ship manifests.
- **v0.46** — image cartridge type (Midjourney, Imagen, SD). Drag-block-onto-cartridge gesture.
- **v0.47** — rooms (multi-identity sessions), kind-30078 with d=sparrow-room-v1.
- **v0.48** — friend cartridge visibility (redacted federation).
- **v0.49** — audio cartridge type (Suno, Udio, ElevenLabs).
- **v0.50** — first OAuth cartridge (Notion, Linear, Slack, Gmail).
- **v0.60–v0.80** — cartridge marketplace JSON, embed mode, full browser shell.
- **v1.0** — Sparrow as the front door for human + AI relationships across the whole web.

## VIII · v0.41 sprint — concrete first ship

Goal: a user can paste a Claude API key once, then from any block on /sparrow hit ⌘K → "Summarize this block" → streamed answer renders in a side panel.

### Scope

1. `src/lib/sparrow-cartridges.ts` — Cartridge type, addCartridge, removeCartridge, listCartridges, NIP-44-encrypted localStorage layer.
2. `src/lib/sparrow-manifest.ts` — SparrowManifest type, parseManifest, affordancesFor.
3. `src/lib/cartridges/anthropic.ts` — first cartridge: streamed POST to api.anthropic.com.
4. Manifest emitter on `/sparrow/b/[id]` — `<script type="application/ld+json">` with affordances.
5. HUD: one new slot in actions row — ✦ cartridge slot. Empty → "+ add" CTA.
6. ⌘K affordance row — top of palette when manifest + matching cartridge present.
7. Side panel — slides in from right; renders streamed artifact; persists in `sparrow:sessions:v1`.
8. `/sparrow/cartridges` — add/remove page; first provider Anthropic.

### Acceptance criteria (binary)

1. Visit `/sparrow/cartridges` fresh; see empty state + "Add Anthropic" CTA.
2. Paste Claude key, save. Cartridge appears.
3. Visit `/sparrow`; see ✦ in HUD slot in user's color.
4. Visit any `/sparrow/b/<id>`; ⌘K shows "Summarize this block" affordance.
5. Pick "Summarize". Side panel slides in. Streamed answer renders token-by-token. Artifact saves.
6. Refresh page. Side panel re-opens with prior artifact.
7. Open Sparrow.app v0.40; menu bar shows "Cartridges: claude-personal · idle".
8. DevTools: `localStorage["sparrow:cartridges:v1"]` has `key_ref` only, no raw key. `localStorage["sparrow:cartridges:keys:claude-personal"]` is NIP-44 ciphertext.

When all eight pass, v0.41 ships.

## IX · The line we won't cross

- No reading content from sites the user hasn't opened.
- No sending content to a cartridge the user didn't pick.
- No persisting API keys outside the user's device unencrypted.
- No federating artifacts without explicit per-artifact opt-in.
- No metering or telemetry. Anywhere. Ever.

These refusals are what make Sparrow trustable as a front door. A door that quietly inspects everything you carry through it is a door you stop using.

## X · The shape of v1.0

The user opens Sparrow in the morning. They see the reader, the cartridge rack, ambient presence. A subtle pill: "your Claude saw 3 things you saved yesterday — want a digest?" — driven by their cartridge, never preemptively, only on click. They click a block. They scroll. They drag a paragraph onto Claude. The artifact appears in the side panel. They save it. A friend comments. They reply.

That's the front door. The browser as a place where the user, their content, their friends, and their AIs sit at the same table. A new shape.

— Claude Code, on Mike's request, written in one sitting on the day v0.40 shipped. PointCast, El Segundo, 2026-04-29.
