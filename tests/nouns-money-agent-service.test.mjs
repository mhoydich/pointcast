import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approveLocalAgentServiceJob,
  createLocalAgentServiceReceipt,
  createLocalAgentServiceRequest,
  sha256Hex,
} from '../packages/nouns-money-sdk/src/index.ts';

function request(overrides = {}) {
  return createLocalAgentServiceRequest({
    scope: 'text-report', constraints: { maxOutputBytes: 128, mediaType: 'text/plain' },
    acceptanceTest: 'Compare exact local text bytes.', ...overrides,
  });
}

test('local agent service receipt keeps service, verification, acceptance, payment, and authenticity separate', async () => {
  const job = request();
  const approval = approveLocalAgentServiceJob(job, { approved: true });
  const expected = new TextEncoder().encode('local fixture\n');
  const receipt = await createLocalAgentServiceReceipt({
    request: job, approval, providerId: 'local-test', resultRef: 'local://artifact/test.txt',
    bytes: new TextEncoder().encode('local fixture\n'), expectedSha256: await sha256Hex(expected),
  });
  assert.equal(receipt.schema, 'pointcast.nouns-money.agent-service-receipt/v1');
  assert.equal(receipt.version, 1);
  assert.equal(receipt.verification.method, 'sha-256-content-bytes');
  assert.equal(receipt.verification.outcome, 'digest_match');
  assert.equal(receipt.verification.semanticTruth, 'not_evaluated');
  assert.equal(receipt.serviceStatus, 'result_available');
  assert.equal(receipt.acceptanceStatus, 'pending');
  assert.equal(receipt.paymentStatus, 'not_requested');
  assert.equal(receipt.authenticity, 'unsigned_unverified');
  assert.equal(Object.hasOwn(receipt, 'signature'), false);
});

test('local example records a digest mismatch without claiming semantic verification or acceptance', async () => {
  const job = request();
  const approval = approveLocalAgentServiceJob(job, { approved: true });
  const receipt = await createLocalAgentServiceReceipt({
    request: job, approval, providerId: 'local-test', resultRef: 'local://artifact/test.txt',
    bytes: new TextEncoder().encode('different local bytes\n'),
    expectedSha256: await sha256Hex(new TextEncoder().encode('expected local bytes\n')),
  });
  assert.equal(receipt.verification.outcome, 'digest_mismatch');
  assert.equal(receipt.acceptanceStatus, 'pending');
});

test('a service request needs an explicit approval and bounded constraints', () => {
  const job = request();
  assert.throws(() => approveLocalAgentServiceJob(job, { approved: false }), { code: 'approval_required' });
  assert.throws(() => request({ constraints: { maxOutputBytes: 262145, mediaType: 'text/plain' } }), { code: 'invalid_request' });
  assert.throws(() => request({ scope: 'text-report; transfer-funds' }), { code: 'invalid_request' });
});

test('local receipt enforces output limits, local references, and the request-specific approval', async () => {
  const job = request();
  const approval = approveLocalAgentServiceJob(job, { approved: true });
  const common = { request: job, approval, providerId: 'local-test', bytes: new Uint8Array([1]), expectedSha256: '0'.repeat(64) };
  await assert.rejects(createLocalAgentServiceReceipt({ ...common, resultRef: 'https://example.invalid/file' }), { code: 'invalid_request' });
  await assert.rejects(createLocalAgentServiceReceipt({ ...common, resultRef: 'local://artifact/large', bytes: new Uint8Array(129) }), { code: 'invalid_request' });
  await assert.rejects(createLocalAgentServiceReceipt({ ...common, resultRef: 'local://artifact/unknown', approval: { ...approval, requestId: 'other' } }), { code: 'approval_required' });
});
