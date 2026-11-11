/**
 * Radio Network MCP read tools and the status board (2026-10-22).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { RADIO_STATION_SLUGS, RADIO_TOOL_DEFINITIONS, dispatchRadioTool } from '../src/lib/radio-mcp.ts';
import { STATIONS, buildStationDetail } from '../src/data/radio-network.ts';
import { DECISION_BOARD, MILESTONES, STATUSES, buildStatusManifest, statusCounts } from '../src/data/radio-status.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('two read-only radio tools, described as a plan, wired into the server', () => {
  assert.deepEqual(RADIO_TOOL_DEFINITIONS.map((t) => t.name), ['radio_network', 'radio_station']);
  for (const t of RADIO_TOOL_DEFINITIONS) assert.match(t.description, /(nothing is|not) on air/i, t.name);
  assert.deepEqual(RADIO_TOOL_DEFINITIONS[1].inputSchema.properties.slug.enum, STATIONS.map((s) => s.slug));
  assert.equal(RADIO_STATION_SLUGS.length, 7);
  const mcp = read('functions/api/mcp.ts');
  for (const bit of ['...RADIO_TOOL_DEFINITIONS,', "case 'radio_network':", "case 'radio_station':", 'dispatchRadioTool(name, args)']) assert.ok(mcp.includes(bit), bit);
  assert.ok(!/RADIO_WRITE/.test(mcp), 'no radio write tools');
});

test('radio_network returns the plan summary with station URLs and open decisions', async () => {
  const out = await dispatchRadioTool('radio_network', {});
  assert.ok(!out.isError);
  assert.match(out.content[0].text, /nothing is on air/);
  const j = JSON.parse(out.content[1].text);
  assert.equal(j.stations.length, 7);
  assert.equal(j.stations[0].url, 'https://pointcast.xyz/radio-network/el-segundo');
  assert.equal(j.phases.length, 4);
  assert.ok(j.distributionPaths.length >= 4);
  assert.equal(j.openDecisions.length, 6);
  assert.equal(j.statusBoard.url, 'https://pointcast.xyz/radio-network/status');
});

test('radio_station matches /radio-network/{slug}.json and refuses unknown slugs', async () => {
  const out = await dispatchRadioTool('radio_station', { slug: 'torrance' });
  assert.deepEqual(JSON.parse(out.content[1].text), buildStationDetail('torrance'));
  assert.ok(buildStationDetail('torrance').seats.every((s) => s.status === 'open'));
  const bad = await dispatchRadioTool('radio_station', { slug: 'nowhere' });
  assert.equal(bad.isError, true);
});

test('status board: every status is known, deploy is blocked, decisions wait on Mike', () => {
  for (const m of MILESTONES) assert.ok(STATUSES.includes(m.status), m.id);
  assert.equal(new Set(MILESTONES.map((m) => m.id)).size, MILESTONES.length, 'ids unique');
  assert.equal(MILESTONES.find((m) => m.id === 'live-on-site').status, 'blocked');
  assert.equal(MILESTONES.filter((m) => m.track === 'Phase 0 pilot').length, 6);
  assert.ok(DECISION_BOARD.every((d) => d.owner === 'Mike Hoydich' && d.status === 'blocked'));
  const counts = statusCounts();
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), MILESTONES.length);
  const m = buildStatusManifest();
  assert.equal(m.asOf, '2026-10-22');
  assert.ok(m.blockers.length >= 2);
  assert.equal(m.milestones[0].status, 'blocked', 'blockers first');
});
