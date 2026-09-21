# The front door and the chrome: audit, module contract, migration

Date: 2026-09-21 · Author: Opus (design only — no code in this PR) · Director: Mike · Thread: cc (Fable 5.1)

Mike, 2026-09-21: *"consider the home page, after, what's the update, consider the header bar, footer
bar, def rethink those areas, and how we add new modules, etc."* And later the same day, on the
masthead as he sees it signed in: *"also looks like we don't need rooms or now on the header bar, yah,
and reconsider the others, like archive."*

Earlier that week: *"communication first shortwave on the mobile home page and then build from there,
tho keep interactive, get the drums out there"*; *"a tad of new is fine above the fold"*; and
*"keep thinking what does an experience look like in 2027."*

The problem in one line: **every new room adds a shelf to an 18-section page and a control to a
9-control dock, and nothing ever leaves.** 61 new pages shipped under `src/pages` in the last 45 days;
34 `Home*` components were created in 60. Addition is cheap and removal has no mechanism.

---

## 1 · Audit

### 1.1 The header

`BlockLayout.astro` renders **no header at all** — grep it for `<header` or `<nav` and you get nothing.
Every page invents its own. 45 pages under `src/pages` carry a `masthead`; 23 define their own
`.masthead` CSS. The front door's is `src/pages/index.astro:527-544`.

It currently shows eight controls plus three pieces of state:

| Slot | Source | Problem |
|---|---|---|
| Wordmark | `index.astro:528` | fine |
| Geo + clock | `:529-531` | the clock costs a 30 s `setInterval` (`:645-652`) |
| `on air · <title>` | `:532` | a `<span>`, **no href**. Dead text pointing at `/station`. |
| AuthMenu | `:535` → `AuthMenu.astro:27` | prints the D1 account name — for a Kukai sign-in that is the tz2 address |
| Bring your AI | `:536` | duplicates the dock's MY AI chip (`FooterBar.astro:166-169`) |
| WalletChip | `:537` → `WalletChip.astro:206` | prints `tz2FjJ…XDFW · kukai` from `localStorage`. **The same address, a second time.** |
| Now · Rooms · Archive · Downloads · For agents | `:538-542` | five nav links competing with three identity chips |

Identity therefore appears **three** times on a signed-in front door: AuthMenu (D1 session), WalletChip
(localStorage `pc:wallets`), and the dock's YOU access-dot (`FooterBar.astro:96`), which has three
states — none / wallet / account — and is the only one that models the difference correctly.

`/for-agents` is already redundant with machine-readable metadata: it ships on every page as
`<link rel="help">` (`src/lib/seo.ts:37`), alongside fifteen other `DISCOVERY_LINKS` including
`/agents.json` and `/llms.txt`. And BLOCKS.md decided this in April: *"No sidebar. No top nav. The
grid is the navigation"* (`BLOCKS.md:187`), with a header of *"wordmark + block count + current time,
one line"* (`:185`). The masthead grew back anyway.

### 1.2 The dock

`FooterBar.astro` is 2,478 lines / 104 KB of markup and scoped CSS with **zero** `<script>` blocks —
all behaviour is in `src/scripts/chrome/footer-bar.ts`, 105 KB of source. `chrome.ts:2-8` imports all
seven mount modules **statically**, so every page ships the whole chrome bundle: footer-bar 105 KB +
spell-layer 59 KB + cursor-room 33 KB + auth-menu 11.5 KB + dock-launcher 8 KB + tug-rope 7 KB +
burst-ticker 4 KB = **237 KB of chrome TypeScript**, plus **25.5 KB of inline `<script>`** in the
chrome components (WalletChip 11.4 KB, OpenAdRail 7.0 KB, FreshnessChip 3.1 KB, FirstSee 2.6 KB,
BlockLayout 1.3 KB). Nothing is code-split by whether the visitor opened the thing.

**One input, eight modes, no affordance.** `inferOmniMode` (`footer-bar.ts:229-242`) branches on the
first character: `/ai`→AI, `!`→AIR, `+`→CAST, `>`→OP, `?`→ASK, `@`→AGT, `/` or `http`→GO, otherwise
SAY. The only hint is a two-character mode pill and an `aria-label` (`FooterBar.astro:155`). The
fallback for unrecognised text is `/search?q=…&from=/<firstword>` (`footer-bar.ts:690`).

