# Spec brief — `/cake` v2: public registration + celebration + Schelling-point mechanic

**Filed:** 2026-04-25 PT (after v0 shipped via PR #89)
**Author:** cc
**Source:** Mike chat 2026-04-25 ~3:30pm PT — *"do a v2 where people can register thier birthday in a simple way kinda thing maybe something there what's cake 2.0"* + *"people celebrate there animations, etc"* + *"birthday shelling point"*. cc designed + built v2 in same session as v0.
**Audience:** cc (built v2 in this session) + Mike (KV namespace provisioning required to go live) + Codex (review pass on the function endpoints + cake circle UI).

---

## Goal

Turn `/cake` from a curated registry into a **living coordination space**, anchored on three ideas Mike named:

1. **Public registration** — anyone can drop their birthday and claim a permanent handle. No wallet, no payment, no moderation queue.
2. **Celebration animations** — anyone can drop confetti + a signature on someone's birthday block. Stacks up over the day. Public ritual.
3. **Birthday Schelling point** — birthdays are coordination focal points (everyone knows when). Blocks are focal points (everyone knows where). The mechanic makes the social contract visible.

---

## What shipped in this session (v2 v0)

### Surfaces

- **`/cake/register`** — public registration form, three required-or-optional fields (handle, MM-DD, name?, about?). Live availability check on handle. Confetti burst on success.
- **`/cake` updated** — new "Cake Circle · public registry" section between Recipients (curated) and Archive. Loads registrations client-side from KV via `/api/cake/register?list=1`. Renders sorted by next-occurrence (closest birthday first), with TODAY/TOMORROW/IN-N-DAYS chips. Header gets a "+ register your birthday" CTA.
- **BirthdayCelebrate component** — mounted on every `/b/{id}` BIRTHDAY-type block. Coral dashed-border card with "★ CELEBRATE · GUESTBOOK" kicker. Click → form (handle + optional message). Submit → confetti burst (90 multi-color particles, 1.5-3.3s fall, respects `prefers-reduced-motion`) + KV write + reload guestbook list.

### Endpoints

- **`POST /api/cake/register`** — body `{ type: 'pc-cake-register-v1', handle, birthday, name?, about? }`. Auto-approves on submit. Per-fingerprint dedup (one registration per UA+IP hash). Reserved handles list excludes route names + family slugs. KV writes: `register:{handle}` + `takenfp:{fp}`.
- **`GET /api/cake/register?handle=xyz`** — handle availability check. `{ ok, taken, since? }`.
- **`GET /api/cake/register?list=1`** — public registry (handle, birthday, name, about — no fingerprint, no PII). Sorted by registration time.
- **`POST /api/cake/celebrate`** — body `{ type: 'pc-cake-celebrate-v1', blockId, handle, message? }`. Per-fingerprint per-block dedup. KV writes: `celebrate:{blockId}:{ts}-{fp}` + `celebratefp:{blockId}:{fp}`.
- **`GET /api/cake/celebrate?blockId=0366`** — guestbook for the block, sorted chronologically.
- All endpoints HEAD-respond + OPTIONS-respond + return `503 reason: kv-unbound` when `PC_CAKE_KV` is not bound (graceful degrade — UI shows "coming soon" notes).

### Storage

New KV namespace `PC_CAKE_KV` (declared in `wrangler.toml`, commented out — Mike provisions). Layout:
- `register:{handle}` → `{ handle, birthday, name?, about?, fp, at, status: 'registered' }`
- `takenfp:{fp}` → `{handle}` (one registration per fingerprint)
- `celebrate:{blockId}:{ts}-{fp}` → `{ blockId, handle, message?, fp, at }`
- `celebratefp:{blockId}:{fp}` → `{handle}` (one celebration per blockId per fingerprint)

No TTLs — both registrations and celebrations are permanent. Mike retains override (delete a key to revoke).

---

## Design principles

### 1. "Simple way" means three fields

Handle, MM-DD, optional name/about. No DOB year (privacy + age-agnostic). No wallet. No email. No password. No verification. The act of typing your handle is the registration. Confetti when done.

### 2. Auto-approved, social-pressure-moderated

A moderation queue would scale poorly and contradict the "simple way" ask. Instead:
- Per-fingerprint dedup makes mass spam costly
- Reserved-handle list catches obvious collisions
- Mike can revoke any key by deleting from KV
- Bad actors get social non-celebration as their "punishment" — empty guestbooks

### 3. Block IS the Schelling point

The birthday is *when*. The block is *where*. Once both exist, anyone can show up. The celebrate UI is the surface that makes "showing up" legible — your name + message + timestamp lands on the block, permanently, visibly.

This mirrors the existing `polls` collection's Schelling-point thinking ("guess the most popular answer, not the right one"). On a birthday, "the popular answer" is the block address — everyone converges there. The mechanic doesn't *cause* the Schelling point, it *reveals* it.

### 4. Confetti as ritual, not decoration

Two confetti triggers in v2:
- Registration success (50 particles, 1.5-3s fall)
- Celebration drop (90 particles, 1.5-3.3s fall, multi-color including all channel hues)

Both engines share the same CSS keyframe (`confetti-fall`) and obey `prefers-reduced-motion`. The visual is the affirmation; the social proof is the persistent guestbook entry below.

---

## What's next (v2.1+)

These are out of scope for the current ship but documented for continuity.

### Per-handle profile pages for registered users

Currently `/cake/{slug}` only renders for family members + people with birthday blocks (static `getStaticPaths`). Public registrants surface on `/cake#cake-circle` but don't get dedicated pages.

Two paths to add them:
- **(a) Cloudflare Function `/cake/r/{handle}`** — serves dynamic profile via SSR Function. Pro: works at request time, includes KV data. Con: separate URL space (`/cake/r/handle` vs `/cake/handle`).
- **(b) Catch-all middleware** — `/cake/[slug]` static for known slugs, fallback Function for unknown slugs that checks KV. Pro: unified URL. Con: more complex routing.

Recommend (a) for v2.1, keeping the URL space honest about which is curated vs registered.

### Auto-block-generation on birthdays

When a registered handle's day rolls around, cron triggers a draft block creation:
- Next monotonic block ID
- BDY channel, BIRTHDAY type
- Title: "Happy birthday, {name or handle}"
- Body: cc-voice, references their /cake/{handle} page
- `draft: true` until Mike approves
- Optionally auto-published with `draft: false` after a 12-hour grace window

Cron setup: existing `scripts/race-cron.mjs` pattern, runs at 00:01 PT daily. Function checks `register:*` keys, finds matches for today's MM-DD, drafts blocks via direct repo write or via PR.

### Wallet-gated mint of registration

For registrants who want a stronger signal: pay 0.1 ꜩ to mint a "Cake Circle Membership" FA2 token. The mint becomes their permanent on-chain identity tied to the handle. Free registration stays available; the mint is opt-in upgrade. Surfaces as `/cake/{handle}` getting a "★ on-chain member since 2026-XX-XX" badge.

### Live home-page Schelling banner

On someone's birthday, the home page shows:
```
★ TODAY · happy birthday {name} · /b/{id} →
```
Sticky banner above the home grid. Driven by `/cake.json`'s upcoming list filtered to `daysAway === 0`. Shows for 24 hours PT. If multiple birthdays land same day (will eventually happen), rotates per page-load.

### Celebrations spawn micro-blocks

Each celebration on a birthday block could itself become a tiny block in a `/cake/celebrations` archive — a chronological log of "who showed up where". Useful for retrospect; possibly noise. Decide once cake circle has >50 members.

### Social cohort filters via `via=` cohort tag

Polls already support `?via=cohort` for cohort tracking. Mirror on registrations + celebrations: `/cake/register?via=morgan-friends` carries the cohort through to KV metadata, and `/cake?via=morgan-friends` filters to that group. Lets Morgan share "her" registration link without diluting the global circle.

---

## Open questions for Mike

1. **PC_CAKE_KV binding** — when do you provision? Until then, all the v2 surfaces show "coming soon" gracefully but no real registrations happen. ~30 seconds with `wrangler kv namespace create PC_CAKE_KV` then paste the ID into the `[[kv_namespaces]]` block in `wrangler.toml` (currently commented out).
2. **Reserved handles list** — currently has ~20 obvious collisions (`admin`, `morgan`, `mike`, `family`, route names). Should we add more (yours, family member handles, brand names)? Easy to extend.
3. **Confetti intensity** — current is 50 particles on registration + 90 on celebration. Some people will find this too much. Want me to add a "subtle" mode toggle on each surface?
4. **Per-handle pages for registrants** — ship in v2.1 (recommend), or skip in favor of having registrants get folded into family if they become close enough?
5. **Auto-draft on birthday** — yes/no/maybe? Default: cc drafts a block at 00:01 PT on the registrant's day, sets `draft: true`, opens a PR for Mike's review. You ship it during the day if you want, otherwise it stays as a draft.
6. **Celebration handle reuse** — should the celebration handle have to match a registered handle (linking celebrations to registrations), or stay free-text (current)? Free-text is simpler + lower-friction; linked is stronger identity. Recommend free-text for v0; revisit if spam appears.

---

## Acceptance criteria

### v0 (this ship)
- [x] `/cake/register` form renders with handle availability check
- [x] `POST /api/cake/register` validates handle/birthday, dedups by fingerprint, writes to KV
- [x] `/cake` shows "Cake Circle · public registry" section, fetches list client-side
- [x] `/cake` header has CTA to `/cake/register`
- [x] BirthdayCelebrate component mounts on BIRTHDAY-type blocks
- [x] `POST /api/cake/celebrate` validates, dedups, writes to KV
- [x] Guestbook on `/b/{id}` loads + renders entries chronologically
- [x] Confetti burst animation on both registration + celebration success
- [x] All endpoints degrade gracefully when `PC_CAKE_KV` is unbound
- [x] `npm run build:bare` clean (565 pages, ~18s)

### v0 deploy gate (Mike action)
- [ ] `wrangler kv namespace create PC_CAKE_KV` → paste id into `wrangler.toml`
- [ ] Commit + ship via PR (see "How to ship" below)
- [ ] Smoke test: register a test handle, celebrate on `/b/0366`, verify both appear

---

## How to ship

The cake v2 work touches functions/, src/components, src/pages — Cloudflare Pages will pick up the function endpoints automatically once deployed, but they 503 until KV is bound.

Recommended PR shape (one PR, since the surfaces are interlocked):

```
feat(cake): v2 — public registration + celebration guestbook + confetti

- /cake/register form + handle availability check
- /api/cake/register + /api/cake/celebrate Cloudflare Functions
- BirthdayCelebrate component on BIRTHDAY-type /b/{id} pages
- /cake gets Cake Circle public-registry section (client-side fetch)
- PC_CAKE_KV declared in wrangler.toml (commented out — Mike provisions)
- All endpoints degrade gracefully on kv-unbound (UI shows "coming soon")
- Brief: docs/briefs/2026-04-25-cake-v2-public-registration.md
```

Files:
```
functions/api/cake/register.ts             (new, 200 lines)
functions/api/cake/celebrate.ts            (new, 165 lines)
src/components/BirthdayCelebrate.astro     (new, 320 lines)
src/pages/cake/register.astro              (new, 480 lines)
src/pages/cake.astro                       (modified, +circle section + script + styles)
src/pages/b/[id].astro                     (modified, +celebrate import + mount)
wrangler.toml                              (modified, +PC_CAKE_KV declaration)
docs/briefs/2026-04-25-cake-v2-public-registration.md (this file)
```

After merge: provision PC_CAKE_KV, smoke test, share `/cake/register` with the family + circle, watch the first registrations come in.

---

— cc, brief filed alongside the v2 ship, 2026-04-25 ~3:55pm PT
