import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateEnvelope, createDemoSession, getFixtureInput } from '../src/lib/webhook-envelope.mjs';
const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/webhook-catalog.json', import.meta.url)));
const find = id => catalog.contracts.find(c => c.id === id);
const run = (session, c, value = c.example) => session.run(JSON.stringify(value), c.id);
const ids = ['pointcast.source.accepted.v1', 'pointcast.story.corrected.v1', 'elsegundo.event.cancelled.v1', 'industrynext.opportunity.expired.v1', 'image-archive.image.accepted.v1'];
test('100 distinct planned, unconfigured contracts; exactly five fixture actions', () => {
  assert.equal(catalog.contracts.length, 100);
  assert.equal(new Set(catalog.contracts.map(c => c.id)).size, 100);
  assert.deepEqual(catalog.contracts.filter(c => c.demoAction === 'implemented_fixture_only').map(c => c.id), ids);
  const session = createDemoSession(catalog.contracts);
  for (const c of catalog.contracts) {
    assert.equal(c.status, 'planned'); assert.equal(c.connection, 'disabled');
    assert.equal(c.implementation, 'proposed'); assert.equal(c.configuration, 'not_configured');
    assert.equal(validateEnvelope(c.example, c).ok, true, c.id);
    const result = run(session, c);
    assert.equal(result.ok, true, c.id);
    assert.equal(result.receipt.status, 'simulated');
    assert.equal(result.receipt.action_outcome, ids.includes(c.id) ? 'synthetic_artifact_created' : 'not_implemented');
    assert.ok(new RegExp(c.schema.properties.occurred_at.pattern).test(c.example.occurred_at));
    for (const key of ['source','destination','triggerType','dependencies','privacy','approval','deduplication','cost','schema']) assert.ok(c[key], `${c.id}: ${key}`);
  }
});
test('five fictional fixtures create specific, bounded artifacts', () => {
  const session = createDemoSession(catalog.contracts);
  const [draft, correction, cancellation, expiry, provenance] = ids.map(id => run(session, find(id)).artifact);
  assert.match(draft.draft.body, /fictional neighborhood group/i);
  assert.equal(draft.evidence[0].source, getFixtureInput(ids[0]).url);
  assert.equal(draft.publication, 'requires human review');
  assert.equal(correction.changes[0].before, getFixtureInput(ids[1]).original);
  assert.equal(correction.changes[0].after, getFixtureInput(ids[1]).corrected);
  assert.deepEqual(correction.affected_pages, ['/fictional-story/', '/fictional-story.json']);
  assert.equal(correction.original_preserved, correction.changes[0].before);
  assert.equal(cancellation.old_status, 'scheduled'); assert.equal(cancellation.new_status, 'cancelled');
  assert.equal(cancellation.changed, true); assert.equal(cancellation.observed_at, '2026-10-27T12:00:00Z');
  assert.equal(expiry.current_count, 1); assert.deepEqual(expiry.expired.map(x => x.id), ['demo-opening-a']);
  assert.deepEqual(expiry.current.map(x => x.id), ['demo-opening-b']);
  assert.equal(provenance.rights_status, 'unknown'); assert.equal(provenance.publication_status, 'hold');
  assert.match(provenance.label, /Fictional/);
});
test('duplicate is suppressed, conflicting ID and stale revision fail; reset enables replay', () => {
  const c = find(ids[0]); const session = createDemoSession(catalog.contracts);
  const first = run(session, c); assert.equal(first.receipt.action_outcome, 'synthetic_artifact_created');
  const duplicate = run(session, c); assert.equal(duplicate.receipt.action_outcome, 'duplicate_suppressed'); assert.equal(duplicate.artifact, undefined);
  assert.match(run(session, c, {...c.example, occurred_at:'2026-10-27T12:01:00Z'}).error, /conflict/i);
  assert.match(run(session, c, {...c.example, event_id:'evt_other', subject_revision:1}).error, /stale/i);
  assert.match(run(session, c, {...c.example, event_id:'evt_other', subject_revision:2}).error, /stale/i);
  session.reset(); assert.deepEqual(run(session, c).artifact, first.artifact);
});
test('validation fails closed for malformed, unknown, mismatched, oversized and unsupported input', () => {
  const c = find(ids[0]); const base = c.example; const session = createDemoSession(catalog.contracts);
  for (const value of [{...base, private_data:'x'}, {...base, event_type:'unknown'}, {...base, source:'other'}, {...base, event_id:'../../secret'}, {...base, occurred_at:'now'}, {...base, occurred_at:'2026-02-30T12:00:00Z'}, {...base, version:'2'}, {...base, subject_revision:0}, {...base, subject_revision:'2'}]) assert.equal(run(session, c, value).ok, false);
  assert.equal(session.run('{',c.id).ok,false);
  assert.equal(session.run(' '.repeat(4097),c.id).ok,false);
  assert.equal(session.run(JSON.stringify(base),'unknown.v1').ok,false);
  assert.equal(run(session, c, {...base, subject_id:'other'}).ok,false);
  assert.equal(run(session, c, {...base, subject_revision:3}).ok,false);
  for (const timestamp of ['2026-10-27T12:00:00+00:00', '2026-10-27T12:00:00.1234Z']) {
    assert.equal(validateEnvelope({...base, occurred_at: timestamp}, c).ok, false);
    assert.equal(new RegExp(c.schema.properties.occurred_at.pattern).test(timestamp), false);
  }
});
test('fixture execution makes no network calls and fixture inputs are isolated copies', () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('Unexpected network'); };
  try {
    const session = createDemoSession(catalog.contracts);
    const input = getFixtureInput(ids[0]); input.excerpt = 'tampered';
    assert.notEqual(getFixtureInput(ids[0]).excerpt, 'tampered');
    for (const id of ids) assert.equal(run(session, find(id)).ok,true);
    assert.equal(calls,0);
  } finally { globalThis.fetch = original; }
});
