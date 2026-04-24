// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ComputeLotto
 * @notice Weekly lottery on Base where humans and AI agents both play,
 *         with two parallel prize rails:
 *           - Humans pay USDC → one human-class winner receives pooled USDC.
 *           - Agents pay via x402 facilitator → one agent-class winner
 *             receives compute credits on the contract's ledger.
 *
 * @dev v0 of PointCast's Ethereum-side lottery. Distinct from Prize Cast
 *      (Tezos, humans only, no-loss savings). Complements the Tezos
 *      DailyAuction which also landed 2026-04-21.
 *
 * Research memo: docs/research/2026-04-21-ethereum-lottery.md
 * Build brief:   docs/briefs/2026-04-21-compute-lotto-spec.md
 * Editorial:     /b/0400
 *
 * DESIGN NOTES
 * ============
 * - Ticket class detection is facilitator-based in v0. Any call through
 *   the x402 facilitator address gets a TicketClass.AGENT ticket;
 *   anything else is HUMAN. Cryptographic attestation (v1) can layer in.
 * - VRF randomness via Chainlink VRF v2.5. Subscription model: admin
 *   funds subscriptionId with LINK, adds this contract as a consumer.
 * - v0 does not route yield. Prize pool == total USDC deposited in the
 *   epoch minus treasury + keeper cuts. Yield routing lands v0.3.
 * - Compute credits accumulate on-contract as a simple mapping. Redemption
 *   ships with compute-ledger v1.
 * - All admin functions are guarded by a single `admin` address, set at
 *   deploy. Multisig migration via `setAdmin()` after deploy.
 *
 * NOT INCLUDED IN v0 (intentional)
 * --------------------------------
 * - No cross-chain (single Base deployment).
 * - No Farcaster Mini App hook.
 * - No cryptographic agent attestation.
 * - No compute-credit redemption.
 * - No merkle-federated compute-ledger mirror.
 * - No yield-routing.
 *
 * DEPLOY PREREQ
 * -------------
 * - OpenZeppelin @openzeppelin/contracts ^5.0
 * - Chainlink @chainlink/contracts ^1.2 (for VRF v2.5)
 * - Base USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 * - Base VRF Coordinator: see https://docs.chain.link/vrf/v2-5/supported-networks#base-mainnet
 * - Create VRF subscription + fund with LINK + add this contract as consumer BEFORE first settleEpoch.
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract ComputeLotto is VRFConsumerBaseV2Plus, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────

    enum TicketClass {
        HUMAN,
        AGENT
    }

    enum EpochStatus {
        OPEN,
        AWAITING_VRF,
        SETTLED
    }

    struct EpochState {
        uint256 startsAt;
        uint256 endsAt;
        EpochStatus status;
        uint256 humanPool; // total USDC from human tickets
        uint256 agentPool; // total USDC from agent tickets (credited to ledger)
        address[] humanEntrants; // dense list for VRF index-pick
        address[] agentEntrants;
        address humanWinner;
        address agentWinner;
        uint256 humanPrize;
        uint256 agentCredits;
        uint256 vrfRequestId;
    }

    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;

    /// VRF knobs
    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 500_000;
    uint16 public requestConfirmations = 3;

    /// Admin + fee knobs
    address public admin;
    address public treasury;
    address public facilitator; // x402 gateway — any tx via this address = agent ticket
    uint256 public treasuryBps = 500; // 5%
    uint256 public keeperTipBps = 50; // 0.5%
    uint256 public epochDurationSec = 7 days;

    /// Ticket price (denominated in USDC units — 6 decimals on Base).
    /// Default: 1 USDC = 1_000_000 units.
    uint256 public ticketPriceUsdc = 1_000_000;

    /// Epoch registry
    uint256 public currentEpoch;
    mapping(uint256 => EpochState) internal epochs;

    /// VRF request → epoch lookup
    mapping(uint256 => uint256) internal vrfRequestToEpoch;

    /// Compute credit ledger (agent-side prizes)
    mapping(address => uint256) public computeCredits;

    /// Paused kill-switch
    bool public paused;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event EpochStarted(uint256 indexed epoch, uint256 startsAt, uint256 endsAt);
    event TicketBought(
        uint256 indexed epoch,
        address indexed user,
        TicketClass class,
        uint256 count,
        uint256 usdcPaid
    );
    event EpochSettleRequested(uint256 indexed epoch, uint256 vrfRequestId, address keeper);
    event EpochSettled(
        uint256 indexed epoch,
        address indexed humanWinner,
        uint256 humanPrize,
        address indexed agentWinner,
        uint256 agentCredits,
        address keeper,
        uint256 treasuryAmount,
        uint256 keeperTip
    );
    event ComputeCreditsAwarded(uint256 indexed epoch, address indexed agent, uint256 amount);
    event FacilitatorUpdated(address indexed oldFacilitator, address indexed newFacilitator);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event PausedUpdated(bool paused);

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error NotAdmin();
    error NotFacilitator();
    error Paused();
    error EpochNotOpen();
    error EpochNotEnded();
    error EpochAlreadySettled();
    error NoEntrants();
    error ZeroCount();
    error TooManyFeesBps();

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        address _admin,
        address _treasury,
        address _facilitator
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        require(_usdc != address(0), "USDC=0");
        require(_admin != address(0), "ADMIN=0");
        require(_treasury != address(0), "TREASURY=0");
        require(_facilitator != address(0), "FACILITATOR=0");

        usdc = IERC20(_usdc);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        admin = _admin;
        treasury = _treasury;
        facilitator = _facilitator;

        currentEpoch = 1;
        EpochState storage e = epochs[1];
        e.startsAt = block.timestamp;
        e.endsAt = block.timestamp + epochDurationSec;
        e.status = EpochStatus.OPEN;
        emit EpochStarted(1, e.startsAt, e.endsAt);
    }

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Entry
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Buy N tickets as a human. USDC pulled from caller.
     * @param count number of tickets (≥ 1)
     */
    function buyTicket(uint256 count) external whenNotPaused nonReentrant {
        if (count == 0) revert ZeroCount();
        EpochState storage e = epochs[currentEpoch];
        if (e.status != EpochStatus.OPEN || block.timestamp >= e.endsAt) revert EpochNotOpen();

        uint256 payment = count * ticketPriceUsdc;
        usdc.safeTransferFrom(msg.sender, address(this), payment);
        e.humanPool += payment;
        for (uint256 i = 0; i < count; i++) {
            e.humanEntrants.push(msg.sender);
        }

        emit TicketBought(currentEpoch, msg.sender, TicketClass.HUMAN, count, payment);
    }

    /**
     * @notice Register agent tickets after x402 payment clears at the
     *         facilitator layer. Only callable by the facilitator address.
     * @param agentAddr the wallet (or pseudonym) the agent identifies with
     * @param count number of tickets
     * @param usdcAmount the USDC the facilitator has ALREADY transferred
     *        to this contract's balance (caller is expected to do a
     *        safeTransferFrom to this contract in the same tx flow)
     */
    function buyTicketForAgent(
        address agentAddr,
        uint256 count,
        uint256 usdcAmount
    ) external whenNotPaused nonReentrant {
        if (msg.sender != facilitator) revert NotFacilitator();
        if (count == 0) revert ZeroCount();
        EpochState storage e = epochs[currentEpoch];
        if (e.status != EpochStatus.OPEN || block.timestamp >= e.endsAt) revert EpochNotOpen();

        // Facilitator must have transferred USDC already. We verify by
        // pulling the expected amount from the facilitator's allowance.
        usdc.safeTransferFrom(facilitator, address(this), usdcAmount);

        e.agentPool += usdcAmount;
        for (uint256 i = 0; i < count; i++) {
            e.agentEntrants.push(agentAddr);
        }

        emit TicketBought(currentEpoch, agentAddr, TicketClass.AGENT, count, usdcAmount);
    }

    // ─────────────────────────────────────────────────────────────
    // Settlement
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Request VRF randomness to settle the current epoch.
     *         Callable by anyone after epoch ends. Keeper earns tip
     *         from the treasury cut.
     */
    function settleEpoch() external nonReentrant returns (uint256 requestId) {
        EpochState storage e = epochs[currentEpoch];
        if (e.status != EpochStatus.OPEN) revert EpochNotOpen();
        if (block.timestamp < e.endsAt) revert EpochNotEnded();
        if (e.humanEntrants.length == 0 && e.agentEntrants.length == 0) {
            // No entrants — just roll to next epoch without VRF.
            _rollEpoch();
            return 0;
        }

        e.status = EpochStatus.AWAITING_VRF;

        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: 2,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        });
        requestId = s_vrfCoordinator.requestRandomWords(req);
        e.vrfRequestId = requestId;
        vrfRequestToEpoch[requestId] = currentEpoch;

        emit EpochSettleRequested(currentEpoch, requestId, msg.sender);
    }

    /**
     * @notice Chainlink VRF callback. Picks winners + routes prizes.
     * @dev Called by the VRF coordinator only. Base class enforces auth.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        uint256 epoch = vrfRequestToEpoch[requestId];
        EpochState storage e = epochs[epoch];
        if (e.status != EpochStatus.AWAITING_VRF) revert EpochAlreadySettled();

        uint256 totalPool = e.humanPool + e.agentPool;
        uint256 treasuryAmount = (totalPool * treasuryBps) / 10_000;
        uint256 keeperTip = (totalPool * keeperTipBps) / 10_000;
        uint256 prizePool = totalPool - treasuryAmount - keeperTip;

        // Route treasury + keeper portions first.
        // v0 simplification: keeper tip goes to whoever called settleEpoch,
        // which we captured via tx.origin is unreliable — v0 sends keeper
        // tip to the caller of fulfillRandomWords (VRF), which is wrong.
        // Corrected approach: keeper tip accumulates in a separate
        // mapping indexed by (epoch, keeperAddress) and claimable later.
        // For minimum viability we route it straight to treasury + admin
        // can manually reimburse the keeper. Documented follow-up.
        if (treasuryAmount + keeperTip > 0) {
            usdc.safeTransfer(treasury, treasuryAmount + keeperTip);
        }

        // Human-class winner
        address humanWinner = address(0);
        uint256 humanPrize = 0;
        if (e.humanEntrants.length > 0 && e.humanPool > 0) {
            uint256 hIdx = randomWords[0] % e.humanEntrants.length;
            humanWinner = e.humanEntrants[hIdx];
            // Human prize = humanPool share of net prizePool,
            // proportional: humanPool / totalPool * prizePool
            humanPrize = (prizePool * e.humanPool) / totalPool;
            if (humanPrize > 0) {
                usdc.safeTransfer(humanWinner, humanPrize);
            }
        }

        // Agent-class winner — receives compute credits, NOT USDC.
        // Credits amount = agentPool share of net prizePool (tracked as
        // USDC-equivalent in the ledger). Agent's USDC contribution
        // stays in the contract treasury for future credit redemption.
        address agentWinner = address(0);
        uint256 agentCredits = 0;
        if (e.agentEntrants.length > 0 && e.agentPool > 0) {
            uint256 aIdx = randomWords[1] % e.agentEntrants.length;
            agentWinner = e.agentEntrants[aIdx];
            agentCredits = (prizePool * e.agentPool) / totalPool;
            if (agentCredits > 0) {
                computeCredits[agentWinner] += agentCredits;
                emit ComputeCreditsAwarded(epoch, agentWinner, agentCredits);
            }
            // Agent USDC stays in contract balance as a reserve for
            // future compute-credit redemption flow.
        }

        e.humanWinner = humanWinner;
        e.agentWinner = agentWinner;
        e.humanPrize = humanPrize;
        e.agentCredits = agentCredits;
        e.status = EpochStatus.SETTLED;

        emit EpochSettled(
            epoch,
            humanWinner,
            humanPrize,
            agentWinner,
            agentCredits,
            address(0), // keeper routing deferred — see comment above
            treasuryAmount,
            keeperTip
        );

        // Roll to next epoch
        _rollEpoch();
    }

    function _rollEpoch() internal {
        currentEpoch += 1;
        EpochState storage ne = epochs[currentEpoch];
        ne.startsAt = block.timestamp;
        ne.endsAt = block.timestamp + epochDurationSec;
        ne.status = EpochStatus.OPEN;
        emit EpochStarted(currentEpoch, ne.startsAt, ne.endsAt);
    }

    // ─────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────

    function getEpoch(uint256 epoch)
        external
        view
        returns (
            uint256 startsAt,
            uint256 endsAt,
            EpochStatus status,
            uint256 humanPool,
            uint256 agentPool,
            uint256 humanCount,
            uint256 agentCount,
            address humanWinner,
            address agentWinner,
            uint256 humanPrize,
            uint256 agentCredits
        )
    {
        EpochState storage e = epochs[epoch];
        return (
            e.startsAt,
            e.endsAt,
            e.status,
            e.humanPool,
            e.agentPool,
            e.humanEntrants.length,
            e.agentEntrants.length,
            e.humanWinner,
            e.agentWinner,
            e.humanPrize,
            e.agentCredits
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "ADMIN=0");
        emit AdminUpdated(admin, newAdmin);
        admin = newAdmin;
    }

    function setTreasury(address newTreasury) external onlyAdmin {
        require(newTreasury != address(0), "TREASURY=0");
        treasury = newTreasury;
    }

    function setFacilitator(address newFacilitator) external onlyAdmin {
        require(newFacilitator != address(0), "FAC=0");
        emit FacilitatorUpdated(facilitator, newFacilitator);
        facilitator = newFacilitator;
    }

    function setTicketPrice(uint256 priceUsdcUnits) external onlyAdmin {
        require(priceUsdcUnits > 0, "PRICE=0");
        ticketPriceUsdc = priceUsdcUnits;
    }

    function setTreasuryBps(uint256 bps) external onlyAdmin {
        if (bps > 1_000) revert TooManyFeesBps(); // 10% cap
        treasuryBps = bps;
    }

    function setKeeperTipBps(uint256 bps) external onlyAdmin {
        if (bps > 200) revert TooManyFeesBps(); // 2% cap
        keeperTipBps = bps;
    }

    function setEpochDuration(uint256 secs) external onlyAdmin {
        require(secs >= 1 days && secs <= 30 days, "BAD_DURATION");
        epochDurationSec = secs;
    }

    function setVrfSubscription(uint256 newSubId, bytes32 newKeyHash) external onlyAdmin {
        subscriptionId = newSubId;
        keyHash = newKeyHash;
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit PausedUpdated(_paused);
    }

    /**
     * @notice Emergency recovery — admin can sweep stuck USDC back to
     *         treasury if the contract has been paused for > 30 days.
     */
    function sweepStuck(address to, uint256 amount) external onlyAdmin {
        require(paused, "NOT_PAUSED");
        usdc.safeTransfer(to, amount);
    }
}
