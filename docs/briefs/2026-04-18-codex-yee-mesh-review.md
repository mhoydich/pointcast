# Codex brief — Round 3 · YeePlayer + Mesh + schema review

**Audience:** Codex acting as specialist reviewer. Keep each task atomic — one review, one diff per task. Report back via PR.

**Context:** Overnight sprint shipped YeePlayer v0 (static rhythm-game overlay on `/b/0236`), `/mesh` (tri-layer network visualization), six new blocks (0250–0255), and an extension to the `media` schema (`beats` array). `/yee/{id}.astro` is built, `/yee/index.astro` is the catalog. Next 24 hours I want Codex to do a careful review pass on the new surface.

---

## Task C-1 — `media.beats` schema audit

**File:** `src/content.config.ts`

**Goal:** Confirm the `beats` schema is correctly typed and catches the likely authoring mistakes. I added:

```ts
beats: z.array(z.object({
  t: z.number().nonnegative(),
  word: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  key: z.string().optional(),
  note: z.string().optional(),
})).optional(),
```

**Review:**
1. Should `beats` be constrained to only WATCH blocks? (Schema currently allows it on any media kind — the `/yee/[id]` route filters to WATCH, but content files could have beats on non-WATCH blocks without a build error.)
2. Should `t` have a max (duration guard)? Right now a beat at `t: 999999` is valid.
3. Should `word` have a length cap for readability in the track?
4. Should we add a `beats` sort-invariant (monotonically increasing `t`)?

**Deliverable:** If any of the above should land as schema changes, open a PR with the refinement + a one-paragraph explanation. Keep the PR <20 lines of diff.

---

## Task C-2 — `/yee/[id]` accessibility pass

**File:** `src/pages/yee/[id].astro`

**Goal:** This is keyboard-first, SPACE-driven gameplay. I want a11y checks:

1. Is the hit button a real `<button>` with `aria-label`? (Yes, but double-check `role`.)
2. Screen-reader announcement strategy: should we add `aria-live="polite"` to the score/combo readouts so accessible tech gets updates during play?
3. `prefers-reduced-motion`: should we auto-disable the falling animation when set? (Currently the beat uses `translateY` continuously — for vestibular-sensitive users that could be rough. Fallback: beats just appear at the hit line 500ms before hit time, no fall.)
4. Keyboard trap check: SPACE is captured on `window` — is there any page element (e.g. the YouTube iframe) that eats SPACE first? If so, recommend a fix.

**Deliverable:** PR with only the a11y diff. Narrative in PR description.

---

## Task C-3 — `/mesh` ItemList JSON-LD correctness

**File:** `src/pages/mesh.astro`

**Goal:** The page emits `@type: Collection` with `hasPart` of 3 sub-nodes. Each sub-node is typed `Place`, `DataFeed`, `Dataset`. Review:

1. Does `Collection` with mixed `hasPart` types survive a Schema.org validator? (Rich Results Test + Schema.org validator both.)
2. Should the top-level type actually be `DataFeed` or `CollectionPage` instead of `Collection`? (I'm not sure `Collection` serves our citation goal — `CollectionPage` is the SEO-favored type for directory-style pages.)
3. The `agentSurfaces` list is in the page body but not in JSON-LD. Should each surface be an `Action` or `DigitalDocument` in the graph so agents can discover them structurally?

**Deliverable:** PR updating the JSON-LD shape to whatever the review concludes is canonical. Target Schema.org official docs + live Rich Results Test as the authority.

---

## Task C-4 — Block 0253 fact-check

**File:** `src/content/blocks/0253.json`

**Goal:** Block 0253 ("How agents read PointCast") claims specific behavior:
- "User-Agent prefix ai:, or any of GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot / Atlas / Google-Extended" — does this exactly match `functions/_middleware.ts`?
- "~12 percent smaller on the home feed" — verify against current middleware output.
- "every JSON and RSS surface" — check `public/_headers` CORS coverage. Any endpoint missing `Access-Control-Allow-Origin: *`?
- "/api/indexnow (awaiting Manus key bind)" — is the key still unbound? Update if Manus has shipped it.

**Deliverable:** If any claim is stale, update the block body to match reality AND flag in the PR description so MH sees the correction.

---

## Task C-5 — `/ai-stack` + block 0255 consistency

**Files:** `src/pages/ai-stack.astro`, `src/content/blocks/0255.json`

**Goal:** Block 0255 mentions tools not listed in `/ai-stack` (e.g. the block says "Cursor lives in the background" — check `/ai-stack` for a Cursor entry). Any tool mentioned in 0255 that's missing from `/ai-stack` is a consistency bug.

**Deliverable:** Either update `/ai-stack` to include the missing tool(s) OR update 0255 to only mention tools in `/ai-stack`. PR either way.

---

## Submission

- One PR per task. PR title format: `[codex C-N] <short description>`.
- Tag MH for review. Do not merge without approval.
- If a task reveals a bigger issue (e.g. C-1 turns into a refactor), stop and raise it in the PR description before expanding scope.

— Claude Code (primary engineer), overnight 2026-04-17 → 2026-04-18
