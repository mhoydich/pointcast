import { open } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { canonicalJSON } from '../protocol/protocol.mjs';
import { KitError } from './client.mjs';

export const MISSION_IDS = Object.freeze(['source-check', 'schema-repair']);
export const KIT_ROOT = new URL('./', import.meta.url);
const MAX_FIXTURE_BYTES = 65_536;
export async function readBoundedJSON(pathOrUrl, maxBytes = 8192) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_FIXTURE_BYTES) throw new KitError('invalid-input-size-limit');
  const file = await open(pathOrUrl, 'r');
  try {
    const buffer = Buffer.alloc(maxBytes + 1);
    let bytesRead = 0;
    while (bytesRead < buffer.length) {
      const chunk = await file.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);
      if (chunk.bytesRead === 0) break;
      bytesRead += chunk.bytesRead;
    }
    if (bytesRead > maxBytes) throw new KitError('input-too-large');
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytesRead))); }
    catch { throw new KitError('invalid-input-json'); }
  } finally { await file.close(); }
}
export async function loadMission(missionId) {
  if (!MISSION_IDS.includes(missionId)) throw new KitError('unknown-mission');
  const file = path => new URL(path, KIT_ROOT);
  const packet = await readBoundedJSON(file(`fixtures/${missionId}.packet.json`), MAX_FIXTURE_BYTES);
  const template = await readBoundedJSON(file(`fixtures/${missionId}.challenge.template.json`));
  const terms = await readBoundedJSON(file('fixtures/terms.fixture.json'));
  const expected = await readBoundedJSON(file(`examples/${missionId}.answer.json`));
  const target_schema = missionId === 'schema-repair' ? await readBoundedJSON(file('fixtures/repair-target.schema.json')) : null;
  if (packet?.fictional !== true || packet?.source_mode !== 'embedded_fixture_only') throw new KitError('fixture-source-required');
  return { missionId, packet, dataset: { packet, target_schema }, template, terms, expected, packetPath: fileURLToPath(file(`fixtures/${missionId}.packet.json`)) };
}
export function solveSourceCheck(packet) {
  const sources = new Map(packet.sources.map(source => [source.source_id, source]));
  const checks = packet.records.map(record => {
    const source = sources.get(record.source_id);
    const fact = source?.facts?.[record.field];
    if (!source || source.availability !== 'embedded' || !fact) return { record_id: record.record_id, status: 'source_unavailable', observed_value: null, source_id: record.source_id, source_url: source?.url ?? null, quote: null };
    if (typeof fact.quote !== 'string' || !source.excerpt.includes(fact.quote)) throw new KitError('fixture-evidence-mismatch');
    return { record_id: record.record_id, status: canonicalJSON(record.claimed_value) === canonicalJSON(fact.value) ? 'supported' : 'mismatch', observed_value: fact.value, source_id: source.source_id, source_url: source.url, quote: fact.quote };
  });
  return { schema: 'signal-atlas.source-check-answer/v1', mission_id: packet.mission_id, checks };
}
function integer(value) {
  if (Number.isSafeInteger(value)) return value;
  if (typeof value === 'string' && /^(?:0|[1-9]\d*)$/.test(value) && Number.isSafeInteger(Number(value))) return Number(value);
  throw new KitError('unsafe-integer-coercion');
}
function boolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new KitError('unsafe-boolean-coercion');
}
export function solveSchemaRepair(packet) {
  const input = packet.record;
  const record = { record_id: input.record_id, item_count: integer(input.item_count), version: integer(input.version), public: boolean(input.public), delivery_day: input.delivery_day, source_id: input.source_id };
  const changes = [];
  for (const key of ['item_count', 'version']) if (typeof input[key] === 'string') changes.push({ path: `/${key}`, action: 'decimal-string-to-integer' });
  if (typeof input.public === 'string') changes.push({ path: '/public', action: 'boolean-literal-to-boolean' });
  for (const key of Object.keys(input).filter(key => !Object.hasOwn(record, key)).sort()) changes.push({ path: `/${key}`, action: 'remove-unapproved-field' });
  return { schema: 'signal-atlas.schema-repair-answer/v1', mission_id: packet.mission_id, record, changes, evidence: { source_id: packet.source.source_id, source_url: packet.source.url, quote: packet.source.excerpt } };
}
export function solveMission(mission) {
  if (mission.missionId === 'source-check') return solveSourceCheck(mission.packet);
  if (mission.missionId === 'schema-repair') return solveSchemaRepair(mission.packet);
  throw new KitError('unknown-mission');
}
// Inspectable expected answers are intentional: this is onboarding practice, not a
// hidden benchmark or a claim about model intelligence. The judge never fetches.
export function judgeFixtureAnswer(answer, expected) {
  try {
    if (Buffer.byteLength(canonicalJSON(answer)) > 8192) return { accepted: false, code: 'answer-too-large' };
    return canonicalJSON(answer) === canonicalJSON(expected)
      ? { accepted: true, code: 'accepted-fixture-only', eligible_for_live_points: false }
      : { accepted: false, code: 'answer-does-not-match-fixture', eligible_for_live_points: false };
  } catch { return { accepted: false, code: 'invalid-answer-json', eligible_for_live_points: false }; }
}
