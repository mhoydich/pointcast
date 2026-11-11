// Recompute a saved demo's proofs using public material and known local fixtures.
// This cannot prove where/how the file was created or authenticate a provider.
import { pathToFileURL } from 'node:url';
import { canonicalJSON, participantKeyId, emptyState, decideSubmission } from '../protocol/protocol.mjs';
import { KitError, bindFixtureChallenge, verifyFixtureAnswer } from './client.mjs';
import { MISSION_IDS, loadMission, judgeFixtureAnswer, readBoundedJSON } from './missions.mjs';

export async function inspectDemoReceipt(receipt) {
  if (receipt?.schema !== 'signal-atlas.builder-demo-receipt/v1' || receipt.data_mode !== 'fixture'
    || receipt.eligible_for_live_points !== false || receipt.ranked !== false || receipt.live_points !== 0
    || !Array.isArray(receipt.missions) || receipt.missions.length < 1 || receipt.missions.length > MISSION_IDS.length) throw new KitError('not-an-ineligible-demo-receipt');
  const ids = receipt.missions.map(m => m?.mission_id);
  if (ids.some(id => !MISSION_IDS.includes(id)) || new Set(ids).size !== ids.length) throw new KitError('unknown-or-duplicate-mission');
  let state = emptyState();
  const results = [];
  for (const entry of receipt.missions) {
    const mission = await loadMission(entry.mission_id);
    if (entry.attempt?.public_key !== receipt.participant?.public_key) throw new KitError('receipt-participant-mismatch');
    const publicOnly = { participant_key_id: participantKeyId(entry.attempt.public_key) };
    if (publicOnly.participant_key_id !== receipt.participant.participant_key_id) throw new KitError('receipt-participant-mismatch');
    const expectedChallenge = bindFixtureChallenge(mission.template, mission.dataset, mission.terms, publicOnly);
    if (canonicalJSON(entry.challenge) !== canonicalJSON(expectedChallenge) || entry.fixture_clock !== mission.template.fixture_clock) throw new KitError('receipt-challenge-context-mismatch');
    const proof = verifyFixtureAnswer(entry.attempt, entry.answer, expectedChallenge, Date.parse(mission.template.fixture_clock));
    if (!proof.ok) throw new KitError(proof.code);
    if (!judgeFixtureAnswer(entry.answer, mission.expected).accepted) throw new KitError('fixture-answer-rejected');
    const submission = decideSubmission(state, entry.attempt, expectedChallenge, Date.parse(mission.template.fixture_clock));
    if (submission.status !== 201 || canonicalJSON(submission.receipt) !== canonicalJSON(entry.protocol_submission)) throw new KitError('receipt-submission-mismatch');
    state = submission.nextState;
    results.push({ mission_id: entry.mission_id, valid_fixture_signature: true, known_fixture_answer_matches: true, receipt_id: submission.receipt.receipt_id });
  }
  return { schema: 'signal-atlas.builder-demo-inspection/v1', data_mode: 'fixture', valid_fixture_example: true, eligible_for_live_points: false, provider_affiliation_verified: false, historical_execution_or_network_claims_verified: false, live_points: 0, missions: results, warning: 'Only fixture data, answer digests and key-possession signatures are recomputed. No live enrollment, provider identity or production success is established.' };
}
async function main() {
  try {
    if (process.argv.length !== 3) throw new KitError('one-demo-receipt-file-required');
    const receipt = await readBoundedJSON(process.argv[2], 65536);
    process.stdout.write(JSON.stringify(await inspectDemoReceipt(receipt), null, 2) + '\n');
  } catch (error) {
    process.stderr.write(JSON.stringify({ data_mode: 'fixture', eligible_for_live_points: false, error: error instanceof KitError ? error.code : 'local-file-or-runtime-error' }) + '\n');
    process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