**Ten trays** behind nine visible controls (YOU, crowd, omnibox, MY AI, six kit stamps, ≡).
`DOCK_KIT` has eight items, two of which are `placement: 'workbench'` **and** `status: 'coming'` —
FED (`dock-kit.ts:131-132`) and BROADCAST (`:148-149`). FED's tray renders `FEDERATION_PEERS`: five
peers, two `live`, two `beta`, one literally `dream`. BROADCAST is marked `readOnly` and its two
director actions are gated on `localStorage['pc:director'] === '1'` (`FooterBar.astro:102-104`).

Concrete dead weight shipped on every page:

- `.fb__on-air` is `display: none` (`FooterBar.astro:1211`) and **nothing in `footer-bar.ts` ever
  un-hides it**. The ON AIR lamp at `:200-203` has never rendered.
- Three dead media queries hide `[data-tray='fed']` and `[data-tray='broadcast']` at 380/320 px
  (`:1207-1208`, `:2186`, `:2189`) — neither is in `STRIP_DOCK_KIT`, so they were never there.
- The ≡ menu carries a **fifth** hand-curated route list (`:873-905`): 4 rooms, 7 games, 6 agent links.

### 1.3 The front door

18 sections: 17 `Home*` components imported at `index.astro:23-42`, two more rendered transitively
(`HomeShortwaveLive` inside `HomeWelcome`, `HomeMusicViz` inside `HomeMusicOn`), plus two inline
sections (channels, machine endpoints). Source total across `index.astro` + its component tree:
**261 KB**, of which **67.7 KB is inline `<script>` in ten blocks** — `HomeMusicOn` 12.1 KB,
`HomeWelcome` 11.2 KB, `HomeMusicViz` 14.1 KB, `HomeFrontDoorDesk` 9.1 KB, `HomePlayFirst` 7.5 KB,
`HomeShortwaveLive` 6.8 KB, `index.astro` 2.6 KB. Ten of the seventeen imported components ship zero JS.

**15 orphaned `Home*` files** are imported by nothing: 5,898 lines and 52 KB of inline JS that never
ships. `HomeOceanDrum.astro` alone is 24.2 KB of dead script — more than a third of the live page.
`HomeFireplace 2.astro` is a duplicate-with-a-space of `HomeFireplace.astro`, eleven times its size.

`PINNED` (`index.astro:55-74`) is thirteen hand-typed numbers stamped `countedAt: '2026-09-01'` — 20
days stale as of today. Four refresh client-side; nine do not.

**The duplication table.**

| Thing | Count | Where |
|---|---|---|
| Presence / "who is here" | **6** | `HomeWelcome:13` · `HomeShortwaveLive:18` · `HomeMusicOn:123` · `HomeAgentDesk:99` · `FooterBar:110` (crowd) · `FooterBar:229` (tray). Plus a 7th at `FooterBar:526` (broadcast AUDIENCE). |
| …of which fetch `/api/presence/snapshot` independently | **2** | `HomeWelcome:88` and `HomeShortwaveLive:86` — both in the same hero, ~20 lines apart |
| Now playing / "what is on" | **5** | masthead `index.astro:532` · `HomeMusicOn:58` · `HomeMusicOn:123` (per-visitor) · `HomeMusicViz:19` · `FooterBar:506`. The masthead fetches `/now-playing.json` at `:655`; `cursor-room.ts:418` fetches it **again**; `FooterBar` renders a build-time `NOW_PLAYING` import — **they can disagree on one screen.** |
| Four-pad Rosebud instruments | **3** (12 pads) | `HomeWelcome:16-23` · `HomeMusicOn:22/85` · `HomePlayFirst:23/47`. Same four voices, same A/S/K/L keys, `pads` array declared three times. Only `HomePlayFirst` owns the AudioContext; the others dispatch `pc:rosebud:hit` into it. |
| "Start here" / orientation lists | **4** | `HomeStartHere:31` "First time here? · Start here" · `HomeWelcome:26` "Ways in" (3 numbered doors) · `HomePlayFirst:41` ("Start here ↓" — an anchor back to the first) · `HomeFrontDoorDesk:52` "Start here" |
| "What's new" lists | **4** | `HomeFrontDoorNews` (8 items) · `HomeCurrentProjects` (9) · `HomeWire` (newest blocks) · `HomeShipLog` (milestones). Almanac and Kennel Club appear in three of them. |
| Room registries that never agree | **6** | `index.astro` `rooms[]` (52) · `pages/rooms.astro` (9, **hard-coded fake presence**: `"3 here"`, `"12 here"` at `:52-136`) · `lib/explore.ts` FEATURES (auto-built, the only honest one) · `lib/pointcast-apps.ts` (73) · `data/scoreboard.json` (52) · `FooterBar:873` (17) |

