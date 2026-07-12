# FooterBar v5.1 — the bar learns the whole town

2026-07-05 · cc · per Mike: "rethink the bottom bar, search all chats on ethos,
get modern, what's neat for 2026"

## Research

**Ethos (from past chats + the canon):** the Nouns CC0 line — *open, forkable,
meant to proliferate; design should feel generous, inviting participation* —
and the house voice: *cozy, observational, El-Segundo-anchored, slow on
purpose*. BLOCKS.md forbids anything that reads as minimal SaaS. Verdict for
the bar: it's the town's walkie-talkie, not a SaaS palette. No sparkle-AI
chrome.

**2026 (web scan):** command palettes are table stakes; the current move is
natural-language intent on top of paths. Bottom-centric interaction is the
reachability gold standard. The Dynamic Island shape — glance → expand →
dismiss — is the modern grammar for persistent chrome, and static always-on
bars are now considered noise unless context-aware.

**Code (FooterBar v5, 3.4k lines):** the omnibox is already the killer
feature (GO/SAY/CAST/ASK/AGT/OP modes, trays, spells, echoes). Three things
had gone stale: GO only knew exact paths plus a hand-curated ROUTES list that
drifts; the ASK tray shipped a "🤖 ai · soon" stub; the bar sits on the page
permanently (it covers the bell button on several rooms).

## What v5.1 ships

1. **The omnibox knows all 450 doors.** Typing `/…` fuzzy-suggests from
   `/explore.json` — the same auto-built machine surface agents read — lazily
   fetched on first keystroke, so the bar can never drift from the real page
   tree and costs nothing until used. Arrow keys + Enter; version graveyards
   (`-v2…-v18`) sink below living rooms unless typed exactly.
2. **Honest `?` intents.** `?what's new` → /wire, `?today` → /today,
   `?random` → a random door, `?music`, `?recap`, `?who`, `?weather`,
   `?what is this` — instant, in-town, no model, no spinner. Anything else
   remains a real ask to the cast. The "ai · soon" seat is gone; if a model
   ever sits down, it should arrive working, not as furniture.
3. **Glance state.** Scroll down past the fold and the bar slims to a 14px
   sliver; scroll up, hover, tap, or focus and it returns. Never slims with a
   tray open or the input focused. Reduced-motion: no animation, same
   behavior.

## Deliberately not done

- v6 Walking Bar promotion/demotion — Mike's visual-direction call.
- Code-splitting the 1.3k-line inline script — worthwhile, separate PR.
- Wallet-driven director recognition — needs its own design pass.
- `/shrine-crawl` title extracting as `SHRINE_CRAWL_META.title` in the
  directory (explore.ts frontmatter regex can't resolve constants) — small
  follow-up, affects /explore too.

— cc, 2026-07-05, El Segundo
