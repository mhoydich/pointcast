import { bytesToString, encodeOpHash } from '@taquito/utils';
import { CHAIN_ID, ClaimError, sha256, type ClaimRow, type Config, type OtherWorldsEnv } from './_shared';

export interface SignedTransfer { bytes: string; hash: string; maximumCostMutez: number }
export interface ClaimChain {
  ready(claimed: Record<string, number>): Promise<void>;
  prepare(claim: ClaimRow, budgetMutez: number): Promise<SignedTransfer>;
  broadcast(bytes: string): Promise<string>;
  status(claim: ClaimRow): Promise<'pending'|'confirmed'|'failed'>;
}
export type ChainFactory = (env: OtherWorldsEnv, config: Config) => Promise<ClaimChain>;

/** Bounded HTTP reads: receipts never initialize a signer or broadcast an operation. */
async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error('chain-read-unavailable');
  const text = await limitedText(response, 1_000_000);
  return JSON.parse(text);
}
async function limitedText(response: Response, limit: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('empty-chain-response');
  let size = 0; const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new Error('chain-response-too-large'); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size); let position = 0;
  for (const part of parts) { bytes.set(part, position); position += part.length; }
  return new TextDecoder().decode(bytes);
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-chain-response');
  return value as Record<string, unknown>;
}
function address(value: unknown): string { return String(object(value).address || ''); }