`HomeFrontDoorNews.astro:15` hard-codes "Changed since Sep 02" as a string, so the kicker rots
independently of the data. Its grid is `repeat(7, …)`; the JSON now has eight items.

### 1.4 What the town already knows (and isn't using)

- **Presence carries `currentPath` per session** (`cursor-room.ts:401`, `:456`). Presence-by-path is
  free — no new tracking, no new endpoint.
- **`scoreboard.json`** has 52 rows with `use, craft, reach, fresh, inbound, blockRefs, onHome, total`.
  Eight rows have a real `use`: `/drum` 26,103 · `/drum-v8` 26,103 · `/prayer-altars` 69 · `/blue` 8 ·
  `/prayer-candles` 2 · `/drum-letters` 2 · `/bell-post` 1 · `/drum-bulletin` 1. Generated 2026-08-17.
- **`PageviewBeacon.astro` exists and is mounted nowhere.** `/api/analytics` is live with sampling
  (`functions/api/analytics.ts:108-117`), but `register.astro:39` claims *"Every page now reports one
  path-only pageview."* Not true today. **The single highest-value fix in this document.**
- **Freshness** per path is already computed from git in `explore.ts`.

---

## 2 · The module contract

One file per module in `src/data/modules/<id>.ts`, default-exporting a `TownModule`. A generated
`src/data/modules/index.ts` (a `import.meta.glob`, eager) is the only list anyone reads.

```ts
export interface TownModule {
  // ── required ──────────────────────────────────────────────
  id: string;              // stable slug, never reused. 'drum', 'station'
  title: string;           // sentence case
  href: string;            // canonical path
  kicker: string;          // ≤ 60 chars, the one line under the title
  channel: ChannelCode;    // must exist in lib/channels.ts
  born: string;            // YYYY-MM-DD, set once, never edited
  status: 'new' | 'current' | 'shelved' | 'archived';

  // ── optional ──────────────────────────────────────────────
  json?: string;                  // machine twin. agents.json + <link rel=alternate>
  noun?: number;                  // 0–1199, noun.pics seed. default: hash(id)
  image?: { src: string; alt: string };   // alt required if src is set
  signal?: ModuleSignal;          // how this module proves it is alive
  stamp?: ModuleStamp;            // dock presence
  shelf?: string;                 // component name for a bespoke front-door shelf
  weightHint?: number;            // -1..1, director's thumb. default 0
  successor?: string;             // required when status is 'shelved'
}

export type ModuleSignal =
  // The town socket already carries it. Zero new requests.
  | { kind: 'presence'; match: string }            // path prefix; count sessions
  | { kind: 'event'; name: string; reduce: 'count' | 'last'; window: number }
  // A JSON endpoint. The front door fetches ONE batched /api/signals call.
  | { kind: 'endpoint'; url: string; pick: string; ttl: number; fallback: number | string };

export interface ModuleStamp {
  glyph: string;
  tray: 'panel' | 'link';   // 'panel' renders <slot>; 'link' just navigates
  priority: number;         // 0–100; the dock keeps the top 4 and buries the rest
}
```

**Rules.** `id` is immutable (the block-ID rule, `BLOCKS.md:130`). `born` is set once. `alt` is
required whenever `image.src` is set — ending the "empty alt in 4 of 9" problem in
`home-current-projects.json`. `channel` must resolve in `lib/channels.ts` or the build fails.
`status: 'shelved'` requires a `successor`. A module with no `signal` just cannot rank into *now*.

**Lifecycle.** `new` → `current` is automatic at `born + 14 days`. `current` → `shelved` is automatic
when a module has a `signal` and scores zero use for a season (90 days) — the rule `register.astro:41`
already promises and does not enforce. `shelved` → `archived` is **Mike only**; nothing is ever
deleted, routes stay live, blocks stay on the wire. An agent may propose a status change in a PR, but
only Mike merges a demotion: it is an editorial judgement about someone's work.

