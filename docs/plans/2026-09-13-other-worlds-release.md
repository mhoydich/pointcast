# LOS ANGELES / OTHER WORLDS

Nine Transmissions by Michael Hoydich. **BY MICHAEL HOYDICH.**
**SAME CITY. OTHER WORLDS.** Pointcast is the publisher and gallery.

## September 14 publication

Mike authorized going live on September 14. The public exhibition, claim APIs,
and wallet-controlled inventory review page may be published. The scoped
`0020_other_worlds.sql` migration has been applied to the existing production
AUTH_DB; no claim rows exist. The prior September 13 deadline remains in force
until Mike supplies a replacement. NFT inventory has not yet been created.

Fresh read-only checks found the administrator unchanged, only token 0 present,
and the proposed sponsor revealed with 25.782858 tez. Setup simulation remains
1.437500 tez, below the proposed 1.6 tez setup ceiling. No funds were moved.
The claim sponsor key is not configured in Pages. The existing sponsor is also
a seals issuer, so its signing counter must be coordinated before enabling this
drop. A live collector delivery has not been performed.

## Release boundary

This implementation is prepared for review. It does not assert that any of the
nine artworks have been minted or that sponsored claims are live. Mainnet
inventory creation, signer configuration, funding, and claim activation require
the director's approval. No signing key belongs in the repository or this file.

Claims close at the **end of September 13, 2026 in Los Angeles**:
`2026-09-14T07:00:00.000Z` (September 14, 12:00 a.m. PDT). The server owns the
deadline; browser clocks do not extend it. The exhibition remains viewable.

## Collector experience

`/other-worlds` presents nine canonical still PNG posters in a responsive 3×3
gallery. Atmospheric motion belongs to the interface and respects reduced-motion
preferences. A collector selects an artwork, connects the existing Kukai/Beacon
wallet, and signs an expiring message that identifies the wallet, artwork,
metadata hash, site origin, network, and nonce. The collector signs no transfer
and pays **0 ꜩ**, including gas.

The existing `AUTH_DB` atomically reserves at most one artwork per wallet across
the exhibition, with at most 27 reservations per work (243 total). A project
signer transfers one already-minted FA2 edition to the verified wallet. Submission
and confirmation are separate states. The service requires independently
observed applied operation details and the matching token movement before
showing confirmed delivery.

The first valid signed claim returns a durable reservation. The client then
repeats the exact signed proof to start sponsored delivery. This separates the
all-nine inventory audit from Taquito preparation to stay within the Cloudflare
Workers Free external-request allowance. Existing reservations may finish after
midnight; new ones cannot be created then.

One wallet is not one person. The stated limit is per Tezos wallet. Transferring
an edition away does not restore eligibility.

## Reused infrastructure

- Existing Astro project, Cloudflare Pages Functions, and `AUTH_DB`; migration
  `migrations/auth/0020_other_worlds.sql` adds only this exhibition's tables.
- Existing Taquito 25 and shared Kukai/Beacon connection and signing helper.
- Existing general-purpose FA2 candidate:
  `KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb`, currently named **El Segundo**.
  Read-only inspection on September 13 verified Mike's administrator address,
  `create_token`, `mint_tokens`, `transfer`, and `update_operators` entrypoints.
  Only token 0 was registered. The prepared plan proposes new IDs 1–9 and does
  not rename the contract or modify its existing token. Indexers may show these
  works under El Segundo; the exhibition title lives in each artwork's metadata.
- SHA-256 hashes of exact canonical artwork and metadata bytes. Metadata is
  TZIP-21-shaped JSON, also written to a content-addressed filename. Hashes are
  anchored in the proposed on-chain token-info map.

The existing FA2 is administrator-mintable. This release mints exactly 27 copies
per work and refuses claims if observed supply differs from 27. It does not
claim that an immutable contract rule makes additional administrator minting
impossible. No new smart contract is required for this route.

## Offline preparation

```sh
npm ci
npm run other-worlds:prepare -- --input /absolute/path/to/other-worlds-art
npm run other-worlds:verify
npm run test:other-worlds
npm run audit:publishing
npm run build:bare
```

Canonical PNG bytes are preserved; WebP files are gallery previews. The final
manifest is `/collectibles/other-worlds/manifest.json`; exact checksums are at
`/collectibles/other-worlds/SHA256SUMS`. The metadata provides artwork credit,
source disclosure, and copyright information. The collection does not promise
returns, appreciation, resale, or investment benefits.

Prepare a fresh unsigned inventory plan, optionally using RPC simulation:

```sh
npm run other-worlds:inventory -- --sponsor APPROVED_PROJECT_WALLET --estimate --out work/other-worlds-inventory.json
```

This tool has no signing, injection, funding, or deployment mode. It verifies the
current mainnet administrator and absence of the proposed token IDs, then creates
9 `create_token` operations and one `mint_tokens` operation containing 27 copies
per artwork, directly to the selected sponsor. A wallet-controlled publication
step is still required. It refuses to overwrite or blindly repeat existing IDs.

