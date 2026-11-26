import { encodeOpHash, stringToBytes } from '@taquito/utils';
import type { TransferParams } from '@taquito/taquito';
import { agentWalletSigner, type AgentWalletEnv, type AgentWalletKeyRow } from './agent-wallets';

const MAINNET_CHAIN_ID = 'NetXdQprcVkpaWU';
export const TZKT = 'https://api.tzkt.io/v1';

export type WalletSigningEnv = AgentWalletEnv & {
  AGENT_WALLETS_RPC_URL?: string;
  AGENT_WALLETS_MINT_CONTRACT?: string;
};

export type WalletAction =
  | { kind: 'send'; to: string; amountMutez: number }
  | { kind: 'mint'; contract: string; recipient: string; tokenId: number; quantity: number; metadataUri: string };

export type PendingWalletOp = { op_hash: string; last_counter: number; expires_level: number };
export type SignedWalletOp = {
  hash: string; bytes: string; maxCostMutez: number; lastCounter: number; expiresLevel: number;
};

export interface WalletChain {
  prepare(wallet: AgentWalletKeyRow, action: WalletAction, budgetMutez: number, previous: PendingWalletOp | null): Promise<SignedWalletOp>;
  broadcast(operation: SignedWalletOp): Promise<void>;
}

export class WalletError extends Error {
  constructor(readonly code: string, readonly status: number, readonly operationHash?: string) {
    super(code);
  }
}

export async function createWalletChain(env: WalletSigningEnv): Promise<WalletChain> {
  const [{ TezosToolkit, MichelsonMap }, { LocalForger }] = await Promise.all([
    import('@taquito/taquito'),
    import('@taquito/local-forging'),
  ]);
  const rpcUrl = env.AGENT_WALLETS_RPC_URL ?? 'https://mainnet.smartpy.io';
  const tezos = new TezosToolkit(rpcUrl);
  const rpc = tezos.rpc;
  const forger = new LocalForger();
  if (await rpc.getChainId() !== MAINNET_CHAIN_ID) throw new WalletError('wrong-tezos-network', 503);

  return {
    async prepare(wallet, action, budgetMutez, previous) {
      let minimumCounter = 0;
      if (previous) {
        // A lease serializes requests. This check also covers counters of operations still in the mempool.
        const header = await rpc.getBlockHeader({ block: 'head~2' });
        if (header.level <= previous.expires_level) {
          const checkpoint = await rpc.getContract(wallet.address, { block: header.hash });
          const counter = Number(checkpoint.counter);
          if (!Number.isSafeInteger(counter) || counter < previous.last_counter) {
            throw new WalletError('wallet-operation-pending', 409, previous.op_hash);
          }
          minimumCounter = previous.last_counter;
        }
      }

      const signer = await agentWalletSigner(env, wallet);
      tezos.setProvider({ signer, forger });
      let params: TransferParams;
      if (action.kind === 'send') {
        params = { to: action.to, amount: action.amountMutez, mutez: true };
      } else {
        const contract = await tezos.contract.at(action.contract);
        if (typeof contract.methodsObject.mint !== 'function') throw new WalletError('fa2-mint-unavailable', 503);
        // TZIP-12 stores the URI under the empty token-info key. The URI points to a TZIP-21 document.
        params = contract.methodsObject.mint({
          to_: action.recipient,
          token_id: action.tokenId,
          amount: action.quantity,
          token_info: MichelsonMap.fromLiteral({ '': stringToBytes(action.metadataUri) }),
        }).toTransferParams({ amount: 0, mutez: true });
      }

      const estimate = await tezos.estimate.transfer(params);
      const prepared = await tezos.prepare.transaction({
        ...params,
        fee: Math.ceil(estimate.suggestedFeeMutez),
        storageLimit: Math.ceil(estimate.storageLimit),
        gasLimit: Math.ceil(estimate.gasLimit),
      });
      const [first, second] = prepared.opOb.contents;
      const transaction = second ?? first;
      const reveal = second ? first : null;
      if (prepared.opOb.contents.length > 2 || prepared.counter < minimumCounter
        || (reveal && (reveal.kind !== 'reveal' || reveal.source !== wallet.address
          || reveal.public_key !== await signer.publicKey()))
        || transaction?.kind !== 'transaction' || transaction.source !== wallet.address
        || transaction.destination !== params.to || transaction.amount !== String(params.amount)
        || JSON.stringify(transaction.parameters) !== JSON.stringify(params.parameter)) {
        throw new WalletError('unexpected-wallet-operation', 503);
      }
      const [constants, branch] = await Promise.all([
        rpc.getConstants(),
        rpc.getBlockHeader({ block: prepared.opOb.branch }),
      ]);
      const storagePrice = Number(constants.cost_per_byte);
      const ttl = constants.max_operations_time_to_live;
      if (!Number.isSafeInteger(storagePrice) || storagePrice <= 0 || !ttl || !Number.isSafeInteger(ttl)
        || ttl < 1 || !Number.isSafeInteger(branch.level)) {
        throw new WalletError('tezos-operation-limits-unavailable', 503);
      }
      const maxCostMutez = Number(transaction.amount) + Number(transaction.fee) + (Number(transaction.storage_limit) * storagePrice)
        + (reveal ? Number(reveal.fee) + (Number(reveal.storage_limit) * storagePrice) : 0);
      const lastCounter = Number(transaction.counter);
      if (!Number.isSafeInteger(maxCostMutez) || maxCostMutez <= 0 || !Number.isSafeInteger(lastCounter) || lastCounter <= 0) {
        throw new WalletError('invalid-wallet-operation-cost', 503);
      }
      if (maxCostMutez > budgetMutez) throw new WalletError('daily-spend-cap', 429);
      if ((await tezos.tz.getBalance(wallet.address)).lt(maxCostMutez)) throw new WalletError('wallet-balance-low', 409);

      const forged = await forger.forge(tezos.prepare.toForge(prepared));
      const signed = await signer.sign(forged, new Uint8Array([3]));
      return { hash: encodeOpHash(signed.sbytes), bytes: signed.sbytes, maxCostMutez, lastCounter, expiresLevel: branch.level + ttl };
    },

    async broadcast({ bytes, hash }) {
      const response = await fetch(`${rpcUrl.replace(/\/$/u, '')}/injection/operation?chain=main`, {
        method: 'POST',
        redirect: 'manual',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(bytes),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok || await response.json() !== hash) throw new Error('wallet-broadcast-uncertain');
    },
  };
}
