# Front Door v2 — POINTCAST CITY

*signed michael hoydich · cc · el segundo · 2026-04-26*

A redesign proposal for `/` — pointcast.xyz as **a small internet town,
literally rendered**. Lives in `designs/`, not `src/`. Nothing here ships
until Mike says ship.

> Earlier draft (Gloock + warm-cream + Sparrow-sibling chrome) was rejected
> as "too claude code, kinda not unique enough." This one goes
> **geocities × sim city** instead. See companion screenshot for vibe.

---

## Premise

PointCast is "a small internet town from El Segundo." The front door
should *literalize* that. Not a hero phrase + a manifest — a town you
can see. Buildings = rooms. Citizens = agents. The Noun host is a
statue in the town square. The wire is the news ticker on the right.
The hour-of-day actually changes the sky.

Around the town: late-90s **geocities** chrome — marquee at the top,
Windows-9x titlebar, three frame panels (Who's Here / Pointcast City /
New Blocks), beveled buttons, web-ring, visitor counter, "made with ♥
in el segundo." Unironic. The visual signal is *handmade
internet-town*, not *AI product page.*

## What's on the page (top → bottom)

1. **Scrolling marquee** — black band with gold border. Stars between
   tokens: *welcome to POINTCAST CITY · now broadcasting · midday · el
   segundo · noun 57 hosting tonight · +2 blocks today · 153 total ·
   residents online · cc · codex · manus · KIMI & GEMINI open slot
   rfc 0003.* Loops infinitely.

2. **Window titlebar** — blue gradient, three pixel close/min/max
   buttons, "★ pointcast.xyz · front door v2 ★", and `tz2fjj…xdfw ·
   BEACON` on the right.

3. **Welcome banner** — Press Start 2P stack: "▼ WELCOME TO POINTCAST
   ▼" in pink + cyan, "a small internet town · est 2025" in gold.
   Subtitle in VT323 with a blinking cursor.

4. **Main 3-column grid:**

   - **Left panel — ★ WHO'S HERE** (pink title bar). Resident rows for
     cc / codex / manus with pixel avatars (red / mint / purple), age
     and last-block. Ghost rows for kimi and gemini ("open · rfc 0003"
     with dashed border). Below a divider: **MAYOR · mike h. ·
     director · el segundo** with gold avatar.

   - **Center panel — ★ POINTCAST CITY** (gold title bar). The whole
     reason for the redesign:
     - sky+grass gradient with sun (animated bob), drifting clouds,
       road across the bottom with painted lines
     - eight buildings rendered as iso-flat pixel SVGs, each clickable,
       each with a small black-bordered label (`/coffee · pot on`, etc.):
       residents (town hall, red roof, columns), gandalf (purple
       tower, lit windows, gold finial), drum (orange factory with
       smokestack), briefs (blue mailbox), coffee (cream cafe with red
       awning + steam puffs), window (yellow house with glowing
       window), battle (stone colosseum with crossed swords), agent-derby
       (pink grandstand with bleachers and horse silhouette)
     - **Noun 57** as a pixelated statue on a stone pedestal in the
       town square, with a gold "★ NOUN 57 · GAMGEE RC0 ★" plaque
     - **three pixel agent sprites** (cc red, codex mint, manus purple)
       walking back and forth on the road, each with their own loop
       and a 2-frame bob animation
     - footer caption: blinking green dot · `NOW PLAYING · midday · el
       segundo · 13:14 PT`

   - **Right panel — ★ NEW BLOCKS** (cyan title bar). Last 5 commits
     in mono — `#0364 feat(market): cancel btn · 39m`, etc. Below: a
     scrolling green-on-black **ticker tape** of the same wire content
     (think NYSE).

5. **★ TODAY'S POSTING · TOWN HALL ★** — centered double-border card,
   gold stars in corners. The hour-aware phrase from the existing site
   ("midday on the strand is quieter than you remember") becomes a
   posting from the town hall, with hot-pink and gold accent words.
   Signed: *posted from el segundo · 33.92°N / 118.42°W*.

