# Wallets, one profile, passkeys and First Mints: scope

> Scoped 2026-10-03 at Mike's request ("wallets to add to pointcast, profile… easy to use, understand on the community front, abstract… a nouns type minter… founding mints"). This is a research and design document, not built code. It is planned as v2 batch 2 (see `docs/V2.md`).
> Sources: PointCast `origin/main` @ 551bd6e6 (read through `git show`) and pointcast-chain main. A designed prototype lives at `/Users/michaelhoydich/pcc-proto/first-mints.html`, labelled a preview: nothing is minted.

> **Updates since the scope was written (Claude, 2026-10-03):**
> - Proof of Balance has merged (main `e4b2ea3`).
> - **Tx tag numbers below are provisional.** v2 batch 1's presence-tickets package takes tag 11 (and the plan reserves 13 for key rotation), so session keys and editions get the next free tags when batch 2 is planned. Mandate kind bits above 15 need the checked-shift widening listed in `docs/V2.md` risk 9.
> - The art-mint integration for Codex's dual-chain gallery lives in `docs/ART_MINTING.md` (branch `concept/art-mint-api`). It uses today's non-transferable `DropMint` plus a mirror CLI. First Mints is the richer, recipe-based primitive planned here.

## The short version

- **No extension, no "wallet" word.** A passkey (Face ID or fingerprint) is your *pass*. pointcast-chain learns a new `sig_mode: webauthn` and a new `pcp1` address kind for passkey accounts. Tezos L1 tz3 can't verify raw WebAuthn signatures; pointcast-chain can.
- **One approval covers a month of taps.** A *device pass* (a session key with mandate-style terms: tap, drum and publish only, at most 30 days, no spending) signs everyday actions silently. Anything permanent asks every time.
- **One person, one profile.** The D1 user (`pcu_…`) is canonical. Login identities, the town card / @handle, and chain accounts all hang off it, and nothing merges automatically. `/p/{handle}` becomes the single public profile.
- **First Mints.** A founding edition: a Noun, a few words, a typeface, a background and a pattern. Only the recipe goes on chain; the art is deterministic. The canonical copy lives on pointcast-chain (free, gated by an attestor), with an optional Tezos mirror later.

## Community explainer

**Do I need a crypto wallet?**  
No. Your pass is a passkey, the same Face ID or fingerprint sign-in your phone already uses. If you have a Tezos wallet like Kukai you can link it, but you never have to.

**Does any of this cost money?**  
No. Tapping in, drumming, and your First Mint are free. The PointCast chain has no fees, and attention can't be bought.

**What happens if I lose my phone?**  
If your passkey is saved in iCloud Keychain or Google Password Manager, it comes back on your next phone. To be safe, add a backup key in Me > Keys, like a second device or your Tezos wallet. PointCast can't move your things, and it can't take them.

**Why does it ask for Face ID only sometimes?**  
Everyday things like tapping in and drumming are covered by a 30-day device pass you approve once. Anything permanent, like minting, sending, or changing your keys, asks every time and tells you exactly what it does first.

**What does PointCast know about me?**  
Your handle and card if you make one, which sign-ins you linked, and what you did in town. Your face and fingerprint never leave your phone. Sites that use Sign in with PointCast each get a different ID for you, and only what you approve.

**What is a First Mint, and can I change it?**  
A founding card that is yours alone: a Noun, a few words, a typeface, a background and a pattern, recorded on the PointCast chain under your name. One per person. The words are permanent, so we check them with you before you mint.

## Personas

| Who | Needs | Today | Target |
|---|---|---|---|
| First-time visitor | Play with no account. One obvious 'keep this' moment. No words like wallet, sign, gas or address. | Anonymous. The YOU chip says 'visitor' with a localStorage Noun. /auth shows seven providers. Stamps, scores and keeps live in localStorage and vanish on a new device. A passkey cannot be used to create an account. | Plays freely. After the first act worth keeping (first drum session, stamp or keep), the YOU chip turns into 'Keep your stuff: make a pass'. One tap plus Face ID creates a pcu_ user, a passkey identity and a pcp1 chain address. localStorage state is folded into D1 user_state. The word 'wallet' never appears unless they open Advanced. |
| Regular drummer / tapper | Zero interruptions. Credit that is provably theirs. A handle on the leaderboard. Taps that keep counting on a second device. | Beats are counted by the DRUM_COUNTER Durable Object, with league profiles and keyboard signals. Optional Kukai. None of it touches the chain. A Kukai user would face one wallet prompt per chain tap. | Grants one 30-day device pass (session key, kinds tap + drum_session, rooms optional) with one Face ID. The browser signs every tap and drum silently with a non-extractable Ed25519 key. The drum Worker attests sessions (room_only). ATTN accrues to their pcp1, not to a throwaway key. Receipts show '312 taps, 41 sessions this week'. Kukai users get the same pass with one Kukai prompt per 30 days. |
| Collector | One shelf over every linked wallet plus chain items. A public page worth sharing. Their Kukai wallet stays first-class. | Uses Kukai/Beacon. Holdings are split across /me, /profile, /minted, /wallet and /collect/@handle, each with a different contract subset. /minted and /wallet fall back to Mike's wallet. | /me Holdings is one view: all linked tz1/tz2 on Tezos L1, pcp1 plus linked tz on pointcast-chain, and both seal contracts. The public /p/{handle} merges town card, PCPROFILE page and shelf. The First Mint is the pinned founding item. Kukai can be added as a controller (recovery key) of the pass. |
| Creator / broadcaster | Verified authorship without a prompt per post. A deliberate, explicit prompt for anything permanent. | The D1 'broadcaster' role exists. Blocks are authored as repo JSON. Shortwave posts are verified through the town card. Chain PublishBlock is not wired to the site. | The device pass may include publish_block limited to their channel allowlist (MandateTerms.channels) for everyday posts. Permanent acts (a block of record, an edition, a First Mint) always raise a passkey prompt with plain-words copy. Handle, card and pass number together form the byline. |
| Agent owner | 'Hire an agent' in one step with a budget, an end date and a visible off switch, plus a log of what it did. | Two unlinked registries: D1 pci_ agents (functions/_lib/agent-identity.ts; scopes, expiry, rotate/revoke) and chain pca1 agents with mandates, which only tz1/tz2 owners can register. A passkey user cannot own a chain agent. Agents are unscoped between RegisterAgent and SetMandate. | Signs one RegisterAgent carrying optional MandateTerms (born scoped, closing the unscoped window), with an allowance in ATTN, rooms or channels, and an expiry. The same Ed25519 key is the D1 pci_ agent and the chain pca1 agent, shown as one agent. The off switch is one Face ID to set kinds = 0. Receipts list every agent tx with funded_by. |
| The agent itself | Machine-readable limits, fail-closed behavior, receipts it can cite, never a human prompt, and an owner it can name. | Signs raw Ed25519 as pca1. Reads limits from GET /agent/{addr}/mandate. Uses the node's MCP at /mcp and PointCast-Agent-* headers on the site. | Reads mandate_view (period_left, total_left, blocks until expiry). Acts only within scope; a rejected tx consumes no nonce. Each action returns a Receipt with funded_by = owner pcp1. /agents/{handle}.json publishes the owner's handle, a mandate summary and the kill-switch state, so other agents can check it before trusting it. |

## Identity model

ONE PERSON = the D1 user row `users.id` (pcu_<hex32>). That row is canonical for 'who is this person'. Everything else hangs off it, and nothing is merged automatically (this is the existing rule in session.ts upsertUserForIdentity).

