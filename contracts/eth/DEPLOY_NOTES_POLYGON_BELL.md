# PointCast Polygon Bell ERC-1155

Contract source: `contracts/eth/PointCastPolygonBell1155.sol`

Network: Polygon PoS mainnet

- Chain ID: `137`
- Wallet network hex: `0x89`
- Gas token: `POL`
- Metadata URI: `https://pointcast.xyz/polygon-bell/1.json`
- Token ID: `1`
- Edition cap: `100`
- Mint function: `mintBell(bytes32 proofHash)`

## Deploy

Use Remix or any Solidity deployer with OpenZeppelin Contracts available.

Constructor arguments:

```text
initialOwner: <Mike/PointCast EVM owner wallet>
tokenUri_: https://pointcast.xyz/polygon-bell/1.json
royaltyReceiver: <Mike/PointCast royalty wallet>
royaltyBps: 750
```

After deploy:

1. Copy the deployed `0x...` contract address.
2. Paste it into `src/data/contracts.json` at `polygon_bell.polygon`.
3. Rebuild and deploy PointCast.
4. `/polygon-bell#publish` will turn on the MetaMask `Mint token` button.

## Mint Flow

The dapp flow is intentionally two-step:

1. `Publish proof` sends a 0-value self-addressed Polygon transaction with the
   readable bell receipt in calldata.
2. `Mint token` computes `keccak256` over that proof payload and calls
   `mintBell(bytes32 proofHash)` on this contract.

The contract stores only:

- one mint per wallet
- one use per proof hash
- total minted supply up to 100

This keeps on-chain state small while keeping the human-readable proof visible
in the prior Polygon transaction.
