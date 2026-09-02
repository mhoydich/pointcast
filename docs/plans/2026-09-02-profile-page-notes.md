# PointCast "profile page" — inventory for a redesign

Checkout `/private/tmp/pointcast-deploy-20260902` (origin/main @ a1a573a, 2026-09-02).

## 1. Surfaces

| Path | Shows | Keyed on | Reachable from | Status |
|---|---|---|---|---|
| `/dashboard` | Recent trail, "Site Pet" (Signal Pup), featured cards, app/game catalog+search, saved library, activity, Account | `data-dashboard-*` hooks read localStorage client-side only | Not on front door; `AuthMenu` mounts here | Half — panels render, no data wiring found |
| `/auth` ("Account") | Sign-in (Google/Kukai), linked-identity chips, wallet-link buttons, sign-out | Server session via `getSession()` (D1+KV) | The real sign-in surface (per memory) | **Live** — D1 auth shipped PR #1004/#1006, 09-02 |
| `/auth/project` | Cross-project "one wallet, every project" code bridge | Existing session | Deep-link only, not in nav | Live, narrow |
| `/profile` (1682 ln) | Every wallet this browser paired (TzKT balance/NFTs/ops), plus a big dump of blocks/polls/drops/gallery/Spotify | `pc:wallets` localStorage array — explicitly "no server state, scoped to this browser" | `FooterBar` "View profile" on every page | Live, but local-only + hardcodes Mike's Spotify/wallet |
| `/passport` (1276 ln) | Dual-ledger: local ritual/quest stamps + Tezos visas + optional Beacon-signed Seal | `pc:passport:stamps` + connected wallet + signature | `FooterBar`, dock tray № 07 "Passport" | Live, most-invested profile surface |
| `/townsfolk` + `/api/seals` | Public roster of published passport seals, browser-verified | Wallet address from a published Seal | "Publish to registry" on `/passport` | Live — Seal Registry Phase A (2026-07-18) |
| `/u/[slug]` | **Not a person's profile** — OG "mini shrine" pages for fixed content list | Static slug list | Internal OG use | Live, but name is already claimed — see §4 |
| `/collection` | Mike's full Tezos wallet (~200 tokens/~30 contracts) | Hardcoded `tz2FjJhB1…` (Mike) | Mike-only audit page | Live, not visitor identity |
| `/minted` | What the *connected* wallet holds in PointCast's own collections | `pc:wallet-active`, falls back to Mike's wallet | `/passport` nav | Live, per-visitor |
| `/collect`, `/collect/[id]` | Marketplace (Mike's objkt inventory) + buy flow | None; wallet only at buy | Site nav | Live — commerce, not identity |
| `/cat-passport` | Zen Cat travel passport (landmarks/gems/moods) | Static content, no visible persistence found | App registry | Half |
| `/nouns-stamps` | Vintage stamp sheet, click-to-cancel | No identity | `DrumNav` | Live, decorative |
| `/resident.astro` | The **agent** night-shift status (task/success/compute-hours) | Polls local-only `127.0.0.1:8789` | Standalone | Live only with local oracle |
| `/residents` | Roster of AI residents + block-authorship stats | `src/data/residents.ts` + collection stats | Front-door footer "who lives here" | Live |
| Dock PASSPORT stamp | Press today's dated stamp; "full desk" → `/passport` | `pc:passport:stamps` | Site-wide dock | Live |
| Signal Pup companion | Named default pet, mood/care/last | Client-rendered local pet state | Dock + dashboard | Half — stats mostly empty |
| `/kennel-club/[slug]` | Daily dog-portrait NFT plates (not a visitor profile) | Static + on-chain mint | `/kennel-club` index | Live, mainnet `KT1JWNAKy…hwdq`, paused |

## 2. Identity data actually available

- **`functions/api/auth/session.ts`** (D1 `pointcast-auth` since PR #1004, KV legacy fallback): the only real multi-device identity record. `PointCastUser = { userId, createdAt, identities: AuthIdentity[], preferredName, roles? }`; `AuthIdentity = { provider: kukai|google|apple|metamask|phantom|temple|umami, id, name, avatar?, verifiedAt }`. Multiple identities merge onto one user only by explicit link action, never automatically.
- **`getSession()`** (`src/lib/auth/client.ts`) fetches that record and mirrors the active Tezos identity into `pc:wallet-active`/`pc:wallets` for legacy pages that don't call the session API.
- **localStorage (per-browser, unsynced)**: wallet mirror `pc:wallet`/`pc:wallet-active`/`pc:wallets` (~20 pages incl. every `drum-*` game, `/passport`, `/profile`, `/minted`); `pc:nounId` and `pc:visitor:noun` (avatar choice); `pc:passport:stamps` (quests); `pc:mood`/`pc:music:mood`; `pc:director`, `pc:room:on`, `pc:sid`; `pc:voter:*`; plus per-game high scores. None of it survives a browser change.
- **On-chain via TzKT** (no login needed): `visit_nouns` `KT1LP1oTBuu…zVdohxh`, `coffee_mugs` `KT1JQ3Aj…JpoXt`, `kennel_club` `KT1JWNAKy…hwdq`. `window_snapshots`, `zen_cats`, `drum_token`, `prize_cast` have empty `mainnet` fields — not yet originated.
- **Seal Registry** (`docs/plans/2026-07-18-prd-seal-registry.md`): Phase A live (`/api/seals`, `PC_RACE_KV`, client-verified). Phase B (`.tez` lookup, `/u/{address}` profiles, dock seal badge) and Phase C (soulbound FA2, Mike-signed) are **not built** — the PRD's planned `/u/{address}` path is already occupied by unrelated shrine pages.

## 3. What the prior satellites already solved

- **Passportz** (passportz.xyz, Codex): wallet → full "cultural profile," 10 surfaces (Atlas, Circles, Field Guide, Showcase, Journey, Music mint, Badge Lab, Weather Nouns, Operator Quest) — richest prior art for "what a profile page could be," but a separate repo not on Mike's Cloudflare.
- **stampz pages** (stampz.xyz): public one-sheet per passport (`?p=address|name.tez`) — links-as-casts (append-only, newest-wins), stamp strip, QR/vCard/embed, zero new contracts.
- **dotpath** (dotpath.pages.dev): link-in-bio as a *transferable* FA2 NFT — wallet is login, handle→noun.pics seed avatar, on-chain-editable bio/links. Proves "profile as owned, tradeable object" end-to-end.

## 4. Contradictions and duplications

- **Four overlapping "your Tezos stuff" pages**: `/profile` (browser's paired wallets), `/passport` (stamps+visas+seal), `/minted` (PointCast holdings, wallet-scoped), `/collection` (hardcoded to Mike). No single "what do I have" view for a visitor.
- **Identity is split across two unconnected systems**: the real D1 session (`PointCastUser.identities[]`, live since 09-02) vs. the older localStorage wallet mirror still read directly by most pages instead of `getSession()`. They can disagree — signed in with Google but `pc:wallet-active` empty, or a locally-mirrored wallet never linked to the account.
- **`/u/[slug]` name collision**: the Seal Registry's own Phase B plan names `/u/{address}` for wallet profiles, but that route already serves OG shrine pages.
- **localStorage-only state vanishes**: passport stamps, dashboard library, Signal Pup mood/care, and the whole `/profile` wallet list live only in one browser — no cross-device persistence despite a real session existing.
- **`/dashboard` is mostly a shell**: extensive markup, no evident data wiring for Recent/Activity/Library/pet stats.
- **AuthMenu memory note is stale**: `pointcast_wallet_auth.md` calls it "unmounted dead code," but it's mounted in `/auth`, `/auth/project`, `/dashboard`, `DockLauncher` — superseded by the 09-02 Super Auth work.
- **Three external satellites each reinvented "profile"** independently, none reusing PointCast's own session or wallet-mirror code.

## 5. Five candidate directions

1. **[utility]** One holdings view — collapse `/profile`, `/minted`, and visitor-facing `/collection` into a single page keyed on the D1 session's linked wallets, reading TzKT per linked address plus the Seal registry.
2. **[utility]** Server-synced passport — move `pc:passport:stamps` and companion/mood state into the D1 `users` payload so a signed-in visitor's state survives a device switch.
3. **[entertainment]** PointCast-native public one-sheet — port stampz's link-as-cast pattern onto PointCast's own auth + `/townsfolk` registry instead of a separate site.
4. **[entertainment]** Companion as the profile's face — make Signal Pup / `pc:visitor:noun` the real home identity, driven by actual activity (stamps, drum plays, block reads) instead of empty dashboard stats.
5. **[innovation]** Owned, tradeable profile object — extend dotpath's on-chain-editable-NFT model to PointCast identity, pairing it with the Seal Registry's soulbound Phase C seal for two profile classes: owned/tradeable vs. attested/non-transferable.