LAYERS
1. Login identities: `identities(provider, id)`, many per user. passkey (credentialId), email, google, github, x, and kukai (the tz address). Each proves you are the person to PointCast's servers, and nothing more.
2. Public face: the town card (@handle, name, Noun 0-1199, color, links), keyed by user_id.
   - Move it from VISITS KV (card:v1:user:{id}, card:v1:handle:{h}) to a D1 table `town_cards(user_id PK, handle UNIQUE, payload, released, updated_at)`. KV write exhaustion already forced auth onto D1.
   - Handle precedence is unchanged: a PCPROFILE token holder (KT1S3Bkg...) takes the handle back from an off-chain card.
   - /p/{handle} becomes the single public profile: card, plus the on-chain page if one exists, plus the shelf.
3. Chain accounts: new D1 table `chain_accounts(address PK, user_id FK, kind 'passkey'|'tezos'|'agent', credential_id NULL, sec1_pubkey NULL, is_primary, created_at)`.
   - The primary is the pcp1 address of the user's first ES256 passkey, derived at signup from the COSE key already stored in passkey_credentials.public_key.
   - Linked Kukai tz1/tz2 identities are automatically valid chain senders (tezos_message) and are listed as secondary.
   - The chain never sees user_id. The address-to-person link is a D1 fact, shown publicly only when the member opts in (the card shows the 'pass number').
4. Agents: pca1 on chain and pci_ in D1 unify on the same Ed25519 public key. The owner is the user's primary chain account.

WHAT IS CANONICAL FOR WHAT
- Who you are: pcu_ (D1).
- What you can do on chain: whatever keys currently control the pcp1 account. This is non-custodial; PointCast's database cannot override it.
- What you are called: the handle (D1 first come, first served, or the PCPROFILE holder).
- What you own on Tezos: TzKT, read per linked wallet.

RECOVERY
- Login recovery (D1): any remaining linked identity signs you back in: a second passkey, an email magic link, Google, Kukai. PasskeyLastSignInError already blocks removing the last method. Add a nudge after signup to link an email or a second passkey.
- Chain recovery (non-custodial):
  - New `SetControllers { controllers: Vec<PublicKey> }` (tag 13, at most 4, P-256 or tz1/tz2 keys). It lets an account keep its pcp1 address while its authority moves to a key set. Any one controller has full power; session keys never do.
  - Synced passkeys (iCloud Keychain, Google Password Manager) cover ordinary phone loss.
  - The cross-ecosystem case (iPhone plus a Windows PC) is solved by adding the second device's passkey or a Kukai wallet as a controller. That is the 'Add a backup key' step.
- No PointCast override in v1. A PointCast guardian key on a 7-day timelock is possible later but needs a timelock primitive (see questions).
- Session keys expire on their own (30 days) and any controller can clear them. A stolen laptop leaks at most taps and drums until expiry, never ATTN transfers, mints or key changes.

## Easy mode

VOCABULARY (users never see the left column): wallet -> 'pass'; address -> 'pass number' (pcp1..., short form pcp1...7Qx); signature -> 'approve'; session key -> 'device pass'; mandate -> 'allowance'; tx -> 'action'; ATTN -> 'attention'.