**Who reads the list.**

| Reader | Reads | Replaces today's |
|---|---|---|
| Front door | all modules, ranked (§3) | 52-entry `rooms[]`, `covers[]`, `drumGames[]`, `front-door-news.json` |
| `/rooms` | all, grouped by channel | 9 hard-coded rooms with **fake** presence |
| Dock | `stamp` present, top 4 by `priority` | `DOCK_KIT` + the `:873` route list |
| `agents.json` | `{id,title,href,json,status,born,channel}` | hand-maintained `AGENT_SURFACES` blocks |
| Sitemap / `seo-rules.mjs` | `status !== 'archived'` | a manual `NOINDEX_PATHS` set |
| MCP `surfaces_list` / `town_map` | the same projection as `agents.json` | hand-typed tool payloads |
| `/api/signals` | every `signal` of kind `endpoint`, batched server-side | 3 separate front-door fetches |

Ranking, computed at build from data the town already has — **no new tracking**:

```
score = 0.45·norm(use) + 0.25·presence_now + 0.20·freshness + 0.10·inbound + weightHint
  use          scoreboard.json .use, log-scaled (drum is 26,103 vs 69 — linear is useless)
  presence_now sessions whose currentPath matches signal.match  (client-side, re-ranks live)
  freshness    exp decay on git last-commit for the module's paths, 30-day half-life
  inbound      scoreboard.json .inbound, links from elsewhere in town
```

`weightHint` is the only human input and it is bounded at ±1, so the director can push a thing up a
band but cannot pin it above a room strangers actually use. Nothing ranks by seniority.

### Worked example 1 — the drum

```ts
// src/data/modules/drum.ts
export default {
  id: 'drum',
  title: 'The drum',
  href: '/drum',
  kicker: 'Four pads. Everyone here hears it. No account.',
  channel: 'SPN',
  born: '2026-04-17',
  status: 'current',
  json: '/api/drum',
  noun: 7,
  signal: { kind: 'endpoint', url: '/api/drum', pick: 'globalTotal', ttl: 60, fallback: 26103 },
  stamp: { glyph: '🥁', tray: 'panel', priority: 95 },
  shelf: 'ShelfDrum',
} satisfies TownModule;
```

The pads themselves become **one** component with a `variant` prop (`hero` | `inline` | `dock`),
owning one AudioContext, replacing the three declarations of the same four voices. `fallback: 26103`
is the last counted value, so the server-rendered HTML carries a true-as-of-build number for an agent
with no JS. It ranks first by construction: log-scaled use of 26,103 against a field whose next
non-drum entry is 69.

### Worked example 2 — the station

```ts
// src/data/modules/station.ts
export default {
  id: 'station',
  title: 'Mike Hoydich Radio',
  href: '/station',
  kicker: 'What is on right now, and the log of everything played.',
  channel: 'SPN',
  born: '2026-09-19',
  status: 'new',
  json: '/station.json',
  noun: 333,
  image: { src: '/images/front-door/station.jpg', alt: 'A hi-fi receiver dial lit at dusk' },
  signal: { kind: 'endpoint', url: '/now-playing.json', pick: 'title', ttl: 45, fallback: '' },
  stamp: { glyph: '◉', tray: 'link', priority: 60 },
} satisfies TownModule;
```

This single `signal` is what the masthead's `on air`, the dock lamp, and the Music-on shelf all read.
Three surfaces, one fetch, one truth — which is exactly what `index.astro:655` and `cursor-room.ts:418`
fail to do today. An empty `pick` means off-air, and every reader hides itself; no reader invents a
placeholder. `status: 'new'` expires on its own at 2026-10-03; nobody has to remember.

---

## 3 · The front door

Three bands. **Now** (this minute), **New** (max five, since the last one you saw), **The town**
(everything else, compact, by channel). Each band is a rendered `<section>` in the server HTML; the
ranking is baked at build and only re-sorted client-side by the presence term.

