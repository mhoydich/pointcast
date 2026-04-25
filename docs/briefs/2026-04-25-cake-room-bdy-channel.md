# Spec brief — `/cake` room, BDY channel, birthday FA2 contract

**Filed:** 2026-04-25 PT
**Author:** cc
**Source:** Mike chat 2026-04-25 ~3pm PT — *"maybe a happy birthday block and home that can be sent to people lets start with morgan, her birthday is today, what can we send to her, maybe collectible or mintable kinda thing, the place where birthdays are celebrated online"*. Block 0366 (Morgan's birthday card) shipped same day under CH.CRT as the temporary home, with `meta.futureChannel: "BDY"` and `meta.futureRoom: "/cake"` declaring the destination. This brief turns those declarations into shippable work.
**Audience:** cc or codex. ~3-4 cc-days for v0 (channel + room + content backfill), ~3 cc-days for v1 (FA2 contract + claim flow).

---

## Goal

Make PointCast **the place where birthdays are celebrated online.**

Three things ship:

1. **Channel BDY** — tenth channel, joining the existing nine. Warm color (proposal: amber-700 `#B7570F` or coral-600 `#D86440`; differentiate from existing FCT amber and GF pink).
2. **`/cake` room** — index of every birthday block, sorted reverse-chronological. Each card shows recipient, permanent Noun, year, mint count, claim state.
3. **Birthday FA2 contract** — one tokenId per birthday block, free open-edition, gas-only mint, claim-once-per-wallet.

Block 0366 ("Happy birthday, Morgan") becomes the inaugural №0001 in `/cake` when this ships, and gets retroactively rechanneled from CRT → BDY.

## Why this exists

Birthday cards online are private and ephemeral — a text, an Instagram story, a phone call that disappears. PointCast is a public, permanent, agent-readable broadcast. A birthday block is the inverse: numbered, immutable, indexed forever, mintable as a record of presence. No other broadcast/social/blockchain product treats birthdays this way. The slot is empty.

The mechanic also gives PointCast a recurring reason to ship — every household member, friend, collaborator, and (eventually) opt-in reader gets a birthday slot per year. The `/cake` index becomes a quietly accumulating archive that nothing else on the internet has.

---

## Scope — v0 (channel + room, no contract)

Ships independently. Mints come in v1 once contract lands.

### 1. Channel registration

Add `BDY` to `src/data/channels.ts` (or wherever `channels.ts` / `block-types.ts` live — confirm path, schema in `src/content.config.ts` already enums-validates `channel`).

```ts
BDY: {
  code: 'BDY',
  name: 'Birthday',
  color: '#B7570F',           // Mike to confirm — see open questions
  ramp: 'amber',              // or 'coral' — depends on color pick
  purpose: 'Birthdays celebrated on PointCast — one block per person per year, one Noun per person forever.',
}
```

Update Zod enum in `src/content.config.ts` line ~19: `z.enum(['FD', 'CRT', 'SPN', 'GF', 'GDN', 'ESC', 'FCT', 'VST', 'BTL', 'BDY'])`.

Update `BLOCKS.md` channel table (line ~71) to list 10 channels. Update `README.md` "Block primitive" example (line ~50) to `one of 10`.

Run `npm run audit:agents` after — `/agents.json`, `/for-agents`, channel-list endpoints all need to reflect the tenth channel.

### 2. Block type — `BIRTHDAY` (optional, recommended)

`MINT` works (block 0366 uses it), but a dedicated `BIRTHDAY` type unlocks distinct visual treatment in BlockCard:

- Footer: `RECIPIENT · PERMANENT NOUN · CLAIMED N/∞`
- Kicker: `★ BIRTHDAY · OPEN EDITION` (vs MINT's `◆ MINT · EDITION`)
- Card border: dashed (suggestion of confetti / something different from hard-edged MINT)

If added: extend `BlockType` enum in `src/content.config.ts` line ~20 + `block-types.ts`. If skipped: keep MINT, treat BDY-channel blocks as a special case in BlockCard.

**Recommendation: add the type.** The whole point is that birthdays are a distinct artifact, not generic mints.

### 3. `/cake` room

New page at `src/pages/cake.astro`, JSON twin at `src/pages/cake.json.ts` — same pattern as `battle.astro` + `battle.json.ts`.

**Layout:**

```
─────────────────────────────────────────────
  CAKE
  the place where birthdays are celebrated online

  N birthdays celebrated · N total mints · since 2026-04-25
─────────────────────────────────────────────

  UPCOMING (next 30 days)
  ─ 05.12 · Kana, turning N · Noun XXX           [waiting]
  ─ 06.04 · Kenzo, turning N · Noun XXX          [waiting]
  ─ 06.18 · Mike, turning N · Noun XXX           [waiting]

  RECENT
  ─ Morgan · 04.25.2026 · Noun 888 · ED 0/∞      [block →] [mint →]

  ARCHIVE
  (year by year, scrollable)
─────────────────────────────────────────────
```

**Data sources:**
- All BDY-channel blocks → "celebrated" list, sorted by `timestamp` desc
- `/family` entries with optional `birthday` field (new — see §4) → "upcoming" list, computed from today

**Per-recipient aggregator:** `src/pages/cake/[slug].astro` — every birthday block for that person, year by year. Morgan's lives at `/cake/morgan`.

### 4. Family schema extension — `birthday`

Add optional `birthday` field to `family` collection in `src/content.config.ts`:

```ts
/** Optional birthday — MM-DD only (year omitted for privacy + age-agnostic
 *  rendering). Drives /cake upcoming list. Opt-in per person. */
birthday: z.string().regex(/^\d{2}-\d{2}$/, 'birthday must be MM-DD').optional(),
```

Backfill `src/content/family/morgan.json` with `"birthday": "04-25"`. Other family members backfilled only on Mike's confirmation (per privacy rule in `_README.md`).

### 5. Retroactive rechannel of block 0366

Once BDY exists:
- Edit `src/content/blocks/0366.json`: `channel: "CRT"` → `channel: "BDY"`
- Update `meta.futureChannel` → remove (no longer "future")
- Update body copy: remove the "Until /cake ships, the block lives under CH.CRT" paragraph; replace with affirmation that this is now №0001 in /cake under BDY

Block ID stays 0366 (immutable). Channel reassignment is allowed for unsettled visual home — BLOCKS.md doesn't prohibit it; only ID renumbering is forbidden.

### v0 acceptance criteria

- [ ] `/cake` renders with at least block 0366 in "Recent"
- [ ] `/cake/morgan` renders with block 0366 in her timeline
- [ ] `/agents.json` lists 10 channels including BDY with description
- [ ] `/c/birthday` (or `/c/bdy` — match existing slug pattern) lists block 0366
- [ ] `/c/birthday.rss` and `.json` feed valid
- [ ] Block 0366's URL and OG card unchanged (recipients don't get a broken link)
- [ ] `npm run audit:agents` passes
- [ ] `npm run build:bare` clean (~22s baseline; flag if regression > 5s)

---

## Scope — v1 (FA2 contract + claim flow)

Ships after v0 lands and gets QA. Depends on coffee-mugs FA2 origination flow as the working pattern (`contracts/v2/coffee_mugs_fa2.py`).

### Contract: `contracts/v2/birthdays_fa2.py`

Mirror the coffee-mugs pattern — SmartPy v0.24, FA2 multi-token, public free mint, admin entrypoints for adding new birthdays.

**Storage:**
```python
@sp.record
class BirthdayState:
  admin: sp.address
  birthdays: sp.big_map[sp.nat, BirthdayMeta]  # token_id → metadata
  total_supply: sp.big_map[sp.nat, sp.nat]     # token_id → minted count
  claimed: sp.big_map[sp.pair[sp.nat, sp.address], sp.bool]  # (token_id, claimer) → bool
  metadata_base_uri: sp.string                  # for migration to IPFS later

@sp.record
class BirthdayMeta:
  recipient_slug: sp.string      # "morgan"
  block_id: sp.string            # "0366"
  noun_id: sp.nat                # 888
  birthday_year: sp.nat          # 2026
  registered_at: sp.timestamp
```

**Entrypoints:**

- **`mint_birthday_card(token_id)` public, gas-only** — anyone with a Beacon wallet calls this. Reverts if `claimed[(token_id, sender)]` already true (one-per-wallet). Increments `total_supply[token_id]`. Sets `claimed[(token_id, sender)] = true`. Mints one FA2 token to `sp.sender`.
- **`register_birthday(token_id, meta)` admin only** — adds a new birthday slot. Reverts if `token_id` already exists. cc calls this once per BDY block at publish time via a small registration script.
- **`set_metadata_base_uri(uri)` admin only** — escape hatch, same as coffee-mugs.
- **`set_admin(addr)` admin only.**

**On-chain views:**
- `get_mint_count(token_id) → nat`
- `get_birthday(token_id) → BirthdayMeta`
- `has_claimed(token_id, addr) → bool`

**No supply cap** — open editions, "the more the merrier" semantics. If spam becomes a problem post-launch, add an admin-settable per-token soft cap in v1.1.

**Royalties:** TZIP-21, 0 bps (free editions, no secondary expectation). Different from coffee-mugs which had 750 bps to admin.

### Token ID assignment

Token ID convention: derive from PointCast block ID. Block 0366 → `token_id = 366`. Future birthday block 0421 → `token_id = 421`. Avoids ambiguity, makes the on-chain → off-chain mapping legible.

### Claim flow on `/b/{id}` and `/cake`

Reuse `MintButton.astro` (already lazy-loads Taquito + Beacon, handles wallet connect + signing + tzkt op link). The existing `claim` entrypoint pattern works — `MintButton.astro` line ~104 already dispatches `ep.claim(tokenId)` if present.

To wire:
- Birthday FA2 exposes `mint_birthday_card` — extend MintButton dispatch table (line ~100-110) to recognize and call `mint_birthday_card(tokenId)`
- BlockCard renders `<MintButton contract={BIRTHDAY_FA2_KT1} tokenId={blockIdAsNumber} kind="mint" label="Mint card · free →" />` for BIRTHDAY-type blocks
- `/cake` shows mint button per row; opens block detail on label click

### Recipient first-claim reservation

Token #1 (Morgan's, the first claimable birthday) — reserved for Morgan's wallet via off-chain coordination (Mike DMs her the URL when she's ready to share an address; until then, contract just lets anyone claim and the social agreement is "wait for Morgan's first claim"). No on-chain reservation logic in v1; if it matters later, add a `reserved_for` field per birthday + a 30-day grace window.

### v1 acceptance criteria

- [ ] Contract compiles in SmartPy IDE; test scenario covers register + mint + duplicate-claim rejection
- [ ] Originated on Tezos mainnet via Beacon (Mike-signed, same flow as coffee-mugs runbook)
- [ ] `register_birthday` called for token_id 366 (Morgan)
- [ ] MintButton on `/b/0366` connects, signs, broadcasts, confirms
- [ ] `/cake` shows live mint count per token, fetched from TzKT
- [ ] Block 0366 "Mint count: N" updates after a successful claim
- [ ] objkt collection page exists (auto via FA2 indexing) and links from `/cake`

---

## Out of scope

- **Animated cake / video / generative art on the card.** Static Noun + body copy + JSON-LD is enough for v0/v1. If we want fxhash-style generative cakes later, that's v2 and a separate brief.
- **Paid editions.** Birthdays are free, gas-only, forever. Anything paid would corrupt the gift semantic.
- **Birthday DMs / push notifications.** The URL is the gift; users send it themselves.
- **Public opt-in birthday registration.** Only family/circle entries with Mike's consent get blocks. Public requests would need a moderation flow we're not building.
- **Multi-recipient cards** ("happy birthday Mom and Dad"). One block per person per year. Cleaner.
- **Birthday-themed faucet integration with Visit Nouns FA2.** Different contract, different semantic. Don't entangle.

---

## Open questions for Mike

1. **BDY color.** Coral-600 (`#D86440`, distinct from FCT amber and GF pink) or amber-700 (`#B7570F`, warmer than FCT)? Or third option — soft pink `#E07A8C`?
2. **Block type.** Add `BIRTHDAY` as 9th type, or reuse `MINT`? cc recommends adding the type.
3. **Family birthday backfill.** Who else gets a `birthday` MM-DD added to their `family/{slug}.json` — Kana, Kenzo, you? Each requires explicit consent per the privacy rule.
4. **Recipient first-claim reservation.** Build the on-chain `reserved_for` mechanic, or rely on social agreement + Morgan's URL DM? cc recommends social-only for v1 — simpler, one less thing to audit.
5. **Birthday cadence — auto-create next year.** When 2027-04-25 rolls around, does cc automatically draft Morgan's next birthday block (new ID, same Noun 888, year-incremented title), or does Mike trigger it each year? cc recommends automatic with a 7-day-out scheduled task that drafts and waits for Mike's approval.
6. **Slug for the channel route.** `/c/birthday` (long, readable) or `/c/bdy` (matches code, terse)? Existing pattern is mixed — `/c/court` uses long form, `/c/front-door` uses long form, but `/c/bdy` would match `BDY` exactly. cc recommends `/c/birthday` for consistency with how channels are slugged.

---

## Implementation order

Small, reviewable PRs:

1. **PR-1 — Channel BDY + type BIRTHDAY** (~30 min)
   - `src/content.config.ts` enum updates
   - `src/data/channels.ts` (or wherever) entry
   - `block-types.ts` entry if adding BIRTHDAY
   - `BLOCKS.md` + `README.md` updates
   - No content changes yet

2. **PR-2 — Family schema `birthday` field + Morgan backfill** (~15 min)
   - Schema addition, regex validation
   - `family/morgan.json` adds `"birthday": "04-25"`

3. **PR-3 — Block 0366 rechannel + body update** (~10 min)
   - CRT → BDY, type MINT → BIRTHDAY (if PR-1 added it)
   - Body update: remove "until /cake ships" paragraph
   - Re-run `generate-og-images.mjs` for 0366

4. **PR-4 — `/cake` room + JSON twin + per-recipient aggregator** (~3-4 hours)
   - `src/pages/cake.astro`
   - `src/pages/cake.json.ts`
   - `src/pages/cake/[slug].astro`
   - Upcoming + recent + archive sections
   - `npm run audit:agents` clean

5. **PR-5 — Birthday FA2 contract + test scenario** (~half day)
   - `contracts/v2/birthdays_fa2.py`
   - Test scenario file
   - Deploy runbook in `docs/plans/YYYY-MM-DD-birthdays-fa2-deploy-runbook.md`
   - Mike compiles + originates via Beacon (same flow as coffee-mugs)

6. **PR-6 — MintButton dispatch + BlockCard wiring + `/cake` mint UI** (~2 hours)
   - MintButton recognizes `mint_birthday_card` entrypoint
   - BlockCard renders mint button for BIRTHDAY type
   - `/cake` row mint button
   - TzKT integration for live mint count display

7. **PR-7 — Register Morgan's birthday on contract** (~15 min once KT1 exists)
   - One-shot script calling `register_birthday(366, ...)`
   - Update `src/data/contracts.json` with KT1 address
   - Verify `/b/0366` mint flow end-to-end

Total estimate: ~3-4 cc-days for v0 (PRs 1-4), ~3 cc-days for v1 (PRs 5-7). v0 is independently shippable and useful even if v1 slips — `/cake` works as an index without on-chain mints.

---

## Adjacent / future

- **`/cake/{slug}/{year}.json`** — agent-readable per-year snapshot. Useful for "what was Morgan's 2026 birthday block" lookups.
- **Birthday-block companions** — when block 0366 gets its 2027 successor, `companions` field on the new block points back at 0366. Per-recipient timeline becomes self-linking.
- **`/cake` digest endpoint** — daily JSON of "birthdays today" for agents/automations.
- **objkt collection page** — auto via FA2 indexing once contract is live; link from `/cake` footer.
- **Birthday-themed Noun lock** — once a person gets their permanent Noun via their first birthday block, store it on their `family/{slug}.json` as `permanentNoun: 888` so future blocks can reference it without rediscovery.

---

— cc, brief filed, 2026-04-25 ~3:30pm PT
