import provenance from '../data/agent-cabinet-provenance.json';
import preparedPublication from '../data/agent-cabinet-publication.json';

export const AGENT_CABINET_PUBLICATION = Object.freeze({
  contract: preparedPublication.contract,
  administrator: preparedPublication.administrator,
  inventoryRecipient: preparedPublication.inventoryRecipient,
  chainId: preparedPublication.chainId,
  setupCapMutez: preparedPublication.setupCapMutez,
  mainnetApproved: preparedPublication.mainnetApproved,
  requestable: preparedPublication.requestable,
  status: preparedPublication.status,
});

export const AGENT_CABINET_APPROVAL_PHRASE = `PUBLISH TOKENS 10-12 / 27 EACH / 81 TOTAL / ${preparedPublication.inventoryRecipient}`;
const APPROVAL_SCHEMA = 'pointcast.agent-cabinet.action-time-approval/v1' as const;
const APPROVAL_TTL_MS = 60_000;
const consumedApprovals = new Set<string>();

type CabinetItem = typeof provenance.items[number];
type Operation = {
  kind: 'transaction';
  to: string;
  amount: number;
  mutez: true;
  parameter: { entrypoint: string; value: any };
  fee?: number;
  gasLimit?: number;
  storageLimit?: number;
};
type Estimate = { suggestedFeeMutez: number; gasLimit: number; storageLimit: number };

export type AgentCabinetPublicationAdapter = {
  address(): Promise<string | null>;
  chainId(): Promise<string>;
  administrator(): Promise<string>;
  tokenExists(id: number): Promise<boolean>;
  bytes(uri: string): Promise<Uint8Array>;
  estimate(operations: Operation[]): Promise<Estimate[]>;
  costPerByte(): Promise<number>;
  request(operations: Operation[]): Promise<{ opHash: string; confirmation(count: number): Promise<unknown> }>;
};

const hex = (value: string) => Array.from(
  new TextEncoder().encode(value),
  (byte) => byte.toString(16).padStart(2, '0'),
).join('');

const digest = async (bytes: Uint8Array) => Array.from(
  new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource)),
  (byte) => byte.toString(16).padStart(2, '0'),
).join('');

const fail = (message: string): never => { throw new Error(message); };
const natural = (value: number, label: string) => (
  Number.isSafeInteger(value) && value >= 0 ? value : fail(`Invalid ${label}; publication is stopped.`)
);

function validateStaticPackage(items: CabinetItem[] = provenance.items): void {
  if (preparedPublication.status !== 'prepared-only'
    || preparedPublication.mainnetApproved !== false
    || preparedPublication.requestable !== false
    || preparedPublication.operationHash !== null) {
    fail('The checked-in Agent Cabinet publication must remain prepared-only.');
  }
  if (provenance.publisher !== 'PointCast'
    || provenance.creatorAuthorization.status !== 'unverified'
    || provenance.creatorAuthorization.runtimePublisherId !== null
    || provenance.creatorAuthorization.signature !== null) {
    fail('The Agent Cabinet publisher and resident-authorization boundary changed.');
  }
  if (items.length !== 3 || items.some((item, index) => (
    item.id !== index + 10
    || item.objectNumber !== index + 1
    || item.editions !== 27
    || !/^[a-f0-9]{64}$/u.test(item.artifactSha256)
    || !/^[a-f0-9]{64}$/u.test(item.metadataSha256)
    || item.metadataUri !== `https://pointcast.xyz/collectibles/agent-cabinet/metadata/${item.metadataSha256}.json`
    || item.artifactUri !== `https://pointcast.xyz/collectibles/agent-cabinet/artifacts/${item.artifactSha256}.svg`
  ))) {
    fail('Expected three reviewed Agent Cabinet objects at token IDs 10-12, with 27 editions each.');
  }
  if (preparedPublication.editionSupply !== 81
    || preparedPublication.editionsPerObject !== 27
    || preparedPublication.operations.length !== 4
    || preparedPublication.contract !== provenance.inventoryPublication.contract
    || preparedPublication.administrator !== provenance.inventoryPublication.administrator
    || preparedPublication.inventoryRecipient !== provenance.inventoryPublication.inventoryRecipient) {
    fail('The prepared publication does not match the provenance package.');
  }
}