```
PHONE (375)                              DESKTOP (≥1024)
┌───────────────────────────────┐        ┌──────────────────────────────────────────────────┐
│ PointCast      ● tz2FjJ…XDFW  │ header │ PointCast  12:50 PT  ◉ on air: Baker St  ● you   │
├───────────────────────────────┤        ├──────────────────────────┬───────────────────────┤
│ NOW · 3 here · 1 AI           │        │ NOW                      │ ◉ ON AIR              │
│ ┌───────────────────────────┐ │        │ 3 here · 1 AI · El Seg.  │ Baker Street          │
│ │ ▸ "the fog is back"  2m   │ │ SHORT- │ ┌──────────────────────┐ │ Gerry Rafferty        │
│ │ ▸ "claimed 14"       9m   │ │ WAVE   │ │ ▸ "the fog is back"  │ │ → /station            │
│ │ [ say something…      ↑ ] │ │        │ │ ▸ "claimed 14"       │ ├───────────────────────┤
│ └───────────────────────────┘ │        │ │ [ say something…  ↑ ]│ │ ● ● ● ●  4 faces      │
│ ┌───────────────────────────┐ │        │ └──────────────────────┘ │ /shortwave →          │
│ │ ROOT BLOOM  DEW  THORN    │ │ DRUM   │ ┌──────────────────────┐ ├───────────────────────┤
│ │  ▢    ▢     ▢     ▢       │ │ (one   │ │ ROOT BLOOM DEW THORN │ │ 26,103 hits           │
│ │ 26,103 hits · 2 drumming  │ │ synth) │ │  ▢    ▢    ▢    ▢    │ │ the one room          │
│ └───────────────────────────┘ │        │ └──────────────────────┘ │ strangers use         │
├───────────────────────────────┤        ├──────────────────────────┴───────────────────────┤
│ NEW · 5 since you were here   │        │ NEW · five since Sep 14                          │
│ 01 Station  02 Pool  03 …     │        │ ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐              │
├───────────────────────────────┤        ├──────────────────────────────────────────────────┤
│ THE TOWN · 52 rooms           │        │ THE TOWN · by channel, ranked                    │
│ SPN ▸ drum, station, bells…   │        │ SPN │ FD │ ESC │ GDN │ SPN │ …  (10 lanes)        │
│ FD  ▸ shortwave, wild, me…    │        │ ── every module, one compact row each ──          │
│ [ everything → /explore ]     │        │ /explore · /archive · /agents.json · /feed.xml    │
└───────────────────────────────┘        └──────────────────────────────────────────────────┘
```

**Above the fold, by visitor.**

| Visitor | Gets first | Why |
|---|---|---|
| First-time human | Shortwave box (live lines + an input) → pads → one sentence of what this is | Communication first, per the brief. The pads are the only thing 26,000 strangers have ever touched. |
| Returning human | Same frame, but **NEW** counts against a `localStorage` last-seen date — "5 since you were here", not "this week" | A date-stamped "this week" rots; a diff does not. |
| **Agent over HTTP, no JS** | A `<main>` whose first `<section>` is `NOW` with build-time values: last cast line, last counted drum total, last on-air track, each with its `json` twin as a sibling `<link>` | Every band is server-rendered. Signals degrade to their `fallback`, which is a true number with a build date, never a placeholder. |

**Removed from the front door, and where it goes.**

| Leaves | Goes to |
|---|---|
| `HomeGlance` (12 counters), `HomeShipLog`, `HomeScoreboard` | `/register` — it is the same board, better |
| `HomeConstellation` (satellites + contracts) | `/constellation`, already exists |
| `HomeAgentDesk` (24 surfaces) | `/for-agents` + `agents.json`; the front door keeps one line |
| `HomeMagazineRack` (32 covers), `HomeBackCatalog` | `/archive`; the top-ranked 2–3 covers rank into **NEW** on merit |
| `HomeBackCatalog`, `HomeWire` | `/archive`, `/press` |
| Channels grid, machine-endpoints list | page foot, one compact row each |
| Two of three pad sets, one of two presence fetches, three of four "start here" lists | deleted |
| 15 orphaned `Home*` files (52 KB dead JS) | deleted |

That is 18 sections down to three bands, and 67.7 KB of inline front-door JS down to an estimated
~18 KB: one presence subscription, one batched `/api/signals`, one drum synth.

---

## 4 · The header and the dock

**One job each.** The header answers *where am I and who am I*. The dock answers *what do I do now*.
Navigation belongs to the dock, because the dock is on every page and the header is not.

### The header, in the end state

```
PointCast          12:50 PT          ◉ on air: Baker Street          ● tz2FjJ…XDFW
```

