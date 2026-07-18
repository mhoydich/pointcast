# PRD · The Seal Registry — townsfolk

**Author:** cc (Fable) · 2026-07-18 evening
**Status:** Phase A shipping tonight · Phase B queued · Phase C Mike-gated
**Prior art:** /passport Seal Desk (Beacon-signed journey seals, device-local), № 07 PASSPORT dock tray (PR #817), stampz.xyz + passportz.xyz sister desks

## Problem

The passport arc got three rungs today: quest stamps on the dock, a daily entry
stamp, holo foil. The Seal Desk on /passport goes further — one Beacon
signature binds your local stamps + on-chain visas into a portable proof. But a
sealed passport is **private**: it lives in one browser's localStorage, and the
only way to show anyone is to copy JSON at them.

A town where everyone's passport stays in their own pocket has no townsfolk.
The point of a stamp is that someone else sees it.

## Users

- **Visitors** who sealed a passport and want it to count for something visible.
- **Mike + residents** who want to see who's actually walking the town.
- **Agents** who want a machine-readable roster of cryptographically-attested
  visitors (this is the interesting one long-term: verifiable "I was here"
  from wallets, not cookies).

## What we ship

### Phase A — the registry (tonight, no new trust assumptions)

1. **`POST /api/seals`** — publish a signed seal proof (the exact object the
   Seal Desk already produces: edition + message + payload + signature +
   publicKey). Validation is structural only (shapes, sizes, address regex,
   schema field). **The server does not verify signatures** — see Trust below.
   Storage: `PC_RACE_KV` under `seals:addr:{address}` (latest proof per
   address) + `seals:index` (capped roster of summaries, upsert by address).
   Rate limit 6/min/IP. Graceful kv-unbound like /api/meadow.
2. **`GET /api/seals`** — the roster; `?address=tz…` — one full proof.
3. **`/townsfolk`** — the public shelf. One passport cover per sealed address:
   real noun (seed = address hash % 1200, per the no-procedural-lookalikes
   rule), short address, port of entry, stamp/visa counts, sealed date.
   Clicking a cover fetches the full proof and **verifies it in the browser**
   with `@taquito/utils` (`verifySignature` + `getPkhfromPk` must match the
   claimed address). Verified seals get the wax badge; unverified ones say so
   plainly.
4. **Publish button on /passport** — after sealing: "Publish to the town
   registry →". Explicit, opt-in, one click. No auto-publishing.
5. **Block VST 0472** announcing, with art + custom OG. (Was drafted as
   0471; renumbered mid-flight when PR #819 took that id — jersey rule.)

### Phase B — townsfolk become people (next sprint)

- `.tez` domain reverse lookup on covers; link each cover to /u/{address}
  where wallet-auth profiles already live.
- Dock tray shows your seal state (SEALED / UNSEALED impression) — waits for
  the echo-fix session to land to avoid FooterBar collisions.
- Resident ritual: a periodic wire block welcoming new townsfolk by port.
- agents.json: townsfolk endpoints + roster in retrievalOrder.

### Phase C — the soulbound seal (Mike's hand)

- Originate a minimal soulbound FA2 ("Passport Seals", non-transferable,
  one per address, metadata = seal edition hash). The registry becomes the
  mint queue; verified seals get "mint this seal" once the contract is live.
- Per house law: **only Mike signs originations.** Contract source lands in
  contracts/v2 for review first, SmartPy idioms per the Kettle lessons.

## Trust model (read this before objecting)

Anyone can POST any blob under any tz-address — the server does not verify.
This is deliberate for Phase A: signature verification of Tezos raw payloads
server-side means shipping taquito into a worker tonight, and the failure mode
of skipping it is mild because **verification happens where it matters — in
the reader's browser**. A forged entry renders as "signature does not verify"
on /townsfolk; it can squat a slot in the roster but cannot impersonate
convincingly. Mitigations shipped in A: one entry per address (a forger burns
their own slot, and a later real seal from the true wallet overwrites the
forgery), size caps, rate limit. If squatting actually happens, Phase B adds
server-side verification and we say so on the wire.

## Success

- ≥ 3 sealed passports published in week one (Mike counts as one, cc's test
  does not — cc has no wallet and cannot seal, which is itself the point).
- /townsfolk verified-badge rate ≈ 100% (forgeries ≈ 0 in practice).
- Zero new endpoints beyond the two; zero new storage namespaces.

## Non-goals

- No accounts, no sessions, no email. The wallet signature IS the identity.
- No leaderboard. Points stay in the passport; the roster is alphabetical
  by sealed-date, newest first. A town roster, not a ranking.
- No auto-seal, no auto-publish, no dark patterns. Two explicit clicks.
