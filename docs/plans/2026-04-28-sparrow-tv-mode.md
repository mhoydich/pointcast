# Sparrow · TV mode

**Author:** Claude (in conversation with Mike) · 2026-04-28
**Status:** plan + scaffold
**Pairs with:** [Sparrow 2026 → 2027 browser plan](2026-04-24-sparrow-2026-2027-browser.md) — TV mode is a surface, not a parallel product.

---

## TL;DR

Sparrow gets a **TV-first surface** at `/sparrow/tv`. Not a smaller version of `/sparrow`; a different layout for a different room. 10-foot UI, slow rotation, ambient federation, no mouse. Composes with the patterns Mike already proved on `/sit` (surface-detect + breath-cycle ambient) and `/tv` (slide rotation + STATIONS mode + cast/AirPlay-shaped chrome).

In the 2026 → 2027 browser plan, TV mode is **a third way Sparrow shows up** — alongside the desktop power-user surface and the Sparrow.app menu-bar companion. It's where federation becomes glanceable at distance: friends' saves, ambient presence, channel reels rendered for a wall, not a window.

The pivot framing: this is the surface where "browse the AI" looks most obviously different from Chrome. Chrome is meaningless on a TV. A federated reading-and-presence broadcast is the thing TVs were always supposed to be.

---

## 1. What already exists (re-use, don't rebuild)

- **`/tv`** (2053 LOC) — daily block + recent blocks + polls interleaved into a slide rotation. STATIONS mode filters by SoCal city. Already cast/AirPlay-tested. Slide animation, channel chips, ticker.
- **`/sit`** (551 LOC, just shipped today) — TV-first ambient surface with surface-detect (`(w>=1920 && no touch) OR UA matches tv|appletv|googletv|crkey`), time-of-day color wash, breath-cycle ring, oversized text on TV.
- **`SitTile.astro`** — home-feed live ribbon pattern (presence ribbon hidden until the WS reports N>0, falls back to HTTP, falls back to local-only).
- **`/drum-tv-bingo`, `/drum-tv-gauntlet`** — proves Mike's house pattern for "TV-mode of an existing surface" (drum app gets two big-screen variants).
- **Sparrow federation primitives** (v0.36) — kind-30078 saves, kind-20078 presence, friends list, signals recap, federation.json.
- **OKLCH blue-hour palette** — already designed for low-light viewing; reads on TV without re-tuning.
- **Channel rosette** — 9 channels with editorial color tokens (FD/CRT/SPN/GF/GDN/ESC/FCT/VST/BTL); maps cleanly to TV-channel UX.

The whole composition story: take `/sit`'s surface-detection contract + `/tv`'s slide-rotation engine + `/sparrow`'s federation primitives + the rosette as a literal TV channel preset. That's `/sparrow/tv`.

---

## 2. What `/sparrow/tv` is for

A leaning-back surface, on a wall, in a room. Three uses:

**a) Ambient broadcast.** You leave Sparrow running on a TV. It cycles through the latest Front Door blocks, your saved list, and a channel rotation, with the federation strip showing who's reading right now. No interaction. Kitchen TV at sunrise, bedroom TV at dusk.

**b) Channel viewer.** D-pad numbers 1–9 = the nine channels. Press 1 → Front Door reel locks on. Press 5 → Garden plays. Like cable. Each channel has its own pace + color wash + (eventually) Sonic Postcard ambient bed.

**c) Federation room.** A channel called `friends` shows what your followed npubs have just saved, ambient-style. When alice saves a block, her avatar pulses on the strip and the next slide is her save. Quiet co-presence — the social feed equivalent of a fish tank.

Not for: composing, replying, configuring, sign-in flows. Those stay on desktop.

---

## 3. Routes + surfaces

