#!/usr/bin/env node
/**
 * agent-payments-verify — CLI to verify a single receipt's signature.
 *
 * Usage:
 *   npx @pointcast/agent-payments-protocol verify https://pointcast.xyz 0413
 *   npx @pointcast/agent-payments-protocol verify <site> <block_id> [--json]
 *
 * Exit codes:
 *   0  signature valid
 *   1  signature invalid (tampered, wrong key, etc.)
 *   2  unsigned receipt (no cryptographic claim)
 *   3  bad args
 *   4  fetch failure
 */
import { verifyReceiptByUrl } from '../src/discover.mjs';

const [, , siteArg, blockId, ...rest] = process.argv;
const json = rest.includes('--json');

if (!siteArg || !blockId) {
  process.stderr.write(`usage: agent-payments-verify <site_url> <block_id> [--json]\n`);
  process.exit(3);
}

let result;
try {
  result = await verifyReceiptByUrl(siteArg, blockId);
} catch (err) {
  process.stderr.write(`fetch error: ${err.message}\n`);
  process.exit(4);
}

if (json) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} else {
  const icon = result.status === 'valid' ? '✓' : result.status === 'invalid' ? '✗' : '·';
  process.stdout.write(`\n${icon} ${siteArg} /b/${blockId} — ${result.status}: ${result.reason}\n`);
  if (result.block?.spend) {
    const s = result.block.spend;
    process.stdout.write(`   agent:    ${s.agent ?? '?'} (${s.agent_id ?? 'no pcr_id'})\n`);
    process.stdout.write(`   amount:   $${(s.amount_usd ?? 0).toFixed(2)} ${s.currency ?? 'usd'}\n`);
    process.stdout.write(`   merchant: ${s.merchant ?? '?'}\n`);
    process.stdout.write(`   mode:     ${s.mode ?? '?'}\n\n`);
  }
}

const code = result.status === 'valid' ? 0 : result.status === 'invalid' ? 1 : 2;
process.exit(code);