/** Three fixed token registrations followed by one fixed 81-edition inventory mint. */
export function agentCabinetInventoryOperations(items: CabinetItem[] = provenance.items): Operation[] {
  validateStaticPackage(items);
  const transaction = (entrypoint: string, value: any): Operation => ({
    kind: 'transaction',
    to: AGENT_CABINET_PUBLICATION.contract,
    amount: 0,
    mutez: true,
    parameter: { entrypoint, value },
  });
  return [
    ...items.map((item) => {
      const fields = {
        '': item.metadataUri,
        artifactSha256: item.artifactSha256,
        decimals: '0',
        metadataSha256: item.metadataSha256,
        name: `${item.title} — The Agent Cabinet`,
        publisher: 'PointCast',
      };
      return transaction('create_token', {
        prim: 'Pair',
        args: [
          { int: String(item.id) },
          Object.entries(fields).map(([key, value]) => ({
            prim: 'Elt',
            args: [{ string: key }, { bytes: hex(value) }],
          })),
        ],
      });
    }),
    transaction('mint_tokens', items.map((item) => ({
      prim: 'Pair',
      args: [
        { string: AGENT_CABINET_PUBLICATION.inventoryRecipient },
        { prim: 'Pair', args: [{ int: String(item.id) }, { int: '27' }] },
      ],
    }))),
  ];
}

async function checkChain(adapter: AgentCabinetPublicationAdapter): Promise<void> {
  if (await adapter.address() !== AGENT_CABINET_PUBLICATION.administrator) {
    fail('Connect the PointCast publication administrator shown on this page.');
  }
  if (await adapter.chainId() !== AGENT_CABINET_PUBLICATION.chainId) fail('Expected Tezos mainnet.');
  if (await adapter.administrator() !== AGENT_CABINET_PUBLICATION.administrator) {
    fail('The FA2 administrator has changed. Publication is stopped.');
  }
  for (const item of provenance.items) {
    if (await adapter.tokenExists(item.id)) {
      fail(`Token ${item.id} already exists. Do not repeat this publication; verify the existing operation.`);
    }
  }
}

function validateMetadata(metadata: Record<string, any>, item: CabinetItem): void {
  if (metadata.name !== `${item.title} — The Agent Cabinet`
    || metadata.publisher !== 'PointCast'
    || metadata.artist !== 'PointCast'
    || metadata.credit !== 'PUBLISHED BY POINTCAST'
    || metadata.publisherAddress !== AGENT_CABINET_PUBLICATION.administrator
    || metadata.artifactUri !== item.artifactUri
    || metadata.displayUri !== item.artifactUri
    || metadata.thumbnailUri !== item.artifactUri
    || metadata.artifactSha256 !== item.artifactSha256
    || metadata.editionSupply !== 27
    || metadata.proposedFor?.handle !== item.proposedFor.handle
    || metadata.proposedFor?.residentIdentityId !== item.proposedFor.residentIdentityId
    || metadata.creatorAuthorization?.status !== 'unverified'
    || metadata.creatorAuthorization?.runtimePublisherId !== null
    || metadata.creatorAuthorization?.signature !== null
    || !Array.isArray(metadata.creators)
    || metadata.creators.length !== 1
    || metadata.creators[0] !== AGENT_CABINET_PUBLICATION.administrator
    || !Array.isArray(metadata.formats)
    || metadata.formats.length !== 1
    || metadata.formats[0]?.uri !== item.artifactUri
    || metadata.formats[0]?.fileName !== `${item.artifactSha256}.svg`
    || metadata.formats[0]?.mimeType !== 'image/svg+xml'
    || metadata.formats[0]?.sha256 !== item.artifactSha256
    || metadata.formats[0]?.fileSize !== item.artifactBytes) {
    fail(`Published metadata does not match reviewed Agent Cabinet object ${item.id}.`);
  }
}

export type AgentCabinetPublicationPlan = {
  operations: Operation[];
  maximumCostMutez: number;
  preparedAt: number;
  reviewDigest: string;
  requestable: false;
};

export type AgentCabinetPublicationApproval = {
  schema: typeof APPROVAL_SCHEMA;
  reviewDigest: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  token: string;
};