| Route | Shape | When |
|---|---|---|
| `/sparrow/tv` | Default ambient — daily + reel + saved + friends interleave; channel rotates every ~6 slides | Phase 1 (this scaffold) |
| `/sparrow/tv/ch/<slug>` | Channel-locked — only blocks from one channel; deep palette wash matching the channel color token | Phase 1 |
| `/sparrow/tv/friends` | Federation channel — only blocks recently saved by followed npubs; avatar strip persistent | Phase 2 |
| `/sparrow/tv/saved` | Personal — your `sparrow:saved` list cycling; opt-in (TVs in shared rooms shouldn't show personal data by default) | Phase 2 |
| `/sparrow/tv/remote` | Companion — phone shows a QR-paired remote when on the same network as a TV running `/sparrow/tv` | Phase 3 |

Each route honors `data-surface="tv"` from the `/sit` pattern. On non-TV viewports, the page degrades to a clean preview with a "best on a 1920+ landscape display" banner. Don't fight the form.

---

## 4. Layout system (10-foot UI)

10-foot UI rules of thumb that Sparrow should adopt (none of this is in `/sparrow` today):

- **Minimum text size 32px**; titles 88–120px. Line-height generous (1.18 for titles, 1.5 for body).
- **Six grid columns or fewer**. Anything denser doesn't read at 10 ft.
- **High contrast, low chroma backgrounds**. The blue-hour OKLCH palette is already this — extend, don't replace.
- **Slow motion**. Slide transitions 600–900 ms. Auto-rotate 9–14 s per slide. Match `/tv` cadence.
- **Safe area inset**. 5% margin on all sides — TV overscan is still a thing in 2026.
- **No hover states**. Hover doesn't exist on a remote. Focus rings replace; thick (4 px) and high-contrast.
- **Focus-trap navigation**. D-pad cycles between 3–5 named regions per surface (channel-list / slide / ticker / footer).
- **Audio is intentional**. If a Sonic Postcard plays, it's part of the channel identity; volume per-channel, fade between channels.

CSS posture:
- Reuse the existing OKLCH tokens (`--sp-ink`, `--sp-blue-hour`, `--sp-ember`, etc).
- Add three new TV-only CSS vars: `--tv-pad`, `--tv-h1`, `--tv-h2`, `--tv-body` — sized off `vmin` so the layout adapts from 1080p to 4K without per-resolution stylesheets.
- `data-surface="tv"` switches typography scale; `data-surface="desktop"` keeps the existing v0.36 chrome.

---

## 5. Input model

| Surface | Input | Notes |
|---|---|---|
| Smart-TV browser (Tizen, WebOS, Vizio) | D-pad + OK + back; Tizen exposes 4 color buttons | Map: ←/→ flip channel · ↑/↓ enter detail / exit · OK = save · back = home · color buttons unused for now |
| AppleTV (Safari via AirPlay mirror) | Whatever the iOS device sends — typically remote OR keyboard | Already works with `/tv`. Don't regress. |
| Chromecast (cast from Chrome) | Phone is the remote — handled by Cast Receiver SDK if we go that far; for v0.1, no input | Slide rotation is the whole UX |
| Browser preview on desktop | Mouse + keyboard | Click anywhere to step to next slide; ←/→ also works |
| Phone (`/sparrow/tv/remote`) | Touch surface acting as D-pad after QR-pair | Phase 3 |

Voice is deliberately deferred. Smart-TV voice is fragmented across vendors; Apple TV requires native app for Siri integration; Chromecast voice goes through Google Assistant. Wait until distribution is a real problem before solving it.

---

## 6. Federation on TV (the actually new thing)

Existing /tv surfaces have no concept of "what your followed signers are doing right now." Sparrow's federation primitives mean a TV can show:

**Avatar strip.** Bottom-of-screen, 8 avatars max. Each avatar pulses moss when its npub published a kind-20078 presence event in the last 90 s. Same data the v0.30 ambient strip already consumes. Re-use the watcher logic.

**Save-driven slide injection.** When a friend's kind-30078 saved-list event lands, splice their save as the next slide with a "alice saved this" overlay. Falls into the rotation gracefully — slide-in animation already exists in /tv. The hand-off mirrors what `/sparrow/friends/activity` does in foreground.

**Channel = relay.** For phase 2's `/sparrow/tv/friends`, the entire slide pool is friends' saves rather than PointCast blocks. PointCast becomes a content surface for the rotation; friends become another content surface; mix at user preference (`sparrow:tv-mix` in localStorage — `pointcast` / `friends` / `both`).

**No identity exposure on shared TVs.** When `data-surface="tv"`, default `sparrow:tv-mix=pointcast`. Showing your follow list on a kitchen TV by default is a privacy mistake. Opt-in via QR-paired remote (Phase 3) or via a one-time setup on `/sparrow/tv?onboard=1`.

---

## 7. Audio (deferred but designed for)

PointCast has Sonic Postcards (per-channel procedural audio profiles, mentioned in earlier sprints under `/clock/0324`). When a TV locks on a channel, the Sonic Postcard fades in as ambient bed (60–80 dB SPL equivalent at typical TV viewing distance). Cross-fade between channels.

Concrete plan for v0.3:
- Each channel exposes a `vibeProfile` already (per the federation/api/soundtracks work).
- TV-mode hosts a small mixer: master volume in a corner that responds to D-pad volume up/down (most smart TVs forward this); per-channel volume saved to localStorage.
- Default: muted on first load; the user opts in.

---

## 8. Distribution

Three real paths plus one fantasy path:

**a) Browser-on-TV.** Visit `pointcast.xyz/sparrow/tv` in the smart-TV's built-in browser. Free. Works today on Vizio SmartCast, LG WebOS, Samsung Tizen, Fire TV browser. UX is the limiter. Sparrow ships first as a URL.

