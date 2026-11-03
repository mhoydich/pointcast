import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  UES_COMPLETION_RECEIPT_SCHEMA,
  UES_COMPLETION_RECEIPT_SCHEMA_URL,
} from '../src/lib/ues-completion-receipt-schema.mjs';
import {
  createCompletionReceipt,
  createProgress,
  setFinalOutcome,
  setWeekComplete,
} from '../src/lib/ues-progress.mjs';

import { UES_COMPLETION_RECEIPT_V2, UES_COMPLETION_RECEIPT_V2_URL } from '../src/lib/ues-completion-receipt-v2.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('new receipts identify v2 while the immutable v1 contract is preserved', () => {
  let progress = createProgress('UES-201');
  for (const module of [1, 2, 4, 6]) {
    progress = setWeekComplete(progress, module, true, '2026-07-18T16:00:00.000Z');
  }
  progress = setFinalOutcome(progress, true, '2026-07-18T17:00:00.000Z');

  const receipt = createCompletionReceipt(progress);
  assert.equal(UES_COMPLETION_RECEIPT_SCHEMA.properties.attestation.const, 'Self-attested by the learner; no identity was collected or verified.');
  assert.equal(UES_COMPLETION_RECEIPT_SCHEMA.$id, UES_COMPLETION_RECEIPT_SCHEMA_URL);
  assert.equal(receipt.attestation, UES_COMPLETION_RECEIPT_V2.properties.attestation.const);
  assert.equal(receipt.schema, UES_COMPLETION_RECEIPT_V2_URL);
  assert.equal(UES_COMPLETION_RECEIPT_V2.$id, receipt.schema);
  assert.equal(UES_COMPLETION_RECEIPT_SCHEMA.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(UES_COMPLETION_RECEIPT_SCHEMA.additionalProperties, false);
  assert.deepEqual(UES_COMPLETION_RECEIPT_SCHEMA.properties.courseTitle, {
    type: 'string',
    minLength: 1,
    description: 'The public catalog title added by the course room when the receipt is downloaded.',
  });
  assert.equal(UES_COMPLETION_RECEIPT_SCHEMA.properties.courseUrl.format, 'uri');
  assert.deepEqual(
    Object.keys(receipt).sort(),
    [...UES_COMPLETION_RECEIPT_SCHEMA.required].sort(),
  );
});

test('the schema has an exact public JSON endpoint with durable media headers', async () => {
  const route = await read('../src/pages/ues/completion-receipt/v1.json.ts');

  assert.match(route, /UES_COMPLETION_RECEIPT_SCHEMA/);
  assert.match(route, /application\/json; charset=utf-8/);
  assert.match(route, /Cache-Control': 'public, max-age=86400, immutable'/);
  assert.match(route, /Access-Control-Allow-Origin': '\*'/);
});