Four things: wordmark, time, one live state chip, one identity chip. Nothing else. This is
`BLOCKS.md:185` as written, plus the two things BLOCKS.md could not have known about — that the town
would go on air, and that a visitor might be two parties.

Answering the director's specific questions:

- **Now, Rooms** — gone. `/now` is a snapshot of state the header already shows; `/rooms` is a
  hard-coded 9-room page with invented presence numbers that should be rebuilt on the manifest, not linked to.
- **Archive, Downloads** — leave the header. They live in the page foot, and in the dock's GO mode
  (typing `arch` finds them). They are destinations you seek, not state you monitor.
- **For agents** — **does not belong in a human header.** It already ships on every page as
  `<link rel="help" href="/for-agents">` (`seo.ts:37`) next to `/agents.json` and `/llms.txt`.
  Keep it as a quiet mark in the page foot for the human who is curious; the machine has had a better
  door all along. Making it a nav button is shouting a URL at someone who already read the headers.
- **WalletChip** — hide whenever its address equals the signed-in identity. Both derive from the same
  tz2 for a Kukai sign-in; printing it twice is a bug, not a feature.
- **on air** — must be a link to `/station`, reading the `station` module's `signal`. Hidden when
  `pick` is empty; never a placeholder.

The interim trim on `cc/header-trim` gets this most of the way there. The end state also folds
"Bring your AI" into the identity chip (§4.3) and moves the clock into the same chip on phones.

### The dock, in the end state

One input, **three** verbs, not eight modes:

| Verb | Trigger | Does |
|---|---|---|
| **say** | default, or a sentence | Shortwave. The town square. Appears on screen, lands in `/shortwave`. |
| **go** | `/`, a URL, or a word that resolves to a module `id`/`title` | Navigate. Backed by the manifest, so it can autocomplete rooms instead of guessing. |
| **play** | the pads and the on-air chip, right of the input | Four pads, one synth, and what is on. |

`?ask`, `@agent`, `+cast`, `>op` and `/ai` do not disappear — they move behind ≡, where they are
**visible** rather than inferred from a sigil nobody was told about. A mode you can only discover by
reading an `aria-label` is not a feature.

**Stamps are module-provided and capped at four.** The dock reads modules with a `stamp`, sorts by
`priority`, renders the top four, and the rest live in ≡. The four are dynamic: a module in the *now*
band with live presence can hold a slot while it is live. FED and BROADCAST, being `status: 'coming'`
stubs, stop occupying design attention entirely.

**The 160 KB problem.** Attendance, music and the pads must be on every page without shipping the
whole chrome bundle everywhere. Three changes:

1. **Split `chrome.ts`.** Only the bar shell, the omnibox and the presence subscription load eagerly
   (target ≤ 25 KB). `spell-layer` (59 KB), `seismo`, `passport`, `fed` and `broadcast` become dynamic
   `import()` on first tray open. Nothing that has never been opened is ever parsed.
2. **One presence subscription per page**, already a singleton in `chrome.ts:155`. Every counter —
   dock crowd, hero, shelves — becomes a `<span data-signal="presence:…">` that a ~1 KB reducer fills.
   Six surfaces, one socket, no component-level `fetch`.
3. **One batched `/api/signals`** for every `kind: 'endpoint'` signal on the page, replacing the three
   separate front-door fetches. Server-rendered fallbacks mean the page is correct before it runs.

### The 2027 lens

A visitor is one of three things, and the chrome should be able to say which without a crypto dashboard.

- **A person.** One identity chip, one Noun, a name. The default and the quietest.
- **A person with an agent alongside.** The access dot already models three states; extend it to a
  **pair** — your Noun and, beside it, your agent's, when an agent is acting for you in the same
  session. The square shows "3 here · 1 AI" today (`HomeShortwaveLive:97`); that should be something
  you can *be*, not a statistic about other people. An agent acting for you is attributed to you,
  which is also the honest thing.
- **An agent alone.** Gets a Noun and a presence row like everyone else, and the `<link rel="help">`
  it already had. No human chrome, no consent banner, no JS requirement.

**Wallets are identity and memory, not payment.** The chip should read as *how the town knows you and
what it remembers* — handle, stamps, kept things — never as a balance. Concretely: the header chip
shows a handle or shortened address and **no ꜩ figure**; the balance and token count
`WalletChip.astro:259-271` fetches move to `/me`, where someone went looking for them. A balance in
persistent chrome turns a town into an exchange.