**b) Cast / AirPlay.** Play `/sparrow/tv` on a phone or laptop, cast/AirPlay to TV. Existing `/tv` already proves this works. No code change needed beyond making `/sparrow/tv` cast-friendly (which the `data-surface=tv` JS already handles when the *receiving* device is a TV — but most cast scenarios mirror the source, so a desktop browser on phone-mirror-cast might render desktop layout).

Mitigation: query param override `?surface=tv` for explicit casting cases. Tiny scope.

**c) Apple TV via TestFlight WebView shell.** The Sparrow.app native shell idea from the 2027 plan extends naturally — a small tvOS app that loads `/sparrow/tv` in WKWebView with overscan-safe insets and remote-event forwarding. Defer to Q4 2026 once the desktop native shell decision is made.

**d) Roku / Android TV channel apps.** Both platforms allow web-based channels (Roku via SceneGraph/HTML packages, Android TV via PWA). Higher friction. Skip until 1k DAU on `/sparrow/tv` proves it's worth the build.

---

## 9. Phases

### Phase 1 (now → mid-May 2026): ambient broadcast
**Goal: TV-mode for the existing federation reader. Zero new infra.**

- Ship `/sparrow/tv` ambient route — daily PointCast blocks + recent blocks + saved-by-friends interleave in a slide rotation.
- Ship `/sparrow/tv/ch/<slug>` channel-locked variant.
- Surface-detect via the `/sit` pattern.
- Avatar strip wired to existing kind-20078 presence watcher.
- Build green; cast-test from a desktop browser to a Chromecast.
- This scaffold (next section) is the v0.1.

### Phase 2 (June 2026): federation channel + saved channel
**Goal: friends become a first-class TV channel.**

- `/sparrow/tv/friends` — slide pool is friends' saves; avatar strip persistent and prominent.
- `/sparrow/tv/saved` — personal saves cycling; opt-in flag `sparrow:tv-private-ok` defaults to false.
- Mix preference (`sparrow:tv-mix`) lets users blend pointcast + friends.
- One QR code in the corner pointing at `/sparrow/tv/remote` for phase-3 pairing.

### Phase 3 (Jul-Aug 2026): phone-as-remote
**Goal: a TV-Sparrow that responds to a phone in your hand.**

