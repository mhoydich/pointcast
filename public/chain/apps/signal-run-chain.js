import { pcc, isHex64, pinnedStatus, signAndSend } from './chain-kit.js';
import { eventBody } from './signal-run.js';

export const CHANNEL = 'SIGNALRUN';
// Preparing only reads a nonce; the body is not uploaded until the Sign button.
export async function prepareEvent(chain, key, event) {
  const body = eventBody(event);
  const tx = await chain.buildPublish({ sender: key.sender, channel: CHANNEL,
    title: 'Signal Run · ' + event.day, bodyHash: pcc.bodyHash(body) });
  return { tx, body, day: event.day, genesis: chain.genesisHash };
}
export async function publishEvent({ chain, net, key, plan, onSigned, wait = {}, beforeSign = () => true }) {
  if (key.sender !== plan.tx.sender || chain.genesisHash !== plan.genesis || pcc.bodyHash(plan.body) !== plan.tx.body_hash) throw new Error('The reviewed event or key changed. Review again.');
  await pinnedStatus(net, plan.genesis);
  const stored = await net.post('/body', { body: plan.body });
  if (!stored || stored.body_hash !== plan.tx.body_hash) throw new Error('The devnet did not store the reviewed event body correctly');
  if (!beforeSign()) throw new Error('The page or key changed before signing. The event body may have been uploaded, but no transaction was signed or sent.');
  return signAndSend(chain, key, plan.tx, { ...wait, onSigned });
}
// Check inclusion, body and sequencer seal. This verifies a post, never gameplay truth.
export async function checkEvent(chain, net, receipt) {
  if (!receipt || !isHex64(receipt.txHash) || !isHex64(receipt.genesis) || typeof receipt.body !== 'string') throw new Error('Invalid receipt');
  if (receipt.genesis !== chain.genesisHash) throw new Error('This receipt belongs to a different devnet genesis. It may have reset.');
  await pinnedStatus(net, receipt.genesis);
  const status = await net.get('/tx/' + receipt.txHash);
  if (!status || status.status !== 'included' || !Number.isSafeInteger(status.height) || status.height < 1) return { included: false, status: status && status.status === 'rejected' ? 'rejected' : 'unconfirmed' };
  // SDK exact JSON retains u64 integers when reconstructing the Merkle root.
  const block = await chain._req('/raw/block/' + status.height);
  if (!block || !block.header || !Array.isArray(block.txs) || block.txs.length > 1000 || Number(block.header.height) !== status.height) throw new Error('The receipt block has an unexpected shape');
  const signed = block.txs.find(t => pcc.txHash(t) === receipt.txHash);
  if (!signed || pcc.txRoot(block.txs) !== block.header.tx_root) throw new Error('The transaction is missing from the block commitment');
  const tx = signed.tx;
  if (tx.type !== 'publish_block' || tx.channel !== CHANNEL || tx.sender !== receipt.sender || tx.body_hash !== pcc.bodyHash(receipt.body)) throw new Error('The block does not contain this event receipt');
  if (!signed.public_key || signed.public_key.scheme !== 'ed25519' || pcc.tezosAddress(signed.public_key) !== receipt.sender || await pcc.verifyEd25519(signed.public_key.bytes, pcc.hexToBytes(pcc.signingHash(tx, chain.domain)), signed.signature) !== true) throw new Error('The event signature does not check for the receipt sender');
  const seal = await pcc.verifyEd25519(chain.params.sequencer.bytes, pcc.hexToBytes(pcc.sealDigest(block.header, receipt.genesis)), block.header.sequencer_sig);
  if (seal !== true) throw new Error('The block seal could not be checked with the pinned genesis key. Open Verify a block for details.');
  const body = await net.getText('/body/' + tx.body_hash);
  if (body !== receipt.body) throw new Error('The devnet no longer serves this exact event body');
  return { included: true, height: status.height, blockHash: pcc.blockHeaderHash(block.header), status: 'included' };
}