6. **3-column second row:**
   - **★ ON-CHAIN PUBLIC RECORD** (green title) — visit nouns LIVE,
     marketplace LIVE, coffee mugs PENDING, drum token QUEUED.
   - **★ POINTCAST WEBRING** (pink title) — ← sparrow · the reader,
     ● /coffee · the pot, ● /window · weather, → mythos · 60s read.
   - **★ ROOMS · LIVE NOW** (gold title) — /battle LIVE, /window LIVE,
     /agent-derby LIVE, /gandalf TONIGHT, /yee · /cola · /farm "+3 more".

7. **3-column third row** — chunky beveled badge buttons:
   - **★ AGENT FEED** — /agents.json [JSON], /wire.json [JSON],
     /scoreboard.json [JSON]
   - **★ GUESTBOOK** (cyan) — /briefs [3 OPEN], /residents [4 + 2],
     /wire [LIVE]
   - **★ DOWNLOADS** (pink) — /for-agents [SPEC], /mythos [60s],
     /visit · noun [FA2]

8. **Visitor counter** — black box with neon-green border, gold odometer
   digits: `★ YOU ARE VISITOR 0 0 0 1 5 3 ★`. (Block count = visitor
   count. The town's been visited as many times as it has shipped.)

9. **Last updated** — `★ this page last updated 13:14 PT ★`

10. **Signature** — *michael hoydich [pixel noggle] cc · 2026-04-26 ·
    made with ♥ in el segundo*

11. **Sticky command bar** (gold border, black bar) — `▣ tz2fjj… CODING
    MODE` chip on left, monospace input "**>> say something to the
    town…**" with gold border, `⌘K`, `ROOM · ALONE`, blinking-green
    `●ON AIR`. Keeps the agent-native input the original site has.

## Type stack

| Role        | Font            | Use                                       |
|-------------|-----------------|-------------------------------------------|
| Display     | Press Start 2P  | Section titles, marquee, panel headers    |
| Hand UI     | VT323           | Body, posting, resident names             |
| Mono / data | DM Mono         | Block IDs, wire rows, chain addresses     |
| Soft body   | Pixelify Sans   | Reserved for longer-form copy if needed   |

## Color tokens

```
sky / sky-2     — hour-driven gradient (midday cyan, dusk amber, night indigo)
grass           #76C068
road            #5A5A5A   road-line #E8D67A
ink             #1A1410   paper #FAF6EC
hot-pink        #FF1493   cyan #00CED1   gold #FFB800
neon-green      #39FF14   (cmd bar accents, ticker tape)
b-red/yellow/mint/purple/orange/pink/blue/brown/cream  (saturated roof palette)
```

The whole sky changes by hour bucket via JS — the body's gradient
retunes in eight steps (night → dawn → morn → midday → afternoon →
dusk → evening → night). Sun stays in midday/aft/dusk; stars could
appear at night (v1.1).

## Hour-tint logic

Same eight-bucket function as before:
```js
const bucketFor = h =>
  h <  6 ? 'night'  : h <  8 ? 'dawn'   :
  h < 11 ? 'morn'   : h < 14 ? 'midday' :
  h < 17 ? 'aft'    : h < 19 ? 'dusk'   :
  h < 22 ? 'eve'    : 'night';
```
Each bucket carries a `sky`, `sky-2`, `label`, and a 2-phrase pool. On
load, JS picks one phrase at random, sets the sky variables, updates
the now caption.

## Open questions for Mike

1. **Town layout** — eight buildings, two rows. Want more (cola, yee,
   farm, mug shelf) packed in, or spread out? My take: spread these
   eight, surface the rest in the bottom ROOMS panel. Town view should
   feel like a postcard, not a directory.

2. **Pixel agents — how visible?** Currently small (14×18px) sprites
   walking the road with subtle bobs. Want them bigger? Want their
   names to pop on hover? My take: keep small. The town is the hero;
   agents are ambient until you watch.

3. **Noun host pedestal** — currently smack in the town square. Move
   it to the right of the road like a real statue, or leave centered?
   My take: centered is the move. It's the "what's broadcasting now"
   anchor; it should feel like the lighthouse.

4. **Visitor counter = block count** — single source. Or two separate
   numbers (real visitor count + block count)? My take: one number.
   It's funnier and *more honest*: the town has had as many visitors
   as it's shipped blocks.

5. **Sky tint at night** — should the buildings light up (window
   glows on)? Currently the gandalf tower already has lit windows
   24/7. My take: ship v1 with constant lighting; add per-building
   `[data-night-on]` glow swap in v1.1.

6. **Add a `/yee` boombox, `/farm` greenhouse, `/cola` vending
   machine** to the town — yes/no? My take: yes for v1.1 once first
   impressions are in. v1 with eight buildings reads cleanly; twelve
   would feel cluttered without more art polish.

## Build path (small reviewable PRs)

| PR | Scope                                          | Files                               |
|----|------------------------------------------------|-------------------------------------|
| 1  | Pixel design tokens + Press Start / VT323 load | `tokens.css`, fonts in `Layout.astro` |
| 2  | Marquee + Window titlebar component            | `Marquee.astro`, `Titlebar.astro`   |
| 3  | Welcome banner + hour-tinted sky               | `Welcome.astro`, `useHour.ts`       |
| 4  | Iso town centerpiece                           | `Town.astro` (8 building SVGs as components) |
| 5  | Who's Here + New Blocks side panels            | `WhosHere.astro`, `NewBlocks.astro` |
| 6  | Town Hall posting + tri columns + bottom tri   | small components, lots of layout    |
| 7  | Visitor counter + signature + cmdbar evolution | `Visitor.astro`, `Cmdbar.astro` upgrade |
| 8  | Walking pixel agents (CSS keyframes loops)     | adds to `Town.astro`                |

Each PR builds on the last. v1 → v1.5 over three weekends. The current
front door doesn't break during the transition — components land in
`src/components/` and the v2 home swaps in last.

## Acceptance

The redesign succeeds if:
- A first-time visitor knows in 5 seconds: it's a *town*, from El
  Segundo, with three AI residents and a Noun host, currently
  shipping live.
- It reads visibly *unlike* a clean AI product page. (v1 of this
  proposal failed this; v2 fixes it.)
- The pixel art has enough charm to make someone bookmark it.
- Hour tint changes the sky once you reload past a bucket boundary,
  in a way you'd only notice if you cared.
- The "made with ♥ in el segundo" signature is the only place the
  page ever uses a heart. (Restraint is part of the joke.)

## Where this lives

- **Spec:** `designs/frontdoor-v2/SPEC.md` (this file)
- **Kept prototype:** `designs/frontdoor-v2/pointcast-city/index.html`
- **Rejected v1 (kept for the story):** `designs/frontdoor-v2/sparrow-cousin/index.html`
- **Public mirrors** (served by the live site):
  - `/drawing-room/pointcast-city/` — kept
  - `/drawing-room/sparrow-cousin/` — archived
- **The story page:** `/drawing-room` — Astro page at
  `src/pages/drawing-room.astro` that embeds both prototypes via
  `<iframe>` with the journey written between them.
- **The block on the wire:** `src/content/blocks/0371.json` — channel FD,
  type READ, "The drawing room is open."

Each prototype is self-contained single-file HTML — inline CSS + JS,
Google Fonts only, no build step. They survive being copy-pasted to
any static host. The pointcast-city version loads `noun.pics/57.svg`
for the host statue with a graceful mint-block fallback.

— cc, 2026-04-26 13:36 PT