The prepared default sponsor is the existing Pointcast project-wallet candidate
`tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY`. This is a proposal, not authority to use its
key or funds. Use an approved signer whose manager counter is exclusively
controlled by this claim service during the drop; other concurrent wallet
operations require coordination outside this service.

## Activation after approval

1. Review the nine canonical images, exact metadata hashes, existing-contract
   choice, sponsor address, setup estimate, and separate delivery budget.
2. Publish the reviewed web assets and verify their bytes at canonical URLs.
   HTTPS hosting follows Pointcast's existing approach; hashes detect changes.
   A locally computed hash is not an IPFS upload or pinning receipt.
3. The director signs the reviewed inventory operations through the wallet.
   Verify applied status, IDs, metadata pointers/hashes, totalSupply 27, and
   sponsor balance 27 for every work. No collector operator permissions are
   needed because inventory is minted directly to the sponsor.
4. Confirm the sponsor is revealed and holds sufficient approved tez. Securely
   configure its existing authorized key in Cloudflare; do not export it into
   chat, files, CLI arguments, or logs. A new key or funding transfer is a
   separate director-controlled action.
5. Apply the scoped migration to the existing database. Set the environment
   configuration below, deploy reviewed UI and Functions together, and check
   readiness. Only activate after explicit mainnet/spend approval.
6. With approval, perform one real collector wallet signature and sponsored
   delivery. Verify the exact operation, recipient, chosen token ID, amount one,
   0 tez attached, sponsor fee, recipient holding, and rejected second claim.
   That final live wallet/chain test cannot be substituted by an offline mock.

Required configuration (all values are fail-closed; none is enabled by default):

| Variable | Meaning |
| --- | --- |
| `AUTH_DB` | Existing Pointcast D1 database binding |
| `OTHER_WORLDS_ENABLED` | Literal `true` after publication readiness |
| `OTHER_WORLDS_MAINNET_APPROVED` | Literal `true` only after explicit approval |
| `OTHER_WORLDS_FA2_CONTRACT` | Verified FA2 containing these exact artworks |
| `OTHER_WORLDS_TOKEN_MAP` | JSON object with keys `1`–`9` and unique decimal **string** token IDs |
| `OTHER_WORLDS_SPONSOR_ADDRESS` | Approved project payer and inventory holder |
| `OTHER_WORLDS_SPONSOR_SECRET_KEY` | Cloudflare secret; must derive to the approved sponsor |
| `OTHER_WORLDS_RPC_URL` | HTTPS mainnet RPC, e.g. `https://rpc.tzkt.io/mainnet` |
| `OTHER_WORLDS_MAX_OPERATION_MUTEZ` | Explicit cap covering encoded fee plus maximum storage burn |
| `OTHER_WORLDS_TOTAL_BUDGET_MUTEZ` | Explicit ceiling for this entire campaign's reserved delivery costs |

Initial inventory costs and any funding/reveal costs are separate from the
delivery campaign cap. No live cost or sufficient balance is implied by a
configured address.

Unsigned simulations on September 13 estimated **1.437500 ꜩ** for inventory
creation and **0.022549 ꜩ** for one new-recipient FA2 transfer (network fee plus
storage burn). Repeating that illustrative delivery cost 243 times gives
**5.479407 ꜩ**, or **6.916907 ꜩ** including setup. Future actual transfers are
individually estimated; these are neither paid costs nor a price guarantee.
The proposed approval ceiling is **8 ꜩ overall**: up to 1.6 ꜩ setup and a
6.4 ꜩ delivery campaign cap, with a 0.03 ꜩ per-delivery ceiling. These limits
have not been activated. Re-estimate and review funding/reveal costs separately.

## Retries and recovery

A D1 sponsor lock serializes manager counters and spend decisions. The service
persists exact signed bytes, their operation hash, and reserved maximum cost
before injection. An ambiguous response retains the claim and the lock. It must
never construct a new transfer merely because an RPC timed out. Receipt polling
is read-only on chain and may reconcile a known operation in the ledger.

Do not delete a signed or submitted claim, release its inventory, or clear its
lock to make a retry appear successful. For unresolved signed operations, inspect
the stored hash, chain/mempool evidence, branch validity, and sponsor counter.
Any manual recovery or rebroadcast is an operator action requiring review of the
exact persisted operation. A failed delivery remains visibly held for review.

A crash in `preparing` also requires operator recovery. Disable claim processing,
inspect the row and lock, and establish that no signed bytes were persisted or
broadcast before consciously resetting the row to `reserved` and deleting its
matching lock. There is no automatic timeout that could race a still-running
signer. Signed/submitted operations must instead be reconciled by their stored
hash; two subsequent blocks plus exact FA2 movement evidence are required.
Another collector can reconcile a prior confirmed operation's lock if its owner
has left the page. No stored maximum-spend reservation is automatically refunded.

No scheduled service, paid pinning plan, new database, or new contract is added.

## Technical references

- [Cloudflare D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Existing FA2 contract](https://tzkt.io/KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb)
