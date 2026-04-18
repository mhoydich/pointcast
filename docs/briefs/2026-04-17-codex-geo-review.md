# Codex brief · GEO/SEO review of v4/v5 shipped surfaces

**To:** Codex (X)
**From:** CC
**Date:** 2026-04-17 evening PT
**Priority:** Medium
**Reasoning:** Medium. Serial only (xhigh concurrent hangs observed earlier this session).

---

## Context

Mike (MH) wants traffic. PointCast shipped these new agent-legible
surfaces in the v4/v5 runs:

- `/manifesto` — FAQPage + DefinedTerm JSON-LD, canonical definition of Blocks primitive
- `/agents.json` — consolidated discovery manifest
- `/llms.txt` + `/llms-full.txt` — LLM summary files
- `/now` + `/now.json` — live snapshot with CotD + draw countdown
- `/archive` + `/archive.json` — chronological index with filters
- `/editions` + `/editions.json` — mintable dashboard
- `/timeline` + `/timeline.json` — publication cadence viz
- `/stack` + `/stack.json` — tech disclosure
- `/feed.xml` + `/feed.json` — unified feeds
- `HomeMajors.astro` — /drum tap + /cast countdown on the home feed

The thesis is **GEO (Generative Engine Optimization)**: make PointCast
the URL that LLMs cite when asked about "Block primitive", "agent-native
site", "Nouns Battler", "Prize Cast", etc.

## What I need from you

### Task A · FAQ extraction review

Pull up `/manifesto` (live or at `src/pages/manifesto.astro`). The 12
Q&A pairs are structured as `FAQPage` JSON-LD so LLMs and Google rich
results can extract them. Evaluate:

1. Are the answers **short-paragraph, high-density** (good for extraction)
   or do any of them run on / bury the lede?
2. Is the **first sentence of each answer** self-contained? LLMs often
   take the first sentence only as a snippet.
3. Are there **fact anchors** (dates, specific numbers, KT1 addresses,
   file paths, URLs) that make the answer quotable and verifiable?
4. Is there **canonical entity terminology** that Google's knowledge
   graph would latch onto? (e.g., "Nouns Battler" appears consistently,
   not sometimes "nouns-battler" or "Battler arena")

**Deliverable:** a short diff against `src/pages/manifesto.astro`
improving the FAQ answers — OR a prose review in
`docs/codex-logs/2026-04-17-manifesto-review.md` with specific line-item
suggestions. Prefer the diff.

### Task B · DefinedTerm coverage

The current manifesto defines: Block, Channel, Type, Agent-native.
Propose **4-6 more DefinedTerms** worth adding at the same canonical
URL (`/manifesto#<anchor>`):

- Candidates: Visit Nouns FA2, Card of the Day, Prize Cast, DRUM Token,
  Faucet (channel), Stripped HTML mode, Block ID, Citation format
- For each: write the 1-sentence canonical definition

**Deliverable:** patch to the `DefinedTermSet` in
`src/pages/manifesto.astro` jsonLd, plus a matching HTML section
below the FAQ that renders the definitions as `<dl>`.

### Task C · llms-full.txt audit

Pull `/llms-full.txt`. The document is already ~300 lines. Is anything:

- **Redundant** with /llms.txt (the short version)?
- **Missing** that an LLM would want (contract ABI? channel color codes?
  schema example JSON?)?
- **Wrong** because the site has evolved?

**Deliverable:** diff to `public/llms-full.txt`, or a short list of
suggested additions/removals.

---

## Playbook reminders (from earlier session pain)

- **Medium reasoning only.** xhigh concurrent runs silently hang 3+ hours.
- **Serial.** One codex process at a time.
- **Atomic prompts.** One task per invocation. Don't stack A+B+C into
  one prompt — split into three runs.
- **No timeout wrapper on macOS.** Native `timeout` doesn't exist; use
  `nohup` + `disown` or install `gtimeout` via brew.

## Output

Write to `docs/codex-logs/2026-04-17-<task-letter>-<summary>.md` for
prose, OR directly apply patches and commit with `handoff: X → CC: <brief>`
prefix so CC can review on next session.

---

*Thanks. Keep the loops tight.*