1. PASSKEY ACCOUNT IN ONE TAP
- New endpoints: functions/api/auth/passkey/signup/options.ts and signup/verify.ts. Unlike register/*, they need no existing session.
- Options: generateRegistrationOptions with rpID 'pointcast.xyz', residentKey 'required', userVerification 'required', supportedAlgorithmIDs [-7] (ES256 only, so the key is chain-capable), and userID = the new pcu_ id.
- Rate-limited per IP/device in PC_RATES_KV; Turnstile only if abused.
- Verify: create the user, insert the passkey_credentials and identities rows, derive pcp1 from COSE x/y (shared vector with Rust), insert chain_accounts, issue pc_session.
- What the user sees: tap 'Make my pass', Face ID, done. The YOU chip turns green with their Noun.

2. SESSION MANDATES SO TAPS AND DRUMS NEVER PROMPT
- New tx kinds, pointcast-chain consensus change:
  - `SetSessionKey { key: Bytes (ed25519), label: String<=32, terms: MandateTerms }` (tag 11);
  - `ClearSessionKey { key }` (tag 12).
- Session keys live as state extension module tag 2 (ext_root leaf), at most 4 per account. terms.kinds must be a subset of {tap, drum_session, publish_block}, terms.expires_at <= height + 864,000 blocks (about 30 days at 3 s), and spend fields must be 0.
- key_controls: for a human sender (tz1/tz2/pcp1), an Ed25519 raw signature from a listed, unexpired session key is accepted, and mandate::check_scope runs with that key's terms. ATTN accrues to the human account.
- Why not RegisterAgent plus SetMandate: rewards would land on the agent address, agents can never be deregistered (Account.agents only increments, capped at 16 per owner), and they are unscoped until SetMandate lands.
- Browser side: crypto.subtle.generateKey({name:'Ed25519'}, extractable:false) stored in IndexedDB, with a @noble/ed25519 fallback. The grant is signed once by the passkey, as a second Face ID right after signup or at the first tap; attestation 'none' carries no signature, so it cannot fold into create().
- Kukai users get the same grant through tezos_message: one wallet prompt per 30 days.

3. NO FEES: the chain has no fee field. ATTN cannot be bought. PointCast pays the only real cost (hosting, Tezos anchors).

4. WHAT A SIGNING PROMPT MUST SAY
- The OS sheet only ever says 'Sign in to pointcast.xyz', so PointCast's own card, shown immediately before it, is the only place meaning can live.
- Generate the card from the same Tx object via chain-wasm `tx.describe`, never from free text.
- Rules: start with the verb; name the exact thing; state what it allows and what it does not; say how long it lasts and how to undo it; say the cost; keep the digest in a collapsed 'Details' fold.
- Templates:
  - (a) Device pass: 'Let this iPhone tap and drum for you. Allowed: taps and drum sessions, any room. Not allowed: sending attention, minting, changing your keys. Lasts 30 days (until Nov 2). Turn off anytime in Me > Devices. Free.' [Approve with Face ID] [Not now]
  - (b) Mint: 'Mint First Mint #0042: Noun 402, "EL SEGUNDO FOREVER", Syne on warm, scanlines. The words are permanent and can never be changed. One per person. Free.'
  - (c) Send: 'Send 25 attention to @mike. This can't be undone. Attention can't be bought or sold. Free.'
  - (d) Hire agent: 'Let "Frog" act for you: post to channel GF, spend up to 50 attention a day, 500 total. Stops Dec 1 or when you press Stop.'
  - (e) Add key: 'Add "Kukai tz2...dFw" as a backup key. It will be able to do everything your pass can.'

5. RECEIPTS LOG
- /me/receipts, served by functions/api/me/receipts.ts, merges:
  - chain Receipts (node GET /account/{addr} plus /tx/{hash}: kind, issued, credited, funded_by) for every chain_accounts address and the user's agents;
  - the connect grants log (connect:grants:v1);
  - x402 receipts and seal attestations.
- Each row: when, what (plain words), which key (pass, device pass 'iPhone', agent 'Frog', Kukai), result, and a link to the explorer.
- Device passes are listed with a [Turn off] button that signs ClearSessionKey.

## Passkey design: `sig_mode: webauthn`

GOAL: a pointcast-chain account whose key never leaves the phone's secure hardware, with every chain signature produced by the platform passkey sheet (Face ID or fingerprint).

WHAT WEBAUTHN ACTUALLY SIGNS
- navigator.credentials.get({publicKey:{challenge, rpId:'pointcast.xyz', userVerification:'required', allowCredentials:[...]}}) returns authenticatorData (AD), clientDataJSON (CDJ) and a DER ECDSA signature.
- The signature is ES256: ECDSA P-256 with SHA-256 over AD || SHA-256(CDJ). Equivalently it verifies against the prehash z = SHA-256(AD || SHA-256(CDJ)).
- AD = rpIdHash(32) || flags(1) || signCount(4, big-endian) || extensions. CDJ is JSON the browser writes, with the challenge base64url-encoded inside it.
- The authenticator never signs caller-chosen bytes directly. Our only lever is the challenge.

NEW sig_mode: webauthn (consensus change)
1. crypto.rs: add `Scheme::P256 = 2`, a 33-byte compressed SEC1 key.
   - Add `AddressKind::Passkey`: PASSKEY_PREFIX "pcp1" || b58check(blake2b-160(33-byte compressed P-256 pk)), mirroring pca1.
   - Use a deliberately non-Tezos prefix. A tz3 string would claim L1 control that a passkey can never exercise, and tez sent to it would be stranded.
   - `Address::is_human()` must include Passkey (touch, can_receive and RegisterAgent all key off it).
2. types.rs:
   - Add `SigMode::Webauthn = 2` and `SignedTx.webauthn: Option<WebauthnProof { authenticator_data: Bytes (37..=512), client_data_json: Bytes (<=1024) }>`.
   - The signature is fixed 64-byte r||s, low-S only. The client converts DER to raw and normalizes s' = n - s. The chain then needs no DER parser and txids are not malleable (P-256 verifiers accept high-S, so without the rule a third party could flip S and mint a second txid).
   - Encoding: existing bytes, then u8 2, then bytes AD, then bytes CDJ. Raw and tezos_message txids are unchanged.
3. Verifier, new crates/chain-core/src/webauthn.rs. Given challenge = Tx::signing_hash(domain) (32 bytes), check:
   - (a) mode Webauthn is only valid with Scheme::P256 and a pcp1 sender (or a P-256 controller of that account, see controllers below);
   - (b) AD[0..32] == SHA-256(params.webauthn.rp_id);
   - (c) flags has UP (0x01) and UV (0x04);
   - (d) WebAuthn 'limited verification' with no JSON parser: CDJ starts with exactly `{"type":"webauthn.get","challenge":"` + base64url_nopad(challenge) + `","origin":"` + O + `"`, for some O in params.webauthn.origins, and the next byte is `,` or `}`. Reject any `"crossOrigin":true`. Browsers serialize type, challenge, origin, crossOrigin in that order, and Chrome's random extra keys come after;
   - (e) s <= n/2;
   - (f) ECDSA verify of SHA-256(AD || SHA-256(CDJ)) against the key;
   - (g) the key derives the pcp1 sender (or is in its controller set).
   - signCount is ignored and kept out of state, because synced iCloud and Google passkeys report 0. Replay is already prevented by the tx nonce inside the challenge.
4. params.rs: `webauthn: Option<WebauthnParams { rp_id: String, origins: Vec<String> (<=4) }>`, encoded only when Some (u8 1 || rp_id || origins), so every existing genesis hash is unchanged. This is the same trick as state v2 to v3.
   - Prod: rp_id "pointcast.xyz", origins ["https://pointcast.xyz", "https://chain.pointcast.xyz"].
   - Dev: rp_id "localhost", origins ["http://localhost:8545"]. A pointcast.xyz passkey cannot be exercised from 127.0.0.1, and a pages.dev origin cannot use RP pointcast.xyz.
5. Mirror the change in crates/kernel/src/codec.rs (scheme 2, sig mode 2), crates/chain-wasm/src/ops.rs (new op `tx.webauthn` returning {challenge_b64url, describe} so the browser builds the challenge from the pinned wasm, as Transmit does for `tx.wallet`), crates/verifier, crates/node/src/api.rs (POST /tx wire form accepts base64url AD/CDJ and a DER-or-raw signature, normalized server-side before admission), and crates/explorer/static/index.html (a Passkey pane next to Transmit).
6. Scope: webauthn covers tx signatures only. Drum cosigs (attest.rs PlayerSig.mode) stay raw or tezos_message, because passkey users drum through session keys.

CRATES OFFLINE
- `ls ~/.cargo/registry/src/*/ | grep p256` shows only p256-0.9.0. It is the old RustCrypto generation: ecdsa 0.12.4, elliptic-curve 0.10.4, crypto-bigint 0.2.5, ff 0.10.1, group 0.10.0, signature 1.3.2, der 0.4.5, sha2 0.9.9, all cached.
- p256 0.13 and primeorder (the generation matching the workspace's k256 0.13 / ecdsa 0.16.9) are NOT cached.
- Proven: a probe at /private/tmp/claude-501/-Users-michaelhoydich/af956c46-1fec-40d0-a009-70ecfe94edd3/scratchpad/webauthn-probe uses `p256 = { version = "0.9", default-features = false, features = ["ecdsa"] }`, `sha2 = "0.9"` (no default features) and base64 0.22, all #![no_std].
  - It implements checks (b) through (f).
  - `cargo test --offline` passes: valid envelope OK; wrong digest, origin or rp, and UV off are all rejected.
  - `cargo build --offline --release --target wasm32-unknown-unknown` succeeds, so it fits the kernel.
- Gotchas: p256 0.9's Scalar lacks NormalizeLow, so the low-S check is a byte compare against n/2 = 7fffffff800000007fffffffffffffffde737d56d38bcf4279dce5617e3192a8.
- Recommendation: ship P1 on p256 0.9 verify-only. Plan a swap to p256 0.13 when online (one-line API change: `VerifyingKey::verify_prehash`), and gate the swap on the same test vectors.

WHY TEZOS L1 tz3 CAN'T, BUT THIS CHAIN CAN
- A tz3 (P-256) manager key on Tezos L1 must sign the 32-byte BLAKE2b digest of 0x03 || forged operation bytes. The protocol has no envelope mode.
- An authenticator can only produce ECDSA over SHA-256(AD || SHA-256(CDJ)), where AD (rpIdHash, flags, counter) and CDJ (JSON with the challenge inside) are generated by the device and browser. No choice of challenge makes that equal BLAKE2b(0x03 || op). The same applies to Michelson CHECK_SIGNATURE with a p2pk key, which also BLAKE2b-hashes the message, so a smart-contract wallet cannot verify it cheaply either.
- Changing that needs a protocol amendment (this is accurate as of the protocol versions I know; re-check before P4).
- pointcast-chain owns its verifier and already wraps the digest in a wallet envelope for Kukai (tezos_message). A webauthn envelope is the same idea: the digest travels as the challenge and the chain rebuilds and checks the envelope.

ALTERNATIVE CONSIDERED: PRF-derived keys. The WebAuthn PRF extension (hmac-secret) could derive a stable 32-byte seed per passkey, giving a plain tz1 key usable on L1 with zero consensus change.
- Rejected as the default. The private key would sit in page JS during every signature, so XSS could exfiltrate it. PRF support is uneven (older Windows Hello, some password managers). And the OS no longer enforces UV per signature.
- Kept as an optional later feature, 'Export a Tezos twin', for users who want an L1 address bound to their pass.

## First Mints

RAIL CHOICE
- Option A, Tezos FA2: a new SmartPy contract (pinned 0.24.1). Needs Mike to sign the origination and every minter to have a Tezos wallet and gas, or a PointCast relayer that spends tez per mint. It cannot use passkeys at all (see the tz3 note), and moderation happens off-chain before an on-chain write that cannot be taken back.
- Option B, pointcast-chain native: new tx kinds on the chain whose accounts the passkeys already control. Free, no origination, instant, and eligibility enforced by an attestor signature (the same proven pattern as drum room attestation).
- RECOMMENDATION: B is canonical, built in P3 on the local chain and opened on the public chain in P4. The Tezos mirror comes later and has two layers, neither blocking launch: (1) a founding-100 seal on the soulbound contract that already exists, and (2) an optional transferable FA2 that Mike originates.
- New kinds (fit in the remaining u16 mask tags):
  - `OpenEdition { edition: slug<=64, supply: u32, per_account: u8, opens_at: u64, closes_at: u64, attestor: Bytes(ed25519), renderer_hash: Hash32, recipe_version: u8 }` (tag 14). Only `Params.edition_admin` may send it; it lives in the same Option-encoded params extension as webauthn, so existing genesis hashes are unchanged.
  - `EditionMint { edition, recipe: Bytes<=64, approval_expires: u64, approval: Bytes(64) }` (tag 15).
- State extension module tag 3: editions{id -> {terms, minted}}, tokens{(id, serial) -> {owner, recipe_hash, height}}, minted_by{(id, addr)}, used_seeds{(id, seed4)}, used_recipes{(id, recipe_hash)}.
- EditionMint checks: window open; minted < supply; sender has not minted; recipe decodes and passes ranges and charset (on-chain defense in depth); Nouns seed unused; approval_expires > height; Ed25519 verify of approval over blake2b('pointcast-chain/edition-approval/v1' || chain_id || genesis || edition || sender || recipe_hash || u64 approval_expires). The approval is bound to the minter and the exact recipe, so it can be neither resold nor reused.
- The serial is assigned by the chain. Session keys can never mint (terms forbid tags 14 and 15).
- Non-transferable on pointcast-chain in v1. Transfer arrives with the FA2 mirror; a transfer kind would need tag 16, which needs the mask widened first.

RECIPE ENCODING (deterministic; chain-core Encoder conventions)
- recipe_v1 = u8 version(1) || u8 body(0..=29) || u8 accessory(0..=142) || u8 head(0..=253) || u8 glasses(0..=22) || u8 background(0..=15) || u8 pattern(0..=15) || u8 font(0..=7) || u8 ink(0..=15) || u8 layout(0..=3) || str text (u32 length + 1..=24 bytes).
- The four trait indices are a real Nouns seed minus its background, rendered from the official CC0 image data already in the repo at public/images/nouns-money/source-100/sources/official-image-data.json (bodies 30, accessories 143, heads 254, glasses 23, bgcolors d5d7e1/e1d7d5). That honors the real-assets rule.
- The composer pre-fills the four traits from any Noun ID 0-1199 (the town-card range). Fetch Nouns token seeds once into src/data/first-mints/noun-seeds.json; nouns-seeds-0-99.json already covers 0-99.
- BG_V1: 0 nouns-cool #d5d7e1, 1 nouns-warm #e1d7d5, 2-10 the town CARD_COLORS (#185fa5 #0a6c9f #2f8f4e #e0a100 #e5663b #c0262d #d6457a #7152a4 #1f2a33), 11 night #07172c, 12 paper #f3ead7, 13 signal #f9c56c, 14 marine #9fb8c8, 15 ink #111111.
- PATTERN_V1: none, scanlines, pixel-grid, dots, checker, diagonal, sunburst, marine-waves, noggle-tile, halftone, static (PRNG seeded by recipe_hash), signal-rings, bricks, plaid, stars, confetti.
- FONT_V1: 0 Pixelify Sans (public/fonts/starjam, OFL), 1 JetBrains Mono, 2 Syne 700, 3 Lora italic, 4 Gloock, 5 Outfit; 6-7 reserved. Each font is pinned by sha256 and glyphs are outlined to SVG paths, so renders need no font files.
- INK_V1: 16 colors. The renderer and the attestor reject any bg/ink pair below 4.5:1 contrast.
- recipe_hash = blake2b-256('pointcast/first-mints/recipe/v1' || recipe_v1).
- Share URL: /first-mints/r/{base64url(recipe_v1)}. Human code: 'FM1 14.132.94.18 warm scanlines syne / EL SEGUNDO'.
- render(recipe) -> SVG is one pure TypeScript module (src/lib/first-mints/render.ts), pinned by renderer_hash in OpenEdition and shared by the composer, functions/api/first-mints/[serial].svg.ts and test vectors.

SUPPLY AND ELIGIBILITY
- Edition 'first-mints': supply 1,200, per_account 1, and every Nouns seed used once (1,200 unique Nouns, first come first served). Serials 1-100 are the Founding 100.
- Chain-sim showed free keys farm, so per-address limits alone mean nothing. Scarcity is enforced by the attestor (functions/api/first-mints/approve.ts) holding FIRST_MINTS_ATTESTOR_SK. It issues at most one approval per D1 user. migrations/auth/0030_first_mint_approvals.sql: user_id UNIQUE, recipe_hash UNIQUE, seed4 UNIQUE, status, lane, reviewer, signature, expires_at.
- An approval requires a passkey-backed account at least 72 h old AND at least one scarce signal:
  - (a) server-attested presence on 3 or more distinct days (drum room, Still Hour, Field Reports or Shortwave), i.e. room attestation, not taps;
  - (b) a town card handle plus 3 or more Shortwave posts across 2 or more days;
  - (c) a linked Tezos wallet that holds any PointCast collection token, a PCPROFILE or a seal, or that has L1 history before 2026-10-01;
  - (d) an invite from an existing First Mint holder (2 invites each, recorded, revocable if abused).
- The Founding 100 are reserved for a snapshot taken before announcement (Kennel Club claimers, PCPROFILE holders, seal holders, drum league and Shortwave regulars), so fresh accounts cannot race for them. Serials 101-1200 open to anyone passing the gate.
- Per IP and device budgets in PC_RATES_KV.

TEXT MODERATION (the text is immutable on chain)
- Charset [A-Z0-9 !?&'.,#-], uppercase, 1-24 bytes, single spaces, no leading or trailing space. Rejects any 'HTTP', 'WWW', '.COM'/'.XYZ'-style TLDs, @ handles, and digit runs longer than 6 (phone numbers). This removes emoji, zalgo and homoglyph attacks outright.
- Lane 1, Words: up to 3 words from a curated 1,024-word town lexicon (src/lib/first-mints/lexicon.ts). Approved instantly.
- Lane 2, Free text: an automated filter (blocklist after leetspeak folding 0>O 1>I 3>E 4>A 5>S 7>T, plus reversals and no-space substrings), then a human review queue (/first-mints/desk, broadcaster role) with a 24 h service level. The approval is signed only after review.
- After mint, the renderer honors an off-chain `withheld` list (shows a plain tombstone card) and the explorer hides withheld text. The chain record remains, so the policy says so up front.

TEZOS MIRROR (P4)
- (1) Founding-100 seal: attest kind 'founding-100' to the holder's linked tz address on the live seal v1 KT19DHCY5S9x48npRyAhUCM2SyLWZMNh3yQ1 (the kind is already seeded; issuers are Mike's Kukai and the cc wallet tz1PTUzb...), or on seal v2 KT1UVn9CDToAbyoxARLPfNtVkvKgzCwuroy3 after Mike unpauses it (attest_batch, evidence_uri). Evidence = recipe_hash || chain tx hash || anchor reference. No new origination.
- (2) Transferable FA2 'PCFIRST' (contracts/v2/first_mints_fa2.py, marketplace.py idioms): claim(serial, recipe, proof against an anchored state root; the codex/proof-of-balance proof format generalizes to tokens). Metadata at functions/api/tezos-metadata/first-mints/[tokenId].ts. Origination by Mike; claims are gas-only or relayed.

## What PointCast has today

| Surface | Paths | What it does | Overlaps |
|---|---|---|---|
| /auth (Account desk) | src/pages/auth.astro, src/data/super-auth.ts (ACCOUNT_PROVIDERS), src/lib/auth/account-desk.mjs, src/lib/auth/client.ts | The real sign-in page. Offers Google and Kukai first, then passkey, email, GitHub, X. Shows linked-identity chips, buttons to link Kukai, MetaMask or Phantom, and sign-out. Backed by the D1 session. | Shares identity chips, passkey management and wallet linking with /me. AuthMenu is the same flow in a dropdown. MetaMask and Phantom buttons lead to stubs (functions/api/auth/ethereum.ts returns 501 siwe-not-implemented; solana.ts is a stub). |
| /auth/project (cross-project bridge) | src/pages/auth/project.astro, functions/api/auth/project-ticket.ts, src/components/TezosSessionBridge.astro, src/lib/auth/wallet-popup-fallback.ts | Pitched as 'One wallet. Every project.' It turns an existing PointCast session into a 2-minute, one-use code for a sibling project, and runs a Kukai login if you are not signed in yet. | Does the same job as /connect (hand a PointCast identity to another site) with a different code store and a different consent model. One of the two should absorb the other. |
| /me (private shelf, the de facto profile) | src/pages/me.astro (1556 lines), functions/me.json.ts, functions/api/me/{state,holdings,_holdings,_state,ai-*,nouns-money,spotify}.ts, migrations/auth/0002_user_state.sql, src/components/ProfileConnections.astro | The session-keyed home. Sections cover linked identities, passkeys (add/label/remove), Kennel Club dogs, seals (src/lib/seal-shelf.ts reads both seal KT1s), music, kept Shortwave links, the PCPROFILE handle claim and editor, linked Tezos wallets, and PointCast holdings from TzKT. user_state syncs stamps, companion, mood and high scores. | Overlaps /auth (identities, passkeys), /profile, /minted and /wallet (holdings) and /passport (stamps). The FooterBar 'View profile' button points here, but WalletChip's 'View profile' still points to /profile. |
| /profile (browser wallet dump) | src/pages/profile.astro (1687 lines) | Reads the localStorage pc:wallets list and shows live TzKT balance, NFT count and ops for every wallet this browser has paired, plus a large dump of blocks, polls, drops, gallery and Mike's Spotify. Keeps no server state. | Duplicates /me holdings and /minted. It is browser-only, so it can disagree with the D1 session (for example, signed in with Google while pc:wallet-active is empty). |
| /wallet (public collector shelf) | src/pages/wallet.astro, src/components/WalletConnect.astro | A URL-scoped public shelf, /wallet?address=tz..., covering the marketplace-supported FA2s. With no address it falls back to Mike's tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw. | Overlaps /collect/@[handle], /p/[handle] and /townsfolk, each a different public 'who is this' page. Overlaps /minted on content. |
| /minted (connected-wallet holdings) | src/pages/minted.astro | Reads pc:wallet-active and shows holdings in coffee_mugs, visit_nouns and window_snapshots. When the key is empty it falls back to Mike's wallet. | Is a subset of /me holdings. Reads the legacy localStorage mirror instead of the session. |
| /passport + /townsfolk (dual-ledger passport and seal registry) | src/pages/passport.astro (1280 lines), src/lib/tezos-passport.ts, src/pages/townsfolk.astro, /api/seals (PC_RACE_KV); siblings src/pages/cat-passport.astro, src/pages/beach-commons/v18/passport.astro, src/lib/radius25-passport.ts | /passport holds local ritual stamps (pc:passport:stamps), public Tezos visas, and an optional Beacon-signed journey seal. /townsfolk lists published seals and verifies them in the browser with @taquito/utils. | Stamps are duplicated between localStorage and D1 user_state. /townsfolk is a third public roster next to town cards and /p. Seal Registry Phase B planned /u/{address}, but that route is taken by OG shrine pages. |
| /connect (Sign in with PointCast) | src/pages/connect.astro, src/pages/connect.json.ts, functions/_lib/pointcast-connect.ts, functions/_lib/pointcast-connect-http.ts, functions/api/connect/{authorize,token,grants}.ts, public/connect.js | An OAuth-lite for the small web. The site's origin is its client id. The site gets a one-time code that expires in 120 s (stored hashed in oauth_states) and redeems it for a snapshot of {sub, card, wallet?}. sub is a pairwise id: sha256('pointcast-connect/v1\|client\|userId'). Scopes are card and wallet. Grants are logged in VISITS KV connect:grants:v1:{userId}. | Same job as /auth/project. Its grants log is a natural seed for the unified Receipts page. |
| Town cards (@handle) | functions/_lib/town-card.ts, functions/api/card.ts, src/scripts/shortwave-cards.ts, src/lib/shortwave.ts, public/images/town-cards/card.svg | The public face of an account: handle (3-24 chars of [a-z0-9-], reserved list), name, Noun 0-1199, bio, now, place, song, three links, color, and an optional linked Tezos wallet. Stored in VISITS KV as card:v1:user:{id} and card:v1:handle:{h}. If a handle is a PCPROFILE token, only the holding wallet's account may use it, and that account can take it back. | Competes with /p/[handle] (on-chain profile pages) and with preferredName on the D1 user. It lives in KV, which the drum traffic can exhaust; that same write-budget problem is why auth moved to D1. |
| /p/[handle] (on-chain profile objects) | src/pages/p/[handle].astro, src/pages/p/[handle].json.ts, functions/p/[handle].ts, functions/p/og/[handle].ts, src/lib/profile-object.mjs, src/lib/profile-operations.mjs, contracts/v2/profile_object_fa2.py | Pages for PCPROFILE KT1S3BkgEQsW62vqkuatueUhzcTqkTfb4EXs: transferable single-edition handle tokens whose owner edits the page map (name, bio, links, noun seed). | Same namespace and rules as town cards. Two public profiles per handle (KV card and on-chain page) with no merged view. |
| Auth APIs | functions/api/auth/session.ts, tezos.ts, passkey/{_shared,credentials,register/options,register/verify,login/options,login/verify}.ts, email/*, google*, github/*, x/*, apple.ts, ethereum.ts, solana.ts, _oauth.ts; migrations/auth/0001_init.sql, 0003_passkeys.sql, 0011_* | D1 AUTH_DB tables users, identities, sessions and oauth_states, with a KV fallback. Users are pcu_<uuid> and sessions pcs_<uuid> in a 30-day pc_session cookie, refreshed in the last 7 days; fresh auth (15 min) is required for sensitive acts. Kukai login verifies a signed Micheline 'PointCast Tezos Login' message with a nonce. Passkeys use @simplewebauthn/server 14.0.0 with RP ID pointcast.xyz, ES256 and RS256, residentKey and userVerification required, and the COSE public key stored in passkey_credentials. Passkey registration needs an existing signed-in session, so a passkey can only be added, never used to create an account. | The only real multi-device identity. Every other surface either reads it (getSession) or ignores it (the localStorage mirror). |
| AuthMenu / WalletConnect / WalletChip (three connectors) | src/components/AuthMenu.astro + src/scripts/chrome/auth-menu.ts; src/components/WalletConnect.astro; src/components/WalletChip.astro; src/components/shwa/wallet-panel.tsx | AuthMenu is the session sign-in dropdown. WalletConnect is the legacy Kukai/MetaMask/Phantom connector that writes pc:wallet. WalletChip is a Beacon chip that remembers every pairing in pc:wallets and pc:wallet-active and links to /profile. | Three entry points and two storage models (D1 session vs localStorage). They emit the same pc:wallet-change event but can disagree about who you are. |
| src/lib/tezos.ts + src/lib/auth/client.ts | src/lib/tezos.ts (431 lines), src/lib/auth/client.ts (527 lines), src/lib/auth/types.ts | tezos.ts is a single Taquito/Beacon wallet with scopes [operation_request, sign] and RPC rpc.tzkt.io/mainnet. It handles Micheline sign and verify plus mint and claim helpers (Kennel, Campus Cards, Nouns Bandmates, profile claim and set_page, director ops). client.ts provides getSession, the login* functions for every provider, register/login passkey, and persistWallet, which mirrors the session's Tezos identity into pc:wallet*. | The mirror keeps legacy pages alive but is also how the two identity systems drift apart. |
| FooterBar YOU chip | src/components/FooterBar.astro L77-104 (chip) and L783-803 (menu card), src/scripts/chrome/footer-bar.ts L1061-1063 (setAccess) | A site-wide chip showing a Noun avatar, an access dot (none, wallet = local Beacon/MetaMask, account = D1 session), a label ('visitor') and a mood. Its menu card offers 'Connect wallet (Beacon)' and 'View profile' -> /me. | Duplicates WalletChip. It is the natural one-tap 'make your pass' entry point but currently leads with Beacon. |
| Agent identities (two registries) | functions/_lib/agent-identity.ts, migrations/auth/0014_agent_contract.sql (agent_keys, agent_challenges), src/pages/agents/[handle].astro | PointCast pci_<hex32> agents with Ed25519 keys, operator, scopes, expiry, and rotate/revoke. Requests are signed with the PointCast-Agent-Id, -Timestamp and -Signature headers. | Unlinked from pointcast-chain pca1 agents and mandates, even though both are Ed25519. The same key could be one agent in both places. |
| Device identity (Field Reports) | src/pages/r/me.astro, functions/api/air/me.ts, /api/air/claim, X-PC-Device header | An anonymous per-phone identity for stamps and streaks. Signing in moves the last 24 h of a phone's rows onto the town card. | A fourth identity layer (device id), alongside session, localStorage wallet and town card. |
| Collections (on-chain) | src/data/contracts.json, src/data/market.json, src/data/constellation.json, src/data/agent-cabinet-publication.json, src/lib/seal-shelf.ts | Live on Tezos mainnet: visit_nouns KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh (PCVN), coffee_mugs KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt (PCMUG), kennel_club KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq (KCSIT, paused), profile_objects KT1S3BkgEQsW62vqkuatueUhzcTqkTfb4EXs (PCPROFILE, claims open), seal_soulbound KT19DHCY5S9x48npRyAhUCM2SyLWZMNh3yQ1 (PCSEAL, live, already seeded with founding-100), seal_soulbound_v2 KT1UVn9CDToAbyoxARLPfNtVkvKgzCwuroy3 (paused, has set_kind and attest_batch), marketplace KT1X9LUxV5qaPVLr17uzRfxgRWPdGfRMYxQT, project_multisig KT19Xcb8UuUUUaYTJ2Z7cdqYAhRaFi7UThwG. Outside contracts.json: objkt 'El Segundo' KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb (other-worlds minted, agent-cabinet prepared-only), Mike's tokens KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP, broadcast tower KT1NgPnaHLtZ2cNpb2hWGDxFH9fUCABaiaE1. Empty mainnet entries (not originated): zen_cats, morning_ocean, drum_token, postcards, window_snapshots, birthdays, derby_picks, agent_derby_receipts, prize_cast, campus_cards (compiled, awaiting Mike). | Read independently by /me (_holdings.ts), /minted, /wallet and /profile, each with its own hardcoded subset. |

## pointcast-chain primitives today

pointcast-chain main @ 1b6e819 (/Users/michaelhoydich/pointcast-chain). Branches v2/presence-tickets, v2/town-hall, v2/night-shift-ops and concept/town-explorer have no commits beyond main. codex/proof-of-balance (unmerged, 3 commits) adds portable, genesis-bound balance proofs, which P4 can use for the mirror.

SIGNATURE SCHEMES (crates/chain-core/src/crypto.rs)
- `Scheme { Ed25519, Secp256k1 }`, encoded as u8 0 and 1. Addresses: tz1 = b58check([6,161,159] || blake2b-160(ed25519 pk)), tz2 = b58check([6,161,161] || blake2b-160(33-byte SEC1 secp256k1)), and pca1 = "pca1" || b58check(blake2b-160(ed25519 pk)) for agents.
- secp256k1 verification is prehash over the 32-byte digest and rejects high-S, matching Tezos canonical signatures.
- There is no tz3 or P-256. `PublicKey::from_tezos_b58` says it outright: "`p2pk` (P-256) and BLS keys are not supported by this chain". The kernel codec (crates/kernel/src/codec.rs `scheme()`) returns BadScheme for anything but 0 and 1. Dependencies (crates/chain-core/Cargo.toml) are ed25519-dalek 2, k256 0.13, blake2 0.10, bs58 and hex, all no_std.

SIG MODES (crates/chain-core/src/types.rs, wallet.rs)
- `SigMode::Raw = 0`: the key signs `Tx::signing_hash = blake2b("pointcast-chain/tx/v2" || str chain_id || genesis_hash || canonical tx)`. The genesis hash is bound in, so a re-genesis cannot replay old signatures.
- `SigMode::TezosMessage = 1` (Kukai/Temple via Beacon requestSignPayload MICHELINE): the wallet signs blake2b(0x05 0x01 || u32_be(len) || text), where text = "Tezos Signed Message: pointcast-chain <chain_id> <kind> sender <addr> nonce <n> digest <hex>". The verifier rebuilds the text and never trusts client text. Only tz1/tz2 senders may use it.
- `SignedTx::encode` appends the mode byte only when it is non-raw, so raw txids stay stable. That append-when-present pattern is how the new modes below should be encoded.
- Known gap (DESIGN.md "Known gaps"): wallet prompts show kind, sender, nonce and digest, but not amounts or mandate terms.

TX KINDS (types.rs, state.rs): tags 1 PublishBlock, 2 DrumSession (cosigs and room attestation; policy open, cosign or room_only), 3 Tap (rate limit 5 per 20 blocks), 4 DropMint, 5 Transfer, 6 RegisterAgent (ed25519 only, human senders only, max_agents_per_owner 16), 7 SetDrumAttestors, 8 SetMandate, 9 ClearMandate, 10 SpendAllowance.
- DropMint already exists: the first minter of a drop_id becomes its creator and only the creator may mint, up to max_drop_supply 10,000. It counts editions only, with no per-token data (Account.drops: BTreeMap<String,u32>). It cannot carry a recipe or enforce one per account.
- RegisterAgent only ever increments `Account.agents`. There is no deregister or rotate, so per-device session keys built on agents would burn through the lifetime cap of 16.
- Between RegisterAgent and SetMandate the agent is a 'legacy unscoped agent'.

MANDATES (crates/chain-core/src/mandate.rs)
- `MandateTerms { kinds: u16 bitmask (1<<tag), channels <=8, rooms <=8, spend_per_period, period_blocks, spend_total, payees <=16, expires_at (height, exclusive) }`.
- DELEGABLE_KINDS covers tags 1-7 and 10. Tags 8 and 9 are owner-only.
- Kill switch: `kinds = 0` pauses the agent. `clear_mandate` returns it to unscoped. A re-grant resets the counters.
- Expiry fails closed. check_scope runs before any mutation, so a rejected tx does not even consume a nonce.
- SpendAllowance moves ATTN from the owner's balance (supply-neutral) and records `funded_by` on the Receipt.
- Read API: GET /agent/{addr}/mandate (crates/node/src/api_mandate.rs).
- Constraint: the mask is u16 and `kind_bit` assumes tag <= 15, so only tags 11-15 remain before the mask must widen. Widening is a consensus change.

FEES: none. Tx has no fee field. Spam control is signatures at the door, per-sender nonces, the mempool cap, max_txs_per_block 500, tap rate limits and issuance caps (account_epoch_cap 500 per day, block_issuance_cap 2000, max_supply 1e9). ATTN is issued only for tap and drum_session. The only tez spent anywhere is the Tezos anchor job (crates/node/src/cli_anchor.rs, PC_ANCHOR_MAX_FEE_MUTEZ default 5000).

EXPLORER TRANSMIT PANEL (crates/explorer/static/index.html L190-221 markup, L759-890 logic)
- Loads Beacon SDK 4.5.1 from jsDelivr and uses a mainnet DAppClient ('signing a payload spends nothing').
- Accepts tz1/tz2 only. Panes: tap, post a block, send ATTN.
- Fetches /tx/digest, then rebuilds and checks the wallet payload locally with the pinned chain-wasm `tx.wallet` op ('never sign bytes only the node computed').
- Refuses to sign when the API origin is not the node that served the page.
- Shows 'You're signing: <text>' and calls requestSignPayload(MICHELINE).
- There is no passkey path and no local-key path.

NODE API (crates/node/src/api.rs): GET /status, POST /tx, POST /tx/digest, POST /drum/digest, GET /tx/{hash}, /block/latest, /block/{h}, /account/{addr}, /feed, /anchors, POST /body, GET /body/{hash}, plus /mcp (MCP server) and raw routes. Receipt = {tx_hash, kind, sender, sender_is_agent, issued[], credited[], funded_by}, which is already the shape of a receipts log.

SYBIL FINDINGS (crates/chain-sim/FINDINGS.md, measured 2026-10-02, 123.1M txs)
- Every free sybil key earns exactly the 500/day epoch cap under every strategy tried.
- room_only alone does not stop an adaptive ring, because taps alone reach the cap.
- room_only plus tap gating (1 tap/hour: tap_window_blocks 1200, taps_per_window 1) cuts farming from 66% to 10% of issuance at a cost of 15% of honest income.
- Recommended: drum_attest_max_age_ms about 5 min and block_issuance_cap >= 2000.
- Implication for First Mints: anything that is one per key, with no scarce gate, is infinitely farmable.

POINTCAST SIDE: D1 passkey_credentials already holds COSE public keys for RP pointcast.xyz, but includes RS256 (-257) credentials the chain could never verify. A chain-capable passkey must be ES256 (-7).

## Phases

### P0: Docs and prototypes (no consensus change, no deploy required)

- **Consensus change:** no
- **Needs Mike:** About 15 minutes on his iPhone and Mac to capture passkey vectors. Design review. If cc deploys the lab page through scripts/deploy.sh, no keys or money are needed.
- **Files:** pointcast-chain/docs/PASSKEYS.md, pointcast-chain/research/webauthn-probe/{Cargo.toml,src/lib.rs,tests/roundtrip.rs}, pointcast-chain/crates/chain-core/tests/vectors/webauthn/*.json; pointcast/docs/plans/2026-10-03-one-profile-passkeys-first-mints.md, src/lib/first-mints/{recipe.ts,render.ts,palettes.ts}, src/pages/first-mints/lab.astro, src/pages/lab/passkey-vectors.astro, tests/first-mints-recipe.test.mjs

pointcast-chain:
- docs/PASSKEYS.md (this design: sig_mode webauthn, pcp1, session keys, controllers, editions).
- research/webauthn-probe/ outside the workspace, ported from the scratchpad probe that already passes cargo test --offline and builds for wasm32.
- Real-device assertion vectors (iOS Safari, macOS Safari/Chrome, Android Chrome, Windows Hello ES256) captured against a fixed 32-byte challenge, saved as JSON fixtures.

PointCast:
- docs/plans/2026-10-03-one-profile-passkeys-first-mints.md.
- src/lib/first-mints/recipe.ts (encode, decode, hash, validate) and render.ts (recipe -> SVG from official-image-data.json).
- tests/first-mints-recipe.test.mjs with cross-language vectors.
- src/pages/first-mints/lab.astro: composer with a Noun ID 0-1199 picker, text, font, background, pattern, ink and layout; live preview and share link; no mint.
- src/pages/lab/passkey-vectors.astro (noindex) to capture vectors with existing pointcast.xyz passkeys.

### P1: Chain primitives: webauthn sig mode, session keys, controllers, born-scoped agents

- **Consensus change:** yes
- **Needs Mike:** Nothing for the local or dev chain. A decision on the permanent RP ID and origins before any public genesis (question 6).
- **Files:** crates/chain-core/src/{crypto.rs,types.rs,params.rs,state.rs,mandate.rs,webauthn.rs(new),lib.rs}, crates/chain-core/Cargo.toml (p256 0.9 no-default + ecdsa, sha2 0.9), crates/chain-core/tests/{webauthn_mode.rs,session_keys.rs,controllers.rs}, crates/kernel/src/codec.rs, crates/kernel/tests/codec_roundtrip.rs, crates/chain-wasm/src/ops.rs, crates/verifier/src/replay.rs, crates/node/src/{api.rs,node.rs,mcp.rs}, crates/explorer/static/index.html, crates/chain-sim/scenarios/session-key-sybils.json, DESIGN.md, README.md

1. Scheme::P256 and AddressKind::Passkey (pcp1); is_human() includes it.
2. SigMode::Webauthn with WebauthnProof{authenticator_data, client_data_json}, low-S 64-byte r||s, and limited-verification CDJ checks.
3. Params.webauthn Option{rp_id, origins}, encoded only when Some.
4. SetSessionKey (tag 11) and ClearSessionKey (tag 12) in state extension module 2, reusing mandate::check_scope; at most 4 keys, at most ~30 days.
5. SetControllers (tag 13), at most 4 keys.
6. RegisterAgent with optional terms (appended only when present, so old txids hold).
7. chain-wasm ops tx.webauthn and tx.describe.
8. Explorer Passkey pane (create a pass, grant a device pass, tap) beside Transmit.
9. Node POST /tx accepts webauthn wire JSON (DER or raw signature, normalized).
10. Kernel codec, verifier and Verify Desk updated in lockstep.
11. chain-sim scenario session-key-sybils.json.
12. DESIGN.md: new kinds, plus a note that the u16 kind mask is now full at tag 15.

### P2: PointCast one profile + passkey-first sign-in

- **Consensus change:** no
- **Needs Mike:** Real-device acceptance on his iPhone (signup, sign out, restore, add a backup key). cc can apply D1 migrations and deploy through scripts/deploy.sh. No new secrets or money. Sign-off on retiring /profile and the Beacon-first YOU chip.
- **Files:** functions/api/auth/passkey/signup/{options.ts,verify.ts}, functions/api/auth/passkey/_shared.ts, functions/_lib/passkey-cose.ts (new), functions/_lib/chain-account.ts (new), migrations/auth/0029_chain_accounts.sql, migrations/auth/0030_town_cards.sql, functions/_lib/town-card.ts, functions/api/card.ts, functions/api/me/receipts.ts (new), src/lib/auth/client.ts, src/lib/auth/types.ts, src/pages/auth.astro, src/pages/me.astro, src/pages/me/receipts.astro, src/pages/profile.astro (redirect), src/pages/minted.astro, src/pages/wallet.astro, src/pages/p/[handle].astro, src/components/FooterBar.astro, src/scripts/chrome/footer-bar.ts, src/components/WalletChip.astro, src/components/WalletConnect.astro (remove), functions/_lib/agent-identity.ts, tests/auth-passkeys-email.test.mjs, tests/town-cards.test.mjs

- Passkey signup with no prior session (ES256 only) that creates a pcu_ user, passkey identity, pcp1 chain account and session.
- COSE -> SEC1 -> pcp1 derivation shared with the Rust vectors.
- chain_accounts table.
- Town cards moved from VISITS KV to D1 town_cards, keeping the PCPROFILE take-back rule.
- /me becomes the one profile: /profile redirects to /me, /minted folds into /me Holdings, and the Mike-wallet fallbacks in /minted and /wallet are removed.
- /p/{handle} merges card, on-chain page and shelf.
- /me/receipts merges chain receipts, connect grants, x402 receipts and seals.
- Me > Devices (device passes) and Me > Keys (controllers, backup key).
- The FooterBar YOU chip reads getSession() and offers 'Make my pass' / 'Your pass' instead of 'Connect wallet (Beacon)'; WalletChip's 'View profile' points to /me.
- WalletConnect.astro retired and the pc:wallet* mirror made read-only.
- The D1 pci_ agent registry links to chain pca1 by public key.
- /auth/project folded into /connect.

### P3: First Mints on the local chain

- **Consensus change:** yes
- **Needs Mike:** Final calls on supply, eligibility, transferability and text lanes (questions 1-4). Who reviews the free-text queue. A dev attestor key only (local); no money.
- **Files:** pointcast-chain: crates/chain-core/src/{types.rs,state.rs,params.rs,edition.rs(new)}, crates/chain-core/tests/editions.rs, crates/kernel/src/codec.rs, crates/chain-wasm/src/ops.rs, crates/explorer/static/index.html, crates/chain-sim/scenarios/first-mints-sybil.json. pointcast: src/pages/first-mints.astro, src/pages/first-mints/desk.astro, src/lib/first-mints/{lexicon.ts,moderate.ts,eligibility.ts}, functions/api/first-mints/{approve.ts,queue.ts,[serial].svg.ts}, migrations/auth/0031_first_mint_approvals.sql, scripts/first-mints-founding-snapshot.mjs, src/data/first-mints/noun-seeds.json

Chain:
- OpenEdition (tag 14) and EditionMint (tag 15), state extension module 3, Params.edition_admin, on-chain recipe validation, seed and recipe uniqueness, approval verification, chain-assigned serials, receipts.
- chain-sim scenario first-mints-sybil.json proving that per-key farming yields zero mints without approvals.

PointCast:
- Composer /first-mints that signs EditionMint with the passkey and shows the plain-words prompt.
- Attestor endpoint with eligibility gate, word lexicon lane and free-text review desk.
- Approvals table.
- Renderer endpoint [serial].svg.
- Holder view in /me.
- Founding 100 snapshot script.
- A wire block and front-door slot ready, not yet published.

### P4: Public testnet + Tezos mirror

- **Consensus change:** yes
- **Needs Mike:** Hosting money and choice for the sequencer. Custody of the sequencer, drum attestor and First Mints attestor keys. Tez for anchors. Signing the seal v2 unpause and any FA2 origination (--execute --confirm-mainnet). The public announcement.
- **Files:** pointcast-chain: genesis/params for the public chain, crates/node deployment config, crates/node/src/cli_anchor.rs settings, crates/chain-core/src/mandate.rs (mask widening), proof-of-balance merge. pointcast: contracts/v2/first_mints_fa2.py + scripts/first-mints-originate.mjs, functions/api/tezos-metadata/first-mints/[tokenId].ts, the seal issuer Worker (pointcast-kennel-seals) kind routing, src/content/blocks/NNNN.json, src/data/contracts.json first_mints entry

- A public node and explorer at chain.pointcast.xyz (same registrable domain, so RP pointcast.xyz passkeys work).
- Genesis with webauthn params, drum_attest_policy room_only, tap gating (tap_window_blocks 1200, taps_per_window 1), drum_attest_max_age_ms 300000 and block_issuance_cap 2000 per FINDINGS.
- The drum Worker holds DRUM_ATTESTOR_SK and the attest endpoint.
- Anchors to Tezos.
- First Mints edition opened.
- founding-100 attestations on seal v1 (or v2 after unpause) to linked tz wallets.
- Optional PCFIRST FA2 with proof-based claim, and metadata route.
- The u16 mandate kind mask widened before any tag 16 (edition transfer).
- Launch published as a block, a front-door news item and a homepage link.

## Risks

- Passkeys are per ecosystem: an iCloud passkey and a Google or Windows passkey are different P-256 keys, so the same person on iPhone and a Windows PC gets two pcp1 addresses unless SetControllers ships in P1 and the 'Add a backup key' nudge is real.
- RP lock-in: every chain passkey is bound to rp_id pointcast.xyz, which is fixed at genesis. A domain change strands every account. Signing works only on pointcast.xyz or subdomains (chain.pointcast.xyz), never on pages.dev or 127.0.0.1 with prod keys.
- Synced-passkey compromise (Apple ID or Google account takeover) gives full account control. That is acceptable for non-monetary ATTN; once First Mints carry value, a quorum or timelock for high-value acts may be needed.
- Free keys still farm (chain-sim: every sybil key earns the 500/day cap). First Mints scarcity rests entirely on one centralized attestor key (FIRST_MINTS_ATTESTOR_SK) and the eligibility gate. Key leakage or a lax gate means unlimited mints up to supply.
- Immutable text: a moderation miss is permanent on chain. Renderer tombstones and explorer hiding do not remove the bytes, which raw-chain readers and archives will still show.
- Consensus changes ripple: chain-core, the kernel codec, chain-wasm (Verify Desk), the verifier, chain-sim and explorer must all change in lockstep or replay and evidence break. Tags 11-15 use up the u16 mandate mask, so tag 16 (edition transfer) needs a widening migration.
- Crypto stack: offline only p256 0.9 (2021 RustCrypto generation) is available, so the chain runs two ECC generations side by side. The CDJ limited-verification check depends on browser serialization order (type, challenge, origin). Both need the real-device vector suite and a p256 0.13 swap when online.
- Session keys in IndexedDB on a large site with many parallel agents shipping inline scripts: XSS could drive taps and drums until expiry. This is bounded by terms (no spend, no mint, no key changes, 30 days, max 4 keys), but leaderboard and ATTN fraud is possible.
- Identity sprawl gets worse before it gets better: 4 holdings pages, 3 wallet connectors, 2 storage models, KV cards, D1 users, and 2 agent registries. Adding chain accounts without the P2 consolidation adds a fifth way to disagree about who someone is.
- P-256 verification costs several times more than Ed25519, and mempool admission is stateless signature checking, so webauthn txs are a cheaper DoS lever on a fee-less chain. A per-sender mempool cap and per-IP limits at the HTTP edge are needed.

## Questions for Mike

1. First Mints supply: 1,200 (one per unique Nouns seed, with the Founding 100 as serials 1-100), or only 100 total?
2. Eligibility: do you approve the gate (a 72-hour-old passkey account plus one of: presence attested on 3 or more days, a handle with Shortwave history, a linked Tezos wallet with PointCast history, or a founder invite), and reserving the Founding 100 for a pre-announcement snapshot of existing regulars?
3. Should First Mints be non-transferable on pointcast-chain until the Tezos FA2 mirror exists, or transferable from day one (that needs the mandate mask widened first)?
4. Text: free text through a review queue (reviewed by you alone, or by you plus agents with the automated filter), or only the curated word lexicon for v1?
5. Recovery stance: strictly non-custodial (a second passkey or Kukai as a controller), or do you want a PointCast guardian key on a 7-day timelock (a new primitive)?
6. Confirm pointcast.xyz as the permanent passkey RP ID and chain.pointcast.xyz as the public node and explorer origin.
7. Tezos mirror: issue founding-100 on the live seal v1 now, or unpause seal v2 first? And will you originate a transferable PCFIRST FA2 later?
8. P4 hosting and keys: where should the public sequencer run, and who holds the sequencer, drum-attestor and First Mints attestor keys (your Kukai, a new hardware key, or the cc agent wallet tz1PTUzb...)?
