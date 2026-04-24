import contracts from '../data/contracts.json';

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

const TZKT_BY_NETWORK: Record<DerbyChainNetwork, string> = {
  mainnet: 'https://tzkt.io',
  shadownet: 'https://shadownet.tzkt.io',
};

function derbyContracts() {
  return (contracts as any).agent_derby_receipts ?? {};
}

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

export function derbyChainConfig(network: DerbyChainNetwork = 'mainnet') {
  const address = String(derbyContracts()[network] ?? '').trim();
  return {
    network,
    address,
    isLive: /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(address),
    entrypoint: String(derbyContracts().entrypoint ?? 'record_race'),
    explorerBase: TZKT_BY_NETWORK[network],
  };
}

export async function prepareDerbyChainPacket(receipt: DerbyReceipt, network: DerbyChainNetwork = 'mainnet') {
  const config = derbyChainConfig(network);
  const receiptHash = await hashDerbyReceipt(receipt);
  return {
    config,
    receiptHash,
    canonicalReceipt: canonicalDerbyReceipt(receipt),
    payload: {
      race_id: receipt.raceId,
      receipt_hash: receiptHash,
      seed: receipt.seed,
      track: receipt.track,
      winner: receipt.winner,
      field_size: receipt.order.length,
    },
  };
}

export async function recordDerbyReceiptOnChain(receipt: DerbyReceipt, network: DerbyChainNetwork = 'mainnet') {
  const packet = await prepareDerbyChainPacket(receipt, network);
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

  const op = await contract.methodsObject
    .record_race(packet.payload)
    .send();

  return {
    ...packet,
    walletAddress,
    opHash: op.opHash,
    explorerUrl: `${packet.config.explorerBase}/${op.opHash}`,
    confirmation: op.confirmation(1),
  };
}
