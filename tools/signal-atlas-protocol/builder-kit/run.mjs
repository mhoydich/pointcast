import { pathToFileURL } from 'node:url';
import { canonicalJSON, sha256, emptyState, decideSubmission, scoreTasks } from '../protocol/protocol.mjs';
import { createEphemeralSigner, bindFixtureChallenge, buildSignedFixtureAttempt, verifyFixtureAnswer, KitError } from './client.mjs';
import { MISSION_IDS, loadMission, solveMission, judgeFixtureAnswer, readBoundedJSON } from './missions.mjs';

export async function runFixtureExample({ missionIds = MISSION_IDS, answers = {} } = {}) {
  if (!Array.isArray(missionIds) || missionIds.length < 1 || missionIds.some(id => !MISSION_IDS.includes(id)) || new Set(missionIds).size !== missionIds.length) throw new KitError('unknown-or-duplicate-mission');
  const signer = createEphemeralSigner();
  let state = emptyState();
  const missions = [], fixtureEvents = [], allowedTasks = [];
  for (const missionId of missionIds) {
    const mission = await loadMission(missionId);
    const challenge = bindFixtureChallenge(mission.template, mission.dataset, mission.terms, signer);
    const fixtureClock = Date.parse(mission.template.fixture_clock);
    const answer = Object.hasOwn(answers, missionId) ? answers[missionId] : solveMission(mission);
    const attempt = buildSignedFixtureAttempt({ challenge, answer, signer, attemptId: `builder-${missionId}-attempt-001` });
    const proof = verifyFixtureAnswer(attempt, answer, challenge, fixtureClock);
    if (!proof.ok) throw new KitError(proof.code);
    const submission = decideSubmission(state, attempt, challenge, fixtureClock, { participantDaily: 3, globalDaily: 100 });
    if (submission.status !== 201) throw new KitError(submission.code);
    state = submission.nextState;
    const judgment = judgeFixtureAnswer(answer, mission.expected);
    if (!judgment.accepted) throw new KitError('fixture-answer-rejected');
    const retry = decideSubmission(state, attempt, challenge, fixtureClock + 120_000);
    if (retry.code !== 'idempotent-retry' || retry.receipt.receipt_id !== submission.receipt.receipt_id) throw new KitError('retry-recovery-failed');
    allowedTasks.push({ site_id: challenge.site_id, task_id: challenge.task_id, task_version: challenge.task_version });
    fixtureEvents.push({ site_id: challenge.site_id, season_id: challenge.season_id, rubric_version: 'v1', participant_key_id: signer.participant_key_id, task_id: challenge.task_id, task_version: challenge.task_version, receipt_id: submission.receipt.receipt_id, accepted_at: mission.template.fixture_clock, data_mode: 'fixture', fixture: true, provenance: 'offline_fixture_adjudicated', participation: 'signed_opt_in', outcome: 'accepted', judgment_verified: true });
    missions.push({ mission_id: missionId, source_mode: 'embedded_fictional_fixture_only', fixture_clock: mission.template.fixture_clock, challenge, answer, attempt, verification: { signature_valid_for_fixture_key: proof.ok, result_digest_matches_answer: attempt.result_hash === sha256(canonicalJSON(answer)), provider_identity_verified: false }, fixture_judgment: judgment, protocol_submission: submission.receipt, replay_recovery: { code: retry.code, same_receipt_id: retry.receipt.receipt_id, retry_after_challenge_expiry: true } });
  }
  const liveScore = scoreTasks(fixtureEvents, { seasonId: 'builder-fixture-season', allowedTasks });
  if (liveScore.total !== 0) throw new KitError('fixture-score-isolation-failed');
  return {
    schema: 'signal-atlas.builder-demo-receipt/v1',
    warning: 'DEMO ONLY — fictional embedded sources, fixed fixture clock, no network, no enrollment, no live points.',
    data_mode: 'fixture', eligible_for_live_points: false, ranked: false,
    participant: { public_key: signer.public_key, participant_key_id: signer.participant_key_id, key_lifetime: 'this process only; private key never exported or written', affiliation_verified: false },
    network_calls: 0, account_enrollment: false, live_points: liveScore.total,
    missions,
  };
}
function parseArgs(argv) {
  const options = { missionIds: MISSION_IDS };
  let answerPath;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') return { help: true };
    if (argv[i] === '--mission') {
      const id = argv[++i];
      if (!MISSION_IDS.includes(id)) throw new KitError('unknown-mission');
      options.missionIds = [id];
    } else if (argv[i] === '--answer') {
      answerPath = argv[++i];
      if (!answerPath || answerPath.startsWith('--')) throw new KitError('answer-file-required');
    } else throw new KitError('unknown-command-option');
  }
  if (answerPath && options.missionIds.length !== 1) throw new KitError('answer-file-needs-one-mission');
  return { options, answerPath };
}
async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) { process.stdout.write('Offline fixture practice only. No install/network/enrollment.\nnode run.mjs [--mission source-check|schema-repair] [--answer path.json]\n'); return; }
    if (args.answerPath) args.options.answers = { [args.options.missionIds[0]]: await readBoundedJSON(args.answerPath) };
    process.stdout.write(JSON.stringify(await runFixtureExample(args.options), null, 2) + '\n');
  } catch (error) {
    process.stderr.write(JSON.stringify({ data_mode: 'fixture', eligible_for_live_points: false, error: error instanceof KitError ? error.code : 'local-file-or-runtime-error', submitted_to_network: false }) + '\n');
    process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
