# Astra brief — scope the Fish Club Tone Bloom (and a small try on Industry Next)

**Date filed:** 2026-09-04 PT
**Filed by:** Claude Code (cc) for Mike to hand to Astra
**Mike's ask (verbatim):** *"try something small say on industrynext.xyz and tonebloom, maybe even make a tonebloom where you are awarded a fishclub at the end, a fish club tonebloom"* · *"have astra help with the scope"*
**Deliverable from Astra:** a scope doc, not code. Endpoints, the sequence, the cut line, and the open questions answered or explicitly left to Mike. Write it to `docs/plans/2026-09-05-fishclub-tonebloom-scope.md` or paste it back and cc will file it.

## What exists today (so the scope builds on it, not beside it)

- **The faucet** at pointcast.xyz/faucet/hello. Claim with a PointCast account, no wallet; PointCast holds the drip in a ledger; paste an address later and the spigot sends and pays gas. The registry (`src/lib/faucet.ts`) and ledger (`faucet_claims`, keyed by token slug) already support more than one token. Adding FISHCLUB is a registry entry, a secret, a sliver of gas, and a **trigger**. The trigger is the work. Plan: `docs/plans/2026-09-04-faucet-next-tokens.md`.
- **FISHCLUB** is one of Mike's 2019 ERC-20s (`src/content/eth-legacy/fishclub.json`), same deployer family as HELLO. The fish plate art already exists at `public/images/faucet/hello-poster-fish.png`.
- **Tone Bloom** (tonebloom.xyz) is a separate site Mike built with ChatGPT: twelve synthesized voices, four speeds, 38 images; PointCast reviewed it (`/reviews/tone-bloom`) and runs "25 × Tone Bloom" focus sessions (`src/lib/pointcast-focus.ts`, e.g. "Open Shape", "Reset Walk") that link to tonebloom.xyz/focus. It has no PointCast session; it is its own origin.
- **Industry Next** (industrynext.xyz) is a satellite: an art-forward Nouns studio site, present on PointCast as a house advertiser and a First-100 wallet lead. Also its own origin.
- **Sessions** live on pointcast.xyz only (Google, passkey, email). A satellite cannot read the cookie. Any reward has to be *claimed on PointCast*, with the satellite handing over proof.

## The shape to scope: a Fish Club run

A Tone Bloom listening run that ends with one FISHCLUB. The person starts a run (a specific 25 × Tone Bloom session, or a new "Fish Club" one), listens through, and at the end is handed back to PointCast where a FISHCLUB drip lands in their ledger, alongside their HELLOs. Same custody model: no wallet, paste an address whenever.

Two integration patterns; pick one or propose a third:

1. **Redirect with a signed receipt.** Tone Bloom finishes the run and redirects to `pointcast.xyz/faucet/fishclub?receipt=<token>`. The receipt is signed with a shared secret (HMAC over `{run, startedAt, finishedAt, nonce}`), short-lived, single-use. PointCast verifies it, requires the session, writes the `held` row. Works across origins, no cookie sharing. Tone Bloom needs one small change: a completion hook and the secret.
2. **Host the run on PointCast.** A room at `/tonebloom-fishclub` embeds or re-implements the run inside pointcast.xyz, so the session already exists and completion is server-observed (a heartbeat every N seconds into KV, like the drum rooms). No Tone Bloom change, but it duplicates Tone Bloom's audio engine or iframes it.

## Questions Astra should settle in the scope

- **Which run.** An existing 25 × Tone Bloom session, or a new "Fish Club" program? How long: the whole 25 minutes, or a shorter first rung (5)? The fish plate suggests an ocean-toned voice and image set.
- **What counts as finished.** Client timer (cheap, farmable), server heartbeat (honest, needs the room on PointCast), or the signed receipt from Tone Bloom (honest if the secret stays server-side on Tone Bloom).
- **Cap and cadence.** One FISHCLUB per account per day like HELLO, or one per completed run with a daily cap of N? Reuse `HELLO_FAUCET_DAILY_CAP` semantics.
- **The moment.** What the end of the run looks like: the fish plate, "one FISHCLUB is in your ledger", a link to the faucet desk. Copy in the town's voice (`VOICE.md`).
- **Industry Next, the small try.** The smallest thing that proves the redirect-with-receipt pattern on a second satellite. Candidate: a "say hello" tile on industrynext.xyz that sends the visitor to `pointcast.xyz/faucet/hello` with a receipt, so the HELLO claim is attributed to Industry Next in the ledger (a `via` column). Or a Nouns-studio stamp. Keep it to one afternoon.
- **What is out.** No new chain, no new contract, no wallet prompts, no value. FISHCLUB has no price and never will.

## Constraints to respect

- Claims are PointCast-session gated; nothing is minted or sent at claim time.
- The spigot key model is the same as HELLO's (a Cloudflare secret; the FISHCLUB deployer key from Mike's sheet, verified to derive to the deployer address before use). No keys in the repo, logs, or chat.
- Sending on any faucet stays closed until the sign-first delivery fix (issue #1052) is merged.

## Hand back

The scope doc, plus a one-line answer to each question above. cc turns the scope into a build brief for Codex/Sol and the PointCast side of the code.
