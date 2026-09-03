#!/usr/bin/env node

/**
 * Reference payer for PointCast's Etherlink x402 v2 Permit2 endpoint.
 *
 * Dry run (quotes exact live terms; does not sign or pay):
 *   node scripts/x402-client-example.mjs
 *
 * Pay only when you deliberately provide a funded payer key:
 *   X402_PAYER_SK=0x... node scripts/x402-client-example.mjs
 *
 * The payer must hold the quoted USDC asset on Etherlink and must already
 * have granted the canonical Permit2 contract sufficient ERC-20 allowance.
 * X402_PAYER_SK is used in memory for signing and is never printed.
 */

import { getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const DEFAULT_ENDPOINT = 'https://pointcast.xyz/api/x402/receipt';
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const X402_PROXY = '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E';
const EXPECTED_NETWORK = 'eip155:42793';
const CHAIN_ID = 42793;

const endpoint = process.argv[2] || process.env.X402_URL || DEFAULT_ENDPOINT;
const verifyEndpoint = process.env.X402_VERIFY_URL || new URL('/api/x402/verify', endpoint).href;

function decodeBase64Json(value) {
  return JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
}

function encodeBase64Json(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
}

function normalizePrivateKey(value) {
  const key = value.startsWith('0x') ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error('X402_PAYER_SK must be a 32-byte hex private key');
  return key;
}

function nonce256() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
}

async function quote() {
  const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
  if (response.status !== 402) {
    throw new Error(`Expected HTTP 402 from ${endpoint}; received ${response.status}`);
  }
  const encoded = response.headers.get('Payment-Required');
  if (!encoded) throw new Error('402 response did not include Payment-Required');
  const paymentRequired = decodeBase64Json(encoded);
  const accepted = paymentRequired.accepts?.[0];
  if (!accepted) throw new Error('Payment-Required did not advertise an accepted payment method');
  if (paymentRequired.x402Version !== 2 || accepted.scheme !== 'exact') {
    throw new Error('This example only supports x402 v2 scheme exact');
  }
  if (accepted.network !== EXPECTED_NETWORK) throw new Error(`Unsupported network: ${accepted.network}`);
  if (accepted.extra?.assetTransferMethod !== 'permit2') {
    throw new Error(`Unsupported assetTransferMethod: ${accepted.extra?.assetTransferMethod}`);
  }
  return { paymentRequired, accepted };
}

const { paymentRequired, accepted } = await quote();
console.log('PointCast x402 terms (decoded from the live 402):');
console.log(JSON.stringify({
  endpoint,
  x402Version: paymentRequired.x402Version,
  accepted,
  permit2: PERMIT2,
  permit2ProxySpender: X402_PROXY,
}, null, 2));

if (!process.env.X402_PAYER_SK) {
  console.log('\nDRY RUN — X402_PAYER_SK is unset. No payload was signed and no payment was submitted.');
  process.exit(0);
}

const account = privateKeyToAccount(normalizePrivateKey(process.env.X402_PAYER_SK));
const now = Math.floor(Date.now() / 1000);
const timeout = Number(accepted.maxTimeoutSeconds || 60);
if (!Number.isSafeInteger(timeout) || timeout <= 0) throw new Error('Invalid maxTimeoutSeconds in quoted terms');

const nonce = nonce256();
const deadline = BigInt(now + timeout);
const validAfter = BigInt(now);
const amount = BigInt(String(accepted.amount));
const token = getAddress(accepted.asset);
const payTo = getAddress(accepted.payTo);
const spender = getAddress(X402_PROXY);

const permit2Authorization = {
  from: account.address,
  permitted: { token, amount: amount.toString() },
  spender,
  nonce: nonce.toString(),
  deadline: deadline.toString(),
  witness: { to: payTo, validAfter: validAfter.toString(), extra: '0x' },
};

const signature = await account.signTypedData({
  domain: { name: 'Permit2', chainId: CHAIN_ID, verifyingContract: getAddress(PERMIT2) },
  types: {
    PermitWitnessTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'witness', type: 'Witness' },
    ],
    TokenPermissions: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    Witness: [
      { name: 'to', type: 'address' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'extra', type: 'bytes' },
    ],
  },
  primaryType: 'PermitWitnessTransferFrom',
  message: {
    permitted: { token, amount },
    spender,
    nonce,
    deadline,
    witness: { to: payTo, validAfter, extra: '0x' },
  },
});

const paymentPayload = {
  x402Version: 2,
  scheme: accepted.scheme,
  network: accepted.network,
  accepted,
  resource: paymentRequired.resource,
  payload: { signature, permit2Authorization },
};

console.log(`\nSubmitting Payment-Signature for payer ${account.address} (private key and signature are not logged).`);
const paid = await fetch(endpoint, {
  headers: {
    accept: 'application/json',
    'Payment-Signature': encodeBase64Json(paymentPayload),
  },
});
const receiptText = await paid.text();
let receipt;
try {
  receipt = JSON.parse(receiptText);
} catch {
  throw new Error(`Payment request returned ${paid.status} with non-JSON body: ${receiptText.slice(0, 500)}`);
}
if (!paid.ok) throw new Error(`Payment request failed (${paid.status}): ${JSON.stringify(receipt)}`);

console.log('\nCountersigned PointCast receipt:');
console.log(JSON.stringify(receipt, null, 2));

const verified = await fetch(verifyEndpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json', accept: 'application/json' },
  body: JSON.stringify({ receipt: encodeBase64Json(receipt) }),
});
const verification = await verified.json();
console.log('\nPointCast verification:');
console.log(JSON.stringify(verification, null, 2));
if (!verified.ok || verification.valid !== true) throw new Error('PointCast receipt verification failed');
