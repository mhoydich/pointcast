type DerbyReceipt = {
  raceId: string;
  seed: string;
  track: string;
  winner: string;
  order: string[];
  margins: Array<{ slug: string; margin: number; time: number }>;
  generatedAt?: string;
  version?: string;
};

type DerbyChainNetwork = 'mainnet' | 'shadownet';
type DerbyChainConfigInput = {
  network?: DerbyChainNetwork;
  address?: string;
  entrypoint?: string;
  explorerBase?: string;
};

const TZKT_BY_NETWORK: Record<DerbyChainNetwork, string> = {
  mainnet: 'https://tzkt.io',
  shadownet: 'https://shadownet.tzkt.io',
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function canonicalDerbyReceipt(receipt: DerbyReceipt): string {
  return JSON.stringify(canonicalize({
    raceId: receipt.raceId,
    seed: receipt.seed,
    track: receipt.track,
    winner: receipt.winner,
    order: receipt.order,
    margins: receipt.margins,
    version: receipt.version ?? '0.4.0-v2',
  }));
}

export async function hashDerbyReceipt(receipt: DerbyReceipt): Promise<string> {
  const encoded = new TextEncoder().encode(canonicalDerbyReceipt(receipt));
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(digest));
}

export function derbyChainConfig(input: DerbyChainConfigInput = {}) {
  const network = input.network ?? 'mainnet';
  const address = String(input.address ?? '').trim();
  return {
    network,
    address,
    isLive: /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(address),
    entrypoint: String(input.entrypoint ?? 'record_race'),
    explorerBase: input.explorerBase ?? TZKT_BY_NETWORK[network],
  };
}

export async function prepareDerbyChainPacket(receipt: DerbyReceipt, input: DerbyChainConfigInput = {}) {
  const config = derbyChainConfig(input);
  const receiptHash = await hashDerbyReceipt(receipt);
  const canonicalReceipt = canonicalDerbyReceipt(receipt);
  return {
    config,
    receiptHash,
    canonicalReceipt,
    payload: {
      race_id: receipt.raceId,
      receipt_hash: `0x${receiptHash}`,
      seed: receipt.seed,
      track: receipt.track,
      winner: receipt.winner,
      field_size: receipt.order.length,
    },
  };
}

export function derbySignatureMessage(packet: Awaited<ReturnType<typeof prepareDerbyChainPacket>>): string {
  return [
    'PointCast Agent Derby receipt',
    `network: ${packet.config.network}`,
    `contract: ${packet.config.address || 'pending'}`,
    `entrypoint: ${packet.config.entrypoint}`,
    `receipt_hash: ${packet.receiptHash}`,
    `receipt: ${packet.canonicalReceipt}`,
  ].join('\n');
}

export async function signDerbyReceipt(receipt: DerbyReceipt, input: DerbyChainConfigInput = {}) {
  const packet = await prepareDerbyChainPacket(receipt, input);
  const { signTezosPayload } = await import('./tezos');
  const message = derbySignatureMessage(packet);
  const signed = await signTezosPayload(message);
  return {
    ...packet,
    signatureMessage: message,
    signaturePayload: signed.payload,
    signature: signed.signature,
    walletAddress: signed.address,
    signedAt: new Date().toISOString(),
  };
}

export async function recordDerbyReceiptOnChain(receipt: DerbyReceipt, input: DerbyChainConfigInput = {}) {
  const packet = await prepareDerbyChainPacket(receipt, input);
  if (!packet.config.isLive) {
    throw new Error('Agent Derby receipt contract is not configured yet.');
  }

  const [{ tezosClient, connectKukai, getActiveAddress }] = await Promise.all([
    import('./tezos'),
  ]);
  await connectKukai();
  const walletAddress = await getActiveAddress();
  const tezos = await tezosClient();
  const contract = await tezos.wallet.at(packet.config.address);
  const entrypoint = (contract.methodsObject as any)[packet.config.entrypoint];
  if (typeof entrypoint !== 'function') {
    throw new Error(`Agent Derby contract does not expose ${packet.config.entrypoint}.`);
  }

  const op = await entrypoint(packet.payload).send();

  return {
    ...packet,
    walletAddress,
    opHash: op.opHash,
    explorerUrl: `${packet.config.explorerBase}/${op.opHash}`,
    confirmation: op.confirmation(1),
  };
}
