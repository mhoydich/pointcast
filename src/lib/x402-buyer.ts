/**
 * Browser payer for the reviewed PointCast Etherlink/USDC route only.
 * No RPC/network sends, chain switching, token approvals, storage or retries.
 * Call connect/sign only from their respective explicit user actions.
 *
 * https://eips.ethereum.org/EIPS/eip-6963
 * https://developers.uniswap.org/docs/protocols/permit2/concepts/signature-transfer
 * https://github.com/tzapac/tzapac-x402-permit2#coinbase-permit2-proxy
 */
import { recoverTypedDataAddress } from 'viem';
import {
  X402_CHAIN_ID, X402_DEFAULT_ASSET, X402_DEFAULT_PAY_TO, X402_DEFAULT_PRICE_UNITS,
  X402_NETWORK, X402_PERMIT2, X402_PROXY, X402_RECEIPT_SPEC, X402_TREASURY_AGENT_ID,
  canonicalJson, decodeBase64Json, encodeBase64Json, isJsonRecord, verifyX402Receipt,
  type JsonRecord,
} from './x402.ts';

type WalletListener = (...values: unknown[]) => void;
export interface BuyerProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: WalletListener): unknown;
  removeListener?(event: string, listener: WalletListener): unknown;
}
export interface BuyerWallet {
  readonly uuid: string;
  readonly name: string;
  readonly rdns: string;
  readonly provider: BuyerProvider;
}
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTION_PATH = /^\/api\/agent\/(bench|cast|claim|battler)$/;
const sameAddress = (a: unknown, b: unknown) => typeof a === 'string' && typeof b === 'string'
  && ADDRESS.test(a) && ADDRESS.test(b) && a.toLowerCase() === b.toLowerCase();
function fail(code: string): never { throw new Error(code); }
function address(value: unknown): string {
  if (typeof value !== 'string' || !ADDRESS.test(value) || /^0x0{40}$/i.test(value)) fail('invalid-wallet-account');
  return value.toLowerCase();
}
function currentTime(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) fail('invalid-clock');
  return value;
}

/** Listen for the page lifetime; stop only when the owning UI is destroyed. */
export function createWalletDiscovery(target: Pick<EventTarget, 'addEventListener' | 'removeEventListener' | 'dispatchEvent'>,
  onChange: (wallets: readonly BuyerWallet[]) => void = () => {}) {
  const found = new Map<string, BuyerWallet>();
  const conflicts = new Set<string>();
  let stopped = false;
  const wallets = () => Object.freeze([...found.values()]);
  const announce = (event: Event) => {
    const detail: unknown = (event as CustomEvent).detail;
    if (!isJsonRecord(detail) || !isJsonRecord(detail.info) || !detail.provider) return;
    const info = detail.info;
    const provider = detail.provider as BuyerProvider;
    if (typeof provider.request !== 'function' || typeof info.uuid !== 'string' || !UUID.test(info.uuid)
      || typeof info.name !== 'string' || !info.name.trim() || info.name.length > 80 || /[\x00-\x1f\x7f]/.test(info.name)
      || typeof info.rdns !== 'string' || info.rdns.length > 253 || !/^[A-Za-z0-9.-]+$/.test(info.rdns)) return;
    const uuid = info.uuid.toLowerCase();
    if (conflicts.has(uuid)) return;
    const existing = found.get(uuid);
    if (existing) {
      if (existing.provider !== provider) { found.delete(uuid); conflicts.add(uuid); onChange(wallets()); }
      return;
    }
    // Metadata is self-described, not a verified wallet identity. No untrusted
    // icon markup is exposed; the UI renders the name as plain text.
    found.set(uuid, Object.freeze({ uuid, name: info.name.trim(), rdns: info.rdns, provider }));
    onChange(wallets());
  };
  target.addEventListener('eip6963:announceProvider', announce);
  target.dispatchEvent(new Event('eip6963:requestProvider'));
  return {
    wallets,
    select(uuid: string): BuyerWallet {
      const wallet = !stopped && found.get(uuid?.toLowerCase());
      if (!wallet) fail('select-a-wallet');
      return wallet;
    },
    stop() { stopped = true; target.removeEventListener('eip6963:announceProvider', announce); found.clear(); },
  };
}