**Collectives.** Stamps and ranking already work regardless of who runs a room. The smallest honest
addition is an optional `stewards?: string[]` — handles, not wallets — rendered as a face row on the
room's own page and nowhere else. Enough to say "these three run this" without building governance.
Multisig and treasuries are out of scope for chrome; a collective that needs them needs a page.

---

## 5 · Migration

The suite is **264 `.mjs` test files**; 48 genuinely read `src/pages/index.astro` (62 match the string,
14 match a *different* `index.astro`). The dominant style is a literal source grep of the raw `.astro`
text — ~2,800 assertions, style (a) present in all 62 files, and **zero** tests that hit a live URL.

**A correction to the brief.** Three tests fail on `main`, not four, and the list is different:

1. `front-door-fresh.test.mjs:118` — expects `All eighteen Beach Commons editions`; the rack now says
   `nineteen` (`HomeMagazineRack.astro:111`) because v19 shipped.
2. `front-door-september.test.mjs:34` — the seven-item `deepEqual`; `front-door-news.json` gained a
   **Faucet** entry, making eight.
3. `home-signal-instrument.test.mjs:19` — expects exactly one `<h1>` across `index + desk + playFirst`,
   gets 0, because the `<h1>` moved into `HomeWelcome`, which that test does not read.
   `front-door-fresh.test.mjs:164` does the same check *including* `HomeWelcome` and passes.

So **the "four-pad Rosebud" failure and the "on-page SEO invariant" failure are the same assertion** —
failure 3, inside a test named for the pads. The pad count at `:20` passes. The "current field
edition" test (`home-signal-instrument.test.mjs:56-65`) passes. Anyone planning around four independent
failures is planning around one that does not exist.

**The rewrite principle.** A literal grep of `index.astro` tests a *file*, not the town. Move every
such assertion to the **manifest** (does a module exist, with this href, channel, status?) or to the
**built HTML** in `dist/` (does the rendered front door contain this href?). Manifest assertions
survive a shelf moving; `dist/` assertions survive a component changing. Three tests already read
`dist/` under an `existsSync` guard (`town-inspector-honesty:140`, `kennel-club-room:159`,
`microduck-future-book:52`) — copy that guard, and the migration needs no build in CI.

| PR | Spec | Model |
|---|---|---|
| **1 · Green the suite** | Fix the three real failures without touching design. Update `front-door-fresh.test.mjs:118` to `nineteen`; add `Faucet` to the expected array in `front-door-september.test.mjs:34` (or move that assertion to a count + shape check, which is the better fix since the closed `deepEqual` will break on every news item forever); include `HomeWelcome` in the `<h1>` concatenation at `home-signal-instrument.test.mjs:19` so the two `<h1>` tests agree. No source changes. **Nothing else starts until main is green.** | Sonnet |
| **2 · Mount the beacon** | Add `<PageviewBeacon />` to `BlockLayout.astro` inside the `!immersive` block. The component and the endpoint both exist and are sampled; only the mount is missing. Add one test asserting it is in the layout. This is what makes ranking real, and it needs 30 days of data before PR 6 can use it — so it ships first. **Also correct `register.astro:39`, which claims this already happens.** | Sonnet |
| **3 · Delete the dead** | Remove the 15 orphaned `Home*` files (5,898 lines, 52 KB), `HomeFireplace 2.astro`, the three dead media queries at `FooterBar.astro:1207,2186,2189`, and either wire or remove `.fb__on-air` (`:1211`). Verify each file's import count is zero before deleting. No behaviour change; the suite must be untouched. | Sonnet, from this list |
| **4 · The types and two modules** | Land `src/data/modules/types.ts` plus `drum.ts` and `station.ts` exactly as written in §2, plus the glob index and a validator test (ids unique and immutable, `channel` resolves, `alt` present when `src` is, `successor` present when `shelved`). **Nothing reads them yet.** A new module file must be addable with no other change. | Sonnet from this spec |
| **5 · One signal, one truth** | Add `/api/signals` batching every `kind: 'endpoint'` signal. Repoint the masthead `on air`, the Music-on radio strip and the dock lamp at the `station` module; delete the duplicate `/now-playing.json` fetch at `cursor-room.ts:418` and the build-time `NOW_PLAYING` import at `FooterBar.astro:51`. Make `on air` a link. First visible win: three now-playing surfaces stop disagreeing. | Sonnet; **Opus reviews** the socket change |
| **6 · One presence, one drum** | Collapse the two `/api/presence/snapshot` fetches to the single town-socket subscription and a `data-signal` reducer. Collapse the three pad sets into one `<Pads variant>` with one AudioContext. Rewrite `home-signal-instrument.test.mjs` to assert against the component and the manifest rather than a concatenation of three files. | **Opus** — the drum is the one room that works; breaking it costs more than everything else combined |
| **7 · The three bands** | Rebuild `index.astro` as NOW / NEW / THE TOWN over the ranked manifest. Port the ~48 `index.astro` greps: href assertions become `dist/index.html` greps behind an `existsSync` guard; "does this room exist" assertions become manifest assertions. Delete the shelves listed in §3. | **Opus** designs the port; Sonnet executes per-test |
| **8 · Header and dock** | Header to four slots. Dock to three verbs, four module-provided stamps, `spell-layer` and the four cold trays behind dynamic `import()`. Add a test asserting the eager chrome bundle stays under a byte budget. | **Opus** — the mode collapse changes muscle memory |
| **9 · One list** | Rebuild `/rooms` on the manifest (killing the fake presence strings), and repoint `agents.json`, the sitemap and the MCP surface tools at the same projection. Register any new MCP tool module in `servedCatalogue()` per `town-inspector-honesty`. | Sonnet |

