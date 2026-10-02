// Run from the PointCast checkout with Node 24:
// node docs/nouns-money/agent-service-quickstart.mjs
// Local service demonstration only. No HTTP, x402, payment, wallet, or chain calls.
import assert from 'node:assert/strict';
import {
  approveLocalAgentServiceJob,
  createLocalAgentServiceReceipt,
  createLocalAgentServiceRequest,
  sha256Hex,
} from '../../packages/nouns-money-sdk/src/index.ts';

const request = createLocalAgentServiceRequest({
  scope: 'text-report',
  constraints: { maxOutputBytes: 256, mediaType: 'text/plain' },
  acceptanceTest: 'Compare the returned bytes with the expected local example text.',
  ttlMs: 5 * 60 * 1000,
});

// Job approval is a separate, explicitly local step. It grants no spending authority.
const approval = approveLocalAgentServiceJob(request, { approved: true });
const expected = new TextEncoder().encode('Local service demo result.\n');
const output = new TextEncoder().encode('Local service demo result.\n');

const receipt = await createLocalAgentServiceReceipt({
  request,
  approval,
  providerId: 'local-example-provider',
  resultRef: 'local://artifact/nm-agent-demo-001.txt',
  bytes: output,
  expectedSha256: await sha256Hex(expected),
});

assert.equal(receipt.verification.outcome, 'digest_match');
assert.equal(receipt.verification.semanticTruth, 'not_evaluated');
assert.equal(receipt.serviceStatus, 'result_available');
assert.equal(receipt.acceptanceStatus, 'pending');
assert.equal(receipt.paymentStatus, 'not_requested');
assert.equal(receipt.authenticity, 'unsigned_unverified');
console.log(JSON.stringify({ request, approval, receipt }, null, 2));