/** Subscription changes are notifications only and never request a signature. */
export function watchBuyerWallet(wallet: BuyerWallet, onChange: () => void): () => void {
  const provider = wallet?.provider;
  if (typeof provider?.on !== 'function' || typeof provider.removeListener !== 'function') fail('wallet-events-unavailable');
  const events = ['accountsChanged', 'chainChanged', 'disconnect'];
  for (const event of events) provider.on(event, onChange);
  return () => { for (const event of events) provider.removeListener!(event, onChange); };
}
async function checkChain(provider: BuyerProvider) {
  const chain = await provider.request({ method: 'eth_chainId' });
  if (typeof chain !== 'string' || !/^0x[0-9a-f]+$/i.test(chain) || BigInt(chain) !== BigInt(X402_CHAIN_ID)) {
    fail('switch-wallet-to-etherlink');
  }
}
function selectedAccount(value: unknown): string {
  if (!Array.isArray(value) || value.length < 1) fail('wallet-account-unavailable');
  return address(value[0]);
}
export async function connectBuyerWallet(wallet: BuyerWallet): Promise<{ payer: string; chainId: number }> {
  if (typeof wallet?.provider?.request !== 'function') fail('select-a-wallet');
  await checkChain(wallet.provider);
  const payer = selectedAccount(await wallet.provider.request({ method: 'eth_requestAccounts' }));
  await checkChain(wallet.provider);
  if (!sameAddress(selectedAccount(await wallet.provider.request({ method: 'eth_accounts' })), payer)) fail('wallet-changed');
  return { payer, chainId: X402_CHAIN_ID };
}

