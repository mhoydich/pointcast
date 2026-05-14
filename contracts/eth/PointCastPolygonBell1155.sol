// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * PointCast Polygon Bell #001.
 *
 * One-token ERC-1155 contract for the lobby bell ladder. The dapp requires a
 * visitor to ring five unique rungs, collect a local receipt, and publish a
 * Polygon proof transaction. This contract consumes the proof hash and mints
 * one bell to the caller.
 *
 * The proof is intentionally lightweight: on-chain state records only the
 * hash. The full readable proof lives in the preceding Polygon calldata
 * transaction and in the local PointCast receipt.
 */
contract PointCastPolygonBell1155 is ERC1155, ERC2981, Ownable {
    uint256 public constant POLYGON_BELL_TOKEN_ID = 1;
    uint256 public constant EDITION_CAP = 100;

    string private _tokenUri;

    uint256 public totalMinted;
    mapping(address collector => bool minted) public hasMinted;
    mapping(bytes32 proofHash => bool used) public proofUsed;

    event BellMinted(address indexed collector, bytes32 indexed proofHash, uint256 supply);
    event TokenUriUpdated(string tokenUri);

    constructor(
        address initialOwner,
        string memory tokenUri_,
        address royaltyReceiver,
        uint96 royaltyBps
    ) ERC1155(tokenUri_) Ownable(initialOwner) {
        require(initialOwner != address(0), "OWNER_ZERO");
        require(bytes(tokenUri_).length > 0, "URI_EMPTY");

        _tokenUri = tokenUri_;

        if (royaltyReceiver != address(0) && royaltyBps > 0) {
            _setDefaultRoyalty(royaltyReceiver, royaltyBps);
        }
    }

    function mintBell(bytes32 proofHash) external {
        require(proofHash != bytes32(0), "PROOF_EMPTY");
        require(!hasMinted[msg.sender], "ALREADY_MINTED");
        require(!proofUsed[proofHash], "PROOF_USED");
        require(totalMinted < EDITION_CAP, "SOLD_OUT");

        hasMinted[msg.sender] = true;
        proofUsed[proofHash] = true;
        totalMinted += 1;

        _mint(msg.sender, POLYGON_BELL_TOKEN_ID, 1, "");
        emit BellMinted(msg.sender, proofHash, totalMinted);
    }

    function setTokenUri(string calldata nextTokenUri) external onlyOwner {
        require(bytes(nextTokenUri).length > 0, "URI_EMPTY");
        _tokenUri = nextTokenUri;
        emit URI(nextTokenUri, POLYGON_BELL_TOKEN_ID);
        emit TokenUriUpdated(nextTokenUri);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenId == POLYGON_BELL_TOKEN_ID, "UNKNOWN_TOKEN");
        return _tokenUri;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
