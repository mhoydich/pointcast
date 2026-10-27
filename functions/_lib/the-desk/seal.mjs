// The Desk — sealing. Every order is committed before it executes and
// revealed after it settles.
//
// commitment = sha256(canonical({ id, agent, venue, instrument, action, qty, limitPrice, configHash, reasoning, salt }))
// chain      = sha256((previous chain || 'the-desk:genesis') + commitment)
//
// The commitment and chain are public the moment the order is sealed; the
// reasoning and salt are published at reveal, so anyone can recompute both.
//
// Paper mode seals locally (the chain above, in D1). Live mode must also
// carry a witness stone from The Wild (src/lib/wild-mcp.ts, `witness`, $0.01
// over x402) paid from Mike's own wallet. That path is not built, so the
// live sealer always throws, and the gate fails closed: no seal, no trade.
import { canonical, randomHex, sha256hex } from './util.mjs';

export const GENESIS = 'the-desk:genesis';

export function sealPayload(order, salt) {
  return canonical({
    id: order.id, agent: order.agent, venue: order.venue, instrument: order.instrument, action: order.action,
    qty: order.qty, limitPrice: order.limit_price, configHash: order.config_hash, reasoning: order.reasoning, salt,
  });
}

export async function commit(order, prevChain, salt = randomHex(16)) {
  const commitment = await sha256hex(sealPayload(order, salt));
  const chain = await sha256hex((prevChain || GENESIS) + commitment);
  return { salt, commitment, chain };
}

/** True when a revealed order's reasoning and salt hash to its published commitment. */
export async function verifyReveal(order) {
  if (!order.salt || !order.commitment) return false;
  return (await sha256hex(sealPayload(order, order.salt))) === order.commitment;
}

/** Paper sealer: the local chain is the whole seal. */
export const localSealer = {
  name: 'local',
  async witness() {
    return { ok: true };
  },
};

/** Live sealer placeholder: The Wild witness stone is required and not wired yet. */
export const wildSealer = {
  name: 'wild',
  async witness() {
    throw new Error('wild-witness-not-wired');
  },
};