export interface BuyerAccepted {
  readonly scheme: 'exact'; readonly network: typeof X402_NETWORK; readonly amount: string;
  readonly payTo: typeof X402_DEFAULT_PAY_TO; readonly asset: typeof X402_DEFAULT_ASSET; readonly maxTimeoutSeconds: number;
  readonly extra: { readonly name: 'USDC'; readonly version: '2'; readonly assetTransferMethod: 'permit2' };
}
export interface BuyerQuote {
  readonly endpoint: string; readonly amountUnits: string; readonly quotedAt: number; readonly expiresAt: number;
  readonly permit2: typeof X402_PERMIT2; readonly proxy: typeof X402_PROXY;
  readonly accepted: BuyerAccepted;
  readonly resource: { readonly url: string; readonly description: string; readonly mimeType: 'application/json' };
}
const reviewedQuotes = new WeakSet<BuyerQuote>();
// Reserve time for the authenticated submit and facilitator transfer. A wallet
// dialog that consumed the window must be reviewed again, never rushed through.
export const MIN_BUYER_SUBMISSION_MS = 15_000;
function exactKeys(object: JsonRecord, allowed: string[]) {
  if (Object.keys(object).some(key => !allowed.includes(key))) fail('unsupported-quote-fields');
}
export function validateBuyerQuote(input: unknown, { endpoint, amountUnits = X402_DEFAULT_PRICE_UNITS, nowMs = Date.now(), expiresAt }:
  { endpoint: string; amountUnits?: string; nowMs?: number; expiresAt?: string | number | Date }): BuyerQuote {
  let url: URL;
  try { url = new URL(endpoint); } catch { fail('invalid-purchase-endpoint'); }
  if (url.origin !== 'https://pointcast.xyz'
    || url.username || url.password || url.search || url.hash || !ACTION_PATH.test(url.pathname)) fail('invalid-purchase-endpoint');
  if (amountUnits !== X402_DEFAULT_PRICE_UNITS) fail('unsupported-purchase-amount');
  let raw: unknown;
  try {
    if (typeof input === 'string') {
      if (input.length > 16_384) fail('invalid-payment-quote');
      raw = decodeBase64Json(input);
    } else {
      const serialized = JSON.stringify(input);
      if (!serialized || serialized.length > 12_288) fail('invalid-payment-quote');
      raw = JSON.parse(serialized);
    }
  } catch { fail('invalid-payment-quote'); }
  if (!isJsonRecord(raw) || raw.x402Version !== 2 || !Array.isArray(raw.accepts) || raw.accepts.length !== 1
    || !isJsonRecord(raw.accepts[0]) || !isJsonRecord(raw.resource)) fail('unsupported-payment-quote');
  const accepted = raw.accepts[0];
  const extra = accepted.extra;
  exactKeys(accepted, ['scheme', 'network', 'amount', 'payTo', 'asset', 'maxTimeoutSeconds', 'extra']);
  if (accepted.scheme !== 'exact' || accepted.network !== X402_NETWORK || accepted.amount !== amountUnits
    || !sameAddress(accepted.asset, X402_DEFAULT_ASSET) || !sameAddress(accepted.payTo, X402_DEFAULT_PAY_TO)
    || !isJsonRecord(extra) || extra.name !== 'USDC' || extra.version !== '2' || extra.assetTransferMethod !== 'permit2') fail('payment-terms-mismatch');
  exactKeys(extra, ['name', 'version', 'assetTransferMethod']);
  if (typeof accepted.maxTimeoutSeconds !== 'number' || !Number.isSafeInteger(accepted.maxTimeoutSeconds)
    || accepted.maxTimeoutSeconds < 5 || accepted.maxTimeoutSeconds > 60) fail('invalid-payment-timeout');
  if (raw.resource.url !== url.href || raw.resource.mimeType !== 'application/json'
    || typeof raw.resource.description !== 'string' || raw.resource.description.length > 2000) fail('payment-resource-mismatch');
  const quotedAt = currentTime(nowMs);
  const serverExpiry = expiresAt === undefined ? quotedAt + accepted.maxTimeoutSeconds * 1000
    : typeof expiresAt === 'number' ? expiresAt : expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(expiresAt);
  currentTime(serverExpiry);
  const quote: BuyerQuote = Object.freeze({ endpoint: url.href, amountUnits, quotedAt,
    expiresAt: Math.min(serverExpiry, quotedAt + accepted.maxTimeoutSeconds * 1000), permit2: X402_PERMIT2, proxy: X402_PROXY,
    accepted: Object.freeze({ scheme: 'exact', network: X402_NETWORK, amount: amountUnits,
      payTo: X402_DEFAULT_PAY_TO, asset: X402_DEFAULT_ASSET, maxTimeoutSeconds: accepted.maxTimeoutSeconds,
      extra: Object.freeze({ name: 'USDC', version: '2', assetTransferMethod: 'permit2' }) }),
    resource: Object.freeze({ url: url.href, description: raw.resource.description, mimeType: 'application/json' }),
  });
  reviewedQuotes.add(quote);
  return quote;
}
function requireReviewedQuote(quote: BuyerQuote) {
  if (!reviewedQuotes.has(quote)) fail('review-payment-quote-first');
}
function requireFreshQuote(quote: BuyerQuote, nowMs: number) {
  requireReviewedQuote(quote);
  if (currentTime(nowMs) < quote.quotedAt || nowMs >= quote.expiresAt) fail('payment-quote-expired');
  if (nowMs >= quote.expiresAt - MIN_BUYER_SUBMISSION_MS) fail('payment-window-too-short');
}
const TYPES = {
  EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
  PermitWitnessTransferFrom: [{ name: 'permitted', type: 'TokenPermissions' }, { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, { name: 'witness', type: 'Witness' }],
  TokenPermissions: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
  Witness: [{ name: 'to', type: 'address' }, { name: 'validAfter', type: 'uint256' }, { name: 'extra', type: 'bytes' }],
} as const;
for (const fields of Object.values(TYPES)) { for (const field of fields) Object.freeze(field); Object.freeze(fields); }
Object.freeze(TYPES);
export function buildBuyerTypedData({ quote, payer, nonce, nowMs = Date.now() }:
  { quote: BuyerQuote; payer: string; nonce: string; nowMs?: number }) {
  requireFreshQuote(quote, nowMs);
  const from = address(payer);
  if (!/^(0|[1-9][0-9]*)$/.test(nonce) || nonce.length > 78 || BigInt(nonce) >= 2n ** 256n) fail('invalid-payment-nonce');
  const validAfter = Math.floor(nowMs / 1000);
  const deadline = Math.min(validAfter + quote.accepted.maxTimeoutSeconds, Math.floor(quote.expiresAt / 1000));
  if (deadline <= validAfter + 1) fail('payment-quote-expired');
  const permit2Authorization = { from, permitted: { token: quote.accepted.asset, amount: quote.accepted.amount },
    spender: quote.proxy, nonce, deadline: String(deadline),
    witness: { to: quote.accepted.payTo, validAfter: String(validAfter), extra: '0x' } };
  return { permit2Authorization, typedData: {
    domain: { name: 'Permit2', chainId: X402_CHAIN_ID, verifyingContract: quote.permit2 },
    types: TYPES, primaryType: 'PermitWitnessTransferFrom' as const,
    message: { permitted: { token: quote.accepted.asset, amount: BigInt(quote.accepted.amount) }, spender: quote.proxy,
      nonce: BigInt(nonce), deadline: BigInt(deadline),
      witness: { to: quote.accepted.payTo, validAfter: BigInt(validAfter), extra: '0x' as const } },
  } };
}
function randomNonce(randomBytes: () => Uint8Array) {
  const bytes = randomBytes();
  if (!(bytes instanceof Uint8Array) || bytes.length !== 32) fail('invalid-payment-randomness');
  return BigInt('0x' + [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')).toString();
}

/**
 * One signature, returned only in memory. A pre-existing sufficient USDC ->
 * Permit2 allowance is required by the protocol; this helper never grants one.
 * Current pilot accepts ordinary EOA signatures, not contract-wallet signatures.
 */
export async function signBuyerPayment({ wallet, quote, expectedAccount, now = Date.now,
  randomBytes = () => crypto.getRandomValues(new Uint8Array(32)), signal }:
  { wallet: BuyerWallet; quote: BuyerQuote; expectedAccount: string; now?: () => number;
    randomBytes?: () => Uint8Array; signal?: AbortSignal }) {
  requireFreshQuote(quote, now());
  const payer = address(expectedAccount);
  const provider = wallet?.provider;
  if (typeof provider?.request !== 'function') fail('select-a-wallet');
  let changed = false;
  const stopWatching = watchBuyerWallet(wallet, () => { changed = true; });
  const checkCurrent = () => {
    if (signal?.aborted) fail('purchase-cancelled');
    if (changed) fail('wallet-changed');
    requireFreshQuote(quote, now());
  };
  try {
    checkCurrent();
    await checkChain(provider);
    if (!sameAddress(selectedAccount(await provider.request({ method: 'eth_accounts' })), payer)) fail('wallet-changed');
    checkCurrent();
    const built = buildBuyerTypedData({ quote, payer, nonce: randomNonce(randomBytes), nowMs: now() });
    checkCurrent();
    const signature = await provider.request({ method: 'eth_signTypedData_v4', params: [payer, JSON.stringify(built.typedData, (_key, value) => typeof value === 'bigint' ? value.toString() : value)] });
    checkCurrent();
    if (typeof signature !== 'string' || !/^0x[0-9a-fA-F]{130}$/.test(signature)) fail('unsupported-wallet-signature');
    let recovered: string;
    try {
      const { EIP712Domain: _domain, ...messageTypes } = built.typedData.types;
      recovered = await recoverTypedDataAddress({ ...built.typedData, types: messageTypes, signature: signature as `0x${string}` });
    }
    catch { fail('wallet-signature-invalid'); }
    if (!sameAddress(recovered, payer)) fail('wallet-signature-account-mismatch');
    await checkChain(provider);
    if (!sameAddress(selectedAccount(await provider.request({ method: 'eth_accounts' })), payer)) fail('wallet-changed');
    checkCurrent();
    if (Math.floor(now() / 1000) >= Number(built.permit2Authorization.deadline) - MIN_BUYER_SUBMISSION_MS / 1000) fail('payment-window-too-short');
    const paymentPayload = { x402Version: 2, scheme: 'exact', network: X402_NETWORK,
      accepted: quote.accepted, resource: quote.resource,
      payload: { signature, permit2Authorization: built.permit2Authorization } };
    return { paymentPayload, paymentSignature: encodeBase64Json(paymentPayload), payer,
      deadline: Number(built.permit2Authorization.deadline) };
  } finally { stopWatching(); }
}

export interface BuyerReceiptExpectation {
  quote: BuyerQuote; payer: string; action: 'bench' | 'cast' | 'claim' | 'battler'; requestBody: JsonRecord;
  actionId: string; transactionHash?: string; publicKey?: string;
}
/** Canonical server action body: trimmed {question}, normalized {word}, or {to,tokenId}. */
export async function hashBuyerRequest(action: string, requestBody: JsonRecord) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${action}\n${canonicalJson(requestBody)}`));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
/** Local receipt proof, not a chain/RPC verification or proof of physical delivery. */
export async function verifyBuyerReceipt(receipt: unknown, expected: BuyerReceiptExpectation) {
  const invalid = (reason: string, receiptVerified = false, termsVerified = false) =>
    ({ valid: false, reason, signatureVerified: receiptVerified, receiptVerified, termsVerified, actionVerified: false, chainVerified: false as const });
  try {
    requireReviewedQuote(expected.quote);
    const payer = address(expected.payer);
    if (!isJsonRecord(receipt) || receipt.receipt_schema !== X402_RECEIPT_SPEC || receipt.type !== 'RECEIPT') return invalid('unsupported-receipt');
    const signature = await verifyX402Receipt(receipt, expected.publicKey);
    if (!signature.valid) return invalid('receipt-signature-invalid');
    const settled = isJsonRecord(receipt.settlement) ? receipt.settlement : {};
    const spend = isJsonRecord(receipt.spend) ? receipt.spend : {};
    if (settled.rail !== 'x402' || settled.x402_version !== 2 || settled.scheme !== 'exact'
      || settled.chain_id !== X402_CHAIN_ID || settled.network !== X402_NETWORK
      || !sameAddress(settled.asset, expected.quote.accepted.asset) || settled.asset_symbol !== 'USDC'
      || !sameAddress(settled.pay_to, expected.quote.accepted.payTo) || !sameAddress(settled.payer, payer)
      || settled.amount_units !== expected.quote.amountUnits || settled.gas_payer !== 'facilitator'
      || spend.status !== 'settled' || spend.payee_agent_id !== X402_TREASURY_AGENT_ID
      || typeof settled.tx !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(settled.tx)
      || (expected.transactionHash !== undefined && settled.tx.toLowerCase() !== expected.transactionHash.toLowerCase())) return invalid('receipt-payment-terms-mismatch', true);
    const actionResult = isJsonRecord(receipt.action_result) ? receipt.action_result : {};
    if (!['bench', 'cast', 'claim', 'battler'].includes(expected.action) || new URL(expected.quote.endpoint).pathname !== `/api/agent/${expected.action}`
      || !/^pai_[0-9a-f]{32}$/.test(expected.actionId) || receipt.resource_id !== expected.actionId
      || receipt.request_hash !== await hashBuyerRequest(expected.action, expected.requestBody)
      || actionResult.ok !== true || actionResult.action !== expected.action || actionResult.actionId !== expected.actionId
      || actionResult.actionCompleted === false) return invalid('receipt-action-binding-mismatch', true, true);
    return { valid: true, reason: 'receipt-signature-and-terms-verified', signatureVerified: true, receiptVerified: true, termsVerified: true,
      actionVerified: true, chainVerified: false as const, transactionHash: settled.tx.toLowerCase() };
  } catch { return invalid('invalid-receipt-or-expectation'); }
}