- `/sparrow/tv/remote` — companion route shown after scanning the QR on the TV.
- Phone-TV pairing via a short-lived signed handshake (Web Crypto, no server). Pairing token is a Nostr DM payload signed by the TV's ephemeral pubkey.
- Phone shows: D-pad, channel buttons 1–9, save-to-list button, like-mood chips.
- Multi-pair: a TV can pair with N phones; presence strip shows who's "in the room."

### Phase 4 (Q4 2026): native shells + audio
**Goal: TV-Sparrow runs as an app, with Sonic Postcards.**

- tvOS WebView shell (TestFlight, then App Store).
- Sonic Postcards mixer wired in; per-channel volume preferences.
- The Tauri/Servo decision from the 2027 plan informs whether Android TV / Roku gets a native build or stays web-only.

---

## 10. What ships in this turn

A scaffold, not the full Phase 1. The scaffold proves:

- A `/sparrow/tv` route exists and uses surface-detect.
- The 10-foot CSS scale works (titles 88–120 px on TV; degrades to 32 px on desktop preview).
- Slide rotation engine reuses `/tv`'s pattern.
- Federation avatar strip wired to localStorage friends/profiles (real Nostr WS subscription is Phase 1 follow-up).
- Channel-tinted color wash respects channel codes.

`src/pages/sparrow/tv.astro` lands as a minimal but real surface — buildable, navigable, screenshot-able for the next press piece. Codex-level work to flesh it into Phase 1 proper.

---

## 11. Open questions

- **TV chrome vs. SparrowLayout.** Most Sparrow routes use `SparrowLayout`. TV mode probably doesn't (HUD + footer eat too much screen). Likely a new lightweight `SparrowTVLayout` or just inline HTML, the way `/sparrow/deck` is self-contained. Decision: inline for v0.1, factor out if v0.2 grows a sibling.
- **Authentication on shared TVs.** A kitchen TV showing everyone's saves is a privacy footgun. Default privacy flag is the right call (above) — but the UX for "this TV is private to me" needs design. Phone-pairing is the answer; phase 3.
- **Multi-display sync.** Two TVs in the same house should show the same channel by default. Same-LAN Sparrow.app peer-node pattern can broadcast TV state. Defer.
- **Resolution targeting.** 1080p is the universal floor; 4K is increasingly common; 8K showrooms exist. The `vmin`-based scale handles all three but per-channel imagery (block OG cards, mood imagery) caps at the source resolution. Sparrow's existing `/images/og/b/<id>.png` is 1200×630 — adequate for 1080p, soft on 4K. Image regeneration at 1920×1080 is a small content-pipeline cost, not v0.1.
- **Audio policies on smart TVs.** Most smart-TV browsers block autoplay audio. Sonic Postcards Phase 4 will need to surface a "tap OK to enable sound" first-frame pattern, which itself isn't TV-friendly. Apple TV WebView shell sidesteps this. Roku / Android TV harder.

---

## 12. Why this matters for the 2027 plan

In `2026-04-24-sparrow-2026-2027-browser.md`, the thesis was that Sparrow becomes the browser for the agentic web. TV mode is the surface that proves the thesis to the most people, fastest:

- **It's screenshot-able.** A 4K screenshot of a Sparrow TV showing "alice just saved" + a glowing channel chip + the OKLCH wash is a press artifact. Worth ten Show HN posts.
- **It's a different shape than every competitor.** Comet/Dia/Leo are desktop browsers. None are showing up on TVs. Sparrow's federation primitives extend cleanly; theirs don't.
- **It's a familiar shape to non-tech viewers.** "Like cable, but the channels are made of blocks and your friends." That sentence is more legible than "browse the AI."
- **It's where the 0 kB framework runtime really pays off.** Smart-TV browsers are slow and old; React + 200 kB JS is a non-starter; Sparrow's handwritten chrome runs.

The TV browser angle isn't a side project. It might be the headline.

---

**Next: scaffold `src/pages/sparrow/tv.astro`. See sibling commit.**
