/** Offline envelope validator and preview. This module never sends or receives events. */
const keys = ['version', 'event_id', 'event_type', 'occurred_at', 'source', 'subject_id'];
const safeId = /^[a-zA-Z0-9_-]{1,80}$/;
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
export function validateEnvelope(value, contract) {
  if (!contract || !value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'Expected an object and a known contract.' };
  if (Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) return { ok: false, error: 'Envelope fields do not match the contract.' };
  if (value.version !== '1' || value.event_type !== contract.id || value.source !== contract.example.source) return { ok: false, error: 'Version, event type, or source does not match.' };
  if (typeof value.event_id !== 'string' || typeof value.subject_id !== 'string' || !safeId.test(value.event_id) || !safeId.test(value.subject_id)) return { ok: false, error: 'IDs must contain only letters, numbers, underscores or hyphens, up to 80 characters.' };
  if (typeof value.occurred_at !== 'string' || !timestamp.test(value.occurred_at) || (!Number.isFinite(Date.parse(value.occurred_at)) || new Date(value.occurred_at).toISOString().slice(0, 19) !== value.occurred_at.slice(0, 19))) return { ok: false, error: 'Use a UTC timestamp.' };
  return { ok: true };
}
export function previewEnvelope(text, contract) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 4096) return { ok: false, error: 'Example must be 4 KB or smaller.' };
  let value;
  try { value = JSON.parse(text); } catch { return { ok: false, error: 'Enter valid JSON.' }; }
  const result = validateEnvelope(value, contract);
  if (!result.ok) return result;
  return { ok: true, receipt: { status: 'simulated', action_outcome: 'not_implemented', contract_id: contract.id, event_id: value.event_id, action: contract.action }, message: `Simulated receipt for ${contract.id}. The domain action is not implemented: ${contract.action}. No event was sent.` };
}
