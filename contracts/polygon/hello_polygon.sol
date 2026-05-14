// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HelloPolygon
 * @notice ERC-20 mirror of the 2018-era HELLO token on Ethereum mainnet,
 *         with a built-in faucet for permissionless single-claim-per-day.
 *
 * @dev Lore
 * The ancestor: HELLO at 0x1Fda96405DD8Ee22631aBCf4f61282eaE802012f on
 * Ethereum L1, deployed by Mike Hoydich circa 2018-2021. Same name
 * "Hello | a greeting", same symbol HELLO, same 18 decimals, same 10B
 * supply. This descendant lives on Polygon mainnet so that saying "hello"
 * on-chain doesn't cost more than the gesture itself.
 *
 * @dev Design
 * - At construction the full 10B HELLO is minted to the contract address.
 *   The contract IS the faucet — it holds its own bag and hands tokens
 *   out one greeting at a time.
 * - claim() transfers 1 HELLO from the contract's balance to msg.sender.
 *   Gated by a 24-hour cooldown per address.
 * - No admin, no upgrade, no fees, no ownership. Once deployed, nobody
 *   (including Mike) can pause, recover, or change parameters. Same
 *   permanent + parameterless posture as Wire Attestations.
 * - User pays gas. On Polygon mainnet that's ~$0.001-0.05 per claim.
 * - Sybil-resistance: gas cost > zero. Loose, intentional.
 *
 * @dev Origination
 * Mike Hoydich originates. After deployment, paste the contract address
 * into `src/lib/eth/config.ts:HELLO_POLYGON` and the /hello page activates.
 * See contracts/polygon/README.md for the deploy recipe.
 *
 * @dev Review
 * Codex review brief: docs/briefs/2026-05-08-codex-hello-polygon.md
 *
 * @dev Dependencies
 * OpenZeppelin Contracts v5.x — ERC20.
 */

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract HelloPolygon is ERC20 {
    /// @notice The ancestor on Ethereum L1. Informational. Not enforced on-chain.
    address public constant L1_ANCESTOR = 0x1Fda96405DD8Ee22631aBCf4f61282eaE802012f;

    /// @notice Total supply minted at construction. Matches the L1 ancestor.
    uint256 public constant INITIAL_SUPPLY = 10_000_000_000 * 10**18;

    /// @notice Amount transferred per claim. One hello.
    uint256 public constant CLAIM_AMOUNT = 1 * 10**18;

    /// @notice Cooldown between claims for the same address.
    uint256 public constant CLAIM_COOLDOWN = 24 hours;

    /// @notice Last claim timestamp per address. Zero means never claimed.
    mapping(address => uint256) public lastClaimAt;

    /* -------------------------------- events --------------------------------- */

    event Claimed(address indexed who, uint256 amount, uint256 at);

    /* ------------------------------- constructor ----------------------------- */

    constructor() ERC20("Hello | a greeting", "HELLO") {
        _mint(address(this), INITIAL_SUPPLY);
    }

    /* ------------------------------ external --------------------------------- */

    /**
     * @notice Claim one HELLO. Rate-limited to one claim per 24h per address.
     * @dev Reverts on cooldown violation or if the faucet has run dry.
     *      Effects-Interactions: state is written before `_transfer`. ERC-20
     *      transfers can call into receiver contracts only via the optional
     *      `transferAndCall` (not implemented here) — the standard ERC20
     *      `_transfer` is a pure storage update, so reentrancy is moot.
     */
    function claim() external {
        uint256 last = lastClaimAt[msg.sender];
        require(last == 0 || block.timestamp - last >= CLAIM_COOLDOWN, "HELLO: cooldown");
        require(balanceOf(address(this)) >= CLAIM_AMOUNT, "HELLO: faucet dry");

        lastClaimAt[msg.sender] = block.timestamp;
        emit Claimed(msg.sender, CLAIM_AMOUNT, block.timestamp);
        _transfer(address(this), msg.sender, CLAIM_AMOUNT);
    }

    /* -------------------------------- views ---------------------------------- */

    /// @notice Seconds until `who` can claim again. Zero means ready now.
    function timeUntilClaim(address who) external view returns (uint256) {
        uint256 last = lastClaimAt[who];
        if (last == 0) return 0;
        uint256 nextAt = last + CLAIM_COOLDOWN;
        return block.timestamp >= nextAt ? 0 : nextAt - block.timestamp;
    }

    /// @notice Remaining HELLO in the faucet's bag.
    function faucetBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }
}
