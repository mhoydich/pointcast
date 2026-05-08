# `contracts/eth/` — PointCast Ethereum contracts

The first contract here is **PointCast Wire Attestations** — an ERC-721
on Base where each token records that some wallet signed off on the
content of a specific PointCast block at a specific moment.

This README covers what's here, how to deploy, and how to wire the
deployed address back into the site.

## Files

| File | Status |
|---|---|
| `wire_attestations.sol` | Source. Awaiting Codex review + Mike origination. |
| `README.md` | This file. |

## What the contract does

```
function attest(string calldata blockId, bytes32 contentHash)
  external
  returns (uint256 tokenId)
```

Anyone can call. Mints an ERC-721 to `msg.sender` with on-chain JSON
metadata containing `{block_id, content_hash, signer, signed_at}`. One
attestation per `(block_id, signer)` pair — no double-attesting the same
block from the same wallet, but multiple wallets can attest the same
block. Emits `Attested(tokenId, blockId, signer, contentHash, signedAt)`.

`block_id` is the 4-char zero-padded id used everywhere else on
PointCast (`"0450"`, `"0460"`). `content_hash` is sha256 of the canonical
block JSON, computed off-chain — the caller is responsible for it being
correct. The chain just records what was signed.

`tokenURI()` returns a `data:application/json;base64` URI with the
attestation as JSON + standard ERC-721 attributes. No IPFS dependency,
no centralized metadata resolver.

## Network

**Base mainnet** (chainId `8453`). Live deployment.
**Base Sepolia** (chainId `84532`). Optional dry-run before mainnet.

Reasons for Base over L1, Optimism, Zora chain:
- Sub-cent gas (~$0.001-0.05 per attestation in May 2026)
- Aligned with Nouns / Zora / Farcaster culture
- Already specced in the Manus diagnosis at `docs/wallet-metamask-diagnosis.md`

## Deployment

The contract uses **OpenZeppelin Contracts v5.x** (ERC721, ERC721Enumerable,
Strings, Base64). Pick a Solidity toolchain — **Foundry** is recommended
for cleanliness, but Hardhat also works.

### Foundry path (recommended)

```bash
# from repo root
mkdir -p contracts/eth/foundry && cd contracts/eth/foundry

# init a forge project
forge init --no-commit --no-git
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# place the source
cp ../wire_attestations.sol src/PointCastWireAttestations.sol

# build
forge build

# deploy to Base Sepolia first as a dry run
forge create src/PointCastWireAttestations.sol:PointCastWireAttestations \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api

# then mainnet
forge create src/PointCastWireAttestations.sol:PointCastWireAttestations \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api.basescan.org/api
```

### Wiring the deployed address

Once deployed, paste the contract address into:

```ts
// src/lib/eth/config.ts
export const WIRE_ATTESTATIONS_BASE: `0x${string}` | null =
  '0x...';  // <-- the deployed address goes here
```

That single edit + a redeploy of the site enables the per-block
"Attest on Base" button in `/mist`. Until then, the button stays
hidden / placeholder.

## Mike-only

Per the project rule documented in `docs/decisions/2026-05-07-mist-room-decision.md`
and the `pointcast` skill, **only Mike originates this contract**. No
agent runs origination on Mike's behalf — same as Tezos.

If a deployment fails midway (verification timeout, tx revert, etc.),
the contract may be live without verified source on Basescan. That's
recoverable: re-run `forge verify-contract` with the deployed address.

## Future revisions

Out of scope for v0:

- **A registry contract** that maps PointCast resident-agent addresses to
  human-readable names. v0 just shows raw `0x…` for the signer.
- **Royalties / fees**. None today; attestation is a public good.
- **ERC-1271 verify support** for smart-contract wallets (Coinbase Smart
  Wallet, Safe). Comes alongside CSW integration in the auth endpoint.
- **Burn / withdraw**. Standard ERC-721 transfer works; no extra exits.

— cc, 2026-05-07
