#!/usr/bin/env node
/**
 * Payer for the SANDBOX Haggle Counter rail: test USDC on Base Sepolia only.
 * This is the client half of the agent-pays-agent practice loop in
 * docs/bot-to-bot/README.md (Shwa haggles with Gus, then pays Frog's testnet
 * address through /api/agent/haggle-pay-sandbox).
 *
 * Dry run (default; quotes the terms and checks them, signs nothing):
 *   node scripts/x402-sandbox-client.mjs h_abc123
 *
 * Practice pay, only with a TESTNET key holding faucet test USDC:
 *   X402_SANDBOX_PAYER_SK=0x... node scripts/x402-sandbox-client.mjs h_abc123 --pay
 *
 * Guards, all enforced here before anything is signed:
 *   - network must be Base Sepolia (eip155:84532), asset the test USDC contract
 *   - amount at most $1 (1,000,000 atomic units), scheme "exact"
 *   - only that network is registered with the x402 client, and its spend
 *     controls cap every payment at $1
 * The key is read from the environment, used in memory, and never printed.
 * Override the endpoint with X402_SANDBOX_URL (for a local `wrangler pages dev`).
 */
import { pathToFileURL } from 'node:url';
import { x402Client, wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';

export const SANDBOX = Object.freeze({
  network: 'eip155:84532',
  asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  maxUnits: 1_000_000,
  endpoint: 'https://pointcast.xyz/api/agent/haggle-pay-sandbox',
});

/** Reasons a quoted requirement is not the sandbox rail; empty when it is. */
export function sandboxTermsProblems(req) {
  const problems = [];
  if (!req || typeof req !== 'object') return ['no payment terms'];
  if (req.network !== SANDBOX.network) problems.push(`network ${req.network} is not Base Sepolia (${SANDBOX.network})`);
  if (String(req.asset ?? '').toLowerCase() !== SANDBOX.asset.toLowerCase()) problems.push(`asset ${req.asset} is not the test USDC contract`);
  if (req.scheme !== 'exact') problems.push(`scheme ${req.scheme} is not exact`);
  const units = Number(req.amount);
  if (!Number.isSafeInteger(units) || units <= 0) problems.push(`amount ${req.amount} is not a positive whole number`);
  else if (units > SANDBOX.maxUnits) problems.push(`amount $${(units / 1e6).toFixed(2)} is over the $1 cap`);
  return problems;
}

/** x402 policy: drop every requirement that is not the sandbox rail. */
export const sandboxOnly = (_version, reqs) => reqs.filter((r) => sandboxTermsProblems(r).length === 0);

export const decodeTerms = (res) => {
  const header = res.headers.get('payment-required');
  return header ? JSON.parse(Buffer.from(header, 'base64').toString('utf8')) : null;
};

/** A fetch that can only ever pay the sandbox rail, at most $1 a call. */
export function sandboxPayingFetch(fetchImpl, signer) {
  const client = x402Client.fromConfig({
    schemes: [{ network: SANDBOX.network, client: new ExactEvmScheme(signer) }],
    policies: [sandboxOnly],
    spendControls: {
      maxAmountPerPayment: '$1',
      allowedAssets: [{ network: SANDBOX.network, asset: SANDBOX.asset, maxAmountPerPayment: String(SANDBOX.maxUnits) }],
    },
  });
  return wrapFetchWithPayment(fetchImpl, client);
}

const request = (session) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ session }),
});

/** Quote only. Returns { ok, status, terms, problems }. Signs nothing. */
export async function quote(session, { endpoint = SANDBOX.endpoint, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(endpoint, request(session));
  if (res.status !== 402) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, status: res.status, body, problems: [body.error ?? `expected a 402 quote, got ${res.status}`] };
  }
  const terms = decodeTerms(res);
  const accepts = terms?.accepts ?? [];
  const problems = accepts.length ? (accepts.map(sandboxTermsProblems).find((p) => p.length === 0) ? [] : sandboxTermsProblems(accepts[0])) : ['the 402 carried no terms'];
  return { ok: problems.length === 0, status: 402, terms, problems };
}

/** Quote, check, then pay through the guarded client. */
export async function pay(session, signer, { endpoint = SANDBOX.endpoint, fetchImpl = fetch } = {}) {
  const q = await quote(session, { endpoint, fetchImpl });
  if (!q.ok) return { ok: false, stage: 'quote', ...q };
  const paidFetch = sandboxPayingFetch(fetchImpl, signer);
  const res = await paidFetch(endpoint, request(session));
  const body = await res.json().catch(() => ({}));
  const header = res.headers.get('payment-response');
  const settlement = header ? decodePaymentResponseHeader(header) : null;
  return { ok: res.ok && body.ok === true, stage: 'pay', status: res.status, body, settlement };
}

async function main(argv) {
  const session = argv.find((a) => /^h_[A-Za-z0-9_-]{1,38}$/.test(a));
  if (!session) {
    console.error('Usage: node scripts/x402-sandbox-client.mjs h_<session> [--pay]');
    return 2;
  }
  const endpoint = process.env.X402_SANDBOX_URL || SANDBOX.endpoint;
  if (!argv.includes('--pay')) {
    const q = await quote(session, { endpoint });
    console.log(JSON.stringify({ dryRun: true, endpoint, status: q.status, ok: q.ok, problems: q.problems, accepts: q.terms?.accepts ?? null, body: q.body ?? null }, null, 2));
    return q.ok ? 0 : 1;
  }
  const sk = (process.env.X402_SANDBOX_PAYER_SK ?? '').trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(sk)) {
    console.error('Set X402_SANDBOX_PAYER_SK to a Base Sepolia test key (0x + 64 hex). Never a mainnet key.');
    return 2;
  }
  const { privateKeyToAccount } = await import('viem/accounts');
  const account = privateKeyToAccount(sk);
  const result = await pay(session, account, { endpoint });
  console.log(JSON.stringify({ payer: account.address, ...result }, null, 2));
  return result.ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (err) => { console.error(err?.message ?? err); process.exit(1); });
}
