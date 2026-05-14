# `contracts/polygon/` — PointCast Polygon contracts

The first contract here is **HelloPolygon** — an ERC-20 mirror of the 2018-era HELLO token on Ethereum L1, with a built-in faucet that hands out one HELLO per claim, rate-limited to once per address per 24 hours.

## Files

| File | Status |
|---|---|
| `hello_polygon.sol` | Source. Awaiting Codex review + Mike origination. |
| `README.md` | This file. |

## What the contract does

```
function claim() external
```

Anyone can call from Polygon mainnet. Transfers **1 HELLO** (= `1 * 10**18` raw units) from the contract's own balance to `msg.sender`. Reverts if:

- The caller has claimed within the last 24 hours, OR
- The faucet has run dry (initial supply exhausted; unlikely given 10B HELLO supply at 1/claim)

```
function timeUntilClaim(address who) external view returns (uint256)
function faucetBalance() external view returns (uint256)
```

Read helpers — seconds until the next claim is available; remaining HELLO in the bag. Used by the `/hello` page to render the cooldown timer and the bag-empty state.

Emits `Claimed(address indexed who, uint256 amount, uint256 at)` per successful claim — indexer-friendly for off-chain dashboards.

## Lore

The ancestor lives on Ethereum L1 at [`0x1Fda96405DD8Ee22631aBCf4f61282eaE802012f`](https://etherscan.io/token/0x1Fda96405DD8Ee22631aBCf4f61282eaE802012f) — Mike's 2018-era HELLO token, name `"Hello | a greeting"`, 10B supply, 18 decimals. The Polygon descendant matches every parameter (name, symbol, decimals, supply) except the chain. They are cousins, not connected by a formal bridge.

## Network

**Polygon mainnet** (chainId `137`). Live deployment.

Polygon was picked over Base for this token specifically because:

1. The L1 ancestor lives on Ethereum (a 2018 mint); Polygon is the historical L2 sibling for cheap gas in that era
2. Mike has existing Polygon presence (`COOL` NFT, the dormant `Marketplace` slot)
3. Gas is comparable to Base (~$0.001-0.05 per claim) so the "user pays" model works cleanly
4. Diversifying chain footprint — `/mist` is Base-flavored, `/hello` is Polygon-flavored, the original is L1

## Deployment

Uses OpenZeppelin Contracts v5.x (ERC20). Pick a Solidity toolchain. **Foundry recommended**.

### Foundry path

```bash
mkdir -p contracts/polygon/foundry && cd contracts/polygon/foundry

forge init --no-commit --no-git
forge install OpenZeppelin/openzeppelin-contracts --no-commit

cp ../hello_polygon.sol src/HelloPolygon.sol
forge build

# dry run on Polygon Amoy testnet first (chainId 80002)
forge create src/HelloPolygon.sol:HelloPolygon \
  --rpc-url https://rpc-amoy.polygon.technology \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $POLYGONSCAN_API_KEY \
  --verifier-url https://api-amoy.polygonscan.com/api

# mainnet
forge create src/HelloPolygon.sol:HelloPolygon \
  --rpc-url https://polygon-rpc.com \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $POLYGONSCAN_API_KEY \
  --verifier-url https://api.polygonscan.com/api
```

Note: the entire 10B initial supply is minted to the contract address at construction. The deployer wallet (yours) does NOT receive a balance — the bag is the contract itself. This is intentional: the contract is its own faucet, nobody (including you) can withdraw the unclaimed reserve.

### Wiring the deployed address

After deployment, paste into:

```ts
// src/lib/eth/config.ts
export const HELLO_POLYGON: `0x${string}` | null = '0x...';  // <-- here
```

Commit, push, redeploy the site. The `/hello` page reads the contract at build time and activates the claim flow.

## Mike-only

Per `docs/decisions/2026-05-07-mist-room-decision.md` and the `pointcast` skill, **only Mike originates this contract.** No agent runs origination on Mike's behalf — same rule as Wire Attestations and Tezos contracts.

If the initial verification on Polygonscan times out, the contract may be live without verified source. Re-run `forge verify-contract <address> src/HelloPolygon.sol:HelloPolygon ...` to recover.

## Future revisions

Out of scope for v0:

- **A formal bridge** between L1 HELLO and Polygon HELLO. They stay cousins; no on-chain link.
- **Permit-based claims (EIP-2612)** so claims can be gasless via a relayer. Worth doing if claim volume justifies the operational complexity.
- **Variable claim amount** (e.g. "first 100 claimers get 100 HELLO, then 1"). Would require an admin slot or an immutable schedule — both compromise the permanent-and-parameterless posture.
- **Mint-additional-on-claim** instead of pre-mint. Considered. Rejected for v0 because the L1 ancestor has a fixed 10B cap and matching it preserves the cousins framing.

— cc, 2026-05-08
