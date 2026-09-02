/**
 * The town inspector and /agents.json stop lying by construction.
 *
 * - /agents.json's MCP catalogue is imported from functions/api/mcp.ts,
 *   so the advertised tool list is the served tool list.
 * - /health and /health.json compute the report's age from the build date
 *   and label a walk older than 14 days stale.
 * - /residents computes its roster line from src/data/residents.ts.
 *
 * Source assertions always run. The dist/ assertions run when a build is
 * present (npm run build:bare) and are skipped, loudly, when it is not.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const has = (path) => existsSync(new URL(path, root));

/** Slice `source` from `open` to the first `] as const;` after it. */
function block(source, open) {
  const start = source.indexOf(open);
  assert.notEqual(start, -1, `missing "${open}"`);
  const end = source.indexOf('] as const;', start);
  assert.notEqual(end, -1, `unterminated "${open}"`);
  return source.slice(start, end);
}

/** Tool-level `name: '…'` lines — four-space indent, one per tool. */
const toolNames = (text) => [...text.matchAll(/^ {4}name: '([a-z0-9_]+)',$/gm)].map((m) => m[1]);

async function servedCatalogue() {
  const [mcp, bench, tug] = await Promise.all([
    read('functions/api/mcp.ts'),
    read('src/lib/bench-mcp.ts'),
    read('src/lib/tug-mcp.ts'),
  ]);
  const core = toolNames(block(mcp, 'const TOOL_DEFINITIONS = ['));
  const benchNames = toolNames(bench.slice(bench.indexOf('export const BENCH_TOOL_DEFINITIONS = ['), bench.indexOf('];')));
  const tugName = tug.match(/export const TUG_PULL_TOOL = \{\s*name: '([a-z_]+)'/)?.[1];
  assert.ok(tugName, 'tug-mcp.ts exports TUG_PULL_TOOL with a name');
  assert.ok(core.length >= 40, `TOOL_DEFINITIONS parsed (${core.length} names)`);
  assert.equal(benchNames.length, 2, 'bench registers two tools');
  const tools = [...core, tugName, ...benchNames];
  assert.equal(new Set(tools).size, tools.length, 'tool names are unique');
  const resources = [...block(mcp, 'const RESOURCES = [').matchAll(/^ {4}uri: '([a-z-]+:\/\/[a-z-]+)',$/gm)].map((m) => m[1]);
  assert.ok(resources.length >= 10, `RESOURCES parsed (${resources.length} uris)`);
  return { tools, resources };
}

test('functions/api/mcp.ts exports the catalogue it serves', async () => {
  const mcp = await read('functions/api/mcp.ts');
  assert.match(mcp, /export const MCP_TOOL_NAMES: string\[\] = TOOLS\.map\(\(tool\) => tool\.name\);/);
  assert.match(mcp, /export const MCP_RESOURCE_URIS: string\[\] = RESOURCES\.map\(\(resource\) => resource\.uri\);/);
  assert.match(mcp, /export const MCP_SERVER_INFO = \{\s*name: V2_SERVER_NAME,\s*version: V2_SERVER_VERSION,\s*protocolVersion: MCP_PROTOCOL_VERSION,/);
  assert.match(mcp, /return rpcResult\(id, \{ tools: TOOLS \}\);/);
  assert.match(mcp, /return rpcResult\(id, \{ resources: RESOURCES \}\);/);
  assert.match(mcp, /TUG_PULL_TOOL,\s*\.\.\.BENCH_TOOL_DEFINITIONS,/, 'tug and bench tools are folded into TOOLS');
});

test('/agents.json derives its MCP tools, resources, and server info from the server file', async () => {
  const agents = await read('src/pages/agents.json.ts');
  assert.match(agents, /import \{ MCP_RESOURCE_URIS, MCP_SERVER_INFO, MCP_TOOL_NAMES \} from '\.\.\/\.\.\/functions\/api\/mcp';/);
  assert.match(agents, /toolCount: MCP_TOOL_NAMES\.length,\s*tools: MCP_TOOL_NAMES,/);
  assert.match(agents, /resourceCount: MCP_RESOURCE_URIS\.length,\s*resources: MCP_RESOURCE_URIS,/);
  assert.match(agents, /protocolVersion: MCP_SERVER_INFO\.protocolVersion,/);
  assert.match(agents, /server: \{ name: MCP_SERVER_INFO\.name, version: MCP_SERVER_INFO\.version \},/);
  assert.doesNotMatch(agents, /'drum_list_rooms'/, 'no hand-typed tool list left in the manifest');
  assert.doesNotMatch(agents, /'drum:\/\/rooms'/, 'no hand-typed resource list left in the manifest');
});

test('built /agents.json advertises exactly the served MCP tool count', async (t) => {
  if (!has('dist/agents.json')) {
    t.skip('dist/agents.json missing — run `npm run build:bare` to check the built manifest');
    return;
  }
  const { tools, resources } = await servedCatalogue();
  const manifest = JSON.parse(await read('dist/agents.json'));
  const mcp = manifest.endpoints.mcp;
  assert.equal(mcp.toolCount, tools.length);
  assert.deepEqual(mcp.tools, tools);
  assert.equal(mcp.resourceCount, resources.length);
  assert.deepEqual(mcp.resources, resources);
  assert.equal(mcp.server.name, 'pointcast-v2');
  assert.match(mcp.server.version, /^\d+\.\d+\.\d+$/);
});

test('/health and /health.json compute staleness from the build date', async () => {
  const [lib, json, page] = await Promise.all([
    read('src/lib/town-inspector.ts'),
    read('src/pages/health.json.ts'),
    read('src/pages/health.astro'),
  ]);
  assert.match(lib, /export const INSPECTOR_STALE_AFTER_DAYS = 14;/);
  assert.match(lib, /stale: ageDays > staleAfterDays,/);
  assert.match(json, /import \{ inspectorFreshness \} from '\.\.\/lib\/town-inspector';/);
  assert.match(json, /inspectorFreshness\(report\.inspectedAt, new Date\(\)\)/);
  assert.match(json, /\.\.\.freshness,/);
  assert.doesNotMatch(json, /Inspections run at deploy time/, 'the old cadence claim is gone');
  assert.match(page, /import \{ inspectorFreshness \} from '\.\.\/lib\/town-inspector';/);
  assert.match(page, /freshness\.stale && \(/);
  assert.match(page, /npm run inspect:town -- --write/);
  assert.doesNotMatch(page, /An inspection is a deploy-time act/, 'the old cadence claim is gone');
});

test('built /health.json carries an honest age and stale flag', async (t) => {
  if (!has('dist/health.json')) {
    t.skip('dist/health.json missing — run `npm run build:bare` to check the built report');
    return;
  }
  const report = JSON.parse(await read('dist/health.json'));
  assert.equal(typeof report.inspectedAt, 'string');
  assert.equal(typeof report.builtAt, 'string');
  assert.equal(report.staleAfterDays, 14);
  assert.equal(typeof report.ageDays, 'number');
  assert.equal(typeof report.stale, 'boolean');
  const expectedAge = Math.max(
    0,
    Math.floor((Date.parse(report.builtAt) - Date.parse(report.inspectedAt)) / 86_400_000),
  );
  assert.equal(report.ageDays, expectedAge);
  assert.equal(report.stale, report.ageDays > report.staleAfterDays);
  assert.match(report.cadence, /not automatic at deploy/);

  const page = await read('dist/health/index.html');
  assert.match(page, new RegExp(`${report.ageDays} days? old`));
  if (report.stale) {
    assert.match(page, /STALE/);
    assert.match(page, new RegExp(`data-stale-after="${report.staleAfterDays}"`));
  } else {
    assert.doesNotMatch(page, /class="stale"/);
  }
});

test('/residents computes its roster line from src/data/residents.ts', async () => {
  const page = await read('src/pages/residents.astro');
  assert.doesNotMatch(page, /Four residents/);
  assert.doesNotMatch(page, /Three resident agents/);
  assert.match(page, /const description = `Who lives in the town\. \$\{rosterLine\}\. RFC 0003 lays out the path\.`;/);
  assert.match(page, /description=\{description\}/);
});

test('built /residents description matches the roster', async (t) => {
  if (!has('dist/residents/index.html')) {
    t.skip('dist/residents/index.html missing — run `npm run build:bare` to check the built page');
    return;
  }
  const data = await read('src/data/residents.ts');
  // Resident entries are flat objects, so each `{ … }` holds one name and one status.
  const entries = [...data.matchAll(/\{\s*slug: '[^']+',\s*name: '([^']+)',[^}]*?status: '(resident|director|open|dormant)'/g)]
    .map((m) => ({ name: m[1], status: m[2] }));
  assert.ok(entries.length >= 4, `parsed the roster (${entries.length} entries)`);
  const count = (status) => entries.filter((e) => e.status === status).length;
  const openNames = entries.filter((e) => e.status === 'open').map((e) => e.name);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const expected = [
    plural(count('resident'), 'resident agent', 'resident agents'),
    plural(count('director'), 'director', 'directors'),
    `${plural(count('open'), 'open room', 'open rooms')} (${openNames.join(', ')})`,
  ].join(', ');
  const html = await read('dist/residents/index.html');
  const meta = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  assert.equal(meta, `Who lives in the town. ${expected}. RFC 0003 lays out the path.`);
});

test('the deploy ritual is written down and the preview alias exists', async () => {
  const [pkg, readme, standards] = await Promise.all([
    read('package.json'),
    read('README.md'),
    read('docs/standards/2026-05-06-current-best-practices.md'),
  ]);
  assert.equal(JSON.parse(pkg).scripts['inspect:town:preview'], 'node scripts/town-inspector.mjs --base');
  assert.match(readme, /### After the deploy: walk the town/);
  assert.match(readme, /npm run inspect:town -- --write/);
  assert.match(readme, /npm run inspect:town:preview -- https:\/\//);
  assert.match(standards, /After the deploy is live, walk the town/);
});
