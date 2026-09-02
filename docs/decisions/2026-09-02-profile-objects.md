# Decision: owned profile objects + attested soulbound seals

**Date:** 2026-09-02

**Status:** accepted direction; contracts compiled only; no origination

**Decision owner:** Mike

**Implementation:** Codex (gpt-5.6-sol)

## Decision

PointCast identity gets two deliberately different on-chain objects:

1. **Owned profile object (`PCPROFILE`)** — a single-edition FA2 NFT for an immutable handle. It is transferable. The current owner controls the page data, so selling or gifting the token also hands over edit authority.
2. **Attested seal (`PCSEAL`)** — a non-transferable FA2 NFT issued by PointCast or another allowlisted issuer. It records a supported kind and bytes evidence. The issuer or admin can revoke it, but the holder cannot sell or move it.

The distinction is the product: a profile object says **what this wallet owns now**; a seal says **what an issuer attested this neighbor did**. Neither is treated as the other.

## What a neighbor can do

| Capability | Owned profile object | Attested seal |
|---|---|---|
| Obtain | Claim an unused handle | Receive from admin or allowlisted issuer |
| Edit | Current owner replaces name, bio, links, and noun seed | Holder cannot edit the attestation |
| Transfer | Yes; standard FA2 owner/operator transfer | No; `transfer` always fails `FA2_TX_DENIED` |
| Revoke | No expiry or revocation in v1 | Original issuer or admin can mark revoked |
| Proves | Present ownership and edit authority | Issuer claim, kind, evidence, time, and revocation state |
| Public route | `/p/{handle}` + `/p/{handle}.json` | Read from the seal contract/TzKT; a combined profile treatment is a later UI pass |

Transfers do not move seals. A buyer of `@neighbor` receives the handle page and edit rights, not the seller's history or reputation.

## Contract boundaries

### Profile object

- `claim(handle: bytes)` accepts exactly 3–24 ASCII bytes from lowercase `a-z`, digits, and `-`.
- Handles are unique and immutable. A wallet may hold more than one handle.
- Text fields are UTF-8 `bytes`; this avoids Michelson `string` rejecting emoji and other non-printable-ASCII input.
- The token's TZIP-21 pointer is `https://pointcast.xyz/p/{handle}.json` as raw URI bytes.
- The initial noun seed is deterministic from the handle bytes and remains owner-editable in the page map.
- `set_page` is owner-only, not operator-only: an approved marketplace may transfer but cannot rewrite the profile.
- Pausing closes new claims. Existing tokens remain transferable and editable.

### Soulbound seal

- Seeded kinds are `showed-up`, `kennel-club-holder`, `resident`, and `founding-100`.
- `attest(to_, kind, evidence)` is admin/allowlisted-issuer only and closes while paused.
- Evidence is opaque UTF-8 or hash bytes, capped at 2 KiB. Interpretation belongs in the public schema for that kind.
- `revoke(token_id)` preserves the token and evidence while setting its revocation flag. It does not erase history.
- `seals_of(address)` returns the holder's seal token IDs, newest first; consumers read `seals[token_id]` for status and evidence.
- The standard FA2 transfer and operator entrypoints remain visible to indexers but fail through `fa2_lib.NoTransfer`.

## Public render specification

### Source and routes

- `src/data/contracts.json.profile_objects.mainnet` is the only activation switch. An empty string means **not originated** and must never fall back to Mike's or any other wallet.
- When a verified KT1 address exists, the build reads the named `handles`, `pages`, and NFT `ledger` big maps from TzKT mainnet.
- `/p/{handle}` renders the current page map and current ledger owner.
- `/p/{handle}.json` is the machine-readable twin with schema, contract, token ID, handle, owner, decoded page, noun URL, canonical HTML/JSON URLs, and source.
- `/p` is the shelf. Before origination it says “compiled, not originated”; after origination it lists claimed handles.
- `/me` shows the claim door only when the contract address passes a KT1 shape check. The compile-only version validates the handle and session-linked Tezos identity but intentionally does not submit an operation.

### Rendering rules

- Handle, token ID, contract, and owner come from chain state. Display name, bio, links, and noun seed come from the on-chain page map.
- User bytes are decoded with `TextDecoder`. Invalid values render empty instead of fabricated fallback identity.
- Only `http:` and `https:` values become clickable links. Other decoded values remain visible text.
- Noun art uses `https://noun.pics/{seed}.svg`; there are no procedural lookalikes.
- HTML declares a `ProfilePage` JSON-LD object. The JSON twin is the authoritative agent-readable representation of the same rendered snapshot.
- The page is build-time indexed from TzKT. A transfer or edit becomes public after the next PointCast build; v2 may add request-time refresh if update latency matters.

### DOM contract

- New surfaces add no element IDs.
- `/me` uses document-level delegated submit handling.
- ClientRouter remounts abort the prior listener controller before installing a new one.
- Session identity comes from `getSession()` and refreshes on `pc:auth-change`.

## Cutover

1. Review both SmartPy sources and the checked-in paused storage artifacts.
2. Run the pinned SmartPy `0.24.1` scenarios again from its `site-packages` directory.
3. Prepare each mainnet origination with its script. Preparation mode is the default and sends nothing.
4. Mike authorizes and runs both originations with `--execute --confirm-mainnet I_UNDERSTAND_MAINNET`; the in-memory signer reads `PROFILE_MAINNET_SECRET_KEY` from the environment only.
5. Verify both KT1 addresses, code hashes, admin, metadata, and `paused = true` on TzKT.
6. Put the two verified KT1 addresses in `src/data/contracts.json` and rebuild. Do not add a wallet fallback.
7. Keep claims paused. Add the first PointCast issuer if it differs from admin.
8. Issue and inspect the first seals while profile claims are still closed.
9. Publish the seal interpretation/schema and confirm revocation is visible to readers.
10. Unpause profile claims. Keep seal attestation paused or open it only to the intended issuer set.

No contract is originated, no address is populated, and no frontend operation is broadcast by this PR.

## Open decisions for Mike

1. **Claim price:** v1 is gas-only and rejects tez. Keep free, or add a treasury + price field before origination?
2. **Handle lifetime:** handles never expire in the compiled contract. Keep permanence, or add an expiry/reclaim policy before mainnet?
3. **Issuer set:** should the first allowlist be Mike only, a PointCast issuer key, or the planned multisig? Decide the initial addresses and the operational rotation policy.

Changing claim price or handle expiry after origination would require a new contract version; those two decisions should be closed before Mike signs. Issuer membership can be changed after origination by the admin.
