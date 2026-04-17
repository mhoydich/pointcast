# Codex review · 2026-04-17 · Phase 1

Scope: `src/lib/channels.ts`, `src/lib/block-types.ts`, `src/content.config.ts`, `src/components/BlockCard.astro`, `src/pages/index.astro`, `src/pages/b/[id].astro`, `src/pages/b/[id].json.ts`, `src/pages/c/[channel].astro`, `src/content/blocks/0159–0213.json`. Preview URL not exercised — spec review only.

## Verdict
needs-revision — core primitive is faithful, but BaseLayout still wraps every page in v1 chrome (wrong fonts, serif italic tagline footer, Tailwind warm palette) which contaminates the Blocks grammar on every route.

## Spec deviations (blocking)

1. `src/layouts/BaseLayout.astro:99-102` — loads Lora + Outfit + Syne from Google Fonts. BLOCKS.md §Typography: "Inter as default … JetBrains Mono … Never system mono." Inter isn't loaded at all; BlockCard falls back to `system-ui`. Add Inter (400, 500) and JetBrains Mono (400, 500), remove Lora/Outfit/Syne.
2. `src/layouts/BaseLayout.astro:167` + `src/components/Footer.astro` — every Blocks page still renders the v1 Mondrian-mural footer on `bg-paper`, with `font-serif italic` "Where taste meets machine", `rounded-md`/`rounded-sm` pills, `ring-1`, and a `<nav>` with external/social tiles. BLOCKS.md §"What to avoid": no "Serif blog aesthetic," no "Navigation sidebars (the channel colors ARE the navigation)," and §Corners: "0 or 2px max, no rounded pills except inline badges." Either gate the Footer behind `hideNav` (and set it on the Blocks pages) or ship a v2 Footer. As-is, `/`, `/b/*`, `/c/*` all violate the corner, palette, and nav rules below the fold.
3. `src/styles/global.css:1-24` — global theme is still the v1 warm palette (`--color-paper: #f5efe4`, `--color-warm`, `font-body: Outfit`, `font-heading: Syne`). `BaseLayout` applies `bg-paper text-ink font-body` to `<body>`, so the page background is warm cream under the Blocks grid instead of neutral/white. BLOCKS.md §"Color application": block background white; §"What to avoid": "Understated greys and muted palette." Rewrite tokens for the Blocks palette and switch body bg to `#fff` (or near-white).
4. `src/styles/global.css:20-23` — font tokens wire Syne/Lora/Outfit into Tailwind (`--font-heading/serif/body`). BLOCKS.md §Typography: "Two weights only: 400 and 500. No 600/700 — too heavy for this density." The v1 tokens expose 600/700 weights and serif italics; these leak into any Tailwind class on Blocks pages.
5. `src/components/BlockCard.astro:196, 286` — `font-family: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace` is declared but no `@font-face` or link loads either. Falls through to `ui-monospace` which BLOCKS.md §Typography explicitly bans: "Never system mono — it reads as code, not as broadcast signature."
6. `src/components/BlockCard.astro:214` — `.block-card__type-tag` uses `border-radius: 1px`. BLOCKS.md §Spacing: "0 or 2px maximum." 1px isn't forbidden, but paired with `.block-card__noun { border-radius: 2px }` and the inline badges, standardize to either 0 or 2px. Minor, but the corner discipline is part of the signature.
7. `src/pages/index.astro:179` — grid is `repeat(6, 1fr)` with `grid-auto-rows: minmax(160px, auto)`. BLOCKS.md §Desktop: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`. Fixed 6-col grid means on a 1480px container each column is ~237px (fine), but on a 1280-1480px width it's visually similar while losing the "wall of signal" self-healing the spec calls for. Prefer `auto-fit, minmax(220px, 1fr)` so the grid re-flows without the manual 1279/1023/639 breakpoints; `grid-auto-flow: dense` is correctly set.
8. `src/pages/index.astro` — no sticky channel chip bar on mobile. BLOCKS.md §Mobile: "Channel filter as a sticky horizontal chip bar at top — tap to filter." Claude Code's log flags this as "not wired" — it's a spec requirement, not a nicety. The `.channels` nav needs `position: sticky; top: 0;` + horizontal scroll at `<768px`.
9. `src/content.config.ts:19` — `channel` enum order is `['FD','CRT','SPN','GF','GDN','ESC','FCT','VST']`; BLOCKS.md §Channels table orders `FD, CRT, SPN, GF, GDN, ESC, FCT, VST` — this matches. However the schema is missing the `meta` free-form `Record<string,string>` allowance for arbitrary agent keys in a way 1:1 with BLOCKS.md (it's present at `:59`, good). Not a deviation, just verified. Real issue: `noun` is capped `z.number().int().min(0).max(1875)` — BLOCKS.md says "Nouns seed ID" with no upper cap; Nouns are minted daily forever, so hard-coding 1875 will start rejecting valid seeds within weeks. Remove the `.max(1875)` or bump it to something that won't silently break.
10. `src/content/blocks/0159.json` — `"title": "Seeing the Future № 0159"`. BLOCKS.md §Grammar: "Sentence case for titles. Caps-lock only for metadata." Embedding the № 0159 in the title duplicates the `CH.FD · 0159` header the card already renders, and mixing the № sigil inside the title puts metadata-ish typography into the title slot. Same applies to `0205.json`. Move the № reference into the `dek` or drop it — the header already carries the ID.

## Code quality notes (non-blocking)

- `src/pages/b/[id].json.ts:22` — `const block = (props as any).block` uses `any` when the `Props` type is trivially declarable. Type it as `{ block: CollectionEntry<'blocks'> }` for consistency with `[id].astro`.
- `src/pages/c/[channel].astro:17` — `Astro.props as { channelSlug: string; channelCode: keyof typeof CHANNELS }` — the `channelSlug` prop isn't used after destructuring. Drop it.
- `src/components/BlockCard.astro:61-64` — `extractHost` silently returns `''` on malformed URL. The Zod schema already constrains `external.url` to `z.string().url()`, so the try/catch is defensive and fine, but consider logging or asserting in dev.
- `BlockCard.astro` conditionals at `:123` and `:129-155` are a cascade of inline ternaries. Extracting a small `footerMeta(data, typeSpec)` helper would make the per-type footer template BLOCKS.md describes more reviewable and testable.
- `src/pages/b/[id].astro:80-83` — `.detail-frame :global(.block-card) { grid-column: auto !important; grid-row: auto !important; }` needs the `!important` because `BlockCard`'s size classes are scoped with high specificity. A `detail` prop branch inside BlockCard that no-ops the span classes is cleaner than `!important` override from the parent.
- The `/b/{id}.json` payload embeds `schema: 'https://pointcast.xyz/BLOCKS.md'` — good, but include `$schema` (JSON-Schema convention) alongside to help agents auto-resolve. Also missing: `channel.color600` / `color800` — cheap to add, useful for agents rendering citations in channel color.
- `src/content/blocks/0210.json` — `"minted": 1` on a 50-supply faucet with timestamp `2026-04-17T00:00:00-08:00` reads plausibly, but the `edition.contract` is the Shadownet KT1 (throwaway). Claude Code's log acknowledges this. Not a blocker; flag so X + M know not to interpret preview mint counts as real.
- `0207.json` — `"visitor.name": "claude-opus-4-7"` — the actual Codex-facing model id carries a `[1m]` suffix; `claude-opus-4-7` without qualifier is fine as a display slug. Not a deviation, just noting.
- `src/content.config.ts:37` — `contract: z.string().regex(/^KT1[A-Za-z0-9]{33}$/, …)` — tight KT1 constraint is good. Consider a companion `tz[12]` sender regex when/if block schema grows a `mintedBy` field in Phase 3.

## Alternative suggestions

None warranted this round — the existing card treatment is close to BLOCKS.md and fixing the global-CSS/Footer regressions will close most of the gap. If a second aesthetic pass is wanted post-fix, I'd sketch a "header-row-only, no-noun-thumb" variant for VST / NOTE to test density vs. the current 28px thumbnail treatment — but hold until the blocking items land. No files added to `sketches/codex/` this round.

## Handoffs

- (CC) Load Inter 400/500 + JetBrains Mono 400/500 self-hosted; remove Lora/Outfit/Syne from BaseLayout — priority **high** (spec dev #1, #5)
- (CC) Gate `Footer.astro` behind `hideNav`/opt-out on all Blocks pages, or ship a v2 Footer that respects 0-2px corners and mono-only nav — priority **high** (spec dev #2)
- (CC) Rewrite `src/styles/global.css` `@theme` to the Blocks palette + drop warm/serif tokens; body bg to white — priority **high** (spec dev #3, #4)
- (CC) Wire sticky horizontal channel chip bar at `<768px` with overflow-x scroll — priority **high** (spec dev #8)
- (CC) Switch `.grid` to `repeat(auto-fit, minmax(220px, 1fr))` on `/` and `/c/[channel]` — priority **med** (spec dev #7)
- (CC) Remove `.max(1875)` cap on `noun` in `content.config.ts` — priority **med** (spec dev #9)
- (CC) De-duplicate № in block titles 0159 + 0205 — priority **low** (spec dev #10)
- (CC) Tighten `any` in `[id].json.ts` + refactor footer cascade in BlockCard — priority **low**
