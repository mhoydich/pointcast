import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateEnvelope, previewEnvelope } from '../src/lib/webhook-envelope.mjs';
const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/webhook-catalog.json', import.meta.url)));
test('catalog has 100 distinct, explicitly disabled contracts and valid examples', () => {
  assert.equal(catalog.contracts.length, 100);
  assert.equal(new Set(catalog.contracts.map(c => c.id)).size, 100);
  for (const c of catalog.contracts) {
    assert.equal(c.status, 'planned'); assert.equal(c.connection, 'disabled');
    assert.equal(validateEnvelope(c.example, c).ok, true, c.id);
    const preview = previewEnvelope(JSON.stringify(c.example), c);
    assert.equal(preview.ok, true, c.id);
    assert.equal(preview.receipt.status, 'simulated');
    assert.equal(preview.receipt.action_outcome, 'not_implemented');
    assert.ok(new RegExp(c.schema.properties.occurred_at.pattern).test(c.example.occurred_at));
    for (const key of ['source','destination','triggerType','dependencies','privacy','approval','deduplication','cost','schema']) assert.ok(c[key], `${c.id}: ${key}`);
  }
});
test('validator rejects unknown fields, mismatches, bad identifiers and timestamps', () => {
  const c = catalog.contracts[0]; const base = c.example;
  for (const value of [{...base, private_data:'x'}, {...base, event_type:'unknown'}, {...base, source:'other'}, {...base, event_id:'../../secret'}, {...base, occurred_at:'now'}, {...base, occurred_at:'2026-02-30T12:00:00Z'}, {...base, version:'2'}]) assert.equal(validateEnvelope(value,c).ok,false);
  assert.equal(validateEnvelope(base, null).ok,false);
});
test('preview is bounded, fail closed, and does not deliver', () => {
  const c = catalog.contracts[0];
  assert.equal(previewEnvelope('{',c).ok,false);
  for (const timestamp of ['2026-10-27T12:00:00+00:00', '2026-10-27T12:00:00.1234Z']) {
    assert.equal(validateEnvelope({...c.example, occurred_at: timestamp}, c).ok, false);
    assert.equal(new RegExp(c.schema.properties.occurred_at.pattern).test(timestamp), false);
  }
  assert.equal(previewEnvelope(' '.repeat(4097),c).ok,false);
  assert.match(previewEnvelope(JSON.stringify(c.example),c).message,/No event was sent/);
});
