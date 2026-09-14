import provenance from '../data/other-worlds-provenance.json';

export const PUBLICATION = Object.freeze({
  contract: 'KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb',
  administrator: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
  sponsor: 'tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY',
  chainId: 'NetXdQprcVkpaWU',
  setupCapMutez: 1_600_000,
});

type Art = typeof provenance.items[number];
type Operation = {
  kind: 'transaction'; to: string; amount: number; mutez: true;
  parameter: { entrypoint: string; value: any };
  fee?: number; gasLimit?: number; storageLimit?: number;
};
type Estimate = { suggestedFeeMutez: number; gasLimit: number; storageLimit: number };
export type PublicationAdapter = {
  address(): Promise<string | null>;
  chainId(): Promise<string>;
  administrator(): Promise<string>;
  tokenExists(id: number): Promise<boolean>;
  bytes(uri: string): Promise<Uint8Array>;
  estimate(operations: Operation[]): Promise<Estimate[]>;
  costPerByte(): Promise<number>;
  request(operations: Operation[]): Promise<{ opHash: string; confirmation(count: number): Promise<unknown> }>;
};

const hex = (value: string) => Array.from(new TextEncoder().encode(value), byte => byte.toString(16).padStart(2, '0')).join('');
const digest = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource)), byte => byte.toString(16).padStart(2, '0')).join('');
const fail = (message: string): never => { throw new Error(message); };
const natural = (value: number, label: string) => Number.isSafeInteger(value) && value >= 0 ? value : fail(`Invalid ${label}; publication is stopped.`);

/** Only the fixed, reviewed nine registrations and one 243-edition mint. */
export function inventoryOperations(items: Art[] = provenance.items): Operation[] {
  if (items.length !== 9 || items.some((item, index) => item.id !== index + 1 || item.editions !== 27)) {
    fail('Expected nine consecutive artworks with 27 editions each.');
  }
  const transaction = (entrypoint: string, value: any): Operation => ({
    kind: 'transaction', to: PUBLICATION.contract, amount: 0, mutez: true, parameter: { entrypoint, value },
  });
  return [
    ...items.map(art => {
      if (art.metadataUri !== `https://pointcast.xyz/collectibles/other-worlds/metadata/${art.metadataSha256}.json`
        || art.artifactUri !== `https://pointcast.xyz/images/other-worlds/${art.slug}.png`
        || !/^[a-f0-9]{64}$/.test(art.metadataSha256) || !/^[a-f0-9]{64}$/.test(art.artifactSha256)) {
        fail('The canonical artwork record is invalid.');
      }
      const fields = { '': art.metadataUri, artifactSha256: art.artifactSha256, decimals: '0',
        metadataSha256: art.metadataSha256, name: `${art.title} — LOS ANGELES / OTHER WORLDS` };
      return transaction('create_token', { prim: 'Pair', args: [{ int: String(art.id) },
        Object.entries(fields).map(([key, value]) => ({ prim: 'Elt', args: [{ string: key }, { bytes: hex(value) }] }))] });
    }),
    transaction('mint_tokens', items.map(art => ({ prim: 'Pair', args: [{ string: PUBLICATION.sponsor },
      { prim: 'Pair', args: [{ int: String(art.id) }, { int: '27' }] }] }))),
  ];
}

async function checkChain(adapter: PublicationAdapter) {
  if (await adapter.address() !== PUBLICATION.administrator) fail('Connect the contract administrator wallet shown on this page.');
  if (await adapter.chainId() !== PUBLICATION.chainId) fail('Expected Tezos mainnet.');
  if (await adapter.administrator() !== PUBLICATION.administrator) fail('The contract administrator has changed. Publication is stopped.');
  for (const art of provenance.items) {
    if (await adapter.tokenExists(art.id)) fail(`Token ${art.id} already exists. Do not repeat this publication; verify the previous operation.`);
  }
}