PRs 1–5 are visible value inside a week and touch no design. PRs 6–8 are where judgement is needed.

---

## 6 · Risks

1. **The drum is 99.7% of measured use.** Every ranking rule, every band, every test rewrite must leave
   `/drum` and the pads working. PR 6 is the one place this project can actually lose something.
2. **Ranking on `use` when only 8 of 52 rooms have a counter** means ranking mostly on freshness and
   craft — i.e. on what the agents happened to build last. The beacon (PR 2) needs ~30 days before the
   ranking is honest. Until then the *now* band should be presence + drum + station only, and say so.
3. **Literal-grep tests are load-bearing documentation.** ~2,800 assertions encode decisions nobody
   wrote down anywhere else. Deleting one is sometimes deleting the only record of a choice. Port, do
   not delete; when an assertion is genuinely obsolete, say which PR obsoleted it in the message.
4. **Two design laws, both true.** BLOCKS.md is Bloomberg-terminal grammar: white paper, Inter + mono,
   two weights, hard corners, channel colour. Geocities + Sim City is the *rooms*: saturated, pixel,
   late-90s chrome, real Nouns. They coexist on a **chrome vs content** split — the shell, header,
   dock, bands and every index are BLOCKS.md, always; a room's interior is its own world and may be as
   loud as it likes. The front door is an index, so it is BLOCKS.md — but its *tiles* carry each room's
   colour and its real Noun, which is how the town stays saturated without the shell becoming a theme
   park. The failure mode is the third thing: clean AI-product neutral.
5. **Nothing here increases traffic.** This is maintainability work on a site with no visitors — the
   right call while playing the long game, but not growth work, and a fourth week of it would be.

## Questions only the director can answer

1. **Demotion rights.** Can an agent open a PR that moves a room from `current` to `shelved` when the
   90-day rule fires, or is every demotion yours to merge? (The contract assumes yours.)
2. **The `weightHint` ceiling.** Bounded at ±1, you can move a room up a band but not pin it above the
   drum. Is that the right limit, or do you want an unbounded pin for a launch week?
3. **What does "new" mean for a returning visitor?** A diff against their last visit (needs one
   `localStorage` date, no server) or a fixed seven-day window (simpler, rots, and is why the current
   "New this week" says "Changed since Sep 02" in late September)?
4. **`/rooms`, `/explore`, `/everything`, `/town`, `/apps`, `/register` are six indexes of the same
   town.** Once they read one manifest, which one survives as *the* index, and do the others redirect
   or stay as different views?
5. **The eight omnibox modes.** `?ask`, `@agent`, `+cast`, `>op`, `/ai` — collapsing to three verbs
   moves them behind ≡. Do you use any of those sigils yourself often enough that losing the keystroke
   would annoy you?
