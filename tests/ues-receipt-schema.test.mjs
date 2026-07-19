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

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('completion receipts identify the public immutable v1 JSON Schema', () => {
  let progress = createProgress('UES-201');
  for (const module of [1, 2, 4, 6]) {
    progress = setWeekComplete(progress, module, true, '2026-07-18T16:00:00.000Z');
  }
  progress = setFinalOutcome(progress, true, '2026-07-18T17:00:00.000Z');

  const receipt = createCompletionReceipt(progress);
  assert.equal(receipt.schema, UES_COMPLETION_RECEIPT_SCHEMA_URL);
  assert.equal(UES_COMPLETION_RECEIPT_SCHEMA.$id, receipt.schema);
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

test('the schema has an exact extensionless public endpoint with schema media headers', async () => {
  const route = await read('../src/pages/ues/completion-receipt/v1.ts');

  assert.match(route, /UES_COMPLETION_RECEIPT_SCHEMA/);
  assert.match(route, /application\/schema\+json; charset=utf-8/);
  assert.match(route, /Cache-Control': 'public, max-age=86400, immutable'/);
  assert.match(route, /Access-Control-Allow-Origin': '\*'/);
});
