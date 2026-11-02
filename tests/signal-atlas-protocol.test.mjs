import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { LEAGUE_ORIGINS, LEAGUE_SITE_IDS, toLeagueSiteId, assertCanonicalLeagueSite, editionForPath, scoreCanonicalTasks } from '../tools/signal-atlas-protocol/site-policy.mjs';
import { runFixtureExample } from '../tools/signal-atlas-protocol/builder-kit/run.mjs';
import { inspectDemoReceipt } from '../tools/signal-atlas-protocol/builder-kit/inspect.mjs';
import { loadMission, MISSION_IDS } from '../tools/signal-atlas-protocol/builder-kit/missions.mjs';
import { scoreTasks } from '../tools/signal-atlas-protocol/protocol/protocol.mjs';
import { SITES } from '../public/signal-atlas/model.mjs';
import { evaluatePractice } from '../public/signal-atlas/practice-model.mjs';

const root = new URL('../tools/signal-atlas-protocol/', import.meta.url);
for (const name of ['UPSTREAM.json', 'BUILDER-UPSTREAM.json']) {
  test(`${name} pins every unchanged imported file`, async () => {
    const manifest = JSON.parse(await readFile(new URL(name, root), 'utf8'));
    assert.equal(manifest.mode, 'offline-only');
    assert.equal(manifest.productionIntegrated, false);
    const paths = new Set();
    for (const entry of manifest.importedFiles) {
      assert.match(entry.path, /^(protocol|protocol-review|builder-kit)\/[a-zA-Z0-9._/-]+$/);
      assert.ok(!entry.path.split('/').includes('..'));
      assert.ok(!paths.has(entry.path));
      paths.add(entry.path);
      const bytes = await readFile(new URL(entry.path, root));
      assert.equal(bytes.length, entry.bytes, entry.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, entry.path);
    }
    assert.ok(paths.size > 0);
  });
}

test('the product has exactly three league origins matching the collection UI', () => {
  assert.equal(LEAGUE_SITE_IDS.length, 3);
  for (const site of SITES) assert.equal(LEAGUE_ORIGINS[toLeagueSiteId(site.id)], site.origin);
  assert.equal(toLeagueSiteId('ues'), 'pointcast');
  assert.equal(toLeagueSiteId('el-segundo-university'), 'el-segundo');
  assert.equal(toLeagueSiteId('industrynext'), 'industry-next');
});

test('ambiguous or unrecognized aliases cannot become signed league scopes', () => {
  for (const value of ['UES', 'PointCast', 'https://pointcast.xyz', '__proto__', '', null, {}]) {
    assert.throws(() => toLeagueSiteId(value), TypeError);
  }
  for (const value of ['ues', 'el-segundo-university', 'industrynext']) {
    assert.throws(() => assertCanonicalLeagueSite(value), TypeError);
  }
});

test('edition paths belong only to their canonical parent and exact path boundary', () => {
  assert.equal(editionForPath('pointcast', '/ues/learn'), 'ues');
  assert.equal(editionForPath('pointcast', '/ues'), 'ues');
  assert.equal(editionForPath('el-segundo', '/university/start'), 'el-segundo-university');
  for (const [site, path] of [['pointcast', '/ues-other'], ['el-segundo', '/university-extra'], ['pointcast', '/university/'], ['el-segundo', '/ues/']]) {
    assert.equal(editionForPath(site, path), null);
  }
  for (const path of ['//elsegundo.xyz/university', '/ues?site=other', '/ues#other', '/ues\\other', 'ues', '/ues\n', '/ues/../other', '/ues/%2e%2e/other', '/ues/%2fother', '/ues/%5cother']) {
    assert.throws(() => editionForPath('pointcast', path), TypeError);
  }
});

test('scoring policy rejects edition records without changing signed context', () => {
  const context = { seasonId: 'fixture-season', allowedTasks: [{ site_id: 'pointcast', task_id: 'source-check', task_version: 'v1' }] };
  const event = Object.freeze({ site_id: 'ues', data_mode: 'fixture' });
  assert.throws(() => scoreCanonicalTasks([event], context), TypeError);
  assert.equal(event.site_id, 'ues');
  assert.throws(() => scoreCanonicalTasks([], { ...context, allowedTasks: [{ ...context.allowedTasks[0], site_id: 'ues' }] }), TypeError);
  assert.equal(scoreCanonicalTasks([{ site_id: 'pointcast', data_mode: 'fixture' }], context).total, 0);
});

test('every shipped practice challenge is fixture-only and scoped to a parent site', async () => {
  for (const id of MISSION_IDS) {
    const mission = await loadMission(id);
    assert.equal(assertCanonicalLeagueSite(mission.template.challenge.site_id), 'pointcast');
    assert.equal(mission.template.challenge.data_mode, 'fixture');
    assert.equal(mission.terms.network_allowed, false);
    assert.equal(mission.terms.enrollment, false);
    assert.equal(mission.terms.live_points, false);
    assert.equal(mission.terms.persistent_private_keys, false);
  }
});

test('a saved complete response can be inspected and exact retries retain their receipt', async () => {
  const original = await runFixtureExample();
  const recovered = JSON.parse(JSON.stringify(original));
  const result = await inspectDemoReceipt(recovered);
  assert.equal(result.valid_fixture_example, true);
  assert.equal(result.historical_execution_or_network_claims_verified, false);
  assert.equal(result.eligible_for_live_points, false);
  for (const mission of recovered.missions) {
    assert.equal(mission.replay_recovery.same_receipt_id, mission.protocol_submission.receipt_id);
    assert.equal(mission.replay_recovery.retry_after_challenge_expiry, true);
    assert.equal(mission.protocol_submission.status, 'received_unreviewed');
    assert.equal(mission.protocol_submission.ranked, false);
  }
});

test('fresh practice runs use separate ephemeral keys and no enrollment', async () => {
  const a = await runFixtureExample({ missionIds: ['source-check'] });
  const b = await runFixtureExample({ missionIds: ['source-check'] });
  assert.notEqual(a.participant.public_key, b.participant.public_key);
  for (const receipt of [a, b]) {
    assert.equal(receipt.account_enrollment, false);
    assert.equal(receipt.network_calls, 0);
    assert.equal(receipt.live_points, 0);
    assert.equal(receipt.eligible_for_live_points, false);
  }
});

test('browser local practice never becomes a signed builder receipt or scored work', async () => {
  const { receipt } = evaluatePractice('{"recordId":"pkt_02","sourceId":"src_02"}');
  assert.equal(receipt.signed, false);
  assert.equal(receipt.submitted, false);
  assert.equal(receipt.eligibleForStandings, false);
  await assert.rejects(inspectDemoReceipt(receipt));
  assert.equal(scoreTasks([receipt], { seasonId: 'fixture-season', allowedTasks: [] }).total, 0);
});

test('inspector output does not authenticate stored network or provider assertions', async () => {
  const receipt = await runFixtureExample();
  receipt.network_calls = 123;
  receipt.participant.affiliation_verified = true;
  const inspection = await inspectDemoReceipt(receipt);
  assert.equal(inspection.provider_affiliation_verified, false);
  assert.equal(inspection.historical_execution_or_network_claims_verified, false);
  assert.equal(inspection.live_points, 0);
});
