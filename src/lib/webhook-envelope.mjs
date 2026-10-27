/** Browser-local synthetic fixtures only: no network, storage, publication, or authority. */
const keys = ['version', 'event_id', 'event_type', 'occurred_at', 'source', 'subject_id', 'subject_revision'];
const safeId = /^[a-zA-Z0-9_-]{1,80}$/;
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const fixtures = {
  'pointcast.source.accepted.v1': {
    subject: 'subject_demo_001',
    input: { title: 'Fictional garden brief', excerpt: 'A fictional neighborhood group imagines a shared garden.', url: 'https://example.org/fictional-garden-brief' },
    render(input) { return { kind: 'story_draft_and_evidence', label: 'Fictional fixture; not published', draft: { title: 'A little garden for the block', body: `${input.excerpt} This is a synthetic draft for the demo, not reporting.` }, evidence: [{ title: input.title, source: input.url, status: 'synthetic; not verified' }], publication: 'requires human review' }; },
  },
  'pointcast.story.corrected.v1': {
    subject: 'subject_demo_002',
    input: { original_revision: 1, corrected_revision: 2, original: 'The fictional workshop was listed for Friday.', corrected: 'The fictional workshop is listed for Saturday.', dependents: ['/fictional-story/', '/fictional-story.json'] },
    render(input) { return { kind: 'correction_diff', label: 'Fictional fixture; no page changed', original_revision: input.original_revision, corrected_revision: input.corrected_revision, changes: input.original === input.corrected ? [] : [{ before: input.original, after: input.corrected }], affected_pages: [...input.dependents], original_preserved: input.original, publication: 'review required' }; },
  },
  'elsegundo.event.cancelled.v1': {
    subject: 'subject_demo_017',
    input: { event: 'Imaginary seed swap', prior: 'scheduled', observed: 'cancelled', scheduled_for: '2026-11-07T18:00:00Z', observed_at: '2026-10-27T12:00:00Z', source: 'https://example.org/fictional-event-notice' },
    render(input) { return { kind: 'cancellation_card', label: 'Fictional fixture; not a real local event', event: input.event, old_status: input.prior, new_status: input.observed, changed: input.prior !== input.observed, scheduled_for: input.scheduled_for, observed_at: input.observed_at, claimed_source: input.source, source_status: 'synthetic; verify before any use' }; },
  },
  'industrynext.opportunity.expired.v1': {
    subject: 'subject_demo_028',
    input: { as_of: '2026-10-27T12:00:00Z', opportunities: [{ id: 'demo-opening-a', deadline: '2026-10-26T12:00:00Z' }, { id: 'demo-opening-b', deadline: '2026-11-01T12:00:00Z' }] },
    render(input) { const cutoff = Date.parse(input.as_of); const expired = input.opportunities.filter(item => Date.parse(item.deadline) <= cutoff).map(item => ({ ...item, status: 'expired' })); const current = input.opportunities.filter(item => Date.parse(item.deadline) > cutoff).map(item => ({ ...item, status: 'within fixture deadline; unverified' })); return { kind: 'opportunity_filter', label: 'Fictional fixtures; not job listings', as_of: input.as_of, expired, current, current_count: current.length, note: 'Expiry is a catalog state; it does not mean a role was filled.' }; },
  },
  'image-archive.image.accepted.v1': {
    subject: 'subject_demo_041',
    input: { asset_id: 'demo-image-001', creator_claim: 'Example studio', source: 'https://example.org/fictional-image', tool: 'unknown', rights_status: 'unknown' },
    render(input) { return { kind: 'provenance_manifest', label: 'Fictional fixture; no image uploaded', ...input, publication_status: input.rights_status === 'approved' ? 'review_required' : 'hold', description: 'Awaiting human review', note: 'Unknown rights block publication; a provenance claim does not establish ownership.' }; },
  },
};
export function getFixtureInput(contractId) {
  const fixture = fixtures[contractId];
  return fixture ? JSON.parse(JSON.stringify(fixture.input)) : null;
}
export function validateEnvelope(value, contract) {
  if (!contract || !value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'Expected an object and a known contract.' };
  if (Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) return { ok: false, error: 'Envelope fields do not match the contract.' };
  if (value.version !== '1' || value.event_type !== contract.id || value.source !== contract.example.source) return { ok: false, error: 'Version, event type, or source does not match.' };
  if (typeof value.event_id !== 'string' || typeof value.subject_id !== 'string' || !safeId.test(value.event_id) || !safeId.test(value.subject_id)) return { ok: false, error: 'IDs must contain only letters, numbers, underscores or hyphens, up to 80 characters.' };
  if (!Number.isSafeInteger(value.subject_revision) || value.subject_revision < 1 || value.subject_revision > 1000000) return { ok: false, error: 'Subject revision must be an integer between 1 and 1000000.' };
  if (typeof value.occurred_at !== 'string' || !timestamp.test(value.occurred_at) || (!Number.isFinite(Date.parse(value.occurred_at)) || new Date(value.occurred_at).toISOString().slice(0, 19) !== value.occurred_at.slice(0, 19))) return { ok: false, error: 'Use a UTC timestamp.' };
  return { ok: true };
}
export function createDemoSession(contracts) {
  if (!Array.isArray(contracts) || contracts.length !== 100 || new Set(contracts.map(c => c.id)).size !== 100) throw new Error('Expected the known 100-contract registry.');
  const registry = new Map(contracts.map(c => [c.id, c]));
  const seen = new Map();
  const revisions = new Map();
  return {
    reset() { seen.clear(); revisions.clear(); },
    run(text, contractId) {
      const contract = registry.get(contractId);
      if (!contract) return { ok: false, error: 'Unknown contract.' };
      if (typeof text !== 'string' || new TextEncoder().encode(text).length > 4096) return { ok: false, error: 'Example must be 4 KB or smaller.' };
      let value;
      try { value = JSON.parse(text); } catch { return { ok: false, error: 'Enter valid JSON.' }; }
      const validation = validateEnvelope(value, contract);
      if (!validation.ok) return validation;
      const receipt = { status: 'simulated', action_outcome: 'not_implemented', contract_id: contract.id, event_id: value.event_id, subject_revision: value.subject_revision, authority: 'none', evidence: 'synthetic', action: contract.action };
      const fixture = fixtures[contract.id];
      if (!fixture) return { ok: true, receipt, message: 'Validation only. This domain action is not implemented. No event was sent.' };
      if (value.subject_id !== fixture.subject) return { ok: false, error: 'This action only supports its named synthetic fixture subject.' };
      const identity = `${value.source}:${value.event_id}`;
      const fingerprint = JSON.stringify(keys.map(key => value[key]));
      if (seen.has(identity)) {
        if (seen.get(identity) !== fingerprint) return { ok: false, error: 'Event ID conflict: the same source and ID already had different content.' };
        return { ok: true, receipt: { ...receipt, action_outcome: 'duplicate_suppressed' }, message: 'Duplicate suppressed in this browser session. No event was sent.' };
      }
      const subject = `${value.source}:${value.subject_id}`;
      if (revisions.has(subject) && value.subject_revision <= revisions.get(subject)) return { ok: false, error: 'Stale or repeated subject revision; no artifact was produced.' };
      if (value.subject_revision !== 2) return { ok: false, error: 'Only revision 2 of this synthetic fixture is implemented.' };
      if (seen.size >= 1000) return { ok: false, error: 'Demo session is full. Reset it to continue.' };
      // Clone the fixed artifact before committing the in-memory claim. No I/O or public effects.
      const artifact = fixture.render(fixture.input);
      seen.set(identity, fingerprint);
      revisions.set(subject, value.subject_revision);
      return { ok: true, receipt: { ...receipt, action_outcome: 'synthetic_artifact_created', artifact_location: 'browser memory only' }, artifact, message: 'Synthetic artifact created locally. No event was sent or published.' };
    },
  };
}
