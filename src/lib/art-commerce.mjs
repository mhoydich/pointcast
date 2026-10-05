/** Pure guards and unsigned plans. No signer, wallet transfer or broadcast. */
export const ART_PRICE_MUTEZ = 1_000_000;
export const TEZOS_MAINNET = Object.freeze({
  chainId: 'NetXdQprcVkpaWU',
  rpc: 'https://rpc.tzkt.io/mainnet',
  indexer: 'https://api.tzkt.io',
  marketplace: 'KT1X9LUxV5qaPVLr17uzRfxgRWPdGfRMYxQT',
});
const address = /^(?:tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/;
const contractAddress = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;
const digest = /^[a-f0-9]{64}$/;
const blockHash = /^B[1-9A-HJ-NP-Za-km-z]{50}$/;
const immutableUri = /^ipfs:\/\/[a-zA-Z0-9]+(?:\/[a-zA-Z0-9._/-]+)?$/;
const nat = (v) => Number.isSafeInteger(v) && v >= 0;
const bps = (v) => nat(v) && v <= 10_000;

export class ArtCommerceError extends Error {
  constructor(code, message) { super(message); this.name = 'ArtCommerceError'; this.code = code; }
}
const fail = (code, message) => { throw new ArtCommerceError(code, message); };

export function saleReadiness(config, artwork) {
  const reasons = [];
  const record = Object.hasOwn(config?.assets ?? {}, artwork?.id ?? '') ? config.assets[artwork.id] : null;
  if (config?.status !== 'reviewed' || config?.unsignedPreparationEnabled !== true || !config?.releaseApproval) reasons.push('Release is in preview.');
  if (config?.approvedNetwork !== 'tezos-mainnet') reasons.push('Tezos network choice is pending.');
  if (!address.test(config?.seller ?? '') || !address.test(config?.creator ?? '')) reasons.push('Seller and creator authorization are pending.');
  if (!nat(config?.editionCap) || config.editionCap < 1 || config?.editionPolicy !== 'fixed-issued-supply-reviewed') reasons.push('Edition limit and issuance policy are pending.');
  if (!bps(config?.royaltyBps) || !address.test(config?.royaltyReceiver ?? '')) reasons.push('Royalty terms are pending.');
  if (!['ipfs-pinned'].includes(config?.storagePolicy)) reasons.push('Immutable artwork storage is pending.');
  if (!contractAddress.test(config?.collectionContract ?? '') || !digest.test(config?.collectionCodeSha256 ?? '')) reasons.push('Reviewed collection contract is pending.');
  if (config?.marketplace !== TEZOS_MAINNET.marketplace || !bps(config?.platformFeeBps) || !address.test(config?.platformFeeReceiver ?? '') || config.platformFeeBps + config.royaltyBps > 10_000) reasons.push('Marketplace terms require review.');
  if (config?.priceMutez !== ART_PRICE_MUTEZ || artwork?.commerce?.priceMutez !== ART_PRICE_MUTEZ) reasons.push('The artwork price must be exactly 1 tez.');
  if (artwork?.source?.rightsStatus !== 'verified' || !record?.rightsApproval) reasons.push('Artwork rights have not been verified.');
  if (!record || !nat(record.tokenId) || !nat(record.askId) || !digest.test(record.artifactSha256 ?? '') || !immutableUri.test(record.artifactUri ?? '') || !record.metadataApproval || !immutableUri.test(record.metadataUri ?? '') || !digest.test(record.metadataSha256 ?? '')) reasons.push('Verified token, listing, pinned metadata and artwork binding are pending.');
  if (!/^\/images\/[a-zA-Z0-9/_-]+\.(?:png|webp|jpg|jpeg)$/.test(artwork?.v2?.asset ?? '') || record?.asset !== artwork?.v2?.asset) reasons.push('The generated artwork asset is not verified.');
  if (record && (artwork?.commerce?.network !== 'tezos-mainnet' || artwork?.commerce?.contract !== config.collectionContract || artwork?.commerce?.tokenId !== record.tokenId)) reasons.push('Gallery token identity does not match the reviewed collection.');
  return { ready: reasons.length === 0, reasons, record };
}

function walletGuard(wallet, buyer) {
  if (!wallet?.address || !address.test(wallet.address)) fail('disconnected', 'Connect your Tezos wallet through PointCast before preparing a purchase.');
  if (wallet.network !== 'mainnet') fail('wrong-chain', 'Select Tezos mainnet in your wallet.');
  if (buyer && wallet.address !== buyer) fail('wallet-changed', 'The wallet changed. Prepare a new purchase for the active account.');
}

export function validatePurchaseProof(config, artwork, buyer, proof, now = Date.now()) {
  const readiness = saleReadiness(config, artwork);
  if (!readiness.ready) fail('unavailable', readiness.reasons.join(' '));
  const { record } = readiness;
  if (buyer === config.seller) fail('self-purchase', 'The seller cannot purchase their own listing.');
  if (proof?.chainId !== TEZOS_MAINNET.chainId) fail('wrong-chain', 'The public node is not Tezos mainnet.');
  if (!Number.isFinite(proof?.checkedAt) || now - proof.checkedAt < 0 || now - proof.checkedAt > 30_000 || !nat(proof?.level) || !nat(proof?.indexerLevel) || Math.abs(proof.level - proof.indexerLevel) > 2) fail('stale-proof', 'Chain verification is stale or the indexer is behind. Try again.');
  if (proof?.paused !== false) fail('paused', 'The marketplace is paused or could not be verified.');
  if (proof.platformFeeBps !== config.platformFeeBps || proof.platformFeeReceiver !== config.platformFeeReceiver || proof.royaltyReceiver !== config.royaltyReceiver) fail('terms-changed', 'Marketplace fee terms changed. A release review is required.');
  const ask = proof?.ask;
  if (proof.askActive !== true || ask?.seller !== config.seller || ask?.fa2_contract !== config.collectionContract || String(ask?.token_id) !== String(record.tokenId) || String(ask?.amount_mutez) !== String(ART_PRICE_MUTEZ) || Number(ask?.royalty_bps) !== config.royaltyBps) fail('listing-changed', 'The listing is missing or no longer matches this artwork and its approved 1 tez terms.');
  if (!nat(proof.totalSupply) || proof.totalSupply < 1 || proof.totalSupply > config.editionCap || !nat(proof.sellerBalance) || proof.sellerBalance < 1 || proof.operatorApproved !== true) fail('inventory-unverified', 'Minted supply, seller ownership or marketplace permission could not be verified.');
  if (proof.collectionCodeSha256 !== config.collectionCodeSha256) fail('contract-mismatch', 'Collection code does not match the reviewed contract.');
  if (proof.artifactUri !== record.artifactUri || proof.artifactSha256 !== record.artifactSha256) fail('artwork-mismatch', 'The token metadata and gallery artwork do not match the reviewed artwork.');
  if (proof.metadataUri !== record.metadataUri || proof.metadataSha256 !== record.metadataSha256 || proof.onchainArtifactSha256 !== record.artifactSha256) fail('metadata-mismatch', 'On-chain metadata pointer and declared artwork/metadata hashes do not match the reviewed pinned files.');
  return record;
}

/** This JSON is a review handoff, not a signed/forged transaction or a receipt. */
export async function prepareUnsignedPurchase(config, artwork, adapter, now = () => Date.now()) {
  const readiness = saleReadiness(config, artwork);
  if (!readiness.ready) fail('unavailable', readiness.reasons.join(' '));
  const wallet = await adapter.getWallet(); walletGuard(wallet);
  const proof = await adapter.readProof(config, artwork, readiness.record);
  const record = validatePurchaseProof(config, artwork, wallet.address, proof, now());
  walletGuard(await adapter.getWallet(), wallet.address);
  return Object.freeze({
    schema: 'pointcast.art-purchase-review/v1', status: 'unsigned',
    artworkId: artwork.id, network: 'tezos-mainnet', chainId: TEZOS_MAINNET.chainId,
    buyer: wallet.address, seller: config.seller, fa2Contract: config.collectionContract,
    tokenId: record.tokenId, askId: record.askId, artifactSha256: record.artifactSha256,
    payoutTerms: { platformFeeBps: config.platformFeeBps, platformFeeReceiver: config.platformFeeReceiver, royaltyBps: config.royaltyBps, royaltyReceiver: config.royaltyReceiver },
    transaction: { kind: 'transaction', destination: config.marketplace, amount: String(ART_PRICE_MUTEZ), parameters: { entrypoint: 'fulfill_ask', value: { int: String(record.askId) } } },
    priceMutez: ART_PRICE_MUTEZ, networkFeesMutez: null, totalMutez: null,
    feeDisclosure: 'Artwork price is 1 tez. Network fees are additional and unknown. Review the estimate in your signing wallet.',
    verifiedAtLevel: proof.level, expiresAt: new Date(now() + 60_000).toISOString(),
    handoff: 'Recheck the listing, fee receivers and active wallet immediately before signing. Marketplace payout terms are admin-mutable and cannot be pinned by fulfill_ask. Sign and submit manually in your wallet. No operation has been sent by PointCast Art V2.',
  });
}

/** Keeps repeated clicks and a mid-read wallet change from producing two plans. */
export function createPurchaseController(config, adapter) {
  let pending = null; let generation = 0;
  return {
    prepare(artwork) {
      if (pending) return pending;
      const started = generation;
      const request = prepareUnsignedPurchase(config, artwork, adapter).then((plan) => {
        if (started !== generation) fail('wallet-changed', 'Wallet disconnected or changed. Prepare a new purchase.');
        return plan;
      }).finally(() => { if (pending === request) pending = null; });
      pending = request; return request;
    },
    invalidate() { generation += 1; },
  };
}

/** Verify data read from the fixed mainnet indexer; a hash alone is not proof. */
export function verifyPurchaseReceipt(plan, proof) {
  const pending = (reason) => ({ status: 'unverified', reason });
  if (plan?.schema !== 'pointcast.art-purchase-review/v1' || plan?.status !== 'unsigned' || plan?.chainId !== TEZOS_MAINNET.chainId || plan?.network !== 'tezos-mainnet' || plan?.transaction?.kind !== 'transaction' || plan?.transaction?.destination !== TEZOS_MAINNET.marketplace || plan?.priceMutez !== ART_PRICE_MUTEZ || !address.test(plan?.buyer ?? '') || !address.test(plan?.seller ?? '') || !contractAddress.test(plan?.fa2Contract ?? '') || !nat(plan?.askId) || !nat(plan?.tokenId) || plan?.transaction?.amount !== String(ART_PRICE_MUTEZ) || plan?.transaction?.parameters?.entrypoint !== 'fulfill_ask' || plan?.transaction?.parameters?.value?.int !== String(plan.askId)) return pending('Unknown purchase plan.');
  if (proof?.chainId !== plan.chainId || !/^o[1-9A-HJ-NP-Za-km-z]{50}$/.test(proof?.hash ?? '')) return pending('Mainnet operation identity could not be verified.');
  const group = proof.operations;
  if (!Array.isArray(group) || group.some((op) => op?.status !== 'applied' || op?.hash !== proof.hash || !['transaction', 'reveal'].includes(op?.type) || (op.type === 'reveal' && (op.sender?.address !== plan.buyer || Number.isInteger(op.nonce))))) return pending('The complete applied operation group is missing or contains an unexpected operation.');
  const external = group.filter((op) => op.type === 'transaction' && !Number.isInteger(op.nonce));
  if (external.length !== 1) return pending('Unexpected additional external transaction.');
  const tx = external[0];
  const reveals = group.filter(op => op.type === 'reveal');
  if (reveals.length > 1 || reveals.some(op => op.level !== tx.level || op.block !== tx.block)) return pending('Unexpected reveal operation.');
  if (tx?.hash !== proof.hash || tx?.status !== 'applied' || tx?.sender?.address !== plan.buyer || tx?.target?.address !== plan.transaction.destination || String(tx?.amount) !== String(ART_PRICE_MUTEZ) || tx?.parameter?.entrypoint !== 'fulfill_ask' || String(tx?.parameter?.value) !== String(plan.askId)) return pending('Purchase operation does not match the reviewed buyer, price and listing.');
  if (!nat(tx.id) || !nat(tx.counter) || !nat(tx.level) || !nat(proof.headLevel) || proof.headLevel - tx.level < 2 || !blockHash.test(tx.block ?? '') || proof.canonicalInclusionHash !== tx.block || !blockHash.test(proof.headHashBefore ?? '') || proof.balanceAtLevel !== proof.headLevel || proof.headHashBefore !== proof.headHashAfter) return pending('Canonical inclusion, two successor blocks and consistent balance reads are required.');
  const transfers = group.filter((op) => op.type === 'transaction' && Number.isInteger(op.nonce));
  if (transfers.some((t) => !nat(t.id) || !nat(t.nonce)) || new Set(transfers.map(t => t.nonce)).size !== transfers.length || transfers.some((t) => t.nonce >= transfers.length)) return pending('Internal operation order is incomplete.');
  if (transfers.some((t) => t.hash !== tx.hash || t.counter !== tx.counter || t.level !== tx.level || t.block !== tx.block || t.initiator?.address !== plan.buyer || t.sender?.address !== plan.transaction.destination)) return pending('Internal operations do not belong to this purchase.');
  const nftCalls = transfers.filter((t) => t.target?.address === plan.fa2Contract && String(t.amount) === '0' && t.parameter?.entrypoint === 'transfer');
  if (transfers.length !== nftCalls.length + transfers.filter((t) => Number(t.amount) > 0).length) return pending('Unexpected additional internal call.');
  const batches = nftCalls[0]?.parameter?.value; const batch = batches?.[0]; const item = batch?.txs?.[0];
  const match = nftCalls.length === 1 && Array.isArray(batches) && batches.length === 1 && batch?.from_ === plan.seller && Array.isArray(batch?.txs) && batch.txs.length === 1 && item?.to_ === plan.buyer && String(item?.token_id) === String(plan.tokenId) && String(item?.amount) === '1';
  if (!match || !nat(proof.buyerBalance) || proof.buyerBalance < 1 || proof.askActive !== false) return pending('The exact NFT transfer, buyer balance and consumed listing are not verified.');
  const terms = plan.payoutTerms;
  if (!bps(terms?.platformFeeBps) || !bps(terms?.royaltyBps) || !address.test(terms?.platformFeeReceiver ?? '') || !address.test(terms?.royaltyReceiver ?? '') || terms.platformFeeBps + terms.royaltyBps > 10_000) return pending('Approved payout terms are missing.');
  const platform = Math.floor(ART_PRICE_MUTEZ * terms.platformFeeBps / 10_000);
  const royalty = Math.floor(ART_PRICE_MUTEZ * terms.royaltyBps / 10_000);
  const expected = new Map();
  for (const [receiver, amount] of [[plan.seller, ART_PRICE_MUTEZ - platform - royalty], [terms.platformFeeReceiver, platform], [terms.royaltyReceiver, royalty]]) if (amount > 0) expected.set(receiver, (expected.get(receiver) ?? 0) + amount);
  const actual = new Map();
  for (const t of transfers.filter((op) => Number(op.amount) > 0)) {
    if (!nat(Number(t.amount)) || t.parameter?.entrypoint) return pending('Unexpected payout operation.');
    actual.set(t.target?.address, (actual.get(t.target?.address) ?? 0) + Number(t.amount));
  }
  if (actual.size !== expected.size || [...expected].some(([receiver, amount]) => actual.get(receiver) !== amount)) return pending('Actual payouts do not match the approved seller and fee terms.');
  return { status: 'verified', hash: proof.hash, network: 'tezos-mainnet', tokenId: plan.tokenId, fa2Contract: plan.fa2Contract, confirmations: proof.headLevel - tx.level + 1 };
}
