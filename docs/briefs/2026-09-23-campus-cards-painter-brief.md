# Campus Cards · painter brief (one agent per campus)

Repo worktree: `/Users/michaelhoydich/pc-cc-seven` (PointCast, Astro). Work ONLY there.

Campus Cards are pixel-art place cards for the ten University of California campuses,
twelve cards per campus, collectible on Tezos. Sets 01 (Santa Barbara) and 02 (Berkeley)
are done. Study them first — they are your quality bar and your style guide:

- `src/data/campus-cards.json` — series data (read-only for you). See `sets[0]`, `sets[1]`.
- `scripts/campus-cards-art.mjs` — the painter. Read the `Canvas` class (`px`, `dot`,
  `bands`, `disc`, `silhouette`, `ridge`, `rand`), the sprites (`palm`, `bike`, `rider`,
  `bird`, `glints`, `waves`), and every scene in `SCENES` (Set 02 ones start at
  `campanile`). Look at `public/images/campus-cards/set-01/*.png` and `set-02/*.png`.

## Your deliverable: exactly one new file

`scripts/campus-cards-scenes/<campus-slug>.mjs`, shaped like:

```js
// Campus Cards · Set NN · <Campus> — scenes. Unofficial, places only, CC0.
export const set = {
  id: 'set-NN', campus: '<campus-slug>', title: 'Set NN · <Campus Name>',
  subtitle: '<one line, lowercase-ish, observational, like Set 01/02 subtitles>',
  accent: '<given hex>',
  cards: [
    { n: 1, slug: '...', title: '...', rarity: 'legendary', scene: '<prefix>_...', flavor: '...' },
    // 12 cards total
  ],
};
export const scenes = {
  <prefix>_something(c, { GW, GH, palm, bike, rider, bird, glints, waves, rng }) { ... },
  // one function per card, 12 total
};
```

- Grid is 88 × 64 art pixels (`GW`, `GH`). Draw with `c.px(x, y, w, h, color, layer?)` etc.
- Layers are animation classes: `glint twinkle waves drift drift2 bob sway peck ride ride2 spin glow ring bell`.
  Anything drawn into a named layer is rendered ON TOP of the base layer, so only put
  foreground-safe details there (sparkles, walkers, water glints, fog bands, birds).
  `spin` rotates about its layer's bbox center (see the `roundabout` scene trick).
- Cover every row 0–63 with base paint. Unpainted rows show the black card background
  (a real bug we hit in Set 01).
- Scene function names MUST start with your prefix (given below) — collisions throw.
- Card slugs must be globally unique across all campuses (they share `/campus-cards/{slug}`);
  prefix ambiguous ones (e.g. `davis-arboretum`, not `arboretum`).

## Rarity mix (fixed, every set)

1 legendary (the campus's defining landmark) · 2 rare · 3 uncommon · 6 common.
Order cards legendary → rare → uncommon → common, n = 1..12.

## Content rules (hard)

- **Places only.** No university logos, seals, wordmarks, mascots (no bears, anteaters,
  banana slugs, bobcats, tritons, highlanders, aggies-as-mascot, etc.), no team colors used
  as branding, no giant hillside letters, no jersey numbers.
- **No depictions of copyrighted public artworks/sculptures** (e.g. UCSD's Sun God, Davis'
  Eggheads). Buildings, landscapes, streets, trees, transit, weather, animals-in-nature are fine.
- **Don't invent facts.** Flavor text (≤ 115 characters, one or two short sentences, cozy,
  observational, present tense, second person welcome) must be true or plainly
  impressionistic. No numbers, dates, heights or records unless you are certain. When in
  doubt, describe what it feels like to be there rather than a fact about it.
- Avoid contested/political sites and anything about specific living people.
- Titles ≤ 22 characters.

## Style

Match Sets 01/02: saturated late-90s pixel palette, dithered sky bands, a clear focal
silhouette, a few animated details, tiny people/bikes for scale. Each card needs a
different composition (vary time of day, weather, viewpoint: close/wide/top-down/interior).

## Your loop

```bash
cd /Users/michaelhoydich/pc-cc-seven
node scripts/campus-cards-art.mjs --set set-NN --contact /Users/michaelhoydich/pc-cc-seven/tmp/contact-set-NN.png
```

Then Read that PNG and look at it critically. Iterate until every card reads clearly
as its place at thumbnail size and nothing is broken (black gaps, stray dashes over land,
invisible focal subject). At least two review passes.

## Don't

Don't edit any other file. Don't commit, push, build, or deploy. Don't touch other
campuses' modules. When done, reply with: the 12 titles + rarities, any facts you were
unsure about (and how you hedged), and the contact sheet path.