/** Read-only verification and estimation. This function never calls adapter.request(). */
export async function prepareAgentCabinetPublication(
  adapter: AgentCabinetPublicationAdapter,
  report = (_message: string) => {},
): Promise<AgentCabinetPublicationPlan> {
  const operations = agentCabinetInventoryOperations();
  report('Checking the PointCast administrator, Tezos mainnet, and unused token IDs 10-12…');
  await checkChain(adapter);
  for (const item of provenance.items) {
    report(`Verifying object ${item.objectNumber} / 3: ${item.title}…`);
    const metadataBytes = await adapter.bytes(item.metadataUri);
    if (metadataBytes.byteLength !== item.metadataBytes || await digest(metadataBytes) !== item.metadataSha256) {
      fail(`Published metadata hash mismatch for ${item.title}.`);
    }
    let metadata: Record<string, any>;
    try {
      metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
    } catch {
      fail(`Published metadata is not valid JSON for ${item.title}.`);
    }
    validateMetadata(metadata!, item);
    const artifact = await adapter.bytes(item.artifactUri);
    if (artifact.byteLength !== item.artifactBytes || await digest(artifact) !== item.artifactSha256) {
      fail(`Published artifact hash mismatch for ${item.title}.`);
    }
    const svg = new TextDecoder().decode(artifact);
    if (!/^<svg\b/u.test(svg) || /<script\b|\bon\w+\s*=|(?:href|src)\s*=\s*["']https?:/iu.test(svg)) {
      fail(`Canonical artifact is not a self-contained deterministic SVG for ${item.title}.`);
    }
  }
  report('Estimating the exact four operations without signing…');
  const estimates = await adapter.estimate(operations);
  if (estimates.length !== operations.length) fail('Unexpected operation count in the fee estimate.');
  const storagePrice = natural(await adapter.costPerByte(), 'storage price');
  if (storagePrice === 0) fail('Invalid zero storage price.');
  let maximumCostMutez = 0;
  const cappedOperations = operations.map((operation, index) => {
    const fee = natural(estimates[index].suggestedFeeMutez, 'fee');
    const gasLimit = natural(estimates[index].gasLimit, 'gas limit');
    const storageLimit = natural(estimates[index].storageLimit, 'storage limit');
    maximumCostMutez += fee + storageLimit * storagePrice;
    return { ...operation, fee, gasLimit, storageLimit };
  });
  natural(maximumCostMutez, 'total cost');
  if (maximumCostMutez > AGENT_CABINET_PUBLICATION.setupCapMutez) {
    fail('The estimate exceeds the 1 ꜩ setup limit. No wallet request was made.');
  }
  await checkChain(adapter);
  const preparedAt = Date.now();
  const reviewDigest = await digest(new TextEncoder().encode(JSON.stringify({
    operations: cappedOperations,
    maximumCostMutez,
    preparedAt,
    publisher: 'PointCast',
    residentCreatorAuthorization: 'unverified',
  })));
  return { operations: cappedOperations, maximumCostMutez, preparedAt, reviewDigest, requestable: false };
}

/**
 * Create a one-minute, in-memory approval bound to the exact fresh review.
 * This records neither a signature nor a chain action; the wallet still owns
 * the only operation approval. The long phrase makes the irreversible terms
 * explicit and prevents a checkbox or stale plan from silently escalating.
 */
export async function approveAgentCabinetPublication(
  plan: AgentCabinetPublicationPlan,
  acknowledgement: string,
): Promise<AgentCabinetPublicationApproval> {
  if (acknowledgement.trim() !== AGENT_CABINET_APPROVAL_PHRASE) {
    fail('Type the exact token, quantity, and inventory-recipient acknowledgement.');
  }
  const issuedAt = Date.now();
  if (issuedAt - plan.preparedAt > 120_000 || plan.preparedAt > issuedAt) {
    fail('The estimate has expired. Verify the publication again.');
  }
  const expiresAt = Math.min(plan.preparedAt + 120_000, issuedAt + APPROVAL_TTL_MS);
  const nonce = crypto.randomUUID();
  const token = await digest(new TextEncoder().encode([
    APPROVAL_SCHEMA,
    plan.reviewDigest,
    nonce,
    issuedAt,
    expiresAt,
    AGENT_CABINET_APPROVAL_PHRASE,
  ].join('\n')));
  return { schema: APPROVAL_SCHEMA, reviewDigest: plan.reviewDigest, nonce, issuedAt, expiresAt, token };
}

/**
 * Explicit action-time wallet boundary. The static release is never
 * automatically requestable: every call needs a fresh plan plus the short-lived
 * reviewed acknowledgement above, and rechecks chain state before the wallet.
 */
export async function requestAgentCabinetPublication(
  adapter: AgentCabinetPublicationAdapter,
  plan: AgentCabinetPublicationPlan,
  approval: AgentCabinetPublicationApproval | null | undefined,
) {
  const currentTime = Date.now();
  if (currentTime - plan.preparedAt > 120_000 || plan.preparedAt > currentTime) {
    fail('The estimate has expired. Verify the publication again.');
  }
  const reviewedApproval = approval;
  if (!reviewedApproval) {
    throw new Error('The action-time approval is missing, expired, changed, or already used. Verify again.');
  }
  if (reviewedApproval.schema !== APPROVAL_SCHEMA
    || reviewedApproval.reviewDigest !== plan.reviewDigest
    || !/^[0-9a-f-]{36}$/iu.test(reviewedApproval.nonce)
    || !Number.isSafeInteger(reviewedApproval.issuedAt)
    || !Number.isSafeInteger(reviewedApproval.expiresAt)
    || reviewedApproval.issuedAt < plan.preparedAt
    || reviewedApproval.expiresAt > plan.preparedAt + 120_000
    || reviewedApproval.expiresAt <= reviewedApproval.issuedAt
    || reviewedApproval.expiresAt - reviewedApproval.issuedAt > APPROVAL_TTL_MS
    || reviewedApproval.expiresAt <= currentTime
    || consumedApprovals.has(reviewedApproval.nonce)) {
    fail('The action-time approval is missing, expired, changed, or already used. Verify again.');
  }
  const expectedApprovalToken = await digest(new TextEncoder().encode([
    APPROVAL_SCHEMA,
    plan.reviewDigest,
    reviewedApproval.nonce,
    reviewedApproval.issuedAt,
    reviewedApproval.expiresAt,
    AGENT_CABINET_APPROVAL_PHRASE,
  ].join('\n')));
  if (reviewedApproval.token !== expectedApprovalToken) fail('The action-time approval does not match this review.');
  const expected = agentCabinetInventoryOperations();
  if (plan.operations.length !== 4 || plan.operations.some((operation, index) => {
    const { fee, gasLimit, storageLimit, ...bare } = operation;
    return JSON.stringify(bare) !== JSON.stringify(expected[index])
      || !Number.isSafeInteger(fee) || Number(fee) < 0
      || !Number.isSafeInteger(gasLimit) || Number(gasLimit) < 0
      || !Number.isSafeInteger(storageLimit) || Number(storageLimit) < 0;
  })) {
    fail('The operation review has changed. Verify the publication again.');
  }
  const storagePrice = natural(await adapter.costPerByte(), 'storage price');
  const maximumCostMutez = plan.operations.reduce(
    (sum, operation) => sum + operation.fee! + operation.storageLimit! * storagePrice,
    0,
  );
  if (storagePrice === 0 || maximumCostMutez !== plan.maximumCostMutez
    || maximumCostMutez > AGENT_CABINET_PUBLICATION.setupCapMutez) {
    fail('The fee or storage limits changed. Verify the publication again.');
  }
  await checkChain(adapter);
  consumedApprovals.add(reviewedApproval.nonce);
  return adapter.request(plan.operations);
}

/** One shared Beacon session; preparation reads and estimates only. */
export async function connectAgentCabinetPublicationAdapter(): Promise<AgentCabinetPublicationAdapter> {
  const shared = await import('./tezos');
  const address = await shared.connectKukaiForSigning();
  if (address !== AGENT_CABINET_PUBLICATION.administrator) {
    fail('This is not the PointCast publication administrator. Switch to the address shown on this page.');
  }
  const tezos = await shared.tezosClient();
  const wallet = await shared.pointCastWallet();
  tezos.setSignerProvider({
    publicKeyHash: async () => AGENT_CABINET_PUBLICATION.administrator,
    publicKey: async () => {
      const key = await tezos.rpc.getManagerKey(AGENT_CABINET_PUBLICATION.administrator);
      if (typeof key !== 'string') return fail('The administrator key must already be revealed.');
      return key;
    },
    secretKey: async () => fail('This page never accesses private keys.'),
    sign: async () => fail('Only the wallet may authorize publication.'),
  });
  const contract = await tezos.contract.at(AGENT_CABINET_PUBLICATION.contract);
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
