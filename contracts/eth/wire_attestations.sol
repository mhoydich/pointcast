// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PointCastWireAttestations
 * @notice On-chain attestations for PointCast Wire blocks, on Base.
 *
 * Each token in this collection records that some signer (a human, a
 * resident agent, or anyone with an EVM address) signed off on the content
 * of a specific PointCast block at a specific moment.
 *
 * The block itself stays canonical at https://pointcast.xyz/b/{blockId} +
 * https://pointcast.xyz/api/blocks.jsonl. The chain stores only the tuple
 * (block_id, content_hash, signer, signed_at). This keeps origination
 * cheap, lets the editorial substrate keep moving without coupling to
 * gas costs, and produces a queryable on-chain log.
 *
 * @dev Design notes
 * - One attestation per (block_id, signer) — the same wallet can't double-
 *   attest the same block. Multiple wallets can attest the same block;
 *   that's the whole point.
 * - block_id is the 4-char zero-padded string id used everywhere on
 *   PointCast ("0450", "0460", etc.). The contract enforces 4 chars but
 *   not numeric-ness — caller can pass anything that fits, allowing room
 *   for future block-id schemes.
 * - content_hash is sha256 of the block's canonical JSON body, computed
 *   off-chain. Caller is responsible for it being correct; the chain
 *   simply records what was signed.
 * - tokenURI returns on-chain JSON via data:application/json;base64.
 *   No IPFS dependency, no centralized resolver.
 * - This is intentionally a thin record-keeping contract. No fees, no
 *   royalties, no ownership transfer mechanics beyond ERC-721 standard.
 * - Codex review request: docs/briefs/2026-05-07-codex-wire-attestations.md
 *
 * @dev Decision record: docs/decisions/2026-05-07-mist-room-decision.md
 *
 * @dev Origination
 * Mike Hoydich originates this contract on Base mainnet. Once deployed,
 * paste the address into `src/lib/eth/config.ts:WIRE_ATTESTATIONS_BASE`
 * and the per-block "Attest on Base" button in /mist activates.
 *
 * Dependencies: OpenZeppelin Contracts v5.x (ERC721, ERC721Enumerable,
 * Strings, Base64). See contracts/eth/README.md for deployment.
 */

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract PointCastWireAttestations is ERC721, ERC721Enumerable {
    using Strings for uint256;
    using Strings for address;

    /* --------------------------------- types --------------------------------- */

    struct Attestation {
        string  blockId;       // 4-char zero-padded PointCast block id, e.g. "0450"
        bytes32 contentHash;   // sha256 of the canonical block JSON, computed off-chain
        address signer;        // wallet that called attest()
        uint256 signedAt;      // block.timestamp at mint
    }

    /* -------------------------------- storage -------------------------------- */

    mapping(uint256 => Attestation) private _attestations;

    /// @notice block_id => signer => (tokenId + 1). Zero means "no attestation yet."
    /// @dev Stored as id+1 so the default zero is unambiguous "not attested."
    mapping(string => mapping(address => uint256)) public byBlockSignerPlusOne;

    /// @notice Monotonically increasing token id. Starts at 1 (zero is reserved).
    uint256 public nextTokenId = 1;

    /* -------------------------------- events --------------------------------- */

    event Attested(
        uint256 indexed tokenId,
        string  indexed blockId,
        address indexed signer,
        bytes32 contentHash,
        uint256 signedAt
    );

    /* ------------------------------- constructor ----------------------------- */

    constructor() ERC721("PointCast Wire Attestations", "PCWIRE") {}

    /* ------------------------------ external --------------------------------- */

    /**
     * @notice Mint an attestation token recording that msg.sender signs off
     *         on a PointCast block at a given content hash.
     * @param blockId      4-char zero-padded block id, e.g. "0450".
     * @param contentHash  sha256 of the block's canonical JSON. Cannot be 0x0.
     * @return tokenId     The id of the minted attestation token.
     *
     * @dev Reverts if:
     *  - blockId length != 4
     *  - contentHash is bytes32(0)
     *  - msg.sender has already attested this exact blockId
     *
     * @dev Effects-Interactions ordering:
     *  - All state writes happen BEFORE _safeMint, which can call into the
     *    recipient's onERC721Received hook. Even though msg.sender == recipient
     *    here (so reentrancy via a custom receiver would just re-enter as the
     *    same caller), the CEI pattern is preserved out of habit + audit-friendliness.
     */
    function attest(string calldata blockId, bytes32 contentHash) external returns (uint256) {
        require(bytes(blockId).length == 4, "PCWIRE: blockId must be 4 chars");
        require(contentHash != bytes32(0), "PCWIRE: contentHash zero");
        require(byBlockSignerPlusOne[blockId][msg.sender] == 0, "PCWIRE: already attested");

        uint256 id = nextTokenId++;
        _attestations[id] = Attestation({
            blockId: blockId,
            contentHash: contentHash,
            signer: msg.sender,
            signedAt: block.timestamp
        });
        byBlockSignerPlusOne[blockId][msg.sender] = id + 1;

        emit Attested(id, blockId, msg.sender, contentHash, block.timestamp);

        _safeMint(msg.sender, id);
        return id;
    }

    /* -------------------------------- views ---------------------------------- */

    /// @notice Read the full attestation record for a given token.
    function attestation(uint256 tokenId) external view returns (Attestation memory) {
        _requireOwned(tokenId);
        return _attestations[tokenId];
    }

    /// @notice Convenience lookup: has this signer attested this block? Returns 0 if not.
    function tokenIdFor(string calldata blockId, address signer) external view returns (uint256) {
        uint256 plusOne = byBlockSignerPlusOne[blockId][signer];
        return plusOne == 0 ? 0 : plusOne - 1;
    }

    /// @notice On-chain JSON metadata. Returns a data:application/json;base64 URI.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Attestation memory a = _attestations[tokenId];

        // Build the JSON in two passes so the stack depth stays comfortable.
        string memory traits = string.concat(
            '[',
            '{"trait_type":"block_id","value":"',     a.blockId, '"},',
            '{"trait_type":"content_hash","value":"', uint256(a.contentHash).toHexString(32), '"},',
            '{"trait_type":"signer","value":"',       a.signer.toHexString(), '"},',
            '{"trait_type":"signed_at","display_type":"date","value":', a.signedAt.toString(), '}',
            ']'
        );

        string memory json = string.concat(
            '{',
            '"name":"PointCast Block #', a.blockId, ' attestation",',
            '"description":"On-chain attestation that ', a.signer.toHexString(),
            ' signed off on PointCast block ', a.blockId,
            ' at unix ', a.signedAt.toString(),
            '. Canonical block: https://pointcast.xyz/b/', a.blockId,
            '. Issued by https://pointcast.xyz/mist.",',
            '"external_url":"https://pointcast.xyz/b/', a.blockId, '",',
            '"attributes":', traits,
            '}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    /* ------------------- ERC721Enumerable required overrides ----------------- */

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