/** Read-only preparation. No signing or wallet transaction request occurs here. */
export async function prepareInventoryPublication(adapter: PublicationAdapter, report = (_message: string) => {}) {
  const operations = inventoryOperations();
  report('Checking the administrator, Tezos mainnet, and unused token IDs…');
  await checkChain(adapter);
  for (const art of provenance.items) {
    report(`Verifying published files ${art.id} / 9: ${art.title}…`);
    const metadataBytes = await adapter.bytes(art.metadataUri);
    if (await digest(metadataBytes) !== art.metadataSha256) fail(`Published metadata hash mismatch for ${art.title}.`);
    const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
    if (metadata.artifactUri !== art.artifactUri || metadata.artifactSha256 !== art.artifactSha256
      || metadata.editionSupply !== 27 || metadata.credit !== 'BY MICHAEL HOYDICH'
      || metadata.creators?.length !== 1 || metadata.creators[0] !== PUBLICATION.administrator) {
      fail(`Published metadata does not match the approved artwork ${art.id}.`);
    }
    const image = await adapter.bytes(art.artifactUri);
    if (image.byteLength !== art.bytes || await digest(image) !== art.artifactSha256) fail(`Published original hash mismatch for ${art.title}.`);
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((value, index) => image[index] === value)) fail('Canonical artwork must be a still PNG.');
  }
  report('Estimating the exact ten operations without signing…');
  const rows = await adapter.estimate(operations);
  if (rows.length !== operations.length) fail('Unexpected operation count in the fee estimate.');
  const storagePrice = natural(await adapter.costPerByte(), 'storage price');
  if (storagePrice === 0) fail('Invalid zero storage price.');
  let maximumCostMutez = 0;
  const cappedOperations = operations.map((operation, index) => {
    const fee = natural(rows[index].suggestedFeeMutez, 'fee');
    const gasLimit = natural(rows[index].gasLimit, 'gas limit');
    const storageLimit = natural(rows[index].storageLimit, 'storage limit');
    maximumCostMutez += fee + storageLimit * storagePrice;
    return { ...operation, fee, gasLimit, storageLimit };
  });
  natural(maximumCostMutez, 'total cost');
  if (maximumCostMutez > PUBLICATION.setupCapMutez) fail('The estimate exceeds the 1.6 ꜩ setup limit. No wallet request was made.');
  // Recheck after downloads and simulation; another tab may have published.
  await checkChain(adapter);
  return { operations: cappedOperations, maximumCostMutez, preparedAt: Date.now() };
}

/** Called only by the separate, explicit review-and-request button. */
export async function requestInventoryPublication(adapter: PublicationAdapter, plan: Awaited<ReturnType<typeof prepareInventoryPublication>>) {
  if (Date.now() - plan.preparedAt > 120_000 || plan.preparedAt > Date.now()) fail('The estimate has expired. Verify the publication again.');
  const expected = inventoryOperations();
  if (plan.operations.length !== 10 || plan.operations.some((operation, index) => {
    const { fee, gasLimit, storageLimit, ...bare } = operation;
    return JSON.stringify(bare) !== JSON.stringify(expected[index]) || !Number.isSafeInteger(fee)
      || !Number.isSafeInteger(gasLimit) || !Number.isSafeInteger(storageLimit)
      || Number(fee) < 0 || Number(gasLimit) < 0 || Number(storageLimit) < 0;
  })) fail('The operation review has changed. Verify the publication again.');
  const storagePrice = natural(await adapter.costPerByte(), 'storage price');
  const maximumCost = plan.operations.reduce((sum, op) => sum + op.fee! + op.storageLimit! * storagePrice, 0);
  if (storagePrice === 0 || !Number.isSafeInteger(maximumCost) || maximumCost !== plan.maximumCostMutez || maximumCost > PUBLICATION.setupCapMutez) {
    fail('The fee or storage limits changed. Verify the publication again.');
  }
  await checkChain(adapter);
  return adapter.request(plan.operations);
}

/** Uses Pointcast's one shared Beacon/Kukai permission session. */
export async function connectPublicationAdapter(): Promise<PublicationAdapter> {
  const shared = await import('./tezos');
  const address = await shared.connectKukaiForSigning();
  if (address !== PUBLICATION.administrator) fail('This is not the contract administrator wallet. Switch to the address shown on this page.');
  const tezos = await shared.tezosClient();
  const wallet = await shared.pointCastWallet();
  tezos.setSignerProvider({
    publicKeyHash: async () => PUBLICATION.administrator,
    publicKey: async () => {
      const key = await tezos.rpc.getManagerKey(PUBLICATION.administrator);
      if (typeof key !== 'string') return fail('The administrator key must already be revealed.');
      return key;
    },
    secretKey: async () => fail('This page never accesses private keys.'),
    sign: async () => fail('Only the wallet may authorize publication.'),
  });
  const contract = await tezos.contract.at(PUBLICATION.contract);
  const storage = async () => contract.storage<any>();
  return {
    address: async () => {
      const account = await wallet.client.getActiveAccount();
      if (account?.network?.type !== 'mainnet') fail('The connected wallet must use Tezos mainnet.');
      return account?.address ?? null;
    },
    chainId: () => tezos.rpc.getChainId(),
    administrator: async () => (await storage()).admin?.admin,
    tokenExists: async (id) => {
      const value = await (await storage()).assets.token_metadata.get(String(id));
      return value !== undefined && value !== null;
    },
    bytes: async (uri) => {
      const response = await fetch(uri, { cache: 'no-store', redirect: 'error' });
      if (!response.ok) return fail(`The published file is unavailable (${response.status}).`);
      return new Uint8Array(await response.arrayBuffer());
    },
    estimate: (operations) => tezos.estimate.batch(operations as any),
    costPerByte: async () => Number((await tezos.rpc.getConstants()).cost_per_byte),
    request: (operations) => tezos.wallet.batch(operations as any).send(),
  };
}
