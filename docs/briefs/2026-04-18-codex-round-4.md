# Codex brief — Round 4 · review the morning's new surfaces

**Audience:** Codex acting as PR-review specialist on the four sprints shipped 2026-04-18 morning by autonomous cron.

**Context:** Between 7:11 and 10:11, cc shipped four sprints without Mike review:
1. **`voice-audit`** — schema added `author` + `source`, 9 blocks rewritten/retired, VOICE.md at root, brief at `docs/briefs/2026-04-18-codex-voice.md`.
2. **`products-scaffold`** — `products` collection + `/products` + `/products/[slug]` + `/products.json` + schema.org Product markup. Empty on purpose.
3. **`home-mobile-lighten`** — CSS-only mobile compact mode in BlockCard + index.astro grid + MorningBrief.
4. **(this brief)** — round-3 briefs for Codex (`-codex-voice.md`) and Manus (`-manus-kv.md`).

Plus earlier surfaces from the same day: `/sprint`, `/api/queue`, `/drop`, `/api/drop`, `src/lib/url-classifier.ts`, `src/lib/sprints.ts`, `docs/inspirations/foursquare.md`.

Round 4 review is the second pair of eyes on all of that. Five tasks below, atomic, one PR per task. Tag MH for review, do not merge without approval.

---

## Task R4-1 — Voice audit catalog grep

**File scope:** `src/content/blocks/*.json`

Run the audit grep from `docs/briefs/2026-04-18-codex-voice.md` task V-1:

```bash
for f in src/content/blocks/*.json; do
  author=$(jq -r '.author // "cc"' "$f")
  source=$(jq -r '.source // ""' "$f")
  if [[ "$author" != "cc" && -z "$source" ]]; then
    echo "VIOLATION: $f — author=$author has no source"
  fi
done
```

**Expected:** Zero violations after the voice-audit sprint. cc fixed the catalog as of 2026-04-18T07:19.

**Deliverable:** Run the grep, paste output. If violations exist, file one fix-PR per file with either `source` filled in (if you can find it in chat history at github/PR comments) or author downgraded to `cc` and content scrubbed of false-Mike-voice.

---

## Task R4-2 — `/products` schema sanity

**Files:** `src/pages/products.astro`, `src/pages/products/[slug].astro`, `src/pages/products.json.ts`, `src/content.config.ts`

**Goal:** Confirm the schema.org Product markup validates and the empty-on-purpose state works correctly with downstream agents.

1. Run the Rich Results Test against `https://pointcast.xyz/products` and `https://pointcast.xyz/products/{slug}` (will 404 — pick a slug after Mike adds the first product, OR simulate by adding a temp product file under `src/content/products/test.json` with the minimum required fields, run Rich Results, then delete).
2. Verify `/products.json` returns valid JSON with `count: 0` + `note: "Catalog is empty..."` + the `seller` block.
3. Check that the empty-state UI on `/products` doesn't accidentally render `null` or undefined values (it shouldn't — there's a guard).
4. Confirm the `disclaimer` line on per-product pages ("POINTCAST DOES NOT SELL OR FULFILL · CHECKOUT HAPPENS AT …") is present and visible.

**Deliverable:** Pass/fail report per check + Rich Results screenshot. If anything fails, open a fix-PR.

---

## Task R4-3 — `/sprint` + `/api/queue` end-to-end

**Files:** `src/pages/sprint.astro`, `functions/api/queue.ts`, `src/lib/sprints.ts`

**Goal:** Walk the picker flow as a user would.

1. Open `https://pointcast.xyz/sprint` on mobile. Verify all candidate cards render with their estMin + status badges.
2. Tap PICK on a `ready` card. Expected: orange "KV not bound — see fallback" alert (until Manus M-3-2 lands). Once Manus binds, expected: green "✓ PICKED".
3. Submit the custom-directive feedback form with empty body. Expected: "Directive required." status.
4. Submit with valid text. Expected (post-binding): green "✓ Sent. key: …".
5. Verify `done` sprints render with `shippedAt` + `shippedAs` in the recently-shipped strip.
6. Verify `needs-input` cards show their `needs` line and the disabled "⊘ NEEDS INPUT" button.

**Deliverable:** Screenshots of each state.

---

## Task R4-4 — Mobile compact mode regression check

**Files:** `src/components/BlockCard.astro` (the `@media (max-width: 639px)` block), `src/pages/index.astro`, `src/components/MorningBrief.astro`

**Goal:** Confirm the home-mobile-lighten changes don't regress on:
1. `/b/{id}` detail pages (mobile + desktop). Body should still render full there.
2. WATCH/LISTEN/MINT/FAUCET cards on mobile home grid. Should still show their facade chip — not affected by the body-hide rule.
3. The detail page typography on mobile. The `.block-card__article-p` styling should still apply.
4. The `→` hint after titles on READ/NOTE/LINK/VISIT cards — visible only on mobile, only on grid mode.

**Deliverable:** Screenshot grid at 375px viewport (iPhone SE) + 1024px (iPad) + 1440px (desktop). Compare to a snapshot from yesterday if available.

---

## Task R4-5 — `/drop` URL classifier sanity

**Files:** `src/lib/url-classifier.ts`, `src/pages/drop.astro`, `functions/api/drop.ts`

**Goal:** Verify the classifier mirrors between client preview and server processing.

1. Paste each example URL on `/drop`:
   - `https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT` → expect "LISTEN · CH.SPN"
   - `https://youtu.be/jPpUNAFHgxM` → "WATCH · CH.SPN"
   - `https://shop.getgoodfeels.com/products/coastal-rest` → "/products · CH.GF"
   - `https://maps.google.com/?q=Capa+Los+Cabos` → "VISIT · CH.VST"
   - `https://substack.com/@author/post-123` → "READ · CH.FD"
   - `https://random-unknown-domain.example` → "LINK · CH.FD (default)"
2. Confirm the chip color varies per kind.
3. Submit one (will 503 until Manus binds PC_DROP_KV); once bound, confirm 200 and KV listing shows the entry.

**Deliverable:** Screenshot of each classification preview + console output of any mismatches between client preview and server response.

---

## Submission

- One PR per task. PR title format: `[codex R4-N] <short>`.
- Tag MH. Do not merge without approval.
- If R4-1 finds violations, prioritize that — the schema can't be load-bearing if the catalog already has false attributions.

— Claude Code, sprint `codex-manus-brief-3`, cron tick 2026-04-18T10:11
