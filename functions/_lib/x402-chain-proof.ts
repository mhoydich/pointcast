import { X402_CHAIN_ID, X402_DEFAULT_ASSET, X402_DEFAULT_PAY_TO } from '../../src/lib/x402.ts';

const RPC = 'https://node.mainnet.etherlink.com';
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const HASH = /^0x[0-9a-f]{64}$/i;
const addressTopic = (address: string) => '0x' + address.slice(2).toLowerCase().padStart(64, '0');

/** Independent RPC observation of the exact USDC transfer; not rollup finality.
 * Fixed read-only RPC, no caller URL, wallet operation or payment retry.
 * https://docs.etherlink.com/evm/tools/node-providers/
 * https://docs.etherlink.com/network/architecture/#transaction-finality
 */
export async function observePurchaseTransfer(tx: string, payer: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!HASH.test(tx) || !/^0x[0-9a-f]{40}$/i.test(payer)) return false;
  async function rpc(method: string, params: unknown[]) {
    const response = await fetcher(RPC, { method: 'POST', redirect: 'error',
      headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    if (!response.ok) throw new Error('rpc-unavailable');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('rpc-empty');
    let size = 0, text = ''; const decoder = new TextDecoder();
    while (true) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.length;
      if (size > 131_072) { await reader.cancel(); throw new Error('rpc-too-large'); }
      text += decoder.decode(part.value, { stream: true });
    }
    const data = JSON.parse(text + decoder.decode());
    if (data?.jsonrpc !== '2.0' || data.id !== 1 || data.error) throw new Error('rpc-error');
    return data.result;
  }
  try {
    const [chain, receipt] = await Promise.all([rpc('eth_chainId', []), rpc('eth_getTransactionReceipt', [tx])]);
    if (typeof chain !== 'string' || !/^0x[0-9a-f]+$/i.test(chain) || BigInt(chain) !== BigInt(X402_CHAIN_ID)
      || receipt?.status !== '0x1' || receipt.transactionHash?.toLowerCase() !== tx.toLowerCase()
      || !HASH.test(receipt.blockHash) || !/^0x[0-9a-f]+$/i.test(receipt.blockNumber)
      || !Array.isArray(receipt.logs)) return false;
    return receipt.logs.some((log: Record<string, any>) => log.removed !== true
      && log.transactionHash?.toLowerCase() === tx.toLowerCase()
      && log.blockHash?.toLowerCase() === receipt.blockHash.toLowerCase()
      && log.address?.toLowerCase() === X402_DEFAULT_ASSET.toLowerCase()
      && Array.isArray(log.topics) && log.topics.length === 3
      && log.topics[0]?.toLowerCase() === TRANSFER
      && log.topics[1]?.toLowerCase() === addressTopic(payer)
      && log.topics[2]?.toLowerCase() === addressTopic(X402_DEFAULT_PAY_TO)
      && typeof log.data === 'string' && HASH.test(log.data) && BigInt(log.data) === 10000n);
  } catch { return false; }
}
