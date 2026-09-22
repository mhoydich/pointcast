import { bytesToString, encodeOpHash } from '@taquito/utils';
import {
  CABINET_CHAIN_ID,
  CabinetError,
  sha256,
  type AgentCabinetEnv,
  type CabinetConfig,
  type CabinetIntentRow,
} from './_shared';

export interface SignedCabinetTransfer { bytes: string; hash: string; maximumCostMutez: number }
export interface CabinetChain {
  ready(reserved: Record<string, number>): Promise<void>;
  preflight(intent: CabinetIntentRow, budgetMutez: number): Promise<number>;
  prepare(intent: CabinetIntentRow, budgetMutez: number): Promise<SignedCabinetTransfer>;
  broadcast(bytes: string): Promise<string>;
  status(intent: CabinetIntentRow): Promise<'pending' | 'confirmed' | 'failed'>;
}
export type CabinetChainFactory = (env: AgentCabinetEnv, config: CabinetConfig) => Promise<CabinetChain>;

async function limitedText(response: Response, limit: number): Promise<string> {
  if (Number(response.headers.get('content-length') || 0) > limit) throw new Error('chain-response-too-large');
  if (!response.body) throw new Error('empty-chain-response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error('chain-response-too-large');
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error('chain-read-unavailable');
  return JSON.parse(await limitedText(response, 1_000_000));
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-chain-response');
  return value as Record<string, unknown>;
}

function address(value: unknown): string {
  return String(object(value).address || '');
}

async function inspectToken(config: CabinetConfig, item: CabinetConfig['items'][number]) {
  const values = await readJson(`https://api.tzkt.io/v1/tokens?contract=${config.contract}&tokenId=${item.tokenId}&limit=1`);
  if (!Array.isArray(values) || values.length !== 1) throw new CabinetError('inventory-not-found', 503);
  const token = object(values[0]);
  if (token.standard !== 'fa2' || String(token.totalSupply) !== String(item.supplyCap)) {
    throw new CabinetError('edition-supply-mismatch', 503);
  }
  const response = await fetch(item.metadataUri, { redirect: 'error', signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new CabinetError('metadata-unavailable', 503);
  const text = await limitedText(response, 100_000);
  if (await sha256(text) !== item.metadataSha256) throw new CabinetError('metadata-hash-mismatch', 503);
  const artifactResponse = await fetch(item.artifactUri, { redirect: 'error', signal: AbortSignal.timeout(12_000) });
  if (!artifactResponse.ok) throw new CabinetError('artifact-unavailable', 503);
  const artifact = await limitedText(artifactResponse, 1_000_000);
  if (await sha256(artifact) !== item.artifactSha256) throw new CabinetError('artifact-hash-mismatch', 503);
  const metadata = object(JSON.parse(text));
  const indexed = object(token.metadata);
  if (metadata.artifactUri !== item.artifactUri || indexed.artifactUri !== item.artifactUri
    || indexed.name !== metadata.name || JSON.stringify(indexed.creators) !== JSON.stringify(metadata.creators)) {
    throw new CabinetError('token-metadata-mismatch', 503);
  }
  return token;
}

/** Derive and compare only; this guard never calls signer.sign(). */
export async function assertCabinetSponsorKey(env: AgentCabinetEnv, config: CabinetConfig): Promise<void> {
  try {
    const { InMemorySigner } = await import('@taquito/signer');
    const signer = await InMemorySigner.fromSecretKey(env.AGENT_CABINET_SPONSOR_SECRET_KEY!);
    if (await signer.publicKeyHash() !== config.sponsor) throw new CabinetError('sponsor-address-mismatch', 503);
  } catch (error) {
    if (error instanceof CabinetError) throw error;
    throw new CabinetError('sponsor-secret-invalid', 503);
  }
}

/** Receipt reconciliation depends only on terms already pinned in the row. */
export async function cabinetIntentStatus(intent: CabinetIntentRow): Promise<'pending' | 'confirmed' | 'failed'> {
  if (!intent.operation_hash) return 'pending';
  const data = await readJson(`https://api.tzkt.io/v1/operations/transactions/${intent.operation_hash}`);
  if (!Array.isArray(data) || !data.length) return 'pending';
  const matching = data.map(object).filter((operation) => operation.hash === intent.operation_hash
    && address(operation.sender) === intent.sponsor && address(operation.target) === intent.contract);
  if (matching.length !== 1) return 'pending';
  const operation = matching[0];
  const head = object(await readJson('https://api.tzkt.io/v1/head'));
  const headLevel = Number(head.level);
  const operationLevel = Number(operation.level);
  const operationId = Number(operation.id);
  if (typeof head.level !== 'number' || typeof operation.level !== 'number' || typeof operation.id !== 'number'
    || !Number.isSafeInteger(headLevel) || !Number.isSafeInteger(operationLevel) || !Number.isSafeInteger(operationId)
    || operationId <= 0 || operationLevel < 0 || headLevel - operationLevel < 2) return 'pending';
  if (operation.status === 'failed' || operation.status === 'backtracked' || operation.status === 'skipped') return 'failed';
  if (operation.status !== 'applied' || String(operation.amount) !== '0') return 'pending';
  const parameter = object(operation.parameter);
  if (parameter.entrypoint !== 'transfer' || !Array.isArray(parameter.value) || parameter.value.length !== 1) return 'pending';
  const transfer = object(parameter.value[0]);
  if (transfer.from_ !== intent.sponsor || !Array.isArray(transfer.txs) || transfer.txs.length !== 1) return 'pending';
  const tx = object(transfer.txs[0]);
  if (tx.to_ !== intent.recipient || String(tx.token_id) !== intent.token_id || String(tx.amount) !== '1') return 'pending';
  const movements = await readJson(`https://api.tzkt.io/v1/tokens/transfers?transactionId=${operation.id}&token.contract=${intent.contract}&token.tokenId=${intent.token_id}&limit=10`);
  if (!Array.isArray(movements) || movements.length !== 1) return 'pending';
  const movement = object(movements[0]);
  return address(movement.from) === intent.sponsor && address(movement.to) === intent.recipient && String(movement.amount) === '1'
    ? 'confirmed'
    : 'pending';
}

/** The only methods which initialize a signer or inject are prepare/broadcast. */
export const createCabinetTezosChain: CabinetChainFactory = async (env, config) => ({
  async ready(reserved) {
    const chainId = await readJson(`${config.rpcUrl.replace(/\/$/u, '')}/chains/main/chain_id`);
    if (chainId !== CABINET_CHAIN_ID) throw new CabinetError('wrong-tezos-network', 503);
    const maps = await readJson(`https://api.tzkt.io/v1/contracts/${config.contract}/bigmaps`);
    if (!Array.isArray(maps)) throw new CabinetError('token-metadata-map-missing', 503);
    const matching = maps.map(object).filter((map) => /(^|\.)token_metadata$/u.test(String(map.path)));
    if (matching.length !== 1) throw new CabinetError('token-metadata-map-missing', 503);
    for (const item of config.items) {
      await inspectToken(config, item);
      const entry = object(await readJson(`https://api.tzkt.io/v1/bigmaps/${matching[0].ptr}/keys/${item.tokenId}`));
      if (entry.active === false) throw new CabinetError('token-metadata-missing', 503);
      const tokenInfo = object(object(entry.value).token_info);
      const uri = typeof tokenInfo[''] === 'string' ? bytesToString(tokenInfo['']) : '';
      if (uri !== item.metadataUri) throw new CabinetError('token-metadata-uri-mismatch', 503);
      const balances = await readJson(`https://api.tzkt.io/v1/tokens/balances?account=${config.sponsor}&token.contract=${config.contract}&token.tokenId=${item.tokenId}&limit=1`);
      const held = Array.isArray(balances) && balances.length === 1 ? BigInt(String(object(balances[0]).balance)) : 0n;
      if (held < BigInt(Math.max(0, item.supplyCap - Number(reserved[item.slug] || 0)))) {
        throw new CabinetError('sponsor-inventory-incomplete', 503);
      }
    }
  },

  async preflight(intent, budgetMutez) {
    const item = config.items.find((candidate) => candidate.slug === intent.offer_slug);
    if (!item || item.tokenId !== intent.token_id || item.revision !== intent.offer_revision
      || intent.contract !== config.contract || intent.sponsor !== config.sponsor || intent.quantity !== 1) {
      throw new CabinetError('pinned-delivery-terms-mismatch', 503);
    }
    await assertCabinetSponsorKey(env, config);
    const { TezosToolkit } = await import('@taquito/taquito');
    const tezos = new TezosToolkit(config.rpcUrl);
    if (await tezos.rpc.getChainId() !== CABINET_CHAIN_ID) throw new CabinetError('wrong-tezos-network', 503);
    const managerKey = await tezos.rpc.getManagerKey(config.sponsor);
    if (typeof managerKey !== 'string') throw new CabinetError('sponsor-reveal-required', 503);
    tezos.setSignerProvider({
      publicKeyHash: async () => config.sponsor,
      publicKey: async () => managerKey,
      secretKey: async () => { throw new CabinetError('read-only-preflight', 503); },
      sign: async () => { throw new CabinetError('read-only-preflight', 503); },
    });
    await inspectToken(config, item);
    const holdings = await readJson(`https://api.tzkt.io/v1/tokens/balances?account=${config.sponsor}&token.contract=${intent.contract}&token.tokenId=${intent.token_id}&limit=1`);
    if (!Array.isArray(holdings) || holdings.length !== 1 || BigInt(String(object(holdings[0]).balance)) < 1n) {
      throw new CabinetError('sponsor-inventory-empty', 503);
    }
    const contract = await tezos.contract.at(intent.contract);
    if (typeof contract.methodsObject.transfer !== 'function') throw new CabinetError('fa2-transfer-unavailable', 503);
    const params = contract.methodsObject.transfer([{
      from_: config.sponsor,
      txs: [{ to_: intent.recipient, token_id: intent.token_id, amount: 1 }],
    }]).toTransferParams({ amount: 0, mutez: true });
    const estimate = await tezos.estimate.transfer(params);
    const constants = await tezos.rpc.getConstants();
    const maximumCostMutez = Math.ceil(estimate.suggestedFeeMutez)
      + Math.ceil(estimate.storageLimit) * Number(constants.cost_per_byte);
    if (!Number.isSafeInteger(maximumCostMutez) || maximumCostMutez <= 0
      || maximumCostMutez > Math.min(config.maxOperationMutez, budgetMutez)) {
      throw new CabinetError('sponsor-budget-limit', 503);
    }
    if ((await tezos.tz.getBalance(config.sponsor)).lt(maximumCostMutez)) throw new CabinetError('sponsor-balance-low', 503);
    return maximumCostMutez;
  },

  async prepare(intent, budgetMutez) {
    const item = config.items.find((candidate) => candidate.slug === intent.offer_slug);
    if (!item || item.tokenId !== intent.token_id || item.revision !== intent.offer_revision
      || intent.contract !== config.contract || intent.sponsor !== config.sponsor || intent.quantity !== 1) {
      throw new CabinetError('pinned-delivery-terms-mismatch', 503);
    }
    const [{ TezosToolkit }, { InMemorySigner }, { LocalForger }] = await Promise.all([
      import('@taquito/taquito'),
      import('@taquito/signer'),
      import('@taquito/local-forging'),
    ]);
    const tezos = new TezosToolkit(config.rpcUrl);
    if (await tezos.rpc.getChainId() !== CABINET_CHAIN_ID) throw new CabinetError('wrong-tezos-network', 503);
    const signer = await InMemorySigner.fromSecretKey(env.AGENT_CABINET_SPONSOR_SECRET_KEY!);
    if (await signer.publicKeyHash() !== config.sponsor) throw new CabinetError('sponsor-address-mismatch', 503);
    tezos.setProvider({ signer });
    if (!await tezos.rpc.getManagerKey(config.sponsor)) throw new CabinetError('sponsor-reveal-required', 503);
    await inspectToken(config, item);
    const holdings = await readJson(`https://api.tzkt.io/v1/tokens/balances?account=${config.sponsor}&token.contract=${intent.contract}&token.tokenId=${intent.token_id}&limit=1`);
    if (!Array.isArray(holdings) || holdings.length !== 1 || BigInt(String(object(holdings[0]).balance)) < 1n) {
      throw new CabinetError('sponsor-inventory-empty', 503);
    }
    const contract = await tezos.contract.at(intent.contract);
    const params = contract.methodsObject.transfer([{
      from_: config.sponsor,
      txs: [{ to_: intent.recipient, token_id: intent.token_id, amount: 1 }],
    }]).toTransferParams({ amount: 0, mutez: true });
    const estimate = await tezos.estimate.transfer(params);
    const constants = await tezos.rpc.getConstants();
    const fee = Math.ceil(estimate.suggestedFeeMutez);
    const storageLimit = Math.ceil(estimate.storageLimit);
    const maximumCostMutez = fee + storageLimit * Number(constants.cost_per_byte);
    if (!Number.isSafeInteger(maximumCostMutez) || maximumCostMutez <= 0
      || maximumCostMutez > Math.min(config.maxOperationMutez, budgetMutez)) {
      throw new CabinetError('sponsor-budget-limit', 503);
    }
    if ((await tezos.tz.getBalance(config.sponsor)).lt(maximumCostMutez)) throw new CabinetError('sponsor-balance-low', 503);
    const prepared = await tezos.prepare.transaction({ ...params, fee, storageLimit, gasLimit: Math.ceil(estimate.gasLimit) });
    if (prepared.opOb.contents.length !== 1) throw new CabinetError('unexpected-operation-batch', 503);
    const operation = object(prepared.opOb.contents[0]);
    if (operation.kind !== 'transaction' || operation.source !== config.sponsor || operation.destination !== intent.contract
      || operation.amount !== '0' || Number(operation.fee) !== fee || Number(operation.storage_limit) !== storageLimit
      || JSON.stringify(operation.parameters) !== JSON.stringify(params.parameter)) {
      throw new CabinetError('unexpected-operation-terms', 503);
    }
    const forged = await new LocalForger().forge(tezos.prepare.toForge(prepared));
    const signed = await signer.sign(forged, new Uint8Array([3]));
    return { bytes: signed.sbytes, hash: encodeOpHash(signed.sbytes), maximumCostMutez };
  },

  async broadcast(bytes) {
    const expected = encodeOpHash(bytes);
    const response = await fetch(`${config.rpcUrl.replace(/\/$/u, '')}/injection/operation?chain=main`, {
      method: 'POST',
      redirect: 'error',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(bytes),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error('broadcast-uncertain');
    const hash: unknown = JSON.parse(await limitedText(response, 2_000));
    if (hash !== expected) throw new Error('broadcast-hash-mismatch');
    return expected;
  },

  status: cabinetIntentStatus,
});