export const createTezosChain: ChainFactory = async (env, config) => ({
  async ready(claimed) {
    const id = await readJson(`${config.rpcUrl.replace(/\/$/, '')}/chains/main/chain_id`);
    if (id !== CHAIN_ID) throw new ClaimError('wrong-tezos-network',503);
    const maps = await readJson(`https://api.tzkt.io/v1/contracts/${config.contract}/bigmaps`);
    if (!Array.isArray(maps)) throw new ClaimError('token-metadata-map-missing',503);
    const matching = maps.map(object).filter(map => /(^|\.)token_metadata$/.test(String(map.path)));
    if (matching.length !== 1) throw new ClaimError('token-metadata-map-missing',503);
    for (const item of config.items) {
      const tokenId = config.tokens[item.id];
      const values = await readJson(`https://api.tzkt.io/v1/tokens?contract=${config.contract}&tokenId=${tokenId}&limit=1`);
      if (!Array.isArray(values) || values.length !== 1) throw new ClaimError('inventory-not-found',503);
      const token = object(values[0]);
      if (token.standard !== 'fa2' || String(token.totalSupply) !== '27') throw new ClaimError('edition-supply-mismatch',503);
      const entry = object(await readJson(`https://api.tzkt.io/v1/bigmaps/${matching[0].ptr}/keys/${tokenId}`));
      if (entry.active === false) throw new ClaimError('token-metadata-missing',503);
      const info = object(object(entry.value).token_info);
      const uri = typeof info[''] === 'string' ? bytesToString(info['']) : '';
      if (uri !== item.metadataUri) throw new ClaimError('token-metadata-uri-mismatch',503);
      const response = await fetch(item.metadataUri,{signal:AbortSignal.timeout(12_000),redirect:'error'});
      if (!response.ok) throw new ClaimError('metadata-unavailable',503);
      const text = await limitedText(response,100_000);
      if (await sha256(text) !== item.metadataSha256) throw new ClaimError('metadata-hash-mismatch',503);
      const metadata = object(JSON.parse(text));
      const indexed = object(token.metadata);
      if (metadata.artifactUri !== item.artifactUri || indexed.artifactUri !== item.artifactUri || indexed.name !== metadata.name || JSON.stringify(indexed.creators) !== JSON.stringify(metadata.creators)) throw new ClaimError('token-metadata-mismatch',503);
      const balances = await readJson(`https://api.tzkt.io/v1/tokens/balances?account=${config.sponsor}&token.contract=${config.contract}&token.tokenId=${tokenId}&limit=1`);
      const held = Array.isArray(balances) && balances.length === 1 ? BigInt(String(object(balances[0]).balance)) : 0n;
      if (held < BigInt(Math.max(0,27-(claimed[item.id] || 0)))) throw new ClaimError('sponsor-inventory-incomplete',503);
    }
  },
  async prepare(claim, budgetMutez) {
    // The only signer initialization is behind both launch gates and a reserved,
    // wallet-verified claim while holding the durable sponsor counter lock.
    const [{ TezosToolkit }, { InMemorySigner }, { LocalForger }] = await Promise.all([
      import('@taquito/taquito'), import('@taquito/signer'), import('@taquito/local-forging'),
    ]);
    const tezos = new TezosToolkit(config.rpcUrl);
    if (await tezos.rpc.getChainId() !== CHAIN_ID) throw new ClaimError('wrong-tezos-network', 503);
    const signer = await InMemorySigner.fromSecretKey(env.OTHER_WORLDS_SPONSOR_SECRET_KEY!);
    if (await signer.publicKeyHash() !== config.sponsor) throw new ClaimError('sponsor-address-mismatch', 503);
    tezos.setProvider({ signer });
    // Never initiate a surprise reveal. The approved sponsor must be revealed.
    if (!await tezos.rpc.getManagerKey(config.sponsor)) throw new ClaimError('sponsor-reveal-required', 503);
    const item = config.items.find(item => item.id === claim.artwork_id)!;
    const tokens = await readJson(`https://api.tzkt.io/v1/tokens?contract=${claim.contract}&tokenId=${claim.token_id}&limit=1`);
    if (!Array.isArray(tokens) || tokens.length !== 1) throw new ClaimError('inventory-not-found', 503);
    const token = object(tokens[0]);
    if (token.standard !== 'fa2' || String(token.totalSupply) !== '27') throw new ClaimError('edition-supply-mismatch', 503);
    // Pin the exact immutable JSON bytes approved in the release, and compare
    // indexed token metadata to them. No metadata supplied by the client is used.
    const metadataResponse = await fetch(item.metadataUri, { signal: AbortSignal.timeout(12_000), redirect: 'error' });
    if (!metadataResponse.ok) throw new ClaimError('metadata-unavailable', 503);
    const metadataText = await limitedText(metadataResponse, 100_000);
    if (await sha256(metadataText) !== item.metadataSha256) throw new ClaimError('metadata-hash-mismatch', 503);
    const metadata = object(JSON.parse(metadataText));
    const indexed = object(token.metadata);
    if (metadata.artifactUri !== item.artifactUri || indexed.artifactUri !== item.artifactUri || indexed.name !== metadata.name || JSON.stringify(indexed.creators) !== JSON.stringify(metadata.creators)) throw new ClaimError('token-metadata-mismatch', 503);
    const holdings = await readJson(`https://api.tzkt.io/v1/tokens/balances?account=${config.sponsor}&token.contract=${claim.contract}&token.tokenId=${claim.token_id}&limit=1`);
    if (!Array.isArray(holdings) || holdings.length !== 1 || BigInt(String(object(holdings[0]).balance)) < 1n) throw new ClaimError('sponsor-inventory-empty', 503);
    const contract = await tezos.contract.at(claim.contract);
    const params = contract.methodsObject.transfer([{
      from_: config.sponsor, txs: [{ to_: claim.address, token_id: claim.token_id, amount: 1 }],
    }]).toTransferParams({ amount: 0, mutez: true });
    const estimate = await tezos.estimate.transfer(params);
    const constants = await tezos.rpc.getConstants();
    // Cap the encoded fee + the maximum permitted storage burn, not merely the
    // simulated consumption. Both the operation and entire drop have hard caps.
    const fee = Math.ceil(estimate.suggestedFeeMutez);
    const storageLimit = Math.ceil(estimate.storageLimit);
    const maximumCostMutez = fee + storageLimit * Number(constants.cost_per_byte);
    if (!Number.isSafeInteger(maximumCostMutez) || maximumCostMutez <= 0 || maximumCostMutez > Math.min(config.maxOperationMutez, budgetMutez)) throw new ClaimError('sponsor-budget-limit', 503);
    if ((await tezos.tz.getBalance(config.sponsor)).lt(maximumCostMutez)) throw new ClaimError('sponsor-balance-low', 503);
    const prepared = await tezos.prepare.transaction({ ...params, fee, storageLimit, gasLimit: Math.ceil(estimate.gasLimit) });
    if (prepared.opOb.contents.length !== 1) throw new ClaimError('unexpected-operation-batch', 503);
    const operation = object(prepared.opOb.contents[0]);
    if (operation.kind !== 'transaction' || operation.source !== config.sponsor || operation.destination !== claim.contract || operation.amount !== '0' || Number(operation.fee) !== fee || Number(operation.storage_limit) !== storageLimit || JSON.stringify(operation.parameters) !== JSON.stringify(params.parameter)) throw new ClaimError('unexpected-operation-terms', 503);
    // Local forging prevents an RPC from substituting bytes with different terms.
    const forged = await new LocalForger().forge(tezos.prepare.toForge(prepared));
    const signed = await signer.sign(forged, new Uint8Array([3]));
    return { bytes: signed.sbytes, hash: encodeOpHash(signed.sbytes), maximumCostMutez };
  },
  async broadcast(bytes) {
    const expected = encodeOpHash(bytes);
    const response = await fetch(`${config.rpcUrl.replace(/\/$/, '')}/injection/operation?chain=main`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(bytes), signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error('broadcast-uncertain');
    const hash: unknown = JSON.parse(await limitedText(response, 2000));
    if (hash !== expected) throw new Error('broadcast-hash-mismatch');
    return expected;
  },
  async status(claim) {
    if (!claim.operation_hash) return 'pending';
    const data = await readJson(`https://api.tzkt.io/v1/operations/transactions/${claim.operation_hash}`);
    if (!Array.isArray(data) || !data.length) return 'pending';
    const matching = data.map(object).filter(op => op.hash === claim.operation_hash && address(op.sender) === claim.sponsor && address(op.target) === claim.contract);
    if (matching.length !== 1) return 'pending';
    const operation = matching[0];
    const head = object(await readJson('https://api.tzkt.io/v1/head'));
    const headLevel=Number(head.level), operationLevel=Number(operation.level), operationId=Number(operation.id);
    if (typeof head.level !== 'number' || typeof operation.level !== 'number' || typeof operation.id !== 'number' || !Number.isSafeInteger(headLevel) || !Number.isSafeInteger(operationLevel) || !Number.isSafeInteger(operationId) || operationId<=0 || operationLevel<0 || headLevel-operationLevel<2) return 'pending';
    if (operation.status === 'failed' || operation.status === 'backtracked' || operation.status === 'skipped') return 'failed';
    if (operation.status !== 'applied' || String(operation.amount) !== '0') return 'pending';
    const parameter = object(operation.parameter);
    const transfers = parameter.value;
    if (parameter.entrypoint !== 'transfer' || !Array.isArray(transfers) || transfers.length !== 1) return 'pending';
    const transfer = object(transfers[0]); const txs = transfer.txs;
    if (transfer.from_ !== claim.sponsor || !Array.isArray(txs) || txs.length !== 1) return 'pending';
    const tx = object(txs[0]);
    if (tx.to_ !== claim.address || String(tx.token_id) !== claim.token_id || String(tx.amount) !== '1') return 'pending';
    const movements = await readJson(`https://api.tzkt.io/v1/tokens/transfers?transactionId=${operation.id}&token.contract=${claim.contract}&token.tokenId=${claim.token_id}&limit=10`);
    if (!Array.isArray(movements) || movements.length !== 1) return 'pending';
    const movement = object(movements[0]);
    return address(movement.from) === claim.sponsor && address(movement.to) === claim.address && String(movement.amount) === '1' ? 'confirmed' : 'pending';
  },
});
